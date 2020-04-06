---
title: Kubernetes集群的学习笔记(1)
date: 2019-07-21 16:49:56
tags: Kubernetes
categories: Linux
---


Kubernetes基础知识及笔记。

<!-- more -->

# 概念定义
容器的出现以及容器编排引擎出现的原因。
## 容器编排工具
容器最早的模型时LXC+Linux Namespace。容器的出现导致了我们需要对容器进行管理，单机的管理不能满足业务的需要，于是快速衍生出了多种不同的容器编排工具。
Docker提供的工具：

1. docker compose
2. docker swarm 
3. docker machine

IDC的操作系统：
1. [mesos(资源分配工具)](https://en.wikipedia.org/wiki/Apache_Mesos), [marathron(面向容器编排的框架)](https://en.wikipedia.org/wiki/Apache_Mesos#Marathon)

Google的工具：
1. [Kubernetes](https://en.wikipedia.org/wiki/Kubernetes) 

当一个产品可以占据35%以上的份额就已属于自然垄断。k8s现在已经处于垄断地位。
透过容器所产生的衍生概念有: DevOps, MicroServices, BlockChain.
开发模式的开发：[瀑布模型](https://zh.wikipedia.org/wiki/%E7%80%91%E5%B8%83%E6%A8%A1%E5%9E%8B)，进化到了敏捷开发，精益开发，到现在的DevOps.
发布线上的做法：[蓝绿部署，灰度部署，金丝雀(canary)](https://www.jianshu.com/p/022685baba7d)
DevOps几个简单的名词解释：

- CI： 持续集成 - 持续集成通俗一些就是**快速提交代码，快速变更需求，快速合并代码**。

- CD： 持续部署 - 持续部署是指在代码提交变更之后，快速进行部署及测试；传统的代码在提交后需要运维人员手动部署，持续部署其实**就是缩短的部署所需要的步骤和周期，尽可能将部署操作交由自动化完成。**

- CD： 持续交付 - 让软件产品的**产出过程在一个短周期内完成**，以保证软件可以稳定、持续的保持在随时可以发布的状态。

  有时候，持续交付也与持续部署混淆。持续部署意味着所有的变更都会被自动部署到生产环境中。持续交付意味着所有的变更都可以被部署到生产环境中，但是出于业务考虑，可以选择不部署。如果要实施持续部署，必须先实施持续交付。 
  
## 云原生的概念

[Native Cloud Application](https://en.wikipedia.org/wiki/Native_cloud_application) To Wikipedia.

>  A **native cloud application** (NCA) is a type of computer software that natively utilizes services and infrastructure from cloud computing providers.

例如：当容器中的nginx需要变更项目文件的时候，容器的环境已经决定了不太容易对项目的变更,早期的程序设计使用配置文件进行定义。因此，最好的办法是可以通过传递宿主机环境变量的方式对镜像进行设置，当项目有变更的时候直接通过读取环境变量的方式对容器内项目的数据进行配置和更改。基于这种思路设计出来的容器或者软件，叫做云原生应用(Native Cloud Application)。

## K8s的前世 

k8s本来开始是Google内部的Brog系统，Google在Docker被发现了之后，快速的使用Go语言重写了Brog系统，借鉴了Brog的逻辑和设计，所有的代码进行了全面的重构。

[Kubernetes项目的Github页面](https://github.com/kubernetes/kubernetes)

## K8s的特点
- 自动装箱
- 自我修复
- 水平扩展
- 服务发现与负载均衡
- 自动发布和回滚
- 密钥的配置和管理 -- 将配置定义在k8s的对象中，通过k8s在容器启动的时候自动传递环境变量到容器中。
  - 存储编排 -- 可自动创建存储卷供容器需要的自动管理及使用
- 批量处理执行


## K8s的工作流程及逻辑
1. Kubernetes组合多台主机的资源，**整合成资源池**，并**统一对外提供计算、存储等能力**的集群。k8s的集群是Master\Node模型，具有**角色分类**，需要部署master节点及node节点。master节点一般有三个，node节点理论上可以无限增加。
2. k8s的简要工作流程： 收到请求后，*Master节点*上的**Scheduler**用来收集*所有Node*上的可用资源信息，并通过**API Server**告知资源充足的*Node*启动相关的容器；*Node*收到请求会查找需要的镜像，如果本地不存在从*Docker Registery*上面拉取相应的镜像进行所请求容器的启动。
3. k8s可将 *Master节点 + Node节点 + Registery节点* 同时托管在k8s自身的环境中，也就是直接托管在docker虚拟化层上，因此我们可以通过kubeadm等相关的工具将所有的组件使用容器的方式进行管理和调度。
# Master上的主要组件及服务
- API Server # 负责**提供对外的及对内的服务接口**

- Scheduler # 选出适合部署容器的node节点，**两级筛选**：选出所有可以使用的node，在所有合规的node上进行最优选择，选择取决于调度算法。

- Controller-Manager # **检测容器的状态**，如果出现异常或不符合定义的状态，就向API申请重新部署相关容器。

# Node上的主要服务及组件
1. Kube-Proxy
2. 容器引擎，docker
3. Kubelet
4. Flannel
## 逻辑组件：Pod
Node上可以运行及调度逻辑单元pod，pod是k8s的一个逻辑概念，真实运行起来的还是Container，只是k8s为了方便管理，将一个或多个Container封装了成了逻辑上的Pod，打上了相应的标签，使得可以通过Seletor对不同的Pod进行分类管理和选择。Pod是模拟了传统的虚拟机模式(相同主机上的Pod可以使用宿主机的lo进行网络通信),使得可以构建精细的模型。

一个pod中可以有多个容器，共享底层名称空间**net,UTS,IPC**,另外三个互相隔离**user,mnt,pid**. 
#### Sidecar的概念
一般来讲,一个Pod只放入一个容器，如果我们需要放置多个容器，一般为一个主要的一个辅助的，辅助的叫做 sidecar.例如主程序运行在一个容器中，收集日志的程序放在sidecar中。 
#### Pod的标签选择
Pod已经被附加了一些**元数据**，创建完成的Pod可以通过**标签的数值**直接识别Pod的类别。k8s使用**标签选择器selector**来过滤符合条件的资源。所有的对象都可以通过标签选择器进行选择。

### pod的不完全分类
- **自主式pod** # 自行控制自己的生命周期
- **控制器管理的pod** # 通过管理器可管理生命周期的pod
### k8s使用的pod的控制器
- ReplicationController - 最早提供的组件，支持滚动更新和回滚，最早只有一个。**现在已经不再使用。**
- ReplicaSet - 新的工具替代了原始的控制器，但是不直接使用，直接使用的是Deployment来管理无状态的pod。
- StatefulSet - 对有状态的Pod进行管理。
- DaemonSet - 控制容器的进程为守护进程的控制器，每个Node上都会运行一个，无法指定副本的数量。一般用于信息和日志的收集。
- Job, Cronjob - 作业管理， 周期性作业管理。
- HPA - HorizontalPodAutoscaler
# 服务发现的概念
为了能快速管理新启动的pod，在pod和用户之间添加了**逻辑的中间层**，pod启动后需要在service中注册自己的信息,客户端需要相关的服务的时候从service取得相关的信息，完成服务的管理。service是**逻辑组件**，通过**iptables的DNAT来实现**相关的service的功能。

其实服务发现相当于消息中间件，有Pods(生产者)来注册，有用户(消费者)来消费，只是不会被消费掉。

## Kube-proxy的作用
一旦发现了service的改变，反映到Iptables上，同时向API Server报告。 
# Kubernetes的安装部署
通过kubeadm工具进行安装及部署，部署的过程其实不复杂，只是镜像的拉取麻烦了一些，记录了一些简单的步骤和问题。
安装的时候启动了三个虚拟机，一台虚拟机作为Master节点，其他的两台作为Node节点，所有的机器都需要关闭firewalld，k8s会默认托管iptables的相关规则。安装采用k8s自托管的方式，结构如下，列出了在每个节点上必须运行的服务和容器：  

| master             | Node1      | Node2      |
| ------------------ | ---------- | ---------- |
| Kubelet            | Kubelet    | Kubelet    |
| Pause              | Pause      | Pause      |
| Flannel            | Flannel    | Flannel    |
| Kube-Proxy         | Kube-Proxy | Kube-Proxy |
| API Server         |            |            |
| Schedular          |            |            |
| Controller-manager |            |            |
| Coredns            |            |            |
| etcd               |            |            |

机器的信息如下：  

| IP-ADDRESS      | HOSTNAME      | ROLES  |
| --------------- | ------------- | ------ |
| 192.168.229.144 | master.docker | master |
| 192.168.229.145 | node1.docker  | node   |
| 192.168.229.146 | node2.docker  | node   |

## 安装基础环境
这里记录一下所有机器都需要安装的环境及软件。
1. 编辑hostname  
	`vim /etc/hostname`
1. 关闭firewalld  
	`systemctl mask firewalld`
1. 关闭selinux  
    `sudo sed -i 's/SELINUX=enforcing/SELINUX=disabled/' /etc/selinux/config`
1. 关闭Swap分区, 注释掉swap的相关行，或者在安装的时候默认不分区即可。  
	`vim /etc/fstab `
1. 配置docker-ce，kubernetes相关软件源,从阿里云直接配置到本地的机器上。
	```shell
	# kubernetes部分
	cat <<EOF > /etc/yum.repos.d/kubernetes.repo
	[kubernetes]
	name=Kubernetes
	baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
	enabled=1
	gpgcheck=1
	repo_gpgcheck=1
	gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
	EOF

	# docker -ce部分
	curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
	```
1. 同步镜像仓库，从docker-ce源安装docker-ce/docker-cli/containerd；其实可以关闭gpgcheck，并将其他同步失败的源关闭即可，我自己只是为了做学习用途，关闭了fedora的update源，总是同步失败耽误我的时间。
	```shell
	dnf makecache -y && \
	dnf install -y docker-ce docker-cli containerd && \
	systemctl start docker && \
	systemctl enable docker 
	```
1. 从kubernetes源安装kubeadm\kubectl\kubernetes-cni\kubelet四个组件。
	```bash
	dnf install - y kubeadm kubectl kubelet kubernetes-cni && \
	systemctl start kubelet && \
	systemctl enable kubelet
	```
	四个组件的用途分别是：
	1. kubeadm 用来进行所有节点的部署及初始化。
	2. kubectl 集群的cli接口。
	3. kubelet 每个Node节点都会启动kubelet进程，用来处理Master节点下发到本节点的任务，管理Pod和其中的容器。kubelet会在API Server上注册节点信息，定期向Master汇报节点资源使用情况。
	4. kubernetes-cni cni网络规范，通过cni的框架可以通过插件的方式对k8s集群间的网络进行管理，常见的是flannal。
1. 查看所有节点的时间是否一致
   ```
   for i in master, node1, node2;do echo $i && date;done && hostname && date
   ```
2. 接下来就是不同节点了，部署的方式也不同，分开说明。
## Master的初始化
1. 准备镜像,google镜像访问不到，所以我找到了一个使用阿里云的解决方案。可以先将镜像拉到本地，然后再对master节点进行初始化。镜像的版本是可以手动更改和指定的。
	```bash
	# 1. 列出需要的镜像列表，记录下来。
	kubeadm config images list
	
	# 2. 建立一个bash脚本
	images=(  
		kube-apiserver:v1.12.1
		kube-controller-manager:v1.12.1
		kube-scheduler:v1.12.1
		kube-proxy:v1.12.1
		pause:3.1
   	etcd:3.2.24
	coredns:1.2.2
	 )
	
	for imageName in ${images[@]} ; do
		docker pull registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName
		docker tag registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName k8s.gcr.io/$imageName
		docker rmi registry.cn-hangzhou.aliyuncs.com/google_containers/$imageName
	done
	# 3. 运行脚本，等待镜像导入本地的docker存储中。
	```
	
2. 查看节点的所有image已经正确的拉取到了本地即可
    ```bash
	[root@master ~]$ docker image ls
	REPOSITORY                           TAG                 IMAGE ID            CREATED             SIZE
	k8s.gcr.io/kube-proxy                v1.15.0             d235b23c3570        4 weeks ago         82.4MB
	k8s.gcr.io/kube-apiserver            v1.15.0             201c7a840312        4 weeks ago         207MB
	k8s.gcr.io/kube-controller-manager   v1.15.0             8328bb49b652        4 weeks ago         159MB
	k8s.gcr.io/kube-scheduler            v1.15.0             2d3813851e87        4 weeks ago         81.1MB
	quay.io/coreos/flannel               v0.11.0-amd64       ff281650a721        5 months ago        52.6MB
	k8s.gcr.io/coredns                   1.3.1               eb516548c180        6 months ago        40.3MB
	k8s.gcr.io/etcd                      3.3.10              2c4adeb21b4f        7 months ago        258MB
	k8s.gcr.io/pause                     3.1                 da86e6ba6ca1        19 months ago       742kB
	```
	
3. kubeadm init命令进行集群初始化
   ```bash
	kubeadm init --pod-network-cidr=10.244.0.0/16 --service-cidr=10.96.0.0/12 
	# --pod-network-cidr 是指明了flannel的ip地址范围,这个是集群的Node网络，负责Node之间通信的网络。
	# --service-cidr=指明了容器建立时直接分配的ip地址，这个是集群的Pod网络，负责Pod之间通信的网络。
	```
	
4. 使用命令查看集群节点的状态
	
	这个信息不是刚部署完成的信息，只是举个例子展示一下效果。
	
	`kubectl get pods -n kube-system` 命令可以获取**集群名称空间kube-system内**的所有pod的信息；
	`kubectl get nodes`和`kubectl get nodes -o wide` 可以显示所有节点的信息；
	
	```shell
	[root@master ~]# kubectl get pods -n kube-system
	NAME                                    READY   STATUS    RESTARTS   AGE
	coredns-5c98db65d4-m5gj8                1/1     Running   12         3d3h
	coredns-5c98db65d4-nmdzx                1/1     Running   12         3d3h
	etcd-master.docker                      1/1     Running   2          3d3h
	kube-apiserver-master.docker            1/1     Running   2          3d3h
	kube-controller-manager-master.docker   1/1     Running   2          3d3h
	kube-flannel-ds-amd64-fdcr9             1/1     Running   3          3d3h
	kube-flannel-ds-amd64-hqwtr             1/1     Running   2          2d1h
	kube-flannel-ds-amd64-lqtjc             1/1     Running   4          3d3h
	kube-proxy-k8vcz                        1/1     Running   2          3d3h
	kube-proxy-m6j4m                        1/1     Running   2          2d1h
	kube-proxy-ww2z9                        1/1     Running   2          3d3h
	kube-scheduler-master.docker            1/1     Running   2          3d3h
	
	[root@master ~]# kubectl get nodes
NAME            STATUS   ROLES    AGE    VERSION
	master.docker   Ready    master   3d3h   v1.15.0
	node1.docker    Ready    <none>   3d3h   v1.15.0
	node2.docker    Ready    <none>   2d1h   v1.15.1
	
	[root@master ~]# kubectl get nodes -o wide
	NAME            STATUS   ROLES    AGE    VERSION   INTERNAL-IP       EXTERNAL-IP   OS-IMAGE                     KERNEL-VERSION          CONTAINER-RUNTIME
	master.docker   Ready    master   3d4h   v1.15.0   192.168.229.144   <none>        Fedora 30 (Server Edition)   5.0.9-301.fc30.x86_64   docker://19.3.0
	node1.docker    Ready    <none>   3d3h   v1.15.0   192.168.229.145   <none>        Fedora 30 (Server Edition)   5.0.9-301.fc30.x86_64   docker://19.3.0
	node2.docker    Ready    <none>   2d1h   v1.15.1   192.168.229.146   <none>        Fedora 30 (Server Edition)   5.0.9-301.fc30.x86_64   docker://19.3.0
	```
## Node节点加入集群

在Node节点上，将节点加入集群，将需要的镜像导入。

1. kubeadm join将节点加入到集群中，同时在master上注册节点的信息。 
	使用kubeadm join将节点注册到master上,给出master上生成的token，指定API Server的IP地址，指出ca证书的hash就可以将节点加入集群并初始化
	
	```
	kubeadm join --token jj10e9.7robjkn1202au8a4 192.168.229.144:6443 --discovery-token-ca-cert-hash sha256:452775d08cca2523f36b1d41101856b3d90f469a39bf7ccdd5bf45150fbff94d
	```
2. 使用docker save 在*master节点*上保存下来kube-proxy\kube-pause\flannel镜像
   ```
   docker save > ./kube-proxy.tar 
   docker save > ./kube-pause.tar
   docker save > ./flannel.tar
   ```
3. 使用docker load 在*所有的node节点上*导入kube-proxy\kube-pause\flannel镜像
   ```
   docker load < ./kube-proxy.tar
   docker load < ./kube-pause.tar
   docker load < ./flannel.tar
   ```
4. 重启每个节点上的kubelet服务，重启之后会自动加载并启动相关的image
   `systemctl restart kubelet.service`
5. 生成新的节点token
   ```shell
    # 生成新的token	
    # kubeadm token create token的有效期只有24h，超过时间就需要重新生成。
	[root@master ~]# kubeadm token create
	jj10e9.7robjkn1202au8a4

	# 查看所有可用的token
	# kubeadm token list命令用来查看现在节点的链接需要的认证信息
	[root@master ~]# kubeadm token list
	TOKEN                     TTL       EXPIRES                     USAGES                   DESCRIPTION   EXTRA GROUPS
	jj10e9.7robjkn1202au8a4   23h       2019-07-24T17:14:56+08:00   authentication,signing   <none>        system:bootstrappers:kubeadm:default-node-token
	```
6. 重新查看节点的ID
	```shell
	# 获取ca证书sha256编码hash值
	[root@master ~]$ openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null | openssl dgst -sha256 -hex | sed 's/^.* //'
	452775d08cca2523f36b1d41101856b3d90f469a39bf7ccdd5bf45150fbff94d
```

# 部署完成

