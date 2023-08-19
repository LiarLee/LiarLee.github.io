---
title: 本地方式安装.Net3.5笔记
date: 2018-01-22 11:55:01
tags: Windows
categories: Windows
---

windows新版本淘汰了.net 3.5，默认不安装。但是在没有网络的时候需要安装就很尴尬，我平时也没有备份这种安装包的习惯。所以找到了如下的解决方案，使用微软的映像部署工具进行安装，步骤如下：  

## 步骤：
1. 挂载微软的官方镜像，或者放入安装光盘。
<!-- more-->
1. 打开cmd或者Powershell
1. 输入命令:  
    `dism.exe /online /enable-feature /all /featurename:NetFX3 Source:Z:\sources\sxs`
1. 等待系统处理命令，完成。

**Note:命令中可以不添加/all，最后一条参数中的Z盘符改为镜像挂载所在的盘符即可**  
