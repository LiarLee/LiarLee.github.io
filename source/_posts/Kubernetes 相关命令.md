查看 AWS LoadBalancer 证书的信息： 
```bash
kubectl get validatingwebhookconfigurations.admissionregistration.k8s.io aws-load-balancer-webhook -ojsonpath={.webhooks[0].clientConfig.caBundle}  | base64 -d  | openssl x509 -noout -text
```
