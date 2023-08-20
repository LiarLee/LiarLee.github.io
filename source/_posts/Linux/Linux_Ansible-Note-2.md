---
title: Ansible笔记-2 
date: 2019-07-07 21:57:06
categories: Linux
tags: Linux, Ansible
---

这份笔记介绍的是Ansible playbook的格式及相关的内容。
# Ansible笔记
## Ansible Playbook
### YAML
> YAML（/ˈjæməl/，尾音类似 camel ) 是“YAML不是一种标记语言”的外语缩写（见前方参考资料原文内容）；但为了强调这种语言以数据做为中心，而不是以置标语言为重点，而用返璞词重新命名。它是一种直观的能够被电脑识别的数据序列化格式，是一个可读性高并且容易被人类阅读，容易和脚本语言交互，用来表达资料序列的编程语言。  
> **数据结构**可以用类似**大纲的缩排方式**呈现，**结构通过缩进来表示**，**连续的项目通过减号“-”来表示**，**map结构里面的key/value对用冒号“:”来分隔**。  
YAML文件一般的文件名为.yaml 或 .yml,文本结构举例如下：
```yaml
house:
  family:
    name: Doe
    parents:
      - John
      - Jane
    children:
      - Paul
      - Mark
      - Simone
  address:
    number: 34
    street: Main Street
    city: Nowheretown
    zipcode: 12345
```
### Ansible Playbook的关键字
内容与命令的内容基本一致，有如下的几个关键字：
1. **\- hosts**  用来指定控制主机的范围,**注意短横线后空格接字符**
1. **remote_user** 用来指定使用的用户
1. **tasks** 可在字段下方缩进指定需要执行的任务,**注意缩进**
	1. **\- name** 用来定义任务的名称或描述,**注意短横线后空格接字符**
	1. **yum**: name=httpd state=latest 定义使用的模块功能：后面跟操作参数
	1. **tags**: 对任务进行标记，可通过命令调用标记执行或排除某些任务
	1. **when**: 判断，满足when后面的条件才执行任务
	1. **notify**: 触发handler的标志
1. **handlers**: 定义触发任务的内容
	1. **\- name**: 任务的名称,**注意短横线后空格接字符**
	1. **service**: name=httpd state=restarted 定义使用的模块：后面跟操作参数

### Ansible Playbook示例
先看一个已经写好的playbook，针对写好的来解释playbook如何书写。
```yaml
---		# 默认的开头
- hosts: all 		# 先定义控制的范围，all表示所有主机，分组可定义在/etc/ansible/hosts文件中；
  remote_user: root	# 定义执行下面操作的用户，控制权限
  tasks:		# tasks字段负责定义任务
	# 如果是Redhat系，执行安装httpd
    - name: install httpd CentOS
      yum: 
        name: httpd
        state: latest
      tags: install_httpd
      when: ansible_os_family == "RedHat"
	# 如果是Debain系，执行安装apache
    - name: install httpd Ubuntu
      apt:
        name: apache
        state: latest
      when: ansible_os_family == "Ubuntu" 
      tags: install_httpd
	# 执行网站主页的替换，如果变更触发handler字段定义的重启服务任务
    - name: set the homepage
      copy: 
        src: ./index.html
        dest: /var/www/html/index.html
      notify: 
        - restart_the_service
	# 执行启动服务
    - name: start httpd
      service: 
        name: httpd
        service: started
	# 执行清空防火墙
    - name: empty firewalld
      shell: iptables -F
	# 移除apache软件包
    - name: remove httpd
      yum: 
        name: httpd
        state: absent
      tags: remove_httpd
	# 删除预设的apache网站文件
    - name: clean stuff
      file:
        name: /var/www/html/
        state: absent
      tags: clean_stuff
  #  handler触发后需要执行的任务
  handlers:
	# 重启httpd服务
    - name: restart_the_service
      service: 
        name: httpd
        state: restarted
```
### Ansible Playbook执行命令
```sh
使用格式：
	ansible-playbook [options] playbook.yml [playbook2 ...]
命令作用：
	Runs Ansible playbooks, executing the defined tasks on the targeted hosts.
	# 运行ansible的playbook，在目标主机上执行已经定义好的任务。

命令示例：
[root@Hayden ~]$ ansible-playbook --syntax-check install_httpd.yaml
# 对playbook进行语法检查
[root@Hayden ~]$ ansible-playbook -C install_httpd.yaml
# 对playbook进行运行测试，不改变结果，仅仅进行测试
[root@Hayden ~]$ ansible-playbook install_httpd.yaml
# 对playbook进行运行，并生成运行的结果
[root@Hayden ~]$ ansible-playbook -t "install_httpd" install-httpd.yaml
# 只运行具有“install_httpd”标签的任务
[root@Hayden ~]$ ansible-playbook --skip-tags "install_httpd" install-httpd.yaml
# 跳过install_httpd标签的任务
[root@Hayden ~]$ ansible-playbook --skip-tags "install_httpd clean_stuff" install-httpd.yaml
# 跳过多个标签的任务示例
```

## 默认文件位置
sudo pacman -Ql ansible | grep hosts 查看hosts文件的范例文件所在目录，其他文件操作类似.

如果有不明白的命令可通过ansible-doc命令直接查看内置的说明文件，针对模块的
ansible-doc -l 为列出所有可用模块

