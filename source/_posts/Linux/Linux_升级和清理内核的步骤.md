---
title: 升级以及清理内核的步骤
category: Linux
date: 2023-07-12 06:52:18
tags:
  - Linux
  - Kernel
---

### 通常情况下升级内核版本的步骤
CentOS 升级步骤
```bash
yum makecache -y 

yum update -y 

grub2-editenv list

grub2-set-default 'CentOS Linux (3.10.xxxxx.el7.elrepo.x86_64) 7 (Core)' # entry_name

systemctl reboot
```

### 清理旧版本的步骤
RHEL 或者 Centos
```bash
rpm -qa  kernel* 

# 这个命令会列出所有当前已经安装的版本的内核， 然后手动使用命令移除对应的软件包即可。 
直接使用yum 移除不需要的版本即可. 
yum remove -y kernel-devel-5.10.216-204.855.amzn2.x86_64 kernel-devel-5.10.218-208.862.amzn2.x86_64 kernel-5.10.216-204.855.amzn2.x86_64 kernel-5.10.218-208.862.amzn2.x86_64

rpm -qa | grep kernel
kernel-tools-5.10.219-208.866.amzn2.x86_64
kernel-headers-5.10.219-208.866.amzn2.x86_64
kernel-devel-5.10.219-208.866.amzn2.x86_64
kernel-5.10.219-208.866.amzn2.x86_64

列出确认一下是不是已经清理出来.
ls -alh /boot/
total 29M
dr-xr-xr-x  4 root root 4.0K Jul 19 15:02 ./
dr-xr-xr-x 19 root root  268 Jul  1 17:32 ../
-rw-r--r--  1 root root  174 Jun 18 22:04 .vmlinuz-5.10.219-208.866.amzn2.x86_64.hmac
-rw-------  1 root root 4.5M Jun 18 22:04 System.map-5.10.219-208.866.amzn2.x86_64
-rw-r--r--  1 root root 141K Jun 18 22:04 config-5.10.219-208.866.amzn2.x86_64
drwxr-xr-x  3 root root   17 Oct 14  2022 efi/
drwx------  5 root root   79 Jul 19 15:02 grub2/
-rw-------  1 root root  14M Jul  9 15:03 initramfs-5.10.219-208.866.amzn2.x86_64.img
-rw-r--r--  1 root root 643K Oct 14  2022 initrd-plymouth.img
-rw-r--r--  1 root root 268K Jun 18 22:05 symvers-5.10.219-208.866.amzn2.x86_64.gz
-rwxr-xr-x  1 root root 9.7M Jun 18 22:04 vmlinuz-5.10.219-208.866.amzn2.x86_64*

当然 如果全都卸载了. 也是可以重装的(doge.
yum groupinstall -y "Development Tools"
yum install -y kernel kernel-devel kernel-debug
```

Ubuntu 降级
Ubuntu Online 的内核不能直接卸载, 需要安装, 然后切换, 卸载新的
```shell
root@ip-172-31-59-13:~# update-initramfs -k all -c
update-initramfs: Generating /boot/initrd.img-5.15.0-1048-aws
update-initramfs: Generating /boot/initrd.img-5.4.0-1126-aws

root@ip-172-31-59-13:~# update-grub
Sourcing file `/etc/default/grub'
Sourcing file `/etc/default/grub.d/40-force-partuuid.cfg'
Sourcing file `/etc/default/grub.d/50-cloudimg-settings.cfg'
Sourcing file `/etc/default/grub.d/init-select.cfg'
Generating grub configuration file ...
GRUB_FORCE_PARTUUID is set, will attempt initrdless boot
Found linux image: /boot/vmlinuz-5.15.0-1048-aws
Found initrd image: /boot/microcode.cpio /boot/initrd.img-5.15.0-1048-aws
Found linux image: /boot/vmlinuz-5.4.0-1126-aws
Found initrd image: /boot/microcode.cpio /boot/initrd.img-5.4.0-1126-aws
Found Ubuntu 20.04.6 LTS (20.04) on /dev/nvme0n1p1
done
```

查看可用内核的版本
```shell
root@ip-172-31-59-13:$ apt search linux-image | grep 5.4.0 | grep linux-image | grep aws
```

查看所有已经安装的内核
```shell
root@ip-172-31-59-13:~$ dpkg --get-selections  | grep linux
console-setup-linux				install
libselinux1:amd64				install
linux-aws					install
linux-aws-5.15-headers-5.15.0-1048		install
linux-aws-headers-5.4.0-1126			install
linux-base					install
linux-headers-5.15.0-1048-aws			install
linux-headers-5.4.0-1126-aws			install
linux-headers-aws				install
linux-image-5.15.0-1048-aws			install
linux-image-5.4.0-1126-aws			install
linux-image-aws					install
linux-modules-5.15.0-1048-aws			install
linux-modules-5.4.0-1126-aws			install
util-linux					install
```

安装内核
```shell
root@ip-172-31-59-13:~$ apt install -y linux-image-5.4.0-1126-aws/focal-updates linux-headers-5.4.0-1126-aws
```

指定Grub Entry条目
```shell
root@ip-172-31-59-13:~$ vim /etc/default/grub

其中Entry的变量应该设置为下面的格式:
Advanced options for Ubuntu>Ubuntu, with Linux 5.4.0-1126-aws
```

### 清理内核的步骤 - Version 2
#### Deb 包管理工具清理步骤
- 列出所有已经安装的内核版本：
```shell
dpkg --list | grep linux-image
```
- 列出所有旧的内核并自动删除除当前内核之外的旧内核：
```shell
sudo apt-get autoremove --purge`
```
- 如果想手动删除旧内核，可以使用以下命令，
```shell
sudo apt-get remove --purge linux-image-X.X.X-X-generic
```

#### Rpm 包管理工具的清理步骤
- 查看安装的内核
```shell
rpm -qa | grep kernel
```
- 使用yum卸载
```shell
sudo yum install yum-utils
```
- 设置只保留两个内核
```shell
sudo package-cleanup --oldkernels --count=2
```
 