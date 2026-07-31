const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat,
  TableOfContents, ExternalHyperlink, TabStopType, TabStopPosition
} = require("docx");

// ========== 工具函数 ==========
const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

function para(text, opts = {}) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(new TextRun({ text, size: 24, ...opts }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === "string") runs.push(new TextRun({ text: t, size: 24 }));
      else runs.push(new TextRun({ size: 24, ...t }));
    });
  }
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    indent: opts.indent !== false ? { firstLine: 480 } : undefined,
    alignment: opts.alignment,
    children: runs
  });
}

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 200 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, bold: true, size: 32, font: "黑体" })]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, font: "黑体" })]
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, font: "黑体" })]
  });
}

function codePara(code) {
  return new Paragraph({
    spacing: { after: 0, before: 0, line: 280 },
    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
    indent: { left: 360 },
    children: [new TextRun({ text: code, font: "Consolas", size: 18 })]
  });
}

function bullet(text, ref = "bullets") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 60 },
    children: [{ text, size: 24 }].map(t => new TextRun(t))
  });
}

function makeCell(text, opts = {}) {
  const p = new Paragraph({
    spacing: { after: 0, before: 0 },
    alignment: opts.alignment || AlignmentType.CENTER,
    children: [new TextRun({ text, size: opts.size || 22, bold: opts.bold, font: opts.font })]
  });
  return new TableCell({
    borders,
    margins: { top: 50, bottom: 50, left: 80, right: 80 },
    width: { size: opts.cellWidth || 2000, type: WidthType.DXA },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    verticalAlign: "center",
    children: [p]
  });
}

// ========== 文档内容 ==========
const TITLE = "员工管理系统的设计与实现";

const doc = new Document({
  styles: {
    default: { document: { run: { font: "宋体", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "黑体" },
        paragraph: { spacing: { before: 300, after: 200 }, outlineLevel: 0, alignment: AlignmentType.CENTER } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "黑体" },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "黑体" },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [
    // ============ 封面页 ============
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1331, right: 1134, bottom: 1134, left: 1418 }
        }
      },
      children: [
        // 空行
        para("", { indent: false }), para("", { indent: false }), para("", { indent: false }),
        // 标题
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "软 件 学 院", bold: true, size: 78, font: "隶书" })]
        }),
        para("", { indent: false }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: "实践环节报告", bold: true, size: 84, font: "隶书" })]
        }),
        para("", { indent: false }), para("", { indent: false }), para("", { indent: false }),
        para("", { indent: false }), para("", { indent: false }), para("", { indent: false }),
        // 信息行
        new Paragraph({
          indent: { left: 720, firstLine: 562 },
          spacing: { after: 60, line: 480 },
          children: [
            new TextRun({ text: "课程名称：", bold: true, size: 28, font: "黑体" }),
            new TextRun({ text: "软件开发实践一", size: 28, font: "黑体", underline: { type: "single" } })
          ]
        }),
        new Paragraph({
          indent: { left: 720, firstLine: 562 },
          spacing: { after: 60, line: 480 },
          children: [
            new TextRun({ text: "课题名称：", bold: true, size: 28, font: "黑体" }),
            new TextRun({ text: TITLE, size: 28, font: "黑体", underline: { type: "single" } })
          ]
        }),
        new Paragraph({
          indent: { left: 720, firstLine: 562 },
          spacing: { after: 60, line: 480 },
          children: [
            new TextRun({ text: "专    业：", bold: true, size: 28, font: "黑体" }),
            new TextRun({ text: "软件工程", size: 28, font: "黑体", underline: { type: "single" } })
          ]
        }),
        new Paragraph({
          indent: { left: 720, firstLine: 562 },
          spacing: { after: 60, line: 480 },
          children: [
            new TextRun({ text: "班    级：", bold: true, size: 28, font: "黑体" }),
            new TextRun({ text: "RB软工融253", size: 28, font: "黑体", underline: { type: "single" } })
          ]
        }),
        new Paragraph({
          indent: { left: 720, firstLine: 562 },
          spacing: { after: 60, line: 480 },
          children: [
            new TextRun({ text: "学    号：", bold: true, size: 28, font: "黑体" }),
            new TextRun({ text: "202532044314", size: 28, font: "黑体", underline: { type: "single" } })
          ]
        }),
        new Paragraph({
          indent: { left: 720, firstLine: 562 },
          spacing: { after: 60, line: 480 },
          children: [
            new TextRun({ text: "学生姓名：", bold: true, size: 28, font: "黑体" }),
            new TextRun({ text: "马康博", size: 28, font: "黑体", underline: { type: "single" } })
          ]
        }),
        new Paragraph({
          indent: { left: 720, firstLine: 562 },
          spacing: { after: 60, line: 300 },
          children: [
            new TextRun({ text: "指导教师：", bold: true, size: 28, font: "黑体" }),
            new TextRun({ text: "王海龙", size: 28, font: "黑体", underline: { type: "single" } })
          ]
        }),
        para("", { indent: false }), para("", { indent: false }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "2026", size: 28, bold: true, font: "宋体" }),
            new TextRun({ text: "年", size: 28, bold: true, font: "宋体" }),
            new TextRun({ text: "7", size: 28, bold: true }),
            new TextRun({ text: "月", size: 28, bold: true, font: "宋体" }),
            new TextRun({ text: "3", size: 28, bold: true }),
            new TextRun({ text: "日", size: 28, bold: true, font: "宋体" }),
          ]
        }),
      ]
    },

    // ============ 任务书 + 正文 ============
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1418, right: 1134, bottom: 1134, left: 1418 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "中原工学院软件学院  软件开发实践一  设计任务书", size: 18, font: "宋体", color: "888888" })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "第 ", size: 18 }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18 }),
              new TextRun({ text: " 页", size: 18 })
            ]
          })]
        })
      },
      children: [
        // ===== 任务书标题 =====
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 100 },
          children: [
            new TextRun({ text: "中原工学院软件学院", bold: true, size: 32, font: "宋体" }),
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: "软件开发实践一设计任务书", bold: true, size: 44, font: "宋体" }),
          ]
        }),

        // ===== 任务书表格 =====
        new Table({
          width: { size: 9350, type: WidthType.DXA },
          columnWidths: [933, 1769, 6648],
          rows: [
            // 姓名行
            new TableRow({
              children: [
                makeCell("姓 名", { cellWidth: 933, bold: true, shading: "F2F2F2" }),
                makeCell("马康博", { cellWidth: 1769 }),
                makeCell("软件工程  专业  RB软工融253  班", { cellWidth: 6648, alignment: AlignmentType.LEFT }),
              ]
            }),
            // 题目行
            new TableRow({
              children: [
                makeCell("题 目", { cellWidth: 933, bold: true, shading: "F2F2F2" }),
                { ...makeCell("", { cellWidth: 8417 }), columnSpan: 2, width: { size: 8417, type: WidthType.DXA }, children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: TITLE, size: 22 })]
                  })
                ]}
              ]
            }).getChildren().length > 0 ? null : null,  // placeholder
            // 设计任务行
            new TableRow({
              height: { value: 3500, rule: "atLeast" },
              children: [
                makeCell("设\n计\n任\n务", { cellWidth: 933, bold: true, shading: "F2F2F2" }),
                { ...makeCell("", { cellWidth: 8417 }), columnSpan: 2, width: { size: 8417, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      spacing: { after: 100 },
                      children: [new TextRun({ text: "设计开发一个员工管理系统，主要功能包括：员工信息的增删改查、员工类型管理、员工信息统计。系统采用Java控制台应用形式，使用JDBC连接MySQL数据库，采用DAO设计模式实现数据访问分层架构。", size: 22 })]
                    }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "1. 设计数据库表结构（emp员工表、emp_type员工类型表），建立外键关联", size: 22 })] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "2. 实现DAO泛型接口及JDBC实现类，完成数据库CRUD操作", size: 22 })] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "3. 实现Service业务层和Menu菜单层，完成用户交互界面", size: 22 })] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "4. 实现系统主控制层（EmpSystem），整合各模块形成完整系统", size: 22 })] }),
                    new Paragraph({ children: [new TextRun({ text: "（独立完成）", size: 22, bold: true })] }),
                    new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: "开发工具：IntelliJ IDEA、JDK 25、Maven、MySQL 8.0", size: 22 })] }),
                  ]
                }
              ]
            }),
            // 时间进度行
            new TableRow({
              height: { value: 2800, rule: "atLeast" },
              children: [
                makeCell("时\n间\n进\n度", { cellWidth: 933, bold: true, shading: "F2F2F2" }),
                { ...makeCell("", { cellWidth: 8417 }), columnSpan: 2, width: { size: 8417, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      spacing: { after: 80 },
                      children: [new TextRun({ text: "第1周（2026-06-22~2026-06-26）：完成员工管理系统需求分析、系统分析与设计、数据库设计与实现等，完成DAO模式对数据库代码的编写。", size: 22 })]
                    }),
                    new Paragraph({
                      children: [new TextRun({ text: "第2周（2026年6月29日~2026年7月3日）：完成了多层模式中Service代码的编写，完成了Menu菜单的编写，完成了对员工管理系统的功能测试。", size: 22 })]
                    }),
                  ]
                }
              ]
            }),
            // 参考资料行
            new TableRow({
              height: { value: 3200, rule: "atLeast" },
              children: [
                makeCell("原 始 要\n参 考 资\n料 与 文\n   献", { cellWidth: 933, bold: true, shading: "F2F2F2" }),
                { ...makeCell("", { cellWidth: 8417 }), columnSpan: 2, width: { size: 8417, type: WidthType.DXA },
                  children: [
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "[01] 林信良. Java学习笔记 JDK9 [M]. 北京: 清华大学出版社, 2018.6", size: 22 })] }),
                    new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "[02] 李辉. 数据库原理与应用基础(MySQL) [M]. 北京: 高等教育出版社, 2019.8", size: 22 })] }),
                    new Paragraph({ children: [new TextRun({ text: "[03] 张帆等. Java范例开发大全 [M]. 北京: 清华大学出版社, 2010.6", size: 22 })] }),
                  ]
                }
              ]
            }),
          ]
        }),
        // 签字行
        para("", { indent: false }),
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({ text: "指导教师签字：                            ", bold: true, size: 22 }),
            new TextRun({ text: "2026    年    7  月  3  日", bold: true, size: 22 }),
          ]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ============ 摘要 ============
        heading1("摘  要"),
        para(""),
        para([
          { text: "本系统是一个基于", size: 24 },
          { text: "Java控制台", bold: true, size: 24 },
          { text: "的员工管理系统，采用", size: 24 },
          { text: "JDBC + MySQL", bold: true, size: 24 },
          { text: "技术栈实现数据的持久化存储。系统围绕企业员工管理的核心需求，实现了员工信息的增删改查（CRUD）、员工类型分类管理以及多维度数据统计功能。在架构设计上，采用", size: 24 },
          { text: "DAO设计模式", bold: true, size: 24 },
          { text: "与分层架构（Entity实体层→DAO数据访问层→Service业务层→Menu菜单层→System控制层），通过泛型接口DAO<T>实现代码复用，降低了各模块之间的耦合度。系统使用Lombok简化实体类代码，使用PreparedStatement防止SQL注入，并通过try-with-resources确保数据库资源的安全释放。用户通过控制台菜单交互，操作直观简洁。", size: 24 },
        ], { indent: true }),
        para(""),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "关键词：", bold: true, size: 24, font: "黑体" }),
            new TextRun({ text: "Java；MySQL；JDBC；DAO设计模式；员工管理系统", size: 24 }),
          ]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ============ 目录 ============
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [new TextRun({ text: "目  录", bold: true, size: 36, font: "黑体" })]
        }),
        new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ============ 第1章 需求分析 ============
        heading1("第1章  需求分析"),
        para(""),
        heading2("1.1  系统目标"),
        para("本系统旨在为企业人力资源管理部门提供一个轻量级的员工信息管理工具，能够在控制台环境下完成员工信息的录入、修改、删除、查询以及统计分析等日常操作，提高管理效率，降低人工管理的错误率。"),
        para("具体目标包括：①建立员工信息的电子化档案，替代传统的纸质或Excel管理方式；②通过员工类型分类，支持对不同类别员工的分组管理；③提供多维度统计功能，为管理人员提供数据决策支持"),

        heading2("1.2  功能需求"),
        heading3("1.2.1  员工管理模块"),
        bullet("添加员工：录入员工姓名、电话、工号、地址、薪资，并选择所属类型"),
        bullet("删除员工：根据员工ID删除指定员工记录"),
        bullet("修改员工：根据员工ID更新员工的所有字段信息"),
        bullet("查询员工：支持按ID精确查询，支持分页查询全部员工"),
        bullet("工号唯一性校验：新增员工时自动检查工号是否重复"),
        bullet("工号自动生成：获取当前最大工号，辅助新增时自动编号"),

        heading3("1.2.2  员工类型管理模块"),
        bullet("添加类型：新增员工类型（如「经理」、「职员」、「实习生」等）"),
        bullet("删除类型：删除指定类型（需校验该类型下是否有员工）"),
        bullet("修改类型：更新类型的名称"),
        bullet("查询类型：按ID查询单个类型，分页查询全部类型"),

        heading3("1.2.3  统计功能模块"),
        bullet("统计员工总数"),
        bullet("统计员工工资总额"),
        bullet("计算员工平均薪资"),
        bullet("按员工类型分组统计工资总额"),
        bullet("按员工类型分组统计平均薪资"),

        heading2("1.3  用户角色"),
        para("系统面向单一管理员角色，无需登录认证。管理员通过控制台菜单选择功能编号，系统读取输入后调用相应的Service层逻辑完成操作。"),
        para(""),
        new Paragraph({ children: [new PageBreak()] }),

        // ============ 第2章 系统设计 ============
        heading1("第2章  系统设计"),
        para(""),
        heading2("2.1  系统设计思路"),
        para("本系统采用经典的分层架构设计，遵循「高内聚、低耦合」的原则，将系统从上到下划分为五个层次："),
        para(""),

        // 架构表格
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [1800, 2500, 4726],
          rows: [
            makeRow(["层次", "包路径", "职责"], { widths: [1800, 2500, 4726], shading: "D9E2F3" }),
            makeRow(["实体层", "entity", "定义数据载体类（Emp、EmpType），使用Lombok注解自动生成getter/setter，与数据库表一一对应"], { widths: [1800, 2500, 4726], shading: "FFFFFF" }),
            makeRow(["DAO层", "dao + dao.impl", "DAO<T>泛型接口定义CRUD契约；EmpDAO/EmpTypeDAO使用JDBC实现具体数据库操作"], { widths: [1800, 2500, 4726], shading: "F2F6FC" }),
            makeRow(["工具层", "ds", "DBConfig存储数据库连接配置；DBUtil封装Connection获取与资源释放"], { widths: [1800, 2500, 4726], shading: "FFFFFF" }),
            makeRow(["业务层", "service", "EmpService/EmpTypeService处理业务逻辑校验，调用DAO完成操作"], { widths: [1800, 2500, 4726], shading: "F2F6FC" }),
            makeRow(["表现层", "menu + system", "SysMenu为菜单基类（封装Scanner输入）；各Menu子类展示功能菜单；EmpSystem为系统主入口控制器"], { widths: [1800, 2500, 4726], shading: "FFFFFF" }),
          ]
        }),
        para(""),
        para("其中Menu层采用继承体系：SysMenu作为抽象基类提供choice()方法获取用户输入，EmpSystem（主菜单）、EmpMenu（员工管理子菜单）、EmpTypeMenu（类型管理子菜单）、StatisMenu（统计子菜单）均继承自SysMenu，实现代码复用。"),

        heading2("2.2  数据库设计"),
        heading3("2.2.1  E-R图"),
        para("系统包含两个实体：员工（Emp）和员工类型（EmpType）。二者之间为多对一关系：一个员工类型下可以有多个员工，一个员工只能属于一种员工类型。"),
        para(""),
        para([
          { text: "Emp（员工）", bold: true },
          { text: " —— 包含属性：员工ID（emp_id，主键）、姓名（emp_name）、电话（emp_tel）、工号（emp_no）、地址（emp_addr）、薪资（emp_salary）、类型ID（type_id，外键，引用EmpType.type_id）" }
        ], { indent: false }),
        para([
          { text: "EmpType（员工类型）", bold: true },
          { text: " —— 包含属性：类型ID（type_id，主键）、类型名称（type_name）" }
        ], { indent: false }),

        heading3("2.2.2  关系模式"),
        para("Emp (emp_id, emp_name, emp_tel, emp_no, emp_addr, emp_salary, type_id)"),
        para("　主键：emp_id　外键：type_id  REFERENCES EmpType(type_id)"),
        para(""),
        para("EmpType (type_id, type_name)"),
        para("　主键：type_id"),

        heading3("2.2.3  数据表结构"),
        para("数据库名称：253254，字符集：UTF-8"),
        para(""),
        // emp表
        para([{ text: "表1：emp（员工信息表）", bold: true }]),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2000, 1500, 1200, 400, 1200, 2726],
          rows: [
            makeRow(["字段名", "数据类型", "长度", "允许空", "约束", "说明"], { widths: [2000, 1500, 1200, 400, 1200, 2726], shading: "D9E2F3" }),
            makeRow(["emp_id", "INT", "11", "否", "主键 自增", "员工编号"], { widths: [2000, 1500, 1200, 400, 1200, 2726], shading: "FFFFFF" }),
            makeRow(["emp_name", "VARCHAR", "50", "否", "", "员工姓名"], { widths: [2000, 1500, 1200, 400, 1200, 2726], shading: "F2F6FC" }),
            makeRow(["emp_tel", "VARCHAR", "20", "是", "", "联系电话"], { widths: [2000, 1500, 1200, 400, 1200, 2726], shading: "FFFFFF" }),
            makeRow(["emp_no", "INT", "11", "否", "", "工号"], { widths: [2000, 1500, 1200, 400, 1200, 2726], shading: "F2F6FC" }),
            makeRow(["emp_addr", "VARCHAR", "100", "是", "", "地址"], { widths: [2000, 1500, 1200, 400, 1200, 2726], shading: "FFFFFF" }),
            makeRow(["emp_salary", "INT", "11", "是", "", "薪资"], { widths: [2000, 1500, 1200, 400, 1200, 2726], shading: "F2F6FC" }),
            makeRow(["type_id", "INT", "11", "是", "外键", "员工类型ID"], { widths: [2000, 1500, 1200, 400, 1200, 2726], shading: "FFFFFF" }),
          ]
        }),
        para(""),
        // emp_type表
        para([{ text: "表2：emp_type（员工类型表）", bold: true }]),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2000, 1500, 1200, 400, 1200, 2726],
          rows: [
            makeRow(["字段名", "数据类型", "长度", "允许空", "约束", "说明"], { widths: [2000, 1500, 1200, 400, 1200, 2726], shading: "D9E2F3" }),
            makeRow(["type_id", "INT", "11", "否", "主键 自增", "类型编号"], { widths: [2000, 1500, 1200, 400, 1200, 2726], shading: "FFFFFF" }),
            makeRow(["type_name", "VARCHAR", "50", "否", "", "类型名称"], { widths: [2000, 1500, 1200, 400, 1200, 2726], shading: "F2F6FC" }),
          ]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ============ 第3章 系统实现 ============
        heading1("第3章  系统实现"),
        para(""),
        heading2("3.1  JDBC数据库连接技术"),
        para("系统使用JDBC（Java Database Connectivity）作为Java与MySQL数据库之间的桥梁。JDBC操作数据库遵循标准的五步流程："),
        para(""),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [1000, 1500, 2880, 3646],
          rows: [
            makeRow(["步骤", "关键词", "对应代码", "说明"], { widths: [1000, 1500, 2880, 3646], shading: "D9E2F3" }),
            makeRow(["1", "加载驱动", "Class.forName(\"com.mysql.cj.jdbc.Driver\")", "注册MySQL驱动（新版JDBC可省略）"], { widths: [1000, 1500, 2880, 3646], shading: "FFFFFF" }),
            makeRow(["2", "获取连接", "DriverManager.getConnection(url,user,password)", "建立TCP连接到MySQL服务器"], { widths: [1000, 1500, 2880, 3646], shading: "F2F6FC" }),
            makeRow(["3", "创建语句", "conn.prepareStatement(sql)", "预编译SQL语句，防止SQL注入"], { widths: [1000, 1500, 2880, 3646], shading: "FFFFFF" }),
            makeRow(["4", "执行SQL", "executeUpdate() / executeQuery()", "增删改用executeUpdate，查询用executeQuery"], { widths: [1000, 1500, 2880, 3646], shading: "F2F6FC" }),
            makeRow(["5", "释放资源", "conn.close() / try-with-resources", "自动关闭Connection/Statement/ResultSet"], { widths: [1000, 1500, 2880, 3646], shading: "FFFFFF" }),
          ]
        }),
        para(""),
        para("系统在DBUtil工具类中封装了第1~2步和第5步，使DAO层代码可以专注编写SQL与参数设置。配置信息（URL、用户名、密码）统一存放在DBConfig接口中，遵循"配置与逻辑分离"的原则。"),
        para("为保障数据库安全，系统全面使用PreparedStatement预编译语句代替Statement字符串拼接，有效防止SQL注入攻击。在资源管理方面，JDBC连接的获取和释放遵循try-with-resources模式，确保即使在SQL执行异常的情况下，数据库连接也能被正确关闭，避免连接泄漏。"),

        heading2("3.2  DAO设计模式"),
        heading3("3.2.1  泛型DAO接口"),
        para("系统定义了一个泛型接口DAO<T>，作为所有数据访问对象的统一契约："),
        codePara("public interface DAO<T> {"),
        codePara("    int add(T t) throws Exception;              // 增加"),
        codePara("    int delete(int id) throws Exception;         // 删除"),
        codePara("    int update(T t) throws Exception;            // 修改"),
        codePara("    T queryById(int id) throws Exception;        // 按ID查询"),
        codePara("    List<T> queryAll(int pageNum, int pageSize) throws Exception; // 分页查询"),
        codePara("}"),
        para("通过泛型参数<T>，同一个接口可以被Emp及EmpType两个实体类复用，避免了为每个表重复定义接口的冗余代码。"),

        heading3("3.2.2  EmpDAO实现"),
        para("EmpDAO实现了DAO<Emp>接口，针对emp表提供完整的CRUD操作。核心方法包括：add()（INSERT插入员工记录）、delete()（DELETE按ID删除）、update()（UPDATE按ID更新）、queryById()（SELECT按ID查询）、queryAll()（分页查询所有员工，使用LIMIT子句）。"),
        para("除接口定义的5个方法外，EmpDAO还扩展了3个辅助方法：findAll()（查询全部员工不分页）、checkEmpNo()（检查工号是否重复，使用SELECT COUNT(*)）、getMaxEmpNo()（获取当前最大工号，使用SELECT MAX(emp_no)用于新增时自动编号）。"),

        heading3("3.2.3  EmpTypeDAO实现"),
        para("EmpTypeDAO实现了DAO<EmpType>接口，操作emp_type表。提供了add()、delete()、update()、queryById()、queryAll()五个标准方法，使用PreparedStatement预编译SQL语句并安全设置参数。"),

        heading3("3.2.4  继承体系设计"),
        para("系统在菜单层引入了继承架构来统一管理用户输入。SysMenu作为所有菜单类的父类，封装了Scanner对象和choice()方法。EmpSystem（系统主菜单）、EmpMenu（员工管理子菜单）、EmpTypeMenu（类型管理子菜单）和StatisMenu（统计子菜单）均继承自SysMenu，通过run()方法来展示各自的菜单项，通过调用父类的choice()方法获取用户输入选择，实现了代码的复用和结构的统一。"),
        para("系统入口类Test.main()创建EmpSystem实例并调用其run()方法，启动整个系统的运行。主菜单通过switch-case结构将用户选择分发到对应的子菜单，形成了清晰的菜单层级导航：主菜单 →（员工管理 / 类型管理 / 统计）→ 具体操作。"),
        new Paragraph({ children: [new PageBreak()] }),

        // ============ 结束语 ============
        heading1("第4章  结束语"),
        para(""),
        para("通过本次软件开发实践，我完成了一个完整的员工管理系统，从需求分析、数据库设计到编码实现和功能测试，完整地体验了软件开发的各个阶段。在这个过程中，我主要收获了以下几点："),
        para(""),
        para([{ text: "1. 掌握了JDBC数据库编程技术。", bold: true }, { text: "通过实践深入理解了JDBC五步流程、PreparedStatement预编译语句的使用、ResultSet结果集的处理以及try-with-resources自动资源管理的优势。" }], { indent: true }),
        para([{ text: "2. 理解了分层架构和DAO设计模式。", bold: true }, { text: "通过将系统划分为entity、dao、ds、service、menu等多个层次，深刻体会到"高内聚、低耦合"的架构优势。DAO泛型接口的设计让我理解了面向接口编程的价值——调用方只依赖接口约定，不关心底层实现细节。" }], { indent: true }),
        para([{ text: "3. 掌握了面向对象编程的核心思想。", bold: true }, { text: "从继承（SysMenu基类体系）、泛型（DAO<T>）、接口（面向接口编程）到Lombok注解简化代码，在实践中巩固了Java面向对象的各项关键技术。" }], { indent: true }),
        para([{ text: "4. 提升了问题分析与解决能力。", bold: true }, { text: "在开发过程中遇到了数据库连接失败、SQL语法错误、资源泄漏等问题，通过查阅资料和调试逐步解决，培养了独立分析和解决问题的习惯。" }], { indent: true }),
        para(""),
        para("同时，本系统也存在一些不足之处：目前仅支持控制台操作界面，后续可以考虑增加图形用户界面（GUI）或Web界面；Service层的业务逻辑校验还不够完善；系统中尚未实现事务管理机制，在涉及多表操作的场景下可能存在数据一致性问题。这些都是在今后学习中需要继续深入的方向。"),
        para(""),
        para("总之，本次实践课题让我将课堂所学的Java基础知识、数据库原理和软件工程方法综合运用到了实际项目中，加深了对软件开发全流程的理解，为今后的学习和职业发展打下了坚实的基础。"),
        new Paragraph({ children: [new PageBreak()] }),

        // ============ 参考文献 ============
        heading1("参考文献"),
        para(""),
        para("[01] 林信良. Java学习笔记 JDK9 [M]. 北京: 清华大学出版社, 2018.6"),
        para("[02] 李辉. 数据库原理与应用基础(MySQL) [M]. 北京: 高等教育出版社, 2019.8"),
        para("[03] 张帆等. Java范例开发大全 [M]. 北京: 清华大学出版社, 2010.6"),
      ]
    }
  ]
});

function makeRow(cells, opts = {}) {
  return new TableRow({
    children: cells.map((c, i) => makeCell(c, {
      cellWidth: opts.widths[i],
      shading: opts.shading,
      size: 20,
      alignment: i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
      bold: i === 0 && opts.shading === "D9E2F3"
    }))
  });
}

// ========== 输出 ==========
const outputPath = "E:\\我的桌面\\员工管理系统实践报告_马康博.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("文档已生成：" + outputPath);
});
