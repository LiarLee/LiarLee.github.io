

> 从manpage 里面直接获取的命令说明， 汇报CPU指标 和 设备 或者 分区 的 I/O指标。 
       iostat - Report Central Processing Unit (CPU) statistics and input/output statistics for devices and partitions.

指标的解释说明如下： 
**rrqm/s - wrqm/s**  两个看的是的merge的请求数量， 表示发送给驱动程序并被驱动程序合并的请求数量，表示有没有进行合并，这也表示系统将随机IO请求合并成连续以提高性能。 
**r/s - w/s**  IO读写的请求数量IOPS， 发送给磁盘设备的请求数。
**rKB/s - wKB/s** 吞吐量， 可以使用 -m 转换成MB/s， 设备的传输数据量的吞吐量信息。 
**avgrq-sz**  平均请求大小， 也就是IOsize 的大小。单位是扇区（512B）。
**rareq-sz -  wareq-sz** 新版本的iostat已经是这两个指标了， 这两个指标单位是 KB.
**avgqu-sz**  在驱动队列和设备队列中或活跃的平均请求数量。 单位是 个。
**await** 这个指标记录的总的延迟， 新的版本也包括 rw 两类请求的延迟。 延迟单位是 ms ，通常不应该超过10ms.

命令输出结果：

```bash
iostat -dx 3

Device            r/s     rkB/s   rrqm/s  %rrqm r_await rareq-sz     w/s     wkB/s   wrqm/s  %wrqm w_await wareq-sz     d/s     dkB/s   drqm/s  %drqm d_await dareq-sz     f/s f_await  aqu-sz  %util
nvme0n1       2147.33  34842.67     0.00   0.00    0.46    16.23    0.33      1.33     0.00   0.00    1.00     4.00    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    1.00 100.00

Device            r/s     rkB/s   rrqm/s  %rrqm r_await rareq-sz     w/s     wkB/s   wrqm/s  %wrqm w_await wareq-sz     d/s     dkB/s   drqm/s  %drqm d_await dareq-sz     f/s f_await  aqu-sz  %util
nvme0n1       2128.33  34248.00     0.00   0.00    0.46    16.09    5.33     49.83     1.33  20.00    0.94     9.34    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    0.99  99.87

iostat -dcpx 5
Linux 6.4.10-arch1-1 (arch.liarlee.site) 	08/22/2023 	_x86_64_	(4 CPU)

avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           5.23    0.00    2.05    0.01    0.01   92.71

Device            r/s     rkB/s   rrqm/s  %rrqm r_await rareq-sz     w/s     wkB/s   wrqm/s  %wrqm w_await wareq-sz     d/s     dkB/s   drqm/s  %drqm d_await dareq-sz     f/s f_await  aqu-sz  %util
nvme0n1          1.00     32.72     0.00   0.04    0.66    32.86    1.24     23.27     0.18  12.62    0.99    18.79    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    0.00   0.18
nvme0n1p1        1.00     32.72     0.00   0.04    0.66    32.86    1.24     23.27     0.18  12.62    0.99    18.79    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    0.00   0.18


avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           1.80    0.00    0.95    0.05    0.00   97.20

Device            r/s     rkB/s   rrqm/s  %rrqm r_await rareq-sz     w/s     wkB/s   wrqm/s  %wrqm w_await wareq-sz     d/s     dkB/s   drqm/s  %drqm d_await dareq-sz     f/s f_await  aqu-sz  %util
nvme0n1          0.00      0.00     0.00   0.00    0.00     0.00    1.60     10.40     0.00   0.00    0.62     6.50    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    0.00   0.32
nvme0n1p1        0.00      0.00     0.00   0.00    0.00     0.00    1.60     10.40     0.00   0.00    0.62     6.50    0.00      0.00     0.00   0.00    0.00     0.00    0.00    0.00    0.00   0.34
```

监控数据来源： `cat /proc/diskstats` 
这些所有的指标都是By Device的， 与进程的部分无关，统计的是发送到设备或者发送到设备分区的请求。 
基于man page 中的描述， 这四个参数分别是： 
     r/s    The number (after merges) of read requests completed per second for the device.
     w/s    The number (after merges) of write requests completed per second for the device.
     d/s    The number (after merges) of discard requests completed per second for the device.
     f/s    The number (after merges) of flush requests completed per second for the device.  This counts flush requests executed by disks. Flush requests are not tracked for partitions.  Before being merged, flush operations are counted as writes.

命令行参数的一部分解释
**-d** 展示磁盘设备使用率的信息。 
**-x** 扩展显示更多的指标数据， 不添加这个参数不区分设备 读/写/磁盘/文件系统 这四个维度。
**-c** 查看CPU统计的使用率指标。 
**-p** 磁盘分区的指标。 
**-z** 只是输出一些有IO的设备的统计信息。 性能之巅里面有写出这个参数。 

使用这个命令的思路： 
1. 看设备， 具体是那个设备上面有IO请求。
2. 看await，等待的时间长不长， 这里面的等待时间是从请求进入设备队列到请求返回成功的时间 ， 通常情况下应该是在10ms以内， 尤其是 ssd。
3. 看 q-sz， 按照EBS的规则，说法， 应该是每 1000 IOPS 队列数为 1。 
4. 综合看 IOPS， 块大小， 吞吐量，  使用率， 确认设备是不是达到了瓶颈。 
5. 最后切换工具定位具体是那个进程在大量的发送IO请求 ，大概可能的工具是 pidstat， htop ， atop ， sar 等等， 感觉工具还可能有 pm 的这部分工具。

通常可以直接使用命令 ： `iostat -xz 1` 
