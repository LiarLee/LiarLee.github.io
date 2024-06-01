---
title: Iostat 参数说明
category: Linux
date: 2023-12-22 12:44:27
tags:
  - Linux
---

> iostat - Report Central Processing Unit (CPU) statistics and input/output statistics for devices and partitions.

指标的解释说明如下： 
- **rrqm/s - wrqm/s**  两个看的是的merge的请求数量， 表示发送给驱动程序并被驱动程序合并的请求数量，表示有没有进行合并，这也表示系统将随机IO请求合并成连续以提高性能。 
- **r/s - w/s**  IO读写的请求数量IOPS， 发送给磁盘设备的请求数。
- **rKB/s - wKB/s** 吞吐量， 可以使用 -m 转换成MB/s， 设备的传输数据量的吞吐量信息。 
- **avgrq-sz**  平均请求大小， 也就是IO size 的大小。单位是扇区（512B）。
- **rareq-sz -  wareq-sz** 新版本的iostat已经是这两个指标了， 这两个指标单位是 KB.
- **avgqu-sz**  在驱动队列和设备队列中或活跃的平均请求数量。 单位是 个。
- **await** 这个指标记录的总的延迟， 新的版本也包括 rw 两类请求的延迟。 延迟单位是 ms ，通常不应该超过10ms.

---
磁盘读取相关

    r/s: 每秒完成的读请求数
    rkB/s: 每秒读取的数据量(KB)
    rrqm/s: 每秒这个设备相关的读取请求有多少被合并
    %rrqm: 被合并的读取请求所占的百分比
    r_await: 读取请求的平均响应时间(毫秒)
    rareq-sz: 平均每次读取请求的大小(扇区数)

磁盘写入相关

    w/s: 每秒完成的写请求数
    wkB/s: 每秒写入的数据量(KB)
    wrqm/s: 每秒这个设备相关的写入请求有多少被合并
    %wrqm: 被合并的写入请求所占的百分比
    w_await: 写入请求的平均响应时间(毫秒)
    wareq-sz: 平均每次写入请求的大小(扇区数)

磁盘总体

    d/s: 设备每秒完成的丢弃(discard)请求数(经过合并后)。丢弃请求允许存储设备回收已删除块占用的存储空间。
    dkB/s: 每秒为设备丢弃的数据量(KB)。
    drqm/s: 每秒合并到设备排队的丢弃请求数。
    %drqm: 丢弃请求在发送到设备之前合并在一起的百分比。
    d_await: 向要服务的设备发出丢弃请求的平均时间(毫秒)。
    dareq-sz: 向设备发出的丢弃请求的平均大小(KB)。
     
其他

    f/s: 每秒完成的刷新(flush)请求数(经过合并后)。这统计了磁盘执行的刷新请求数量。对于分区,不跟踪刷新请求。在合并之前,刷新操作被计为写入操作。 
    f_await: 完成操作的平均等待时间（以毫秒为单位）。这指的是发送到设备的刷新(flush)请求平均被服务的时间。块层会合并刷新请求,一次最多执行一个。因此,刷新操作可能会延长两倍时间:等待当前刷新请求,然后执行它,接着等待下一个。
    aqu-sz: 平均请求队列长度
    %util: 设备利用率百分比
---

以3秒的间隔显示系统磁盘设备的IO使用状况和扩展统计数据.
```bash
iostat -dx 3

Device            r/s     rkB/s   rrqm/s  %rrqm r_await rareq-sz     w/s     wkB/s   wrqm/s  %wrqm w_await wareq-sz     d/s     dkB/s   drqm/s  %drqm d_await dareq-sz     f/s f_await  aqu-sz  %util
nvme0n1       2147.33  34842.67     0.00   0.00    0.46    16.23    0.33      1.33     0.00   0.00    1.00     4.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    1.00 100.00
```
每隔 5 秒显示一次系统 CPU（c）、设备利用率（d）、分区统计数据（p）以及扩展 IO 统计数据（x)。
```shell
iostat -dcpx 5
Linux 6.4.10-arch1-1 (arch.liarlee.site) 	08/22/2023 	_x86_64_	(4 CPU)

avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           5.23    0.00    2.05    0.01    0.01   92.71

Device            r/s     rkB/s   rrqm/s  %rrqm r_await rareq-sz     w/s     wkB/s   wrqm/s  %wrqm w_await wareq-sz     d/s     dkB/s   drqm/s  %drqm d_await dareq-sz     f/s f_await  aqu-sz  %util
nvme0n1          1.00     32.72     0.00   0.04    0.66    32.86    1.24     23.27     0.18  12.62    0.99    18.79    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    0.00   0.18
nvme0n1p1        1.00     32.72     0.00   0.04    0.66    32.86    1.24     23.27     0.18  12.62    0.99    18.79    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    0.00   0.18
```


监控数据来源： `cat /proc/diskstats` 
这些所有的指标都是 By Device 的， 与进程的部分无关，统计的是发送到设备或者发送到设备分区的请求。 
基于man page 中的描述， 这四个参数分别是： 
     r/s    The number (after merges) of read requests completed per second for the device.
     w/s    The number (after merges) of write requests completed per second for the device.
     d/s    The number (after merges) of discard requests completed per second for the device.
     f/s    The number (after merges) of flush requests completed per second for the device.  This counts flush requests executed by disks. Flush requests are not tracked for partitions.  Before being merged, flush operations are counted as writes.

命令行参数的一部分解释
`-d` 展示磁盘设备使用率的信息。 
`-x` 扩展显示更多的指标数据， 不添加这个参数不区分设备 读/写/磁盘/文件系统 这四个维度。
`-c` 查看CPU统计的使用率指标。 
`-p` 磁盘分区的指标。 
`-z` 只是输出一些有IO的设备的统计信息。 性能之巅里面有写出这个参数。 
`-t` 来输出时间戳。

这个命令主要看如下的点： 
1. 看物理设备， 具体是那个设备上面有 IO 请求。
2. 看 await，等待的时间长不长， 这里面的等待时间是从请求进入设备队列到请求返回成功的时间 ， 通常情况下应该是在 10ms 以内， 尤其是 ssd。
3. 看 aqu-sz， 按照 EBS 的规则，应该是每 1000 IOPS 队列数为 1 最合适。 
4. 综合看 IOPS， 块大小， 吞吐量，  使用率， 确认设备是不是达到了瓶颈。 
5. 最后切换工具定位具体是那个进程在大量的发送 IO 请求 ，大概可能的工具是 pidstat， htop ， atop ， sar 等等， 感觉工具还可能有 pm 的这部分工具。

