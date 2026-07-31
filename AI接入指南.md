# AI 编排服务接入指南

把你的心理测试网站/其他前端项目接入多模型编排，只需要两步：启动服务 + 页面里加一段 JS。

## 1. 启动服务

```powershell
cd C:\Users\LENOVO\Documents\Codex\2026-07-31\ze\multi_model_orchestrator
uv sync
uv run python ai-service/server.py
```

看到 `Uvicorn running on http://127.0.0.1:8000` 就说明服务起来了。

## 2. 前端页面调用

把 `ai-client.js` 复制到你的项目里，然后在页面加：

```html
<script src="ai-client.js"></script>
<script>
async function askAI() {
  const res = await aiAsk("帮我分析这份性格测试结果", { strategy: "router" });
  document.getElementById("result").textContent = res.answer;
}
</script>
```

## 接口说明

### POST /ask

```json
{
  "prompt": "问题内容",
  "strategy": "router",        // router | cascade | debate | pipeline | parallel
  "system": "可选的系统提示词"
}
```

返回：

```json
{
  "answer": "最终答案",
  "strategy": "router",
  "steps": [{"model": "...", "label": "...", "preview": "..."}],
  "total_cost_rank": 1,
  "duration_ms": 14211
}
```

### GET /health

查看服务状态和可用模型。

## 常见问题

- **CORS 报错**：服务已开启全来源跨域，本地直接可用；部署到服务器后建议改 `server.py` 里的 `allow_origins`
- **免费模型限流 429**：免费共享池偶发限流，稍等重试，或给 OpenRouter 充值后把 `.env` 的 `PREFER_FREE` 改成 `false`
- **服务被占用**：改 `server.py` 末尾的 `port=8000` 换一个端口
