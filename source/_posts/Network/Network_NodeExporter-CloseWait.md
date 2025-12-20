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

## 1. 故障背景

最近在对家里的 PVE（Proxmox VE）环境做功耗优化。为了省电，我通过 `cpupower` 命令限制了宿主机的 CPU 频率，并使用了节能模式。同时，为了防止监控组件占用过多资源，之前我已经在 NodeExporter 的 Docker 容器中配置了极低的 CPU 限制。

**环境设置：**
*   **监控组件：** NodeExporter (Docker 容器部署) -> Prometheus -> Grafana
*   **宿主机功耗调整命令：**
    ```bash
    cpupower frequency-set -g powersave
    cpupower frequency-set -u 2GHz
    ```
*   **Docker 限制配置 (`docker-compose.yml`)：**
    ```yaml
    deploy:
      resources:
        limits:
          cpus: '0.1'  # 限制只使用 0.1 核
    ```

## 2. 问题现象

晚上回家查看 Grafana 面板时，发现有三台 VM 的监控数据突然中断了（No Data）。

**初步排查：**
1.  **检查容器状态：** 第一反应是 NodeExporter 容器挂了。登录到 VM 执行 `docker ps`，发现容器状态依然是 `Up`，并没有退出。
2.  **网络连接检查：** 使用 `ss` 命令查看端口连接情况，发现了异常：
    ```bash
    ss -natp | grep 9100
    ```
    输出显示，所有与 Prometheus 建立的连接都处于 **`CLOSE_WAIT`** 状态，且数量非常多。

3.  **手动请求测试：** 尝试在本地 `curl` 接口：
    ```bash
    curl http://localhost:9100/metrics
    ```
    命令直接阻塞，直到超时报错，无法获取数据。

4.  **查看容器日志：**
    ```bash
    docker logs --tail 20 node-exporter
    ```
    日志中刷屏出现关键报错：
    ```text
    Maximum allowed concurrent requests threshold(40) was breached
    ```

## 3. 根因分析

起初我怀疑是 NodeExporter 代码有 Bug 或者是网络问题，重启容器后短时间内恢复，但随后 `CLOSE_WAIT` 再次缓慢增加，直到再次“假死”。

结合日志和配置，最终确认这是一起典型的**“资源饥饿”导致的雪崩效应**。

### 核心原因：CPU 限制过低 (CFS Quota Throttling)

Docker 的 `cpus: 0.1` 限制意味着在每 100ms 的时间窗口内，该容器只能使用 **10ms** 的 CPU 时间。加上宿主机主频被我锁死在 2GHz，导致 NodeExporter 的处理能力被断崖式削弱。

### 故障发生链条：
1.  **采集变慢：** NodeExporter 在读取 `/proc` 和 `/sys` 文件系统时需要消耗 CPU 进行文本解析。由于 CPU 严重受限，原本毫秒级的采集任务被内核频繁挂起（Throttle），耗时被拉长数秒甚至十几秒。
2.  **Prometheus 超时断连：** Prometheus 默认抓取超时（Scrape Timeout）通常为 10秒。当采集耗时超过这个时间，Prometheus 判定抓取失败，发送 `FIN` 包主动断开连接。
3.  **CLOSE_WAIT 堆积：**
    *   TCP 协议中，收到 `FIN` 包的一方需要调用 `close()` 才能完成关闭。
    *   此时 NodeExporter 的线程正卡在 CPU 调度队列里排队，或者正在慢吞吞地处理上一个采集逻辑，**根本抢不到 CPU 时间片来处理“关闭连接”这个动作**。
    *   因此，连接停留在了 `CLOSE_WAIT`（等待应用程序关闭）状态。
4.  **并发阈值溢出：**
    *   旧的连接没关掉，Prometheus 新的抓取请求（每 15秒一次）又进来了。
    *   NodeExporter 默认限制并发请求数为 **40**。
    *   随着 `CLOSE_WAIT` 和正在处理的卡顿请求越积越多，最终达到 40 个上限，触发 `threshold breached` 报错，拒绝所有新请求。

## 4. 解决方案

问题的根源不在于程序，而在于**在这个主频下，0.1 个核根本无法满足 Go 语言运行时（包括 GC）和业务逻辑的最小需求**。

**修正方法：**
放宽 CPU 限制。对于 NodeExporter 这种平时负载极低、但采集瞬间需要突发算力的应用，不建议设置过严的硬限制。

修改 `docker-compose.yml`：
```yaml
deploy:
  resources:
    limits:
      cpus: '0.5'   # 提升到 0.5 或直接移除该限制
```

调整后重启容器，`CLOSE_WAIT` 迅速消失，监控曲线恢复正常。

## 5. 经验总结

1.  **CLOSE_WAIT 既然是“等待应用程序关闭”**，如果不减少，通常说明应用程序"卡住"了（死锁、IO阻塞或CPU饥饿）。
2.  **不要过度优化。** 监控组件本身需要消耗资源来观察资源。在低功耗设置下（低主频），Docker 的 CPU limit 需要更加谨慎，`0.1` 这种数值在现代化高层语言（如 Go/Java）运行时中非常危险，极易导致 GC 无法完成或线程调度延迟。
3.  **日志是关键。** `threshold breached` 这行日志直接把问题指向了并发处理能力不足，从而引导我们去检查资源配额。