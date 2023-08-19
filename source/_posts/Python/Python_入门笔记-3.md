---
title: Python入门笔记 (三)
date: 2018-01-10 10:20:49
tags: Python
categories: Python
---

python进行系统管理的模块。系统管理模块的介绍和使用。  
系统管理的四个模块:
1. os
2. os.path
3. glob
4. fnmatch
## 1. OS
OS模块中包含了普遍的操作系统功能，如果希望程序与平台没有强关联的情况下这个模块很重要，这个模块可以在不改动程序的基础上，使程序运行在Linux和Windows之间。
### 可移植性说明
```python
os.name   #获取当前的操作系统信息
os.getcwd()   #获取当前的工作目录
os.listdir()    #返回目录下的所有文件和目录名称
os.remove()     #删除指定的文件
os.linesep      #通过字符串的方式给出当前平台的换行符号
```

### OS模块操作文件
```python
os.unlink       #删除路径所指向的文件
os.remove       #删除路径所指向的文件
os.rmdir        #删除path路径指向的空文件夹，必须是空的
os.mkdir        #创建一个文件夹
os.rename       #重命名一个文件或者文件夹
```

### OS模块操作权限
```python
os.access('/etc/fstab', os.R_OK)      #access是判断是否具有对某一个文件的相关权限，Linux中的 chmod/rwx---对应OS模块中的R_OK,W_OK，X_OK
```

## os.path模块
os.path模块主要是用来拆分路径，构建新的路径，获取文件属性和判断文件的类型使用。

### 拆分路径
```python
os.path.split()           #返回一个二元数组，包括文件路径和文件名称
os.path.dirname()         #返回文件路径
os.path.basename()        #返回文件的文件名
os.path.splitext()        #一个文件名和扩展名组成的二元组
```

### 构建路径
```python
os.path.expanduser('~/Liarlee')
os.path.abspath('Liarlee.txt')
os.path.join(os.path.expanduser('~mysql', 't', 'Liarlee.py'))
```

### 获取文件属性
```python
os.path.getatime()        #获取文件的访问时间
os.path.getmtime()        #获取文件的修改时间
os.path.getctime()        #获取文件的创建时间
os.path.getsize()         #获取文件的大小
```

### 判断文件类型
```python
os.path.exists        #参数path指向的路径是否存在
os.path.isfile        #参数path指向的路径存在，并且是一个文件
os.path.isdir         #路径存在，并且是一个文件夹
os.path.islink        #路径存在，并且是一个链接
```

## Fnmatch模块
## Glob模块
