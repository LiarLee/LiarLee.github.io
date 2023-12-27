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

## 手柄支持
手柄默认不能传递到hosting， sunshine 的启动日志里面有报错： 
```shell
[2023:12:27:21:35:33]: Error: Could not create Sunshine Gamepad: Permission denied
[2023:12:27:21:35:33]: Error: Could not create Sunshine Gamepad: Permission denied
```
给予这个报错的搜索结果有两个： 
- 添加当前的用户到 `input` 组里面
 ```shell
 usermod -a -G input ec2-user
 # checking 
 groups ec2-user
```
- 第二个方案是， 确保自己的内核装载 uinput 模块。 
```shell 
modprobe uinput
```
- 同时还在[文档](https://docs.lizardbyte.dev/_/downloads/sunshine/en/latest/pdf/)里面找到了另一个地方，需要配置一个 udev rule
```shell
echo 'KERNEL=="uinput", SUBSYSTEM=="misc", OPTIONS+="static_node=uinput", TAG+="uaccess"' | \
sudo tee /etc/udev/rules.d/85-sunshine.rules
```
或者这[文档](https://github.com/loki-47-6F-64/sunshine/blob/master/README.md) 以及[这个Issue](https://github.com/chrippa/ds4drv/issues/93)

我目前不太确定具体哪个是正确的, 因为重启这个实例的时候把tailscale给玩儿没了.. 现在连不上了...闹心