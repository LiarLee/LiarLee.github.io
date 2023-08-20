---
title: Shell脚本处理目录或者文件名中的空格
date: 2022-04-15 14:10:54
categories: Linux
tags: Bash
---
## 问题：
问题是： 罗列指定的目录下面的文件， 符合要求的文件保留， 未匹配的删除。
## 解决：

简单的Bash脚本， 使用ls拿文件名， 使用For + IF判断即可。 
但是文件的目录中有的文件名是带有空格的， 而Shell 使用空格做分隔符，因此无法正确的处理完整的文件名。 
解决方案有特别多， 只记录一个我最后使用的方案：
使用IFS变量来定义Shell 的默认分隔符， 将空格替换成\n\b. 

```bash
#!/bin/bash
#
SAVEIFS=$IFS
IFS=$(echo -en "\n\b")

for number in {1..10}
do
  mkdir -pv "dir $number"
done

tree

FILE=`ls`

for i in $FILE;
do
  echo "The DirName: $i"
done

IFS=$SAVEIFS
```

---

这样就可以拿到名称为dir 1的完整目录名字了，否则会默认吧空格分割的文件名称作为两个目录提取。

```shell
⚡ ./delete.sh
.
├── delete.sh
├── dir 1
├── dir 10
├── dir 2
├── dir 3
├── dir 4
├── dir 5
├── dir 6
├── dir 7
├── dir 8
└── dir 9

10 directories, 1 file
The DirName: delete.sh
The DirName: dir 1
The DirName: dir 10
The DirName: dir 2
The DirName: dir 3
The DirName: dir 4
The DirName: dir 5
The DirName: dir 6
The DirName: dir 7
The DirName: dir 8
The DirName: dir 9
```

