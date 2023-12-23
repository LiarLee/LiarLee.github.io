---
title: Linux-电话面试
date: 2018-01-29 19:14:57
tags:
  - Linux
categories: Linux
---
就在刚刚经历了电话面试，快速回忆问我的问题，记下：  

<!-- more-->

### linux中top命令的用途？top命令中load参数的详细概念
问题问的我当时没反应过来，说的是top命令中第一行的那个load average,一共有三个值，三个值分别显示了一分钟，五分钟，十五分钟的系统负载情况，一般不会超过1，超过5认为是超负荷运转。  
### 邮件服务器使用的协议？
使用SMTP协议，IMAP协议
- 发送邮件的协议和端口号：  
SMTP协议端口号为：25和465
- 接受邮件的协议和端口号：  
POP3协议端口号为：110和995  
IMAP协议端口号为：143和993

### windows的故障转移集群是否用过？
### keepalived使用什么协议实现检测心跳？
keepalived是以VRRP协议为实现基础的，VRRP全称Virtual Router Redundancy Protocol，即虚拟路由冗余协议。
### keepalived主从服务器的选举细节？
Keepalived是一个基于VRRP协议来实现的WEB 服务高可用方案，可以利用其来避免单点故障。一个WEB服务至少会有2台服务器运行Keepalived，一台为主服务器（MASTER），一台为备份服务器（BACKUP），但是对外表现为一个虚拟IP，主服务器会发送特定的消息给备份服务器，当备份服务器收不到这个消息的时候，即主服务器宕机的时候，备份服务器就会接管虚拟IP，继续提供服务，从而保证了高可用性。
### keepalived原理？脑裂问题使用ping网关的方式不能完美解决？
设置主从ping网关，如果没有ping通认为自己的网络出问题，重启服务。面试官提示我正确的处理方式应该是，如果ping不通应该主服务器重启服务，从服务器直接关闭自己的对外服务。
### LVS的负载均衡模式，和转发请求模式？
目前有三种IP负载均衡技术（VS/NAT、VS/TUN和VS/DR）八种调度算法（rr,wrr,lc,wlc,lblc,lblcr,dh,sh）。
### web服务器如何将不同站点配置在同一个IP上？虚拟主机配置多个站点的区分方式？
ip和端口
### free命令中cache和buffer的区别？
> A buffer is something that has yet to be “written” to disk. A cache is something that has been “read” from the disk and stored for later use.  

对于计算机来讲cache 和 buffer的区别：
- **Cache**：高速缓存，是位于CPU与主内存间的一种容量较小但速度很高的存储器。由于CPU的速度远高于主内存，CPU直接从内存中存取数据要等待一定时间周期，Cache中保存着CPU刚用过或循环使用的一部分数据，当CPU再次使用该部分数据时可从Cache中直接调用，这样就减少了CPU的等待时间，提高了系统的效率。Cache又分为一级Cache（L1 Cache）和二级Cache（L2 Cache），L1 Cache集成在CPU内部，L2 Cache早期一般是焊在主板上，现在也都集成在CPU内部，常见的容量有256KB或512KB L2 Cache。

- **Buffer**：缓冲区，一个用于存储速度不同步的设备或优先级不同的设备之间传输数据的区域。通过缓冲区，可以使进程之间的相互等待变少，从而使从速度慢的设备读入数据时，速度快的设备的操作进程不发生间断。

*Free中的buffer和cache：（它们都是占用内存）   

- **buffer**: 作为buffer cache的内存，是块设备的读写缓冲区  
- **cache**: 作为page cache的内存， 文件系统的cache
如果 cache 的值很大，说明cache住的文件数很多。如果频繁访问到的文件都能被cache住，那么磁盘的读IO 必会非常小。
### windows中手动计算的内存使用值，和任务管理器中显示出来的值相差巨大？
windows隐藏了类似linux中的cache和buffer，windows10在任务管理器中已经开始显示cache了

