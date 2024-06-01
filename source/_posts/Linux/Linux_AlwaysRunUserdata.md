---
title: 在EC2实例每次启动的时候都运行Userdata
date: 2023-09-06 14:24:46
category: Linux
tags:
  - Linux
  - AWS
  - EC2
---

使用Cloud-init提供读取Userdata的功能。 

需要在Userdata中添加一个 MIME 的头部， 覆盖默认的行为。
> https://cloudinit.readthedocs.io/en/latest/topics/format.html#mime-multi-part-archive
> https://repost.aws/zh-Hans/knowledge-center/execute-user-data-ec2

具体需要添加的MIME 部分： 
```mime
Content-Type: multipart/mixed; boundary="//"
MIME-Version: 1.0

--//
Content-Type: text/cloud-config; charset="us-ascii"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Content-Disposition: attachment; filename="cloud-config.txt"

#cloud-config
cloud_final_modules:
- [scripts-user, always]

--//
Content-Type: text/x-shellscript; charset="us-ascii"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Content-Disposition: attachment; filename="userdata.txt"
```

之后重新启动这个EC2 就可以了。 

## Troubleshooting Guide
- 首先可以的查看Userdata ， 在控制台 或者 AWScli
- 查看实例内部日志 或者 Console的日志： 
  /var/log/cloud-init.log
  /var/log/cloud-init-output.log
- 查看userdata 注入的脚本内容： 
  /var/lib/cloud/instances/i-09e08d362af7fa401/scripts 在这个目录下。
  文件树 ： 
```
[root@ip-172-31-50-3 i-09e08d362af7fa401]# tree
.
├── boot-finished
├── cloud-config.txt
├── datasource
├── handlers
├── obj.pkl
├── scripts  # 这个
│   ├── part-001
│   └── part-002
├── sem
│   ├── config_amazonlinux_repo_https
│   ├── config_disk_setup
│   ├── config_keys_to_console
│   ├── config_locale
│   ├── config_mounts
│   ├── config_phone_home
│   ├── config_power_state_change
│   ├── config_resolv_conf
│   ├── config_rsyslog
│   ├── config_runcmd
│   ├── config_scripts_per_instance
│   ├── config_scripts_user
│   ├── config_set_hostname
│   ├── config_set_passwords
│   ├── config_ssh
│   ├── config_ssh_authkey_fingerprints
│   ├── config_timezone
│   ├── config_users_groups
│   ├── config_write_files
│   ├── config_write_metadata
│   ├── config_yum_add_repo
│   ├── config_yum_configure
│   └── consume_data
├── user-data.txt
├── user-data.txt.i
├── vendor-data.txt
└── vendor-data.txt.i

3 directories, 33 files
``` 

如果需要临时的改一些内容， 可以写在Userdata里面， 完成操作之后删除Userdata 就可以了。