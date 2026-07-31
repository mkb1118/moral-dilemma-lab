const pptxgen = require("pptxgenjs");

const DARK  = "1a1a2e";
const GOLD  = "d4a574";
const LT    = "e8e4e1";
const WHITE = "FFFFFF";
const CARD  = "252540";

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "PPT定制服务";
pres.title = "新消费品牌整合营销方案";

const makeShadow = () => ({ type: "outer", color: "000000", blur: 8, offset: 3, angle: 135, opacity: 0.3 });

// ============ Slide 1: 封面 ============
{
  const s = pres.addSlide();
  s.background = { color: DARK };
  // 金色细线装饰
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.04, fill: { color: GOLD } });
  // 左侧金色竖条
  s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 1.2, w: 0.05, h: 3.2, fill: { color: GOLD } });
  // 主标题
  s.addText("新消费品牌\n整合营销方案", {
    x: 1.1, y: 1.3, w: 7.5, h: 2.4,
    fontSize: 44, fontFace: "Arial Black", color: WHITE, bold: true,
    lineSpacingMultiple: 1.15, margin: 0
  });
  // 装饰分隔
  s.addShape(pres.shapes.RECTANGLE, { x: 1.1, y: 3.85, w: 1.6, h: 0.03, fill: { color: GOLD } });
  // 副标题
  s.addText("2025年度 · 品牌策略部", {
    x: 1.1, y: 4.05, w: 5, h: 0.45,
    fontSize: 16, fontFace: "Calibri", color: LT
  });
  // 底部装饰条
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.35, w: 10, h: 0.275, fill: { color: GOLD, transparency: 85 } });
  // 日期
  s.addText("2025年7月", { x: 7.5, y: 5.0, w: 2, h: 0.3, fontSize: 11, fontFace: "Calibri", color: LT, align: "right" });
}

// ============ Slide 2: 目录 ============
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.04, fill: { color: GOLD } });
  s.addText("CONTENTS", { x: 0.6, y: 0.3, w: 3, h: 0.6, fontSize: 26, fontFace: "Arial Black", color: DARK, bold: true, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.95, w: 1.2, h: 0.025, fill: { color: GOLD } });

  const chapters = [
    { n: "01", t: "市场洞察", d: "行业规模、消费趋势与增长机会" },
    { n: "02", t: "竞争格局", d: "头部品牌打法拆解与差异化定位" },
    { n: "03", t: "核心策略", d: "品牌定位、产品矩阵与渠道布局" },
    { n: "04", t: "执行路线图", d: "季度里程碑与关键交付节点" },
    { n: "05", t: "预算与预期", d: "投入产出测算与ROI预估" }
  ];
  chapters.forEach((c, i) => {
    const y = 1.4 + i * 0.78;
    s.addText(c.n, { x: 0.8, y: y, w: 0.7, h: 0.55, fontSize: 22, fontFace: "Arial Black", color: GOLD, bold: true, margin: 0 });
    s.addText(c.t, { x: 1.6, y: y, w: 2.5, h: 0.55, fontSize: 17, fontFace: "Calibri", color: DARK, bold: true, margin: 0 });
    s.addText(c.d, { x: 4.2, y: y, w: 5, h: 0.55, fontSize: 13, fontFace: "Calibri", color: "888888", margin: 0 });
    if (i < 4) s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: y + 0.62, w: 8.4, h: 0.008, fill: { color: "eeeeee" } });
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.35, w: 10, h: 0.275, fill: { color: DARK, transparency: 92 } });
}

// ============ Slide 3: 市场分析 ============
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.04, fill: { color: GOLD } });
  s.addText("市场洞察", { x: 0.6, y: 0.25, w: 3, h: 0.55, fontSize: 26, fontFace: "Arial Black", color: DARK, bold: true, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.85, w: 1.2, h: 0.025, fill: { color: GOLD } });

  // 左侧3个数据卡片
  const stats = [
    { n: "3.2万亿", l: "2025年新消费市场规模", c: "年复合增长率 18.7%" },
    { n: "67.4%", l: "Z世代消费占比", c: "较2023年提升 12.3pp" },
    { n: "4.2亿", l: "线上消费活跃用户", c: "日均使用时长 2.8h" }
  ];
  stats.forEach((st, i) => {
    const y = 1.2 + i * 1.3;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: y, w: 3.8, h: 1.1, fill: { color: CARD }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: y, w: 0.05, h: 1.1, fill: { color: GOLD } });
    s.addText(st.n, { x: 0.85, y: y + 0.08, w: 2.5, h: 0.55, fontSize: 30, fontFace: "Arial Black", color: GOLD, bold: true, margin: 0 });
    s.addText(st.l, { x: 0.85, y: y + 0.6, w: 3, h: 0.25, fontSize: 12, fontFace: "Calibri", color: LT, margin: 0 });
    s.addText(st.c, { x: 0.85, y: y + 0.82, w: 3, h: 0.2, fontSize: 10, fontFace: "Calibri", color: "999999", margin: 0 });
  });

  // 右侧分析文字
  s.addShape(pres.shapes.RECTANGLE, { x: 4.8, y: 1.2, w: 4.7, h: 3.9, fill: { color: "fafafa" }, shadow: makeShadow() });
  s.addText([
    { text: "消费趋势洞察", options: { bold: true, fontSize: 17, color: DARK, breakLine: true } },
    { text: "", options: { fontSize: 6, breakLine: true } },
    { text: "新消费品牌正经历从流量驱动向品牌驱动的关键转型期。2025年上半年数据显示，消费者决策因子中「品牌信任度」权重首次超过「价格优势」，达到42.3%。", options: { fontSize: 12, color: "555555", breakLine: true } },
    { text: "", options: { fontSize: 6, breakLine: true } },
    { text: "三大核心变量：", options: { bold: true, fontSize: 13, color: DARK, breakLine: true } },
    { text: "内容种草 → 信任建设 → 复购闭环", options: { fontSize: 12, color: GOLD, italic: true, breakLine: true } },
    { text: "", options: { fontSize: 6, breakLine: true } },
    { text: "• 社交电商GMV同比增长34%，其中短视频贡献62%", options: { fontSize: 11, color: "666666", breakLine: true } },
    { text: "• 私域运营成为标配，头部品牌私域贡献超25%营收", options: { fontSize: 11, color: "666666", breakLine: true } },
    { text: "• AI驱动的个性化推荐将转化率提升至传统方式的2.3倍", options: { fontSize: 11, color: "666666", breakLine: true } },
    { text: "• 下沉市场增速(23%)持续跑赢一二线(11%)", options: { fontSize: 11, color: "666666" } }
  ], { x: 5.1, y: 1.4, w: 4.2, h: 3.5, margin: 0 });
}

// ============ Slide 4: 竞品格局 ============
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.04, fill: { color: GOLD } });
  s.addText("竞争格局", { x: 0.6, y: 0.25, w: 3, h: 0.55, fontSize: 26, fontFace: "Arial Black", color: DARK, bold: true, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.85, w: 1.2, h: 0.025, fill: { color: GOLD } });

  const comps = [
    { name: "元气森林", adv: "品牌认知度行业第一，渠道覆盖超100万终端", dis: "新品成功率不足30%，研发投入占比过高" },
    { name: "花西子", adv: "东方美学定位精准，用户复购率达38%", dis: "品类单一，过度依赖李佳琦渠道" },
    { name: "三顿半", adv: "精品速溶品类开创者，社群运营出色", dis: "线下渗透率低，价格带天花板明显" },
    { name: "泡泡玛特", adv: "IP矩阵丰富，海外营收占比突破35%", dis: "用户增长放缓，盲盒监管政策风险" }
  ];
  const cardW = 4.1, cardH = 1.65, gapX = 0.35, gapY = 0.25;
  comps.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * (cardW + gapX), y = 1.15 + row * (cardH + gapY);
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: cardW, h: cardH, fill: { color: CARD }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: cardW, h: 0.04, fill: { color: GOLD } });
    s.addText(c.name, { x: x + 0.2, y: y + 0.18, w: 3, h: 0.4, fontSize: 18, fontFace: "Arial Black", color: WHITE, bold: true, margin: 0 });
    s.addText("优势：" + c.adv, { x: x + 0.2, y: y + 0.65, w: 3.7, h: 0.35, fontSize: 11, fontFace: "Calibri", color: LT, margin: 0 });
    s.addText("挑战：" + c.dis, { x: x + 0.2, y: y + 1.05, w: 3.7, h: 0.35, fontSize: 11, fontFace: "Calibri", color: "aaaaaa", margin: 0 });
  });

  s.addText("数据来源：公司财报、Euromonitor、公开信息整理，截至2025年6月", {
    x: 0.6, y: 5.05, w: 8, h: 0.25, fontSize: 9, fontFace: "Calibri", color: "bbbbbb", margin: 0 });
}

// ============ Slide 5: 核心策略（3列卡片） ============
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.04, fill: { color: GOLD } });
  s.addText("核心策略", { x: 0.6, y: 0.25, w: 3, h: 0.55, fontSize: 26, fontFace: "Arial Black", color: DARK, bold: true, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.85, w: 1.2, h: 0.025, fill: { color: GOLD } });

  const strats = [
    { icon: "01", title: "差异化定位", pts: ["聚焦「成分透明」细分赛道", "建立「可溯源」品牌心智", "定价中高端，避开价格战"] },
    { icon: "02", title: "全域渠道", pts: ["线上：抖音+小红书双引擎", "线下：精品超市+便利店CVS", "私域：企微+小程序复购体系"] },
    { icon: "03", title: "内容生态", pts: ["UGC种草+KOL矩阵传播", "品牌自播间日播8小时", "AI生成短视频高效铺量"] }
  ];
  strats.forEach((st, i) => {
    const x = 0.5 + i * 3.1;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.15, w: 2.85, h: 4.0, fill: { color: CARD }, shadow: makeShadow() });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.15, w: 2.85, h: 0.04, fill: { color: GOLD } });
    // 编号圆
    s.addShape(pres.shapes.OVAL, { x: x + 1.0, y: 1.45, w: 0.75, h: 0.75, fill: { color: GOLD } });
    s.addText(st.icon, { x: x + 1.0, y: 1.45, w: 0.75, h: 0.75, fontSize: 22, fontFace: "Arial Black", color: DARK, bold: true, align: "center", valign: "middle", margin: 0 });
    s.addText(st.title, { x: x + 0.2, y: 2.45, w: 2.4, h: 0.4, fontSize: 17, fontFace: "Arial Black", color: WHITE, bold: true, align: "center", margin: 0 });
    const bullets = st.pts.map((p, j) => ({
      text: p, options: { bullet: true, breakLine: j < 2, fontSize: 12, color: LT }
    }));
    s.addText(bullets, { x: x + 0.3, y: 3.0, w: 2.3, h: 1.8, margin: 0 });
  });
}

// ============ Slide 6: 执行路线图 ============
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.04, fill: { color: GOLD } });
  s.addText("执行路线图", { x: 0.6, y: 0.25, w: 3, h: 0.55, fontSize: 26, fontFace: "Arial Black", color: DARK, bold: true, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.85, w: 1.2, h: 0.025, fill: { color: GOLD } });

  // 横向时间线
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 3.1, w: 8.4, h: 0.03, fill: { color: GOLD } });

  const phases = [
    { q: "Q1", t: "品牌基建", items: ["品牌视觉体系搭建完成", "核心团队组建到位"],
      dotX: 1.6 },
    { q: "Q2", t: "渠道铺开", items: ["抖音+小红书双平台启动", "首批KOC合作50人矩阵"],
      dotX: 3.6 },
    { q: "Q3", t: "规模放量", items: ["日销突破10万GMV", "线下进入1000家门店"],
      dotX: 5.6 },
    { q: "Q4", t: "品牌升级", items: ["品牌联名跨界活动落地", "全年GMV目标达成冲刺"],
      dotX: 7.6 }
  ];
  phases.forEach((p) => {
    // 圆点
    s.addShape(pres.shapes.OVAL, { x: p.dotX - 0.14, y: 2.93, w: 0.28, h: 0.28, fill: { color: GOLD } });
    // 上方：季度标签
    s.addText(p.q, { x: p.dotX - 0.8, y: 1.3, w: 1.6, h: 0.45, fontSize: 28, fontFace: "Arial Black", color: GOLD, bold: true, align: "center", margin: 0 });
    s.addText(p.t, { x: p.dotX - 0.8, y: 1.75, w: 1.6, h: 0.35, fontSize: 14, fontFace: "Calibri", color: DARK, bold: true, align: "center", margin: 0 });
    s.addShape(pres.shapes.RECTANGLE, { x: p.dotX - 0.45, y: 2.2, w: 0.9, h: 0.025, fill: { color: GOLD } });
    // 下方：描述
    const items = p.items.map((t, j) => ({
      text: "→ " + t, options: { breakLine: j < p.items.length - 1, fontSize: 10, color: "888888" }
    }));
    s.addText(items, { x: p.dotX - 1.0, y: 3.4, w: 2.0, h: 0.9, align: "center", margin: 0 });
  });
}

// ============ Slide 7: 预算概览 ============
{
  const s = pres.addSlide();
  s.background = { color: WHITE };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.04, fill: { color: GOLD } });
  s.addText("预算概览", { x: 0.6, y: 0.25, w: 3, h: 0.55, fontSize: 26, fontFace: "Arial Black", color: DARK, bold: true, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.85, w: 1.2, h: 0.025, fill: { color: GOLD } });

  // 左侧饼图
  s.addChart(pres.charts.PIE, [{
    name: "预算",
    labels: ["内容营销", "渠道投放", "品牌建设", "团队运营", "技术平台"],
    values: [180, 250, 120, 150, 100]
  }], {
    x: 0.3, y: 1.1, w: 4.5, h: 4.0,
    showPercent: true, showLegend: true, legendPos: "b",
    chartColors: [GOLD, "c49a6c", "b3805d", "a0694e", DARK],
    dataLabelColor: WHITE, dataLabelFontSize: 10
  });

  // 右侧预算明细
  s.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: 1.15, w: 4.2, h: 3.9, fill: { color: CARD }, shadow: makeShadow() });
  s.addText("年度预算总额", { x: 5.6, y: 1.35, w: 3, h: 0.3, fontSize: 13, fontFace: "Calibri", color: LT, margin: 0 });
  s.addText("¥ 8,000,000", { x: 5.6, y: 1.65, w: 3, h: 0.5, fontSize: 32, fontFace: "Arial Black", color: GOLD, bold: true, margin: 0 });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.6, y: 2.3, w: 3.6, h: 0.012, fill: { color: "444444" } });

  const items = [
    { n: "内容营销", v: "180万", p: "22.5%", d: "KOL投放、短视频制作、UGC激励" },
    { n: "渠道投放", v: "250万", p: "31.3%", d: "抖音千川+小红书聚光+信息流" },
    { n: "品牌建设", v: "120万", p: "15.0%", d: "品牌升级、公关传播、活动营销" }
  ];
  items.forEach((it, i) => {
    const y = 2.5 + i * 0.75;
    s.addText([
      { text: it.n + "  ", options: { bold: true, fontSize: 14, color: WHITE } },
      { text: it.v, options: { bold: true, fontSize: 14, color: GOLD } },
      { text: "  (" + it.p + ")", options: { fontSize: 11, color: "999999" } }
    ], { x: 5.6, y, w: 3.5, h: 0.3, margin: 0 });
    s.addText(it.d, { x: 5.6, y: y + 0.28, w: 3.5, h: 0.25, fontSize: 10, fontFace: "Calibri", color: "888888", margin: 0 });
  });

  s.addText("预期ROI：1:3.5  |  投资回收期：8个月", {
    x: 5.6, y: 4.7, w: 3.5, h: 0.25, fontSize: 11, fontFace: "Calibri", color: GOLD, bold: true, margin: 0 });
}

// ============ Slide 8: 结束页 ============
{
  const s = pres.addSlide();
  s.background = { color: DARK };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.04, fill: { color: GOLD } });
  s.addText("感谢聆听", {
    x: 1, y: 1.6, w: 8, h: 1.2,
    fontSize: 48, fontFace: "Arial Black", color: WHITE, bold: true, align: "center", margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 3.5, y: 2.95, w: 3, h: 0.03, fill: { color: GOLD } });
  s.addText("期待与您合作", {
    x: 1, y: 3.2, w: 8, h: 0.6,
    fontSize: 18, fontFace: "Calibri", color: LT, align: "center", margin: 0
  });
  s.addText("联系方式：[请填写]  |  邮箱：[请填写]", {
    x: 1, y: 4.3, w: 8, h: 0.35,
    fontSize: 12, fontFace: "Calibri", color: "aaaaaa", align: "center", margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.35, w: 10, h: 0.275, fill: { color: GOLD, transparency: 85 } });
}

// ============ Output ============
pres.writeFile({ fileName: "E:/我的桌面/闲鱼产品/样稿-品牌营销方案.pptx" })
  .then(() => console.log("✅ 样稿生成完毕"))
  .catch(e => console.error("❌", e.message));
