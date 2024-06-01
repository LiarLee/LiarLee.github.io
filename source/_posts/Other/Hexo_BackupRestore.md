---
title: Hexo备份和恢复
date: 2018-07-03 16:39:23
category: Hexo
tags:
  - Hexo
  - Linux
---
hexo 博客的备份和还原方法。

这里是介绍安装步骤：[Hexo_Install](Hexo_Install.md)

尝试在我写博客的虚拟机里面使用了一个破坏性的命令，`dnf autoremove` 这个命令导致我的虚拟机彻底坏了。我恢复了快照，但是是两个月前的记录了， 对于如何回复自己的博客内容， 找到了这样一个解决方案。
### 思路

1. 在 github 上设置一个新的分支 hexo。
2. 在这个分支上放置自己工作目录下的原始文件。
3. 每次推送Blog到github的时候同时推送自己的工作目录到github。
4. 当需要恢复自己的本地环境的时候，直接从github上面Clone下来就可以了。  
5. 之前的思路是去hexo的工作目录下面找blog的项目，编译之后推送静态页面到gtihub。现在是直接把工作目录传上去，用的时候下载下来。  

### 步骤
1. 准备一个新的工作目录， 在目录下git clone 自己的 Blog 项目。
```shell
git clone https://github.com/xxxx/xxxx.github.io.git
```
2. 创建目录结构。
  1. 到 xxxx.github.io 目录下面，保留下面的 .git 目录，删除所有的其余目录。  
  1. 将之前的hexo工作目录的所有文件复制到 xxxx.github.io 下。  
  1. 在 xxxx.github.io 目录下放置 .gitignore 文件，内容如下：  
 ```shell 
.DS_Store  
Thumbs.db  
db.json  
*.log  
node_modules/  
public/  
.deploy*/   
 ```
  1. cd 到 xxxx.liarlee.io 目录下，使用命令新建分支：  
```shell
git checkout -b hexo
```
  1. 将hexo工作目提交到缓存  
```shell
git add --all
```
  1. 提交到github的hexo分支  
```shell
git commit -m "SaySomethingHERE“
```
  1. 推送到自己博客项目的hexo分支下    
```shell
git push --set-upstream origin hexo
```
 现在项目下面就有两个分支了， main 分支  和  hexo 分支，   main 分支里面是 渲染好的前端静态文件， hexo 分支里面是整个项目原始代码以及配置文件。

#### 新的完整更新步骤
```shell
git add --all
git commit -m "SaySomethingHERE"
git push origin hexo 
hexo clean && hexo g -d
```

9. 恢复hexo的工作目录
10. sudo cnpm install -g hexo-cli
11. dnf install -y npm
12. sudo npm install -g cnpm --registry=https://registry.npm.taobao.org
13. cd Liarlee.github.io/Liarlee
14. sudo cnpm install -no-bin-links
15. sudo cnpm install hexo-deployer-git
16. 去Github上面添加机器的ssh public key 
17. 尝试使用hexo d , 查看是否可以成功。

