# AI Orchestrator

多模型编排服务，为心理测评网站开发提供 DeepSeek + GPT 多策略调用。

## 启动

1. 复制 .env.example 为 .env 并填入 API key
2. Windows PowerShell 设置环境变量：
   ```
   $env:DEEPSEEK_API_KEY="sk-..."
   $env:OPENAI_API_KEY="sk-..."
   node server.js
   ```
3. 打开 ai-demo.html 测试

## 策略

- router: 按问题类型自动路由
- pipeline: deepseek 草稿 → gpt 审查
- debate: gpt + deepseek 辩论 → gpt 裁决
- cascade: 便宜模型自检，不足升级
- parallel: 双模型并行，择优返回
