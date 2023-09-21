---
title: Nginx Performance Test
date: 2022-04-19 17:45:39
category: Linux
tags: Nginx, Application
---

写在最前面， 这个问题还在研究中， 我目前还没有合适的模型用来研究这个问题， Pending....
## Nginx 性能测试与压力计算

使用al2023  + 默认的yum仓库软件版本， 具体信息记录如下： 

按照下面的配置， 在Nginx上面发布一个目录， 其中放了一个Fedora镜像， 大小大约2.3GB， 固定Nginx处理请求的大小， 控制大部分的因素来尝试获取精确的结果。

1. OS Version

   ```bash
   [root@ip-172-31-53-146 ~]# cat /etc/os-release
   NAME="Amazon Linux"
   VERSION="2023"
   ID="amzn"
   ID_LIKE="fedora"
   VERSION_ID="2023"
   PLATFORM_ID="platform:al2023"
   PRETTY_NAME="Amazon Linux 2023"
   ANSI_COLOR="0;33"
   CPE_NAME="cpe:2.3:o:amazon:amazon_linux:2023"
   HOME_URL="https://aws.amazon.com/linux/"
   BUG_REPORT_URL="https://github.com/amazonlinux/amazon-linux-2023"
   SUPPORT_END="2028-03-01"
   ```

2. 在一个机器上面部署MySQL 然后初始化配置一个密码和用户。

   ```bash
   [root@ip-172-31-53-200 ~]# mysql --version
   mysql  Ver 8.0.32 for Linux on x86_64 (MySQL Community Server - GPL)
   ```

3. 直接使用bitnami的wordpress， 仅部署wordpress在另一个机器上面，然后配置连接到上面的那台数据库。 

4. 额外配置一下Docker-compose 的CPU affinity， 绑到cpu0上面， 让这个Container只能用cpu0, 模拟只有一个核心， 后面应该还会给他放开。

   ```yaml
   ---
   version: '2'
   services:
     wordpress:
       cpuset: "0"
       network_mode: host

5. 尝试给点压力， 做个基准测试。

### 测试1 单线程计算QPS

> 公式：  1000ms/RT = QPS 
>
> 这个是单线程的QPS 与 RT 的关系， 试图走一把流程验证这个。 

运行命令 wrk 配置 1connection 1thread 进行测试， 测试时间5分钟。

获取 RT，HTTP请求从发出到响应的时间 ： 

![2023-04-27_10-38.png](https://s2.loli.net/2023/04/27/pf2Z5erTzcayPFJ.png)

基于当前获取到的RT就可以计算出单线程的QPS ： 

```bash
RT：45ms # 这个时候获取的RT是客户端从发出数据包 到 收到完整的请求的页面返回的时间， 基于上面的抓包结果计算。
1000ms/45ms = 22 QPS
```

实际命令返回的结果： 

```bash
~ ❯❯❯ wrk -t1 -c1 -d5m --latency http://nginx.liarlee.site:8080
Running 5m test @ http://nginx.liarlee.site:8080
  1 threads and 1 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    45.00ms    3.60ms 169.02ms   88.75%
    Req/Sec    22.24      4.27    30.00     76.72%
  Latency Distribution
     50%   44.28ms
     75%   46.23ms
     90%   48.51ms
     99%   54.40ms
  6668 requests in 5.00m, 337.69MB read
Requests/sec:     22.23 # 确实是 22左右， 基本上和计算得出的结果一致。
Transfer/sec:      1.13MB
```

### 测试2 计算服务当前的最佳线程数量

默认的情况下， 当一个进程处理的时候， 线程接收到请求， OnCPU处理这个请求， 发出数据库查询，切换到Sleep状态，数据库处理完成，线程回到CPU继续运算，发送结果给客户端，这样完成一个Request。

计算服务的最佳线程数量其实是 需要多少个线程占用CPU，最终可以填满 CPU 1s 的时间， 让CPU尽可能都用来处理业务请求。

所以最大的线程数量是变化的， 与CPU time 相关 或者说 与RT相关， 对于一些特定的请求，控制了大部分变量的场景下， 可以计算一个最佳的线程数量。 计算公式： 

> 最佳线程数： CPU TIme + Wait Time / CPU Time = 2 + 42 / 2 = 22  

## 打开文件数限制可能的并发数量
测试 conntrack 的问题， 发现连接数不太高， 试图通过wrk 提高并发的连接数量。 
使用命令： 
```bash
wrk -t2 -c30000 -d30s http://reg.liarlee.site:80
```
如果我的理解没有问题， 那么我应该可以创建30000个连接 在 客户端 和 服务端 之间。 
但是结果： 
```bash
# 客户端尝试建立 8000c
ec2-user@arch ~> wrk -t1 -c8000 -d30s http://reg.liarlee.site:80
Running 30s test @ http://reg.liarlee.site:80
  1 threads and 8000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    49.94ms   42.36ms 428.68ms   92.65%
    Req/Sec    21.15k     8.19k   41.30k    66.08%
  608596 requests in 30.04s, 218.23MB read
  Socket errors: connect 6980, read 0, write 0, timeout 0
Requests/sec:  20260.60
Transfer/sec:      7.27MB

# 服务端看到的是： 
[root@reg tools]# ss -s
Total: 282
TCP:   1103 (estab 28, closed 1063, orphaned 0, timewait 2)

Transport Total     IP        IPv6
RAW	  0         0         0
UDP	  8         4         4
TCP	  40        36        4
INET	  48        40        8
FRAG	  0         0         0
```
这和预期的差距挺大的， 1103 让我非常容易的想到了 1024 的文件描述符限制。 于是 
```bash
ec2-user@arch ~> ulimit -n
1024
```
客户端  wrk 的文件描述符可用调大到 100000 。
```bash
# 客户端
ec2-user@arch ~ [127]> ulimit -n
100000
ec2-user@arch ~> wrk -t2 -c30000 -d30s http://reg.liarlee.site:80
Running 30s test @ http://reg.liarlee.site:80
  2 threads and 30000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   515.29ms  411.20ms   2.00s    78.35%
    Req/Sec     1.76k     2.70k   11.96k    85.71%
  39021 requests in 30.28s, 13.99MB read
  Socket errors: connect 0, read 298852, write 16, timeout 3115
Requests/sec:   1288.65
Transfer/sec:    473.17KB

# 服务端
[root@reg tools]# ss -s
Total: 282
TCP:   7544 (estab 28, closed 7504, orphaned 1641, timewait 2)

Transport Total     IP        IPv6
RAW	  0         0         0
UDP	  8         4         4
TCP	  40        36        4
INET	  48        40        8
FRAG	  0         0         0
```
如果从上面的角度来看， 那么客户端的打开文件数是限制， 现在打开文件数调大了， 服务端还是无法建立更多的连接， 这个还得继续看看 ， 我感觉是cpu的问题， 毕竟我访问的页面的是有内容的， 不是一个空请求。
```bash
# 尝试看了以下服务端的ss 命令
ec2-user@arch ~> ss -s
Total: 31669
TCP:   31268 (estab 7959, closed 1182, orphaned 1250, timewait 1)

Transport Total     IP        IPv6
RAW	  1         0         1
UDP	  4         2         2
TCP	  30086     30080     6
INET	  30091     30082     9
FRAG	  0         0         0
```
确实发起了30000 但是 进入estab状态的连接只有 8000 左右。这基本上可以确定是服务端的限制了，具体是什么地方限制了待查。 
客户端 ： c5 实例类型上面的 wrk 
服务端 ： t3.micro  - docker compose 部署的 harbor

## 连接异常导致的orphans
一个遗憾的事情， 最近遇到了一个可能是 cilium 的一个问题， 在小规模集群的场景下， Cilium 会错误的处理FIN ， FIN ACK， 导致安全组的 Connection Track 数量被打满。 之前没有注意过这个行为，在Docker的环境中测试下， 尝试使用 iptables 屏蔽容器发送出来的FIN， 记录步骤和命令： 
```
dnf install -y docker
systemctl enable --now docker
docker pull reg.liarlee.site/docker.io/library/nginx/nginx:latest
docker run -dt --rm --name nginx -p 81:80 reg.liarlee.site/docker.io/library/nginx:latest 
docker ps 看到容器已经启动就可以了
```
查看容器的IP地址： 
```
[root@ip-172-31-54-32 ~]# docker inspect nginx | grep -i ipaddress
            "SecondaryIPAddresses": null,
            "IPAddress": "172.17.0.2",
                    "IPAddress": "172.17.0.2",
```
添加一个规则在 DOCKER-ISOLATION-STAGE-1 链上。
```
[root@ip-172-31-54-32 ~]# iptables -I DOCKER-ISOLATION-STAGE-1 1 -p tcp -s 172.17.0.2 --tcp-flags FIN FIN -j DROP
[root@ip-172-31-54-32 ~]# iptables -I OUTPUT 1 -p tcp -s 172.31.47.174 -tcp-flags FIN FIN -j DROP
```
查看iptables 链表规则， DOCKER-ISOLATION-STAGE-1。
```
[root@ip-172-31-54-32 ~]# iptables -nvL --line-numbers
Chain INPUT (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination

Chain FORWARD (policy DROP 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination
1      47M   13G DOCKER-USER  all  --  *      *       0.0.0.0/0            0.0.0.0/0
2      47M   13G DOCKER-ISOLATION-STAGE-1  all  --  *      *       0.0.0.0/0            0.0.0.0/0
3      24M 1713M ACCEPT     all  --  *      docker0  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
4    12371  742K DOCKER     all  --  *      docker0  0.0.0.0/0            0.0.0.0/0
5      24M   11G ACCEPT     all  --  docker0 !docker0  0.0.0.0/0            0.0.0.0/0
6        0     0 ACCEPT     all  --  docker0 docker0  0.0.0.0/0            0.0.0.0/0

Chain OUTPUT (policy ACCEPT 0 packets, 0 bytes)
num   pkts bytes target     prot opt in     out     source               destination

Chain DOCKER (1 references)
num   pkts bytes target     prot opt in     out     source               destination
1    11933  716K ACCEPT     tcp  --  !docker0 docker0  0.0.0.0/0            172.17.0.2           tcp dpt:80

Chain DOCKER-ISOLATION-STAGE-1 (1 references)
num   pkts bytes target     prot opt in     out     source               destination
1      24M   11G DOCKER-ISOLATION-STAGE-2  all  --  docker0 !docker0  0.0.0.0/0            0.0.0.0/0
2    30690 1596K DROP       tcp  --  *      *       172.17.0.2           0.0.0.0/0            tcp flags:0x01/0x01 # 在这里
3      47M   13G RETURN     all  --  *      *       0.0.0.0/0            0.0.0.0/0

Chain DOCKER-ISOLATION-STAGE-2 (1 references)
num   pkts bytes target     prot opt in     out     source               destination
1        0     0 DROP       all  --  *      docker0  0.0.0.0/0            0.0.0.0/0
2      24M   11G RETURN     all  --  *      *       0.0.0.0/0            0.0.0.0/0

Chain DOCKER-USER (1 references)
num   pkts bytes target     prot opt in     out     source               destination
1      47M   13G RETURN     all  --  *      *       0.0.0.0/0            0.0.0.0/0
```
使用 wrk 在客户端发起测试： 
```
ec2-user@arch ~> wrk -t1 -c1000 -d3000s http://172.31.54.32:81
Running 50m test @ http://172.31.54.32:81
  1 threads and 1000 connections
```
在系统内部可以看到有一部分 orphans 连接： 
```
[root@ip-172-31-54-32 ~]# ss -s
Total: 233
TCP:   2019 (estab 5, closed 2009, orphaned 1006, timewait 1)

Transport Total     IP        IPv6
RAW	  1         0         1
UDP	  4         2         2
TCP	  10        8         2
INET	  15        10        5
FRAG	  0         0         0
```
记录下GPT告诉我的答案： 
> TCP orphans 是指没有与任何文件描述符关联的 socket，也就是说应用程序已经关闭了这个 socket，但是内核还没有释放它的资源，因为 TCP 还没有完成它的状态转换。
    TCP orphans 通常出现在以下几种 TCP 状态：FIN-WAIT-1, FIN-WAIT-2, LAST-ACK, CLOSING 和 TIME-WAIT。这些状态都是在 TCP 四次挥手的过程中产生的，表示连接正在关闭或已经关闭，但是还需要等待一段时间才能完全释放。
    TCP orphans 的产生可能有以下几种原因：
    应用程序关闭了 socket，但是对方没有及时回复 ACK 或 FIN 报文，导致连接一直处于 FIN-WAIT-1 或 FIN-WAIT-2 状态。
    应用程序关闭了 socket，但是对方回复了 FIN 报文，导致连接进入 CLOSING 状态，然后双方都没有及时回复 ACK 报文，导致连接一直处于 CLOSING 状态。
    应用程序关闭了 socket，但是对方回复了 ACK 报文，导致连接进入 LAST-ACK 状态，然后对方没有及时回复 FIN 报文，导致连接一直处于 LAST-ACK 状态。
    应用程序关闭了 socket，但是对方回复了 FIN 和 ACK 报文，导致连接进入 TIME-WAIT 状态，然后需要等待 2MSL 的时间才能释放连接。
    应用程序关闭了 socket，但是由于网络延迟或丢包等原因，导致上述状态转换过程中的报文丢失或重传，延长了连接的关闭时间。

https://github.com/moooofly/MarkSomethingDownLLS/blob/master/%E5%A6%82%E4%BD%95%E5%85%B3%E9%97%AD%20iptables%20%E4%B8%AD%20connection%20tracking%20(conntrack).md

新的测试步骤： 

```
# 清理IPtables规则
iptables -Z && iptables -X && iptables -F
iptables -t raw -Z && iptables -t raw -F && iptables -t raw -X

# 创建新的IPtables规则， 屏蔽 FIN ， RST

# Server block self FIN RST 
# Role Nginx Server  172.31.54.32
iptables -I OUTPUT 1 -p tcp -s 171.31.54.32 --tcp-flags FIN FIN -j DROP
iptables -I OUTPUT 1 -p tcp -s 172.31.54.32 --tcp-flags RST RST -j DROP

# Client block self FIN RST 
# Role Client  172.31.36.129
iptables -I OUTPUT 1 -p tcp -s 172.31.36.129 --tcp-flags FIN FIN -j DROP
iptables -I OUTPUT 1 -p tcp -s 172.31.36.129 --tcp-flags RST RST -j DROP
```
按照这个设置， 使用tcpdump抓报包， 双方是没有 FIN 和 RST 的， 说明iptables规则层面是生效。 
查看 ss -s 的数据， 客户端的连接数是在 10000 左右的， 服务端也是； 
使用命令中断客户端的wrk程序之后，客户端的连接数会直接被释放； 
服务端会维持， 维持一段时间之后， 下降到 5000 ， 然后完全消失。 

造成这个现象的原因是： Nginx配置文件中的参数。
```
vim /etc/nginx/nginx.conf
worker_rlimit_nofile 1024000;

http{
    sendfile            on;
    tcp_nopush          on;
    types_hash_max_size 4096;
    keepalive_timeout 3000s; # 服务端维持连接的最大时间， 超过这个时间之后的连接会被nginx释放。 
    keepalive_requests 1000000; # 在一个长连接上可以服务的最大请求数目。
}
```
Refer Link： https://www.cnblogs.com/kevingrace/p/9364404.html

