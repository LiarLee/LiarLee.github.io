---
title: 删除所有非Running状态的Pod
category: Linux
date: 2023-03-23 23:42:22
tags: Kubernetes
---

# 背景

遇到了一个奇怪的问题， 如果所有的节点上面都有Taint， 然后这个没有Taint的节点磁盘满了， 会导致当前的节点上面留下需要状态不正常的Pod， 这些Pod大概率是停留在了Evicted状态， 或者是Completed, 甚至是 Unknown 就离谱。 

这种状态的Pod Deployment默认的情况下不会自动回收， 所以需要人工操作一下。 


# 处理方法
记录一个命令来处理这个类型的Pod。 

```bash
~$ kubectl delete pod --field-selector="status.phase==Failed"
```

# 测试方法
1. 集群内两个节点， 其中一个节点Taint
  ```bash
  kubectl taint nodes ip-172-31-60-181.cn-north-1.compute.internal app=grafana:NoSchedule
  ```
1. 启动30个Grafana
1. 登录到节点上面， 创建一个巨大的文件， 触发DiskPressure。
  ```bash
  fallocate -l 72G ./large.file
  ```
1. 等待节点的DiskPressure被识别， 然后触发驱逐。 
1. 删除文件， 取消DiskPressure状态， 等待 30 个新的Pod Ready。
   ```bash
   rm -rf ./large.file
   ```
1. 使用命令清除所有不是Running状态的Pod。
   ```bash
   ~$ kubectl delete pod --field-selector="status.phase==Failed"
   ```
1. Over.
