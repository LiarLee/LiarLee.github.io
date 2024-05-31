---
title: Kubectl Apply 报错 annotation Too long
category: Kubernetes
date: 2023-12-22 00:53:54
tags:
  - Kubernetes
  - EKS
---
重装 Prometheus operator 的时候报错， 提示 annotation 太长了，不能 apply
```shell
> kubectl apply -f ./setup
customresourcedefinition.apiextensions.k8s.io/alertmanagerconfigs.monitoring.coreos.com created
customresourcedefinition.apiextensions.k8s.io/alertmanagers.monitoring.coreos.com created
customresourcedefinition.apiextensions.k8s.io/podmonitors.monitoring.coreos.com created
customresourcedefinition.apiextensions.k8s.io/probes.monitoring.coreos.com created
customresourcedefinition.apiextensions.k8s.io/prometheusrules.monitoring.coreos.com created
customresourcedefinition.apiextensions.k8s.io/scrapeconfigs.monitoring.coreos.com created
customresourcedefinition.apiextensions.k8s.io/servicemonitors.monitoring.coreos.com created
customresourcedefinition.apiextensions.k8s.io/thanosrulers.monitoring.coreos.com created
Warning: Detected changes to resource monitoring which is currently being deleted.
namespace/monitoring unchanged
Error from server (Invalid): error when creating "setup/0prometheusCustomResourceDefinition.yaml": CustomResourceDefinition.apiextensions.k8s.io "prometheuses.monitoring.coreos.com" is invalid: metadata.annotations: Too long: must have at most 262144 bytes
Error from server (Invalid): error when creating "setup/0prometheusagentCustomResourceDefinition.yaml": CustomResourceDefinition.apiextensions.k8s.io "prometheusagents.monitoring.coreos.com" is invalid: metadata.annotations: Too long: must have at most 262144 bytes
```
### 解决方案
#### 使用 Kubectl Create
```shell
> kubectl create -f ./setup
customresourcedefinition.apiextensions.k8s.io/prometheuses.monitoring.coreos.com created
customresourcedefinition.apiextensions.k8s.io/prometheusagents.monitoring.coreos.com created
Error from server (AlreadyExists): error when creating "setup/0alertmanagerConfigCustomResourceDefinition.yaml": customresourcedefinitions.apiextensions.k8s.io "alertmanagerconfigs.monitoring.coreos.com" already exists
Error from server (AlreadyExists): error when creating "setup/0alertmanagerCustomResourceDefinition.yaml": customresourcedefinitions.apiextensions.k8s.io "alertmanagers.monitoring.coreos.com" already exists
Error from server (AlreadyExists): error when creating "setup/0podmonitorCustomResourceDefinition.yaml": customresourcedefinitions.apiextensions.k8s.io "podmonitors.monitoring.coreos.com" already exists
Error from server (AlreadyExists): error when creating "setup/0probeCustomResourceDefinition.yaml": customresourcedefinitions.apiextensions.k8s.io "probes.monitoring.coreos.com" already exists
Error from server (AlreadyExists): error when creating "setup/0prometheusruleCustomResourceDefinition.yaml": customresourcedefinitions.apiextensions.k8s.io "prometheusrules.monitoring.coreos.com" already exists
Error from server (AlreadyExists): error when creating "setup/0scrapeconfigCustomResourceDefinition.yaml": customresourcedefinitions.apiextensions.k8s.io "scrapeconfigs.monitoring.coreos.com" already exists
Error from server (AlreadyExists): error when creating "setup/0servicemonitorCustomResourceDefinition.yaml": customresourcedefinitions.apiextensions.k8s.io "servicemonitors.monitoring.coreos.com" already exists
Error from server (AlreadyExists): error when creating "setup/0thanosrulerCustomResourceDefinition.yaml": customresourcedefinitions.apiextensions.k8s.io "thanosrulers.monitoring.coreos.com" already exists
Error from server (AlreadyExists): error when creating "setup/namespace.yaml": object is being deleted: namespaces "monitoring" already exists
```
#### 使用 Kubectl Replace
使用 create 命令去创建 crd ，使用 replace 更新 crd，他们都不添加 `last-applied-configuration` 这个字段，
```shell
> kubectl replace -f ./setup
customresourcedefinition.apiextensions.k8s.io/alertmanagerconfigs.monitoring.coreos.com replaced
customresourcedefinition.apiextensions.k8s.io/alertmanagers.monitoring.coreos.com replaced
customresourcedefinition.apiextensions.k8s.io/podmonitors.monitoring.coreos.com replaced
customresourcedefinition.apiextensions.k8s.io/probes.monitoring.coreos.com replaced
customresourcedefinition.apiextensions.k8s.io/prometheuses.monitoring.coreos.com replaced
customresourcedefinition.apiextensions.k8s.io/prometheusagents.monitoring.coreos.com replaced
customresourcedefinition.apiextensions.k8s.io/prometheusrules.monitoring.coreos.com replaced
customresourcedefinition.apiextensions.k8s.io/scrapeconfigs.monitoring.coreos.com replaced
customresourcedefinition.apiextensions.k8s.io/servicemonitors.monitoring.coreos.com replaced
customresourcedefinition.apiextensions.k8s.io/thanosrulers.monitoring.coreos.com replaced
namespace/monitoring replaced
```
#### SSA 的方式创建
当然还有另一个方法就是使用 server-side apply： 
```shell
> kubectl apply --server-side -f ./setup
```

https://kubernetes.io/docs/reference/using-api/server-side-apply/

