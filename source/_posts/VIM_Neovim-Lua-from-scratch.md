---
title: Neovim 全 Lua 配置 
category: Linux
date: 2023-08-05 00:36:04
tags: VIM
---

写这个是为了记录一下我新的VIM配置和VIM的快捷键，看起来lua的版本比之前的scripts要好的多， 无论是使用的方式还是启动的速度， 都比之前快。 



## 我的需求： 

- 打开代码， 会显示代码高亮。 
- vim可以默认满足的要求， 尽可能少的使用鼠标。
- 代码错误提示 LSP ， 挂了Language Server， (Done.
- 主题， 目前使用的是 catppuccin-frappe
- Markdown Preview （ 目前还没有 
- 代码补全（ Done. 



## 我的快捷键清单：

|      Mappings | Actions                                                      |
| ------------: | ------------------------------------------------------------ |
| ` <Leader-1>` | 高亮第 1 列， 高亮列， 首字母缩进检查                        |
| ` <Leader-2>` | 高亮第 3 列， 高亮列， 双空格缩进检查                        |
| ` <Leader-3>` | 高亮第 5 列， 高亮列， 4空格缩进检查                         |
| ` <Leader-4>` | 高亮第 9 列， 高亮列， 8空格缩进检查                         |
| ` <Leader-a>` | 搭配Visual block mode 进行bash shell 的注释，行首添加#       |
| ` <Leader-x>` | 同上，删除注释。                                             |
| ` <Leader-r>` | KubeApply (暂时不能使用， 之前的vimplug插件)                 |
| ` <Leader-e>` | KubeDelete (暂时不能使用， 之前的vimplug插件)                |
| `<Leader-dr>` | KubeApplyDIr (暂时不能使用， 之前的vimplug插件)              |
| `<Leader-de>` | KubeDeleteDir (暂时不能使用， 之前的vimplug插件)             |
| `<Leader-ff>` | Telescope Find FIles 查找文件                                |
| `<Leader-fg>` | Telescope Find Live grep 过滤文件中的关键字                  |
| `<Leader-fb>` | Telescope Find Buffer 查看Buffer中的数据。VIMbuffer          |
| `<Leader-fh>` | Telescope Find Help（ not use， Just record                  |
| `<Leader-ss>` | Alias VIM Command :PackerSync                                |
| `<Leader-ms>` | Alias VIM Command :Mason                                     |
| `<Leader-ld>` | Goto the definition of the word under the cursor, if there's only one, otherwise show all options in Telescope |
| `<Leader-lt>` | Lists Function names, variables, from Treesitter             |
|       `<C-n>` | Telescope PageDown 在Insert模式下面的上下移动。              |
|       `<C-p>` | Telescope PageUp 在Insert模式下面的上下移动。                |
|     `<j / k>` | Telescope NORMAL Up/Down Normal模式下的上下移动。            |
|       `<C-x>` | Telescope Go to file selection as a split 找到的文件直接水平开新窗口（下方 |
|       `<C-v>` | Telescope Go to file selection as a vsplit 找到的文件直接垂直开新窗口（右侧 |
|       `<C-t>` | Telescope Go to a file in a new tab 找到的文件开新的VIM tab， 感觉不是非常的好用，垂直会经常被用到。 |
|       `<C-/>` | Telescope Show mappings for picker actions (insert mode)  帮助 |
|           `?` | Telescope Show mappings for picker actions (normal mode) 帮助 |
|       `<M-f>` | Scroll left in results window                                |
|       `<M-b>` | Scroll right in results window                               |
|               |                                                              |
|               |                                                              |

其他的还在配置和学习中， 先这样把。。 之前用的功能不太多， 有时间继续看。。。。
