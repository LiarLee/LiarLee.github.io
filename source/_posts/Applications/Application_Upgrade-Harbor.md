---
title: Harbor 的升级记录
category: Kubernetes
date: 2024-05-06 23:26:56
tags:
  - Application
  - Kubernetes
  - Harbor
---
这次更新的目的是, 将原来的LVM切换成btrfs (真香!

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
### 创建存储并迁移数据
```shell
mkfs.btrfs -L harbor -d raid1 -m raid1 -n 16k /dev/nvme1n1 /dev/nvme2n1 -f

# 创建子卷
btrfs su cr @docker_data
btrfs su cr @harbor_data

# 创建挂载点
mkdir -v /mnt/btrfs/harbor_data
mkdir -v /mnt/btrfs/harbor_data/certs/
mkdir -v /mnt/btrfs/docker_data

# 同步历史数据
rsync -aP ./harbor_data/ /mnt/btrfs/harbor_data/
rsync -aP ./docker_data/ /mnt/btrfs/docker_data/
rsync -aP ./harbor_log/ /mnt/btrfs/harbor_data/harbor_log
cp -prv ./certs /mnt/btrfs/harbor_data/certs

### 将挂载写入fstab
UUID=519abb44-a6a3-4ed1-b99d-506e9443e73f   /mnt/btrfs/docker_data   btrfs   defaults,compress=zstd,autodefrag,ssd,subvol=@docker_data

UUID=519abb44-a6a3-4ed1-b99d-506e9443e73f   /mnt/btrfs/harbor_data   btrfs   defaults,compress=zstd,autodefrag,ssd,subvol=@harbor_data
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
重启系统可以正常重启，harbor 可以访问。