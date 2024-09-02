---
title: 安装 headscale 建立自己的 Tailnet
date: 2023-12-27 21:51:13
category: Application
tags:
  - Linux
  - Tailscale
  - Headscale
  - Network
---
Tailscale 虽然是 mesh 的网络模式, 可以点对点的连接所有设备, 能直连会尽量直接连接, 然鹅还是需要一个默认的 server 来进行服务发现和临时中转流量. 

那么大概的配置框架就已经出现了, 一个服务发现中心, 和多个不同的客户端.
开始的时候直接使用的 tailscale + github 账户登录的方式使用, 然后发现  github 账户直接托管的中心服务不能关闭国外的中转服务器, 这就比较难受, 本来可以直通的线路走了国外的中转不稳定, 会断, 最后还是走国内的便宜云服务器自己维护了一个开源的 headscale 作为中心服务.
### 安装 Headscale
[headscale 官方文档](https://headscale.net/)
现在的 headscale 容器镜像的是有问题的， 不太好用， 还得花时间修。
> Update: 看起来现在是修复了, 并且费点儿劲可以用起来, 但是不确定稳定性如何.

---
我准备了这些: 
- 域名 和 域名证书
- 一台 Debian 的云服务器
- 公网 ip 地址

具体的[安装步骤](https://headscale.net/running-headscale-linux/#installation)就是按照官方网站走下来就可以了. 
一些条件: 
需要注意的地方就是备案, 不备案会导致无法使用 443.
那么需要在tailscale的配置文件中指定端口, 让 tailscale 监听在一个不常用的端口上.

> 因为没有写清楚 server 的地址和端口,  折腾了一天... 一度怀疑是不是换端口也不行, 必须备案 ...

#### 配置文件
```shell
headscale ~$ vim /etc/headscale/config.yaml
# 大约在配置文件的 13行左右.
server_url 这个字段需要写成 https://YOURHOSTNAME.YOURDOMAIN:PORT 就可以了. 
```

大约在配置文件的77行左右, 会有一个 DEPR 集成的服务, 开启这个服务之后, 可以使用当前的服务器直接作为DEPR中转节点.
```yaml
    77	derp:
    78	  server:
    79	    # If enabled, runs the embedded DERP server and merges it into the rest of the DERP config
    80	    # The Headscale server_url defined above MUST be using https, DERP requires TLS to be in place
    81	    enabled: true
```

绑定证书的位置在大约 151行之后, 我使用自己签发的证书, 就是直接配置 182 183 两行的参数就行. 
```yaml
   181	## Use already defined certificates:
   182	tls_key_path: /path/to/cert.key
   183	tls_cert_path: /path/to/cert.pem
```
关闭了官方的DERP服务列表: 
```yaml
    98	  # List of externally available DERP maps encoded in JSON
    99	  #urls:
   100	  #  - https://controlplane.tailscale.com/derpmap/default
   101	
   102	  # Locally available DERP map files encoded in YAML
   103	  #
   104	  # This option is mostly interesting for people hosting
   105	  # their own DERP servers:
   106	  # https://tailscale.com/kb/1118/custom-derp-servers/
   107	  #
   108	  # paths:
   109	  #   - /etc/headscale/derp-example.yaml
   110	  paths: []
```
关闭了 OverwriteDNS, 总是会尝试将客户的默认DNS服务器重写为 TailNet DNS.
```yaml
   204	dns_config:
   205	  # Whether to prefer using Headscale provided DNS or use local.
   206	  override_local_dns: false
```
### 安装tailscale客户端
按照[安装文档](https://tailscale.com/kb/installation)直接安装, 不一样的发行版(是的, Windows 也是 Linux 发行版) 安装方式不同, 基本上启动之后都能用, 完成度非常高.

#### 注册节点的命令
节点注册命令记录. 
```shell
sudo tailscale up --accept-dns=false --advertise-exit-node --advertise-routes=192.168.31.0/24 --login-server=https://YOURHOSTNAME.YOURDOMAIN:PORT --accept-routes
# 也可以是: 
sudo tailscale up --accept-dns=false --advertise-exit-node --login-server=https://YOURHOSTNAME.YOURDOMAIN:PORT --accept-routes
# 或者是: 
sudo tailscale up --accept-dns=false --login-server=https://YOURHOSTNAME.YOURDOMAIN:PORT --accept-routes
# 最后是: 
sudo tailscale up --accept-dns=true --login-server=https://YOURHOSTNAME.YOURDOMAIN:PORT --accept-routes
```
这个命令执行完毕之后, 会返回一个网页, 网页打开里面有一个命令, 复制命令去 headscale 服务器的命令行(bash)里面执行一下,节点就注册进来了.

### 更新运行中的 Tailscale 客户端的设置
最近需要更新我的一个节点， 发布 VPC 内的 CIDR 块, 这个设置之前没有 advertise-route 参数进行更新 。
这个实例在我的默认VPC里面， 这样的话这个实例就直接变成了这个VPC内的IGW, 流量会通过这个实例发送到VPC内, 可以直接将这个网络范围内的DNS指向VPC内的 .2 Resolver, 甚至感觉可以直接在家用 EFS 这类的东西了. 

当然, 如果节点需要变动之前运行的参数, 是需要给出和之前一致的参数, 然后添加 或者 变更其中的一部分的.

```shell
sudo tailscale up --accept-dns=false --advertise-exit-node --login-server=https://YOURHOSTNAME.YOURDOMAIN:PORT --accept-routes --advertise-routes=172.31.0.0/16
```

### 问题汇总
查看当前客户端的网络状况
```shell
╰─>$ tailscale netcheck
Report:
	* UDP: true
	* IPv4: yes, PUBLIC_IP:35941
	* IPv6: no, but OS has support
	* MappingVariesByDestIP: false
	* PortMapping:
	* CaptivePortal: false
	* Nearest DERP: Headscale Embedded DERP
	* DERP latency:
		- headscale: 24.3ms  (Headscale Embedded DERP)
```
测试ping:
```shell
╰─>$ tailscale ping --until-direct -c 0 100.64.0.9
pong from home-SOME_NODE (100.64.0.9) via PUBLIC_IP:50177 in 6ms
```