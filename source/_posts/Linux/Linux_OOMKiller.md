---
title: OOM行为 
date: 2022-04-19 17:45:39
category: Linux
tags:
  - Linux
  - Memory
---

关于OOM行为的思考 以及Kswapd的动作和行为。
http://evertrain.blogspot.com/2018/04/oom.html
更详细的打分算法见源码  https://github.com/torvalds/linux/blob/master/mm/oom_kill.c

## 发生之后
OOM killer会将kill的信息记录到系统日志/var/log/messages，检索相关信息就能匹配到是否触发。
```bash
grep 'Out of memory' /var/log/messages
```
也可以通过dmesg
```bash
dmesg -Tx | egrep -i 'killed process'
```

## 查看分数最高的进程
```bash
#!/bin/bash
for proc in $(find /proc -maxdepth 1 -regex '/proc/[0-9]+'); do
    printf "%2d %5d %s\n" \
        "$(cat $proc/oom_score)" \
        "$(basename $proc)" \
        "$(cat $proc/cmdline | tr '\0' ' ' | head -c 50)"
done 2>/dev/null | sort -nr | head -n 10
```

## 保护措施
### 设置OverCommit
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

### 设置Killer的行为
```bash
root@ip-172-31-11-235:/home/ec2-user|⇒  cat /proc/sys/vm/oom_kill_allocating_task
# 值为0：会 kill 掉得分最高的进程
# 值为非0：会kill 掉当前申请内存而触发OOM的进程
```

### 设置进程
1. 对于需要保护的进程可以使用OOM_ADJ=-17 将这个进程从OOM Killer的列表中移除（已经在内核的2.6之后废弃，处于兼容性保留了这个文件接口
2. 调整OOM_SCORE_ADJ, 范围是 -1000 < oom_score_adj < 1000

直接调整到-1000，会出现在计算分数列表的最后
  ```bash
  echo -1000 > /proc/31595/oom_score_adj
  ```

  手动触发一次OOM规则， Kill符合要求的进程
  ```bash
  echo f > /proc/sysrq-trigger
  ```

### 调整服务的OOM Score
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

### 避免OOM的方式
1. 关闭OverCommit： 关闭OverCommit会导致进程如果无法拿到内存就fast fail ， 不会出现OOMKiller干掉无辜进程的情况。
2. 开启OverCommit， 开启一定程度的Swap： 开启Swap会导致内存在接近99%的时候，会出现系统响应变慢的问题，但是会由于申请的内存没有超过TotalMEM + TotalSWAP，因此不会触发OOM ，但是会导致明显的系统响应问题。 如果超过了 TotalMEM + TotalSWAP 会立刻触发一次OOMkiller结束进程。
3. 开启OverCommit， 调整进程的优先级： 对于特定的进程进行保护。OOM会按照设置的积分计算需要Kill的进程。
4. 开启OverCommit， 调整OOMkiller的行为方式： 计算积分后Kill 或者 直接Kill当前新申请内存的进程。这个方式感觉和默认的关闭OverCommit的行为类型，都是拒绝新的进程以保证旧的进程可以存活。

## 更可靠的方式
### Faceboook的oomd
https://github.com/facebookincubator/oomd
oomd使用的是 PSI接口来评估内存的压力，可以通过自定义规则的方式来对来进行内存压力的分析，而不是简单的内存用量。

### Fedora的Early OOM
https://github.com/rfjakob/earlyoom  
EarlyOOM的作用是提前OOM，这样可以保障用户空间的图形桌面不会到交换空间去， 主要解决的问题是内存压力过大的交换动作会将桌面环境换出导致响应变慢。

## 输出结果记录

### Cgroup - Pod
- 首先是哪个程序超过了cgroup的limit， 触发了cgroup 的oom， 这里是 xray 这个进程自己。
    ```
    kern  :warn  : [Thu Aug 17 17:29:27 2023] xray invoked oom-killer: gfp_mask=0x100cca(GFP_HIGHUSER_MOVABLE), order=0, oom_score_adj=-997
    ```
    
- 这个部分是触发kprint的信息， 解释如下：
  在哪个CPU（1）上， 运行的进程PID（1586622）， commandline的名称（xray）， 哪个版本的内核， 是否被标记为 taint.
    ```
    kern  :warn  : [Thu Aug 17 17:29:27 2023] CPU: 1 PID: 1586622 Comm: xray Kdump: loaded Not tainted 5.14.0-333.el9.x86_64 #1
    ```
  
- 硬件信息， BIOS信息   
    ```
    kern  :warn  : [Thu Aug 17 17:29:27 2023] Hardware name: Red Hat KVM, BIOS 1.15.0-2.module_el8.6.0+2880+7d9e3703 04/01/2014
    ```
    
- 打印发生oom时刻的堆栈
    ```
    kern  :warn  : [Thu Aug 17 17:29:27 2023] Call Trace:
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  <TASK>
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  dump_stack_lvl+0x34/0x48
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  dump_header+0x4a/0x201
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  oom_kill_process.cold+0xb/0x10
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  out_of_memory+0xed/0x2e0
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  mem_cgroup_out_of_memory+0x13a/0x150
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  try_charge_memcg+0x79d/0x860
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  ? __mem_cgroup_charge+0x55/0x80
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  charge_memcg+0x7a/0xf0
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  __mem_cgroup_charge+0x29/0x80
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  __filemap_add_folio+0x224/0x590
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  ? scan_shadow_nodes+0x30/0x30
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  filemap_add_folio+0x37/0xa0
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  __filemap_get_folio+0x1fd/0x330
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  filemap_fault+0x40b/0x740
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  ? next_uptodate_page+0x160/0x1f0
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  ? _raw_spin_unlock+0xa/0x30
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  ? filemap_map_pages+0x298/0x540
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  __do_fault+0x36/0x140
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  do_read_fault+0xf0/0x160
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  do_fault+0xa9/0x390
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  __handle_mm_fault+0x585/0x650
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  handle_mm_fault+0xc5/0x2a0
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  do_user_addr_fault+0x1b4/0x6a0
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  ? syscall_exit_to_user_mode+0x12/0x30
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  exc_page_fault+0x62/0x150
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  asm_exc_page_fault+0x22/0x30
    ```
    
- 寄存器的地址和相关信息。
    ```
    kern  :warn  : [Thu Aug 17 17:29:27 2023] RIP: 0033:0x46ea1d
    kern  :warn  : [Thu Aug 17 17:29:27 2023] Code: Unable to access opcode bytes at RIP 0x46e9f3.
    kern  :warn  : [Thu Aug 17 17:29:27 2023] RSP: 002b:000000c000073f10 EFLAGS: 00010202
    kern  :warn  : [Thu Aug 17 17:29:27 2023] RAX: 0000000000000000 RBX: 0000000000002710 RCX: 000000000046ea1d
    kern  :warn  : [Thu Aug 17 17:29:27 2023] RDX: 0000000000000000 RSI: 0000000000000000 RDI: 000000c000073f10
    kern  :warn  : [Thu Aug 17 17:29:27 2023] RBP: 000000c000073f20 R08: 000000000001af6c R09: 0000000000000072
    kern  :warn  : [Thu Aug 17 17:29:27 2023] R10: 0000000000000000 R11: 0000000000000202 R12: 0000000000000011
    kern  :warn  : [Thu Aug 17 17:29:27 2023] R13: 000000c000aa6c00 R14: 000000c0000064e0 R15: 0000000000001000
    ```
    
- oom时刻的内存信息 和 /sys/fs/cgroup/memory.stat， 当前发生oom下面的Cgroup 的信息
    ```
    kern  :warn  : [Thu Aug 17 17:29:27 2023]  </TASK>
    kern  :info  : [Thu Aug 17 17:29:27 2023] memory: usage 208204kB, limit 204800kB, failcnt 7470
    kern  :info  : [Thu Aug 17 17:29:27 2023] swap: usage 0kB, limit 0kB, failcnt 0
    kern  :info  : [Thu Aug 17 17:29:27 2023] Memory cgroup stats for /kubepods.slice/kubepods-pod089f25ee_a41a_414c_a028_71a38dfb30d3.slice/cri-containerd-c3f1de0d0969e5d3c6758d2e59be98d4dc8ba0367af77f52b09d15225139c74f.scope:
    kern  :info  : [Thu Aug 17 17:29:27 2023] anon 28139520
                                          file 8192
                                          kernel 1343488
                                          kernel_stack 212992
                                          pagetables 167936
                                          sec_pagetables 0
                                          percpu 0
                                          sock 183623680
                                          vmalloc 0
                                          shmem 0
                                          zswap 0
                                          zswapped 0
                                          file_mapped 0
                                          file_dirty 0
                                          file_writeback 0
                                          swapcached 0
                                          anon_thp 8388608
                                          file_thp 0
                                          shmem_thp 0
                                          inactive_anon 28135424
                                          active_anon 4096
                                          inactive_file 4096
                                          active_file 0
                                          unevictable 0
                                          slab_reclaimable 367104
                                          slab_unreclaimable 562944
                                          slab 930048
                                          workingset_refault_anon 0
                                          workingset_refault_file 5784
                                          workingset_activate_anon 0
                                          workingset_activate_file 2856
                                          workingset_restore_anon 0
                                          workingset_restore_file 2331
                                          workingset_nodereclaim 0
                                          pgscan 8263
                                          pgsteal 5880
                                          pgscan_kswapd 1945
                                          pgscan_direct 6318
                                          pgsteal_kswapd 1496
                                          pgsteal_direct 4384
                                          pgfault 23739
                                          pgmajfault 416
                                          pgrefill 4326
                                          pgactivate 379
                                          pgdeactivate 3235
                                          pglazyfree 0
                                          pglazyfreed 0
                                          zswpin 0
                                          zswpout 0
                                          thp_fault_alloc 14
                                          thp_collapse_alloc 4
    ```
- 任务信息， 被kill的进程的信息， 内存的使用量以及积分模式。
    ```
    kern  :info  : [Thu Aug 17 17:29:27 2023] Tasks state (memory values in pages):
    kern  :info  : [Thu Aug 17 17:29:27 2023] [  pid  ]   uid  tgid total_vm      rss pgtables_bytes swapents oom_score_adj name
    kern  :info  : [Thu Aug 17 17:29:27 2023] [1586608]     0 1586608   184282     6593   180224        0          -997 xray
    kern  :info  : [Thu Aug 17 17:29:27 2023] oom-kill:constraint=CONSTRAINT_MEMCG,nodemask=(null),cpuset=cri-containerd-c3f1de0d0969e5d3c6758d2e59be98d4dc8ba0367af77f52b09d15225139c74f.scope,mems_allowed=0,oom_memcg=/kubepods.slice/kubepods-pod089f25ee_a41a_414c_a028_71a38dfb30d3.slice/cri-containerd-c3f1de0d0969e5d3c6758d2e59be98d4dc8ba0367af77f52b09d15225139c74f.scope,task_memcg=/kubepods.slice/kubepods-pod089f25ee_a41a_414c_a028_71a38dfb30d3.slice/cri-containerd-c3f1de0d0969e5d3c6758d2e59be98d4dc8ba0367af77f52b09d15225139c74f.scope,task=xray,pid=1586608,uid=0
    kern  :err   : [Thu Aug 17 17:29:27 2023] Memory cgroup out of memory: Killed process 1586608 (xray) total-vm:737128kB, anon-rss:26372kB, file-rss:0kB, shmem-rss:0kB, UID:0 pgtables:176kB oom_score_adj:-997
   ```

### System
