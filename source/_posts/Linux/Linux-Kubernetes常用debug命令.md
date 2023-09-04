---
title: Linux_Kubernetes常用debug命令
date: 2023-09-04 09:08:02
category: Linux
tags: Linux, Kubernetes
---
查看 AWS LoadBalancer 证书的信息，检查证书的有效期： 
```bash
kubectl get validatingwebhookconfigurations.admissionregistration.k8s.io aws-load-balancer-webhook -ojsonpath={.webhooks[0].clientConfig.caBundle}  | base64 -d  | openssl x509 -noout -text
```

使用 debug 容器： 
```bash
# 给特定的容器附加一个Sidecar， 并启动shell。
kubectl debug -it --image=public.ecr.aws/amazonlinux/amazonlinux:latest aws-node-cpmck
# netshoot容器， 比较方便的用来进行网络部分的调试。
# 项目仓库地址： https://github.com/nicolaka/netshoot
kubectl debug mypod -it --image=nicolaka/netshoot
```
