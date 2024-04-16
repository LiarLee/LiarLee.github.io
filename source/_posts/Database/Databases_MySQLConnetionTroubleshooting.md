---
title: MySQL 无法重连问题的分析
category: Linux
date: 2024-04-12 15:36:25
tags:
  - MySQL
  - Linux
  - Network
---
#### 复现方法
使用下面的命令运行并进行测试:
1. 创建 docker 容器, 运行 MySQL.
```shell
docker run -it -d --net=host -e MYSQL_ROOT_PASSWORD=123 --name=mysql-server reg.liarlee.site/docker.io/mysql
```
2. 连接并创建数据库.
```bash
mysql -h127.1 --ssl-mode=DISABLED -utest -p123 -e "create database test"
```
3. sysbench
```bash
docker run --net=host --privileged -it reg.liarlee.site/docker.io/phantooom/plantegg:sysbench-lab bash

sysbench --mysql-user='root' --mysql-password='123' --mysql-db='test' --mysql-host='127.0.0.1' --mysql-port='3306' --tables='16' --table-size='10000' --range-size='5' --db-ps-mode='disable' --skip-trx='on' --mysql-ignore-errors='all' --time='1180' --report-interval='1' --histogram='on' --threads=1 oltp_read_only prepare

sysbench --mysql-user='root' --mysql-password='123' --mysql-db='test' --mysql-host='127.0.0.1' --mysql-port='3306' --tables='16' --table-size='10000' --range-size='5' --db-ps-mode='disable' --skip-trx='on' --mysql-ignore-errors='all' --time='1180' --report-interval='1' --histogram='on' --threads=1 oltp_read_only run
```
4. 查看客户端进程.
```mysql
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
5. kill进程
```mysql
MySQL [(none)]> kill 11;
Query OK, 0 rows affected (0.001 sec)

MySQL [(none)]> show processlist;
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
代码层面忘记了 关闭相应的 socket 连接
CLOSE_WAIT 状态在服务器停留时间很短，如果你发现大量的 CLOSE_WAIT 状态，那么就意味着被动关闭的一方没有及时发出 FIN 包.

#### 所有的状态都是 CloseWait, 会不会超时? 多久超时?
在网络断开连接的流程中, 其实是没有服务端的, 两端都可以发起连接的断开, 主要看主动发起是谁. 
在这个问题里面, 按照抓包的结果, 主动断开的一方是:  MySQLServer:3306 ,  sysbench 是响应断开的一方, 因此 sysbench
进入了 Close_Wait.

![2024-04-16_14-31.png](https://s2.loli.net/2024/04/16/kJ9N1BVoshQpuMF.png)

上面的这个抓包结果可以非常清楚的看到, MySQL 等待了10s之后超时了, 主动发送了FIN给 sysbench 断开这个连接.
这时候 sysbench 也回复了ack, 表示收到了, 然后进入挥手流程的后半段, 应该由sysbench 发送 fin, mysql 回复 ack. 但是 sysbench 在这个时候没动.  可以确定是 sysbench 的问题了. 

这个状态的持续时间没有一个固定的最大值，它取决于本地应用程序何时关闭连接。如果应用程序没有正确地关闭套接字，那么连接可能会无限期地保持在`CLOSE_WAIT`状态。

> Refer:  
  https://www.baeldung.com/linux/remove-close_wait-connection
  https://www.ietf.org/rfc/rfc9293.html#name-state-machine-overview

控制MySQL 超时时间的参数是:
这个默认的参数是10s , 可以改成更长. 
```ini
[mysqld]
connect_timeout=10  
```

#### CPU 使用情况?
Mysql 在持续一段时间之后连接数也都释放了, 没有任何旧连接, 压力也消失了.  
sysbench大部分的CPU时间在 Sys, 内核态花费的时间比较多.   
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
#### 使用perf 查看热点函数
```bash
perf top -p `pgrep sysbench`
  61.87%  [k] __inet_check_established
   9.99%  [k] __inet_hash_connect
   8.25%  [k] _raw_spin_lock
   8.25%  [k] _raw_spin_lock_bh
   3.99%  [k] inet_ehashfn
   1.75%  [k] __local_bh_enable_ip
   1.00%  [k] _raw_spin_unlock
   0.57%  [k] _raw_spin_unlock_bh
   0.42%  [k] finish_task_switch.isra.0
   0.24%  [k] native_queued_spin_lock_slowpath
   0.08%  [k] do_syscall_64
```

这个部分我并不了解,  直接丢给 Bing AI. 
> [具体来说，当一个新的连接请求到来时，`__inet_check_established`会遍历已经建立的连接列表，比较现有连接的四元组与新请求的四元组是否完全一致。如果不一致，说明该端口仍然可用于新的连接。这个函数是TCP三次握手过程中非常重要的一部分，确保了连接的正确建立和网络的稳定运行](https://blog.csdn.net/qq_40378034/article/details/134475987)[1](https://blog.csdn.net/qq_40378034/article/details/134475987)。

>  - `__inet_hash_connect` 用于在TCP连接建立时，为客户端分配一个可用的本地端口号。
    - 它负责将新建立的连接的四元组（源IP地址、源端口号、目的IP地址、目的端口号）与已有连接进行比较，以确保端口的唯一性。
    - 如果找到可用的端口号，就将连接状态设置为 `TCP_SYN_SENT`，表示正在发送SYN请求。

可以看到, 内核是在忙于创建新的连接并尝试寻找端口, 那么现在的问题是 为什么 sysbench 在忙于创建新的进程呢?
#### 为什么在忙于创建新的连接?
继续使用perf命令观察这个进程, 当然这里其实是有点问题的, 重新建立连接, kill 进程, 观察发生问题时间的调用才有价值.
因为上面提到的那个流程,  一段时间之后, 实在是没有可用的端口了, 就不会创建新的连接了, 这就观察不到sysbench程序的异常行为了.

```bash
╰─>$ perf trace -s -p 13193 -- sleep 10

 Summary of events:

 sysbench (13194), 30 events, 0.0%

   syscall            calls  errors  total       min       avg       max       stddev
                                     (msec)    (msec)    (msec)    (msec)        (%)
   --------------- --------  ------ -------- --------- --------- ---------     ------
   clock_nanosleep       10      0  8986.912     0.000   898.691   998.558     11.11%
   write                 10      0     0.167     0.014     0.017     0.018      2.91%


 sysbench (13195), 145906 events, 100.0%

   syscall            calls  errors  total       min       avg       max       stddev
                                     (msec)    (msec)    (msec)    (msec)        (%)
   --------------- --------  ------ -------- --------- --------- ---------     ------
   poll               13088      0  6375.621     0.001     0.487  5004.016     78.49%
   clock_nanosleep     2960      0  3156.472     1.020     1.066     3.842      0.10%
   openat              2915      0    64.979     0.006     0.022     8.424     18.04%
   connect             5929   2970    52.725     0.004     0.009     0.039      0.60%
   recvfrom            5897      0    41.324     0.003     0.007     0.049      0.70%
   socket              5936      0    30.225     0.002     0.005     0.036      0.69%
   stat                1685      0    19.962     0.005     0.012     0.036      0.59%
   close               5914      0    15.990     0.001     0.003     0.030      0.65%
   sendto              2543      0    15.488     0.004     0.006     0.038      0.76%
   sendmmsg            1685      0    13.396     0.004     0.008     0.035      0.80%
   read                5904      0    12.030     0.001     0.002     0.032      0.75%
   mprotect            2939      0    11.497     0.003     0.004     0.029      0.61%
   ioctl               5908      0     9.831     0.001     0.002     0.035      0.88%
   fcntl               5894      0     8.531     0.001     0.001     0.021      0.66%
   getsockopt          2949      0     6.692     0.001     0.002     0.344      9.16%
   setsockopt          2959      0     5.314     0.001     0.002     0.021      1.02%
   fstat               2960      0     5.162     0.001     0.002     0.028      1.85%
   lseek               2960      0     4.312     0.001     0.001     0.020      0.95%
   getpid              2959      0     4.102     0.001     0.001     0.019      0.90%
   mmap                   1      0     0.008     0.008     0.008     0.008      0.00%
   madvise                1      0     0.005     0.005     0.005     0.005      0.00%
```

使用 perf trace 查看系统调用的细节: 
这里面看到的系统调用是疯狂创建进程的时候
```
  6853.284 ( 0.002 ms): sysbench/13322 getsockopt(fd: 1044<socket:[1213745]>, level: 1, optname: 4, optval: 0x7e678543d400, optlen: 0x7e678543d404) = 0
  6853.288 ( 0.002 ms): sysbench/13322 fcntl(fd: 1044<socket:[1213745]>, cmd: SETFL)                         = 0
  6853.288 ( 1.082 ms): sysbench/13322  ... [continued]: clock_nanosleep())                                  = 0
  6854.379 ( 0.002 ms): sysbench/13322 getpid()                                                              = 47
  6854.379 ( 0.022 ms): sysbench/13322  ... [continued]: stat())                                             = 0
  6854.379 ( 0.048 ms): sysbench/13322  ... [continued]: openat())                                           = 1045
  6854.429 ( 0.002 ms): sysbench/13322 fstat(fd: 1045<socket:[1213748]>, statbuf: 0x7e678543c950)            = 0
  6854.437 ( 0.002 ms): sysbench/13322 lseek(fd: 1045<socket:[1213748]>, whence: SET)                        = 0
  6854.441 ( 0.003 ms): sysbench/13322 read(fd: 1045<socket:[1213748]>, buf: 0x7e677909def0, count: 4096)    = 605
  6854.449 ( 0.002 ms): sysbench/13322 read(fd: 1045<socket:[1213748]>, buf: 0x7e677909def0, count: 4096)    = 0
  6854.454 ( 0.004 ms): sysbench/13322 close(fd: 1045<socket:[1213748]>)                                     = 0
  6854.462 ( 0.007 ms): sysbench/13322 socket(family: INET, type: DGRAM|CLOEXEC|NONBLOCK)                    = 1045
  6854.471 ( 0.002 ms): sysbench/13322 setsockopt(fd: 1045<socket:[1213748]>, level: IP, optname: 11, optval: 0x7e678543b794, optlen: 4) = 0
  6854.471 ( 0.009 ms): sysbench/13322  ... [continued]: connect())                                          = 0
  6854.482 ( 0.002 ms): sysbench/13322 poll(ufds: 0x7e678543b918, nfds: 1)                                   = 1
  6854.486 ( 0.016 ms): sysbench/13322 sendmmsg(fd: 1045<socket:[1213748]>, mmsg: 0x7e678543b940, vlen: 2, flags: NOSIGNAL) = 2
  6854.504 ( 0.193 ms): sysbench/13322 poll(ufds: 0x7e678543b918, nfds: 1, timeout_msecs: 5000)              = 1
  6854.699 ( 0.003 ms): sysbench/13322 ioctl(fd: 1045<socket:[1213748]>, cmd: FIONREAD, arg: 0x7e678543b8dc) = 0
  6854.699 ( 0.007 ms): sysbench/13322  ... [continued]: recvfrom())                                         = 50
  6854.710 ( 0.003 ms): sysbench/13322 poll(ufds: 0x7e678543b918, nfds: 1, timeout_msecs: 4999)              = 1
  6854.714 ( 0.001 ms): sysbench/13322 ioctl(fd: 1045<socket:[1213748]>, cmd: FIONREAD, arg: 0x7e678543cb94) = 0
  6854.718 ( 0.005 ms): sysbench/13322 mprotect(start: 0x7e67790aa000, len: 16384, prot: READ|WRITE)         = 0
  6854.718 ( 0.013 ms): sysbench/13322  ... [continued]: recvfrom())                                         = 125
  6854.734 ( 0.004 ms): sysbench/13322 close(fd: 1045<socket:[1213748]>)                                     = 0
  6854.742 ( 0.005 ms): sysbench/13322 socket(family: INET, type: STREAM, protocol: TCP)                     = 1045
  6854.749 ( 0.002 ms): sysbench/13322 fcntl(fd: 1045<socket:[1213748]>, cmd: SETFL, arg: RDONLY|NONBLOCK)   = 0
  6854.749 ( 0.019 ms): sysbench/13322  ... [continued]: connect())                                          = -1 EINPROGRESS (Operation now in progress)
  6854.769 ( 0.169 ms): sysbench/13322 poll(ufds: 0x7e678543d3b0, nfds: 1, timeout_msecs: 4294967295)        = 1
  6854.942 ( 0.002 ms): sysbench/13322 getsockopt(fd: 1045<socket:[1213748]>, level: 1, optname: 4, optval: 0x7e678543d400, optlen: 0x7e678543d404) = 0
  6854.947 ( 0.002 ms): sysbench/13322 fcntl(fd: 1045<socket:[1213748]>, cmd: SETFL)                         = 0
  6854.947 ( 1.072 ms): sysbench/13322  ... [continued]: clock_nanosleep())                                  = 0
  6856.025 ( 0.002 ms): sysbench/13322 getpid()                                                              = 47
  6856.025 ( 0.019 ms): sysbench/13322  ... [continued]: stat())                                             = 0
  6856.025 ( 0.026 ms): sysbench/13322  ... [continued]: openat())                                           = 1046
  6856.054 ( 0.002 ms): sysbench/13322 fstat(fd: 1046<socket:[1211228]>, statbuf: 0x7e678543c950)            = 0
  6856.059 ( 0.001 ms): sysbench/13322 lseek(fd: 1046<socket:[1211228]>, whence: SET)                        = 0
  6856.063 ( 0.003 ms): sysbench/13322 read(fd: 1046<socket:[1211228]>, buf: 0x7e67790a1f90, count: 4096)    = 605
  6856.071 ( 0.001 ms): sysbench/13322 read(fd: 1046<socket:[1211228]>, buf: 0x7e67790a1f90, count: 4096)    = 0
  6856.074 ( 0.003 ms): sysbench/13322 close(fd: 1046<socket:[1211228]>)                                     = 0
  6856.081 ( 0.006 ms): sysbench/13322 socket(family: INET, type: DGRAM|CLOEXEC|NONBLOCK)                    = 1046
  6856.088 ( 0.002 ms): sysbench/13322 setsockopt(fd: 1046<socket:[1211228]>, level: IP, optname: 11, optval: 0x7e678543b794, optlen: 4) = 0
  6856.088 ( 0.008 ms): sysbench/13322  ... [continued]: connect())                                          = 0
  6856.097 ( 0.001 ms): sysbench/13322 poll(ufds: 0x7e678543b918, nfds: 1)                                   = 1
  6856.100 ( 0.014 ms): sysbench/13322 sendmmsg(fd: 1046<socket:[1211228]>, mmsg: 0x7e678543b940, vlen: 2, flags: NOSIGNAL) = 2
  6856.115 ( 0.173 ms): sysbench/13322 poll(ufds: 0x7e678543b918, nfds: 1, timeout_msecs: 5000)              = 1
  6856.290 ( 0.002 ms): sysbench/13322 ioctl(fd: 1046<socket:[1211228]>, cmd: FIONREAD, arg: 0x7e678543b8dc) = 0
  6856.290 ( 0.006 ms): sysbench/13322  ... [continued]: recvfrom())                                         = 50
  6856.299 ( 0.002 ms): sysbench/13322 poll(ufds: 0x7e678543b918, nfds: 1, timeout_msecs: 4999)              = 1
  6856.302 ( 0.002 ms): sysbench/13322 ioctl(fd: 1046<socket:[1211228]>, cmd: FIONREAD, arg: 0x7e678543cb94) = 0
  6856.305 ( 0.005 ms): sysbench/13322 mprotect(start: 0x7e67790ae000, len: 16384, prot: READ|WRITE)         = 0
  6856.305 ( 0.010 ms): sysbench/13322  ... [continued]: recvfrom())                                         = 125
  6856.317 ( 0.004 ms): sysbench/13322 close(fd: 1046<socket:[1211228]>)                                     = 0
  6856.326 ( 0.005 ms): sysbench/13322 socket(family: INET, type: STREAM, protocol: TCP)                     = 1046
  6856.332 ( 0.002 ms): sysbench/13322 fcntl(fd: 1046<socket:[1211228]>, cmd: SETFL, arg: RDONLY|NONBLOCK)   = 0
  6856.332 ( 0.016 ms^C): sysbench/13322  ... [continued]: connect())                                          = -1 EINPROGRESS (Operation now in progress)

```

##### 其他 1 连接数好少
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

补充一些其他的信息, 内核对于整体的文件系统打开文件的数量限制, 需要查看内核参数, 这个在现代的操作系统中一般来说是不会达到上限的,  可以看看这个参数, 这个是总的数量: 
```bash
mnt]$ cat /proc/sys/fs/file-max
1000000

或者 

mnt]$ sysctl -a | grep file-max
fs.file-max = 1000000
```
之后才是 ulimit 生效的限制 
在上面直接使用了 ulimit 命令, 打印出的是 当前 bash shell 的limit 值, 并且是 hard limit 值.
如果需要查看具体的软硬限制的不同, 有两个方法: 
```bash
1 使用ulimit命令, 需要关注自己运行程序的用户身份,ulimit 和 用户身份是相关的
# 输出软限制
ulimit -Sn
# 输出硬限制
ulimit -Hn

2 找到这个进程的pid, 查看proc下的记录, 这会列出所有限制的值
cat /proc/self/limits
```

这部分结束了.
##### 其他 2 我的数据报文大小和大佬们的不一样.
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
然后我意识到, 这个回复应该是我的 MySQL 可能限制了最大连接数..... 
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