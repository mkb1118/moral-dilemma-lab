// strategies.js - 5 种编排策略
const { callModel } = require("./providers");

// 根据问题内容自动路由到合适模型
function routerKey(prompt) {
  const p = prompt.toLowerCase();
  if (/(css|样式|布局|ui|界面|前端|html|动画|响应式)/.test(p)) return "gpt-pro";
  if (/(数据库|schema|prisma|postgres|表|sql|索引)/.test(p)) return "deepseek-pro";
  if (/(小程序|wxml|wxss|微信)/.test(p)) return "gpt-pro";
  if (/(测试|debug|报错|error|lint|冒烟)/.test(p)) return "deepseek-fast";
  if (/(量表|题目|评分|算法|心理学|解读|文案)/.test(p)) return "deepseek-pro";
  if (/(架构|设计|规划|方案|review|评审)/.test(p)) return "deepseek-pro";
  return "deepseek-pro";
}

function buildMessages(prompt, system) {
  return [
    { role: "system", content: system || "你是资深全栈工程师，回答简洁、直接、可执行，涉及代码时给出完整代码块。" },
    { role: "user", content: prompt },
  ];
}

async function runRouter(prompt, system) {
  const model = routerKey(prompt);
  const r = await callModel(model, buildMessages(prompt, system));
  return { steps: [{ label: "router", model: model + " → " + r.model }], answer: r.text, total_cost_rank: r.cost };
}

async function runPipeline(prompt, system) {
  const steps = [];
  const draft = await callModel("deepseek-chat", buildMessages(prompt, system), { max_tokens: 2500 });
  steps.push({ label: "draft", model: "deepseek-chat → " + draft.model });
  let review;
  try {
    review = await callModel("gpt-4o", [
      { role: "system", content: "你是代码审查专家。下面的回答可能有问题，请检查、修正错误并输出最终版本。只输出最终内容。" },
      { role: "user", content: "原始问题: " + prompt + "\n\n初稿: " + draft.text },
    ], { max_tokens: 3000 });
    steps.push({ label: "review", model: "gpt-4o → " + review.model });
  } catch (e) {
    try {
      review = await callModel("deepseek-pro", [
        { role: "system", content: "你是代码审查专家。下面的回答可能有问题，请检查、修正错误并输出最终版本。只输出最终内容。" },
        { role: "user", content: "原始问题: " + prompt + "\n\n初稿: " + draft.text },
      ], { max_tokens: 3000 });
      steps.push({ label: "review", model: "deepseek-pro → " + review.model + " (降级)" });
    } catch (e2) {
      steps.push({ label: "review", model: "fallback", error: e2.message });
      return { steps, answer: draft.text, total_cost_rank: draft.cost, degraded: true };
    }
  }
  return { steps, answer: review.text, total_cost_rank: draft.cost + review.cost };
}

async function runDebate(prompt, system) {
  const steps = [];
  const [a, b] = await Promise.all([
    callModel("gpt-4o-mini", buildMessages(prompt, system), { max_tokens: 1500 }),
    callModel("deepseek-chat", buildMessages(prompt, system), { max_tokens: 1500 }),
  ]);
  steps.push({ label: "side-a", model: "gpt-4o-mini → " + a.model });
  steps.push({ label: "side-b", model: "deepseek-chat → " + b.model });
  let verdict;
  try {
    verdict = await callModel("gpt-4o", [
      { role: "system", content: "你是评审委员会主席。两个模型对同一问题给出了回答，请综合双方优点、指出错误，输出一份更好的最终答案。" },
      { role: "user", content: "问题: " + prompt + "\n\n模型A: " + a.text + "\n\n模型B: " + b.text },
    ], { max_tokens: 2500 });
    steps.push({ label: "verdict", model: "gpt-4o → " + verdict.model });
    return { steps, answer: verdict.text, total_cost_rank: a.cost + b.cost + verdict.cost };
  } catch (e) {
    try {
      verdict = await callModel("deepseek-pro", [
        { role: "system", content: "你是评审委员会主席。两个模型对同一问题给出了回答，请综合双方优点、指出错误，输出一份更好的最终答案。" },
        { role: "user", content: "问题: " + prompt + "\n\n模型A: " + a.text + "\n\n模型B: " + b.text },
      ], { max_tokens: 2500 });
      steps.push({ label: "verdict", model: "deepseek-pro → " + verdict.model + " (降级)" });
      return { steps, answer: verdict.text, total_cost_rank: a.cost + b.cost + verdict.cost };
    } catch (e2) {
      steps.push({ label: "verdict", model: "fallback", error: e2.message });
      return { steps, answer: "【模型A】\n" + a.text + "\n\n【模型B】\n" + b.text, total_cost_rank: a.cost + b.cost, degraded: true };
    }
  }
}

async function runCascade(prompt, system) {
  const steps = [];
  const cheap = await callModel("deepseek-chat", buildMessages(prompt, system), { max_tokens: 2000 });
  steps.push({ label: "cheap", model: "deepseek-chat → " + cheap.model });
  // 自评：答案是否足够
  let judge, pass = false;
  try {
    judge = await callModel("gpt-4o-mini", [
      { role: "system", content: "你是质量检查器。判断回答是否完整、准确、可执行。只输出 JSON: {\"pass\": true/false, \"reason\": \"一句话\"}" },
      { role: "user", content: "问题: " + prompt + "\n\n回答: " + cheap.text },
    ], { json: true, max_tokens: 200 });
    try { pass = JSON.parse(judge.text).pass === true; } catch (e) { pass = false; }
    steps.push({ label: "judge", model: "gpt-4o-mini → " + judge.model, pass });
  } catch (e) {
    steps.push({ label: "judge", model: "fallback", error: e.message, pass: false });
  }
  if (pass) {
    return { steps, answer: cheap.text, total_cost_rank: cheap.cost + (judge ? judge.cost : 0), cascaded: false };
  }
  let strong;
  try {
    strong = await callModel("gpt-4o", buildMessages(prompt, system), { max_tokens: 3000 });
    steps.push({ label: "escalate", model: "gpt-4o → " + strong.model });
  } catch (e) {
    try {
      strong = await callModel("deepseek-pro", buildMessages(prompt, system), { max_tokens: 3000 });
      steps.push({ label: "escalate", model: "deepseek-pro → " + strong.model + " (降级)" });
    } catch (e2) {
      steps.push({ label: "escalate", model: "fallback", error: e2.message });
      return { steps, answer: cheap.text, total_cost_rank: cheap.cost + (judge ? judge.cost : 0), cascaded: false, degraded: true };
    }
  }
  return { steps, answer: strong.text, total_cost_rank: cheap.cost + (judge ? judge.cost : 0) + strong.cost, cascaded: true };
}

async function runParallel(prompt, system) {
  const steps = [];
  const [a, b] = await Promise.all([
    callModel("deepseek-chat", buildMessages(prompt, system), { max_tokens: 2000 }),
    callModel("gpt-4o-mini", buildMessages(prompt, system), { max_tokens: 2000 }),
  ]);
  steps.push({ label: "parallel-a", model: "deepseek-chat → " + a.model });
  steps.push({ label: "parallel-b", model: "gpt-4o-mini → " + b.model });
  // 择优：返回更长的（通常更完整）
  const winner = a.text.length >= b.text.length ? a : b;
  const loser = winner === a ? b : a;
  steps.push({ label: "select", model: "local", detail: "选择 " + (winner === a ? "deepseek" : "gpt") });
  return {
    steps,
    answer: "【胜出回答】\n" + winner.text + "\n\n【备选回答】\n" + loser.text,
    total_cost_rank: a.cost + b.cost,
    winner: winner === a ? "deepseek" : "gpt",
  };
}

module.exports = {
  routerKey,
  runRouter,
  runPipeline,
  runDebate,
  runCascade,
  runParallel,
};
