---
title: CheatSheet_Linux
category: Linux
date: 2333-12-08 13:57:57
tags:
  - Linux
  - CheatSheet
---

### PS 查看 Cpu， Mem 最高几个进程
```shell
# Top CPU users
ps auxwww --sort -%cpu | head -20

# Top memory users
ps auxwww --sort -rss | head -20

ps auxf --width=200
or 
ps auxwwwf
```
### Curl 显示详细的http连接时间
```shell
curl -o /dev/null -s -w "time_namelookup:%{time_namelookup}\ntime_connect: %{time_connect}\ntime_appconnect: %{time_appconnect}\ntime_redirect:  %{time_redirect}\ntime_pretransfer:  %{time_pretransfer}\ntime_starttransfer: %{time_starttransfer}\ntime_total: %{time_total}\n"  http://nginx.liarlee.site/Fedora-Workstation-Live-x86_64-38_Beta-1.3.iso
```
### Sysctl 查看 Tcp 相关的内核参数
```shell
sysctl -a | egrep "rmem|wmem|tcp_mem|adv_win|moderate|slow_start"
```
### 查看系统内所有用户的Crontab
```shell
~]$ cat /etc/passwd | cut -f 1 -d : | xargs -I {} crontab -l -u {}
no crontab for root
no crontab for bin
no crontab for daemon
no crontab for adm
no crontab for lp
no crontab for sync
no crontab for shutdown
no crontab for halt
no crontab for mail
no crontab for operator
no crontab for games
no crontab for ftp
no crontab for nobody
no crontab for systemd-network
no crontab for dbus
no crontab for rpc
no crontab for libstoragemgmt
no crontab for sshd
no crontab for rpcuser
no crontab for nfsnobody
no crontab for rngd
no crontab for ec2-instance-connect
no crontab for postfix
no crontab for chrony
no crontab for tcpdump
no crontab for ec2-user
no crontab for tss
no crontab for netdata
no crontab for cwagent
no crontab for ssm-user
```
### 查看AWS EC2 的 Billing Code
对于EC2来说，Redhat 或者 SUSE 的 Enterprise版本是有Billing Code的， 这标记了是否是已经付费过的版本，  有没有安全补丁和技术支持。 
```shell
# IDMSv1可以使用如下命令： 
  curl http://169.254.169.254/latest/dynamic/instance-identity/document

# IDMSv2可以使用： 
  TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"` && curl -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/dynamic/instance-identity/document
```
### 查看SUSE的注册情况，以及是否启用 LTSS
```shell
sudo SUSEConnect --list-extensions
```
### Linux 查看网络可能存在的丢包和异常。
```shell
> ip -s link show wlan0
3: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc cake state UP mode DORMANT group default qlen 1000
    link/ether dc:a6:32:a2:77:a1 brd ff:ff:ff:ff:ff:ff
    RX:  bytes packets errors dropped  missed   mcast
    1479773800 3264136      0       0       0   29898
    TX:  bytes packets errors dropped carrier collsns
    2132719784 3716055      0       0       0       0
> ethtool -S end0 | grep drop
     rx_dropped: 0
     tx_dropped: 0
     rxq0_dropped: 0
     rxq1_dropped: 0
     rxq2_dropped: 0
     rxq3_dropped: 0
     rxq16_dropped: 0
```
### Openssl 建立连接测试
```shell
openssl s_client -debug --connect some.domain.com:443
# 指定算法和协议版本
openssl s_client -debug --connect some.domain.com:443 -tls1_2 -cipher RC4
```

### 查看系统内的日志， 不同级别
```shell
# 查看启动以来的内核日志
journalctl -xeak

# 查看error级别的日志（ 这个日志级别不是所有的应用程序都按照规则设定， 有的程序都是info级别， 没有做区分。
journalctl -xeak -p3

# 日志级别的补充说明： 
#          FROM..TO. The log levels are the usual syslog log levels as documented in syslog(3), i.e.  "emerg" (0), "alert" (1), "crit" (2), "err" (3), "warning" (4), "notice" (5), "info" (6), "debug" (7). If a
#          single log level is specified, all messages with this log level or a lower (hence more important) log level are shown. If a range is specified, all messages within the range are shown, including both
#          the start and the end value of the range. This will add "PRIORITY=" matches for the specified priorities.

# 输出所有重启的历史记录
# 命令会通过序号的方式标记重启的记录， 0， -1， -2， -3 等等
journalctl --list-boots
0 cfa4ea7ba29d44879e21e0406455bd50 Wed 2024-01-31 17:41:24 UTC—Thu 2024-02-01 05:58:11 UTC

# 输出上次系统启动的日志
journalctl -xeab -1 

# 输出到console不是pager进行分页， 可以接 grep
journalctl -xea --no-pager

# 输出kubelet这个 service 日志
journalctl -xeau kubelet

# 追踪这个服务的日志， 相当于 tail -f
journalctl -xeafu kubelet

# 显示100行
journalctl -xeau kubelet -n 100 --no-pager

# 显示从什么时间开始的日志 或者 到什么时间为止的日志。 
# Format： 2012-10-30 18:17:16
# 可以仅仅提供日期字段， 时间会默认全0 
-S, --since=, -U, --until=
journalctl -xea --no-pager -S "2024-01-31 18:20:00" -U "2024-01-31 18:40:00"
# 更多： 
journalctl -xea -u kubelet --no-pager -S "2024-01-31 17:40:00" -U "2024-01-31 23:40:00"
```

### Tshark 命令简单说明
```shell
tshark -i ens5 -n -f 'tcp dst port 32123' -T fields -e frame.number -e frame.time_epoch -e frame.time_delta_displayed  -e ip.src -e tcp.srcport -e ip.dst -e tcp.dstport -e tcp.time_delta -e tcp.stream -e tcp.len -e tcp.analysis.ack_rtt

# 抓取 dns 请求， 并显示 IP TTL 以及 DNS TTL， 格式化输出
> sudo tshark -i ens5 -Y 'dns' -T fields -e ip.src -e ip.dst -e dns.qry.name -e  ip.ttl -E header=y -E separator='/t' -E quote='d' -E occurrence=f
```

### Iptables 常用命令
关于 iptables 的扩展内容： [[Linux/Linux_Iptables-and-conntrack|Linux_Iptables-and-conntrack]] 
#### 清理Kubernetes所有的路由条目（流量会中断
```shell
iptables -X && iptables -F && iptables -Z && iptables -t nat -F && iptables -t nat -X && iptables -t nat -Z
```
#### 查看 Iptables 中的规则，并标记显示行号
```shell
# 查看 nat 表
iptables -t nat -nvL --line-number

# 爱看 filter 表
iptables -nvL --line-number

# 查看 raw 表
iptables -t raw -nvL --line-number
```
#### 增加、删除规则
```shell
# 增加规则在 nat 表上先进行 DNAT
# 这个规则的意义是， 将收到所有来源的udp报文中的端口， 从 20000 - 30000 范围内， 重写成dport 32124 并继续判断下一个规则， 这个规则会在PREROUTING上第一个被执行。 
iptables -t nat -I PREROUTING 1 -i eth0 -p udp --dport 20000:30000 -j DNAT --to-destination :32124

# 删除 nat 表 PRERTOUING 上的第一个规则
iptables -t nat -D PREROUTING 1
```

### 命令 Ss 用法
查看处于 close wait 状态的 Socket
```bash
ss --tcp state CLOSE-WAIT
```

关闭所有处于 closewait 的socket ,通过 ss 命令干预, 通常应该由应用程序关闭, 而不是 ss 命令关闭, 这个命令只是记录一下用法. 
最佳的方式是找到异常的进程, 并查看为什么程序不能及时的关闭 socket , 或者 kill 掉这个进程. 

```
ss --tcp state CLOSE-WAIT --kill
```

### 内存 Compact
激活内核进行内存碎片的整理; ( 重启也行...
```shell
echo 1 > /proc/sys/vm/compact_memory
```

### Rpm 相关
#### 查看rpm包内所有文件列表
```shell
~]$ rpm -ql htop
/usr/bin/htop
/usr/lib/.build-id
/usr/lib/.build-id/e8
/usr/lib/.build-id/e8/939e1f5899cf129565f8c695e8f6e05845d244
/usr/share/applications/htop.desktop
/usr/share/doc/htop
/usr/share/doc/htop/AUTHORS
/usr/share/doc/htop/ChangeLog
/usr/share/doc/htop/README
/usr/share/icons/hicolor/scalable/apps/htop.svg
/usr/share/licenses/htop
/usr/share/licenses/htop/COPYING
/usr/share/man/man1/htop.1.gz
/usr/share/pixmaps/htop.png
```

#### 对比rpm包内和系统实际的文件是否有更改
```shell
\\ 不指定的时候是列出所有权限或者内容变化的文件.
~]$ rpm -Va 
\\ 指定一个 rpm 包的名称.
~]$ rpm -Va htop
```
#### 重置linux文件权限为 Rpm 包内记录

```shell
~]$ rpm --setperms htop

\\ 尝试变更一个无关文件的权限
~]$ chmod 0000 /usr/share/pixmaps/htop.png
\\ 使用命令校验rpm文件是否发生变化.
~]$ rpm -Va htop
.M.......    /usr/share/pixmaps/htop.png
\\ 使用这个命令将文件的权限置为与rpm包一致.
~]$ rpm --setperms htop
\\ 再次校验.
~]$ rpm -Va htop
~]$ stat /usr/share/pixmaps/htop.png
  File: /usr/share/pixmaps/htop.png
  Size: 3537      	Blocks: 8          IO Block: 4096   regular file
Device: 10301h/66305d	Inode: 1542971     Links: 1
Access: (0644/-rw-r--r--)  Uid: (    0/    root)   Gid: (    0/    root)
Context: system_u:object_r:usr_t:s0
Access: 2022-06-03 00:54:39.000000000 +0000
Modify: 2022-06-03 00:54:39.000000000 +0000
Change: 2024-05-30 01:55:00.225771761 +0000
 Birth: 2024-04-24 05:39:08.826700372 +0000

```