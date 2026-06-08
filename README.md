# 🧠 道德困境实验室 | Moral Dilemma Lab

一个交互式道德困境测试网站，用户面对 8 个经典道德困境做出选择，获得自己的道德人格画像。

## 技术栈

- **前端**: 纯 HTML/CSS/JS (Circuit Elegance 设计风格)
- **后端**: Python FastAPI + SQLite
- **部署**: Render.com

## 本地运行

```bash
pip install -r requirements.txt
python backend.py
# 打开 http://localhost:8000
```

## API

- `POST /api/submit` — 提交答题结果
- `GET /api/stats` — 获取全局统计数据
