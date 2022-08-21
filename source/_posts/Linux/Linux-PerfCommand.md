---
title: Linux中一些常见的性能分析命令
date: 2021-12-26 00:18:36
tags: Linux
categories: Linux
---

记录性能分析的思路。

<!-- more -->

最近的这个半年越来越好奇的事情是， 为什么命令会卡住，为什么命令会执行不下去，为什么命令会等待，等等等等。

那么这些问题， 有的是可以有答案的， 目前也不知道的。 

已经大概掌握的几个不同的方法以及观测的工具， 大概做一个记录。

# Strace命令
## strace 命令的常见用法
strace命令是用来追踪系统调用的，常见的可以追踪的系统调用需要阅读内核部分的代码。 但是常见的系统调用就是集中， read() , write() , ioctl(), futex() , mmap()
大部分的时候 我们都是可以观测到卡住的部分的 ， 这种追踪我认为常见的使用场景就是命令卡住了， 或者执行中的程序卡住了。 
### 命令卡住的分析
对于命令卡住的情况， 可以使用类似于如下的命令： 
```bash
strace -f -ttt -s 512 echo "123"
```
这样的话， 在执行的过程中就可以查看相关的内容，比如常见的卡在了系统调用的某个函数上， 这个可以用来定位，命令打开了那些文件，申请的那些内存地址，打开了什么文件，关闭Socket等等等等。 
目前我的办法的通过对比这个卡住的命令执行到什么函数出现的问题， 对应的在正常的机器上进行对比，就可以猜到大概的问题出现在了哪里。
### 已经运行中的程序分析
```bash
strace -f -ttt -s 512 -p 123
```
执行进程的PID ， 然后strace会attach到进程上， 输出的内容， 也可以查看到当前程序的运行状态。 
### 总结
如上面的两种方式，都可以对运行中明显的问题进行观察， 但是如果没有卡在系统调用的部分， 通过这个命令的观察其实是无法查看的， 因为他记录的是应用程序指令陷入到内核态的部分， 但是常见的应用程序基本上都是用户态的，所以这个部分如果是应用卡在用户态上， 观测的信息就比较有限了。

# Perf命令
## perf简单的分析
perf命令的简单分析， 首先是
1. perf top 
perf top 可以用来实时的查看应用程序的相关问题， 收集指标的范围是整个操作系统，所以是比较消耗资源的， 输出的结果也是直接可以查看的， 看完了结果打断即可。 
1. perf stat 
perf stat 查看相关的统计信息，如下是一个样例，提供了一些静态的指标。 
```bash 
 sudo perf stat
 Performance counter stats for 'system wide':
         61,167.25 msec cpu-clock                 #   16.000 CPUs utilized
             4,955      context-switches          #   81.007 /sec
                63      cpu-migrations            #    1.030 /sec
               930      page-faults               #   15.204 /sec
     6,266,524,215      cycles                    #    0.102 GHz                      (83.32%)
       244,046,608      stalled-cycles-frontend   #    3.89% frontend cycles idle     (83.34%)
        66,809,179      stalled-cycles-backend    #    1.07% backend cycles idle      (83.34%)
       818,170,826      instructions              #    0.13  insn per cycle
                                                  #    0.30  stalled cycles per insn  (83.34%)
       155,602,840      branches                  #    2.544 M/sec                    (83.34%)
         1,701,804      branch-misses             #    1.09% of all branches          (83.33%)

       3.823037998 seconds time elapsed
```
显示的内容是从输入了命令之后的相关信息，主要是一些CPU相关的指标， 比如CPU时钟，上下文交换次数，cpu转移，缺页中断等等等等。

1. perf record 
perf record 我常用的命令是这样的， 他会将记录到的指标输出到当前目录的文件中，然后供report命令来进行分析， 这两个一般来说会合用。 
```bash 
perf record -a -g -F 1000 -p 123  
perf record -a -g -F 1000 echo 123
perf record -a -g -F 1000 
perf record -a -g -F 1000 -- sleep 60 
三个命令会记录相关的指标到当前目录的perf.data文件中。 大小和采样的频率，时间的数量有关。
```
1. perf report 
perf report 我比较常用的参数就是 使用 
```bash 
perf record --stdio
```
来直接进行查看， 占用时间百分比比较高的函数，前提是 ，这个命令的运行需要有perf.data.
1. perf sched 
perf sched 通常是用来查看cpu调度延时的， 这个用的确实不多， 毕竟cpu调度现在基本上都是cfq， 改的人毕竟还是少数， 所以实际的使用比较少。 
这个指令常用的如下： 
```bash
perf sched record 
perf sched latency 
perf sched report
```
上面的这些都是我比较常用的命令， 临时抓出来看下。

## perf命令输出火焰图
perf 命令输出火焰图需要的是Github上面的一个项目， 这个项目的作者也是写性能之巅的作者。

具体的处理流程如下： 
```bash 
git clone --depth 1 https://github.com/brendangregg/FlameGraph.git
sudo perf script > out.perf
FlameGraph/stackcollapse-perf.pl out.perf > out.folded
FlameGraph/flamegraph.pl out.folded > out.svg
```
最后输出的out.svg就是结果了，可以通过浏览器来查看。 
至于查看的方法，其实是看函数所占有的面积， 面积越大说明函数运行的时间越长； 
那么还有说法是说， 越靠近顶端的应该越尖，如果有顶端比较大的平顶说明可能是有问题的， 这个答案还在求证中。

