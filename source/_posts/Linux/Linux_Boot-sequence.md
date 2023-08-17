---
title: Linux启动流程简述
date: 2019-07-13 17:18:40
tags: Linux
categories: Linux
---

记录Linux启动流程。

# Linux启动的简要流程
## Linux-MBR启动流程
POST -- GRUB(Bootloader-MBR) -- Kernel -- init
## 详细描述及说明
1. 在触发开机通电之后，计算机读取BIOS中CMOS芯片的已经写好的程序进行主板设备的通电自检.
1. 在自检完成后将读取硬盘上的前512个字节，通过前面的446个字节载入grub的bootloader及硬盘相关驱动.
1. 同时引导grub进入stage1.5,stage1.5指向了定义在boot分区下的grub.cfg，及相关的grub图形文件.
1. grub的stage2进行了grub的菜单展示及内核选择的界面.
1. 通过grub的引导，计算机挂载内核，识别的根文件系统.
1. 启动init进程，通过SysV管理其他进程的启动及执行.

