---
title: MySQL 主从复制
category: Database
date: 2024-07-13 01:24:55
tags:
  - MySQL
  - Linux
  - Network
---
被问了一个数据库的问题, 主从复制需要 主库锁表 和 主库重启吗? 

使用docker配置一遍, 测试一下, 记录了步骤, 有些东西还是 MySQL 的官方文档好用.

### 主库需要做的事情

1. 需要有唯一的 server id.
    这个可以设置 var , 不需要重启.
```mysql
MySQL [(none)]> show variables like 'server_id';
+---------------+-------+
| Variable_name | Value |
+---------------+-------+
| server_id     | 198   |
+---------------+-------+
1 row in set (0.001 sec)
```

2. 创建一个用户用来和从库同步数据. 这个也不需要重启.
```mysql
MySQL [(none)]> create user 'replication-user'@'172.31.62.236' identified by '123123';
Query OK, 0 rows affected (0.006 sec)

MySQL [(none)]> GRANT REPLICATION SLAVE ON *.* TO 'replication-user'@'172.31.62.236';
Query OK, 0 rows affected (0.004 sec)

MySQL [(none)]> SHOW GRANTS FOR 'replication-user'@'172.31.62.236';
+----------------------------------------------------------------------+
| Grants for replication-user@172.31.62.236                            |
+----------------------------------------------------------------------+
| GRANT REPLICATION SLAVE ON *.* TO `replication-user`@`172.31.62.236` |
+----------------------------------------------------------------------+
1 row in set (0.000 sec)

MySQL [(none)]> FLUSH PRIVILEGES;
Query OK, 0 rows affected (0.002 sec)

MySQL [(none)]> select Host,User,authentication_string from mysql.user;
+---------------+------------------+------------------------------------------------------------------------+
| Host          | User             | authentication_string                                                  |
+---------------+------------------+------------------------------------------------------------------------+
| %             | root             | $A$005$CK=G-6GdO6+*f4IpBYW8v6zGb62QvkVJIztfMwOYRKYK4VHdrnOcmM/jOzB     |
| 172.31.62.236 | replication-user | $A$005$t4642jI)eV[+@6NFBplxAFoO/a1p1sHIdDMiRHvtyvKD4mUFajpDiZKUPA      |
| localhost     | mysql.infoschema | $A$005$THISISACOMBINATIONOFINVALIDSALTANDPASSWORDTHATMUSTNEVERBRBEUSED |
| localhost     | mysql.session    | $A$005$THISISACOMBINATIONOFINVALIDSALTANDPASSWORDTHATMUSTNEVERBRBEUSED |
| localhost     | mysql.sys        | $A$005$THISISACOMBINATIONOFINVALIDSALTANDPASSWORDTHATMUSTNEVERBRBEUSED |
| localhost     | root             | $A$005$y,)(7](i&=Mm+kO9Re/i.ywV/7DTELTS9.DN9Or6yCVIPlaVm/NOkg/RA       |
+---------------+------------------+------------------------------------------------------------------------+
6 rows in set (0.001 sec)
```

3. 确保主库启用了binlog, 或者是特定的数据库启用了binlog. MySQL 8.0 以后默认会启用 binlog, 所以这个重启实际上没有发生.
4. 在主库上面查询 binlog 的状态, 也就是之前的 `show master status;` 现在这个命令已经被替换成:
```mysql
MySQL [test]> SHOW BINARY LOG STATUS\G
*************************** 1. row ***************************
File: binlog.000002
Position: 1086
Binlog_Do_DB: test
Binlog_Ignore_DB:
Executed_Gtid_Set:
1 row in set (0.000 sec)
```

### 从库需要做的事情
1. 确认可以连接到主库. 网络部分. 
2. 创建一个复制任务, 指定worker去做.
```mysql
mysql> CHANGE REPLICATION SOURCE TO
     SOURCE_HOST='172.31.54.198',
     SOURCE_USER='replication-user',
     SOURCE_PASSWORD='123123',
     SOURCE_LOG_FILE='binlog.000002',
     SOURCE_LOG_POS=4, # 这个是默认值, 4 表示从开始就同步.
     GET_SOURCE_PUBLIC_KEY=1;   # 这个是由于会报错, 提示
```
3. 启动同步.
```mysql
mysql> START REPLICA;

mysql> SHOW PROCESSLIST;
+----+-----------------+---------------------+------+---------+------+----------------------------------------------------------+------------------+
| Id | User            | Host                | db   | Command | Time | State                                                    | Info             |
+----+-----------------+---------------------+------+---------+------+----------------------------------------------------------+------------------+
|  8 | event_scheduler | localhost           | NULL | Daemon  | 2062 | Waiting on empty queue                                   | NULL             |
| 16 | root            | 172.31.47.174:56736 | NULL | Query   |    0 | init                                                     | SHOW PROCESSLIST |
| 29 | system user     | connecting host     | NULL | Connect |  447 | Waiting for source to send event                         | NULL             |
| 35 | system user     |                     | NULL | Query   |   79 | Replica has read all relay log; waiting for more updates | NULL             |
| 36 | system user     |                     | NULL | Query   | 2149 | Waiting for an event from Coordinator                    | NULL             |
| 37 | system user     |                     | NULL | Connect |   79 | Waiting for an event from Coordinator                    | NULL             |
| 38 | system user     |                     | NULL | Connect |   79 | Waiting for an event from Coordinator                    | NULL             |
| 39 | system user     |                     | NULL | Connect |   79 | Waiting for an event from Coordinator                    | NULL             |
+----+-----------------+---------------------+------+---------+------+----------------------------------------------------------+------------------+
8 rows in set, 1 warning (0.00 sec)

mysql> SHOW REPLICA STATUS\G;
*************************** 1. row ***************************
             Replica_IO_State: Waiting for source to send event
                  Source_Host: 172.31.54.198
                  Source_User: replication-user
                  Source_Port: 3306
                Connect_Retry: 60
              Source_Log_File: binlog.000002
          Read_Source_Log_Pos: 3612
               Relay_Log_File: ip-172-31-62-236-relay-bin.000002
                Relay_Log_Pos: 3823
        Relay_Source_Log_File: binlog.000002
           Replica_IO_Running: Yes
          Replica_SQL_Running: Yes
              Replicate_Do_DB:
          Replicate_Ignore_DB:
           Replicate_Do_Table:
       Replicate_Ignore_Table:
      Replicate_Wild_Do_Table:
  Replicate_Wild_Ignore_Table:
                   Last_Errno: 0
                   Last_Error:
                 Skip_Counter: 0
          Exec_Source_Log_Pos: 3612
              Relay_Log_Space: 4045
              Until_Condition: None
               Until_Log_File:
                Until_Log_Pos: 0
           Source_SSL_Allowed: No
           Source_SSL_CA_File:
           Source_SSL_CA_Path:
              Source_SSL_Cert:
            Source_SSL_Cipher:
               Source_SSL_Key:
        Seconds_Behind_Source: 0
Source_SSL_Verify_Server_Cert: No
                Last_IO_Errno: 0
                Last_IO_Error:
               Last_SQL_Errno: 0
               Last_SQL_Error:
  Replicate_Ignore_Server_Ids:
             Source_Server_Id: 198
                  Source_UUID: ddbc7571-4066-11ef-afce-02dece705732
             Source_Info_File: mysql.slave_master_info
                    SQL_Delay: 0
          SQL_Remaining_Delay: NULL
    Replica_SQL_Running_State: Replica has read all relay log; waiting for more updates
           Source_Retry_Count: 10
                  Source_Bind:
      Last_IO_Error_Timestamp:
     Last_SQL_Error_Timestamp:
               Source_SSL_Crl:
           Source_SSL_Crlpath:
           Retrieved_Gtid_Set:
            Executed_Gtid_Set:
                Auto_Position: 0
         Replicate_Rewrite_DB:
                 Channel_Name:
           Source_TLS_Version:
       Source_public_key_path:
        Get_Source_public_key: 1
            Network_Namespace:
1 row in set (0.00 sec)

ERROR:
No query specified
```
4. 清空之前的channel配置.
```mysql
mysql> STOP REPLICA IO_THREAD FOR CHANNEL '';
```
5. 停止同步.
---
### 错误
> Last_Error: Coordinator stopped because there were error(s) in the worker(s). The most recent failure being: Worker 1 failed executing transaction 'ANONYMOUS' at source log binlog.000002, end_log_pos 340. See error log and/or 

这个是没写 OURCE_LOG_POS=4 造成的, 应该写, 写4进去就是从头开始同步.

> requires secure connection. Error_code: MY-002061

这个参数 GET_SOURCE_PUBLIC_KEY 需要添加, 这个参数不添加的话, 就会有这个报错, 实际是需要信任主库.

