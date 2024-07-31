---
title: MySQL 计算内存用量
date: 2024-07-31 17:15:18
category: Database
tags:
  - Database
  - Memory
  - AWS
---
对于 MySQL，可以按以下示例计算 RDS for MySQL 数据库实例的大致内存使用量：
Maximum MySQL Memory Usage = innodb_buffer_pool_size + key_buffer_size + ((read_buffer_size + read_rnd_buffer_size + sort_buffer_size + join_buffer_size) * max_connections)

From repost: https://repost.aws/zh-Hans/knowledge-center/low-freeable-memory-rds-mysql-mariadb

From MySQL Offical: 
5.7  https://dev.mysql.com/doc/refman/5.7/en/memory-use.html
8.0  https://dev.mysql.com/doc/refman/8.0/en/memory-use.html

存储引擎的说明: 
https://dev.mysql.com/doc/refman/8.0/en/innodb-in-memory-structures.html
