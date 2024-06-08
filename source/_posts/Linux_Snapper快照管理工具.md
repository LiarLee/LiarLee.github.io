---
title: 使用 Snapper 管理快照
date: 2024-06-08 12:26:18
category: Linux
tags:
  - Linux
  - FileSystem
  - btrfs
---
[Snapper](http://snapper.io)是一个快照管理工具, 可以自动创建和定期清理文件系统快照. 

Snapper 默认配置文件在 etc/snapper/configs.
日志在:  /var/log/snapper.log

### 创建 Snapper 配置文件
使用 Snapper 的方法是首先为需要自动快照的子卷创建snapper config.
```shell
# 创建快照
snapper -c harbor_data create-config /mnt/btrfs/root/@harbor_data/

# 列出所有配置
snapper list-configs
```

### 管理快照
Snapper 提供了自动管理快照的功能, 也可以手动管理. 通常的操作包括: 创建新的快照, 删除快照, 列出所有快照.
```shell
snapper -c harbor_data list
Type   | # | Pre # | Date                     | User | Cleanup  | Description | Userdata
-------+---+-------+--------------------------+------+----------+-------------+---------
single | 0 |       |                          | root |          | current     |
single | 1 |       | Sat Jun  8 11:48:24 2024 | root |          | init        |
single | 2 |       | Sat Jun  8 11:56:05 2024 | root | timeline | timeline    |
single | 3 |       | Sat Jun  8 12:01:01 2024 | root | timeline | timeline    |

snapper list -a
Type   | # | Pre # | Date                     | User | Cleanup  | Description | Userdata
-------+---+-------+--------------------------+------+----------+-------------+---------
single | 0 |       |                          | root |          | current     |
single | 1 |       | Sat Jun  8 11:48:24 2024 | root |          | init        |
single | 2 |       | Sat Jun  8 11:56:05 2024 | root | timeline | timeline    |
single | 3 |       | Sat Jun  8 12:01:01 2024 | root | timeline | timeline    |

snapper -c harbor_data delete 1-3

snapper list -a
Type   | # | Pre # | Date | User | Cleanup | Description | Userdata
-------+---+-------+------+------+---------+-------------+---------
single | 0 |       |      | root |         | current     |
```
### 激活 Systemd Timer 进行 Timeline 备份
看起来默认的情况下, 不会自动激活 systemd timer 来执行备份, 那么可能需要如下命令手动激活timer.
```shell
systemctl enable snapper-cleanup.timer
Created symlink from /etc/systemd/system/basic.target.wants/snapper-cleanup.timer to /usr/lib/systemd/system/snapper-cleanup.timer.

systemctl enable snapper-timeline.timer
Created symlink from /etc/systemd/system/basic.target.wants/snapper-timeline.timer to /usr/lib/systemd/system/snapper-timeline.timer.

systemctl list-timers --all
NEXT                         LEFT          LAST                         PASSED  UNIT                         ACTIVATES
Sat 2024-06-08 17:29:56 CST  5h 14min left Fri 2024-06-07 17:29:56 CST  18h ago systemd-tmpfiles-clean.timer systemd-tmpfiles-clean.service
Sun 2024-06-09 00:00:00 CST  11h left      Sat 2024-06-08 00:00:00 CST  12h ago atop-rotate.timer            atop-rotate.service
n/a                          n/a           n/a                          n/a     snapper-cleanup.timer        snapper-cleanup.service
n/a                          n/a           n/a                          n/a     snapper-timeline.timer       snapper-timeline.service
n/a                          n/a           n/a                          n/a     systemd-readahead-done.timer systemd-readahead-done.service

root@reg /m/b/r/@harbor_data# systemctl start snapper-cleanup.timer
root@reg /m/b/r/@harbor_data# systemctl start snapper-timeline.timer

root@reg /m/b/r/@harbor_data# systemctl list-timers --all
NEXT                         LEFT          LAST                         PASSED  UNIT                         ACTIVATES
Sat 2024-06-08 13:00:00 CST  43min left    n/a                          n/a     snapper-timeline.timer       snapper-timeline.service
Sat 2024-06-08 17:29:56 CST  5h 13min left Fri 2024-06-07 17:29:56 CST  18h ago systemd-tmpfiles-clean.timer systemd-tmpfiles-clean.service
Sun 2024-06-09 00:00:00 CST  11h left      Sat 2024-06-08 00:00:00 CST  12h ago atop-rotate.timer            atop-rotate.service
Sun 2024-06-09 12:16:04 CST  23h left      Sat 2024-06-08 12:16:04 CST  6s ago  snapper-cleanup.timer        snapper-cleanup.service
n/a                          n/a           n/a                          n/a     systemd-readahead-done.timer systemd-readahead-done.service
```

创建的快照都是CoW轻量快照, 并不占用非常多的空间.

对于创建出来的快照, 也可以直接使用 btrfs send 命令发送到其他设备, 这个是 Snapper 提供的钩子来实现的.
[[Linux/Linux_btrfs#^08cd21|Linux_btrfs]] 这个里面也有记录

Snapper 刚刚开始用, 如果后面有任何相关于 Snapper 的信息再补充. 