---
title: 命令碎片 - NMI crash and dracut add driver
category: Linux
date: 2023-06-28 17:12:22
tags: Linux
---

## 在ec2触发linux的crash



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

相关文档： 

[New – Trigger a Kernel Panic to Diagnose Unresponsive EC2 Instances](https://aws.amazon.com/blogs/aws/new-trigger-a-kernel-panic-to-diagnose-unresponsive-ec2-instances/)

[发送诊断中断（适用于高级用户）](https://docs.aws.amazon.com/zh_cn/AWSEC2/latest/UserGuide/diagnostic-interrupt.html)

主要的问题是怎么解读这个结果， 目前我的理解是 找大佬。

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

### 安全软件引起的用户空间进程失去响应： 

Redhat关于这个问题的文档说明： 

- https://access.redhat.com/solutions/5201171

- https://access.redhat.com/solutions/2838901

使用Ftrace的方法，和一部分命令的使用方法： 

```bash
[root@ip-172-31-51-167 ~]$ echo 'func fanotify_get_response +p' > /sys/kernel/debug/dynamic_debug/control
```

追踪这个系统调用， 并输出 callgraph.
内核的DynamicTracing， 这是一个古老的方式了， 出现在Kprobe之前。会直接将追踪的结果输出到dmesg中。 

```bash
[root@ip-172-31-51-167 ~]$ perf trace -s -p 2688
[root@ip-172-31-51-167 ~]$ cd /var/crash/127.0.0.1-2023-08-11-06:53:10
[root@ip-172-31-51-167 ~]$ crash /usr/lib/debug/lib/modules/6.1.34-59.116.amzn2023.x86_64/vmlinux  vmcore
[root@ip-172-31-51-167 127.0.0.1-2023-08-11-06:53:10]$ ll /var/crash
total 0
drwxr-xr-x. 2 root root 67 Aug 10 05:52 127.0.0.1-2023-08-10-05:52:16
drwxr-xr-x. 2 root root 67 Aug 10 06:13 127.0.0.1-2023-08-10-06:13:44
drwxr-xr-x. 2 root root 67 Aug 11 05:45 127.0.0.1-2023-08-10-13:03:27
drwxr-xr-x. 2 root root 91 Aug 12 15:05 127.0.0.1-2023-08-11-04:57:13
drwxr-xr-x. 2 root root 67 Aug 11 08:41 127.0.0.1-2023-08-11-06:53:10
drwxr-xr-x. 2 root root 67 Aug 11 20:56 badstop
drwxr-xr-x. 2 root root 41 Aug 11 20:46 crash
```













### grubby 命令简单的用法

设置内核参数： 

```bash
# 查看所有内核的参数
$ grubby --info=ALL
# 设置默认的启动内核
$ grubby --set-default-index=1
# 查看当前的默认启动内核
$ grubby --default-kernel
# 移除所有内核的参数
$ grubby --update-kernel=ALL --remove-args="systemd.log_level=debug systemd.log_target=kmsg log_buf_len=1M loglevel=8 crashkernel=512M"
# 更新所有内核的参数
$ grubby --update-kernel=ALL --args="systemd.log_level=debug systemd.log_target=kmsg log_buf_len=1M loglevel=8 crashkernel=512M"
# 为特定的内核添加参数。
$ grubby --update-kernel=/boot/vmlinuz-5.9.1-1.el8.elrepo.x86_64 --args=“systemd.log_level=debug systemd.log_target=kmsg log_buf_len=1M loglevel=8 crashkernel=512M”

[root@ip-172-31-0-170 ~]# sudo kdumpctl status
kdump: Kdump is operational

[root@ip-172-31-0-170 ~]# sudo kdumpctl showmem
kdump: Reserved 256MB memory for crash kernel

[root@ip-172-31-0-170 ~]# cat /proc/cmdline
BOOT_IMAGE=(hd0,gpt1)/boot/vmlinuz-6.1.34-59.116.amzn2023.x86_64 root=UUID=483d7075-a0f8-4ba8-a951-a668fa079cac ro console=tty0 console=ttyS0,115200n8 nvme_core.io_timeout=42949672
95 rd.emergency=poweroff rd.shell=0 selinux=1 security=selinux quiet systemd.log_level=debug systemd.log_target=kmsg log_buf_len=1M loglevel=8 crashkernel=512M

```

