---
title: Nginx反向代理笔记
date: 2019-07-13 17:50:39
categories: Linux
tags: Nginx
---

Nginx的反向代理笔记。
## Nginx程序的主要功能
1. load configuration
1. launch workers
1. non-stop upgrade

可以使用epoll单进程响应多个用户请求，如果是BSD可以使用kevent时间驱动模式响应。
磁盘一侧使用的是高级IO中的sendfile机制，AIO异步IO，以及内存映射机制来完成硬盘IO的高级特性。
- Nginx官方文档及参数说明在这里： [nginx documentation](http://nginx.org/en/docs/)

### SNAT && DNAT
主要是工作在三层/四层的协议
SNAT主要的功能是**隐藏客户端**，DNAT对服务器**接受并转发请求**。
NAT功能无法触及7层协议的上面三层，所以无权控制上面的数据包内容，所以NAT不能对应用层的内容作出更改及缓存。只能对网络的内容及数据包进行直接的转发以及控制。

### 正向代理 && 反向代理
正向代理是通过代理服务器**对客户端发出**的请求进行**全部修改及转发**；
反向代理是通过代理服务器**对发送到服务器**的请求进行**全部修改及转发**；
由于代理的服务器可以控制判定URL的资源内容，因此可以对站点进行动静分离处理。
如果这个功能可以工作在应用层叫做代理，如果工作类似SNAT上的叫做正向代理，工作类似DNAT就叫做反向代理。

## Nginx反向代理服务器
- 面向客户端：该方向支持两种协议： http/https
- 面向服务端：该方向支持HTTP/FastCGI/memcache协议
Nginx需要支持相关的协议需要有相关协议的对应模块  
原理以及流程：  
    从远程服务器取得数据进行nginx服务器本地的缓存，然后响应给客户端.
可修改或具有修改意义的报文有两种：第一种是发到后面处理服务器的报文；第二种是发给客户端的响应报文。

## Nginx的代理模块
1. ngx_http_proxy_module -- Nginx的反向代理模块官方说明：[Module ngx_http_proxy_module](http://nginx.org/en/docs/http/ngx_http_proxy_module.html)  
    添加新的反向代理服务配置文件：
    vim /etc/nginx/conf.d/proxy.conf
    ```
        server {
            listen 80；
            server_name [SERVER_FQDN]
            location / {
                proxy_pass http://[IP_ADDR:PORT]
                # 字段后加上/表示将location后的目录映射为后端服务器的目录；
                # 例如：如果是location /test，那么在反向代理不加/的时候，访问的是后端真实的/test目录；
                # 如果加上/，访问到的是后端服务器的根目录；
                # 当使用了正则表达式进行了匹配的时候后面不能添加/符号；
            }
        
            location ~* \.{jpg|jpeg|png}$ {
                proxy_pass http://[IP_ADDR:PORT];
                # 正则表达模式下部分在代理服务器的地址后面加上/；
            }
        }
    ```
1. proxy_pass [RealServerAddress]；# 设置反向代理服务器的地址；  
    proxy_set_header [field] [value]; # 设定传递到后端服务器的请求报文首部的值；  
    proxy_set_header -- Nginx的设定代理头文件参数模块的官方说明：[proxy_set_header](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_set_header)    

    ``` 
    proxy_set_header X-Real-IP $remote_addr;
    在设定字段后，更改后端真实服务器的日志记录的值，即可记录所有的真正的客户端IP；  
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  
    ```

1. proxy_http_headers_module # 设定发给客户端的响应报文的地址的值；  
    Module ngx_http_headers_module -- Nginx的客户端响应报文模块官方说明：  [Module ngx_http_headers_module](http://nginx.org/en/docs/http/ngx_http_headers_module.html)  

    ```
    add_header X_Via $server_addr;` # 显示后端服务器的真实地址；
    ```
