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

使用命令crash来进行 PM 和 VM 的对应关系：

内核的 debug 文件在： /var/lib/debug/lib/modules/kernel-version/

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

### GDB 调试工具的使用记录
1. 首先写了一个这样的程序: 
```c
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {

    int *data;
    data = (int *)malloc(100 * sizeof(int)); // 分配 100 个 int 大小的内存块

    if (data == NULL) {
        // 内存分配失败的处理
        return 1;
    }

    //data[100] = 0;

    // 使用 data 数组...
    // 例如，初始化数组
    for (int i = 0; i < 100; ++i) {
        data[i] = 0; // 将每个元素初始化为 0
    }

    free(data);

    printf("%d\n", data[2]);
}
```

1. 编译这个程序. 
```shell
╰─>$ gcc ./123.c -g -Og
```
1. 运行需要调试的程序.
```shell
╰─>$ ./a.out
971012533
```
1. 尝试使用 gdb 调试.
```shell
╰─>$ gdb ./a.out -c ./123.c
```
#### 指令说明
- list -  list 指令会列出 10 行代码. 可以重复使用, 每10行一次.
```
(gdb) list
11	        return 1;
12	    }
13	
14	    //data[100] = 0;
15	
16	    // 使用 data 数组...
17	    // 例如，初始化数组
18	    for (int i = 0; i < 100; ++i) {
19	        data[i] = 0; // 将每个元素初始化为 0
20	    }

```
- b - break 设置断点. 例如:  `b 6` 添加断点在第六行
```
(gdb) b 18
Breakpoint 2 at 0x117d: file ./123.c, line 18.

```
- d - delete 删除断点.  例如:  `d 1` 删除需要的断点,也可以删除 watch point. 
```
(gdb) d 1

```
- disable - 禁用断点.
- enable - 启用断点.
- r - run , 运行程序, 到断点会停止. 
- i - info 查看信息. `info b` 断点信息. `info r` 寄存器信息.
```
(gdb) info b
Num     Type           Disp Enb Address            What
2       breakpoint     keep y   0x000000000000117d in main at ./123.c:18

(gdb) i r
The program has no registers now.

(gdb) i r
rax            0x3                 3
rbx            0x5555555592a0      93824992252576
rcx            0x5555555592a0      93824992252576
rdx            0x2                 2
rsi            0x190               400
rdi            0x5555555592a0      93824992252576
rbp            0x7fffffffe850      0x7fffffffe850
rsp            0x7fffffffe7b0      0x7fffffffe7b0
r8             0x1a0               416
r9             0x1                 1
r10            0x4                 4
r11            0x7ffff7f92b20      140737353689888
r12            0x1                 1
r13            0x0                 0
r14            0x7ffff7ffd000      140737354125312
r15            0x555555557dd8      93824992247256
rip            0x555555555173      0x555555555173 <main+26>
eflags         0x287               [ CF PF SF IF ]
cs             0x33                51
ss             0x2b                43
ds             0x0                 0
es             0x0                 0
fs             0x0                 0
gs             0x0                 0
k0             0x4                 4
k1             0x10004021          268451873
k2             0x0                 0
k3             0x0                 0
k4             0x0                 0
k5             0x0                 0
k6             0x0                 0
k7             0x0                 0
fs_base        0x7ffff7dad740      140737351702336
gs_base        0x0                 0

```
- s - step 单步, 进入下一个语句, 会执行进入函数内. 
  si - 汇编的下一条指令.
```

Breakpoint 2, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
(gdb) s
19	        data[i] = 0; // 将每个元素初始化为 0
(gdb) s

Breakpoint 2, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
(gdb) s
19	        data[i] = 0; // 将每个元素初始化为 0
(gdb) s

Breakpoint 2, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
(gdb) s
19	        data[i] = 0; // 将每个元素初始化为 0

```
- n - next 执行下一步语句, 不进入函数, 每语句执行. 
  ni - 汇编的下一个指令.
```
Breakpoint 13, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
(gdb) n
19	        data[i] = 0; // 将每个元素初始化为 0
(gdb) n

Breakpoint 13, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
(gdb) n
19	        data[i] = 0; // 将每个元素初始化为 0
(gdb) n

Breakpoint 13, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {

```
- p - print 打印变量的值. `p *data`
```
(gdb) p i
$2 = 9
(gdb) p data[i]
$3 = 0

```
- watch - 查看变量的变化. `watch i`
```
(gdb) watch i
Watchpoint 14: i
(gdb) info b
Num     Type           Disp Enb Address            What
13      breakpoint     keep y   0x000055555555517d in main at ./123.c:18
	breakpoint already hit 4 times
14      watchpoint     keep y                      i

```
- c - contiune, 继续执行直到下一次遇到 breakpoint. 
```
(gdb) c
Continuing.

Watchpoint 14: i

Old value = 9
New value = 10
0x0000555555555180 in main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
(gdb) c
Continuing.

Breakpoint 13, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
(gdb) c
Continuing.

Watchpoint 14: i

Old value = 10
New value = 11
0x0000555555555180 in main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {

```
- disp - 每次到断点的时候自动显示变量的值. 
```
// disp i 设置查看变量. 
// info disp 查看当前 disp 会显示哪些变量.
// del disp 1  删除 info disp 中展示的第一的变量.

// 添加追踪两个变量, 变量i  和 数组 *data 指针的值.
(gdb) disp i
1: i = 13
(gdb) disp *data
4: *data = 0

// 运行, 查看这次运行输出的数值. 后面又多来了几次. 
(gdb) c
Continuing.

Breakpoint 15, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
2: i = 20
4: *data = 0
(gdb) c
Continuing.

Breakpoint 15, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
2: i = 21
4: *data = 0
(gdb) c
Continuing.

Breakpoint 15, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
2: i = 22
4: *data = 0

```
- bt - backtrace 查看函数的堆栈.
```
(gdb) bt
#0  main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
(gdb) s
19	        data[i] = 0; // 将每个元素初始化为 0
1: i = 18

```
- f - frame 查看栈帧
  up - 查看上一个栈帧
  down - 查看下一个帧栈
```
(gdb) f
#0  main (argc=<optimized out>, argv=<optimized out>) at ./123.c:19
19	        data[i] = 0; // 将每个元素初始化为 0
(gdb) up
Initial frame selected; you cannot go up.
(gdb) down
Bottom (innermost) frame selected; you cannot go down.

```
- layout - 查看布局.
  layout src 可以展示源代码以及断点在源代码文件中的位置.
  layout asm 显示源代码的汇编结构. 
  layout regs 展示寄存器的结构.
  退出 layout 的方法是: Ctrl + X , a. 

- x - 查看内存空间, 以及解析其中的内容.
```c

(gdb) p data
$36 = (int *) 0x5555555592a0

(gdb) x /4w 0x5555555592a0
0x5555555592a0:	0x00000000	0x00000000	0x00000000	0x00000000

```
- whatis - 查看变量的类型. 
```c

(gdb) whatis data
type = int *

```
- search - 查找代码中的关键字. 
```c

(gdb) search for
18	    for (int i = 0; i < 100; ++i) {
(gdb) search printf
24	    printf("%d\n", data[2]);

```
- kill - 杀掉当前的进程.
```c
(gdb) k
Kill the program being debugged? (y or n) y
[Inferior 1 (process 4121) killed]

```
- ch - checkpoint 命令允许您保存程序的当前状态快照，并在以后的某个时刻返回到这个状态。这对于调试那些难以复现的错误特别有用，因为它可以让您在不重启程序的情况下回到错误发生之前的状态。
```

// 列出所有的checkpoint
(gdb) info ch
No checkpoints.

(gdb) c
Continuing.

Breakpoint 15, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
1: i = 11

// 添加一个新checkpoint 
(gdb) ch
checkpoint 1: fork returned pid 4596.

// 查看新添加的checkpoint
(gdb) info ch
* 0 Thread 0x7ffff7dad740 (LWP 4529) (main process) at 0x0
  1 process 4596 at 0x55555555517d, file ./123.c, line 18

// 删除添加的checkpoint 
(gdb) del ch 1
Killed process 4596
(gdb) info ch
No checkpoints.

// 继续运行.
(gdb) c
Continuing.

Breakpoint 15, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
1: i = 12

// 添加checkpoint
(gdb) ch
checkpoint 1: fork returned pid 4598.
(gdb) c
Continuing.

Breakpoint 15, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
1: i = 13
(gdb) c
Continuing.

Breakpoint 15, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
1: i = 14
(gdb) c
Continuing.

Breakpoint 15, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
1: i = 15

// 前进两步之后, 回退到之前的checkpoint.
(gdb) restart 1
Switching to Thread 0x7ffff7dad740 (LWP 4598)
#0  main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
(gdb) c
Continuing.

Breakpoint 15, main (argc=<optimized out>, argv=<optimized out>) at ./123.c:18
18	    for (int i = 0; i < 100; ++i) {
1: i = 13
// 可以看到 上面的 i 的数值恢复到了 13 , checkpoint 回滚了全部的代码, 或者说在 调试的过程中, 在特定的状态 fork 新的一个进程出来, 在需要的时候将状态切换到当前备份出来的新进程上. 

```