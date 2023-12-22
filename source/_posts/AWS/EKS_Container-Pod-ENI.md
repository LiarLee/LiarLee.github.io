---
title: 查看EKS集群节点上的容器和ENI的对应关系
category: EKS
date: 2023-12-08 14:39:16
tags:
  - Kubernetes
  - EKS
---

## 版本信息
```shell 
root@ip-172-31-35-61 ~ [1]# containerd -v
containerd github.com/containerd/containerd v1.6.16 31aa4358a36870b21a992d3ad2bef29e1d693bec.m

root@ip-172-31-35-61 ~# uname -a
Linux ip-172-31-35-61.cn-north-1.compute.internal 6.1.10-arch1-1 #1 SMP PREEMPT_DYNAMIC Mon, 06 Feb 2023 09:28:04 +0000 x86_64 GNU/Linux

root@ip-172-31-35-60 ~ [1]# kubelet --version
Kubernetes v1.24.9-eks-49d8fe8
```
## 容器虚拟网卡和节点网卡的关
主要的思路是通过veth的id 。

找到 Pod 的 Pause 容器
```bash
root@ip-172-31-35-61 ~# nerdctl -n k8s.io ps | grep -v pause
CONTAINER ID    IMAGE                                                                                         COMMAND                   CREATED           STATUS    PORTS    NAMES
218279edbee1    918309763551.dkr.ecr.cn-north-1.amazonaws.com.cn/eks/kube-proxy:v1.24.9-minimal-eksbuild.1    "kube-proxy --v=2 --…"    14 hours ago      Up                 k8s://kube-system/kube-proxy-kqlj2/kube-proxy
3a8aaf963501    123456123456.dkr.ecr.cn-north-1.amazonaws.com.cn/haydenarchlinux:latest                       "sleep 365d"              8 minutes ago     Up                 k8s://default/haydenarch-77c4f7cff9-dxsps/haydenarch
```
进入容器内部查看网卡的ID
```shell
root@ip-172-31-35-61 ~# nerdctl -n k8s.io exec -it 3a8aaf963501 fish

root@haydenarch-77c4f7cff9-dxsps /# cat /sys/class/net/eth0/iflink
54

root@haydenarch-77c4f7cff9-dxsps /# ip ad
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
3: eth0@if54: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9001 qdisc noqueue state UP group default
    link/ether 66:3a:fb:f2:00:b2 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.31.39.84/32 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::643a:fbff:fef2:b2/64 scope link
       valid_lft forever preferred_lft forever
```
在实例上面查看 网卡的信息， 找到带有 id 54 的虚拟网卡对。
```shell
root@ip-172-31-35-61 ~# ip ad | grep 54
54: enid573ff579e6@if3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9001 qdisc noqueue state UP group default
```
查看这个虚拟网卡的全部信息， 可以看到 link-netns， 这是容器的Network NameSpace。 
```
```shell
root@ip-172-31-35-61 ~ [1]# ip link show enid573ff579e6
54: enid573ff579e6@if3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9001 qdisc noqueue state UP mode DEFAULT group default
    link/ether 36:06:dc:85:42:a4 brd ff:ff:ff:ff:ff:ff link-netns cni-bb451da7-00be-2d59-b5e0-1dd4e77565e8
```
可以使用下面的命令查看所有的ns并找到对应的id。
```shell
root@ip-172-31-35-61 ~# ip netns list
cni-2e29d022-09f4-6626-f416-29cfb9652e78 (id: 13)
cni-e5be29a1-d111-53ec-8f88-94118eb1466c (id: 10)
cni-bb451da7-00be-2d59-b5e0-1dd4e77565e8 (id: 8)  # 这个就是
cni-673e1c4b-acd1-ab7e-b374-1a4192eea86e (id: 6)
cni-1207e72f-e68e-a7e7-161e-979e9e9ada7a (id: 5)
cni-a8b7807f-a37e-dd4e-98cb-9d3e7cd42f11 (id: 4)
cni-08a7a0e2-8e33-b669-83ee-75957676ffbb (id: 3)
cni-8a26c501-2ea9-f4be-36ae-745a5c307fbc (id: 0)
cni-2598e89a-d2ba-38a8-6412-92fbff32871b (id: 9)
cni-817961be-8d28-b32c-816f-a842b9d243fe (id: 2)
cni-a84561aa-8668-8b7c-4b5e-56568e14dc83 (id: 12)
cni-5de27d6e-c311-6ee3-4ed5-85b2a05b6943 (id: 11)
cni-d102a5e6-d6ea-fb90-2ac8-a97cd8df9c85 (id: 7)
cni-88bf7480-bdd6-e063-3103-894d29b16302 (id: 1)
```
可以直接进入pod 的network ns 查看容器的网络信息， 这和上面在容器内直接看到的信息是一致的。
```shell 
root@ip-172-31-35-61 ~ [1]# ip netns exec cni-bb451da7-00be-2d59-b5e0-1dd4e77565e8 ip ad
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
3: eth0@if54: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9001 qdisc noqueue state UP group default
    link/ether 66:3a:fb:f2:00:b2 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.31.39.84/32 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::643a:fbff:fef2:b2/64 scope link
       valid_lft forever preferred_lft forever
```
## 如何确定容器的网卡绑定在了哪个ENI上面
由于VPC CNI本身的实现， 在EKS的节点上面会出现多的ENI，具体pod的流量是怎么走向eth网卡的，去了eth0 还是 eth1 或者其他的网卡， 需要通过路由条目来确定。 
和上面的记录时间不同， 所以这个部分的记录，是另一个节点的另一个容器了， ip地址会不一致。

查看容器的IP地址
```shell
> kubectl get pods -o wide
NAME                          READY   STATUS    RESTARTS   AGE   IP              NODE                                          NOMINATED NODE   READINESS GATES
haydenarch-7d9ff55cbd-4b7pl   1/1     Running   0          18h   172.31.55.218   ip-172-31-55-30.cn-north-1.compute.internal   <none>           <none>
```
查看节点的路由表， 看看这个ip地址的路由信息。 
```shell
[root@ip-172-31-55-30 ~]# ip rule list | grep 172.31.55.218
512:	from all to 172.31.55.218 lookup main
1536:	from 172.31.55.218 lookup 2
```
那么上面的结果显示， 这个IP地址的数据包会查 table 2， 查看 table 2
```shell
[root@ip-172-31-55-30 ~]# ip r s table 2
default via 172.31.48.1 dev eth1
172.31.48.1 dev eth1 scope link
```
观察的这个容器现在是在 eth1 上面的， 查看节点的网卡信息。
```shell
[root@ip-172-31-55-30 ~]# ip ad s eth1
17: eth1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9001 qdisc mq state UP group default qlen 1000
    link/ether 02:d1:7d:e3:9c:ca brd ff:ff:ff:ff:ff:ff
    inet 172.31.58.94/20 brd 172.31.63.255 scope global eth1
       valid_lft forever preferred_lft forever
    inet6 fe80::d1:7dff:fee3:9cca/64 scope link
       valid_lft forever preferred_lft forever
```
