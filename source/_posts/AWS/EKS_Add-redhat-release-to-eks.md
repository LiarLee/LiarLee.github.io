---
title: 添加一个Redhat到EKS集群， 基于Packer的步骤
category: Kubernetes
date: 2023-07-11 11:29:53
tags:
  - Kubernetes
  - EKS
---

Copy From zhojiew 的私有仓库文档， 已经经过授权  ~ 

---

官方提供了基于packer工具的构建脚本

这里手动把相关的步骤执行下，基于redhat9构建一个自定义ami。据称eks优化的ami也是通过以下步骤完成的

# 手动构建ami

拉仓库

```bash
cd /home/ec2-suer
sudo yum install git -y
git clone https://github.com/awslabs/amazon-eks-ami.git
```

配置环境变量

```ini
KUBERNETES_VERSION=1.26.4 
KUBERNETES_BUILD_DATE=2023-05-11 
BINARY_BUCKET_NAME=amazon-eks
BINARY_BUCKET_REGION=cn-north-1
DOCKER_VERSION=20.10.23-1.amzn2.0.1
CONTAINERD_VERSION=1.6.*
RUNC_VERSION=1.1.5-1.amzn2
CNI_PLUGIN_VERSION=v0.8.6
PULL_CNI_FROM_GITHUB=true
SONOBUOY_E2E_REGISTRY=""
PAUSE_CONTAINER_VERSION=3.5
CACHE_CONTAINER_IMAGES=false
WORKING_DIR=/tmp/worker
TEMPLATE_DIR=/home/ec2-user/amazon-eks-ami
```

复制文件更新内核（可以跳过）

```bash
mkdir -p $WORKING_DIR
mkdir -p $WORKING_DIR/log-collector-script
mkdir -p $WORKING_DIR/bin

mv $TEMPLATE_DIR/files/* $WORKING_DIR/
mv $TEMPLATE_DIR/log-collector-script/linux/eks-log-collector.sh $WORKING_DIR/log-collector-script/
sudo chmod -R a+x $WORKING_DIR/bin/
sudo mv /tmp/worker/bin/* /usr/bin/

# sudo bash $TEMPLATE_DIR/scripts/upgrade_kernel.sh
KERNEL_VERSION=5.10
sudo grubby \
  --update-kernel=ALL \
  --args="psi=1"

sudo grubby \
  --update-kernel=ALL \
  --args="clocksource=tsc tsc=reliable"

sudo reboot
```

构建的主要逻辑在脚本`install-worker.sh`中

```bash
# sudo bash $TEMPLATE_DIR/scripts/install-worker.sh
export AWS_DEFAULT_OUTPUT="json"
ARCH="amd64"

sudo yum update -y
sudo yum install -y \
  chrony \
  conntrack \
  curl \
  ethtool \
  ipvsadm \
  jq \
  nfs-utils \
  socat \
  unzip \
  wget \
  yum-utils \
  yum-plugin-versionlock \
  mdadm \
  pigz

# Remove any old kernel versions.
sudo package-cleanup --oldkernels --count=1 -y

# Remove the ec2-net-utils package
if yum list installed | grep ec2-net-utils; then sudo yum remove ec2-net-utils -y -q; fi

sudo mkdir -p /etc/eks/
sudo mv $WORKING_DIR/configure-clocksource.service /etc/eks/configure-clocksource.service

# iptables 
sudo mv $WORKING_DIR/iptables-restore.service /etc/eks/iptables-restore.service

# awscli
sudo yum install less unzip jq -y
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install --update
complete -C '/usr/local/bin/aws_completer' aws

# systemd
sudo mv "${WORKING_DIR}/runtime.slice" /etc/systemd/system/runtime.slice

```
编译安装runc

```bash
# install runc and lock version
# sudo yum install -y runc-${RUNC_VERSION}
sudo yum install libseccomp-devel.x86_64 golang -y
go env -w GOPROXY=https://goproxy.io,direct
git clone https://github.com/opencontainers/runc
cd runc
make
sudo make install
```

安装containerd

```bash
# install containerd and lock version

sudo yum install -y yum-utils device-mapper-persistent-data lvm2
# sudo yum install -y containerd-${CONTAINERD_VERSION}
yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
sudo yum install -y containerd # 1.6.21
```

配置containerd

```bash
sudo mkdir -p /etc/eks/containerd
sudo mv $WORKING_DIR/containerd-config.toml /etc/eks/containerd/containerd-config.toml

# containerd and related service
sudo mv $WORKING_DIR/kubelet-containerd.service /etc/eks/containerd/kubelet-containerd.service
sudo mv $WORKING_DIR/sandbox-image.service /etc/eks/containerd/sandbox-image.service
sudo mv $WORKING_DIR/pull-sandbox-image.sh /etc/eks/containerd/pull-sandbox-image.sh
sudo mv $WORKING_DIR/pull-image.sh /etc/eks/containerd/pull-image.sh
sudo chmod +x /etc/eks/containerd/pull-sandbox-image.sh
sudo chmod +x /etc/eks/containerd/pull-image.sh

sudo mkdir -p /etc/systemd/system/containerd.service.d
cat << EOF | sudo tee /etc/systemd/system/containerd.service.d/10-compat-symlink.conf
[Service]
ExecStartPre=/bin/ln -sf /run/containerd/containerd.sock /run/dockershim.sock
EOF

cat << EOF | sudo tee -a /etc/modules-load.d/containerd.conf
overlay
br_netfilter
EOF

cat << EOF | sudo tee -a /etc/sysctl.d/99-kubernetes-cri.conf
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.ipv4.ip_forward = 1
EOF

# skip docker

```
日志轮换配置

```bash
# logrotate
sudo mv $WORKING_DIR/logrotate-kube-proxy /etc/logrotate.d/kube-proxy
sudo mv $WORKING_DIR/logrotate.conf /etc/logrotate.conf
sudo chown root:root /etc/logrotate.d/kube-proxy
sudo chown root:root /etc/logrotate.conf
sudo mkdir -p /var/log/journal
```

下载kubelet和aws-iam-authenticator

```bash
## download bin in china region
S3_DOMAIN="amazonaws.com.cn"

S3_PATH="s3://amazon-eks/1.26.4/2023-05-11/bin/linux/amd64"

# Verify that the aws-iam-authenticator is at last v0.5.9 or greater
BINARIES=(
  kubelet
  aws-iam-authenticator
)

for binary in ${BINARIES[*]}; do
    aws s3 cp $S3_PATH/$binary . --region cn-north-1
    sudo chmod +x $binary
    sudo mv $binary /usr/bin/
done
```

继续配置服务

```bash
# kubernetes
sudo mkdir -p /etc/kubernetes/manifests
sudo mkdir -p /var/lib/kubernetes
sudo mkdir -p /var/lib/kubelet
sudo mkdir -p /opt/cni/bin

CNI_PLUGIN_FILENAME="cni-plugins-linux-${ARCH}-${CNI_PLUGIN_VERSION}"
aws s3 cp --region $BINARY_BUCKET_REGION $S3_PATH/${CNI_PLUGIN_FILENAME}.tgz .
sudo tar -xvf "${CNI_PLUGIN_FILENAME}.tgz" -C /opt/cni/bin
rm "${CNI_PLUGIN_FILENAME}.tgz"

sudo mkdir -p /etc/kubernetes/kubelet
sudo mkdir -p /etc/systemd/system/kubelet.service.d
sudo mv $WORKING_DIR/kubelet-kubeconfig /var/lib/kubelet/kubeconfig
sudo chown root:root /var/lib/kubelet/kubeconfig

sudo mv $WORKING_DIR/kubelet.service /etc/systemd/system/kubelet.service
sudo chown root:root /etc/systemd/system/kubelet.service
sudo mv $WORKING_DIR/kubelet-config.json /etc/kubernetes/kubelet/kubelet-config.json
sudo chown root:root /etc/kubernetes/kubelet/kubelet-config.json

sudo systemctl daemon-reload
# Disable the kubelet until the proper dropins have been configured
sudo systemctl disable kubelet
```

配置各种脚本

```bash
sudo mkdir -p /etc/eks
sudo mv $WORKING_DIR/get-ecr-uri.sh /etc/eks/get-ecr-uri.sh
sudo chmod +x /etc/eks/get-ecr-uri.sh
sudo mv $WORKING_DIR/eni-max-pods.txt /etc/eks/eni-max-pods.txt
sudo mv $WORKING_DIR/bootstrap.sh /etc/eks/bootstrap.sh
sudo chmod +x /etc/eks/bootstrap.sh
sudo mv $WORKING_DIR/max-pods-calculator.sh /etc/eks/max-pods-calculator.sh
sudo chmod +x /etc/eks/max-pods-calculator.sh

```

配置ecr助手

```bash
# ECR CREDENTIAL PROVIDER
ECR_CREDENTIAL_PROVIDER_BINARY="ecr-credential-provider"
echo "AWS cli present - using it to copy ${ECR_CREDENTIAL_PROVIDER_BINARY} from s3."
aws s3 cp --region $BINARY_BUCKET_REGION $S3_PATH/$ECR_CREDENTIAL_PROVIDER_BINARY .

sudo chmod +x $ECR_CREDENTIAL_PROVIDER_BINARY
sudo mkdir -p /etc/eks/image-credential-provider
sudo mv $ECR_CREDENTIAL_PROVIDER_BINARY /etc/eks/image-credential-provider/
sudo mv $WORKING_DIR/ecr-credential-provider-config.json /etc/eks/image-credential-provider/config.json

```

安装ssm（可选）

```bash
# ssm-agent
# sudo yum install -y amazon-ssm-agent
sudo dnf install -y https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/linux_amd64/amazon-ssm-agent.rpm
```

标记发行信息

```bash
# AMI Metadata
BASE_AMI_ID=$(imds /latest/meta-data/ami-id)
cat << EOF > "${WORKING_DIR}/release"
BASE_AMI_ID="$BASE_AMI_ID"
BUILD_TIME="$(date)"
BUILD_KERNEL="$(uname -r)"
ARCH="$(uname -m)"
EOF
sudo mv "${WORKING_DIR}/release" /etc/eks/release
sudo chown -R root:root /etc/eks
```

额外配置

```bash
# Stuff required by "protectKernelDefaults=true"
cat << EOF | sudo tee -a /etc/sysctl.d/99-amazon.conf
vm.overcommit_memory=1
kernel.panic=10
kernel.panic_on_oops=1
EOF

# Setting up sysctl properties
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
echo fs.inotify.max_user_instances=8192 | sudo tee -a /etc/sysctl.conf
echo vm.max_map_count=524288 | sudo tee -a /etc/sysctl.conf

# adding log-collector-script 
sudo mkdir -p /etc/eks/log-collector-script/
sudo cp $WORKING_DIR/log-collector-script/eks-log-collector.sh /etc/eks/log-collector-script/

# Remove Yum Update from cloud-init config
sudo sed -i \
  's/ - package-update-upgrade-install/# Removed so that nodes do not have version skew based on when the node was started.\n# - package-update-upgrade-install/' \
  /etc/cloud/cloud.cfg
```

# 测试加入集群

配置节点的标签和权限，将节点角色提前加入auth map

提前手动拉取pause镜像

```bash
sudo ctr --namespace k8s.io image pull 918309763551.dkr.ecr.cn-north-1.amazonaws.com.cn/eks/pause:3.5 --user AWS:`aws ecr get-login-password --region cn-north-1`
```

这里执行启动脚本每次在`systemctl start kubelet`时报找不到`kubelet.service`。不知道原因

干脆手动启动kubelet

```bash
/usr/bin/kubelet \
    --config /etc/kubernetes/kubelet/kubelet-config.json \
    --kubeconfig /var/lib/kubelet/kubeconfig \
    --container-runtime-endpoint unix:///run/containerd/containerd.sock \
    --image-credential-provider-config /etc/eks/image-credential-provider/config.json \
    --image-credential-provider-bin-dir /etc/eks/image-credential-provider \
    --node-ip=192.168.2.174 \
    --pod-infra-container-image=918309763551.dkr.ecr.cn-north-1.amazonaws.com.cn/eks/pause:3.5 \
    --v=2 \
    --hostname-override=ip-192-168-2-174.cn-north-1.compute.internal \
    --cloud-provider=external \
    --container-runtime=remote
```

加入成功

