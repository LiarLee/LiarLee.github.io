---
title: Kubernetes NFS CSI 启动 bitnami postgres 镜像权限不足
date: 2024-09-08 22:42:33
category: Kubernetes
tags:
  - Kubernetes
  - TrueNasCore
  - Application
  - Database
---
### 开始
准备在kubernetes 集群里面部署一个 pgsql， 存储一些自己的个人数据，postgres pod 启动不了，pod 会反复 CrashLoopback, 查看其中postgres 进程的容器, 会遇到这样的报错： 
```shell
 fixing permissions on existing directory /var/lib/postgresql/data … ok
 creating subdirectories … ok
 selecting dynamic shared memory implementation … posix
 selecting default max_connections … 20
 selecting default shared_buffers … 400kB
 selecting default time zone … Etc/UTC
 creating configuration files … ok
 running bootstrap script … 2020-07-28 19:47:30.936 UTC [73] FATAL: data directory “/var/lib/postgresql/data” has wrong ownership
 2020-07-28 19:47:30.936 UTC [73] HINT: The server must be started by the user that owns the data directory.
 child process exited with exit code 1
 initdb: removing contents of data directory “/var/lib/postgresql/data”
```
这看上去就是目录权限不正确 ... 我看了好几遍 bitnami 的文档, 都是基础的错误排除.

两个建议：
- 检查权限。
- 使用 VolumePermission 设置 initcontainer 初始化容器权限。

### 使用 VolumePermission 初始化目录权限
Bitnami 的这个提供 helm 参数, 可以方便的设置 initcontainer 来进行 pv 的权限设置. 于是为了偷懒, 就 set 了这个参数. 
尝试使用 VolumePermission 的容器来进行 Volume path 权限的初始化， 但是 initcontainer 也启动不了， 报错：
```shell
chown: changing ownership of '/bitnami/postgresql': Invalid argument
```
这initcontainer的报错就离谱了， 这命令怎么会有无效参数。

### 检查权限
在另一个机器上面 pull docker 镜像， 启动容器进去看用户， 没问题 uid 1001/gid 0， 是一个非常合理的设置。然后检查目录权限， 也符合要求。 
docker 可以启动这个 image， 那么这个问题应该是出现在 Kubernetes 和 NFS 的配合上面。 
talos 创建的集群, 用了 TrueNAS 提供的 NFS 服务, 并在集群里面安装了 CSI 驱动： https://github.com/kubernetes-csi/csi-driver-nfs
按照这个配置检查了一边， 没发现问题， 启动测试的 pod 也可以正常挂载和写入。 驱动本身也没有报错的日志. 

算了还是在 pod 里面直接进去看看吧。尝试修改statefulset强制指定容器主进程命令： 加上 command 和 args ， 使用 sleep infinity. 

进入检查目录权限的时候发现这个目录的uid和gid的映射关系有问题, 长这样： 
```
drwxr-xr-x 2 4294967294 4294967294 24 2024-09-08 11:50 data
```
然后继续搜索， 发现这些奇怪的资料： 
  https://www.truenas.com/community/threads/nobody-4294967294-and-nfsv4.99352/
  https://www.suse.com/support/kb/doc/?id=000017244

看完我的理解是, NFSv4 会尝试解析并在域内进行 idmapping, 如果 mapping 不到, 会将 pod 中进程使用的 uid 和 gid 转换成了 nobody， 在 TrueNAS 上面我的测试是我已经设置了正确的权限， mapalluser 给了 uid 1001.  但是这个并不好用.
我不理解， 一直到我看到了： 
  https://www.truenas.com/community/threads/issue-with-user-mapping-when-mounting-nfs-share-on-ubuntu-18-04.79451/
> What you've called "permissions" are actually the user and group ids of any file/directory you've listed on your new Ubuntu server. If you're only seeing numeric values for uid & gid in "ls" output on your Ubuntu server, it simply means there's no user on the Ubuntu server with a uid/gid of 1001/1001. The output of getent group and getent passwd would confirm that. What non-root users have you added to your new Ubuntu server?
> P.S. The reason why unchecking the "NFSv3 ownership model for NFSv4" causes the permissions to read "nobody:4294967294" is explained here: https://mwl.io/archives/796
> So unless you plan to start using NFSv4 with kerboros, I'd stick to using NFSv4 with the NFsv3 ownership model.

将 v4 版本的权限模型， 切换回 v3 之后， 全好了。 如果有折腾这个的, 这可能是一个比较奇葩的问题, 在这几个东西互相配合的时候会出错.