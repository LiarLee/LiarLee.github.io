---
title: MySQL 无法重连问题的分析
category: Linux
date: 2024-04-12 15:36:25
tags:
  - MySQL
  - Linux
  - Network
---
使用下面的命令运行并进行测试:
1. 创建 docker 容器.
```shell
docker run -it -d --net=host -e MYSQL_ROOT_PASSWORD=123 --name=mysql-server reg.liarlee.site/docker.io/mysql

docker run --net=host --privileged -it reg.liarlee.site/docker.io/phantooom/plantegg:sysbench-lab bash
```
2. 连接并创建数据库.
```bash
mysql -h127.1 --ssl-mode=DISABLED -utest -p123 -e "create database test"
```
3. sysbench
```bash
sysbench --mysql-user='root' --mysql-password='123' --mysql-db='test' --mysql-host='127.0.0.1' --mysql-port='3306' --tables='16' --table-size='10000' --range-size='5' --db-ps-mode='disable' --skip-trx='on' --mysql-ignore-errors='all' --time='1180' --report-interval='1' --histogram='on' --threads=1 oltp_read_only prepare

sysbench --mysql-user='root' --mysql-password='123' --mysql-db='test' --mysql-host='127.0.0.1' --mysql-port='3306' --tables='16' --table-size='10000' --range-size='5' --db-ps-mode='disable' --skip-trx='on' --mysql-ignore-errors='all' --time='1180' --report-interval='1' --histogram='on' --threads=1 oltp_read_only run
```
4. 查看客户端进程.
```shell
MySQL [(none)]> show processlist;
+----+-----------------+---------------------+------+---------+------+------------------------+------------------+
| Id | User            | Host                | db   | Command | Time | State                  | Info             |
+----+-----------------+---------------------+------+---------+------+------------------------+------------------+
|  5 | event_scheduler | localhost           | NULL | Daemon  |  336 | Waiting on empty queue | NULL             |
| 11 | root            | 127.0.0.1:40666     | test | Sleep   |    0 |                        | NULL             |
| 12 | root            | 172.31.47.174:53264 | NULL | Query   |    0 | init                   | show processlist |
+----+-----------------+---------------------+------+---------+------+------------------------+------------------+
3 rows in set, 1 warning (0.000 sec)

```
1. kill进程
```shell
MySQL [(none)]> kill 11;
Query OK, 0 rows affected (0.001 sec)


+-----+----------------------+---------------------+------+---------+------+------------------------+------------------+
| Id  | User                 | Host                | db   | Command | Time | State                  | Info             |
+-----+----------------------+---------------------+------+---------+------+------------------------+------------------+
|   5 | event_scheduler      | localhost           | NULL | Daemon  |  435 | Waiting on empty queue | NULL             |
|  14 | root                 | 172.31.47.174:56052 | NULL | Query   |    0 | init                   | show processlist |
|  15 | unauthenticated user | 127.0.0.1:48256     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  16 | unauthenticated user | 127.0.0.1:48258     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  17 | unauthenticated user | 127.0.0.1:48274     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  18 | unauthenticated user | 127.0.0.1:48284     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  19 | unauthenticated user | 127.0.0.1:48294     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  20 | unauthenticated user | 127.0.0.1:48298     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  21 | unauthenticated user | 127.0.0.1:48308     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  22 | unauthenticated user | 127.0.0.1:48310     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  23 | unauthenticated user | 127.0.0.1:48316     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  24 | unauthenticated user | 127.0.0.1:48332     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  25 | unauthenticated user | 127.0.0.1:48338     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  26 | unauthenticated user | 127.0.0.1:48346     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  27 | unauthenticated user | 127.0.0.1:48360     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  28 | unauthenticated user | 127.0.0.1:48366     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  29 | unauthenticated user | 127.0.0.1:48372     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  30 | unauthenticated user | 127.0.0.1:48386     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  31 | unauthenticated user | 127.0.0.1:48394     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  32 | unauthenticated user | 127.0.0.1:48398     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  33 | unauthenticated user | 127.0.0.1:48404     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  34 | unauthenticated user | 127.0.0.1:48416     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  35 | unauthenticated user | 127.0.0.1:48426     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  36 | unauthenticated user | 127.0.0.1:48434     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  37 | unauthenticated user | 127.0.0.1:48442     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  38 | unauthenticated user | 127.0.0.1:48454     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  39 | unauthenticated user | 127.0.0.1:48460     | NULL | Connect |    3 | Receiving from client  | NULL             |
|  40 | unauthenticated user | 127.0.0.1:48462     | NULL | Connect |    3 | Receiving from client  | NULL             |
|..........|
+-----+----------------------+---------------------+------+---------+------+------------------------+------------------+
153 rows in set, 1 warning (0.001 sec)
```
问题复现了.
```bash
~]$ ss -s
Total: 18710
TCP:   36551 (estab 331, closed 18115, orphaned 7, timewait 18077)

Transport Total     IP        IPv6
RAW	  1         1         0
UDP	  9         5         4
TCP	  18436     18271     165
INET	  18446     18277     169
FRAG	  0         0         0
```

#### TCP CLOSE_WAIT 代表什么?
四次挥手的流程停止在最后一次FIN ack 之前. 

#### CPU 使用情况怎么样?
Mysql 在持续一段时间之后连接数也都释放了, 没有任何旧连接, 压力也消失了.  sysbench大部分的CPU时间在 Sys. 集中在 kernel space 处理.   
```shell
~]$ sar -P ALL 1 5
Linux 5.10.213-201.855.amzn2.x86_64  	04/11/2024 	_x86_64_	(4 CPU)

06:22:54 PM     CPU     %user     %nice   %system   %iowait    %steal     %idle
06:22:55 PM     all      2.21      0.00     21.38      0.00      5.16     71.25
06:22:55 PM       0      1.98      0.00      6.93      0.00      4.95     86.14
06:22:55 PM       1      1.94      0.00      7.77      0.00      0.97     89.32
06:22:55 PM       2      3.88      0.00     47.57      0.00     12.62     35.92
06:22:55 PM       3      1.98      0.00     20.79      0.00      2.97     74.26

06:22:55 PM     CPU     %user     %nice   %system   %iowait    %steal     %idle
06:22:56 PM     all      0.50      0.00     20.35      0.00      4.71     74.44
06:22:56 PM       0      0.00      0.00      2.94      0.00      0.98     96.08
06:22:56 PM       1      0.99      0.00      0.99      0.00      1.98     96.04
06:22:56 PM       2      0.00      0.00     78.22      0.00     13.86      7.92
06:22:56 PM       3      1.01      0.00      0.00      0.00      1.01     97.98

06:22:56 PM     CPU     %user     %nice   %system   %iowait    %steal     %idle
06:22:57 PM     all      0.25      0.00     20.05      0.00      4.46     75.25
06:22:57 PM       0      0.00      0.00      8.49      0.00      2.83     88.68
06:22:57 PM       1      0.00      0.00     67.71      0.00     11.46     20.83
06:22:57 PM       2      0.00      0.00      6.00      0.00      3.00     91.00
06:22:57 PM       3      0.00      0.00      0.99      0.00      1.98     97.03

06:22:57 PM     CPU     %user     %nice   %system   %iowait    %steal     %idle
06:22:58 PM     all      0.49      0.00     19.51      0.00      5.68     74.32
06:22:58 PM       0      0.00      0.00     63.64      0.00     12.12     24.24
06:22:58 PM       1      0.95      0.00     15.24      0.00      6.67     77.14
06:22:58 PM       2      0.00      0.00      0.00      0.00      1.00     99.00
06:22:58 PM       3      1.00      0.00      0.00      0.00      2.00     97.00

06:22:58 PM     CPU     %user     %nice   %system   %iowait    %steal     %idle
06:22:59 PM     all      0.25      0.00     21.04      0.00      3.71     75.00
06:22:59 PM       0      0.00      0.00     63.73      0.00      8.82     27.45
06:22:59 PM       1      0.96      0.00     19.23      0.00      4.81     75.00
06:22:59 PM       2      1.00      0.00      0.00      0.00      1.00     98.00
06:22:59 PM       3      0.00      0.00      0.00      0.00      1.00     99.00

Average:        CPU     %user     %nice   %system   %iowait    %steal     %idle
Average:        all      0.74      0.00     20.46      0.00      4.75     74.05
Average:          0      0.39      0.00     28.82      0.00      5.88     64.90
Average:          1      0.98      0.00     21.61      0.00      5.11     72.30
Average:          2      0.99      0.00     26.59      0.00      6.35     66.07
Average:          3      0.80      0.00      4.39      0.00      1.80     93.01
```

#### Sysbench 在做什么?
---

 ```shell
 ~]$ perf top -p `pgrep sysbench`
   55.10%  [kernel]            [k] __inet_check_established
   26.76%  [kernel]            [k] __inet_hash_connect
   3.93%  [kernel]            [k] _cond_resched
   3.80%  [kernel]            [k] inet_ehashfn
   3.51%  [kernel]            [k] __raw_callee_save___pv_queued_spin_unlock
   3.22%  [kernel]            [k] _raw_spin_lock_bh
   1.24%  [kernel]            [k] _raw_spin_lock
   0.86%  [kernel]            [k] srso_safe_ret
   0.34%  [kernel]            [k] _raw_spin_unlock_bh
```

在 sysbench 创建socket 的过程中使用 strace 查看: 
```c
[pid 23606] getpid()                    = 45
[pid 23606] mprotect(0x7f0cdb5bd000, 8192, PROT_READ|PROT_WRITE) = 0
[pid 23606] socket(AF_INET, SOCK_STREAM, IPPROTO_TCP) = 19623
[pid 23606] fcntl(19623, F_SETFL, O_RDONLY|O_NONBLOCK) = 0
[pid 23606] connect(19623, {sa_family=AF_INET, sin_port=htons(3306), sin_addr=inet_addr("172.31.47.174")}, 16) = -1 EINPROGRESS (Operation now in progress)
[pid 23606] poll([{fd=19623, events=POLLOUT}], 1, -1) = 1 ([{fd=19623, revents=POLLOUT}])
[pid 23606] getsockopt(19623, SOL_SOCKET, SO_ERROR, [0], [4]) = 0
[pid 23606] fcntl(19623, F_SETFL, O_RDONLY) = 0
[pid 23606] mprotect(0x7f0cdb5bf000, 8192, PROT_READ|PROT_WRITE) = 0
[pid 23606] clock_nanosleep(CLOCK_REALTIME, 0, {tv_sec=0, tv_nsec=1000000}, NULL) = 0
[pid 23606] getpid()                    = 45
[pid 23606] mprotect(0x7f0cdb5c1000, 8192, PROT_READ|PROT_WRITE) = 0
[pid 23606] socket(AF_INET, SOCK_STREAM, IPPROTO_TCP) = 19624
[pid 23606] fcntl(19624, F_SETFL, O_RDONLY|O_NONBLOCK) = 0
[pid 23606] connect(19624, {sa_family=AF_INET, sin_port=htons(3306), sin_addr=inet_addr("172.31.47.174")}, 16) = -1 EINPROGRESS (Operation now in progress)
[pid 23606] poll([{fd=19624, events=POLLOUT}], 1, -1) = 1 ([{fd=19624, revents=POLLOUT}])
[pid 23606] getsockopt(19624, SOL_SOCKET, SO_ERROR, [0], [4]) = 0
[pid 23606] fcntl(19624, F_SETFL, O_RDONLY) = 0
[pid 23606] mprotect(0x7f0cdb5c3000, 8192, PROT_READ|PROT_WRITE) = 0
[pid 23606] clock_nanosleep(CLOCK_REALTIME, 0, {tv_sec=0, tv_nsec=1000000}, NULL) = 0
[pid 23606] getpid()                    = 45
[pid 23606] mprotect(0x7f0cdb5c5000, 8192, PROT_READ|PROT_WRITE) = 0
[pid 23606] socket(AF_INET, SOCK_STREAM, IPPROTO_TCP) = 19625
[pid 23606] fcntl(19625, F_SETFL, O_RDONLY|O_NONBLOCK) = 0
[pid 23606] connect(19625, {sa_family=AF_INET, sin_port=htons(3306), sin_addr=inet_addr("172.31.47.174")}, 16) = -1 EINPROGRESS (Operation now in progress)
[pid 23606] poll([{fd=19625, events=POLLOUT}], 1, -1) = 1 ([{fd=19625, revents=POLLOUT}])
[pid 23606] getsockopt(19625, SOL_SOCKET, SO_ERROR, [0], [4]) = 0
[pid 23606] fcntl(19625, F_SETFL, O_RDONLY) = 0
[pid 23606] mprotect(0x7f0cdb5c7000, 8192, PROT_READ|PROT_WRITE) = 0
[pid 23606] clock_nanosleep(CLOCK_REALTIME, 0, {tv_sec=0, tv_nsec=1000000}, NULL) = 0
[pid 23606] getpid()                    = 45
[pid 23606] mprotect(0x7f0cdb5c9000, 8192, PROT_READ|PROT_WRITE) = 0
[pid 23606] socket(AF_INET, SOCK_STREAM, IPPROTO_TCP) = 19626
[pid 23606] fcntl(19626, F_SETFL, O_RDONLY|O_NONBLOCK) = 0
[pid 23606] connect(19626, {sa_family=AF_INET, sin_port=htons(3306), sin_addr=inet_addr("172.31.47.174")}, 16) = -1 EINPROGRESS (Operation now in progress)
[pid 23606] poll([{fd=19626, events=POLLOUT}], 1, -1) = 1 ([{fd=19626, revents=POLLOUT}])
[pid 23606] getsockopt(19626, SOL_SOCKET, SO_ERROR, [0], [4]) = 0
[pid 23606] fcntl(19626, F_SETFL, O_RDONLY) = 0
[pid 23606] mprotect(0x7f0cdb5cb000, 8192, PROT_READ|PROT_WRITE) = 0
[pid 23606] clock_nanosleep(CLOCK_REALTIME, 0, {tv_sec=0, tv_nsec=1000000}, NULL) = 0
```

#### 为什么sysbench 没处理

##### 插曲1 连接数好少
为什么我的docker 容器只创建了 20000+ 个连接就停止了, 我看了其他人的测试, 测试的结果都是 40000+,  我看到我的 sysbench 不在继续了,strace 停止在了 wait4(. 
28271 到底是什么地方限制的? 我的 max connection 数量 是   65535 ?  现在还远远没有达到 os 的上限 ? 

```shell
~]# ss -s
Total: 28544
TCP:   28311 (estab 28, closed 40, orphaned 0, timewait 0)

Transport Total     IP        IPv6
RAW	  1         1         0
UDP	  8         4         4
TCP	  28271     28267     4
INET	  28280     28272     8
FRAG	  0         0         0
```

sysbench通过高位端口发送报文到 mysqld, 但是sysbench所在的os本身其实有端口范围的限制, 查了一下内核参数: 
  - net.ipv4.ip_local_port_range = 32768 60999
  
按照这个参数, 已知源地址, 目的地址, 目的端口, 保持不变, 那么**可创建的连接数量**是:  **28231** .  sysbench 最后也确实停止在了这个数量.
```shell
查看到特定地址端口的连接, 完全一致: 
~]$ ss -tna  | grep 172.31.47.174:3306 | wc -l
28231
```
在更改了这个参数之后, 作为客户端的sysbench可以创建更多的链接了. 
  - net.ipv4.ip_local_port_range = 1024 60999
```shell
~]$ ss -tna  | grep 172.31.47.174:3306 | wc -l
32765
```

? 还能更多吗? 
查看了ulimit ,  openfile 可能会限制继续创建TCP连接, 实际上 ulimit 指令看到的是 65535 
```shell
22109]# ulimit -a
core file size          (blocks, -c) 0
data seg size           (kbytes, -d) unlimited
scheduling priority             (-e) 0
file size               (blocks, -f) unlimited
pending signals                 (-i) 30446
max locked memory       (kbytes, -l) unlimited
max memory size         (kbytes, -m) unlimited
open files                      (-n) 65535
pipe size            (512 bytes, -p) 8
POSIX message queues     (bytes, -q) 819200
real-time priority              (-r) 0
stack size              (kbytes, -s) 8192
cpu time               (seconds, -t) unlimited
max user processes              (-u) unlimited
virtual memory          (kbytes, -v) unlimited
file locks                      (-x) unlimited
```
查看这个进程的 limit, 居然是是软限制导致的...
```shell
~]$ cat ./limits
Limit                     Soft Limit           Hard Limit           Units
Max cpu time              unlimited            unlimited            seconds
Max file size             unlimited            unlimited            bytes
Max data size             unlimited            unlimited            bytes
Max stack size            10485760             10485760             bytes
Max core file size        unlimited            unlimited            bytes
Max resident set          unlimited            unlimited            bytes
Max processes             unlimited            unlimited            processes
Max open files            32768                65536                files
Max locked memory         unlimited            unlimited            bytes
Max address space         unlimited            unlimited            bytes
Max file locks            unlimited            unlimited            locks
Max pending signals       30446                30446                signals
Max msgqueue size         819200               819200               bytes
Max nice priority         0                    0
Max realtime priority     0                    0
Max realtime timeout      unlimited            unlimited            us
```
当我 openfile 的软限制提高到 65535 的时候,  连接数现在是正常的了. 
```shell
~]$ ss -s 
Total: 60285
TCP:   60053 (estab 28, closed 40, orphaned 0, timewait 0)

Transport Total     IP        IPv6
RAW	  1         1         0
UDP	  8         4         4
TCP	  60013     60009     4
INET	  60022     60014     8
FRAG	  0         0         0

fd]# ll | grep socket | wc -l
59974
```

那么有多少个端口可以使用呢? 
> 60999 - 1024 = 59975

这个问题结案啦. 回到 sysbench 的分析.

##### 插曲2 我的数据报文大小和大佬们的不一样.
查看当前的连接状态, 这里非常奇怪, 我显示 RecvQ 是 **28** 或者 **132**, 我看大佬们的测试结果是 **79**. 
```shell
[root@reg fd]# netstat -anop | grep 3306 | head -n 30
tcp      132      0 172.31.55.230:9984      172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:21782     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:27581     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:34292     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:32650     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:7386      172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:48640     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:5341      172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp      132      0 172.31.55.230:49730     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:50326     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:54556     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:42733     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:13447     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:23001     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:38956     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:3912      172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:46620     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:30382     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:21996     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:47249     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:26860     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp      132      0 172.31.55.230:10496     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:54939     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:15526     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:22866     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:28744     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:29424     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp       28      0 172.31.55.230:1682      172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp      132      0 172.31.55.230:54299     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
tcp      132      0 172.31.55.230:42765     172.31.47.174:3306      CLOSE_WAIT  22109/sysbench       off (0.00/0/0)
```
抓包找到这个端口的连接 44820 , 在抓包的结果中过滤这个结果.
```bash
[root@reg mnt]# ss -tnapo | grep 44820
CLOSE-WAIT 28     0      172.31.55.230:44820 172.31.47.174:3306  users:(("sysbench",pid=26050,fd=257))
```
找到这个Mysql协议的报文, 看到他的 TCPSegment 大小是 27 字节..... 看起来是对上了. 

查看这个报文的内容:  
> .......Too many connections

好吧... 这说明MySQL server 给回复 Too many connections 这个文本(笑. 
然后我意识到, 这个回复应该是我的MySQL 可能限制了最大连接数..... 
```mysql
MySQL [(none)]> show variables like '%max_connections%';
+------------------------+-------+
| Variable_name          | Value |
+------------------------+-------+
| max_connections        | 151   |
| mysqlx_max_connections | 100   |
+------------------------+-------+
2 rows in set (0.002 sec)

MySQL [(none)]> set global max_connections=65535;
Query OK, 0 rows affected (0.000 sec)

MySQL [(none)]> show variables like '%max_connections%';
+------------------------+-------+
| Variable_name          | Value |
+------------------------+-------+
| max_connections        | 65535 |
| mysqlx_max_connections | 100   |
+------------------------+-------+
2 rows in set (0.002 sec)
```

再测试一下看看是不是 79 了..... 
```shell
ESTAB      77     0      172.31.55.230:42682 172.31.47.174:3306  users:(("sysbench",pid=3277,fd=8103))
ESTAB      77     0      172.31.55.230:3138  172.31.47.174:3306  users:(("sysbench",pid=3277,fd=3376))
ESTAB      77     0      172.31.55.230:48552 172.31.47.174:3306  users:(("sysbench",pid=3277,fd=8748))
ESTAB      77     0      172.31.55.230:58124 172.31.47.174:3306  users:(("sysbench",pid=3277,fd=9782))
ESTAB      77     0      172.31.55.230:46610 172.31.47.174:3306  users:(("sysbench",pid=3277,fd=8528))
ESTAB      77     0      172.31.55.230:43420 172.31.47.174:3306  users:(("sysbench",pid=3277,fd=8180))
ESTAB      77     0      172.31.55.230:3950  172.31.47.174:3306  users:(("sysbench",pid=3277,fd=3818))
ESTAB      77     0      172.31.55.230:36902 172.31.47.174:3306  users:(("sysbench",pid=3277,fd=7464))
ESTAB      77     0      172.31.55.230:4424  172.31.47.174:3306  users:(("sysbench",pid=3277,fd=3872))
ESTAB      77     0      172.31.55.230:38606 172.31.47.174:3306  users:(("sysbench",pid=3277,fd=7645))
ESTAB      77     0      172.31.55.230:49022 172.31.47.174:3306  users:(("sysbench",pid=3277,fd=8805))
ESTAB      77     0      172.31.55.230:42964 172.31.47.174:3306  users:(("sysbench",pid=3277,fd=8129))
```

--- 
Mark 还在继续写... 
