---
title: Archlinux安装过程记录
date: 2019-05-17 14:03:08
categories: Linux
tags:
  - Linux
---

自己尝试安装了archlinux在虚拟机里，记录安装过程，不过现在archlinux的WIKI是描述清晰的，直接查看和参考即可。  

## Pacman常用命令

pacman命令的常用说明：  
```
	[root@LiarLee ~]# pacman -Sg gnome  查看gnome软件包组下面的所有软件包  
	[root@LiarLee ~]# pacman -Qe openssh  查询已经安装的软件包  
	[root@LiarLee ~]# pacman -Qs openssh  正则查询软件包
	[root@LiarLee ~]# pacman -Rs $(pacman -Qtdq) 递归删除孤立软件包
	[root@LiarLee ~]# pacman -Ss 关键字：在仓库中搜索含关键字的包
	[root@LiarLee ~]# pacman -Qs 关键字： 搜索已安装的包
	[root@LiarLee ~]# pacman -Qi 包名：查看有关包的详尽信息
	[root@LiarLee ~]# pacman -Ql 包名：列出该包的文件
	[root@LiarLee ~]# pacman -Syyu 下载已经更新本地的所有软件包
```

## 安装Archlinux
### 1. 获取Archlinux镜像
从这个页面获取镜像： [LINK HERE](https://www.archlinux.org/download/)
### 2. 启动到Archlinux Live环境
在VMware中使用镜像文件直接引导Archlinux Live环境。  
### 3. 设置Archlinux的键盘布局
默认为US键盘布局，此处未作修改。    
### 4. 连接到Internet
使用ip link命令查看目前网卡的状态  
```
root@archiso ~ # ip link show
	1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
		link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
	2: ens33: <BROADCAST,MULTICAST,UP,LOWER_UP> dmtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
		link/ether 00:0c:29:5e:ea:d5 brd ff:ff:ff:ff:ff:ff
	
root@archiso ~ # ifconfig
	ens33: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
			inet 192.168.229.129  netmask 255.255.255.0  broadcast 192.168.229.255
			inet6 fe80::9888:f57a:5c25:9cf9  prefixlen 64  scopeid 0x20<link>
			inet6 fd15:4ba5:5a2b:1008:6e02:ff6:feeb:c250  prefixlen 64  scopeid 0x0<global>
			ether 00:0c:29:5e:ea:d5  txqueuelen 1000  (Ethernet)
			RX packets 199  bytes 18652 (18.2 KiB)
			RX errors 0  dropped 0  overruns 0  frame 0
			TX packets 186  bytes 23144 (22.6 KiB)
			TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

	lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
			inet 127.0.0.1  netmask 255.0.0.0
			inet6 ::1  prefixlen 128  scopeid 0x10<host>
			loop  txqueuelen 1000  (Local Loopback)
			RX packets 0  bytes 0 (0.0 B)
			RX errors 0  dropped 0  overruns 0  frame 0
			TX packets 0  bytes 0 (0.0 B)
			TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
		
root@archiso ~ # ping baidu.com   
	PING baidu.com (123.125.114.144) 56(84) bytes of data.
	64 bytes from 123.125.114.144 (123.125.114.144): icmp_seq=1 ttl=128 time=14.8 ms
	64 bytes from 123.125.114.144 (123.125.114.144): icmp_seq=2 ttl=128 time=13.6 ms
	64 bytes from 123.125.114.144 (123.125.114.144): icmp_seq=3 ttl=128 time=17.1 ms
	64 bytes from 123.125.114.144 (123.125.114.144): icmp_seq=4 ttl=128 time=14.1 ms
	64 bytes from 123.125.114.144 (123.125.114.144): icmp_seq=5 ttl=128 time=13.9 ms
	64 bytes from 123.125.114.144 (123.125.114.144): icmp_seq=6 ttl=128 time=14.7 ms
	64 bytes from 123.125.114.144 (123.125.114.144): icmp_seq=7 ttl=128 time=13.5 ms
	64 bytes from 123.125.114.144 (123.125.114.144): icmp_seq=8 ttl=128 time=16.2 ms
	64 bytes from 123.125.114.144 (123.125.114.144): icmp_seq=9 ttl=128 time=16.9 ms
	64 bytes from 123.125.114.144 (123.125.114.144): icmp_seq=10 ttl=128 time=14.1 ms
	^C
	--- baidu.com ping statistics ---
	10 packets transmitted, 10 received, 0% packet loss, time 26ms
	rtt min/avg/max/mdev = 13.543/14.895/17.105/1.278 ms
```
网络连接到此为止无需配置，可以正常访问网络。

### 5. 更新系统时间，硬件时间同步
使用命令查看系统时间以及硬件时间，将同步的当前时间写入硬件：  
```
	root@archiso ~ # timedatectl status
				Local time: Wed 2019-04-24 08:55:39 UTC
			Universal time: Wed 2019-04-24 08:55:39 UTC
					RTC time: Wed 2019-04-24 08:55:40
					Time zone: UTC (UTC, +0000)
	System clock synchronized: yes
				NTP service: active
			RTC in local TZ: no

	root@archiso ~ # timedatectl set-ntp true
```

### 6. 建立系统的硬盘分区
建立硬盘分区，我建立了两个分区，一个根分区和一个交换分区。  
```
root@archiso ~ # fdisk -l 
	Disk /dev/sda: 50 GiB, 53687091200 bytes, 104857600 sectors
	Disk model: VMware Virtual S
	Units: sectors of 1 * 512 = 512 bytes
	Sector size (logical/physical): 512 bytes / 512 bytes
	I/O size (minimum/optimal): 512 bytes / 512 bytes
	Disklabel type: dos
	Disk identifier: 0xba00941d

	Device     Boot   Start       End   Sectors  Size Id Type
	/dev/sda1          2048   1050623   1048576  512M 82 Linux swap / Solaris
	/dev/sda2       1050624 104857599 103806976 49.5G 83 Linux


	Disk /dev/loop0: 491.2 MiB, 515084288 bytes, 1006024 sectors
	Units: sectors of 1 * 512 = 512 bytes
	Sector size (logical/physical): 512 bytes / 512 bytes
	I/O size (minimum/optimal): 512 bytes / 512 bytes
```
### 7. 已经建立分区的格式化
1. 格式化ext4分区
```
	root@archiso ~ # mkfs.ext4 /dev/sda2
```
1. 格式化swap分区
```
	root@archiso ~ # mkswap /dev/sda1  # 将/dev/sda1格式化为swap分区
	root@archiso ~ # swapon /dev/sda1  # 将/dev/sda1启用为swap分区
```
### 8. 挂载分区
使用系统挂载点/mnt，将/dev/sda2作为系统的根目录挂载到/mnt上。 
```
	root@archiso ~ # mount /dev/sda2 /mnt
```
### 9. 定义安装所需的Mirrorlist
### 10. 安装基础的Archlinux系统组件
部署安装linux的文件系统，安装系统基础组建的软件包。  
```
	[root@LiarLee /]# pacstrap /mnt base
```
### 11. 新系统的相关配置
#### 1. Fstab
根据自己建立的分区自动生成系统的分区表。  
	```
	[root@LiarLee /]# genfstab -U /mnt >> /mnt/etc/fstab		# 生成新的fstab，写入安装硬盘的/etc/fstab  
	[root@LiarLee ~]# cat /etc/fstab		#  查看新的分区表
# Static Information about the Filesystems.
# See fstab(5) for Details.

		# <file system> <dir> <type> <options> <dump> <pass>
		# /dev/sda2
		UUID=3b61b364-b9eb-4e31-b65a-55fdcf09c614	/         	ext4      	rw,relatime	0 1
	
		# /dev/sda1
		UUID=91987ac9-fa6b-4ac5-a9c5-014169dcf058	none      	swap      	defaults  	0 0
	```
#### 2. Chroot
使用chroot命令切换根文件系统。  
```
	[root@LiarLee /]# arch-chroot /mnt
```
#### 3. Timezone
chroot命令相当于直接将当前的shell切换到了新安装的系统中。  
设置新的系统的时间及同步硬件时间。  
```
	[root@LiarLee /]# ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
	[root@LiarLee /]# hwclock --systohc
```
#### 4. 本地设置

#### 5. 网络设置
配置hostname以及本地解析hosts文件的解析条目。  
```
[root@LiarLee /]# vim /etc/hostname
	YOUR_HOSTNAME.YOUR_DOMAIN

[root@LiarLee /]# vim /etc/hosts
	127.0.0.1	localhost
	::1		localhost
	IP_ADDRESS 	YOUR_HOSTNAME.YOUR_DOMAIN YOUR_HOSTNAME
```

#### 6. 生成initramfs
为新的系统生成ramfs。  
ramfs的作用是，利用ramfs的文件系统，快速驱动周边的系统设备。在ramfs的使命结束后，自动chroot到新系统的文件系统中。  
```
	[root@LiarLee /]# mkinitcpio -p linux
```
#### 7. 设置root密码
修改root密码。  
```
	[root@LiarLee /]# passwd 
```
#### 8. 安装grub2
这里pacman命令已经可以使用了，因此直接在这个安装grub2，这样才可以在后面正确的重启到新安装好的系统。  
```
	[root@LiarLee /]# pacman -S grub2 
	[root@LiarLee /]# grub-mkconfig 
```
### 12. 重启引导新系统
将已经安装完成的那个根分区卸载，之后就可以重启了。  
```
	[root@LiarLee /]# umount -R /mnt  # umount 接触挂载新的根文件系统  
	[root@LiarLee /]# fuser /mnt		# fuser 查看占用文件系统的进程，如果确认的话可以直接-k结束所有占用的进程
	[root@LiarLee /]# reboot 		# 重启
```
### 13. 安装图形化界面

#### 1. 安装Xorg
安装如下的所有组件，重启就可以进入图形化环境了。  
	1. 运行错误 xterm:command not found  
		```[root@LiarLee /]# pacman -S xterm zlib```
	1. 运行报错 twm:command not found  
		```[root@LiarLee /]# pacman -S xorg-twm xorg-xclock```
	1. 安装鼠标驱动  
		```[root@LiarLee /]# pacman -S xf86-input-mouse```
	1. 安装VMware图形驱动  
		```[root@LiarLee /]# pacman -S xf86-video-vmware```
	1. 安装Xorg服务本体  
		```[root@LiarLee /]# pacman -S xorg-server xorg-xinit ```
	1. 安装Gnome桌面环境  
		```[root@LiarLee /]# pacman -S gnome```
	1. 安装GDM - Gnome桌面管理工具，也可用其他替换  
		[```root@LiarLee /]# pacman -S gdm```

#### 2. 安装图形化之后测试启动速度
systemd提供了命令检测启动的速度，包括内核启动速度以及用户空间的启动速度。
1. systemd-analyze  
1. systemd-analyze blame    

```
	[root@LiarLee ~]# systemd-analyze 
	Startup finished in 1.892s (kernel) + 1.182s (userspace) = 3.075s 
	graphical.target reached after 1.182s in userspace
```
#### 3. 刷新国内的镜像源
```
	[root@LiarLee /]# cd /etc/pacman.d/
	[root@LiarLee pacman.d]#  mv mirrorlist mirrorlist.bak
	[root@LiarLee pacman.d]#  wget -O /etc/pacman.d/mirrorlist https://www.archlinux.org/mirrorlist/?country=CN
	[root@LiarLee pacman.d]#  mv mirrorlist mirrorlist.rank 
	[root@LiarLee pacman.d]#  rankmirrors mirrorlist.rank >> mirrorlist
	[root@LiarLee pacman.d]# sed 's/^Server/#Server/g' ./mirrorlist >> ./mirrorlist
	[root@LiarLee pacman.d]# s[root@LiarLee pacman.d]# spacman -Syyu
```
### 14. 自行编译内核操作
```
	[root@LiarLee /]# pacman -S base-devel bc xmlto kmod inetutils
	[root@LiarLee /]# useradd -d /home/admin -p admin admin  
	[root@LiarLee /]# chown -R admin:admin /home/admin
	[root@LiarLee /]# mkdir /home/admin/mk-new-kernel/
	[root@LiarLee /]# su - admin 
	[root@LiarLee /]# cd /home/admin/mk-new-kernel/
	[root@LiarLee /]# wget https://cdn.kernel.org/pub/linux/kernel/v5.x/linux-5.0.8.tar.xz
	[root@LiarLee /]# tar xvf linux-5.0.8.tar.xz 
	[root@LiarLee /]# cd linux-5.0.8/
	[root@LiarLee /]# make clean && make mrproper
	[root@LiarLee /]# make localmodconfig
	[root@LiarLee /]# make nconfig
	[root@LiarLee /]# make 
```
### 15. 部分问题
1. 重启之后没有DHCP获取IP地址的解决方法：  
``` bash
	[root@LiarLee /]# systemctl enable dhcpcd
	[root@LiarLee /]# systemctl start dhcpcd 
	[root@LiarLee /]# pacman -S net-tools
```

2. Wayland + Sway + Hypeland. （计划中， 等我闲的不行了.....
