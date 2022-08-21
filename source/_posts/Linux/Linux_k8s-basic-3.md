---
title: Kubernetes集群的学习笔记(3)
date: 2019-09-24 17:30:50
tags: Kubernetes
categories: Linux
---

k8s笔记YAML格式定义资源。

<!-- more -->

# 通过YAML定义Pods
## apiVersion 
kubectl api-versions
查看所有可用的组名
apiVersion:[Group/Version]
## kind 资源类别 
## metadata 元数据
1. name: uniq Key
2. namespace
3. labels Key-Value
   1. annotations 
   2. SelfLink: 资源引用的链接API格式：/api/group/verison/namespaces/namespace/type/name
## spec
`kubectl explain pods.spec`  
可使用命令查看：定义用户期望的目标状态。
## status 
自动维护即可 ，不需要更改。

# 简单的YAML实例 
```
apiVersion: v1 
kind: Pod
metadata:
    name: myapp-pod
    labels:
        app: myapp
        version: v1
spec: 
    containers:
    - name: app
      image: nginx
   - name: php-fpm
      image: php-fpm
```

## 对Pods进行标签操作 
1. 查看标签
   kubectl get pods --show-labels
   kubectl get pods -l LABEL_NAME --show-labels
2. 增加标签
   kubectl label pods pod-demo KEY VALUE
3. 修改标签
   kubectl label pods pod-demo KEY VALUE --overwirte
4. 指定selector选择标签 - 等值关系， 集合关系的标签选择器。
   kubectl get pods -l release=stable 
   kubectl get pods -l release!=stable
   kubectl get pods -l "release in (v1, v2, v3)"
   kubectl get pods -l "release notin (v1, v2, v3)"

   许多资源支持内嵌字段，matchLabels(直接给定键值) ， matchExporession(基于给出的表达式进行选择)。常用的操作符号，In ; Notin ； Exists；NotExists；

## Pod的生命周期 
- 初始化容器init c(初始化主容器的执行环境)，可以有多个，串行执行，直到最后一个init c执行结束。
- main c在所有的初始化完成之后开始启动，在容器的运行时间与main c的执行时间基本一致；main c刚刚启动之后，可以手动执行Poststart；结束之前可以进行Prestop；
- 在Pod运行的过程中，提供Pod的Liveness probe； 提供Pod的Readiness probe。

常见的Pod状态：
1. Pending： 挂起，调度尚未完成；
2. Running： 运行状态；
3. Failed： 失败；
4. Succeeded： 成功；
5. Unknown: kubelet失去联络或者无法获取Pod信息时；

创建Pod的阶段：
1. 创建提交请求给API server，目标状态保存到etcd;
2. API Server 请求 Schduler 进行Pod的调度；
3. API取得Pod的调度结果后，将信息记录到etcd；
4. Node节点获取到API server上的Pod状态更新后，开始按照调度的信息进行Pod的建立。

Pod生命周期中的重要行为：
1. 初始化容器： init container ; 
2. 容器探测： liveness ,readiness; 

容器的重启策略： restartPolicy 
Always, OnFailure, Never; 三种策略中默认的设置时Always.

Pod的终止过程：
1. 发送term信号， 默认等待30s，如果30s还未终止就强制终止。

## 存活检测
可通过三种类型进行探测： ExecAction, TCPSocketAction, HTTPGetAction;

