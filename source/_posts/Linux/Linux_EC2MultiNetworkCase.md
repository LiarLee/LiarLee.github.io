---
title: EC2 路由表以及多网卡相关问题
date: 2023-07-25 22:00:04
category: Linux
tags:
  - Linux
  - Network
  - EC2
---

在EC2实例中， 可以使用多个不同的网卡， 但是虚拟网卡其实是共享实例整体带宽的。 假如EC2实例本身有10Gbps的带宽， 那么无论多少个网卡都应该只能有10Gbps的带宽， 其实添加了多个也不会扩展网络上限。 

但是某些大规格的实例会有这种情况， 需要添加多个网卡，并且底层其实提供了多个NetworkCard。 这种情况少见， 但是确实有。 

如果是物理的机器， 那么最好的办法就是链路聚合， 将多个网卡合并使用来扩充这个物理服务器的网络能力。 

这样的实例添加网卡之后其实会有一定的难度，描述一下这个场景

## 环境

一台ec2 ， 三张网卡， OS是 Ubuntu 18.04 ， 三张网卡分别是 ens5 ens6 ens7 , 实例中命令展示网卡如下 ： 

```
root@ip-172-31-43-121:~# ip ad
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: ens5: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9001 qdisc mq state UP group default qlen 1000
    link/ether 02:4d:73:35:16:8a brd ff:ff:ff:ff:ff:ff
    inet 172.31.43.121/20 brd 172.31.47.255 scope global dynamic ens5
       valid_lft 1957sec preferred_lft 1957sec
3: ens6: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9001 qdisc mq state UP group default qlen 1000
    link/ether 02:5d:02:b4:37:fa brd ff:ff:ff:ff:ff:ff
    inet 172.31.37.95/20 brd 172.31.47.255 scope global dynamic ens6
       valid_lft 1955sec preferred_lft 1955sec
4: ens7: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9001 qdisc mq state UP group default qlen 1000
    link/ether 02:cf:10:d8:12:80 brd ff:ff:ff:ff:ff:ff
    inet 172.31.40.130/20 brd 172.31.47.255 scope global dynamic ens7
       valid_lft 1956sec preferred_lft 1956sec
```

三张网卡中， ens5上面有一个公网ip地址的绑定， elastic ip , 操作系统看不到， 但是ens5 能找到公网IP地址， 其他网卡都不能。

## 多网卡路由策略配置

多网卡的情况下，**手动配置了所有网卡的路由策略之后**，公网访问没了， 看看 ip route show： 

### 看路由表

```
root@ip-172-31-43-121:~# ip r s
default via 172.31.32.1 dev ens7 proto dhcp src 172.31.40.130 metric 100
default via 172.31.32.1 dev ens6 proto dhcp src 172.31.37.95 metric 100
default via 172.31.32.1 dev ens5 proto dhcp src 172.31.43.121 metric 100
172.31.32.0/20 dev ens7 proto kernel scope link src 172.31.40.130
172.31.32.0/20 dev ens6 proto kernel scope link src 172.31.37.95
172.31.32.0/20 dev ens5 proto kernel scope link src 172.31.43.121
172.31.32.1 dev ens7 proto dhcp scope link src 172.31.40.130 metric 100
172.31.32.1 dev ens6 proto dhcp scope link src 172.31.37.95 metric 100
172.31.32.1 dev ens5 proto dhcp scope link src 172.31.43.121 metric 100

ip route show 命令显示的是系统路由表，也就是记录了目的网络和下一跳地址的信息的路由表。它的每个字段的含义是：

default 表示这个路由项是一个默认路由，也就是当没有匹配目的地址的路由项时，就使用这个路由项来发送数据包。
via 表示这个路由项的下一跳地址，也就是数据包要经过的网关地址。
dev 表示这个路由项对应的网卡设备名称，例如 lo, eth0, ens5 等。
proto 表示这个路由项的协议来源，例如 kernel, static, dhcp 等。
src 表示这个路由项的源地址，也就是本机发送数据包时使用的IP地址。
metric 表示这个路由项的度量值，也就是到达目的网络所需的跳数或开销。
```

这里面显示 我有三个默认路由， 他们的权重是一样的， 那么按照通常的逻辑， 哪个条目在靠前就会把数据包交给谁， 这时候问题出现了。 

> 如果我的主网卡上面有公网IP地址， 这时候我去访问公网例如baidu， 会发现这个数据是出不去的， 因为默认匹配了第一个条目之后， 从 ens7 这个没有公网ip地址绑定的网卡走了。

### 看抓包

测试一下， 直接开一个Ping命令在后台， ```ping www.baidu.com ``` ， 另一个窗口开 ```tcpdump -i any icmp```看结果。

```
root@ip-172-31-43-121:~# tcpdump -i any icmp -nn
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on any, link-type LINUX_SLL (Linux cooked), capture size 262144 bytes
14:49:31.480896 IP 172.31.40.130 > 39.156.66.14: ICMP echo request, id 15074, seq 12, length 64
14:49:32.504867 IP 172.31.40.130 > 39.156.66.14: ICMP echo request, id 15074, seq 13, length 64
14:49:33.528873 IP 172.31.40.130 > 39.156.66.14: ICMP echo request, id 15074, seq 14, length 64
14:49:34.552872 IP 172.31.40.130 > 39.156.66.14: ICMP echo request, id 15074, seq 15, length 64
14:49:35.576877 IP 172.31.40.130 > 39.156.66.14: ICMP echo request, id 15074, seq 16, length 64
14:49:36.600873 IP 172.31.40.130 > 39.156.66.14: ICMP echo request, id 15074, seq 17, length 64
14:49:37.624863 IP 172.31.40.130 > 39.156.66.14: ICMP echo request, id 15074, seq 18, length 64
14:49:38.648871 IP 172.31.40.130 > 39.156.66.14: ICMP echo request, id 15074, seq 19, length 64
14:49:39.672865 IP 172.31.40.130 > 39.156.66.14: ICMP echo request, id 15074, seq 20, length 64
14:49:40.696876 IP 172.31.40.130 > 39.156.66.14: ICMP echo request, id 15074, seq 21, length 64
14:49:41.720872 IP 172.31.40.130 > 39.156.66.14: ICMP echo request, id 15074, seq 22, length 64
14:49:42.744873 IP 172.31.40.130 > 39.156.66.14: ICMP echo request, id 15074, seq 23, length 64
14:49:43.768868 IP 172.31.40.130 > 39.156.66.14: ICMP echo request, id 15074, seq 24, length 64

```

能直接看到这个数据包是从 ens7 的网卡出去的， 确实匹配到了默认的路由条目， 第一条直接发走， 这本来是正确的逻辑， 但是一旦我需要访问公网且该实例的ens5才是公网ip的指定网卡， 那么这个数据包就只有出去， 没有回来的了。

这确实避免了VPC内部访问的网络限制问题， 但是公网的访问也没有了。 这是一个路由条目的优先级问题， 基于这个问题应该如何修复呢？ 

### 调整路由条目的优先级

调整默认路由的优先级， 让数据匹配默认路由的时候优先匹配ens5的条目。 

```bash
  150  ip route del default via 172.31.32.1 dev ens5 proto dhcp src 172.31.43.121 metric 100
  151  ip route add default via 172.31.32.1 dev ens5 proto dhcp src 172.31.43.121 metric 10
```

上面的命令可以将ens5 的默认路由metric 设置成 10 ，整体的路由表会变成这样： 

```
root@ip-172-31-43-121:/etc/netplan# ip r s
default via 172.31.32.1 dev ens5 proto dhcp src 172.31.43.121 metric 10
default via 172.31.32.1 dev ens7 proto dhcp src 172.31.40.130 metric 100
default via 172.31.32.1 dev ens6 proto dhcp src 172.31.37.95 metric 100
172.31.32.0/20 dev ens7 proto kernel scope link src 172.31.40.130
172.31.32.0/20 dev ens6 proto kernel scope link src 172.31.37.95
172.31.32.0/20 dev ens5 proto kernel scope link src 172.31.43.121
172.31.32.1 dev ens7 proto dhcp scope link src 172.31.40.130 metric 100
172.31.32.1 dev ens6 proto dhcp scope link src 172.31.37.95 metric 100
172.31.32.1 dev ens5 proto dhcp scope link src 172.31.43.121 metric 100

```

这时候再ping www.baidu.com 的结果就正常了。

```bash
root@ip-172-31-43-121:/etc/netplan# ping www.baidu.com
PING www.a.shifen.com (39.156.66.18) 56(84) bytes of data.
64 bytes from 39.156.66.18 (39.156.66.18): icmp_seq=1 ttl=44 time=5.59 ms
64 bytes from 39.156.66.18 (39.156.66.18): icmp_seq=2 ttl=44 time=5.59 ms
64 bytes from 39.156.66.18 (39.156.66.18): icmp_seq=3 ttl=44 time=5.59 ms
64 bytes from 39.156.66.18 (39.156.66.18): icmp_seq=4 ttl=44 time=5.60 ms
^C
--- www.a.shifen.com ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3004ms
rtt min/avg/max/mdev = 5.590/5.596/5.608/0.091 ms
```

这时候如果重启网络服务就会发现， 这三个默认条目路由的 metric 又恢复了 100 ， 并不能持久生效。

### 持久化配置

更改这个网卡的配置文件```/etc/netplan/50-cloud-init.yaml```

```yaml
root@ip-172-31-43-121:/etc/netplan# cat /etc/netplan/50-cloud-init.yaml
# This file is generated from information provided by the datasource.  Changes
# to it will not persist across an instance reboot.  To disable cloud-init's
# network configuration capabilities, write a file
# /etc/cloud/cloud.cfg.d/99-disable-network-config.cfg with the following:
# network: {config: disabled}
network:
    version: 2
    ethernets:
        ens5:
            dhcp4: true
            dhcp6: false
            match:
                macaddress: 02:4d:73:35:16:8a
            set-name: ens5
            routes:
             - to: 0.0.0.0/0 # 主路由表默认路由条目权重
               via: 172.31.32.1
               metric: 10
             - to: 0.0.0.0/0  # 策略路由
               via: 172.31.32.1
               table: 1000
             - to: 172.31.43.121 # 策略路由
               via: 0.0.0.0
               scope: link
               table: 1000
            routing-policy:
              - from: 172.31.43.121
                table: 1000
```

执行 ```netplan try```测试

执行 ```netplan apply``` 确认生效

---

这个时候再看路由表， 输出结果： 

```
root@ip-172-31-43-121:/etc/netplan# ip r s
default via 172.31.32.1 dev ens5 proto static metric 10
default via 172.31.32.1 dev ens7 proto dhcp src 172.31.40.130 metric 100
default via 172.31.32.1 dev ens6 proto dhcp src 172.31.37.95 metric 100
default via 172.31.32.1 dev ens5 proto dhcp src 172.31.43.121 metric 100
172.31.32.0/20 dev ens7 proto kernel scope link src 172.31.40.130
172.31.32.0/20 dev ens6 proto kernel scope link src 172.31.37.95
172.31.32.0/20 dev ens5 proto kernel scope link src 172.31.43.121
172.31.32.1 dev ens7 proto dhcp scope link src 172.31.40.130 metric 100
172.31.32.1 dev ens6 proto dhcp scope link src 172.31.37.95 metric 100
172.31.32.1 dev ens5 proto dhcp scope link src 172.31.43.121 metric 100

```

这时候这个实例的内外网络都是通的了。

### 最优配置

对于Ubuntu最佳的配置是： 

ens5 设置为 dhcp。

ens6， ens7 设置为 static ip ， 不从DHCP学习路由条目。这样默认的路由条目只有一条， 就是指向ens5的条目， 所有去往公网的流量会匹配到这个default条目， 然后走 ens5. 

```yaml
        ens6:
            dhcp4: false
            dhcp4-overrides: # 这个参数没尝试， 感觉是需要的，调整一下学习来的路由的优先级
                route-metric: 100
                # 不指定metric也可以指定         use-routes: false 来关闭学习默认路由。
            addresses:
              - 172.31.59.199/20
            dhcp6: false
            match:
                macaddress: 02:64:69:51:00:f2
            set-name: ens6
            routes:
             - to: 0.0.0.0/0
               via: 172.31.48.1
               table: 1001
             - to: 172.31.59.199
               via: 0.0.0.0
               scope: link
               table: 1001
            routing-policy:
              - from: 172.31.59.199
                table: 1001
        ens7:   # 同上

```

但是就像之前的描述， 这已经可以达成最终的目标了， 这还是感觉不是最好的方法， 最好的方法是bonding， 直接将多个网卡链路聚合， 才能更好的利用好底层多个物理网卡的特性。

## 配置Bonding

待补充。

## 如何排查路由表条目

1. 首先应该查看的是 ip rule list , 这里面定义的是 所有路由表的优先级。 

   ```
   root@ip-172-31-43-121:/etc/iproute2# ip rule list
   0:	from all lookup local
   0:	from 172.31.40.130 lookup 1002
   0:	from 172.31.37.95 lookup 1001
   0:	from 172.31.43.121 lookup 1000
   32766:	from all lookup main
   32767:	from all lookup default
   
   ```

   查看tcp数据包中的**目的地址**， 按照优先级顺序匹配条目，依次查。

   local table 是内核维护本地网络， 无法更改， 并且所有的条目都先匹配local。

2. 查看 local table 中的条目。

   ```
   root@ip-172-31-43-121:~# ip route show table local
   broadcast 127.0.0.0 dev lo proto kernel scope link src 127.0.0.1
   local 127.0.0.0/8 dev lo proto kernel scope host src 127.0.0.1
   local 127.0.0.1 dev lo proto kernel scope host src 127.0.0.1
   broadcast 127.255.255.255 dev lo proto kernel scope link src 127.0.0.1
   broadcast 172.31.32.0 dev ens7 proto kernel scope link src 172.31.40.130
   broadcast 172.31.32.0 dev ens6 proto kernel scope link src 172.31.37.95
   broadcast 172.31.32.0 dev ens5 proto kernel scope link src 172.31.43.121
   local 172.31.37.95 dev ens6 proto kernel scope host src 172.31.37.95
   local 172.31.40.130 dev ens7 proto kernel scope host src 172.31.40.130
   local 172.31.43.121 dev ens5 proto kernel scope host src 172.31.43.121
   broadcast 172.31.47.255 dev ens7 proto kernel scope link src 172.31.40.130
   broadcast 172.31.47.255 dev ens6 proto kernel scope link src 172.31.37.95
   broadcast 172.31.47.255 dev ens5 proto kernel scope link src 172.31.43.121
   
   ip route show table local 命令显示的是本地路由表，也就是保存本地接口地址，广播地址，NAT地址等信息的路由表。它的每一个字段的含义是：
    
   broadcast 表示这个路由项是一个广播地址，也就是可以向同一网段内的所有主机发送数据包的地址。
   local 表示这个路由项是一个本地地址，也就是本机自身的IP地址。
    
   dev 表示这个路由项对应的网卡设备名称，例如 lo, eth0, ens5 等。
    
   proto 表示这个路由项的协议来源，例如 kernel, static, dhcp 等。
    
   scope 表示这个路由项的作用范围，例如 host, link, global 等。
   
   src 表示这个路由项的源地址，也就是本机发送数据包时使用的IP地址。
   
   ```

   这个表格中， 例如 

   > local 172.31.37.95 dev ens6 proto kernel scope host src 172.31.37.95 

   如果匹配到了目的地址是  172.31.37.95  那么就由 dev ens6 来处理这个数据， 是通过kernel记录的， 是一个操作系统范围内的链路， 这个条目表示， 匹配到这个路由条目的数据报文会被交给dev dns6 来进行处理。 

   如果想知道具体这个地址会匹配到哪个路由条目， 可以使用命令：

   ```bash
   root@ip-172-31-43-121:/etc/iproute2# ip route get 39.156.66.14
   39.156.66.14 via 172.31.32.1 dev ens5 src 172.31.43.121 uid 0
       cache
   root@ip-172-31-43-121:/etc/iproute2# ip route get 172.31.40.130
   local 172.31.40.130 dev lo table local src 172.31.40.130 uid 0
       cache <local>
   
   ```

3. 如果local没有匹配到， 例如 访问百度的地址， 会跳转到 策略路由表， 当然我配置的策略路由表其实也没有匹配到这些条目， 因此开始查 main

   ```
   root@ip-172-31-43-121:/etc/iproute2# ip r s t main
   default via 172.31.32.1 dev ens5 proto static metric 10
   default via 172.31.32.1 dev ens7 proto dhcp src 172.31.40.130 metric 100
   default via 172.31.32.1 dev ens6 proto dhcp src 172.31.37.95 metric 100
   default via 172.31.32.1 dev ens5 proto dhcp src 172.31.43.121 metric 100
   172.31.32.0/20 dev ens7 proto kernel scope link src 172.31.40.130
   172.31.32.0/20 dev ens6 proto kernel scope link src 172.31.37.95
   172.31.32.0/20 dev ens5 proto kernel scope link src 172.31.43.121
   172.31.32.1 dev ens7 proto dhcp scope link src 172.31.40.130 metric 100
   172.31.32.1 dev ens6 proto dhcp scope link src 172.31.37.95 metric 100
   172.31.32.1 dev ens5 proto dhcp scope link src 172.31.43.121 metric 100
   
   ```

   由上面的查询结果可以看出， 匹配到了main表的第一条。直接给了ens5 ， 数据出去了。 

## 额外的问题

1. 具体匹配的规则是怎么实现的， src 地址到底是匹配规则还是 匹配后报文的源地址。

   > src 后面的地址是发出报文的src ip， 表示匹配这个路由条目的报文都是这个地址发出去的。

2. 三个条目的权重相同的时候， 也不是全部的报文都匹配了默认的第一个规则， 而是周期的匹配到ens6并且尝试访问几次百度， 然后失败， 不知道为啥。

   如图： 

   待

3. 这样的一个场景也会特定的导致从 eth0 进来的数据回包的数据丢包:  ![Snipaste_2024-04-25_18-06-36.png](https://s2.loli.net/2024/04/25/n2PO6hxiyers4aH.png)

在这个场景中  TestClient  ping 另一个子网的 eth0 的时候会导致丢包, 丢包的原因就是rp_fillter 造成的, 因为内核认为这个数据包应该从 eth1 进行回复, 基于路由表中的记录,  from 192.168.1.0/24 to dev eth1,  这时候内核会判断这个报文并不符合严格校验源目的地址的要求, 丢弃. 