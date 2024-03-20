---
title: CheatSheet_Kubernetes
category: Kubernetes
date: 2333-12-08 13:57:57
tags:
  - Kubernetes
  - CheatSheet
---
### 移除所有失败的pod
```shell
kubectl delete pod --field-selector="status.phase==Failed"
```

### 查看证书信息
查看 AWS LoadBalancer 证书的信息，检查证书的有效期： 
```bash
kubectl get validatingwebhookconfigurations.admissionregistration.k8s.io aws-load-balancer-webhook -ojsonpath={.webhooks[0].clientConfig.caBundle}  | base64 -d  | openssl x509 -noout -text
```

### 使用 Debug 容器
```bash
# 给特定的容器附加一个Sidecar， 并启动shell。
kubectl debug -it --image=public.ecr.aws/amazonlinux/amazonlinux:latest aws-node-cpmck
# netshoot容器， 比较方便的用来进行网络部分的调试。
# 项目仓库地址： https://github.com/nicolaka/netshoot
kubectl debug mypod -it --image=nicolaka/netshoot
```
### 查看EKS集群插件的兼容范围
```shell
aws eks describe-addon-versions --kubernetes-version 1.25 --addon-name vpc-cni | grep addonVersion
```
### 列出节点上所有容器的镜像名称
```shell
# ssh 到节点上面执行
nerdctl inspect $(nerdctl ps -a -q) | grep -i "image.:"  | sort -f

# 清理节点上未使用的镜像，不仅仅是 dangling image
nerdctl image prune -af

# 设置 nerdctl 命令的自动补全
nerdctl completion bash > /etc/bash_completion.d/nerdctl
```