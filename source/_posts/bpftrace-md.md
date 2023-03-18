---
title: 关于内核追踪的一点点认识
category: Linux
date: 2023-03-19 00:08:52
tags:
---


关于bpftrace追踪的总结, 追踪tcp状态的方法， 通过使用特定的tracepoint的来获取tcp状态的变化： 

```bash 
~$ bpftrace -e 'tracepoint:sock:inet_sock_set_state { printf("%s %d %d\n", comm, pid, args->newstate); }'
```

关于返回值的说明： 
  > https://gitlab.com/redhat/centos-stream/src/kernel/centos-stream-9/-/blob/main/include/net/tcp_states.h  

tcp_set_state 是一个内核函数，用于设置 TCP 套接字的状态。它有 12 个可能的返回值，分别对应 TCP 协议中定义的 12 种状态1。这些状态是：
  > TCP_ESTABLISHED：连接已建立
  > TCP_SYN_SENT：主动打开连接，已发送 SYN 包
  > TCP_SYN_RECV：被动打开连接，已收到 SYN 包
  > TCP_FIN_WAIT1：主动关闭连接，已发送 FIN 包
  > TCP_FIN_WAIT2：主动关闭连接，已收到对方的 ACK 包
  > TCP_TIME_WAIT：主动关闭连接，等待一段时间以确保对方收到最后一个 ACK 包
  > TCP_CLOSE：连接已关闭
  > TCP_CLOSE_WAIT：被动关闭连接，已收到 FIN 包
  > TCP_LAST_ACK：被动关闭连接，已发送最后一个 ACK 包
  > TCP_LISTEN：监听状态，等待被动打开连接
  > TCP_CLOSING：双方同时关闭连接，交换 FIN 和 ACK 包的过程中
  > TCP_NEW_SYN_RECV：临时状态，用于处理 SYN 队列溢出的情况

追踪点还是比较简单的， 查看追踪点可用的参数。 
```c
~$ cat /sys/kernel/debug/tracing/events/syscalls/sys_enter_sendmsg/format
name: sys_enter_sendmsg
ID: 1252
format:
        field:unsigned short common_type;       offset:0;       size:2; signed:0;
        field:unsigned char common_flags;       offset:2;       size:1; signed:0;
        field:unsigned char common_preempt_count;       offset:3;       size:1; signed:0;
        field:int common_pid;   offset:4;       size:4; signed:1;
        field:unsigned char common_preempt_lazy_count;  offset:8;       size:1; signed:0;

        field:int __syscall_nr; offset:12;      size:4; signed:1;
        field:int fd;   offset:16;      size:8; signed:0;
        field:struct user_msghdr * msg; offset:24;      size:8; signed:0;
        field:unsigned int flags;       offset:32;      size:8; signed:0;

print fmt: "fd: 0x%08lx, msg: 0x%08lx, flags: 0x%08lx", ((unsigned long)(REC->fd)), ((unsigned long)(REC->msg)), ((unsigned long)(REC->flags))
```

如果是使用 kprobe 的话， 不能使用 args， 需要使用确定的arg0 - argN， 这个部分还在摸索， 目前尝试用这个参数还是失败。 取到对应的得值但是print不出来。
