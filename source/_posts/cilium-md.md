---
title: Cilium 踩坑总结
date: 2022-08-19 22:21:48
tags:
---

安装参数：
如果是在KVM启动的虚拟机，可以通过这个安装参数来开启更多功能，但是受限于我的KVM虚拟网卡驱动不能attach xdp 程序， 所以。。。。xdp 加速无法启用但是其他的高级特性均可开启， 集群状态正常。

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

---
更新测试的结果， 与flannel相比，Cilium当前的性能还是少少差一点点，但是跨越公网访问的稳定性更强，HTTP完全没有Failed请求。测试结果后续更新。
