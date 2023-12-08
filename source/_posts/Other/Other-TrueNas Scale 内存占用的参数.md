这个命令的记录在 TrueNas Scale ,也就是linux场景下的， Linux 这个版本在我的蜗牛星际上面我看到了一些兼容性问题， 可能会导致磁盘的状态一场， 遂弃之。 回FreeBSD的版本就没事了，还没有那个碍事的集成 k3s.

TrueNas Scale
Some param can use to tunning Memory Usage : 

Config the ARC Memory to 75% Total Memory :

root@haydentruenas:/sys/block# echo 2995556352 > /sys/module/zfs/parameters/zfs_arc_max
root@haydentruenas:/sys/block# echo 268435456 > /sys/module/zfs/parameters/zfs_arc_sys_free

```bash
#!/bin/sh

PATH="/bin:/sbin:/usr/bin:/usr/sbin:${PATH}"
export PATH

ARC_PCT="90"
ARC_BYTES=$(grep '^MemTotal' /proc/meminfo | awk -v pct=${ARC_PCT} '{printf "%d", $2 * 1024 * (pct / 100.0)}')
echo ${ARC_BYTES} > /sys/module/zfs/parameters/zfs_arc_max

SYS_FREE_BYTES=$((8*1024*1024*1024))
echo ${SYS_FREE_BYTES} > /sys/module/zfs/parameters/zfs_arc_sys_free
```