---
title: Fortio 笔记
date: 2025-05-09 23:26:39
category: Kubernetes
tags:
  - Application
  - Kubernetes
  - Docker
---
[Fortio 官方网站](https://fortio.org/)
[Fortio Github Repo](https://github.com/fortio/fortio#fortio)

Thanks ~ https://skyao.io/learning-fortio/docs/introduction/fortio.html

Fortio 是一个快速、小型（4Mb docker 镜像，最小依赖项）、可重复使用、可嵌入的 go 库以及命令行工具和服务器进程，服务器包括一个简单的 Web UI 和 REST API 来触发运行并查看结果的图形表示（单个延迟图和多个结果比较最小值、最大值、平均值、qps 和百分位数图）。

我比较感兴趣的是两个工具
一个是 **Fortio 本身**， 可以支持 tcp 和 udp 的负载测试并且生成好观察的图表。 
还有一个是 **DNSping**， 通过命令发送 dns 请求并记录 dns 响应的延迟情况。

### dnsping
通过这样的工具可以非常轻松的看到在集群内的 pod 解析 dns **请求成功与否**以及**延迟情况**， 例如：
```shell
kubectl debug -n monitoring --profile=general grafana-694b5f9796-nqkhn -it --image=fortio/dnsping -- dnsping -c 10 glance.liarlee.site. 192.168.31.3
# 或者是
kubectl debug -n monitoring --profile=general grafana-694b5f9796-nqkhn -it --image=fortio/dnsping -- dnsping -c 10 glance.liarlee.site. kube-dns.kube-system
```
输出的结果中， 包括了延迟， 和完整的 DNS 应答：
```python
Defaulting debug container name to debugger-dcdhz.
If you don't see a command prompt, try pressing enter.
15:26:04.782   0.3 ms   2: [glance.liarlee.site.        3       IN      A       192.168.31.50]
15:26:05.783   0.3 ms   3: [glance.liarlee.site.        2       IN      A       192.168.31.50]
15:26:06.783   0.4 ms   4: [glance.liarlee.site.        1       IN      A       192.168.31.50]
15:26:07.783   1.7 ms   5: [glance.liarlee.site.        30      IN      A       192.168.31.50]
15:26:08.782   0.3 ms   6: [glance.liarlee.site.        30      IN      A       192.168.31.50]
15:26:09.783   0.4 ms   7: [glance.liarlee.site.        29      IN      A       192.168.31.50]
15:26:10.782   0.3 ms   8: [glance.liarlee.site.        28      IN      A       192.168.31.50]
15:26:11.783   0.5 ms   9: [glance.liarlee.site.        27      IN      A       192.168.31.50]
15:26:12.782   0.3 ms  10: [glance.liarlee.site.        26      IN      A       192.168.31.50]
0 errors (0.00%), 10 success.
response time (in ms) : count 10 avg 0.4705533 +/- 0.4 min 0.25093400000000005 max 1.651941 sum 4.705533
# range, mid point, percentile, count
>= 0.250934 <= 0.3 , 0.275467 , 30.00, 3
> 0.3 <= 0.4 , 0.35 , 70.00, 4
> 0.4 <= 0.5 , 0.45 , 90.00, 2
> 1.6 <= 1.65194 , 1.62597 , 100.00, 1
# target 50% 0.35
# target 90% 0.5
# target 99% 1.64675
```

### fortio
在他提供的文档中有如下的说明， 我认为描述了这个命令使用中最初的疑问， 我应该怎么传递或者设置flag来获得最佳的测试结果？
https://github.com/fortio/fortio/wiki/FAQ#i-want-to-get-the-best-results-what-flags-should-i-pass


我在自己的一个小主机上面运行了单master 双node 的 kubernetes 集群， 并在上面运行了 VaultWarden 来维护我的密码。 （ 是 Sidecar 模式的 istio 进行流量管理的，sidecar 怎么都会导致延迟的增加， 这个是无法避免的。
对 VaultWarden LoginPage 测试一下， 看当前的环境中能服务能承载的压力是什么样子的？ 

![Single Ingress Pod & Single Statefulset VaultWarden](https://s2.loli.net/2025/05/10/6OKiQEepvIwUua3.png)

我设置的测试是  2000 qps 10 threads 的测试， 最后的结果是 1085 qps，着应该是达到了当前这个服务的上限， 尝试扩展了一下ingress pod 的数量， 查看 **延迟中位数据** 没有非常大的变化， 但是长尾的请求变的**更长了**（笑
![Double Ingress Pod & Single Statefulset VaultWarden](https://s2.loli.net/2025/05/10/XY7vpmjL2IhWDEt.png)

这个工具还是做的很直观的， 可以说是一个 istio 版本的 ab 命令 ， 并且带图~

如果把 fortio server 启动在 pod 里面， 看来也可以做集群内的 负载测试， 这个工具最大的价值就是可以提供稳定压力的负载， 并且可以测试多种不同的协议。

