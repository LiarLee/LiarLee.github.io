---
title: 配置自管理的Tailscale网络
category: Linux
date: 2023-12-27 21:51:13
tags:
  - Linux
  - Tailscale
  - Headscale
  - Network
---
Tailscale 虽然是 mesh 的网络模式, 可以点对点的连接所有设备, 能直连会尽量直接连接, 然鹅还是需要一个默认的server来进行服务发现和临时中转流量. 

那么大概的配置框架就已经出现了, 一个服务发现中心, 和多个不同的客户端.
开始的时候直接使用的tailscale + github账户登录的方式使用, 然后发现  github 账户直接托管的中心服务不能关闭国外的中转服务器, 这就比较难受, 本来可以直通的线路走了国外的中转不稳定, 会断, 最后还是走国内的便宜云服务器自己维护了一个开源的headscale作为中心服务.

大概的步骤如下吧: 
## 安装headscale

[官方文档](https://headscale.net/) 

现在的 docker 的版本是有问题的。。。。别用

我准备了这些: 
- 域名, 域名证书
- 一台debian的云服务器
- 公网ip地址

具体的[安装步骤](https://headscale.net/running-headscale-linux/#installation)就是按照官方网站走下来就可以了. 
需要注意的地方就是备案, 不备案会导致无法使用 443, 那么需要在tailscale的配置文件中指定端口, 让tailscale 监听在一个不常用的端口上.
记录一下命令, 我因为没有写清楚 server 的地址和端口,  折腾了一天... 一度怀疑是不是换端口也不行, 必须备案 ...

### 配置文件
```shell
headscale ~$ vim /etc/headscale/config.yaml
# 大约在配置文件的 13行左右.
server_url 这个字段需要写成 https://YOURHOSTNAME.YOURDOMAIN:PORT 就可以了. 
```

大约在配置文件的77行左右, 会有一个 DEPR 集成的服务, 开启这个服务之后, 可以使用当前的服务器直接作为DEPR中转节点, 我开了.
```
    77	derp:
    78	  server:
    79	    # If enabled, runs the embedded DERP server and merges it into the rest of the DERP config
    80	    # The Headscale server_url defined above MUST be using https, DERP requires TLS to be in place
    81	    enabled: true
```

绑定证书的位置在大约 151行之后, 我使用自己签发的证书, 就是直接配置 182 183 两行的参数就行. 
```
   181	## Use already defined certificates:
   182	tls_key_path: /path/to/cert.key
   183	tls_cert_path: /path/to/cert.pem
```

## 安装tailscale客户端
按照[安装文档](https://tailscale.com/kb/installation)直接安装, 不一样的发行版(是的, Windows 也是 Linux 发行版) 安装方式不同, 基本上启动之后都能用, 完成度非常高.

### 注册节点的命令
节点注册命令记录. 
```shell
sudo tailscale up --accept-dns=false --advertise-exit-node --advertise-routes=192.168.31.0/24 --login-server=https://YOURHOSTNAME.YOURDOMAIN:PORT --accept-routes
# 也可以是: 
sudo tailscale up --accept-dns=false --advertise-exit-node --login-server=https://YOURHOSTNAME.YOURDOMAIN:PORT --accept-routes
# 或者是: 
sudo tailscale up --accept-dns=false --login-server=https://YOURHOSTNAME.YOURDOMAIN:PORT --accept-routes
# 还能是: 
sudo tailscale up --accept-dns=false --login-server=https://YOURHOSTNAME.YOURDOMAIN:PORT --accept-routes --force-reauth
# 最后是: 
sudo tailscale up --accept-dns=true --login-server=https://YOURHOSTNAME.YOURDOMAIN:PORT --accept-routes


这个命令执行完毕之后, 会返回一个网页, 网页打开里面有一个命令, 复制命令去 headscale 服务器的命令行(bash)里面执行一下,节点就注册进来了.
```