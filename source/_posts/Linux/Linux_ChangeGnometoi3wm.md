---
title: i3wm的简单配置
date: 2019-10-22 15:09:59
tags:
  - Linux
categories: Linux
---

将自己的桌面环境迁移到了i3。Gnome好用是好用的，但是体量还是有点儿大了，吃资源有点多。

这个现在已经更新到 DWM上面了， 对于这里面还有其他的工具是一直在用的 ， 比如 picom 等等。 

# 安装i3-gaps

安装的过程比较简单,pacman 就完事儿了。

```shell
pacman -Syyu 
pacman -S i3-gaps
	这里有两个可以选择，一个是i3-wm,  还有一个是i3-gaps, 我用了i3gaps， 好看一些。
pacman -S alacritty 
pacman -S polybar
pacman -S compton (最新的软件改名了，叫picom,但是安装的方式不变的。)
pacman -S picom
pacman -S dmenu
pacman -S rofi
pacman -S feh 
pacman -S variety
pacman -S unzip-natspec  
#unzip-natspec貌似是在archlinuxcn里面的，可以处理zip解压的时候乱码的问题，不用考虑手动指定解压的-O了。
```

# 配置i3

在已经有Gnome环境的条件下，i3 的配置还是比较轻松的。

## I3的使用说明

i3默认的操作是**使用Windows/Super/Mod**这个按键(或者随便怎么叫吧，后面都说**Super**，和Gnome的口径一致)，简单列举一下频率较高的**使用方式**

1. 先说**重载配置文件**，使用 Super + Shift + r 
2. **退出到DM**，使用Super + Shift + e， DM就是你的登录界面。
3. i3提供了10个虚拟桌面，**切换虚拟桌面方式**是可以通过Super + 1 - 10 快速切换
4. 在默认的**Tiling排列模式**中**切换排列位置**Vertical和Horizontal. 通过Super V 或者 Super H
5. **调整容器布局**：
   1. **使用Stacking** -- Super + s 所有的标签堆叠显示最上方提供标签进行切换
   2. **使用Tabbed** -- Super + w 标签页方式显示所有窗口
   3. **使用Toggle** -- Super + e 平铺窗口模式，可切换不同的布局方式
6. **打开程序**可以通过terminal开启，或者Super + d 使用dmenu开启（可将 dmenu 替换成 rofi）
7. **关闭程序**可以通过Super + Shift + q关闭，或者鼠标点击x，不是所有的窗口都有x
8. 在**窗口间移动**可使用 Super + {jkl;}四个按键；或者使用Super + {up,down,left,right}的arrowkey
9. 可将**窗口变更为Floating**， 使用Super + Shift + Space
10. **Floating窗口调整位置**可长按Super 使用鼠标拖动调整位置
11. **全屏程序**使用 Super + f

## i3的自定义配置

### 配置文件的位置

配置文件的路径： $HOME/.config/i3/config,**所有的配置在这个文件下修改**

### 自定义界面的设置

默认的i3启动的时候还是挺丑的，我有四个设置：

```
gaps inner 5  # 设置i3窗口间的空隙大小，单位是像素。
new_window 1pixel # 设置新的窗口的边界宽度，效果是不显示窗口的title。
new_float 1pixel	# 新的浮动窗口的边界宽度，同上。
smart_borders on 	# 在只有一个窗口的情况下自动最大化当前的窗口，不处理窗口的Gap。
```

### 默认terminal程序更改

设置默认使用 Super + Enter 打开alacritty

```
bindsym $mod+Return exec --no-startup-id alacritty
```

alacritty 是一个使用GPU进行渲染的terminal模拟器，它有自己的配置文件，我的**配置文件路径**在:$HOME/.config/alacritty/alacritty.conf

*NOTE： 关于Alacritty的问题目前已经解决的差不多了。 还有还有一个问题是关于ssh过去之后不能正确的识别终端类型的BUG，解决方案在后面。

### 默认打开Firefox

我的设置是Super + p

```
bindsym $mod+p exec --no-startup-id firefox
```

### 开机启动一些程序

我的开机启动了 Compton, Variety, Remmina,Aria2c, Polybar, ibus-daemon，剩下的看自己喜欢什么就安装什么就OK了。

```
exec_always --no-startup-id compton --config /home/liarlee/.config/compton/compton.conf -b
exec_always --no-startup-id variety 
exec_always --no-startup-id remmina
exec_always --no-startup-id aria2c --conf-path=/home/liarlee/.aria2/aria2.conf
exec_always --no-startup-id sh /home/liarlee/.config/polybar/polybar_startup.sh
exec_always --no-startup-id ibus-daemon -dr
```

### 截屏功能快捷键

默认的i3不能用PrintScreen我觉得有点儿难受，所以自己添加了快捷键和保存位置

```
bindsym --release Print exec "scrot -b -m /home/liarlee/Pictures/Scort_ScreenShot/screenshot.png"
```

---

**更新**：

之前的这个方式可以作为截图的快捷方式，但是当你需要连续的截图的时候就会特别的难受，因为新截图会自动覆盖掉旧的截图。更新一下新的方式，写一个脚本，当我们按下PrintSc的时候触发这个脚本，就可以对文件重命名了。

1. 也许脚本名称可以叫 - screenshot.sh

```shell
#!/bin/bash

snapdate=`date "+%Y%m%d_%H%M%S"`
gnome-screenshot -f /home/hayden/screenshot/Screenshot-$snapdate.png
```

2. 更新i3的配置文件，添加快捷键的管理。

```shell
bindsym --release Print exec "/home/liarlee/Scripts/System/screenshot.sh"
```

3. 这样再截图就会保存到指定的位置，并且用时间命名区分开不同的截图，不会覆盖了。

### 调节音量快捷键

由于已经有了PulseAudio， 所以i3自动增加了笔记本Func-key的调整，但是如果没有功能键的话，还是要按照如下自定义的。我**调整音量**用的Super + F2/F3, 也可以改其他的

```
# Use pactl to adjust volume in PulseAudio.
bindsym XF86AudioRaiseVolume exec --no-startup-id pactl set-sink-volume @DEFAULT_SINK@ +10% && $refresh_i3status
bindsym $mod+F3 exec --no-startup-id pactl set-sink-volume @DEFAULT_SINK@ +10% && $refresh_i3status
bindsym $mod+F2 exec --no-startup-id pactl set-sink-volume @DEFAULT_SINK@ -10% && $refresh_i3status
bindsym XF86AudioLowerVolume exec --no-startup-id pactl set-sink-volume @DEFAULT_SINK@ -10% && $refresh_i3status
bindsym XF86AudioMute exec --no-startup-id pactl set-sink-mute @DEFAULT_SINK@ toggle && $refresh_i3status
bindsym XF86AudioMicMute exec --no-startup-id pactl set-source-mute @DEFAULT_SOURCE@ toggle && $refresh_i3status
```

### 拼音输入法

我在Gnome下使用的是Ibus-rime框架的小鹤双拼，Gnome下开箱即用，但是i3需要做一些简单的配置，更改一些环境变量。

1. 在自己的家目录 : `touch .xprofile`

2. 添加内容如下：

   ```shell
   export GTK_IM_MODULE=ibus
   export QT_IM_MODULE=ibus
   export XMODIFIERS=@im=ibus
   ```
   
3. 使用source读取配置文件中的环境变量，使环境变量生效。尝试输出`echo $XMODIFIER`查看是否已经生效，输出空值的话ibus还是无法使用。

4. 结合上面的i3配置文件，使用ibus-daemon -dr启动，**不要XIM**。如果你使用了-x启动，在浮动的输入法工具栏中会显示一个禁止的标志，说明拼音未正常工作。

### 配置Polybar

我基本上使用的是默认的Bar配置文件，还比较方便。

1. 复制一个配置文件的模板到家目录的文件夹下：

   ```shell
   cp -p /usr/share/doc/ploybar/config .config/polybar/config
   ```
   
2. 编辑一个启动脚本

   ```shell
   touch polybar_startup.sh
   ```

3. 写入如下内容

   ```bash
   #!/bin/bash
   ## kill all old process of ploybar
   killall -q polybar
   while pgrep -u $UID -x polybar > /dev/null; do sleep 1; done
   
   echo "---" | tee -a /tmp/polybar.log
   polybar example & /tmp/polybar.log 2>&1 &
   echo "Polybar launched"
   ```

   结合上面的**i3配置进行开机自动运行**即可。我觉得默认的这个还行，可以日常使用了，不调整了，太费劲了。

# 目前还未解决的问题

## 无法在terminal中输入中文

目前中文的输入法还是有些问题，**无法在alacritty中输入中文**，可能和ibus的关系比较大，我尝试使用fctix完全没有任何问题，所有的地方都可以输入中文，所以选择什么方式输入中文，各有所好吧。但是，Gnome环境和i3的环境是会冲突的，所以同时安装ibus和fcitx要考虑一下。

---

Alacritty中无法输入中文的问题已经解决了！

> 那么解决的方法如下：
>
> ​	在/etc/profile文件中（或者.zshrc中），添加如下的环境变量
>
> ```shell
> export GTK_IM_MODULE=ibus
> export XMODIFIERS=@im=ibus
> export QT_IM_MODULES=ibus
> ```
>
> 之后 ，
>
> ```shell
> source /etc/profile
> source ~/.zshrc 
> ```
>
> 重新启动alacritty就可以使用了。
>
> 我想root cause是：我的alacritty启动的时候使用的是zshrc的变量，而没有读取系统的变量，不知道是不是这个原因，但是现在已经可以使用了，完美。

---

## SSH之后不能正确的识别Alacritty的终端类型

ssh登录其他机器的时候会报错： **Error opening terminal: alacritty.**

> 这个问题其实是因为Alacritty毕竟是小众的Terminal Emulator， 所以 大部分的机器里面并没有这个类型的终端的信息， SSH在登录之后会试图把登录用户的Terminal设置为Alacritty，这个问题其实配置文件中已经有了解决方法，直接注释配置文件的如下部分，就可以恢复SSH正常使用了。
>
> ```YAML
> env:
>     TERM: xterm-256color
> ```
>
> 解决~

# 放几张最后的结果图

大约就是这个样子啦～　　收工！

---

![screenshot_002.png](https://i.loli.net/2019/10/22/rl7UziNqj1dwuLf.png)
![screenshot_001.png](https://i.loli.net/2019/10/22/HzgEw4v81hlqxSp.png)
![screenshot.png](https://i.loli.net/2019/10/22/xR4gi9FpCoN2qhl.png)