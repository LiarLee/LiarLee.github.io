---
title: 如何配置kubelet的节点自动回收资源
date: 2022-04-19 17:45:39
category: Kubernetes
tags:
  - Kubernetes
  - EKS
---

# 配置Node节点按照磁盘阈值回收空间

> https://aws.amazon.com/cn/premiumsupport/knowledge-center/eks-worker-nodes-image-cache/

<!-- more -->

# 修改Kubelet参数
1. Kubelet默认提供了GC的参数  
   ```bash
   --image-gc-high-threshold 参数用于定义触发映像垃圾收集的磁盘使用百分比。默认值为 85%。
   --image-gc-low-threshold 参数用于定义映像垃圾收集尝试释放的磁盘使用百分比。默认值为 80%。  
   ```
2. 如果是自己管理的Node，最好的方式是直接配置kubelet命令行的参数，将上面的参数指定需要的阈值，然后重启kubelet即可。  
   配置文件一般在 ： /etc/kubernetes/kubelet.config
   ```bash
   "imageGCHighThresholdPercent": 70, 
   "imageGCLowThresholdPercent": 50,  
   ```