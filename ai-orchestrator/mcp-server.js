// mcp-server.js - 零依赖 MCP server，把编排服务包装成 Codex 工具
// 用法: node mcp-server.js   (由 Codex 通过 stdio 启动)
const readline = require("readline");

const ORCH_URL = process.env.ORCH_URL || "http://127.0.0.1:8010";
const STRATEGIES = ["router", "pipeline", "debate", "cascade", "parallel"];

const TOOLS = [
  {
    name: "ai_ask",
    description: "调用 DeepSeek/GPT 多模型编排服务回答问题。可用策略: router 自动路由, pipeline 草稿+审查, debate 双模型辩论+裁决, cascade 便宜优先自检升级, parallel 并行择优。适合让外部模型辅助开发决策、代码评审、方案设计。",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "要问的问题或任务" },
        strategy: { type: "string", enum: STRATEGIES, default: "router", description: "编排策略" },
        system: { type: "string", description: "可选 system prompt" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "ai_health",
    description: "检查 DeepSeek/GPT 编排服务是否可用，返回两个 API key 状态和可用策略。",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "ai_list_models",
    description: "列出编排服务当前可用的模型映射。",
    inputSchema: { type: "object", properties: {} },
  },
];

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + "\n");
}

async function callOrchestrator(path, body, method = "POST") {
  const resp = await fetch(ORCH_URL + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error("编排服务错误 " + resp.status + ": " + text.slice(0, 400));
  return JSON.parse(text);
}

async function handleToolCall(name, args) {
  if (name === "ai_ask") {
    const result = await callOrchestrator("/ask", {
      prompt: args.prompt,
      strategy: args.strategy || "router",
      system: args.system || "",
    });
    const text = [
      "【策略】" + result.strategy,
      "【成本等级】" + result.total_cost_rank + "  【耗时】" + result.duration_ms + "ms",
      "【步骤】" + (result.steps || []).map(s => s.label + "(" + s.model + ")").join(" -> "),
      "",
      result.answer,
    ].join("\n");
    return { content: [{ type: "text", text }] };
  }
  if (name === "ai_health") {
    const h = await callOrchestrator("/health", null, "GET");
    return { content: [{ type: "text", text: JSON.stringify(h, null, 2) }] };
  }
  if (name === "ai_list_models") {
    const models = {
      "deepseek-fast": "deepseek-chat",
      "deepseek-pro": "deepseek-reasoner",
      "gpt-fast": "gpt-4o-mini",
      "gpt-pro": "gpt-4o",
    };
    return { content: [{ type: "text", text: JSON.stringify(models, null, 2) }] };
  }
  throw new Error("未知工具: " + name);
}

const rl = readline.createInterface({ input: process.stdin, terminal: false });
rl.on("line", async (line) => {
  let msg;
  try { msg = JSON.parse(line); } catch (e) { return; }
  const id = msg.id;

  if (msg.method === "initialize") {
    return send({
      jsonrpc: "2.0", id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "ai-orchestrator-mcp", version: "1.0.0" },
      },
    });
  }
  if (msg.method === "notifications/initialized" || msg.method === "notifications/cancelled") return;
  if (msg.method === "ping") return send({ jsonrpc: "2.0", id, result: {} });

  if (msg.method === "tools/list") {
    return send({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
  }

  if (msg.method === "tools/call") {
    const params = msg.params || {};
    try {
      const result = await handleToolCall(params.name, params.arguments || {});
      return send({ jsonrpc: "2.0", id, result });
    } catch (e) {
      return send({
        jsonrpc: "2.0", id,
        result: { content: [{ type: "text", text: "调用失败: " + e.message }], isError: true },
      });
    }
  }

  send({ jsonrpc: "2.0", id: id === undefined ? null : id, error: { code: -32601, message: "method not found: " + msg.method } });
});
