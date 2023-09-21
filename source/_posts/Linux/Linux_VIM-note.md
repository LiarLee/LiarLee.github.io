---
title: vim笔记
date: 2019-07-08 21:49:04
tags: Linux
categories: Linux
---

vim的常用的命令速记。  
<!-- more -->
可在~/.vimrc中进行vim的的默认配置，echo ‘:set nu’ > ~/.vimrc即可设置vim默认显示行号。  
[30分钟正则表达式入门教程](https://www.w3cschool.cn/regex_rmjc/)

# Vim
一种模式化的编辑器，具有多种不同的模式。  
1. 编辑模式，命令模式
1. 插入模式
1. 末行模式
    内置的命令行接口

```shell
vim +12 test.sh
vim +/PATTERN test.sh 打开自动定位到匹配模式的第一个结果的行首。
vim + test.sh 直接出现在文件末尾  
```
## 切换模式的说明
i -- 直接在当前光标的位置输入
a -- 在光标字符的后面输入
o -- 在光标下面直接新建一行，开始输入
I -- 在光标所在行的行首输入
O -- 在光标所在的上面直接新建一行，开始输入
A -- 在光所所在行的行尾输入

编辑模式到末行模式 使用符号 ： 
:10，100d  
:set nu 
:set nonu
:s/dhcp/static/g

关闭文件：
    编辑模式下 连续ZZ，表示保存退出 
    :q 表示直接退出，类似的常用还有 :wq :wq! :q! :w! :w
    :x 保存退出
    :w [PATHTOFILE]

光标调整:
字符间  
hjkl 左 下 上 右 10l 右侧10个字符
w 下一个单词的词首 
b 前一个单词的词首
e 下一个单词的词尾

行首行尾
^ 调至行首第一个非空白字符
0 调至行首
$ 调至行尾

HIJK 行间
G 直接到最后一行
句间
段间