EBS性能优化的七种武器

Agenda

1. 磁盘调优方法论
2. 常用的磁盘调优方法
3. 磁盘压测工具
4. 磁盘性能检测工具

---

GP3 目前使用量超过了 GP2 ， 是一个成熟的产品。

## 方法论

应用程序 --》 操作系统 --》 虚拟机 --》 EBS 服务器

应用程序IO请求下发的路径。

三个方向， iops， 带宽， 延迟，按照这三个方面， 控制变量做压力测试。

### 使用新版本的内核： 

1. 3.8 以上内核使用的Indirect descriptors
2. 突破 I/O size 44kiB限制， 可以一次请求下发 128KiB的IO大小。
3. 建议使用 amazonlinux 2023 （悲
4. uname -r 查看内核的版本。

### 使用 Raid0 

使用Raid0 可以提高带宽， 并且节省成本。

1. 能更换磁盘类型达到性能， 可以使用Raid0 
2. 不建议在EBS 做 Raid1 5 6 三种， 校验的方式会降低性能。
3. 推荐使用 mdadm ， 不一定要用LVM。

### 关注队列长度

SSD： 每 1000iops 队列长度是 1 ， SSD是合适的吧

观察队列长度， 如果能达到 IOPS 的情况下， 队列越低越好。

HDD： 1MiB的IOsize ， 建议的队列长度 4

降低io队列的方法,取决于发送IO的速度和线程数量。 或者提高磁盘的IOPS

这个人讲得IO队列长度太模糊了。 我不理解。。。。。 🤔。

### HDD吞吐量设计增加预读取大小

For st1/sc1. 

blockdev --report /dev/nvme1n1

查看这个部分的

### 使用NitroSystem

- 之前使用zen的时候有一个Dom0来进行实例的管理。 nitro 做成 Hardware， nitro 管理VPC等等等， 尽可能把 X86 过度给客户来使用。

- 开启EBS优化选项。 非优化的场景下，会与网络请求共享带宽， 单独隔离了EBS的网络请求。

### 使用正确的实例类型

关注实例的限制， 例如实例的上限是 14000 ， 那么实例使用EBS的瓶颈不在磁盘本身， 在实例的性能上限。

底层没有使用tcp'， 使用的协议是 srd ， amazon自己研发的网络传输协议。

## 压测工具

dd 

hdparm 

sysbench

iometer

iozone

推荐fio 

https://fio.readthedocs.io/en/latest/fio_doc.html



ebs设置默认的 Block Size是 16k ， 其他厂商可能是 4k的。 这个部分可能会有差异。

## 观测

```bash
iostat -dmx 3
监控数据来源：  cat /proc/diskstats

rrqm/s wrqm/s  两个看的是的merge的请求数量， 表示操作系统认为当前的IO是不是连续的， 有没有进行合并。

r/s w/s  读写的IOPS每秒的统计， 总计加起来是3000 ， 有时候会高一些， 但是不会高太多。 

rMB/s wMB/s 吞吐量

avgrq-sz  iosize 的大小。

avgqu-sz  队列的数量。 
队列在驱动程序里面会可以设置一个可用的物理参数， 磁盘的队列物理特性，

延迟单位是 ms ，不超过 10ms.
```

10ms IO请求的长尾现象是正常的， 这个无法避免，关于长尾现象的说明： 

​       长尾请求一般是指明显高于均值的那部分占比较小的请求。  业界关于延迟有一个常用的P99标准， 也就是99%的请求延迟要满足在一定耗时以内， 1%的请求会大于这个耗时， 而这1%就可以认为是长尾请求。  

https://zhuanlan.zhihu.com/p/35516682





