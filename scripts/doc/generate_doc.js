const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat,
  TableOfContents, ExternalHyperlink
} = require("docx");

// ========== 工具函数 ==========
const border = { style: BorderStyle.SINGLE, size: 1, color: "AAAAAA" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function heading1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
}
function heading2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
}
function heading3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
}
function para(text, opts = {}) {
  const runs = [];
  if (typeof text === "string") {
    runs.push(new TextRun({ text, ...opts }));
  } else {
    text.forEach(t => runs.push(new TextRun(t)));
  }
  return new Paragraph({ spacing: { after: 120 }, children: runs });
}
function boldPara(text) {
  return para([{ text, bold: true }]);
}
function codeBlock(code) {
  const lines = code.split("\n");
  return lines.map(line =>
    new Paragraph({
      spacing: { after: 0, before: 0 },
      shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
      children: [new TextRun({ text: line || " ", font: "Consolas", size: 18 })]
    })
  );
}
function bullet(text, ref = "bullets") {
  if (typeof text === "string") {
    return new Paragraph({ numbering: { reference: ref, level: 0 }, children: [new TextRun(text)] });
  }
  return new Paragraph({ numbering: { reference: ref, level: 0 }, children: text.map(t => new TextRun(t)) });
}
function numberItem(text, ref = "numbers") {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, children: [new TextRun(text)] });
}

// 表格辅助函数
function makeCell(text, opts = {}) {
  const children = [];
  if (typeof text === "string") {
    children.push(new Paragraph({
      spacing: { after: 0, before: 0 },
      children: [new TextRun({ text, size: 20, ...opts })]
    }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      children.push(new Paragraph({
        spacing: { after: 0, before: 0 },
        children: [new TextRun(typeof t === "string" ? { text: t, size: 20 } : { text: t.text, size: 20, ...t })]
      }));
    });
  }
  return new TableCell({ borders, margins: cellMargins, width: opts.cellWidth || { size: 2340, type: WidthType.DXA }, shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined, children });
}

function makeRow(cells, opts = {}) {
  return new TableRow({ children: cells.map((c, i) => {
    if (typeof c === "string") return makeCell(c, { cellWidth: opts.widths ? { size: opts.widths[i], type: WidthType.DXA } : { size: 2340, type: WidthType.DXA }, shading: opts.shading });
    return c;
  }) });
}

// ========== 文档内容 ==========
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Microsoft YaHei", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Microsoft YaHei", color: "1F4E79" },
        paragraph: { spacing: { before: 360, after: 240 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Microsoft YaHei", color: "2E75B6" },
        paragraph: { spacing: { before: 280, after: 180 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Microsoft YaHei", color: "404040" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets2", levels: [{ level: 0, format: LevelFormat.BULLET, text: "○", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "步骤%1：", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [
    // ==================== 封面 ====================
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        new Paragraph({ spacing: { before: 3600 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Java 项目分层架构", size: 52, bold: true, color: "1F4E79", font: "Microsoft YaHei" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "知识点详解", size: 52, bold: true, color: "1F4E79", font: "Microsoft YaHei" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 600, after: 100 }, children: [new TextRun({ text: "—— 面向初学者的分层学习指南 ——", size: 24, color: "666666", font: "Microsoft YaHei" })] }),
        new Paragraph({ spacing: { before: 1200 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "项目：untitled（Maven + JDBC + MySQL）", size: 22, color: "888888", font: "Microsoft YaHei" })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "2026年6月", size: 22, color: "888888", font: "Microsoft YaHei" })] }),
      ]
    },

    // ==================== 目录页 + 正文 ====================
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            shading: { fill: "F0F4F8", type: ShadingType.CLEAR },
            children: [new TextRun({ text: "Java 项目分层架构知识点详解", size: 18, color: "888888", font: "Microsoft YaHei" })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "第 ", size: 18, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "888888" }), new TextRun({ text: " 页", size: 18, color: "888888" })]
          })]
        })
      },
      children: [
        // ========== 目录 ==========
        new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ========== 第一章：项目总览 ==========
        heading1("第一章  项目总览与架构介绍"),

        heading2("1.1  项目是干什么的？"),
        para("这是一个基于 Maven 的 Java 控制台项目，核心功能是对 MySQL 数据库中的 emp（员工）表进行增删改查（CRUD）操作。它展示了从「原始 JDBC 一把梭」到「三层架构分层解耦」的演进过程。"),

        heading2("1.2  项目目录结构"),
        codeBlock(`src/
├── main/java/org/example/
│   ├── entity/          ← 实体层（数据载体）
│   │   └── Emp.java
│   ├── dao/             ← 数据访问接口层
│   │   ├── DAO.java          （泛型 CRUD 接口）
│   │   └── impl/
│   │       └── EmpDAO.java   （接口的 JDBC 实现）
│   ├── ds/              ← 数据源 / 工具层
│   │   ├── DBConfig.java     （数据库配置常量）
│   │   └── DBUtil.java       （连接管理工具类）
│   ├── App.java          ← 原始 JDBC 测试（未分层版）
│   └── ...
└── test/java/org/example/
    └── AppTest.java      ← 单元测试`),

        heading2("1.3  分层架构图"),
        para("整个项目的调用关系如下："),
        para(""),
        codeBlock(`┌──────────────────────────┐
│    entity / Emp.java      │  ← 数据载体（POJO）
│    对应 emp 表每一行        │
└────────────┬─────────────┘
             │
┌────────────▼─────────────┐
│   dao / DAO.java          │  ← 接口契约
│   dao.impl / EmpDAO.java  │  ← JDBC 实现（干活的地方）
│   (CRUD 操作)              │
└────────────┬─────────────┘
             │ 调用
┌────────────▼─────────────┐
│   ds / DBUtil.java        │  ← 连接获取 & 资源释放
│   ds / DBConfig.java      │  ← 数据库 URL / 账号 / 密码
└──────────────────────────┘`),
        para(""),
        para([{ text: "核心理念：", bold: true }, { text: "上层只关心「做什么」，底层才关心「怎么做」。每个包有明确的职责边界，修改数据库配置时只需改 DBConfig，不会影响 DAO 和实体层。" }]),

        heading2("1.4  你将学到的核心技能全景"),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2000, 3500, 3526],
          rows: [
            makeRow(["层次", "核心知识点", "具体技术"], { widths: [2000, 3500, 3526], shading: "1F4E79" }),
            makeRow(["entity", "面向对象、Lombok、POJO", "Lombok 注解、JavaBean 规范"], { widths: [2000, 3500, 3526], shading: "F0F4F8" }),
            makeRow(["dao", "接口编程、泛型、DAO 模式", "泛型接口、设计模式思想"], { widths: [2000, 3500, 3526] }),
            makeRow(["dao.impl", "JDBC、SQL、异常处理", "try-with-resources、PreparedStatement"], { widths: [2000, 3500, 3526], shading: "F0F4F8" }),
            makeRow(["ds", "静态方法、配置管理", "DriverManager、常量接口"], { widths: [2000, 3500, 3526] }),
            makeRow(["App.java", "JDBC 五步流程", "最原始的数据库操作"], { widths: [2000, 3500, 3526], shading: "F0F4F8" }),
          ]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ========== 第二章：entity 实体层 ==========
        heading1("第二章  entity 实体层"),
        para("位置：src/main/java/org/example/entity/Emp.java"),

        heading2("2.1  这个包是干什么的？"),
        para("Emp 类是一个「数据容器」，它的一行对象对应数据库 emp 表的一行记录。它不包含任何业务逻辑，只有字段和 getter/setter。这种纯粹的数据载体称为 POJO（Plain Old Java Object，普通 Java 对象）。"),
        para([{ text: "类比理解：", bold: true }, { text: "Emp 就像一个快递盒，emp_id、emp_name 等字段就是盒子的不同格子。你从数据库取出一条记录，就相当于把货物装进这个盒子，然后在代码里传递这个盒子。" }]),

        heading2("2.2  涉及的知识点"),

        heading3("2.2.1  Lombok 注解"),
        para("Emp 类用了三个 Lombok 注解来简化代码："),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [1800, 3000, 4226],
          rows: [
            makeRow(["注解", "作用", "等效手写代码量"], { widths: [1800, 3000, 4226], shading: "2E75B6" }),
            makeRow(["@Data", "自动生成所有字段的 getter、setter、toString()、equals()、hashCode()", "约 80+ 行"], { widths: [1800, 3000, 4226], shading: "F0F4F8" }),
            makeRow(["@NoArgsConstructor", "自动生成无参构造方法", "约 5 行"], { widths: [1800, 3000, 4226] }),
            makeRow(["@AllArgsConstructor", "自动生成全参构造方法", "约 10 行"], { widths: [1800, 3000, 4226], shading: "F0F4F8" }),
          ]
        }),
        para(""),
        para([{ text: "如果不用 Lombok：", bold: true }, { text: "这 11 行代码会膨胀到 100+ 行。Lombok 在编译时自动生成字节码，不影响运行效率。使用前需在 pom.xml 中引入依赖并在 IDE 中安装 Lombok 插件。" }]),

        heading3("2.2.2  ORM 映射思想"),
        para("ORM = Object-Relational Mapping（对象关系映射），核心思想是用 Java 对象的字段去对应数据库表的列："),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [3000, 1500, 4526],
          rows: [
            makeRow(["Java 字段（Emp.java）", "类型", "数据库列（emp 表）"], { widths: [3000, 1500, 4526], shading: "2E75B6" }),
            makeRow(["empId", "Integer", "emp_id（INT 主键）"], { widths: [3000, 1500, 4526], shading: "F0F4F8" }),
            makeRow(["empName", "String", "emp_name（VARCHAR）"], { widths: [3000, 1500, 4526] }),
            makeRow(["empTel", "String", "emp_tel（VARCHAR）"], { widths: [3000, 1500, 4526], shading: "F0F4F8" }),
            makeRow(["empNo", "Integer", "emp_no（INT）"], { widths: [3000, 1500, 4526] }),
            makeRow(["empAddr", "String", "emp_addr（VARCHAR）"], { widths: [3000, 1500, 4526], shading: "F0F4F8" }),
            makeRow(["empSalary", "Integer", "emp_salary（INT）"], { widths: [3000, 1500, 4526] }),
            makeRow(["typeId", "Integer", "type_id（INT 外键）"], { widths: [3000, 1500, 4526], shading: "F0F4F8" }),
          ]
        }),
        para(""),
        para([{ text: "命名约定：", bold: true }, { text: "Java 采用驼峰命名（empId），数据库采用下划线命名（emp_id）。实际项目中 MyBatis/MyBatis-Plus 等框架会自动完成这个映射。" }]),

        heading2("2.3  需要掌握的知识与技能"),
        bullet("理解 Java 类与对象的区别（类是模板，对象是实例）"),
        bullet("理解 JavaBean 规范：私有字段 + 公共 getter/setter"),
        bullet("会使用 Lombok @Data、@NoArgsConstructor、@AllArgsConstructor"),
        bullet("理解 ORM 基本思想：字段 ↔ 列的映射关系"),
        bullet("理解包装类型（Integer）与基本类型（int）的区别——数据库字段可能为 NULL"),
        bullet("知道如何为实体类添加 toString() 来方便调试打印"),
        bullet("后续进阶：JPA 注解（@Entity、@Table、@Column）"),

        new Paragraph({ children: [new PageBreak()] }),

        // ========== 第三章：dao 层 ==========
        heading1("第三章  dao 数据访问层（接口）"),
        para("位置：src/main/java/org/example/dao/DAO.java"),

        heading2("3.1  这个包是干什么的？"),
        para("DAO 接口定义了一套通用的 CRUD 操作模板：add（增）、delete（删）、update（改）、query（查单个）、queryAll（查全部）。它只声明「能做哪些操作」，不写具体实现。"),

        heading2("3.2  涉及的知识点"),

        heading3("3.2.1  泛型 T（Type Parameter）"),
        para("DAO<T> 中的 <T> 是 Java 泛型，它让一个接口可以适配多种实体类型："),
        codeBlock(`public interface DAO<T> {         // T 是占位符
    int add(T t);                  // 任何类型都能用
    int delete(int id);
    int update(T t);
    T query(int id);
    List<T> queryAll(int pageNum, int pageSize);
}

// 使用时指定具体类型
public class EmpDAO implements DAO<Emp> { ... }   // T = Emp
// 以后：public class DeptDAO implements DAO<Dept> { ... }  // T = Dept`),
        para(""),
        para([{ text: "好处：", bold: true }, { text: "一套接口定义，N 种实现复用。不用为每个表重复写接口。" }]),

        heading3("3.2.2  面向接口编程"),
        para([{ text: "这是 Java 最重要的编程思想之一。", bold: false }]),
        para("调用方只依赖 DAO<Emp> 接口，不关心底层是 JDBC 还是 MyBatis 还是 Hibernate。以后要换实现方式，只需新建一个实现类（如 EmpDAOMyBatis），原来的调用代码一行都不用改。"),
        para([{ text: "一句话理解：", bold: true }, { text: "调用方和实现方都面向接口签协议，谁都不绑死谁。" }]),

        heading3("3.2.3  DAO 设计模式"),
        para("DAO（Data Access Object）是最经典的企业级设计模式之一。它的核心目标是把数据访问代码集中到一个地方，让业务层和数据库层分离。"),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [3000, 6026],
          rows: [
            makeRow(["层次", "职责"], { widths: [3000, 6026], shading: "2E75B6" }),
            makeRow(["业务层（未来会有的 Service）", "处理业务逻辑：校验、计算、流程"], { widths: [3000, 6026], shading: "F0F4F8" }),
            makeRow(["DAO 层（本项目的 dao 包）", "只负责数据库 CRUD，不关心业务"], { widths: [3000, 6026] }),
            makeRow(["数据库", "存储数据"], { widths: [3000, 6026], shading: "F0F4F8" }),
          ]
        }),

        heading2("3.3  需要掌握的知识与技能"),
        bullet("理解泛型：<T> 的含义，泛型接口的实现方式"),
        bullet("理解面向接口编程：接口 = 合约，实现类 = 履约"),
        bullet("理解 List<T> 返回值：为什么查多条记录返回 List"),
        bullet("理解分页参数：pageNum（第几页）、pageSize（每页几条）"),
        bullet("理解 DAO 设计模式的目标：数据库操作与业务逻辑分离"),
        bullet("知道如何为新表（如 Dept）复用 DAO<T> 接口"),

        new Paragraph({ children: [new PageBreak()] }),

        // ========== 第四章：dao.impl 层 ==========
        heading1("第四章  dao.impl DAO 实现层"),
        para("位置：src/main/java/org/example/dao/impl/EmpDAO.java"),
        para([{ text: "这是整个项目最核心、代码量最大的层次，也是初学者最需要吃透的地方。", bold: true }]),

        heading2("4.1  涉及的知识点"),

        heading3("4.1.1  JDBC 编程基础"),
        para("JDBC（Java Database Connectivity）是 Java 操作数据库的标准 API。操作数据库有统一的五步流程："),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [1500, 2300, 3000, 2226],
          rows: [
            makeRow(["步骤", "关键词", "代码", "说明"], { widths: [1500, 2300, 3000, 2226], shading: "2E75B6" }),
            makeRow(["Step 1", "加", "Class.forName(\"com.mysql.cj.jdbc.Driver\")", "加载 MySQL 驱动类"], { widths: [1500, 2300, 3000, 2226], shading: "F0F4F8" }),
            makeRow(["Step 2", "连", "DriverManager.getConnection(url, user, pwd)", "获取数据库连接"], { widths: [1500, 2300, 3000, 2226] }),
            makeRow(["Step 3", "语", "conn.prepareStatement(sql)", "预编译 SQL 语句"], { widths: [1500, 2300, 3000, 2226], shading: "F0F4F8" }),
            makeRow(["Step 4", "执", "pstmt.executeUpdate() / executeQuery()", "执行 SQL"], { widths: [1500, 2300, 3000, 2226] }),
            makeRow(["Step 5", "释", "conn.close() / 各项资源关闭", "释放连接等资源"], { widths: [1500, 2300, 3000, 2226], shading: "F0F4F8" }),
          ]
        }),
        para(""),
        para("在 EmpDAO 中，DBUtil.getConnection() 封装了 Step 1 + Step 2，Step 5 交给 try-with-resources 自动完成。"),

        heading3("4.1.2  PreparedStatement vs Statement"),
        para([{ text: "永远使用 PreparedStatement，不要用 Statement！", bold: true }]),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2500, 6526],
          rows: [
            makeRow(["对比项", "说明"], { widths: [2500, 6526], shading: "2E75B6" }),
            makeRow(["SQL 注入防护", "PreparedStatement 用 ? 占位符 + setXxx() 传参，参数自动转义，防止 SQL 注入攻击。Statement 拼接字符串，极不安全"], { widths: [2500, 6526], shading: "F0F4F8" }),
            makeRow(["性能", "预编译，同一条 SQL 多次执行时更快"], { widths: [2500, 6526] }),
            makeRow(["可读性", "? 占位符清晰标记参数位置，不会出现引号地狱"], { widths: [2500, 6526], shading: "F0F4F8" }),
          ]
        }),

        heading3("4.1.3  executeUpdate vs executeQuery"),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2500, 2000, 4526],
          rows: [
            makeRow(["方法", "适用场景", "返回值"], { widths: [2500, 2000, 4526], shading: "2E75B6" }),
            makeRow(["executeUpdate()", "INSERT / UPDATE / DELETE", "int（受影响行数）"], { widths: [2500, 2000, 4526], shading: "F0F4F8" }),
            makeRow(["executeQuery()", "SELECT 查询", "ResultSet（结果集）"], { widths: [2500, 2000, 4526] }),
          ]
        }),

        heading3("4.1.4  ResultSet 结果集处理"),
        para("executeQuery() 返回的 ResultSet 是一个「游标」，初始指向第 0 行（数据之前）。需要调用 next() 方法逐行下移："),
        codeBlock(`ResultSet rs = pstmt.executeQuery();
while (rs.next()) {                          // 每调用一次，游标下移一行
    int id = rs.getInt("emp_id");           // 按列名取值
    String name = rs.getString("emp_name");
    // 也可以用列序号：rs.getInt(1)、rs.getString(2)
    Emp emp = new Emp(id, name, ...);        // 封装为对象
    list.add(emp);
}`),
        para(""),
        para([{ text: "关键点：", bold: true }, { text: "getXxx() 方法的参数可以是列名（推荐，可读性好）或列序号（从 1 开始，不是 0）。列名不区分大小写。" }]),

        heading3("4.1.5  try-with-resources 自动资源管理"),
        para([{ text: "这是 Java 7 引入的最重要的语法糖之一。", bold: true }]),
        para("任何实现了 AutoCloseable 接口的对象（Connection、PreparedStatement、ResultSet）都可以放在 try 的括号里，代码块执行完毕（包括异常情况）后自动调用 close()。"),
        codeBlock(`// ✅ 现代写法：自动关闭，不会泄露
try (Connection conn = DBUtil.getConnection();
     PreparedStatement pstmt = conn.prepareStatement(sql);
     ResultSet rs = pstmt.executeQuery()) {
    // 处理结果...
}  // conn、pstmt、rs 全部自动关闭，无需手动写 close()

// ❌ 老式写法：容易遗漏，嵌套丑陋
Connection conn = null;
PreparedStatement pstmt = null;
try {
    conn = DBUtil.getConnection();
    pstmt = conn.prepareStatement(sql);
    // ...
} finally {
    if (pstmt != null) pstmt.close();
    if (conn != null) conn.close();
}`),

        heading3("4.1.6  SQL 语句中 ? 占位符的序号"),
        para([{ text: "setXxx() 的参数序号从 1 开始（不是 0）！", bold: true }]),
        para("这一点和 Java 数组的 0-based 索引完全不同，是初学者最容易犯错的细节："),
        codeBlock(`String sql = "INSERT INTO emp(emp_name, emp_tel, emp_no) VALUES (?, ?, ?)";
pstmt.setString(1, emp.getEmpName());   // 第 1 个 ?，序号是 1
pstmt.setString(2, emp.getEmpTel());    // 第 2 个 ?，序号是 2
pstmt.setInt(3, emp.getEmpNo());        // 第 3 个 ?，序号是 3`),

        heading3("4.1.7  异常处理"),
        para("所有 JDBC 操作都可能抛出 SQLException（如数据库连接失败、SQL 语法错误、字段不存在等）。本项目的策略是将异常通过 throws Exception 向上抛出给调用方，让调用方统一处理。"),
        para([{ text: "注意：", bold: true }, { text: "接口声明了 throws Exception，实现类才能声明。如果接口没有声明，实现类就不能加 throws，必须在方法内部 try-catch 处理。" }]),

        heading3("4.1.8  LIMIT 分页"),
        para("MySQL 的 LIMIT 子句用于分页查询：LIMIT offset, count —— offset 是跳过多少条，count 是取多少条。"),
        codeBlock(`// 第 1 页，每页 10 条 → LIMIT 0, 10
// 第 2 页，每页 10 条 → LIMIT 10, 10
// 第 3 页，每页 10 条 → LIMIT 20, 10

// 通用公式：
int offset = (pageNum - 1) * pageSize;
pstmt.setInt(1, offset);   // 跳过前 (pageNum-1)*pageSize 条
pstmt.setInt(2, pageSize); // 取 pageSize 条`),

        heading2("4.2  需要掌握的知识与技能"),
        bullet("熟练掌握 JDBC 五步流程：加载驱动 → 获取连接 → 创建语句 → 执行 → 释放"),
        bullet("理解 PreparedStatement 的 ? 占位符语法（序号从 1 开始）"),
        bullet("能区分 executeUpdate（增删改）和 executeQuery（查询）的适用场景"),
        bullet("能使用 ResultSet 遍历查询结果并封装为对象"),
        bullet("熟练使用 try-with-resources 自动管理资源"),
        bullet("理解 throws Exception 的意义和作用域"),
        bullet("会写基本的 SQL：INSERT、DELETE、UPDATE、SELECT、LIMIT"),
        bullet("后续进阶：连接池（HikariCP/Druid）、ORM 框架（MyBatis/MyBatis-Plus、Hibernate）"),

        new Paragraph({ children: [new PageBreak()] }),

        // ========== 第五章：ds 层 ==========
        heading1("第五章  ds 数据源 / 工具层"),
        para("位置：src/main/java/org/example/ds/DBConfig.java + DBUtil.java"),

        heading2("5.1  DBConfig.java — 配置常量"),
        heading3("知识点：使用接口存储常量"),
        para("DBConfig 是一个接口，内部定义了三个静态常量字段："),
        codeBlock(`public interface DBConfig {
    String URL = "jdbc:mysql://localhost:3306/253254";
    String USER = "root";
    String PASSWORD = "541881452mkb";
}`),
        para([{ text: "为什么用接口存常量？", bold: true }, { text: "接口中的字段默认是 public static final，天然适合存储全局常量。集中管理的好处是：换数据库地址或密码时，只需改这一个文件。" }]),
        para([{ text: "注意：", bold: true }, { text: "密码是敏感信息，学习阶段放这里没问题。实际项目中应该放在配置文件（如 application.properties）或环境变量中，不应硬编码在源码里。" }]),
        para(""),
        para([{ text: "JDBC URL 格式解析：", bold: true }]),
        codeBlock(`jdbc:mysql://localhost:3306/253254
│       │       │         │    └── 数据库名（这里的 253254）
│       │       │         └── 端口号（MySQL 默认 3306）
│       │       └── 主机地址（localhost = 本机）
│       └── 数据库类型（mysql）
└── 协议（jdbc）`),

        heading2("5.2  DBUtil.java — 工具类"),
        heading3("5.2.1  静态方法"),
        para([{ text: "DBUtil 是一个工具类，所有方法都是 static 的。", bold: true }, { text: "这意味着不需要创建 DBUtil 对象，直接用类名调用：DBUtil.getConnection()。" }]),
        para("为什么用静态方法？因为工具类不保存状态，只是执行一个操作并返回结果——这就是「无状态」设计。如果每次都要 new DBUtil().getConnection()，既麻烦又没有意义。"),

        heading3("5.2.2  DriverManager.getConnection()"),
        para("这是 JDBC 的核心入口方法。它根据 URL 找到对应的数据库驱动，用用户名密码建立 TCP 连接，返回一个 Connection 对象。"),
        codeBlock(`public static Connection getConnection() throws Exception {
    return DriverManager.getConnection(DBConfig.URL, DBConfig.USER, DBConfig.PASSWORD);
}`),
        para("三个参数分别来自 DBConfig 接口，体现了「配置与逻辑分离」的原则。"),

        heading3("5.2.3  资源关闭"),
        para("DBUtil 提供了 close() 和 closeAll() 方法，用于安全关闭数据库资源。每个 close 方法都做了 null 检查，并用 try-catch 吞掉 close 异常（关闭时抛异常不影响主逻辑）。"),
        codeBlock(`public static void close(Connection conn) {
    if (conn != null) {           // 空指针检查
        try {
            conn.close();
        } catch (SQLException e) {
            e.printStackTrace();  // 记录但不中断程序
        }
    }
}`),
        para([{ text: "注意：", bold: true }, { text: "虽然本项目现在用 try-with-resources 自动管理资源，不再依赖 DBUtil.close()，但理解这个模式很重要——很多老项目仍然使用这种手动关闭方式。" }]),

        heading2("5.3  需要掌握的知识与技能"),
        bullet("理解 static 关键字的含义（类级别方法，无需实例化）"),
        bullet("理解接口常量的特性（public static final 默认修饰符）"),
        bullet("理解 DriverManager 的作用（JDBC 驱动的管理器）"),
        bullet("理解配置分离原则：URL/账号/密码不应散落在代码各处"),
        bullet("理解 null 检查的重要性（getConnection 可能失败返回 null）"),
        bullet("知道实际项目中敏感信息应放在配置文件而非源码"),

        new Paragraph({ children: [new PageBreak()] }),

        // ========== 第六章：App.java ==========
        heading1("第六章  App.java — 原始 JDBC 对比"),
        para("位置：src/main/java/org/example/App.java"),

        heading2("6.1  这段代码在做什么？"),
        para("App.java 展示了最原始的 JDBC 操作方式——所有步骤（驱动加载、连接获取、SQL 编写、参数设置、执行、关闭）全部揉在 main 方法里。它和分层后的 EmpDAO 形成鲜明对比。"),

        heading2("6.2  原始写法 vs 分层写法"),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [3000, 3026, 3000],
          rows: [
            makeRow(["对比维度", "App.java（原始）", "EmpDAO（分层后）"], { widths: [3000, 3026, 3000], shading: "2E75B6" }),
            makeRow(["配置", "硬编码 URL/密码在 main 里", "集中在 DBConfig 接口"], { widths: [3000, 3026, 3000], shading: "F0F4F8" }),
            makeRow(["复用性", "每次操作都要重写全部步骤", "DAO 实现一次，到处调用"], { widths: [3000, 3026, 3000] }),
            makeRow(["错误处理", "无异常处理（全抛给 JVM）", "throws 到调用方统一处理"], { widths: [3000, 3026, 3000], shading: "F0F4F8" }),
            makeRow(["资源管理", "只关了 conn，pstmt 没关", "try-with-resources 全自动"], { widths: [3000, 3026, 3000] }),
            makeRow(["可测试性", "不可测试", "易于单元测试"], { widths: [3000, 3026, 3000], shading: "F0F4F8" }),
          ]
        }),
        para(""),
        para([{ text: "学习建议：", bold: true }, { text: "初学者应该先理解 App.java 的 JDBC 五步流程，再学习 EmpDAO 的分层写法。这样才能真正理解「分层解决了什么问题」。" }]),

        heading2("6.3  涉及的知识点"),
        bullet("Class.forName()：Java 反射机制，动态加载 MySQL 驱动类"),
        bullet("DriverManager.getConnection()：JDBC 核心入口"),
        bullet("硬编码问题：URL、用户名、密码直接写死在代码里的弊端"),

        new Paragraph({ children: [new PageBreak()] }),

        // ========== 第七章：其他重要知识点 ==========
        heading1("第七章  贯穿全项目的知识点"),

        heading2("7.1  Maven 项目管理"),
        para("pom.xml 是 Maven 项目的核心配置文件，定义了项目依赖和编译参数。"),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2500, 6526],
          rows: [
            makeRow(["配置项", "含义"], { widths: [2500, 6526], shading: "2E75B6" }),
            makeRow(["groupId / artifactId", "项目的组织标识和名称"], { widths: [2500, 6526], shading: "F0F4F8" }),
            makeRow(["dependencies", "声明项目依赖的第三方库（Lombok、MySQL 驱动、JUnit）"], { widths: [2500, 6526] }),
            makeRow(["maven.compiler.source", "指定 Java 源代码版本（本项目中是 25）"], { widths: [2500, 6526], shading: "F0F4F8" }),
            makeRow(["scope", "依赖的作用范围：compile（编译+运行）、test（仅测试）、provided（编译但不打包）"], { widths: [2500, 6526] }),
          ]
        }),
        para(""),
        para("常用的 Maven 命令："),
        codeBlock(`mvn clean        # 清理 target 目录
mvn compile      # 编译源代码
mvn test         # 运行测试
mvn package      # 打包（编译 + 测试 + 打 jar 包）
mvn install      # 打包后安装到本地仓库`),

        heading2("7.2  package 包管理"),
        para("Java 使用包（package）来组织类文件，避免命名冲突："),
        codeBlock(`org.example.entity.Emp        → entity 包下的 Emp 类
org.example.dao.DAO           → dao 包下的 DAO 接口
org.example.dao.impl.EmpDAO   → dao/impl 包下的 EmpDAO 实现类
org.example.ds.DBUtil         → ds 包下的 DBUtil 工具类`),
        para([{ text: "约定：", bold: true }, { text: "包名全小写，类名首字母大写（PascalCase），接口通常不加 I 前缀（Java 社区更倾向 DAO 而不是 IDAO）。" }]),

        heading2("7.3  import 导入机制"),
        para("import 语句让当前类可以使用其他包的类，避免写全限定名："),
        codeBlock(`import java.sql.Connection;          // 导入单个类
import java.sql.*;                     // 导入整个包（不推荐，可能有命名冲突）
import static org.example.ds.DBUtil.*; // 静态导入（可直接写 getConnection()）`),

        heading2("7.4  SQL 基础"),
        para("本项目用到了以下 SQL 语句，这是操作数据库的基本功："),
        codeBlock(`-- 增：插入一条员工记录
INSERT INTO emp(emp_name, emp_tel, emp_no, emp_addr, emp_salary, type_id)
VALUES ('张三', '13800138000', 1001, '北京市', 5000, 1);

-- 删：根据 ID 删除
DELETE FROM emp WHERE emp_id = 1;

-- 改：根据 ID 更新
UPDATE emp SET emp_name = '李四', emp_salary = 6000 WHERE emp_id = 1;

-- 查单条：根据 ID 查询
SELECT * FROM emp WHERE emp_id = 1;

-- 查全部（分页）
SELECT * FROM emp LIMIT 0, 10;`),

        heading2("7.5  Java 基础语法"),
        para("贯穿整个项目的 Java 基础知识点："),
        bullet("类与对象：class 关键字、new 关键字（如 new Emp()、new ArrayList<>()）"),
        bullet("方法签名：访问修饰符（public/private）、返回值类型、方法名、参数列表"),
        bullet("List 集合：ArrayList 的使用，add() 添加元素，遍历"),
        bullet("控制流：if/else、while 循环"),
        bullet("异常体系：Exception vs RuntimeException，throws vs try-catch"),
        bullet("this 关键字：在构造方法中指代当前对象（Lombok 生成的全参构造器使用了 this）"),

        new Paragraph({ children: [new PageBreak()] }),

        // ========== 第八章：学习路径 ==========
        heading1("第八章  初学者学习路径建议"),

        heading2("8.1  推荐学习顺序"),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [1000, 2500, 5526],
          rows: [
            makeRow(["阶段", "内容", "目标"], { widths: [1000, 2500, 5526], shading: "2E75B6" }),
            makeRow(["1", "App.java + SQL 基础", "理解 JDBC 五步流程，能写出基本 CRUD SQL"], { widths: [1000, 2500, 5526], shading: "F0F4F8" }),
            makeRow(["2", "entity / Emp.java", "理解 POJO，会用 Lombok（或手写 getter/setter）"], { widths: [1000, 2500, 5526] }),
            makeRow(["3", "ds / DBConfig + DBUtil", "理解配置分离、静态方法、资源管理"], { widths: [1000, 2500, 5526], shading: "F0F4F8" }),
            makeRow(["4", "dao / DAO<T> 接口", "理解泛型、面向接口编程、DAO 设计模式"], { widths: [1000, 2500, 5526] }),
            makeRow(["5", "dao.impl / EmpDAO", "综合运用：JDBC + SQL + 异常处理 + 资源管理"], { widths: [1000, 2500, 5526], shading: "F0F4F8" }),
            makeRow(["6", "Maven + 运行测试", "理解依赖管理，能跑通整个项目"], { widths: [1000, 2500, 5526] }),
          ]
        }),

        heading2("8.2  动手练习建议"),
        numberItem("新建 staff 表（包含 id、name、department、salary 字段），仿照 Emp 写完整的 Staff 实体类"),
        numberItem("为 Staff 写完整的 StaffDAO 实现类（增删改查全部实现）"),
        numberItem("尝试把 DBConfig 中的配置改为从 properties 文件读取"),
        numberItem("为 EmpDAO 添加一个 queryByName(String name) 的模糊查询方法"),
        numberItem("尝试使用 MyBatis-Plus 改写 EmpDAO（进阶）"),

        heading2("8.3  后续学习方向"),
        new Table({
          width: { size: 9026, type: WidthType.DXA },
          columnWidths: [2500, 6526],
          rows: [
            makeRow(["方向", "内容"], { widths: [2500, 6526], shading: "2E75B6" }),
            makeRow(["连接池", "HikariCP / Druid — 避免每次请求新建连接的开销"], { widths: [2500, 6526], shading: "F0F4F8" }),
            makeRow(["ORM 框架", "MyBatis / MyBatis-Plus / JPA — 用注解替代手写 SQL"], { widths: [2500, 6526] }),
            makeRow(["Spring Boot", "企业级开发框架 — 自动配置、依赖注入、Web 开发"], { widths: [2500, 6526], shading: "F0F4F8" }),
            makeRow(["三层架构", "Controller → Service → DAO — 经典的 Web 后端分层"], { widths: [2500, 6526] }),
            makeRow(["数据库", "事务管理、索引优化、连接池配置、慢 SQL 分析"], { widths: [2500, 6526], shading: "F0F4F8" }),
          ]
        }),

        new Paragraph({ spacing: { before: 400 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "—— 祝学习顺利！——", size: 22, color: "888888", font: "Microsoft YaHei" })] }),
      ]
    }
  ]
});

// ========== 生成文件 ==========
const outputPath = "E:\\我的桌面\\Java项目分层知识点详解.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("文档已生成：" + outputPath);
});
