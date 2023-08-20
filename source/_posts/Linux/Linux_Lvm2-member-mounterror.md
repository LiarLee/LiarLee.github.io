---
title: 记一次旧LVM硬盘挂载失败
date: 2020-05-30 17:54:47
categories: Linux
tags: Linux, LVM, Filesystem, IO
---

我之前的硬盘上是fedora默认的LVM分区，我换了硬盘之后，弄了一个硬盘盒，把旧的硬盘放进去，连到电脑上试图把旧的数据取出来。发现系统已经正确的识别了PV，VG，LV，但是不能挂载， 提示无法读取硬盘的Superblock 和提示 mount: unknown filesystem type 'LVM2_member（这个提示说明你是直接挂载的/dev/sdx，LVM需要你挂载的应该是逻辑卷，不是物理设备）。

<!-- more-->

## 问题是这样的

```shell
HaydenArchLinux$ lvs
  LV   VG                    Attr       LSize    Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  home fedora_localhost-live -wi------- <118.77g
  root fedora_localhost-live -wi-------   70.00g
  swap fedora_localhost-live -wi-------    7.75g
  
---
HaydenArchLinux$ vgs
  VG                    #PV #LV #SN Attr   VSize    VFree
  fedora_localhost-live   1   3   0 wz--n- <196.52g    0

---
HaydenArchLinux$ vgchange -ay /dev/fedora_localhost-live
  device-mapper: create ioctl on fedora_localhost--live-swap LVM-SPkNfSXuuIWyxOArrqJAnfQbYfU4tEKFIj295MyZpNmiMsazbwuGuLsrDgl7u509 failed: Device or resource busy
  device-mapper: create ioctl on fedora_localhost--live-home LVM-SPkNfSXuuIWyxOArrqJAnfQbYfU4tEKFqvyrcOAarRr7ol6o2DbieN2mIRCnqi0m failed: Device or resource busy
  device-mapper: create ioctl on fedora_localhost--live-root LVM-SPkNfSXuuIWyxOArrqJAnfQbYfU4tEKFkTeSg9t8t8dy1jqHhzD6BRcOoJ7dG0H2 failed: Device or resource busy
  0 logical volume(s) in volume group "fedora_localhost-live" now active
  
---
HaydenArchLinux$ lvdisplay
 --- Logical volume ---
  LV Path                /dev/fedora_localhost-live/home
  LV Name                home
  VG Name                fedora_localhost-live
  LV UUID                qvyrcO-AarR-r7ol-6o2D-bieN-2mIR-Cnqi0m
  LV Write Access        read/write
  LV Creation host, time localhost-live, 2020-04-05 03:07:47 +0800
  LV Status              NOT available
  LV Size                <118.77 GiB
  Current LE             30405
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
```

可以注意看上面的vgchange的时候显示LVM-SPkNfSXuuIWyxOArrqJAnfQbYfU4tEKFqvyrcOAarRr7ol6o2DbieN2mIRCnqi0m failed: Device or resource busy， lvdisplay显示lv status是NOT avaliable。

去Google了一下，大部分复制粘贴来的答案都是：

两种方法，第一种是直接mount /dev/fedora_localhost-live/home /mnt;第二种是格式化硬盘。

我不需要这种粗鲁的处理方式，第一种和第二种其实都是废话。

---

## 处理方式是这样的

简单说明一下，使用dmsetup命令，dmsetup是一个偏向底层的逻辑卷管理工具，可以对现在已经有的逻辑卷进行更改。我的初步怀疑是Arch自动识别挂载了旧硬盘的逻辑卷但是，使用了错误的参数，导致设备被占用但是我无法再次挂载使用。使用dmsetup remove 参数将系统现在已经识别出来的逻辑卷移除， 之后手动使用vgchange重新读取，问题解决了。

```shell
HaydenArchLinux$ dmsetup remove /dev/fedora_localhost-live/home
HaydenArchLinux$ vgchange -ay
  3 logical volume(s) in volume group "fedora_localhost-live" now active
HaydenArchLinux$ lvdisplay
  --- Logical volume ---
  LV Path                /dev/fedora_localhost-live/home
  LV Name                home
  VG Name                fedora_localhost-live
  LV UUID                qvyrcO-AarR-r7ol-6o2D-bieN-2mIR-Cnqi0m
  LV Write Access        read/write
  LV Creation host, time localhost-live, 2020-04-05 03:07:47 +0800
  LV Status              available
  # open                 0
  LV Size                <118.77 GiB
  Current LE             30405
  Segments               1
  Allocation             inherit
  Read ahead sectors     auto
  - currently set to     256
  Block device           254:1
HaydenArchLinux$ mount /dev/fedora_localhost-live/home /mnt
```

如上才是正确的处理方式。