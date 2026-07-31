// ai-orchestrator/server.js - 多模型编排服务（DeepSeek + GPT）
// 启动: node server.js   (需先设置 DEEPSEEK_API_KEY / OPENAI_API_KEY)
// 轻量 .env 加载：读取同目录 .env，不覆盖已存在的环境变量
const fs = require("fs");
const path = require("path");
try {
  const envFile = path.join(__dirname, ".env");
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch (e) {}

const http = require("http");
const { runRouter, runPipeline, runDebate, runCascade, runParallel } = require("./strategies");
const { resolveModel } = require("./providers");

const PORT = process.env.PORT || 8010;
const STRATEGIES = { router: runRouter, pipeline: runPipeline, debate: runDebate, cascade: runCascade, parallel: runParallel };

async function handleAsk(body) {
  const prompt = (body.prompt || "").trim();
  const strategy = STRATEGIES[body.strategy] ? body.strategy : "router";
  if (!prompt) return { error: "prompt 不能为空" };
  const started = Date.now();
  const result = await STRATEGIES[strategy](prompt, body.system || "");
  return { ...result, strategy, duration_ms: Date.now() - started };
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  try {
    if (req.method === "GET" && req.url === "/health") {
      const ds = process.env.DEEPSEEK_API_KEY ? "configured" : "missing";
      const oa = process.env.OPENAI_API_KEY ? "configured" : "missing";
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ status: "ok", deepseek: ds, openai: oa, strategies: Object.keys(STRATEGIES) }));
    }

    if (req.method === "POST" && req.url === "/ask") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      const body = JSON.parse(raw || "{}");
      const result = await handleAsk(body);
      if (result.error) { res.writeHead(400); return res.end(JSON.stringify(result)); }
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify(result));
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  } catch (e) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: e.message }));
  }
});

server.listen(PORT, () => {
  console.log("AI Orchestrator running at http://127.0.0.1:" + PORT);
  console.log("DeepSeek:", process.env.DEEPSEEK_API_KEY ? "OK" : "MISSING KEY");
  console.log("OpenAI:", process.env.OPENAI_API_KEY ? "OK" : "MISSING KEY");
});
