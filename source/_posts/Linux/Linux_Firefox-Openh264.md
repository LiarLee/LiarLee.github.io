---
title: Firefox-Openh264的问题
date: 2017-12-28 17:24:52
categories: Linux
tags:
  - Application
  - Firefox
---

fedora27中Firefox插件OpenH264不启用  

# 环境
OS：Fedora 27 Workstation  
Software: Firefox 57  

# 问题
Firefox的插件中提示OpenH264 未启用，不能正常使用，打开视频站点不能播放视频。  
在插件中调整插件状态为 Always Activate，插件状态改变为将被安装，但是无论的等待多久这个插件的安装状态不会改变，依旧不能正常工作。  

# 解决办法
查找到[官方WIKI](http://fedoraproject.org/wiki/OpenH264)，给出了如下的解决办法：  
1. 在Fedora默认给出的官方源中，有一个名称是：fedora-cisco-openh264.repo
2. 这个源默认关闭，开启它  
`sudo dnf config-manager --set-enabled fedora-cisco-openh264`  
3. 安装如下两个插件  
`sudo dnf install gstreamer1-plugin-openh264 mozilla-openh264`  
4. 重启Firefox查看插件状态已经恢复正常，启动openh264插件即可。

# Openh264测试页
[Simple mozRTCPeerConnection Video Test](http://mozilla.github.io/webrtc-landing/pc_test_h264.html)
