---
title: Portainer 使用记录
category: Linux
date: 2024-04-14 12:12:47
tags:
  - Linux
  - Docker
  - Application
---
#### 创建并启动 Portainer
在这里直接使用了dockercompose直接运行, 这个dockercompose 是自己配置的,  其他的服务可以托管给 portainer , 但是 portainer 自己貌似不太能托管自己. 
1. 创建compose文件: 
  `touch /opt/portainer/docker-compose.yaml`
1. 写入配置文件: 
```yaml
---
version: "3.8"
services:
  portainer:
    image: portainer/portainer-ce:latest
    restart: always
    environment:
      - UUID=0
      - GUID=0
      - TZ=Asia/Shanghai
    volumes:
      - /run/docker.sock:/var/run/docker.sock
      - /etc/localtime:/etc/localtime:ro
      - /opt/Portainer/portainer_data:/data
    network_mode: host
    cap_add:
      - ALL
```
1. 运行 dockercompose  up
```shell
docker-compose down --remove-orphans 
&& \
docker-compose up -d 
```
#### 启动 Portainer Agent
在需要管理的其他节点上面, 运行下面的命令: 
```shell
docker run -d \
  -p 9001:9001 \
  --name portainer_agent \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /var/lib/docker/volumes:/var/lib/docker/volumes \
  reg.liarlee.site/docker.io/portainer/agent:2.19.4
```