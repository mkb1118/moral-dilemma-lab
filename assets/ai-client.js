/**
 * ai-client.js - 前端调用多模型编排服务的轻量封装
 *
 * 用法:
 *   <script src="ai-client.js"></script>
 *   const res = await aiAsk("帮我分析这份性格测试结果", { strategy: "pipeline" });
 *   console.log(res.answer);
 */

const AI_SERVICE_URL = "http://127.0.0.1:8010";

async function aiAsk(prompt, options = {}) {
  const { strategy = "router", system = "" } = options;
  const resp = await fetch(`${AI_SERVICE_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, strategy, system }),
  });
  if (!resp.ok) {
    throw new Error(`AI 服务错误: ${resp.status} ${await resp.text()}`);
  }
  return resp.json();
}

async function aiHealth() {
  const resp = await fetch(`${AI_SERVICE_URL}/health`);
  return resp.json();
}
