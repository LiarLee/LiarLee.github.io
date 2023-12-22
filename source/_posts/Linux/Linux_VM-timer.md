---
title: KVM中windows7虚拟机时间问题
date: 2019-06-25 15:45:56
categories: Linux
tags:
  - Linux
  - KVM
---

在KVM虚拟机中，安装Windows7的虚拟机，安装完成启动的时候发现虚拟机的时间与外部时间的速度不一致。记录问题的原因及解决方法。
## 解决方式
### 查看虚拟机的配置文件
观察运行的效果类似于GBA模拟器的加速设定，动画速度变快了，windows7的系统时间也被加速了。  首先怀疑的是虚拟机的运行速度是不是被加速了，没有相关的设置。    
其次是查看配置文件中时间的相关定义，发现我的配置文件中，时间的定义是这样的：
```xml
  <clock offset='localtime'>
    <timer name='rtc' tickpolicy='catchup'/>
    <timer name='pit' tickpolicy='delay'/>
    <timer name='hpet' present='no'/>
    <timer name='hypervclock' present='yes'/>
  </clock>
```
怀疑这几个timer是有问题的，一般来说配置文件中只有简单的 clock offset='localtime' 的字段其实就够用了。  
在删除了第一个timer之后，系统的时间和运行速度就正常了。

### 在fedora-wiki找到的说明页面
[Libvirt_Managed_Timers页面链接](https://docs.fedoraproject.org/en-US/Fedora_Draft_Documentation/0.1/html/Virtualization_Deployment_and_Administration_Guide/sect-Virtualization-Tips_and_tricks-Libvirt_Managed_Timers.html)  
在字段中‘rtc'并不是主要的问题，主要问题是后面的tickpolicy='catchcup'。fedora wiki给出的答案是catchup--Deliver at a higher rate to catch up.   
所以这就是为什么我们删除了这个timer之后系统正常的原因。

