---
title: 命令碎片 - NMI crash and dracut add driver
category: Linux
date: 2023-06-28 17:12:22
tags: Linux
---

## 在aws触发linux的crash

发送一个诊断请求给EC2， 触发os本身NMI Unknown事件，这个时间会触发Kdump记录当时的现场。

```bash
aws ec2 send-diagnostic-interrupt --region cn-north-1 --instance-id i-********************
```

记录下来的现场文件保存在 /var/crash/ 

```bash

[root@mysql 5.14.0-284.11.1.el9_2.x86_64]# ll /var/crash/
total 0
drwxr-xr-x. 2 root root 67 Jun  6 05:22 127.0.0.1-2023-06-06-05:22:11
drwxr-xr-x. 2 root root 67 Jun  6 08:58 127.0.0.1-2023-06-06-08:58:20
drwxr-xr-x. 2 root root 67 Jun  9 09:39 127.0.0.1-2023-06-09-09:39:56

```

使用Crash命令进行分析， 需要安装kernel-debug 和 kernel-debuginfo kernel-devel

```bash
[root@mysql 5.14.0-284.11.1.el9_2.x86_64]#  crash /usr/lib/debug/lib/modules/5.14.0-284.11.1.el9_2.x86_64/vmlinux /var/crash/127.0.0.1-2023-06-09-09\:39\:56/vmcore
```



## Other

```bash
# 下载源代码
yum download --source kernel
# 解压代码包
rpm2cpio ./kernel-5.14.0-284.11.1.el9_2.src.rpm | cpio -div
tar xf ./linux-5.14.0-284.11.1.el9_2.tar.xz
# 使用命令查看源代码
make cscope ARCH=x86
# 读取并标记tag
make tags ARCH=x86
# 查看
cscope -d
```

## dracut的使用和命令

```bash
# 添加驱动程序到ramfs
]$ dracut -fv --add-drivers "nvme ena" /boot/initramfs-$(uname -r).img $(uname -r)
# 查看是否有模块在ramfs中
]$ lsinitrd /boot/initramfs-$(uname -r).img | grep -E "nvme|ena"
```



