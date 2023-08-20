---
title: 数据库单表的测试
category: Database
date: 2023-05-19 18:10:52
tags: MySQL, Database
---

基于这个问题的测试[为什么MySQL单表不要超过2000w行？](https://articles.zsxq.com/id_szzdrtss5t7o.html)

## 测试过程：

```
CREATE TABLE test(
id int NOT NULL AUTO_INCREMENT PRIMARY KEY comment '主键',
person_id int not null comment '用户id',
person_name VARCHAR(200) comment '用户名称',
gmt_create datetime comment '创建时间',
gmt_modified datetime comment '修改时间'
) comment '人员信息表';

插入数据：
insert into test values(1,1,'user_1', NOW(), now());

insert into test (person_id, person_name, gmt_create, gmt_modified)
select (@i:=@i+1) as rownum, person_name, now(), now() from test, (select @i:=100) as init;
set @i=1;

//测试 SQL,记录他们的运行时间
select count(*) from test;
select count(*) from test where id=XXX;

查看这个表格的数据量大小： 
show table status like 'test'\G
```

200w行表： 

```mysql
mysql> describe table test;
+----+-------------+-------+------------+------+---------------+------+---------+------+---------+----------+-------+
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows    | filtered | Extra |
+----+-------------+-------+------------+------+---------------+------+---------+------+---------+----------+-------+
|  1 | SIMPLE      | test  | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 2092640 |   100.00 | NULL  |
+----+-------------+-------+------------+------+---------------+------+---------+------+---------+----------+-------+
1 row in set, 1 warning (0.00 sec)

MySQL [test]> select count(*) from test;
1 row in set (0.045 sec)
1 row in set (0.050 sec)
1 row in set (0.050 sec)
```

400w：

```
mysql> describe table test;
+----+-------------+-------+------------+------+---------------+------+---------+------+---------+----------+-------+
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows    | filtered | Extra |
+----+-------------+-------+------------+------+---------------+------+---------+------+---------+----------+-------+
|  1 | SIMPLE      | test  | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 4185280 |   100.00 | NULL  |
+----+-------------+-------+------------+------+---------------+------+---------+------+---------+----------+-------+
1 row in set, 1 warning (0.00 sec)

MySQL [test]> select count(*) from test;
1 row in set (0.126 sec)
1 row in set (0.120 sec)
1 row in set (0.119 sec)
```

800w：

```
mysql> describe table test;
+----+-------------+-------+------------+------+---------------+------+---------+------+---------+----------+-------+
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows    | filtered | Extra |
+----+-------------+-------+------------+------+---------------+------+---------+------+---------+----------+-------+
|  1 | SIMPLE      | test  | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 8370120 |   100.00 | NULL  |
+----+-------------+-------+------------+------+---------------+------+---------+------+---------+----------+-------+
1 row in set, 1 warning (0.00 sec)

MySQL [test]> select count(*) from test;
1 row in set (0.266 sec)
1 row in set (0.266 sec)
1 row in set (0.253 sec)
```

1600w：

```
mysql> describe table test;
+----+-------------+-------+------------+------+---------------+------+---------+------+----------+----------+-------+
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows     | filtered | Extra |
+----+-------------+-------+------------+------+---------------+------+---------+------+----------+----------+-------+
|  1 | SIMPLE      | test  | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 16337090 |   100.00 | NULL  |
+----+-------------+-------+------------+------+---------------+------+---------+------+----------+----------+-------+
1 row in set, 1 warning (0.00 sec)

MySQL [test]> select count(*) from test;
1 row in set (0.544 sec)
1 row in set (0.524 sec)
1 row in set (0.523 sec)
```

3200w：

```
mysql> describe table test;
+----+-------------+-------+------------+------+---------------+------+---------+------+----------+----------+-------+
| id | select_type | table | partitions | type | possible_keys | key  | key_len | ref  | rows     | filtered | Extra |
+----+-------------+-------+------------+------+---------------+------+---------+------+----------+----------+-------+
|  1 | SIMPLE      | test  | NULL       | ALL  | NULL          | NULL | NULL    | NULL | 32665301 |   100.00 | NULL  |
+----+-------------+-------+------------+------+---------------+------+---------+------+----------+----------+-------+
1 row in set, 1 warning (0.00 sec)

MySQL [test]> select count(*) from test;
1 row in set (1.068 sec)
1 row in set (1.057 sec)
1 row in set (1.044 sec)
```

这个结果基本上都是线性的， 感觉数据量实在是太小了。

```
mysql> show table status like 'test'\G
*************************** 1. row ***************************
           Name: test
         Engine: InnoDB
        Version: 10
     Row_format: Dynamic
           Rows: 4182365
 Avg_row_length: 48
    Data_length: 202063872
Max_data_length: 0
   Index_length: 0
      Data_free: 6291456
 Auto_increment: 4652971
    Create_time: 2023-05-19 07:56:46
    Update_time: 2023-05-19 07:57:50
     Check_time: NULL
      Collation: utf8mb4_0900_ai_ci
       Checksum: NULL
 Create_options:
        Comment: 人员信息表
1 row in set (0.00 sec)
```

---

## 换个方案（ 从大佬那边伸手拿来的

```
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

insert into tt1 (person_id, person_name1, person_name2, person_name3, person_name4, person_name5, gmt_create, gmt_modified)
select person_id, person_name1, person_name2, person_name3, person_name4, person_name5, now(), now() from tt1;

show table status like 'tt1'\G

rename user 'root'@'localhost'  to 'root'@'%';

select user,host from mysql.user;

```

这次的话， 添加数据的时间实在是太久了， 记录一下中间结果的变化吧： 

```mysql
MySQL [test]> select count(*) from tt1;
+----------+
| count(*) |
+----------+
|    32768 |
+----------+
1 row in set (0.097 sec)

MySQL [test]> select count(*) from tt1;
+----------+
| count(*) |
+----------+
|    32768 |
+----------+
1 row in set (0.096 sec)

MySQL [test]> select count(*) from tt1;
+----------+
| count(*) |
+----------+
|    65536 |
+----------+
1 row in set (0.199 sec)

MySQL [test]> select count(*) from tt1;
+----------+
| count(*) |
+----------+
|    65536 |
+----------+
1 row in set (0.198 sec)

Query OK, 32768 rows affected (1 min 29.31 sec)
Query OK, 65536 rows affected (2 min 57.96 sec)
Query OK, 131072 rows affected (6 min 6.59 sec)
Query OK, 262144 rows affected (13 min 42.06 sec)

# 查table的Page_NO
SELECT b.name, a.name, index_id, TYPE, a.SPACE, a.PAGE_NO FROM information_schema.INNODB_INDEXES a, information_schema.INNODB_TABLES b WHERE a.TABLE_ID = b.table_id AND a.SPACE <> 0 AND b.NAME = 'tt1';

mysql> SELECT b.name, a.name, index_id, type, a.space, a.PAGE_NO FROM information_schema.INNODB_INDEXES a, information_schema.INNODB_TABLES b WHERE a.table_id = b.table_id AND a.space <> 0;

| cap/sbtest24                            | PRIMARY                   |      356 |    3 |   129 |       4 |
| test/test                               | PRIMARY                   |      359 |    3 |   131 |       4 |
| test/tt1                                | PRIMARY                   |      360 |    3 |   132 |       4 |
+-----------------------------------------+---------------------------+----------+------+-------+---------+

计算对应需要查看的位置， 字节数: 16 * 1024 * page_no + 64
# 使用hexdump 查看表格所在的b+树有几层。
hexdump -s 49216 -n 10 ./tt1.ibd

# 创建tt2完全复制tt1的内容。
create table tt2 as select * from tt1;
```

> 对于MySQL的内存使用，在数据库启动后，不会立即将buffer pool对应的内存占用，而是随着使用逐步占用。
>
> 在5月19日看到您的实例有连接数达到1200，并持续了一段时间，内存随之下降。您可以通过查看 Innodb_buffer_pool_size 的值来确定 buffer pool 的最大值。
> 然后根据公式来计算预期的内存使用情况：
> Maximum MySQL Memory Usage = innodb_buffer_pool_size + key_buffer_size + ((read_buffer_size + read_rnd_buffer_size + sort_buffer_size + join_buffer_size) X max_connections)
>
> 我按照您的配置，创建了mysql 5.7.41 版本，实例类型为 db.m5.xlarge ，公式中的参数均为默认值，计算结果如下：
> Maximum MySQL Memory Usage
> = innodb_buffer_pool_size + key_buffer_size + ((read_buffer_size + read_rnd_buffer_size + sort_buffer_size + join_buffer_size) X max_connections)
> = 11811160064 + 16777216 + (262144 + 524288 + 262144 + 262144 ) * 1200
> = 13400801280 即 12.48GB
>
> 总内存为 16 GB ，减去 12.48 GB，还剩下 3.52 GB。再除去一些SQL执行中消耗的内存以及操作系统等消耗的内存，目前指标上显示剩余1.5GB左右。
>
> 在5月19日连接数增加前，按300连接数算，上述公式计算结果为 11.38 GB，然而可用内存指标显示为 7 GB，相加起来是大于 16 GB 的。由此也能说明是 MySQL 并未直接将参数设置的所有可用内存都占用，而是随着使用逐步增加的。
> 当连接数增加后，MySQL真正使用了这部分内存(如buffer pool)，不会主动释放。
>
> 因此目前可用内存状况符合预期，如果您希望回收 MySQL 占用的内存，可以考虑重启数据库，但之后业务量较大时，还会重新占用这些内存。

### Mysql80重置密码

```mysql
echo "skip-grant-tables" >> /etc/my.cnf
sudo systemctl restart mysqld

mysql -uroot -p

SET PASSWORD = 'root';

rename user 'root'@'localhost'  to 'root'@'%';

select user,host from mysql.user;
```

### MySQLVersion 8.0 修改密码策略：

```
mysql -u wordpress -p -h mysql.liarlee.site

MySQL [(none)]> SHOW VARIABLES LIKE 'validate_password%';
+--------------------------------------+--------+
| Variable_name                        | Value  |
+--------------------------------------+--------+
| validate_password.check_user_name    | ON     |
| validate_password.dictionary_file    |        |
| validate_password.length             | 8      |
| validate_password.mixed_case_count   | 1      |
| validate_password.number_count       | 1      |
| validate_password.policy             | MEDIUM |
| validate_password.special_char_count | 1      |
+--------------------------------------+--------+
7 rows in set (0.010 sec)

MySQL [(none)]> set global validate_password.policy=0;
Query OK, 0 rows affected (0.000 sec)

MySQL [(none)]> set global validate_password.length=4;
Query OK, 0 rows affected (0.001 sec)

MySQL [(none)]> set password='123123';
Query OK, 0 rows affected (0.005 sec)

```

如果添加了 skip-grant-tables 参数的话， 默认需要先flush priviledges; 然后才能更改密码， 否则的话会报错：

> ERROR 1290 (HY000): The MySQL server is running with the --skip-grant-tables option so it cannot execute this statement

解决办法是 ： 

```mysql
mysql> alter user 'root'@'localhost' identified by '123123';
ERROR 1290 (HY000): The MySQL server is running with the --skip-grant-tables option so it cannot execute this statement

mysql> flush privileges;
Query OK, 0 rows affected (0.00 sec)

mysql> alter user 'root'@'localhost' identified by '123123';
ERROR 1819 (HY000): Your password does not satisfy the current policy requirements

mysql> set global validate_password.policy=0;
Query OK, 0 rows affected (0.00 sec)

mysql> set global validate_password.length=4;
Query OK, 0 rows affected (0.00 sec)

mysql> flush privileges;
Query OK, 0 rows affected (0.00 sec)

mysql> set password='123123';
ERROR 1133 (42000): Can't find any matching row in the user table

mysql> alter user 'root'@'localhost' identified by '123123';
Query OK, 0 rows affected (0.00 sec)
```

