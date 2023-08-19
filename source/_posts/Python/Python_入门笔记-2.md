---
title: Python入门笔记 (二)
date: 2018-01-09 13:34:26
tags: Python
categories: Python
---
## Def定义函数

```
def fact(n):                    #定义求阶乘函数
    if n == 1:
        return 1
    return n * fact(n - 1)

result = fact(5)                #计算结果
print(result)                   #输出计算结果
```

## 递归函数 -- 尾递归优化
**用递归函数需要注意防止栈溢出。**  
解决递归调用栈溢出的方法是通过尾递归优化，

```
def fact(n):                                #尾递归优化
    return fact_iter(n, 1)                  #函数返回值是之前定义的递归函数

def fact_iter(num, product):
    if num == 1:
        return product
    return fact_iter(num - 1, num * product)
    print(num, product)


result = fact(1000)
print(result)
```

## 迷之递归 -- 汉诺塔 (没懂)
```
def move(n, a, b, c):
    if n == 1:                          #只有一个盘子，所以从a到c
        print(a, '-->', c)
    else:
        move(n-1, a, c, b)              #有N个盘子，移动N-1个盘子，a-b
        move(1, a, b, c)                #将最大的盘子从a--c
        move(n-1, b, a, c)              #剩下的N-1从b--c

move(3, 'A', 'B', 'C')                      # 总共三个盘子，ABC三个柱子
```

## 高级特性

### 切片
```
L = ['aaa', 'bbb', 'ccc']

# 取出前两个元素

# Method 1
[L[0],L[1]]

# Method 2 -- For
r = []
n = 2
for i in range(n):
    r.append(L[i])

print(r)

# Method 3 -- Slice
print(L[0:2])               #取出 0--2

print(L[:2])                #取出 0--2

print(L[-2:])               #取出倒数两个元素

print(L[-2:-1])             #取出倒数第二个

L[a:b:c]                    #a----索引开始序号
                            #b----索引结束序号
                            #c----步长
```
### 切片练习

```
def trim(s):
    if not len(s):        #非空
        return s
    if s[0] == ' ':       #起始位置位置为空
        s = s[1:]
        return trim(s)        #返回处理后的字符串
    elif s[-1] == ' ':        #末尾为空
        s = s[:-1]
        return trim(s)
    return s              #返回s

if trim('hello  ') != 'hello':
    print('测试失败!')
elif trim('  hello') != 'hello':
    print('测试失败!')
elif trim('  hello  ') != 'hello':
    print('测试失败!')
elif trim('  hello  world  ') != 'hello  world':
    print('测试失败!')
elif trim('') != '':
    print('测试失败!')
elif trim('    ') != '':
    print('测试失败!')
else:
    print('测试成功!')
```

### For循环迭代 练习

```
def findMinAndMax(L):
    if 0 == len(L):
        return None, None

    min = L[0]
    max = L[0]
    i = 0
    for i in L:
        if i > max:
            max = i
        if i < min:
            min = i
    return min, max

# 测试
if findMinAndMax([]) != (None, None):
    print('测试失败!')
elif findMinAndMax([7]) != (7, 7):
    print('测试失败!')
elif findMinAndMax([7, 1]) != (1, 7):
    print('测试失败!')
elif findMinAndMax([7, 1, 3, 9, 5]) != (1, 9):
    print('测试失败!')
else:
    print('测试成功!')

```

### 列表生成式

```
list(range(1,11))

M = [x * x for x in range(1, 11)]     #列表生成式
print(M)

list = [s.lower() for s in L1]

# 练习
L1 = ['Hello','World', 18, 'Apple', None]
test = isinstance(L1, str)
print(test)

L2 = [s.lower() for s in L1 if isinstance(s, str) == True]


# 测试:
print(L2)
if L2 == ['hello', 'world', 'apple']:
    print('测试通过!')
else:
    print('测试失败!')
```
