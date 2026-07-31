// providers.js - OpenAI 兼容 API 封装（DeepSeek + GPT）
const PROVIDERS = {
  deepseek: {
    baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1",
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    models: {
      fast: process.env.DEEPSEEK_FAST_MODEL || "deepseek-chat",
      pro: process.env.DEEPSEEK_PRO_MODEL || "deepseek-reasoner",
    },
  },
  openai: {
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    apiKey: process.env.OPENAI_API_KEY || "",
    models: {
      fast: process.env.OPENAI_FAST_MODEL || "gpt-4o-mini",
      pro: process.env.OPENAI_PRO_MODEL || "gpt-4o",
    },
  },
};

// 别名表：既支持 fast/pro 槽位，也支持直接指定模型名
// 槽位形式: { provider, model: "fast"|"pro" }  -> 跟随 .env 配置
// 直指形式: { provider, modelName: "xxx" }     -> 固定模型名
const MODEL_ALIAS = {
  // DeepSeek 槽位
  "deepseek-fast": { provider: "deepseek", model: "fast" },
  "deepseek-pro": { provider: "deepseek", model: "pro" },
  "deepseek-chat": { provider: "deepseek", model: "fast" },
  "deepseek-reasoner": { provider: "deepseek", model: "pro" },
  // DeepSeek 直指型号（即使 .env 覆盖槽位也不受影响）
  "deepseek-v4-flash": { provider: "deepseek", modelName: "deepseek-v4-flash" },
  "deepseek-v4-pro": { provider: "deepseek", modelName: "deepseek-v4-pro" },
  "deepseek-r1": { provider: "deepseek", modelName: "deepseek-reasoner" },
  "deepseek-v3": { provider: "deepseek", modelName: "deepseek-chat" },
  // GPT 槽位
  "gpt-fast": { provider: "openai", model: "fast" },
  "gpt-pro": { provider: "openai", model: "pro" },
  "gpt-4o-mini": { provider: "openai", model: "fast" },
  "gpt-4o": { provider: "openai", model: "pro" },
  "gpt-4.1": { provider: "openai", model: "pro" },
  "gpt-4.1-mini": { provider: "openai", model: "fast" },
  "gpt-4.1-nano": { provider: "openai", model: "fast" },
  // GPT 直指型号
  "gpt-4.1-2025-04-14": { provider: "openai", modelName: "gpt-4.1-2025-04-14" },
};

// 成本等级（相对值，越小越便宜）
const COST_RANK = {
  "deepseek-chat": 1, "deepseek-v4-flash": 1,
  "deepseek-reasoner": 3, "deepseek-v4-pro": 3,
  "gpt-4o-mini": 2, "gpt-4.1-mini": 2, "gpt-4.1-nano": 1,
  "gpt-4o": 4, "gpt-4.1": 4,
};

function resolveModel(alias) {
  const hit = MODEL_ALIAS[alias];
  if (!hit) throw new Error("未知模型: " + alias + "，可用: " + Object.keys(MODEL_ALIAS).join(", "));
  const cfg = PROVIDERS[hit.provider];
  if (!cfg.apiKey) throw new Error(hit.provider + " API key 未配置，请设置环境变量或 .env");
  const name = hit.modelName || cfg.models[hit.model];
  return { provider: cfg, providerName: hit.provider, name, cost: COST_RANK[name] || 2 };
}

function listModels() {
  const out = {};
  for (const alias of Object.keys(MODEL_ALIAS)) {
    try { out[alias] = resolveModel(alias).name; } catch (e) { out[alias] = "(key 未配置)"; }
  }
  return out;
}

async function callModel(alias, messages, opts = {}) {
  const { name, provider } = resolveModel(alias);

  const body = {
    model: name,
    messages,
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.max_tokens ?? 2000,
  };
  if (opts.json) body.response_format = { type: "json_object" };

  const start = Date.now();
  const resp = await fetch(provider.baseUrl + "/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + provider.apiKey },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(alias + " 调用失败: " + resp.status + " " + text.slice(0, 300));
  const data = JSON.parse(text);
  return {
    text: data.choices?.[0]?.message?.content || "",
    model: data.model || name,
    ms: Date.now() - start,
    cost: COST_RANK[data.model] || 2,
  };
}

module.exports = { PROVIDERS, resolveModel, callModel, COST_RANK, listModels };
