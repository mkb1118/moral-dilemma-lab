const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  TableOfContents, HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak
} = require('docx');

// === Helpers ===
const border = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: "2E75B6" };
const headerBorders = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

const FONT_BODY = "Arial";
const FONT_CODE = "Consolas";
const BLUE = "2E75B6";
const HEADER_BG = "D5E8F0";
const CODE_BG = "F5F5F5";

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: FONT_BODY, bold: true, size: 32, color: BLUE })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: FONT_BODY, bold: true, size: 28, color: BLUE })],
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, font: FONT_BODY, bold: true, size: 26, color: "333333" })],
  });
}

function para(text, opts = {}) {
  const runs = [];
  if (typeof text === 'string') {
    runs.push(new TextRun({ text, font: FONT_BODY, size: 24, ...opts }));
  } else if (Array.isArray(text)) {
    text.forEach(t => {
      if (typeof t === 'string') {
        runs.push(new TextRun({ text: t, font: FONT_BODY, size: 24 }));
      } else {
        runs.push(new TextRun({ font: FONT_BODY, size: 24, ...t }));
      }
    });
  }
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    children: runs,
  });
}

function codeLine(text) {
  return new Paragraph({
    spacing: { after: 0, line: 280 },
    shading: { fill: CODE_BG, type: ShadingType.CLEAR },
    indent: { left: 360 },
    children: [new TextRun({ text, font: FONT_CODE, size: 20, color: "333333" })],
  });
}

function codeBlock(lines) {
  return lines.map(l => codeLine(l));
}

function bulletItem(text, ref = "bullets", level = 0) {
  if (typeof text === 'string') {
    return new Paragraph({
      numbering: { reference: ref, level },
      spacing: { after: 60, line: 340 },
      children: [new TextRun({ text, font: FONT_BODY, size: 24 })],
    });
  } else {
    return new Paragraph({
      numbering: { reference: ref, level },
      spacing: { after: 60, line: 340 },
      children: text.map(t => typeof t === 'string'
        ? new TextRun({ text: t, font: FONT_BODY, size: 24 })
        : new TextRun({ font: FONT_BODY, size: 24, ...t })),
    });
  }
}

function boldPara(text) {
  return para([{ text, bold: true }]);
}

function makeHeaderCell(text, width) {
  return new TableCell({
    borders: headerBorders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: HEADER_BG, type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({
      children: [new TextRun({ text, font: FONT_BODY, size: 22, bold: true, color: BLUE })],
    })],
  });
}

function makeCell(text, width, opts = {}) {
  const runs = typeof text === 'string'
    ? [new TextRun({ text, font: FONT_CODE, size: 20, ...opts })]
    : text.map(t => typeof t === 'string'
        ? new TextRun({ text: t, font: FONT_BODY, size: 22 })
        : new TextRun({ font: FONT_BODY, size: 22, ...t }));
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: cellMargins,
    children: [new Paragraph({ children: runs })],
  });
}

function makeBodyCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: cellMargins,
    children: [new Paragraph({
      children: [new TextRun({ text, font: FONT_BODY, size: 22 })],
    })],
  });
}

// Full content width for A4 with 1" margins: 11906 - 2*1440 = 9026
const CW = 9026;

function spacer(h = 200) {
  return new Paragraph({ spacing: { after: h }, children: [] });
}

// ===== DOCUMENT =====
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: FONT_BODY, size: 24 } },
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: FONT_BODY, color: BLUE },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: FONT_BODY, color: BLUE },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: FONT_BODY, color: "333333" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "•",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "bullets2",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "○",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
        }],
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: "steps",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    // ======== COVER PAGE ========
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        spacer(3000),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: "MySQL 数据库核心操作手册", font: FONT_BODY, size: 52, bold: true, color: BLUE })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: "—— 数据删除·更新·查询·并发控制 ——", font: FONT_BODY, size: 28, color: "666666" })],
        }),
        spacer(600),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "2026 年暑期实训 · MySQL 学习笔记", font: FONT_BODY, size: 24, color: "999999" })],
        }),
        spacer(200),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "优化整理版", font: FONT_BODY, size: 24, color: "999999" })],
        }),
      ],
    },

    // ======== MAIN CONTENT ========
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 4 } },
            children: [new TextRun({ text: "MySQL 数据库核心操作手册", font: FONT_BODY, size: 18, color: "999999", italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "— ", font: FONT_BODY, size: 18, color: "AAAAAA" }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT_BODY, size: 18, color: "AAAAAA" }),
              new TextRun({ text: " —", font: FONT_BODY, size: 18, color: "AAAAAA" }),
            ],
          })],
        }),
      },
      children: [
        // === TOC ===
        heading1("目录"),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),

        // ====== Chapter 1 ======
        heading1("第一章  数据删除操作"),
        para("在 MySQL 数据库的日常维护中，数据删除是最危险的操作之一。本章系统讲解 DELETE、DROP TABLE、TRUNCATE TABLE 和 DROP DATABASE 四种删除操作的差异、风险及误删后的恢复策略。"),

        heading2("1.1  DELETE 语句误删数据行"),
        para("这是最频繁发生的误删场景。典型原因是 WHERE 条件写错或漏写，导致删除了大量非目标行。"),
        para("❌ 危险示例："),
        codeLine("-- 漏写 WHERE 子句，会清空整张表！"),
        codeLine("DELETE FROM users;"),
        para("✅ 安全写法："),
        codeLine("-- 始终指定 WHERE 条件，并先用 SELECT 验证"),
        codeLine("SELECT * FROM users WHERE status = 'inactive' AND created_at < '2025-01-01';"),
        codeLine("-- 确认无误后再执行删除"),
        codeLine("DELETE FROM users WHERE status = 'inactive' AND created_at < '2025-01-01';"),
        para([
          { text: "⚙️ 安全建议：", bold: true },
          { text: "在生产环境中，建议开启 " },
          { text: "sql_safe_updates", bold: true, font: FONT_CODE },
          { text: " 模式，禁止无 WHERE 条件的 DELETE/UPDATE。" },
        ]),
        codeLine("SET sql_safe_updates = 1;"),

        heading2("1.2  DROP TABLE 与 TRUNCATE TABLE"),
        para([
          { text: "DROP TABLE", bold: true, font: FONT_CODE },
          { text: " 直接删除整张表及其结构定义（包括索引、触发器、约束），属于 DDL（数据定义语言）操作。" },
        ]),
        para([
          { text: "TRUNCATE TABLE", bold: true, font: FONT_CODE },
          { text: " 清空表中所有数据但保留表结构，同样属于 DDL 操作。执行后无法通过闪回工具恢复。" },
        ]),
        para("这两类操作均属于 DDL，执行后无法通过闪回工具恢复，因为 DDL 会触发隐式提交（implicit commit）。"),

        heading2("1.3  DROP DATABASE 误删数据库"),
        para("直接删除整个数据库，影响范围最大，恢复也最复杂。通常需要依赖全量备份 + binlog 增量日志来进行恢复。"),
        para([
          { text: "⚙️ 恢复步骤：", bold: true },
        ]),
        bulletItem("恢复最近全量备份"),
        bulletItem("从 binlog 中提取增量日志，重放至误删前一刻"),
        bulletItem("逐一验证表结构和数据完整性"),

        heading2("1.4  DELETE / TRUNCATE / DROP 对比表"),
        // Comparison table
        new Table({
          width: { size: CW, type: WidthType.DXA },
          columnWidths: [1800, 2400, 2400, 2426],
          rows: [
            new TableRow({ children: [
              makeHeaderCell("对比维度", 1800),
              makeHeaderCell("DELETE", 2400),
              makeHeaderCell("TRUNCATE", 2400),
              makeHeaderCell("DROP", 2426),
            ]}),
            new TableRow({ children: [
              makeBodyCell("SQL 类型", 1800),
              makeBodyCell("DML（数据操作语言）", 2400),
              makeBodyCell("DDL（数据定义语言）", 2400),
              makeBodyCell("DDL", 2426),
            ]}),
            new TableRow({ children: [
              makeBodyCell("删除范围", 1800),
              makeBodyCell("指定行（支持 WHERE）", 2400),
              makeBodyCell("整表所有数据", 2400),
              makeBodyCell("整张表（结构 + 数据）", 2426),
            ]}),
            new TableRow({ children: [
              makeBodyCell("是否可回滚", 1800),
              makeBodyCell("✅ 可回滚（事务内）", 2400),
              makeBodyCell("❌ 不可回滚", 2400),
              makeBodyCell("❌ 不可回滚", 2426),
            ]}),
            new TableRow({ children: [
              makeBodyCell("触发器", 1800),
              makeBodyCell("✅ 触发", 2400),
              makeBodyCell("❌ 不触发", 2400),
              makeBodyCell("❌ 不触发", 2426),
            ]}),
            new TableRow({ children: [
              makeBodyCell("执行速度", 1800),
              makeBodyCell("慢（逐行删除）", 2400),
              makeBodyCell("快（重建表空间）", 2400),
              makeBodyCell("极快（直接删除）", 2426),
            ]}),
            new TableRow({ children: [
              makeBodyCell("AUTO_INCREMENT", 1800),
              makeBodyCell("保留当前值", 2400),
              makeBodyCell("重置为初始值", 2400),
              makeBodyCell("表已不存在", 2426),
            ]}),
          ],
        }),

        heading2("1.5  误删数据恢复策略"),
        para("根据误删类型和业务重要程度，可以采用以下策略："),
        boldPara("策略一：利用事务回滚（仅适用于 DELETE）"),
        para("在执行 DELETE 前显式开启事务，确认无误后再 COMMIT，否则 ROLLBACK。"),
        codeLine("START TRANSACTION;"),
        codeLine("DELETE FROM users WHERE status = 'inactive';"),
        codeLine("-- 检查影响行数"),
        codeLine("SELECT ROW_COUNT();"),
        codeLine("-- 确认无误则提交，否则回滚"),
        codeLine("COMMIT;  -- 或 ROLLBACK;"),

        boldPara("策略二：全量备份 + binlog 恢复"),
        bulletItem("从最近全量备份恢复数据"),
        bulletItem("使用 mysqlbinlog 工具解析 binlog，定位到误删前的位置"),
        bulletItem("重放 binlog 中的事件，跳过误删语句"),
        codeLine("mysqlbinlog --stop-datetime=\"2026-06-23 10:00:00\" binlog.000001 | mysql -u root -p"),

        boldPara("策略三：预防为主"),
        bulletItem("开启 sql_safe_updates 模式"),
        bulletItem("生产环境分离账户权限（只给 DBA DROP 权限）"),
        bulletItem("定期全量备份 + 实时 binlog 备份"),
        bulletItem("删除前先 SELECT 确认影响范围"),

        new Paragraph({ children: [new PageBreak()] }),

        // ====== Chapter 2 ======
        heading1("第二章  数据更新操作 (UPDATE)"),
        para([
          { text: "UPDATE", bold: true, font: FONT_CODE },
          { text: " 是 DML（数据操作语言）语句，用于修改表中已有行的列数据。MySQL 支持单表语法和多表语法两种形式。" },
        ]),

        heading2("2.1  UPDATE 语法结构"),
        codeLine("UPDATE [LOW_PRIORITY] [IGNORE] table_reference"),
        codeLine("SET assignment_list"),
        codeLine("[WHERE where_condition]"),
        codeLine("[ORDER BY ...]"),
        codeLine("[LIMIT row_count];"),

        heading2("2.2  UPDATE 子句详解"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          columnWidths: [2000, 7026],
          rows: [
            new TableRow({ children: [
              makeHeaderCell("子句", 2000),
              makeHeaderCell("说明", 7026),
            ]}),
            ...[
              ["SET", "必选，指定要修改的列及其新值，格式为 列名 = 值，多个赋值用逗号分隔。支持表达式（如 price = price * 1.1）和 DEFAULT 关键字。"],
              ["WHERE", "可选，指定更新哪些行的条件。如果省略，将更新表中的所有行！极其危险！"],
              ["ORDER BY", "可选，按指定顺序更新行。通常与 LIMIT 配合使用。"],
              ["LIMIT", "可选，限制最多更新的行数。可以作为安全措施，避免一次性更新过多行。"],
              ["LOW_PRIORITY", "可选，延迟执行直到没有其他客户端读取该表。适合低优先级的批量更新任务。"],
              ["IGNORE", "可选，更新时忽略错误（如键冲突），发出警告而非中止。不建议随意使用，可能掩盖数据问题。"],
            ].map(([clause, desc]) => new TableRow({ children: [
              makeCell([{ text: clause, font: FONT_CODE, bold: true, size: 22 }], 2000),
              makeBodyCell(desc, 7026),
            ]})),
          ],
        }),

        heading2("2.3  实战示例"),
        boldPara("示例一：更新单个字段"),
        codeLine("UPDATE users SET age = 30 WHERE id = 1;"),

        boldPara("示例二：更新多个字段"),
        codeLine("UPDATE users SET age = 30, status = 'active' WHERE id = 1;"),

        boldPara("示例三：使用表达式更新"),
        codeLine("UPDATE products SET price = price * 1.1 WHERE category = 'electronics';"),

        boldPara("示例四：设为默认值"),
        codeLine("UPDATE users SET score = DEFAULT WHERE id = 1;"),

        boldPara("示例五：限制更新行数（安全批量更新）"),
        codeLine("-- 每次只更新 1000 行，避免锁表过久"),
        codeLine("UPDATE large_table SET status = 'archived' WHERE created_at < '2025-01-01' LIMIT 1000;"),

        boldPara("示例六：多表联合更新"),
        codeLine("UPDATE orders o"),
        codeLine("JOIN users u ON o.user_id = u.id"),
        codeLine("SET o.status = 'vip_priority'"),
        codeLine("WHERE u.vip_level >= 3 AND o.status = 'pending';"),

        new Paragraph({ children: [new PageBreak()] }),

        // ====== Chapter 3 ======
        heading1("第三章  并发控制与乐观锁"),
        para([
          { text: "乐观锁（Optimistic Locking）", bold: true },
          { text: " 是一种并发控制策略，核心思想是“乐观”地假定冲突概率低，在更新时校验数据是否被其他事务修改过，而非提前加锁阻塞。" },
        ]),

        heading2("3.1  状态锁原理"),
        para("状态锁是乐观锁的一种实现方式：更新时强制校验当前状态，只有符合预期才允许修改。"),
        para([
          { text: "适用场景：", bold: true },
          { text: "只有两种状态（未占用 / 已占用）的场景，如抢票、订单支付、库存扣减等单一状态流转场景。" },
        ]),

        heading2("3.2  抢票案例详解"),
        para("假设有一张票（ticket_id=1），张三和李四同时抢购："),
        boldPara("数据表结构："),
        codeLine("CREATE TABLE ticket ("),
        codeLine("  ticket_id INT PRIMARY KEY,"),
        codeLine("  state TINYINT DEFAULT 0,    -- 0=未售出，1=已售出"),
        codeLine("  ticket_buyer VARCHAR(50)"),
        codeLine(");"),

        boldPara("张三抢票："),
        codeLine("UPDATE ticket"),
        codeLine("SET ticket_buyer = '张三', state = 1"),
        codeLine("WHERE state = 0 AND ticket_id = 1;"),
        codeLine("-- 影响行数：1（成功）"),

        boldPara("李四同时抢同一张票："),
        codeLine("UPDATE ticket"),
        codeLine("SET ticket_buyer = '李四', state = 1"),
        codeLine("WHERE state = 0 AND ticket_id = 1;"),
        codeLine("-- 影响行数：0（失败，state 已变为 1）"),

        para([
          { text: "⚙️ 关键原理：", bold: true },
          { text: "数据库执行 UPDATE 是原子操作，两条语句同时发起只会有一条成功。WHERE 条件中的 state=0 起到了“锁”的作用——只有第一个事务能满足条件，第二个事务看到的已是更新后的状态。" },
        ]),

        heading2("3.3  乐观锁 vs 悲观锁对比"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          columnWidths: [2000, 3513, 3513],
          rows: [
            new TableRow({ children: [
              makeHeaderCell("对比维度", 2000),
              makeHeaderCell("乐观锁", 3513),
              makeHeaderCell("悲观锁", 3513),
            ]}),
            new TableRow({ children: [
              makeBodyCell("思想", 2000),
              makeBodyCell("假定冲突概率低，先操作后校验", 3513),
              makeBodyCell("假定冲突概率高，先加锁后操作", 3513),
            ]}),
            new TableRow({ children: [
              makeBodyCell("实现方式", 2000),
              makeBodyCell("状态值 / 版本号校验", 3513),
              makeBodyCell("SELECT ... FOR UPDATE", 3513),
            ]}),
            new TableRow({ children: [
              makeBodyCell("性能", 2000),
              makeBodyCell("高并发下性能好，无阻塞等待", 3513),
              makeBodyCell("高并发下竞争激烈，等待时间长", 3513),
            ]}),
            new TableRow({ children: [
              makeBodyCell("适用场景", 2000),
              makeBodyCell("读多写少，冲突概率低", 3513),
              makeBodyCell("写多读少，冲突概率高", 3513),
            ]}),
            new TableRow({ children: [
              makeBodyCell("典型应用", 2000),
              makeBodyCell("抢票、秒杀、库存扣减", 3513),
              makeBodyCell("银行转账、座位预定", 3513),
            ]}),
          ],
        }),

        heading2("3.4  版本号锁（另一种乐观锁实现）"),
        para("当数据状态不止两种时，可以使用版本号（version）字段来实现乐观锁："),
        codeLine("-- 表结构增加 version 字段"),
        codeLine("ALTER TABLE products ADD COLUMN version INT DEFAULT 0;"),
        spacer(40),
        codeLine("-- 更新时校验版本号，并自增"),
        codeLine("UPDATE products"),
        codeLine("SET stock = stock - 1, version = version + 1"),
        codeLine("WHERE id = 100 AND version = 5;  -- 只有版本号匹配时才更新"),
        spacer(40),
        codeLine("-- 如果影响行数为 0，说明版本号已变，需重试"),
        para("版本号锁比状态锁更通用，可以应对多状态流转场景。"),

        new Paragraph({ children: [new PageBreak()] }),

        // ====== Chapter 4 ======
        heading1("第四章  数据查询 (SELECT)"),
        para("SELECT 是 SQL 中最复杂、使用最频繁的语句。掌握它的完整语法结构和执行顺序，是写好 SQL 的基础。"),

        heading2("4.1  SELECT 完整语法"),
        codeLine("SELECT"),
        codeLine("    [ALL | DISTINCT]                     -- 1. 是否去重"),
        codeLine("    [聚合函数] 列1, 列2, ...          -- 2. 要返回的字段"),
        codeLine("FROM"),
        codeLine("    表名1                                -- 3. 数据来源"),
        codeLine("    [JOIN 表名2 ON 连接条件]             -- 4. 关联其他表"),
        codeLine("WHERE"),
        codeLine("    行级过滤条件                          -- 5. 分组前的条件（逐行过滤）"),
        codeLine("GROUP BY"),
        codeLine("    分组字段1, 分组字段2                  -- 6. 数据分组"),
        codeLine("HAVING"),
        codeLine("    组级过滤条件                          -- 7. 分组后的条件（带聚合函数）"),
        codeLine("ORDER BY"),
        codeLine("    排序字段1 [ASC | DESC], 字段2 ...   -- 8. 结果排序"),
        codeLine("LIMIT [偏移量,] 返回行数;                  -- 9. 限制返回条数（分页）"),

        heading2("4.2  WHERE 条件进阶技巧"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          columnWidths: [1600, 3400, 4026],
          rows: [
            new TableRow({ children: [
              makeHeaderCell("场景", 1600),
              makeHeaderCell("写法示例", 3400),
              makeHeaderCell("说明", 4026),
            ]}),
            ...[
              ["范围查询", "age BETWEEN 18 AND 30", "包含边界值，等价于 age >= 18 AND age <= 30。适用于数字、日期类型。"],
              ["集合匹配", "status IN ('paid', 'shipped')", "匹配集合中的任意值，效率高于多个 OR。支持子查询作为集合。"],
              ["模糊匹配", "name LIKE '张%'", "% 代表任意多个字符，_ 代表单个字符。注意：以 % 开头（如 %三）会导致索引失效。"],
              ["空值判断", "deleted_at IS NULL", "严禁使用 = NULL，必须用 IS NULL 或 IS NOT NULL。原因：NULL 不等于任何值（包括 NULL 自身）。"],
              ["条件分支 (CASE)", "SELECT name,\nCASE WHEN score >= 60\nTHEN '及格' ELSE '不及格'\nEND AS grade\nFROM students;", "在查询结果中动态生成新列，常用于报表展示和数据分类。"],
            ].map(([scene, example, desc]) => new TableRow({ children: [
              makeBodyCell(scene, 1600),
              makeCell([{ text: example, font: FONT_CODE, size: 20 }], 3400),
              makeBodyCell(desc, 4026),
            ]})),
          ],
        }),

        heading2("4.3  查询实战示例"),
        para("查询订单量大于 5 的用户，按金额降序取前 3 名："),
        codeLine("SELECT"),
        codeLine("    user_id,"),
        codeLine("    COUNT(*) AS order_count,"),
        codeLine("    SUM(amount) AS total_amount"),
        codeLine("FROM orders"),
        codeLine("WHERE status = 'paid'          -- 先过滤出已支付的订单"),
        codeLine("GROUP BY user_id               -- 按用户分组"),
        codeLine("HAVING COUNT(*) > 5            -- 只选订单量 > 5 的用户"),
        codeLine("ORDER BY total_amount DESC     -- 按总金额降序"),
        codeLine("LIMIT 3;                       -- 只取前 3 条"),

        new Paragraph({ children: [new PageBreak()] }),

        // ====== Chapter 5 ======
        heading1("第五章  数据分组与聚合"),
        para("GROUP BY 是 MySQL 中用于数据分组和汇总的核心功能，通常与聚合函数配合使用，实现对数据的分类统计。"),

        heading2("5.1  GROUP BY 语法"),
        codeLine("SELECT"),
        codeLine("    column1,"),
        codeLine("    column2,"),
        codeLine("    聚合函数(column3)"),
        codeLine("FROM table_name"),
        codeLine("WHERE condition"),
        codeLine("GROUP BY column1, column2"),
        codeLine("ORDER BY column1;"),

        heading2("5.2  聚合函数详解"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          columnWidths: [1200, 2200, 2800, 2826],
          rows: [
            new TableRow({ children: [
              makeHeaderCell("函数", 1200),
              makeHeaderCell("作用", 2200),
              makeHeaderCell("对 NULL 值的处理", 2800),
              makeHeaderCell("经典示例", 2826),
            ]}),
            ...[
              ["COUNT()", "统计行数（记录条数）", "COUNT(*) 包含 NULL；\nCOUNT(列名) 忽略 NULL 值", "SELECT COUNT(*)\nFROM users;"],
              ["SUM()", "计算某一列的总和", "忽略 NULL 值\n（视为 0）", "SELECT SUM(amount)\nFROM orders;"],
              ["AVG()", "计算某一列的平均值", "忽略 NULL 值\n（分母不包含 NULL 行）", "SELECT AVG(score)\nFROM exam;"],
              ["MAX()", "取某一列的最大值", "忽略 NULL 值", "SELECT MAX(price)\nFROM products;"],
              ["MIN()", "取某一列的最小值", "忽略 NULL 值", "SELECT MIN(create_time)\nFROM orders;"],
            ].map(([fn, desc, nulls, example]) => new TableRow({ children: [
              makeCell([{ text: fn, font: FONT_CODE, bold: true, size: 22 }], 1200),
              makeBodyCell(desc, 2200),
              makeBodyCell(nulls, 2800),
              makeCell([{ text: example, font: FONT_CODE, size: 20 }], 2826),
            ]})),
          ],
        }),

        heading2("5.3  HAVING 与 WHERE 的区别"),
        para("这是 SQL 中最容易搞混的两个子句，它们的核心区别在于作用时机不同："),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          columnWidths: [2000, 3513, 3513],
          rows: [
            new TableRow({ children: [
              makeHeaderCell("对比维度", 2000),
              makeHeaderCell("WHERE", 3513),
              makeHeaderCell("HAVING", 3513),
            ]}),
            new TableRow({ children: [
              makeBodyCell("作用时机", 2000),
              makeBodyCell("分组前，逐行过滤", 3513),
              makeBodyCell("分组后，对分组结果过滤", 3513),
            ]}),
            new TableRow({ children: [
              makeBodyCell("能否使用聚合函数", 2000),
              makeBodyCell("❌ 不能", 3513),
              makeBodyCell("✅ 可以", 3513),
            ]}),
            new TableRow({ children: [
              makeBodyCell("能否引用别名", 2000),
              makeBodyCell("❌ 不能", 3513),
              makeBodyCell("✅ 可以（MySQL 扩展）", 3513),
            ]}),
            new TableRow({ children: [
              makeBodyCell("典型用法", 2000),
              makeBodyCell("WHERE status = 'paid'", 3513),
              makeBodyCell("HAVING COUNT(*) > 5", 3513),
            ]}),
          ],
        }),
        para([
          { text: "⚙️ 性能优化建议：", bold: true },
          { text: "能用 WHERE 过滤的尽量用 WHERE，减少进入 GROUP BY 的数据量。HAVING 只用于必须依赖聚合结果的过滤条件。" },
        ]),

        heading2("5.4  GROUP BY 使用规范"),
        para([
          { text: "重要规则：", bold: true },
          { text: "SELECT 中出现的非聚合列（如 dept_id 和 gender）必须全部出现在 GROUP BY 中。这是 SQL 标准规范，MySQL 的 only_full_group_by 模式会强制检查这一规则。" },
        ]),
        codeLine("-- ✅ 正确写法"),
        codeLine("SELECT dept_id, gender, COUNT(*) AS cnt"),
        codeLine("FROM employees"),
        codeLine("GROUP BY dept_id, gender;  -- 非聚合列全部包含"),
        spacer(40),
        codeLine("-- ❌ 错误写法（only_full_group_by 模式下报错）"),
        codeLine("SELECT dept_id, gender, COUNT(*) AS cnt"),
        codeLine("FROM employees"),
        codeLine("GROUP BY dept_id;  -- gender 未出现在 GROUP BY 中"),

        new Paragraph({ children: [new PageBreak()] }),

        // ====== Chapter 6 ======
        heading1("第六章  SQL 语句执行顺序"),
        para("理解 SQL 语句的实际执行顺序，对于写出正确且高效的查询至关重要。注意：执行顺序与语法书写顺序不同！"),

        heading2("6.1  完整执行流程"),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
          shading: { fill: CODE_BG, type: ShadingType.CLEAR },
          children: [new TextRun({
            text: "FROM → WHERE → GROUP BY → 聚合函数 → HAVING → SELECT → ORDER BY → LIMIT",
            font: FONT_CODE, size: 22, bold: true, color: BLUE,
          })],
        }),

        heading2("6.2  各阶段作用详解"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          columnWidths: [1200, 1400, 6426],
          rows: [
            new TableRow({ children: [
              makeHeaderCell("步骤", 1200),
              makeHeaderCell("子句", 1400),
              makeHeaderCell("作用说明", 6426),
            ]}),
            ...[
              ["1", "FROM", "确定数据来源，包括表连接（JOIN）。这是执行的起点，决定从哪些表中取数据。"],
              ["2", "WHERE", "对原始数据行进行过滤，只保留满足条件的行。此时尚未分组，不能使用聚合函数。"],
              ["3", "GROUP BY", "将过滤后的数据按指定列分组，每个分组变为一行。"],
              ["4", "聚合函数", "在每个分组内计算聚合值（COUNT/SUM/AVG/MAX/MIN）。"],
              ["5", "HAVING", "对分组后的结果进行过滤，可以使用聚合函数。"],
              ["6", "SELECT", "确定最终输出哪些列，包括计算别名和表达式。"],
              ["7", "ORDER BY", "对结果集进行排序，可以使用 SELECT 中定义的别名。"],
              ["8", "LIMIT", "截取指定数量的行，实现分页。"],
            ].map(([step, clause, desc]) => new TableRow({ children: [
              makeBodyCell(step, 1200),
              makeCell([{ text: clause, font: FONT_CODE, bold: true, size: 22 }], 1400),
              makeBodyCell(desc, 6426),
            ]})),
          ],
        }),

        heading2("6.3  对性能优化的指导意义"),
        para("理解执行顺序后，可以得出以下优化策略："),
        bulletItem([
          { text: "WHERE 条件尽量用索引：", bold: true },
          { text: "WHERE 在第二步执行，这时候数据量最大，能用索引快速定位将极大提升整体性能。避免在 WHERE 中对列使用函数或计算，否则索引失效。" },
        ]),
        bulletItem([
          { text: "减少分组前的数据量：", bold: true },
          { text: "GROUP BY 的性能取决于输入数据量。能用 WHERE 提前过滤的，不要留到 HAVING。" },
        ]),
        bulletItem([
          { text: "ORDER BY + LIMIT 配合使用：", bold: true },
          { text: "排序在最后两步，只对最终结果集排序。LIMIT 在最后一步，截取前 N 条即可，不必对所有数据排序。" },
        ]),
        bulletItem([
          { text: "避免 SELECT * ：", bold: true },
          { text: "SELECT 在第六步执行，只选择需要的列，减少数据传输和内存占用。冗余列会浪费索引覆盖的机会。" },
        ]),

        new Paragraph({ children: [new PageBreak()] }),

        // ====== Appendix ======
        heading1("附录  核心要点速查表"),

        boldPara("一、常用 SQL 类型分类"),
        new Table({
          width: { size: CW, type: WidthType.DXA },
          columnWidths: [1000, 2000, 2400, 3626],
          rows: [
            new TableRow({ children: [
              makeHeaderCell("类型", 1000),
              makeHeaderCell("代表语句", 2000),
              makeHeaderCell("是否支持回滚", 2400),
              makeHeaderCell("说明", 3626),
            ]}),
            new TableRow({ children: [
              makeBodyCell("DML", 1000),
              makeBodyCell("SELECT, INSERT, UPDATE, DELETE", 2000),
              makeBodyCell("✅ 支持事务回滚", 2400),
              makeBodyCell("数据操作语言，操作表中数据行", 3626),
            ]}),
            new TableRow({ children: [
              makeBodyCell("DDL", 1000),
              makeBodyCell("CREATE, ALTER, DROP, TRUNCATE", 2000),
              makeBodyCell("❌ 不支持回滚", 2400),
              makeBodyCell("数据定义语言，操作表结构，执行时隐式提交", 3626),
            ]}),
            new TableRow({ children: [
              makeBodyCell("DCL", 1000),
              makeBodyCell("GRANT, REVOKE", 2000),
              makeBodyCell("❌ 不支持回滚", 2400),
              makeBodyCell("数据控制语言，管理用户权限", 3626),
            ]}),
          ],
        }),

        boldPara("二、常见误区与最佳实践"),
        bulletItem([
          { text: "WHERE 与 HAVING 搞混：", bold: true },
          { text: " WHERE 用于行级过滤（分组前），HAVING 用于组级过滤（分组后）。能用 WHERE 就不用 HAVING。" },
        ]),
        bulletItem([
          { text: "NULL 比较用 = 而非 IS：", bold: true },
          { text: " NULL 不等于任何值，包括它自己。始终使用 IS NULL / IS NOT NULL。" },
        ]),
        bulletItem([
          { text: "LIKE '%xxx' 导致索引失效：", bold: true },
          { text: " 以 % 开头的模糊查询无法使用 B-Tree 索引。尽量用前缀匹配。" },
        ]),
        bulletItem([
          { text: "UPDATE/DELETE 忘写 WHERE：", bold: true },
          { text: " 生产环境必须开启 sql_safe_updates，执行前先 SELECT 确认。" },
        ]),
        bulletItem([
          { text: "GROUP BY 与 SELECT 不一致：", bold: true },
          { text: " SELECT 中的非聚合列必须全部出现在 GROUP BY 中（only_full_group_by）。" },
        ]),

        boldPara("三、常用安全配置"),
        codeLine("-- 禁止无 WHERE 的 UPDATE/DELETE"),
        codeLine("SET sql_safe_updates = 1;"),
        spacer(40),
        codeLine("-- 查看当前设置"),
        codeLine("SHOW VARIABLES LIKE 'sql_safe_updates';"),
        spacer(40),
        codeLine("-- 开启慢查询日志（监控性能）"),
        codeLine("SET GLOBAL slow_query_log = ON;"),
        codeLine("SET GLOBAL long_query_time = 2;"),

        spacer(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [new TextRun({ text: "— 全文完 —", font: FONT_BODY, size: 24, color: "999999" })],
        }),
      ],
    },
  ],
});

// Generate
const outPath = 'E:\\我的桌面\\作业\\2026暑期实训\\6.23-优化版.docx';
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log('OK: ' + outPath);
}).catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
