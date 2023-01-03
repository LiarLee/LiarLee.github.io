---
title: bpftrace 使用以及理解
category: Linux
date: 2022-12-29 17:29:25
tags:
---

# BPFtrace oneline program
```bash
[root@localhost-live ~]# bpftrace -e 'tracepoint:syscalls:sys_enter_execve { printf("%s %s\n", comm, str(args->filename));}'
```

# Tracepoint如何获取可用参数的解释
```bash
[root@localhost-live sys_enter_execve]# pwd
/sys/kernel/tracing/events/syscalls/sys_enter_execve
[root@localhost-live sys_enter_execve]# grep -ri .
format:name: sys_enter_execve
format:ID: 742
format:format:
format:	field:unsigned short common_type;	offset:0;	size:2;	signed:0;
format:	field:unsigned char common_flags;	offset:2;	size:1;	signed:0;
format:	field:unsigned char common_preempt_count;	offset:3;	size:1;	signed:0;
format:	field:int common_pid;	offset:4;	size:4;	signed:1;
format:	field:int __syscall_nr;	offset:8;	size:4;	signed:1;
format:	field:const char * filename;	offset:16;	size:8;	signed:0;
format:	field:const char *const * argv;	offset:24;	size:8;	signed:0;
format:	field:const char *const * envp;	offset:32;	size:8;	signed:0;
format:print fmt: "filename: 0x%08lx, argv: 0x%08lx, envp: 0x%08lx", ((unsigned long)(REC->filename)), ((unsigned long)(REC->argv)), ((unsigned long)(REC->envp))
trigger:# Available triggers:
trigger:# traceon traceoff snapshot stacktrace enable_event disable_event enable_hist disable_hist hist
filter:none
id:742
enable:0
```

