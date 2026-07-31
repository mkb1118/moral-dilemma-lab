const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, HeadingLevel
} = require('docx');

// 发言稿正文内容 - 按段落拆分
const paragraphs = [
  "尊敬的各位领导、各位同志：",
  "",
  "大家好！",
  "",
  "我是来自软件工程专业大一的学生，现任班级学习委员。今天能够站在这里，作为入党积极分子代表发言，我的心情既激动又忐忑——激动的是，离党组织又近了一步；忐忑的是，我深知自己距离一名合格党员，还有很长的路要走。",
  "",
  "说起入党动机，最早是在父亲的影响下萌芽的。我的父亲是一名普通的基层党员，在我的记忆里，他几乎从来没有完整的周末，逢年过节也常常在单位值班。小时候我不太理解，有一次忍不住问他：“爸，为什么别人的爸爸都能在家陪孩子，你却总是那么忙？”他笑了笑，对我说：“孩子，我们是党员。群众需要的时候，党员不上去，谁上去？”",
  "",
  "这句话，我当时并没有完全听懂，但它像一颗种子埋在了我心里。后来慢慢长大，看着父亲日复一日忙碌却从不抱怨的身影，我逐渐明白了——“共产党员”不是一个简单的身份，而是一份沉甸甸的责任。正是因为有父亲这样的榜样在身边，我才更加坚定了向党组织靠拢的决心。我希望自己将来也能成为那样的人：一个在平凡岗位上默默奉献的人，一个关键时刻站得出来的人。",
  "",
  "进入大学以后，我开始系统地了解党。作为一名软件工程专业的学生，我对“科技自立自强”、“没有网络安全就没有国家安全”这些重要论断感触很深。以前我觉得，学好编程就是为了将来找一份好工作。但现在我认识到，每一行代码都可能关系到国家关键技术的自主可控，每一个软件系统的安全都连着千家万户的利益。我开始思考：怎样才能将所学专业知识，融入国家发展的大局？这种思想上的转变，让我不再仅仅为了考试和分数而学习，而是真正感受到了肩上那份属于新时代青年的责任。",
  "",
  "在行动上，我也努力用党员的标准要求自己。作为班级学习委员，我始终觉得，如果连自己的学习都搞不好，就没有资格去帮助别人。上学期我的专业课成绩保持在班级前列。同时，我利用课余时间帮助同学——Java课刚开课时，有几位同学连JDK都不会安装，我就一个一个帮他们配置环境、教他们使用IDEA，当他们成功运行出“Hello World”时，那种兴奋的表情让我特别有成就感。高数课上，有同学对极限和导数理解不透，我利用晚自习给他讲了一个多小时，直到他完全弄明白为止。此外，在思政课实践作业中，我主动承担了小组“红色传承”主题短视频的拍摄和剪辑任务，用自己学到的技术带着大家一起完成了作品，得到了老师的肯定。",
  "",
  "这些事虽然很小，但每一次帮助别人后的充实感，让我真切地体会到——“全心全意为人民服务”不是一句口号，它就体现在这些平凡的小事里。",
  "",
  "同时，我也清醒地认识到自己的不足。第一，理论学习还不够系统。目前我对习近平新时代中国特色社会主义思想的学习还停留在碎片化、浅层化的阶段，很多认识不够深入。第二，批评与自我批评的意识不够强。有时候面对别人指出的问题，虽然能接受，但心里还是会不太舒服，缺乏闻过则喜的胸怀。",
  "",
  "针对这些不足，我给自己定了两条具体的改进措施：一是制定系统的理论学习计划，每周至少安排三个小时阅读原著原文，坚持写读书笔记和心得体会，定期向培养联系人汇报学习情况；二是养成每日自我反思的习惯，在班委工作中主动听取大家的意见，把批评当作进步的阶梯。",
  "",
  "最后，我想说，我知道自己距离一名合格的共产党员还有差距，但我有一颗始终向党、永远追随的心。在今后的日子里，我将更加严格地要求自己，积极参加党组织的各项活动，努力在思想上、行动上全面达到党员标准。",
  "",
  "请党组织在实践中考验我！",
  "",
  "谢谢大家！"
];

// 标题段落
const titlePara = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 400, line: 360 },
  children: [
    new TextRun({
      text: "入党积极分子大会发言稿",
      font: "SimHei",
      size: 36, // 18pt = 36 half-points (小二)
      bold: true,
    }),
  ],
});

// 正文段落：仿宋 15pt，1.5倍行距，首行缩进2字符
const bodyFont = "FangSong";
const bodySize = 30; // 15pt = 30 half-points (小三)
const lineSpacing = 360; // 1.5倍行距 (240 * 1.5)
const firstLineIndent = 600; // 2字符缩进 (15pt * 2 ≈ 30pt ≈ 600 DXA)

const bodyParas = paragraphs.map(text => {
  if (text === "") {
    // 空行
    return new Paragraph({
      spacing: { line: lineSpacing },
      children: [],
    });
  }
  // 判断是否为称呼/问候/致谢等不需要缩进的段落
  const noIndent =
    text.startsWith("尊敬的") ||
    text.startsWith("大家好") ||
    text.startsWith("请党组织") ||
    text.startsWith("谢谢大家");

  return new Paragraph({
    indent: noIndent ? undefined : { firstLine: firstLineIndent },
    spacing: { line: lineSpacing },
    children: [
      new TextRun({
        text: text,
        font: bodyFont,
        size: bodySize,
      }),
    ],
  });
});

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: bodyFont, size: bodySize },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: {
            width: 11906, // A4 width in DXA
            height: 16838, // A4 height in DXA
          },
          margin: {
            top: 1440,    // 1 inch = 2.54cm
            bottom: 1440,
            left: 1800,   // 稍宽一点左边距
            right: 1800,
          },
        },
      },
      children: [titlePara, ...bodyParas],
    },
  ],
});

Packer.toBuffer(doc).then(buffer => {
  const outPath = "E:\\我的桌面\\入党积极分子发言稿.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("文档已保存到: " + outPath);
});
