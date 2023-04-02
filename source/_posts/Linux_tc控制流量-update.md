---
title: 网络流量控制测试
category: Linux
date: 2023-04-14 17:41:03
tags:
---
# 内核参数的说明

对于TCP来说，会遇到如下的几个参数。

如果我们需要查看一下当前OS的这个参数， 命令如下：

```bash
]$ sysctl -a | egrep "rmem|wmem|tcp_mem|adv_win|moderate"
```

其中主要需要关注的是： 

```
net.ipv4.tcp_rmem = 4096	131072	6291456
net.ipv4.tcp_wmem = 4096	16384	4194304
```

这两个参数其实表示的是当前内核预留的 Socket Buffer， 单位是 Bytes， 也是具体指内存的大小。具体的说明我找到[Kernel文档的说明](https://www.kernel.org/doc/Documentation/networking/ip-sysctl.txt)如下：

> ```
> tcp_rmem - vector of 3 INTEGERs: min, default, max
> 	min: Minimal size of receive buffer used by TCP sockets.
> 	It is guaranteed to each TCP socket, even under moderate memory
> 	pressure.
> 	Default: 4K
> 
> 	default: initial size of receive buffer used by TCP sockets.
> 	This value overrides net.core.rmem_default used by other protocols.
> 	Default: 87380 bytes. This value results in window of 65535 with
> 	default setting of tcp_adv_win_scale and tcp_app_win:0 and a bit
> 	less for default tcp_app_win. See below about these variables.
> 
> 	max: maximal size of receive buffer allowed for automatically
> 	selected receiver buffers for TCP socket. This value does not override
> 	net.core.rmem_max.  Calling setsockopt() with SO_RCVBUF disables
> 	automatic tuning of that socket's receive buffer size, in which
> 	case this value is ignored.
> 	Default: between 87380B and 6MB, depending on RAM size.
> 	
> tcp_wmem - vector of 3 INTEGERs: min, default, max
> 	min: Amount of memory reserved for send buffers for TCP sockets.
> 	Each TCP socket has rights to use it due to fact of its birth.
> 	Default: 4K
> 
> 	default: initial size of send buffer used by TCP sockets.  This
> 	value overrides net.core.wmem_default used by other protocols.
> 	It is usually lower than net.core.wmem_default.
> 	Default: 16K
> 
> 	max: Maximal amount of memory allowed for automatically tuned
> 	send buffers for TCP sockets. This value does not override
> 	net.core.wmem_max.  Calling setsockopt() with SO_SNDBUF disables
> 	automatic tuning of that socket's send buffer size, in which case
> 	this value is ignored.
> 	Default: between 64K and 4MB, depending on RAM size.
> 
> ```

上面的这个文档中的说明，默认的三个值分别是： 最小， 默认， 最大。

对于TCP协议的接收与发送两方， 各自有自己的RecvBuffer 和 SendBuffer， 发送方会考虑链路上面可以承载的数据量（带宽）， 以及 对方可以承载的数据量（rmem）。

# 测试环境

两个EC2 c5.2xlarge， 其中一个部署Nginx， 并设置 file index on ,  发布一个 Fedora ISO， 大小大约 2G。另一个上面只是客户端， 使用的访问客户端是Curl。

# 测试准备

## 基准

两个机器的内核参数使用默认值， 先通过tc流量控制注入一些延迟， 查看并分析RTT对于传输速度的影响。

如果使用默认的参数， 那么2G的 ISO 文件可以快速的传完， 这是两个实例的基准表现， 这也是创建了一个TCP Connection 的较好的性能表现， EC2 之间的带宽较大 10Gbps。

```bash
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0*   Trying 172.31.48.133:80...
100 1967M  100 1967M    0     0  1116M      0  0:00:01  0:00:01 --:--:-- 1116M
* Connection #0 to host nginx.liarlee.site left intact
time_connect: 0.005461
time_starttransfer: 0.005797
time_total: 1.762040
```

总体看起来使用了 2s 不到的时间， 就传输完成了2G的文件。

两个server之间默认的内核参数：

- 服务端参数

  ```sh
  net.ipv4.tcp_rmem = 4096	131072	6291456
  net.ipv4.tcp_wmem = 4096	16384	4194304
  ```

- 客户端参数

  ```sh
  net.ipv4.tcp_wmem = 4096	131072	6291456
  net.ipv4.tcp_rmem = 4096	16384	4194304
  ```

给服务端添加一个 50ms 的 延迟， 使用 tc 工具， [参考文档](https://zhuanlan.zhihu.com/p/443427232)， 命令如下：

```bash
tc qdisc del dev eth0 root
tc qdisc add dev eth0 root handle 1:0 htb default 1
tc class add dev eth0 parent 1:0 classid 1:1 htb rate 1000mbit
tc qdisc add dev eth0 parent 1:1 handle 2:0 netem delay 50ms
```

测试的时候使用curl命令， 将结果直接输出到/dev/null, 这个场景下， 客户端收写数据的速度非常快，这样的测试排除了大文件落硬盘速度慢的问题， 但是也让客户端收到这批数据之后立刻可以发送ack给服务端（Client - ACK——> Server）， 告知服务端我这边的数据已经处理完了， 回收 RecvBuffer 空间.

命令如下： 

```bash
curl -o /dev/null -v http://nginx.liarlee.site/Fedora-Workstation-Live-x86_64-38_Beta-1.3.iso -t -s -w "time_connect: %{time_connect}\ntime_starttransfer: %{time_starttransfer}\ntime_total: %{time_total}\n"
```

## 仅控制带宽

在添加了带宽控制之后， 带宽控制在 1000Mbps， 带宽结果： 

![2023-04-12_17-03.png](/home/ec2-user/githubrepo/assets/ZVxCb43c2Wynaze.png)

Curl命令的结果： 

```bash
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 1967M  100 1967M    0     0   118M      0  0:00:16  0:00:16 --:--:--  118M
time_connect: 0.002070
time_starttransfer: 0.002304
time_total: 16.633562
```

## 控制带宽+延迟

在添加带宽控制和 50ms 延迟之后， 带宽使用：  
![2023-04-12_17-03_1.png](https://s2.loli.net/2023/04/14/wS7UK5IQWLMd2TG.png)

ping 命令 确认 rtt ： 

```bash
root@arch ~# ping nginx.liarlee.site
PING nginx.liarlee.site (172.31.48.133) 56(84) bytes of data.
64 bytes from ip-172-31-48-133.cn-north-1.compute.internal (172.31.48.133): icmp_seq=1 ttl=255 time=50.1 ms
64 bytes from ip-172-31-48-133.cn-north-1.compute.internal (172.31.48.133): icmp_seq=2 ttl=255 time=50.1 ms
64 bytes from ip-172-31-48-133.cn-north-1.compute.internal (172.31.48.133): icmp_seq=3 ttl=255 time=50.1 ms
^C
--- nginx.liarlee.site ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms
rtt min/avg/max/mdev = 50.110/50.117/50.132/0.010 ms
```

curl的结果变成这样： 

```bash
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 1967M  100 1967M    0     0  38.7M      0  0:00:50  0:00:50 --:--:-- 39.2M
time_connect: 0.053118
time_starttransfer: 0.103339
time_total: 50.756470
```

上面的这个测试结果中存在的问题是， 链路的带宽没有被充分利用， 所以发送数据的速度已经慢很多，并且时间也比较长。

## 调整参数以及相关理论

如果我的网络延迟小到可以忽略不计，那么这个时候发送方缓冲区里面的数据基本上就是实时抵达对方， 并且立刻可以接收到对方的ACK报文， 这样无论我的发送和接收的Buffer有多小或者多大都无所谓， 数据包都可以快速的发送出去， 然后被确认收到。

在添加了网络的延迟之后， 50ms， 那么这个时候链路上面可以承载的数据包计算方式如下：

> 1000Mbps/8 * 0.05s (rtt)= 6.25MB # BDP 带宽延时积
>
> 6.25MB * 1024 = 6400KB * 1024 = 6553600 Bytes
>
> 6553600 * 2 = 13107200 # 这个是linux kernel buffer size 

在这个测试的过程中发现， 数据发送方的通告的window size， 固定是 tcp_rmem 值的一半。 发现这个是 BDP 计算出来的结果是 6553600， 如果这个值直接配置到tcp_rmem中，抓包出来windowsize就正好是预期的一半， 这会导致限定的千兆带宽正好占用500Mbps。

### 测试1 增加客户端的 rmem

- 服务端参数

  ```sh
  net.ipv4.tcp_rmem = 4096	131072	6291456
  net.ipv4.tcp_wmem = 4096	16384	4194304
  ```

- 客户端参数

  ```sh
  net.ipv4.tcp_wmem = 4096	131072	6291456
  net.ipv4.tcp_rmem = 13107200 13107200 13107200
  ```

接下来就是调整这个的配置来观察带宽以及传输速度的差异。

带宽使用量： 
![2023-04-12_17-39.png](https://s2.loli.net/2023/04/14/m2xVd145LXgvhCs.png)

curl 的结果：

```sh
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 1967M  100 1967M    0     0  53.0M      0  0:00:37  0:00:37 --:--:-- 53.5M
time_connect: 0.053408
time_starttransfer: 0.103699
time_total: 37.118881
```

### 测试2 增加服务端的 wmem

- 服务端参数

  ```sh
  net.ipv4.tcp_wmem = 13107200 13107200 13107200
  net.ipv4.tcp_rmem = 4096	16384	4194304 
  ```

- 客户端参数

  ```sh
  net.ipv4.tcp_wmem = 4096	131072	6291456
  net.ipv4.tcp_rmem = 13107200 13107200 13107200
  ```

带宽的结果： 

![2023-04-12_17-47.png](https://s2.loli.net/2023/04/14/85zygfpMBRnha19.png)


curl 的结果： 

```sh
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 1967M  100 1967M    0     0   115M      0  0:00:17  0:00:17 --:--:--  118M
time_connect: 0.052605
time_starttransfer: 0.102836
time_total: 17.007612
```

从当前的结果来看， 现在已经可以用满全部的带宽了， 查看抓包的结果， 发送和接收数据非常连续。 中间的停顿时间也比较短。

如图：

![2023-04-12_22-47.png](https://s2.loli.net/2023/04/14/iey2OWk1FKHYSVg.png)

这个结果我还重新反复抓了几次，这个可以跑满带宽 并且可以顶住 50ms 延迟。

TCP慢启动时候的截图：

我将几个字段提取了出来，放在了截图的最前面， iRTT， WindowSize， Bytes in flight。 对于这个结果里面， 我的客户端窗口的变化非常小，传输的后半段 会一直维持在最大值， 但是Bytes in flight 一直都很小， 大概就是 30000 + 的样子。 

> 原因是由于curl在获取到数据包之后快速的ack了收到的包， 然后向服务端更新了接收窗口， 由于curl的动作太快了， 所以我的 Bytes in flight 非常小，窗口一直在被更新， 所以窗口的尺寸非常大， 而且稳定。NOTE： 这个逻辑的证据是：  测试4， 让curl没有时间收取数据包。
![2023-04-12_23-10.png](https://s2.loli.net/2023/04/14/8KWyBIgZTQC4GVN.png)

截取了其中的一部分稳定传输中的抓包结果， 如图：
![2023-04-12_23-17.png](https://s2.loli.net/2023/04/14/qRGDdPh3pubUiZz.png)

稳定传输中基本上是有空间， 收到之前的ack 就立刻发送新的到链路中（网络这边的gap比较大， 试着开始补

### 测试3 锁定 wmem 以及 rmem 4096

- 服务端参数  

  ```sh
  net.ipv4.tcp_wmem = 4096 4096 4096
  net.ipv4.tcp_rmem = 4096	16384	4194304 
  ```

- 客户端参数

  ```sh
  net.ipv4.tcp_wmem = 4096	131072	6291456
  net.ipv4.tcp_rmem = 4096 4096 4096
  ```

1. 同时设定两端参数，设置生效之后， 速度变得非常的慢， 数据包基本上发一两个就会触发 WindowFull 的提示。改客户端的rmem参数， 会导致 rmem 的容量不够大， 频繁的触发 WindowFull， 窗口很快就被填充满了， 所以curl的下载速度也非常慢。

   ![2023-04-13_00-20.png](https://s2.loli.net/2023/04/14/MHEsand1wvK7yIc.png)

2. 客户端参数不动， 只是改服务端的wmem参数限制到 4096， 传输速度快了一些，但是开始的时候数据包发送的速度比较快， send-q中的指标快速被降低下来，虽然速度变快了一些， 但是不多。*我想这个地方还能观察一下Nginx的行为， 应用程序应该也是变慢的。*
3. 服务端的参数不动， 只是改客户端的参数，这个时候nginx的sendbuffer里面堆积了许多数据，因为接收的窗口太小， 所以与上面的截图一样，到处都是 WindowFull。

### 测试4 与curl抢占CPU

运行命令： 启动一个JVM， 跑计算的线程， 这个程序是自己写的，CPU密集型， 运行起来之后就可以使用率100%。

```bash
]$ taskset -c 0 java CPUIntensiveThread &
# 调整这个程序的nice值为 -20， 我是直接用htop调整的。
]$ taskset -c 0 ./nginx-tc-traffic-test-curl.sh
]$ nice -n 19 curl -o /dev/null http://nginx.liarlee.site/Fedora-Workstation-Live-x86_64-38_Beta-1.3.iso -t -s -w "time_connect: %{time_connect}\ntime_starttransfer: %{time_starttransfer}\ntime_total: %{time_total}\n"
```

测试的结果如图,  Recv-Q里面一直有数据， 抓包的结果中显示当前的接收端的窗口是满的， 出现了 WindowUpdate 以及 ZeroWindow的提示。
![2023-04-14_17-09.png](https://s2.loli.net/2023/04/14/mYAb3qCwOvn1Q8Z.png)

基本上随着窗口的变化而变化， curl的下载速度并不快， 下载的速度也不太稳定。。
![2023-04-14_17-09_1.png](https://s2.loli.net/2023/04/14/KZmte1CzfvIsoLM.png)



