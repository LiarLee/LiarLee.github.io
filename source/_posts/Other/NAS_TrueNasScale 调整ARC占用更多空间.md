---
title: TrueNas Scale 让 ZFS 占用更多内存作为 ARC
category: Application
date: 2023-10-08 13:57:57
tags:
  - TrueNasScale
  - NAS
  - IO
---
安装 TrueNas Scale 玩儿了一下， 劝退了有点。

TrueNAS Scale 作为 Linux Based 版本在使用内存上比较谨慎，  ARC 并不会使用所有的内存， 这样的设计过于保守了。 内存当然是利用的越充分越好。

Config the ARC Memory to 75% Total Memory :
```shell
$ echo 2995556352 > /sys/module/zfs/parameters/zfs_arc_max
$ echo 268435456 > /sys/module/zfs/parameters/zfs_arc_sys_free
```

也可以使用一个这样的 shell 脚本来进行分析和配置。这个脚本会将 arc 的比例调整到 90% 的总内存。
```shell
#!/bin/sh

PATH="/bin:/sbin:/usr/bin:/usr/sbin:${PATH}"
export PATH

ARC_PCT="90"
ARC_BYTES=$(grep '^MemTotal' /proc/meminfo | awk -v pct=${ARC_PCT} '{printf "%d", $2 * 1024 * (pct / 100.0)}')
echo ${ARC_BYTES} > /sys/module/zfs/parameters/zfs_arc_max

SYS_FREE_BYTES=$((8*1024*1024*1024))
echo ${SYS_FREE_BYTES} > /sys/module/zfs/parameters/zfs_arc_sys_free
```

