---
title: 文件系统及文件管理
date: 2019-07-24 15:07:34
categories: Linux
tags:
  - Linux
  - FileSystem
---

Linux文件管理笔记

文件系统默认的规定是遵守FHS规定的。
> FHS(Filesystem Hierarchy Standard) defines the directory structure and directory contents in Linux distributions.    
> [FHS_Website](https://refpecs.linuxfoundation.org/fhs.shtml)

标准的根文件系统，应该具有如下的结构，所有的文件目录均在根文件系统下。
1.  /bin  -- 单用户模式下可运行的二进制命令。所有用户都可以使用。
1. /sbin  -- 基本的系统二进制文件。
2. /boot -- 一般为BootLoaderFiles，例如内核，ramfs，grub等等。
3. /etc  -- 常用的应用程序的全局配置文件。Host-specific system-wide configruation。
   1. /etc/opt  -- /opt目录下的程序的配置文件。
4. /usr  -- 包含了主要的多用户工具及应用。
   1. /usr/share -- Architecture-independent(shared) data.独立架构的共享数据。
   2. /usr/sbin -- 非基础的系统库文件，例如网络管理的守护进程。
   3. /usr/src -- 放内核源码及头文件的目录。
   4. /usr/bin -- 非基础的命令二进制文件，不需要运行在单用户模式下的命令。
   5. /usr/local -- 特指存放本地的数据，例如源码包，二进制包等等。
   6. /usr/lib -- /usr/bin & /usr/sbin下的命令所需要的库文件。
5. /opt -- **Opt**ional application software packages.
6. /mnt -- 文件系统的临时挂载位置。
7. /media -- 默认的可移动设备挂载位置。
8.  /dev  -- 所有的设备，字符设备，块设备。
9.  /lib -- 为/bin & /sbin目录下的文件及程序提供的库文件。
10. /lib64 -- 可替代格式的库文件，这个目录不是必须存在的，例如64位程序会需要这个目录。
11. /tmp -- 临时文件存放目录。定期清除。
12. /sys  -- 设备，驱动，一些内核功能的相关信息。
13. /proc -- 虚拟文件系统展示进程及内核信息文件。系统启动目录创建，系统关闭目录消失。
14. /var -- 变量文件。在系统运行的过程中反复变化的文件。比如日志，邮件，信息输出等。
    1. /var/log -- 系统应用程序产生的日志文件默认存放路径。
    2. /var/spool/mail -- 每个用户的邮件。
15. /home -- 用户的家目录，saved files, personal settings,etc.

Bash文件色彩显示的定义在： /etc/DIR_COLORS , 文件中定义了所有文件类型在Bash中的色彩。
**新技巧： 有一个$OLDPWD，可通过`cd -` 切换到上一次离开的目录**

