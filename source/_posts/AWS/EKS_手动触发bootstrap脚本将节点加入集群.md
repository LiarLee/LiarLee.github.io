---
title: 自管理节点加入集群
category: EKS
date: 2023-12-08 14:39:16
tags:
  - Kubernetes
  - AWS
  - EKS
---
# 添加一个自管理的节点
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
# 需要复制的文件
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

# Bootstrap 脚本内容
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

