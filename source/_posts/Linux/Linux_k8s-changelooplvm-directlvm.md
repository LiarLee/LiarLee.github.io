---
title: K8S将loop-lvm改为direct-lvm说明
date: 2019-09-24 11:10:36
categories: Kubernetes
tags: Kubernetes
---

对k8s集群进行存储驱动的调整，从loop-lvm 切换到direct-lvm。
## k8s的几种不同的存储驱动
1. AUFS - 这是一个经过时间检验的存储驱动
2. DeviceMapper - Redhat系默认的驱动，有loop和direct两种不同配置
3. Btrfs - 我.... 这个文件系统的快照真的是贼好用，但是性能什么的....我倒觉得都一般
4. ZFS - 还没用过
5. VFS - 还没用过
6. Overlay2 - 简单的接触了一下，docker目前推荐的存储驱动

## 关于存储驱动选择的相关博客及文章
> [Docker引擎 - 选择存储驱动](https://www.jianshu.com/p/6bf1bc011ade)  
> [Docker五种存储驱动原理及应用场景和性能测试对比](http://dockone.io/article/1513)  
> [Docker系统八：Docker的存储驱动](https://www.cnblogs.com/Terry-Wu/p/7471476.html) 
## Loop-lvm
这是docker默认安装之后的选择，因为这样可以out-of-box，但是据说稳定性不佳，我没遇到稳定性的问题，但是遇到了IO高导致的整个虚拟机运行缓慢。  
Loop-LVM其实使用了linux中的使用loop设备
我之前安装的一套k8s默认是使用overlay2的存储，可能是内核的版本过低导致无法使用其他的存储驱动，所以我觉得默认使用了loop-lvm。

> loop-lvm的工作模式是，默认在/var/lib/docker/devicemapper/devicemapper/目录下生成data&metadata两个**稀疏文件**（我目前还不知道什么叫做稀疏文件），并将两个文件挂载为loop设备做为块设备来使用。
按照这个说法的话确实如果直接对裸设备的想能和稳定性都应该更强。所以下面可以动手啦~

## Direct-lvm
这里直接放一个官方文档的链接好了。
[Device-Mapper-driver](https://docs.docker.com/storage/storagedriver/device-mapper-driver/)
### 切换loop-lvm到direct-lvm
想要切换的原因其实是已经安装好的这个k8s的master节点在跑了很久之后，总是被zabbix监控到报警，硬盘负载高；cpu进程数高。cpu的进程数量高可以理解，毕竟监控了如此多的容器。硬盘负载高这个报警在系统中发现是/dev/loop2这个设备。对应去查找 docker info中的信息，发现这是k8s的存储所使用的。进而搜索到了关于loop-lvm&direct-lvm的相关问题，发现使用loop设备的方式应该实在性能上有影响的，k8s不推荐生产环境使用，所以考虑切换过来，今后毕竟还是要长期使用的。**值得注意的是**：切换一定会导致之前的容器无法使用。而且目前来看关键的数据是不能恢复的，所以最好是在之前已经做好了计划。
#### 自动托管配置
自动托管的配置主要是两部分，首先是建立一个空的LVM，不需要挂载，只要系统识别到即可。之后是更改配置文件及重启docker服务。
1. 在虚拟机中加入一块新的硬盘，fdisk中识别为/dev/sdb；
2. 关闭docker。systemctl stop docker.
3. 在配置文件中加入如下的配置，注意格式不要错，不要丢下末尾的逗号：
```
{
  "storage-driver": "devicemapper",   # 告诉docker应用使用的存储驱动
  "storage-opts": [
    "dm.directlvm_device=/dev/sdb",	# 指定使用的块设备，不需要格式化，不需要分区。在这里指定了设备docker会自动完成创建LVM等等操作。
    "dm.thinp_percent=95",	# 指定Thinpool占用的百分比
    "dm.thinp_metapercent=1",	# 指定Thinpool Meta数据使用的百分比
    "dm.thinp_autoextend_threshold=80",	# 指定自动扩容的阈值
    "dm.thinp_autoextend_percent=20",	# 指定自动扩容的比例
    "dm.directlvm_device_force=false"	# 是否强制格式化设备，默认是false。如果使用dockerd启动的时候出现了提供需要强行格式化设备的提示，就改为True。
  ]
}
```
4. 重新启动docker服务。如果正常启动可通过docker info 查看是否已经切换过来。
5. 如果没有能成功启动，尝试重启虚拟机；尝试使用dockerd命令直接启动，根据dockerd的日志信息进行相应的修改。
6. 常见错误有：
```
Sep 23 18:38:03 k8s-master dockerd: time="2019-09-23T18:38:03.931876136+08:00" level=warning msg="[graphdriver] WARNING: the devicemapper storage-driver is deprecated, and will be removed in a future release"
# 存储驱动将会在未来的版本被移除的警告。这不会导致docker无法运行。
Sep 23 18:25:52 localhost dockerd: Error starting daemon: error initializing graphdriver: /dev/sdb is already part of a volume group "docker": must remove this device from any volume group or provide a different device
# 这个问题说明 docker 认为你的/dev/sdb上已经被创建了LVM，你需要手动指定，自动托管不会对这个设备进行操作。这会导致docker无法启动。
# 首先你需要把/dev/sdb这个设备从LVM里面移除，lvdelete,pvdelete,vgdelete, 将设备还原为默认的状态，之后重启docker，将设备的所有操作控制都交给docker来做，就不会有这个错误了。
```
## 总结
在更换之后目前性能稳定，IO的负载也下来了。总体来看还是不错的。不过随着kubernetes的发展，我觉得这种问题应该会越来越少。还是推荐在安装的时候直接调整，不然数据的随时确实带来了一些麻烦。