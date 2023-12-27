---
title: Linux及vim的技巧
date: 2019-10-10 11:48:58
tags:
  - VIM
  - Linux
categories: Linux
---

Linux的使用技巧已经vim的常用设置及插件。

<!-- more -->

### 1. 删除目录下的所有文件夹，但是保留所有文件
```
find ./ -type d ! -name . | xargs rm -rf
```
### 2. 设置vim的个性化设置
设置自动显示行号，设置VIM自动将tab转化为4个空格
```
:set nu
:set tabstop=4
:set softtabstop=4
:set shiftwidth=4
:set expandtab
```

### 3. 已经编辑的文件进行tab空格转换：
- TAB替换为空格：
```shell
:set ts=4
:set expandtab
:%retab!
```
- 空格替换为TAB：
```shell
:set ts=4
:set noexpandtab
:%retab!
```

### 4. Vim的个性化配置及插件

- 自动换行

  set wrap

- 输入命令时自动提示补完

  set showcmd

- 显示行号

  set nu

- 显示当前行号及关联前后行号

  set relativenumber

- 语法高亮

  syntax on 

- 光标所在的行高亮

  set cursorline

- 前后滚动时保留最前和最后的5行

  set scrolloff=5
