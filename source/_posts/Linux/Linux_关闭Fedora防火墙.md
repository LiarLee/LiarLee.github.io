---
title: Fedora防火墙关闭，如何开机运行脚本
date: 2018-05-11 14:21:36
categories: Linux
tags: Linux, Fedora
---

这次的内容是两个部分，关闭Firewalld 和 启动rc.local的服务。  

如何彻底关闭Fedora27的Firewalld，防止每次重启自动开启。
我们都知道在很早之前就已经关闭了rc.local的使用，开机启动的内容完全由systemd进行管理，如果要使用rc.local需要自己配置。

## 如何彻底关闭Fedora27的Firewalld
Fedora的Firewalld,每次重启都会自动启动，不会彻底关闭，我们需要特殊的方式来关闭。  

1. 直接移除  
	```
	dnf remove firewalld
	```
1. 指向不存在的设备  
	```
	systemctl mask firewalld  -- 表示直接将这个服务指向了/dev/null,无法启动也无法被其他的程序直接调用。
	systemctl disable firewalld -- 开机的时候不会自动启动，但是接受其他的服务调用并启动。
	```
## 配置rc.local服务
1. 新建rc.local文件。  
	```
	vim /etc/rc.d/rc.local
	```
1. 写入内容。  
	```
	#!/bin/bash
	/usr/sbin/Orthanc
	/etc/orthanc/orthanc.json
	```
1. 启动服务,配置开机自启。
	```
	systemctl start rc-local.service
	systemctl enable rc-local.service
 	```
