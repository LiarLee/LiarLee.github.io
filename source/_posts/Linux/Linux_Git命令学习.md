---
title: Git常见的命令
date: 2023-07-12 06:52:18
category: Linux
tags: Linux, Git
---

## 远端创建， Clone本地
### Step 1
Github上面创建一个新的仓库， 页面创建即可， 然后记录下URL。
```bash
https://github.com/LiarLee/vps-init.git
```

### Step 2
本地创建目录， 并初始化本地的仓库路径。
```bash
mkdir vps-init
cd ./vps-init
git clone https://github.com/LiarLee/vps-init.git
```

### 关联远端仓库
创建一个本地仓库。
```bash
mkdir vps-init
cd ./vps-init
git init .
touch README
echo "For init server use DroneCI."
git add -A
git commit -m "init"
git remote add origin https://github.com/LiarLee/vps-init.git
git -u origin master
```

### 配置代理
```bash
# 设置代理
ec2-user@arch ~> gitc config --global http.proxy socks5://1.1.1.1:7890
ec2-user@arch ~> git config --global https.proxy socks5://1.1.1.1:7890
# 取消代理
git config --global --unset http.proxy git config --global --unset https.proxy
```

### 取消git的特定文件追踪

最好的办法是直接使用gitignore忽略这个文件， 但是开始创建仓库的时候可能想不到， 所以已经追踪的文件需要取消。 

```git
查看这个哪些文件会受到影响： 
git rm -r -n --cached ./plugin 

删除这些文件的追踪： 
git rm -r --cached ./plugin

```

