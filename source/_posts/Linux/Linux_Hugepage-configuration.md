---
title: 为虚拟机开启内存大页
date: 2020-05-02 15:09:50
tags: Linux
categories: Linux
---

Huge Pages是从Linux Kernel 2.6后被引入的。目的是使用更大的内存页面（memory page size） 以适应越来越大的系统内存，让操作系统可以支持现代硬件架构的大页面容量功能。透明大页（Transparent Huge Pages）缩写为THP，这个是RHEL 6（其它分支版本SUSE Linux Enterprise Server 11, and Oracle Linux 6 with earlier releases of Oracle Linux Unbreakable Enterprise Kernel 2 (UEK2)）开始引入的一个功能。具体可以参考官方文档。

<!-- more -->

这两者有啥区别呢？

- 这两者的区别在于大页的分配机制，标准大页管理是**预分配的方式**，而透明大页管理则是**动态分配**的方式。  

使用大页的目的：

- 增加内存寻址的命中率，如果使用旧的内存分页方式，操作系统需要管理很多很多的小的内存页面，查找和命中的效率比较低。
- 想象一下， 你有一本1000页的书，你需要找到其中的第782页的第20行中的一个“我”字，那么计算机会从第一页开始翻动一页一页的看是否符合要求；现在我将书藉的每100页合成1页，那我们只需要顺序查看10次就可以找到这个字符所在的范围了，之后再去查看这个字符所在的具体位置，速度就会比之前一页一页找快得多。



------

如何启用Hugepage：

1. 设置操作系统可用的最大内存值

   ```
   vim /etc/security/limits.conf
   * soft memlock 8192
   * hard memlock 8192
   ```

2. 设置sysctl.conf

   ```
   # vim /etc/sysctl.conf
   vm.nr_hugepages = 72708
   # sysctl -p
   ```

3. 根据我的测试 ，需要重启才会生效，Hugepage部分的内存会一直属于使用中的内存，并且一直被占用。我的配置用了16G内存之中的8G，所以开机之后，我的8G内存是一直使用中的状态， 无论你的应用是否真正的开始使用了这部分Hugepage.

------

下面举例了如何查看Hugepages的信息：

```
$ cat /proc/meminfo | grep Huge
AnonHugePages:         0 kB
ShmemHugePages:        0 kB
FileHugePages:         0 kB
HugePages_Total:    4096
HugePages_Free:     4096
HugePages_Rsvd:        0
HugePages_Surp:        0
Hugepagesize:       2048 kB
Hugetlb:         8388608 kB
```

我的需求试使用Hugepage来分配给KVM中的虚拟机， 加速虚拟机的内存使用效率，所以当然是在虚拟机的配置文件中配置，编辑虚拟机/etc/libvirt/qemu/HaydenGentoo.xml, 改成如下的样子：

```
<memory unit='KiB'>4194304</memory>
<currentMemory unit='KiB'>4194304</currentMemory>
<memoryBacking>
  <hugepages/>
</memoryBacking>
```

之后重启虚拟机即可。

可以观察到如下改变说明已经在使用了。

```
$ cat /proc/meminfo | grep Huge    
AnonHugePages:         0 kB
ShmemHugePages:        0 kB
FileHugePages:         0 kB
HugePages_Total:    4096
HugePages_Free:     2048
HugePages_Rsvd:        0
HugePages_Surp:        0
Hugepagesize:       2048 kB
Hugetlb:         8388608 kB
```