---
title: Hexo+Github建立个人博客记录
date: 2017-12-27 16:07:34
categories: Linux
tags:
  - Linux
  - Hexo
---
建立Blog，记录过程  
所有的配置都是在[Fedora 27 Workstation](https://getfedora.org/en/workstation/)版本下进行，Windows配置环境恶心了我很久所以不做介绍。

# Hexo部署环境
Hexo运行在Linux环境中的配置及其简单，只需要确认系统中安装了git和Nodejs就好，在Fedora27中已经默认有Git软件包，如果需要安装git使用`dnf install -y git`就好。目前我们只需要添加nodejs就可以了，准备工作开始～  
**使用`git version` 进行git是否存在于系统中的检测。**

### 安装Node.js
Node.js的安装只需要两条命令，按照顺序执行就好：  
1. 用于系统的更新，基本上等待命令结束就可以，只是保证运行环境的所有软件包都是最新的状态。
> `[root@localhost test]# dnf update -y`  

2. 用于安装Nodejs，dnf管理器会自动配置需要的依赖软件，也是等待就好，没有特别的操作。
> `[root@localhost test]# dnf install -y nodejs`  

### 安装Hexo
1. 接下来需要选择一个你想安装的目录，例如：/root/Document/Hexo/test  
2. 那么需要确定工作目录并且切换过去  
> `[root@localhost test]# cd /root/Document/Hexo/test`  

3. 之后所有的操作都会在这个目录或者它的子目录，请留意。  
> `[root@localhost test]# npm install hexo -g`  

4. 等待安装结果.......  
5. 安装结束之后，查看是否安装成功,使用：  
> `[root@localhost test]# hexo -v`  

6. 如输出如下信息则说明安装成功，可以执行下一步。  
> [root@localhost test]# hexo -v  
hexo: 3.4.4  
hexo-cli: 1.0.4  
os: Linux 4.13.13-300.fc27.x86_64 linux x64  
http_parser: 2.7.1  
node: 8.9.3  
v8: 6.1.534.48  
uv: 1.16.0  
zlib: 1.2.11  
ares: 1.10.1-DEV  
modules: 57  
nghttp2: 1.25.0  
openssl: 1.0.2m-fips  
icu: 57.1  
unicode: 8.0  
cldr: 29.0  
tz: 2016b  

安装成功，没有写安装失败的解决方法，因为我觉得难以失败，成功率很高的。  

#### 失败解决方案
1. 失败请更换cnpm 或者 更换淘宝源重试。  
2. 如果安装，确认自己在正确的目录下，执行`npm install`重试  

### 安装Hexo-server
安装Hexo-server主要是作为本地测试使用，通过本地localhost:4000访问来预览，方便调整。  
1. 使用如下命令执行安装：  
> `[root@localhost test]npm install hexo-server -g`

2. 执行启动hexo-server，确认是否可以正常使用：  
> `[root@localhost test]hexo s`  
OR   
> `[root@localhost test]hexo server`  

3. 输入如下结果则正常启动：  
> [root@localhost test]# hexo s  
 INFO  Start processing  
 INFO  Hexo is running at http://localhost:4000/. Press Ctrl+C to stop.  

4. 这里服务器已经启动了，使用Ctrl+C停止服务，恢复正常的Shell窗口。

### 初始化Hexo
1. 这里需要创建新的Blog目录，例如：/root/Document/Hexo/test
2. 在test目录下执行：  
> `[root@localhost test] hexo init`  

3. 初始化会将Blog所需的文件放入test文件夹中，这个目录就是我们需要推到github上面的东西。也就是整个博客的根目录。

# 配置Git
这部分的内容已经和我们本地的计算机没有什么太大的关系了，我们需要去Github上面注册一个账户，在这个账户里面添加一个新的repo，例如： test.github.io  
我们在本地建立的site使用git工具，将整个blog发布到对应的软件仓库中，接下来我们需要配置git的信息
使用命令配置git的用户名和邮箱：  
> `[root@localhost test] git config --global user.name "yourname"`  
> `[root@localhost test] git config --global user.email "youremailaddress"`

### 添加SSH认证
使用ssh进行与github的通信可以免去我们每次都输入用户名密码的繁琐，因此我们需要为本地的计算机生成一个SSH的KEY。  
1. 命令如下：  
> `[root@localhost test] ssh-keygen -t rsa -C "your_email@example.com"`  

2. 期间会让我们输入密码进行验证，如果这个位置输入密码，今后每次连接到github的时候，都需要输入这个密码才能连接，如果这里我们不输入密码直接回车，今后连接的时候就不需要密码了，推送的内容会直接被推送，之后返回结果。  
3. 生成的密钥会直接放在当前用户家目录下的隐藏文件夹里，因此我们把他找出来：  
> `[root@localhost test] cd ~/.ssh`  

4. 复制id_rsa.pub文件内的所有内容，粘贴到github的添加SSH密钥位置。成功。

### 连接Github
测试连接到Github是否能够成功，使用如下命令：  
> `[root@localhost test] ssh -T git@github.com`  

如果上一部分生成SSH密钥的时候输入了密码，请在这个命令运行之后按照提示输入密码，返回结果如下：  
> [root@localhost .ssh]# ssh -T git@github.com  
Hi test! You've successfully authenticated, but GitHub does not provide shell access.  

我们已经成功的连接上了Github上面的repo，github的配置结束了～  

### 配置Hexo-deployer
git可以将我们的blog推送到repo上面去，但是本身我们也可以使用hexo提供的工具来进行blog的更新。  
1. 直接编辑hexo的配置文件： \_config.yml  
> `[root@localhost test]# vim _config.yml`

2. 修改配置文件中的这个部分，如下是最终的修改结果：  
>  77 # Deployment  
 78 ## Docs: https://hexo.io/docs/deployment.html  
 79 deploy:
 80   type:  git  
 81   repo:  git@github.com:test/test.github.io.git  
 82   branch:  master  

3. 现在将我们本地的默认站点推送到Github上面去试试吧！   
> `[root@localhost test]# hexo d`  
INFO  Deploying: git  
INFO  Clearing .deploy_git folder...  
INFO  Copying files from public folder...  
INFO  Copying files from extend dirs...  
[master caa83a9] Site updated: 2017-12-27 18:26:01  
 1 file changed, 63 insertions(+), 11 deletions(-)  
To github.com:test/test.github.io.git  
   62dcd56..caa83a9  HEAD -> master  
Branch master set up to track remote branch master from   git@github.com:test/test.github.io.git.  
INFO  Deploy done: git  

4. 输出最后Deploy done,就表示我们的原始页面已经上传成功了～，访问Repo的名字就可以直接看到初始blog的样子了。

5. 后续插件安装的记录:
```
[root@localhost ~]# cnpm list -g --depth 0
/usr/lib
├── cnpm@6.0.0
├── hexo@3.4.4
├── hexo-cli@1.1.0
├── hexo-generator-archive@0.1.5
├── hexo-generator-category@0.1.3
├── hexo-generator-index@0.2.1
├── hexo-generator-search@2.4.0
├── hexo-generator-tag@0.2.0
├── hexo-render-pug@2.1.0
├── hexo-site@0.0.0
└── npm@6.4.1
```

# Hexo常用命令说明
Hexo目录下常用的命令有：
```
[root@localhost test]# hexo s           //启动hexo本地服务进行blog预览
[root@localhost test]# hexo new TITLE   //新建文章
[root@localhost test]# hexo clean       //清除缓存
[root@localhost test]# hexo g           //重新生成站点页面文件
[root@localhost test]# hexo d           //推送到github
```
# 添加鼠标爆炸点击效果
在/themes/yelee/layout/layout.ejs的文件中，文件开始位置加入如下字段：  
```
<head>
	<canvas class="fireworks" style="position: fixed;left: 0;top: 0;z-index: 1; pointer-events: none;" ></canvas> 
	<script type="text/javascript" src="//cdn.bootcss.com/animejs/2.2.0/anime.min.js"></script> 
	<script type="text/javascript" src="/js/firework.js"></script>
</head>
```
在themes/yelee/source/js/建立如下文件firework.js,文件内容如下：  
```
"use strict";function updateCoords(e){pointerX=(e.clientX||e.touches[0].clientX)-canvasEl.getBoundingClientRect().left,pointerY=e.clientY||e.touches[0].clientY-canvasEl.getBoundingClientRect().top}function setParticuleDirection(e){var t=anime.random(0,360)*Math.PI/180,a=anime.random(50,180),n=[-1,1][anime.random(0,1)]*a;return{x:e.x+n*Math.cos(t),y:e.y+n*Math.sin(t)}}function createParticule(e,t){var a={};return a.x=e,a.y=t,a.color=colors[anime.random(0,colors.length-1)],a.radius=anime.random(16,32),a.endPos=setParticuleDirection(a),a.draw=function(){ctx.beginPath(),ctx.arc(a.x,a.y,a.radius,0,2*Math.PI,!0),ctx.fillStyle=a.color,ctx.fill()},a}function createCircle(e,t){var a={};return a.x=e,a.y=t,a.color="#F00",a.radius=0.1,a.alpha=0.5,a.lineWidth=6,a.draw=function(){ctx.globalAlpha=a.alpha,ctx.beginPath(),ctx.arc(a.x,a.y,a.radius,0,2*Math.PI,!0),ctx.lineWidth=a.lineWidth,ctx.strokeStyle=a.color,ctx.stroke(),ctx.globalAlpha=1},a}function renderParticule(e){for(var t=0;t<e.animatables.length;t++){e.animatables[t].target.draw()}}function animateParticules(e,t){for(var a=createCircle(e,t),n=[],i=0;i<numberOfParticules;i++){n.push(createParticule(e,t))}anime.timeline().add({targets:n,x:function(e){return e.endPos.x},y:function(e){return e.endPos.y},radius:0.1,duration:anime.random(1200,1800),easing:"easeOutExpo",update:renderParticule}).add({targets:a,radius:anime.random(80,160),lineWidth:0,alpha:{value:0,easing:"linear",duration:anime.random(600,800)},duration:anime.random(1200,1800),easing:"easeOutExpo",update:renderParticule,offset:0})}function debounce(e,t){var a;return function(){var n=this,i=arguments;clearTimeout(a),a=setTimeout(function(){e.apply(n,i)},t)}}var canvasEl=document.querySelector(".fireworks");if(canvasEl){var ctx=canvasEl.getContext("2d"),numberOfParticules=30,pointerX=0,pointerY=0,tap="mousedown",colors=["#FF1461","#18FF92","#5A87FF","#FBF38C"],setCanvasSize=debounce(function(){canvasEl.width=2*window.innerWidth,canvasEl.height=2*window.innerHeight,canvasEl.style.width=window.innerWidth+"px",canvasEl.style.height=window.innerHeight+"px",canvasEl.getContext("2d").scale(2,2)},500),render=anime({duration:1/0,update:function(){ctx.clearRect(0,0,canvasEl.width,canvasEl.height)}});document.addEventListener(tap,function(e){"sidebar"!==e.target.id&&"toggle-sidebar"!==e.target.id&&"A"!==e.target.nodeName&&"IMG"!==e.target.nodeName&&(render.play(),updateCoords(e),animateParticules(pointerX,pointerY))},!1),setCanvasSize(),window.addEventListener("resize",setCanvasSize,!1)}"use strict";function updateCoords(e){pointerX=(e.clientX||e.touches[0].clientX)-canvasEl.getBoundingClientRect().left,pointerY=e.clientY||e.touches[0].clientY-canvasEl.getBoundingClientRect().top}function setParticuleDirection(e){var t=anime.random(0,360)*Math.PI/180,a=anime.random(50,180),n=[-1,1][anime.random(0,1)]*a;return{x:e.x+n*Math.cos(t),y:e.y+n*Math.sin(t)}}function createParticule(e,t){var a={};return a.x=e,a.y=t,a.color=colors[anime.random(0,colors.length-1)],a.radius=anime.random(16,32),a.endPos=setParticuleDirection(a),a.draw=function(){ctx.beginPath(),ctx.arc(a.x,a.y,a.radius,0,2*Math.PI,!0),ctx.fillStyle=a.color,ctx.fill()},a}function createCircle(e,t){var a={};return a.x=e,a.y=t,a.color="#F00",a.radius=0.1,a.alpha=0.5,a.lineWidth=6,a.draw=function(){ctx.globalAlpha=a.alpha,ctx.beginPath(),ctx.arc(a.x,a.y,a.radius,0,2*Math.PI,!0),ctx.lineWidth=a.lineWidth,ctx.strokeStyle=a.color,ctx.stroke(),ctx.globalAlpha=1},a}function renderParticule(e){for(var t=0;t<e.animatables.length;t++){e.animatables[t].target.draw()}}function animateParticules(e,t){for(var a=createCircle(e,t),n=[],i=0;i<numberOfParticules;i++){n.push(createParticule(e,t))}anime.timeline().add({targets:n,x:function(e){return e.endPos.x},y:function(e){return e.endPos.y},radius:0.1,duration:anime.random(1200,1800),easing:"easeOutExpo",update:renderParticule}).add({targets:a,radius:anime.random(80,160),lineWidth:0,alpha:{value:0,easing:"linear",duration:anime.random(600,800)},duration:anime.random(1200,1800),easing:"easeOutExpo",update:renderParticule,offset:0})}function debounce(e,t){var a;return function(){var n=this,i=arguments;clearTimeout(a),a=setTimeout(function(){e.apply(n,i)},t)}}var canvasEl=document.querySelector(".fireworks");if(canvasEl){var ctx=canvasEl.getContext("2d"),numberOfParticules=30,pointerX=0,pointerY=0,tap="mousedown",colors=["#FF1461","#18FF92","#5A87FF","#FBF38C"],setCanvasSize=debounce(function(){canvasEl.width=2*window.innerWidth,canvasEl.height=2*window.innerHeight,canvasEl.style.width=window.innerWidth+"px",canvasEl.style.height=window.innerHeight+"px",canvasEl.getContext("2d").scale(2,2)},500),render=anime({duration:1/0,update:function(){ctx.clearRect(0,0,canvasEl.width,canvasEl.height)}});document.addEventListener(tap,function(e){"sidebar"!==e.target.id&&"toggle-sidebar"!==e.target.id&&"A"!==e.target.nodeName&&"IMG"!==e.target.nodeName&&(render.play(),updateCoords(e),animateParticules(pointerX,pointerY))},!1),setCanvasSize(),window.addEventListener("resize",setCanvasSize,!1)};
```
