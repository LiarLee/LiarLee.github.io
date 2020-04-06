---
title: 配置Ip-forward参数
date: 2018-06-23 11:24:50
tags: Fedora
categories: Linux
---

配置Ip-forward参数备忘。

<!-- more -->

# 1 Config the ip_forward option  
## 1.1 Config ip_forwarding in CentOS6 
    vim /etc/sysctl.conf
        net.ipv4.ipforward = 1

    sysctl -p /etc/sysctl.conf 

## 1.2 Config ip_forwarding In CentOS7
    vim /usr/lib/sysctl.d/00-system.conf 
        net.ipv4.ip_forward = 1 

    sysctl -p OR systemctl reboot


# 2 Check the ip_forward status
## 2.1 Check the ip_forward setting 
    cat /proc/sys/net/ipv4/ip_forward  
        net.ipv4.ip_forward = 1
    status 1   ---   forward is active 