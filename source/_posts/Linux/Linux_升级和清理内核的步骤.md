---
title: 升级以及清理内核的步骤
category: Linux
date: 2023-07-12 06:52:18
tags:
  - Linux
  - Kernel
---

通常情况下升级内核版本的步骤:

```bash
yum makecache -y 

yum update -y 

grub2-editenv list

grub2-set-default 'CentOS Linux (3.10.xxxxx.el7.elrepo.x86_64) 7 (Core)' # entry_name

systemctl reboot
```

清理旧版本的步骤； 

```bash
rpm -qa  kernel* 
# 这个命令会列出所有当前已经安装的版本的内核， 然后手动使用命令移除对应的软件包即可。 
# 我记得是有一个命令可以完全移除全部未使用的内核， 可能记错了， 这命令应该只有在ubuntu 上面是存在的。

yum groupinstall -y "Development Tools"
categories: Linux
yum install -y kernel kernel-devel kernel-debug
```

