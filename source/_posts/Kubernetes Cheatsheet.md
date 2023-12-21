---
title: Kubernetes_Cheatsheet
category: Kubernetes
date: 2023-12-08 13:57:57
tags: Kubernetes
---
### 移除所有失败的pod
```shell
kubectl delete pod --field-selector="status.phase==Failed"
```
