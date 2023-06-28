---
title: Docker/Containerd 配置代理
date: 2022-12-20 12:39:07
tags: Docker
---

记录一下 Docker Daemon / Containerd 配置代理的步骤，尽管能用的时候不太多。

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

## 重启 containerd
```bash
]$ sudo systemctl daemon-reload && sudo systemctl restart docker
```
