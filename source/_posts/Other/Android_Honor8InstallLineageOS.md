---
title: 荣耀8-刷LineageOS14.1简述
date: 2018-07-08 17:47:39
tags: Android
category: Linux
---

荣耀8刷LineageOS 14.1 , 感谢XDA的大神们。用到的刷机包我转存了一份到微云，链接在末尾。  

<!-- more -->  

![SystemHome.png](https://i.loli.net/2018/08/02/5b628ca68c86f.png)

## 一 基本情况
1. 设备： 华为荣耀8 FRD-AL10 国行  
1. 初始系统版本： B396   EMUI 5.0.1   
1. 解锁状态： Phone Unlocked  

---
## 二 需要准备的原料
1. 手机  
1. SD卡  
1. 电脑一台，USB线一根  
1. 荣耀8海外版安装包  
    Name:update.zip & update_data_full_hw_usa.zip
1. OpenKirin TWRP 3.1.1.1 
    Name:twrp-3.1.1-1-frd.img 
1. LineageOS ROM From XDA  
    Name:lineage-14.1-20170812-Unofficial.zip
1. OpenGAPPS  
    Name:open_gapps-arm64-7.1-stock-20180705.zip 
1. SuperSU  
    Name:SuperSU-v2.82-201705271822.zip
1. Dolby ATOM安装包  
![Install Packages.png](https://i.loli.net/2018/08/02/5b628c9965473.png)

---
## 三 流程
### 1 解锁手机
1. 首先需要进行华为手机的解锁，百度一下有很多，所以不再过多的介绍。
1. 需要知道是我大华为要关闭后续的解锁服务了，所以今后即便是刷如果你没有解锁码也只能作罢。

---
### 2 复制安装包到SD卡
1. 在SD卡上新建一个文件夹，名字叫做packages , 或者其他也可以。
1. 复制4-9项文件到SD卡
1. 将SD卡放入手机。

---
### 3 写入TWRP
1. 解锁之后可以使用命令来写入TWRP Recovery。 Recovery使用的openkirin项目组的版本。请自行确保驱动及手机的连接处于正常状态即可。
1. 打开adb工具目录，在工具目录中使用Shift+鼠标右键，将文件夹在命令行或Powershell中打开。
1. adb.exe devices   ------  ## 查看是否识别手机成功。
1. adb.exe reboot fastboot --------- ## 将手机重启至fastboot模式.
    **NOTE** -- 进入fastboot的方式，除了adb reboot fastboot之外还可以，关机，手机连接电脑，*开机键*加*音量-*，直到出现fastboot界面为止。
1. fastboot.exe flash recovery ./twrp-3.1.1.1-frd.img ------  ## 写入Recovery
1. fastboot.exe reboot ------  ## 重启手机。  
![HomeScreenTWRP.png](https://i.loli.net/2018/08/02/5b628c9962113.png)

---
### 4 安装海外版ROM
1. XDA原帖 -- [HERE](https://forum.xda-developers.com/honor-8/how-to/to-emui5-custom-roms-tested-openkirin-t3638445)
1. 拔掉数据线，关机，长按 *音量+* 和 *开机* ， 直到出现 *解锁警告* 和 *Your device is booting now ...*
1. 进入Recovery，一次进入Install -- Select Storage -- Micro SDCard -- OK -- Packages。
1. 点击update.zip -- Swipt to confirm Flash. 
1. 等待写入成功后会自动重启。
1. 自动进入eRecovery安装更新，这个是正常的，不用管他就好。
1. 安装更新之后会自动重启，**这个时候TWRP会被覆盖**，也就是说你的TWRP手机上已经没有了，被替换成了ROM里面华为默认的recovery，需要重新进入fastboot再写入一次TWRP。
1. 按照写入TWRP的步骤再来一次即可。  
    **NOTE** -- 如果提示写入TWRP失败，需要再使用解锁码解锁一次手机，不要需要管fastboot界面的那个提示。我的手机当时显示的是已经解锁，但是其实是没有的，需要2次解锁手机才可以写入TWRP。
1. 再次进入TWRP之后，重复第2步，找到update_data_full_hw_usa.zip -- Swipt to confirm Flash.
1. 自动写入成功后会自动重启，进入系统后查看关于手机，其中名称变为NRD90M。说明我们已经可以写入LineageOS了。

---
### 5 卡刷LineageOS
1. XDA原帖 -- [HERE](https://forum.xda-developers.com/honor-8/development/rom-lineageos-14-1-honor-8-t3615506)
1. 我用的是US Model -- FRD-L14C567 -- B360 ，可以使用。
1. 重启手机，进入TWRP， 双清，格式化data分区。  
![Wipe.png](https://i.loli.net/2018/08/02/5b628c9961462.png)
1. 选择lineage-14.1-20170812-Unofficial.zip -- Swipt to confirm Flash.
1. 等待写入成功之后重启。  
**NOTE** -- 如果写入之后一直卡在开机动画，解决方法是进入TWRP -- 格式化data分区即可。
1. 第一次开机的过程可能有些慢，但是只要第一进入了系统就可以了，后面不会再出现问题了。
1. 刷入LineageOS完成。

---
### 6 安装SuperSU
1. SuperSU官网 -- [HERE](http://www.supersu.com/)
1. 选择SuperSU-v2.82-201705271822.zip -- Swipt to confirm Flash.
1. 进入系统就可以看到了，可以直接使用。
1. 如果不是用SuperSU，可以使用Magisk，好像这个好用一些。  
![Magisk.png](https://i.loli.net/2018/08/02/5b628c9964202.png)

---
### 7 安装OpenGAPPS
1. OpenGAPPS官网 -- [HERE](https://opengapps.org/)
1. 进入TWRP， 选择open_gapps-arm64-7.1-stock-20180705.zip -- Swipt to confirm Flash.
1. 重启之后就可以在系统里面看到了，我选择的这个版本是替换系统应用的版本，所以可以提供一个近乎于原生的体验。

---
### 8 安装杜比ATOMS
1. **XDA原帖** -- [HERE](https://forum.xda-developers.com/android/apps-games/soundmod-axon-7-dolby-atmos-t3412342)
1. 选择dax_lemax2_v1.6.3.zip -- Swipe to confirm Flash.  
**NOTE** -- 帖子中给出了五个安装包，我基本上是尝试到第二个的时候成功了，所以我在这个把原帖放出来是说，可能这个需要不同的机型去尝试。
1. 重启可以在系统应用中直接看到。可以开启或者关闭。  
1. 可以选择使用Viper或者Dolby，看自己的喜好了。
**NOTE** -- 这种应用，我觉得有一个就够了，其实只是优化一下外放的效果。

---
## 四 结尾
只是不习惯如此多的ROM里面内置了很多我不使用的应用，还不能删除。  
**其实还是那句话，不建议刷机，如果你知道自己在做什么。**

---
## 五 共享下载资源
包括我所有文中使用到的安装包及文件，我上传到了微云，下载链接如下。 
**NOTE** -- opengapps的安装包我替换成了pico，这样不需要翻墙，只有Google的框架和基础应用，也不会替换系统应用。  
**下载地址** -- [HERE](https://share.weiyun.com/5wQdXtO)   
密码：9yn57o

---