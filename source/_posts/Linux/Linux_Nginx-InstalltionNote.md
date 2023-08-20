---
title: Nginx编译安装
date: 2018-01-22 18:03:58
categories: Linux
tags: Nginx
---

很久之前的笔记了，发出来，做编译安装Nginx的时候记录的……包括安装命令和脚本……

## 安装nginx服务器
1. 下载[zlib](http://zlib.net/)，[pcre](http://www.pcre.org/)，[nginx](http://nginx.org/en/download.html)  
1. 安装zlib  
`[root@localhost Liarlee]# cd zlib-[version]`  
`[root@localhost Liarlee]# ./configure --prefix=/usr/local/zlib`
1. 安装pcre  
`[root@localhost Liarlee]# cd pcre-[version]`  
`[root@localhost Liarlee]# ./configure --prefix=/usr/local/pcre`
1. 安装nginx  
`[root@localhost Liarlee]# cd nginx-[version]`  
`[root@localhost Liarlee]# ./configure --prefix=/usr/local/nginx`
1. 安装完成  
---
## 配置Sys V 脚本：
```bash
        #!/bin/sh
        #
        # nginx - this script starts and stops the nginx daemon
        #
        # chkconfig:   - 85 15
        # description:  Nginx is an HTTP(S) server, HTTP(S) reverse \
        #               proxy and IMAP/POP3 proxy server
        # processname: nginx
        # config:      /etc/nginx/nginx.conf
        # config:      /etc/sysconfig/nginx
        # pidfile:     /var/run/nginx.pid
        # Source function library.
        . /etc/rc.d/init.d/functions
        # Source networking configuration.
        . /etc/sysconfig/network
        # Check that networking is up.
        [ "$NETWORKING" = "no" ] && exit 0
        nginx="/usr/sbin/nginx"
        prog=$(basename $nginx)
        NGINX_CONF_FILE="/etc/nginx/nginx.conf"
        [ -f /etc/sysconfig/nginx ] && . /etc/sysconfig/nginx
        lockfile=/var/lock/subsys/nginx
        make_dirs() {
           # make required directories
           user=`nginx -V 2>&1 | grep "configure arguments:" | sed 's/[^*]*--user=\([^ ]*\).*/\1/g' -`
           options=`$nginx -V 2>&1 | grep 'configure arguments:'`
           for opt in $options; do
               if [ `echo $opt | grep '.*-temp-path'` ]; then
                   value=`echo $opt | cut -d "=" -f 2`
                   if [ ! -d "$value" ]; then
                       # echo "creating" $value
                       mkdir -p $value && chown -R $user $value
                   fi
               fi
           done
        }
        start() {
            [ -x $nginx ] || exit 5
            [ -f $NGINX_CONF_FILE ] || exit 6
            make_dirs
            echo -n $"Starting $prog: "
            daemon $nginx -c $NGINX_CONF_FILE
            retval=$?
            echo
            [ $retval -eq 0 ] && touch $lockfile
            return $retval
        }
        stop() {
            echo -n $"Stopping $prog: "
            killproc $prog -QUIT
            retval=$?
            echo
            [ $retval -eq 0 ] && rm -f $lockfile
            return $retval
        }
        restart() {
            configtest || return $?
            stop
            sleep 1
            start
        }
        reload() {
            configtest || return $?
            echo -n $"Reloading $prog: "
            killproc $nginx -HUP
            RETVAL=$?
            echo
        }
        force_reload() {
            restart
        }
        configtest() {
          $nginx -t -c $NGINX_CONF_FILE
        }
        rh_status() {
            status $prog
        }
        rh_status_q() {
            rh_status >/dev/null 2>&1
        }
        case "$1" in
            start)
                rh_status_q && exit 0
                $1
                ;;
            stop)
                rh_status_q || exit 0
                $1
                ;;
            restart|configtest)
                $1
                ;;
            reload)
                rh_status_q || exit 7
                $1
                ;;
            force-reload)
                force_reload
                ;;
            status)
                rh_status
                ;;
            condrestart|try-restart)
                rh_status_q || exit 0
                    ;;
            *)
                echo $"Usage: $0 {start|stop|status|restart|condrestart|try-restart|reload|force-reload|configtest}"
                exit 2
        esac
```
# 补充一些

1. 在编译安装的nginx中，可能没有conf.d目录，只要自己的nginx的配置文件中， http字段下添加include /etc/nginx/conf.d/*.conf 就可以使用conf.d目录进行不同站点独立配置文件的配置了。
1. Nginx可以支持同样使用80端口， 但是使用不同域名进行站点的发布。之前没有确切的试过，今天确实碰到了这个问题，记录下来。 在配置文件中，使用不同的server {}字段，定义不同的server_name ， 两个站点可以同时listen在80 端口上。访问的时候不同的域名会直接访问到不同的目录。Over.