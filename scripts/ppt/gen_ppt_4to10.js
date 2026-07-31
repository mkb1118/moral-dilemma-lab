const pptxgen = require("pptxgenjs");

function titleSlide(pres, title, sub, bg) {
  const s = pres.addSlide(); s.background = { color: bg };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: "FFFFFF", transparency: 50 } });
  s.addText(title, { x: 0.8, y: 1.6, w: 8.4, h: 1.4, fontSize: 40, fontFace: "Arial Black", color: "FFFFFF", bold: true, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.1, w: 2, h: 0.04, fill: { color: "FFFFFF", transparency: 30 } });
  s.addText(sub, { x: 0.8, y: 3.3, w: 8.4, h: 0.5, fontSize: 17, fontFace: "Calibri", color: "FFFFFF" });
}

function contentSlide(pres, title, items, bg, accent) {
  const s = pres.addSlide(); s.background = { color: "FFFFFF" };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.08, h: 5.625, fill: { color: accent } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 1.1, fill: { color: bg } });
  s.addText(title, { x: 0.6, y: 0.2, w: 8.8, h: 0.7, fontSize: 28, fontFace: "Arial Black", color: "FFFFFF", bold: true, margin: 0 });
  if (items && items.length) {
    const richItems = items.map(i => typeof i === 'string' ? { text: i, options: {} } : i);
    s.addText(richItems, { x: 0.8, y: 1.5, w: 8.4, h: 3.5, fontSize: 15, fontFace: "Calibri", color: "555555", margin: 0 });
  }
}

function endSlide(pres, bg) {
  const s = pres.addSlide(); s.background = { color: bg };
  s.addText("感谢聆听", { x: 1, y: 2.2, w: 8, h: 1.2, fontSize: 36, fontFace: "Arial Black", color: "FFFFFF", bold: true, align: "center", margin: 0 });
}

const templates = [
  { name: "项目汇报", bg: "0F3460", accent: "00B4D8", sub: "项目名称 / 汇报人 / 日期",
    items: [
      "▌ 项目概述", "在此描述项目背景、目标和范围", "",
      "▌ 进度与里程碑", "• 里程碑1：已完成 - 日期", "• 里程碑2：进行中 - 预期完成日期", "• 里程碑3：待启动 - 计划日期", "",
      "▌ 资源与风险", "• 人力资源：XX人团队", "• 预算使用：已用XX% / 总计XX万", "• 主要风险：在此列出并说明应对措施", "",
      "▌ 下一步计划", "• 本周重点：在此列出", "• 下月规划：在此列出"
    ]
  },
  { name: "季度复盘", bg: "C2410C", accent: "FB923C", sub: "2025年Q3复盘 / 部门 / 日期",
    items: [
      "▌ Q3目标回顾", "• 目标1：完成率XX%", "• 目标2：完成率XX%", "• 目标3：完成率XX%", "",
      "▌ 亮点与不足", "亮点：在此描述本季度做得好的地方", "不足：在此描述需要改进的地方", "",
      "▌ 关键数据", "• 核心指标1：XX (+XX% 环比)", "• 核心指标2：XX (+XX% 环比)", "• 核心指标3：XX (-XX% 环比)", "",
      "▌ Q4行动计划", "• 重点1：在此列出", "• 重点2：在此列出"
    ]
  },
  { name: "数据分析报告", bg: "334155", accent: "94A3B8", sub: "报告主题 / 数据周期 / 日期",
    items: [
      "▌ 数据概览", "在此输入整体数据情况概述和关键发现", "",
      "▌ 核心指标趋势", "• 指标A：当前值 XX / 环比 +XX% / 同比 +XX%", "• 指标B：当前值 XX / 环比 -XX% / 同比 +XX%", "• 指标C：当前值 XX / 环比 +XX% / 同比 -XX%", "",
      "▌ 用户行为分析", "• 新增用户：XX / 留存率：XX%", "• 活跃用户：DAU XX / MAU XX", "• 转化漏斗：曝光→点击 XX% / 点击→转化 XX%", "",
      "▌ 结论与建议", "1. 在此列出核心结论", "2. 在此列出改进建议"
    ]
  },
  { name: "月度工作总结", bg: "78716C", accent: "D6D3D1", sub: "2025年7月 / 部门 / 姓名",
    items: [
      "▌ 本月完成", "• 任务1：完成情况", "• 任务2：完成情况", "• 任务3：完成情况", "",
      "▌ 数据回顾", "• KPI达成率：XX%", "• 重点项目进度：XX%", "",
      "▌ 问题与解决", "• 遇到问题：在此描述", "• 解决方式：在此描述", "",
      "▌ 下月计划", "• 重点1：在此列出", "• 重点2：在此列出"
    ]
  },
  { name: "团队成果展示", bg: "4C1D95", accent: "A78BFA", sub: "团队名称 / 展示周期 / 日期",
    items: [
      "▌ 团队概况", "团队规模：XX人 / 业务方向：XX / 成立时间：XXXX年", "",
      "▌ 核心成果", "🏆 成果1：在此描述具体成果和影响", "🏆 成果2：在此描述具体成果和影响", "🏆 成果3：在此描述具体成果和影响", "",
      "▌ 关键数据", "• 业务增长：+XX% / 用户满意度：XX分", "• 项目交付：XX个 / 平均周期：XX天", "",
      "▌ 团队建设", "• 新人培训：XX人 / 团建活动：XX次", "• 技术分享：XX场 / 外部交流：XX次"
    ]
  },
  { name: "年度回顾", bg: "1C1917", accent: "D97706", sub: "我的2025 / 姓名 / 日期",
    items: [
      "▌ 年度关键词", "在此用3-5个关键词概括你的2025年", "",
      "▌ 成长与收获", "• 技能提升：在此列出新掌握的技能", "• 认知突破：在此列出思维上的变化", "• 关键成就：在此列出最自豪的事", "",
      "▌ 遗憾与反思", "在此诚实面对未完成的目标和原因", "",
      "▌ 2026展望", "• 目标1：在此列出", "• 目标2：在此列出"
    ]
  },
  { name: "年度规划展望", bg: "064E3B", accent: "34D399", sub: "2026年度规划 / 部门 / 日期",
    items: [
      "▌ 年度目标", "• 目标1：在此列出（建议用SMART原则）", "• 目标2：在此列出", "• 目标3：在此列出", "",
      "▌ 关键策略", "• 策略1：在此描述实现目标的关键策略", "• 策略2：在此描述实现目标的关键策略", "",
      "▌ 资源需求", "• 人力：需要XX人 / 新增XX岗位", "• 预算：总计XX万 / Q1 XX万 Q2 XX万", "• 技术：需要XX系统/工具/平台", "",
      "▌ 里程碑时间线", "Q1: XX / Q2: XX / Q3: XX / Q4: XX"
    ]
  }
];

async function main() {
  for (const t of templates) {
    const pres = new pptxgen();
    pres.layout = "LAYOUT_16x9";
    pres.author = "PPT模板"; pres.title = t.name + "模板";
    titleSlide(pres, t.name, t.sub, t.bg);
    contentSlide(pres, "核心内容", t.items, t.bg, t.accent);
    contentSlide(pres, "详细分析", [
      { text: "▌ 在此插入详细分析内容", options: { breakLine: true, fontSize: 16, color: "666666" } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "此页面供您自由扩展内容。您可以：", options: { breakLine: true, color: "444444" } },
      { text: "• 插入数据图表和趋势分析", options: { bullet: true, breakLine: true } },
      { text: "• 添加案例研究或成功故事", options: { bullet: true, breakLine: true } },
      { text: "• 展开论述核心观点", options: { bullet: true, breakLine: true } },
      { text: "• 补充对比分析数据", options: { bullet: true, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "所有文字、颜色、图片均可自由编辑修改", options: { color: "888888", italic: true } }
    ], t.bg, t.accent);
    contentSlide(pres, "总结与行动", [
      { text: "▌ 核心结论", options: { breakLine: true, fontSize: 16, color: "666666" } },
      { text: "", options: { fontSize: 6, breakLine: true } },
      { text: "1. 在此输入第一点核心结论", options: { breakLine: true, fontSize: 15, color: "444444" } },
      { text: "2. 在此输入第二点核心结论", options: { breakLine: true, fontSize: 15, color: "444444" } },
      { text: "3. 在此输入第三点核心结论", options: { breakLine: true, fontSize: 15, color: "444444" } },
      { text: "", options: { fontSize: 10, breakLine: true } },
      { text: "▌ 下一步行动", options: { breakLine: true, fontSize: 16, color: t.accent, bold: true } },
      { text: "", options: { fontSize: 6, breakLine: true } },
      { text: "• 行动项1：负责人 / 截止日期", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
      { text: "• 行动项2：负责人 / 截止日期", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
      { text: "• 行动项3：负责人 / 截止日期", options: { bullet: true, fontSize: 14, color: "555555" } }
    ], t.bg, t.accent);
    endSlide(pres, t.bg);
    pres.writeFile({ fileName: `E:/我的桌面/闲鱼产品/PPT模板/${t.name}模板.pptx` });
    console.log(`✅ ${t.name}模板`);
  }
  console.log("\n全部生成完毕！");
}

main();
