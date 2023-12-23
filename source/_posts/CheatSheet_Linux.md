---
title: CheatSheet_Linux
category: Linux
date: 2023-12-08 13:57:57
tags:
  - Linux
---

### PS Command
```shell
# Top CPU users
ps auxwww --sort -%cpu | head -20

# Top memory users
ps auxwww --sort -rss | head -20

ps auxf --width=200
or 
ps auxwwwf
```
### Curl Command
```shell
curl -o /dev/null -s -w "time_namelookup:%{time_namelookup}\ntime_connect: %{time_connect}\ntime_appconnect: %{time_appconnect}\ntime_redirect:  %{time_redirect}\ntime_pretransfer:  %{time_pretransfer}\ntime_starttransfer: %{time_starttransfer}\ntime_total: %{time_total}\n"  http://nginx.liarlee.site/Fedora-Workstation-Live-x86_64-38_Beta-1.3.iso
```
### Sysctl Command
```shell
sysctl -a | egrep "rmem|wmem|tcp_mem|adv_win|moderate"
```