---
title: ElasticSearch 01
date: 2019-09-11 17:25:57
tags: ElasticSearch
categories: Linux
---

ElasticSearch的安装过程。

# 准备源码包 
1. 需要下载的包有三个：[网站地址](https://www.elastic.co/cn/downloads/)
   - ElasticSearch- 分布式、RESTful 风格的搜索和分析。/usr/local/src/elasticsearch
   - Logstash - 采集、转换、充实，然后输出。/usr/local/src/logstash
   - Kibana - 实现数据可视化。在 Elastic Stack 中进行导航。/usr/local/src/kibana

# 安装 ElasticSearch
1. 解压下载的安装包
   1. tar zxvf elasticsearch-7.3.1-linux-x86_64.tar.gz
   2. tar zxvf kibana-7.3.1-linux-x86_64.tar.gz
   3. tar zxvf logstash-7.3.1.tar.gz
2. 修改系统参数
   - vim /etc/sysctl.conf
   - fs.file-max=65535
   - vm.max_map_count=262144
3. sysctl -p : 重新读取配置文件中的参数，更新的条目会显示在命令执行结果中。
4. vim /etc/security/limits.conf
	```
	* soft nofile 65536
	* hard nofile 131072
	* soft noproc 4096
	* hard noproc 4096	
	```
5. 保存退出。
6. 建立elk用户
	```
	useradd elk -p "YOUR-PASSWD"
	```
1. 将/usr/local/src/elasticsearch目录的权限给elk用户。
	```
	chown -R elk:elk /usr/local/src/elasticsearch/
	```
1. 在/usr/local/src/elasticsearch/elasticsearch/config/目录下修改配置文件elasticsearch.yml。
	```
	cluster.name: CLUSTER_NAME
	node.name: HOSTNAME & ROLES
	node.master: true
	node.data: true
	network.host: YOUR_HOSTNAME
	discovery.zen.ping.unicast.hosts: ["YOUR_OTHER_NODE_HOSTNAME "]
	
	```
2. 切换到elk用户，尝试启动elk
	su elk 
	cd /usr/local/src/elasticsearch/elasticsearch/bin/
	./elasticsearch 
	如果没有错误就可以使用 -d 选项将服务启动到后台。
