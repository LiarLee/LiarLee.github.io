---
title: 数据库单表的测试
category: Linux
date: 2023-05-19 18:10:52
tags: MySQL
---

基于这个问题的测试[为什么MySQL单表不要超过2000w行？](https://articles.zsxq.com/id_szzdrtss5t7o.html)

测试过程记录： 

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
+----------+
| count(*) |
+----------+
|  2097152 |
+----------+
1 row in set (0.045 sec)

MySQL [test]> select count(*) from test;
+----------+
| count(*) |
+----------+
|  2097152 |
+----------+
1 row in set (0.050 sec)

MySQL [test]> select count(*) from test;
+----------+
| count(*) |
+----------+
|  2097152 |
+----------+
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
+----------+
| count(*) |
+----------+
|  4194304 |
+----------+
1 row in set (0.126 sec)

MySQL [test]> select count(*) from test;
+----------+
| count(*) |
+----------+
|  4194304 |
+----------+
1 row in set (0.120 sec)

MySQL [test]> select count(*) from test;
+----------+
| count(*) |
+----------+
|  4194304 |
+----------+
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
+----------+
| count(*) |
+----------+
|  8388608 |
+----------+
1 row in set (0.266 sec)

MySQL [test]> select count(*) from test;
+----------+
| count(*) |
+----------+
|  8388608 |
+----------+
1 row in set (0.266 sec)

MySQL [test]> select count(*) from test;
+----------+
| count(*) |
+----------+
|  8388608 |
+----------+
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
+----------+
| count(*) |
+----------+
| 16777216 |
+----------+
1 row in set (0.544 sec)

MySQL [test]> select count(*) from test;
+----------+
| count(*) |
+----------+
| 16777216 |
+----------+
1 row in set (0.524 sec)

MySQL [test]> select count(*) from test;
+----------+
| count(*) |
+----------+
| 16777216 |
+----------+
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
+----------+
| count(*) |
+----------+
| 33554432 |
+----------+
1 row in set (1.068 sec)

MySQL [test]> select count(*) from test;
+----------+
| count(*) |
+----------+
| 33554432 |
+----------+
1 row in set (1.057 sec)

MySQL [test]> select count(*) from test;
+----------+
| count(*) |
+----------+
| 33554432 |
+----------+
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

换个方案（ 从大佬那边伸手拿来的

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

hexodump -s 49216 -n 10 ./tt1.ibd

```



这次的话， 添加数据的时间实在是太久了， 记录一下中间结果的变化吧： 

```
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




```

