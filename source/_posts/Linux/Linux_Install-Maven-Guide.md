---
title: 安装Maven教程
date: 2018-06-25 21:05:26
categories: Linux
tags:
  - Linux
  - JAVA
---

安装Maven过程，备忘。

## 下载安装包
1.  [Maven Download Links](https://maven.apache.org/download.cgi)  

1. 解压安装包：  
   tar xzvf apache-maven-3.5.4-bin.tar.gz 

1. 设置环境变量：  
    vim /etc/profile  
    export M2_HOME=/usr/local/apache-maven/apache-maven-3.2.5  
    export M2=$M2_HOME/bin  
    export MAVEN_OPTS=-Xms256m -Xmx512m

1. 添加环境变量到PATH：  
    export PATH=M2:PATH

