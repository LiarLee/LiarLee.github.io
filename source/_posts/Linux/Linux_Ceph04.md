---
title: Ceph Cluster 04 - CRUSH算法
date: 2021-09-01 22:29:26
tags: Ceph
categories: Linux
---

ceph笔记04

<!-- more -->

# 修改CRUSH算法的分配方式
## 基础概念： 
### 五种运行图： MON服务维护
1. Monitor Map - 监控的运行图 MON的状态
2. OSD Map - OSD的状态， 每隔六秒钟汇报一次状态
3. PG Map - PG的运行图， PG的状态和映射关系
4. CRUSH Map - 一致性hash算法，和数据块和osd的分配关系， 动态更新，当客户端请求一个文件的时候，会通过CRUSH算法会根据osd的map创建PG组合的来对文件的存储进行负载和分配。假如有20个osd，创建32重组合分配对应的pg和osd的对应关系，选主从，选分布方式和节点的同步关系，叫做CRUSH Map。
5. MDS Map - Metadata Map ，元数据和数据文件的映射关系。
### 5种算法对节点的选择方式
1. Uniform
2. List 
3. Tree
4. Straw - 早期的版本，分布不是特别的均衡，抽签算法
5. Straw2 - 目前已经发展中的版本， 抽签算法 （Default）

## 对PG的动态调整
默认情况下是动态调整的，但是可以手动调整为给予权重，设置PG分配的倾向，例如1T权重是1，等等等等
### 查看状态以及调整方式
ceph osd df 
需要关注的值有两个：
- weight - 根据磁盘的空间进行的调整，默认自动计算， 可调。
- reweight - 磁盘的所有权重相加之后， 单个osd所占用的比例，由于默认的分配是相对概率的平衡，所以分配可能还是会有一些不均衡，通过这个可以进行再次的平衡。

调整的效果就是希望立刻重新平衡PG的数量(需要注意在业务负载低的时候执行) 数据均衡分配。迫使算法动态的更新PG的位置。

1. 调整WEIGHT的值
ceph osd crush reweight osd.10 {WEIGHT} # 调整weight值， 越大权重越高，分配的PG数量越大。

2. 调整REWEIGHT
ceph osd crush reweight {OSD_ID} {REWEIGHT} # 范围是 0 - 1， 也是越大权重越高。

### 对运行图进行操作
1. 创建一个保存运行图的目录
mkdir /cephmap/ceph -p 
ceph osd getcrushmap -o /cephmap/ceph/crushmap  # 同时可以做备份使用，将运行图导出到文件中，当需要的时候可以通过这个文件还原。
2. 转换map的二进制格式为文本，Ubuntu 需要安装 crushbase 包。
crushtool -d /cephmap/ceph > /cephmap/ceph/crushmap.txt
3. 编辑这个文件
主要编辑type部分， 按照不同的调度需求，
按照不同的osd，不同主机调度，不同的机架，不同的机柜，不同的PDU，不同的房间，不同的数据中心， 不同的区域城市， 顶层。
下面是主机的配置部分。每个主机的算法，osd的分配情况，权重。
Rules 副本池的规则里面定义了 
step take default  基于default配置端里面的规则来进行osd的分配。
step chooseleaf firstn 0(按照顺序选择，先选到的就是) type host（按照什么类别进行选择高可用的类型）
max_size 副本池配置文件之中可以定义副本数
4. 转换成二进制文件
crushtool -c /cephmap/ceph/crushmap.txt -o /cephmap/ceph/crushmap_new 
5. 导入查看是否生效
ceph osd setcrushmap -i /cephmap/ceph/crushmap_new
6. 查看是否生效
ceph osd crush rule dump
7. 创建一个存储池 
ceph osd pool create magedu-ssdpool 32 32 magedu_ssd_rule
ceph pg ls-by-pool  magedu-ssdpool | awk '{print $1,$2,$15}' 


#### 分机械盘和固态盘调整运行图的配置




