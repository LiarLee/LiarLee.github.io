---
title: Windows Core EKS 节点管理命令
category: Kubernetes
date: 2023-12-05 10:11:22
tags:
  - Kubernetes
  - EKS
  - AWS
---
 
windows 查看磁盘空间的使用情况: 
```powershell
Get-PSDrive -Name C | Select-Object Name, Free
```

windows 实例的磁盘空间扩容
```powershell
diskpart
list volume
select volume 0
extend
```
从ecr下载镜像
```powershell
$ecrCreds = (Get-ECRLoginCommand).password

Write-Host $ecrCreds

ctr  -n k8s.io image pull -u AWS:$ecrCreds ecr link
```
pull image 需要使用节点的C盘空间, 　在节点的磁盘空间不足的情况下，会报错。　
```powershell
 rpc error: code = Unknown desc = failed to pull and unpack image 
 failed to extract layer sha256:9ee7a25f1f619685e0c27cd1f08b34fd7a567f8f0fa789gf9aeb79c72169afa: hcsshim::ImportLayer failed in Win32: There is not enough space on the disk. (0x70): unknown
```