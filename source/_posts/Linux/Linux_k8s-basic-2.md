---
title: Kubernetes集群的学习笔记(2)
date: 2019-07-23 21:00:03
categories: Kubernetes
tags:
  - Kubernetes
---

Kubernetes的基本使用命令。

对控制命令进行分类整理：
# 查看k8s整体状态的命令
1. kubectl describe node node1.docker 
    查看node的详细信息
2. kubectl version 
	查看kube的版本信息，同时显示客户端的版本及服务端的版本
3. kubectl cluster-info
	查看kube的集群信息，master节点的所在地址及kubeDNS的所在地址
# 手动运行Pods的命令
4. kubectl run nginx --image=nginx --replicas=5
	启动5个nginx的pods
5. kubectl run nginx --image=nginx --port:80 --replicas=5 --dry-run=true
	启动5个nginx的pod的测试，但不执行改变，并expose端口80
# 查看Pods的命令
6. kubectl get pods
	列出所有节点正在运行的pod的状态信息
7. kubectl get deployment
	列出所有的deployment控制器的信息，**所有的pod属于cni0桥，不属于docker桥**
# 删除单独一个Pods的命令
8.  kubectl delete pods hayden-nginx-6dd3ffd4c5-ww7mk
	删除一个指定的pod
# 手动建立Pods并对外发布的命令
9.  kubectl expose deployment hayden-nginx --type=[{ClusterIP},NodePort,LoadBalancer,ExternalName]  --name=nginx-service --target-port=80 --protocol=TCP
	创建一个新的service，将内部的通信以service的形式对外交付
# 查看svc状态的命令
10.  kubectl get svc
	查看service的状态
# 查看属于某个名称空间的命令
11.  kubectl get nodes -n kube-system -o wide
	查看属于kube-system的节点的信息
12.  kubectl get svc -n kube-system -o wide
    查看属于kube-system的服务的信息
# 从不重启Pods的设置
13.  kubectl run t-centos --image=centos -it --restart=Never --replicas=1
    启动1个普通的容器作为客户端进行服务的访问
14.  kubectl describe svc nginx-service
    查看指定服务的详细信息
15.  kubectl get nodes --show-labels
    查看节点的标签
# 对svc进行编辑和修改
16.  kubectl edit svc nginx-service
    编辑一个service的属性，命令打开vim的编辑界面进行配置文件的更改
17.  kubectl delete svc nginx-service
    删除一个service
18.  kubectl get deployment -w
    长时间监控一个控制器的状态改变
# 对Pods的升级和回滚
19.  kubectl set image deployment hayden-nginx hayden-nginx=nginx:latest
    对容器指定其他的镜像进行动态的升级及更新
20.  kubectl rollout status deployment hayden-nginx
	对容器版本的更新进行进度的查看
# 指定版本的回滚
21.  kubectl rollout undo deployment hayden-nginx
    对升级的版本进行回滚，可指定回滚的版本，默认是上一个版本
# Service发布到NodePort
外部访问到service的方法是定义type为NodePort，可在创建service的时候定义类型，或者使用kubectl edit svc nginx-service将type变更为NodePort 。

# 创建资源的逻辑思路
刚从docker的管理思路过来的时候还是有些茫然， 不太知道该怎么用。其实从k8s的管理逻辑上，我们将之前的container 变更为 pod，将pod的管理交给一个deployment，将deployment已经启动的所有容器通过对外提供service的方式expose到外部。例如：我需要一个httpd服务，不需要直接去docker启动了，我直接在k8s上定义一个deployment-httpd，通过k8s的控制器去调度容器。如果需要控制容器对外提供服务，那就直接创建一个service，通过service去直接定义和管理对外的服务即可。