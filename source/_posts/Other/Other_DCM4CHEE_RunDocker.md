---
title: Docker中运行DCM4CHEE-arc-light
date: 2018-07-02 20:34:52
tags:
  - Docker
categories: Healthcare-IT
---

在Docker中安装DCM4CHEE-arc-light项目。

<!-- more -->

因为需要进行测试所以使用了DCM4CHEE， 但是DCM4CHEE现在的版本已经很古老了， 从而我接触了两个古老的PACS程序， 一个是Windows平台上有名的ClearCanvas, 还有一个就是DCM4CHEE。
在安装的过程中遇到了很多的麻烦。 看到官方有把项目放在docker上， 所以决定直接使用。直接记录了所有的组件启动的方式和命令， 方便今后的查阅。

DCM4CHEE-arc-light是目前比较新项目了，我这里写下了最小的安装模式， 基本上足够我日常测试使用了。

这几个Docker容器是：
1. Docker
1. docker网桥
1. DAOCloud加速器
1. OpenLDAP
1. PostgreSQL数据库
1. DCM4CHEE-arc-light本体

## DCM4CHEE_Docker_Command
1. Install Docker component:   
    ```
    dnf install -y docker  
    ```

1. Create the dcm4chee bridge network:  
    ```
    docker network create dcm4chee_default  
    ```
1. DAOCloud加速器配置docker：
    ```
    curl -sSL https://get.daocloud.io/daotools/set_mirror.sh | sh -s http://f1dac9f0.m.daocloud.io
    ```

1. Start OpenLDAP Server: 
    ```
    docker run --network=dcm4chee_default --name ldap \
           -p 389:389 \
           -v /etc/localtime:/etc/localtime:ro \
           -v /var/local/dcm4chee-arc/ldap:/var/lib/ldap \
           -v /var/local/dcm4chee-arc/slapd.d:/etc/ldap/slapd.d \
           -d dcm4che/slapd-dcm4chee:2.4.44-13.2  
    ```

1. Start PostgreSQL:   
    ```
    docker run --network=dcm4chee_default --name db \
           -p 5432:5432 \
           -e POSTGRES_DB=pacsdb \
           -e POSTGRES_USER=pacs \
           -e POSTGRES_PASSWORD=pacs \
           -v /etc/localtime:/etc/localtime:ro \
           -v /var/local/dcm4chee-arc/db:/var/lib/postgresql/data \
           -d dcm4che/postgres-dcm4chee:10.0-13  
    ```

1. Start Wildfly With DCM4CHEE Archive 5:  
    ```
    docker run --network=dcm4chee_default --name arc \
           -p 8080:8080 \
           -p 8443:8443 \
           -p 9990:9990 \
           -p 11112:11112 \
           -p 2575:2575 \
           -e POSTGRES_DB=pacsdb \
           -e POSTGRES_USER=pacs \
           -e POSTGRES_PASSWORD=pacs \
           -e WILDFLY_WAIT_FOR="ldap:389 db:5432" \
           -v /etc/localtime:/etc/localtime:ro \
           -v /var/local/dcm4chee-arc/wildfly:/opt/wildfly/standalone \
           -d dcm4che/dcm4chee-arc-psql:5.13.2  
    ```

1. Start the three applications use on command:  

    ```
    docker start ldap db arc  
    ```

1. Stop the three application:  
    ```
    docker stop ldap db arc  
    ```

## 附加说明：

### Host 说明：
    dcm4chee_docker: 11.11.11.209/dcm4chee-arc/ui2

### Github Project DCM4CHEE-arc-light Note
1. [HL7 Relative Features](https://github.com/dcm4che/dcm4chee-arc-light/wiki/HL7-Related-Features)
1. [Weasis Integration]()https://github.com/dcm4che/dcm4chee-arc-light/wiki/Weasis-Viewer-Integration

