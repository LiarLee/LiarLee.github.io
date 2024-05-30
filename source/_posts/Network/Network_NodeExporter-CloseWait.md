---
title: 容器运行的NdoeExporter出现异常的 CloseWait
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

今天上午出门之前想了一下, 反正平时也没有什么负载, 调整了一下 PVE host 的主频, 然后就出门了.
```shell  
cpupower frequency-set -g poweroff
cpupower frequency-set -u 2GHz
```

就是因为这个调整, 我晚上回来的时候发现, 我的Grafana PVE 的主机少了三个的监控指标. 
以为docker容器退出了, 就登录到VM里面去查看.
docker 容器并没有退出.
发现访问 9100 端口的连接都在 CloseWait 这个状态.

> 这个状态表示, 当前的os作为被关闭连接的一方没有及时的Close socket. 也就是说, 应用程序没有释放这个连接, 对端已经完成的FIN, 并且断开连接了.

我还没有意识到问题发生在什么地方,以为是NodeExporter的容器是不是出了bug.
然后重启了一下 nodeExporter 的容器, 发现重启之后并不解决问题, 还是会慢慢的增加. 
随着更多的连接转为 CloseWait, 使用curl访问 NodeExporter 暴露数据的接口会直接报错. 新的连接无法正常建立, curl 命令会阻塞一直到超时.
```
Maximum allowed concurrent requests threshold(40) was breached
```

接下来我认为是 NodeExporter 出现了问题, 准备检查自己的容器配置. 
我这边都是docker-compose 启动的, 应用的代码只能是镜像的问题, 因此重新pull了一遍镜像. 问题依旧.

查看docker-compose 的 yaml 文件的时候我看到了问题的原因.
我在启动 NodeExporter 的时候设置了 limit 和 reservation.( 这真的是个好习惯...

limit 设置了 CPU : 0.1

CPU 如果时间不足, 也会造成 CloseWait. 
在调整了CPU limit 之后, CloseWait 状态的连接就看不到了. Prometheus 抓取的指标的状态也正常了.

那么问题的原因就找到了: 
之前的宿主机 CPU 主频够高, 效率比较高, 所以在 容器的 limit 里给了 0.1 也来得及处理完连接然后关闭socket.
我在 PVE 上面直接给 CPU 降频, 原来的 0.1 CPU 不够了. 之前的数据传出之后, 下一个请求进来继续建立连接发送数据, 这样导致创建出来的多, 关闭的socket少, 在超出了NodeExporter的并发连接限制之后就,  NodeExporter 直接就摆烂了, 这些连接没有关闭完就不创建新的了.

好吧, 这是第一次真的碰到因为CPU的原因CloseWait了, 之前还一直在找复现的场景, 这下找到了.

