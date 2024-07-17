---
title: 在 PVE 上使用 Ignition 文件启动 Fedora CoreOS
date: 2024-06-15 13:06:22
category: Linux
tags:
  - PVE
  - Fedora
  - CoreOS
---
PVE 解决方案：
https://forum.proxmox.com/threads/howto-startup-vm-using-an-ignition-file.63782/

CoreOS Butane Config Spec：
https://coreos.github.io/butane/config-fcos-v1_5/

之前使用使用了另一个方案 让 PVE coreos 可以直接使用 cloudinit 注入密钥。 
现在感觉也没有必要， 直接关闭 cloudinit 使用 ignition file 就可以了。

---

按照上面连接中的文档， 编辑 PVE VM 的配置文件， 将args 附加到QemuServer的配置文件里面即可。

```shell
vim /etc/pve/qemu-server/101.conf
```
添加 args 的配置， 这个配置会直接被记录和传递给 qemu 。
```
```shell
agent: 1

主要就是这一行， 直接添加这个就可以了
args: -fw_cfg name=opt/com.coreos/config,file=/mnt/pve/public_share/fedora_coreos/hayden-coreos.ign

balloon: 0
bios: ovmf
boot: order=virtio0
cores: 1
cpu: host
efidisk0: local:101/vm-101-disk-0.qcow2,efitype=4m,pre-enrolled-keys=1,size=528K
memory: 2048
meta: creation-qemu=8.0.2,ctime=1718427351
name: fcos-template
net0: virtio=F6:65:0F:7B:FF:23,bridge=vmbr0
numa: 0
ostype: l26
scsihw: virtio-scsi-single
smbios1: uuid=45ee31ce-bf31-4e18-ae68-803bbc8c31b2
sockets: 1
virtio0: local-lvm:vm-101-disk-0,iothread=1,size=10G
vmgenid: c309f3f2-0bf0-42d6-bdaa-641122b82b54
```

