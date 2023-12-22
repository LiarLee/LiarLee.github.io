---
title: Linux Redhat 9 oom不触发
date: 2023-07-12 06:52:18
category: Linux
tags:
  - Linux
  - Memory
  - Kernel
---

## 测试环境

Amazon AMI ID: ami-0e54fe8afeb8fa59a

Operating System: Red Hat Enterprise Linux 9.2 (Plow)

Kernel: Linux 5.14.0-284.11.1.el9_2.x86_64

MySQL Version:  Ver 8.0.33 for Linux on x86_64 (MySQL Community Server - GPL)

## 测试步骤：

1. 使用上面的AMI启动一个新的实例， 在实例启动之后ssh连接进去。

2. 按照MySQL官方的 repo 安装一个社区的版本。

   ```bash
   # https://dev.mysql.com/downloads/repo/yum/ 
   # (mysql80-community-release-el9-1.noarch.rpm)
   
   wget https://dev.mysql.com/get/mysql80-community-release-el9-1.noarch.rpm
   
   dnf install -y ./mysql80-community-release-el9-1.noarch.rpm
   
   dnf makecache -y 
   
   dnf update -y
   
   # Refer this doc to install mysql-community packages.
   # https://dev.mysql.com/doc/refman/8.0/en/linux-installation-yum-repo.html
   dnf install -y mysql-community-server
   
   # Check the installation success.
   systemctl status mysqld
   ```

3. 编辑MySQL配置文件， 添加如下的参数:

   ```bash
   vim /etc/my.cnf
   #设置buffer pool 的参数大于物理内存。 例如 os 本身由可用的内存是 16G， 那么设置一个更大的值即可。
   innodb_buffer_pool_size = 40G
   
   sudo systemctl enable --now mysqld
   
   sudo systemctl status mysqld
   
   # 获取root用户的临时初始化密码： 
   sudo grep 'temporary password' /var/log/mysqld.log
   
   # 使用root用户登录， 并查看配置已经生效。
   mysql -u root -p
   
   MySQL [(none)]> show variables like "%buffer_pool_size%";
   +-------------------------+-------------+
   | Variable_name           | Value       |
   +-------------------------+-------------+
   | innodb_buffer_pool_size | 42949672960 |
   +-------------------------+-------------+
   1 row in set (0.005 sec)
   ```

4. 创建database 以及 table：

   ```mysql
   create database test;
   
   CREATE TABLE tt1(
   id int NOT NULL AUTO_INCREMENT PRIMARY KEY,
   person_id tinyint not null ,
   person_name1 VARCHAR(3000) ,
   person_name2 VARCHAR(3000) ,
   person_name3 VARCHAR(3000) ,
   person_name4 VARCHAR(3000) ,
   person_name5 VARCHAR(3000) ,
   gmt_create datetime ,
   gmt_modified datetime
   ) ;	
   
   insert into tt1 (person_id, person_name1, person_name2, person_name3, person_name4, person_name5, gmt_create, gmt_modified)
   values (1, lpad('',3000,'*'), lpad('',3000,'*'), lpad('',3000,'*'), lpad('',3000,'*'), lpad('',3000,'*'), now(), now());
   
   # 反复执行这个命令， 复制全表的数据， 大概执行 10 次左右。
   insert into tt1 (person_id, person_name1, person_name2, person_name3, person_name4, person_name5, gmt_create, gmt_modified)
   select person_id, person_name1, person_name2, person_name3, person_name4, person_name5, now(), now() from tt1;
   
   
   # 查看当前table的信息 ，确认一下数据量。 
   show table status like 'tt1'\G
   ```

5. 在另一个机器上面 select 这个表格。

   ```mysql
   select count(*) from tt1;
   ```

6. 如果数据量足够大的话， 那么就会占用超过物理内存的空间，导致OOM。

---

## 问题

其他版本的os上面都会触发oom， 然后MySQL会被干掉重启， 只有Redhat 9 这个版本的os是不会触发的。

测试了Ubuntu 22， amazonlinux2， amazonlinux2023 都没由这个问题， 他们的内核都是 5.10+ 。

Redhat 9 这个版本的表现是， 在接近物理内存容量极限的时候， os 开始非常频繁的扫描并尝试回收内存的空间， 导致命令的响应变慢，我开了sar的监控命令，返回数据的速度也会便的比较慢， 大部分的进程会慢慢变成 Uninterreptable状态， 并且数量越来越多， 最终会导致实例的网络子系统不工作， 完全不响应任何的网络报文，实例的健康检查失败。CPU使用率依旧还在， EBS的监控显示这个卷满速度读取输出， 并且非常平稳, 响应时间以及队列的长度也没有异常。

如果这个时候尝试取手动触发oom， 是可以成功的， 在杀掉Mysqld之后， os就恢复了正常。

## 分析思路

可以确定的是 磁盘的工作是正常的， CPU使用率慢慢增长但是也是正常的。 这部分的工作没有问题。 

在发生问题的时候因为网络无法正常的工作，ssh已经断开， 无法确定当时的情况。 

初步判断是内存的问题， 但是具体的差异是哪里。

### 第一

sar命令中的记录

### 第二

尝试对比与行为正常的os的差异， 获取sysctl -a 并记录到文件中。 

对比完关于内存部分的参数， 完全没有任何的差别， 不是设置或者配置文件导致的这个问题。

min 水位的设置是默认的， 与其他的发行版本一直， 测试的时候用的相同的规格， 所以不存在这类的差异。

### 第三

触发一个kdump 看看网络不相应的时候 os 当时的状态，  这个不太会。

### 第四

查看内核的编译选项， 看看有什么不同。

### 第五

学习os 内存的部分， 看看具体这个版本的内核如何进行内存的回收的， 或者触发oom的条件有哪些。

