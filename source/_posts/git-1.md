---
title: git使用以及命令记录
date: 2022-12-19 17:54:11
tags: Linux
---

# Method 1
## Step 1
Github上面创建一个新的仓库， 页面创建即可， 然后记录下URL。
```bash
https://github.com/LiarLee/vps-init.git
```

## step 2
本地创建目录， 并初始化本地的仓库路径。
```bash
mkdir vps-init
cd ./vps-init
git clone https://github.com/LiarLee/vps-init.git
```

# Method 2
## step 1 
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
