---
title: 关于内核Config中的参数 CONFIG_NO_HZ
date: 2022-04-19 17:45:39
category: Linux
tags:
  - Linux
---
关于Tick， Tickless的研究。

> https://www.kernel.org/doc/html/latest/timers/no_hz.html

这几个参数的最终意义都和 Jitter 相关， 设置的参数含义是 ： CPU时钟中断的周期， 如果是 100HZ ， 那么1s的时间内CPU会中断100次。
目前最新的内核支持 NOHZ ， 也就是在没有任务的时候处于节能的考虑不进行中断。当有需要运行的业务时还是会正常的触发CPU中断。
NOHZ主要的功能时省电， 调整这个参数的意义就是让CPU处在合理的中断次数。过多的中断会导致相关的任务被打断。

> git://git.kernel.org/pub/scm/linux/kernel/git/frederic/dynticks-testing.git