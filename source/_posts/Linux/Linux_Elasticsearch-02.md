---
title: ElasticSearch 安装记录
date: 2020-06-27 21:05:02
tags: ElasticSearch
categories: Linux
---

记录一下自己的集群安装过程和常见的命令。

## Elastic Search三节点的安装

1. 节点的名称和相关参数：

    | Host-name | IP              | Cluster Name | Role          |
    | --------- | --------------- | ------------ | ------------- |
    | elk01     | 192.168.122.101 | liarlee-elk  | Elasticsearch |
    | elk02     | 192.168.122.102 | liarlee-elk  | Kibana        |
    | elk03     | 192.168.122.103 | liarlee-elk  | Filebeat      |

1. 使用清华的repo
    ```
    [elasticsearch]
    name=Elasticsearch repository for 7.x packages
    #baseurl=https://artifacts.elastic.co/packages/7.x/yum
    baseurl=https://mirrors.tuna.tsinghua.edu.cn/elasticstack/7.x/yum/
    gpgcheck=0
    gpgkey=https://artifacts.elastic.co/GPG-KEY-elasticsearch
    enabled=1
    autorefresh=1
    type=rpm-md
    ```

3. 三个服务器都需要安装Elasticsearch并设置开机启动。

    ```yaml
    # 安装
    yum makecache fast && yum install -y elasticsearch 
    # 编辑配置文件
    vim /etc/elasticsearch/elasticsearch.yml
      node.master: true[只有其中的两台是主节点即可，剩下的03可以设置为False]
      node.name: elk01 [节点的名称，可以自定义，但是一个集群的内部节点名称不能相同]
      network.host: 192.168.122.101[每个机器的外部IP]
      http.port: 9200
      node.data: true [三个节点都可以存储数据]
      cluster.name: liarlee-elk [集群的名称三个机器必须一致]
      cluster.initial_master_nodes: ["elk1.hayden.cluster"]
      discovery.zen.ping.unicast.hosts: ["elk01", "elk02", "elk03"]
      discovery.zen.minimum_master_nodes: 1 [最少的master节点需要有一个]
    # 复制到02
    scp /etc/elasticsearch/elasticsearch.yml root@elk02:/etc/elasticsearch/elasticsearch.yml
    # 复制到03
    scp /etc/elasticsearch/elasticsearch.yml root@elk03:/etc/elasticsearch/elasticsearch.yml
    # 去对应的机器上修改机器名和相关字段，结束， 尝试启动。 
    ```

4. 确认三个节点的服务是否正常启动。

    ```shell
    # 使用curl命令访问节点的restfulAPI
    curl http://elk01:9200/_cluster/health?v
    curl http://elk01:9200/_cluster/health?pretty
    curl http://elk02:9200
    curl http://elk03:9200
    ```

5. 在02上安装kibana，并且开机启动。

    ```shell
    # 使用yum安装
    yum makecache fast && yum install -y kibana 
    systemctl enable kibana && systemctl start kibana
    ```

6. 访问Kibana的WebUI，可以正常的使用。

    ```shell
    # 通过API检查
    curl http://elk02:5601
    # 通过WebUI检查
    firefox http://elk02:5601/
    ```

7. 配置filebeat 无脑收集/var/log/messages, 并查看上报的状态。

    ```shell
    # 安装filebeat， 开机启动
    Download from ELK offical website : filebeat-7.7.1-linux-x86_64.tar.gz
    cd /opt/filebeat/filebeat-7.7.1-linux-x86_64
    vim ./filebeat.yml
    	filebeat.inputs:
    	- type: log
    	  enabled: true
    	  paths:
              - /var/log/messages
    	output.elasticsearch:
      		hosts: ["192.168.122.101:9200"]
    	setup.kibana:
      		host: "192.168.122.102:5601"
    # 运行
    cd /opt/filebeat/filebeat-7.7.1-linux-x86_64
    sudo nohup ./filebeat -e -c filebeat.yml >/dev/null 2>&1 &
    ```

8. 观察集群的日志的收集状况，我在这个时候已经没有其他的问题了.... Over.

## 有些问题

1. 我自己的虚拟机我是经常性的暴力关机的，所以遇到了节点的状态同步不正确，这导致我的ES集群启动的时候总是只有一个节点在线 ，其他的节点无法加入， 可以在ES的日志中观察到，节点试图添加，但是无法成功加入， 这个时候只需要删除无法加入节点的Node数据即可。

