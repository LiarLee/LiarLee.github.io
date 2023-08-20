---
title: Kubernetes集群的学习笔记(5)
date: 2019-10-18 11:48:48
categories: Kubernetes
tags: Kubernetes
---

K8S集群的存储卷笔记。

整体的存储卷调用结构：

在k8s的集群中，Pod声明自己需要存储卷资源，同时创建自己的PVC，PVC绑定到集群中已经注册的PV资源，例如 已经建立的NFS网络空间。PV资源通过存储系统的分配，直接提供给Pod来使用。

PVC属于名称空间级别，PV属于集群资源。

# 存储卷的类型

1. **EmptyDir**：只在Node上存在的存储卷，Pod删除的时候存储卷也会被移除，无法持久存储，叫做EmptyDir，做**临时存储和缓存使用**，可以使用**Node的内存**。

2. **HostPath**： Docker的存储卷类型，**Node节点上的目录**。

3. 网络存储： SAN， NAS; 分布式存储(Glusterfs，Cephfs，rbd); 云存储(EBS， Azure Disk，特定的托管在云上的服务)

   ```
   kubectl explain pod.spec.volumes
   ```

    可以查看支持那些存储。

## PVC

对于用户来说，无法掌握所有的存储系统的知识和技能，因此，创建了PVC的逻辑层，在定义需要使用存储卷的Pod中只需定义需要的空间以及存储的类型，不需要详细的考虑后端存储的信息和配置。

PVC被定义在Pods的配置中，一个 PVC可以被多个Pod同时访问。

## PV

存储类： Gold Storage Class, Sliver Storage Class, Bronze Stroage Class.三个不同级别的存储类。存储类直接接受PVC的内容并对PVC定义的容量等信息进行分配。

PV与存储服务的提供者直接绑定且需要在存储服务提供方配置完成。PV与PVC具有一一对应的关系。

# PersistentVolume

gitRepo仓库的使用：

gitRepo存储卷建立在EmptyDir的基础上，在Pod内建立空目录，同步Git的内容到空目录，Pod运行的过程中不会更改存储卷上的内容。也就是说，git同步是pod建立的时候同步的数据，不会对git项目的数据进行更改。Pod更改了存储卷中的数据不会自动推送到Git上（可以使用Sidecar进行推送和配置）。

## PV资源的定义

```YAML
---
apiVersion: v1
kind: PersistentVolume
metadata:
	name: pv001
	labels:
		name: pv001
spec:
	nfs:
		path: /data/volumes/v1
		server: storage1.liarlee.com
	accessModes: ["ReadWriteMany","ReadWriteOnce"]
	capacity:
		storage: 20Gi
```

使用apply命令进行应用即可。

查看所有的PV使用： `kubectl get pv `， 其中显示了PV的名称，大小，访问模式，回收策略，状态，建立时间等。

# PersistentVolumeClaim

使用的过程中，在Pod中定义PVC；PVC和PV是一一对应的，但是PVC可以被多个Pod调用和挂载。一个PV会Binding一个PVC，PVC在Pod中被定义。

PVC以及PV的状态，未绑定的状态叫做Pending，绑定后叫做Bound。

## PVC的定义

```YAML
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
	name: pvc001
	namespace: default
spec:
	accessModes: ["ReadWriteMany"]
	resource:
		request:
			storage: 6Gi
	
```

# ConfigMap资源

configmap是明文资源，secret是base64的编码资源，因此安全程度提高了。configmap相当于外挂的配置文件，当Pods启动的时候直接挂载Configmap读取自己需要的配置内容。

## 配置应用容器化的方式

1. 自定义命令行参数
2. 配置文件直接放入镜像中
3. 通过环境变量进行配置
4. 存储卷
   1. Cloud Native应用通过环境变量直接配置
   2. 通过EntryPoint脚本预处理环境变量作为配置问文件中的信息
5. docker config命令行方式

## Configmap的创建

configmap为了将配置文件中镜像中解耦，configmap可以直接注入到容器中直接使用，注入的方式可以使用存储卷，或者使用EntryPoint来处理。

通过命令直接传递键值：

```shell
kubectl create configmap cm-nginx --from-literal=nginx_server_name=nginx.liarlee.com --from-literal=nginx_server_port=80
kubectl create configmap cm-nginx --from-file=./nginx.conf # 直接传递文件到ConfigMap
kubectl get cm cm-nginx -o yaml # 用YAML的格式查看ConfigMap
```

通过YAML文件：

```YAML
---
apiVersion: v1
kind: ConfigMap
data: 
	nginx.conf................................
metadata:
	name: cm-nginx
	namespace: default
```

创建Pod时ConfigMap使用**环境变量**方式：

```YAML
---
apiVersion: v1
kind: Pod
metadata:
	name: pod-nginx
	namespace: default
	labels:
		app: pods-nginx
		tier: frontend
	annotations:
		liarlee.com/created-by: "cluster admin"
spec:
	containers:
	- name: pod-nginx
	  image: nginx:latest
	  ports:
	  - name: http
	    containerPort: 80
	  env:
	  - name: NGINX_SERVER_PORT
	    valueFrom:
	    	configMapKeyRef:
	    		name: cm-nginx
	    		key: nginx_port
	  env:
	  - name: NGINX_SERVER_NAME
	  	valueFrom:
	  		configMapKeyRef:
	  			name: cm-nginx
	  			key: nginx_server_name
```

创建Pod的时候使用**挂载卷**的方式：

通过挂载的方式可以通过修改configmap的方式，同步修改容器内部的配置。

```YAML
---
apiVersion: v1
kind: Pod
metadata:
	name: pod-nginx
	namespace: default
	labels:
		app: pods-nginx
		tier: frontend
	annotations:
		liarlee.com/created-by: "cluster admin"
spec:
	containers:
 	- name: pod-nginx
   	  image: nginx:latest
      ports:
      - name: http
      	containerPort: 80
 	  volumeMounts:
 	  - name: nginxconf
 	  	mountPath: /etc/nginx/conf.d/
 	  	readOnly: true
 	Volumes:
 	- name: nginxconf
 	  configMap: 
 	  	name: cm-nginx 
```

## 创建Secret的类型

kubectl create secret --help

- docker-registry -- 连接到Docker私有仓库的密钥
- generic -- 通用的服务密钥
- tls -- 创建证书

# StatefulSet的建立和使用

在一定程度上实现了有状态的管理，但是依旧需要写成管理脚本，注入到Pod中。

CoreOS -- 提供了 Operator相关的功能用来完善有状态的应用的部署。

两类不同的Pod

1. Cattle

2. Pet

最早叫做PetSet， 后面改成StatefulSet。

StatefulSet一般用于管理以下特性的组件：

1. 稳定且有唯一的网络标识符；必须保持Pod的名称和地址稳定持久有效；

2. 稳定且持久的存储；

3. 有序平滑(Graceful)的部署及扩展；启动的时候Pod1 - Pod8；

4. 有序平滑(Graceful)的终止和删除；关闭的时候Pod8 - Pod1；

5. 有序的滚动更新；有顺序的进行Pod的更新；

有三个主要的部分；

      1. Headless Service
         - 类似于Redis，提供一个headless的服务，来确保每一个请求直达后端的pod，可保持pod的接入点稳定且不发生变化。
      2. StatefulSet Controller
         - 需要一个控制器来进行Pod的管理和控制，保持Pod的生命周期，即使Pod被终止也需要在启动后保持和之前一样的Pod信息。
      3. Volume Claim Template
         - 由于有状态的服务不能同时使用同一个PV，所有的节点存储的数据各不相同，所以不能提供一个PVC&PV。因此提供了申请PV的模板，每个Pod提供一个独立的存储卷用来做独立存储。

对于StatefulSet来说，确保所有的Pod名称稳定有效不可变动。大多数有状态的副本都会使用持久存储，多个Pod能不能共用同一个存储？ 不能，每个Pod必须使用不同的存储。

 所以，需要定义PV，定义PVC模板，定义Pod，定义Stateful控制器，定义headless服务这几种。

## 定义StatefulSet的YAML文件

```YAML
---
apiVersion: v1
kind: Service 
metadata:
	name: sts-headless-svc
	labels:
		Service: sts-headless-svc
spec:
	ports:
	- port: 80
	  name: sts-headless-svc
	clusterIP: None
	selector: 
	  service: sts-headless-svc

---
apiVersion: app/v1
kind: StatufulSet
metadata:
	name: sts
spec:
	serviceName: sts
	replicas: 3
	selector:
		matchlabels:
			service: sts-headless-svc
	template:
		metadata:
			labels:
				service: sts-headless-svc
	 	spec: 
	 		containers: 
	 		- name: sts-container
	 		  image: ikubernetes/SOMEIMAGE'SNAME
	 		  ports:
	 		  - containerPort: 80
	 		    name: sts-headless-svc
	 		  volumeMounts:
	 		  - name: sts-pv
	 		    mountPath: /usr/share/nginx/html
	volumeClainTempates:
	- metadata:
		name: sts-vct
	spec:
		accessModes: [ "ReadWriteOnce" ]
		resources:
			requests:
				storage: 5Gi
				

```

Pod的dns命名规则：

Pod_Name+Service_Name+NameSpace_Name.svc.cluster.local

