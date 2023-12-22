---
title: Linux_Ranger_Usage
date: 2021-08-26 01:49:46
categories: Linux
tags:
  - Linux
  - Ranger
---

ranger 备忘

```bash
g/ Go root 
gh Go home
gg Go to top 
G  Go bottom



# 文件操作 复制、剪切、删除、粘贴 （针对当前文件或则选择的内容）
yy 复制
dd 剪切
pp 粘贴
F5 复制
F5 剪贴
F8 删除
Delete 删除

# 书签
mX 把当前目录做一个书签 (X 表示任何字符)
'X 跳到X书签代表的目录

# 标签 不同标签可以复制、粘贴、移动
gn 新建一个标签
Alt+N 跳转到N号标签 (代表一个数字)
gt,gT 跳转到前个标签，后个标签

# 排序 对文件和目录列表进行排序，以便查看。
ot 根据后缀名进行排序 (Type)
oa 根据访问时间进行排序 (Access Time 访问文件自身数据的时间)
oc 根据改变时间进行排序 (Change Time 文件的权限组别和文件自身数据被修改的时间)
om 根据修改进行排序 (Modify time 文件自身内容被修改的时间)
ob 根据文件名进行排序 (basename)
on 这个好像和basename差不多(natural)
os 根据文件大小进行排序(Size)

# 重命名 修改文件名有两种模式：当前文件和批量改名
cw 新文件名 -- 修改当前文件名
A -- 在当前文件名后追加文字
I -- 在当前文件名前追加文字
:bulkrename --针对mark过的文件批量改名

# 执行shell命令
! -- 进入命令模式执行shell命令
s -- 同上
# -- 同！，但结果输出到一个pager。相当于 cmd | less
@ -- 同！，但会把选择的文件作为参数放在最后。
S -- 进入一个新的shell。exit后回到当前的ranger
