---
title: git使用以及命令记录
date: 2022-12-19 17:54:11
tags: Linux
---


发现不同的shell 配置代理的地址和环境变量有差别， 最终的结果也不太一样，有的可以正确的使用代理，有的不能， 今天遇到的是Git的， 把命令记下来 下次直接复制吧， 我实在是烦了。

```bash
# 设置代理
ec2-user@arch ~> git config --global http.proxy socks5://1.1.1.1:30890
ec2-user@arch ~> git config --global https.proxy socks5://1.1.1.1:30890
# 取消代理
git config --global --unset http.proxy git config --global --unset https.proxy
```

