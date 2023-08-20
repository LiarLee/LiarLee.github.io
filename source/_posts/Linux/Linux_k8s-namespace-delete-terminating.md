---
title: k8s所有的NS删除的时候都进入Terminating状态
date: 2019-10-09 11:17:05
categories: Kubernetes
tags: Kubernetes
---

集群无法删除Namespace解决方式。

## Namespace 无法删除 始终处于Teminating
### 强制删除的方法，临时方案。
1. 将名称空间的配置文件导出。  
   `kubectl get namespace testtest -o json > tmp.json`
2. 编辑这个临时文件。  
   `vim tmp.json`
3. 删除spec字段中的值。
	```
	"spec" : {
			"finalizers" : [		# delete this line.
				"kubernetes"		# delete this line.
				]		# delete this line.
			}
	``` 			
4. 使用另一个terminal， 运行本地的proxy， 连接到API server。  
	`kubectl proxy --port=8888`
5. 通过ApiServer进行删除  
	`curl -k -H "Content-Type: application/json" -X PUT --data-binary @tmp.json http://127.0.0.1:8001/api/v1/namespaces/[NEEDTODELETENS]/finalize;   `

	这里面http的**调用路径**在 ： tmp.json的 api 字段中。
6. 运行结果返回NameSpace的相关信息应该就是删除了。

## Namespace删除卡住的原因
> Solution From Github: https://github.com/kubernetes/kubernetes/issues/60807

是某些服务的问题导致了无法删除掉相关的NS
1. kubectl get apiservice | grep False
2. kubectl api-resources --verbs=list --namespaced -o name | xargs -n 1 kubectl get -n [NEEDTODELETENS]
3. kubectl delete apiservice v1alpha3.kubevirt.io  

其实是这个apiservice影响的，他的状态不正常导致的NS删除的时候卡住，删除这个apiservice就可以了。