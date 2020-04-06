---
title: Hexo备份和恢复
date: 2018-07-03 16:39:23
tags: Hexo
category: Linux
---

hexo项目的备份和还原方法。

<!-- more -->

## 问题 
一个特别无奈的问题，我尝试在我写博客的虚拟机里面使用了一个破坏性的命令，dnf autoremove, 就是这个命令导致我的虚拟机彻底坏了。所以我恢复了快照，但是是两个月前的记录了。发现自己的blog无法恢复，找到了这样一个解决方案。

## 思路
1. 在github上设置一个新的分支hexo。
2. 在这个分支上放置自己工作目录下的原始文件。
3. 每次推送Blog到github的时候同时推送自己的工作目录到github。
4. 当需要恢复自己的本地环境的时候，直接从github上面Clone下来就可以了。  

Note: 之前的思路是去hexo的工作目录下面找blog的项目，编译之后推送静态页面到gtihub。现在是直接把工作目录传上去，用的时候下载下来。  

### 1. 准备一个新的工作目录
在目录下git clone 自己的Blog项目。
···
git clone https://github.com/xxxx/xxxx.github.io.git
···

### 2. 目录的构建
1. 到xxxx.github.io目录下面，保留下面的.git目录，删除所有的其余目录。  
1. 将之前的hexo工作目录的所有文件复制到xxxx.github.io下。  
1. 在lxxxx.github.io目录下放置.gitignore文件，内容如下：  
```        
        .DS_Store  
        Thumbs.db  
        db.json  
        *.log  
        node_modules/  
        public/  
        .deploy*/   
```
1. cd 到xxxx.liarlee.io目录下，使用命令新建分支：  
```   
git checkout -b hexo
```
1. 将hexo工作目提交到缓存  
```
git add --all
```
1. 提交到github的hexo分支  
```
git commit -m "Some statement..."
```
1. 推送到自己博客项目的hexo分支下    
```
git push --set-upstream origin hexo
```
1. 结束

### 3. 更新文章
1. git add --all
1. git commit -m "SaySomethingHERE"
1. git push origin hexo 
1. hexo clean && hexo g -d

### 4. 恢复hexo的工作目录
1. sudo cnpm install -g hexo-cli
1. dnf install -y npm
1. sudo npm install -g cnpm --registry=https://registry.npm.taobao.org
1. cd Liarlee.github.io/Liarlee
1. sudo cnpm install -no-bin-links
1. sudo cnpm install hexo-deployer-git
1. 去Github上面添加机器的ssh public key 
1. 尝试使用hexo d , 查看是否可以成功。


