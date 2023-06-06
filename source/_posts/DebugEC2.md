发送一个诊断请求给EC2， 触发os本身NMI Unknown事件，这个时间会触发Kdump记录当时的现场。

```bash
aws ec2 send-diagnostic-interrupt --region cn-north-1 --instance-id i-********************
```

