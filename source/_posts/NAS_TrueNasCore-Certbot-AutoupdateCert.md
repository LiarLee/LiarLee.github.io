---
title: TrueNAS Core 自动更新UI证书
date: 2024-11-15 11:53:27
category: Application
tags:
  - NAS
  - TrueNasCore
  - Application
  - cert
---

这两天提示 TrueNAS Core UI 的证书过期了， 看了一下， 默认是一年的证书， 需要更新了。

使用 certbot 自动更新证书的方式比较干净，原始文档在[这里](https://ejeff.org/notes/lets-encrypt-on-truenas-core/) . 比其他的方法要好, 其中记录的步骤不太细致或者已经过时了， 记录一下我的步骤。

---
### Go
1. 创建一个Jail， 名称是 certbot， 具体的Release选择哪个都可以。本身这个证书只是给UI使用， 所以也就不需要创建任何的 Dataset 挂载进去。
3. 在 TrueNAS Core 创建一个新的 API Key， 用来给脚本部署证书使用。 
4. 在 Cloudflare 创建一个新的 API Key 用来作为 dns challenges 的入口， 调用 cloudflare 的接口。
5. 通过 UI 登录到 Jail 里面执行初始化。
```bash
# Install prerequisites
pkg update
pkg install python311 py311-certbot py311-certbot-dns-cloudflare git
# There have some different name in my truenas core 13, update this command.
# Use pkg search certbot you can check the latest version.

# Install the deploy script
git clone https://github.com/danb35/deploy-freenas.git /opt/deploy-freenas
cp /opt/deploy-freenas/deploy_config.example /opt/deploy-freenas/deploy_config
# Now configure the deploy script by editing /opt/deploy-freenas/deploy_config
# Add some detail.
pkg install vim
# Edit it. 
vim /opt/deploy-freenas/deploy_config
# 这里面的 私钥 和 fullchain 证书的位置， 与脚本提供的默认位置已经不同了，需要在配置文件里面指定一下。
# 如果还没生成证书可以暂时不配置， certbot 命令运行完成后回来填。
# Please note that you need to replace all [...] with your values.
# Line-Number CONFIG field
7 api_key = [YOUR TRUENAS CORE API KEY create at step 2]
14 cert_fqdn = [YOUR TRUENAS CORE FQDN FOR CERT CSR]
28 privkey_path = [/usr/local/etc/letsencrypt/live/[FQDN]/privkey.pem]
33 fullchain_path = [/usr/local/etc/letsencrypt/live/[FQDN]/fullchain.pem]

# Configure Cloudflare credentials
cat /usr/local/etc/certbot_cloudflare.conf
dns_cloudflare_email = [Cloudflare email address here]
dns_cloudflare_api_key = [API key from Cloudflare here]

chown root:wheel /usr/local/etc/certbot_cloudflare.conf
chmod 600 /usr/local/etc/certbot_cloudflare.conf

# Run certbot to get the certificates for the first time (fill in the domain and email address)
# 在运行这个命令结束之后， 会提供正确的保存位置， 将这个路径填到 /opt/deploy-freenas/deploy_config 这个配置文件中。
certbot certonly -d ["*.example.com"] -m ["your.email@example.com"] --dns-cloudflare --dns-cloudflare-credentials /usr/local/etc/certbot_cloudflare.conf --preferred-challenges dns-01

# Ensure the deploy script can successfully deploy the certificate to TrueNAS Core
# 在这里需要指定一下写好的配置文件， 理论上应该是直接运行命令可以识别到， 为了保险和后续的稳定执行， 在命令行加参数指定。
/opt/deploy-freenas/deploy_freenas.py -c /opt/deploy-freenas/deploy_config

# Create a cron job
cat <<- EOF >> /etc/crontab
# Renew Let's Encrypt certificates
0       0,12    *       *       *       root    certbot renew --deploy-hook /opt/deploy-freenas/deploy_freenas.py
EOF
```
6. 查看当前的证书是否已经部署成功。 