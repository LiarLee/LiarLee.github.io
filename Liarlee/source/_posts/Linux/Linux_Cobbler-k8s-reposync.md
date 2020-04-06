---
title: Linux_Cobbler搭建本地YUM源同步k8s阿里云
date: 2019-09-30 11:02:49
tags: Cobbler
categories: Linux
---

昨天晚上尝试使用阿里云的时候出现问题 ，阿里云的k8s源安装的时候报错，无法正常通过yum安装。内网正好放了一台Cobbler，所以直接从Cobbler同步阿里的repo过来放到内网，防止这个事情再次发生。

<!-- more -->

# Cobbler是什么
> Cobbler是一个免费开源系统安装部署软件，用于自动化网络安装操作系统。 Cobbler 集成了 DNS, DHCP,[1][2]软件包更新， 带外管理以及配置管理， 方便操作系统安装自动化。Cobbler 可以支持PXE启动, 操作系统重新安装, 以及虚拟化客户机创建，包括Xen, KVM or VMware. Cobbler透过koan程序以支持虚拟化客户机安装。Cobbler 可以支持管理复杂网路环境，如创建在链路聚合以太网的桥接环境。 [FROM Wikipedia](https://en.wikipedia.org/wiki/Cobbler_(software))

# Cobbler repo的建立
k8s的源，Cobbler直接建立的同步不可以是因为k8s的目录结构和一般软件源的结构不同。（开始以为阿里云会一直保持带有Pool文件夹的那个结构， 今天早上看到结构已经和普通的yumrepo一样了，记录一下出现这种问题怎么办好了。）其实解决的方案就是手动同步，使用Cobbler进行源的发布。其实也就是httpd发布出去。

---

## 建立阿里云的源
```
[root@cobbler /]# cat <<EOF > /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://mirrors.aliyun.com/kubernetes/yum/repos/kubernetes-el7-x86_64/
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://mirrors.aliyun.com/kubernetes/yum/doc/yum-key.gpg https://mirrors.aliyun.com/kubernetes/yum/doc/rpm-package-key.gpg
EOF
[root@cobbler /]# mv kubernetes.repo /etc/yum.repos.d/kubernetes.repo
[root@cobbler /]# yum clean all
[root@cobbler /]# yum makecache
[root@cobbler /]# yum repolist
# 在repolist中记录repoid
```
## 手动同步源
```
[root@cobbler /]# reposync -n --repoid=kubernetes -p /var/www/cobbler/repo_mirror/ --allow-path-traversal
```
## 手动将已经同步好的目录创建为repo
```
[root@cobbler /]# createrepo /var/www/cobbler/repo_mirror/kubernetes/
```
最后编辑一下自己的kubernetes.repo源文件，只指向本地的源就可以了。