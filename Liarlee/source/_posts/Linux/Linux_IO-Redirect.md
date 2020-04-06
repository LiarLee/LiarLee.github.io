---
title: IO重定向笔记
date: 2019-06-25 15:43:33
tags: Linux
categories: Linux
---

输出重定向部分的复习笔记  

<!-- more -->  

## 标准输入输出  
### 文件描述符的概念
可以通过命令查看以及绑定文件描述符FD。  
```
liarlee@hayden-pc ~
> $ ll /proc/$$/fd
总用量 0
dr-x------ 2 liarlee liarlee  0  6月 24 20:22 .
dr-xr-xr-x 9 liarlee liarlee  0  6月 24 20:22 ..
lrwx------ 1 liarlee liarlee 64  6月 24 20:22 0 -> /dev/pts/0
lrwx------ 1 liarlee liarlee 64  6月 24 20:22 1 -> /dev/pts/0
lrwx------ 1 liarlee liarlee 64  6月 24 20:22 10 -> /dev/pts/0
lrwx------ 1 liarlee liarlee 64  6月 24 20:22 2 -> /dev/pts/0
```
### Linux提供的I/O设备
Linux系统提供的IO设备，共有三种：
- STDIN - 0 默认键盘输入
- STDOUT - 1 默认输出信息到终端
- STDERR - 2 默认输出错误信息到终端

## Linux输入输出重定向
### 重定向说明
    STDOUT和STDERR可以被重定向到文件中，STDIN可通过读取文件实现输入重定向，重定向命令的基本格式如下：  
    [CMD] [lOPERATION_SYMBOL] [FILENAME]  
    命令    操作符号    文件名

### 操作符号包括： 
- \> 把STDOUT重定向到文件 
- 2> 把STDERR重定向到文件
- &> 把所有结果输出重定向到文件
- \>> 在原有文件内容的基础上进行追加 
- < 标准输入的重定向  

### 例子
那么会有如下的操作：  
```
    > $ ls 1> /tmp/echo.stdout  
        # 正确的命令结果输出到文件中

    > $ ls 2> /tmp/echo.stderr  
        # 命令执行的错误结果输出到文件中  

    > $ ls /error /usr 2>&1 >/tmp/right.test   
        # 将错误信息重定向输出到屏幕显示，正确的信息输出到文件 
        # 通俗的讲是-- 将STDERR(2)重定向为STDOUT(1)输出到屏幕上，
        # 命令的其他结果输出到文件中  

    > $ ls /error /usr >true 2>false
        # 将正确的信息输出到true中，把错误的信息输出到false中  

    > $ ls /error /usr >all 2>&1 
        # 先将标准输出重定向到文件all中，在将错误信息追加到标准输出中  
        # 命令结果等于ls /error /usr &>all 

    > $ ls /error /usr &> /dev/null
        # 静默执行命令，不显示结果，不输出到终端

    > $ ls /error /usr 2>&1 >/dev/null  
        # 错误的信息显示在终端上，其他信息不显示

#  某些命令可以使用管道将STDIN输入重定向作为命令的值
    echo [PASSWD] | passwd --stdin [username] &> /dev/null
        # 更改某个用户的用户名和密码
```

