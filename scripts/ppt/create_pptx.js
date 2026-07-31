const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "入党积极分子";
pres.title = "入党积极分子思想汇报";

// ============ COLOR PALETTE (RED THEME) ============
const C = {
  primary: "CC0000",       // Main red
  darkRed: "8B0000",       // Dark red for backgrounds
  mediumRed: "E53935",     // Medium red accent
  lightPink: "FFF0F0",     // Very light pink bg
  lightBg: "FFFAFA",       // Slightly warm white
  gold: "D4AF37",          // Gold accent (party emblem)
  white: "FFFFFF",
  nearWhite: "FAFAFA",
  darkText: "2D2D2D",
  mutedText: "777777",
  darkBgText: "FFFFFF",
  cardBg: "FFFFFF",
  softRed: "F5E6E6",
};

// ============ FONTS ============
const H_FONT = "SimHei";       // Header font (黑体)
const B_FONT = "Microsoft YaHei"; // Body font (微软雅黑)

// ============ HELPER: fresh shadow factory ============
const makeShadow = (opacity = 0.12) => ({
  type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity,
});

// ============ HELPER: red accent bar on left ============
function addLeftAccentBar(slide, x, y, h) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w: 0.06, h,
    fill: { color: C.primary },
  });
}

// ============ HELPER: page number ============
function addPageNumber(slide, num, total) {
  slide.addText(`${num} / ${total}`, {
    x: 8.5, y: 5.25, w: 1.2, h: 0.25,
    fontSize: 9, color: C.mutedText, fontFace: B_FONT,
    align: "right", valign: "middle",
  });
}

// ============ HELPER: section divider slide ============
function addSectionSlide(slide, title, subtitle) {
  slide.background = { color: C.darkRed };
  // Gold decorative line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 1.5, y: 2.45, w: 1.5, h: 0.04,
    fill: { color: C.gold },
  });
  slide.addText(title, {
    x: 1.5, y: 1.8, w: 7, h: 0.8,
    fontSize: 40, fontFace: H_FONT, color: C.white, bold: true,
    align: "left", valign: "middle",
  });
  slide.addText(subtitle, {
    x: 1.5, y: 2.6, w: 7, h: 0.6,
    fontSize: 16, fontFace: B_FONT, color: "FFCCCC",
    align: "left", valign: "middle",
  });
}

// ============ SLIDE 1: TITLE SLIDE ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.darkRed };

  // Top gold line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 1.2, w: 8.4, h: 0.015,
    fill: { color: C.gold },
  });

  // Main title
  slide.addText("入党积极分子", {
    x: 0.8, y: 1.4, w: 8.4, h: 0.8,
    fontSize: 44, fontFace: H_FONT, color: C.white, bold: true,
    align: "center", valign: "middle",
  });

  slide.addText("思想汇报", {
    x: 0.8, y: 2.1, w: 8.4, h: 0.8,
    fontSize: 44, fontFace: H_FONT, color: C.gold, bold: true,
    align: "center", valign: "middle",
  });

  // Bottom gold line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 3.1, w: 8.4, h: 0.015,
    fill: { color: C.gold },
  });

  // Subtitle info
  slide.addText("汇报人：XXX     |     班级：XX专业XX班     |     日期：2026年6月", {
    x: 0.8, y: 3.5, w: 8.4, h: 0.5,
    fontSize: 14, fontFace: B_FONT, color: "FFCCCC",
    align: "center", valign: "middle",
  });

  // Decorative corner elements
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.15, y: 0.15, w: 0.35, h: 0.35,
    fill: { color: C.gold, transparency: 50 },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 9.5, y: 5.15, w: 0.35, h: 0.35,
    fill: { color: C.gold, transparency: 50 },
  });
})();

// ============ SLIDE 2: TABLE OF CONTENTS ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.white };

  // Title
  slide.addText("目  录", {
    x: 0.8, y: 0.3, w: 3, h: 0.7,
    fontSize: 32, fontFace: H_FONT, color: C.darkRed, bold: true,
  });
  addLeftAccentBar(slide, 0.55, 0.35, 0.55);

  // Decorative line under title
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 0.95, w: 8.4, h: 0.012,
    fill: { color: C.primary, transparency: 30 },
  });

  const tocItems = [
    { num: "01", title: "个人简介", desc: "基本信息与成长经历" },
    { num: "02", title: "对党的认识", desc: "党的理论与光辉历程" },
    { num: "03", title: "入党动机", desc: "为什么选择加入中国共产党" },
    { num: "04", title: "思想理论学习", desc: "学习党的理论与方针政策" },
    { num: "05", title: "学习与实践", desc: "学业成绩与社会实践成果" },
    { num: "06", title: "存在不足与改进", desc: "自我反思与成长方向" },
    { num: "07", title: "未来展望", desc: "努力方向与个人承诺" },
  ];

  const startX = 0.8;
  const startY = 1.3;
  const colW = 4.15;
  const rowH = 0.55;

  tocItems.forEach((item, i) => {
    const col = i < 4 ? 0 : 1;
    const row = i < 4 ? i : i - 4;
    const x = startX + col * (colW + 0.1);
    const y = startY + row * (rowH + 0.05);

    // Number circle
    slide.addShape(pres.shapes.OVAL, {
      x, y: y + 0.05, w: 0.42, h: 0.42,
      fill: { color: col === 0 ? C.primary : C.darkRed },
    });
    slide.addText(item.num, {
      x, y: y + 0.05, w: 0.42, h: 0.42,
      fontSize: 12, fontFace: H_FONT, color: C.white, bold: true,
      align: "center", valign: "middle",
    });

    // Title
    slide.addText(item.title, {
      x: x + 0.55, y: y - 0.02, w: colW - 0.55, h: 0.28,
      fontSize: 15, fontFace: H_FONT, color: C.darkText, bold: true,
      align: "left", valign: "middle",
    });
    // Description
    slide.addText(item.desc, {
      x: x + 0.55, y: y + 0.24, w: colW - 0.55, h: 0.22,
      fontSize: 11, fontFace: B_FONT, color: C.mutedText,
      align: "left", valign: "middle",
    });
  });

  addPageNumber(slide, 2, 15);
})();

// ============ SLIDE 3: 个人简介 ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.lightBg };

  // Section header
  slide.addText("个人简介", {
    x: 0.8, y: 0.3, w: 4, h: 0.6,
    fontSize: 30, fontFace: H_FONT, color: C.darkRed, bold: true,
  });
  addLeftAccentBar(slide, 0.55, 0.35, 0.5);

  // Left column — info card
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 1.2, w: 4.2, h: 3.8,
    fill: { color: C.white },
    shadow: makeShadow(0.1),
  });

  const infoLines = [
    { label: "姓    名：", value: "XXX" },
    { label: "性    别：", value: "男 / 女" },
    { label: "民    族：", value: "汉族" },
    { label: "出生年月：", value: "20XX年X月" },
    { label: "籍    贯：", value: "XX省XX市" },
    { label: "所在院系：", value: "XX学院" },
    { label: "专业班级：", value: "XX专业XX班" },
    { label: "现任职务：", value: "XX（班干部/学生会/社团）" },
    { label: "提交入党申请书时间：", value: "20XX年X月" },
    { label: "确定为积极分子时间：", value: "20XX年X月" },
  ];

  infoLines.forEach((line, i) => {
    const y = 1.45 + i * 0.33;
    slide.addText([
      { text: line.label, options: { bold: true, color: C.darkRed } },
      { text: line.value, options: { color: C.darkText } },
    ], {
      x: 1.1, y, w: 3.7, h: 0.3,
      fontSize: 12, fontFace: B_FONT,
      align: "left", valign: "middle",
    });
  });

  // Right column — 成长经历
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.3, y: 1.2, w: 4.2, h: 3.8,
    fill: { color: C.white },
    shadow: makeShadow(0.1),
  });

  slide.addText("成长经历", {
    x: 5.6, y: 1.35, w: 3.6, h: 0.4,
    fontSize: 18, fontFace: H_FONT, color: C.darkRed, bold: true,
  });

  // Timeline-style items
  const timeline = [
    { year: "20XX", text: "进入大学，开始新的学习阶段" },
    { year: "20XX", text: "提交入党申请书，表达入党意愿" },
    { year: "20XX", text: "被确定为入党积极分子" },
    { year: "20XX", text: "参加党校培训班学习" },
    { year: "至今", text: "持续向党组织靠拢，不断成长" },
  ];

  timeline.forEach((item, i) => {
    const y = 1.95 + i * 0.58;
    // Dot
    slide.addShape(pres.shapes.OVAL, {
      x: 5.6, y: y + 0.08, w: 0.18, h: 0.18,
      fill: { color: C.primary },
    });
    // Year
    slide.addText(item.year, {
      x: 5.9, y, w: 0.8, h: 0.28,
      fontSize: 14, fontFace: H_FONT, color: C.primary, bold: true,
    });
    // Text
    slide.addText(item.text, {
      x: 6.7, y, w: 2.6, h: 0.28,
      fontSize: 12, fontFace: B_FONT, color: C.darkText,
    });
  });

  addPageNumber(slide, 3, 15);
})();

// ============ SLIDE 4: 对党的认识 ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.lightBg };

  slide.addText("对党的认识", {
    x: 0.8, y: 0.3, w: 5, h: 0.6,
    fontSize: 30, fontFace: H_FONT, color: C.darkRed, bold: true,
  });
  addLeftAccentBar(slide, 0.55, 0.35, 0.5);

  // 4 cards in 2x2 grid
  const cards = [
    { title: "党的性质", body: "中国共产党是中国工人阶级的先锋队，同时是中国人民和中华民族的先锋队，是中国特色社会主义事业的领导核心。" },
    { title: "党的宗旨", body: "全心全意为人民服务是党的根本宗旨。党除了工人阶级和最广大人民群众的利益，没有自己特殊的利益。" },
    { title: "党的指导思想", body: "以马克思列宁主义、毛泽东思想、邓小平理论、“三个代表”重要思想、科学发展观、新时代中国特色社会主义思想为指导。" },
    { title: "党的奋斗目标", body: "党的最高理想和最终目标是实现共产主义。现阶段目标是在本世纪中叶建成富强民主文明和谐美丽的社会主义现代化强国。" },
  ];

  cards.forEach((card, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * 4.4;
    const y = 1.2 + row * 2.1;

    // Card bg
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.1, h: 1.85,
      fill: { color: C.white },
      shadow: makeShadow(0.08),
    });

    // Top accent line on card
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.1, h: 0.05,
      fill: { color: i % 2 === 0 ? C.primary : C.darkRed },
    });

    // Card title
    slide.addText(card.title, {
      x: x + 0.3, y: y + 0.25, w: 3.5, h: 0.35,
      fontSize: 18, fontFace: H_FONT, color: C.darkRed, bold: true,
    });

    // Card body
    slide.addText(card.body, {
      x: x + 0.3, y: y + 0.65, w: 3.5, h: 1.0,
      fontSize: 12, fontFace: B_FONT, color: C.darkText,
      lineSpacingMultiple: 1.5,
    });
  });

  addPageNumber(slide, 4, 15);
})();

// ============ SLIDE 5: 入党动机 ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.darkRed };

  slide.addText("入党动机", {
    x: 1.0, y: 0.35, w: 5, h: 0.7,
    fontSize: 30, fontFace: H_FONT, color: C.white, bold: true,
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 1.0, y: 1.0, w: 2, h: 0.025,
    fill: { color: C.gold },
  });

  const motivations = [
    { num: "01", title: "信仰的力量", text: "深刻认同党的理想与信念，坚信共产主义远大目标，愿意为党和人民的事业奋斗终身。" },
    { num: "02", title: "榜样的引领", text: "被优秀党员的事迹所感动，身边党员榜样让我看到了共产党人应有的责任与担当。" },
    { num: "03", title: "时代的召唤", text: "在实现中华民族伟大复兴的时代背景下，渴望将个人理想融入国家发展大局。" },
    { num: "04", title: "服务的初心", text: "希望通过加入党组织，更好地服务同学、服务社会，践行全心全意为人民服务的宗旨。" },
  ];

  motivations.forEach((item, i) => {
    const y = 1.25 + i * 0.95;

    // Number circle
    slide.addShape(pres.shapes.OVAL, {
      x: 1.0, y: y + 0.02, w: 0.5, h: 0.5,
      fill: { color: C.gold },
    });
    slide.addText(item.num, {
      x: 1.0, y: y + 0.02, w: 0.5, h: 0.5,
      fontSize: 16, fontFace: H_FONT, color: C.darkRed, bold: true,
      align: "center", valign: "middle",
    });

    // Title
    slide.addText(item.title, {
      x: 1.7, y, w: 3, h: 0.35,
      fontSize: 20, fontFace: H_FONT, color: C.gold, bold: true,
    });
    // Text
    slide.addText(item.text, {
      x: 1.7, y: y + 0.35, w: 7, h: 0.5,
      fontSize: 13, fontFace: B_FONT, color: "FFDDDD",
      lineSpacingMultiple: 1.4,
    });
  });

  addPageNumber(slide, 5, 15);
})();

// ============ SLIDE 6: 思想理论学习 ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.lightBg };

  slide.addText("思想理论学习", {
    x: 0.8, y: 0.3, w: 5, h: 0.6,
    fontSize: 30, fontFace: H_FONT, color: C.darkRed, bold: true,
  });
  addLeftAccentBar(slide, 0.55, 0.35, 0.5);

  // 学习内容 — 3 columns
  const cols = [
    {
      title: "理论学习",
      items: [
        "认真学习《中国共产党章程》",
        "深入学习新时代中国特色社会主义思想",
        "研读党史重要文献与决议",
        "学习党的二十大精神",
        "了解党的路线、方针、政策",
      ],
    },
    {
      title: "学习方式",
      items: [
        "参加党校积极分子培训班",
        "按时完成“学习强国”每日学习",
        "参加党支部组织的集体学习",
        "阅读《求是》《人民日报》等",
        "与培养联系人定期交流思想",
      ],
    },
    {
      title: "学习心得",
      items: [
        "增强了“四个意识”",
        "坚定了“四个自信”",
        "做到“两个维护”的自觉",
        "加深了对党的理论的理解",
        "提升了政治判断力与执行力",
      ],
    },
  ];

  cols.forEach((col, i) => {
    const x = 0.7 + i * 3.0;

    // Column header
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.2, w: 2.65, h: 0.45,
      fill: { color: C.primary },
    });
    slide.addText(col.title, {
      x, y: 1.2, w: 2.65, h: 0.45,
      fontSize: 16, fontFace: H_FONT, color: C.white, bold: true,
      align: "center", valign: "middle",
    });

    // Items
    col.items.forEach((item, j) => {
      const y = 1.85 + j * 0.58;
      // Dot
      slide.addShape(pres.shapes.OVAL, {
        x: x + 0.18, y: y + 0.15, w: 0.12, h: 0.12,
        fill: { color: C.mediumRed },
      });
      slide.addText(item, {
        x: x + 0.4, y, w: 2.05, h: 0.45,
        fontSize: 11.5, fontFace: B_FONT, color: C.darkText,
        valign: "middle",
      });
    });
  });

  addPageNumber(slide, 6, 15);
})();

// ============ SLIDE 7: 学习情况 ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.lightBg };

  slide.addText("学习情况", {
    x: 0.8, y: 0.3, w: 5, h: 0.6,
    fontSize: 30, fontFace: H_FONT, color: C.darkRed, bold: true,
  });
  addLeftAccentBar(slide, 0.55, 0.35, 0.5);

  // Stats cards
  const stats = [
    { value: "X.X", label: "平均绩点 (GPA)", sub: "专业排名前XX%" },
    { value: "X 次", label: "获得奖学金", sub: "校级/院级荣誉" },
    { value: "X 项", label: "学科竞赛获奖", sub: "含国家级/省部级" },
    { value: "X 篇", label: "参与课题研究", sub: "学术论文/项目报告" },
  ];

  stats.forEach((stat, i) => {
    const x = 0.6 + i * 2.2;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.2, w: 1.95, h: 1.6,
      fill: { color: C.white },
      shadow: makeShadow(0.08),
    });

    // Big number
    slide.addText(stat.value, {
      x, y: 1.3, w: 1.95, h: 0.55,
      fontSize: 28, fontFace: H_FONT, color: C.primary, bold: true,
      align: "center", valign: "middle",
    });

    slide.addText(stat.label, {
      x, y: 1.85, w: 1.95, h: 0.35,
      fontSize: 13, fontFace: B_FONT, color: C.darkText, bold: true,
      align: "center", valign: "middle",
    });

    slide.addText(stat.sub, {
      x, y: 2.2, w: 1.95, h: 0.3,
      fontSize: 10, fontFace: B_FONT, color: C.mutedText,
      align: "center", valign: "middle",
    });
  });

  // 学业表现 details
  slide.addText("学业表现", {
    x: 0.8, y: 3.1, w: 3, h: 0.4,
    fontSize: 18, fontFace: H_FONT, color: C.darkRed, bold: true,
  });

  const acaItems = [
    "学习态度端正，上课认真听讲，按时完成作业，积极与老师同学交流讨论。",
    "专业课成绩优异，多门核心课程达到90分以上，具备扎实的专业基础。",
    "积极参与学科竞赛与科研项目，锻炼了实践能力和创新思维。",
    "在班级中主动帮助学习有困难的同学，营造良好学习氛围。",
  ];

  acaItems.forEach((item, i) => {
    slide.addText([
      { text: "▸ ", options: { color: C.primary, bold: true } },
      { text: item, options: { color: C.darkText } },
    ], {
      x: 0.8, y: 3.55 + i * 0.38, w: 8.4, h: 0.35,
      fontSize: 12.5, fontFace: B_FONT,
      valign: "middle",
    });
  });

  addPageNumber(slide, 7, 15);
})();

// ============ SLIDE 8: 社会实践与志愿服务 ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.lightBg };

  slide.addText("社会实践与志愿服务", {
    x: 0.8, y: 0.3, w: 6, h: 0.6,
    fontSize: 30, fontFace: H_FONT, color: C.darkRed, bold: true,
  });
  addLeftAccentBar(slide, 0.55, 0.35, 0.5);

  // 3 practice cards
  const practices = [
    {
      icon: "🏫",
      title: "志愿服务",
      items: ["累计志愿服务时长 XX 小时", "参与校园疫情防控志愿服务", "参加社区义务劳动与环保活动", "支教/敬老院/福利院志愿服务"],
    },
    {
      icon: "🏭",
      title: "社会实践",
      items: ["参加暑期“三下乡”社会实践活动", "赴XX企业/单位开展专业实习", "参与社会调研项目并撰写报告", "获评校级/院级社会实践优秀个人"],
    },
    {
      icon: "👥",
      title: "学生工作",
      items: ["担任班干部/学生会XX职务", "组织策划XX活动（参与人数XX）", "协助辅导员开展日常管理工作", "获评优秀学生干部/先进个人"],
    },
  ];

  practices.forEach((p, i) => {
    const x = 0.7 + i * 3.0;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.2, w: 2.65, h: 3.6,
      fill: { color: C.white },
      shadow: makeShadow(0.08),
    });

    // Icon placeholder (circle)
    slide.addShape(pres.shapes.OVAL, {
      x: x + 0.975, y: 1.35, w: 0.7, h: 0.7,
      fill: { color: C.softRed },
    });
    slide.addText(p.icon, {
      x: x + 0.975, y: 1.35, w: 0.7, h: 0.7,
      fontSize: 26, align: "center", valign: "middle",
    });

    // Title
    slide.addText(p.title, {
      x: x + 0.15, y: 2.2, w: 2.5, h: 0.4,
      fontSize: 18, fontFace: H_FONT, color: C.darkRed, bold: true,
      align: "center", valign: "middle",
    });

    // Items
    p.items.forEach((item, j) => {
      slide.addText([
        { text: "• ", options: { color: C.primary } },
        { text: item, options: { color: C.darkText } },
      ], {
        x: x + 0.25, y: 2.75 + j * 0.5, w: 2.3, h: 0.45,
        fontSize: 11.5, fontFace: B_FONT,
        valign: "middle",
      });
    });
  });

  addPageNumber(slide, 8, 15);
})();

// ============ SLIDE 9: 参加组织活动情况 ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.darkRed };

  slide.addText("参加组织活动情况", {
    x: 1.0, y: 0.35, w: 6, h: 0.7,
    fontSize: 30, fontFace: H_FONT, color: C.white, bold: true,
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 1.0, y: 1.0, w: 2, h: 0.025,
    fill: { color: C.gold },
  });

  const activities = [
    { title: "党支部组织生活会", desc: "按时参加每月支部组织生活会，认真学习会议内容，积极发言交流心得体会。" },
    { title: "主题党日活动", desc: "参加“传承红色基因”、“学习英模事迹”等主题党日活动，接受党性教育。" },
    { title: "党校培训", desc: "参加第XX期入党积极分子培训班，系统学习党的基本理论，顺利通过结业考试。" },
    { title: "谈心谈话", desc: "定期与培养联系人、支部书记进行思想汇报和谈心谈话，虚心接受指导意见。" },
    { title: "理论学习小组", desc: "参加班级/院系理论学习小组，与同学们一起研读经典著作，交流学习心得。" },
    { title: "集体观影/参观", desc: "参加红色观影活动、参观革命纪念馆/党史展览，增强对党史的认识和理解。" },
  ];

  activities.forEach((act, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 1.0 + col * 4.4;
    const y = 1.25 + row * 1.3;

    // Number
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.06, h: 1.05,
      fill: { color: C.gold },
    });

    slide.addText(act.title, {
      x: x + 0.25, y, w: 3.8, h: 0.35,
      fontSize: 15, fontFace: H_FONT, color: C.gold, bold: true,
    });
    slide.addText(act.desc, {
      x: x + 0.25, y: y + 0.38, w: 3.8, h: 0.65,
      fontSize: 12, fontFace: B_FONT, color: "FFDDDD",
      lineSpacingMultiple: 1.4,
    });
  });

  addPageNumber(slide, 9, 15);
})();

// ============ SLIDE 10: 存在不足与改进方向 ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.lightBg };

  slide.addText("存在不足与改进方向", {
    x: 0.8, y: 0.3, w: 7, h: 0.6,
    fontSize: 30, fontFace: H_FONT, color: C.darkRed, bold: true,
  });
  addLeftAccentBar(slide, 0.55, 0.35, 0.5);

  // Two columns: 不足 vs 改进
  // Left: 不足
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 1.2, w: 4.1, h: 3.8,
    fill: { color: C.white },
    shadow: makeShadow(0.08),
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.8, y: 1.2, w: 4.1, h: 0.5,
    fill: { color: C.mediumRed },
  });
  slide.addText("存在的不足", {
    x: 0.8, y: 1.2, w: 4.1, h: 0.5,
    fontSize: 18, fontFace: H_FONT, color: C.white, bold: true,
    align: "center", valign: "middle",
  });

  const weaknesses = [
    "政治理论学习还不够深入系统，对一些理论问题的理解比较肤浅。",
    "理论联系实际的能力有待加强，学用结合做得不够紧密。",
    "在工作中有时存在急躁情绪，处理问题不够沉稳细致。",
    "服务同学、服务集体的主动性还需要进一步增强。",
    "批评与自我批评的自觉性不够，自我要求有时不够严格。",
  ];

  weaknesses.forEach((w, i) => {
    slide.addText([
      { text: `${i + 1}. `, options: { color: C.mediumRed, bold: true } },
      { text: w, options: { color: C.darkText } },
    ], {
      x: 1.05, y: 1.9 + i * 0.58, w: 3.6, h: 0.5,
      fontSize: 11.5, fontFace: B_FONT,
      valign: "middle",
    });
  });

  // Right: 改进方向
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.2, w: 4.1, h: 3.8,
    fill: { color: C.white },
    shadow: makeShadow(0.08),
  });

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 1.2, w: 4.1, h: 0.5,
    fill: { color: C.primary },
  });
  slide.addText("改进方向", {
    x: 5.2, y: 1.2, w: 4.1, h: 0.5,
    fontSize: 18, fontFace: H_FONT, color: C.white, bold: true,
    align: "center", valign: "middle",
  });

  const improvements = [
    "制定个人学习计划，每天坚持学习强国，系统研读经典著作。",
    "多参加社会实践活动，在实践中检验和运用所学理论知识。",
    "加强自我修养，培养耐心和细致的作风，遇事冷静思考。",
    "主动关心同学，积极承担班级和学院的工作任务。",
    "定期进行自我反思总结，勇于接受他人的批评和建议。",
  ];

  improvements.forEach((imp, i) => {
    slide.addText([
      { text: `${i + 1}. `, options: { color: C.primary, bold: true } },
      { text: imp, options: { color: C.darkText } },
    ], {
      x: 5.45, y: 1.9 + i * 0.58, w: 3.6, h: 0.5,
      fontSize: 11.5, fontFace: B_FONT,
      valign: "middle",
    });
  });

  addPageNumber(slide, 10, 15);
})();

// ============ SLIDE 11: 自我反思 ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.lightBg };

  slide.addText("自我反思", {
    x: 0.8, y: 0.3, w: 5, h: 0.6,
    fontSize: 30, fontFace: H_FONT, color: C.darkRed, bold: true,
  });
  addLeftAccentBar(slide, 0.55, 0.35, 0.5);

  // Three reflection areas
  const reflections = [
    {
      title: "思想上",
      icon: "💭",
      text: "通过一段时间的学习，我对党的认识更加深刻了。但是反思自身，还存在理论学习不够系统的问题。有时满足于完成规定动作，缺乏主动深入钻研的精神。今后要进一步增强学习的自觉性和系统性，真正做到学深悟透、入脑入心。",
    },
    {
      title: "行动上",
      icon: "🏃",
      text: "在日常学习生活中，我能以党员的标准要求自己，但也清醒地认识到，在关键时刻挺身而出、主动承担急难险重任务方面还有差距。需要在实践中不断磨练意志品质，增强担当意识。",
    },
    {
      title: "作风上",
      icon: "⭐",
      text: "总体能够遵守校纪校规，但与优秀党员相比，在密切联系同学、批评与自我批评等方面做得还不够。需要更加注重日常言行，以更高的标准严格要求自己，发挥先锋模范作用。",
    },
  ];

  reflections.forEach((r, i) => {
    const y = 1.2 + i * 1.35;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y, w: 8.4, h: 1.15,
      fill: { color: C.white },
      shadow: makeShadow(0.06),
    });

    // Accent left
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.8, y, w: 0.08, h: 1.15,
      fill: { color: C.primary },
    });

    // Icon circle
    slide.addShape(pres.shapes.OVAL, {
      x: 1.15, y: y + 0.13, w: 0.55, h: 0.55,
      fill: { color: C.softRed },
    });
    slide.addText(r.icon, {
      x: 1.15, y: y + 0.13, w: 0.55, h: 0.55,
      fontSize: 20, align: "center", valign: "middle",
    });

    // Title
    slide.addText(r.title, {
      x: 1.9, y: y + 0.1, w: 2, h: 0.35,
      fontSize: 18, fontFace: H_FONT, color: C.darkRed, bold: true,
    });

    // Text
    slide.addText(r.text, {
      x: 1.9, y: y + 0.45, w: 7, h: 0.7,
      fontSize: 11.5, fontFace: B_FONT, color: C.darkText,
      lineSpacingMultiple: 1.4,
    });
  });

  addPageNumber(slide, 11, 15);
})();

// ============ SLIDE 12: 未来努力方向 ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.darkRed };

  slide.addText("未来努力方向", {
    x: 1.0, y: 0.35, w: 6, h: 0.7,
    fontSize: 30, fontFace: H_FONT, color: C.white, bold: true,
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 1.0, y: 1.0, w: 2, h: 0.025,
    fill: { color: C.gold },
  });

  const directions = [
    {
      num: "1",
      title: "加强理论学习",
      text: "制定系统学习计划，深入学习新时代中国特色社会主义思想，每天坚持学习强国，不断提高政治理论素养。",
    },
    {
      num: "2",
      title: "提高专业能力",
      text: "刻苦钻研专业知识，力争学习成绩再上新台阶，为将来服务社会打下坚实的专业基础。",
    },
    {
      num: "3",
      title: "增强实践锻炼",
      text: "积极参加社会实践和志愿服务活动，在实践中增长才干，增强服务人民的本领。",
    },
    {
      num: "4",
      title: "严格自我要求",
      text: "以党员标准严格要求自己，在日常学习生活中发挥模范带头作用，接受党组织和同学们的监督。",
    },
    {
      num: "5",
      title: "积极向组织靠拢",
      text: "主动汇报思想，积极参加组织活动，虚心接受培养联系人的指导，争取早日成为一名光荣的共产党员。",
    },
  ];

  directions.forEach((d, i) => {
    const y = 1.2 + i * 0.78;

    // Number
    slide.addShape(pres.shapes.OVAL, {
      x: 1.0, y: y + 0.1, w: 0.45, h: 0.45,
      fill: { color: C.gold },
    });
    slide.addText(d.num, {
      x: 1.0, y: y + 0.1, w: 0.45, h: 0.45,
      fontSize: 18, fontFace: H_FONT, color: C.darkRed, bold: true,
      align: "center", valign: "middle",
    });

    // Title
    slide.addText(d.title, {
      x: 1.65, y, w: 3, h: 0.35,
      fontSize: 18, fontFace: H_FONT, color: C.gold, bold: true,
    });
    // Text
    slide.addText(d.text, {
      x: 1.65, y: y + 0.35, w: 7.2, h: 0.4,
      fontSize: 12.5, fontFace: B_FONT, color: "FFDDDD",
    });
  });

  addPageNumber(slide, 12, 15);
})();

// ============ SLIDE 13: 个人承诺 ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.lightBg };

  slide.addText("个人承诺", {
    x: 0.8, y: 0.3, w: 5, h: 0.6,
    fontSize: 30, fontFace: H_FONT, color: C.darkRed, bold: true,
  });
  addLeftAccentBar(slide, 0.55, 0.35, 0.5);

  const pledges = [
    "坚定理想信念，永远跟党走",
    "刻苦学习，努力成为德才兼备的人才",
    "服务同学，帮助他人，甘于奉献",
    "严于律己，遵纪守法，诚实守信",
    "勇于批评与自我批评，不断进步",
    "积极参加组织活动，接受组织考验",
  ];

  pledges.forEach((pledge, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.8 + col * 4.4;
    const y = 1.3 + row * 1.2;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.1, h: 0.95,
      fill: { color: i < 3 ? C.white : C.white },
      shadow: makeShadow(0.06),
    });

    // Left accent
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.07, h: 0.95,
      fill: { color: i % 2 === 0 ? C.primary : C.darkRed },
    });

    // Check mark shape (simulated with oval)
    slide.addShape(pres.shapes.OVAL, {
      x: x + 0.25, y: y + 0.2, w: 0.4, h: 0.4,
      fill: { color: C.softRed },
    });
    slide.addText("✓", {
      x: x + 0.25, y: y + 0.2, w: 0.4, h: 0.4,
      fontSize: 18, fontFace: H_FONT, color: C.primary, bold: true,
      align: "center", valign: "middle",
    });

    slide.addText(pledge, {
      x: x + 0.85, y, w: 3.0, h: 0.95,
      fontSize: 16, fontFace: H_FONT, color: C.darkText, bold: true,
      valign: "middle",
    });
  });

  addPageNumber(slide, 13, 15);
})();

// ============ SLIDE 14: 总结 ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.darkRed };

  slide.addText("总结与展望", {
    x: 1.0, y: 0.35, w: 6, h: 0.7,
    fontSize: 30, fontFace: H_FONT, color: C.white, bold: true,
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 1.0, y: 1.0, w: 2, h: 0.025,
    fill: { color: C.gold },
  });

  // Main summary text
  const summaryText = "作为一名入党积极分子，我深知自己距离一名合格的共产党员还有差距。但我有信心、有决心，在党组织的培养教育下，在同志们的帮助下，通过自身不懈努力，不断提高自己、完善自己。";

  slide.addText(summaryText, {
    x: 1.0, y: 1.3, w: 8, h: 1.0,
    fontSize: 15, fontFace: B_FONT, color: C.white,
    lineSpacingMultiple: 1.6,
    align: "left", valign: "top",
  });

  // Key points
  const keyPoints = [
    { label: "初心不改", text: "坚定入党初心，牢记全心全意为人民服务的宗旨。" },
    { label: "学习不止", text: "持续加强政治理论学习，不断提升思想觉悟和政治素养。" },
    { label: "实践不息", text: "在实践中磨练意志，增长才干，服务同学、服务社会。" },
  ];

  keyPoints.forEach((kp, i) => {
    const y = 2.5 + i * 0.95;

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.0, y, w: 8, h: 0.75,
      fill: { color: C.white, transparency: 85 },
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.0, y, w: 0.07, h: 0.75,
      fill: { color: C.gold },
    });

    slide.addText(kp.label, {
      x: 1.3, y, w: 1.5, h: 0.75,
      fontSize: 20, fontFace: H_FONT, color: C.gold, bold: true,
      valign: "middle",
    });

    slide.addText(kp.text, {
      x: 2.8, y, w: 5.8, h: 0.75,
      fontSize: 13, fontFace: B_FONT, color: "FFDDDD",
      valign: "middle",
    });
  });

  // Bottom quote
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 2.5, y: 4.65, w: 5, h: 0.012,
    fill: { color: C.gold, transparency: 40 },
  });

  slide.addText("请党组织在实践中考验我！", {
    x: 1.0, y: 4.7, w: 8, h: 0.5,
    fontSize: 16, fontFace: H_FONT, color: C.gold, bold: true,
    align: "center", valign: "middle",
  });

  addPageNumber(slide, 14, 15);
})();

// ============ SLIDE 15: 致谢 ============
(() => {
  const slide = pres.addSlide();
  slide.background = { color: C.darkRed };

  // Gold decorative border
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 1.5, y: 0.8, w: 7, h: 4.0,
    fill: { color: C.darkRed },
    line: { color: C.gold, width: 1.5 },
  });

  // Corner accents
  [{ x: 1.5, y: 0.8 }, { x: 7.85, y: 0.8 }, { x: 1.5, y: 4.2 }, { x: 7.85, y: 4.2 }].forEach(pos => {
    slide.addShape(pres.shapes.RECTANGLE, {
      x: pos.x, y: pos.y, w: 0.65, h: 0.6,
      fill: { color: C.darkRed },
      line: { color: C.gold, width: 1.5 },
    });
  });

  // Main thank you text
  slide.addText("感谢聆听", {
    x: 1.5, y: 1.8, w: 7, h: 1.0,
    fontSize: 52, fontFace: H_FONT, color: C.white, bold: true,
    align: "center", valign: "middle",
  });

  slide.addText("THANK YOU", {
    x: 1.5, y: 2.7, w: 7, h: 0.6,
    fontSize: 20, fontFace: "Arial", color: C.gold,
    align: "center", valign: "middle",
    charSpacing: 6,
  });

  // Gold line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 3.5, y: 3.45, w: 3, h: 0.015,
    fill: { color: C.gold },
  });

  // Contact/info
  slide.addText("汇报人：XXX    |    班级：XX专业XX班    |    2026年6月", {
    x: 1.5, y: 3.7, w: 7, h: 0.5,
    fontSize: 14, fontFace: B_FONT, color: "FFCCCC",
    align: "center", valign: "middle",
  });

  addPageNumber(slide, 15, 15);
})();

// ============ GENERATE ============
const outputPath = "E:/我的桌面/入党积极分子思想汇报.pptx";
pres.writeFile({ fileName: outputPath })
  .then(() => console.log("SUCCESS: " + outputPath))
  .catch(err => console.error("ERROR:", err));
