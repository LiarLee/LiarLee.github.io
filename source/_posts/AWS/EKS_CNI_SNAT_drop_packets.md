---
title: 源地址检查造成丢包的分析
category: EKS
date: 2024-01-10 13:18:03
tags:
  - EKS
  - AWS
  - Kubernetes
---
### 问题
网络访问路径： 
Client --> NLB --> Application Pod

特别的部分： 
NLB 开启了保留源地址就意味着 NLB 在转发网络流量的时候不会改变数据包五元组内的SourceIP， 这时候对于后端的Pod和节点来说， 收到的数据包的ip地址来源直接是Client 的IP 地址， 这会**导致所有的流量其实都是来自于VPC之外的**。 NLB在这其中变成了一个透明代理。 
从 NLB 发到后端application pod 中的流量会有偶尔timeout的情况， 并不是所有的请求都会timeout ，从客户端抓包显示tcp握手的时候就没有成功， 第一个syn包出去就一直没有回复，然后继续重发等待。 由于后端的pod比较多， 并且nlb在四层做了负载均衡，很难定位到某次的请求具体到了哪个后端pod上面。 

--- 

写下这些的时候我已经知道了问题的答案是由于 VPC CNI 的一个 env ， `AWS_VPC_K8S_CNI_EXTERNALSNAT` 会指定是否做 SNAT， 比较早的版本，  cni 插件没有对 SNAT 在iptables上面进行标记和处理， 这样会导致 过不了操作系统的网络报文地址校验， 进而导致丢包。
关于 linux 的数据包源地址校验，也就是 rp_filter 的参数， 在EKS中默认都是1 。 

```shell
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.rp_filter = 1
```

rp_filter参数用于控制系统是否开启对数据包源地址的校验。rp_filter参数有三个值，0、1、2，具体含义：  
0：不开启源地址校验。  
1：开启严格的反向路径校验。对每个进来的数据包，校验其反向路径是否是最佳路径。如果反向路径不是最佳路径，则直接丢弃该数据包。  
2：开启松散的反向路径校验。对每个进来的数据包，校验其源地址是否可达，即反向路径是否能通（通过任意网口），如果反向路径不同，则直接丢弃该数据包。

默认的情况下， 这个参数是1， 因此 ： 
数据包发到了eth1网卡，如果这时候开启了rp_filter参数，并配置为1，则系统会严格校验数据包的反向路径。从路由表中可以看，返回响应时数据包要从eth0网卡出，即请求数据包进的网卡和响应数据包出的网卡不是同一个网卡，这时候系统会判断该反向路径不是最佳路径，而直接丢弃该请求数据包。

### 排查路由表 和 Iptables
#### 当 AWS_VPC_K8S_CNI_EXTERNALSNAT 为 False 的时候
查看节点的路由rule： 
```shell
[root@ip-172-31-53-61 ~]# ip rule ls
0:	from all lookup local
512:	from all to 172.31.49.222 lookup main
512:	from all to 172.31.52.222 lookup main
512:	from all to 172.31.59.203 lookup main
512:	from all to 172.31.61.61 lookup main
512:	from all to 172.31.49.246 lookup main
512:	from all to 172.31.58.47 lookup main
512:	from all to 172.31.53.79 lookup main
512:	from all to 172.31.63.97 lookup main
512:	from all to 172.31.53.74 lookup main
512:	from all to 172.31.54.196 lookup main
512:	from all to 172.31.51.218 lookup main
512:	from all to 172.31.63.248 lookup main
512:	from all to 172.31.54.200 lookup main
512:	from all to 172.31.51.108 lookup main
512:	from all to 172.31.56.137 lookup main
512:	from all to 172.31.54.85 lookup main
512:	from all to 172.31.51.82 lookup main
512:	from all to 172.31.57.72 lookup main
512:	from all to 172.31.59.200 lookup main
512:	from all to 172.31.58.18 lookup main
512:	from all to 172.31.55.235 lookup main
512:	from all to 172.31.48.162 lookup main
512:	from all to 172.31.60.128 lookup main
512:	from all to 172.31.50.246 lookup main
512:	from all to 172.31.61.216 lookup main
512:	from all to 172.31.55.130 lookup main
512:	from all to 172.31.49.208 lookup main
512:	from all to 172.31.55.135 lookup main
512:	from all to 172.31.50.208 lookup main
512:	from all to 172.31.63.121 lookup main
512:	from all to 172.31.52.205 lookup main
512:	from all to 172.31.52.71 lookup main
512:	from all to 172.31.51.7 lookup main
512:	from all to 172.31.53.238 lookup main
1024:	from all fwmark 0x80/0x80 lookup main
1536:	from 172.31.56.137 lookup 2
1536:	from 172.31.54.85 lookup 2
1536:	from 172.31.51.82 lookup 2
1536:	from 172.31.57.72 lookup 2
1536:	from 172.31.59.200 lookup 2
1536:	from 172.31.58.18 lookup 2
1536:	from 172.31.55.235 lookup 2
1536:	from 172.31.48.162 lookup 2
1536:	from 172.31.60.128 lookup 2
1536:	from 172.31.50.246 lookup 2
1536:	from 172.31.61.216 lookup 2
1536:	from 172.31.55.130 lookup 2
1536:	from 172.31.49.208 lookup 2
1536:	from 172.31.55.135 lookup 2
1536:	from 172.31.50.208 lookup 3
1536:	from 172.31.63.121 lookup 3
1536:	from 172.31.52.205 lookup 3
1536:	from 172.31.52.71 lookup 3
1536:	from 172.31.51.7 lookup 3
1536:	from 172.31.53.238 lookup 3
32766:	from all lookup main
32767:	from all lookup default
```
路由表 main： 
```shell
[root@ip-172-31-53-61 ~]# ip  r s table main
default via 172.31.48.1 dev eth0
169.254.169.254 dev eth0
172.31.48.0/20 dev eth0 proto kernel scope link src 172.31.53.61
172.31.48.162 dev enicfd09b318e8 scope link
172.31.49.208 dev eni3512a649bfb scope link
172.31.49.222 dev eni8cf9e51b58a scope link
172.31.49.246 dev eni9f41e641d45 scope link
172.31.50.208 dev eniffd28bfda2d scope link
172.31.50.246 dev eni1abad8afd57 scope link
172.31.51.7 dev eni76e381844d3 scope link
172.31.51.82 dev eni524077fd828 scope link
172.31.51.108 dev eni08e24263c30 scope link
172.31.51.218 dev enicb4edb90122 scope link
172.31.52.71 dev eni61a9554ce92 scope link
172.31.52.205 dev eniabe0e0a95e5 scope link
172.31.52.222 dev eni60eac028c5b scope link
172.31.53.74 dev enibecb9c399f8 scope link
172.31.53.79 dev eni6c5800d82af scope link
172.31.53.238 dev eni5a413534f4e scope link
172.31.54.85 dev eni2acd4947ff6 scope link
172.31.54.196 dev eni54f6d6a6254 scope link
172.31.54.200 dev eni47a45758006 scope link
172.31.55.130 dev eni1658effeb9c scope link
172.31.55.135 dev enibe97b10ca0d scope link
172.31.55.235 dev eni179f5c3696c scope link
172.31.56.137 dev eni099fbf41bd0 scope link
172.31.57.72 dev eni10574b2dfef scope link
172.31.58.18 dev eni5434103f7b9 scope link
172.31.58.47 dev enif4a18529a5f scope link
172.31.59.200 dev eni308c9b2c04f scope link
172.31.59.203 dev enia94f8f21d94 scope link
172.31.60.128 dev eni11239f98883 scope link
172.31.61.61 dev eni84312c21e65 scope link
172.31.61.216 dev enid75abf4f5e0 scope link
172.31.63.97 dev eni3ea3753c729 scope link
172.31.63.121 dev eni8bac6c0ff3f scope link
172.31.63.248 dev enie5c85d50c09 scope link
```
查看 table 3 的内容： 
```shell
[root@ip-172-31-53-61 ~]# ip r s table 3
default via 172.31.48.1 dev eth2
172.31.48.1 dev eth2 scope link
```

查看tables 2 的内容： 
```shell
[root@ip-172-31-53-61 ~]# ip r s table 2
default via 172.31.48.1 dev eth1
172.31.48.1 dev eth1 scope link
```
#### 当 AWS_VPC_K8S_CNI_EXTERNALSNAT 为 True 的时候
更改环境变量    
```yaml
# cni daemonset env - 
- name: AWS_VPC_K8S_CNI_EXTERNALSNAT
   value: "true"
```
等重启完成之后，再看节点的路由rule： 
```shell
[root@ip-172-31-53-61 ~]#  ip rule show
0:	from all lookup local
512:	from all to 172.31.49.222 lookup main
512:	from all to 172.31.52.222 lookup main
512:	from all to 172.31.59.203 lookup main
512:	from all to 172.31.61.61 lookup main
512:	from all to 172.31.49.246 lookup main
512:	from all to 172.31.58.47 lookup main
512:	from all to 172.31.53.79 lookup main
512:	from all to 172.31.63.97 lookup main
512:	from all to 172.31.53.74 lookup main
512:	from all to 172.31.54.196 lookup main
512:	from all to 172.31.51.218 lookup main
512:	from all to 172.31.63.248 lookup main
512:	from all to 172.31.54.200 lookup main
512:	from all to 172.31.51.108 lookup main
512:	from all to 172.31.56.137 lookup main
512:	from all to 172.31.54.85 lookup main
512:	from all to 172.31.51.82 lookup main
512:	from all to 172.31.57.72 lookup main
512:	from all to 172.31.59.200 lookup main
512:	from all to 172.31.58.18 lookup main
512:	from all to 172.31.55.235 lookup main
512:	from all to 172.31.48.162 lookup main
512:	from all to 172.31.60.128 lookup main
512:	from all to 172.31.50.246 lookup main
512:	from all to 172.31.61.216 lookup main
512:	from all to 172.31.55.130 lookup main
512:	from all to 172.31.49.208 lookup main
512:	from all to 172.31.55.135 lookup main
512:	from all to 172.31.50.208 lookup main
512:	from all to 172.31.63.121 lookup main
512:	from all to 172.31.52.205 lookup main
512:	from all to 172.31.52.71 lookup main
512:	from all to 172.31.51.7 lookup main
512:	from all to 172.31.53.238 lookup main
1024:	from all fwmark 0x80/0x80 lookup main
1536:	from 172.31.53.238 lookup 3
1536:	from 172.31.51.7 lookup 3
1536:	from 172.31.52.205 lookup 3
1536:	from 172.31.52.71 lookup 3
1536:	from 172.31.63.121 lookup 3
1536:	from 172.31.50.208 lookup 3
1536:	from 172.31.51.82 lookup 2
1536:	from 172.31.55.130 lookup 2
1536:	from 172.31.61.216 lookup 2
1536:	from 172.31.49.208 lookup 2
1536:	from 172.31.60.128 lookup 2
1536:	from 172.31.48.162 lookup 2
1536:	from 172.31.50.246 lookup 2
1536:	from 172.31.58.18 lookup 2
1536:	from 172.31.56.137 lookup 2
1536:	from 172.31.57.72 lookup 2
1536:	from 172.31.59.200 lookup 2
1536:	from 172.31.54.85 lookup 2
1536:	from 172.31.55.235 lookup 2
1536:	from 172.31.55.135 lookup 2
32766:	from all lookup main
32767:	from all lookup default
```
查看 table 2 的内容：
```shell
[root@ip-172-31-53-61 ~]# ip r s table 2
default via 172.31.48.1 dev eth1
172.31.48.1 dev eth1 scope link
```
查看 table 3 的内容：
```shell
[root@ip-172-31-53-61 ~]# ip r s table 3
default via 172.31.48.1 dev eth2
172.31.48.1 dev eth2 scope link
```
main 路由表： 
```shell
[root@ip-172-31-53-61 ~]# ip  r s table main
default via 172.31.48.1 dev eth0
169.254.169.254 dev eth0
172.31.48.0/20 dev eth0 proto kernel scope link src 172.31.53.61
172.31.48.162 dev enicfd09b318e8 scope link
172.31.49.208 dev eni3512a649bfb scope link
172.31.49.222 dev eni8cf9e51b58a scope link
172.31.49.246 dev eni9f41e641d45 scope link
172.31.50.208 dev eniffd28bfda2d scope link
172.31.50.246 dev eni1abad8afd57 scope link
172.31.51.7 dev eni76e381844d3 scope link
172.31.51.82 dev eni524077fd828 scope link
172.31.51.108 dev eni08e24263c30 scope link
172.31.51.218 dev enicb4edb90122 scope link
172.31.52.71 dev eni61a9554ce92 scope link
172.31.52.205 dev eniabe0e0a95e5 scope link
172.31.52.222 dev eni60eac028c5b scope link
172.31.53.74 dev enibecb9c399f8 scope link
172.31.53.79 dev eni6c5800d82af scope link
172.31.53.238 dev eni5a413534f4e scope link
172.31.54.85 dev eni2acd4947ff6 scope link
172.31.54.196 dev eni54f6d6a6254 scope link
172.31.54.200 dev eni47a45758006 scope link
172.31.55.130 dev eni1658effeb9c scope link
172.31.55.135 dev enibe97b10ca0d scope link
172.31.55.235 dev eni179f5c3696c scope link
172.31.56.137 dev eni099fbf41bd0 scope link
172.31.57.72 dev eni10574b2dfef scope link
172.31.58.18 dev eni5434103f7b9 scope link
172.31.58.47 dev enif4a18529a5f scope link
172.31.59.200 dev eni308c9b2c04f scope link
172.31.59.203 dev enia94f8f21d94 scope link
172.31.60.128 dev eni11239f98883 scope link
172.31.61.61 dev eni84312c21e65 scope link
172.31.61.216 dev enid75abf4f5e0 scope link
172.31.63.97 dev eni3ea3753c729 scope link
172.31.63.121 dev eni8bac6c0ff3f scope link
172.31.63.248 dev enie5c85d50c09 scope link
```

保存对比iptables的区别， 可以看到，改更这个设置的时候， 在 iptables 的规则里面移除了 prerouting 的 snat chain ， 也就是不在操作系统里面进行 snat 的处理， 不将这个网卡的地址改成 eth0 的地址 -- 公网IP。 
![image (1).png](https://s2.loli.net/2024/01/10/drWO6QhpBgCq1n5.png)

### 总结
在这个选项是否开关， 没有进行路由表的变动，只是变动了iptables的规则。 
最后找到了 CNI 这个变更的提交： https://github.com/aws/amazon-vpc-cni-k8s/pull/1475

