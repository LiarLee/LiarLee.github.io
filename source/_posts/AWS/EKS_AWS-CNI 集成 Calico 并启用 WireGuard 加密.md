---
title: AWS-CNI 集成 Calico 并启用 WireGuard 加密
category: EKS
date: 2024-02-23 16:10:32
tags:
  - EKS
  - AWS
---
看了下说明， 这个东西的主要作用是用于节点间 Pod 流量的加密。
### 启动集群
略
### Helm 命令安装 Calico
1. 添加一个helm repo
```shell
helm repo add projectcalico https://docs.tigera.io/calico/charts
```
2. 创建一个 value.yaml
```shell
cat > values.yaml <<EOF
installation:
  kubernetesProvider: EKS
  registry: reg.liarlee.site/docker.io
EOF

helm show values projectcalico/tigera-operator --version v3.27.2
```
3.  通过命令安装
```shell
kubectl create namespace tigera-operator

helm install calico projectcalico/tigera-operator --version v3.27.2 -f values.yaml --namespace tigera-operator

watch kubectl get pods -n calico-system
```
### 启用 WireGuard
```shell
kubectl patch felixconfiguration default --type='merge' -p '{"spec":{"wireguardEnabled":true}}'

# 在节点上面可以看到 wireguard 的网卡 和 内核模块， 说明已经成功了。
# EKS 默认的 AMI 里面是带这个模块的， 不需要手动安装， 可以自动按需装载。
~]$ lsmod  | grep wireguard
wireguard              98304  0
curve25519_x86_64      36864  1 wireguard
libcurve25519_generic    49152  2 curve25519_x86_64,wireguard
libchacha20poly1305    16384  1 wireguard
ip6_udp_tunnel         16384  1 wireguard
udp_tunnel             28672  1 wireguard

~]$ ip ad 
35: wireguard.cali: <POINTOPOINT,NOARP,UP,LOWER_UP> mtu 8941 qdisc noqueue state UNKNOWN group default qlen 1000
    link/none
    inet 192.168.137.134/32 scope global wireguard.cali
       valid_lft forever preferred_lft forever

# 或者可以查看
> kubectl get felixconfiguration default -o yaml
apiVersion: projectcalico.org/v3
kind: FelixConfiguration
...
spec:
  bpfConnectTimeLoadBalancing: TCP
  bpfHostNetworkedNATWithoutCTLB: Enabled
  bpfLogLevel: ""
  floatingIPs: Disabled
  healthPort: 9099
  logSeverityScreen: Info
  reportingInterval: 0s
  routeTableRange:
    max: 99
    min: 65
  vxlanVNI: 4096
  wireguardEnabled: true
```

### 参考文档
Project Calico： 
https://docs.tigera.io/calico/3.25/network-policy/encrypt-cluster-pod-traffic#enable-wireguard-for-a-cluster
