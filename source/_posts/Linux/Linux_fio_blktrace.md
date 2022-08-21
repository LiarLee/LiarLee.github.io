---
title: Fio 命令使用的说明
date: 2022-04-19 17:45:39
tags: Linux
category: Linux
---

Fio 一些测试和思考， fio ，blktrace等等。

<!-- more -->

### github地址

  https://github.com/axboe/fio
  https://tobert.github.io/post/2014-04-17-fio-output-explained.html
  http://xiaqunfeng.cc/2017/07/12/fio-test-ceph/
  https://fio.readthedocs.io/en/latest/fio_doc.html
  http://linuxperf.com/?p=156

### 命令和说明
```ini
# fio test file defination
# ini file format 
 ; -- start job file --
[global]
size=1G # 设置测试文件的大小
runtime=30 # 设定运行时间， 如果运行时间之内已经完成了文件大小的写入则会保持文件大小和负载继续写。
bs=4k # 块大小
numjobs=1 # 定义测试的进程数量 默认是1
direct=1 # 是否绕过操作系统的Buffer缓冲区， 1 Enable
ioengine=libaio # io引擎使用libaio模式, 查看可用IO引擎的命令 
group_reporting # 汇总信息显示
thread # 使用单进程多线程的模型， 默认是使用多进程模型。
time_based # 用运行时间为基准， 如果时间没有到达指定的值就继续执行相同的操作， 直接到时间满足要求。

[job1]
rw=write

[job2]
rw=read

[job3]
rw=randwrite

[job4]
rw=randread

[job5]
rw=randrw
; -- end job file --
```

## 关于硬盘性能 iostat
首先， 在man iostat的时候已经明确的提示了，iostat 的 svctm （也就是硬盘的servicetime）是一个不准确的值， 会在后续的版本中移除， 因为他所依赖的数据来源（/proc/diskstats）中，是从Block Level 出发来进行计算的， 所以svctm其实并不是IO控制器所需要的准确时间， 那么出现了两个问题， 我们能观察的数据是那个？ 以及背后的含义是什么?  

### 调度算法 和 读写请求的合并
内核会对IO的请求进行合并， 但是这个合并不是一直存在的， 反映到IOstat的指标是 rrqm/s & wrqm/s,  这两个表示对于硬盘的读写请求中， 每秒合并的请求数量； 如果你去查看IO的调度算法， none 算法是完全不合并的， 所以这两列一直都是0.  

### 队列的等待时间
iostat中的await一列， 表示请求的等待时间，正常的情况下应该比较低，那么究竟什么情况下才是性能不佳的表现？  
await 每个I/O的平均耗时是用await表示(blktrace command results: Q2C – 整个IO请求所消耗的时间(Q2I + I2D + D2C = Q2C)，相当于iostat的await。)，包括了 IO请求在Kernel中的等待时间 + IO请求从内核出发处理完成回到内核的时间，也就是IO time + Service Time。  
await 一般情况下应该小于10ms ， 如果没有或者比较大的情况下 ， 应该考虑负载的类型， 来衡量硬盘的负载水平。  

### blktrace
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


保留blktrace的结果为bin文件
```r
blktrace -d /dev/sdb
```

使用blkparse 分析已经有的记录
```r
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


## 历史背景
> mdadm 已经不怎么更新和开发了
> 默认推荐使用LVM
> LVM 和 mdadm 在操作系统都是使用的Raid驱动（内核模块）。
>
> 其实也是可以使用btrfs ， 这个测试的结果是 btrfs 的性能确实是比LVM更好。


## 相关的问题
如果说有一个性能的问题， IOPS达不到指定的数值， 思路？ 
首先查看队列深度是不是足够，看svctm时间长不长，看队列的长度 

## iostat命令的理解
iostat -xkt 1
rrqm/s wrqm/s  - 读写请求的合并数量
r/s w/s - 读写请求数量
avgrq - 队列长度 
await - 时延
util - 时间度量 ， 时间周期之内进行IO操作所占的比例。例如 1 秒的时间之内， 取样的点中有多少是在执行IO操作。

一个例子 ， 如果采样的周期为1s， 那么采样的范围之内 ， 前面的0.5秒有执行IO的操作， 后面的0.5秒没有执行任何的操作， 那么 最后 Util 现在的结果就是50% 。avgrq也是一直平均值， 在采样周期之内如果前后的状况不一致 也会进行平均。

一般情况下这个参数是准确的，但是大部分的性能问题都是取决数值的取样周期的。



操作系统默认输出的块大小是 ： 256 ， 参数可见 ： 
╰─# cat /sys/block/sda/queue/max_sectors_kb
256

max_segments表示设备能够允许的最大段的数目。    -- 这应该是一个内存或者buffer的分段指标。 （待定）
max_sectors_kb表示设备允许的最大请求大小。      -- 可改 。 
max_hw_sectors_kb表示单个请求所能处理的最大KB（硬约束） -- 这个是上一个参数的Limit。  





