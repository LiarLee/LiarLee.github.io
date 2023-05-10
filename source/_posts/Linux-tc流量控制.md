---
title: Linux 使用tc流量控制
category: Linux
date: 2023-04-02 17:41:03
tags:
---

## tc 的简单介绍
linux 默认提供的tc流量控制功能， 可以通过网络子系统对于os的网络流量进行精确的限制， 基于这个功能可以扩展网络的能力， 并制造一些事故现场（bushi。

[Linux Kernel Document For Network Classifier Cgroup](https://www.kernel.org/doc/html/v5.3/admin-guide/cgroup-v1/net_cls.html)

如果需要更多的细节的话， 可以直接 man tc 获取。

## tc 的控制逻辑
Linux操作系统中的流量控制器TC（Traffic Control）用于Linux内核的流量控制，主要是通过在输出端口处建立一个队列来实现流量控制。  
也就是说， 这个工具或者功能控制的是发送队列， 在发送的时候做手脚。  
大部分文档写的都是直接调整设备的队列， 或者是 创建一个新的队列， 使用Filter 做匹配， 匹配到特定的流量注入故障。

## tc 的使用方式
### 1 简单命令
1. 使用下面的命令查看当前某个网卡的qdisc， 我的这个结果里面，展示的是EC2 使用 ENA 驱动的虚拟网卡，可能和硬件上面看到的不完全一样。  
   ```bash
   ~ ❯❯❯ tc qdisc show dev ens5
   qdisc mq 0: root
   qdisc fq_codel 0: parent :4 limit 10240p flows 1024 quantum 1514 target 5ms interval 100ms memory_limit 32Mb ecn drop_batch 64
   qdisc fq_codel 0: parent :3 limit 10240p flows 1024 quantum 1514 target 5ms interval 100ms memory_limit 32Mb ecn drop_batch 64
   qdisc fq_codel 0: parent :2 limit 10240p flows 1024 quantum 1514 target 5ms interval 100ms memory_limit 32Mb ecn drop_batch 64
   qdisc fq_codel 0: parent :1 limit 10240p flows 1024 quantum 1514 target 5ms interval 100ms memory_limit 32Mb ecn drop_batch 64
   ```
2. 使用命令获取当前的qdisc计数器， 获取是否有因为队列而导致的丢包。
   ```bash
    ~ ❯❯❯ tc -s qdisc show dev ens5
   qdisc mq 0: root
    Sent 248630667 bytes 267510 pkt (dropped 0, overlimits 0 requeues 16)
    backlog 0b 0p requeues 16
   qdisc fq_codel 0: parent :4 limit 10240p flows 1024 quantum 1514 target 5ms interval 100ms memory_limit 32Mb ecn drop_batch 64
    Sent 153490507 bytes 136790 pkt (dropped 0, overlimits 0 requeues 3)
    backlog 0b 0p requeues 3
     maxpacket 0 drop_overlimit 0 new_flow_count 0 ecn_mark 0
     new_flows_len 0 old_flows_len 0
   qdisc fq_codel 0: parent :3 limit 10240p flows 1024 quantum 1514 target 5ms interval 100ms memory_limit 32Mb ecn    drop_batch 64
    Sent 90944606 bytes 79723 pkt (dropped 0, overlimits 0 requeues 7)
    backlog 0b 0p requeues 7
     maxpacket 85 drop_overlimit 0 new_flow_count 25 ecn_mark 0
     new_flows_len 0 old_flows_len 0
   qdisc fq_codel 0: parent :2 limit 10240p flows 1024 quantum 1514 target 5ms interval 100ms memory_limit 32Mb ecn drop_batch 64
    Sent 638273 bytes 5131 pkt (dropped 0, overlimits 0 requeues 0)
    backlog 0b 0p requeues 0
     maxpacket 66 drop_overlimit 0 new_flow_count 11 ecn_mark 0
     new_flows_len 0 old_flows_len 0
   qdisc fq_codel 0: parent :1 limit 10240p flows 1024 quantum 1514 target 5ms interval 100ms memory_limit 32Mb ecn    drop_batch 64
    Sent 3557281 bytes 45866 pkt (dropped 0, overlimits 0 requeues 6)
    backlog 0b 0p requeues 6
     maxpacket 86 drop_overlimit 0 new_flow_count 187 ecn_mark 0
     new_flows_len 0 old_flows_len 0
   ```
### 2 更改 qdics
一般来说， 网络上面比较常见的资料， 改这个选项的同时是搭配 拥塞算法 的参数一起更改的， 我之前也改， 但是我并不知道具体改了的效果是什么， 或者如何定量的分析变更参数的影响， 这个应该会在后续的时候测试一下， 具体参数都影响了哪些。

使用下面的命令更改默认的qdisc：
```bash
sysctl -w net.core.default_qdisc=pfifo_fast
```
查看当前已经生效的 qdisc：
```bash
qdisc fq_codel 0: parent :1 limit 10240p flows 1024 quantum 1514 target 5ms interval 100ms memory_limit 32Mb ecn drop_batch 64
 Sent 3557281 bytes 45866 pkt (dropped 0, overlimits 0 requeues 6)
 backlog 0b 0p requeues 6
  maxpacket 86 drop_overlimit 0 new_flow_count 187 ecn_mark 0
  new_flows_len 0 old_flows_len 0
```
或者使用 ifconfig 等等命令， 基本上都能看到。
```bash
~ ❯❯❯ ip ad
2: ens5: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9001 qdisc mq state UP group default qlen 1000
    link/ether 02:b0:13:23:e7:16 brd ff:ff:ff:ff:ff:ff
    inet 172.31.41.39/20 metric 100 brd 172.31.47.255 scope global dynamic ens5
       valid_lft 1873sec preferred_lft 1873sec
    inet6 fe80::b0:13ff:fe23:e716/64 scope link
       valid_lft forever preferred_lft forever
```
我自己的机器上面，尤其是作为代理的机器上面， 应该都是 BBR 拥塞算法 加上 qdisc 设置为 cake, 这个组合就是为了长宽网络模型设计的方案， 一直好奇其中的原因， 找机会测试一下。
### 3 注入延迟故障
使用下面的命令可以为主机的root设备注入一个 200ms 的延迟， 这个操作会导致延迟变高， 也就是网络的RT增加， 理论上不应该这么设置， 这会导致所有的数据都被添加一个 200ms 的延迟， 可能有潜在的问题。 最好限制一下端口什么的。

下面的简单设置供测试使用。
```bash
tc qdisc add dev eth0 root netem delay 200ms
```
使用另一个主机发送 ping 探测， 返回结果如下：
```bash
~ ❯❯❯ ping nginx.liarlee.site
PING nginx.liarlee.site (172.31.48.133) 56(84) bytes of data.
64 bytes from ip-172-31-48-133.cn-north-1.compute.internal (172.31.48.133): icmp_seq=1 ttl=255 time=200 ms
64 bytes from ip-172-31-48-133.cn-north-1.compute.internal (172.31.48.133): icmp_seq=2 ttl=255 time=200 ms
64 bytes from ip-172-31-48-133.cn-north-1.compute.internal (172.31.48.133): icmp_seq=3 ttl=255 time=200 ms
64 bytes from ip-172-31-48-133.cn-north-1.compute.internal (172.31.48.133): icmp_seq=4 ttl=255 time=200 ms
64 bytes from ip-172-31-48-133.cn-north-1.compute.internal (172.31.48.133): icmp_seq=5 ttl=255 time=200 ms
^C
--- nginx.liarlee.site ping statistics ---
5 packets transmitted, 5 received, 0% packet loss, time 4005ms
rtt min/avg/max/mdev = 200.101/200.110/200.123/0.007 ms
```
非常明显可以看到， 当前的ping包 延迟 200ms起步， 设置生效了。
清理： 
```bash
tc qdisc del dev eth0 root
```

---
暂时先写这些吧， 限制带宽以及指定端口的方法，后面研究一下具体的逻辑之后继续写。



