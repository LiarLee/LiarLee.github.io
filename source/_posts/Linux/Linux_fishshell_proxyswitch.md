---
title: fish shell 配置开关代理
date: 2026-01-26 21:29:32
category: Linux
tags:
  - Application
  - fish
  - proxy
---
编辑fish配置文件：`~/.config/fish/config.fish`

```shell
function pxy
  set -xg ALL_PROXY socks5://192.168.31.50:30170
end
​
function npxy
  set -e ALL_PROXY
end
```