---
title: 关于BTRFS的一些测试
date: 2022-04-19 17:45:39
category: Linux
tags: Linux, IO, FileSystem
---

## 创建BTRFS卷

    mkfs.btrfs -d single -m raid1 /dev/nvme1n1 /dev/nvme2n1 /dev/nvme3n1 

## 更改btrfs的元数据冗余

  这里最好的办法当然是创建的时候就规划和指定好。
    btrfs balance start -dconvert=raid1 -mconvert=raid1 /mnt
## 创建轻量副本文件
    cp --reflink source dest 

记录测试结果：
1. 如果是 -d raid0 -m raid1 可以直接将三个EBS IO1 3000IOPS的卷吃满， 直接到9000
2. 如果是 -d raid1 -m raid1 只能达到3000IOPS， 但是容量会有冗余。

## Randread
```ini
[global]
directory=/mnt
ioengine=libaio
direct=1
rw=randread
bs=16M
size=64M
time_based
runtime=20
group_reporting
norandommap
numjobs=1
thread

[job1]
iodepth=2
```

## Result
```bash
[root@ip-172-31-10-64 fio]# fio ./job1
job1: (g=0): rw=randread, bs=16M-16M/16M-16M/16M-16M, ioengine=libaio, iodepth=2
fio-2.14
Starting 1 thread
job1: Laying out IO file(s) (1 file(s) / 64MB)
Jobs: 1 (f=1): [r(1)] [100.0% done] [256.0MB/0KB/0KB /s] [16/0/0 iops] [eta 00m:00s]
job1: (groupid=0, jobs=1): err= 0: pid=26359: Thu Nov 18 07:59:17 2021
  read : io=5232.0MB, bw=266745KB/s, iops=16, runt= 20085msec
    slat (msec): min=1, max=70, avg=21.39, stdev=23.43
    clat (msec): min=2, max=130, avg=101.29, stdev=31.01
     lat (msec): min=8, max=139, avg=122.68, stdev=24.96
    clat percentiles (msec):
     |  1.00th=[    7],  5.00th=[   60], 10.00th=[   63], 20.00th=[   66],
     | 30.00th=[   93], 40.00th=[  110], 50.00th=[  118], 60.00th=[  120],
     | 70.00th=[  122], 80.00th=[  126], 90.00th=[  127], 95.00th=[  128],
     | 99.00th=[  130], 99.50th=[  131], 99.90th=[  131], 99.95th=[  131],
     | 99.99th=[  131]
    lat (msec) : 4=0.31%, 10=3.36%, 20=0.92%, 50=0.31%, 100=28.75%
    lat (msec) : 250=66.36%
  cpu          : usr=0.04%, sys=3.80%, ctx=994, majf=0, minf=8193
  IO depths    : 1=0.3%, 2=99.7%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued    : total=r=327/w=0/d=0, short=r=0/w=0/d=0, drop=r=0/w=0/d=0
     latency   : target=0, window=0, percentile=100.00%, depth=2

Run status group 0 (all jobs):
   READ: io=5232.0MB, aggrb=266744KB/s, minb=266744KB/s, maxb=266744KB/s, mint=20085msec, maxt=20085msec
```

## Randwrite
```ini
[global]
directory=/mnt
ioengine=libaio
direct=1
rw=randread
bs=16M
size=64M
time_based
runtime=20
group_reporting
norandommap
numjobs=1
thread

[job1]
iodepth=2
```
## Result
```bash
[root@ip-172-31-10-64 fio]# fio ./job1
job1: (g=0): rw=randwrite, bs=16M-16M/16M-16M/16M-16M, ioengine=libaio, iodepth=2
fio-2.14
Starting 1 thread
Jobs: 1 (f=1): [w(1)] [100.0% done] [0KB/256.0MB/0KB /s] [0/16/0 iops] [eta 00m:00s]
job1: (groupid=0, jobs=1): err= 0: pid=26385: Thu Nov 18 08:00:56 2021
  write: io=5248.0MB, bw=267987KB/s, iops=16, runt= 20053msec
    slat (msec): min=1, max=67, avg=12.64, stdev=21.62
    clat (msec): min=12, max=141, avg=109.45, stdev=31.98
     lat (msec): min=18, max=142, avg=122.10, stdev=25.25
    clat percentiles (msec):
     |  1.00th=[   16],  5.00th=[   23], 10.00th=[   66], 20.00th=[   72],
     | 30.00th=[  120], 40.00th=[  124], 50.00th=[  126], 60.00th=[  127],
     | 70.00th=[  128], 80.00th=[  130], 90.00th=[  133], 95.00th=[  135],
     | 99.00th=[  139], 99.50th=[  139], 99.90th=[  141], 99.95th=[  141],
     | 99.99th=[  141]
    lat (msec) : 20=4.57%, 50=0.91%, 100=19.21%, 250=75.30%
  cpu          : usr=1.51%, sys=0.82%, ctx=720, majf=0, minf=1
  IO depths    : 1=0.3%, 2=99.7%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued    : total=r=0/w=328/d=0, short=r=0/w=0/d=0, drop=r=0/w=0/d=0
     latency   : target=0, window=0, percentile=100.00%, depth=2

Run status group 0 (all jobs):
  WRITE: io=5248.0MB, aggrb=267987KB/s, minb=267987KB/s, maxb=267987KB/s, mint=20053msec, maxt=20053msec
```

## Xfs 单独磁盘
### Randwrite
```bash
[root@ip-172-31-10-64 fio]# fio ./job1
job1: (g=0): rw=randwrite, bs=16M-16M/16M-16M/16M-16M, ioengine=libaio, iodepth=2
fio-2.14
Starting 1 thread
job1: Laying out IO file(s) (1 file(s) / 64MB)
Jobs: 1 (f=1): [w(1)] [100.0% done] [0KB/128.0MB/0KB /s] [0/8/0 iops] [eta 00m:00s]
job1: (groupid=0, jobs=1): err= 0: pid=26541: Thu Nov 18 08:04:01 2021
  write: io=2704.0MB, bw=137688KB/s, iops=8, runt= 20110msec
    slat (msec): min=12, max=130, avg=118.63, stdev=24.61
    clat (msec): min=12, max=130, avg=118.91, stdev=23.73
     lat (msec): min=34, max=255, avg=237.54, stdev=47.53
    clat percentiles (msec):
     |  1.00th=[   14],  5.00th=[   32], 10.00th=[  125], 20.00th=[  125],
     | 30.00th=[  125], 40.00th=[  125], 50.00th=[  125], 60.00th=[  126],
     | 70.00th=[  126], 80.00th=[  126], 90.00th=[  126], 95.00th=[  126],
     | 99.00th=[  129], 99.50th=[  131], 99.90th=[  131], 99.95th=[  131],
     | 99.99th=[  131]
    lat (msec) : 20=1.78%, 50=3.55%, 100=0.59%, 250=94.08%
  cpu          : usr=0.74%, sys=0.49%, ctx=2132, majf=0, minf=1
  IO depths    : 1=0.6%, 2=99.4%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued    : total=r=0/w=169/d=0, short=r=0/w=0/d=0, drop=r=0/w=0/d=0
     latency   : target=0, window=0, percentile=100.00%, depth=2

Run status group 0 (all jobs):
  WRITE: io=2704.0MB, aggrb=137687KB/s, minb=137687KB/s, maxb=137687KB/s, mint=20110msec, maxt=20110msec

Disk stats (read/write):
  nvme4n1: ios=0/10699, merge=0/0, ticks=0/720588, in_queue=702508, util=99.40%
```
### Randread
```bash
[root@ip-172-31-10-64 fio]# fio ./job1
job1: (g=0): rw=randread, bs=16M-16M/16M-16M/16M-16M, ioengine=libaio, iodepth=2
fio-2.14
Starting 1 thread
Jobs: 1 (f=1): [r(1)] [100.0% done] [128.0MB/0KB/0KB /s] [8/0/0 iops] [eta 00m:00s]
job1: (groupid=0, jobs=1): err= 0: pid=26570: Thu Nov 18 08:05:27 2021
  read : io=2704.0MB, bw=137694KB/s, iops=8, runt= 20109msec
    slat (msec): min=9, max=165, avg=118.64, stdev=25.59
    clat (msec): min=14, max=165, avg=118.93, stdev=24.65
     lat (msec): min=25, max=288, avg=237.57, stdev=46.62
    clat percentiles (msec):
     |  1.00th=[   16],  5.00th=[   57], 10.00th=[  123], 20.00th=[  123],
     | 30.00th=[  124], 40.00th=[  124], 50.00th=[  124], 60.00th=[  124],
     | 70.00th=[  129], 80.00th=[  129], 90.00th=[  129], 95.00th=[  129],
     | 99.00th=[  131], 99.50th=[  165], 99.90th=[  165], 99.95th=[  165],
     | 99.99th=[  165]
    lat (msec) : 20=4.73%, 100=1.78%, 250=93.49%
  cpu          : usr=0.00%, sys=0.59%, ctx=3558, majf=0, minf=8193
  IO depths    : 1=0.6%, 2=99.4%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued    : total=r=169/w=0/d=0, short=r=0/w=0/d=0, drop=r=0/w=0/d=0
     latency   : target=0, window=0, percentile=100.00%, depth=2

Run status group 0 (all jobs):
   READ: io=2704.0MB, aggrb=137694KB/s, minb=137694KB/s, maxb=137694KB/s, mint=20109msec, maxt=20109msec

Disk stats (read/write):
  nvme4n1: ios=10711/1, merge=0/0, ticks=598336/56, in_queue=579492, util=99.49%
```

slat 表示submission latency，也就是发送这个IO给内核处理的提交时间花费。  （请求抵达内核的时间）
clat 是提交IO请求给内核之后到IO完成之间的时间，不包括submission latency。 （内核到块设备 ——> 请求处理完成的时间）
bw Bandwidth  带宽
READ: 读取的速率

