---
title: Sysctl 云平台参数的收集以及一部分解释
date: 2022-04-19 17:45:39
tags: Linux
category: Linux
---

一些关于sysctl参数设置的收集和解释。

<!-- more -->

# /etc/sysctl.d/00-defaults.conf

## kernel.printk
输出内核日志信息的级别。
```bash
# 映射到的proc文件系统位置 - /proc/sys/kernel/printk
# Maximize console logging level for kernel printk messages
kernel.printk = 8 4 1 7

# (1) 控制台日志级别：优先级高于该值的消息将被打印至控制台。
# (2) 缺省的消息日志级别：将用该值来打印没有优先级的消息。
# (3) 最低的控制台日志级别：控制台日志级别可能被设置的最小值。
# (4) 缺省的控制台：控制台日志级别的缺省值。
```
内核中共提供了八种不同的日志级别，在 linux/kernel.h 中有相应的宏对应。
```c++
#define KERN_EMERG  "<0>"   /* systemis unusable */
#define KERN_ALERT  "<1>"   /* actionmust be taken immediately */
#define KERN_CRIT    "<2>"   /*critical conditions */
#define KERN_ERR     "<3>"   /* errorconditions */
#define KERN_WARNING "<4>"   /* warning conditions */
#define KERN_NOTICE  "<5>"   /* normalbut significant */
#define KERN_INFO    "<6>"   /*informational */
#define KERN_DEBUG   "<7>"   /*debug-level messages */
```
## kernel.panic
设置内核的Panic之后自动重启
```bash
# Wait 30 seconds and then reboot
kernel.panic = 30
```
## neigh.default.gc
设置arp缓存相关的参数  
https://zhuanlan.zhihu.com/p/94413312
```bash
# Allow neighbor cache entries to expire even when the cache is not full
net.ipv4.neigh.default.gc_thresh1 = 0
net.ipv6.neigh.default.gc_thresh1 = 0

# Avoid neighbor table contention in large subnets
net.ipv4.neigh.default.gc_thresh2 = 15360
net.ipv6.neigh.default.gc_thresh2 = 15360
net.ipv4.neigh.default.gc_thresh3 = 16384
net.ipv6.neigh.default.gc_thresh3 = 16384

# gc_thresh1
存在于ARP高速缓存中的最少层数，如果少于这个数，
垃圾收集器将不会运行。
缺省值是128。
# gc_thresh2
保存在 ARP 高速缓存中的最多的记录软限制。
垃圾收集器在开始收集前，允许记录数超过这个数字 5 秒。
缺省值是 512。
# gc_thresh3
保存在 ARP 高速缓存中的最多记录的硬限制，
一旦高速缓存中的数目高于此，
垃圾收集器将马上运行。
缺省值是1024。
```

# /etc/sysctl.d/99-amazon.conf
## sched_autogroup_enabled
通过CFS分组提高了桌面环境的性能表现。这个小小的补丁仅为 Linux Kernel 增加了 233 行代码，却将高负荷下桌面响应最大延迟降低到原先的十分之一，平均延迟降低到六十分之一！该补丁的作用是为每个 TTY 动态地创建任务分组。(https://linuxtoy.org/archives/small-patch-but-huge-improvement.html)
```bash
# https://cateee.net/lkddb/web-lkddb/SCHED_AUTOGROUP.html
# https://www.postgresql.org/message-id/50E4AAB1.9040902@optionshouse.com
# This setting enables better interactivity for desktop workloads and not
# suitable for many server workloads.
# 启用后，内核会创建任务组来优化桌面程序的调度。它将把占用大量资源的应用程序放在它们自己的任务组，根据PostgreSQL的测试， 关闭这个选项会将数据库的性能提高30%（上面的Link）。 在后台的服务进程中是提高性能的选项。
# 0：禁止
# 1：开启

kernel.sched_autogroup_enabled=0
```

# /usr/lib/sysctl.d/00-system.conf
## bridge-nf-call-iptables
网桥设备关闭netfilter模块，开关需要按需求来指定。
关闭这个模块会在网桥2层可以转发的时候直接转发， 不会走三层进行数据传输，也就是说不会过Iptables。  
Kubernetes需要开启这个参数的原因是： https://imroc.cc/post/202105/why-enable-bridge-nf-call-iptables/， 修复了Coredns不定期解析失败的问题。
```bash
# Disable netfilter on bridges.
net.bridge.bridge-nf-call-ip6tables = 0
net.bridge.bridge-nf-call-iptables = 0
net.bridge.bridge-nf-call-arptables = 0
```

# /usr/lib/sysctl.d/10-default-yama-scope.conf
## yama
Yama is a Linux Security Module that collects system-wide DAC security protections that are not handled by the core kernel itself. This is selectable at build-time with CONFIG_SECURITY_YAMA, and can be controlled at run-time through sysctls in /proc/sys/kernel/yama  

https://www.kernel.org/doc/html/latest/admin-guide/LSM/Yama.html 
```bash
[root@ip-172-31-11-235 sysctl.d]$ cat 10-default-yama-scope.conf
# When yama is enabled in the kernel it might be used to filter any user
# space access which requires PTRACE_MODE_ATTACH like ptrace attach, access
# to /proc/PID/{mem,personality,stack,syscall}, and the syscalls
# process_vm_readv and process_vm_writev which are used for interprocess
# services, communication and introspection (like synchronisation, signaling,
# debugging, tracing and profiling) of processes.
#
# Usage of ptrace attach is restricted by normal user permissions. Normal
# unprivileged processes cannot interact through ptrace with processes
# that they cannot send signals to or processes that are running set-uid
# or set-gid.
#
# yama ptrace scope can be used to reduce these permissions even more.
# This should normally not be done because it will break various programs
# relying on the default ptrace security restrictions. But can be used
# if you don't have any other way to separate processes in their own
# domains. A different way to restrict ptrace is to set the selinux
# deny_ptrace boolean. Both mechanisms will break some programs relying
# on the ptrace system call and might force users to elevate their
# priviliges to root to do their work.
#
# For more information see Documentation/security/Yama.txt in the kernel
# sources. Which also describes the defaults when CONFIG_SECURITY_YAMA
# is enabled in a kernel build (currently 1 for ptrace_scope).
#
# This runtime kernel parameter can be set to the following options:
# (Note that setting this to anything except zero will break programs!)
#
# 0 - Default attach security permissions.
# 1 - Restricted attach. Only child processes plus normal permissions.
# 2 - Admin-only attach. Only executables with CAP_SYS_PTRACE.
# 3 - No attach. No process may call ptrace at all. Irrevocable.
#
kernel.yama.ptrace_scope = 0
```

# /usr/lib/sysctl.d/50-default.conf
## sysrq
是一个Magic Key的设置，无论内核当前在做什么都会立刻响应这个MagicKey。
```bash

#  This file is part of systemd.
#
#  systemd is free software; you can redistribute it and/or modify it
#  under the terms of the GNU Lesser General Public License as published by
#  the Free Software Foundation; either version 2.1 of the License, or
#  (at your option) any later version.

# See sysctl.d(5) and core(5) for for documentation.

# To override settings in this file, create a local file in /etc
# (e.g. /etc/sysctl.d/90-override.conf), and put any assignments
# there.

# System Request functionality of the kernel (SYNC)
#
# Use kernel.sysrq = 1 to allow all keys.
# See http://fedoraproject.org/wiki/QA/Sysrq for a list of values and keys.
kernel.sysrq = 16

When running a kernel with SysRq compiled in, /proc/sys/kernel/sysrq controls the functions allowed to be invoked via the SysRq key. Here is the list of possible values in /proc/sys/kernel/sysrq:

    0 - disable sysrq completely
    1 - enable all functions of sysrq
    >1 - bitmask of allowed sysrq functions (see below for detailed function description):
        2 - enable control of console logging level
        4 - enable control of keyboard (SAK, unraw)
        8 - enable debugging dumps of processes etc.
        16 - enable sync command
        32 - enable remount read-only
        64 - enable signalling of processes (term, kill, oom-kill)
        128 - allow reboot/poweroff
        256 - allow nicing of all RT tasks
# 触发的方式
- echo t > /proc/sysrq-trigger
- You press the key combo Alt+SysRq+<command key>.
```

## core_uses_pid
```bash
# Append the PID to the core filename
# DEBUG相关的功能，如果这个文件的内容被配置成1，即使core_pattern中没有设置%p，最后生成的core dump文件名仍会加上进程ID。 
kernel.core_uses_pid = 1
```

## kptr_restrict
```bash
# 查看内核地址符号的命令： cat /proc/kallsyms
# https://bugzilla.redhat.com/show_bug.cgi?id=1689344
kernel.kptr_restrict = 1
# 0 所有用户都可以查看内核的地址空间输出信息
# 1 只有root用户可以，其他用户看到的都是0
# 2 所有的用户都不可以，输出的结果都是0

# Other Link: https://blog.csdn.net/qq1602382784/article/details/80066847
```

## rp_filter
rp_filter参数用于控制系统是否开启对数据包源地址的校验。
```bash
# Source route verification
net.ipv4.conf.default.rp_filter = 1
net.ipv4.conf.all.rp_filter = 1
两个参数之中有一个是1， 那么这个功能就是启用的
- 0：不开启源地址校验。
- 1：开启严格的反向路径校验。对每个进来的数据包，校验其反向路径是否是最佳路径。如果反向路径不是最佳路径，则直接丢弃该数据包。
- 2：开启松散的反向路径校验。对每个进来的数据包，校验其源地址是否可达，即反向路径是否能通（通过任意网口），如果反向路径不同，则直接丢弃该数据包。
```

## accept_source_route
指允许数据包的发送者指定数据包的发送路径，以及返回给发送者的数据包所走的路径。
```bash
# Do not accept source routing
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.accept_source_route = 0
```

## promote_secondaries
down掉所属某个子网的primary ip的时候， 所有相关的secondary ip也会down掉,启用的时候，当primary ip宕掉时可以将secondary ip提升为primary ip。 
```bash
# Promote secondary addresses when the primary address is removed
net.ipv4.conf.default.promote_secondaries = 1
net.ipv4.conf.all.promote_secondaries = 1
```

## protected_links
fs.protected_hardlinks 	用于限制普通用户建立硬链接  
- 0：不限制用户建立硬链接  
- 1：限制，如果文件不属于用户，或者用户对此用户没有读写权限，则不能建立硬链接  

fs.protected_symlinks 	用于限制普通用户建立软链接  
- 0：不限制用户建立软链接  
- 1：限制，允许用户建立软连接的情况是 软连接所在目录是全局可读写目录或者软连接的uid与跟从者的uid匹配，又或者目录所有者与软连接所有者匹配  
```bash
# Enable hard and soft link protection
fs.protected_hardlinks = 1
fs.protected_symlinks = 1
```

# /usr/lib/sysctl.d/9-ipv6.conf
关于IPv6地址重复的问题。  
In case DAD does find a duplicate address, the address we tried to set is deleted (and in the syslog you see a message like this: "eth0: duplicate address detected!"). In such a case, a sysadmin needs to configure an address manually.
```bash
net.ipv6.conf.all.accept_dad=0
net.ipv6.conf.default.accept_dad=0
net.ipv6.conf.eth0.accept_dad=0
```





## Case Update
1. tcp_tw_recycle（Before 4.12 available）
   net.ipv4.tcp_timestamps 这个参数开启的时候， 才会生效，可以快速回收处于TIME_WAIT状态的socket。当tcp_tw_recycle开启时（tcp_timestamps同时开启，快速回收socket的效果达到），对于位于NAT设备后面的Client来说，是一场灾难。
   https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=4396e46187ca5070219b81773c4e65088dac50cc 
   这个参数在2017年之后的内核已经不存在了， 开发者的Blog https://vincent.bernat.ch/en/blog/2014-tcp-time-wait-state-linux
   内核彻底移除这个参数的版本是 4.12 ， 如果内核的版本是4.12 之后，这个问题就不存在了。
   对于NAT后端的多个实例之间，如果有时间的差距会导致另一个实例收到的报文的Timestamp是之前一个时间点的，这个时候会认为这个请求是来自之前的某个请求的返回。 然而其
   实是因为时间的原因， 并且这个请求是一个新的请求，由于时间的原因被识别成了旧的请求。
   这个配置对 Incomming 和 Outgoing的tcp连接都会生效。由于网络的设计是默认不相信可靠的， 所以在TCP的最后进行等待，这样会导致大量的TIME_WAIT， 而这些TIME_WAIT其实是已经不用的， 但是由于无法获得ACK因此无法释放。

2. tcp_tw_reuse 
    http://lxr.linux.no/#linux+v3.2.8/Documentation/networking/ip-sysctl.txt#L464
     这个配置只是对客户端生效。也就是说， 客户端发起了FIN之后， 只要客户端收到服务端的FIN， 后续的网络报文已经不再继续关注了。 这样客户端的TIME_WAIT就会下降， 提高了客户端的Timewait的利用率，减少了客户端TW连接的数量。可以提高客户端的并发请求数量。 
    这个配置参数只对 Outgoing 的参数生效。
    NOTE： 现在这个选项支持3个参数，0 关闭， 1 开启 ，2 只对回环开启。