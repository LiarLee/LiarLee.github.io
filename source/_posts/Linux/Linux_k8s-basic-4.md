---
title: Kubernetes集群的学习笔记(4)
date: 2019-10-14 14:37:10
categories: Kubernetes
tags: Kubernetes
---

K8S Service资源的笔记以及Ingress资源的笔记。

# k8s的service

service的模型： userspace(kube-proxy), iptables, ipvs 

## Service的类型

请求发送的过程：

- Client --> Node's IP:Node's Port --> Cluster's IP:ServicePort --> PodIP: ContainerPort

Service的类型：

- ClusterIP是将提供服务的Pods统一建立一个集群内部的可访问接口，为集群内部的服务提供入口，PodsPort to ClusterIP:Port.

- NodePort是将Node的端口映射出去的方式，每个节点各自对外提供一组IP:Port用来对外提供服务 - PodsPort to NodePort.

- LoadBalancer使用LBaaS的方式对外提供服务，共有云环境可用，例如阿里云。

- Externalname可将外部的服务引入到集群的内部，需要提供的字段是外部网络的真正的DNS服务的CNAME（FQDN）。

- HeadlessService是不提供ClusterIP，可将ServiceName直接解析到PodsIP。

上面的每一个类型的服务都是顺序增强的，也就是说，基础的模式是 ClusterIP 。

### HTTPS的处理和思路

1. 启动一个Pod对HTTPS进行卸载和LB

   如果需要对HTTPS进行配置，Kubernetes本身提供的Service不能提供7层协议的卸载(将HTTPS卸载为HTTP与后端做通信以及数据交换),那么可行的方案是，建立一个新的Pod，例如nginx，由nginx-pod进行HTTPS的代理和卸载操作，但是这样的话就会有如下的流程： 

   User Request --> LBaaS(LB) --> Service - NodePort(LB) --> Pod - nginx proxy(LB) --> BackendPods

   PROBLEM: 在这种情况下，用户的请求需要进行两次负载的转换才可以到达Pod，开销太大。

2. 将Nginx的Pod与Node的Net名称空间进行共享

   使得Nginx的Pod直接工作在Node的网卡级别上。免去了K8S的Service中间的一次转发。为了避免单点的故障，可将DeamonSet将Pod运行在一部分节点上。

## Ingress Controller

可以用于处理和卸载HTTPS协议的负载均衡器Pod控制器。

K8S四个附件： DNS， DashBoard， Ingress Controller,  heasper。

如上的那种NginxPod，衍生为Ingress Controller， 独立运行的应用程序组成，不属于Controller Manager。通常由4种选择：HAProxy，Nginx，Envoy，Traefik。微服务使用更多的是Envoy。

### Ingress资源

定义IngressController如何建立一个期望的前端（Nginx URL Rewrite），同时定义了期望的后端(Upstream servers)，更新后端负载Pod的信息。

### Ingress类型

### Ingress资源的定义格式

使用NginxServer的方式进行配置IngressPod

```YAML
apiVersion: Extensions/v1beta1
kind: Ingress
metadata:
	name: ingress-nginx
	namespace: default
	annotations: 
		kubernetes.io/ingress.class: "nginx"
spec:
	rules:
	- host: nginx.test.local
	  http:
	  	paths:
	  	- path:
	  	  backend:
	  		serviceName: svc-nginx
	  		servicePort: 80 		 	
```

