---
title: 完全隔离CPU的方法 
date: 2022-10-11 13:05:26
categories: Linux
tags:
  - Linux
  - CPU
---

完全隔离CPU， 并排空CPU所有的进程，分配指定的任务到CPU上。

1. 当前的情况下， 我有CPU 0 - 3， 我希望隔离出CPU3 来进行指定的任务运行（方法是传递内核参数并重启）
```bash
vim /etc/default/grub

GRUB_CMDLINE_LINUX='................isolcpu=3 nohz_full=3'

grub2-mkconfig -o /boot/grub2/grub.cfg
sync && systemctl reboot
```

2. 重启之后，CPU3 就已经从CFS的调度列表上面拿掉了， 可以通过如下的参数证明。
```bash
# 查看设置是否已经正确的生效， 分离的CPU会表示为序号， 一般是： 0-2 ， 3 。 这两种表示方式。
cat /sys/devices/system/cpu/isolated
3
cat /sys/devices/system/cpu/nohz_full
3
```

3. 关于nohz_full这个参数， 需要编译内核的时候就启用这个功能。
```bash
# 需要启用的参数如下：
CONFIG_NO_HZ_COMMON=y
CONFIG_NO_HZ_FULL=y
CONFIG_NO_HZ=y
```
这部分的内容还包括的Kernel的Tickless等等知识， 这个部分的内容我在Redhat的文档中有看到。但是文档比较旧了， 这个设置是基于Redhat 7 版本的说明， 可能现在有更好的方法，我不太确定。

4. 重启之后， CPU3上面已经完全不会有用户空间的进程被调度上去了，同时， 由于已经配置了NOHZ的参数，CPU3 上面也不会有Kernel Timer Interrept触发，因此也少了一部分中断。

5. Redhat的文档中定义了如下的方式进行验证， 我直接抄下面的内容了。
> 关于如何验证Cpu隔离的文档： https://access.redhat.com/solutions/3875421
> 配置隔离CPU的方法已经确认功能是否激活的方法：https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/monitoring_and_managing_system_status_and_performance/index
```bash
perf stat -C 1 -e irq_vectors:local_timer_entry taskset -c 3 sleep 3
```
先记录这么多吧， 这个功能用到的地方实在是有限，基本上不怎么需要。并且需要知道是现在已经不怎么需要使用这个工具进行调优了， Redhat有 Tuned 守护进程， 可以通过默认的profile对OS进行调优。
