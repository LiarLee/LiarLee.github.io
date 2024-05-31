---
title: pyautogui自动脚本
date: 2019-05-17 22:21:08
tags: Python 
category: Python
---
最近一个游戏非常的上头， 实在是肝不动了，自己写了个脚本帮我点点点。  
### Pyautogui 库

[Pyautogui 项目](https://pyautogui.readthedocs.io/en/latest/)
[Pyautogui CheatSheet](https://pyautogui.readthedocs.io/en/latest/quickstart.html)

简单记录了一下使用到的方法。

	pyautogui.position()  #  获取鼠标位置  
	pyautogui.locateOnScreen()  #  对屏幕截图，获取图片文件所对应的屏幕坐标  
	pyautogui.click()   #  模拟鼠标点击  
	pyautogui.doubleclick()  #  模拟鼠标双击  
	pyautogui.moveTo()  #  移动到屏幕坐标位置  
	pyautogui.moveRel()     #  移动固定的坐标距离  
	pyautogui.dragRel()     #  按住鼠标拖拽  

### code
```python
#!/usr/bin/python
# -*- coding:UTF-8 -*-

import pyautogui
import time
import os

def MOTIONMOUSE(lines):
    if lines < 9:
        # 检测是否有书本或食物
        results_food = pyautogui.locateOnScreen('./food.png', grayscale=True)   # 检测食物图片是否存在
        print('- 食物检测结果：', results_food)
        results_book = pyautogui.locateOnScreen('./book.png', grayscale=True)   # 检测书籍图片是否存在
        print('- 书本检测结果：', results_book)
        pyautogui.click(1900, 60, duration=0.1) # 点击换线
        if results_book is not None:    
            pyautogui.click(1700, 325) # 点击学习
            pyautogui.click(1600, 645) # 点击确定
        elif results_food is not None:
            pyautogui.click(1700, 325)  # 点击食用
        else:
            pass

        pyautogui.moveTo(1700, 60, duration=0.1)    # 移动到对应一线的位置
        pyautogui.moveRel(0, 65 * lines, duration=0.1)  # 移动到对应的线路位置
        time.sleep(1)
        pyautogui.click()   # 触发一次点击
    else:
        pyautogui.click(1900, 60, duration=0.3) #  
        # 检测是否有书本或食物
        results_food = pyautogui.locateOnScreen('./food.png', grayscale=True)
        print('- 食物检测结果：', results_food)
        results_book = pyautogui.locateOnScreen('./book.png', grayscale=True)
        print('- 书本检测结果：', results_book)
        if results_book is not None:
            pyautogui.click(1700, 325)
            pyautogui.click(1600, 645)
        elif results_food is not None:
            pyautogui.click(1700, 325)
        else:
            pass

        for t in range(0, lines-8):
            pyautogui.moveTo(1700, 90, duration=0.1)
            pyautogui.dragRel(0, -65, duration=0.3)
        if t < 14:
            time.sleep(3)
        else:
            pass

        pyautogui.click(1700, 480, duration=0.1)

# starting .....

Count = 0
replace_times = 0
Energy = input('please input value of energy: ')        # 输入体力
All_lines = input('please input the number of lines: ') # 输入所有线路的数字

for turns in range(1, 999):
    print('** 这是第 ' + str(turns) + ' 轮采集。')
    for line in range (1, int(All_lines) + 1):
        print('* 这是第 ' + str(line) + ' 条线路。')
        clock = time.strftime('%H:%M:%S', time.localtime(time.time()))
        print('* 开始时间 = ' + clock + ' ')
        MOTIONMOUSE(int(line))
        time.sleep(2)
        pyautogui.click(1600, 770, duration=1.5)
        pyautogui.moveTo(1310, 800)

        #检测是否有树木
        results_click = pyautogui.locateOnScreen('./level4_usable.png', grayscale=True)  # 计算斧子在不在
        print('- 斧子检测结果：', results_click)
        results_replace = pyautogui.locateOnScreen('./level4_replace.png', grayscale=True)  # 计算可替换的斧子在不在
        print('- 更换检测结果：', results_replace)

        # 判断是否有物品
        if results_click is not None:  # 判断是否有按键，有等待，没有按键换线；
            print('* 第 ' + str(Count) + ' 次采集。')
            Count = Count +1
            energy = int(Energy) - 15
        elif results_replace is not None:   # 判断是否有可更换的斧子 
            pyautogui.click(1510, 720, duration=0.2)
            pyautogui.click(1310, 880, duration=0.2)
            Count = Count + 1
            replace_times = replace_times + 1
            print('这是第 ' + str(Count) + ' 次采集。') 
            print('这是第 ' + str(replace_times) + ' 次换斧子。')
            energy = int(Energy) - 15
            time.sleep(4)
        else:
            print('-- 采集物或斧子未存在，跳过。') 
            pass            # 啥也没有，跳过
    print('Starting Waiting for Refresh:')
    time.sleep(200)
```

