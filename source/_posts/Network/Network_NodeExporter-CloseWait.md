---
title: 容器运行的NodeExporter出现异常的 CloseWait
category: Linux
date: 2024-05-30 01:46:37
tags:
  - Linux
  - Application
  - Network
  - Docker
---
我在自己的小主机上面部署了NodeExporter来收集指标, 并输出到 Prometheus 里面, 做持久化保存. 

这两天看这个小主机的温度非常的不顺眼, 摸上去感觉有点烫手, 看 htop 显示这个温度大概是 50 +.

今天上午出门之前想了一下, 反正平时也没有什么负载, 调整了一下 PVE host 的 CPU 主频, 然后就出门了.
```shell  
cpupower frequency-set -g poweroff
cpupower frequency-set -u 2GHz
```

就是因为这个调整, 我晚上回来的时候发现, Grafana 少了三个 PVE VM 的监控指标. 
- 第一反应是 node exporter docker 容器退出了, 就登录到 VM 里面去查看, node exporter 容器并没有退出.
- ss 命令查看 连接数 以及 连接状态, 发现访问 9100 端口的连接都在 CloseWait 这个状态.

> CloseWait 状态表示, 当前它作为被关闭连接的一方没有及时的Close socket. 应用程序没有对这个连接的 socket 正常关闭. 然而对端已经完成的 FIN, 并且断开连接了.

我还没有意识到问题发生在什么地方,以为是 Node Exporter 的代码可能有问题.
然后重启了一下 Node Exporter 的容器, 发现重启之后并不解决问题, CloseWait还是会慢慢的增加. 
随着更多的连接转为 CloseWait, 使用 curl 访问 NodeExporter 暴露数据的 9100 接口会直接报错. 新的连接无法正常建立, curl 命令会阻塞一直到超时.
Node Exporter 的日志有下面的内容:
```
Maximum allowed concurrent requests threshold(40) was breached
```

接下来我认为是 Node Exporter 出现了问题, 准备检查自己的容器配置. 都是 docker-compose 启动的, 应用的代码只能是镜像的问题, 因此重新pull 新镜像. 问题依旧.

继续查看 docker-compose 的 配置文件的时候我看到了问题的答案. 我在 NodeExporter 的配置文件里面设置了 limit 和 reservation. ( 这真的是个好习惯...
limit 设置了 CPU : 0.1
```yaml
    deploy:
      resources:
        limits:
          cpus: '0.10'
          memory: 100M
        reservations:
          cpus: '0.10'
          memory: 100M
```

看到这个配置的时候我感觉我可能找到了 CPU 提供给应用程序的时间不足, 也会造成 CloseWait. 
在调整了CPU limit 之后, CloseWait 状态的连接就看不到了. Prometheus 抓取指标正常, curl 请求接口返回的数据正常.

那么问题的原因就找到了: 
之前的宿主机 CPU 主频够高, 效率比较高, 所以在 容器的 limit 里给了 0.1 也来得及处理完连接然后关闭socket.
我在 PVE Host 上面直接给 CPU 降频, 原来的 0.1 CPU 不够了. 之前的数据传出之后, 下一个请求进来继续建立连接发送数据, 这样导致创建出来的多, 关闭的socket少, 在超出了NodeExporter的并发连接限制之后就,  NodeExporter 直接就不接受新的请求了.

