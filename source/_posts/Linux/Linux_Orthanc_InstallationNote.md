---
title: Orthanc的安装
date: 2018-04-25 17:02:01
categories: Healthcare-IT
tags:
  - Orthanc
  - Docker
---

记录了Orthanc的安装过程。只有简单的安装，复杂没研究，待补全。  
Orthanc是一个开源的DICOM Server，支持RESTful API，是轻量级的DICOM Server，默认基于数据库SQLlite，同时也支持PostgreSQL。

## 准备工作
  平台：*Fedora* OR *Windows*  

## 安装Orthanc

## 快速部署
#### Fedora集成的RPM包
[Fedora提供的BuildVersion](https://koji.fedoraproject.org/koji/rpminfo?rpmID=11215099)
下载到本地之后：执行  
```bash
dnf install -y orthanc*
systemctl enable orthanc
systemctl start orthanc
iptables -A INPUT -p tcp --dport 8042 -j ACCEPT
iptables -A INPUT -p tcp --dport 4242 -j ACCEPT
iptables-save
```
安装结束。  

#### Windows一键安装包
[Windows安装包下载地址](https://www.orthanc-server.com/download-windows.php)
直接下载之后运行即可。

## 插件部分
