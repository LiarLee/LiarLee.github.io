---
title: blktrace 命令说明
date: 1980-12-08 13:56:27
category: Linux
tags:
  - IO
  - Linux
---
Blktrace 命令是一款 Linux 内核块设备 I/O 层的跟踪工具。它可以获取 I/O 请求队列的各种详细情况，包括进行读写的进程名称、进程号、执行时间、读写的物理块号、块大小等。

一个I/O请求进入block layer之后，可能会经历下面的过程：

    Q Remap: 可能被DM(Device Mapper)或MD(Multiple Device, Software RAID) remap到其它设备
    G Split: 可能会因为I/O请求与扇区边界未对齐、或者size太大而被分拆(split)成多个物理I/O
    I Merge: 可能会因为与其它I/O请求的物理位置相邻而合并(merge)成一个I/O
    D 被IO Scheduler依照调度策略发送给driver
    C 被driver提交给硬件，经过HBA、电缆（光纤、网线等）、交换机（SAN或网络）、最后到达存储设备，设备完成IO请求之后再把结果发回。

常见的状态切换 Q--G--I--D--C 
```r
259,2    0        2     0.000001080  7134  Q   W 756856 + 800 [dd]
259,2    0        3     0.000004247  7134  X   W 756856 / 757368 [dd]
259,2    0        4     0.000005806  7134  G   W 756856 + 512 [dd]
259,2    0        5     0.000008792  7134  I   W 756856 + 512 [dd]
259,2    0        6     0.000012844  7134  G   W 757368 + 288 [dd]
259,2    0        7     0.000013202  7134  I   W 757368 + 288 [dd]
259,2    0        8     0.000031708  1830  D   W 756856 + 512 [kworker/0:1H]
259,2    0        9     0.000034250  1830  D   W 757368 + 288 [kworker/0:1H]
259,2    0       10     0.001598439  7135  C   W 756856 + 512 [0]
259,2    0       11     0.001689880  7135  C   W 757368 + 288 [0]
# 主，从设备号 ， 起始Sector 为0 ， 写几个， 时间 ， pid ， 状态 ， R/W ， 未知
```

保留 blktrace 的结果为 bin 文件。
```shell
blktrace -d /dev/sdb
```

使用blkparse 分析已经有的记录
```shell
# 记录性能数据 到 文件。
root@ip-172-31-11-235:/home/ec2-user|⇒  blktrace -d /dev/nvme0n1p1
^C=== nvme0n1p1 ===
  CPU  0:                    1 events,        1 KiB data
  CPU  1:                    0 events,        0 KiB data
  Total:                     1 events (dropped 0),        1 KiB data
# 每个cpu设备每个设备存储一个单独的文件。
root@ip-172-31-11-235:/home/ec2-user|⇒  ll
total 4.0K
-rw-r--r-- 1 root root 56 Nov  4 17:55 nvme0n1p1.blktrace.0
-rw-r--r-- 1 root root  0 Nov  4 17:55 nvme0n1p1.blktrace.1

root@ip-172-31-11-235:/home/ec2-user|⇒  blkparse -i nvme0n1p1.blktrace.0
# 格式化分析的数据为bin。
root@ip-172-31-11-235:/home/ec2-user|⇒  blkparse -i nvme0n1p1 -d nvme0n1p1.blktrace.bin
# 使用一个简易的图形方式分析结果。
root@ip-172-31-11-235:/home/ec2-user|⇒  btt -i nvme0n1p1.blktrace.bin
```
