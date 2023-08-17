---
title: Cacti的安装教程
date: 2018-04-01 16:01:48
tags: Cacti
categories: Linux 
---

当时记录Cacti的安装记录。

## 安装环境  
OS : CentOS 7 Server Everything -- Minimal Version  
Required Packages : LAMP, RRDTool

## 部署基础组件  
1. 安装Apache   
命令如下：
```
yum install -y httpd httpd-devel  
dnf install -y httpd httpd-devel  
```
安装完毕。  

2. 安装MySQL  
命令如下：
```
yum install -y mysql mysql-server   
dnf install -y mysql mysql-server  
```
OR  

```
yum install -y Mariadb-server  
dnf install -y Mariadb-server
```
安装完毕。  

3. 安装PHP  
命令如下：  
```
yum install -y php-mysql php-pear php-common php-gd php-devel php php-mbstring php-cli  
dnf install -y php-mysql php-pear php-common php-gd php-devel php php-mbstring php-cli  
```
安装完毕。  

4. 安装PHP-SNMP
命令如下：
```
yum install -y php-snmp  
dnf install -y php-snmp  
```
安装完毕。  

5. 安装NET-SNMP
命令如下：
```
yum install -y net-snmp-utils net-snmp-libs net-snmp   
dnf install -y net-snmp-utils net-snmp-libs net-snmp  
```
如果需要安装Spine，需要安装net-snmp-devel  
```
yum install -y net-snmp-devel
dnf install -y net-snmp-devel
```
安装完毕。

6. 安装RRDTool
命令如下：
```
yum install -y rrdtool  
dnf install -y rrdtool  
```
安装完毕。  

7. 开始所有的服务：
命令如下：
```
service httpd start  
service mysqld start OR service mariadb start
service snmpd start
```
OR
```
systemctl start httpd.service
systemctl start mariadb.service
systemctl start snmpd.service
```
安装完毕。  

8. 调整服务开机启动：
```
chkconfig httpd on  
chkconfig mysqld on
chkconfig snmpd on
```
OR
```
systemctl enable httpd.service
systemctl enable mariadb.service
systemctl enable snmpd.service
```
安装完毕。

9. 开启EPEL REPO & 安装Cacti
```
wget http://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm  
rpm -ivh epel-release-latest-7.noarch.rpm
yum makecache
```
安装完毕。  
**所有的安装内容已经部署完毕。**

## 进行配置  
1. 配置MySQL的root密码  
```
mysqladmin -u root password YOURSELF_PASSWORD
```

2. 创建Cacti的数据库  
```
mysql -u root -p
mysql> create database cacti;
mysql> GRANT ALL ON cacti.* TO cacti@localhost IDENTITFIED BY 'YOURSELF_PASSWORD';
mysql> FLUSH PRIVILEGES;
mysql> quit;
```
安装完毕。

3. MySQL-数据库初始化  
```
rpm -ql cacti | grep cacti.sql
mysql -u cacti -p cacti < /usr/share/doc/cacti/cacti.sql
```
命令发起后需要进行密码的输入

4. Cacti-读取数据库配置
```
vim /etc/cacti/db.php
```
需要编辑的内容如下：
```
	$database_type = "mysql";
	$database_default = "cacti";
	$database_hostname = "localhost";
	$database_username = "cacti";
	$database_password = "YOURSELF_PASSWORD";
	$database_port = "3306";
	$database_ssl = false;
```

5. Firewall-配置放行防火墙
```
iptables -A INPUT -p udp -m state --state NEW --dport 80 -j ACCEPT
iptables -A INPUT -p tcp -m state --state NEW --dport 80 -j ACCEPT
iptables save
```
OR  
```
firewall-cmd --permanent --zone=public --add-service=http
firewall-cmd --reload
```

6. Apache- 配置Cacti根目录
```
vim /etc/httpd/conf.d/cacti.conf
```
配置文件内的内容修改如下：  
```
	<Directory /usr/share/cacti/>
	Order Deny,Allow
	Deny from all
	Allow from all
	</Directory>
```
重启服务：
```
service httpd restart
```
OR
```
systemctl restart httpd.service
```

7. Crond-配置Poller的计划任务  
```
vim /etc/cron.d/cacti
*/5 * * * *    cacti   /usr/bin/php /usr/share/cacti/poller.php > /dev/null 2>&1      \\ 去掉注释
```

8. 启动Broswer，进入Cacti安装界面，http://IPADDRESS/Cacti, 之后按照说明继续即可。  

Default Username : **admin**
Default Password : **admin**


## 补充安装SPINE过程
1. 下载源文件，安装程序。   
2. 安装CentOS,Development Tool，yum group install。   
3. 在Spine的目录下，执行./configure && make && make install。  
**NOTE：** 这里出现了的问题，提示找不到net-snmp header file--->没有安装net-snmp-devel
4. 进入控制台进行Spine是否安装成功。   

## 待续
