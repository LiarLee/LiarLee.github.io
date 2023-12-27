---
title: archlinux 使用 tailscale + Sunshine 串流
category: Linux
date: 2023-12-27 11:15:31
tags:
  - Steam
  - EC2
  - Nvidia
---

接上面的测试， 既然显卡都已经能用了， 为啥不能直接启动一个steam呢？ 于是。。。 

---
安装的步骤比较简单： 
```shell
# Sunshine 用来作为 stream hosting
sudo pacman -S sunshine

# Steam 以及 Steam-navtive 是 steam 的runtime， ttf 是为了可以正常的显示中文字体， 好像字体上面是最常见的问题， 比如显示出来是一堆方块。
sudo pacman -S steam-native-runtime
sudo pacman -S steam ttf-liberation
```

这些安装完成之后我自己直接 drun 去调用 steam 就可以了。 

启动使用的desktop 文件叫作 `steam(native)` 启动之后登录， 然后可以正常下载游戏了。 

默认可以下载的游戏都是原生支持linux的， 不支持的可以在steam的设置里面打开proton兼容， 之后steam的界面上就不会区分任何平台了。 
