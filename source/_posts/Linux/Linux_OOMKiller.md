---
title: OOM行为
date: 2022-04-19 17:45:39
tags: Linux
category: Linux
---

关于OOM行为的思考 以及Kswapd的动作和行为。
http://evertrain.blogspot.com/2018/04/oom.html
更详细的打分算法见源码  https://github.com/torvalds/linux/blob/master/mm/oom_kill.c

<!-- more -->
# 发生之后
OOM killer会将kill的信息记录到系统日志/var/log/messages，检索相关信息就能匹配到是否触发。
```bash
grep 'Out of memory' /var/log/messages
```
也可以通过dmesg
```bash
dmesg -Tx | egrep -i 'killed process'
```

# 查看分数最高的进程
```bash
#!/bin/bash
for proc in $(find /proc -maxdepth 1 -regex '/proc/[0-9]+'); do
    printf "%2d %5d %s\n" \
        "$(cat $proc/oom_score)" \
        "$(basename $proc)" \
        "$(cat $proc/cmdline | tr '\0' ' ' | head -c 50)"
done 2>/dev/null | sort -nr | head -n 10
```

# 保护措施
## 设置OverCommit
只有在OverCommit的时候才会触发OOM， 默认是许可一定程度的OverCommit的。 
```bash
https://docs.kernel.org/vm/overcommit-accounting.html
vm.overcommit_memory 作用是控制OverCommit是否被许可。
0
    Heuristic overcommit handling. Obvious overcommits of address space are refused. Used for a typical system. It ensures a seriously wild allocation fails while allowing overcommit to reduce swap usage. root is allowed to allocate slightly more memory in this mode. This is the default.
1
    Always overcommit. Appropriate for some scientific applications. Classic example is code using sparse arrays and just relying on the virtual memory consisting almost entirely of zero pages.
2
    Don’t overcommit. The total address space commit for the system is not permitted to exceed swap + a configurable amount (default is 50%) of physical RAM. Depending on the amount you use, in most situations this means a process will not be killed while accessing pages but will receive errors on memory allocation as appropriate.

    Useful for applications that want to guarantee their memory allocations will be available in the future without having to initialize every page.

[root@ip-172-31-9-192 log]# cat /proc/meminfo | grep Comm
CommitLimit:     4794236 kB
Committed_AS:    2344744 kB
---
CommitLimit： 可提交内存的上限， 超过这个上限系统认为目前内存已经是OverCommit。
Committed_AS： 已经提交内存的上限，当前所有进程已经提交的内存使用，这个不是已经分配出去的， 是进程申请的。
```

## 设置Killer的行为
```bash
root@ip-172-31-11-235:/home/ec2-user|⇒  cat /proc/sys/vm/oom_kill_allocating_task
# 值为0：会 kill 掉得分最高的进程
# 值为非0：会kill 掉当前申请内存而触发OOM的进程
```

## 设置进程
1. 对于需要保护的进程可以使用OOM_ADJ=-17 将这个进程从OOM Killer的列表中移除（已经在内核的2.6之后废弃，处于兼容性保留了这个文件接口
2. 调整OOM_SCORE_ADJ, 范围是 -1000 < oom_score_adj < 1000
```bash
# 直接调整到-1000，会出现在计算分数列表的最后
echo -1000 > /proc/31595/oom_score_adj
```

```bash
# 手动触发一次OOM规则， Kill符合要求的进程
echo f > /proc/sysrq-trigger
```

## 调整服务的OOM Score
对于服务本身的保护方式， 可以采用使用Systemd Unit file里面进行 OOMADJSCORE=*** 的方式来指定，例如保护MySQL的进程不会在OOM Killer的列表中。
```bash
cat /usr/lib/systemd/system/mariadb.service

    [Service]
    Type=simple
    User=mysql
    Group=mysql

    ExecStartPre=/usr/libexec/mariadb-prepare-db-dir %n
    ExecStart=/usr/bin/mysqld_safe --basedir=/usr
    ExecStartPost=/usr/libexec/mariadb-wait-ready $MAINPID
    # Setting Here. and setting in the /proc/$PID/oom_score_adj.
    OOMScoreAdjust=-1000

sudo systemctl daemon-reload && sudo systemctl restart mariadb
```

## 避免OOM的方式
1. 关闭OverCommit： 关闭OverCommit会导致进程如果无法拿到内存就fast fail ， 不会出现OOMKiller干掉无辜进程的情况。
2. 开启OverCommit， 开启一定程度的Swap： 开启Swap会导致内存在接近99%的时候，会出现系统响应变慢的问题，但是会由于申请的内存没有超过TotalMEM + TotalSWAP，因此不会触发OOM ，但是会导致明显的系统响应问题。 如果超过了 TotalMEM + TotalSWAP 会立刻触发一次OOMkiller结束进程。
3. 开启OverCommit， 调整进程的优先级： 对于特定的进程进行保护。OOM会按照设置的积分计算需要Kill的进程。
4. 开启OverCommit， 调整OOMkiller的行为方式： 计算积分后Kill 或者 直接Kill当前新申请内存的进程。这个方式感觉和默认的关闭OverCommit的行为类型，都是拒绝新的进程以保证旧的进程可以存活。


# 更可靠的方式
## Faceboook的oomd
https://github.com/facebookincubator/oomd
oomd使用的是 PSI接口来评估内存的压力，可以通过自定义规则的方式来对来进行内存压力的分析，而不是简单的内存用量。

## Fedora的Early OOM
https://github.com/rfjakob/earlyoom  
EarlyOOM的作用是提前OOM，这样可以保障用户空间的图形桌面不会到交换空间去， 主要解决的问题是内存压力过大的交换动作会将桌面环境换出导致响应变慢。