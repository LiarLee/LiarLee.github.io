---
title: CheatSheet_Linux
category: Linux
date: 2023-12-08 13:57:57
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
