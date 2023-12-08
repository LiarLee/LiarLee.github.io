### 查看实例和对应实例的系统平台信息
```bash
aws ec2 describe-instances --query "Reservations[*].Instances[*].{InstanceId:InstanceId,PlatformDetails:Platform}" --output table
```

Wating for update
