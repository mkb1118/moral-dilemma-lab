const pptxgen = require("pptxgenjs");

// ============================================================
// Helper: create a title slide
// ============================================================
function addTitleSlide(pres, title, subtitle, bgColor) {
  const slide = pres.addSlide();
  slide.background = { color: bgColor };

  // Decorative top accent bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06,
    fill: { color: "FFFFFF", transparency: 50 }
  });

  // Title
  slide.addText(title, {
    x: 0.8, y: 1.5, w: 8.4, h: 1.5,
    fontSize: 40, fontFace: "Arial Black", color: "FFFFFF",
    bold: true, align: "left", valign: "middle", margin: 0
  });

  // Separator line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 3.1, w: 2.0, h: 0.04,
    fill: { color: "FFFFFF", transparency: 30 }
  });

  // Subtitle
  slide.addText(subtitle, {
    x: 0.8, y: 3.3, w: 8.4, h: 0.6,
    fontSize: 18, fontFace: "Calibri", color: "FFFFFF",
    align: "left", valign: "top", margin: 0
  });

  // Bottom decorative bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.3, w: 10, h: 0.325,
    fill: { color: "FFFFFF", transparency: 70 }
  });

  return slide;
}

// ============================================================
// Helper: content slide with left accent bar
// ============================================================
function addContentSlide(pres, title, placeholderText, bgColor, accentColor) {
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };

  // Left accent bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.08, h: 5.625,
    fill: { color: accentColor }
  });

  // Top bar with title
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.1,
    fill: { color: bgColor }
  });

  slide.addText(title, {
    x: 0.6, y: 0.2, w: 8.8, h: 0.7,
    fontSize: 28, fontFace: "Arial Black", color: "FFFFFF",
    bold: true, align: "left", valign: "middle", margin: 0
  });

  // Content placeholder
  slide.addText(placeholderText, {
    x: 0.8, y: 1.5, w: 8.4, h: 3.5,
    fontSize: 16, fontFace: "Calibri", color: "666666",
    align: "left", valign: "top", margin: 0
  });

  // Page number area
  slide.addText("", {
    x: 8.5, y: 5.15, w: 1.2, h: 0.35,
    fontSize: 10, fontFace: "Calibri", color: "999999",
    align: "right", margin: 0
  });

  return slide;
}

// ============================================================
// Helper: end slide
// ============================================================
function addEndSlide(pres, text, bgColor) {
  const slide = pres.addSlide();
  slide.background = { color: bgColor };

  slide.addText(text, {
    x: 1, y: 1.8, w: 8, h: 1.2,
    fontSize: 36, fontFace: "Arial Black", color: "FFFFFF",
    bold: true, align: "center", valign: "middle", margin: 0
  });

  slide.addText("感谢聆听", {
    x: 1, y: 3.0, w: 8, h: 0.8,
    fontSize: 20, fontFace: "Calibri", color: "FFFFFF",
    align: "center", valign: "top", margin: 0
  });

  return slide;
}

// ============================================================
// TEMPLATE 1: 年终工作总结 (Midnight Executive)
// ============================================================
function createTemplate1() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "PPT模板";
  pres.title = "年终工作总结模板";

  const bg = "1E2761";
  const accent = "CADCFC";

  addTitleSlide(pres, "2025年度工作总结", "部门 / 姓名 / 日期", bg);

  addContentSlide(pres, "目录 CONTENTS", [
    { text: "01  年度工作概述", options: { breakLine: true, fontSize: 20, color: "333333", bold: true } },
    { text: "     在此输入年度工作概况简介", options: { breakLine: true, fontSize: 14, color: "999999" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "02  核心项目成果", options: { breakLine: true, fontSize: 20, color: "333333", bold: true } },
    { text: "     在此输入核心项目成果简介", options: { breakLine: true, fontSize: 14, color: "999999" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "03  数据分析与洞察", options: { breakLine: true, fontSize: 20, color: "333333", bold: true } },
    { text: "     在此输入数据分析简介", options: { breakLine: true, fontSize: 14, color: "999999" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "04  问题与反思", options: { breakLine: true, fontSize: 20, color: "333333", bold: true } },
    { text: "     在此输入问题反思简介", options: { breakLine: true, fontSize: 14, color: "999999" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "05  明年工作计划", options: { breakLine: true, fontSize: 20, color: "333333", bold: true } },
    { text: "     在此输入明年计划简介", options: { breakLine: true, fontSize: 14, color: "999999" } }
  ], bg, accent);

  addContentSlide(pres, "01  年度工作概述", [
    { text: "在此输入年度工作概述内容", options: { breakLine: true, fontSize: 16, color: "666666" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "• 关键指标1：在此输入具体数据和达成情况", options: { bullet: true, breakLine: true, fontSize: 15, color: "444444" } },
    { text: "• 关键指标2：在此输入具体数据和达成情况", options: { bullet: true, breakLine: true, fontSize: 15, color: "444444" } },
    { text: "• 关键指标3：在此输入具体数据和达成情况", options: { bullet: true, breakLine: true, fontSize: 15, color: "444444" } },
    { text: "• 关键指标4：在此输入具体数据和达成情况", options: { bullet: true, fontSize: 15, color: "444444" } }
  ], bg, accent);

  addContentSlide(pres, "02  核心项目成果", [
    { text: "项目一：在此输入项目名称", options: { breakLine: true, fontSize: 18, color: "1E2761", bold: true } },
    { text: "在此输入项目背景、目标、执行过程和最终成果。突出你的贡献和项目价值。", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "项目二：在此输入项目名称", options: { breakLine: true, fontSize: 18, color: "1E2761", bold: true } },
    { text: "在此输入项目背景、目标、执行过程和最终成果。突出你的贡献和项目价值。", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "项目三：在此输入项目名称", options: { breakLine: true, fontSize: 18, color: "1E2761", bold: true } },
    { text: "在此输入项目背景、目标、执行过程和最终成果。突出你的贡献和项目价值。", options: { fontSize: 14, color: "555555" } }
  ], bg, accent);

  addContentSlide(pres, "03  数据分析与洞察", [
    { text: "在此插入数据分析图表和关键洞察", options: { breakLine: true, fontSize: 16, color: "666666" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "▌ 趋势发现", options: { breakLine: true, fontSize: 18, color: "1E2761", bold: true } },
    { text: "在此描述从数据中发现的重要趋势和变化规律", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 对比分析", options: { breakLine: true, fontSize: 18, color: "1E2761", bold: true } },
    { text: "在此对比去年同期或行业平均水平的数据表现", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 核心结论", options: { breakLine: true, fontSize: 18, color: "1E2761", bold: true } },
    { text: "在此总结数据分析得出的3-5条核心结论", options: { fontSize: 14, color: "555555" } }
  ], bg, accent);

  addContentSlide(pres, "04  问题与反思", [
    { text: "在此输入工作中遇到的问题和反思", options: { breakLine: true, fontSize: 16, color: "666666" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "问题1：在此描述具体问题", options: { breakLine: true, fontSize: 15, color: "444444" } },
    { text: "    原因分析：在此分析问题根源", options: { breakLine: true, fontSize: 13, color: "888888" } },
    { text: "    改进措施：在此输入改进方案", options: { breakLine: true, fontSize: 13, color: "888888" } },
    { text: "", options: { breakLine: true, fontSize: 6 } },
    { text: "问题2：在此描述具体问题", options: { breakLine: true, fontSize: 15, color: "444444" } },
    { text: "    原因分析：在此分析问题根源", options: { breakLine: true, fontSize: 13, color: "888888" } },
    { text: "    改进措施：在此输入改进方案", options: { breakLine: true, fontSize: 13, color: "888888" } },
    { text: "", options: { breakLine: true, fontSize: 6 } },
    { text: "问题3：在此描述具体问题", options: { breakLine: true, fontSize: 15, color: "444444" } },
    { text: "    原因分析：在此分析问题根源", options: { breakLine: true, fontSize: 13, color: "888888" } },
    { text: "    改进措施：在此输入改进方案", options: { fontSize: 13, color: "888888" } }
  ], bg, accent);

  addContentSlide(pres, "05  明年工作计划", [
    { text: "在此输入明年的工作目标和具体计划", options: { breakLine: true, fontSize: 16, color: "666666" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "Q1 目标", options: { breakLine: true, fontSize: 18, color: "1E2761", bold: true } },
    { text: "• 在此输入第一季度具体目标和关键行动项", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "Q2 目标", options: { breakLine: true, fontSize: 18, color: "1E2761", bold: true } },
    { text: "• 在此输入第二季度具体目标和关键行动项", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "Q3-Q4 目标", options: { breakLine: true, fontSize: 18, color: "1E2761", bold: true } },
    { text: "• 在此输入下半年具体目标和关键行动项", options: { bullet: true, fontSize: 14, color: "555555" } }
  ], bg, accent);

  addEndSlide(pres, "谢谢", bg);

  pres.writeFile({ fileName: "E:/我的桌面/闲鱼产品/PPT模板/年终工作总结模板.pptx" });
  console.log("Template 1 done: 年终工作总结模板.pptx");
}

// ============================================================
// TEMPLATE 2: 述职报告 (Teal Trust)
// ============================================================
function createTemplate2() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "PPT模板";
  pres.title = "述职报告模板";

  const bg = "028090";
  const accent = "00A896";

  addTitleSlide(pres, "述职报告", "述职人 / 岗位 / 日期", bg);

  addContentSlide(pres, "个人简介", [
    { text: "在此输入个人基本信息和工作履历", options: { breakLine: true, fontSize: 16, color: "666666" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "▌ 基本信息", options: { breakLine: true, fontSize: 18, color: "028090", bold: true } },
    { text: "姓名：XXX    岗位：XXX    入职时间：XXXX年XX月", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 工作职责", options: { breakLine: true, fontSize: 18, color: "028090", bold: true } },
    { text: "在此描述你的主要工作职责和负责的业务范围", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 核心能力", options: { breakLine: true, fontSize: 18, color: "028090", bold: true } },
    { text: "• 能力1：在此描述", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 能力2：在此描述", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 能力3：在此描述", options: { bullet: true, fontSize: 14, color: "555555" } }
  ], bg, accent);

  addContentSlide(pres, "业绩回顾", [
    { text: "在此输入考核期内的核心业绩成果", options: { breakLine: true, fontSize: 16, color: "666666" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "KPI 达成情况", options: { breakLine: true, fontSize: 18, color: "028090", bold: true } },
    { text: "• 指标1：目标值 XX / 实际值 XX / 达成率 XX%", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 指标2：目标值 XX / 实际值 XX / 达成率 XX%", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 指标3：目标值 XX / 实际值 XX / 达成率 XX%", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "重点工作亮点", options: { breakLine: true, fontSize: 18, color: "028090", bold: true } },
    { text: "1. 在此描述重点工作亮点一", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "2. 在此描述重点工作亮点二", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "3. 在此描述重点工作亮点三", options: { fontSize: 14, color: "555555" } }
  ], bg, accent);

  addContentSlide(pres, "问题与反思", [
    { text: "在此输入工作中存在的问题和个人反思", options: { breakLine: true, fontSize: 16, color: "666666" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "▌ 不足之处", options: { breakLine: true, fontSize: 18, color: "028090", bold: true } },
    { text: "在此客观分析自己在工作中的不足和需要改进的地方", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 遇到的挑战", options: { breakLine: true, fontSize: 18, color: "028090", bold: true } },
    { text: "在此描述工作中遇到的困难和挑战，以及应对方式", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 经验教训", options: { breakLine: true, fontSize: 18, color: "028090", bold: true } },
    { text: "在此总结从中获得的经验教训和成长感悟", options: { fontSize: 14, color: "555555" } }
  ], bg, accent);

  addContentSlide(pres, "未来规划", [
    { text: "在此输入未来的职业发展规划和工作目标", options: { breakLine: true, fontSize: 16, color: "666666" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "▌ 短期目标（3-6个月）", options: { breakLine: true, fontSize: 18, color: "028090", bold: true } },
    { text: "• 目标1：在此描述", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 目标2：在此描述", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 长期目标（1-2年）", options: { breakLine: true, fontSize: 18, color: "028090", bold: true } },
    { text: "• 目标1：在此描述", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 目标2：在此描述", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 需要的支持", options: { breakLine: true, fontSize: 18, color: "028090", bold: true } },
    { text: "在此说明需要公司/领导提供的资源和支持", options: { fontSize: 14, color: "555555" } }
  ], bg, accent);

  addEndSlide(pres, "感谢聆听", bg);

  pres.writeFile({ fileName: "E:/我的桌面/闲鱼产品/PPT模板/述职报告模板.pptx" });
  console.log("Template 2 done: 述职报告模板.pptx");
}

// ============================================================
// TEMPLATE 3: 商业计划书 (Charcoal Minimal)
// ============================================================
function createTemplate3() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "PPT模板";
  pres.title = "商业计划书模板";

  const bg = "36454F";
  const accent = "212121";

  addTitleSlide(pres, "商业计划书", "项目名称 / 团队名称 / 日期", bg);

  addContentSlide(pres, "项目概述", [
    { text: "在此输入项目的核心概述内容", options: { breakLine: true, fontSize: 16, color: "666666" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "▌ 我们是谁", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "在此用1-2句话介绍公司和团队的核心定位", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 解决什么问题", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "在此描述目标用户的核心痛点和未被满足的需求", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 怎么解决", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "在此描述你的解决方案和核心差异化优势", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 为什么是我们", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "在此说明团队的核心竞争力和护城河", options: { fontSize: 14, color: "555555" } }
  ], bg, accent);

  addContentSlide(pres, "市场分析", [
    { text: "在此输入市场分析的核心数据和结论", options: { breakLine: true, fontSize: 16, color: "666666" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "▌ 市场规模", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "• 总市场规模（TAM）：在此输入数字和来源", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 可服务市场（SAM）：在此输入数字和来源", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 目标市场（SOM）：在此输入数字和来源", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 竞争格局", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "在此分析主要竞争对手及其优劣势对比", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 目标用户画像", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "在此描述目标用户的年龄、职业、消费习惯、核心需求等特征", options: { fontSize: 14, color: "555555" } }
  ], bg, accent);

  addContentSlide(pres, "商业模式", [
    { text: "在此输入商业模式的核心要素", options: { breakLine: true, fontSize: 16, color: "666666" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "▌ 收入来源", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "• 收入来源1：在此描述具体的收费方式和定价策略", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 收入来源2：在此描述具体的收费方式和定价策略", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 收入来源3：在此描述具体的收费方式和定价策略", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 成本结构", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "• 固定成本：在此列出人力、办公等固定开支", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 变动成本：在此列出获客、服务器等变动开支", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 关键指标", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "CAC（获客成本）= XX元    LTV（用户终身价值）= XX元    LTV/CAC = XX", options: { fontSize: 14, color: "555555" } }
  ], bg, accent);

  addContentSlide(pres, "财务预测", [
    { text: "在此插入财务预测表格和关键假设", options: { breakLine: true, fontSize: 16, color: "666666" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "▌ 收入预测（三年）", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "• 第一年：预计收入 XX 万元，用户数 XX", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 第二年：预计收入 XX 万元，用户数 XX", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 第三年：预计收入 XX 万元，用户数 XX", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 成本预测", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "在此列出各年度主要成本项目和金额", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 融资需求", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "计划融资金额：XX 万元    资金用途：XX%用于XX，XX%用于XX    预计回报周期：XX个月", options: { fontSize: 14, color: "555555" } }
  ], bg, accent);

  addContentSlide(pres, "团队介绍", [
    { text: "在此输入核心团队成员信息", options: { breakLine: true, fontSize: 16, color: "666666" } },
    { text: "", options: { breakLine: true, fontSize: 10 } },
    { text: "▌ 创始人/CEO", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "姓名：XXX    背景：在此描述教育背景和过往经历", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "核心能力：在此描述", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 联合创始人/CTO", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "姓名：XXX    背景：在此描述技术背景和过往经历", options: { breakLine: true, fontSize: 14, color: "555555" } },
    { text: "", options: { breakLine: true, fontSize: 8 } },
    { text: "▌ 核心成员", options: { breakLine: true, fontSize: 18, color: "36454F", bold: true } },
    { text: "• 成员1：岗位/背景/核心能力", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 成员2：岗位/背景/核心能力", options: { bullet: true, breakLine: true, fontSize: 14, color: "555555" } },
    { text: "• 成员3：岗位/背景/核心能力", options: { bullet: true, fontSize: 14, color: "555555" } }
  ], bg, accent);

  addEndSlide(pres, "感谢聆听", bg);

  pres.writeFile({ fileName: "E:/我的桌面/闲鱼产品/PPT模板/商业计划书模板.pptx" });
  console.log("Template 3 done: 商业计划书模板.pptx");
}

// ============================================================
// Generate all templates
// ============================================================
async function main() {
  try {
    createTemplate1();
    console.log("✅ 年终工作总结模板 已生成");
  } catch (e) {
    console.error("❌ Template 1 failed:", e.message);
  }

  try {
    createTemplate2();
    console.log("✅ 述职报告模板 已生成");
  } catch (e) {
    console.error("❌ Template 2 failed:", e.message);
  }

  try {
    createTemplate3();
    console.log("✅ 商业计划书模板 已生成");
  } catch (e) {
    console.error("❌ Template 3 failed:", e.message);
  }

  console.log("\n全部PPT模板已保存到：E:\\我的桌面\\闲鱼产品\\PPT模板\\");
}

main();
