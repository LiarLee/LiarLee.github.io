---
title: Docker基础知识二周目
date: 2021-09-04 23:43:42
categories: Docker
tags: Docker
---

Docker Container 基础 。 again ..... 

## Docker使用的六个名称空间
1. MNT Namespace - 提供文件的挂载和文件系统的隔离
1. IPC Namespace - 提供进程间通信
1. UTS Namespace - 提供主机名隔离
1. PID Namespace - 提供进程以及进程号隔离
1. Net Namespace - 提供网络隔离
1. User Namespace - 提供用户以及用户id的隔离

## 容器的进程ID关系
```bash
Host -------------------------------- | container ------------------------|
systemd -- containerd -- container-shim -- | nginx-master -- nginx-worker
               `      -- container-shim -- | nginx-master -- nginx-worker
               `      -- container-shim -- | mysql-master -- mysql-worker
           dockerd -- docker-proxy -- | docker-proxy
               `   -- docker-proxy -- | docker-proxy
               `   -- docker-proxy -- | docker-proxy
```

containerd负责控制容器的进程，主机，用户，挂载的隔离。
dockerd 启动的docker-proxy用来管理iptables进行网络的隔离。 
docker.service 里面指定了调用Containerd的socket
生成容器的过程钟，API调用过程使用的是grpc。
无论dockerd还是containerd最终使用的都是runc（container runtime） ，一个基于Go语言的容器创建工具， 根据OCI标准来创建容器。

docker-daemon 限制可以限制生成日志的大小

- 限制日志的大小使用的是 docker的daemon config， 针对的日志的范围，是docker Container 里面的标准输入输出的日志， 这部分日志的存储是在机器的硬盘上， 位置是（/opt/docker-storage/containers ， 也就是/var/lib/docker/containers/[CONTAINER_ID]/*.json），

 cpu 大约可以分配 1:4  ， mem不建议超过物理内存的分配

压测镜像： lorel/docker-stress-ng 

## Docker的网络结构
使用的是宿主机的docker0桥，同时在Host上面生成虚拟网卡veth多个接口 ， 在容器中生成eth0的虚拟网卡对， 虚拟机中的两个容器之间使用的是物理地址进行寻址访问，所以这个部分可以通过arp命令来进行验证。

## Docker容器的资源限制 - Cgroup
可以限制 CPU，MEM，DISKIO，NETIO, PRI，PAUSE/RESUME。 对于Kubernetes可以对集群的Namespace来进行限制资源的规划。

查看内核可以支持的cgroup Flag. 
```bash
┌─[hayden@HaydenArchDesktop] - [~] - [Sun Sep 05, 00:14]
└─[$] <> zcat /proc/config.gz | grep CGROUP
CONFIG_CGROUPS=y
CONFIG_BLK_CGROUP=y
CONFIG_CGROUP_WRITEBACK=y 
CONFIG_CGROUP_SCHED=y
CONFIG_CGROUP_PIDS=y
CONFIG_CGROUP_RDMA=y
CONFIG_CGROUP_FREEZER=y
CONFIG_CGROUP_HUGETLB=y
CONFIG_CGROUP_DEVICE=y
CONFIG_CGROUP_CPUACCT=y
CONFIG_CGROUP_PERF=y
CONFIG_CGROUP_BPF=y
CONFIG_CGROUP_MISC=y
# CONFIG_CGROUP_DEBUG is not set
CONFIG_SOCK_CGROUP_DATA=y
CONFIG_BLK_CGROUP_RWSTAT=y
CONFIG_BLK_CGROUP_IOLATENCY=y
CONFIG_BLK_CGROUP_IOCOST=y
# CONFIG_BFQ_CGROUP_DEBUG is not set
CONFIG_NETFILTER_XT_MATCH_CGROUP=m
CONFIG_NET_CLS_CGROUP=m
CONFIG_CGROUP_NET_PRIO=y
CONFIG_CGROUP_NET_CLASSID=y

┌─[hayden@HaydenArchDesktop] - [~] - [Sun Sep 05, 00:14]
└─[$] <> zcat /proc/config.gz | grep MEM | grep CG
CONFIG_MEMCG=y
CONFIG_MEMCG_SWAP=y
CONFIG_MEMCG_KMEM=y
```
### CPU
Kubernetes 限制是1/1000Core ，Docker是1/10Core, 只需要通过 --cpus 选项指定容器可以使用的 CPU 个数就可以了，并且还可以指定如 1.5 之类的小数。

CPU OverCommit 1:8

### MEM
MEM的限制单位是M； 同时可以限制Swap的使用，但是限制Swap的使用需要内核的支持，大部分时候还是会关闭掉SWAP， 虽然避免了OOM，但是会影响服务的质量。

MEM 不建议OverCommit

> 一般情况下 ： 分配0.5/1个CPU，mem 2G/4G； 根据业务的不同， 一般会是高可用的部署，两个一起对外提供服务；所以会启动两个容器，不需要提供太高的硬件，符合要求即可。

关于OOM的问题和可以调整的参数(/proc/[PID]/)：
1. oom_adj 取值范围 -17 to +15 ， 为了兼容旧程序保留的方式
2. oom_score 一般是自动计算出来的结果，**综合计算的结果, 参考 ： CPU时间，存活时间，oom_adj计算之后的结果。**
3. oom_score_adj OOM分数的偏移量，-1000 to +1000, 可以设置-1000表示永远不会被Kill

### DISKIO

Disk OverCommit : 1:1.2

### PAUSE\RESUME

