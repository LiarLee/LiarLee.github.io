---
title: TigerVNC 在 RHEL9 的安装和配置
date: 2024-08-21 14:02:57
category: Linux
tags:
  - Application
---
### 安装 VNC 步骤记录
初始化系统, 安装图形化.( 我还安装的 虚拟化宿主机, 我需要所以就安装了.
```shell
# 更新系统软件包到最新
sudo dnf update -y
# 查看哪些可用的 Group, (方便
sudo dnf grouplist
# 安装 Server GUI
sudo dnf groupinstall -y "Server with GUI"
# 安装 KVM (按需
sudo dnf groupinstall -y "Virtualization Host"
# 安装 TigerVNC 服务
sudo dnf install -y tigervnc-server
# 关闭 SElinux
sudo sed -i 's/SELINUX=enforcing/SELINUX=disabled/g' /etc/selinux/config
# 可以重启 或者 设置为 Permissive
sudo setenforce 0
# 关闭防火墙.
sudo systemctl stop firewalld
# 关闭防火墙开机启动, 当然可以使用 firewall-cmd 管理防火墙条目, 放行端口即可. 
sudo systemctl disable --now firewalld

```
配置 VNC config
```shell
# 复制 VNC 服务, 创建 1 号位服务.
sudo cp -prv /usr/lib/systemd/system/vncserver@.service /etc/systemd/system/vncserver\@:1.service
```
分配 :1 图形化接口给 ec2-user , 也可以分配给其他用户.
```shell
vim /etc/tigervnc/vncserver.users
:1=ec2-user
```
配置共享session, 没有安全性的设置.
```shell
vim /etc/tigervnc/vncserver-config-defaults
alwaysshared
```
### 切换到普通用户初始化
```shell
su - ec2-user
# 设置密码
vncpasswd

```
设置分辨率
```shell
vim ~/.vnc/config
geometry=1920x1080
```
开机启动
```shell
sudo systemctl enable vncserver@:1.service
sudo systemctl daemon-reload && sudo systemctl restart vncserver@:1
```
### 排查方法
```shell
# 查看 service 状态
sudo systemctl status vncserver@:1

# 查看日志
sudo journalctl -xefu vncserver@:1

# 查看 vncserver 日志
# 这个日志是需要到对应用户的家目录下查看的, 哪个用户创建的 vnc 会话, 就去哪个用户的家目录下看.
# 一般的日志格式是 [HOSTNAME]:1.log
cat ~/.vnc/*.log
```