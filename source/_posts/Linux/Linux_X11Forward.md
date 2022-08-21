---
title: SSH转发X11
date: 2022-04-19 17:45:39
tags: Linux
category: Linux
---
记录转发的配置和步骤

<!-- more -->

# ssh转发X11
```bash
sudo yum install xorg-x11-xauth xorg-x11-fonts-* xorg-x11-font-utils xorg-x11-fonts-Type1 xclock

vim /etc/ssh/sshd_config
  X11Forwarding yes
  X11UseLocalhost no
```
运行图形化的命令 查看mobexterm是否已经正常的启动了一个临时的窗口来进行数据的转发即可 。

# ssh 转发连接到远端的数据
```bash
ssh -L local-port:target-host:target-port tunnel-host
```