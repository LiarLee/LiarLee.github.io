---
title: 面试记录
date: 2019-07-18 13:12:33
tags: Personal
---

这个月还是发生了不少事情了，面试，换房子，真快。

<!-- more -->

---

## 面试题
1. 有一个字符串s=“kjdfdsfevsdf”,使用python单独输出每个字符并在后面加上"th".
	```python
	s = "asdfaurhgauh"
	for i in s:
		print(i+'th')	
	```
2. 数据库问题，增删改查。基本上都没答上来。select语句对数据库内容Where做一个筛选。
3. 提取b.txt中的所有域名，awk我写的grep。
grep -E -o "www.[[:alpha:]]*.com" ./b.txt | sort | uniq -c | sort -nr
awk -F / '{print $3}' b.txt | sort | uniq -c | sort -nr
我写的这个唯一个不好的地方就是不能匹配数字的部分，如果域名有数字就提取不出了。其实中间如果全部用正则也可以，但是正则会特别的长。
1. nginx的反向代理配置文件是不是能看懂，考了一个upstream模块，考了一个weight的分配，考了一个 proxy_pass模块的调用。
1. 描述Raid0 ， 1 ，5的区别，但是没让说raid10。
2. 描述如果你有多的资源如何搭建高可用和高并发，这种题目其实还挺无聊的，高并发靠负载均衡分流，四层转发七层代理。高可用靠的冗余和故障的快速切换。没什么特别的架构，web服务也就是keepalived + lvs。硬件的话F5直接搞，虽然我没见过，但是也听说过。
3. 容器问了一个私有的register,不记得叫什么名字，但是我知道Docker官方有文档。**软件名称是Harbor**
4. k8s没什么可说了，昨天晚上听了一堆的k8s的理论，一个集群简单而要三个网络，要不是设计思路清晰，网络就已经是一锅粥了。软件的架构真的是越来越复杂了，现在的网络里面不是桥桥桥，就是NAT转换。
5. 查看Linux系统CPU，MEM，NET-IO，DISK-IO的命令。top | htop | free -m | iostat -a
6. ext4如果分区超过2T如何操作。这题估计本来是问Ext3文件系统的，改的。Ext4随便分了已经。
7. 如何理解top命令中的load average的含义   
	这个问题本来是聊到了服务器性能的观察，我说到了top命令查看系统的当前状况，所以后续有了这个问题，其实在系统中，这三个数值的计算方式是通过CPU进程队列的长度来进行计算的，具体的数值及计算公式网上有很多,等我不记得了我在去找资料吧，这种东西已经是死知识了，到处都是。
	我说说我的理解，这三个数值其实是system load average,是系统的负载状态，其实是描述了**系统的压力变化趋势**，计算的CPU参数主要是Running Process & uninterreptable Process , 其实就是**正在运行**和**不可中断运行**的进程，这些是**CPU的工作量**。还有一个衡量的参数实际上是**IO**，IO的指标也会体现在三个不同时间点的计算中。  
	如何查看或者分析是我一直理解的不透彻的点，记录一下。单项指标的观察不足以解决系统的问题，需要搭配其他的工具进行分析才可以。  
	看三个参数的**变化趋势**，1，5，15三个时间点：  
	- 如果**1分钟高**，但是后面两个都低，说明系统当前的状态是压力高的，但是是暂时的。
	- 如果是**三个数值都高**，可以说明可能是系统的性能不足或者有问题需要解决。
	- 如果**1分钟的数值低**，但是**15分钟的数值高**，说明系统的压力会慢慢平稳下来，不会持续太久。
1. ps命令的使用
   - ps aux 
     - To see every process on the system using BSD syntax
		```
		USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
		root         1  0.1  0.0 186736 10160 ?        Ss   09:32   0:03 /sbin/init
		root         2  0.0  0.0      0     0 ?        S    09:32   0:00 [kthreadd]
		root         3  0.0  0.0      0     0 ?        I<   09:32   0:00 [rcu_gp]
		root         4  0.0  0.0      0     0 ?        I<   09:32   0:00 [rcu_par_gp]
		root         6  0.0  0.0      0     0 ?        I<   09:32   0:00 [kworker/0:0H-kblockd]
		root         8  0.0  0.0      0     0 ?        I<   09:32   0:00 [mm_percpu_wq]
		root         9  0.0  0.0      0     0 ?        S    09:32   0:00 [ksoftirqd/0]
		root        10  0.0  0.0      0     0 ?        I    09:32   0:00 [rcu_preempt]
		root        11  0.0  0.0      0     0 ?        I    09:32   0:00 [rcu_sched]
		root        12  0.0  0.0      0     0 ?        I    09:32   0:00 [rcu_bh]
		```
	- ps axjf / ps -ejH
    	- To print a process tree
		```
		PPID   PID  PGID   SID TTY      TPGID STAT   UID   TIME COMMAND
		1   555   555   555 ?           -1 Ssl      0   0:00 /usr/bin/gdm
		555   585   555   555 ?           -1 Sl       0   0:00  \_ gdm-session-worker [pam/gdm-launch-environment]
		585   789   789   789 tty1       789 Ssl+   120   0:00  |   \_ /usr/lib/gdm-x-session gnome-session --autostart /usr/share/gdm/g
		789   791   789   789 tty1       789 Sl+    120   0:01  |       \_ /usr/lib/Xorg vt1 -displayfd 3 -auth /run/user/120/gdm/Xautho
		791   848   789   789 tty1       789 S+       0   0:00  |       |   \_ xf86-video-intel-backlight-helper intel_backlight
		789   939   789   789 tty1       789 Sl+    120   0:00  |       \_ /usr/lib/gnome-session-binary --autostart /usr/share/gdm/gree
		939   970   789   789 tty1       789 Sl+    120   0:04  |           \_ /usr/bin/gnome-shell
		970  1032  1032   789 tty1       789 Sl     120   0:00  |           |   \_ ibus-daemon --xim --panel disable
		1032  1035  1032   789 tty1       789 Sl     120   0:00  |           |       \_ /usr/lib/ibus/ibus-dconf
		1032  1200  1032   789 tty1       789 Sl     120   0:00  |           |       \_ /usr/lib/ibus/ibus-engine-simple
		939  1086   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-rfkill
		939  1088   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-smartcard
		939  1089   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-clipboard
		939  1090   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-xsettings
		939  1091   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-housekeeping
		939  1092   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-mouse
		939  1093   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-power
		939  1094   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-screensaver-proxy
		939  1095   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-sound
		939  1099   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-color
		939  1101   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-keyboard
		939  1103   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-print-notifications
		939  1104   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-sharing
		939  1105   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-a11y-settings
		939  1106   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-wacom
		939  1107   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-datetime
		939  1108   789   789 tty1       789 Sl+    120   0:00  |           \_ /usr/lib/gsd-media-keys
		```

1.  Buffer 和 Cache的区别 
	- Buffer：A buffer is somthing that has yet to be "written" to disk.
	- Cache：A Cache is something that has been "read" from the disk and stored for later use.
	
	free 或者 top 命令中的buffer 和 cache：  
	- Buffer： 作为Buffer-cache的一部分内存，是块设备的读写缓冲区。
	- Cache： 作为Page-cache的一部分内存，是缓冲文件系统的cache。
	- Buffer（缓冲区）是系统两端处理速度平衡（从长时间尺度上看）时使用的。它的引入是为了减小短期内突发I/O的影响，起到流量整形的作用。比如生产者——消费者问题，他们产生和消耗资源的速度大体接近，加一个buffer可以抵消掉资源刚产生/消耗时的突然变化。
	- Cache（缓存）则是系统两端处理速度不匹配时的一种折衷策略。因为CPU和memory之间的速度差异越来越大，所以人们充分利用数据的局部性（locality）特征，通过使用存储系统分级（memory hierarchy）的策略来减小这种差异带来的影响。  
	答案来源链接:
	[知乎](https://www.zhihu.com/question/26190832/answer/32387918)
1. iptables的链表结构：  
	表：   
	- Filter   			一般的过滤功能  
	- NAT  			NAT功能的相关设置  
	- Mangle  			用于对特定数据包的修改  
	- Raw  			一般设置不需要iptables过滤及监控的流量，提高性能使用。  
    	- Raw表的使用:
			```
			iptables -t raw -A PREROUTING -d 1.2.3.4 -p tcp --dport 80 -j NOTRACK
			iptables -t raw -A PREROUTING -s 1.2.3.4 -p tcp --sport 80 -j NOTRACK
			iptables -A FORWARD -m state --state UNTRACKED -j ACCEPT
			```  

	链：  
	- PREROUTING 数据包进入路由表之前的Hook函数  
	- INPUT 数据包经过路由表后进入本机的数据  
	- FORWARD  	数据包经过路由表后不是本机的数据  
    	- 前面三个经过路由表的选择，后面两个不会再次经过路由表
	- OUTPUT 数据包是本机产生的，向外发送
	- POSTROUTING 发送到网卡接口之前
	
2. 如何观察网卡的流量及tcpdump的使用

	
	
	
