---
title: CheatSheet_awscli
category: AWS
date: 2023-12-08 13:56:27
tags:
  - AWS
  - CheatSheet
---

### 查看实例和对应实例的系统平台信息
```bash
aws ec2 describe-instances --query "Reservations[*].Instances[*].{InstanceId:InstanceId,PlatformDetails:Platform}" --output table
```
### 查看实例和EBS的关联关系
```shell
aws ec2 describe-volumes --query 'Volumes[*].[VolumeId, Attachments[0].InstanceId, Size]' --output table
```
