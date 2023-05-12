---
title: buffer/cache 无法释放
category: Linux
date: 2023-05-12 22:15:35
tags: Linux
---

## 问题

看到了一个案例， 这个案例的问题是： 为什么我的buffer/cache在echo 3 之后， 还是不能回收， 使用的内存非常大。

命令如下： 

```bash	
root@ip-172-31-47-174 ~# free -h
               total        used        free      shared  buff/cache   available
Mem:           7.5Gi       1.3Gi       3.5Gi       2.1Gi       2.6Gi       3.8Gi
Swap:             0B          0B          0B
root@ip-172-31-47-174 ~# echo 3 > /proc/sys/vm/drop_caches
root@ip-172-31-47-174 ~# free -h
               total        used        free      shared  buff/cache   available
Mem:           7.5Gi       1.3Gi       3.7Gi       2.1Gi       2.4Gi       3.9Gi
Swap:             0B          0B          0B
root@ip-172-31-47-174 ~# free
               total        used        free      shared  buff/cache   available
Mem:         7833520     1376608     3917368     2160524     2539544     4059944
Swap:              0           0           0
```



## 分析和答案

**分析：** 开始的时候我并没有发现具体有什么问题， 认为是应用程序确实无法回收cache的空间，因为正在使用。

例如Firefox启动的时候就会使用Cache的空间来进行数据的存储。  

**答案：** 第二天看到了大佬的更新， 这个问题的原因是： **内核会将 shared 的空间， 一并统计在 buffer/cache** 中， 所以free命令的输出是正常的， 实际cache已经释放了一部分，没有大幅度变化的原因是因为那部分是 shmem的空间， 所以。。。释放不掉。  

---

初见这个结论是有些震惊的， 我一直都认为 shared 字段里面统计的内存是独立的， 仔细看看上面的命令， 确实 shared空间基本上与 buffer/cache的空间是差不多的。  

## 测试   

一部分信息：   

- OS: Arch Linux x86_64  

- Kernel: 6.3.1-arch2-1  

* Software Version: free from procps-ng 3.3.17  

测试的方法， 我只是尝试证明free命令的统计方式变化， 所以直接简化了， 直接扩大ShareMemory。  

```bash
# 直接创建一个临时的目录
# 其实直接使用 /dev/shm 也行， 但是可用空间会被限制到 物理内存的一半。
sudo mkdir /mnt/tmpfs/ 

# 挂载到 /mnt/tmpfs/
sudo mount -t tmpfs -o size=5000m shared /mnt/tmpfs/

# 创建一个文件占用那个部分的内存。
sudo fallocate -l 4G /mnt/tmpfs/file
```

按照上面的步骤测试， 可以发现 share memory 确实也同时被统计在了 buffer/cache 里面， 与客户的现象完全一致。这个命令确实就是这样工作的。  

按照这个思路应该看看meminfo 以及 内核的文档，Mark一下准备开始走一遍这个思路。   

立刻查看free命令的manpage， 发现果然没有更新， 说明摘要： 

>shared 
>Memory used (mostly) by tmpfs (Shmem in /proc/meminfo)
>
>buffers
>Memory used by kernel buffers (Buffers in /proc/meminfo)
>
>cache  
>Memory  used  by  the  page  cache  and  slabs  (Cached  and SReclaimable in /proc/meminfo)
>
>buff/cache
>Sum of buffers and cache

看 /proc/meminfo ， 发现确实是取值取到了 shmem， 这个值是对的， 现在的问题就是为什么内核提供了这样的一个值。

```bash
sudo cat /proc/meminfo | grep -Ei "mem|cache|buffer|active"
MemTotal:        7833520 kB
MemFree:         4417692 kB
MemAvailable:    4615060 kB
Buffers:               0 kB
Cached:          2550368 kB  # 这个的统计就。。。。 free是对的
SwapCached:            0 kB
Active:           830560 kB
Inactive:        2397160 kB
Active(anon):     444220 kB
Inactive(anon):  2385016 kB
Active(file):     386340 kB
Inactive(file):    12144 kB
Shmem:           2151884 kB  # 这个是创建的文件大小，转换成文件的大小， 差不多是 2G 左右。
```

现在的问题变成， 具体是什么时候 meminfo里面的值变更了统计方式呢？ 为什么这样统计呢？ 

不会找具体是什么时候commit的变更， 直接看代码吧。 希望我看的是对的。 

```c
// https://elixir.bootlin.com/linux/latest/source/fs/proc/meminfo.c
static int meminfo_proc_show(struct seq_file *m, void *v)
{
	struct sysinfo i;
    ...
	cached = global_node_page_state(NR_FILE_PAGES) -
			        total_swapcache_pages() - i.bufferram;
	if (cached < 0)
		    cached = 0
    ...
    show_val_kb(m, "MemTotal:       ", i.totalram);
	show_val_kb(m, "MemFree:        ", i.freeram);
	show_val_kb(m, "MemAvailable:   ", available);
	show_val_kb(m, "Buffers:        ", i.bufferram);
	show_val_kb(m, "Cached:         ", cached); 
	show_val_kb(m, "SwapCached:     ", total_swapcache_pages());
	show_val_kb(m, "Active:         ", pages[LRU_ACTIVE_ANON] +
					   pages[LRU_ACTIVE_FILE]);
	show_val_kb(m, "Inactive:       ", pages[LRU_INACTIVE_ANON] +
					   pages[LRU_INACTIVE_FILE]);
	show_val_kb(m, "Active(anon):   ", pages[LRU_ACTIVE_ANON]);
	show_val_kb(m, "Inactive(anon): ", pages[LRU_INACTIVE_ANON]);
	show_val_kb(m, "Active(file):   ", pages[LRU_ACTIVE_FILE]);
	show_val_kb(m, "Inactive(file): ", pages[LRU_INACTIVE_FILE]);
	show_val_kb(m, "Unevictable:    ", pages[LRU_UNEVICTABLE]);
	show_val_kb(m, "Mlocked:        ", global_zone_page_state(NR_MLOCK));

```

可以看到从一个sysinfo 的 struct 取出, 然后进行计算， 存储在cached 变量里面，然后输出： 

```c++
// https://elixir.bootlin.com/linux/latest/source/include/uapi/linux/sysinfo.h#L14

	__kernel_ulong_t bufferram;	/* Memory used by buffers */
```

好了 我看不动了，Cached 的最后结果： os所有可用的文件页面 - SwapCached的数值 - Buffers的数值，大概应该是这个意思， 按照这个算法就算不对啊......就先这样吧。

更多的部分看参考链接吧，对了答案 顺便看了讲解，大佬讲的清楚。



## 参考链接

https://zhuanlan.zhihu.com/p/586107891

https://www.cnblogs.com/tsecer/p/16290025.html





