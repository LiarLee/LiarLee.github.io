---
title: RabbitMQ_SysV风格管理脚本模板
date: 2019-09-23 15:48:52
tags: RabbitMQ 
category: Linux
---

需要自己写一个RabbitMQ的SysV脚本，所以找了一个模板，如果需要的时候可以改改就用了。

<!-- more -->

## SysV脚本
```shell
#!/bin/sh
#
# rabbitmq-server RabbitMQ broker
#
# chkconfig: - 80 05
# description: Enable AMQP service provided by RabbitMQ
#
### BEGIN INIT INFO
# Provides:          rabbitmq-server
# Required-Start:    $remote_fs $network
# Required-Stop:     $remote_fs $network
# Description:       RabbitMQ broker
# Short-Description: Enable AMQP service provided by RabbitMQ broker
### END INIT INFO
# Source function library.
. /etc/init.d/functions
# 一些加注释的位置是需要修改的参数
PATH=/sbin:/usr/sbin:/bin:/usr/bin:/data/erlang/bin  # 更改PATH指向Erlang的路径
NAME=rabbitmq-server # 服务的名称，可以和脚本名称一致
DAEMON=/data/rabbitmq_server-3.6.13/sbin/${NAME}	# 启动为守护进程的命令所在绝对路径
CONTROL=/data/rabbitmq_server-3.6.13/sbin/rabbitmqctl	# 制定rabbitmqctl程序的所在位置， 绝对路径
DESC=rabbitmq-server	# 目标服务
USER=root	# 运行时的用户， 线上服务都使用了root用户
export HOME=/data/rabbitmq_server-3.6.13/	# 指定RabbitMQ的HOME目录，默认是在安装目录下；也有可能是在运行RabbitMQ用户的家目录下
ROTATE_SUFFIX=
# INIT_LOG_DIR=/usr/local/rabbitmq/var/rabbitmq
INIT_LOG_DIR=/data/rabbitmq_server-3.6.13/var/log/rabbitmq	# 指出log的目录
# PID_FILE=/var/run/rabbitmq/pid	
PDI_FILE=/data/rabbitmq_server-3.6.13/var/lib/rabbitmq/mnesia/rabbit@ean-online-dubbo-zk-rmq-server-209.pid # 指出当前RabbitMQ的PID文件所在目录
START_PROG="daemon"
LOCK_FILE=/var/lock/subsys/$NAME 
test -x $DAEMON || exit 0
test -x $CONTROL || exit 0
RETVAL=0
set -e
[ -f /etc/default/${NAME} ] && . /etc/default/${NAME}
[ -f /etc/sysconfig/${NAME} ] && . /etc/sysconfig/${NAME}
ensure_pid_dir () {
    PID_DIR=`dirname ${PID_FILE}`
    if [ ! -d ${PID_DIR} ] ; then
        mkdir -p ${PID_DIR}
        chown -R ${USER}:${USER} ${PID_DIR}
        chmod 755 ${PID_DIR}
    fi
}
remove_pid () {
    rm -f ${PID_FILE}
    rmdir `dirname ${PID_FILE}` || :
}
start_rabbitmq () {
    status_rabbitmq quiet
    if [ $RETVAL = 0 ] ; then
        echo RabbitMQ is currently running
    else
        RETVAL=0
        # RABBIT_NOFILES_LIMIT from /etc/sysconfig/rabbitmq-server is not handled
        # automatically
        if [ "$RABBITMQ_NOFILES_LIMIT" ]; then
                ulimit -n $RABBITMQ_NOFILES_LIMIT
        fi
        ensure_pid_dir
        set +e
        RABBITMQ_PID_FILE=$PID_FILE $START_PROG $DAEMON \
            > "${INIT_LOG_DIR}/startup_log" \
            2> "${INIT_LOG_DIR}/startup_err" \
            0<&- &
        $CONTROL wait $PID_FILE >/dev/null 2>&1
        RETVAL=$?
        set -e
        case "$RETVAL" in
            0)
                echo SUCCESS
                if [ -n "$LOCK_FILE" ] ; then
                    touch $LOCK_FILE
                fi
                ;;
            *)
                remove_pid
                echo FAILED - check ${INIT_LOG_DIR}/startup_\{log, _err\}
                RETVAL=1
                ;;
        esac
    fi
}
stop_rabbitmq () {
    status_rabbitmq quiet
    if [ $RETVAL = 0 ] ; then
        set +e
        $CONTROL stop ${PID_FILE} > ${INIT_LOG_DIR}/shutdown_log 2> ${INIT_LOG_DIR}/shutdown_err
        RETVAL=$?
        set -e
        if [ $RETVAL = 0 ] ; then
            remove_pid
            if [ -n "$LOCK_FILE" ] ; then
                rm -f $LOCK_FILE
            fi
        else
            echo FAILED - check ${INIT_LOG_DIR}/shutdown_log, _err
        fi
    else
        echo RabbitMQ is not running
        RETVAL=0
    fi
}
status_rabbitmq() {
    set +e
    if [ "$1" != "quiet" ] ; then
        $CONTROL status 2>&1
    else
        $CONTROL status > /dev/null 2>&1
    fi
    if [ $? != 0 ] ; then
        RETVAL=3
    fi
    set -e
}
rotate_logs_rabbitmq() {
    set +e
    $CONTROL rotate_logs ${ROTATE_SUFFIX}
    if [ $? != 0 ] ; then
        RETVAL=1
    fi
    set -e
}
restart_running_rabbitmq () {
    status_rabbitmq quiet
    if [ $RETVAL = 0 ] ; then
        restart_rabbitmq
    else
        echo RabbitMQ is not runnning
        RETVAL=0
    fi
}
restart_rabbitmq() {
    stop_rabbitmq
    start_rabbitmq
}
case "$1" in
    start)
        echo -n "Starting $DESC: "
        start_rabbitmq
        echo "$NAME."
        ;;
    stop)
        echo -n "Stopping $DESC: "
        stop_rabbitmq
        echo "$NAME."
        ;;
    status)
        status_rabbitmq
        ;;
    rotate-logs)
        echo -n "Rotating log files for $DESC: "
        rotate_logs_rabbitmq
        ;;
    force-reload|reload|restart)
        echo -n "Restarting $DESC: "
        restart_rabbitmq
        echo "$NAME."
        ;;
    try-restart)
        echo -n "Restarting $DESC: "
        restart_running_rabbitmq
        echo "$NAME."
        ;;
    *)
        echo "Usage: $0 {start|stop|status|rotate-logs|restart|condrestart|try-restart|reload|force-reload}" >&2
        RETVAL=1
        ;;
esac
exit $RETVAL
```

## 一些问题
### 错误1
在Work目录下运行这个脚本的时候可以正常使用，但是在/etc/init.d/目录下不正常？ 报错如下：
```shell
service rabbitmq-server status  
Status of node rabbit@HOSTNAME ...  
Error: unable to perform an operation on node 'rabbit@HOSTNAME'. Please see diagnostics information and suggestions below.  
  
Most common reasons for this are:  
  
 * Target node is unreachable (e.g. due to hostname resolution, TCP connection or firewall issues)  
 * CLI tool fails to authenticate with the server (e.g. due to CLI tool's Erlang cookie not matching that of the server)  
 * Target node is not running  
  
In addition to the diagnostics info below:  
  
 * See the CLI, clustering and networking guides on http://rabbitmq.com/documentation.html to learn more  
 * Consult server logs on node rabbit@HOSTNAME 
  
DIAGNOSTICS  
===========  
  
attempted to contact: ['rabbit@HOSTNAME']  
  
rabbit@HOSTNAME:  
  * connected to epmd (port 4369) on HOSTNAME  
  * epmd reports node 'rabbit' uses port 25672 for inter-node and CLI tool traffic  
  * TCP connection succeeded but Erlang distribution failed  
  
  * Authentication failed (rejected by the remote node), please check the Erlang cookie 
  
  
Current node details:  
 * node name: 'rabbitmq@HOSTNAME'  
 * effective user's home directory: /data/rabbitmq-$version  
 * Erlang cookie hash: fhaluhadgahlfhlashdfag 
```

因为RabbitMQ的认证是通过文件 ： `.erlang.cookie`这个文件，但是这个文件不是在系统的一个位置有，如果使用find命令查找的话会发现两个目录都有这个文件，我的查找结果一个是在root的家目录下，还有一个是在安装目录，也就是程序的$HOME下。  
需要自行判断程序使用的是那个目录下在Erlangcookie文件进行的认证及通信，在SysV脚本中，export $HOME到正确的文件目录下，就可以正常使用service命令了。  
### 错误2 
使用service rabbitmq-server status 的时候， 提示$HOME 需要被设置，就在SysV脚本里面直接export就可以了。

