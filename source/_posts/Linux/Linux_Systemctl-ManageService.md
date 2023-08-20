---
title: 通过systemd管理软件和服务
date: 2019-09-17 14:30:30
categories: Linux
tags: Linux
---

通过systemctl 来管理系统的服务和软件，但是如果是自己安装的软件就没有办法使用了。其实是可以自己定义systemd的管理脚本的，类似与之前的SysV风格的管理脚本。

## Systemd是什么
> systemd is a suite of basic building blocks for a Linux system. It provides a system and service manager that runs as PID 1 and starts the rest of the system. systemd provides aggressive parallelization capabilities, uses socket and D-Bus activation for starting services, offers on-demand starting of daemons, keeps track of processes using Linux control groups, maintains mount and automount points, and implements an elaborate transactional dependency-based service control logic. systemd supports SysV and LSB init scripts and works as a replacement for sysvinit. Other parts include a logging daemon, utilities to control basic system configuration like the hostname, date, locale, maintain a list of logged-in users and running containers and virtual machines, system accounts, runtime directories and settings, and daemons to manage simple network configuration, network time synchronization, log forwarding, and name resolution.

管得还是挺多的，主要是启动PID为1的进程并启动其他的程序，并行执行，维护挂载点及自动挂载，服务之间的依赖关系，日志进程，
## Systemd的Units文件
Systemd默认的文件配置路径有：
	- /etc/systemd/system/*
	- /run/systemd/system/*
	- /usr/lib/systemd/system/*

## Systemd Unit File 的模板
有这样的几个模块：
1. [Unit]
2. [Service]
3. [Install]

### Unit
Unit的作用是记录文件的通用信息。
1. Descripition -- 对软件或服务的描述。
2. Before OR After -- 定义启动的顺序，在某些服务 启动之前 OR 启动之后 ，在启动这个服务。其中还定义了服务的依赖关系，先后顺序。常用的值有 `network.target, Multi-User.target, network.service` 等等。
3. Requires -- 并行启动所指定的其他服务。
4. RequireOverrideable -- 类似与require，但是不同的是手动启动的时候不会报错。
5. Requisite -- 只要启动失败了就直接报错停止，强硬版本的requires。
6. Wants -- 启动依赖单元的常用选项，在启动的同时调起其他的Unit，如果其他单元启动失败了也不会影响当前定义的Unit的启动。
7. Conflicts -- 冲突单元，启动的时候发现了Conflict中定义的其他单元就会尝试终止Unit。

### Service
1. Type -- 对服务类型的定义，通常有如下三种：
   	- simple 默认的类型，启动就启动，停止就结束了。
   	- forking 守护进程的类型，把必要的启动之后留下守护进程。
   	- oneshot 一次性的服务，启动后就结束了。
2. ExecStart -- 启动的时候执行的命令， 这条命令就是服务的主体。
3. ExecStartPre OR ExecStartPost -- ExecStart执行前后的动作。
4. ExecStop -- 指定服务结束的动作，如果未指定直接kill。
5. Restart -- 定义了重启的条件和动作，常用的参数有： `no, on-sucess, on-failure, on-watchdog, on-abort`。
6. SuccessExitStatus -- ExecStart的返回值。 `SuccessExitStatus=1 2 8 SIGKILL`

### Install
1. WantedBy -- 定义启动的情景，几种不同的target: `multi-user.target | poweroff.target | rescue.target | graphical.target | reboot.target`
2. Alias -- 别名的设置在这里定义。

## 标准配置文件 - Libvirtd
```
[Unit]
Description=Virtualization daemon
Requires=virtlogd.socket
Requires=virtlockd.socket
Wants=systemd-machined.service
Before=libvirt-guests.service
After=network.target
After=dbus.service
After=iscsid.service
After=apparmor.service
After=local-fs.target
After=remote-fs.target
After=systemd-logind.service
After=systemd-machined.service
Documentation=man:libvirtd(8)
Documentation=https://libvirt.org

[Service]
Type=simple
EnvironmentFile=-/etc/conf.d/libvirtd
ExecStart=/usr/bin/libvirtd $LIBVIRTD_ARGS
ExecReload=/bin/kill -HUP $MAINPID
KillMode=process
Restart=on-failure
# At least 1 FD per guest, often 2 (eg qemu monitor + qemu agent).
# eg if we want to support 4096 guests, we'll typically need 8192 FDs
# If changing this, also consider virtlogd.service & virtlockd.service
# limits which are also related to number of guests
LimitNOFILE=8192
# The cgroups pids controller can limit the number of tasks started by
# the daemon, which can limit the number of domains for some hypervisors.
# A conservative default of 8 tasks per guest results in a TasksMax of
# 32k to support 4096 guests.
TasksMax=32768

[Install]
WantedBy=multi-user.target
Also=virtlockd.socket
Also=virtlogd.socket
```