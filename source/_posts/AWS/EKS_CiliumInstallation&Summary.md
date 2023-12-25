---
title: Cilium 踩坑总结
date: 2022-08-19 22:21:48
category: Kubernetes
tags:
  - Kubernetes
  - Cilium
  - EKS
---
# 测试环境

- **KVM**  - hayden@HaydenArchDesktop ~> virsh version
>  Compiled against library: libvirt 8.6.0
>  Using library: libvirt 8.6.0
>  Using API: QEMU 8.6.0
>  Running hypervisor: QEMU 7.0.0

- **VM OS**： root@fedora ~# cat /etc/os-release
>  NAME="Fedora Linux"
>  VERSION="36 (Thirty Six)"
>  ID=fedora
>  VERSION_ID=36

- **KVM** 虚拟机两台
>  - Master： hostname: fedora
>  - Node： hostname: knode1

- **kubernetes 版本**： v1.24.3

- **kubernetes 安装方式**： kubeadm 

- **docker版本**:  docker://20.10.17 
> NOTE: (尝试使用Containerd， 但是翻车了， 控制平面的Pod启动不了， 所以放弃了，遂使用CRI-Dockerd，配置了Docker runtime， Containerd使用默认的参数无法正常的启动， 看起来即使真的升级到了1.24 迁移还是一个问题)

- **Kernel Version**: 5.17.5-300.fc36.x86_64

# Helm参数
如果是在KVM启动的虚拟机，可以通过这个安装参数来开启更多功能，但是受限于我的KVM虚拟网卡驱动不能attach xdp 程序， 所以。。。。xdp 加速无法启用，但是其他的高级特性均可开启， 集群状态正常。

```shell
helm upgrade -i cilium cilium/cilium \
  --namespace kube-system \
  --set tunnel=disabled \
  --set autoDirectNodeRoutes=true \
  --set loadBalancer.mode=dsr \
  --set kubeProxyReplacement=strict \
  --set enableIPv4Masquerade=false \
  --set loadBalancer.algorithm=maglev \
  --set devices=enp1s0 \
  --set k8sServiceHost=192.168.31.100 \
  --set k8sServicePort=6443 \
  --set hubble.relay.enabled=true \
  --set hubble.ui.enabled=true
```
# Cilium Cli
touch ./install_cilium_cli.sh
```shell
CILIUM_CLI_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/cilium-cli/main/stable.txt)
CLI_ARCH=amd64
if [ "$(uname -m)" = "aarch64" ]; then CLI_ARCH=arm64; fi
curl -L --fail --remote-name-all https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
sha256sum --check cilium-linux-${CLI_ARCH}.tar.gz.sha256sum
sudo tar xzvfC cilium-linux-${CLI_ARCH}.tar.gz /usr/local/bin
rm cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
```
# Hubble Cli
touch ./install_hubble_client.sh
```shell
HUBBLE_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/hubble/master/stable.txt)
HUBBLE_ARCH=amd64
if [ "$(uname -m)" = "aarch64" ]; then HUBBLE_ARCH=arm64; fi
curl -L --fail --remote-name-all https://github.com/cilium/hubble/releases/download/$HUBBLE_VERSION/hubble-linux-${HUBBLE_ARCH}.tar.gz{,.sha256sum}
sha256sum --check hubble-linux-${HUBBLE_ARCH}.tar.gz.sha256sum
sudo tar xzvfC hubble-linux-${HUBBLE_ARCH}.tar.gz /usr/local/bin
rm hubble-linux-${HUBBLE_ARCH}.tar.gz{,.sha256sum}
```

## Cilium Cli 安装插件命令
```shell
cilium upgrade # 原地升级

# 安装并直接替换kubeproxy
cilium install --version 1.14.1 --set kubeProxyReplacement=true --set=ipam.operator.clusterPoolIPv4PodCIDRList="10.42.0.0/16" --set k8sServiceHost=kube3s.liarlee.site --set k8sServicePort=6443




# 升级
hayden@arch ~> cilium upgrade
🔮 Auto-detected Kubernetes kind: K3s
ℹ️  Using Cilium version 1.14.2
🔮 Auto-detected cluster name: default

# 看状态
cilium status
# 使用hubble
cilium hubble port-forward &

cilium hubble enable --ui

hubble observe --since=1m -t l7 -


```
---

# 特性以及状态检查

默认的安装完成之后开启特性如下：

1. Kubeproxy Bypass
2. Iptables Bypass
3. LoadBalancer 算法： Meglav
4. LoadBalancer 特性： DSR
5. 报文Masquerade 封装： Disabled
6. Hubble ： Enable
7. 隧道封包： Disabled

---

下面是 CIlium Status的命令返回结果：

```bash
root@fedora ~# cilium status
    /¯¯\
 /¯¯\__/¯¯\    Cilium:         OK
 \__/¯¯\__/    Operator:       OK
 /¯¯\__/¯¯\    Hubble:         OK
 \__/¯¯\__/    ClusterMesh:    disabled
    \__/

Deployment        cilium-operator    Desired: 2, Ready: 2/2, Available: 2/2
Deployment        hubble-relay       Desired: 1, Ready: 1/1, Available: 1/1
DaemonSet         cilium             Desired: 2, Ready: 2/2, Available: 2/2
Deployment        hubble-ui          Desired: 1, Ready: 1/1, Available: 1/1
Containers:       hubble-relay       Running: 1
                  hubble-ui          Running: 1
                  cilium             Running: 2
                  cilium-operator    Running: 2
Cluster Pods:     14/14 managed by Cilium
Image versions    hubble-ui          quay.io/cilium/hubble-ui:v0.9.0@sha256:0ef04e9a29212925da6bdfd0ba5b581765e41a01f1cc30563cef9b30b457fea0: 1
                  hubble-ui          quay.io/cilium/hubble-ui-backend:v0.9.0@sha256:000df6b76719f607a9edefb9af94dfd1811a6f1b6a8a9c537cba90bf12df474b: 1
                  cilium             quay.io/cilium/cilium:v1.12.0@sha256:079baa4fa1b9fe638f96084f4e0297c84dd4fb215d29d2321dcbe54273f63ade: 2
                  cilium-operator    quay.io/cilium/operator-generic:v1.12.0@sha256:bb2a42eda766e5d4a87ee8a5433f089db81b72dd04acf6b59fcbb445a95f9410: 2
                  hubble-relay       quay.io/cilium/hubble-relay:v1.12.0@sha256:ca8033ea8a3112d838f958862fa76c8d895e3c8d0f5590de849b91745af5ac4d: 1
```

ds/cilium 中的命令返回结果：

```bash
root@fedora:/home/cilium# cilium status
KVStore:                 Ok   Disabled
Kubernetes:              Ok   1.24 (v1.24.3) [linux/amd64]
Kubernetes APIs:         ["cilium/v2::CiliumClusterwideNetworkPolicy", "cilium/v2::CiliumEndpoint", "cilium/v2::CiliumNetworkPolicy", "cilium/v2::CiliumNode", "core/v1::Namespace", "core/v1::Node", "core/v1::Pods", "core/v1::Service", "discovery/v1::EndpointSlice", "networking.k8s.io/v1::NetworkPolicy"]
KubeProxyReplacement:    Strict   [enp1s0 192.168.31.100 (Direct Routing)]
Host firewall:           Disabled
CNI Chaining:            none
Cilium:                  Ok   1.12.0 (v1.12.0-9447cd1)
NodeMonitor:             Listening for events on 4 CPUs with 64x4096 of shared memory
Cilium health daemon:    Ok
IPAM:                    IPv4: 3/254 allocated from 10.0.0.0/24,
BandwidthManager:        Disabled
Host Routing:            BPF
Masquerading:            Disabled
Controller Status:       23/23 healthy
Proxy Status:            OK, ip 10.0.0.78, 0 redirects active on ports 10000-20000
Global Identity Range:   min 256, max 65535
Hubble:                  Ok   Current/Max Flows: 283/4095 (6.91%), Flows/s: 1.62   Metrics: Disabled
Encryption:              Disabled
Cluster health:          2/2 reachable   (2022-08-23T01:57:33Z)
```

Cilium verbose的详细结果：

```bash
root@fedora:/home/cilium# cilium status --verbose
KVStore:                Ok   Disabled
Kubernetes:             Ok   1.24 (v1.24.3) [linux/amd64]
Kubernetes APIs:        ["cilium/v2::CiliumClusterwideNetworkPolicy", "cilium/v2::CiliumEndpoint", "cilium/v2::CiliumNetworkPolicy", "cilium/v2::CiliumNode", "core/v1::Namespace", "core/v1::Node", "core/v1::Pods", "core/v1::Service", "discovery/v1::EndpointSlice", "networking.k8s.io/v1::NetworkPolicy"]
KubeProxyReplacement:   Strict   [enp1s0 192.168.31.100 (Direct Routing)]
Host firewall:          Disabled
CNI Chaining:           none
Cilium:                 Ok   1.12.0 (v1.12.0-9447cd1)
NodeMonitor:            Listening for events on 4 CPUs with 64x4096 of shared memory
Cilium health daemon:   Ok
IPAM:                   IPv4: 3/254 allocated from 10.0.0.0/24,
Allocated addresses:
  10.0.0.11 (kube-system/coredns-6d4b75cb6d-tbgrr)
  10.0.0.201 (health)
  10.0.0.78 (router)
BandwidthManager:       Disabled
Host Routing:           BPF
Masquerading:           Disabled
Clock Source for BPF:   ktime
Controller Status:      23/23 healthy
  Name                                  Last success   Last error   Count   Message
  cilium-health-ep                      29s ago        never        0       no error
  dns-garbage-collector-job             34s ago        never        0       no error
  endpoint-1313-regeneration-recovery   never          never        0       no error
  endpoint-2868-regeneration-recovery   never          never        0       no error
  endpoint-2945-regeneration-recovery   never          never        0       no error
  endpoint-gc                           3m34s ago      never        0       no error
  ipcache-inject-labels                 3m30s ago      3m33s ago    0       no error
  k8s-heartbeat                         4s ago         never        0       no error
  link-cache                            15s ago        never        0       no error
  metricsmap-bpf-prom-sync              4s ago         never        0       no error
  resolve-identity-1313                 3m29s ago      never        0       no error
  resolve-identity-2868                 3m29s ago      never        0       no error
  resolve-identity-2945                 3m30s ago      never        0       no error
  sync-endpoints-and-host-ips           30s ago        never        0       no error
  sync-lb-maps-with-k8s-services        3m30s ago      never        0       no error
  sync-node-with-ciliumnode (fedora)    3m32s ago      3m33s ago    0       no error
  sync-policymap-1313                   26s ago        never        0       no error
  sync-policymap-2868                   26s ago        never        0       no error
  sync-policymap-2945                   26s ago        never        0       no error
  sync-to-k8s-ciliumendpoint (1313)     9s ago         never        0       no error
  sync-to-k8s-ciliumendpoint (2868)     9s ago         never        0       no error
  sync-to-k8s-ciliumendpoint (2945)     0s ago         never        0       no error
  template-dir-watcher                  never          never        0       no error
Proxy Status:            OK, ip 10.0.0.78, 0 redirects active on ports 10000-20000
Global Identity Range:   min 256, max 65535
Hubble:                  Ok   Current/Max Flows: 377/4095 (9.21%), Flows/s: 1.67   Metrics: Disabled
KubeProxyReplacement Details:
  Status:                 Strict
  Socket LB:              Enabled
  Socket LB Protocols:    TCP, UDP
  Devices:                enp1s0 192.168.31.100 (Direct Routing)
  Mode:                   DSR
  Backend Selection:      Maglev (Table Size: 16381)
  Session Affinity:       Enabled
  Graceful Termination:   Enabled
  NAT46/64 Support:       Disabled
  XDP Acceleration:       Disabled
  Services:
  - ClusterIP:      Enabled
  - NodePort:       Enabled (Range: 30000-32767)
  - LoadBalancer:   Enabled
  - externalIPs:    Enabled
  - HostPort:       Enabled
BPF Maps:   dynamic sizing: on (ratio: 0.002500)
  Name                          Size
  Non-TCP connection tracking   65536
  TCP connection tracking       131072
  Endpoint policy               65535
  Events                        4
  IP cache                      512000
  IP masquerading agent         16384
  IPv4 fragmentation            8192
  IPv4 service                  65536
  IPv6 service                  65536
  IPv4 service backend          65536
  IPv6 service backend          65536
  IPv4 service reverse NAT      65536
  IPv6 service reverse NAT      65536
  Metrics                       1024
  NAT                           131072
  Neighbor table                131072
  Global policy                 16384
  Per endpoint policy           65536
  Session affinity              65536
  Signal                        4
  Sockmap                       65535
  Sock reverse NAT              65536
  Tunnel                        65536
Encryption:            Disabled
Cluster health:        2/2 reachable    (2022-08-23T01:59:33Z)
  Name                 IP               Node        Endpoints
  fedora (localhost)   192.168.31.100   reachable   reachable
  knode1               192.168.31.101   reachable   reachable
```

cilium-health status --probe 之后的结果， 多个节点之间的联通性正常：

```bash
root@fedora:/home/cilium# cilium-health status --probe
Probe time:   2022-08-23T02:01:04Z
Nodes:
  fedora (localhost):
    Host connectivity to 192.168.31.100:
      ICMP to stack:   OK, RTT=140.825µs
      HTTP to agent:   OK, RTT=199.54µs
    Endpoint connectivity to 10.0.0.201:
      ICMP to stack:   OK, RTT=128.2µs
      HTTP to agent:   OK, RTT=263.034µs
  knode1:
    Host connectivity to 192.168.31.101:
      ICMP to stack:   OK, RTT=235.981µs
      HTTP to agent:   OK, RTT=330.706µs
    Endpoint connectivity to 10.0.1.251:
      ICMP to stack:   OK, RTT=177.807µs
      HTTP to agent:   OK, RTT=275.869µs
```

没有执行Cilium connectivity Test， 这个测试和 1.1.1.1:443 的测试在基本上每次都是失败的。目前原因还不清楚， 没调查，但是集群内的Pod访问外部的网络是完全正常的。 

基于AWS EC2 测试的结果（无法关闭 Masquerade 以及 绕过 Iptables）， 与flannel相比，Cilium当前的性能还是少少差一点点，但是跨越公网访问的稳定性更强，HTTP完全没有Failed请求。

没有开启XDP， 原因是我使用的是KVM的虚拟机 ，使用的驱动程序是VirtIO， 看起来这个驱动在我当前版本的虚拟化里面可能需要做一些特殊的设置才能开启， 我没有继续进行测试。

目前也没法对性能做任何的对比测试，  没有条件启动两个集群做对比，可以想见因为底层的响应时间极快，所以没有办法看出差距； 要么就是资源的抢占导致本身的测试结果不够稳定。

我目前还在 EC2 以及 EKS 中调试：

1. EKS：AWS CNI替换掉之后有自己的问题， 不能开启完全的Iptables Bypass， 由于启用了ENI MODE 就会提供 EndpointRoute， 感觉这已经是BypassIptables， 但是没能验证，不确定。

2. EC2 部署的 Kubernetes： 集群不能开启HostRouting， 开启之后cilium-health status 无法完成对端节点上面Endpoint的检查， Connection Timeout。也不能完全work。

# 其他资料

> 其他公司业务的配置以及测试。
>
> https://www.ebpf.top/post/cilium-standalone-L4LB-XDP-zh/
>
> 按照Linux基金会的PPT中描述， KVM 虚拟化条件下也是可以开启XDP的，但是我只是测试， 就不折腾了， 我自己的PC 效果不一定明显。
>
> https://events19.linuxfoundation.cn/wp-content/uploads/2017/11/Accelerating-VM-Networking-through-XDP_Jason-Wang.pdf 
>
> https://lore.kernel.org/bpf/b41ab0f0-4537-74b5-d7c3-b20ce082bdd6@redhat.com/T/
>
> https://lwn.net/Articles/841755/
>
> 
## 启用 Bandwidth Manager 和 BBR
```shell
# 尝试添加了bbr 算法的选项， 使用如下命令进行变更： 
cilium upgrade --version 1.14.5 --set kubeProxyReplacement=true --set=ipam.operator.clusterPoolIPv4PodCIDRList="10.42.0.0/16" --set k8sServiceHost=kube3s.liarlee.site --set k8sServicePort=6443 --set bandwidthManager.enabled=true --set bandwidthManager.bbr=true

# 使用如下的命令进行确认：
kubectl -n kube-system exec ds/cilium -- cilium status | grep BandwidthManager
```