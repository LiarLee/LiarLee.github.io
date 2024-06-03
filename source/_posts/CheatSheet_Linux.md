---
title: CheatSheet_Linux
category: Linux
date: 2333-12-08 13:57:57
tags:
  - Linux
  - CheatSheet
---
### Rsync 命令传输数据
保留文件的原本的信息, 归档模式, 传输前压缩, 以及展示进度 和 暂存发送文件进度.
```shell
rsync -azP /source/path/ /destination/path/
rsync -aP /source/path/ /destination/path/
```
### 查看磁盘设备的详细信息
包括 EBS Volume ID 和 设备驱动类型
```shell
lsblk -f -o +SERIAL,SCHED,TRAN,STATE
```
### 强制退出程序并生成 Corefile
组合键用于发送 SIGQUIT 信号，用于终止正在运行的进程。与Ctrl+C不同的是，Ctrl+\会生成一个core文件，用于调试程序。
同时在某些特定的场景下， 这个指令并Ctrl+c停止进程的速度快。 
```shell
Ctrl+\
```
### 查看当前系统中 CPU 使用率最高的前 20 个进程
```shell
ps auxwww --sort -%cpu | head -20
```
### 列出当前系统中内存使用最高的前 20 个进程
```shell
ps auxwww --sort -rss | head -20
```
### 列出系统中所有进程的详细信息
```shell
ps auxf --width=200
```
### 以完整格式列出系统中所有进程的详细信息
```shell
ps auxwwwf
```
### Curl 输出各个阶段所花费的时间
[Network_tc控制流量-update](Network/Network_tc控制流量-update.md)
```shell
curl -s -w "time_namelookup:%{time_namelookup}\ntime_connect: %{time_connect}\ntime_appconnect: %{time_appconnect}\ntime_redirect:  %{time_redirect}\ntime_pretransfer:  %{time_pretransfer}\ntime_starttransfer: %{time_starttransfer}\ntime_total: %{time_total}\n" -o /dev/null $HTTP_URL 
```
对于命令输出内容的解释：
```shell
curl -o /dev/null \ # 将下载的文件输出到 /dev/null (即丢弃)
     -s \ # 静默模式,不显示进度条等信息
     -w "time_namelookup:%{time_namelookup}\n \ # 输出 DNS 解析时间
          time_connect: %{time_connect}\n \ # 输出建立 TCP 连接所花费的时间
          time_appconnect: %{time_appconnect}\n \ # 输出建立 SSL/TLS 连接所花费的时间
          time_redirect:  %{time_redirect}\n \ # 输出重定向所花费的时间
          time_pretransfer:  %{time_pretransfer}\n \ # 输出从开始到准备好传输所花费的时间
          time_starttransfer: %{time_starttransfer}\n \ # 输出从开始到第一个字节被传输所花费的时间
          time_total: %{time_total}\n" \ # 输出整个传输所花费的总时间
     $HTTP_URL  # 要下载的文件 URL
```
### 查看与 TCP 内存管理和拥塞控制相关的内核参数
通常这些配置会出现在  [[Linux_Sysctl 参数记录]]  `/etc/sysctl.conf` 文件中。
```shell
sysctl -a | egrep "rmem|wmem|tcp_mem|adv_win|moderate|slow_start"
```
### 列出系统中所有用户的 Crontab 任务
```shell
cat /etc/passwd | cut -f 1 -d : | xargs -I {} crontab -l -u {}
```
### 查看 AWS EC2 的 Billing Code
Redhat / SUSE 的 Enterprise 版本在 AWS  EC2 上面运行实例会带有 Billing Code 的， 这标记 OS 是否是付过费用的，有没有安全补丁和技术支持。 
[Finding AMI billing and usage details](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/view-billing-info.html)
[AMI billing information fields](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/billing-info-fields.html)

```shell
# IDMSv1 
  curl http://169.254.169.254/latest/dynamic/instance-identity/document

# IDMSv2 
  TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"` && curl -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/dynamic/instance-identity/document
```
### 查看 SUSE 的注册情况，以及是否启用 LTSS
```shell
sudo SUSEConnect --list-extensions
```
### 查看网络可能存在的丢包和异常
ip 命令查看链路层丢包指标.
```shell
ip -s link show eth0
```
ethtool 命令查看网卡硬件队列的丢包
```shell
ethtool -S eth0 | grep drop
```
### OpenSSL 测试指定域名并输出调试信息
```shell
openssl s_client -debug --connect YOUR_SITE:443
```
指定算法和协议版本
```shell
openssl s_client -debug --connect YOUR_SITE:443 -tls1_2 -cipher RC4
```
### 查看启动以来的内核日志
```shell
journalctl -xeak
```
### 查看特定级别的日志
```shell
journalctl -xeak -p3

# 日志级别的补充说明： 
#          FROM..TO. The log levels are the usual syslog log levels as documented in syslog(3), i.e.  "emerg" (0), "alert" (1), "crit" (2), "err" (3), "warning" (4), "notice" (5), "info" (6), "debug" (7). If a
#          single log level is specified, all messages with this log level or a lower (hence more important) log level are shown. If a range is specified, all messages within the range are shown, including both
#          the start and the end value of the range. This will add "PRIORITY=" matches for the specified priorities.
```
### journald记录的所有启动会话(boots)信息
```shell
journalctl --list-boots

# 输出所有重启的历史记录
# 命令会通过序号的方式标记重启的记录， 0， -1， -2， -3 等等
```
### 查看上次系统启动的日志
```shell
journalctl -xeab -1 
```
### 查看所有日志不使用pager进行分页
```shell
journalctl -xea --no-pager
```
### 查看特定 Service 日志
```
journalctl -xeau SERVICE_NAME
```
### 查看并追踪特定 Service 日志
```shell
journalctl -xeafu SERVICE_NAME
```
### 查看最近 100 行
```shell
journalctl -n 100 --no-pager -xeau SERVICE_NAME 
```
### 查看指定时间范围的日志
```shell
journalctl -xea --no-pager -S "2024-01-31 18:20:00" -U "2024-01-31 18:40:00"
# 显示从什么时间开始的日志 或者 到什么时间为止的日志。 
# Format： 2012-10-30 18:17:16
# 可以仅仅提供日期字段， 时间会默认全0 
# -S, --since=, -U, --until=

journalctl -xea -u SERVICE_NAME --no-pager -S "2024-01-31 17:40:00" -U "2024-01-31 23:40:00"
```

### Tshark 命令简单说明
```shell
tshark -i ens5 -n -f 'tcp dst port 32123' -T fields -e frame.number -e frame.time_epoch -e frame.time_delta_displayed  -e ip.src -e tcp.srcport -e ip.dst -e tcp.dstport -e tcp.time_delta -e tcp.stream -e tcp.len -e tcp.analysis.ack_rtt

# 抓取 dns 请求， 并显示 IP TTL 以及 DNS TTL， 格式化输出
> sudo tshark -i ens5 -Y 'dns' -T fields -e ip.src -e ip.dst -e dns.qry.name -e  ip.ttl -E header=y -E separator='/t' -E quote='d' -E occurrence=f
```
### Iptables 常用命令
关于 iptables 的扩展内容： [[Linux/Linux_Iptables-and-conntrack|Linux_Iptables-and-conntrack]] 
### 清理 Iptables 所有规则
```shell
iptables-save > ./iptables-save.log
iptables -X && iptables -F && iptables -Z && iptables -t nat -F && iptables -t nat -X && iptables -t nat -Z
```
### 查看 Iptables 中的规则，并标记显示行号
```shell
# 查看 nat 表
iptables -t nat -nvL --line-number

# 查看 filter 表
iptables -nvL --line-number

# 查看 raw 表
iptables -t raw -nvL --line-number
```
### 增加、删除规则
```shell
# 增加规则在 nat 表上先进行 DNAT
# 这个规则的意义是， 将收到所有来源的udp报文中的端口， 从 20000 - 30000 范围内， 重写成dport 32124 并继续判断下一个规则， 这个规则会在PREROUTING上第一个被执行。 
iptables -t nat -I PREROUTING 1 -i eth0 -p udp --dport 20000:30000 -j DNAT --to-destination :32124

# 删除 nat 表 PRERTOUING 上的第一个规则
iptables -t nat -D PREROUTING 1
```
### 查看 close Wait 状态的 Socket
```bash
ss --tcp state CLOSE-WAIT
```
关闭所有处于 [[Databases_MySQLConnetionTroubleshooting#^de7c10]] closewait 的socket ,通过 ss 命令干预, 通常应该由应用程序关闭, 而不是 ss 命令关闭, 这个命令只是记录一下用法. 
最佳的方式是找到异常的进程, 并查看为什么程序不能及时的关闭 socket , 或者 kill 掉这个进程. 
```shell
ss --tcp state CLOSE-WAIT --kill
```
### 触发内存 Compact
激活内核进行内存碎片的整理; ( 重启也行...
```shell
echo 1 > /proc/sys/vm/compact_memory
```
### 查看rpm包内所有文件列表
```shell
rpm -ql htop
```
### 对比 Rpm 包内和系统实际的文件是否有更改
```shell
\\ 不指定的时候是列出所有权限或者内容变化的文件
rpm -Va 
\\ 指定一个 rpm 包的名称
rpm -Va htop
```
### 重置 Linux 文件权限为 Rpm 包内记录
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
### 删除目录下的所有文件夹，但是保留所有文件
```shell
find ./ -type d ! -name . | xargs rm -rf
```
