---
title: DISM的备份与还原
date: 2018-04-19 18:43:50
tags:
  - Windows
categories: Windows
---

DISM的备份与还原主要是用了Win8之后微软同步发行的系统映像管理工具，全称是：**部署映像服务和管理**。  

<!-- more-->

DISM命令行选项：

	/Append-Image      
		进行映像的附加，更新，对比原有的文件内容进行增量更新。
		*示例：*
		对映像的增量更新	 Dism /Append-Image /ImageFile:install.wim /CaptureDir:D:\ /Name:Drive-D

	/Apply-Image       
		将映像应用于指定的驱动器。
		*示例：*
		单一wim文件的恢复	Dism /apply-image /imagefile:install.wim /index:1 /ApplyDir:D:\
		拆分多个映像文件的恢复	Dism /apply-image /imagefile:install.swm /swmfile:install*.swm /index:1 /applydir:D:\

	/Capture-Image   
		将某个驱动器的映像捕捉到新的 .wim 文件。捕捉的目录包括所有子文件夹和数据。不能捕捉空目录。目录必须至少包含一个文件。
		*示例：*
		生成.wim备份文件到当前目录下	Dism /Capture-Image /ImageFile:install.wim /CaptureDir:D:\ /Name:Drive-D

	/Commit-Image
		对已经装载的映像进行确认提交。
		*示例：*
		对已经挂载的镜像文件进行确认	Dism /Commit-Image /MountDir:C:\test\offline

	/Delete-Image
		从包含多个映像卷的.wim文件中删除指定的映像。
		*示例：*
		删除指定的映像卷	Dism /Delete-Image /ImageFile:install.wim /Index:1

	/List-Image
		显示指定卷映像中的文件和文件夹列表。
		*示例：*
		列出镜像中文件夹列表	Dism /List-Image /ImageFile:install.wim /Index:1

	/Split-Image
		将现有的 .wim 文件拆分为多个只读的拆分 .wim 文件。
		*示例：*
		分割并指定分卷大小	Dism /Split-Image /ImageFile:install.wim /SWMFile:split.swm /FileSize:650

	/Mount-Image
		将wim映像挂载到某个目录下
		*示例：*
		可读写模式	Dism /Mount-Image /ImageFile:C:\test\images\myimage.wim /index:1 /MountDir:C:\test\offline
		只读模式	Dism /Mount-Image /ImageFile:C:\test\images\myimage.vhd /index:1 /MountDir:C:\test\offline /ReadOnly
		只读更改为可读写	Dism /Remount-Image /MountDir:C:\test\offline


	常规处理流程：
	1.捕捉影像并且保存为.wim文件
	2.列出.wim .vhd .vhdx文件中的所有文件
	3.准备一个winPE
	4.进行备份镜像的还原
