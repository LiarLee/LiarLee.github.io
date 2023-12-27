---
title: CheatSheet_Linux
category: Linux
date: 2023-12-08 13:57:57
tags:
  - Linux
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
## 其他
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