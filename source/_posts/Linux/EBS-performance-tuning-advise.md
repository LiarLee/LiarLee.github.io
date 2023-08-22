---
title: EBS性能优化
date: 2023-08-16 14:17:31
category: Linux
tags: Linux, EBS, IO
---

## EBS性能优化

Agenda

1. 磁盘调优方法论
2. 常用的磁盘调优方法
3. 磁盘压测工具
4. 磁盘性能检测工具

目前比较常用的是 GP3。 

## 方法论

应用程序 --》 操作系统 --》 虚拟机 --》 EBS 服务器

应用程序IO请求下发的路径。

三个方向， iops， 带宽， 延迟，按照这三个方面来观察这个EBS本身的性能。 

### 使用新版本的内核：

1. 3.8 以上内核使用的Indirect descriptors
2. 突破 I/O size 44kiB限制， 可以一次请求下发 128KiB的IO大小。
3. 建议使用 amazonlinux 2023 （悲
4. uname -r 查看内核的版本。

### 使用 Raid0

使用 Raid0 可以提高带宽， 并且节省成本。

1. 能更换磁盘类型达到性能， 可以使用Raid0 
2. 不建议在EBS 做 Raid1 5 6 三种， 校验的方式会降低性能。
3. 推荐使用 mdadm ， 不一定要用LVM。

### 关注队列长度

SSD： 每 1000iops 队列长度是 1 ， SSD是合适的吧

​      观察队列长度， 如果能达到 IOPS 的情况下， 队列越低越好。

HDD： 1MiB的IOsize ， 建议的队列长度 4

​      降低io队列的方法,取决于发送IO的速度和线程数量。 或者提高磁盘的IOPS

### HDD吞吐量设计增加预读取大小

For st1/sc1. 

```bash
blockdev --report /dev/nvme1n1 # 查看块设备的参数
blockdev --setra 2048 /dev/nvme1n1  # 设置块设备预读取数据量的大小
blockdev --getra /dev/nvme1n1 # 查看参数是否生效。
```

这个部分是为了增加吞吐量而在Read的同时将后面的一部分数据读取进入内存， 这样可以提高顺序读取的效率， 提高读取的效率， 让顺序读取的业务数据提前进入内存。

### 使用 Nitro 架构实例

- 之前使用zen的时候有一个Dom0来进行实例的管理。 nitro 做成 Hardware， nitro 管理VPC等等等， 尽可能把 X86 过度给客户来使用。

  Refer to： https://zhuanlan.zhihu.com/p/270522703

- 开启EBS优化选项。 非优化的场景下，会与网络请求共享带宽， EBS优化这个功能单独隔离了EBS的网络请求。

### 使用正确的实例类型

关注实例的限制， 例如实例的上限是 14000 ， 那么实例使用EBS的瓶颈不在磁盘本身， 在实例的性能上限。

## 压测工具

- dd 

- hdparm 

- sysbench

- iometer

- iozone

推荐fio 

https://fio.readthedocs.io/en/latest/fio_doc.html

ebs设置默认的 Block Size是 16k ， 其他厂商可能是 4k的。 这个部分可能会在测试的时候造成差异。 

### 测试命令

```bash
#!/bin/bash

# 这个命令的运行结果是， 一个 job 在 iodepth 为 1 的时候， 写入与底层一样的块大小，在iostat 中可以看到  avgqu-zs 的大小是 1。
# 添加一个process之后， 队列的size 变成了2 ； 添加一个 iodepth 之后， 队列的大小为 1 ~ 2 之间。 
# 大佬认为内核的蓄流将请求合并了， 所以没有造成对应的压力。 

fio --directory=/mnt --name fio_test_file --ioengine=libaio --direct=1 --rw=read --rate_iops=1 --bs=16k --size=200M --iodepth=1 --numjobs=1 --time_based --runtime=600 --group_reporting --norandommap

```

perf record -g result (libaio):

```ini
fio 319375 86964.196578:     250000 cpu-clock:pppH:
        ffffffff88355470 put_dec+0x0 (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff8835584b number+0x33b (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff8835ac9d vsnprintf+0x44d (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff8835afe2 sprintf+0x62 (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff87efc94c dev_show+0x2c (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff87efbc6c dev_attr_show+0x1c (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff87abac9b sysfs_kf_seq_show+0xab (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff87a2a7a3 seq_read_iter+0x123 (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff879f4c06 vfs_read+0x1f6 (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff879f59ff ksys_read+0x6f (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff88364360 do_syscall_64+0x60 (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff884000f3 entry_SYSCALL_64+0xb3 (/lib/modules/6.4.10-arch1-1/build/vmlinux)
                  103fdc read+0x4c (/usr/lib/libc.so.6)
                       0 [unknown] ([unknown])
```

perf record -g result (psync):

```ini
fio 324148 87167.271746:     250000 cpu-clock:pppH:
        ffffffff8835480c strlen+0xc (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff87a2990b seq_puts+0x1b (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff87aa94ee render_sigset_t+0x1e (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff87aa9c96 proc_pid_status+0x716 (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff87aa1e34 proc_single_show+0x54 (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff87a2a7a3 seq_read_iter+0x123 (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff87a2abe4 seq_read+0xd4 (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff879f4abc vfs_read+0xac (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff879f59ff ksys_read+0x6f (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff88364360 do_syscall_64+0x60 (/lib/modules/6.4.10-arch1-1/build/vmlinux)
        ffffffff884000f3 entry_SYSCALL_64+0xb3 (/lib/modules/6.4.10-arch1-1/build/vmlinux)
                  103fa1 read+0x11 (/usr/lib/libc.so.6)
                       0 [unknown] ([unknown])
```

## 观测

[[../iostat|iostat]] 
可以直接使用这个命令来观察磁盘的使用情况， 磁盘的使用率其实并不太准确，这个表示单位时间内cpu时间被io请求占用的时间。 

个别的 10ms 之上的IO请求的长尾现象是正常的， 这个无法避免。

关于长尾现象的说明： 

> 长尾请求一般是指明显高于均值的那部分占比较小的请求。  业界关于延迟有一个常用的P99标准， 也就是99%的请求延迟要满足在一定耗时以内， 1%的请求会大于这个耗时， 而这1%就可以认为是长尾请求。  
>
> Refer to:  https://zhuanlan.zhihu.com/p/35516682

