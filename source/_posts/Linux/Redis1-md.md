---
title: Redis概念
date: 2023-08-30 23:31:09
category: Linux
tags: Linux, Redis, Memory
---

## ElastiCache主要概念
1. ElastiCache nodes
   A node is the smallest building block of an ElastiCache deployment. 
   node is a fixed-size chunk of secure, network-attached RAM.
   总结来说， 就是ec2实例上面跑了相同版本的Engine for Redis。
1. ElastiCache for Redis shards
   ![Explaining Shared](https://docs.aws.amazon.com/zh_cn/AmazonElastiCache/latest/red-ug/images/ElastiCacheClusters-CSN-RedisShards.png) 

   A Redis shard (called a node group in the API and CLI) is a grouping of one to six related nodes. A Redis (cluster mode disabled) cluster always has one shard.
   Redis (cluster mode enabled) clusters can have up to 500 shards, with your data partitioned across the shards.

   Shard 是多个 Nodes 的集合， 或者叫作节点组. 一个Shard包括的节点有不同的角色， 一个Primary 和 最多5个 Replica.

1. ElastiCache for Redis clusters
   A Redis cluster is a logical grouping of one or more ElastiCache for Redis shards. Data is partitioned across the shards in a Redis (cluster mode enabled) cluster.
   集群模式关闭， 1 Cluster -- 1 Shard -- 1 - 6 Nodes: 1 Primary and 5 Nodes
   集群模式开启， 1 Cluster -- 500 Shard -- 1 - 6 Nodes: 1 Primary Per Shard

1. ElastiCache for Redis replication
   Redis (cluster mode disabled) clusters support one shard (in the API and CLI, called a node group).
   Redis (cluster mode enabled) clusters can have up to 500 shards, with your data partitioned across the shards. 

   每个Replica都是Primary中全部数据的复制。 Replica使用异步的方式进行与Primary的数据同步。 

   第一次 psync2 全量复制所有内存当前存储的数据， 后续使用redis的增量复制。 

1. AWS Regions and availability zones
   目前中国区不能使用 GlobalStore， 并且Region之间也是无法相互同步数据的。 在不同的az 之间可以做高可用来降低停机的时间。 
1. ElastiCache for Redis endpoints
   An endpoint is the unique address your application uses to connect to an ElastiCache node or cluster.

   - Redis 禁用集群模式的单节点端点 
   单节点的集群端点用于读取和写入. In one word, Single Primary, read and write at one point.
   **用这个节点的 Endpoint 即可。**
     
   - Redis 禁用集群模式的多节点端点
   多节点有两个不同的端点， Primary 端点总是连接到Primary 节点，故障切换会切换这个dns指向的后端。
   Reader Endpoint 在所有的 Replica节点之间分流Connection 用来提供读取行为。

   **用控制台上面的 Primary Endpoint 和 Reader Endpoint**

   - Redis 启用集群模式的端点
   集群模式下， 只是配置一个endpoint， 但是连接到Endpoint之后， 客户端可以发现所有的主节点和从节点。

   ** 用Configuration Endpoint 可以找到集群内部的每一个 Primary 和 Replica节点 **

1. ElastiCache parameter groups
   Cache parameter groups are an easy way to manage runtime settings for supported engine software. Parameters are used to control memory usage, eviction policies, item sizes, and more.

   简单来说， 创建每一个配置文件在aws的控制台上， 可以调整一部分Redis的参数， 然后可能在集群内可以实时生效， 也可能需要触发一次Failover才能生效。 
   [elasticache的参数管理](https://docs.aws.amazon.com/zh_cn/AmazonElastiCache/latest/red-ug/ParameterGroups.html) 

   通常来说， 改动了参数组中的几个参数可能会需要重启节点： 
   - activerehashing
   - databases

1. ElastiCache for Redis security
   PENDING... Maybe follow offical guide.
   
1. ElastiCache security groups
   创建集群的时候需要指定一个安全组， 需要放行 6379 port， DONE。

1. ElastiCache subnet groups
   子网组是运行 Redis 的所有子网的集合， 创建一个子网， 让托管的节点的把ENI放在这个子网里面， 私有子网。 

1. ElastiCache for Redis backups
   备份特定时间的数据， 可以使用这个用来还原成新的集群， 或者是创建一个集群的种子， 备份中包括所有的data， 和一部分集群的metadata。
   bgsave 或者 forkless save, 这两个取决于是否有足够的内存空间， 当空间充足的时候使用的默认的 bgsave， 但是肯定的是， bhsave 会有性能的开销，所以最好是使用副本节点来创建备份或者快照。 
   对于forkless本身是另一个机制，但是forkless会尝试delay 写入的延迟，从而确保不会积累过多的change 导致内存压力过大失败。 

1. ElastiCache events
   PENDING... Maybe follow offical guide.

## Redis 缓存穿透， 击穿 和 雪崩
### 穿透
主要是指异常的查询请求， 缓存未命中的场景下直接访问后端， 后端承载了大量请求导致的崩溃。
目前看到需要两个条件： 
- 数据在缓存层未命中。 
- 大量的请求转移到了后端。
- 请求的数据可能在缓存层 以及 后端都不存在。 

避免的方法可能有：
- 在redis 前面添加一个 BloomFilter， 在请求进来的时候进行过滤， 对于异常的请求直接拒绝或者返回一个NULL。
- 提前缓存一部分数值为 NULL 的数据， 在缓存层直接接下这些请求。这个本身是有点问题的。

### 击穿
这个概念是指的 **少部分热点数据**被大量的查询时候，  数据突然从缓存中消失， 可能是过期也可能删除等等， 这样有大量的**相同请求**发送到后端。
解决方案： 
- 设置部分数据永远不过期。 
- 后端进行加分布式锁。 

### 雪崩
**批量的热数据过期**， 这时候大部分的请求可能还在继续尝试查询不同的数据，直接将这些请求发送到了后端的数据库， 数据库崩了。
解决方案： 
- 创建多个实例， 和副本来提高可用性。 
- 后端加锁限流。
- 调整过期时间， 让不同的数据过期的时间错开，防止批量的key 相同的时间过期。

> 总结起来就是， 避免缓存在特定的场景下失效， 想各种方法保护缓存的可用性。 

