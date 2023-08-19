---
title: Python入门笔记 (一)
date: 2018-01-08 15:16:21
tags: Python
categories: Python
---
## Python的输入输出
```
print('Hello,World!')  
name = input()
print('Your name is', name, ',Right?')
```

## Python字符中文编码Title
```
#!/usr/bin/env python3  
# -*- coding: utf-8 -*-  

a = input()
age = int(a)                       \\print输出都是字符串，格式化为数字之后才可以使用
```

## Python输出多行内容
```
print('''line1
...line2
...line3
''')
```

## Python的语句拼接
```
print('Hello,World!','My Name is Liarlee.')  
```

## Python占位符
```
name = Liarlee
age = 24
print('Hello,%s' % (name))
print('Your age is %d' % (age))
```

## Python中使用list和tuple

### List -- 列表
```
classmates = [Liarlee,TEST,WTF,LOL]
```
classmates就是一个list，list可以嵌套list    
```
len(classmates)                    \\查看list的长度  
classmates[1]                      \\list第二个元素  
classmates[-1]                     \\list倒数第一个元素    
classmates.append('Liarlee')       \\末尾添加一个值
classmates.pop()                   \\删除末尾的值
classmates.pop(i)                  \\删除指定索引位置的值
classmates.insert(1, 'Liarlee')    \\将值插入到某个索引位置
classmates[1] = Liarlee            \\直接更改某个索引位置的值
classmates.sort()                  \\list排序
```

### Tuple -- 元组
另一种有序列表叫元组：tuple。tuple和list非常类似，但是tuple一旦初始化就不能修改  
```
classmates = (Liarlee,TEST,WTF,LOL)
```

## 循环和判断

### IF判断
```
if
elif
.
.
.
elif
else                                        \\完全if格式        
```

### FOR……IN……循环
```  
for classmate in classmates:
  print(classmate)

list(range(101))                              \\生成0-100数字存入list
```

### WHILE循环
```
# -*- coding: utf-8 -*-
classmates = [Liarlee,TEST,WTF,LOL]
i = 0
while i < 4:
    print('Hello,%s' % (classmates[i]))
    i = i + 1
```

## Dict和set

### Dict -- 字典
```
SCORE = {'Liarlee': 95, 'TEST': 75, 'WTF': 85, ‘LOL‘：54}       \\定义字典
d['Liarlee'] = 67                                                \\字典赋值
'Thomas' in d                                                    \\确定Key是否在字典中
d.get('Liarlee')                                                 \\确定Key是否在字典中
d.pop('Liarlee')                                                 \\删除Key
```

### Set
set和dict类似，也是一组key的集合，但不存储value。    
```
s = set([1, 2, 3])                      \\创建一个set然后将list传入
s.add(4)                                \\添加一个元素进入set
```
