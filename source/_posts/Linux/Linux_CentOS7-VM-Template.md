---
title: 虚拟机制作模板的步骤及设置
date: 2019-09-18 16:41:11
tags: Linux
categories: ESXi
---

换了工作之后接管了这边旧的ESXi和上面的虚拟机，之前的模板不是特别的合适，自己开始动手做模板。最终期望的目标是：1. 修改IP地址；2.yum install 收工。  

<!-- more -->

## CentOS虚拟机模板的制作
### 系统的硬件配置
系统的硬件规格 -- 4cpu; 8G-RAM
### OS的版本
系统的版本 -- CentOS 7.6 1810 x64 
### 安装VMwareTools
```
yum install -y epel vim wget curl net-tools open-vm-tools htop iotop iftop tree

```
### 安装Zabbix-agent
```
rpm -ivh zabbix-agent-$version.rpm 
```
### 关闭SELinux
```
sed -i 's@SELINUX=enforcing@SELINUX=disabled@g' /etc/selinux/config
```
### 更改hostname
hostname有一些有趣的问题，CentOS6.8 中的hostname可以定义在`/etc/sysconfig/network`文件中，系统启动的时候先读取`/etc/sysconfig/network`文件中的定义，如果没有的话读取`/etc/hosts`文件中的定义；和我自己的之前的记忆不一样。
我之前一直都是之间编辑`/etc/hostname`，直接将主机名echo到这个文件中就可以了，不过向来这些区别都不大，先这样吧。
### 清除硬件及网卡的信息
将网卡配置文件中的UUID和 HWADDR直接删除或者是注释掉，IPADDR留空。
`/etc/sysconfig/network-scripts/ifcfg-eth0`
### 删除udev
`rm -rf /etc/udev/rules.d/70-*`  
NOTE：命令的效果貌似和sys-unconfig 的效果是一样的。
### 关闭防火墙
```
systemctl disable firewalld
iptables -F
iptables -X
iptables -Z
```
### 更改Grub的等待时间
虚拟机中的模板大部分是不需要等待grub给出的操作选单时间的，等待操作的时间是5秒，我们给出1秒就够了。
```
vim /etc/default/grub
GRUB_TIMEOUT=1
```
### 清理工作
```
rm -rf /etc/ssh/*key*.
rm -rf /root/.ssh/
systemctl stop rsyslog
systemctl stop auditd
/usr/bin/yum clean all
logrotate -f /etc/logrotate.conf 
rm -f /var/log/dmesg.old 
rm -rf /var/log/anaconda*
cat /dev/null > /var/log/audit/audit.log 
cat /dev/null > /var/log/wtmp 
cat /dev/null > /var/log/lastlog 
cat /dev/null > /var/log/grubby 
```
### 清除系统的唯一ID
```
> /etc/machine-id
```
### 清除系统命令历史记录
```
unset HISTFILE
history -c && rm -rf /root/.bash_histroy
```
### sys-unconfig关机
执行`sys-unconfig`等待关机，然后转换为模板。

