const express = require("express");
const fs = require("fs");
const path = require("path");
const prisma = require("../lib/prisma");

const router = express.Router();

// 数据根目录：默认项目根（各测试目录的 data/ 为唯一数据源）
const ROOT = path.resolve(__dirname, "..", "..", "..");
const DATA_DIR = process.env.DATA_DIR || ROOT;

// 每个测试类型 -> 数据字段名 -> data 文件名（唯一数据源，与前端 fetch 同一份文件）
const TEST_DATA_FILES = {
  "big-five": {
    questions: "all-questions.json",
    proExtra: "pro-extra.json",
    lightIndices: "light-indices.json",
  },
  "cognitive-bias": { scenarios: "scenarios.json", biasInfo: "bias-info.json" },
  "decision-style": { questions: "questions.json" },
  "eq-assessment": {
    baseQuestions: "base-questions.json",
    proQuestions: "pro-questions.json",
    dimInfo: "dim-info.json",
  },
  "moral-dilemma-lab": { dilemmas: "dilemmas.json", archetypes: "archetypes.json" },
  "values-sort": { values: "values.json" },
};

function loadData(testDir, file) {
  const p = path.join(DATA_DIR, testDir, "data", file);
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return null;
  }
}

// 元数据列表内存缓存（TTL 60s）
let metaCache = null;
let metaCacheAt = 0;
const META_TTL = 60 * 1000;

async function getMetaList() {
  const now = Date.now();
  if (metaCache && now - metaCacheAt < META_TTL) return metaCache;
  const rows = await prisma.testType.findMany({ orderBy: { id: "asc" } });
  metaCache = rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    modes: r.modes,
  }));
  metaCacheAt = now;
  return metaCache;
}

// 列出所有测试（元数据唯一来源 = 数据库 TestType）
router.get("/", async (req, res, next) => {
  try {
    res.json(await getMetaList());
  } catch (e) {
    next(e);
  }
});

// 获取某测试的题目（读共享 data/*.json，与前端同源）
router.get("/:type", async (req, res, next) => {
  try {
    const type = req.params.type;
    const files = TEST_DATA_FILES[type];
    if (!files) return res.status(404).json({ error: "未知测试类型" });

    const meta = await prisma.testType.findUnique({ where: { id: type } });
    if (!meta) return res.status(404).json({ error: "未知测试类型" });

    const data = {};
    for (const [key, file] of Object.entries(files)) {
      data[key] = loadData(type, file);
    }

    res.json({
      id: meta.id,
      name: meta.name,
      description: meta.description,
      modes: meta.modes,
      data,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
