---
title: SElinux问题排查
date: 2024-07-13 11:36:11
category: Linux
tags:
  - Docker
  - SElinux
  - Linux
  - Application
---
https://docs.redhat.com/zh_hans/documentation/red_hat_enterprise_linux/9/html/using_selinux/analyzing-an-already-found-selinux-denial_troubleshooting-problems-related-to-selinux
安装相关软件. 
```
root@ip-172-31-54-198:/var/mnt/docker_root# rpm-ostree install policycoreutils-python-utils setroubleshoot-server
Checking out tree 1873357... done
Enabled rpm-md repositories: fedora-cisco-openh264 updates fedora updates-archive
Updating metadata for 'updates'... done
Updating metadata for 'updates-archive'... done
Importing rpm-md... done
rpm-md repo 'fedora-cisco-openh264' (cached); generated: 2024-03-12T11:45:42Z solvables: 3
rpm-md repo 'updates'; generated: 2024-07-12T04:06:14Z solvables: 21267
rpm-md repo 'fedora' (cached); generated: 2024-04-14T18:51:11Z solvables: 74881
rpm-md repo 'updates-archive'; generated: 2024-06-30T05:31:17Z solvables: 22869
Resolving dependencies... done
Will download: 21 packages (6.0 MB)
Downloading from 'updates'... done
Downloading from 'fedora'... done
Downloading from 'updates-archive'... done
Importing packages... done
Checking out packages... done
Running pre scripts... done
Running post scripts... done
Running posttrans scripts... done
Writing rpmdb... done
Writing OSTree commit... done
Staging deployment... done
Added:
  checkpolicy-3.6-3.fc40.x86_64
  gobject-introspection-1.80.1-1.fc40.x86_64
  ima-evm-utils-1.5-4.fc40.x86_64
  initscripts-service-10.23-1.fc40.noarch
  libfsverity-1.4-12.fc40.x86_64
  policycoreutils-python-utils-3.6-3.fc40.noarch
  python3-audit-4.0.1-1.fc40.x86_64
  python3-dasbus-1.7-6.fc40.noarch
  python3-dbus-1.3.2-6.fc40.x86_64
  python3-gobject-base-3.48.2-1.fc40.x86_64
  python3-libselinux-3.6-4.fc40.x86_64
  python3-libsemanage-3.6-3.fc40.x86_64
  python3-libxml2-2.12.7-1.fc40.x86_64
  python3-policycoreutils-3.6-3.fc40.noarch
  python3-rpm-4.19.1.1-1.fc40.x86_64
  python3-setools-4.5.1-2.fc40.x86_64
  python3-systemd-235-9.fc40.x86_64
  rpm-build-libs-4.19.1.1-1.fc40.x86_64
  rpm-sign-libs-4.19.1.1-1.fc40.x86_64
  setroubleshoot-plugins-3.3.14-9.fc40.noarch
  setroubleshoot-server-3.3.33-1.fc40.x86_64
Changes queued for next boot. Run "systemctl reboot" to start a reboot
root@ip-172-31-54-198:/var/mnt/docker_root# systemctl reboot


```

查看建议的方案
```
root@ip-172-31-54-198:~# sealert -l "*"
SELinux is preventing mysqld from write access on the directory mysql.

*****  Plugin catchall_labels (83.8 confidence) suggests   *******************

If you want to allow mysqld to have write access on the mysql directory
Then you need to change the label on mysql
Do
# semanage fcontext -a -t FILE_TYPE 'mysql'
where FILE_TYPE is one of the following: bpf_t, cifs_t, container_file_t, container_var_lib_t, fusefs_t, hugetlbfs_t, nfs_t, svirt_home_t, tmpfs_t, virt_home_t.
Then execute:
restorecon -v 'mysql'


*****  Plugin catchall (17.1 confidence) suggests   **************************

If you believe that mysqld should be allowed write access on the mysql directory by default.
Then you should report this as a bug.
You can generate a local policy module to allow this access.
Do
allow this access for now by executing:
# ausearch -c 'mysqld' --raw | audit2allow -M my-mysqld
# semodule -X 300 -i my-mysqld.pp


Additional Information:
Source Context                system_u:system_r:container_t:s0:c114,c1019
Target Context                system_u:object_r:mnt_t:s0
Target Objects                mysql [ dir ]
Source                        mysqld
Source Path                   mysqld
Port                          <Unknown>
Host                          ip-172-31-54-198
Source RPM Packages
Target RPM Packages
SELinux Policy RPM            selinux-policy-targeted-40.22-1.fc40.noarch
Local Policy RPM              selinux-policy-targeted-40.22-1.fc40.noarch
Selinux Enabled               True
Policy Type                   targeted
Enforcing Mode                Enforcing
Host Name                     ip-172-31-54-198
Platform                      Linux ip-172-31-54-198 6.8.11-300.fc40.x86_64 #1
                              SMP PREEMPT_DYNAMIC Mon May 27 14:53:33 UTC 2024
                              x86_64
Alert Count                   1
First Seen                    2024-07-13 11:16:08 CST
Last Seen                     2024-07-13 11:16:08 CST
Local ID                      b331ca4f-5699-4d11-94d2-84638e0f0f8a

Raw Audit Messages
type=AVC msg=audit(1720840568.80:300): avc:  denied  { write } for  pid=3596 comm="mysqld" name="mysql" dev="nvme0n1p4" ino=9437365 scontext=system_u:system_r:container_t:s0:c114,c1019 tcontext=system_u:object_r:mnt_t:s0 tclass=dir permissive=0


Hash: mysqld,container_t,mnt_t,dir,write


```