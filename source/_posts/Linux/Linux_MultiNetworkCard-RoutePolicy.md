---
title: Linux配置网卡策略路由
category: Linux
date: 2023-07-25 16:41:36
tags: Linux
---



会遇到Linux多个网卡的时候， 网络并不会保证源地址进网卡 ， 源地址出网卡。 

大佬说， IP地址的其实关联的是操作系统，并不是特定的网卡， 所以对于os来说， 邻居子系统会选择一下网络数据从哪个物理网卡出。 

这样就会导致，数据包会在网卡之间Forward一下，而转发出来的数据包， 会被aws vpc 丢包， 因为出入栈的地址不一样了。 

对于这个行为， 需要配置操作系统的路由策略来解决， 让流量从相同的网卡进出。 

记录一下这个配置。

## Ubuntu

Ubuntu 直接使用的netplan ，在配置文件里面直接指定policy就可以了。 

配置文件位置： /etc/netplan/* 

配置文件内容大致如下： 

```yaml
:~# cat /etc/netplan/50-cloud-init.yaml
# This file is generated from information provided by the datasource.  Changes
# to it will not persist across an instance reboot.  To disable cloud-init's
# network configuration capabilities, write a file
# /etc/cloud/cloud.cfg.d/99-disable-network-config.cfg with the following:
# network: {config: disabled}
network:
    ethernets:
        ens4:
            dhcp4: true
            dhcp6: false
            match:
                macaddress: 02:ab:8e:b1:ba:36
            set-name: ens4
            routes:
             - to: 0.0.0.0/0
               via: 172.31.48.1
               table: 1000
             - to: 172.31.51.248
               via: 0.0.0.0
               scope: link
               table: 1000
            routing-policy:
              - from: 172.31.51.248
                table: 1000
        ens6:
            dhcp4: true
            dhcp6: false
            match:
                macaddress: 02:64:69:51:00:f2
            set-name: ens6
            routes:
             - to: 0.0.0.0/0
               via: 172.31.48.1
               table: 1001
             - to: 172.31.59.199
               via: 0.0.0.0
               scope: link
               table: 1001
            routing-policy:
              - from: 172.31.59.199
                table: 1001
    version: 2
```



## Redhat/CentOS/Fedora/AmazonLinux2

### 旧方式设置

设置开机配置路由的方式， 使用旧脚本得方式需要禁用NetworkManager，完全手动配置networkd的脚本。

1. 安装旧的脚本管理工具

   ```bash
   yum install -y network-scripts
   ```

2. 确认配置文件是否正确

   ```bash
   [root@ip-172-31-11-110 network-scripts]# ll
   total 244
   -rw-r--r--. 1 root root   174 Dec 17 12:30 ifcfg-eth0
   -rw-r--r--. 1 root root   278 Dec 17 15:56 ifcfg-eth1
   -rw-r--r--. 1 root root   254 Feb 15  2021 ifcfg-lo
   -rwxr-xr-x. 1 root root  2123 Feb 15  2021 ifdown
   -rwxr-xr-x. 1 root root   646 Feb 15  2021 ifdown-bnep
   -rwxr-xr-x. 1 root root  6419 Feb 15  2021 ifdown-eth
   -rwxr-xr-x. 1 root root   769 Feb 15  2021 ifdown-ippp
   -rwxr-xr-x. 1 root root  4536 Feb 15  2021 ifdown-ipv6
   lrwxrwxrwx. 1 root root    11 Feb 15  2021 ifdown-isdn -> ifdown-ippp
   -rwxr-xr-x. 1 root root  2064 Feb 15  2021 ifdown-post
   -rwxr-xr-x. 1 root root   870 Feb 15  2021 ifdown-routes
   -rwxr-xr-x. 1 root root  1458 Feb 15  2021 ifdown-sit
   -rwxr-xr-x. 1 root root  1621 Jul 26  2020 ifdown-Team
   -rwxr-xr-x. 1 root root  1556 Jul 26  2020 ifdown-TeamPort
   -rwxr-xr-x. 1 root root  1462 Feb 15  2021 ifdown-tunnel
   -rwxr-xr-x. 1 root root  5463 Feb 15  2021 ifup
   -rwxr-xr-x. 1 root root 12270 Feb 15  2021 ifup-aliases
   -rwxr-xr-x. 1 root root   906 Feb 15  2021 ifup-bnep
   -rwxr-xr-x. 1 root root 13776 Feb 15  2021 ifup-eth
   -rwxr-xr-x. 1 root root 12068 Feb 15  2021 ifup-ippp
   -rwxr-xr-x. 1 root root 11891 Feb 15  2021 ifup-ipv6
   lrwxrwxrwx. 1 root root     9 Feb 15  2021 ifup-isdn -> ifup-ippp
   -rwxr-xr-x. 1 root root   643 Feb 15  2021 ifup-plip
   -rwxr-xr-x. 1 root root  1057 Feb 15  2021 ifup-plusb
   -rwxr-xr-x. 1 root root  5000 Feb 15  2021 ifup-post
   -rwxr-xr-x. 1 root root  2001 Feb 15  2021 ifup-routes
   -rwxr-xr-x. 1 root root  3303 Feb 15  2021 ifup-sit
   -rwxr-xr-x. 1 root root  1755 Jul 26  2020 ifup-Team
   -rwxr-xr-x. 1 root root  1876 Jul 26  2020 ifup-TeamPort
   -rwxr-xr-x. 1 root root  2879 Feb 15  2021 ifup-tunnel
   -rwxr-xr-x. 1 root root  1836 Feb 15  2021 ifup-wireless
   -rwxr-xr-x. 1 root root  5421 Feb 15  2021 init.ipv6-global
   -rw-r--r--. 1 root root 20431 Feb 15  2021 network-functions
   -rw-r--r--. 1 root root 31037 Feb 15  2021 network-functions-ipv6
   -rw-r--r--. 1 root root    40 Dec 17 16:00 route-eth0
   -rw-r--r--. 1 root root    40 Dec 17 16:00 route-eth1
   -rw-r--r--. 1 root root    28 Dec 17 15:40 rule-eth0
   -rw-r--r--. 1 root root    28 Dec 17 15:41 rule-eth1
   ```

3. 书写文件内容，需要配置的文件如下： 

   ```bash
   [root@ip-172-31-11-110 network-scripts]$ cat ifcfg-eth0
   # Created by cloud-init on instance boot automatically, do not edit.
   #
   BOOTPROTO=dhcp
   DEVICE=eth0
   HWADDR=02:20:22:29:a4:0c
   ONBOOT=yes
   STARTMODE=auto
   TYPE=Ethernet
   USERCTL=no
   [root@ip-172-31-11-110 network-scripts]$ cat ifcfg-eth1
   TYPE=Ethernet
   PROXY_METHOD=none
   BROWSER_ONLY=no
   BOOTPROTO=dhcp
   DEFROUTE=yes
   IPV4_FAILURE_FATAL=no
   IPV6INIT=yes
   IPV6_AUTOCONF=yes
   IPV6_DEFROUTE=yes
   IPV6_FAILURE_FATAL=no
   IPV6_ADDR_GEN_MODE=stable-privacy
   NAME=eth1
   UUID=80caddf5-1347-4246-827e-5e0146c7f2c5
   DEVICE=eth1
   ONBOOT=yes
   
   [root@ip-172-31-11-110 network-scripts]$ cat route-eth0
   default via 172.31.0.1 dev eth0 table 1
   
   [root@ip-172-31-11-110 network-scripts]$ cat route-eth1
   default via 172.31.0.1 dev eth1 table 2
   
   [root@ip-172-31-11-110 network-scripts]$ cat rule-eth0
   from 172.31.11.110 lookup 1
   
   [root@ip-172-31-11-110 network-scripts]$ cat rule-eth1
   from 172.31.11.124 lookup 2
   
   [root@ip-172-31-11-110 network-scripts]# cat /etc/iproute2/rt_tables
   #
   # reserved values
   #
   255     local
   254     main
   253     default
   1       network0
   2       network1
   0       unspec
   #
   # local
   #
   #1      inr.ruhep
   ```

4. 关闭NetworkManager， 开启Networkd

   ```bash
   358  sudo systemctl stop NetworkManager
   380  sudo systemctl disable NetworkManager
   375  sudo systemctl enable network
   377  sudo systemctl restart network
   ```

5. 重启， 完成

### 使用NetworkManager设置

使用network Manager的方式需要有两个前置的条件。   

- 开启 NetworkManager 
- 开启 Firewalld

大概是这样，没测试：

```bash
nmcli connection add type ethernet con-name Internal-Workstations-0 ifname eth0 ipv4.method manual ipv4.addresses 172.31.11.110 ipv4.routes "172.31.11.110 src=172.31.0.1 table=1" ipv4.routing-rules "priority 500 from 172.31.11.110 table 1" connection.zone internal-0

nmcli connection add type ethernet con-name Internal-Workstations-1 ifname eth1 ipv4.method manual ipv4.addresses 172.31.11.124 ipv4.routes "172.31.11.124 src=172.31.0.1 table=2" ipv4.routing-rules "priority 600 from 172.31.11.124 table 2" connection.zone internal-1
```

