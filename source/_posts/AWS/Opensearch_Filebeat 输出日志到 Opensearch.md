---
title: Filebeat 输出日志到 Opensearch
category: Docker
date: 2023-12-08 13:57:57
tags: AWS, ELK, OpenSearch
---

这个最后基本上可以确认是一个兼容性问题，测试完成发现， 开启兼容模式的Opensearch+filebeat的组合， filebeat 还是会不定期重启。 

---

## 背景
需求是，使用ES + filebeat 模式在收集日志。 
使用Supervisor作为容器的主进程管理工具，启动后分别运行 应用（这里用nginx代替） + filebeat

现在想要用ECS Fargate， 然后依旧还是这个模式， 尽可能新的变动之前的架构， ES 替换成 OpenSearch。

按照这个路数测试。 

## 创建Opensearch
版本： 
OpenSearch 2.11 (latest)
OpenSearch_2_11_R20231113-P1 (latest)
Availability Zone(s)
1-AZ without standby

## 构建Supervisor管理的容器
### 创建dockerfile
创建dockerfile的部分， 比较难的是 ， 需要找到合适的filebeat版本
参考页面:  [Agents and ingestion tools](https://opensearch.org/docs/latest/tools/index/#agents-and-ingestion-tools)
其他的步骤就下载安装就可以. 
```dockerfile
# 使用官方Nginx作为基础镜像
FROM reg.liarlee.site/docker.io/nginx

# 安装Supervisor
RUN apt-get update && apt-get install -y supervisor
RUN mkdir -p /var/log/supervisor
RUN mkdir -p /etc/filebeat/
#RUN curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.11.3-amd64.deb && dpkg -i filebeat-8.11.3-amd64.deb
RUN curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-oss-7.12.1-amd64.deb && dpkg -i filebeat-oss-7.12.1-amd64.deb


COPY filebeat.yml /etc/filebeat/filebeat.yml
COPY nginx.conf /etc/nginx/nginx.conf

# 将Supervisor配置文件复制到容器中
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 启动Supervisor来管理Nginx进程
CMD [ "/usr/bin/supervisord", "-n" ]
```
### 准备配置文件
需要准备的配置文件一共3个： 
- supervisord.conf  supervisor的管理配置， 决定了那些进程被管理。
```shell
> cat ./supervisord.conf
[unix_http_server]
file=/var/run/supervisor.sock   ; (the path to the socket file)
chmod=0700                       ; socket file mode (default 0700)
chown=nobody:nogroup             ; socket file uid:gid owner

[supervisord]
logfile_maxbytes=50MB                          ; 日志文件的最大大小
logfile_backups=10                             ; 日志文件的备份数
loglevel=info                                  ; 日志级别
nodaemon=false                                 ; 是否以守护进程模式启动Supervisor
minfds=1024                                    ; 可以打开的文件描述符的最小数量
minprocs=200                                   ; 可以创建的进程的最小数量

[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"  ; 启动Nginx的命令
autostart=true                             ; 在Supervisor启动时自动启动
autorestart=true                           ; 程序异常退出后自动重启
stderr_logfile=/var/log/nginx/error.log    ; 错误日志文件路径
stdout_logfile=/var/log/access.log   ; 访问日志文件路径

[program:filebeat]
command=/usr/bin/filebeat -e -c /etc/filebeat/filebeat.yml  ; 启动Filebeat的命令
autostart=true
autorestart=true
stderr_logfile=/var/log/filebeat.err.log
stdout_logfile=/var/log/filebeat.out.log
```
- filebeat.yml   filebeat的配置文件。  这配置文件 GPT 会直接写出一个可以用 `output.opensearch:`， 其实还是不能的， 只能使用原本的配置文件。 (也许是我选择的filebeats版本不正确,  所以不行吧
   
   filebeat本身是es序列里面的产品， 不支持opensearch也合理， 如果写成opensearch 会找不到output 的定义， 也说明并不支持这个字段。

2023-12-14T12:03:12.560Z	INFO	[publisher_pipeline_output]	pipeline/output.go:145	Attempting to reconnect to backoff(elasticsearch(https://vpc-ecs-nginx-opensearch-qt7m5rmhddggkiuapyybcmz5oe.cn-north-1.es.amazonaws.com.cn:443)) with 7 reconnect attempt(s)

```
```shell
> cat ./filebeat.yml
filebeat.inputs:
- type: filestream
  id: nginxaccesslog
  paths:
    - /var/log/access.log
  fields:
    log_type: access

seccomp.enabled: false # 这个不关闭的话可能会是一个干扰。
logging.level: debug # 由于调试方便设置了DEBUG。 

# 这个配置段是关闭 xpack， xpack功能只在es里面提供， 商业版本。
ilm.enabled: false
setup.ilm.enabled: false
setup.pack.security.enabled: false
setup.xpack.graph.enabled: false
setup.xpack.watcher.enabled: false
setup.xpack.monitoring.enabled: false
setup.xpack.reporting.enabled: false

# output就是还用es
output.elasticsearch:
  enable: true
  hosts: ["vpc-ecs-nginx-opensearch-qt7m5rmhddggkiuapyybcmz5oe.cn-north-1.es.amazonaws.com.cn:443"] # 这个部分需要手动指定443, 因为是es的默认配置, 所以直接去 9200,就会连接不上.
  protocol: "https"
```

  xpack 报错的日志大概是这样的： 
>  2023-12-14T12:03:12.560Z	ERROR	[publisher_pipeline_output]	pipeline/output.go:154	Failed to connect to backoff(elasticsearch(https://vpc-ecs-nginx-opensearch-qt7m5rmhddggkiuapyybcmz5oe.cn-north-1.es.amazonaws.com.cn:443)): Connection marked as failed because the onConnect callback failed: request checking for ILM availability failed: 401 Unauthorized: {"Message":"Your request: '/_xpack' is not allowed."}
>  2023-12-14T12:03:12.560Z	INFO	[publisher_pipeline_output]	pipeline/output.go:145	Attempting to reconnect to backoff(elasticsearch(https://vpc-ecs-nginx-opensearch-qt7m5rmhddggkiuapyybcmz5oe.cn-north-1.es.amazonaws.com.cn:443)) with 7 reconnect attempt(s)

- nginx.conf   这个是nginx 应用文件， 模拟一个应用程序， 提供webserver服务。配置文件就是标准的配置文件, 修改一下日志输出的路径. 
```shell 
access_log  /var/log/access.log  main;
```
   由于baseimage用的是nginx的， 所以nginx 的日志输出会软链接到/dev/stdout, filebeat 不收软链接的文件, 开了DEBUG会看到跳过这个文件的日志.

## Buildstage
接下来就可以Build镜像然后进行测试了。 
```shell
> dive build -t reg.liarlee.site/library/superv-nginx:v31 .
> docker push reg.liarlee.site/library/superv-nginx:v31
> docker run -it --name superv-nginx --rm  reg.liarlee.site/library/superv-nginx:v31
```
运行启动之后可以看到输出的日志是： 
```log
2023-12-14 14:03:31,093 INFO success: filebeat entered RUNNING state, process has stayed up for > than 1 seconds (startsecs)
2023-12-14 14:03:31,093 INFO success: nginx entered RUNNING state, process has stayed up for > than 1 seconds (startsecs)
```
然后查看Opensearch 创建了默认index， 名称是`filebeat-7.12.1-2023.12.14`

## 放到 Ecs 里面去
我直接使用我自己的仓库里面拉取了 ，创建ecs service然后curl请求发送到 alb ， 转给 task。 
观察opensearch中收集的访问日志。 