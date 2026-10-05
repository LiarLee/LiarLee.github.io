---
title: fish shell 配置开关代理
date: 2026-01-26 21:29:32
description: 在 fish shell 中定义 proxy / unproxy 两个自动加载函数，一键设置与清空终端代理环境变量。
categories: Linux
tags:
  - Application
  - fish
  - proxy
---
通过 fish shell 的命令来控制是否启用代理服务器.  直接创建这2个配置, 并通过命令 `proxy`, `unproxy`, 开启或者关闭.  


`touch ~/.config/fish/functions/proxy.fish`

```fish
function proxy
    set -l host "10.0.0.2"
    set -l port "10890"
    set -l bypass "localhost,127.0.0.1,::1,.local,.ucloud.cn,.aliyun.com,.tsinghua.edu.cn"

    set -gx http_proxy "http://$host:$port"
    set -gx https_proxy "http://$host:$port"
    set -gx all_proxy "socks5h://$host:$port"
    set -gx no_proxy "$bypass"

    set -gx HTTP_PROXY $http_proxy
    set -gx HTTPS_PROXY $https_proxy
    set -gx ALL_PROXY $all_proxy
    set -gx NO_PROXY "$bypass"

    echo "Terminal Proxy: \033[32mON\033[0m"
    echo "Bypassed: \033[33m$no_proxy\033[0m"
end
```

`touch ~/.config/fish/functions/unproxy.fish`

```fish
function unproxy
    set -e http_proxy
    set -e https_proxy
    set -e all_proxy
    set -e no_proxy
    set -e HTTP_PROXY
    set -e HTTPS_PROXY
    set -e ALL_PROXY
    set -e NO_PROXY
    echo "Terminal Proxy: \033[31mOFF\033[0m"
end
```
