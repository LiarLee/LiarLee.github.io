---
title: 制作一个可用的malloc image
category: Linux
date: 2023-01-03 12:58:47
tags: docker
---

# 写一个melloc的C程序
```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
 
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
    
    getchar();
    free(p);
    
    return 0;
}
```

# 写一个Dockerfile
```dockerfile
FROM alphine
RUN apk add build-base
COPY mem.c .
RUN gcc -o mem mem.c
# or RUN gcc -static -o mem mem.c

FROM alphine
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




