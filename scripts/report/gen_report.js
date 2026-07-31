const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat,
  TableOfContents
} = require("docx");

// Default fonts per template: Western=Times New Roman, Chinese=宋体 (SimSong)
// Headings: Western=Arial, Chinese=黑体 (SimHei)
// Sizes: 三号=32halfPt(16pt), 四号=28halfPt(14pt), 小四=24halfPt(12pt)
// Line spacing: 1.5倍 = 360 (auto), 首行缩进: 2字符 = 480
const FONT_BODY_W = "Times New Roman";
const FONT_BODY_E = "宋体";
const FONT_HEAD_W = "Arial";
const FONT_HEAD_E = "黑体";

// Body text run
const R = (text, opts = {}) => new TextRun(Object.assign({
  text, size: 24, font: { eastAsia: FONT_BODY_E, ascii: FONT_BODY_W, hAnsi: FONT_BODY_W }
}, opts));
// Bold body text run
const B = (text, opts = {}) => new TextRun(Object.assign({
  text, size: 24, bold: true, font: { eastAsia: FONT_BODY_E, ascii: FONT_BODY_W, hAnsi: FONT_BODY_W }
}, opts));
// Heading run with proper fonts
const RH = (text, opts = {}) => new TextRun(Object.assign({
  text, font: { eastAsia: FONT_HEAD_E, ascii: FONT_HEAD_W, hAnsi: FONT_HEAD_W }
}, opts));

const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border };
const cm = { top: 50, bottom: 50, left: 80, right: 80 };

// Body paragraph: 段前段后0, 行距1.5倍(360), 首行缩进2字符(480)
function P(content, opts = {}) {
  let runs = [];
  if (typeof content === "string") {
    runs = [R(content)];
  } else {
    runs = content.map(c => (typeof c === "string" ? R(c) : c));
  }
  return new Paragraph({
    spacing: Object.assign({ after: 0, before: 0, line: 360, lineRule: "auto" }, opts.spacing || {}),
    indent: opts.indent === false ? {} : { firstLine: 480 },
    alignment: opts.alignment || undefined,
    children: runs
  });
}

// 一级标题：章标题，三号(32), 黑体+Arial, 加粗, 居中, 段前段后1行
function H1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 240 },
    alignment: AlignmentType.CENTER,
    children: [RH(text, { bold: true, size: 32 })]
  });
}

// 二级标题：四号(28), 黑体+Arial, 加粗, 段前段后0.5行
function H2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 120, after: 120 },
    children: [RH(text, { bold: true, size: 28 })]
  });
}

// 三级标题：小四(24), 黑体+Arial, 加粗
function H3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 60, after: 60 },
    children: [RH(text, { bold: true, size: 24 })]
  });
}

function Code(text) {
  return new Paragraph({
    spacing: { after: 0, before: 0, line: 280 },
    shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
    indent: { left: 360 },
    children: [new TextRun({ text, font: "Consolas", size: 18 })]
  });
}

function Bul(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 0, before: 0, line: 360 },
    children: [R(text)]
  });
}

function Cell(text, opts = {}) {
  return new TableCell({
    borders,
    margins: cm,
    width: { size: opts.w || 2000, type: WidthType.DXA },
    shading: opts.s ? { fill: opts.s, type: ShadingType.CLEAR } : undefined,
    verticalAlign: "center",
    children: [new Paragraph({
      spacing: { after: 0, before: 0 },
      alignment: opts.a || (opts.s ? AlignmentType.CENTER : AlignmentType.LEFT),
      children: [R(text, { size: 20, bold: !!opts.b })]
    })]
  });
}

function Row(cells, w, s) {
  return new TableRow({
    children: cells.map((c, i) => Cell(c, { w: w[i], s: s, b: s === "D9E2F3" && i === 0 }))
  });
}

// ---------- DOCUMENT CONTENT ----------
const T = "员工管理系统的设计与实现"; // title

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { size: 24, font: { ascii: "Times New Roman", hAnsi: "Times New Roman", eastAsia: "宋体" } },
        paragraph: { spacing: { after: 0, before: 0, line: 360, lineRule: "auto" } }
      }
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: { ascii: "Arial", hAnsi: "Arial", eastAsia: "黑体" } },
        paragraph: { spacing: { before: 240, after: 240 }, outlineLevel: 0, alignment: AlignmentType.CENTER } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: { ascii: "Arial", hAnsi: "Arial", eastAsia: "黑体" } },
        paragraph: { spacing: { before: 120, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: { ascii: "Arial", hAnsi: "Arial", eastAsia: "黑体" } },
        paragraph: { spacing: { before: 60, after: 60 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [
    // ==================== COVER PAGE ====================
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1331, right: 1134, bottom: 1134, left: 1418 } }
      },
      children: [
        P("", { indent: false }), P("", { indent: false }), P("", { indent: false }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [R("软 件 学 院", { bold: true, size: 78, font: "隶书" })]
        }),
        P("", { indent: false }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [R("实践环节报告", { bold: true, size: 84, font: "隶书" })]
        }),
        P("", { indent: false }), P("", { indent: false }), P("", { indent: false }),
        P("", { indent: false }), P("", { indent: false }), P("", { indent: false }),

        // Info lines
        ...coverLine("课程名称", "软件开发实践一"),
        ...coverLine("课题名称", T),
        ...coverLine("专    业", "软件工程"),
        ...coverLine("班    级", "RB软工融253"),
        ...coverLine("学    号", "202532044314"),
        ...coverLine("学生姓名", "马康博"),
        ...coverLine("指导教师", "王海龙"),

        P("", { indent: false }), P("", { indent: false }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            R("2026", { size: 28, bold: true, font: "宋体" }),
            R("年", { size: 28, bold: true, font: "宋体" }),
            R("7", { size: 28, bold: true }),
            R("月", { size: 28, bold: true, font: "宋体" }),
            R("3", { size: 28, bold: true }),
            R("日", { size: 28, bold: true, font: "宋体" }),
          ]
        }),
      ]
    },

    // ==================== MAIN BODY ====================
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1418, right: 1134, bottom: 1134, left: 1418 } }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [R("中原工学院软件学院  软件开发实践一设计任务书", { size: 18, color: "888888" })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [R("第 ", { size: 18 }), new TextRun({ children: [PageNumber.CURRENT], size: 18 }), R(" 页", { size: 18 })]
          })]
        })
      },
      children: [
        // Task Book
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { before: 100, after: 100 },
          children: [R("中原工学院软件学院", { bold: true, size: 32 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 300 },
          children: [R("软件开发实践一设计任务书", { bold: true, size: 44 })]
        }),

        // Task table
        new Table({
          width: { size: 9350, type: WidthType.DXA },
          columnWidths: [933, 1769, 6648],
          rows: [
            Row(["姓 名", "马康博", "软件工程  专业  RB软工融253  班"], [933, 1769, 6648], "F2F2F2"),
            Row(["题 目", "", T], [933, 1769, 6648], "F2F2F2"),
            // Design task
            new TableRow({
              height: { value: 3700, rule: "atLeast" },
              children: [
                Cell("设\n计\n任\n务", { w: 933, s: "F2F2F2", b: true }),
                new TableCell({
                  borders, margins: cm,
                  columnSpan: 2,
                  width: { size: 8417, type: WidthType.DXA },
                  children: [
                    P([R("设计开发一个员工管理系统，主要功能包括：员工信息的增删改查、员工类型管理、员工信息统计。系统采用Java控制台应用形式，使用JDBC连接MySQL数据库，采用DAO设计模式实现数据访问分层架构。", { size: 22 })], { indent: true }),
                    P([R("1. 设计数据库表结构（emp员工表、emp_type员工类型表），建立外键关联", { size: 22 })], { indent: true }),
                    P([R("2. 实现DAO泛型接口及JDBC实现类，完成数据库CRUD操作", { size: 22 })], { indent: true }),
                    P([R("3. 实现Service业务层和Menu菜单层，完成用户交互界面", { size: 22 })], { indent: true }),
                    P([R("4. 实现系统主控制层（EmpSystem），整合各模块形成完整系统", { size: 22 })], { indent: true }),
                    P([B("(独立完成)", { size: 22 })], { indent: true }),
                    P([R("开发工具：IntelliJ IDEA、JDK 25、Maven、MySQL 8.0", { size: 22 })], { indent: true }),
                  ]
                })
              ]
            }),
            // Time progress
            new TableRow({
              height: { value: 2800, rule: "atLeast" },
              children: [
                Cell("时\n间\n进\n度", { w: 933, s: "F2F2F2", b: true }),
                new TableCell({
                  borders, margins: cm,
                  columnSpan: 2,
                  width: { size: 8417, type: WidthType.DXA },
                  children: [
                    P([R("第1周（2026-06-22 ~ 2026-06-26）：完成员工管理系统需求分析、系统分析与设计、数据库设计与实现等，完成DAO模式对数据库代码的编写。", { size: 22 })], { indent: true }),
                    P([R("第2周（2026年6月29日 ~ 2026年7月3日）：完成了多层模式中Service代码的编写，完成了Menu菜单的编写，完成了对员工管理系统的功能测试。", { size: 22 })], { indent: true }),
                  ]
                })
              ]
            }),
            // References
            new TableRow({
              height: { value: 3200, rule: "atLeast" },
              children: [
                Cell("原 始 要\n参 考 资\n料 与 文\n    献", { w: 933, s: "F2F2F2", b: true }),
                new TableCell({
                  borders, margins: cm,
                  columnSpan: 2,
                  width: { size: 8417, type: WidthType.DXA },
                  children: [
                    P([R("[01] 林信良. Java学习笔记 JDK9 [M]. 北京: 清华大学出版社, 2018.6", { size: 22 })], { indent: false }),
                    P([R("[02] 李辉. 数据库原理与应用基础(MySQL) [M]. 北京: 高等教育出版社, 2019.8", { size: 22 })], { indent: false }),
                    P([R("[03] 张帆等. Java范例开发大全 [M]. 北京: 清华大学出版社, 2010.6", { size: 22 })], { indent: false }),
                  ]
                })
              ]
            }),
          ]
        }),

        // Signature
        P("", { indent: false }),
        P([R("指导教师签字：                            ", { bold: true, size: 22 }), R("2026    年    7  月  3  日", { bold: true, size: 22 })], { indent: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // ===== Abstract =====
        H1("摘  要"),
        P(""),
        P([R("本系统是一个基于"), B("Java控制台"), R("的员工管理系统，采用"), B("JDBC + MySQL"), R("技术栈实现数据的持久化存储。系统围绕企业员工管理的核心需求，实现了员工信息的增删改查（CRUD）、员工类型分类管理以及多维度数据统计功能。在架构设计上，采用"), B("DAO设计模式"), R("与分层架构（Entity实体层 -> DAO数据访问层 -> Service业务层 -> Menu菜单层 -> System控制层），通过泛型接口DAO<T>实现代码复用，降低了各模块之间的耦合度。系统使用Lombok简化实体类代码，使用PreparedStatement防止SQL注入，并通过try-with-resources确保数据库资源的安全释放。用户通过控制台菜单交互，操作直观简洁。")], { indent: true }),
        P(""),
        P([B("关键词：", { font: "黑体" }), R("Java；MySQL；JDBC；DAO设计模式；员工管理系统")], { indent: true }),
        new Paragraph({ children: [new PageBreak()] }),

        // ===== TOC =====
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 300 },
          children: [R("目  录", { bold: true, size: 36, font: "黑体" })]
        }),
        new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ===== Chapter 1: Requirements =====
        H1("第1章  需求分析"),
        P(""),
        H2("1.1  系统目标"),
        P("本系统旨在为企业人力资源管理部门提供一个轻量级的员工信息管理工具，能够在控制台环境下完成员工信息的录入、修改、删除、查询以及统计分析等日常操作，提高管理效率，降低人工管理的错误率。"),
        P("具体目标包括：①建立员工信息的电子化档案，替代传统的纸质或Excel管理方式；②通过员工类型分类，支持对不同类别员工的分组管理；③提供多维度统计功能，为管理人员提供数据决策支持。"),

        H2("1.2  功能需求"),
        H3("1.2.1  员工管理模块"),
        Bul("添加员工：录入员工姓名、电话、工号、地址、薪资，并选择所属类型"),
        Bul("删除员工：根据员工ID删除指定员工记录"),
        Bul("修改员工：根据员工ID更新员工的所有字段信息"),
        Bul("查询员工：支持按ID精确查询，支持分页查询全部员工"),
        Bul("工号唯一性校验：新增员工时自动检查工号是否重复"),
        Bul("工号自动生成：获取当前最大工号，辅助新增时自动编号"),

        H3("1.2.2  员工类型管理模块"),
        Bul("添加类型：新增员工类型（如“经理”“职员”“实习生”等）"),
        Bul("删除类型：删除指定类型（需校验该类型下是否有员工）"),
        Bul("修改类型：更新类型的名称"),
        Bul("查询类型：按ID查询单个类型，分页查询全部类型"),

        H3("1.2.3  统计功能模块"),
        Bul("统计员工总数"),
        Bul("统计员工工资总额"),
        Bul("计算员工平均薪资"),
        Bul("按员工类型分组统计工资总额"),
        Bul("按员工类型分组统计平均薪资"),

        H2("1.3  用户角色"),
        P("系统面向单一管理员角色，无需登录认证。管理员通过控制台菜单选择功能编号，系统读取输入后调用相应的Service层逻辑完成操作。"),
        new Paragraph({ children: [new PageBreak()] }),

        // ===== Chapter 2: Design =====
        H1("第2章  系统设计"),
        P(""),
        H2("2.1  系统设计思路"),
        P("本系统采用经典的分层架构设计，遵循“高内聚、低耦合”的原则，将系统从上到下划分为五个层次："),
        P(""),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [1800, 2500, 4726],
          rows: [
            Row(["层次", "包路径", "职责"], [1800, 2500, 4726], "D9E2F3"),
            Row(["实体层", "entity", "定义数据载体类（Emp、EmpType），使用Lombok注解自动生成getter/setter，与数据库表一一对应"], [1800, 2500, 4726], "FFFFFF"),
            Row(["数据访问层", "dao + dao.impl", "DAO<T>泛型接口定义CRUD契约；EmpDAO/EmpTypeDAO使用JDBC实现具体数据库操作"], [1800, 2500, 4726], "F2F6FC"),
            Row(["工具层", "ds", "DBConfig存储数据库连接配置；DBUtil封装Connection获取与资源释放"], [1800, 2500, 4726], "FFFFFF"),
            Row(["业务层", "service", "EmpService/EmpTypeService处理业务逻辑校验，调用DAO完成操作"], [1800, 2500, 4726], "F2F6FC"),
            Row(["表现层", "menu + system", "SysMenu为菜单基类（封装Scanner输入）；各Menu子类展示功能菜单；EmpSystem为系统主入口控制器"], [1800, 2500, 4726], "FFFFFF"),
          ]
        }),
        P(""),
        P("Menu层采用继承体系：SysMenu作为抽象基类提供choice()方法获取用户输入，EmpSystem（主菜单）、EmpMenu（员工管理子菜单）、EmpTypeMenu（类型管理子菜单）、StatisMenu（统计子菜单）均继承自SysMenu。"),

        H2("2.2  数据库设计"),
        H3("2.2.1  E-R图"),
        P("系统包含两个实体：员工（Emp）和员工类型（EmpType）。二者之间为多对一关系：一个员工类型下可以有多个员工，一个员工只能属于一种员工类型。"),
        P(""),
        P([B("Emp"), R(" —— 包含属性：员工ID（emp_id，主键）、姓名（emp_name）、电话（emp_tel）、工号（emp_no）、地址（emp_addr）、薪资（emp_salary）、类型ID（type_id，外键）")], { indent: false }),
        P([B("EmpType"), R(" —— 包含属性：类型ID（type_id，主键）、类型名称（type_name）")], { indent: false }),

        H3("2.2.2  关系模式"),
        P("Emp (emp_id, emp_name, emp_tel, emp_no, emp_addr, emp_salary, type_id)"),
        P("　主键：emp_id　外键：type_id REFERENCES EmpType(type_id)"),
        P(""),
        P("EmpType (type_id, type_name)"),
        P("　主键：type_id"),

        H3("2.2.3  数据表结构"),
        P("数据库名称：253254，字符集：UTF-8"),
        P(""),
        P([B("表1：emp（员工信息表）")]),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2000, 1500, 1200, 400, 1200, 2726],
          rows: [
            Row(["字段名", "数据类型", "长度", "允许空", "约束", "说明"], [2000, 1500, 1200, 400, 1200, 2726], "D9E2F3"),
            Row(["emp_id", "INT", "11", "否", "主键 自增", "员工编号"], [2000, 1500, 1200, 400, 1200, 2726], "FFFFFF"),
            Row(["emp_name", "VARCHAR", "50", "否", "", "员工姓名"], [2000, 1500, 1200, 400, 1200, 2726], "F2F6FC"),
            Row(["emp_tel", "VARCHAR", "20", "是", "", "联系电话"], [2000, 1500, 1200, 400, 1200, 2726], "FFFFFF"),
            Row(["emp_no", "INT", "11", "否", "", "工号"], [2000, 1500, 1200, 400, 1200, 2726], "F2F6FC"),
            Row(["emp_addr", "VARCHAR", "100", "是", "", "地址"], [2000, 1500, 1200, 400, 1200, 2726], "FFFFFF"),
            Row(["emp_salary", "INT", "11", "是", "", "薪资"], [2000, 1500, 1200, 400, 1200, 2726], "F2F6FC"),
            Row(["type_id", "INT", "11", "是", "外键", "员工类型ID"], [2000, 1500, 1200, 400, 1200, 2726], "FFFFFF"),
          ]
        }),
        P(""),
        P([B("表2：emp_type（员工类型表）")]),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2000, 1500, 1200, 400, 1200, 2726],
          rows: [
            Row(["字段名", "数据类型", "长度", "允许空", "约束", "说明"], [2000, 1500, 1200, 400, 1200, 2726], "D9E2F3"),
            Row(["type_id", "INT", "11", "否", "主键 自增", "类型编号"], [2000, 1500, 1200, 400, 1200, 2726], "FFFFFF"),
            Row(["type_name", "VARCHAR", "50", "否", "", "类型名称"], [2000, 1500, 1200, 400, 1200, 2726], "F2F6FC"),
          ]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ===== Chapter 3: Implementation =====
        H1("第3章  系统实现"),
        P(""),
        H2("3.1  JDBC数据库连接技术"),
        P("系统使用JDBC（Java Database Connectivity）作为Java与MySQL数据库之间的桥梁。JDBC操作数据库遵循标准的五步流程："),
        P(""),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [1000, 1500, 2880, 3646],
          rows: [
            Row(["步骤", "关键词", "对应代码", "说明"], [1000, 1500, 2880, 3646], "D9E2F3"),
            Row(["1", "加载驱动", "Class.forName(...)", "注册MySQL驱动（新版JDBC可省略）"], [1000, 1500, 2880, 3646], "FFFFFF"),
            Row(["2", "获取连接", "DriverManager.getConnection(url,user,password)", "建立TCP连接到MySQL服务器"], [1000, 1500, 2880, 3646], "F2F6FC"),
            Row(["3", "创建语句", "conn.prepareStatement(sql)", "预编译SQL语句，防止SQL注入"], [1000, 1500, 2880, 3646], "FFFFFF"),
            Row(["4", "执行SQL", "executeUpdate() / executeQuery()", "增删改用executeUpdate，查询用executeQuery"], [1000, 1500, 2880, 3646], "F2F6FC"),
            Row(["5", "释放资源", "conn.close() / try-with-resources", "自动关闭Connection/Statement/ResultSet"], [1000, 1500, 2880, 3646], "FFFFFF"),
          ]
        }),
        P(""),
        P("系统在DBUtil工具类中封装了第1~2步和第5步，使DAO层代码可以专注编写SQL与参数设置。配置信息（URL、用户名、密码）统一存放在DBConfig接口中，遵循“配置与逻辑分离”的原则。"),
        P("为保障数据库安全，系统全面使用PreparedStatement预编译语句代替Statement字符串拼接，有效防止SQL注入攻击。在资源管理方面，JDBC连接的获取和释放遵循try-with-resources模式，确保即使在SQL执行异常的情况下，数据库连接也能被正确关闭，避免连接泄漏。"),

        H2("3.2  DAO设计模式"),
        H3("3.2.1  泛型DAO接口"),
        P("系统定义了一个泛型接口DAO<T>，作为所有数据访问对象的统一契约："),
        Code("public interface DAO<T> {"),
        Code("    int add(T t) throws Exception;              // 增加"),
        Code("    int delete(int id) throws Exception;         // 删除"),
        Code("    int update(T t) throws Exception;            // 修改"),
        Code("    T queryById(int id) throws Exception;        // 按ID查询"),
        Code("    List<T> queryAll(int pageNum, int pageSize) throws Exception; // 分页查询"),
        Code("}"),
        P("通过泛型参数<T>，同一个接口可以被Emp及EmpType两个实体类复用，避免了为每个表重复定义接口的冗余代码。"),

        H3("3.2.2  EmpDAO实现"),
        P("EmpDAO实现了DAO<Emp>接口，针对emp表提供完整的CRUD操作。核心方法包括：add()（INSERT插入员工记录）、delete()（DELETE按ID删除）、update()（UPDATE按ID更新）、queryById()（SELECT按ID查询）、queryAll()（分页查询所有员工，使用LIMIT子句）。"),
        P("除接口定义的5个方法外，EmpDAO还扩展了3个辅助方法：findAll()（查询全部员工不分页）、checkEmpNo()（检查工号是否重复，使用SELECT COUNT(*)）、getMaxEmpNo()（获取当前最大工号，使用SELECT MAX(emp_no)用于新增时自动编号）。"),

        H3("3.2.3  EmpTypeDAO实现"),
        P("EmpTypeDAO实现了DAO<EmpType>接口，操作emp_type表。提供了add()、delete()、update()、queryById()、queryAll()五个标准方法，使用PreparedStatement预编译SQL语句并安全设置参数。"),

        H3("3.2.4  继承体系设计"),
        P("系统在菜单层引入了继承架构来统一管理用户输入。SysMenu作为所有菜单类的父类，封装了Scanner对象和choice()方法。EmpSystem（系统主菜单）、EmpMenu（员工管理子菜单）、EmpTypeMenu（类型管理子菜单）和StatisMenu（统计子菜单）均继承自SysMenu，通过run()方法来展示各自的菜单项，通过调用父类的choice()方法获取用户输入选择，实现了代码的复用和结构的统一。"),
        P("系统入口类Test.main()创建一个EmpSystem实例并调用其run()方法，启动整个系统的运行。主菜单通过switch-case结构将用户选择分发到对应的子菜单，形成了清晰的菜单层级导航：主菜单 -> (员工管理 / 类型管理 / 统计) -> 具体操作。"),
        new Paragraph({ children: [new PageBreak()] }),

        // ===== Chapter 4: Conclusion =====
        H1("第4章  结束语"),
        P(""),
        P("通过本次软件开发实践，我完成了一个完整的员工管理系统，从需求分析、数据库设计到编码实现和功能测试，完整地体验了软件开发的各个阶段。在这个过程中，我主要收获了以下几点："),
        P(""),
        P([B("1. 掌握了JDBC数据库编程技术。"), R("通过实践深入理解了JDBC五步流程、PreparedStatement预编译语句的使用、ResultSet结果集的处理以及 try-with-resources自动资源管理的优势。")], { indent: true }),
        P([B("2. 理解了分层架构和DAO设计模式。"), R("通过将系统划分为entity、dao、ds、service、menu等多个层次，深刻体会到“高内聚、低耦合”的架构优势。DAO泛型接口的设计让我理解了面向接口编程的价值——调用方只依赖接口约定，不关心底层实现细节。")], { indent: true }),
        P([B("3. 掌握了面向对象编程的核心思想。"), R("从继承（SysMenu基类体系）、泛型（DAO<T>）、接口（面向接口编程）到Lombok注解简化代码，在实践中巩固了Java面向对象的各项关键技术。")], { indent: true }),
        P([B("4. 提升了问题分析与解决能力。"), R("在开发过程中遇到了数据库连接失败、SQL语法错误、资源泄漏等问题，通过查阅资料和调试逐步解决，培养了独立分析和解决问题的习惯。")], { indent: true }),
        P(""),
        P("同时，本系统也存在一些不足之处：目前仅支持控制台操作界面，后续可以考虑增加图形用户界面（GUI）或Web界面；Service层的业务逻辑校验还不够完善；系统中尚未实现事务管理机制，在涉及多表操作的场景下可能存在数据一致性问题。这些都是在今后学习中需要继续深入的方向。"),
        P(""),
        P("总之，本次实践课题让我将课堂所学的Java基础知识、数据库原理和软件工程方法综合运用到了实际项目中，加深了对软件开发全流程的理解，为今后的学习和职业发展打下了坚实的基础。"),
        new Paragraph({ children: [new PageBreak()] }),

        // ===== References =====
        H1("参考文献"),
        P(""),
        P("[01] 林信良. Java学习笔记 JDK9 [M]. 北京: 清华大学出版社, 2018.6"),
        P("[02] 李辉. 数据库原理与应用基础(MySQL) [M]. 北京: 高等教育出版社, 2019.8"),
        P("[03] 张帆等. Java范例开发大全 [M]. 北京: 清华大学出版社, 2010.6"),
      ]
    }
  ]
});

function coverLine(label, value) {
  return [
    new Paragraph({
      indent: { left: 720, firstLine: 562 },
      spacing: { after: 60, line: 480 },
      children: [
        new TextRun({ text: label + "：", bold: true, size: 28, font: { eastAsia: "黑体", ascii: "黑体", hAnsi: "黑体" } }),
        new TextRun({ text: value, size: 28, font: { eastAsia: "黑体" }, underline: { type: "single" } })
      ]
    })
  ];
}

const outputPath = "E:\\我的桌面\\员工管理系统实践报告_马康博.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("OK: " + outputPath);
});
