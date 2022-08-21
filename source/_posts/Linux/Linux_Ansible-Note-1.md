---
title: Ansible笔记-1
date: 2019-06-26 12:32:52
tags: Ansible
categories: Linux
---

Ansible的学习笔记。  
Ansible管理方式是资源在目标主机上，定义所期望的目标状态的方式；每一个操作必须是幂等的（可重复操作但结果不变的）。ansible采用ssh链接所管理的服务器，因此具有agentless的优势。

<!-- more -->

# Ansible的安装
Ansible在Redhat的仓库中就有二进制包，直接dnf或yum安装就可以了。
```bash
[root@localhost Liarlee]$ yum install -y Ansible
```

# Ansible的配置文件
Ansible的配置文件常用的有：
1. /etc/ansible/ansible.cfg  **Ansible的配置文件**
2. /etc/ansible/hosts       **Ansible允许控制的主机列表，可在hosts文件中对服务器进行分组**

# Ansible的组件
1. ansible
2. ansible-playbook
3. ansible-doc

# Ansible的配置和使用

## Ansible命令模式
> ansible [HOST_PARTTEN] -m [MODUELS] -a "[ARGS]" -f [Forks] -C -u [USERNAME] -c [CONNTECTION]

## 基于密钥认证ansible
ansible支持使用ssh用户命名密码的认证方式，也支持使用ssh密钥认证的方式进行链接。ssh密钥的方式可以保证安全性，同时免去输入密码的麻烦。
1. 生成ansible的密钥
    ```bash
    [root@localhost Liarlee]$ ssh-keygen -t rsa -P ""
    ```
2. 复制ansible的公钥到需要连接控制的host上  
    ```bash
    [root@localhost Liarlee]$ ssh-copy-id -i ~/.ssh/id-rsa.pub root@[host1-IP]
    [root@localhost Liarlee]$ ssh-copy-id -i ~/.ssh/id-rsa.pub root@[host2-IP]
    ```
3. 在ansible的hosts文件中记录需要控制的主机名或者IP
    ```bash
    [root@localhost Liarlee]$ echo "[host1-IP]" >> /etc/ansible/hosts
    [root@localhost Liarlee]$ echo "[host2-IP]" >> /etc/ansible/hosts
    ```
4. 使用ansible进行控制测试
    ```bash
    [root@localhost Liarlee]$ ansible all -m ping       # 进行连通测试
    [root@localhost Liarlee]$ ansible all -m ping --list-hosts      # 列举所有受影响的主机，但是不执行操作
    [root@localhost Liarlee]$ ansible all -m ping -C        # 进行测试，但是不对控制的主机作更改
    ```

## ansible使用示例
Ansible默认将所有的操作通过模块的方式定义，这里列举了一些常用的模块：

### ansible管理查询命令
使用ansible-doc命令来进行模块的文档查看, */var/log/messages* 中会记录操作日志。
```bash
[root@localhost Liarlee]$ ansible-doc -l      # 列举所有当前可用的模块和简单说明
[root@localhost Liarlee]$ ansible-doc -s [MODULES_NAME]     # 查看指定模块的使用方法和说明
```
### user模块
设定主机的用户状态，对用户进行创建删除，更改信息以及参数。
```bash
# 设置所有主机创建用户user,设置内容有uid,groups,shell
    [root@localhost Liarlee]$ ansible all -m user -a "name=user1 uid=3000 state=present groups=testgrp shell=/bin/zsh"
```
### group模块
设置主机的组状态，对组状态进行编辑。
```bash
# 控制所有主机创建组testgrp,设置内容有gid,非系统组
    [root@localhost Liarlee]$ ansible all -m group -a "gid=3000 name=testgrp state=present system=no"
# 控制所有主机删除testgrp
    [root@localhost Liarlee]$ ansible all -m group -a "gid=3000 name=testgrp state=absent"
```
### copy模块
从本地复制内容到控制的所有主机,指定源地址和目的地址。
```bash
# 复制本地/etc/fstab到所有主机的/tmp/fstab.ansible,同时设置权限为755
    [root@localhost Liarlee]$ ansible all -m copy -a "src=/etc/fstab dest=/tmp/fstab.ansible mode=755"
# 通过键盘输入的文本内容传输到目的文件中，文件可不存在，可同时设置文件的属主属组
    [root@localhost Liarlee]$ ansible all -m copy -a "content='hello,world\n' dest=/tmp/test.txt owner=liarlee group=liarlee"
# 递归复制目录及其子文件到所有主机的/tmp/下
    [root@localhost Liarlee]$ ansible all -m copy -a "src=/etc/httpd dest=/tmp/"
# 复制目录下的所有文件到所有主机的/tmp/下，不创建对应的目录
    [root@localhost Liarlee]$ ansible all -m copy -a "src=/etc/httpd/ dest=/tmp/"
# 在所有主机的目录下新建一个空文件
    [root@localhost Liarlee]$ ansible all -m copy -a "content='' dest=/tmp/testfile"
```
### fetch模块
可从远程主机复制文件到本地。
```bash
# 从某个主机复制文件到本地目录，文件不存在退出
    [root@localhost Liarlee]$ ansible [HOST1] -m fetch -a "src=/etc/fstab dest=/tmp/fstab.host1 fail-on-missing=yes"
```
### command模块
command模块不调用shell去解析命令，仅仅读取第一个命令进行简单执行,因此不支持管道传递参数。
```bash
# 在所有主机上执行ifconfig
    [root@localhost Liarlee]$ ansible all -m command -a "ifconfig"
```
### shell模块
使用shell执行传递的命令，支持管道传递参数
```bash
# 执行shell命令修改用户的密码
    [root@localhost Liarlee]$ ansible all -m shell -a "echo PASSWORD | passwd --stdin user1"
```
### file模块
用于设定文件的状态以及属性
```bash
# 在所有主机上建立目录
    [root@localhost Liarlee]$ ansible all -m file -a "path=/tmp/testdir state=directory"
# 在所有主机上对文件建立符号链接
    [root@localhost Liarlee]$ ansible all -m file -a "src=/tmp/testfile path=/tmp/testfile.link state=link"
# 在所有主机上设置文件或目录的权限
    [root@localhost Liarlee]$ ansible all -m file -a "path=/tmp/testfile mode=0755"
```
### cron模块
用于设置计划任务
```bash
# 设置每三分钟运行一次同步时间的脚本
    [root@localhost Liarlee]$ ansible all -m cron -a "miniute=*/3 name=synctime job='usr/sbin/update 172.16.0.1 &> /dev/null'state=present"
# 删除设置的计划任务
    [root@localhost Liarlee]$ ansible all -m cron -a "miniute=*/3 name=synctime job='usr/sbin/update 172.16.0.1 &> /dev/null'state=absent"
```
### yum模块
用于调用yum进行软件包的安装卸载等，定义主机安装软件包的状态
```bash
# 在所有主机安装nginx
    [root@localhost Liarlee]$ ansible all -m yum -a "name=nginx state=install"
```
### serivce模块
用于定义管理目标主机的服务状态
```bash
# 在所有的主机上启动nginx服务
    [root@localhost Liarlee]$ ansible all -m service -a "name=nginx state=startd"
# 在所有的主机上设置nginx开机启动
    [root@localhost Liarlee]$ ansible all -m service -a "name=nginx enabled"
# 在所有主机上停止nginx服务
    [root@localhost Liarlee]$ ansible all -m service -a "name=nginx state=stoppd"
# 在所有的主机上重载nginx的配置文件
    [root@localhost Liarlee]$ ansible all -m service -a "name=nginx state=reloaded"
# 在所有主机上重启nginx服务
    [root@localhost Liarlee]$ ansible all -m service -a "name=nginx state=restarted"
```
### scripts模块
用于在所有主机上执行设置好的脚本
```bash
# 在所有的主机上执行test.sh
    [root@localhost Liarlee]$ ansible all -m scripts -a "/tmp/test.sh"
```