---
title: 2024 Harbor 部署记录
category: Kubernetes
date: 2024-05-06 23:26:56
tags:
  - Application
  - Kubernetes
  - Harbor
---
这次更新的目的是, 将原来的LVM切换成btrfs(真香!

存储主要将两个部分迁移到btrfs上:
- docker daemon 的工作目录
- harbor 的数据 日志和证书

### 下载源代码
从官方的项目下载这个版本的offlie安装包.
不用online的原因是 : online还需要从dockerhub下载镜像, 国内实在一言难尽.

> https://github.com/goharbor/harbor/releases/tag/v2.9.4

```shell
cd /opt/
wget https://github.com/goharbor/harbor/releases/download/v2.9.4/harbor-offline-installer-v2.9.4.tgz
```
### 解压
```shell 
tar zxvf ./harbor-offline-installer-v2.10.2.tgz
```
### 复制之前版本的配置文件
```shell
cp /opt/harbor-2.10.0/harbor.yml .
```
确认配置文件中的几个参数已经改为正确的路径, 其他位置不变: 
```yaml
https:
  # https port for harbor, default is 443
  port: 443
  # The path of cert and key files for nginx
  certificate: /mnt/btrfs/harbor_data/certs/111.pem
  private_key: /mnt/btrfs/harbor_data/certs/111.key

data_volume: /mnt/btrfs/harbor_data

log:
  local:
    location: /mnt/btrfs/harbor_data/harbor_log
```
### Load 新版本的镜像
```shell
docker load < ./harbor.v2.10.2.tar.gz

btrfs]$ docker images
REPOSITORY                                                         TAG       IMAGE ID       CREATED        SIZE
goharbor/harbor-exporter                                           v2.10.2   9befcab0cee2   4 weeks ago    111MB
goharbor/redis-photon                                              v2.10.2   9d1db211d49a   4 weeks ago    170MB
goharbor/trivy-adapter-photon                                      v2.10.2   8f9e0b6b43ce   4 weeks ago    509MB
goharbor/harbor-registryctl                                        v2.10.2   e5a807ba1f59   4 weeks ago    155MB
goharbor/registry-photon                                           v2.10.2   850d2b3f27f3   4 weeks ago    89MB
goharbor/nginx-photon                                              v2.10.2   9282c21c2fee   4 weeks ago    159MB
goharbor/harbor-log                                                v2.10.2   f288fe2baa96   4 weeks ago    168MB
goharbor/harbor-jobservice                                         v2.10.2   a3247b57a920   4 weeks ago    146MB
goharbor/harbor-core                                               v2.10.2   6cd434d62456   4 weeks ago    174MB
goharbor/harbor-portal                                             v2.10.2   7e5a522c7853   4 weeks ago    167MB
goharbor/harbor-db                                                 v2.10.2   cd385df354d4   4 weeks ago    274MB
goharbor/prepare                                                   v2.10.2   bf4632d26b65   4 weeks ago    214MB
```
### 创建 Btrfs 文件系统
```shell
mkfs.btrfs -L harbor -d raid1 -m raid1 -n 16k /dev/nvme1n1 /dev/nvme2n1 -f
# 创建子卷
btrfs su cr docker_data
btrfs su cr harbor_data
```
### 创建 Btrfs 挂载点
```shell
mkdir -v /mnt/btrfs/harbor_data
mkdir -v /mnt/btrfs/harbor_data/certs/
mkdir -v /mnt/btrfs/docker_data
```
### 同步之前的历史数据
```shell
rsync -aP ./harbor_data/ /mnt/btrfs/harbor_data/
rsync -aP ./docker_data/ /mnt/btrfs/docker_data/
rsync -aP ./harbor_log/ /mnt/btrfs/harbor_data/harbor_log
cp -prv ./certs /mnt/btrfs/harbor_data/certs
```
### 确认目录结构
```shell
mnt]$ tree -L 2 /mnt/btrfs/
/mnt/btrfs/
├── docker_data
│   ├── buildkit
│   ├── containers
│   ├── image
│   ├── network
│   ├── overlay2
│   ├── plugins
│   ├── runtimes
│   ├── swarm
│   ├── tmp
│   ├── trust
│   └── volumes
└── harbor_data
    ├── ca_download
    ├── certs
    ├── database
    ├── harbor_log
    ├── job_logs
    ├── redis
    ├── registry
    └── secret

21 directories, 0 files
```
### 安装harbor
```shell
./install.sh
```
### 确认结果
```shell
harbor]$ docker-compose ps
NAME                COMMAND                  SERVICE             STATUS              PORTS
harbor-core         "/harbor/entrypoint.…"   core                running (healthy)
harbor-db           "/docker-entrypoint.…"   postgresql          running (healthy)
harbor-jobservice   "/harbor/entrypoint.…"   jobservice          running (healthy)
harbor-log          "/bin/sh -c /usr/loc…"   log                 running (healthy)   127.0.0.1:1514->10514/tcp
harbor-portal       "nginx -g 'daemon of…"   portal              running (healthy)
nginx               "nginx -g 'daemon of…"   proxy               running (healthy)   0.0.0.0:80->8080/tcp, :::80->8080/tcp, 0.0.0.0:443->8443/tcp, :::443->8443/tcp
registry            "/home/harbor/entryp…"   registry            running (healthy)
registryctl         "/home/harbor/start.…"   registryctl         running (healthy)
```
### 将挂载写入fstab
```shell
UUID=519abb44-a6a3-4ed1-b99d-506e9443e73f   /mnt/btrfs/docker_data   btrfs   defaults,compress=zstd,autodefrag,ssd,subvol=/docker_data

UUID=519abb44-a6a3-4ed1-b99d-506e9443e73f   /mnt/btrfs/harbor_data   btrfs   defaults,compress=zstd,autodefrag,ssd,subvol=/harbor_data
```

### 简单的测试, 仅仅测试IOPS
- ReadIOPS 测试,  在 2 个 GP3/每 GP3 提供 3000 IOPS 的场景下, Raid1 在测试中是符合预期的, Read IOPS 提供了 5991 IOPS.
```shell
~]$#$ fio --directory=/mnt/btrfs/harbor_data/p_iops_vol0 --name fio_test_file --direct=1 --rw=randread --bs=16k --size=1G --numjobs=16 --time_based --runtime=180 --group_reporting --norandommap

fio_test_file: (g=0): rw=randread, bs=16K-16K/16K-16K/16K-16K, ioengine=psync, iodepth=1
...
fio-2.14
Starting 16 processes
Jobs: 16 (f=16): [r(16)] [100.0% done] [95856KB/0KB/0KB /s] [5991/0/0 iops] [eta 00m:00s]
fio_test_file: (groupid=0, jobs=16): err= 0: pid=32613: Tue May  7 00:09:45 2024
  read : io=16949MB, bw=96418KB/s, iops=6026, runt=180004msec
    clat (usec): min=205, max=112969, avg=2652.66, stdev=1700.67
     lat (usec): min=206, max=112969, avg=2652.88, stdev=1700.67
    clat percentiles (usec):
     |  1.00th=[  370],  5.00th=[  652], 10.00th=[ 1656], 20.00th=[ 2128],
     | 30.00th=[ 2352], 40.00th=[ 2480], 50.00th=[ 2576], 60.00th=[ 2672],
     | 70.00th=[ 2800], 80.00th=[ 2960], 90.00th=[ 3312], 95.00th=[ 3760],
     | 99.00th=[ 8256], 99.50th=[12736], 99.90th=[24192], 99.95th=[30080],
     | 99.99th=[47360]
    lat (usec) : 250=0.03%, 500=2.83%, 750=2.87%, 1000=0.86%
    lat (msec) : 2=9.36%, 4=80.15%, 10=3.15%, 20=0.60%, 50=0.16%
    lat (msec) : 100=0.01%, 250=0.01%
  cpu          : usr=0.21%, sys=2.17%, ctx=1085641, majf=0, minf=208
  IO depths    : 1=100.0%, 2=0.0%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued    : total=r=1084728/w=0/d=0, short=r=0/w=0/d=0, drop=r=0/w=0/d=0
     latency   : target=0, window=0, percentile=100.00%, depth=1

Run status group 0 (all jobs):
   READ: io=16949MB, aggrb=96418KB/s, minb=96418KB/s, maxb=96418KB/s, mint=180004msec, maxt=180004msec

```
- WriteIOPS 测试, 如上的规格,  WriteIOPS 在写的时候提供 3000 IOPS, 由于 Raid1 的特性, 也是符合预期的. 
```shell
~]$ fio --directory=/mnt/btrfs/harbor_data/p_iops_vol0 --ioengine=psync --name fio_test_file --direct=1 --rw=randwrite --bs=16k --size=1G --numjobs=16 --time_based --runtime=180 --group_reporting --norandommap

fio_test_file: (g=0): rw=randwrite, bs=16K-16K/16K-16K/16K-16K, ioengine=psync, iodepth=1
...
fio-2.14
Starting 16 processes
Jobs: 16 (f=16): [w(16)] [100.0% done] [0KB/48016KB/0KB /s] [0/3001/0 iops] [eta 00m:00s]
fio_test_file: (groupid=0, jobs=16): err= 0: pid=1657: Tue May  7 00:14:50 2024
  write: io=8231.8MB, bw=46828KB/s, iops=2926, runt=180006msec
    clat (usec): min=551, max=58452, avg=5463.27, stdev=1558.02
     lat (usec): min=551, max=58453, avg=5463.99, stdev=1558.03
    clat percentiles (usec):
     |  1.00th=[ 1576],  5.00th=[ 3536], 10.00th=[ 4192], 20.00th=[ 4768],
     | 30.00th=[ 5024], 40.00th=[ 5216], 50.00th=[ 5408], 60.00th=[ 5536],
     | 70.00th=[ 5728], 80.00th=[ 6176], 90.00th=[ 6816], 95.00th=[ 7520],
     | 99.00th=[ 9024], 99.50th=[10048], 99.90th=[19072], 99.95th=[28032],
     | 99.99th=[48384]
    lat (usec) : 750=0.03%, 1000=0.23%
    lat (msec) : 2=1.26%, 4=6.68%, 10=91.30%, 20=0.41%, 50=0.08%
    lat (msec) : 100=0.01%
  cpu          : usr=0.14%, sys=1.09%, ctx=529135, majf=0, minf=151
  IO depths    : 1=100.0%, 2=0.0%, 4=0.0%, 8=0.0%, 16=0.0%, 32=0.0%, >=64=0.0%
     submit    : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     complete  : 0=0.0%, 4=100.0%, 8=0.0%, 16=0.0%, 32=0.0%, 64=0.0%, >=64=0.0%
     issued    : total=r=0/w=526833/d=0, short=r=0/w=0/d=0, drop=r=0/w=0/d=0
     latency   : target=0, window=0, percentile=100.00%, depth=1

Run status group 0 (all jobs):
  WRITE: io=8231.8MB, aggrb=46828KB/s, minb=46828KB/s, maxb=46828KB/s, mint=180006msec, maxt=180006msec
```

基本上够用了, 没有继续测试的必要了, 主要是 BTRFS 看起来实在是太整齐了, 比 LVM 那一堆 dm 好看多了, 简直是强迫症的福音.
```shell
~]$ iostat -xdzm 1
Device:         rrqm/s   wrqm/s     r/s     w/s    rMB/s    wMB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
nvme1n1           0.00     0.00    0.00 3000.00     0.00    46.88    32.00    15.84    5.28    0.00    5.28   0.33 100.00
nvme2n1           0.00     0.00    0.00 2999.00     0.00    46.86    32.00     2.67    0.89    0.00    0.89   0.33 100.00
```

当然对于 EBS 来说创建Raid0 是没有必要的,  EBS已经是冗余高可用的块设备了. SLA够看了, 不会遇到故障损坏数据的情况.