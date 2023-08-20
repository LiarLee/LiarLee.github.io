---
title: RPM制作的笔记
date: 2018-07-03 11:46:36
categories: Linux
tags: Linux, RPM
---

关于制作RPM包的笔记～

## 一. 制作RPM包教程

源码包的制作教程基于RHEL 5 & 6,当我写这个的时候还没有7版本, 我会在后续更新新版本的路数（大半夜翻到这个破防了， 来自18年的flag ， 现在是时间是 2023 - 08 - 18 ， 过了。

### 1. Rpm包的制作流程简述

1. 放置源码进入SOURCES文件夹
1. 写好SPEC文件
1. 运行rpmbuild命令,自动执行安装和清理
1. 自动将所有的源码解压到BUILD目录
1. 自动安装所有的源码程序到BUILDROOT目录
1. 自动根据SPEC文件里面的file程序段打包到rpm包中
1. 自动进行后续的清理
1. 生成完整的RPM包
1. 手动进行安装测试

### 2. 如何做准备
需要明确的几个问题：
1. 我们需要做一个什么样的RPM包，这个RPM包使用来做什么的，RPMs不一定包含的是二进制的内容，不一定需要编译。
2. 至少我们需要源码，注意原材料的收集。
3. 官方建议使用干净的源码，如果有补丁需要在制作的过程中打上补丁。
4. 同一个软件，不同版本的RPM，新版本是否可以支持升级旧版本。需不需要清理旧版本的文件。升级是否会造成冲突。
5. 依赖关系。
6. 每一个PRM包都提供一种功能，Capability，可以被其他的PRM包依赖。RPM包的名字和所安装的文件都可以给其他的软件提供依赖。
7. 自身名字的意义，提供的每一文件也可以被依赖，
8. 他的安装和运行需要依赖于其他的RPM包本身或者所具有的文件，叫做依赖关系。  
9. 两类依赖关系，编译依赖和安装依赖。
10. 规划依赖关系，写SPEC文件。
11. 制作RPMs。
12. 简单测试RPMs。

### 3. RPMs的规划
1. 是否是应用程序，是否需要补丁，是否需要新的功能。
1. 是一个程序的库文件
1. 是一个系统配置文件集
1. 是一个文档文件包
1. 是否拆分完整的软件，例如：MySQL-5.5.22.tar.gz，在制作RPM包的时候被拆分为MySQL，mysql-server，mysql-devel，等等。
1. 是一个二进制还是源码，当时都有。例如:src.rpm,里面包括了 source.tar.gz 和 spec,需要使用者安装完成之后编译再安装。

### 4. 制作过程
#### 1. 设计目录结构(set Up the Directory structure)
**制作RPM过程中千万不能用root用户**    
每个版本对于目录的要求不同，五个不同的目录：  

  1. **BUILD**：不需要放任何的内容，这个目录是真正工作的目录。用于解压编译源码。  
  1. **RPMS**：制作完成的RPM包放在这个里面，里面的目录的名字和结构与特定平台架构有关，可以交叉平台编译。  
  1. **SOURCES**:所有收集的源码都在这个目录里面。  
  1. **SPECS**:放置SPEC文件，作为制作过程的指导说明。以软件包的名字命名，以.spec结尾。  
  1. **SRPMS**:放置了SRC(source)格式的RPM包。  
红帽提供了默认的制作目录，在/usr/src/redhat.

    ```
    [LiarLee@localhost ~] tree /usr/src/redhat
    ```

#### 2. 放置文件到正确的指定的目录(Place The Sources in the Right dirctory)。
  我们首先需要自己制定自己的制作源码目录，在不使用root用户的前提下进行制作,需要修改系统的宏，来制定新的工作目录。修改工作目录的过程如下：
  1. 使用命令查看默认的宏：
      ```
      [LiarLee@localhost ~] rpmbuild --showrc   \\ 显示所有的相关宏定义
      _build——表示目录; __rm——表示命令
      ```
  1. 使用命令查看默认的配置文件：
      ```
      [LiarLee@localhost ~] rpmbuild --showrc | grep macrofiles    \\ 显示配置文件的全局路径和文件名  
      \\ 权限由小到大，后一个文件的参数覆盖前面所有的定义  
      \\ 所以我们在家目录下创建隐藏文件.rpmmacros可以直接配置自定义的设置。
      ```
  1. 使用命令查看默认的工作目录定义：
      ```
      [LiarLee@localhost ~] rpmbuild --showrc | grep _topdir   \\ 显示默认的工作目录宏定义  
      \\ 以相同的模式在.rpmmacros中直接覆盖配置，可以更改工作目录  
      ```
  1. 更改topdir的宏，使用rpmbuilder的用户，创建.rpmmacros,添加内容配置宏:  
      ```
      [LiarLee@localhost ~] vim .rpmmacros         \\ Create .rpmmacros file  
          %_topdir    /home/rpmbuilder/rpmbild/  
      [LiarLee@localhost ~] mkdir -pv rpmbuild/{BUILD,RPMS,SOURCES,SPEC,SRPMS}  
      [LiarLee@localhost ~] rpmbuild --showrc | grep _topdir      \\ Review the Result  
      ```

#### 3. 创建一个spec文件(Create A Spec File that Tells the Rpmbuild Command what to do)。
  1. spec文件使用软件的名字版本作为文件名；.spec作为扩展名。  
  1. rpm -qi mysql & rpm -qpi mysql,命令查看rpm信息，信息从spec文件中定义，软件包信息说明段落定义。
  1. spec文件有如下几个段落：
     1. The introduction section
        设置软件包的基本信息
        ```
        Summary:  \\ 简单描述
        Name:     \\ 软件名字
        Version:  \\ 版本号
        Release:  \\ 发行号
        License:  \\ 协议
        Group:    \\ GROUP范围在这个文件中描述 /usr/share/doc/rpm-*/GROUPS
        URL:      \\ 从何处获取的站点链接，下载路径
        Packager:  \\ 制作者<制作者邮箱>
        Vendor：   \\ 制作者的公司或者本人名字      
        Source:      \\ 源文件地址，一个链接地址
        BuildRoot:   \\ 制作RPM包的时候的虚拟Root目录
        BuildRequires:   \\ 制作过程依赖于哪些软件包的名字
        ```
	2. The prep section
        解压源码包到BUILD目录的段，cd到需要的目录，设置环境变量。
        ```
        %prep
        %setup
        ```
	3. The build section
        这是源码包安装的make过程.
        ```
        %build
        ./configure  OR   %configure
        ./make       OR   %{__make}
        make % {?_smp_mflags}    \\ 多对称处理器加速编译
        ```
	4. The install section
        这里是安装make install过程。系统中有install命令,install方式类似于COPY模式.
        ```  
        %install
        %{__rm}
        %{__make} install DESTDIR="%{buildroot}"
        %find_lang %{name}
        ```
     
	5. The script section
         这里是定义执行需要的脚本，用来配置环境。例如:添加Apache用户.    
            %pre        Note:安装前执行
            %post       Note:安装后执行
            %preun      Note:卸载前执行
            %postun     Note:卸载后执行
     
	6. The clean section
        清理之前所用到的BuildRoot目录的。
        ```
        %clean
        %{__rm}
        ```
	7. The files section
        对安装的软件的程序进行规划,哪些文件安装到那个文件夹,**BUILDROOT下的所有文件必须在这个段中存在**
        ```
        %files
        %config(noreplace)  \\ 不替换旧的配置
        ```
     
     8. The changelog section  
         记录版本迭代  
     
        ```
        * Wed Apr 11 2012 Liarlee.site <Liarlee@site.com> - ReleaseNumber 更改时间
        
        - Comments
        - Comments
        ```
     
#### 4. 开始编译(Build The Source and Binary RPMs)
1. rpmbuild命令说明:  
  ```
  rpmbuild -bp        \\ 执行到prep section
  rpmbuild -bc        \\ 执行到build section
  rpmbuild -bi        \\ 执行到install section

  rpmbuild -bs        \\ 制作源码格式的制作
  rpmbuild -bb        \\ 制作二进制格式的rpm包
  rpmbuild -ba        \\ 执行全部格式,BOTH二进制和源码

  rpmbuild -bl        \\ BUILDROOT存在但是没有在FILES段中为包含进去的文件的CHECK命令
  ```
2. 关于安装错误的说明:  
在执行过程中如果有报错我们只需要去按照提示修正错误即可,在执行结束之后会在RPMS目录下生成需要的*RPM包*和*RPM-DEBUG包*.我们只需要RPM包即可,使用rpm -ivh进行安装测试.
```
[LiarLee@localhost ~] rpmbuild -ba SoftwareName.spec   \\开始制作的命令
```

#### rpm2cpio命令的说明
  src-rpm包只是将源码打包成RPM格式,当我们安装src.rpm格式的安装包的时候会把包含的文件,解压到用户默认的工作目录下,所以这种格式的RPM包我们不用安装,直接制作RPM包即可.进行rebuild OR recompile.  
  ```   
  [LiarLee@localhost ~] rpm2cpio mysql.src.rpm > mysql.cpio  
  [LiarLee@localhost ~] rpm2cpio mysql.src.rpm | cpio -t  
  ```
  **两个网站的推荐(搜索SRC-RPM包的站点):**  
    rpmfind.net  
    rpm.pbone.net  

## 二. 从头开始写新的SPEC Files
制作RPM包的核心是写SPEC files，难以掌握的地方
介绍SPEC文件的基本语法和简单用法

### 1. Spec Files Overview
SPEC file里面都是指令，告诉RPMBuild命令如何一步一步解压，编译，做成不同的RPM包，依赖关系。  Macro是指的变量  
大多数的字段由tag+value组成,tag是标签--Directives,不区分大小写;value是区分大小写的.    

#### 1.1 宏的自定义
**用户自定义宏** : %define macro_name value  
**引用方式** : %{macro_name} OR %macro_name  

#### 1.2 注释的方式
使用#来进行注释  
%--不能在注释中使用,如果必须使用需要双写%%  
```
%prep  
\#this is a comment for %%prep  
```

### 2. Defining Package Infomation
如何定义SPEC文件内的字段  

#### 2.1 软件包的信息
- Name - 软件包名称 - 不能有短横线  
- Version - 版本号 - 不能有短横线  
- Release - 发行版本号  
- Group - /usr/src/doc/rpm-version/GROUPS文件中有详细的描述说明有哪些组可以使用  

#### 2.2 制作方信息
- Vendor - 公司或者组织制作的RPM  
- URL - 一个主页链接  
- Packager - 名字<邮箱地址>  
- License - 许可,GPLv2,....etc.  

#### 2.3 描述信息
- Summary - 不能超过50个字符,短描述  
- %description section - 全面描述,如果字符过多可以提前换行.  

#### 2.4 定义依赖关系
- Requires : Capability - 定义软件包的能力,如果未定义显示包名.  
- Provides : Capability - 定义对外提供的能力  
- BuildRequires : Capability - 可以出现多次,直接写出需要的软件包名  

#### 2.5 设定Build目录
- build - 用于解压安装源码  
- buildroot : ${_tmppath}/%{name}-%{version}-root  
  使用$RPM_BUILD_ROOT 或者 %{buildroot}  

#### 2.6 命名Source文件
使用Sources字段 和 patch字段,指定源文件和补丁  
- Source0: https:// OR 相对路径, https不会下载, 自动本地寻址  
- Source1: sourcefiles_name  
- Source2: sourcefiles_name  
- Patch1: patchfiles_name  
- Patch2: patchfiles_name  
- Patch3: patchfiles_name  
补丁定义后可以直接使用patch命令进行补丁的安装,所以使用patch字段  

### 3. Controlling the Build
如何控制编译
```
%prep                 \\ 把Source内的解压源码包到BUILD目录,cd到源码目录,配置环境  

%setup -q             \\ 控制解压的流程  
%setup -n name        \\ 目录名字  
%setup -q             \\ 静默模式  
%setup -a number      \\ AFTER,cd到目录之后解压缩     
%setup -b number      \\ BEFORE,先解压之后cd到目录里  
%setup -c             \\ 解压前创建目录  
%setup -T             \\ 不展开 直接复制  

%patch1               \\ 打补丁    
%patch2               \\ 打第二个补丁        

%build                \\ C类程序的configure & make过程   
./configure --prefix=/usr \  
  --sysconfdir=/etc/nginx  
make %{?_smp_mflags}    

%build                \\Perl的不同
perl Mailfile PL  
make  

%install                            \\ make install 过程  
rm -rf %{buildroot}                 \\ Clean Stuff  
make install DESTDIR=%{buildroot}             \\ make install 命令编译安装  
%{__install} -p -D -m 0644 %{SOURCE5} \     
  %{buildroot}%{_sysconfdir}/sysconfig/%{name}            \\ install命令直接安装文件到目录  
%{__install} -p -d -m 0755 %{buildroot}/var/log/nginx     \\ install命令直接安装文件到指定的文件路径  

%clean              \\ 清理BUILD目录,清空为下次做准备; rpmbuild --clean mysql.spec  
rm -rf %{buildroot}     \\清理BUILD目录  

%prep  
%post  
%prepun  
%postun  
使用IF可以对如下参数进行判断  
$1            \\ 第一次安装  
$2 OR $2+     \\ 升级  
$0            \\ 卸载  
```
### 4. Filling the List of Files
填充文件列表

### 5. Adding Change Log Entries
添加更新日志

## 三. CentOS7打包Nginx过程记录
1. useradd rpmbuilder -p rpmbuilder
2. yum install -y rpmdevtools rpmbuild
3. cd /home/rpmbuilder/
4. rpmdev-setuptree
5. cd ./rpmbuilder
6. tree ./
7. mv nginx-1.16.1.tar.gz ./rpmbuild/SOURCES/
8. vim ./rpmbuilder/SPECS/nginx.spec
9. vim nginx.service
10. mv nginx.service /rpmbuild/SOURCES/nginx.service
  ```
%define nginx_user nginx
%define nginx_group nginx

Name:		nginx	
Version:	1.16.1
Release:	1%{?dist}
Summary:	make rpm for nginx, version 1.16.1

Group:		System Environment/Daemons
License:	GPLv2	
URL:		http://liarlee.site
Source0:	%{name}-%{version}.tar.gz
Source1:	nginx.service	
BuildRoot: 	$_topdir/BUILDROOT

BuildRequires:	gcc
BuildRequires:	gcc-c++
BuildRequires:	openssl
BuildRequires:  openssl-devel
BuildRequires:	pcre
BuildRequires:	pcre-devel
BuildRequires:	systemd
Requires:	openssl
Requires:	openssl-devel
Requires:	pcre
Requires:	pcre-devel
Requires:	systemd

%description
For online Ean portal, make by Hayden Lee, and take some personal option.

%prep
%setup -q


%build
./configure \
	--prefix=/data/web-server/nginx \
	--user=%{nginx_user} \
	--group=%{nginx_group} \
	--with-threads \
	--with-http_ssl_module \
	--with-http_stub_status_module \
	--with-http_realip_module \
	--with-http_gzip_static_module
make %{?_smp_mflags}


%install
%{__rm} -rf %{buildroot}
make install DESTDIR=%{buildroot}
# install systemd-specific files
%{__mkdir} -p $RPM_BUILD_ROOT%{_unitdir}
%{__install} -m644 %SOURCE1 \
    $RPM_BUILD_ROOT%{_unitdir}/nginx.service

%files
%defattr(-,root,root)
/data/web-server/nginx/
%config(noreplace) /data/web-server/nginx/conf/nginx.conf
%config(noreplace) /usr/lib/systemd/system/nginx.service
%attr(0644,root,root) /data/web-server/nginx/conf/nginx.conf
%pre
    getent group %{nginx_group} >/dev/null || groupadd -r %{nginx_group}
    getent passwd %{nginx_user} >/dev/null || \
        useradd -r -g %{nginx_group} -s /sbin/nologin \
        -d %{nginx_home} -c "nginx user"  %{nginx_user}
    exit 0
%post
    /usr/bin/systemctl preset nginx.service >/dev/null 2>&1 ||:
    /usr/bin/systemctl preset nginx-debug.service >/dev/null 2>&1 ||:
    # print site info
    cat <<BANNER
    ----------------------------------------------------------------------

    Thanks for using nginx!

    Please find the official documentation for nginx here:
    * http://nginx.org/en/docs/
    
    Commercial subscriptions for nginx are available on:
    * http://nginx.com/products/
    
    ----------------------------------------------------------------------
    BANNER
%preun
    /usr/bin/systemctl --no-reload disable nginx.service >/dev/null 2>&1 ||:
    /usr/bin/systemctl stop nginx.service >/dev/null 2>&1 ||:

%postun
    /usr/bin/systemctl daemon-reload >/dev/null 2>&1 ||:
    %{__rm} -rf /data/web-server/nginx

  ```