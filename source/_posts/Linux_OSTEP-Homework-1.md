---
title: Linux open()调用的理解
category: Linux
date: 2024-05-19 02:10:01
tags:
  - Linux
  - Kernel
---

### 原本的问题
最近看 OSTEP 的内容， 慢慢看， 搞了一点点代码， 还挺有意思的。一边写一边尝试回答后面的思考问题。 在自己的环境中，搞了一点点代码, 发现程序会报错 `read failed: Bad file descriptor`. 

> 2．编写一个打开文件的程序（使用 open()系统调用），然后调用 fork()创建一个新进程。 子进程和父进程都可以访问 open()返回的文件描述符吗？当它我并发（即同时）写入文件时， 会发生什么？

### 第一个版本的代码
这第一个版本的代码是我提需求 Copilot 写的. 所以我并不理解其中的意思, 解释的也比较粗糙, 我即便提供给他报错的部分, 它还是坚信这个代码没有问题, 子进程可以访问父进程的文件描述符......
```c++
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <fcntl.h>
#include <sys/wait.h>

/*
 *2．编写一个打开文件的程序（使用 open()系统调用），然后调用 fork()创建一个新进程。
 *子进程和父进程都可以访问 open()返回的文件描述符吗？当它我并发（即同谁）写入文件谁，
 *会发生谁谁？
 */

void fork_process(int fd) {

    int rc = fork();
        if (rc < 0) {
        fprintf(stderr, "fork failed.\n");
        exit(1);
    } else if (rc == 0) {
        // 子进程: 读取父进程写入的内容
        lseek(fd, 0, SEEK_SET); // 重置文件偏移量到文件开始
        char buffer[1024];
        ssize_t bytes_read = read(fd, buffer, sizeof(buffer) - 1);

        printf("Output FD Content: %d\n", fd);

        if (bytes_read < 0) {
            perror("read failed");
           // fprintf(stderr, "read failed in child.\n");
            exit(1);
        }

        buffer[bytes_read] = '\0'; // 确保字符串结束
                                   //
        printf("Child (pid:%d) read: %s\n", (int)getpid(), buffer);
    } else {
        char buffer[1024];
        ssize_t bytes_read = read(fd, buffer, sizeof(buffer) - 1);

        printf("Output FD Content: %d\n", fd);

        if (bytes_read < 0) {
            perror("read failed");
           // fprintf(stderr, "read failed in child.\n");
            exit(1);
        }

        buffer[bytes_read] = '\0'; // 确保字符串结束
        // 父进程: 等待子进程结束
        int wc = waitpid(rc, NULL, 0);
        printf("Parent (pid:%d) of child %d\n", (int)getpid(), rc);
    }
}


int main(int argc, char *argv[])
{
    printf("Hello world (pid:%d)\n", (int) getpid());

        // 父进程: 打开 /etc/hostname 文件并读取内容
    int fd_passwd = open("/etc/hostname", O_RDONLY);
    if (fd_passwd < 0) {
        fprintf(stderr, "open /etc/hostname failed.\n");
        exit(1);
    }

    char buffer[1024];
    ssize_t bytes_read = read(fd_passwd, buffer, sizeof(buffer) - 1);
    if (bytes_read < 0) {
        fprintf(stderr, "read /etc/hostname failed.\n");
        exit(1);
    }
    buffer[bytes_read] = '\0'; // 确保字符串结束
    close(fd_passwd);

    // 父进程: 创建 open_test.log 文件并写入读取的内容
    int fd_log = open("./open_test.log", O_CREAT|O_WRONLY|O_TRUNC, S_IRWXU);
    if (fd_log < 0) {
        fprintf(stderr, "open open_test.log failed.\n");
        exit(1);
    }
    write(fd_log, buffer, strlen(buffer));

    // 父进程: 创建子进程并传递文件描述符
    fork_process(fd_log);

    // 父进程: 关闭文件描述符
    close(fd_log);

    return 0;
}

```
执行报错: 
```shell
[root@arch ostep-hm-code]$ ./a.out
Hello world (pid:68492)
Output FD Content: 3
read failed: Bad file descriptor
Output FD Content: 3
read failed: Bad file descriptor
```
### 尝试用 Perf Trace 去追踪
```shell
[root@arch ostep-hm-code]$ perf trace -e syscalls:sys_enter_open* -e syscalls:sys_enter_close* -T -f ./a.out 2>&1
Hello world (pid:67852)
129919107.285 a.out/67852 syscalls:sys_enter_openat(dfd: CWD, filename: "", flags: RDONLY|CLOEXEC)
129919107.302 a.out/67852 syscalls:sys_enter_close(fd: 3</home/ec2-user/ostep-hm-code/open_test.log>)
\\ 上面的两个 Open Close 明显是一组, 这个地方应该是我打开log文件的记录. 但是后面 fd 3 被关闭了. 在内核层面观察到了被关闭.
\\ 但是并不能确定为什么被关闭.

129919107.310 a.out/67852 syscalls:sys_enter_openat(dfd: CWD, filename: "", flags: RDONLY|CLOEXEC)
129919107.354 a.out/67852 syscalls:sys_enter_close(Output FD Content: 3
fd: 3</home/ec2-user/ostep-hm-code/open_test.log>)
\\ 这里是我打印出来的 文件描述符id , 可以看到是 3. 也能看到close关闭这个文件描述符. 

129919107.497 a.out/67852 syscalls:sys_enter_openat(dfd: CWD, filename: "")
129919107.503 a.out/67852 syscalls:sys_enter_close(fd: 3</home/ec2-user/ostep-hm-code/open_test.log>)
\\ 这里也是测试的输出, 输出文件描述符为 3. 也是close掉的.

129919107.506 a.out/67852 syscalls:sys_enter_openat(read failed: Bad file descriptor
dfd: CWD, filename: "", flags: CREAT|TRUNC|WRONLY, mode: IRWXU)
\\ 输出了报错, 这里其实已经写出了原因. openat() 去获取文件的时候发现这个文件是使用 WRONLY 写模式打开的, 不能读.

129919107.950 a.out/67852 syscalls:sys_enter_close(fd: 4)
Output FD Content: 3
read failed: Bad file descriptor
```
### 改成正确的版本
```c++
void fork_process(int fd) {

int main(int argc, char *argv[])
{
    printf("Hello world (pid:%d)\n", (int) getpid());

        // 父进程: 打开 /etc/hostname 文件并读取内容
    int fd_hostname = open("./open_test.log", O_RDWR, S_IRWXU);
        // 在这里使用读写模式, 子进程在获取文件描述符的时候才不会报错.
    if (fd_hostname < 0) {
        fprintf(stderr, "open ./open_test.log failed.\n");
        exit(1);
    }

    // 父进程: 创建子进程并传递文件描述符
    fork_process(fd_hostname);

    // 父进程: 关闭文件描述符
    close(fd_hostname);

    return 0;
}

```
### Perf 追踪的完整内容
记录 perf 输出的完整内容, 设置为WRONLY的.
```shell
[root@arch ostep-hm-code]$ perf trace  -T -f ./a.out 2>&1
         ? (         ): a.out/69578  ... [continued]: execve())                                           = 0
132465724.834 ( 0.002 ms): a.out/69578 brk()                                                                 = 0x5e348fcb3000
132465724.995 ( 0.003 ms): a.out/69578 access(filename: "/etc/ld.so.preload", mode: R)                       = -1 ENOENT (No such file or directory)
132465725.002 ( 0.004 ms): a.out/69578 openat(dfd: CWD, filename: "/etc/ld.so.cache", flags: RDONLY|CLOEXEC) = 8
132465725.008 ( 0.002 ms): a.out/69578 fstat(fd: 8, statbuf: 0x7ffdf42c2a50)                                 = 0
132465725.010 ( 0.006 ms): Hello world (pid:69578)
a.out/69578 mmap(len: 149027, prot: READ, flags: PRIVATE, fd: 8)                  = 0x7d8cafc17000
132465725.017 ( 0.001 ms): a.out/69578 close(fd: 8</home/ec2-user/ostep-hm-code/open_test.log>)              = 0

\\这里其实就提示了 flags.
132465725.025 ( 0.002 ms): a.out/69578 openat(dfd: CWD, filename: "/usr/lib/libc.so.6", flags: RDONLY|CLOEXEC) = 8

132465725.029 ( 0.002 ms): a.out/69578 read(fd: 8</home/ec2-user/ostep-hm-code/open_test.log>, buf: 0x7ffdf42c2bc8, count: 832) = 832
132465725.031 ( 0.001 ms): a.out/69578 pread64(fd: 8</home/ec2-user/ostep-hm-code/open_test.log>, buf: 0x7ffdf42c27d0, count: 784, pos: 64) = 784
132465725.034 ( 0.001 ms): a.out/69578 fstat(fd: 8</home/ec2-user/ostep-hm-code/open_test.log>, statbuf: 0x7ffdf42c2a50) = 0
132465725.036 ( 0.003 ms): a.out/69578 mmap(len: 8192, prot: READ|WRITE, flags: PRIVATE|ANONYMOUS)           = 0x7d8cafc15000
132465725.042 ( 0.001 ms): a.out/69578 pread64(fd: 8</home/ec2-user/ostep-hm-code/open_test.log>, buf: 0x7ffdf42c26a0, count: 784, pos: 64) = 784
132465725.045 ( 0.004 ms): a.out/69578 mmap(len: 2014064, prot: READ, flags: PRIVATE|DENYWRITE, fd: 8)       = 0x7d8cafa29000
132465725.049 ( 0.008 ms): a.out/69578 mmap(addr: 0x7d8cafa4d000, len: 1490944, prot: READ|EXEC, flags: PRIVATE|FIXED|DENYWRITE, fd: 8, off: 0x24000) = 0x7d8cafa4d000
132465725.059 (Output FD Content: 8
 0.005 ms): a.out/69578 mmap(addr: 0x7d8cafbb9000, len: 319488, prot: READ, flags: PRIVATE|FIXED|DENYWRITE, fd: 8, off: 0x190000) = 0x7d8cafbb9000
132465725.064 ( 0.005 ms): a.out/69578 mmap(addr: 0x7d8cafc07000, len: 24576, prot: READ|WRITE, flags: PRIVATE|FIXED|DENYWRITE, fd: 8, off: 0x1dd000) = 0x7d8cafc07000
read failed: Bad file descriptor
132465725.073 ( 0.003 ms): a.out/69578 mmap(addr: 0x7d8cafc0d000, len: 31600, prot: READ|WRITE, flags: PRIVATE|FIXED|ANONYMOUS) = 0x7d8cafc0d000

\\ 这里是对应的close. 我追踪的那个
132465725.084 ( 0.001 ms): a.out/69578 close(fd: 8</home/ec2-user/ostep-hm-code/open_test.log>)              = 0

132465725.092 ( 0.002 ms): a.out/69578 mmap(len: 12288, prot: READ|WRITE, flags: PRIVATE|ANONYMOUSOutput FD Content: 8
)          = 0x7d8cafa26000
132465725.098 ( 0.001 ms): a.out/69578 arch_prctl(option: SET_FS, arg2: 0x7d8cafa26740)                      = 0
132465725.100 ( 0.001 ms): a.out/69578 set_tid_address(tidptr: 0x7d8cafa26a10)                               = 69578 (a.out)
read failed: Bad file descriptor
132465725.102 ( 0.001 ms): a.out/69578 set_robust_list(head: 0x7d8cafa26a20, len: 24)                        = 0
132465725.103 ( 0.001 ms): a.out/69578 rseq(rseq: 0x7d8cafa27060, rseq_len: 32, sig: 1392848979)             = 0
132465725.153 ( 0.006 ms): a.out/69578 mprotect(start: 0x7d8cafc07000, len: 16384, prot: READ)               = 0
132465725.162 ( 0.007 ms): a.out/69578 mprotect(start: 0x5e348ea0b000, len: 4096, prot: READ)                = 0
132465725.173 ( 0.005 ms): a.out/69578 mprotect(start: 0x7d8cafc6e000, len: 8192, prot: READ)                = 0
132465725.189 ( 0.001 ms): a.out/69578 prlimit64(resource: STACK, old_rlim: 0x7ffdf42c35b0)                  = 0
132465725.197 ( 0.008 ms): a.out/69578 munmap(addr: 0x7d8cafc17000, len: 149027)                             = 0
132465725.222 ( 0.001 ms): a.out/69578 getpid()                                                              = 69578
132465725.241 ( 0.002 ms): a.out/69578 fstat(fd: 1, statbuf: 0x7ffdf42c3490)                                 = 0
132465725.247 ( 0.002 ms): a.out/69578 getrandom(ubuf: 0x7d8cafc12178, len: 8, flags: NONBLOCK)              = 8
132465725.252 ( 0.001 ms): a.out/69578 brk()                                                                 = 0x5e348fcb3000
132465725.255 ( 0.004 ms): a.out/69578 brk(brk: 0x5e348fcd4000)                                              = 0x5e348fcd4000
132465725.265 ( 0.008 ms): a.out/69578 write(fd: 1, buf: 0x5e348fcb32a0, count: 24)                          = 24
132465725.275 ( 0.005 ms): a.out/69578 openat(dfd: CWD, filename: "./open_test.log", flags: WRONLY)          = 8
132465725.286 ( 0.186 ms): a.out/69578 clone(clone_flags: CHILD_CLEARTID|CHILD_SETTID|0x11, child_tidptr: 0x7d8cafa26a10) = 69579 (a.out)
132465725.485 ( 0.001 ms): a.out/69578 read(fd: 8, buf: 0x7ffdf42c3450, count: 1023)                         = -1 EBADF (Bad file descriptor)
132465725.496 ( 0.003 ms): a.out/69578 write(fd: 1, buf: 0x5e348fcb32a0, count: 21)                          = 21
132465725.501 ( 0.002 ms): a.out/69578 dup(fildes: 2)                                                        = 9
132465725.505 ( 0.002 ms): a.out/69578 fcntl(fd: 9, cmd: GETFL)                                              = RDWR
132465725.519 ( 0.002 ms): a.out/69578 fstat(fd: 9, statbuf: 0x7ffdf42c2720)                                 = 0
132465725.522 ( 0.002 ms): a.out/69578 write(fd: 9, buf: 0x5e348fcb3890, count: 33)                          = 33
132465725.526 ( 0.002 ms): a.out/69578 close(fd: 9)                                                          = 0
132465725.538 (         ): a.out/69578 exit_group(error_code: 1)                                             = ?
         ? (         ): a.out/69579  ... [continued]: clone())                                            =
132465725.497 ( 0.001 ms): a.out/69579 set_robust_list(head: 0x7d8cafa26a20, len: 24)                        = 0
132465725.526 ( 0.002 ms): a.out/69579 lseek(fd: 8, whence: SET)                                             = 0
132465725.530 ( 0.001 ms): a.out/69579 read(fd: 8, buf: 0x7ffdf42c3450, count: 1023)                         = -1 EBADF (Bad file descriptor)
132465725.551 ( 0.003 ms): a.out/69579 write(fd: 1, buf: 0x5e348fcb32a0, count: 21)                          = 21
132465725.558 ( 0.001 ms): a.out/69579 dup(fildes: 2)                                                        = 9
132465725.561 ( 0.001 ms): a.out/69579 fcntl(fd: 9, cmd: GETFL)                                              = RDWR
132465725.574 ( 0.002 ms): a.out/69579 fstat(fd: 9, statbuf: 0x7ffdf42c2720)                                 = 0
132465725.577 ( 0.002 ms): a.out/69579 write(fd: 9, buf: 0x5e348fcb3890, count: 33)                          = 33
132465725.581 ( 0.001 ms): a.out/69579 close(fd: 9)                                                          = 0
132465725.593 (         ): a.out/69579 exit_group(error_code: 1)                                             = ?
```

