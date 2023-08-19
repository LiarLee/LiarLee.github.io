---
title: 由 CPU Steal Time 想到的问题以及验证
date: 2022-04-19 17:45:39
tags: Linux
category: Linux
---

我们在观察虚拟化的时候，可以看到Stealtime增加，大部分时候都是因为虚拟机的超卖， 总结来说st指示了vCPU的繁忙程度。

# 进程相关参数的说明
https://www.kernel.org/doc/html/latest/scheduler/sched-stats.html

> schedstats also adds a new /proc/<pid>/schedstat file to include some of the same information on a per-process level. There are three fields in this file correlating for that process to:  
>    1 time spent on the cpu  
>    2 time spent waiting on a runqueue  
>    3 # of timeslices run on this cpu  

```bash
hayden@VM-16-6-ubuntu /p/3720475> cat schedstat
2236062 223986 22
- 2236062 进程在CPU的时间
- 223986 进程在CPU调度上面等待的时间
- 22 在这个CPU运行的时间片数量
  NOTE: 有一个博客写这个是 上下文交换的次数 ， 和sched 文件中的 nr_switches 数量相同， 不能确定是否正确。
```







