---
title: CheatSheet_Databases
category: Database
date: 2333-12-08 13:56:27
tags:
  - CheatSheet
  - Database
---

### 统计 MySQL 数据库占用的空间
```mysql
mysql  Ver 8.4.1 for Linux on x86_64 (MySQL Community Server - GPL)
mysql> select  TABLE_SCHEMA,  concat(truncate(sum(data_length)/1024/1024,2),' MB') as data_size, concat(truncate(sum(index_length)/1024/1024,2),'MB') as index_size from information_schema.tables group by TABLE_SCHEMA ORDER BY data_size desc;
+--------------------+-----------+------------+
| TABLE_SCHEMA       | data_size | index_size |
+--------------------+-----------+------------+
| mysql              | 7.51 MB   | 0.34MB     |
| test_db            | 230.31 MB | 30.31MB    |
| sys                | 0.01 MB   | 0.00MB     |
| information_schema | 0.00 MB   | 0.00MB     |
| performance_schema | 0.00 MB   | 0.00MB     |
+--------------------+-----------+------------+
5 rows in set (0.17 sec)
```

### 查看 MYSQL 的版本
```mysql
mysql> status;
--------------
mysql  Ver 8.4.1 for Linux on x86_64 (MySQL Community Server - GPL)

Connection id:		26
Current database:	
Current user:		root@localhost
SSL:			Not in use
Current pager:		stdout
Using outfile:		''
Using delimiter:	;
Server version:		8.4.1 MySQL Community Server - GPL
Protocol version:	10
Connection:		Localhost via UNIX socket
Server characterset:	utf8mb4
Db     characterset:	utf8mb4
Client characterset:	latin1
Conn.  characterset:	latin1
UNIX socket:		/var/run/mysqld/mysqld.sock
Binary data as:		Hexadecimal
Uptime:			19 hours 36 min 40 sec

Threads: 3  Questions: 661  Slow queries: 4  Opens: 737  Flush tables: 3  Open tables: 150  Queries per second avg: 0.009
--------------
```

### 启用 MYSQL 慢日志
官方文档: https://dev.mysql.com/doc/refman/8.4/en/slow-query-log.html
```toml
[mysqld]
slow_query_log=ON
long_query_time=10
```
查看当前运行中的慢日志设置
```mysql
mysql> show variables like 'slow_query%';
+---------------------+--------------------------------------+
| Variable_name       | Value                                |
+---------------------+--------------------------------------+
| slow_query_log      | OFF                                  |
| slow_query_log_file | /var/lib/mysql/mysql-master-slow.log |
+---------------------+--------------------------------------+
2 rows in set (0.01 sec)

mysql> show variables like 'long_query_time';
+-----------------+-----------+
| Variable_name   | Value     |
+-----------------+-----------+
| long_query_time | 10.000000 |
+-----------------+-----------+
1 row in set (0.01 sec)
```
基于Mysql的文档记录: 
> To include slow administrative statements in the slow query log, enable the [`log_slow_admin_statements`](https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html#sysvar_log_slow_admin_statements) system variable. Administrative statements include [`ALTER TABLE`](https://dev.mysql.com/doc/refman/8.4/en/alter-table.html "15.1.9 ALTER TABLE Statement"), [`ANALYZE TABLE`](https://dev.mysql.com/doc/refman/8.4/en/analyze-table.html "15.7.3.1 ANALYZE TABLE Statement"), [`CHECK TABLE`](https://dev.mysql.com/doc/refman/8.4/en/check-table.html "15.7.3.2 CHECK TABLE Statement"), [`CREATE INDEX`](https://dev.mysql.com/doc/refman/8.4/en/create-index.html "15.1.15 CREATE INDEX Statement"), [`DROP INDEX`](https://dev.mysql.com/doc/refman/8.4/en/drop-index.html "15.1.27 DROP INDEX Statement"), [`OPTIMIZE TABLE`](https://dev.mysql.com/doc/refman/8.4/en/optimize-table.html "15.7.3.4 OPTIMIZE TABLE Statement"), and [`REPAIR TABLE`](https://dev.mysql.com/doc/refman/8.4/en/repair-table.html "15.7.3.5 REPAIR TABLE Statement").

### 查看 Binlog 的内容
```mysql
mysql> show binlog events in 'binlog.000005';
```
2