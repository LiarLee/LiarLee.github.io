---
title: Docker/Containerd/Harbor 配置代理
date: 2022-12-20 12:39:07
categories: Docker
tags:
  - Docker
  - Harbor
  - Application
---
记录一下 Docker Daemon / Containerd 配置代理的步骤，尽管能用的时候不太多。

Update - 2023-07-10 Add Harbor.

# Docker
## 创建文件
```bash
]$ mkdir -pv /etc/systemd/system/docker.service.d
]$ touch /etc/systemd/system/docker.service.d/proxy.conf
```

## 写入内容
```ini
[Service]
Environment="HTTP_PROXY=socks5://<-->:<-->/"
Environment="HTTPS_PROXY=socks5://<-->:<-->/"
Environment="NO_PROXY=localhost,127.0.0.1"
```

## 重启DockerDaemon
```bash
]$ sudo systemctl daemon-reload && sudo systemctl restart docker
```

# Containerd
## 创建环境变量文件
```bash
]$ mkdir -pv /etc/systemd/system/containerd.service.d
]$ touch /etc/systemd/system/containerd.service.d/proxy.conf
```

## 写入内容
```ini
[Service]
Environment="HTTP_PROXY=socks5://<-->:<-->/"
Environment="HTTPS_PROXY=socks5://<-->:<-->/"
Environment="NO_PROXY=localhost,127.0.0.1"
```

## 重启 Containerd
```bash
]$ sudo systemctl daemon-reload && sudo systemctl restart docker
```

## Harbor 仓库加代理

另一个方法是直接给harbor仓库添加代理， 让Harbor来进行代理访问 ，帮忙pull镜像， 集群直接指向这个仓库即可。

harbor我是直接使用docker-compose 的方式部署的， 这样简单一些。 

我的软件安装目录是在: `/opt/harbor`

1. 找到harbor 的配置文件： `/opt/harbor/harbor.yml`

2. 配置文件部分如下： 

   ```yaml
      189	# Global proxy
      190	# Config http proxy for components, e.g. http://my.proxy.com:3128
      191	# Components doesn't need to connect to each others via http proxy.
      192	# Remove component from `components` array if want disable proxy
      193	# for it. If you want use proxy for replication, MUST enable proxy
      194	# for core and jobservice, and set `http_proxy` and `https_proxy`.
      195	# Add domain to the `no_proxy` field, when you want disable proxy
      196	# for some special registry.
      197	proxy:
      198	  http_proxy: socks5://ip:port
      199	  https_proxy: socks5://ip:port
      200	  no_proxy:
      201	  components:
      202	    - core
      203	    - jobservice
      204	    - trivy
   ```

3. 启动服务之后进入容器进行确认： 

   ```bash
   core]$ dc exec -it core bash
   
   harbor [ /harbor ]$ env | grep -i proxy
   PERMITTED_REGISTRY_TYPES_FOR_PROXY_CACHE=docker-hub,harbor,azure-acr,aws-ecr,google-gcr,quay,docker-registry,github-ghcr
   NO_PROXY=redis,chartmuseum,portal,db,.internal,.local,127.0.0.1,localhost,core,trivy-adapter,nginx,postgresql,registryctl,log,jobservice,registry,notary-server,notary-signer,exporter
   HTTPS_PROXY=socks5://ip:port
   HTTP_PROXY=socks5://ip:port
   ```

4. 环境变量已经生效了， 然后直接在控制台创建项目， 创建新的仓库缓存代理。

   我创建的仓库如下，除了列出的其他**留空**：

   | 提供者     | 目标名          | 目标URL                 |
   | :--------- | --------------- | ----------------------- |
   | Quay       | registry.k8s.io | https://registry.k8s.io |
   | GtihubGHCR       | ghcr.io         | https://ghcr.io         |
   | Quay       | k8s.gcr.io (Archived)     | https://k8s.gcr.io      |
   | Quay       | gcr.io          | https://gcr.io          |
   | Quay       | quay.io         | https://quay.io         |
   | Docker Hub | docker.io       | https://hub.docker.com  |
   | DockerRegistry | public.ecr.aws       | https://public.ecr.aws  |

所有仓库的健康检查是通过的， 然后去创建项目， 就行了。 

创建完成项目之后， 就可以通过当前这个仓库的项目地址来pull 镜像了。 

```bash
docker pull reg.liarlee.site/docker.io/library/nginx:latest
docker pull reg.liarlee.site/registry.k8s.io/metrics-server/metrics-server@sha256:1ab8d2722ce57979eb05ec0594cb9173e07ace16a253c747bb94c31b138a07dc
docker pull reg.liarlee.site/public.ecr.aws/amazonlinux/amazonlinux:minimal
docker pull reg.liarlee.site/quay.io/prometheus/prometheus
docker pull reg.liarlee.site/quay.io/argoproj/argocd
docker pull reg.liarlee.site/ghcr.io/dexidp/dex
```

