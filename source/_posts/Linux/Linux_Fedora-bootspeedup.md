---
title: Fedora开机启动速度的优化
date: 2019-01-13 17:02:11
categories: Linux
tags: Linux, Fedora
---

一直认为我的虚拟机性能不够所以导致自己的机器开桌面环境，开机慢慢慢慢慢慢.......今天终于发现了原因.....

## 过程
使用systemd-analyze 命令  
使用systemd-analyze blame 命令罗列所有的启动的服务和耗时

我的机器耗时间最长的是 
1. dnf-makecache.service 占用了 1min 8.124s；  
1. plymouth-quit-wait.service 占用了 1min 744ms 

### 配置
所以关闭它，阻止今后开机的时候启动
```
systemctl disable dnf-makecache.service
systemctl disable dnf-makecache.timer
```
或者就直接把这个服务指向 /dev/null 也是可以的， 总体来说就是让他开机的时候不要继续启动。
```
systemctl mask dnf-makecache.service
systemctl mask dnf-makecache.timer
systemctl mask plymouth-quit-wait.service
systemctl mask firewalld.service
```
尽量不使用DHCP使用固定的IP可以提高启动速度，其他的不需要服务可以自行关闭即可  
## 优化后的结果
```
[root@localhost ~]# systemd-analyze 
Startup finished in 3.091s (kernel) + 1.669s (initrd) + 5.211s (userspace) = 9.971s
```

```
[root@localhost ~]# systemd-analyze blame
          2.868s vmware-tools.service
          1.317s lvm2-monitor.service
          1.115s dev-mapper-fedora\x2droot.device
          1.044s fwupd.service
           865ms NetworkManager-wait-online.service
           834ms systemd-udev-settle.service
           794ms dracut-initqueue.service
           715ms udisks2.service
           566ms sssd.service
           533ms initrd-switch-root.service
           443ms abrtd.service
           404ms systemd-udev-trigger.service
           326ms systemd-journal-flush.service
           280ms ModemManager.service
           259ms libvirtd.service
           251ms polkit.service
           209ms chronyd.service
           199ms NetworkManager.service
           192ms systemd-vconsole-setup.service
           164ms accounts-daemon.service
           149ms user@42.service
           146ms systemd-udevd.service
           143ms dracut-cmdline.service
           137ms dracut-pre-pivot.service
           137ms systemd-tmpfiles-setup-dev.service
           134ms systemd-sysctl.service
           131ms packagekit.service
           124ms gssproxy.service
           119ms fedora-readonly.service
           116ms lvm2-pvscan@8:2.service
           111ms user@0.service
           110ms avahi-daemon.service
           105ms auditd.service
           105ms dmraid-activation.service
           101ms gdm.service
            86ms systemd-user-sessions.service
            71ms fedora-import-state.service
            65ms initrd-parse-etc.service
            58ms upower.service
            51ms systemd-logind.service
            47ms var-lib-nfs-rpc_pipefs.mount
            47ms systemd-fsck@dev-disk-by\x2duuid-e37f7ce7\x2d367b\x2d4e28\x2d8c1e\x2d3b98d1e4d441.service
            46ms systemd-journald.service
            45ms systemd-tmpfiles-setup.service
            44ms boot.mount
            41ms home.mount
            41ms wpa_supplicant.service
            40ms dev-hugepages.mount
            37ms nfs-config.service
            35ms plymouth-read-write.service
            33ms rpc-statd-notify.service
            30ms systemd-remount-fs.service
            30ms systemd-fsck@dev-mapper-fedora\x2dhome.service
            27ms geoclue.service
            27ms cups.service
            26ms colord.service
            24ms livesys.service
            23ms rtkit-daemon.service
            22ms dracut-pre-udev.service
            21ms dev-mqueue.mount
            21ms dracut-shutdown.service
            20ms sysroot.mount
            20ms switcheroo-control.service
            20ms plymouth-start.service
            19ms plymouth-switch-root.service
            19ms kmod-static-nodes.service
            16ms dev-mapper-fedora\x2dswap.swap
            16ms initrd-cleanup.service
            15ms systemd-fsck-root.service
            13ms livesys-late.service
            10ms sys-kernel-debug.mount
             6ms systemd-update-utmp-runlevel.service
             6ms initrd-udevadm-cleanup-db.service
             6ms systemd-update-utmp.service
             6ms systemd-random-seed.service
             5ms tmp.mount
             2ms sys-kernel-config.mount
```
可以通过命令查看systemd的一些信息： 
```bash
systemctl --failed # 查看所有启动或者运行失败的服务

systemctl status # 查看系统启动之后的所有Service 以及状态
```
### Mark Tips
1. axel  dnf可用的多线程更新
1. yum-fastestmirror  自动挑选最快的服务器更新
1. **附加一个systemd的使用教程：[- ClickThisLink](https://itxx00.github.io/blog/2014/04/08/systemd-basic-usage/)**    
1. **附加一个plymouth的教程：[- ClickThisLink](https://blog.csdn.net/qq_25773973/article/details/50786174)**
