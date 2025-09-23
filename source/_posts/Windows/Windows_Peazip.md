---
title: PeaZip添加智能解压到win11右键菜单
date: 2025-09-14 10:18
category: Application
tags:
  - Windows
  - Application
  - PeaZip
---

[原始地址](https://www.reddit.com/r/Windows11/comments/1f6xxtb/how_to_add_peazip_to_the_windows_11_context_menu/?tl=zh-hans)

`Win+R` 输入这个路径，你就能找到注册表文件
```
C:\Program Files\PeaZip\res\share\batch\Windows\Windows 11 mini context menu
```

安装你想要的选项，不是全部。要安装，就双击注册表文件，然后同意“UAC”，然后确定，再确定，然后重启资源管理器。


我需要的是这个 ： add PeaZip, extract here (smart new folder).reg， 双击注册就好了。 

PeaZip 版本： PeaZip 发布: 10.6.1 - Win64 Build, x86_64