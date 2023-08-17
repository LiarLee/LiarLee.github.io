---
title: Ceph Cluster 03 - CephFS
date: 2021-08-24 22:29:26
tags: Ceph
categories: Linux
---

ceph笔记03

# cephfs的使用

## cephfs的使用条件
1. 当我们需要多个服务来挂载和实时的同步的时候， 使用到CEPHFS，可以实现文件系统的共享。内核里面现在这个时间已经内置cephfs的挂载模块， 可以直接挂载不需要安装。
1. cephfs运行需要MDS服务，用来存储缓存的文件信息。总体需要创建两个存储池，单独创建一个存储MDS信息的存储池， 同时需要创建一个数据池来提供存储空间。
1. 启用mds的服务 
```bash
ceph orch mds 2
```
1. 创建ceph的存储池
```bash
ceph mds stat
# 创建一个cephfs的metadata池
ceph osd pool create metadata 32 32 
# 创建一个cephfs的data池
ceph osd pool create cephfsdata 64 64 
# 创建ceph的状态
ceph osd pool ls 
ceph -s 
# 创建cephfs的文件系统
ceph fs new defaultfs metadata cephfsdata

# 新的版本里面已经不需要手动创建mds和两个对应的存储池了， 只是需要一条命令就可以自动创建。
[ceph: root@ceph01 /]# ceph fs volume create test
[ceph: root@ceph01 /]# ceph fs volume ls
[ceph: root@ceph01 /]# ceph mds stat
# 需要提前获取挂载的Token： 
[root@HaydenArchDesktop ceph]# sudo scp root@ceph01:/etc/ceph/ceph.client.admin.keyring /etc/ceph/
[root@HaydenArchDesktop ceph]# mount -t ceph :/ /mnt -o name=admin
[root@HaydenArchDesktop mnt]# mount | grep ceph
192.168.31.11:6789,192.168.31.12:6789,192.168.31.13:6789:/ on /mnt type ceph (rw,relatime,name=admin,secret=<hidden>,acl)

#
# journalctl -f > /mnt/journal.log   
# 查看cephfs的写入文件的动作过程。 
# 同时使用 tail -f 在另一个窗口中查看文件的内容。 测试写入和查看内容的差距。 

```

## 用户权限
MDS可以启动多个实例，多个实例会自动来负载不同资源的文件元数据的缓存。
客户端通过MON节点进行授权 和 获取MDS的的位置。
MDS现在最新的版本默认已经是一主一备， 自动会生成高可用的模式。（之前的手动部署多个MDS服务器， 然后指定MDS的角色）

### 创建一个普通用户来进行身份的验证
```bash
# 创建一个测试的用户
ceph auth add client.testuser mon 'allow r' mds 'allow rw' osd 'allow rwx pool=cephfsdata'
# 测试所建立的用户的权限，获取认证的keyring
ceph auth get client.testuser
# 导出用户的Keyring， 用来做集群的校验
ceph auth get client.testuser -o ceph.client.testuser.keyring
# 导出用户的key ， Kubernetes的挂载会使用到
ceph auth print-key client.testuser > testuser.key
# 验证用户是否可以获取到集群的状态
ceph --user testuser -s 

# 将挂载点添加到fstab自动开机挂载
MON01:6789,MON02:6789,.........:/ /mnt ceph defaults,name=testuser,secretfile=/etc/ceph/testuser.key,_netdev 0 0
```
### Dashboard权限
```bash
# 启用或者禁用账户
[ceph: root@ceph01 /]# ceph dashboard ac-user-enable admin

# 重置Dashboard用户的密码
# Old Version
[ceph: root@ceph01 /]# ceph dashboard set-login-credentials admin -i /etc/ceph/dashboard_password

# New version command.
[ceph: root@ceph01 /]# ceph dashboard -h | grep ac-user
dashboard ac-user-add-roles <username> [<roles>...]         Add roles to user
dashboard ac-user-create <username> [<rolename>] [<name>]   Create a user. Password read from -i <file>
dashboard ac-user-del-roles <username> [<roles>...]         Delete roles from user
dashboard ac-user-delete [<username>]                       Delete user
dashboard ac-user-disable [<username>]                      Disable a user
dashboard ac-user-enable [<username>]                       Enable a user
dashboard ac-user-set-info <username> <name> [<email>]      Set user info
dashboard ac-user-set-password <username> [--force-         Set user password from -i <file>
dashboard ac-user-set-password-hash <username>              Set user password bcrypt hash from -i <file>
dashboard ac-user-set-roles <username> [<roles>...]         Set user roles
dashboard ac-user-show [<username>]                         Show user info
```

### MDS 高可用
```bash
# 提升默认的主节点的数量， 来提高MDS服务的吞吐量
ceph fs set defaultfs max_mds 2 
ceph fs get defaultfs
# 变成两主两备， （设置Rank）
# 参数： mds_standby_replay true 
         mds_standby_for_name: MDS_NAME
         mds_standby_for_rank: 备份指定级别的mds
         mds_standby_for_fscid: 指定文件系统ID，会联合rank配置生效，如果指定了rank就是指定文件系统的rank会进行主备，如果未指定就是指定文件系统的所有Rank。
```
1. 如果是一对一的高可用 ， 需要对每个mds进行独立的配置。
配置样例： 
```bash 
# 配置的结果是mds1主， mds2 备； mds3 主， mds4 备.
[mds.ceph-mds1]
mds_standby_replay = true 
mds_standby_for_name = ceph-mds2
mds_standby_for_fscid = defaultfs 

[mds.ceph-mds3]
mds_standby_replay = true
mds_standby_for_name = ceph-mds4
```
