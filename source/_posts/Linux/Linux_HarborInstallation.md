---
title: Harbor Http 安装部署
date: 2021-09-27 11:21:47
categories: Linux
tags:
  - Application
  - Harbor
---

 Harbor的部署记录。
# Harbor Info
- [Harbor 项目地址](https://github.com/goharbor/harbor/releases/tag/v2.3.2)

# Harbor HTTP部署
因为是临时使用， 所以直接给了HTTP的权限， 为的是不走公网部署 CEPH Cluster， CEPH在BootStrap之后会默认去公网的镜像仓库尝试Pull镜像并且校验镜像和服务，所以给一个私有的仓库， 直接去找私有仓库就免了公网访问卡集群的正常启动的步骤。
## 下载解压
```bash
~]$ wget https://github.com/goharbor/harbor/releases/download/v2.3.2/harbor-offline-installer-v2.3.2.tgz
~]$ mv harbor-offline-installer-v2.3.2.tgz /opt 
~]$ tar zxvf /opt/harbor-offline-installer-v2.3.2.tgz
```

## 复制修改配置文件
```bash
~]$ cp /opt/harbor/harbor.yml.tmpl /opt/harbor/harbor.yml
```

## 配置默认的存储位置
```yaml
# 注释掉https的部分，如果需要https的话签发一个证书写路径在配置文件中
# 修改默认的存储位置
data_volume: /opt/harbor/image_store
```
## 指定Harbor对外提供服务的域名
```yaml
# 修改Harbor的域名或者主机名(需要对应的解析)，也可以直接使用IP地址
# The IP address or hostname to access admin UI and registry service.
# DO NOT use localhost or 127.0.0.1, because Harbor needs to be accessed by external clients.
hostname: harbor.local
```
## 设置harbor Admin的密码
可以登录Dashboard 或者 Pull镜像
```yaml
# Remember Change the admin password from UI after launching Harbor.
harbor_admin_password: Harbor12345
```

## 创建harbor存储镜像的目录
```bash 
# 创建Harbor的存储目录， 可以远程指定到Cephfs上面
~]$ mkdir /opt/harbor/image_store
```

## 配置Docker-ce 清华的镜像源
这个配置是给Centos / RHEL来使用的，来自清华的Repo Help
```bash
# 添加repo文件，和修改配置到Tsinghua repo
~]$ wget -O /etc/yum.repos.d/docker-ce.repo https://download.docker.com/linux/centos/docker-ce.repo
~]$ sudo sed -i 's+download.docker.com+mirrors.tuna.tsinghua.edu.cn/docker-ce+' /etc/yum.repos.d/docker-ce.repo

# 安装Docker-ce
~]$ sudo yum install docker-ce

# CENTOS8 STREAM 特殊的配置，需要卸载 podman 和 Buildah
~]$ dnf install -y docker-ce --allowerasing

# 开机启动
~]$ sudo systemctl restart docker && sudo systemctl enable docker

# 安装Docker-compose ，因为CentOS8 默认是没有Docker-compose的 ， 按照官网的流程走就可以。
~]$ sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
~]$ sudo chmod +x /usr/local/bin/docker-compose
~]$ sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
```
## 安装harbor
```bash
~]$ cd /opt/harbor
/opt/harbor]$ ./install.sh
```

# 启动Harbor
直接使用Docker-compose启动即可，如果需要的话可以在配置文件中指定镜像扫描器，来进行镜像的漏洞扫描。
```bash
# 进入Harbor运行所在的目录
~]$ cd /opt/harbor	

# 使用Docker-compose的启动命令，适用于服务停止 或者 Docker 重启的时候， 容器没有正常运行。
~]$ docker-compose up -d -f /opt/harbor/docker-compose.yaml

# 查看容器的启动状态
/opt/harbor]$ docker-compose ps
/opt/harbor]$ watch -n 1 docker-compose ps

# 通过Docker-compose停止harbor
/opt/harbor]$ docker-compose down
```

## 验证
1. 打开浏览器，访问harbor的地址 默认的端口80 
2. 在所有docker节点上配置不安全的私有仓库，docker login [HARBORIP:PORT]
3. 在所有podman节点上配置不安全的私有仓库，podman login [HARBORIP:PORT]
4. 提示Login Successed， 登录成功，可以正常pull镜像了

# Cephadm Bootstrap
## 编辑cephadm文件，修改如下的镜像名称，和仓库的前缀
这里其实还是需要再测试的， 按照这个脚本的逻辑， 应该会把所有的镜像都从指定的仓库Pull下来，但是我执行的时候只有ceph/ceph:v16一个镜像下来了， 感觉还是有点儿问题的。
```python
DEFAULT_IMAGE = 'harbor.local/ceph/ceph:v16'
DEFAULT_IMAGE_IS_MASTER = False
DEFAULT_IMAGE_RELEASE = 'pacific'
DEFAULT_PROMETHEUS_IMAGE = 'harbor.local/ceph/prometheus:v2.18.1'
DEFAULT_NODE_EXPORTER_IMAGE = 'harbor.local/ceph/node-exporter:v0.18.1'
DEFAULT_ALERT_MANAGER_IMAGE = 'harbor.local/ceph/alertmanager:v0.20.0'
DEFAULT_GRAFANA_IMAGE = 'harbor.local/ceph/ceph-grafana:6.7.4'
DEFAULT_HAPROXY_IMAGE = 'harbor.local/ceph/haproxy:2.3'
DEFAULT_KEEPALIVED_IMAGE = 'harbor.local/ceph/keepalived'
DEFAULT_REGISTRY = 'harbor.local'   # normalize unqualified digests to this
```

## Cephadm 使用私有仓库bootstrap
```bash
~]$ cephadm bootstrap --mon-ip 192.168.1.211 --allow-overwrite \
  --registry-url harbor.local \
  --registry-username admin \
  --registry-password Harbor12345
```

## 查看并且清除ceph-bootstrap的历史记录
```bash
~]$ ls /etc/systemd/system/ceph*
~]$ ls /usr/lib/systemd/system/ceph*

~]$ rm -rf /etc/systemd/system/ceph*
~]$ rm -rf /usr/lib/systemd/system/ceph*
~]$ docker stop `docker ps -a -q`  
```

