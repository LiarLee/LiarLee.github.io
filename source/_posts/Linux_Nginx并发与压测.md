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

### 测试1  单线程计算QPS

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



