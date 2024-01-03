---
title: archlinux 配置 xorg 使用 nvidia T4
category: Linux
date: 2023-12-21 13:56:27
tags:
  - AWS
  - EC2
  - Nvidia
---

最近的一个想法，基于之前 hacking 到中国区域的 archlinux， 可以尝试直接改改 xorg， 用用 nvidia 的显卡。

大概折腾了一天， 记录一下步骤和过程。

之前使用的是 Xorg + DWM 的简单架构， 软件非常少。
那么在这个软件的基础上启用显卡和配置xorgserver 使用显卡， 基本上就是这两部分。

## 安装显卡驱动
1. 查看显卡信息
```shell
> lspci
00:1e.0 3D controller: NVIDIA Corporation TU104GL [Tesla T4] (rev a1)
```
2. 安装驱动直接参考archwiki ， 一条命令搞定， 走dkms。安装的这个版本的闭源驱动。
```shell
> pacman -Ss nvidia-dkms
extra/nvidia-dkms 545.29.06-1 [installed]
    NVIDIA drivers - module sources

> pacman -S nvidia-utils

# 启动驱动程序的守护进程。
# 这个如果不开启的话， xrdp 调用 xorg server 的时候 启动会失败， 显示无法找到 nvidia module， 其实不是找不到， 只是由于没有图形化， 所以没有装载。

sudo systemctl enable nvidia-persistenced.service

# 调整显示的分辨率，目前还是手动调整的， 还在改配置文件。 
> xrandr --output DVI-D-0 --mode 1920x1080 --rate 60

```
3. 等pacman自己处理完dkms的模块编译之后， 重启os就可以看到nvidia模块被装载。
```shell
> lsmod | grep nvidia
nvidia_uvm           3481600  0
nvidia_drm            118784  7
nvidia_modeset       1585152  6 nvidia_drm
nvidia              62402560  141 nvidia_uvm,nvidia_modeset
video                  77824  1 nvidia_modeset
> modinfo nvidia
filename:       /lib/modules/6.6.7-zen1-1-zen/updates/dkms/nvidia.ko.zst
alias:          char-major-195-*
version:        545.29.06
supported:      external
license:        NVIDIA
firmware:       nvidia/545.29.06/gsp_tu10x.bin
firmware:       nvidia/545.29.06/gsp_ga10x.bin
srcversion:     8302209549E8FEAC029EDC0
alias:          pci:v000010DEd*sv*sd*bc06sc80i00*
alias:          pci:v000010DEd*sv*sd*bc03sc02i00*
alias:          pci:v000010DEd*sv*sd*bc03sc00i00*
depends:
retpoline:      Y
name:           nvidia
vermagic:       6.6.7-zen1-1-zen SMP preempt mod_unload
```
## 配置xrdp
1. 这里已经可以正常的驱动显卡， 但是xorg不会去调用显卡启动图形，查看了archwiki之后，发现如果使用 xrdp ， 那么还需要重新安装 xrdp 的后端。 需要使用来自aur的后端来匹配nvidia显卡的支
持， 而不是 archlinux 的主仓库里面的默认软件包， 我这边使用的是paru 进行的下面步骤。
    aur 里面的 xorgxrdp，会自动拉取编译 xrdp-git， 因此这里的版本显示和 aur 仓库的不完全一致。
```shell
> paru -Ss xrdp
aur/xorgxrdp-nvidia 0.2.18.r55.g3a4d465-1 [+4 ~0.00] [Installed]
    Xorg drivers for xrdp, with NVIDIA GPU support.
aur/xrdp-git 0.9.18.r565.geb1c3cd4-1 [+30 ~0.01] [Installed: 0.9.18.r599.g9fbe0ad1-1]
    An open source remote desktop protocol (RDP) server. Git version, devel branch.
```
2. 安装完成之后， 需要重启一下系统。
3. 编译安装aur的过程中，最后的步骤里面有一个红色的提示文字， 需要在配置中变更一下xrdp读取的xorg配置文件的位置。
```ini
> cat -n /etc/xrdp/sesman.ini
   130  [Xorg]
   143  param=Xorg
   144  ; Leave the rest parameters as-is unless you understand what will happen.
   145  param=-config
        ; 下面的这两个， 启用nvida的配置文件，注释默认的。
        ; 这里配置的是启动xorg server 的时候读取的配置文件位置 以及 xorg server 的参数。
   146  ; param=xrdp/xorg.conf
   147  param=xrdp/xorg_nvidia.conf
   148  param=-noreset
   149  param=-nolisten
```
4. 之后， 使用 nvidia 提供的 util ， 生成一份nvidia显卡的的配置文件， merge 配置文件里面的这份。
```shell
> nvidia-xconfig -c /etc/X11/xrdp/xorg_nvidia.conf
# 这里面可以不手动备份， 该命令会自动备份之前的配文件， 如果有不同的配置会自动merge。
```
5. 最后，我在这样做完之后， 重启 xrdp ， xorg 确实开始使用显卡了， 但是所有启动的程序不会使用显卡， 默认还是CPU在计算， 这是因为 xorg 的配置文件里面少了 FILE Section, 这个文件的位
置可能会不同，我这边确实在这个位置， 文件存在的情况下直接拿来用了。
```shell
Section "Files"
  ModulePath   "/usr/lib64/nvidia/xorg"
  ModulePath   "/usr/lib64/xorg/modules"
EndSection
```
参考了这个网页中的配置：
  https://forums.developer.nvidia.com/t/glxinfo-command-returning-badwindow-invalid-window-parameter-error/36172

最终的配置文件内容如下：
/etc/X11/xrdp/xorg_nvidia.conf
```shell
> cat -n /etc/X11/xrdp/xorg_nvidia.conf
     1  Section "ServerLayout"
     2  Identifier "XRDP GPU Server"
     3    Screen 0 "dGPU"
     4    InputDevice "xrdpMouse" "CorePointer"
     5    InputDevice "xrdpKeyboard" "CoreKeyboard"
     6  EndSection
     7
     8  Section "ServerFlags"
     9    # This line prevents "ServerLayout" sections in xorg.conf.d files
    10    # overriding the "XRDP GPU Server" layout (xrdp #1784)
    11    Option "DefaultServerLayout" "XRDP GPU Server"
    12    Option "DontVTSwitch" "on"
    13    Option "AutoAddDevices" "off"
    14  EndSection
    15
    16  Section "Files"
    17    ModulePath   "/usr/lib64/nvidia/xorg"
    18    ModulePath   "/usr/lib64/xorg/modules"
    19  EndSection
    20
    21  Section "Module"
    22    Load "xorgxrdp"
    23  EndSection
    24
    25  Section "InputDevice"
    26    Identifier "xrdpKeyboard"
    27    Driver "xrdpkeyb"
    28  EndSection
    29
    30  Section "InputDevice"
    31    Identifier "xrdpMouse"
    32    Driver "xrdpmouse"
    33  EndSection
    34
    35  Section "Screen"
    36    Identifier "dGPU"
    37    Device "dGPU"
    38    Option "DPI" "96 x 96"
    39  # T4 needs an entry here, this is not the desktop size
    40    SubSection "Display"
    41      Virtual 1920 1080
    42    EndSubSection
    43  EndSection
    44
    45  Section "Device"
    46    Identifier "dGPU"
    47    Driver "nvidia"
    48  # T4 may need to comment out next line
    49  # Option "UseDisplayDevice" "none"
    50    Option "ConnectToAcpid" "false"
    51    BusID "PCI:0:30:0"
    52  EndSection
```

6. 排查思路 和 日志的位置。
    - 首先查看 xrdp 的 status， 是不是正常。
    - 排查日志 `/var/log/xrdp.log` ， 这里面记录的是 xrdp 的启动的过程。
    - 如果没有错误， 那么查看 `/var/log/xrdp-sesman.log`, 这里面会记录xorg启动的命令和 xorg 的状态。  可以把日志里面记录的命令复制出来手动执行，直接看命令的输出；  或者查看 xorg 的日志， 看看历史记录了什么错误。
```shell
[2023-12-21T16:50:17.711+0800] [INFO ] Socket 13: connection accepted from AF_UNIX
[2023-12-21T16:50:17.714+0800] [INFO ] Received system login request from xrdp for user: ec2-user IP: ::ffff:10.0.0.0
[2023-12-21T16:50:17.717+0800] [INFO ] starting xrdp-sesexec with pid 37443
[2023-12-21T16:50:17.763+0800] [INFO ] TerminalServerUsers group tsusers doesn't exist. Access granted for ec2-user
[2023-12-21T16:50:17.765+0800] [INFO ] Access permitted for user: ec2-user
[2023-12-21T16:50:17.766+0800] [INFO ] Received sys login status for ec2-user : logged in
[2023-12-21T16:50:17.768+0800] [INFO ] Received request from xrdp to create a session for user ec2-user
[2023-12-21T16:50:17.789+0800] [INFO ] Starting X server on display 10: Xorg :10 -auth .Xauthority -config xrdp/xorg_nvidia.conf -noreset -nolisten tcp -logfile .xorgxrdp.%s.log
[2023-12-21T16:50:19.922+0800] [INFO ] X server :10 is working
[2023-12-21T16:50:19.923+0800] [INFO ] Starting window manager for display :10
[2023-12-21T16:50:19.924+0800] [INFO ] Starting the xrdp channel server for display :10
[2023-12-21T16:50:19.925+0800] [INFO ] Using the default window manager on display 10: /etc/xrdp/startwm.sh
[2023-12-21T16:50:19.926+0800] [INFO ] Session in progress on display :10. Waiting until the window manager (pid 37458) exits to end the session
```

  - 最后， xorg 的日志在命令的输出中 `-logfile .xorgxrdp.%s.log`， 是这样的一个文件。

> NOTE：我的图形化启动的用户是： `ec2-user` ,那么默认的日志就在 `/home/ec2-user/.xrogxrdp.10.log` 这个文件里面， 如果启动xrdp报错就查看这个日志，我这边看到目前可以用， 还有其他的兼容性问题， 有报错。 

## Update
调整了一部分配置， 解决了： 
1. 启动的时候xrdp不能正常的初始化 xorg server， 会报错， 启动 nvidia daemon 进程， 如上。 
2. 启动之后， 显示设备分辨率会被设置成 1024x768 ， 需要使用xrandr命令调整， 这部分最终的配置文件如下： 
```ini
> cat ./xorg_nvidia.conf
# nvidia-xconfig: X configuration file generated by nvidia-xconfig
# nvidia-xconfig:  version 545.29.06

Section "ServerLayout"
    Identifier     "XRDP GPU Server"
    Screen      0  "dGPU" 0 0
    InputDevice    "xrdpMouse" "CorePointer"
    InputDevice    "xrdpKeyboard" "CoreKeyboard"
EndSection

Section "Files"
    ModulePath      "/usr/lib64/nvidia/xorg"
    ModulePath      "/usr/lib64/xorg/modules"
EndSection

Section "Module"
    Load           "xorgxrdp"
    Load           "glx"
    Load           "extmod"
    Load           "dbe"
    Load           "type1"
    Load           "freetype"
EndSection

Section "ServerFlags"
  # This line prevents "ServerLayout" sections in xorg.conf.d files
  # overriding the "XRDP GPU Server" layout (xrdp #1784)
    Option         "DefaultServerLayout" "XRDP GPU Server"
    Option         "DontVTSwitch" "on"
    Option         "AutoAddDevices" "on"
EndSection

Section "InputDevice"
    Identifier     "xrdpKeyboard"
    Driver         "xrdpkeyb"
EndSection

Section "InputDevice"
    Identifier     "xrdpMouse"
    Driver         "xrdpmouse"
EndSection

Section "Monitor"
    Identifier     "Monitor0"
    VendorName     "Unknown"
    ModelName      "NVIDIA VGX"
    Option         "DPMS" "false"
EndSection

Section "Device"
# T4 may need to comment out next line
# Option "UseDisplayDevice" "none"
    Identifier     "dGPU"
    Driver         "nvidia"
    BusID          "PCI:0:30:0"
    BoardName      "Tesla T4"
EndSection

Section "Screen"
    Identifier     "dGPU"
    Device         "dGPU"
    Monitor        "Monitor0"
    DefaultDepth    24
    Option         "DPI" "96 x 96"
# T4 needs an entry here, this is not the desktop size
    Option         "ConnectToAcpid" "false"
    Option         "Stereo" "0"
    Option         "nvidiaXineramaInfoOrder" "DFP-0"
    Option         "metamodes" "1920x1080 +0+0"
    Option         "SLI" "Off"
    Option         "MultiGPU" "Off"
    Option         "BaseMosaic" "off"
    SubSection     "Display"
        Virtual     1920 1080
        Depth       24
    EndSubSection
EndSection
```
调整这个配置文件的内容， 可以使用 nvidia-xsetting 和 nvidia-xconfig 两个工具， 然后整合自动配置的结果， 对比之后删除冲突或者自动合并无效的部分（也可以直接选择保存配置文件并且不自动merge字段， 我没敢）

主要还是这个字段生效 `    Option         "metamodes" "1920x1080 +0+0"` ， 2023 年年末的正确设置分辨率的写法。 我对于网络串流的效果本身表示担心， 所以并没有开到 4k ， 1080p 体验游戏基本上够了。

## 目前最后的一点点坑：
重启之后， sunshine 需要先通过xrdp进入到 ec2 里面，连接一次启动图形化， 我最后还是没有把整体配置成 headless 模式， 如果 sunshine 可以在启动的时候叫一下 xserver 可能会使比较好的方案， 不过平时应该没有需要这个的时候， 问题不大。 我对这个事情还是认为在整活的范围里面。

## Final
正常配置的情况下， 启动的程序应该都可以直接使用显卡， 可以在 `nvtop` 或者 `nvidia-smi` 找到对应的进程。

![1PBUxzTSwvDs7Kl.png](https://s2.loli.net/2023/12/24/oCjSO7ab1FsZBd9.png)