---
title: Kubernetes day2 
date: 2021-10-02 10:49:55
tags: Kubernetes
categories: Kubernetes
---

对于etcd的操作和备份 
# Etcd的操作 - Etcdctl
## Etcd的规划
1. 最好用 固态盘， Pod数量比较多的情况下会非常非常慢， 内存要大.
1. 类似于redis 或者 Zookeeper， KV的存储.
1. 支持watch机制，可以通知给node节点的数据变化.
1. etcd consul zookeeper 的区别

| 名称      | 优点                                                         | 缺点                                                         | 接口     | 一致性算法 |
| --------- | ------------------------------------------------------------ | ------------------------------------------------------------ | -------- | ---------- |
| zookeeper | 1.功能强大，不仅仅只是服务发现<br />2.提供watcher机制能实时获取服务提供者的状态<br/>3.dubbo等框架支持 | 1.没有健康检查<br/>2.需在服务中集成sdk，复杂度高<br/>3.不支持多数据中心 | sdk      | Paxos      |
| consul    | 1.简单易用，不需要集成sdk<br/>2.自带健康检查<br/>3.支持多数据中心<br/>4.提供web管理界面 | 1.不能实时获取服务信息的变化通知                             | http/dns | Raft       |
| etcd      | 1.简单易用，不需要集成sdk<br/>2.可配置性强                   | 1.没有健康检查<br/>2.需配合第三方工具一起完成服务发现<br/>3.不支持多数据中心 | http     | Raft       |
|           |                                                              |                                                              |          |            |

## Etcdctl 的命令
- 查看etcd的成员清单
```bash 
]$ etcdctl --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/kubernetes.pem --key=/etc/kubernetes/ssl/kubernetes-key.pem --write-out=table --endpoints="192.168.31.21:2379,192.168.31.22:2379,192.168.31.23:2379" member list
```

- 查看etcd的节点状态
```bash
]$ etcdctl --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/kubernetes.pem --key=/etc/kubernetes/ssl/kubernetes-key.pem --endpoints="192.168.31.21:2379,192.168.31.22:2379,192.168.31.23:2379" endpoint status -w table
```

- 查看etcd存储的数据 
```bash
]$ etcdctl --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/kubernetes.pem --key=/etc/kubernetes/ssl/kubernetes-key.pem --endpoints="192.168.31.21:2379,192.168.31.22:2379,192.168.31.23:2379" get /registry/ --prefix --keys-only | head
```
- 查看etcd中的pod信息

```bash 
]$ etcdctl --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/kubernetes.pem --key=/etc/kubernetes/ssl/kubernetes-key.pem --endpoints="192.168.31.21:2379,192.168.31.22:2379,192.168.31.23:2379" get /registry/ --prefix --keys-only | grep pod
```
- 其他的操作
1. get / put / del 等基础操作 

## Watch机制
watch机制是通过不断的查看数据，发生变化就主动的通知客户端，v3支持watch固定的key,也可以watch一个范围的数据。
```bash
# watch 一个pod的信息， 然后手动delete这个pod ， 查看etcd 的watch行为和输出的结果。
]$ etcdctl --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/kubernetes.pem --key=/etc/kubernetes/ssl/kubernetes-key.pem --endpoints="192.168.31.21:2379,192.168.31.22:2379,192.168.31.23:2379" watch /registry/pods/monitoring/node-exporter-889hf
```

## 数据备份恢复和WAL日志
WAL： watch ahead log - 预写日志， 可以通过预写日志来进行数据库的恢复。
WAL记录了整个数据变化的过程，在操作写入数据之前先进行wal日志的写入。

etcd v2 的时候直接复制和备份目录，备份文件的方案
etcd v3 的备份和恢复， 使用快照的方式。

备份使用的命令和恢复的命令不太一样， etcdctl  vs   etcdutl 

可以写脚本来进行数据进行备份和恢复。

```bash
]$ etcdctl snapshot save
]$ etcdctl snapshot restore
]$ etcdctl snapshot status

]$ etcdctl --cacert=/etc/kubernetes/ssl/ca.pem --cert=/etc/kubernetes/ssl/kubernetes.pem --key=/etc/kubernetes/ssl/kubernetes-key.pem --endpoints="192.168.31.21:2379" snapshot save snap-20211002.db

# 测试尝试恢复到临时的目录，测试用。 目录地址用的是tmp下面的。
]$ etcdutl snapshot restore ./snap-20211002.db --data-dir /tmp/etcd-restore
2021-10-02T12:01:13+08:00	info	snapshot/v3_snapshot.go:251	restoring snapshot	{"path": "./snap-20211002.db", "wal-dir": "/tmp/etcd-restore/member/wal", "data-dir": "/tmp/etcd-restore", "snap-dir": "/tmp/etcd-restore/member/snap", "stack": "go.etcd.io/etcd/etcdutl/v3/snapshot.(*v3Manager).Restore\n\t/tmp/etcd-release-3.5.0/etcd/release/etcd/etcdutl/snapshot/v3_snapshot.go:257\ngo.etcd.io/etcd/etcdutl/v3/etcdutl.SnapshotRestoreCommandFunc\n\t/tmp/etcd-release-3.5.0/etcd/release/etcd/etcdutl/etcdutl/snapshot_command.go:147\ngo.etcd.io/etcd/etcdutl/v3/etcdutl.snapshotRestoreCommandFunc\n\t/tmp/etcd-release-3.5.0/etcd/release/etcd/etcdutl/etcdutl/snapshot_command.go:117\ngithub.com/spf13/cobra.(*Command).execute\n\t/home/remote/sbatsche/.gvm/pkgsets/go1.16.3/global/pkg/mod/github.com/spf13/cobra@v1.1.3/command.go:856\ngithub.com/spf13/cobra.(*Command).ExecuteC\n\t/home/remote/sbatsche/.gvm/pkgsets/go1.16.3/global/pkg/mod/github.com/spf13/cobra@v1.1.3/command.go:960\ngithub.com/spf13/cobra.(*Command).Execute\n\t/home/remote/sbatsche/.gvm/pkgsets/go1.16.3/global/pkg/mod/github.com/spf13/cobra@v1.1.3/command.go:897\nmain.Start\n\t/tmp/etcd-release-3.5.0/etcd/release/etcd/etcdutl/ctl.go:50\nmain.main\n\t/tmp/etcd-release-3.5.0/etcd/release/etcd/etcdutl/main.go:23\nruntime.main\n\t/home/remote/sbatsche/.gvm/gos/go1.16.3/src/runtime/proc.go:225"}
2021-10-02T12:01:13+08:00	info	membership/store.go:119	Trimming membership information from the backend...
2021-10-02T12:01:13+08:00	info	membership/cluster.go:393	added member	{"cluster-id": "cdf818194e3a8c32", "local-member-id": "0", "added-peer-id": "8e9e05c52164694d", "added-peer-peer-urls": ["http://localhost:2380"]}
2021-10-02T12:01:13+08:00	info	snapshot/v3_snapshot.go:272	restored snapshot	{"path": "./snap-20211002.db", "wal-dir": "/tmp/etcd-restore/member/wal", "data-dir": "/tmp/etcd-restore", "snap-dir": "/tmp/etcd-restore/member/snap"}
]$ ls /tmp/etcd-restore/
member
```

数据恢复的流程：
1. 创建新的etcd集群
1. 停止kubernetes以及其他的依赖etcd 的服务。 
1. 停止空白的新的集群
1. 使用备份的文件进行集群的恢复
1. 使用在集群的每个节点恢复相同的备份文件
1. 每个节点启动etcd的集群并且进行验证
1. 启动Kubernetes的相关集群和组件。
1. 查看恢复的结果，验证各个组件的相关服务是否已经正常恢复。

## Etcd节点的维护
- etcdctl add-etcd  
- etcdctl del-etcd

# 资源清单以及API
## 相关的外部服务接口
1. Container Runtime Interface - CRI 
  - runc
  - RKT
1. Container Storage Interface - CSI
1. Container Network Interface - CNI

## Node的相关操作
1. cordon
1. uncordon
1. drain
1. taint

