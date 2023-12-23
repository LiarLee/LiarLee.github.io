---
title: Perf 命令的Performance分析
date: 2022-04-19 17:45:39
category: Linux
tags:
  - Linux
  - Perf
---

https://blog.gmem.cc/perf  一个非常详细的博客， 太强啦。

## 使用perf进行性能的简单输出
```bash
root@ip-172-31-11-235:~|⇒  perf stat htop -d 1

 Performance counter stats for 'htop -d 1':

        181.764747      task-clock (msec)         #    0.055 CPUs utilized
                52      context-switches          #    0.286 K/sec
                 0      cpu-migrations            #    0.000 K/sec
               320      page-faults               #    0.002 M/sec
   <not supported>      cycles
   <not supported>      instructions
   <not supported>      branches
   <not supported>      branch-misses

       3.283236218 seconds time elapsed


```

## 使用perf记录性能指标到文件
```shell
[root@ip-172-31-41-141 tmp]# perf record -F 99 -a -g -p 44551
[root@ip-172-31-41-141 tmp]# sudo perf record -F 99 -a -g -- sleep 60
Warning:
PID/TID switch overriding SYSTEM
^C[ perf record: Woken up 1 times to write data ]
[ perf record: Captured and wrote 0.021 MB perf.data (2 samples) ]
root@ip-172-31-11-235:~|⇒  sudo perf script > out.perf
```

## 生成火焰图
通常的做法是将 out.perf 拷贝到本地机器，在本地生成火焰图：
```bash
$ git clone --depth 1 https://github.com/brendangregg/FlameGraph.git
# 折叠调用栈
$ perf script > out.perf
$ FlameGraph/stackcollapse-perf.pl out.perf > out.folded
# 生成火焰图
$ FlameGraph/flamegraph.pl out.folded > out.svg
```
生成火焰图可以指定参数，–width 可以指定图片宽度，–height 指定每一个调用栈的高度，生成的火焰图，宽度越大就表示CPU耗时越多。
FlameGraph/flamegraph.pl < out.profile > out.svg

[root@ip-172-31-18-198 timechart]# perf timechart record -g -- curl http://localhost:19999
[root@ip-172-31-18-198 timechart]# perf timechart
Written 0.0 seconds of trace to output.svg.

## 制造一个D进程
Most proper way is to use freezer cgroup. It puts process to uninterruptible sleep in case of FROZEN cgroup state.

mkdir /sys/fs/cgroup/freezer
mount -t cgroup -ofreezer freezer /sys/fs/cgroup/freezer
mkdir /sys/fs/cgroup/freezer/frozen
echo FROZEN > /sys/fs/cgroup/freezer/frozen/freezer.state
echo `pidof you_process` > /sys/fs/cgroup/freezer/frozen/tasks
echo `pgrep cp` > /sys/fs/cgroup/freezer/frozen/tasks
echo THAWED > /sys/fs/cgroup/freezer/frozen/freezer.state

To put again to interruptible sleep, just change cgroup state to THAWED.

## 动态追踪
1. 添加一个动态追踪的Tracepoint Event
```
perf probe --add="probe:io_schedule_timeout"
perf probe --add="probe:io_schedule_timeout%return"
# 使用
perf record -e probe:tcp_sendmsg -a -g -- sleep 5
# 分析
perf report --stdio
```
2. 移除一个动态追踪的Tracepoint Event
```
perf probe --del="probe:io_schedule_timeout"
perf probe -d "probe:io_schedule_timeout"
```
3. 列出所有存在的probe 
```
perf probe -l
```
4. 查看追踪的结果
```
perf script
perf probe -V tcp_sendmsg # 列出可用的变量列表
perf probe --add 'tcp_sendmsg size' # 追踪这个变量
# Add a tracepoint for tcp_sendmsg() return, and capture the return value:
perf probe 'tcp_sendmsg%return $retval'
```

## 关于Off-cpu进程的分析
1. 按步骤生成
   ```sh
    ]$ /usr/share/bcc/tools/offcputime -df -p `pgrep -nx mysqld` 30 > out.stacks
    [...copy out.stacks to your local system if desired...]
    ]$ git clone https://github.com/brendangregg/FlameGraph
    ]$ cd FlameGraph
    ]$ ./flamegraph.pl --color=io --title="Off-CPU Time Flame Graph" --countname=us < out.stacks > out.svg
   ```
2. 一条命令出图 
   ```
   ]$ grep do_command < out.stacks | ./flamegraph.pl --color=io --title="Off-CPU Time Flame Graph" --countname=us > out.svg
   ```

## Perf命令的常见参数
1. 内核设置
要启用内核动态追踪，需要使用内核编译参数CONFIG_KPROBES=y、CONFIG_KPROBE_EVENTS=y。
要追踪基于帧指针的内核栈，需要内核编译参数CONFIG_FRAME_POINTER=y。
要启用用户动态追踪，需要使用内核编译参数CONFIG_UPROBES=y、CONFIG_UPROBE_EVENTS=y
2. 子命令列表

perf支持一系列的子命令：
子命令 	说明
annotate 	读取perf.data并显示被注解的代码
bench 	基准测试的框架
config 	在配置文件中读写配置项
diff 	读取perf.data并显示剖析差异
evlist 	列出perf.data中的事件名称
inject 	用于增强事件流的过滤器
kmem 	跟踪/度量内核内存属性
kvm 	跟踪/度量KVM客户机系统
list 	显示符号化的事件列表
lock 	分析锁事件
mem 	分析内存访问
record 	执行剖析
report 	显示剖析结果
sched 	分析调度器
stat 	获取性能计数
top 	显示成本最高的操作并动态刷新
trace 	类似于strace的工具
probe 	定义新的动态追踪点

3. perrf record 命令参数 
```bash
--exclude-perf 	不记录perf自己发起的事件
-p 	收集指定进程的事件，逗号分割的PID列表
-a 	使用Per-CPU模式，如果不指定-C，则相当于全局模式。如果指定-C，则可以选定若干CPU
-g 	记录调用栈
-F 	以指定的频率剖析
-T 	记录样本时间戳
-s 	记录每个线程的事件计数器，配合 perf report -T使用
```

# 微基准测试

From youtube video： 

```bash
root@HaydenArchDesktop /tmp# perf bench sched pipe
# Running 'sched/pipe' benchmark:
# Executed 1000000 pipe operations between two processes

     Total time: 2.407 [sec]

       2.407455 usecs/op
         415376 ops/sec


root@HaydenArchDesktop /tmp# taskset -c 0 perf bench sched pipe
# Running 'sched/pipe' benchmark:
# Executed 1000000 pipe operations between two processes

     Total time: 2.381 [sec]

       2.381081 usecs/op
         419977 ops/sec
# 这里的时间提升不明显的原因是， 我的Archlinux是ZenKernel， 感觉可能在调度上已经做了不少的事情 ，如果随便启动一个redhat , 这个指标的差距会比较大。
