
在Redis内存与物理内存mapping由操作系统的虚拟内存管理器 和 指定的内存分配器进行处理。

关于Info指令的所有参数的解释： 
https://redis.io/commands/info/

```bash
localhost:6379> info memory
# Memory
used_memory:938464
used_memory_human:916.47K # Redis 存储数据的使用量
used_memory_rss:10747904
used_memory_rss_human:10.25M # Redis 常住内存集的用量
used_memory_peak:1134048
used_memory_peak_human:1.08M # Redis 的内存峰值
used_memory_peak_perc:82.75% 
used_memory_overhead:888488
used_memory_startup:865904
used_memory_dataset:49976
used_memory_dataset_perc:68.88%
allocator_allocated:1479168  # 内存分配器已经分配的量
allocator_active:1601536
allocator_resident:4575232 
total_system_memory:8182751232
total_system_memory_human:7.62G # 系统内存的总量
used_memory_lua:31744
used_memory_vm_eval:31744
used_memory_lua_human:31.00K # Lua 引擎的内存使用量
used_memory_scripts_eval:0
number_of_cached_scripts:0
number_of_functions:0
number_of_libraries:0
used_memory_vm_functions:32768
used_memory_vm_total:64512
used_memory_vm_total_human:63.00K
used_memory_functions:184
used_memory_scripts:184
used_memory_scripts_human:184B
maxmemory:0  # Max Memory 当前的配置
maxmemory_human:0B
maxmemory_policy:noeviction
allocator_frag_ratio:1.08
allocator_frag_bytes:122368
allocator_rss_ratio:2.86
allocator_rss_bytes:2973696
rss_overhead_ratio:2.35
rss_overhead_bytes:6172672
mem_fragmentation_ratio:11.46
mem_fragmentation_bytes:9809640
mem_not_counted_for_evict:0
mem_replication_backlog:0
mem_total_replication_buffers:0
mem_clients_slaves:0
mem_clients_normal:22400
mem_cluster_links:0
mem_aof_buffer:0
mem_allocator:jemalloc-5.3.0
active_defrag_running:0
lazyfree_pending_objects:0
lazyfreed_objects:0
localhost:6379> exit
```
# 内存结构
Redis的内存中主要是如下数据： 
## 用户数据
    用户数据是作为内存的数据库的关键，也是占用Mem最多的部分， 计算在 used_memory  中。 数据 和 数据结构。
## 自身进程的内存
      这部分是Redis自己占用的内存， 代码， 常量池等等。
## 缓冲区
[三大缓冲区](https://www.cnblogs.com/mainwoods/p/15064949.html)
	1. 客户端缓冲区
		1. 输入缓冲区: 客户端输入指令Buffer， 输入缓冲区默认是每客户端 1GB， 不计入maxmemory,  无法配置。
		2. 输出缓冲区: 返回响应结果的Buffer， 可以调整输出缓冲区的大小。 通过 `client-output-buffer-limit` 配置
		```shell
			client-output-buffer-limit <class> <hard limit> <soft limit> <soft seconds>
			client-output-buffer-limit normal 0 0 0 # 会被限制在maxmemory中
			client-output-buffer-limit slave 256mb 64mb 60  # 不会限制在maxmemory
			client-output-buffer-limit pubsub 32mb 8mb 60  # 客户使用Pub/Sub Channel 的时候会用， 比较少看到客户使用
		```
         Usedmemory 大于 Maxmemory   原因是 SlaveCOB 不计算 Maxmemory， 不会触发Evcation。
	2. 复制缓冲区 
		1. 复制缓冲区: 主要是全量复制的时候使用的空间. 主从同步的时候使用的是 COB 缓冲区。
		2. 复制积压缓冲区:  增量同步的缓冲区， 使用参数 `repl-backlog-size` 配置， 控制是否是增量或者全量同步。 backlog 越大， 越容易进行增量。
	3. AOF 缓冲区（这玩意儿好像Ecache里面没有.
		1. AOF缓冲区： 写AOF日志异步落到磁盘的Buffer
		3. AOF重写缓冲区: AOF重写流程中使用的Buffer
https://oss-emcsprod-public.modb.pro/wechatSpider/modb_20210621_e018a38e-d26a-11eb-b77e-00163e068ecd.png
## 内存碎片
内存碎片有外部碎片 和 内部碎片： 
- 外部碎片指os分配内存的时候造成的碎片， 这个部分的碎片主要是和os申请的时候才会出现。 （ 测试的过程中发现， 如果Key过期了， 那么redis是会将内存归还给os的， 那么下次再使用的时候还是会有新的碎片。）
- 内部碎片是 redis 使用的Memory Allocator 分配造成的碎片。 
- 参数组中可以有autodefrag参数可以触发Redis 主进程的内存规整。

# 一些参数
## Used Memory
```bash
used_memory:938464
used_memory_human:916.47K
```

这里面的指标包括了如下的数据： 
  KeyValue 的存储，用户数据。 
  InternalOverload: 内部开销， 表示Redis支持的数据类型的信息。
  
## RSS
```bash
used_memory_rss:10747904
used_memory_rss_human:10.25M

From OS: RSS KB
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
999         9694  0.0  0.1  55588 10496 pts/0    Ssl+ 14:48   0:00 redis-server *:6379
```
RSS指标记录的是操作系统已经分配给 RedisInstance 的物理内存大小， rss的这个指标还包括了内部碎片。
造成内存碎片的原因是：操作系统低效的内存分配行为。

## Max Memory
```bash
maxmemory:1103269725
maxmemory_human:1.03G
```

Max Memory 包括哪些部分
根据Redis的文档，MaxMemory的限制主要影响以下几个方面的内存：
- Redis中存储的键值对数据，包括字符串、列表、集合、哈希表、有序集合等类型。
- Redis中使用的数据结构和对象，例如字典、跳跃表、压缩列表、整数集合等。

Ecache 的MaxMemory 是基于节点类型的固定数值， 无法修改。

设置MaxMemory的方法
```bash
localhost:6379> CONFIG GET maxmemory
1) "maxmemory"
2) "100000000"
localhost:6379> CONFIG SET maxmemory 2G
OK
localhost:6379> CONFIG GET maxmemory
1) "maxmemory"
2) "2000000000"
```

底层的物理内存不能很容易的被操作系统释放， 因为可能需要删除的数据 与 依旧有效并使用中的数据 在相同的物理内存页中。
因此redis会在需要的时候分配内存， 在回收的时候进行程序侧的回收， 并不将内存完全free给操作系统。内存分配器会尽可能的使用RSS已经分配给程序的内存。
如果需要做内存预留， 那么应该基于历史的峰值来进行调整。 

```bash
used_memory_peak:1134048
used_memory_peak_human:1.08M
used_memory_peak_perc:82.75%
```

## mem_fragmentation_ratio
```bash
mem_fragmentation_ratio:11.46
mem_fragmentation_bytes:9809640
```
Memory Fragmentation Ratio = Used Memory RSS / Used Memory
内存碎片比率： 
Memory Fragmentation Ratio < 1   # 表示已经有数据被写入交换分区，这通常是一个异常的指标。
Memory Fragmentation Ratio > 1  # normal
Memory Fragmentation Ratio > 1.5   # normal

指标计算的方式导致可能并不能准确的体现发生的问题， 现在比较新的版本更加推荐查看下面的指标： 
```bash
allocator_frag_ratio:1.08
allocator_frag_bytes:122368
allocator_rss_ratio:2.86
allocator_rss_bytes:2973696
```

### 解决内存碎片的方法
1. Restart Redis. 
2. 修改参数， 激活Redis的自动碎片整理在参数组中开启。**activedefrag** 开启这个参数可能会造成延迟变高， 由于内存的整理也是需要在内存中进行数据迁移和调整的。
*3.  Limit memory swapping( 这个没看懂。*
4.  改变内存分配器（ 指升级Redis的版本

或者
当存储的数据长短差异较大时， 以下场景容易出现高内存碎片问题：

- 频繁做更新操作， 例如频繁对已存在的键执行append、 setrange等更新操作。
- 大量过期键删除， 键对象过期删除后， 释放的空间无法得到充分利用， 导致碎片率上升。

出现高内存碎片问题时常见的解决方式如下：

- 数据对齐： 在条件允许的情况下尽量做数据对齐， 比如数据尽量采用数字类型或者固定长度字符串等， 但是这要视具体的业务而定， 有些场景无法做到。
- 安全重启： 重启节点可以做到内存碎片重新整理， 因此可以利用高可用架构， 如Sentinel或Cluster， 将碎片率过高的主节点转换为从节点， 进行安全重启。

# 内存驱逐
当 Redis 内存使用达到 `maxmemory` 时，需要选择设置好的 `maxmemory-policy` 进行对老数据的置换。

下面是可以选择的置换策略：
The following policies are available:
    noeviction： 达到内存限制时不保存新值。当数据库使用复制时，这适用于主数据库
    allkeys-lru： 保留最近使用的键值；删除最近使用最少（LRU）的键值
    allkeys-lfu： 保留经常使用的key；删除最不经常使用（LFU）的key
    volatile-lru： 删除过期字段设置为 true 的最近最少使用的key。
    volatile-lfu： 删除过期字段设置为 true 的最不常用key。
    allkeys-random： 随机删除key，为新添加的数据腾出空间。
    volatile-random： 随机删除过期字段设置为 true 的key。
    volatile-ttl： 删除过期字段设置为 true 且剩余生存时间（TTL）值最短的key。

如果没有指定TTL， 那么volatile的驱逐规则就相当于 noeviction.

key过期回收
Redis有两种方式：
1. Lazy Way： 当请求这个key 发现他已经过期的时候， 清理。
2.  Active Way:  每100ms过期一小部分key。

主动过期的方式每100ms扫描20个key（带有 TTL 的）， 也就是每秒可以扫描200个key标记为过期。如果依旧有超过25%的key被标记为过期，那么就再来一次。

如果过期的时间比较合理， 那么大约会有25% 左右的key处于过期的状态。 

可以使用scan指令来尝试访问key，scan到的key如果已经过期会被回收。
```sh
SCAN 0 MATCH *example* COUNT 20000
```

预留内存： 通常是 25% ， 保留用来进行备份， bgsave 来使用。 
# 交换
内核使用交换空间的两个情况：
1. 系统处于内存压力下。
2. 有些内存页面已经很长时间没有被访问了， 内核会将这些页面放入交换中，通常在Redis上不会发生。

可能导致使用swap的场景： 
1. 需要存储的数据超过物理内存的总量， 或者由于COB的使用率过高。
2. 高内存碎片。
3. 较高的连接数。
4. 系统进程或者RBD AOF写入大文件， 给系统增加了压力， 导致使用了交换分区。

通常情况使用交换是一定会发生的， 并且是正常的， 不会导致性能的下降， 因为swap指标收集的是操作系统指标， 包括非Redis内的数据被换出的情况， 通常可以使用 maxmemory_human  大于 used_memory_rss_human  来进行判断， 或者是 内存碎片 mem_fragmentation_ratio 小于 1. 

Refer:
1. https://www.jianshu.com/p/d39f087850c9
2. Understand VMM: https://www.kernel.org/doc/gorman/html/understand/
3. Understand Memory Fragmention: https://jacktang816.github.io/post/memoryfragmentation/