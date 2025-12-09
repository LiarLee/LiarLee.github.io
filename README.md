# Perpose
Source Code in here.  

# Workflow Description  
1. Upload the source markdown.
2. Trigger the Github Action workflow.
3. Broswer the blog to check result.

# How to Use
```
hexo new "Markdown Filename."
```

尝试恢复DroneCI无果， 将Workflow彻底迁移到了GithubAction， 目前会通过GithubAction触发自动部署的GithubPage， 免除了自己维护。 
看上去问题不大，现在的流程是， 直接 push hexo 分支， 然后触发GithubAction， 完成 CI 的流程和部署， 会收到邮件的通知。 



