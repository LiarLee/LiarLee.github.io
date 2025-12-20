---
title: Systemd 关闭 Firewalld
date: 2018-05-11 14:21:36
categories: Linux
tags:
  - Linux
  - Fedora
---
如何彻底关闭 Fedora27 的 Firewalld，防止每次重启自动开启。

---

# 系统基础环境配置文档 (Fedora 27/RHEL 系)

本文档旨在规范 Fedora 27 及同类 RHEL 系统下的防火墙关闭与 Legacy 启动脚配置流程。

## 1. 彻底禁用 Firewalld 防火墙

在 Systemd 架构下，仅执行 `disable` 并不能完全阻止 Firewalld 启动，因为其他依赖组件可能会尝试唤醒该服务。建议根据需求选择以下两种方案之一。

### 方案 A：标准禁用（推荐）
此方案保留软件包，但从系统层面彻底屏蔽服务，防止意外唤醒。

```bash
# 1. 停止当前运行的防火墙进程
systemctl stop firewalld

# 2. 禁用开机自启
systemctl disable firewalld

# 3. 屏蔽服务 (关键步骤)
# 说明：Mask 会将服务单元软链接至 /dev/null，确保任何程序都无法调用它
systemctl mask firewalld
```

### 方案 B：彻底卸载（暴力模式）
如果确定该环境永远不需要防火墙组件，可以直接移除软件包。

```bash
# 移除 firewalld 包及依赖
dnf remove -y firewalld
```

---

## 2. 启用 rc.local 兼容模式 (开机自启)

Fedora 27 及更新版本默认不再创建 `/etc/rc.d/rc.local` 文件。若需使用传统的 rc.local 进行开机自启管理，需手动创建文件并赋予执行权限。

### 操作步骤

**Step 1: 创建 rc.local 脚本文件**

使用以下命令直接创建文件并写入基础 Header：

```bash
cat > /etc/rc.d/rc.local <<EOF
#!/bin/bash
# rc.local config file
# This script will be executed at the end of the multi-user runlevel.

echo "Running rc.local scripts..."

# --- 在下方添加需要自启的业务命令 ---
# 示例：启动 Firefox (仅作为示例，通常服务器环境不需要)
# /usr/bin/firefox &

EOF
```

**Step 2: 赋予可执行权限 (至关重要)**

Systemd 的 `rc-local.service` 只有在检测到该文件具有可执行权限时才会启动。

```bash
chmod +x /etc/rc.d/rc.local
```

**Step 3: 启动并激活 rc-local 服务**

```bash
# 启动服务并设置为开机自启
systemctl enable --now rc-local
```

**Step 4: 验证状态**

执行以下命令确认服务已正常运行（Active 状态应为 active (exited) 或 running）：

```bash
systemctl status rc-local
```