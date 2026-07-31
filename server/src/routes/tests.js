const express = require("express");
const fs = require("fs");
const path = require("path");
const prisma = require("../lib/prisma");

const router = express.Router();

// 测试类型元信息（后续可迁移到数据库 TestType 表）
const TEST_META = {
  "big-five": { name: "大五人格评测", modes: ["lite", "pro"] },
  "cognitive-bias": { name: "认知偏差检测", modes: ["standard"] },
  "decision-style": { name: "决策风格分析", modes: ["standard"] },
  'eq-assessment': { name: "情绪智力评估", modes: ["lite", "pro"] },
  'moral-dilemma-lab': { name: "道德困境实验室", modes: ["lite", "pro"] },
  "values-sort": { name: "核心价值观排序", modes: ["standard"] },
};

function loadData(testDir, file) {
  const p = path.join("E:/my project", testDir, "data", file);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

// 列出所有测试
router.get("/", async (req, res) => {
  try {
    const list = Object.entries(TEST_META).map(([id, meta]) => ({
      id,
      ...meta,
    }));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 获取某测试的题目
router.get("/:type", async (req, res) => {
  try {
    const type = req.params.type;
    const meta = TEST_META[type];
    if (!meta) return res.status(404).json({ error: "未知测试类型" });

    const dataByType = {
      "big-five": {
        questions: loadData("big-five", "all-questions.json"),
        proExtra: loadData("big-five", "pro-extra.json"),
        lightIndices: loadData("big-five", "light-indices.json"),
      },
      "cognitive-bias": {
        scenarios: loadData("cognitive-bias", "scenarios.json"),
        biasInfo: loadData("cognitive-bias", "bias-info.json"),
      },
      "decision-style": {
        questions: loadData("decision-style", "questions.json"),
      },
      'eq-assessment': {
        baseQuestions: loadData("eq-assessment", "base-questions.json"),
        proQuestions: loadData("eq-assessment", "pro-questions.json"),
        dimInfo: loadData("eq-assessment", "dim-info.json"),
      },
      'moral-dilemma-lab': {
        dilemmas: loadData("moral-dilemma-lab", "dilemmas.json"),
        archetypes: loadData("moral-dilemma-lab", "archetypes.json"),
      },
      "values-sort": {
        values: loadData("values-sort", "values.json"),
      },
    };

    res.json({ id: type, ...meta, data: dataByType[type] || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
