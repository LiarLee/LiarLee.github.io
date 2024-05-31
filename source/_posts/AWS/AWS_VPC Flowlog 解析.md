---
title: VPCFlowlog 解析
category: AWS
date: 2023-07-05 11:33:43
tags:
  - AWS
  - VPC
  - FLowLog
---
### VPC Flow Log 怎么看

https://docs.amazonaws.cn/vpc/latest/userguide/flow-logs.html#flow-log-records  
https://docs.amazonaws.cn/vpc/latest/userguide/flow-logs-records-examples.html#flow-log-example-tcp-flag  

vpc flow log里的tcp-flags记录的不是某个单个tcp包头里的flag，而是单次观察的时间窗口里这条flow的所有tcp包出现过的tcp flag的合计。  

TCP flags can be OR-ed during the aggregation interval. For short connections, the flags might be set on the same line in the flow log record, for example, 19 for SYN-ACK and FIN, and 3 for SYN and FIN. For an example, see TCP flag sequence.   
For general information about TCP flags (such as the meaning of flags like FIN, SYN, and ACK), see TCP segment structure
on Wikipedia![Wikipedia](https://en.wikipedia.org/wiki/Transmission_Control_Protocol#TCP_segment_structure).

这个记录里面的值， 是这样计算出来的， 从右向左 ， 从 0 次方开始计算。

> FIN  2^0
>
> SYN 2^1 
>
> RST 2^2
>
> PSH 2^3
>
> ACK 2^4
>
> URG 2^5
>
> ECE 2^6
>
> CWR 2^7