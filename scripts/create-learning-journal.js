const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, LevelFormat,
        HeadingLevel, BorderStyle, WidthType, ShadingType,
        PageNumber } = require('docx');

// Helper: code paragraph
function code(text) {
    return new Paragraph({
        spacing: { before: 60, after: 60 },
        indent: { left: 360 },
        shading: { fill: "F4F4F4", type: ShadingType.CLEAR },
        children: [new TextRun({ text, font: "Consolas", size: 18, color: "333333" })]
    });
}

// Helper: bold paragraph
function boldPara(text, size = 24) {
    return new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [new TextRun({ text, bold: true, font: "Arial", size })]
    });
}

// Helper: normal paragraph
function para(text, indent = 0) {
    return new Paragraph({
        spacing: { before: 40, after: 40 },
        indent: indent ? { left: indent } : undefined,
        children: [new TextRun({ text, font: "Arial", size: 22 })]
    });
}

// Helper: bullet item
function bullet(text, ref = "bullets") {
    return new Paragraph({
        numbering: { reference: ref, level: 0 },
        spacing: { before: 30, after: 30 },
        children: [new TextRun({ text, font: "Arial", size: 22 })]
    });
}

// Helper: numbered item
function numbered(text) {
    return new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { before: 30, after: 30 },
        children: [new TextRun({ text, font: "Arial", size: 22 })]
    });
}

// Helper: sub-bullet
function subBullet(text) {
    return new Paragraph({
        numbering: { reference: "bullets", level: 1 },
        spacing: { before: 20, after: 20 },
        indent: { left: 720 },
        children: [new TextRun({ text, font: "Arial", size: 22 })]
    });
}

// Helper: table creation
const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };

function headerCell(text, width) {
    return new TableCell({
        borders,
        width: { size: width, type: WidthType.DXA },
        shading: { fill: "2C3E50", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: "Arial", size: 20, color: "FFFFFF" })] })]
    });
}

function dataCell(text, width) {
    return new TableCell({
        borders,
        width: { size: width, type: WidthType.DXA },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20 })] })]
    });
}

function codeCell(text, width) {
    return new TableCell({
        borders,
        width: { size: width, type: WidthType.DXA },
        shading: { fill: "F8F8F8", type: ShadingType.CLEAR },
        margins: cellMargins,
        children: [new Paragraph({ children: [new TextRun({ text, font: "Consolas", size: 17, color: "333333" })] })]
    });
}

const doc = new Document({
    styles: {
        default: { document: { run: { font: "Arial", size: 24 } } },
        paragraphStyles: [
            { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
              run: { size: 36, bold: true, font: "Arial", color: "1A5276" },
              paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
            { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
              run: { size: 30, bold: true, font: "Arial", color: "2471A3" },
              paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
            { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
              run: { size: 26, bold: true, font: "Arial", color: "2C3E50" },
              paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
        ]
    },
    numbering: {
        config: [
            { reference: "bullets",
              levels: [
                { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
                  style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
                { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
                  style: { paragraph: { indent: { left: 1080, hanging: 360 } } } },
              ]},
            { reference: "numbers",
              levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
                style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        ]
    },
    sections: [
        // ============ SECTION 1: Cover/Title ============
        {
            properties: {
                page: {
                    size: { width: 11906, height: 16838 },
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
                }
            },
            children: [
                new Paragraph({ spacing: { before: 2400 } }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "Java Web 后端开发", font: "Arial", size: 56, bold: true, color: "1A5276" })]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [new TextRun({ text: "学习日志", font: "Arial", size: 48, bold: true, color: "2471A3" })]
                }),
                new Paragraph({ spacing: { before: 600 } }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "Servlet + PostgreSQL + JDBC 全栈实战", font: "Arial", size: 26, color: "7F8C8D" })]
                }),
                new Paragraph({ spacing: { before: 400 } }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "2026年7月21日", font: "Arial", size: 24, color: "95A5A6" })]
                }),
                new Paragraph({ spacing: { before: 200 } }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: "涵盖：环境搭建 · Servlet · HTTP · JSON · 校验 · JDBC · CRUD · 问题排查", font: "Arial", size: 20, color: "BDC3C7" })]
                }),
            ]
        },

        // ============ SECTION 2: Main Content ============
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
                        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "BDC3C7", space: 4 } },
                        children: [new TextRun({ text: "Java Web 后端开发学习日志", font: "Arial", size: 18, color: "95A5A6", italics: true })]
                    })]
                })
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        alignment: AlignmentType.CENTER,
                        border: { top: { style: BorderStyle.SINGLE, size: 2, color: "BDC3C7", space: 4 } },
                        children: [new TextRun({ text: "第 ", font: "Arial", size: 18, color: "95A5A6" }),
                                   new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "95A5A6" }),
                                   new TextRun({ text: " 页", font: "Arial", size: 18, color: "95A5A6" })]
                    })]
                })
            },
            children: [
                // ==========================================
                // 一、环境搭建
                // ==========================================
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("一、环境搭建")] }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.1 核心组件")] }),
                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [2200, 3400, 3426],
                    rows: [
                        new TableRow({ children: [
                            headerCell("组件", 2200), headerCell("版本/路径", 3400), headerCell("说明", 3426)
                        ]}),
                        new TableRow({ children: [
                            dataCell("JDK", 2200), codeCell("D:\\develop\\JDK (Java 25)", 3400),
                            dataCell("Java 开发工具包", 3426)
                        ]}),
                        new TableRow({ children: [
                            dataCell("Tomcat", 2200), codeCell("E:\\apache-tomcat-9.0.120", 3400),
                            dataCell("Servlet 容器，运行 Java Web 应用", 3426)
                        ]}),
                        new TableRow({ children: [
                            dataCell("IDEA", 2200), codeCell("D:\\idea\\IntelliJ IDEA 2025.3.3", 3400),
                            dataCell("集成开发环境", 3426)
                        ]}),
                        new TableRow({ children: [
                            dataCell("Maven", 2200), codeCell("E:\\apache-maven-3.9.16", 3400),
                            dataCell("项目构建与依赖管理", 3426)
                        ]}),
                        new TableRow({ children: [
                            dataCell("PostgreSQL", 2200), codeCell("E:\\PostgreSQL\\ (端口 5432)", 3400),
                            dataCell("关系型数据库", 3426)
                        ]}),
                    ]
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.2 Maven 依赖管理")] }),
                para("Maven 通过 pom.xml 文件管理项目依赖。核心依赖配置示例："),
                code('<dependency>'),
                code('  <groupId>javax.servlet</groupId>'),
                code('  <artifactId>javax.servlet-api</artifactId>'),
                code('  <version>4.0.1</version>'),
                code('  <scope>provided</scope>  <!-- Tomcat 自带，不打入 WAR 包 -->'),
                code('</dependency>'),
                para("关键知识点："),
                bullet("groupId + artifactId + version 三者唯一确定一个依赖（Maven 坐标）"),
                bullet("scope=provided 表示运行时由容器提供，不打包进 WAR"),
                bullet("scope=compile（默认）表示打包进最终产物"),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.3 阿里云 Maven 镜像")] }),
                para("国内直连 Maven Central 下载依赖经常超时。解决方法：在 ~/.m2/settings.xml 配置阿里云镜像："),
                code('<mirrors>'),
                code('  <mirror>'),
                code('    <id>aliyunmaven</id>'),
                code('    <url>https://maven.aliyun.com/repository/public</url>'),
                code('    <mirrorOf>central</mirrorOf>'),
                code('  </mirror>'),
                code('</mirrors>'),
                para("⚠️ 注意：settings.xml 必须放在 ~/.m2/ 目录下，不能写在 pom.xml 里。"),
                para("本次实践中遇到 pom.xml 被污染（settings 块误入 pom.xml）导致 Maven 无法解析，修复后恢复正常。"),

                // ==========================================
                // 二、Servlet 基础
                // ==========================================
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("二、Servlet 基础")] }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 Servlet 概念")] }),
                para("Servlet 是运行在 Web 服务器（如 Tomcat）中的 Java 程序，用于处理客户端（浏览器）的 HTTP 请求并返回响应。"),
                para("Servlet 3.0+ 支持 @WebServlet 注解，无需配置 web.xml："),
                code('@WebServlet("/demo")'),
                code('public class DemoServlet extends HttpServlet { ... }'),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 核心对象")] }),
                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [2400, 6626],
                    rows: [
                        new TableRow({ children: [headerCell("对象", 2400), headerCell("作用", 6626)] }),
                        new TableRow({ children: [
                            codeCell("HttpServletRequest req", 2400),
                            dataCell("封装所有请求数据：请求参数(getParameter)、请求体(getReader)、请求头(getContentType)、Cookie 等", 6626)
                        ]}),
                        new TableRow({ children: [
                            codeCell("HttpServletResponse resp", 2400),
                            dataCell("封装响应数据：设置状态码(setStatus)、响应类型(setContentType)、写入响应体(getWriter)", 6626)
                        ]}),
                    ]
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.3 GET 与 POST")] }),
                para("GET 请求的参数在 URL 上，通过 getParameter() 获取："),
                code('// URL: /demo?name=小明&age=18'),
                code('String name = req.getParameter("name");  // "小明"'),
                code('String age  = req.getParameter("age");   // "18"'),
                para("POST 请求支持表单和 JSON 两种格式。JSON 需要读取请求体后手动/借助库解析："),
                code('BufferedReader reader = req.getReader();'),
                code('String json = reader.lines().collect(...);'),
                code('User user = gson.fromJson(json, User.class);  // Gson 解析'),

                // ==========================================
                // 三、HTTP 协议核心概念
                // ==========================================
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("三、HTTP 协议核心概念")] }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 端口")] }),
                para("端口是操作系统区分不同网络程序的编号，范围 0-65535。一个端口同一时间只能被一个程序占用。"),
                bullet("IP 地址 = 定位机器（哪栋楼）"),
                bullet("端口 = 定位程序（哪个房间）"),
                bullet("localhost:8080 → 本机的 8080 房间 → Tomcat"),

                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [1500, 2000, 2000, 3526],
                    rows: [
                        new TableRow({ children: [headerCell("端口", 1500), headerCell("服务", 2000), headerCell("用途", 2000), headerCell("说明", 3526)] }),
                        new TableRow({ children: [dataCell("8080", 1500), dataCell("Tomcat HTTP", 2000), dataCell("Web 请求入口", 2000), dataCell("浏览器通过此端口访问 Servlet", 3526)] }),
                        new TableRow({ children: [dataCell("5432", 1500), dataCell("PostgreSQL", 2000), dataCell("数据库连接", 2000), dataCell("Java 通过 JDBC 连接此端口", 3526)] }),
                        new TableRow({ children: [dataCell("3306", 1500), dataCell("MySQL", 2000), dataCell("数据库连接", 2000), dataCell("备选数据库", 3526)] }),
                        new TableRow({ children: [dataCell("1099", 1500), dataCell("Tomcat JMX", 2000), dataCell("IDEA 管理 Tomcat", 2000), dataCell("本次被 Windows 保留端口占用", 3526)] }),
                    ]
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2 同源策略")] }),
                para("浏览器安全机制：协议 + 主机 + 端口 三者必须完全一致才算同源，否则拦截请求。"),
                bullet("❌ 跨域：file:// 页面 → 禁止访问 http://localhost:8080（协议不同）"),
                bullet("✅ 同源：http://localhost:8080/index.html → http://localhost:8080/demo（同在 Tomcat 里）"),
                para("解决方法：把 HTML 也放到 Tomcat 的 webapp 目录中托管，通过 http:// 访问而非双击打开。"),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3 HTTP 状态码")] }),
                bullet("200 OK — 请求成功"),
                bullet("400 Bad Request — 请求参数有误（校验失败时返回）"),
                bullet("500 Internal Server Error — 服务器内部错误"),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.4 三种传参方式")] }),
                bullet("URL 参数：/demo?name=小明&age=18 — 适用于 GET 请求"),
                bullet("HTML 表单：form 提交 application/x-www-form-urlencoded — POST 传统方式"),
                bullet("JSON 请求体：Content-Type: application/json — POST 现代方式，适合复杂数据"),

                // ==========================================
                // 四、JSON 数据处理
                // ==========================================
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("四、JSON 数据处理（Gson）")] }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.1 为什么需要 JSON 库")] }),
                para("手动解析 JSON 字符串（逐字符扫描、找冒号引号逗号）存在大量边界情况无法正确处理："),
                bullet("值中含有逗号：{\"name\":\"张,三\"}"),
                bullet("值中含有转义引号：{\"name\":\"他说\\\"你好\\\"\"}"),
                bullet("键值对顺序不确定"),
                bullet("null 值处理"),
                para("结论：不要在业务代码里手动解析 JSON，用成熟的第三方库。"),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.2 Gson 核心 API")] }),
                bullet("fromJson(json字符串, 类.class) — JSON → Java 对象（反序列化）"),
                bullet("toJson(对象) — Java 对象 → JSON 字符串（序列化）"),
                bullet("List 集合自动序列化为 JSON 数组 [{...}, {...}]"),

                para("数据容器类（POJO）要求：属性名必须与 JSON 的 key 完全一致，包括大小写："),
                code('// JSON: {"name":"小明","age":18}'),
                code('public class User {'),
                code('    private String name;   // 对应 "name"'),
                code('    private int age;       // 对应 "age"（数字类型 → int）'),
                code('    // + getter/setter'),
                code('}'),
                code('User u = gson.fromJson(json, User.class);  // 一行搞定'),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.3 Gson vs 手写解析对比")] }),
                para("手写的 extractJsonValue() 方法约 20 行，只能处理简单情况；Gson 一行代码覆盖所有边界情况。"),

                // ==========================================
                // 五、输入校验
                // ==========================================
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("五、输入校验")] }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.1 防御性编程原则")] }),
                para("前端数据不可信 — 任何人都可以绕过浏览器直接向服务器发请求。后端必须对所有输入做校验。"),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.2 校验三要素")] }),
                numbered("空值检查：name == null || name.trim().isEmpty()"),
                numbered("类型校验：Integer.parseInt(age) + try-catch"),
                numbered("格式校验：name.matches(\"正则表达式\")"),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.3 错误响应规范")] }),
                para("校验失败时返回 HTTP 400 + JSON 格式错误信息："),
                code('{"status":"error","message":"姓名不能为空"}'),
                para("前端可以根据 HTTP 状态码和 JSON 内容做不同的错误处理。"),

                para("本项目的 validate() 方法将三样校验整合在一起，返回 null 表示通过，返回错误消息字符串表示不通过："),
                code('private String validate(String name, String age) {'),
                code('    if (name == null || name.trim().isEmpty())'),
                code('        return "姓名不能为空";'),
                code('    if (age == null || age.trim().isEmpty())'),
                code('        return "年龄不能为空";'),
                code('    try { Integer.parseInt(age); }'),
                code('    catch (Exception e) { return "年龄格式错误"; }'),
                code('    return null;  // 全部通过'),
                code('}'),

                // ==========================================
                // 六、代码重构与设计原则
                // ==========================================
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("六、代码重构与设计原则")] }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.1 DRY 原则")] }),
                para("Don't Repeat Yourself — 相同的代码出现超过两次就应该抽取成方法。"),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.2 本次重构实践")] }),
                para("重构前：doGet 方法约 45 行，错误响应代码重复 6 处，校验逻辑重复 3 处。"),
                para("重构后：抽取了两个公共方法，doGet 缩减到 12 行。"),

                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [1500, 2500, 2500, 2526],
                    rows: [
                        new TableRow({ children: [headerCell("方法", 1500), headerCell("职责", 2500), headerCell("输入", 2500), headerCell("输出", 2526)] }),
                        new TableRow({ children: [
                            codeCell("sendError()", 1500),
                            dataCell("统一返回错误响应", 2500),
                            dataCell("resp, 错误消息", 2500),
                            dataCell("void（直接写响应）", 2526)
                        ]}),
                        new TableRow({ children: [
                            codeCell("validate()", 1500),
                            dataCell("统一校验 name/age", 2500),
                            dataCell("name, age (String)", 2500),
                            dataCell("null=通过 / 字符串=错误消息", 2526)
                        ]}),
                        new TableRow({ children: [
                            codeCell("queryUsers()", 1500),
                            dataCell("查询数据库用户列表", 2500),
                            dataCell("无", 2500),
                            dataCell("List<User>", 2526)
                        ]}),
                    ]
                }),

                para("重构后的调用方式（极简）："),
                code('String error = validate(name, age);'),
                code('if (error != null) { sendError(resp, error); return; }'),

                para("关键设计原则："),
                bullet("单一职责：validate() 只返回错误消息，不写响应；sendError() 只写响应，不做判断"),
                bullet("开放封闭：新增校验规则只需修改 validate() 一处"),
                bullet("参数化变化：变化的部分（错误消息）作为参数传入，不变的部分留在方法内部"),

                // ==========================================
                // 七、PostgreSQL 数据库与 JDBC
                // ==========================================
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("七、PostgreSQL 数据库与 JDBC")] }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.1 JDBC 架构")] }),
                para("JDBC（Java Database Connectivity）是 Java 操作数据库的统一接口标准："),
                para("Java 代码 → JDBC 接口(Java 自带) → 数据库驱动(.jar,厂商提供) → 数据库进程"),
                para("换数据库只需换驱动 JAR 包和 URL，Java 代码完全不变。"),

                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [2200, 3400, 3426],
                    rows: [
                        new TableRow({ children: [headerCell("数据库", 2200), headerCell("Maven 依赖", 3400), headerCell("JDBC URL", 3426)] }),
                        new TableRow({ children: [
                            dataCell("PostgreSQL", 2200),
                            codeCell("org.postgresql:postgresql", 3400),
                            codeCell("jdbc:postgresql://host:5432/db", 3426)
                        ]}),
                        new TableRow({ children: [
                            dataCell("MySQL", 2200),
                            codeCell("com.mysql:mysql-connector-j", 3400),
                            codeCell("jdbc:mysql://host:3306/db", 3426)
                        ]}),
                    ]
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.2 JDBC 五步标准流程")] }),
                numbered("Class.forName(\"org.postgresql.Driver\") — 加载驱动类"),
                numbered("DriverManager.getConnection(url, user, pass) — 建立 TCP 连接"),
                numbered("conn.createStatement() — 创建 SQL 语句对象"),
                numbered("stmt.executeQuery(sql) / stmt.executeUpdate(sql) — 执行查询/更新"),
                numbered("rs.next() 遍历结果 → rs.close() → stmt.close() → conn.close()"),

                para("完整代码示例："),
                code('Class.forName("org.postgresql.Driver");'),
                code('Connection conn = DriverManager.getConnection('),
                code('    "jdbc:postgresql://localhost:5432/demo", "postgres", "***");'),
                code('Statement stmt = conn.createStatement();'),
                code('ResultSet rs = stmt.executeQuery("SELECT id, name, age FROM users");'),
                code('while (rs.next()) {'),
                code('    int id   = rs.getInt("id");'),
                code('    String n  = rs.getString("name");'),
                code('    int age   = rs.getInt("age");'),
                code('}'),
                code('rs.close(); stmt.close(); conn.close();  // 必须关闭！'),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.3 executeQuery vs executeUpdate")] }),
                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [2000, 1500, 5526],
                    rows: [
                        new TableRow({ children: [headerCell("方法", 2000), headerCell("返回值", 1500), headerCell("适用操作", 5526)] }),
                        new TableRow({ children: [
                            codeCell("executeQuery()", 2000),
                            dataCell("ResultSet", 1500),
                            dataCell("SELECT 查询，返回结果集，需遍历读取", 5526)
                        ]}),
                        new TableRow({ children: [
                            codeCell("executeUpdate()", 2000),
                            dataCell("int", 1500),
                            dataCell("INSERT / UPDATE / DELETE，返回受影响行数", 5526)
                        ]}),
                    ]
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.4 SQL 基础语法")] }),
                code('SELECT id, name, age FROM users;           -- 查询'),
                code("INSERT INTO users (name, age) VALUES ('李四', 25);  -- 新增"),
                code("UPDATE users SET name='王五', age=30 WHERE id=1;      -- 修改"),
                code("DELETE FROM users WHERE id=1;               -- 删除"),

                // ==========================================
                // 八、前后端 CRUD 实战
                // ==========================================
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("八、前后端 CRUD 实战")] }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8.1 项目结构")] }),
                code('my-servlet/'),
                code('├── pom.xml                                 # Maven 依赖管理'),
                code('├── src/main/java/com/demo/'),
                code('│   ├── DemoServlet.java                   # /demo - 参数校验演示'),
                code('│   ├── UserServlet.java                   # /users - 数据库 CRUD'),
                code('│   └── User.java                          # 数据模型 (id, name, age)'),
                code('└── src/main/webapp/'),
                code('    └── index.html                        # 前端页面（同源托管）'),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8.2 API 设计")] }),
                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [1500, 800, 3000, 3726],
                    rows: [
                        new TableRow({ children: [headerCell("URL", 1500), headerCell("方法", 800), headerCell("参数", 3000), headerCell("说明", 3726)] }),
                        new TableRow({ children: [codeCell("/users", 1500), dataCell("GET", 800), dataCell("无", 3000), dataCell("返回用户列表 JSON 数组", 3726)] }),
                        new TableRow({ children: [codeCell("/users", 1500), dataCell("POST", 800), dataCell("JSON body: {name, age}", 3000), dataCell("新增用户", 3726)] }),
                        new TableRow({ children: [codeCell("/users?action=update&id=1", 1500), dataCell("POST", 800), dataCell("JSON body: {name, age}", 3000), dataCell("修改指定 ID 用户", 3726)] }),
                        new TableRow({ children: [codeCell("/users?action=delete&id=1", 1500), dataCell("POST", 800), dataCell("URL 参数: id", 3000), dataCell("删除指定 ID 用户", 3726)] }),
                    ]
                }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8.3 前后端数据流")] }),
                para("一个完整的请求生命周期（以【查询用户列表】为例）："),
                numbered("浏览器加载 index.html → loadUsers() 自动执行"),
                numbered("fetch('http://localhost:8080/users') 发起 HTTP GET 请求"),
                numbered("Tomcat 收到 /users → 匹配 @WebServlet(\"/users\") → 调用 UserServlet.doGet()"),
                numbered("doGet() → queryUsers() → DriverManager.getConnection() → TCP 连接 PostgreSQL:5432"),
                numbered("stmt.executeQuery(SQL) → PostgreSQL 执行查询 → 返回结果集"),
                numbered("while(rs.next()) 遍历 → 封装为 List<User> → gson.toJson() 序列化"),
                numbered("resp.getWriter().write(json) → HTTP 响应返回浏览器"),
                numbered("浏览器 resp.json() 解析 → 拼接 HTML → innerHTML 渲染表格"),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8.4 前端 JS 关键代码")] }),
                para("新增用户："),
                code('fetch(\'/users\', {'),
                code('  method: \'POST\','),
                code('  headers: { \'Content-Type\': \'application/json\' },'),
                code('  body: JSON.stringify({ name, age })'),
                code('});'),
                para("删除用户："),
                code('fetch(\'/users?action=delete&id=\' + id, { method: \'POST\' });'),
                para("编辑用户："),
                code('const name = prompt(\'姓名：\', oldName);'),
                code('fetch(\'/users?action=update&id=\' + id, {'),
                code('  method: \'POST\','),
                code('  headers: { \'Content-Type\': \'application/json\' },'),
                code('  body: JSON.stringify({ name, age: parseInt(age) })'),
                code('});'),

                // ==========================================
                // 九、问题排查经验
                // ==========================================
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("九、问题排查经验")] }),

                new Table({
                    width: { size: 9026, type: WidthType.DXA },
                    columnWidths: [2500, 2500, 4026],
                    rows: [
                        new TableRow({ children: [headerCell("问题", 2500), headerCell("原因", 2500), headerCell("解决方案", 4026)] }),
                        new TableRow({ children: [
                            dataCell("Maven 依赖下载失败", 2500),
                            dataCell("直连 Maven Central 被墙", 2500),
                            dataCell("配置阿里云镜像 ~/.m2/settings.xml", 4026)
                        ]}),
                        new TableRow({ children: [
                            dataCell("pom.xml 报红/项目无法加载", 2500),
                            dataCell("settings 块误入 pom.xml，多根元素 XML 非法", 2500),
                            dataCell("删除 pom.xml 末尾的 <settings> 块，放到正确位置", 4026)
                        ]}),
                        new TableRow({ children: [
                            dataCell("IDEA 启动 Tomcat 报 1099 端口占用", 2500),
                            dataCell("Windows 保留端口范围 1031-1130", 2500),
                            dataCell("修改 IDEA Tomcat 配置中的 JMX 端口为 10999", 4026)
                        ]}),
                        new TableRow({ children: [
                            dataCell("GET 请求中文参数乱码", 2500),
                            dataCell("Tomcat 默认 ISO-8859-1 解码 URL", 2500),
                            dataCell("server.xml Connector 加 URIEncoding=\"UTF-8\"", 4026)
                        ]}),
                        new TableRow({ children: [
                            dataCell("IDEA 控制台输出乱码", 2500),
                            dataCell("JVM UTF-8 输出 vs 控制台 GBK 解码", 2500),
                            dataCell("Help → Edit Custom VM Options 加 -Dfile.encoding=UTF-8", 4026)
                        ]}),
                        new TableRow({ children: [
                            dataCell("前端 fetch 报 Failed to fetch", 2500),
                            dataCell("file:// 协议跨域访问 http://", 2500),
                            dataCell("HTML 放到 Tomcat webapp，通过 http:// 访问", 4026)
                        ]}),
                        new TableRow({ children: [
                            dataCell("Navicat 连 PostgreSQL 失败", 2500),
                            dataCell("Navicat 12 与新版本 PG 不兼容", 2500),
                            dataCell("修改 libcc.dll：datlastsysoid → dattablespace", 4026)
                        ]}),
                        new TableRow({ children: [
                            dataCell("端口占用排查", 2500),
                            dataCell("程序未正常退出", 2500),
                            dataCell("netstat -ano | findstr \":端口\"  →  taskkill /f /pid PID", 4026)
                        ]}),
                    ]
                }),

                // ==========================================
                // 十、核心概念总结
                // ==========================================
                new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("十、核心概念总结")] }),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("10.1 三层架构关系")] }),
                para("前端、后端、数据库三者通过网络协议通信："),
                code('浏览器 ──HTTP(:8080)──→ Tomcat/Servlet ──JDBC(:5432)──→ PostgreSQL'),
                para(""),
                bullet("浏览器 ↔ Tomcat：使用 HTTP 协议，通过 8080 端口"),
                bullet("Tomcat ↔ PostgreSQL：使用 JDBC（底层是 TCP），通过 5432 端口"),
                bullet("两端都是网络通信，只是协议不同。HTTP 传页面和 JSON，JDBC 传 SQL"),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("10.2 一个请求的完整生命周期")] }),
                numbered("用户操作（点击按钮/访问URL）"),
                numbered("浏览器发起 HTTP 请求"),
                numbered("Tomcat 路由到对应 Servlet（@WebServlet 匹配）"),
                numbered("Servlet 处理：接收参数 → 校验 → 执行业务逻辑"),
                numbered("JDBC 连接数据库 → 发送 SQL → 获取结果"),
                numbered("数据组装为 Java 对象 → Gson 序列化为 JSON"),
                numbered("JSON 写入 HTTP 响应 → 返回浏览器"),
                numbered("JS 解析 JSON → 操作 DOM → 用户看到结果"),

                new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("10.3 技能树总结")] }),
                bullet("✅ Servlet：doGet/doPost、@WebServlet、HttpServletRequest/Response"),
                bullet("✅ HTTP：GET/POST、状态码、Content-Type、同源策略、端口概念"),
                bullet("✅ JSON：Gson 序列化/反序列化、POJO 数据类"),
                bullet("✅ 校验：防御性编程、空值/类型/格式检查、HTTP 400 错误响应"),
                bullet("✅ 重构：DRY 原则、方法抽取、单一职责"),
                bullet("✅ 数据库：PostgreSQL、JDBC 五步流程、SQL CRUD"),
                bullet("✅ 前端：fetch API、DOM 操作、动态表格渲染"),
                bullet("✅ 排查：端口冲突、编码乱码、跨域问题、Maven 故障"),

                new Paragraph({ spacing: { before: 400 } }),
                para("—— 学习日志完 ——", 0),
            ]
        }
    ]
});

const outputPath = "E:\\我的桌面\\JavaWeb学习日志.docx";
Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync(outputPath, buffer);
    console.log("文档已生成: " + outputPath);
    console.log("文件大小: " + (buffer.length / 1024).toFixed(1) + " KB");
});
