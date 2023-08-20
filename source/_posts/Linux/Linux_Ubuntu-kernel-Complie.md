---
title: Ubuntu 18.04 内核编译初试
date: 2021-07-01 12:48:29
categories: Linux
tags: Linux, Kernel
---

Ubuntu 18.04 上编译内核，生成deb安装包的过程和遇到的问题。 
使用工具： Linux-tkg 
系统版本： Ubuntu18.04 
内核版本： 5.12-muqss-6ms-skylake
# 背景说明

看到B站大佬的教学视频， 使用Linuxtkg进行内核的编译打包和添加muqssCPU调度器， 想自己尝试一下， 同时熟悉一下Ubuntu常见的工具链，所以就开始做了这个事情。

1. 首先是需要对系统进行初始化， 需要一些底层的工具包。 在Ubuntu上面还是有些问题的， 这个坑自己踩了。

   ```bash
   ]$ sudo apt install zstd git wget sudo bc rsync kmod cpio libelf-dev build-essential fakeroot libncurse5-dev libssl-dev ccache bison flex qtbase5-dev kernel-package
   ```

   NOTE: 这里面我遇到少了pkg但是没有明确报错的是：**zstd & kernel-package** ，这两个如果没有正确的安装报错是比较模糊的， 完全不能定向到问题是缺少了这两个包。 （而官方的手册中也没有写需要安装kernel-package就比较坑爹

2. 之后就是下载Linux-tkg ，建议直接从Github下载， [Linux-tkg official address](https://github.com/Frogging-Family/linux-tkg)

   ```bash
   ]$ git clone https://github.com/Frogging-Family/linux-tkg.git
   ```

3. 在clone完成之后， 执行下面的./install.sh config, 按照提示回答相关的问题。 
4. 或者可以直接编辑其中的customization.cfg来设置默认的参数。（这个文件中都是有说明的，还算是比较详细， 一般可以直接看懂。 
5. 回答完成问题之后会生成对应的config文件。
6. 执行./install.sh install， 之后会有几个不同的发行版的选择， 只需要选择自己需要的即可， 如果是Deb系的会自动启动编译命令 make -j32 deb-pkg ,自动生成的软件包在./DEBS/*.deb.直接安装即可。如果是rpm也会生成RPMS。
7. 如果中途报错 ， 我也不知道具体的处理方式。目前发现的问题如下：
   1. 不同版本的ubuntu 表现是不同的， 震惊！ 同样的设置参数 ，同样的内核代码和补丁，在Ubuntu 18.04 和 20.04 ， 20.04 会成功。
   2. 不同环境的结果是不同的， 在一台服务器上面 起Docker容器进行初始化之后编译 会成功的。 在笔记本上不一定会成功。 
   3. 目前没有总结出任何的相关规律， 太任性了只能说。 
   4. 如果是不打包成deb，目前的成功率是100%（包括直接将文件释放到系统中， 和打成rpm）。

---

现在能想到的差不多这些吧 ， 反正编译出错就是dpkg-package ERROR 2 ， 我现在满脑子都是ERROR 2了， 告辞。

