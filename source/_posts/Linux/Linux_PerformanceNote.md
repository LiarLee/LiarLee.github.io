---
title: Linux性能调优笔记
date: 2020-08-20 17:50:39
categories: Linux
tags: Linux, Perf
---

应该是一个性能调优的书的笔记， 记不清了， 存货了属于是。

# Linux的性能调优

## CPU性能释放

### Process生命周期

1. 建立一个新的进程, 表示为父进程， 父进程进入Wait状态。
2. 父进程Fork()系统调用出来的一个子进程。
3. 子进程调用exec()对操作进行执行。
4. 子进程执行结束退出exit()。
5. 子进程变为Zombie进程。
6. 等待父进程回收，更新父进程的运行状态。

### 进程与线程

线程是可以在同一个进程下并发执行的执行单位，他们共享相同的地址，数据和运行空间。线程也叫做（LWP） - 轻量的进程。两者的区别在于，进程在同一个CPU上不能并发执行，且两个进程间不是共享资源的方式进行数据处理的。其他的地方， 进程和线程并无太大的区别，Linux的内核将使用一直的Manner对进程和线程进行调度和处理。

There are several thread implementations avaliable in linux operation system.

1. Linux threads

   传统的Linux进程

2. Native POSIX thread library

   内核 2.6 以后由红帽开发的进程模型。

3. Next Generation POSIX Thread

   IBM开发的新的进程模型。

   Note：Linux系统中的**环境变量 LD_ASSUME_KERNEL** 。 

### 进程优先级

1. 优先级(控制调度的先后顺序): 优先级的范围是： 0 - 139。
2. Nice值(控制运行时间的长短): 每个进程的nice值，19 到 -20 ，nice值越大 分配的时间越长。19最低 ， -20最高。默认的nice值是0。

### 进程上下文切换

每一个进程有独立的数据存储，当多个进程在同一颗CPU切换时，内核会对进程需要的数据空间进行重定向，这个行为叫做上下文切换。Context Swtiching，负责进程的上下文切换以及调度。在多个进程切换的过程中， 每次切换都会**触发一次上下文的切换**，是导致性能下降的主要原因。

### 中断

CPU的终端控制通常由 硬中断 和 软中断为主， 硬中断通常见于硬件设备，鼠标键盘网卡硬盘设备。软中断常见于TCP/IP协议操作，SCSI协议操作。

**Note：** 中断的信息显示在： `/proc/interrepts`。

**Note：**在多个CPU的系统中，可以将**中断集中绑定在某一颗物理的CPU上**，可以有效的改善系统的性能。

### 进程的状态

1. RUNNING（正常的进程）
2. STOPPED（已经停止的进程）
3. UNINTERREPTIBLE（Disk I/O）
4. INTERREPTIBLE（Keyboard I/O）
5. ZOMBIE（只能通过结束或重启父进程来回收僵尸进程）

### 进程的内存空间

进程的内存地址空间：(由顶至低顺序为)Text Segment， Data Segment，Heap Segment， Stack Segment

1. Text Segment ： 存储进程可执行代码的部分，只读模式。
2. Data Segment： 包括三个部分
   - Data： 数据片段， 初始数据的存储，例如静态变量。
   - BSS：填零数据的存储。数据初始化为0。
   - Heap（堆内存）： malloc()按需分配的动态内存，堆内存向更高的地址发展。
3. Stack Segment： 栈内存。存储本地变量， 方法参数，方法返回地址。栈内存向更低的地址发展。

**NOTE：**可以使用命令`pmap`查看一个用户空间进程的地址分配情况。可以使用`ps`命令查看总的内存分配情况。

### CPU的NUMA Node

1. 一颗物理CPU 8逻辑核，两个NUMA节点。

2. 4CPU为一组， 在同一个NUMA节点中。

3. HT技术提供了一个物理两个逻辑CPU。

   - 在 1 情况下，一般不触发跨越NUMA节点的负载均衡，除非子节点过载。
   - 在 2 情况下，提供了调度器tick的 时间调度 和 时间片 调度。
   - 在 3 情况下， 提供调度器tick时间的负载均衡调度。

---

## 内存性能

Linux内存的结构

### 物理内存

物理的内存的分配分别有32位和64位的不同，

- 32位系统中只能Linux内核可以直接管理的内存空间只有第一个 1 GB（扣除预留的部分只有896M） ， 剩下的空间需要映射到前面的1GB空间中。这种映射会使性能下降，但是对于应用程序来说是透明且无感的。
- 64位系统中将ZONE-NORMAL的区域扩展到了64GB - 128GB， 就不需要这种映射操作了。

### 虚拟内存

虚拟内存的地址布局

- 32位架构中，一个进程可以使用的虚拟内存的空间最大只能有4GB。内存被分为了 3GB的用户空间和1GB的内核空间。
- 64位架构中完全没有这种限制，每个进程都可以使用全部的内存空间。

### 虚拟内存的管理

物理内存通常对于应用或者用户是不可见的，Linux**内核**会将**任何内存自动映射到虚拟内存**。

应用**不直接使用物理内存**而是向内核申请一个**确切空间的虚拟内存映射**，并在虚拟内存中接收并处理内存的映射关系。

并且，**虚拟内存**不是必须映射到物理内存，还可以映射到在硬盘子系统中的**Swap文件**。

应用通常也不直接写入硬盘子系统，而是写入数据到Cache/Buffer中。pdflush内核线程在合适的时间负责将Cache和Buffer中的数据刷写到硬盘。

Linux虚拟内存管理器分配全部的未使用虚拟内存作为磁盘的cache，其他的操作系统只使用内存中的一部分。

同样的，交换的空间的管理同样也是如此，事实上交换空间占用程度并不代表系统的瓶颈所在，相反证明了linux系统资源调度上的高效。

### 页帧的分配 - 内存分页

1. Page - 页是在物理内存（Page Frame） 或者 虚拟内存中的连续线性地址空间。
2. Linux通过控制页单元来控制内存的分配，一页的大小是 4Kb。
3. 内核了解那些分页是可用的，以及他们的确切位置。

### Buddy System

Linux使用这种机制来进行空闲页的管理和维护，并对申请进行分配，始终试图保持内存分页的连续性。当内存的分配失败的时候，会内存的页帧回收。

### Page Frame Reclaiming

当所有的页已经处于不可用的状态（unavalible）,会触发内存的回收机制，将暂时不在使用中的，或者在使用中但是优先级低的内存重新分配，这种机制叫做内存回收。内核线程`pswapd`和内核函数try_to_free_page()负责执行这个动作。

---

## 文件系统

Linux可以支持多种多样的文件系统，这得益于内核的VFS技术，VFS是介于用户进程和文件系统之间的抽象层。由于VFS的存在，那么用户进程无需知道文件系统的类型，就可以直接进行文件系统的使用。

用户进程调用文件系统的流程：

User Process --> System Call --> VFS --> Variety of supported file system

日志：

### Ext2

简单的文件系统，无日志记录

Ext2 文件系统（BlockGroup）结构：

- SuperBlock： 存储信息，在每一个BlockGroup的前面都有一个SuperBlock。

- BlockGroupDesciptor： 存储BlockGroup的信息。

- Data Block Bitmaps： 空闲的数据块管理。

- i-node Bitmap： 空闲的Inode管理

- i-node Tables： inode的table存储位置。记录了文件的基本信息，例如： uid，gid, atime, ctime, mtime, dtime,指向数据块的位置。

- Data blocks: 实际用户数据的存储位置。

  文件系统查找文件的过程： 先在/下查看inode信息，查看所找文件的信息，按照路径持续查找，直到找到了文件的inode信息，通过inode提供的信息去数据块读取数据。

### Ext3

ext3文件系统是ext2 的升级版，主要的变更是支持了文件系统的日志，

ext3支持的日志模式有三种：

1. journal - 全量记录，数据也元数据都通过日志记录。
2. Ordered - 只有元数据会记录日志。
3. Writeback - 记录了元数据的操作，无法保证数据的一致性，突然终止会导致旧数据的出现。

### Xfs

xfs是新一代的日志文件系统，性能和稳定性都不错。其他资料待补全。

---

## IO子系统

进程是如何使用IO子系统进行数据交换的？

- 进程通过write()系统调用，请求一个文件的写入。
- 内核更新Pagecache映射到文件。
- pdflush内核线程处理pagecache到硬盘。
- 文件系统层将每个Blockbuffer组成一个Bio结构，提交和写入到块设备层。
- 块设备层得到上层的请求，执行IO电梯算法操作将数据推入写入队列。
- 存储驱动接管并执行写入。
- 硬盘硬件设备执行写入到盘片。

关于缓存(cache)?

由于CPU和硬盘的速度差距太大，因此需要缓存来进行临时的数据存储。

速度递减的结构是：

CPU --> cache --> RAM --> Disk

### 块层 Block Layer

关键的数据结构就是bio结构，bio结构是一种接口，存在于 文件系统层 和 块层之间。

bio就是将相邻的block buffer块整合到一起，发送bio到块层。

### 块大小

直接影响服务器性能的设置。如果需要存储的文件尺寸比较大，那么设置大的blocksize性能更好。

### IO电梯算法

- Anticipatory
- CFQ
- BFQ
- Deadline
- MQ-deadline
- NOOP
- NONE

### 存储驱动

1. SCSI
2. RAID

---

## 网络子系统

```
netstat -n | awk '/^tcp/ {++S[$NF]} END {for (a in S) print a, S[a]}'
# 查看所有的连接状态
```

当一个应用需要发送网络数据流程：

1. 应用打包自己的数据。
2. 应用通过套接字接口写入数据。
3. socket buffer用于处理需要被发送的数据。缓冲区引用了数据，并贯穿所有的层。
4. 在每个层中，执行相应的操作，例如数据的封包，添加数据的报文首部。
5. 从网卡的物理接口发出。
6. 以太网帧抵达对端的网卡接口。
7. 如果MAC地址匹配对端网卡的地址，数据帧移动到物理网卡的Buffer。
8. 移动数据包到socket buffer中，同时发出一次CPU硬中断。
9. 数据包逐层解包，直到抵达可以解释的应用层。

---

通过/proc/sys/net目录可以进行网络子系统的调优。

​	/proc/sys/net/core/rmem_max
​	/proc/sys/net/core/rmem_default
​	/proc/sys/net/core/wmem_max
​	/proc/sys/net/core/wmem_default
​	/proc/sys/net/ipv4/tcp_mem
​	/proc/sys/net/ipv4/tcp_rmem
​	/proc/sys/net/ipv4/tcp_wmem

### Network API(NAPI)

NAPI是一种新的网络处理方式，每次对数据包的操作都会触发系统中断，新的方式使用的是poll的方式。

NAPI 是 Linux 上采用的一种提高网络处理效率的技术，它的核心概念就是不采用中断的方式读取数据，而代之以首先采用中断唤醒数据接收的服务程序，然后 POLL 的方法来轮询数据，

https://www.ibm.com/developerworks/cn/linux/l-napi/

### Netfilter

Linux有使用了内核的Netfilter模块，可以通过Iptables进行管理和控制。

Netfilter提供了默认的集中功能：

1. 通过匹配规则，进行网络数据包的过滤。
2. 通过匹配规则，提供修改数据包地址信息。

---

Netfilter可以使用的过滤属性有；

- 􏰀  Network interface
- 􏰀  IP address, IP address range, subnet
- 􏰀  Protocol
- 􏰀  ICMP Type
- 􏰀  Port
- 􏰀  TCP flag
- 􏰀  State

---

Prerouting -- Routing -- Forward -- Postrouting

​						  -                              -

​           			 Input                     Output

---

Netfilter可以使用执行的操作有：

- ACCEPT
- DROP
- REJECT
- LOG
- MASQUERADE, SNAT, DNAT, REDIRECT

Netfilter可以检测的状态；

- NEW

- ESTABLISHED

- RELATED

- INVALID

  还可以单独使用独立的模块用来进行分析和过滤相关的数据包。

### TCPIP

connection establishment - 连接维持，在应用的数据被传送之前，TCP一直属于维持的状态，创建连接的时候叫做三次握手。断开连接的时候进行四次挥手。

三次握手：

1. 客户端发布SYN数据包，请求对端连接。
2. 服务端收到SYN，回复SYN+ACK
3. 客户端发布ACK，开始维持连接。

四次挥手：

1. 客户端 发送 FIN
2. 服务端发送ACK
3. 服务端发送 FIN
4. 客户端发送 ACK

---

TCPIP流量控制

1. 滑动窗口： 双方协商传输数据包大小。

负载

1. 校验和offload

   用于校验数据的字段计算的负载。

2. TCP段Offload（TSO）

   用于计算大于MTU的数据包的消耗。

网卡聚合： Bonding module

网卡的聚合可以将多个网卡绑定为一个物理网卡使用， Windows下叫做 Teaming。能够提供比较初级的负载均衡和容错。**可以直接提高系统的性能表现。**

# 性能指标

在调试系统之前，需要了解的是相关性能指标的含义，由于是开源的系统，所以可用的工具多种多样，但是监控的指标是一致的。

## CPU性能指标

- CPU使用率 - 每一颗处理器的利用率，直观的指标。
- User Time： CPU运行在用户空间的时间，包括Nice Time，运行在用户空间的时间**越长越好**。
- System Time： CPU用于处理内核级别操作的时间，包括IRQ和Softirq time。维持在较高的水平说明系统的瓶颈可能是网络或者驱动栈。通常情况下，内核时间**越短越好**。
- Waiting： 等待IO的时间。类似*Blocked*的数值，等待的时间**越短越好**。如果太多时间花在等待IO，你需要排查IO子系统的性能。
- Idle Time： 系统的等待任务的空闲时间，描述CPU空闲的**百分比**。
- Nice Time： CPU**百分比**，重新分配进程Nice值所占的百分比。
- Load Average： Rolling average of the sum of the followings: 
  1. 进程队列等待被执行的数量。
  2. 不可中断任务等待被完成的数量。（IO操作的进程）

- Runable Processes：描述准备执行的进程，在持续的时间中**不应该超过物理CPU核心数量的10倍**。超过就是CPU瓶颈。
- Blocked： 等待IO完成的进程，直接指向IO瓶颈。

- Context Switch： 表示大量的线程切换，数值过高且大量系统中断可能代表了**信号驱动或应用问题**。这个参数通常**不期望过高**，因为CPU的缓存应该可以处理进程间切换的数据，但是**某些是必要的**。
- Interrupts： 中断的值包括硬中断和软中断，硬中断更不利于系统的性能释放，高中断值是**软件瓶颈**的迹象，同时也存在于**内核 或 驱动**。 要注意的是 CPU的中断值可能是包括CPUclock导致的。

## 内存指标

- Free Memory： 和其他的操作系统来进行比较，Linux的内存使用量不是主要的关心指标，因为Linux内核采用的虚拟内存管理器，会将未使用的内存作为文件系统的cache，所以，减除Buffers和Cache才是真正未使用的内存量。 Free = Used - Buffer - cache
- Swap Usage： 交换空间的使用量，使用量不是主要的指标，相比较更应该查看**Swap IN/OUT**，才可以看出是否为内存瓶颈。**数值在200-300+ page/s** 并且**状况持续**才说明是内存的瓶颈。

- Buffer and Cache:  Cache分配给文件系统和块设备缓存。？ 块设备被写入之前和成Bio结构的时候使用的buffer空间？
- Slabs： 内核使用的内存空间。值得注意的是内核的Pages不能被Pageout到硬盘。
- Active versus Inactive Memory： **提供数据的内存空间**叫做活动内存。未活动的内存类似于候选，**等待被kswapd进程交换到硬盘**。

## 网络指标

- Packets Received and sent : 数据包的发送量和接收量。关于网络的状况。
- Bytes Received and sent： 数据字节数的发送量和接收量。
- Collisions per second： 数据包冲突的数量。一般来讲不是服务器的问题，是网络设备的问题，常见的是在Hub网络中。
- Packets Dropped： 内核丢弃的数据包，通常情况下和防火墙规则以及网络缓冲区溢出有关，默认较少。
- Overruns: 展示了缓冲区溢出的次数。 结合 Packets Dropped来分析可能的瓶颈，缓冲区 或者 网络数据队列长度。
- Errors： 数据包错误。网络数据无法完成校验或者网线的损坏。

## 块设备指标

- IOwait ： IOwait表示CPU在等待IO操作的完成，**持续的数值偏高说明是IO的瓶颈**。
- Average queue length： 大量IO请求未完成，通常情况下**在 2 - 3 之间是最佳的值**。 如果高于说明是IO瓶颈。
- Average Wait： 从请求到得到服务的平均时间。包括队列等待的时间和请求执行的时间。

---

# 观察性能的工具

1. top

   通过top命令可以查看所有的进程， 观察使用CPU高的进程，可以kill命令停止它；或者观察TIME过低的进程，使用renice命令提高进程在CPU上的调度时间。

   常用的命令：

   t  -- 显示Summary信息。关闭或者不同的风格

   m -- 显示内存的信息。 关闭或者使用不同的风格。

   A -- 显示多种不同的参数来观察进程。 Def ， Job ， Mem， Usr， 四个维度；默认， 任务，内存， 用户。

   f -- 交互式配置界面。

   o -- 交互式的选择排序方式。

   r -- renice

   k -- kill

2. [[Linux_vmstat|Linux_vmstat]]

3. uptime OR w

   观察系统的负载状况和当前登陆到系统的用户。 三个load average的值，1 5 15 分钟的系统负载情况， 主要是观察状况， 前面介绍了 ， 计算的方式是**CPU任务队列长度** 和 **不可中断进程的数量（IO操作的影响）**。

4. ps OR pstree

   观察系统进程的列表和系统进程列表树状图。

   在ps -elFL命令中，有几个不常用的列 ： 

   - WCHAN： 休眠中的进程使用的内核函数名称。 - 表示进程正在运行；* 表示进程有多线程或者ps无法详细显示。
   - RSS ： 常驻内存集。进程使用的非交换物理内存。单位是： KB
   - PSR： 进程运行所在的CPU编号。

5. free

   free命令是查看内存的详细信息使用。

   free的命令在最新的操作系统已经直观的显示内存的每个参数及细节。直接能看懂了， 老版本看 used下的Buffer/Cache行数值，即使已经使用的内存；看free下的Mem行， 即使未使用的内存值。其余直接查看即可。

6. 

CPU整合的不同架构：

NUMA，SMP，MPP的概念：

https://www.cnblogs.com/yubo/archive/2010/04/23/1718810.html

# 调优方法

## 安装的考虑

安装系统之前就应该考虑做什么使用， 采用什么样的配置，CPU（数量），内存（大小， 多通道），硬盘（容量，RAID），网络（带宽，是否聚合，是否需要Binding）等等问题。

通过这些考虑可以避免很多后续的问题。

1. 收集配置
   - dmesg
   - ulimit
   - 关闭不用的守护进程
   - 改变Runlevel
   - 是否需要SELinux
   - 是否需要编译内核

---

## 更改内核参数

1. 系统的内核参数在/proc/sys目录下，有如下的几个方面：

   - vm
   - net
   - fs
   - abi
   - Kernel

   可以通过sysctl命令进行调节， 也可以写入配置文件/etc/sysctl.conf

## 进程子系统

### SMT结构

1. 更改进程的优先级renice，使业务进程更多的得到CPU cycle。
2. 变更系统的中断处理，一般有两种方式，一种是将中断绑定给一颗物理CPU集中处理。还有一种是让物理CPU自动控制中断。

### NUMA结构

1. 使用numactl软件包中的numastat来查看NUMA节点的状态。
2. 如果numa_miss 的数值过高，考虑使用NUMA节点的亲和调节或者renice进程的数值。
3. 

## 内存子系统

### 内核行为

1. vm.swappiness的调整

   内存交换的频度

   - 设置为0 ， 如果内存没有耗尽就不使用交换分区。
   - 设置为100，积极的使用交换分区。

2. vm.dirty_background_ratio

   脏数据回写到硬盘的比例，按照百分比设置，触发pdflush内核进程的回写。

### 交换分区

Linux推荐使用多个硬盘，每个硬盘上建立交换分区，Linux会自动调度不同的交换分区来合理的使用空间。可以在/etc/fstab文件中进行交换分区的配置，可以调整优先级，使系统优先使用某几个分区。 (32767 is the highest and 0 is the lowest).

```bash
/dev/sda2	swap	swap sw 	0 0
/dev/sdb2	swap	swap sw 	0 0

/dev/sda2	swap	swap sw,pri=1 	0 0
/dev/sdb2	swap	swap sw,pri=3 	0 0
```

### hugeLTBfs

该值对 虚拟机 和 数据库 这种需要使用大量的内存空间的应用 是非常有用的参数。

/proc/sys/vm/nr_hugepages 设置HugePages的容量。

cat /proc/meminfo | grep huge  查看相关的信息。

如果应用需要使用Hugepage，可以使用文件系统挂载的方式。

```shell
mount -t hugetlbfs none /mnt/hugepages
```

## 硬盘子系统

### 安装的考量

1. 是否需要Raid ，如何组建Raid， 硬件Raid或者软件Raid。
2. 硬盘的性能计算。IOs PerSecond * 4kB = 800kB

### 分区的规划

分区的规划， 规则和细节见： FHS

### 内核调度算法

常见的调度算法：

- Anticipatory

- CFQ

- BFQ

- Deadline

- MQ-deadline

- NOOP

- NONE

  硬盘的调度算法可以单独设置某个硬盘，也可以在系统启动的内核参数重设置。

  Cat /proc/block/sda/queue/schedular 查看sda的调度算法。

  elevator=noop 在Grub启动配置内核文件的行中添加。

### 文件系统

1. 文件系统的日志记录模式

   ```shell
   /dev/sdb1 /testfs ext3 defaults,data=writeback 0 0
   ```

2. 文件系统的块大小

