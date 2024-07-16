---
title: TrueNas Core 当前基准测试指标
category: Application
date: 2023-10-08 13:57:57
tags:
  - TrueNasCore
  - NAS
  - IO
---

我在日常的使用中， 如果是连续的文件，我其实感受不到磁盘性能的问题，一直都很好， 如果是小文件随机就非常的折磨。 这让我意识到自己还没有对磁盘进行基准测试 ，记录如下：
TrueNAS 读取 和 写入的测试监控， 每次测试5mins，开始的时间是 9：55 ， 所有磁盘都有写入的原因是 ，fio 在创建测试文件来测试读取。


ada0 是一个 sata ssd。
ada1 和 ada2 是两个 hdd。


---

吞吐量：
![PixPin_2024-07-16_10-16-39.png](https://s2.loli.net/2024/07/16/W9Gu5TYiA8E7vtg.png)
IOPS：
![PixPin_2024-07-16_10-16-18.png](https://s2.loli.net/2024/07/16/asr3xPclmXVDNY8.png)

### 读取测试
这个是符合预期的 read 的所有请求都来自于内存。
```
root@haydentruenas[/mnt/root_pool]# fio --name=seqread --rw=read --bs=1M --size=1G --numjobs=1 --runtime=300 --time_based --group_reporting
seqread: (g=0): rw=read, bs=(R) 1024KiB-1024KiB, (W) 1024KiB-1024KiB, (T) 1024KiB-1024KiB, ioengine=psync, iodepth=1
fio-3.28
Starting 1 process
seqread: Laying out IO file (1 file / 1024MiB)
Jobs: 1 (f=1): [R(1)][100.0%][r=806MiB/s][r=805 IOPS][eta 00m:00s]
seqread: (groupid=0, jobs=1): err= 0: pid=72054: Tue Jul 16 10:01:10 2024
  read: IOPS=861, BW=861MiB/s (903MB/s)(252GiB/300001msec)
    clat (usec): min=1059, max=28988, avg=1149.82, stdev=154.88
     lat (usec): min=1060, max=28989, avg=1150.88, stdev=154.93
    clat percentiles (usec):
     |  1.00th=[ 1090],  5.00th=[ 1090], 10.00th=[ 1106], 20.00th=[ 1106],
     | 30.00th=[ 1123], 40.00th=[ 1123], 50.00th=[ 1123], 60.00th=[ 1123],
     | 70.00th=[ 1139], 80.00th=[ 1156], 90.00th=[ 1237], 95.00th=[ 1287],
     | 99.00th=[ 1500], 99.50th=[ 1614], 99.90th=[ 2114], 99.95th=[ 2409],
     | 99.99th=[ 6194]
   bw (  KiB/s): min=507904, max=907772, per=100.00%, avg=882606.25, stdev=36668.31, samples=593
   iops        : min=  496, max=  886, avg=861.50, stdev=35.77, samples=593
  lat (msec)   : 2=99.87%, 4=0.12%, 10=0.01%, 20=0.01%, 50=0.01%
  cpu          : usr=1.58%, sys=98.14%, ctx=20974, majf=0, minf=257
  IO depths    : 1=100.0%, 2=0.0%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued rwts: total=258344,0,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=1

Run status group 0 (all jobs):
   READ: bw=861MiB/s (903MB/s), 861MiB/s-861MiB/s (903MB/s-903MB/s), io=252GiB (271GB), run=300001-300001msec
```
### 写入测试
写入的测试结果看起来没有那么美好，感觉是psync的原因， 没过内存数据直接写入的机械硬盘，看起来这个速度有点差， 这个盘 6Gbps 的总线， 能达到 83.3MiB/s， 感觉还是有点儿问题， 这个性能不足应该来自蜗牛星际的 IO 板子可能不太行。
```
root@haydentruenas[/mnt/root_pool]# fio --name=seqread --rw=write --bs=1M --size=1G --numjobs=1 --runtime=300 --time_based --group_reporting
seqread: (g=0): rw=write, bs=(R) 1024KiB-1024KiB, (W) 1024KiB-1024KiB, (T) 1024KiB-1024KiB, ioengine=psync, iodepth=1
fio-3.28
Starting 1 process
Jobs: 1 (f=1): [W(1)][100.0%][w=78.2MiB/s][w=78 IOPS][eta 00m:00s]
seqread: (groupid=0, jobs=1): err= 0: pid=72202: Tue Jul 16 10:09:24 2024
  write: IOPS=83, BW=83.3MiB/s (87.4MB/s)(24.4GiB/300007msec); 0 zone resets
    clat (usec): min=642, max=956978, avg=11914.63, stdev=7270.55
     lat (usec): min=684, max=957053, avg=11987.96, stdev=7270.61
    clat percentiles (usec):
     |  1.00th=[   766],  5.00th=[  9765], 10.00th=[ 11076], 20.00th=[ 11338],
     | 30.00th=[ 11469], 40.00th=[ 11469], 50.00th=[ 11600], 60.00th=[ 11863],
     | 70.00th=[ 11994], 80.00th=[ 12256], 90.00th=[ 13042], 95.00th=[ 14222],
     | 99.00th=[ 22938], 99.50th=[ 35390], 99.90th=[ 49546], 99.95th=[ 54264],
     | 99.99th=[225444]
   bw (  KiB/s): min= 7501, max=686786, per=100.00%, avg=85553.58, stdev=31496.12, samples=594
   iops        : min=    7, max=  670, avg=83.08, stdev=30.76, samples=594
  lat (usec)   : 750=0.93%, 1000=0.21%
  lat (msec)   : 2=0.84%, 4=0.51%, 10=2.88%, 20=93.54%, 50=1.03%
  lat (msec)   : 100=0.06%, 250=0.01%, 500=0.01%, 1000=0.01%
  cpu          : usr=0.71%, sys=7.19%, ctx=197395, majf=0, minf=0
  IO depths    : 1=100.0%, 2=0.0%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued rwts: total=0,25001,0,0 short=0,0,0,0 dropped=0,0,0,0
     latency   : target=0, window=0, percentile=100.00%, depth=1

Run status group 0 (all jobs):
  WRITE: bw=83.3MiB/s (87.4MB/s), 83.3MiB/s-83.3MiB/s (87.4MB/s-87.4MB/s), io=24.4GiB (26.2GB), run=300007-300007msec
```
