---
title: Java连接数据库报错No subject alternative names present
date: 2020-11-16 21:28:41
tags: MongoDB, JAVA
categories: Database
---

配置监控的时候需要配置和获取MongoDB的信息，使用华为云的MongoDBPaaS服务，如果开启了SSL就无法正常连接。

报错如下： 

```bash
Timed out after 30000 ms while waiting to connect. Client view of cluster state is {type=UNKNOWN, servers=[{address=192.168.1.1:8635, type=UNKNOWN, state=CONNECTING, exception={com.mongodb.MongoSocketWriteException: Exception sending message}, caused by {javax.net.ssl.SSLHandshakeException: java.security.cert.CertificateException: No subject alternative names present}, caused by {java.security.cert.CertificateException: No subject alternative names present}}]
```

网上搜索到的结果基本上都是从开发的角度解决这个错误， 如果是从运维的方向上 ， 没有什么有效的方法可以解决这个问题么？比如通过一些参数或者设置。

有的 ： 

> 在连接串里加上sslinvalidhostnameallowed=true即可, 设置是直接允许无效的hostname证书， 算是不解决证书问题一个解决方案吧。

所以 最后的连接参数变成： 

```zsh
mongodb://192.168.1.1:8635/test?authSource=admin&ssl=true&sslinvalidhostnameallowed=true
```

