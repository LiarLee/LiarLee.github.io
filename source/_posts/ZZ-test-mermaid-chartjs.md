---
title: ZZ临时测试-mermaid-chartjs
date: 2026-10-19 15:00:00
categories: Test
tags:
  - Test
---

## mermaid 代码块写法

```mermaid
graph LR
  A[开始] --> B{判断}
  B -->|是| C[结束]
```

## mermaid 标签写法

{% mermaid %}
sequenceDiagram
  participant U as 用户
  participant S as 服务
  U->>S: 请求
  S-->>U: 响应
{% endmermaid %}

## chartjs 标签写法

{% chartjs %}
{
  "type": "bar",
  "data": {
    "labels": ["一", "二", "三"],
    "datasets": [{ "label": "测试", "data": [3, 7, 5] }]
  }
}
{% endchartjs %}
