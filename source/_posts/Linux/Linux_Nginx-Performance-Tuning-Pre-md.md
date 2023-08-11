---
title: Nginx性能调整（不一定对
date: 2022-12-27 12:53:02
tags: Linux
---

# Nginx 性能优化
看了不少的文档和说明， 尝试调整一下Nginx，看看与默认的设置性能表现能有多大的差距,顺便记录一下步骤，不记录的话自己会忘记的。 
## sysctl 参数
```bash
~]$ cat /etc/sysctl.d/99-hayden.cof
net.ipv4.tcp_wmem = 8192 4194304 8388608
net.ipv4.tcp_rmem = 8192 4194304 8388608

net.core.somaxconn = 262144

net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr
```
## Nginx Config
```bash
~]$ cat /etc/nginx/nginx.conf

user nginx;
worker_processes 1;
worker_cpu_affinity 10;
# error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# Load dynamic modules. See /usr/share/doc/nginx/README.dynamic.
include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 10240;
}
...# 后面的都是默认值。
```

## Systemd Nginx Service
```bash
~]$ systemctl cat nginx
# /usr/lib/systemd/system/nginx.service
[Unit]
Description=The nginx HTTP and reverse proxy server
After=network-online.target remote-fs.target nss-lookup.target
Wants=network-online.target

[Service]
Type=forking
PIDFile=/run/nginx.pid
# Nginx will fail to start if /run/nginx.pid already exists but has the wrong
# SELinux context. This might happen when running `nginx -t` from the cmdline.
# https://bugzilla.redhat.com/show_bug.cgi?id=1268621
ExecStartPre=/usr/bin/rm -f /run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t
ExecStart=/usr/sbin/nginx
ExecReload=/usr/sbin/nginx -s reload
KillSignal=SIGQUIT
TimeoutStopSec=5
KillMode=process
PrivateTmp=true
LimitAS=infinity
LimitRSS=infinity
LimitCORE=infinity
LimitNOFILE=65536
LimitNPROC=65535
Nice=-20

[Install]
WantedBy=multi-user.target
```
## CPU Isolate
```bash
~]$ cat /etc/default/grub
GRUB_CMDLINE_LINUX_DEFAULT="console=tty0 console=ttyS0,115200n8 net.ifnames=0 biosdevname=0 nvme_core.io_timeout=4294967295 rd.emergency=poweroff rd.shell=0 isolcpus=1 nohz_full=1 rcu_nocbs=1"
GRUB_TIMEOUT=0
GRUB_DISABLE_RECOVERY="true"
GRUB_TERMINAL="ec2-console"
GRUB_X86_USE_32BIT="true"
```

## 调整中断
```bash
~]$ cat /proc/interrupts
           CPU0       CPU1
 27:          0        845   PCI-MSI 81920-edge      ena-mgmnt@pci:0000:00:05.0
 28:    1455005          0   PCI-MSI 81921-edge      eth0-Tx-Rx-0
 29:          0    1870959   PCI-MSI 81922-edge      eth0-Tx-Rx-1
LOC:     119785      15755   Local timer interrupts

~]$ echo 0 > /proc/irq/29/smp_affinity_list
~]$ echo 0 > /proc/irq/28/smp_affinity_list
~]$ echo 0 > /proc/irq/27/smp_affinity_list
```

## 关闭 irqbalance
```bash
~]$ sudo systemctl stop irqbalance.service
~]$ sudo systemctl disable irqbalance.service
Removed symlink /etc/systemd/system/multi-user.target.wants/irqbalance.service.
```

# 测试
这些都做完之后，启动一个新的实例，安装nginx之后不做任何的动作， 使用ab命令测试默认页 index.html。 对比
## 调整后的实例结果如下

使用命令： `ab -c 3000 -n 50000 http://172.31.37.166:80/index.html`

### 第一次
```
Document Path:          /index.html
Document Length:        732 bytes

Concurrency Level:      3000
Time taken for tests:   2.225 seconds
Complete requests:      50000
Failed requests:        0
Total transferred:      48250000 bytes
HTML transferred:       36600000 bytes
Requests per second:    22474.64 [#/sec] (mean)
Time per request:       133.484 [ms] (mean)
Time per request:       0.044 [ms] (mean, across all concurrent requests)
Transfer rate:          21179.71 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   67 139.7     47    1124
Processing:    25   63  16.1     61     274
Waiting:        0   47  13.7     46     254
Total:         57  130 143.2    106    1191

Percentage of the requests served within a certain time (ms)
  50%    106
  66%    125
  75%    131
  80%    135
  90%    142
  95%    149
  98%    165
  99%   1173
 100%   1191 (longest request)
```
### 第二次
```
Document Path:          /index.html
Document Length:        732 bytes

Concurrency Level:      3000
Time taken for tests:   2.232 seconds
Complete requests:      50000
Failed requests:        0
Total transferred:      48250000 bytes
HTML transferred:       36600000 bytes
Requests per second:    22397.25 [#/sec] (mean)
Time per request:       133.945 [ms] (mean)
Time per request:       0.045 [ms] (mean, across all concurrent requests)
Transfer rate:          21106.78 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   67 141.3     47    1092
Processing:    22   63  15.8     60     106
Waiting:        0   47  13.5     46      84
Total:         60  130 143.5    108    1175

Percentage of the requests served within a certain time (ms)
  50%    108
  66%    122
  75%    131
  80%    134
  90%    141
  95%    149
  98%    165
  99%   1150
 100%   1175 (longest request)
```
### 第三次
```
Document Path:          /index.html
Document Length:        732 bytes

Concurrency Level:      3000
Time taken for tests:   2.220 seconds
Complete requests:      50000
Failed requests:        0
Total transferred:      48250000 bytes
HTML transferred:       36600000 bytes
Requests per second:    22526.08 [#/sec] (mean)
Time per request:       133.179 [ms] (mean)
Time per request:       0.044 [ms] (mean, across all concurrent requests)
Transfer rate:          21228.19 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   64 123.5     49    1087
Processing:    35   65  15.1     63     108
Waiting:        0   48  13.2     48      88
Total:         61  129 125.5    115    1166

Percentage of the requests served within a certain time (ms)
  50%    115
  66%    123
  75%    132
  80%    136
  90%    140
  95%    145
  98%    159
  99%   1139
 100%   1166 (longest request)
```

## 并未调整的实例结果如下

使用命令：`ab -c 3000 -n 50000 http://172.31.45.66:80/index.html`
### 第一次
```
Document Path:          /index.html
Document Length:        615 bytes

Concurrency Level:      3000
Time taken for tests:   2.197 seconds
Complete requests:      50000
Failed requests:        9856
   (Connect: 0, Receive: 0, Length: 4928, Exceptions: 4928)
Total transferred:      38221056 bytes
HTML transferred:       27719280 bytes
Requests per second:    22754.61 [#/sec] (mean)
Time per request:       131.841 [ms] (mean)
Time per request:       0.044 [ms] (mean, across all concurrent requests)
Transfer rate:          16986.43 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   61 115.4     47    1110
Processing:    23   65  15.2     65     112
Waiting:        0   45  18.6     48      88
Total:         61  126 115.4    111    1209

Percentage of the requests served within a certain time (ms)
  50%    111
  66%    120
  75%    125
  80%    128
  90%    139
  95%    144
  98%    157
  99%   1143
 100%   1209 (longest request)

```
### 第二次
```
Document Path:          /index.html
Document Length:        615 bytes

Concurrency Level:      3000
Time taken for tests:   2.202 seconds
Complete requests:      50000
Failed requests:        9408
   (Connect: 0, Receive: 0, Length: 4704, Exceptions: 4704)
Total transferred:      38411008 bytes
HTML transferred:       27857040 bytes
Requests per second:    22710.18 [#/sec] (mean)
Time per request:       132.099 [ms] (mean)
Time per request:       0.044 [ms] (mean, across all concurrent requests)
Transfer rate:          17037.52 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   64 123.9     48    1089
Processing:    22   65  15.9     65     116
Waiting:        0   46  18.9     48      89
Total:         65  128 125.4    111    1171

Percentage of the requests served within a certain time (ms)
  50%    111
  66%    124
  75%    128
  80%    132
  90%    141
  95%    146
  98%    166
  99%   1124
 100%   1171 (longest request)

```
### 第三次
```
Document Path:          /index.html
Document Length:        615 bytes

Concurrency Level:      3000
Time taken for tests:   2.236 seconds
Complete requests:      50000
Failed requests:        9216
   (Connect: 0, Receive: 0, Length: 4608, Exceptions: 4608)
Total transferred:      38492416 bytes
HTML transferred:       27916080 bytes
Requests per second:    22361.25 [#/sec] (mean)
Time per request:       134.161 [ms] (mean)
Time per request:       0.045 [ms] (mean, across all concurrent requests)
Transfer rate:          16811.30 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   64 111.8     52    1110
Processing:    26   67  15.8     67     113
Waiting:        0   47  19.0     49      86
Total:         65  130 114.2    118    1205

Percentage of the requests served within a certain time (ms)
  50%    118
  66%    126
  75%    131
  80%    134
  90%    141
  95%    147
  98%    158
  99%   1117
 100%   1205 (longest request)
```

# 总结
如果对比的话， 可以明显的发现，Connection Time 的输出中， 明显看到Processing 阶段（在 15.8 - 16.1 之间） 和 Waiting阶段 （在 13.2 - 13.7 之间） 变得稳定。

观察CPU使用率， 默认的设置 CPU 的使用率在多个核心之间均衡， IRQ以及 us sys 在多个核心上平均分布。
调整之后， Nginx在CPU1上处理数据， 中断以及其他进程完全跑满CPU0， Nginx单独在CPU1上面工作， 最大程度的处理数据。 这也是ab命令中返回的 processing time 更短更稳定的原因（大概。

在调整之后， CPU1 上面会触发大量的RES中断， 这会导致当前的CPU无法完全的跑满， 这个部分还是一个问题， 我不知道RES的中断能不能也移除， 不过我感觉这个可能并不能， 应该是调度的需要， 但是过多的中断数量本身也会导致性能问题， 可能还有其他的解法， 暂时不去考虑了。遗留。

# 附加静态页面之后的测试
Hexo Render Project
## 调整之后的测试
命令： `ab -c 3000 -n 50000 http://172.31.37.166:80/index.html`
### 第一次
```bash
Document Path:          /index.html
Document Length:        35312 bytes

Concurrency Level:      3000
Time taken for tests:   3.373 seconds
Complete requests:      50000
Failed requests:        0
Total transferred:      1777400000 bytes
HTML transferred:       1765600000 bytes
Requests per second:    14822.50 [#/sec] (mean)
Time per request:       202.395 [ms] (mean)
Time per request:       0.067 [ms] (mean, across all concurrent requests)
Transfer rate:          514560.94 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   54 104.2     44    1061
Processing:    37  144  23.0    145     196
Waiting:        0   41  14.4     38     103
Total:         80  198 108.1    193    1229

Percentage of the requests served within a certain time (ms)
  50%    193
  66%    200
  75%    207
  80%    209
  90%    215
  95%    218
  98%    231
  99%   1194
 100%   1229 (longest request)

```
### 第二次
```bash
Document Path:          /index.html
Document Length:        35312 bytes

Concurrency Level:      3000
Time taken for tests:   3.094 seconds
Complete requests:      50000
Failed requests:        0
Total transferred:      1777400000 bytes
HTML transferred:       1765600000 bytes
Requests per second:    16157.77 [#/sec] (mean)
Time per request:       185.669 [ms] (mean)
Time per request:       0.062 [ms] (mean, across all concurrent requests)
Transfer rate:          560914.54 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   54 120.1     39    1070
Processing:    64  127  19.7    128     180
Waiting:        0   37  14.1     35      98
Total:        106  181 123.6    171    1240

Percentage of the requests served within a certain time (ms)
  50%    171
  66%    180
  75%    183
  80%    184
  90%    190
  95%    195
  98%    204
  99%   1184
 100%   1240 (longest request)

```
### 第三次
```bash
Document Path:          /index.html
Document Length:        35312 bytes

Concurrency Level:      3000
Time taken for tests:   3.212 seconds
Complete requests:      50000
Failed requests:        0
Total transferred:      1777400000 bytes
HTML transferred:       1765600000 bytes
Requests per second:    15565.24 [#/sec] (mean)
Time per request:       192.737 [ms] (mean)
Time per request:       0.064 [ms] (mean, across all concurrent requests)
Transfer rate:          540344.85 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   55 115.1     43    1107
Processing:    57  133  23.3    136     190
Waiting:        0   39  14.6     36     101
Total:        110  188 121.2    182    1290

Percentage of the requests served within a certain time (ms)
  50%    182
  66%    188
  75%    194
  80%    198
  90%    205
  95%    212
  98%    223
  99%   1238
 100%   1290 (longest request)

```

## 未调整的测试

命令： `ab -c 3000 -n 50000 http://172.31.35.221:80/index.html`
### 第一次
```
Document Path:          /index.html
Document Length:        0 bytes

Concurrency Level:      3000
Time taken for tests:   3.217 seconds
Complete requests:      50000
Failed requests:        50000
   (Connect: 0, Receive: 0, Length: 48496, Exceptions: 1504)
Total transferred:      1723935808 bytes
HTML transferred:       1712490752 bytes
Requests per second:    15543.00 [#/sec] (mean)
Time per request:       193.013 [ms] (mean)
Time per request:       0.064 [ms] (mean, across all concurrent requests)
Transfer rate:          523342.50 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   50 115.9     37    1091
Processing:    28  139  29.4    148     338
Waiting:        0   45  13.6     48     249
Total:         60  189 122.8    185    1287

Percentage of the requests served within a certain time (ms)
  50%    185
  66%    195
  75%    197
  80%    198
  90%    211
  95%    216
  98%    225
  99%   1233
 100%   1287 (longest request)
```
未调整的情况下直接就失败了。。 所有的请求最终都Failed了， 尝试调小。
命令： `ab -c 1897 -n 50000 http://172.31.35.221/index.html`
可以接受的最大值是：

```
Document Path:          /index.html
Document Length:        35312 bytes

Concurrency Level:      1897
Time taken for tests:   3.206 seconds
Complete requests:      50000
Failed requests:        0
Total transferred:      1777400000 bytes
HTML transferred:       1765600000 bytes
Requests per second:    15597.31 [#/sec] (mean)
Time per request:       121.624 [ms] (mean)
Time per request:       0.064 [ms] (mean, across all concurrent requests)
Transfer rate:          541458.01 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   30  86.9     23    1062
Processing:    30   90  14.9     93     274
Waiting:        0   30   8.6     30     225
Total:         53  120  89.5    117    1180

Percentage of the requests served within a certain time (ms)
  50%    117
  66%    121
  75%    124
  80%    125
  90%    132
  95%    140
  98%    145
  99%    147
 100%   1180 (longest request)
```
