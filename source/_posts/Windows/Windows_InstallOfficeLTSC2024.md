---
title: 记录安装Office LTSC 2024 的步骤
date: 2026-01-15 00:50
category: Windows
tags:
  - Windows
  - Application
  - Office
---
微软的office ltsc 2024 的下载地址： https://learn.microsoft.com/zh-cn/microsoft-365-apps/deploy/overview-office-deployment-tool

1. 下载 Office 部署工具后，双击 officedeploymenttool 文件， 选择释放这个程序的路径，可以放在普通的目录下， 现在不是安装过程。 
2. 打开安装文件夹，找到 configuration-Office365-x64 文件，右击编辑。
3. 改名提供的那个默认配置文件： `configuration`
```xml
<Configuration>
  <Add OfficeClientEdition="64" Channel="PerpetualVL2024">
    <Product ID="ProPlus2024Volume" PIDKEY="2TDPW-NDQ7G-FMG99-DXQ7M-TX3T2">
      <Language ID="zh-cn" />
    </Product>
  </Add>
  <RemoveMSI />
  <Display Level="None" AcceptEULA="TRUE" />
</Configuration>
```
4. 在软件目录打开 powershell, 运行powershell 命令： 
```bash
setup /configure configuration.xml
```
5. 等。


微软的 office ltsc 2024 激活： https://massgrave.dev/

  
1. 管理员运行powershell, 命令行运行这个：

```shell

irm https://get.activated.win | iex

```

  

如果是因为安全策略什么的不能执行， 可以问问AI，应该是安全策略的原因：

```shell

Set-ExecutionPolicy RemoteSigned

```

  

2. 几个弹窗之后 ， 输入你需要激活的产品。

- 大概率是输入 4， Online KMS.

- 大概率是输入 2， Activate - Office [All]

  

3. 输入两个 0 ， 退出程序。

  

4. Office 应该就已经激活了, 不过记得 180 天之后来继续激活。