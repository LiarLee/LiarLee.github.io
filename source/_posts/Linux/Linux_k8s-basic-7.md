---
title: Kubernetes集群的学习笔记(7)
date: 2019-11-06 16:07:53
categories: Kubernetes
tags: Kubernetes
---

Kubernetes的Dashboard 和 分级认证权限。
# Dashboard的简介

Dashboard算是k8s的一个管理的web界面。不做具体的操作，登录的时候使用的是K8S提供的用户名和密码。

## Dashboard的部署

只需要从github进行apply资源清单即可。

## Dashboard的登录

### 使用Token登录

1. 获取系统中默认的admin的token，或者创建一个需要登录和管理的ServiceAccount，然后Binding到Role或者 ClusterRole,进行权限的控制

2.  查看集群中自动创建的dashboard的secret， 系统部署完成之后自动创建了一个可管理全部集群的secret

   ```Shell
   ~]$ kubectl get secret -n kube-system | grep dashboard
   dashboard-admin-token-g85h7                      kubernetes.io/service-account-token   3      109d
   ```

3. 在这个secret中有Token相关的信息

   ```
   ~]$ kubectl describe secret dashboard-admin-token-g85h7 -n kube-system
   ```

4. 其中的**Token字段**的内容就是可以用来登录的令牌。复制到dashboard中粘贴即可

### 使用config文件登录

1. 创建ServiceAccount，Binding到role
2. 获取Secret，然后查看他的token
3. 制作config文件
4. 使用config文件登录

## Kubernetes的管理方式

1. 命令

   create , run ,expose , delete ,edit ....

2. 命令式配置文件

   create -f , delete -f , replace -f 

3. 声明式配置文件

   apply -f , patch

一般不混合使用，1.2 使用的是替换，但是3是立刻修改，立刻生效，所以还是比较危险的。

