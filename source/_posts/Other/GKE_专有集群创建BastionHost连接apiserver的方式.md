---
title: GKE 专有集群创建BastionHost连接apiserver的方式
category: Kubernetes
date: 2024-05-03 14:59:05
tags:
  - Kubernetes
---
### 背景
一个GKE集群使用了autopliot创建专有集群, 创建完成之后, 怎么在另一个VPC下的实例内使用 kubectl 管理集群.
两个实例:
- instance-20240430-111240: 和 GKE 在相同的VPC内, 可以直接访问控制平面进行集群管理. 
- instance-20240430-053004: 在另一个VPC内, 无法直接访问.

#### 使用 Kubectl Proxy 直接暴露 Apiserver 端口到当前
1. 和GKE相同VPC内启动一个新的实例, 在实例中配置 kubectl 可以正常连接到控制平面.
2. 使用 kubectl 命令创建 proxy 监听在本机的所有地址:
```shell
root@instance-20240430-111240:~ kubectl proxy --address=0.0.0.0  --kubeconfig .kube/config --accept-hosts "^.*" & 

```
3. 在另一个VPC内的节点上, 使用kubectl 命令进行连接: 
```shell

root@instance-20240430-053004:~ kubectl get pods -o wide -A -s instance-20240430-111240:8001
```

#### 使用 Tiny Proxy 代理
Refer to
https://cloud.google.com/kubernetes-engine/docs/tutorials/private-cluster-bastion?hl=zh-cn&cloudshell=false#connect

1. 按照上面文档的步骤进行, 之前的步骤都是一致的, 将文档中下面的命令的部分进行替换.
```shell
root@instance-20240430-053004:~ gcloud compute ssh INSTANCE_NAME \    --tunnel-through-iap \    --project=PROJECT_ID \    --zone=COMPUTE_ZONE \    --ssh-flag="-4 -L8888:localhost:8888 -N -q -f"

换成 

root@instance-20240430-053004:~ ssh -i .ssh/google_compute_engine root@instance-20240430-111240 -4 -L8888:localhost:8888 -N -q -f

```
  直接使用 ssh 隧道, 将 111240 实例的 8888 端口转发到当前实例的8888端口上. 
  然后配置环境变量设置localhost8888端口作为 https 流量的代理. 

2. 设置代理的环境变量 以及 测试 kubectl 命令 获取 ns. 
```shell
root@instance-20240430-053004:~ export HTTPS_PROXY=localhost:8888
root@instance-20240430-053004:~ kubectl get ns

NAME                       STATUS   AGE
default                    Active   3d
gke-gmp-system             Active   3d
gke-managed-cim            Active   3d
gke-managed-filestorecsi   Active   3d
gke-managed-system         Active   3d
gmp-public                 Active   3d
kube-node-lease            Active   3d
kube-public                Active   3d
kube-system                Active   3d
```

Kubernetes 官方相关文档:
KubeProxy: 
https://kubernetes.io/docs/reference/kubectl/generated/kubectl_proxy/

使用 SOCKS5 代理访问 Kubernetes API
https://kubernetes.io/zh-cn/docs/tasks/extend-kubernetes/socks5-proxy-access-api/

使用 HTTP 代理访问 Kubernetes API
https://kubernetes.io/zh-cn/docs/tasks/extend-kubernetes/http-proxy-access-api/
