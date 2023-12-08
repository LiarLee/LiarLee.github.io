---
title: X11 通过 ssh 转发图形化界面
date: 2023-08-16 14:17:31
category: Linux
tags: Linux
---
## Ssh 转发 X11
```shell 
sudo yum install xorg-x11-xauth xorg-x11-fonts-* xorg-x11-font-utils xorg-x11-fonts-Type1 xclock

vim /etc/ssh/sshd_config
  X11Forwarding yes
  X11UseLocalhost no
```
运行图形化的命令 , 自动捕获请求， 查看mobexterm是否已经正常的启动了一个临时的窗口来进行数据的转发即可 。
## Ssh 转发连接到远端
```shell 
ssh -L local-port:target-host:target-port tunnel-host
ssh -vvv -f -N -D 0.0.0.0:30890 hayden@localhost
```
## Ssh 转发命令参数说明
```shell
    -L listen-port:host:port 指派本地的 port 到达端机器地址上的 port
        建立本地SSH隧道(本地客户端建立监听端口)
        将本地机(客户机)的某个端口转发到远端指定机器的指定端口.

    -R listen-port:host:port 指派远程上的 port 到本地地址上的 port
        建立远程SSH隧道(隧道服务端建立监听端口)
        将远程主机(服务器)的某个端口转发到本地端指定机器的指定端口.

    -D port 指定一个本地机器 "动态的" 应用程序端口转发.
```
