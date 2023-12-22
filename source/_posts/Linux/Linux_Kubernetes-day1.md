---
title: Kubernetes day1
date: 2021-09-11 10:41:37
tags:
  - Kubernetes
categories: Kubernetes
---

[云原生的定义](https://github.com/cncf/toc/blob/main/DEFINITION.md#%E4%B8%AD%E6%96%87%E7%89%88%E6%9C%AC)

## 云原生一些概念
### 十二因素应用
1. 基准代码： 一份基准代码，多次部署（用同一个代码库进行版本控制）
1. 依赖： 显式的声明和隔离相互之间的依赖
1. 配置： 在环境中存储配置(配置中心，携程的apollo)
1. 后端服务： 后端服务作为一个附加的资源，数据库，中间件等等
1. 构建，发布，运行： 对程序执行构建或者打包，严格分离构建和运行,打镜像编译等等，构建和运行严格的分离
1. 进程： 使用一个或者多个无状态进程运行应用
1. 端口绑定： 通过端口绑定提供服务
1. 并发： 通过进程模型进行扩展
1. 易处理： 快速的启动，优雅的终止，最大程度的保持健壮性。
1. 开发环境与线上环境等价： 尽可能保持Dev，Prelive，Live环境的一致性
1. 日志： 将所有运行中的进程和后台服务的输出流按照的时间顺序统一收集存储和展示(ELK,Fluend,Logstash,Filebeat等等)
1. 管理进程： 一次性管理类型的进程(Onetime Job)应该和正常的常驻进程使用同样的运行环境

## Master - APIserver
APIserver提供了Kubernetes各类资源对象的CRUD以及Watch等等的HTTP REST接口，对象包括Pods，Services, ReplicationsControllers等等, 为RESTful操作提供服务，并且为集群状态提供前端，所有的组件都通过前端进行交互。
- 特点： RESTful风格
  1. APIserver的请求最后会同步到Etcd。
  1. 请求APIserver在权限的鉴定完成之后， 可以查看大部分的信息。
  1. 端口默认是 6443 可通过启动参数（--secure-port）来进行调整
  1. 绑定的IP地址可以通过 --bind-address 在启动的时候指定
  1. 端口用于接受客户端，dashboard的外部HTTPBase的请求
  1. Token 以及证书的HTTPbase的校验
  1. 基于指定策略的授权

- 功能： 
  1. 身份认证
  1. 验证权限
  1. 验证指令
  1. 执行操作
  1. 返回结果

## Master - Kube-scheduler
负责将Pod指定到节点上。
1. 取出Pod需要分配的信息， 先排除不可调度的Node，在可用的Node列表之中选择一个合适的Node，将信息写入etcd。等待Node上面的kubelet进行生成Pod。
1. Node的Kubelet通过APIserver监听到Pod的相关信息，然后获取Pod的清单，下载镜像，启动Pod， Kubelet每秒Watch-APIserver的信息。
1. 三个默认策略： 
    - LeastRequestedPriority - CPU+MEM直接评分，选择资源目前较低
    - CalculateNodeLanelPriority - 先匹配标签，在进行评分
    - BalancedResourceAllocation - 优先分配各项资源的使用率最均衡的节点 
1. 队列： PodQueue ， NodeList

## Master - Kuber-Controller-Manager
提供不同的控制器，例如： 集群内的Node, Pod ReplicaCounts, EndPoint, Namespace, ServiceAccount, ResourceQuota等等资源的控制内容，如果发现异常的时候提供自动化的修复流程。确保所有的服务是在预期的状态下运行。
1. 5s检查一次Node的状态
2. 包括多种不同的控制器
3. 检查所有的控制器 和 Node是否符合预期
4. 如果Node 不可达之后 40s会将节点标记为无法访问
5. 标记为无法访问5min之后， 将删除这个节点，同时在其他的节点重建需要的Pod。

---
Pod的高可用机制：
    1.  NodeMonitorPeriod: 监视周期
    2.  NodeMonitorGracePerios: 节点监视观察期
    3.  PodEvictionTimeout: 超时驱逐的区间

## Kube-Proxy
Kubernetes网络代理，反映了Node上面的Kubernetes中的服务对象的变化，通过管理IPVS或者IPTABLES的规则来进行网络层的实现。
- 可以通过配置文件来指定IPVS的调度算法， 一般默认是RR, `ipvsadm -ln`
- 直接指定kubelet的配置文件选项
```yaml
ipvs:
  scheduler: sh
```

## Kubelet
1. 汇报节点的状态
1. 监听API server 上面的pod信息变化，并调用Docker 和 Containerd 创建容器
1. 准备Pod所需要的数据卷
1. 返回Pod的运行状态
1. 在Node节点上进行容器的健康检查