---
title: Systemd 关闭 Firewalld
date: 2018-05-11 14:21:36
categories: Linux
tags:
  - Linux
  - Fedora
---
如何彻底关闭 Fedora27 的 Firewalld，防止每次重启自动开启。
### 如何彻底关闭 Fedora27 的 Firewalld
Fedora 的 Firewalld,每次重启都会自动启动，不会彻底关闭，我们需要特殊的方式来关闭。  

1. 直接移除  
```shell
dnf remove firewalld
```
1. 指向不存在的设备  
```shell
systemctl mask firewalld  
# 表示直接将这个服务指向了/dev/null,无法启动也无法被其他的程序直接调用。
systemctl disable firewalld 
# 开机的时候不会自动启动，但是接受其他的服务调用并启动。
```
### 配置 rc.local 服务
1. 新建rc.local文件。 
```shell
vim /etc/rc.d/rc.local
```
2. 写入需要开机启动的命令或者脚本。  
```shell
#!/bin/bash
echo "Autostart..."
/usr/bin/firefox
```
3. 启动服务,配置开机自启。
```shell
systemctl enable --now rc-local.service
```
