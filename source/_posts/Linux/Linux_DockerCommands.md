---
title: Docker基本命令说明
date: 2018-05-28 12:38:06
categories: Docker
tags:
  - Docker
---

docker基础命令的说明。

<!-- more -->

## Docker常用命令的说明

### Docker Pull
\\ 下载一个Image  
```
[root@localhost ~]# docker pull nginx:lastest  
Using default tag: latest  
Trying to pull repository docker.io/library/nginx ...   
sha256:0fb320e2a1b1620b4905facb3447e3d84ad36da0b2c8aa8fe3a5a81d1187b884: Pulling from docker.io/library/nginx
Digest: sha256:0fb320e2a1b1620b4905facb3447e3d84ad36da0b2c8aa8fe3a5a81d1187b884
Status: Image is up to date for docker.io/nginx:latest
```

### Docker Push
\\ 上传一个Image  

### Docker Run
\\ 启动一个Container  
```
[root@localhost ~]# docker run nginx
```

### Docker Kill
\\ 结束一个Container  
```
[root@localhost ~]# docker kill flamboyant_thompson  
```

### Docker System Prune
\\ 清理Docker的无用文件,包括未使用的容器和不具有Dangling的镜像(不具有启动能力的Image)  

### Docker Images
\\ 列出所有的docker images
```
[root@localhost ~]# docker images
ONTAINER ID        IMAGE                      COMMAND                  CREATED             STATUS              PORTS                    NAMES
1cca834eb80c        nginx                      "nginx -g 'daemon ..."   57 seconds ago      Up 56 seconds       80/tcp                   flamboyant_thompson
769aefe85e29        achabill/lh-toolkit        "dockerize -wait t..."   3 hours ago         Up 3 hours          0.0.0.0:8080->8080/tcp   sad_payne
93431e5f2f66        achabill/lh-mysql:latest   "docker-entrypoint..."   3 hours ago         Up 3 hours          0.0.0.0:3308->3306/tcp   brave_mcclintock
```

### Docker search
\\ 搜索特定名称的image  
```
[root@localhost ~]# docker search nginx
INDEX        NAME                                                             DESCRIPTION                                     STARS     OFFICIAL   AUTOMATED
docker.io    docker.io/nginx                                                  Official build of Nginx.                        8564      [OK]       
docker.io    docker.io/nginx                                                  Official build of Nginx.                        8564      [OK]       
docker.io    docker.io/jwilder/nginx-proxy                                    Automated Nginx reverse proxy for docker c...   1334                 [OK]
docker.io    docker.io/jwilder/nginx-proxy                                    Automated Nginx reverse proxy for docker c...   1334                 [OK]
docker.io    docker.io/richarvey/nginx-php-fpm                                Container running Nginx + PHP-FPM capable ...   547                  [OK]
docker.io    docker.io/richarvey/nginx-php-fpm                                Container running Nginx + PHP-FPM capable ...   547                  [OK]
docker.io    docker.io/jrcs/letsencrypt-nginx-proxy-companion                 LetsEncrypt container to use with nginx as...   367                  [OK]
docker.io    docker.io/jrcs/letsencrypt-nginx-proxy-companion                 LetsEncrypt container to use with nginx as...   367                  [OK]
docker.io    docker.io/kong                                                   Open-source Microservice & API Management ...   187       [OK]       
docker.io    docker.io/kong                                                   Open-source Microservice & API Management ...   187       [OK]       
docker.io    docker.io/webdevops/php-nginx                                    Nginx with PHP-FPM                              103                  [OK]
docker.io    docker.io/webdevops/php-nginx                                    Nginx with PHP-FPM                              103                  [OK]
docker.io    docker.io/kitematic/hello-world-nginx                            A light-weight nginx container that demons...   98                   
docker.io    docker.io/kitematic/hello-world-nginx                            A light-weight nginx container that demons...   98                   
docker.io    docker.io/bitnami/nginx                                          Bitnami nginx Docker Image                      50                   [OK]
docker.io    docker.io/bitnami/nginx                                          Bitnami nginx Docker Image                      50                   [OK]
docker.io    docker.io/zabbix/zabbix-web-nginx-mysql                          Zabbix frontend based on Nginx web-server ...   50                   [OK]
docker.io    docker.io/zabbix/zabbix-web-nginx-mysql                          Zabbix frontend based on Nginx web-server ...   50                   [OK]
docker.io    docker.io/1and1internet/ubuntu-16-nginx-php-phpmyadmin-mysql-5   ubuntu-16-nginx-php-phpmyadmin-mysql-5          35                   [OK]
docker.io    docker.io/1and1internet/ubuntu-16-nginx-php-phpmyadmin-mysql-5   ubuntu-16-nginx-php-phpmyadmin-mysql-5          35                   [OK]
docker.io    docker.io/linuxserver/nginx                                      An Nginx container, brought to you by Linu...   35                   
docker.io    docker.io/linuxserver/nginx                                      An Nginx container, brought to you by Linu...   35                   
docker.io    docker.io/tobi312/rpi-nginx                                      NGINX on Raspberry Pi / armhf                   19                   [OK]
docker.io    docker.io/tobi312/rpi-nginx                                      NGINX on Raspberry Pi / armhf                   19                   [OK]
docker.io    docker.io/nginxdemos/nginx-ingress                               NGINX Ingress Controller for Kubernetes . ...   11                   
docker.io    docker.io/nginxdemos/nginx-ingress                               NGINX Ingress Controller for Kubernetes . ...   11                   
docker.io    docker.io/blacklabelops/nginx                                    Dockerized Nginx Reverse Proxy Server.          9                    [OK]
docker.io    docker.io/blacklabelops/nginx                                    Dockerized Nginx Reverse Proxy Server.          9                    [OK]
docker.io    docker.io/wodby/drupal-nginx                                     Nginx for Drupal container image                9                    [OK]
docker.io    docker.io/wodby/drupal-nginx                                     Nginx for Drupal container image                9                    [OK]
docker.io    docker.io/webdevops/nginx                                        Nginx container                                 8                    [OK]
docker.io    docker.io/webdevops/nginx                                        Nginx container                                 8                    [OK]
docker.io    docker.io/centos/nginx-18-centos7                                Platform for running nginx 1.8 or building...   6                    
docker.io    docker.io/centos/nginx-18-centos7                                Platform for running nginx 1.8 or building...   6                    
docker.io    docker.io/nginxdemos/hello                                       NGINX webserver that serves a simple page ...   6                    [OK]
docker.io    docker.io/nginxdemos/hello                                       NGINX webserver that serves a simple page ...   6                    [OK]
docker.io    docker.io/1science/nginx                                         Nginx Docker images that include Consul Te...   4                    [OK]
docker.io    docker.io/1science/nginx                                         Nginx Docker images that include Consul Te...   4                    [OK]
docker.io    docker.io/centos/nginx-112-centos7                               Platform for running nginx 1.12 or buildin...   3                    
docker.io    docker.io/behance/docker-nginx                                   Provides base OS, patches and stable nginx...   2                    [OK]
docker.io    docker.io/behance/docker-nginx                                   Provides base OS, patches and stable nginx...   2                    [OK]
docker.io    docker.io/pebbletech/nginx-proxy                                 nginx-proxy sets up a container running ng...   2                    [OK]
docker.io    docker.io/pebbletech/nginx-proxy                                 nginx-proxy sets up a container running ng...   2                    [OK]
docker.io    docker.io/toccoag/openshift-nginx                                Nginx reverse proxy for Nice running on sa...   1                    [OK]
docker.io    docker.io/toccoag/openshift-nginx                                Nginx reverse proxy for Nice running on sa...   1                    [OK]
docker.io    docker.io/travix/nginx                                           NGinx reverse proxy                             1                    [OK]
docker.io    docker.io/travix/nginx                                           NGinx reverse proxy                             1                    [OK]
docker.io    docker.io/ansibleplaybookbundle/nginx-apb                        An APB to deploy NGINX                          0                    [OK]
docker.io    docker.io/mailu/nginx                                            Mailu nginx frontend                            0                    [OK]
docker.io    docker.io/mailu/nginx                                            Mailu nginx frontend                            0                    [OK]
redhat.com   registry.access.redhat.com/3scale-amp20-beta/apicast-gateway     3scale's API gateway (APIcast) is an OpenR...   0                    
redhat.com   registry.access.redhat.com/3scale-amp20/apicast-gateway          3scale's API gateway (APIcast) is an OpenR...   0                    
redhat.com   registry.access.redhat.com/rhamp10/apicast-gateway               3scale's API gateway (APIcast) is an OpenR...   0                    
redhat.com   registry.access.redhat.com/rhmap43/wildcard-proxy                RHMAP Docker image that provides mapping a...   0                    
redhat.com   registry.access.redhat.com/rhmap44/wildcard-proxy                RHMAP Docker image that provides mapping a...   0                    
redhat.com   registry.access.redhat.com/rhmap45/wildcard-proxy                RHMAP image that provides mapping and prox...   0                    
redhat.com   registry.access.redhat.com/rhmap46/wildcard-proxy                RHMAP image that provides mapping and prox...   0                    
redhat.com   registry.access.redhat.com/rhscl/nginx-110-rhel7                 Nginx container image that delivers an ngi...   0                    
redhat.com   registry.access.redhat.com/rhscl/nginx-112-rhel7                 Nginx is a web server and a reverse proxy ...   0                    
redhat.com   registry.access.redhat.com/rhscl/nginx-16-rhel7                  Nginx 1.6 server and a reverse proxy server     0                    
redhat.com   registry.access.redhat.com/rhscl/nginx-18-rhel7                  Nginx 1.8 server and a reverse proxy server     0                    
```

### Docker Ps
\\ 列出docker正在运行的Container  
```
[root@localhost ~]# docker ps 
CONTAINER ID        IMAGE                      COMMAND                  CREATED             STATUS              PORTS                    NAMES
1cca834eb80c        nginx                      "nginx -g 'daemon ..."   57 seconds ago      Up 56 seconds       80/tcp                   flamboyant_thompson
769aefe85e29        achabill/lh-toolkit        "dockerize -wait t..."   3 hours ago         Up 3 hours          0.0.0.0:8080->8080/tcp   sad_payne
93431e5f2f66        achabill/lh-mysql:latest   "docker-entrypoint..."   3 hours ago         Up 3 hours          0.0.0.0:3308->3306/tcp   brave_mcclintock
```

### Docker Container Ls
\\ 列出所有存在的Container,包括为运行的和未使用的  
```
[root@localhost ~]# docker container ls
CONTAINER ID        IMAGE                      COMMAND                  CREATED             STATUS              PORTS                    NAMES
1cca834eb80c        nginx                      "nginx -g 'daemon ..."   57 seconds ago      Up 56 seconds       80/tcp                   flamboyant_thompson
769aefe85e29        achabill/lh-toolkit        "dockerize -wait t..."   3 hours ago         Up 3 hours          0.0.0.0:8080->8080/tcp   sad_payne
93431e5f2f66        achabill/lh-mysql:latest   "docker-entrypoint..."   3 hours ago         Up 3 hours          0.0.0.0:3308->3306/tcp   brave_mcclintock
```

### Docker Run -dt
\\ 运行一个image,给予一个Terminal,放入后台,返回一个ContainerID  
```
[root@localhost ~]# docker run -dt -p 80:80 nginx
1cca834eb80cd8467dec6d103bf9072adfb55d8cfb2fdc257af548dc25917868
```

### Docker Run -it
\\ 运行一个image,给予一个Terminal,直接进入Container  
```
[root@localhost ~]# docker run -it -p 80:80 nginx
```

### Docker Run
\\ 运行一个image,如果本地没有自动到docker仓库检索  
```
[root@localhost ~]# docker run nginx
```

### Docker Run -p
\\ 运行一个image,指定port的映射关系  
```
[root@localhost ~]# docker run -p 80:80 nginx 
```

### Docker Attach
\\ 进入到某一个Container内部,如果没有shell,无法操作, 输出一片空白  
```
[root@localhost ~]# docker attach flamboyant_thompson
[root@d4a75f165ce6 /]#
```