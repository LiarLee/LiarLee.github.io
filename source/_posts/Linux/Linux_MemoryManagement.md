---
title: Linux内存管理笔记
date: 2023-07-11 14:37:43
category: Linux
tags:
  - Linux
  - Memory
---

---
## 内存管理部分的笔记

### Crash命令的使用

使用这个命令需要有debuginfo 以及kernel debug 的数据包， 同时可能需要gdb。 

需要在配置文件里面开启这个 **仓库： rhel-8-baseos-rhui-debug-rpms**

具体的步骤也可以看这个文档， 来自Redhat 官方： https://access.redhat.com/solutions/9907

 ```bash
yum install -y kernel-debuginfo 
# 使用这个命令就可以安装， 但是尺寸非常的大。
crash /boot/vmlinuz-$(uname -a)
 ```

使用命令crash来进行 PM 和 VM的对应关系：

内核的debug文件在： /var/lib/debug/lib/modules/kernel-version/

 使用crash命令： 

```bash
~ # ❯❯❯ crash

crash 7.3.2-4.el8
Copyright (C) 2002-2022  Red Hat, Inc.
Copyright (C) 2004, 2005, 2006, 2010  IBM Corporation
Copyright (C) 1999-2006  Hewlett-Packard Co
Copyright (C) 2005, 2006, 2011, 2012  Fujitsu Limited
Copyright (C) 2006, 2007  VA Linux Systems Japan K.K.
Copyright (C) 2005, 2011, 2020-2022  NEC Corporation
Copyright (C) 1999, 2002, 2007  Silicon Graphics, Inc.
Copyright (C) 1999, 2000, 2001, 2002  Mission Critical Linux, Inc.
This program is free software, covered by the GNU General Public License,
and you are welcome to change it and/or distribute copies of it under
certain conditions.  Enter "help copying" to see the conditions.
This program has absolutely no warranty.  Enter "help warranty" for details.

GNU gdb (GDB) 7.6
Copyright (C) 2013 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.  Type "show copying"
and "show warranty" for details.
This GDB was configured as "x86_64-unknown-linux-gnu"...

WARNING: kernel relocated [592MB]: patching 107327 gdb minimal_symbol values

      KERNEL: /usr/lib/debug/lib/modules/4.18.0-477.13.1.el8_8.x86_64/vmlinux  [TAINTED]
    DUMPFILE: /proc/kcore
        CPUS: 2
        DATE: Tue Jul 11 17:07:01 CST 2023
      UPTIME: 01:04:34
LOAD AVERAGE: 0.15, 0.03, 0.01
       TASKS: 226
    NODENAME: center
     RELEASE: 4.18.0-477.13.1.el8_8.x86_64
     VERSION: #1 SMP Thu May 18 10:27:05 EDT 2023
     MACHINE: x86_64  (2199 Mhz)
      MEMORY: 7.9 GB
         PID: 7657
     COMMAND: "crash"
        TASK: ffff9ce7d835a800  [THREAD_INFO: ffff9ce7d835a800]
         CPU: 0
       STATE: TASK_RUNNING (ACTIVE)

crash> vm -p [pid]

PID: 913      TASK: ffff9ce7c75fd000  CPU: 0    COMMAND: "sshd"
       MM               PGD          RSS    TOTAL_VM
ffff9ce7c11b8000  ffff9ce7c75ae000  7604k    76644k
      VMA           START       END     FLAGS FILE
ffff9ce7c759f828 55a7fcc7b000 55a7fcd4c000 8000875 /usr/sbin/sshd
VIRTUAL     PHYSICAL
55a7fcc7b000  12026b000
55a7fcc7c000  1201df000
55a7fcc7d000  1201ec000
55a7fcc7e000  1200c7000
55a7fcc7f000  120c43000
55a7fcc80000  10fa79000
55a7fcc81000  11fdd3000
55a7fcc82000  11087f000
55a7fcc83000  11fa8d000
55a7fcc84000  10fe05000
55a7fcc85000  110870000
55a7fcc86000  10fa2c000
55a7fcc87000  10f9fc000
55a7fcc88000  10fdab000
55a7fcc89000  11f296000
55a7fcc8a000  1117ec000
55a7fcc8b000  10fdac000
55a7fcc8c000  120c65000
55a7fcc8d000  12011b000
55a7fcc8e000  110714000
55a7fcc8f000  110c83000
55a7fcc90000  110c90000
55a7fcc91000  110d2b000
55a7fcc92000  120730000
55a7fcc93000  12076f000
55a7fcc94000  1207e8000
55a7fcc95000  110c2f000
55a7fcc96000  110c3c000
55a7fcc97000  120650000
55a7fcc98000  1206c1000
55a7fcc99000  120c67000
55a7fcc9a000  120c0f000
55a7fcc9b000  FILE: /usr/sbin/sshd  OFFSET: 20000
55a7fcc9c000  11d46d000
55a7fcc9d000  10fe01000
55a7fcc9e000  10fdb9000
55a7fcc9f000  10fde7000
55a7fcca0000  FILE: /usr/sbin/sshd  OFFSET: 25000
# 结果省略了后面的部分， 太长了。。 。。 


可以看到内存的映射关系， notmapped 表示没有被映射到物理内存的部分。 
一般来说 后面的三位是一样的， 如果是THP的话， 那么后面的五位是一样的。

这个vtop 可以直接查看里面保存的内容以及具体的映射关系。 
crash> vtop 55d5473fc000
VIRTUAL     PHYSICAL
55d5473fc000  (not accessible)

rd命令可以读取指定的内存虚拟地址之后的偏移量。
crash> rd 55d54879d000 100
rd: invalid user virtual address: 55d54879d000  type: "64-bit UVADDR"

```

超过内存申请容量的使用， 会导致 访问内存越界， 例如申请了1G的内存，但是尝试写入超出的数据量， 会导致数据写到后续不属于这个进程的空间上， 而这个时候内核会触发一个 segfault， 来终止这个进程。 

这个报错不是立刻发生的，可能确实会溢出一部分。

匿名页面 实际上是 mmap with MAP_ANONYMOUS flag映射出来的虚拟内存地址， 当需要第一次去写匿名页面的时候， 会将物理内存的地址映射到虚拟内存并将其中填0.

overcommit 0 可以所有的地址，   1 无限制，虚拟内存没有限制， 2  按照一定的比例进行计算， 最终的结果。 
