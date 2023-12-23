---
title: 制作一个可用的malloc image
category: Linux
date: 2023-01-03 12:58:47
tags:
  - docker
---

# 写一个melloc的C程序
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
 
#include <signal.h>
#include <unistd.h>
 
#define SIGTERM_MSG "SIGTERM received.\n"
 
void sig_term_handler(int signum, siginfo_t *info, void *ptr)
{
    write(STDERR_FILENO, SIGTERM_MSG, sizeof(SIGTERM_MSG));
}
 
void catch_sigterm()
{
    static struct sigaction _sigact;
 
    memset(&_sigact, 0, sizeof(_sigact));
    _sigact.sa_sigaction = sig_term_handler;
    _sigact.sa_flags = SA_SIGINFO;
 
    sigaction(SIGTERM, &_sigact, NULL);
}

int main(int argc, char *argv[])
{
    if ( argc != 2 )
    {
        printf("ERROR ELEMENT COUNTS.");
        return 1;
    }

    // printf ("%ld\n", atol(argv[1]));

    int *p;
    long n = atol(argv[1]) * 1024 * 1024;

    // printf ("%ld\n", n);
    
    printf("Allocate Memory Size: %ld MB.\n", atol(argv[1]));
    
    // Allocate Memory.
    p = (int *)malloc(n);
    
    if (p != NULL)
        printf("SUCCESS.");
    else
        printf("FAILED.");
    
    memset(p, 0, n);

    catch_sigterm();

    free(p);
    
    sleep(3000);

    return 0;
}
```

# 写一个Dockerfile
```dockerfile
FROM alpine
RUN apk add build-base
COPY mem.c .
RUN gcc -o mem mem.c
# or RUN gcc -static -o mem mem.c

FROM alpine
COPY --from=0 ./mem .
ENTRYPOINT [ "/mem" ]
```

# 进行一个很新的测试
Build Image.
```bash
dive build -t liarlee-malloc:latest .
OR
docker build -t liarlee-malloc:latest .
```
## Docker RUN.
```bash
docker run --name malloc --rm -dt liarlee-malloc:latest 200
# docker run --name malloc --rm -dt liarlee-malloc:latest [MemorySize(MB)]
```
## Kubernetes Deployment RUN.
```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: liarlee-malloc
spec:
  selector:
    matchLabels:
      app: malloc
  replicas: 1 
  template: 
    metadata:
      labels:
        app: malloc
    spec:
      containers:
      - name: malloc
        image: liarlee-malloc:latest
        args: [ "200" ]
```
