---
title: 将ArchLinux作为节点加入EKS UnmanagedNode
category: Kubernetes
date: 2023-04-20 00:42:22
tags: Kubernetes, EKS
---

## 添加一个自管理的节点

添加这个自管理的节点是直接添加进入集群的， 并未使用EKS节点组的概念， 所以这个节点是可以被重启， 或者健康检查失败的， 并不具有任何的扩展或者弹性管理的能力。

1. 创建集群，启动一个新的 EC2， 登录到已经启动的 EKS 优化 OS 内，准备复制一些脚本过来。
2. 添加EC2的标签： kubernetes.io/cluster/clusterName  owned
3. 配置EC2的Instance Profile
4. 控制台获取 Kubernetes APIServer的Endpoint URL
5. 获取 apiserver b64 CA : `cat ~/.kube/config` 这个文件里面可以找到 ，或者是通过EKS的控制台上面， 找到 Base64 的 CA。
6. 编辑 userdata， 或者 ssh 登录到ec2上面创建一个bash脚本用来调用 bootstrap.sh

   ```bash
   mkdir ~/eks; touch ~/eks/start.sh
   ---
   #!/bin/bash
   set -ex

   B64_CLUSTER_CA=
   API_SERVER_URL=
   K8S_CLUSTER_DNS_IP=10.100.0.10

   /etc/eks/bootstrap.sh ${ClusterName} --b64-cluster-ca ${B64_CLUSTER_CA} --apiserver-endpoint ${API_SERVER_URL}
   ```

7. 集群里面**没有节点组 ， 也不会创建aws-auth configmap** 所以节点无法正常的加入集群， 需要手动创建。
   ```yaml
   apiVersion: v1
   data:
     mapRoles: |
       - groups:
         - system:bootstrappers
         - system:nodes
         rolearn: [CLUSTER_ROLE]
         username: system:node:{{EC2PrivateDNSName}}
     mapUsers: |
       []
   kind: ConfigMap
   metadata:
     name: aws-auth
     namespace: kube-system
   ```
## 需要复制的文件
```bash
sudo pacman -S containerd # 安装Containerd
scp /etc/eks/bootstrap.sh root@54.222.253.235:/etc/eks/bootstrap.sh # 复制bootstrap
scp /usr/bin/imds root@54.222.253.235:/usr/bin/imds # shell 脚本， 用来帮忙调用ec2 metadata 获取实例和VPC子网的信息
scp -pr /etc/eks/ root@54.222.253.235:/etc/eks/ # 直接复制了eks的相关脚本和配置模板
scp -pr /var/lib/kubelet/kubeconfig root@54.222.253.235:/var/lib/kubelet/kubeconfig # 复制kubeletconfig配置文件模板
scp -pr /etc/kubernetes/ root@54.222.253.235:/etc/kubernetes/ # 复制 kubernetes 的配置文件
scp -pr /etc/kubernetes/kubelet/ root@54.222.253.235:/etc/kubernetes/kubelet/ # 上面的命令没有递归复制， 所以需要指定

# 设置对应的内核参数， 如果不做kubelet 会报错提示 这些参数不符合要求。
kernel.panic = 10
kernel.panic_on_oops = 1
vm.overcommit_memory = 1
```

### Bootstrap 脚本内容分析
记录一下脚本自动配置的内容， 大概就是 获取变量， aws的服务地址， ec2 元数据地址， 替换模板中的变量生成Kubelet配置文件 和 Containerd 的配置文件（这个替换是一次性的， 也就是说， bootstrap只能变更模板中的变量一次， 第二次执行只会生成刷新一次集群的信息， 以及重启服务）。
1. 读取bootstrap后面给出的参数，设置变量， 例如： ClusterName etc.
2. 查看Kubelet的版本， 决定Runtime， containerd | dockerd, 判断条件是 kubelet 版本 大于 1.24
   ```bash
   ++ kubelet --version
   ++ grep -Eo '[0-9]\.[0-9]+\.[0-9]+'
   + KUBELET_VERSION=1.24.9
   ---
   + IS_124_OR_GREATER=true
   + DEFAULT_CONTAINER_RUNTIME=containerd
   ```
3. 设置ECR以及Pause容器地址
   ```bash
   # 获取region以及aws service domain
   + AWS_DEFAULT_REGION=cn-north-1
   + AWS_SERVICES_DOMAIN=amazonaws.com.cn
   
   # 调用脚本 /etc/eks/get-ecr-uri.sh cn-north-1 amazonaws.com.cn ''
   + ECR_URI=918309763551.dkr.ecr.cn-north-1.amazonaws.com.cn
   + PAUSE_CONTAINER_IMAGE=918309763551.dkr.ecr.cn-north-1.amazonaws.com.cn/eks/pause
   + PAUSE_CONTAINER=918309763551.dkr.ecr.cn-north-1.amazonaws.com.cn/eks/pause:3.5
   + CA_CERTIFICATE_DIRECTORY=/etc/kubernetes/pki
   + CA_CERTIFICATE_FILE_PATH=/etc/kubernetes/pki/ca.crt
   ```
4. 创建证书目录：
   ```bash
   + mkdir -p /etc/kubernetes/pki
   + sed -i s,MASTER_ENDPOINT,https://CE0253A94B6B14215AE3282580CFA5E3.yl4.cn-north-1.eks.amazonaws.com.cn,g /var/lib/kubelet/kubeconfig
   + sed -i s,AWS_REGION,cn-north-1,g /var/lib/kubelet/kubeconfig
   + sed -i s,CLUSTER_NAME,NewClusterForManualJoin,g /var/lib/kubelet/kubeconfig
   ```
5. 获取 VPC CIDR
   ```bash
   # imds shell script help to get metadata.
   imds: /usr/bin/imds
   ++ imds latest/meta-data/local-ipv4
   ++ imds latest/meta-data/network/interfaces/macs/02:66:06:2e:48:08/vpc-ipv4-cidr-blocks
   ```
6. 创建kubelet 配置, 计算预留的资源 和 MaxPod 等等参数的数值。
   ```bash
   /etc/kubernetes/kubelet/kubelet-config.json
   + mkdir -p /etc/systemd/system/kubelet.service.d
   + sudo mkdir -p /etc/containerd
   + sudo mkdir -p /etc/cni/net.d
   + sudo mkdir -p /etc/systemd/system/containerd.service.d
   ```
7. 创建containerd 配置文件
   ```bash
   + printf '[Service]\nSlice=runtime.slice\n'
   + sudo tee /etc/systemd/system/containerd.service.d/00-runtime-slice.conf
   + sudo sed -i s,SANDBOX_IMAGE,918309763551.dkr.ecr.cn-north-1.amazonaws.com.cn/eks/pause:3.5,g /etc/eks/containerd/containerd-config.toml
   ```
8. kubelet配置和启动。
   ```bash
   + sudo cp -v /etc/eks/containerd/kubelet-containerd.service /etc/systemd/system/kubelet.service
   + sudo chown root:root /etc/systemd/system/kubelet.service
   + sudo containerd config dump
   + systemctl enable kubelet
   + systemctl start kubelet
   ```

## 制作 NodeTemplate AMI

1. 如果使用已经加入过集群的实例直接制作AMI， 节点会无法加入， kubelet报错是APIserver拒绝这个节点的加入。

   ```
   2023-04-19T15:10:13Z kubelet-eks.daemon[11577]: E0419 15:10:13.325154   11577 event.go:267] Server rejected event '&v1.Event{TypeMeta:v1.TypeMeta{Kind:"", APIVersion:""}, ObjectMeta:v1.ObjectMeta{Name:"ip-10-0-1-249.cn-northwest-1.compute.internal.17575e9c08aefd8d", GenerateName:"", Namespace:"default", SelfLink:"", UID:"", ResourceVersion:"", Generation:0, CreationTimestamp:time.Date(1, time.January, 1, 0, 0, 0, 0, time.UTC), DeletionTimestamp:<nil>, DeletionGracePeriodSeconds:(*int64)(nil), Labels:map[string]string(nil), Annotations:map[string]string(nil), OwnerReferences:[]v1.OwnerReference(nil), Finalizers:[]string(nil), ZZZ_DeprecatedClusterName:"", ManagedFields:[]v1.ManagedFieldsEntry(nil)}, InvolvedObject:v1.ObjectReference{Kind:"Node", Namespace:"", Name:"ip-10-0-1-249.cn-northwest-1.compute.internal", UID:"ip-10-0-1-249.cn-northwest-1.compute.internal", APIVersion:"", ResourceVersion:"", FieldPath:""}, Reason:"NodeHasNoDiskPressure", Message:"Node ip-10-0-1-249.cn-northwest-1.compute.internal status is now: NodeHasNoDiskPressure", Source:v1.EventSource{Component:"kubelet", Host:"ip-10-0-1-249.cn-northwest-1.compute.internal"}, FirstTimestamp:time.Date(2023, time.April, 19, 15, 10, 10, 99764621, time.Local), LastTimestamp:time.Date(2023, time.April, 19, 15, 10, 13, 272025156, time.Local), Count:6, Type:"Normal", EventTime:time.Date(1, time.January, 1, 0, 0, 0, 0, time.UTC), Series:(*v1.EventSeries)(nil), Action:"", Related:(*v1.ObjectReference)(nil), ReportingController:"", ReportingInstance:""}': 'Unauthorized' (will not retry!)
   ```

2. 排查所有的地方之后，权限都是正确的， 依旧没发现到底哪里的权限有问题。

3. 发生问题的原因是 已经启动的节点， 有些配置文件已经被更改过了， 写入了固定的信息，  例如apiserver的ca证书， 以及节点的Endpoint地址， 这些文件需要被删除 或者 重新配置，其中最主要的影响 是 /var/lib/kubelet/config 这个配置文件中已经被替换的变量， 还有控制平面错误的CA证书以及信息。

4. 所需处理的文件如下：

   ```bash
   root@ip-10-0-1-249:/var/lib/kubelet# ll /var/lib/kubelet/
   total 44
   drwxr-xr-x  8 root root 4096 Apr 19 15:41 ./
   drwxr-xr-x 38 root root 4096 Apr 19 15:40 ../
   -rw-------  1 root root   62 Apr 19 15:41 cpu_manager_state
   drwxr-xr-x  2 root root 4096 Apr 19 15:50 device-plugins/
   -rw-r--r--  1 root root  575 Apr 19 15:41 kubeconfig # 这个目录中唯一存在的一个文件，里面应该是为配置的变量，不能被替换为确定的值。
   -rw-------  1 root root   61 Apr 19 15:41 memory_manager_state
   drwxr-xr-x  2 root root 4096 Apr 19 15:41 pki/
   drwxr-x---  2 root root 4096 Apr 19 15:41 plugins/
   drwxr-x---  2 root root 4096 Apr 19 15:41 plugins_registry/
   drwxr-x---  2 root root 4096 Apr 19 15:41 pod-resources/
   drwxr-x---  8 root root 4096 Apr 19 15:50 pods/
   
   root@ip-10-0-1-249:/etc/kubernetes/pki# ll /etc/kubernetes/pki/
   total 12
   drwxr-xr-x 2 root root 4096 Apr 19 15:38 ./
   drwxr-xr-x 4 root root 4096 Apr 19 15:33 ../
   -rw-r--r-- 1 root root 1099 Apr 19 15:41 ca.crt
   ```

   删除上面目录中的所有文件， 并创建一个新的空文件 `touch /var/lib/kubelet/kubeconfig`， 写入内容如下， 保留其中的变量值， 这个部分的变量会在bootstrap的时候替换掉： 

   ```yaml
   apiVersion: v1
   kind: Config
   clusters:
   - cluster:
       certificate-authority: /etc/kubernetes/pki/ca.crt
       server: MASTER_ENDPOINT 
     name: kubernetes
   contexts:
   - context:
       cluster: kubernetes
       user: kubelet
     name: kubelet
   current-context: kubelet
   users:
   - name: kubelet
     user:
       exec:
         apiVersion: client.authentication.k8s.io/v1beta1
         command: /usr/bin/aws-iam-authenticator
         args:
           - "token"
           - "-i"
           - "CLUSTER_NAME"
           - --region
           - "AWS_REGION"
   ```

5. 将上面的步骤做完之后关闭实例， 并创建一个新的AMI即可。 
6. 当AMI被创建为实例， 并完成运行Bootstrap脚本之后， 所有的节点信息会被重新配置， 这样节点才能正确的加入集群中。
