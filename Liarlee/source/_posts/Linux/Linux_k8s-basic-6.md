---
title: Kubernetes集群的学习笔记(6) 
date: 2019-11-06 14:45:20
tags: Kubernetes
categories: Linux
---

K8S的认证部分， ServiceAccount以及RBAC 。

<!-- more -->

# 授权插件

1. Node
2. ABAC
3. RBAC
4. Webhook

常用的授权插件就是RBAC

# 基于角色的授权和访问控制

基于角色的访问控制，就是将权限授予Role，而不是User。 将权限的控制授予Role， 将User分配到Role。默认的是拒绝全部， 无法也无需定义拒绝权限，定义的Permission是许可访问的权限。

1. 角色，User Accouts OR Service Accounts.
2. 许可， Permission分为两个部分：Operation 以及 Object.

## 角色以及角色绑定

Role -- RoleBinding

Role 和 RoleBinding 是建立和控制 NameSpace 级别的权限。

## 集群角色以及集群角色绑定

ClusterRole -- ClusterRoleBinding

Cluster 和 ClusterBinding 是建立和控制 Cluster 级别的权限。

NOTE： 特殊的情况，可以对名称空间级别的

## 特殊的绑定方式

ClusterRole -- RoleBinding

可以使用 RoleBinding 绑定 ClusterRole， 那么这种情况下，Role只是具有NameSpace的权限。**解释一下：**雷在同一个Cluster中有多个不同的NameSpace，我需要对每个NameSpace都授权相同的权限，这种场景下:

- 如果使用RoleBinding 去绑定一个Role，那么每一个NameSpace都需要建立各自的 RoleBinding，并且都要各自绑定到Role。

- 如果建立一个ClusterRole, 使用RoleBinding绑定到ClusterRole上面，那么我只需要定义一个即可在全部集群范围内生效这个权限。这样的就相当于批量的进行Role的授权。

# 相关命令

命令不做过多的解释，所有的资源可以通过explain获取，主要是记录逻辑和思路。

```Shell
~]$ kubectl create role testrole --verb=get,list,watch --resources=pods -o yaml
~]$ kubectl get role
~]$ kubectl describe role pods-reader
~]$ kubectl create rolebinding test-rolebinding --role=testrole --user=testuser -o yaml
~]$ kubectl explain rolebinding
~]$ kubectl config use-context USERNAME@kubernetes
~]$ kubectl create clusterrole test-clusterrole --verb=get,list,watch --resource=pods -o yaml 
~]$ kubectl explain clusterrole
~]$ kubectl get clusterrole
~]$ 
```

# 其他补充

在RBAC中可以存在三类组件：

1. user
2. group
3. service account

创建Pod的过程中可以指定一个值叫做ServiceAccountName，如果授权ServiceAccount高等级的权限，那么，Pod会以这个Account运行，那么Pod中的应用程序也会有ServiceAccount的权限。也就是提高了Pod应用程序的等级，使得Pod可以对K8S的相关资源进行管理和配置。





