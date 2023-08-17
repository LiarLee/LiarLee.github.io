---
title: VMwareTools共享文件夹方案
date: 2019-01-08 14:13:00
tags: Fedora
categories: Linux
---

升级了VMware Workstation 15, 迁移过来Fedora 27的虚拟机里面不能共享剪贴板，不能拖拽复制，共享文件夹设置之后不会挂载在/mnt/hgfs目录下，找到的解决方案如下：  

<!-- more-->

## 解决共享剪贴板

1. fedora 27下，直接安装 
    ``` 
    dnf update -y   
    dnf install -y open-vm-tools-desktop   
    OR  
    dnf install -y open-vm-*
    ```
1. 重启虚拟机即可


## 解决挂载VMware共享文件不显示
1. 这个问题我的解决办法是： 卸载这个机器上的open-vm-tools所有包，安装VMware提供的Tools，才可以正常使用  
1. 那么步骤如下：
    ```
    dnf remove -y opem-vm-*
    reboot  
    ------------
    在VMware中，选择安装VMwareTools，然后提示推荐使用Open-VM-Toools工具，输入YES，强制安装  
    一路回车，直到出现Enjoy.
    reboot
    ```
1. 重启之后可以在/mnt/hgfs目录下看见共享的目录了，完美  
1. 如果需要可以添加一条指令在/etc/fstab条目，
    ```
    vim /etc/fstab
    -   .host:/SHAREDFOLDERNAME     /mnt/hgfs   vmhgfs   defaults    0 0 
1. 收工



