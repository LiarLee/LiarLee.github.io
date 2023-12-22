---
title: Ceph Cluster 02 - OSD/RBD
date: 2021-08-23 15:04:12
categories: Linux
tags:
  - Ceph
  - IO
---

Ceph的使用笔记。

创建存储池

```bash
# 创建一个PG为64 ，PGP为64的存储池。
[ceph: root@ceph01 /]# ceph osd pool create test-64 64 64
pool 'test-64' created

# 创建一个自动识别的大小的存储池。
[ceph: root@ceph01 /]# ceph osd pool create test
pool 'test' created

# 查看已经存在的存储池。
[ceph: root@ceph01 /]# ceph osd pool ls
device_health_metrics
test
test-64

# 查看存储池的PG 和 PGP 的信息和关系。
[ceph: root@ceph01 /]# ceph pg ls-by-pool test

# 查看OSD的状态。
[ceph: root@ceph01 /]# ceph osd tree
ID  CLASS  WEIGHT   TYPE NAME        STATUS  REWEIGHT  PRI-AFF
-1         0.58557  root default
-5         0.14639      host ceph01
 2    hdd  0.04880          osd.2        up   1.00000  1.00000
 7    hdd  0.04880          osd.7        up   1.00000  1.00000
11    hdd  0.04880          osd.11       up   1.00000  1.00000
-7         0.14639      host ceph02
 3    hdd  0.04880          osd.3        up   1.00000  1.00000
 6    hdd  0.04880          osd.6        up   1.00000  1.00000
10    hdd  0.04880          osd.10       up   1.00000  1.00000
-9         0.14639      host ceph03
 1    hdd  0.04880          osd.1        up   1.00000  1.00000
 5    hdd  0.04880          osd.5        up   1.00000  1.00000
 9    hdd  0.04880          osd.9        up   1.00000  1.00000
-3         0.14639      host ceph04
 0    hdd  0.04880          osd.0        up   1.00000  1.00000
 4    hdd  0.04880          osd.4        up   1.00000  1.00000
 8    hdd  0.04880          osd.8        up   1.00000  1.00000

# 测试上传一个文件并且查看文件的状态和信息。
[ceph: root@ceph01 rpm]# pwd
/var/lib/rpm
[ceph: root@ceph01 rpm]# ls -lh ./Packages
-rw-r--r-- 1 root root 20M Jul  8 17:56 ./Packages

[ceph: root@ceph01 rpm]# rados put msg1 ./Packages --pool=test
[ceph: root@ceph01 rpm]# rados put msg1 ./Packages --pool=test-64

[ceph: root@ceph01 rpm]# rados ls --pool=test
msg1

[ceph: root@ceph01 rpm]# ceph osd map test msg1
osdmap e68 pool 'test' (2) object 'msg1' -> pg 2.c833d430 (2.10) -> up ([9,3,0], p9) acting ([9,3,0], p9)

[ceph: root@ceph01 rpm]# ceph osd map test-64 msg1
osdmap e68 pool 'test-64' (3) object 'msg1' -> pg 3.c833d430 (3.30) -> up ([2,0,3], p2) acting ([2,0,3], p2)

# 删除上传的文件
[ceph: root@ceph01 rpm]# rados rm msg1 --pool=test
[ceph: root@ceph01 rpm]# rados rm msg1 --pool=test-64
[ceph: root@ceph01 rpm]# rados ls --pool=test
[ceph: root@ceph01 rpm]# rados ls --pool=test-64

# 删除刚刚添加的存储池。(临时的解决方案是使用如下的命令， 永久生效的配置写入 /etc/ceph/ceph.conf)
[ceph: root@ceph01 ~]# ceph tell mon.* injectargs '--mon-allow-pool-delete=true'
mon.ceph01: {}
mon.ceph01: mon_allow_pool_delete = 'true'
mon.ceph02: {}
mon.ceph02: mon_allow_pool_delete = 'true'
mon.ceph03: {}
mon.ceph03: mon_allow_pool_delete = 'true'

# 执行删除命令就不会报错了。
[ceph: root@ceph01 ~]# ceph osd pool rm test test --yes-i-really-really-mean-it
pool 'test' removed
[ceph: root@ceph01 ~]# ceph osd pool rm test-64 test-64 --yes-i-really-really-mean-it
pool 'test-64' removed

# 创建一个KVM的块设备池。
[ceph: root@ceph01 ~]# ceph osd pool create kvm 256 256
pool 'kvm' created

# 设置Application enable flag
[ceph: root@ceph01 ~]# ceph osd pool application enable kvm rbd
enabled application 'rbd' on pool 'kvm'
# 初始化池。
[ceph: root@ceph01 ~]# rbd pool init -p kvm
# 创建一个可挂载的镜像。
[ceph: root@ceph01 ~]# rbd create disk01 --size 5G --pool kvm
# 查看镜像的相关信息
[ceph: root@ceph01 ~]# rbd ls --pool kvm
disk01
	size 5 GiB in 1280 objects
	order 22 (4 MiB objects)
	snapshot_count: 0
	id: 1703d21a8f2ba
	block_name_prefix: rbd_data.1703d21a8f2ba
	format: 2
	features: layering, exclusive-lock, object-map, fast-diff, deep-flatten
	op_features:
	flags:
	create_timestamp: Mon Aug 23 09:13:58 2021
	access_timestamp: Mon Aug 23 09:13:58 2021
	modify_timestamp: Mon Aug 23 09:13:58 2021

# 安装Ceph的客户端以及rbd命令。
[root@HaydenArchDesktop hayden]# sudo pacman -S ceph
[root@HaydenArchDesktop hayden]# rbd -p kvm map disk01
/dev/rbd0
[root@HaydenArchDesktop hayden]# lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
rbd0        254:0    0     5G  0 disk

# 格式化文件系统。 
[root@HaydenArchDesktop test]# mkfs.xfs /dev/rbd0
# 挂载。
[root@HaydenArchDesktop test]# mount /dev/rbd0 /opt/test/
# 移除挂载
[root@HaydenArchDesktop test]# umount /opt/test
# 取消这个映射关系。
[root@HaydenArchDesktop test]# rbd unmap /dev/rbd0
```
