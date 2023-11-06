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