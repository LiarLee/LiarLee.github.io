---
title: rime的配置
tags: RIME, Linux, Windows
category: Other
date: 2023-08-13 10:39:06
---

https://github.com/iDvel/rime-ice

https://rime.im/

小狼毫输入法， 或者Fcitx5 挂载 rime 即可。 

后面如果还有输入法相关的内容会放在这个里面。 

## 小鹤双拼
```shell
> cat ./default.custom.yaml
patch:
  schema_list:
    - schema: double_pinyin_flypy    # 小鹤双拼
  ascii_composer:
    good_old_caps_lock: true  # true | false
    switch_key:
      Caps_Lock: clear      # commit_code | commit_text | clear
      Shift_L: noop  # commit_code | commit_text | inline_ascii | clear | noop
      Shift_R: noop         # commit_code | commit_text | inline_ascii | clear | noop
      Control_L: noop       # commit_code | commit_text | inline_ascii | clear | noop
      Control_R: noop       # commit_code | commit_text | inline_ascii | clear | noop
```
## 输入法默认不切换全半角
```yaml
> cat ./default.custom.yaml
patch:
  switches:
    - name: ascii_mode
      states: [ 中 ]
      reset: 0
    - name: ascii_punct # 中英标点
      states: [ ¥, $ ]
      reset: 0
    - name: traditionalization
      states: [ 简, 繁 ]
      reset: 1
    - name: emoji
      states: [ 💀, 😄 ]
      reset: 1
    - name: full_shape
      states: [ 半角, 全角 ]
      reset: 0
```