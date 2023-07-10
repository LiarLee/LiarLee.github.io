---
title: BufferIO与DirectIO的比较
category: Linux
date: 2023-07-10 11:34:36
tags: Linux
---

## 测试方法

使用BufferIO的方式， 测试文件的写入： 

```bash
#!/bin/bash

perf record -T -C 0 -- taskset -c 0 dd if=/dev/zero of=./a.dat bs=4k count=16384
```

使用DirectIO的方式， 测试文件的写入:

```bash
#!/bin/bash

perf record -T -C 0 -- taskset -c 0 dd if=/dev/zero of=./a.dat bs=4k count=16384 oflag=direct
```



## 运行结果

BufferIO:

```bash
[root@ip-172-31-53-200 perf_records]# ./start_test_bufferio.sh
16384+0 records in
16384+0 records out
67108864 bytes (67 MB, 64 MiB) copied, 0.118848 s, 565 MB/s
[ perf record: Woken up 1 times to write data ]
[ perf record: Captured and wrote 0.225 MB perf.data (485 samples) ]

ll -h 
-rw-r--r--. 1 root root  64M Jun  1 13:45 a.dat

[root@ip-172-31-53-200 ~]# dstat -tf
----system---- -----cpu0-usage----------cpu1-usage----------cpu2-usage----------cpu3-usage---- dsk/nvme0n1 ---net/lo-----net/eth0- ---paging-- ---system--
     time     |usr sys idl wai stl:usr sys idl wai stl:usr sys idl wai stl:usr sys idl wai stl| read  writ| recv  send: recv  send|  in   out | int   csw
01-06 13:35:48|  2   0  99   0   0:  1   0  99   0   0:  0   1  98   0   0:  1   0  99   0   0|8192B   35k|1096B 1096B: 968B  828B|   0     0 | 712   971
01-06 13:35:49| 25   9  60   5   0:  0   0  99   0   0:  4  12  84   0   0:  4   8  90   0   0|   0    64M|1096B 1096B: 576B  756B|   0     0 |2283  1311
01-06 13:35:50|  6   1  94   0   0:  1   1  99   0   0: 16   2  83   0   0:  0   1  99   0   0|   0     0 |1096B 1096B: 156B  418B|   0     0 | 954  1018
```

DirectIO:

```bash
[root@ip-172-31-53-200 perf_records]# ./start_test_directio.sh
16384+0 records in
16384+0 records out
67108864 bytes (67 MB, 64 MiB) copied, 10.4225 s, 6.4 MB/s
[ perf record: Woken up 9 times to write data ]
[ perf record: Captured and wrote 2.417 MB perf.data (41489 samples) ]

[root@ip-172-31-53-200 ~]# dstat -tf
----system---- -----cpu0-usage----------cpu1-usage----------cpu2-usage----------cpu3-usage---- dsk/nvme0n1 ---net/lo-----net/eth0- ---paging-- ---system--
     time     |usr sys idl wai stl:usr sys idl wai stl:usr sys idl wai stl:usr sys idl wai stl| read  writ| recv  send: recv  send|  in   out | int   csw
01-06 13:36:36|  0   1  99   0   0:  1   1  99   0   0:  0   1 100   0   0:  0   1 100   0   0|   0     0 |1097B 1097B: 688B  624B|   0     0 | 622   930
01-06 13:36:37|  3   4  32  61   0:  4  14  81   0   0:  1   0  97   0   0:  0   5  94   0   0|   0  4277k|1095B 1095B: 332B  338B|   0     0 |6434  3133
01-06 13:36:38|  3   3   0  92   0:  1   1  99   0   0:  3   1  96   0   0:  0   0  99   0   0|   0  6421k|1096B 1096B:  52B  174B|   0     0 |8767  4148
01-06 13:36:39|  4   4   0  92   0:  0   0  99   0   0:  4   1  96   0   0:  2   0 100   0   0|   0  6431k|1096B 1096B:  52B  150B|   0     0 |8790  4191
01-06 13:36:40|  4   4   0  91   0:  0   1  99   0   0:  2   1  96   0   0:  0   1  99   0   0|   0  6320k|1096B 1096B:  52B  142B|   0     0 |8744  4092
01-06 13:36:41|  4   4   0  92   0:  1   0  99   0   0:  3   0  96   0   0:  0   0 100   0   0|   0  6216k|1096B 1096B:  52B  142B|   0     0 |8662  4103
01-06 13:36:42|  3   4   0  92   0:  1   1  99   0   0:  2   2  96   0   0:  0   0  99   0   0|   0  7492k|1576B 1576B:  52B  134B|   0     0 |8756  4099
01-06 13:36:43|  3   3   0  91   0:  1   0  99   0   0:  4   1  96   0   0:  0   0 100   0   0|   0  6284k|1096B 1096B:  52B  134B|   0     0 |8720  4077
01-06 13:36:44|  4   2   0  92   0:  0   0  99   0   0:  2   1  96   0   0:  0   0  99   0   0|   0  6296k|1096B 1096B:  52B  134B|   0     0 |8788  4067
01-06 13:36:45|  4   5   0  91   0:  1   0  99   0   0:  4   0  96   0   0:  1   0  99   0   0|   0  6368k|1096B 1096B:  52B  134B|   0     0 |8792  4071
01-06 13:36:46|  3   5   0  92   0:  1   1  99   0   0:  4   1  96   0   0:  0   0 100   0   0|   0  5904k|1096B 1096B:  52B  134B|   0     0 |8576  3893
01-06 13:36:47| 25   7   0  69   0:  0   0  99   0   0:  2   1  96   0   0:  0   0 100   0   0|   0  4811k|1097B 1097B: 364B  763B|   0     0 |7035  3360
01-06 13:36:48|  4   0  96   0   0:  1   0  99   0   0: 22   3  75   1   0:  0   1 100   0   0|2642k  109k|1095B 1095B: 208B  472B|   0     0 | 977  1008
01-06 13:36:49|  0   1  99   0   0:  0   0 100   0   0:  0   0  98   0   0:  0   0  99   0   0|   0     0 |1096B 1096B: 104B  276B|   0     0 | 640   903
```

## Perf 采样结果

BufferIO：

![bufferIO.png](https://s2.loli.net/2023/06/01/oArisB8fI71NQdE.png)

DirectIO：

![directio.png](https://s2.loli.net/2023/06/01/VMW9lwpgnFQ34DB.png)



