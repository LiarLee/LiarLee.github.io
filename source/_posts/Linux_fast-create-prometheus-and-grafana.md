---
title: 快速启动一个 prometheus 和 grafana 
category: Linux
date: 2023-05-25 15:52:20
tags: Docker
---

快速创建一个可用的 prometheus 和 grafana 进行测试， 并将数据保留在当前的目录中， 在重启之后数据不会丢失： 

1. 创建一个目录.

   ```bash
mkdir /opt/monitor
mkdir /opt/monitor/grafana
mkdir /opt/monitor/prometheus
touch /opt/monitor/docker-compose.yaml
   ```

2. 创建docker-compose 文件

   ```yaml
   ---
   version: "3"
   services:
     prometheus:
       container_name: prometheus
       image: reg.liarlee.site/docker.io/prom/prometheus:latest
       restart: always
       network_mode: host
       environment:
         - TZ=Asia/Shanghai
       volumes:
         # - /opt/monitor/prometheus/prometheus.yaml:/etc/prometheus/prometheus.yml
         - /opt/monitor/prometheus_data:/prometheus
       command:
         - '--config.file=/etc/prometheus/prometheus.yml'
         - '--storage.tsdb.path=/prometheus'
         - '--web.console.libraries=/usr/share/prometheus/console_libraries'
         - '--web.console.templates=/usr/share/prometheus/consoles'
         - '--storage.tsdb.retention.time=90d'
     grafana:
       container_name: grafana
       image: reg.liarlee.site/docker.io/grafana/grafana-oss:main-ubuntu
       restart: always
       network_mode: host
       environment:
         - TZ=Asia/Shanghai
       volumes:
         - /opt/monitor/grafana_data:/var/lib/grafana
         - /opt/monitor/grafana/datasource:/etc/grafana/provisioning/datasources
         # - /opt/monitor/grafana/grafana.ini:/etc/grafana/grafana.ini
         - /etc/localtime:/etc/localtime:ro
       user: '472'
   ```

3. 准备基础配置文件

   ```bash
   docker compose up -d 
   docker cp monitor-grafana-1:/etc/grafana/grafana.ini /opt/monitor/grafana/grafana.ini
   docker cp monitor-prometheus-1:/etc/prometheus/prometheus.yml /opt/monitor/prometheus/prometheus.yaml
   touch /opt/monitor/grafana/datasource/datasource.yml
   
   chown -R 472:472 /opt/monitor/grafana_data
   chown -R 472:472 /opt/monitor/grafana
   chown -R nobody:nobody /opt/monitor/prometheus_data
   chown -R nobody:nobody /opt/monitor/prometheus
   
   docker compose down --remove-orphans
   ```

4. 修改配置文件中需要的参数, 然后重启即可。

   ```bash
   docker compose down --remove-orphans && docker compose up -d
   ```

   



