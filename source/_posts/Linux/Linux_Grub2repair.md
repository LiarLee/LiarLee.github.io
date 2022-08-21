---
title: grub2手动修复引导错误
date: 2018-01-09 13:27:57
tags: grub2
categories: Linux
---

grub2引导错误的手动解决方法

<!-- more-->

## grub是什么  
- 引用百度百科    
> GNU GRUB（简称“GRUB”）是一个来自GNU项目的启动引导程序。GRUB是多启动规范的实现，它允许用户可以在计算机内同时拥有多个操作系统，并在计算机启动时选择希望运行的操作系统。GRUB可用于选择操作系统分区上的不同内核，也可用于向这些内核传递启动参数。  
GNU GRUB的前身为Grand Unified Bootloader。它主要用于类Unix系统；同大多Linux发行版一样，GNU系统也采用GNU GRUB作为它的启动器。Solaris从10 1/06版开始在x86系统上也采用GNU GRUB作为启动器。  

- 引用fedora官方wiki  
> GRUB 2 is the latest version of GNU GRUB, the GRand Unified Bootloader. A bootloader is the first software program that runs when a computer starts. It is responsible for loading and transferring control to the operating system kernel, (Linux, in the case of Fedora). The kernel, in turn, initializes the rest of the operating system.    
GRUB 2 has replaced what was formerly known as GRUB (i.e. version 0.9x), which has, in turn, become GRUB Legacy.  
Starting with Fedora 16, GRUB 2 is the default bootloader on x86 BIOS systems. For upgrades of BIOS systems the default is also to install GRUB 2, but you can opt to skip bootloader configuration entirely.   

## 修复grub2引导程序开机失败
一般情况下系统的grub文件不会丢失，但是有的时候比如我们进行了系统设置的更改或者文件的误删除会导致系统无法正常启动，这个时候我们需要对grub进行手动的配置，才能是计算机正确的进入系统之中，进入系统之后只要重新生成grub引导文件，就可以让系统重启自动完成引导进入系统了。  

### 指出/boot位置  
1. 指定grub的硬盘引导分区，也就是/boot所在的硬盘分区  
`grub> root (hd0,0)`  

### 指出vmlinuz内核文件  
1. 指出kernel所在的分区，主要是vmlinuz内核文件所在的位置  
`grub> kernel /vmlinuz`
1. 指出initrd所在的分区，指定初始化文件所在的位置  
`grub> initrd /initrd`  

### 启动  
1. 文件锁定成功之后，就可以启动系统  
`grub> boot`  

## 在系统中重新安装和更改grub2  

### 安装或者重新安装grub2（非必须-如果有需要的时候执行）  
安装grub2到硬盘分区，一般为硬盘的第一个分区的开始位置  
1. 传统引导方式安装grub2  
`[root@localhost /]# grub2-install /dev/sda`  
1. EFI引导安装grub2    
`[root@localhost /]# dnf reinstall grub2-efi shim`  

### 重新生成grub配置文件
使用grub2-mkconfig生成新的grub2配置文件，同时指定引导时读取该文件
不同的安装方式有不同的命令  
1. 标准的传统引导安装方式    
`[root@localhost /]# grub2-mkconfig -o /boot/grub2/grub.cfg`
1. EFI引导方式  
`[root@localhost /]# grub2-mkconfig -o /boot/efi/EFI/fedora/grub.cfg`  

## Windows&Linux双系统修复
windows和linux的双系统请注意安装顺序，可以减少很多麻烦  
- 先安装windows - 然后安装linux  

如果先安装了linux，那么在安装windows之后，系统的MBR会被windows覆写，导致linux系统无法正常引导，这个时候需要使用livecd进行修复grub2，让grub2重新安装并且控制引导系统的分区  

---

---

---

## 删除系统更新之后多余的启动项
系统更新之后总是会多很多的旧版本内核的启动项，每次启动的时候看起来都很乱，简单操作就可以去掉多余的启动项，如下：  

### 暴力方式
1. 在boot目录下面强制删除内核文件，然后重新生成grub2.cfg即可  
```
[root@localhost boot]# rm -rf vmlinuz-4.13.9-300.fc27.x86_64   
[root@localhost boot]# rm -rf vmlinuz-4.14.5-300.fc27.x86_64  
```

1. 重新生成配置文件：  
```
[root@localhost boot]# grub2-mkconfig -o /boot/efi/EFI/fedora/grub.cfg
Generating grub configuration file ...
Found linux image: /boot/vmlinuz-4.14.11-300.fc27.x86_64
Found initrd image: /boot/initramfs-4.14.11-300.fc27.x86_64.img
Found linux image: /boot/vmlinuz-0-rescue-2fbfdacc99ad4255953ae8b2ec521e9d
Found initrd image: /boot/initramfs-0-rescue-2fbfdacc99ad4255953ae8b2ec521e9d.img
done
```

### 正确方式  
- 使用dnf命令卸载旧内核：  
```
[root@localhost /]# dnf remove kernel-4.13.9-300.fc27.x86_64  
[root@localhost /]# dnf remove kernel-4.14.5-300.fc27.x86_64  
```
