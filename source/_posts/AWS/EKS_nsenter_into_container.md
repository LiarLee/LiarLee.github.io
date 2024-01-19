---
title: 使用 nsenter 从Kubernetes Node 进入容器网络 Namespace
category: EKS
date: 2024-01-10 17:16:21
tags:
  - Docker
  - EKS
  - Network
---
记录一下使用 nsenter 进入容器的 network namespace 中抓包。在 TroubleShooting 的过程中可能是需要这个方法的。

## 进入容器ns的步骤
1. 选中一个pod
```ini
default      haydenarch-68865d5b56-cblc6   ●   1/1    Running           0 172.31.48.162   ip-172-31-53-61.cn-north-1.compute.internal
```
2. 在节点上找到这个pod的容器id ： `02182f3e9137`
```shell
[root@ip-172-31-53-61 ~]$ nerdctl ps| grep archlinux
 02182f3e9137    1234567.dkr.ecr.cn-north-1.amazonaws.com.cn/archlinux:latest                               "sleep infinity"          23 hours ago    Up                 k8s://default/arch-68865d5b56-cblc6/arch
```
3. 查找这个容器id的进程pid。
```shell
[root@ip-172-31-53-61 ~]$ nerdctl inspect 02182f3e9137 | grep -i pid
            "Pid": 10306,
```
4.  nsenter 命令进入容器的名称空间。 
```shell
[root@ip-172-31-53-61 ~]$ nsenter -t 10306 -n
[root@ip-172-31-53-61 ~]$ ip ad
3: eth0@if25: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9001 qdisc noqueue state UP group default
    link/ether 22:fb:14:7b:91:22 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.31.48.162/32 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::20fb:14ff:fe7b:9122/64 scope link
       valid_lft forever preferred_lft forever
```
5. 对比容器里面执行命令的结果： 
```shell
[root@haydenarch-68865d5b56-cblc6 /]$ ip ad
3: eth0@if25: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9001 qdisc noqueue state UP group default
    link/ether 22:fb:14:7b:91:22 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.31.48.162/32 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::20fb:14ff:fe7b:9122/64 scope link
       valid_lft forever preferred_lft forever
```
这时候就可以使用节点上面的工具来进行抓包了。 

## 测试
可以看到在容器内部是没有tcpdump命令的.
```shell
[root@haydenarch-68865d5b56-cblc6 /]$ tcpdump
bash: tcpdump: command not found
```
在容器内发出一个ping包 。
```shell
[root@haydenarch-68865d5b56-cblc6 /]$ ping www.bing.com -c 1
PING a-0001.a-msedge.net (13.107.21.200) 56(84) bytes of data.
64 bytes from 13.107.21.200 (13.107.21.200): icmp_seq=1 ttl=102 time=80.6 ms

--- a-0001.a-msedge.net ping statistics ---
1 packets transmitted, 1 received, 0% packet loss, time 0ms
rtt min/avg/max/mdev = 80.608/80.608/80.608/0.000 ms
```

在节点上面进入容器的名称空间，使用tcpdump抓包。
```shell
[root@ip-172-31-53-61 ~]$ tcpdump -i any -n
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on any, link-type LINUX_SLL (Linux cooked), capture size 262144 bytes
09:09:18.172140 IP 172.31.48.162.46458 > 10.100.0.10.domain: 22082+ A? www.bing.com.default.svc.cluster.local. (56)
09:09:18.172181 IP 172.31.48.162.46458 > 10.100.0.10.domain: 59743+ AAAA? www.bing.com.default.svc.cluster.local. (56)
09:09:18.172406 IP 10.100.0.10.domain > 172.31.48.162.46458: 59743 NXDomain*- 0/1/0 (149)
09:09:18.172470 IP 10.100.0.10.domain > 172.31.48.162.46458: 22082 NXDomain*- 0/1/0 (149)
09:09:18.172513 IP 172.31.48.162.51210 > 10.100.0.10.domain: 59281+ A? www.bing.com.svc.cluster.local. (48)
09:09:18.172533 IP 172.31.48.162.51210 > 10.100.0.10.domain: 43411+ AAAA? www.bing.com.svc.cluster.local. (48)
09:09:18.172635 IP 10.100.0.10.domain > 172.31.48.162.51210: 43411 NXDomain*- 0/1/0 (141)
09:09:18.172707 IP 10.100.0.10.domain > 172.31.48.162.51210: 59281 NXDomain*- 0/1/0 (141)
09:09:18.172743 IP 172.31.48.162.36420 > 10.100.0.10.domain: 41442+ A? www.bing.com.cluster.local. (44)
09:09:18.172773 IP 172.31.48.162.36420 > 10.100.0.10.domain: 6893+ AAAA? www.bing.com.cluster.local. (44)
09:09:18.172947 IP 10.100.0.10.domain > 172.31.48.162.36420: 41442 NXDomain*- 0/1/0 (137)
09:09:18.172985 IP 10.100.0.10.domain > 172.31.48.162.36420: 6893 NXDomain*- 0/1/0 (137)
09:09:18.173030 IP 172.31.48.162.54253 > 10.100.0.10.domain: 9603+ A? www.bing.com.cn-north-1.compute.internal. (58)
09:09:18.173053 IP 172.31.48.162.54253 > 10.100.0.10.domain: 61573+ AAAA? www.bing.com.cn-north-1.compute.internal. (58)
09:09:18.173130 IP 10.100.0.10.domain > 172.31.48.162.54253: 9603 NXDomain* 0/1/0 (173)
09:09:18.173863 IP 10.100.0.10.domain > 172.31.48.162.54253: 61573 NXDomain 0/1/0 (173)
09:09:18.173893 IP 172.31.48.162.49537 > 10.100.0.10.domain: 64334+ A? www.bing.com. (30)
09:09:18.173941 IP 172.31.48.162.49537 > 10.100.0.10.domain: 31567+ AAAA? www.bing.com. (30)
09:09:18.174269 IP 10.100.0.10.domain > 172.31.48.162.49537: 64334 5/0/0 CNAME www-www.bing.com.trafficmanager.net., CNAME cn-bing-com.cn.a-0001.a-msedge.net., CNAME a-0001.a-msedge.net., A 13.107.21.200, A 204.79.197.200 (311)
09:09:18.174345 IP 10.100.0.10.domain > 172.31.48.162.49537: 31567 3/1/0 CNAME www-www.bing.com.trafficmanager.net., CNAME cn-bing-com.cn.a-0001.a-msedge.net., CNAME a-0001.a-msedge.net. (325)
09:09:18.174537 IP 172.31.48.162 > 13.107.21.200: ICMP echo request, id 45375, seq 1, length 64
09:09:18.255142 IP 13.107.21.200 > 172.31.48.162: ICMP echo reply, id 45375, seq 1, length 64
```
退出的方式直接使用exit即可， 就回到了host本身的ns里面。