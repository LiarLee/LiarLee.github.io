---
title: DockerFile笔记
date: 2019-04-24 14:27:38
tags: Docker
categories: Linux
---

Dockerfile的书写规则及Dockerfile的指令说明。

<!-- more-->

Docker的镜像存储到Overlay2  

```
Docker images ls
    # 查看所有的Docker Images  
Docker exec -it Container_Name /bin/sh  
    # 将容器启动并执行shell命令行  
```

# Docker Images  
1. Docker Images中有启动容器所需要的文件系统及内容，用于启动并创建Docker容器,采用分层机制，最底层为bootfs，之上是rootfs  
    - rootfs:Docker的根文件系统，由Kernel挂载为“ReadOnly”模式，而后通过联合挂载技术额外挂在一个可写层 
    - bootfs:用于系统引导的文件系统，包括bootloader及kernel，容器启动之后自动卸载  
1. Docker Images Layer下层的镜像称为父镜像，最底层的叫做Base Images  
2. Aufs - Advanced multi-layered unification filesystem  
3. Overlayfs - 3.18版本被合并到Linux内核   
4. Docker的分层镜像，除了Aufs，还支持btrfs，devicemapper和vfs  
5. Docker Registry - Docker daemon自动视图从DockerHub拉取镜像文件  
6. Docker Registry的分类 
   - Sponsor Registry：第三方，提供给客户或Docker社区  
   - Mirror Registry：第三方，只给客户使用 
   - Vendor Registry：由发布Docker镜像的供应商提供  
   - Private Regisry：通过设有防火墙及额外的安全层的私有实体提供  
7. 云原生 - 面向云环境的运行了云系统本身的调用的程序。通过环境变量进行配置  
8. Webhooks - 自动创建镜像  
9. Quay.io 除了DockerHub其他的镜像仓库  
    - docker pull quay.io/coreos/flannel:latest 

## Docker镜像的保存与恢复  
```
docker save -o myimages.gz IMAGE_NAME1 IMAGE_NAME2 
    # 将多个镜像保存到本地压缩文件  
scp myimages.gz 
    # 传输镜像到其他节点  
docker load -i myimages.gz  
    # 在新的节点加载镜像  
```
# Docker File 
## DockerFile存在的意义 
docker exec CONTAINER --> vi --> RELOAD  
Docker的容器不利于我们对需要反复调试的服务进行更改，通过Dockerfile的修改可快速调整容器的配置。

## 自定义镜像的方法  
### 基于Docker容器制作镜像  
1. 创建你需要的容器，Docker commit命令进行镜像的制作 
2. docker run --name b1 -it busybox  
3. mkdir -p /data/html  
4. vi /data/html/index.html  
5. docker commit -p b1 
6. docker tag IMAGE_ID REPOSITORY:TAG  
7. docker image ls  
8. docker image rm IMAGE_TAG
9. docker imspect -- cmd字段自动标志启动自动运行的命令  
10. 更改docker的默认运行命令  
11. docker commit -p -a 'Liarlee' -c 'CMD ["/bin/httpd","-f","-h","/data/html"]' b1 hayden/httpd:v0.2 
12. docker login -u USERNAME 登录到服务器  
13. docker push Liarlee/httpd  




### 基于DockerFile制作DockerImage 
Dockerfile Format  
1. \# 开头的为注释文字   
2. INSTRUCTION arguments，采用指令+参数的格式   
3. Dockerfile执行的时候是从上至下执行的  
4. 第一个非注释行必须是FROM指令  

.dockerignore文件路径记录，可以通配，打包时忽略list中的文件    
可以使用环境变量替换    
BASH SHELL:   
echo ${NAME:-tom} 给一个变量设置一个默认值    
echo ${NAME:+tom} 如果变量有数值，强行改为默认值   

### - FROM  
FROM指定的镜像将自动拉取作为底层的镜像进行制作;  

```  
FROM <repository>[:tag]  
FROM <repository>@<HASH number>  

EXAMPLE:   
FROM centos:latest
    # 使用Centos的最新发行镜像作为底层镜像
```

### - MAINTAINER  
提供制作人的信息，废弃不用了，现在使用LABEL  

```
MAINTAINER "LiarLee<Test@LiarLee.com>"
```

### - LABEL  
LABEL是给镜像指定元数据的命令  
```
LABEL maintainer="LiarLee<Test@LiarLee.com>"
```


### - COPY  
复制本地文件或目录到镜像文件系统中。  
```
COPY \<src> ... \<dest>  
COPY ["\<src>" ... "\<dest>"]  
\<src> -- 相对路径    
\<dest> -- 绝对路径   

- 指定的src目录，会将目录下的所有文件复制到目的地，但是不会将src复制。
- 如果使用了多个src，或者src使用了通配，目的必须是个目录  
- 如果dest不存在会被自动创建  

COPY /etc/passwd /etc/passwd
    # 与cp命令相似，复制本地目标文件到容器文件系统中
COPY /usr/local/src/nginx/* /usr/local/src/nginx/
    # 如果目标目录不存在需要先行创建
```

### docker build命令  

```bash
[root@Hayden test]# docker build -h
Flag shorthand -h has been deprecated, please use --help
Usage:	docker build [OPTIONS] PATH | URL | -
Build an image from a Dockerfile
Options:
      --add-host list           Add a custom host-to-IP mapping (host:ip)
      --build-arg list          Set build-time variables
      --cache-from strings      Images to consider as cache sources
      --cgroup-parent string    Optional parent cgroup for the container
      --compress                Compress the build context using gzip
      --cpu-period int          Limit the CPU CFS (Completely Fair Scheduler) period
      --cpu-quota int           Limit the CPU CFS (Completely Fair Scheduler) quota
  -c, --cpu-shares int          CPU shares (relative weight)
      --cpuset-cpus string      CPUs in which to allow execution (0-3, 0,1)
      --cpuset-mems string      MEMs in which to allow execution (0-3, 0,1)
      --disable-content-trust   Skip image verification (default true)
  -f, --file string             Name of the Dockerfile (Default is 'PATH/Dockerfile')
      --force-rm                Always remove intermediate containers
      --iidfile string          Write the image ID to the file
      --isolation string        Container isolation technology
      --label list              Set metadata for an image
  -m, --memory bytes            Memory limit
      --memory-swap bytes       Swap limit equal to memory plus swap: '-1' to enable
                                unlimited swap
      --network string          Set the networking mode for the RUN instructions
                                during build (default "default")
      --no-cache                Do not use cache when building the image
      --pull                    Always attempt to pull a newer version of the image
  -q, --quiet                   Suppress the build output and print image ID on success
      --rm                      Remove intermediate containers after a successful
                                build (default true)
      --security-opt strings    Security options
      --shm-size bytes          Size of /dev/shm
  -t, --tag list                Name and optionally a tag in the 'name:tag' format
      --target string           Set the target build stage to build.
      --ulimit ulimit           Ulimit options (default [])
```
制作一个容器，COPY本地的HTML文件到容器文件系统中  
```
[root@Hayden test]# docker build -t busybox-httpd:v0.1-1 ./  
Sending build context to Docker daemon  3.072kB  
Step 1/3 : FROM busybox:latest  
 ---> d8233ab899d4  
Step 2/3 : MAINTAINER "HAYDEN<HAYDEN@lee.com>"  
 ---> Running in d581bd9c9aba  
Removing intermediate container d581bd9c9aba  
 ---> 8137f8096ce4  
Step 3/3 : COPY index.html /data/web/html/  
 ---> bced33a9e4a4
Successfully built bced33a9e4a4
Successfully tagged busybox-httpd:v0.1-1
```
查看已经制作完成的镜像
```
[root@Hayden test]# docker image ls
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
busybox-httpd       v0.1-1              bced33a9e4a4        17 seconds ago      1.2MB
nginx               latest              881bd08c0b08        3 weeks ago         109MB
busybox             latest              d8233ab899d4        6 weeks ago         1.2MB
```
运行容器查看结果
```
[root@Hayden test]# docker run --name t1 --rm busybox-httpd:v0.1-1 cat /data/web/html/index.html
<h1>Busybox httpd server.</h1>
```

### - ADD  
用于添加URL链接或本地文件到镜像中，支持tar包的自动解压。  
```
ADD <src> ... <dest>  
ADD ["<src>" ... "<dest>"]  
ADD命令可以支持URL，在打包镜像的时候下载并打包进去
ADD命令支持对本地的tar文件打包进镜像的时候进行解压  

EXAMPLE:  
ADD nginx.org/download/nginx-1.15.12.tar.gz  
    # 指令自动打包进入镜像，并同时解压tar包
```

### - WORKDIR

```
WORKDIR <dirpath>  
指定当前的工作目录

EXAMPLE:
WORKDIR /usr/local/src/nginx
    # 制定后续操作的工作目录，以调整指令中的相对路径
```

### - VOLUME

```
VOLUME \<mountpoint>  
VOLUME ["\<mountpoint>"]  
VOLUME指定挂载的卷  
只能设置容器中的卷目录，不能制定宿主机的目录，只能使用Docker自动管理的卷 
```

### - EXPOSE  
```
EXPOSE <port>[/<protocol>]   
指定的协议为tcp or udp , defaults option is TCP  
可以一次指定多个端口  
```

### - ENV
```
ENV <key> <value1> <value2> <value3> <value4>   
ENV <key>=<value> <key>=<value>...  
在Dockerfile中指定环境变量，可将指定的变量在Docker run的时候进行手动的指定，
影响运行容器时候的命令执行结果，但是不影响docker build的运行结果  
```