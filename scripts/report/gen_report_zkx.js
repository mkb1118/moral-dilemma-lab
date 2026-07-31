const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat, TableOfContents
} = require("docx");

// ══════════ 字体常量 ══════════
const BW = "Times New Roman", BE = "宋体", HW = "Arial", HE = "黑体";
const bodyFont = { eastAsia: BE, ascii: BW, hAnsi: BW };
const headFont = { eastAsia: HE, ascii: HW, hAnsi: HW };

// ══════════ 基础组件 ══════════
const R  = (t, o={}) => new TextRun(Object.assign({text:t, size:24, font:bodyFont}, o));
const RH = (t, o={}) => new TextRun(Object.assign({text:t, font:headFont}, o));
const RC = (t)      => new TextRun({text:t, font:"Consolas", size:18});

const bdr  = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const bdrs = { top: bdr, bottom: bdr, left: bdr, right: bdr };
const cm   = { top: 50, bottom: 50, left: 80, right: 80 };

// 正文段落：段前段后0，行距1.5倍(360)，首行缩进2字符(480)
function P(content, opts={}) {
  const runs = typeof content==="string" ? [R(content)] : content.map(c=>typeof c==="string"?R(c):c);
  return new Paragraph({
    spacing: Object.assign({after:0,before:0,line:360,lineRule:"auto"}, opts.spacing||{}),
    indent: opts.indent===false ? {} : {firstLine:480},
    alignment: opts.alignment||undefined,
    children: runs
  });
}
// 代码行
function CL(text) {
  return new Paragraph({ spacing:{after:0,before:0,line:260}, shading:{fill:"F0F0F0",type:ShadingType.CLEAR}, indent:{left:240}, children:[RC(text)] });
}
// 空行
function E() { return new Paragraph({ spacing:{after:0,before:0,line:360}, children:[] }); }

// ══════════ 标题 ══════════
// 一级标题：三号(32) 黑体+Arial 加粗 居中 段前段后1行，每章另起一页
function H1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, pageBreakBefore: true,
    spacing: { before: 240, after: 240 },
    alignment: AlignmentType.CENTER,
    children: [RH(text, { bold: true, size: 32 })]
  });
}
// 二级标题：四号(28) 黑体+Arial 加粗
function H2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 120, after: 120 },
    children: [RH(text, { bold: true, size: 28 })]
  });
}
// 三级标题：小四(24) 黑体+Arial 加粗
function H3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 60, after: 60 },
    children: [RH(text, { bold: true, size: 24 })]
  });
}
// 项目符号
function Bul(text) {
  return new Paragraph({ numbering:{reference:"bullets",level:0}, spacing:{after:0,before:0,line:360}, children:[R(text)] });
}

// ══════════ 表格 ══════════
function Cell(text, opts={}) {
  return new TableCell({ bdrs, margins:cm, width:{size:opts.w||2000,type:WidthType.DXA},
    shading: opts.s ? {fill:opts.s,type:ShadingType.CLEAR} : undefined, verticalAlign:"center",
    children:[new Paragraph({ spacing:{after:0,before:0}, alignment:opts.a||(opts.s?AlignmentType.CENTER:AlignmentType.LEFT),
      children:[new TextRun({text,size:20,bold:!!opts.b,font:opts.s?headFont:bodyFont})] })]
  });
}
function Row(cells, w, s) { return new TableRow({ children: cells.map((c,i)=>Cell(c,{w:w[i],s,b:s==="D9E2F3"&&i===0})) }); }

// 表标题：表X-Y 名称（表格上方，居中，加粗，小五号/20)
function TCap(text) {
  return new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:160,after:60},
    children:[new TextRun({text,size:20,bold:true,font:headFont})] });
}
// 图标题：图X-Y 名称（图片下方，居中)
function FCap(text) {
  return new Paragraph({ alignment:AlignmentType.CENTER, spacing:{before:60,after:120},
    children:[new TextRun({text,size:20,font:headFont})] });
}

// ══════════ 封面信息行 ══════════
function coverLine(label, value) {
  return [new Paragraph({ indent:{left:720,firstLine:562}, spacing:{after:60,line:480},
    children:[ new TextRun({text:label+"：",bold:true,size:28,font:{eastAsia:HE}}),
              new TextRun({text:value,size:28,font:{eastAsia:HE},underline:{type:"single"}}) ]
  })];
}

const T = "员工管理系统的设计与实现";

// ══════════ 构建文档 ══════════
const doc = new Document({
  styles: {
    default: { document: {
      run: {size:24,font:bodyFont},
      paragraph: {spacing:{after:0,before:0,line:360,lineRule:"auto"}}
    }},
    paragraphStyles: [
      {id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:32,bold:true,font:headFont}, paragraph:{spacing:{before:240,after:240},outlineLevel:0,alignment:AlignmentType.CENTER}},
      {id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:28,bold:true,font:headFont}, paragraph:{spacing:{before:120,after:120},outlineLevel:1}},
      {id:"Heading3",name:"Heading 3",basedOn:"Normal",next:"Normal",quickFormat:true,
        run:{size:24,bold:true,font:headFont}, paragraph:{spacing:{before:60,after:60},outlineLevel:2}},
    ]
  },
  numbering: { config: [
    {reference:"bullets",levels:[{level:0,format:LevelFormat.BULLET,text:"•",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:720,hanging:360}}}}]},
  ]},
  sections: [
    // ══════════ 封面 ══════════
    { properties:{page:{size:{width:11906,height:16838},margin:{top:1331,right:1134,bottom:1134,left:1418}}},
      headers:{default:new Header({children:[E()]})},
      footers:{default:new Footer({children:[E()]})},
      children:[
        E(),E(),E(),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:80},children:[new TextRun({text:"软 件 学 院",bold:true,size:78,font:"隶书"})]}),
        E(),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:60},children:[new TextRun({text:"实践环节报告",bold:true,size:84,font:"隶书"})]}),
        E(),E(),E(),E(),E(),E(),
        ...coverLine("课程名称","软件开发实践一"),
        ...coverLine("课题名称",T),
        ...coverLine("专    业","软件工程"),
        ...coverLine("班    级","RB软工融253"),
        ...coverLine("学    号","202532044329"),
        ...coverLine("学生姓名","朱柯旭"),
        ...coverLine("指导教师","王海龙"),
        E(),E(),
        new Paragraph({alignment:AlignmentType.CENTER,children:[
          new TextRun({text:"2026",size:28,bold:true}),new TextRun({text:"年",size:28,bold:true}),
          new TextRun({text:"7",size:28,bold:true}),new TextRun({text:"月",size:28,bold:true}),
          new TextRun({text:"3",size:28,bold:true}),new TextRun({text:"日",size:28,bold:true}),
        ]}),
      ]
    },
    // ══════════ 正文 ══════════
    { properties:{page:{size:{width:11906,height:16838},margin:{top:1418,right:1134,bottom:1134,left:1418}}},
      headers:{default:new Header({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"中原工学院软件学院  软件开发实践一  设计任务书",size:18,color:"888888"})]})]})},
      footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"第 ",size:18}),new TextRun({children:[PageNumber.CURRENT],size:18}),new TextRun({text:" 页",size:18})]})]})},
      children:[
        // ==================== 任务书 ====================
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:100,after:100},children:[new TextRun({text:"中原工学院软件学院",bold:true,size:32})]}),
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:300},children:[new TextRun({text:"软件开发实践一设计任务书",bold:true,size:44})]}),
        new Table({ width:{size:9350,type:WidthType.DXA}, columnWidths:[933,1769,6648], rows:[
          Row(["姓 名","朱柯旭","软件工程  专业  RB软工融253  班"],[933,1769,6648],"F2F2F2"),
          Row(["题 目","",T],[933,1769,6648],"F2F2F2"),
          new TableRow({height:{value:3700,rule:"atLeast"},children:[
            Cell("设\n计\n任\n务",{w:933,s:"F2F2F2",b:true}),
            new TableCell({bdrs,margins:cm,columnSpan:2,width:{size:8417,type:WidthType.DXA},children:[
              P([R("设计开发一个员工管理系统，主要功能包括：员工信息的增删改查、员工类型管理、员工信息统计。系统采用Java控制台应用形式，使用JDBC连接MySQL数据库，采用DAO设计模式实现数据访问分层架构。")],{indent:true}),
              P([R("1. 设计数据库表结构（emp员工表、emp_type员工类型表)，建立外键关联")],{indent:true}),
              P([R("2. 实现DAO泛型接口及JDBC实现类，完成数据库CRUD操作")],{indent:true}),
              P([R("3. 实现Service业务层和Menu菜单层，完成用户交互界面")],{indent:true}),
              P([R("4. 实现系统主控制层（EmpSystem)，整合各模块形成完整系统")],{indent:true}),
              P([R("（独立完成)")],{indent:true}),
              P([R("开发工具：IntelliJ IDEA、JDK 25、Maven、MySQL 8.0")],{indent:true}),
            ]})
          ]}),
          new TableRow({height:{value:2800,rule:"atLeast"},children:[
            Cell("时\n间\n进\n度",{w:933,s:"F2F2F2",b:true}),
            new TableCell({bdrs,margins:cm,columnSpan:2,width:{size:8417,type:WidthType.DXA},children:[
              P([R("第1周（2026-06-22~2026-06-26)：完成需求分析、系统分析与设计、数据库设计与实现，完成DAO模式对数据库代码的编写。")],{indent:true}),
              P([R("第2周（2026年6月29日~2026年7月3日)：完成Service代码编写，完成Menu菜单编写，完成系统功能测试。")],{indent:true}),
            ]})
          ]}),
          new TableRow({height:{value:3200,rule:"atLeast"},children:[
            Cell("原 始 要\n参 考 资\n料 与 文\n    献",{w:933,s:"F2F2F2",b:true}),
            new TableCell({bdrs,margins:cm,columnSpan:2,width:{size:8417,type:WidthType.DXA},children:[
              P([R("[01] 林信良. Java学习笔记 JDK9 [M]. 北京: 清华大学出版社, 2018.6")],{indent:false}),
              P([R("[02] 李辉. 数据库原理与应用基础(MySQL) [M]. 北京: 高等教育出版社, 2019.8")],{indent:false}),
              P([R("[03] 张帆等. Java范例开发大全 [M]. 北京: 清华大学出版社, 2010.6")],{indent:false}),
            ]})
          ]}),
        ]}),
        E(),
        P([new TextRun({text:"指导教师签字：                            ",bold:true,size:22}),new TextRun({text:"2026    年    7  月  3  日",bold:true,size:22})],{indent:true}),
        new Paragraph({children:[new PageBreak()]}),

        // ==================== 摘要 ====================
        H1("摘  要"), E(),
        P([R("本系统是一个基于Java控制台"),R("的员工管理系统，采用JDBC与MySQL"),R("数据库实现数据的持久化存储。系统围绕企业员工管理的核心需求，实现了员工信息的增删改查、员工类型管理以及多维度数据统计功能。在架构设计上，采用DAO设计模式与分层架构（Entity实体层、DAO数据访问层、Service业务层、Menu菜单层、System控制层)，通过泛型接口DAO<T>实现代码复用，降低各模块耦合度。系统使用Lombok简化实体类代码，使用PreparedStatement防止SQL注入。用户通过控制台菜单交互，操作直观简洁。")],{indent:true}),
        E(),
        P([new TextRun({text:"关键词：",bold:true,font:headFont}), R("Java；MySQL；JDBC；DAO设计模式；员工管理系统")],{indent:true}),
        new Paragraph({children:[new PageBreak()]}),

        // ==================== 目录 ====================
        new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:300},children:[new TextRun({text:"目  录",bold:true,size:36,font:headFont})]}),
        new TableOfContents("目录",{hyperlink:true,headingStyleRange:"1-3"}),
        new Paragraph({children:[new PageBreak()]}),

        // ═══════════════════════ 第1章 ═══════════════════════
        H1("第1章  需求分析"), E(),
        P("本章首先明确员工管理系统的开发目标和应用场景，然后从员工管理、员工类型管理和统计功能三个模块出发，详细梳理系统的功能需求，并对系统的菜单交互结构进行说明，为后续的系统设计奠定需求基础。"),
        E(),
        P("本系统旨在为企业人力资源管理部门提供一个轻量级的员工信息管理工具，能够在控制台环境下完成员工信息的录入、修改、删除、查询以及统计分析等日常操作，提高管理效率，降低人工管理的错误率。"),
        P("具体目标包括：①建立员工信息的电子化档案，替代传统纸质或Excel管理方式；②通过员工类型分类，支持不同类别员工的分组管理；③提供多维度统计功能，为管理人员提供数据决策支持。"),

        H2("1.1  功能需求"),
        H3("1.1.1  员工管理模块"),
        Bul("添加员工：录入姓名、电话、工号、地址、薪资，选择所属类型；支持手动输入编号或系统自动推荐编号（最大编号+1)；自动校验工号唯一性"),
        Bul("删除员工：列出所有员工信息，输入员工ID删除指定记录"),
        Bul("修改员工：输入员工ID后更新全部字段信息"),
        Bul("查询员工：按员工ID精确查询并显示详情"),
        Bul("查询全部：分页查询所有员工信息"),

        H3("1.1.2  员工类型管理模块"),
        Bul("添加类型：输入类型名称新增，自动校验名称是否重复，编号自动递增"),
        Bul("删除类型：按类型ID删除指定类型"),
        Bul("修改类型：按类型ID更新类型名称"),
        Bul("查询全部类型：列出所有员工类型及对应编号"),
        Bul("按类型查平均薪资：输入类型编号，查询该类型员工的平均工资"),

        H3("1.1.3  统计功能模块"),
        Bul("统计员工总数"),
        Bul("统计员工平均工资"),
        Bul("按类型统计最高工资"),
        Bul("按类型统计最低工资"),

        H2("1.2  系统菜单结构"),
        P("系统采用三级菜单设计：主菜单（EmpSystem)→ 子菜单（EmpMenu/EmpTypeMenu/StatisMenu)→ 具体功能操作。管理员通过控制台输入数字选择，操作完成后可逐级返回。",
           "主菜单如", "表1-1", "所示。"),
        E(),

        TCap("表1-1  系统主菜单"),
        CL("╔══════════════════════════════════════╗"),
        CL("║       欢迎使用员工管理系统           ║"),
        CL("║  1. 员工管理菜单                     ║"),
        CL("║  2. 员工类型管理菜单                 ║"),
        CL("║  3. 统计菜单                         ║"),
        CL("║  0. 退出系统                         ║"),
        CL("╚══════════════════════════════════════╝"),
        E(),
        P([R("员工管理子菜单（"),R("表1-2"),R(")包含添加、删除、修改、查询四项功能。")]),
        E(),
        TCap("表1-2  员工管理子菜单"),
        CL("  [1] 添加员工    [2] 删除员工"),
        CL("  [3] 修改员工    [4] 查询员工"),
        CL("  [0] 返回上级"),
        E(),
        P([R("员工类型管理子菜单（"),R("表1-3"),R(")包含增删改、查全部、按类型查平均薪资五项功能。")]),
        E(),
        TCap("表1-3  员工类型管理子菜单"),
        CL("  [1] 添加员工类型   [2] 删除员工类型   [3] 修改员工类型"),
        CL("  [4] 查询所有类型   [5] 按类型查平均薪资"),
        CL("  [0] 返回上级"),
        E(),
        P([R("统计子菜单（"),R("表1-4"),R(")包含总数、平均、最高、最低四项统计功能。")]),
        E(),
        TCap("表1-4  统计子菜单"),
        CL("  [1] 统计员工数量     [2] 统计员工平均工资"),
        CL("  [3] 统计最高工资     [4] 统计最低工资"),
        CL("  [0] 返回上级"),
        new Paragraph({children:[new PageBreak()]}),

        // ═══════════════════════ 第2章 ═══════════════════════
        H1("第2章  系统设计"), E(),
        P("在需求分析的基础上，本章对系统进行整体设计。首先阐述分层架构的设计思路和各层的职责划分，重点介绍菜单层的继承体系；随后进行数据库设计，包括E-R图的实体关系分析和数据表结构定义，为编码实现提供设计蓝图。"),
        E(),

        H2("2.1  系统分层架构"),
        P("本系统采用经典的分层架构设计，遵循\"高内聚、低耦合\"的原则，从上到下划分为五个层次。系统分层架构如", "表2-1", "所示。"),
        E(),
        TCap("表2-1  系统分层架构"),
        new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[1800,2500,4726], rows:[
          Row(["层次","包路径","职责"],[1800,2500,4726],"D9E2F3"),
          Row(["实体层","entity","定义数据载体类（Emp、EmpType)，使用Lombok注解自动生成getter/setter，与数据库表一一对应"],[1800,2500,4726]),
          Row(["数据访问层","dao + dao.impl","DAO<T>泛型接口定义CRUD契约；EmpDAO/EmpTypeDAO使用JDBC实现具体数据库操作"],[1800,2500,4726]),
          Row(["工具层","ds","DBConfig存储数据库连接配置；DBUtil封装Connection获取与资源释放"],[1800,2500,4726]),
          Row(["业务层","service","EmpService/EmpTypeService处理业务逻辑校验，调用DAO完成操作"],[1800,2500,4726]),
          Row(["表现层","menu + system","SysMenu为菜单基类（封装Scanner输入)；各Menu子类展示功能菜单；EmpSystem为系统主入口控制器"],[1800,2500,4726]),
        ]}),
        E(),
        P("Menu层采用继承体系：SysMenu作为基类封装Scanner对象和choice()方法，EmpSystem（主菜单)、EmpMenu（员工管理子菜单)、EmpTypeMenu（类型管理子菜单)、StatisMenu（统计子菜单)均继承自SysMenu，实现代码复用。"),
        P("以下为菜单基类的核心实现。SysMenu的设计思路是：将所有菜单都需要用到的Scanner输入功能提取到一个公共父类中，这样子类无需各自创建Scanner对象，只需继承SysMenu并调用choice()方法即可获取用户键盘输入，既消除了重复代码，又统一了输入行为。"),
        E(),
        P([R("SysMenu.java —— 菜单基类：")]),
        CL("public class SysMenu {"),
        CL("    Scanner scanner = new Scanner(System.in);"),
        CL("    protected int choice() {"),
        CL("        Scanner s = new Scanner(System.in);"),
        CL("        return s.nextInt();"),
        CL("    }"),
        CL("}"),
        E(),
        P([R("SysMenu类将Scanner对象和choice()方法封装为公共父类，通过extends关键字使EmpSystem、EmpMenu、EmpTypeMenu、StatisMenu四个子类自动继承输入功能，避免了在每个菜单类中重复编写键盘读取逻辑。"),R("这种设计体现了面向对象编程中\"封装变化点\"的原则——将可能发生变化的输入方式集中在一处管理，其余子类保持稳定不变。当输入源需从控制台切换为文件或网络流时，仅需修改SysMenu即可使所有子类同步生效。")]),
        E(),
        P([R("EmpSystem是整个系统的主控制器，其run()方法包含两个关键设计。"),R("第一，while(true)构建了持续运行的交互循环，用户操作完成后自动返回主菜单等待下一次输入，直至输入0退出。第二，switch-case结构承担路由分发的职责，根据choice变量将控制权转移到对应的子菜单。case 0采用return而非System.exit(0)——前者仅结束run()方法的执行并逐级返回调用栈，而后者会立即终止JVM进程，可能导致finally块中的资源清理代码无法执行。各case分支内部创建对应Menu对象并调用其run()方法，子菜单执行完毕自动返回此处，循环继续，形成\"主菜单→子菜单→返回主菜单\"的三级导航体系。")]),
        E(),
        P([R("EmpSystem.java（关键代码)：")]),
        CL("public class EmpSystem extends SysMenu {"),
        CL("    public void run() {"),
        CL("        int choice;"),
        CL("        while (true) {"),
        CL("            System.out.println(\"1.员工管理 2.类型管理 3.统计 0.退出\");"),
        CL("            choice = choice();"),
        CL("            switch (choice) {"),
        CL("                case 0: return;"),
        CL("                case 1: new EmpMenu().run(); break;"),
        CL("                case 2: new EmpTypeMenu().run(); break;"),
        CL("                case 3: new StatisMenu().run(); break;"),
        CL("            }"),
        CL("        }"),
        CL("    }"),
        CL("}"),
        E(),
        P([R("子菜单以EmpMenu为例。"),R("它继承SysMenu后重写run()方法展示自己的菜单选项，通过判断用户输入的分支值调用不同的Service方法完成实际操作。注意这里run()声明了throws Exception——因为EmpService中的方法可能抛出异常，向上抛给调用方EmpSystem中的try-catch统一处理是最简洁的做法。核心代码如下：")]),
        E(),
        P([R("EmpMenu.java（关键代码)：")]),
        CL("public class EmpMenu extends SysMenu {"),
        CL("    private EmpService empService = new EmpService();"),
        CL("    public void run() throws Exception {"),
        CL("        int i = 1;"),
        CL("        while (i != 0) {"),
        CL("            System.out.println(\"1.添加 2.删除 3.修改 4.查询 0.返回\");"),
        CL("            i = scanner.nextInt();"),
        CL("            switch (i) {"),
        CL("                case 1: empService.addEmp(); break;"),
        CL("                case 2: empService.deleteEmp(); break;"),
        CL("                case 3: empService.updateEmp(); break;"),
        CL("                case 4: empService.queryEmpById(); break;"),
        CL("                case 0: return;"),
        CL("            }"),
        CL("        }"),
        CL("    }"),
        CL("}"),
        E(),
        P([R("EmpMenu的设计严格遵循分层架构中\"上层依赖下层接口、不关心下层实现细节\"的原则。"),R("run()方法仅负责菜单展示与用户输入分发，所有数据操作均委托给empService对象完成，Menu层完全不接触JDBC代码。这种\"关注点分离\"的设计使各层职责清晰：Menu层处理用户交互，Service层处理业务逻辑，DAO层处理数据库操作。扩展新功能时，例如增加查询全部员工功能，只需在EmpMenu中添加菜单选项、在EmpService中添加对应方法、在EmpDAO中添加SQL语句即可，三层修改相互独立。此外，成员变量empService采用声明处直接初始化的方式，适用于学习阶段，在大型项目中通常使用构造器注入或Spring框架管理依赖，以实现更灵活的组件替换和单元测试。")]),

        H2("2.2  数据库设计"),
        H3("2.2.1  E-R图"),
        P("系统包含两个实体：员工（Emp)和员工类型（EmpType)。二者之间为多对一关系——一个员工类型下可以有多个员工，一个员工只能属于一种员工类型。Emp实体通过type_id外键关联EmpType的type_id主键。"),
        E(),
        P([R("Emp（员工)"),R(" —— emp_id（主键)、emp_name、emp_tel、emp_no、emp_addr、emp_salary、type_id（外键)")],{indent:false}),
        P([R("EmpType（员工类型)"),R(" —— type_id（主键)、type_name")],{indent:false}),
        E(),

        H3("2.2.2  数据表结构"),
        P("数据库名称：253254，字符集：UTF-8。"),
        P("emp表结构如", "表2-2", "所示。"),
        E(),
        TCap("表2-2  emp表（员工信息表)"),
        new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[2000,1500,1200,400,1200,2726], rows:[
          Row(["字段名","数据类型","长度","允许空","约束","说明"],[2000,1500,1200,400,1200,2726],"D9E2F3"),
          Row(["emp_id","INT","11","否","主键 自增","员工编号"],[2000,1500,1200,400,1200,2726]),
          Row(["emp_name","VARCHAR","50","否","","员工姓名"],[2000,1500,1200,400,1200,2726]),
          Row(["emp_tel","VARCHAR","20","是","","联系电话"],[2000,1500,1200,400,1200,2726]),
          Row(["emp_no","VARCHAR","20","否","","工号"],[2000,1500,1200,400,1200,2726]),
          Row(["emp_addr","VARCHAR","100","是","","地址"],[2000,1500,1200,400,1200,2726]),
          Row(["emp_salary","DOUBLE","","是","","薪资"],[2000,1500,1200,400,1200,2726]),
          Row(["type_id","INT","11","是","外键","员工类型ID"],[2000,1500,1200,400,1200,2726]),
        ]}),
        E(),
        P("emp_type表结构如", "表2-3", "所示。"),
        E(),
        TCap("表2-3  emp_type表（员工类型表)"),
        new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[2000,1500,1200,400,1200,2726], rows:[
          Row(["字段名","数据类型","长度","允许空","约束","说明"],[2000,1500,1200,400,1200,2726],"D9E2F3"),
          Row(["type_id","INT","11","否","主键 自增","类型编号"],[2000,1500,1200,400,1200,2726]),
          Row(["type_name","VARCHAR","50","否","","类型名称"],[2000,1500,1200,400,1200,2726]),
        ]}),
        new Paragraph({children:[new PageBreak()]}),

        // ═══════════════════════ 第3章 ═══════════════════════
        H1("第3章  系统实现"), E(),
        P("本章结合关键代码详细说明系统的核心技术实现，包括JDBC数据库连接技术、DAO泛型接口与实现、业务层逻辑以及菜单层的交互流程。"),
        E(),

        H2("3.1  JDBC数据库连接技术"),
        P("系统使用JDBC（Java Database Connectivity)作为Java与MySQL数据库之间的桥梁。操作数据库遵循标准的五步流程，如", "表3-1", "所示。"),
        E(),
        TCap("表3-1  JDBC五步流程"),
        new Table({ width:{size:9026,type:WidthType.DXA}, columnWidths:[1000,1500,2880,3646], rows:[
          Row(["步骤","关键词","对应代码","说明"],[1000,1500,2880,3646],"D9E2F3"),
          Row(["1","加载驱动","Class.forName(...)","注册MySQL驱动"],[1000,1500,2880,3646]),
          Row(["2","获取连接","DriverManager.getConnection(...)","建立TCP连接到MySQL"],[1000,1500,2880,3646]),
          Row(["3","创建语句","conn.prepareStatement(sql)","预编译SQL防注入"],[1000,1500,2880,3646]),
          Row(["4","执行SQL","executeUpdate()/executeQuery()","增删改/查询"],[1000,1500,2880,3646]),
          Row(["5","释放资源","conn.close()/try-with-resources","关闭连接释放资源"],[1000,1500,2880,3646]),
        ]}),
        E(),
        P("DBUtil工具类封装了连接获取和释放，DBConfig接口集中存储配置信息。为什么要把URL和密码单独放在DBConfig中？这是配置与逻辑分离的基本原则——当数据库地址或密码发生变化时，只需修改DBConfig这一个文件，DBUtil和所有DAO代码完全不受影响："),
        E(),
        P([R("DBConfig.java —— 数据库配置常量：")]),
        CL("public interface DBConfig {"),
        CL("    String URL = \"jdbc:mysql://localhost:3306/253254\";"),
        CL("    String USER = \"root\";"),
        CL("    String PASSWORD = \"****\";"),
        CL("}"),
        E(),
        P([R("接口存储常量利用了Java接口中字段默认public static final的特性，无需额外修饰符即可定义全局常量。"),R("这种集中管理方式便于修改和维护，适合小型项目与学习阶段。在实际工程中，密码等敏感配置信息应存放于.properties或.yml配置文件并通过环境变量注入，避免硬编码在源码中随版本控制扩散。从接口常量到外部配置文件的演进，是理解Spring Boot等框架配置管理机制的基础。")]),
        E(),
        P([R("DBUtil.java —— 连接工具类。"),R("getConnection()静态方法封装了DriverManager的调用细节，调用方只需一行代码就能获取数据库连接。close()方法做了两件事：先判空（避免NullPointerException)，再关闭连接。这是一个防御性编程的好习惯——永远假设传入的参数可能为空：")]),
        CL("public class DBUtil {"),
        CL("    public static Connection getConnection() throws Exception {"),
        CL("        return DriverManager.getConnection("),
        CL("            DBConfig.URL, DBConfig.USER, DBConfig.PASSWORD);"),
        CL("    }"),
        CL("    public static void close(Connection conn) throws Exception {"),
        CL("        if (conn != null) { conn.close(); }"),
        CL("    }"),
        CL("}"),
        E(),
        P([R("close()方法声明throws Exception要求调用方必须处理该异常，处理方式包括继续向上抛出或使用try-catch捕获。"),R("在学习阶段采用向上抛出的策略有利于快速定位问题——连接关闭失败通常意味着底层网络中断或数据库服务故障，静默忽略可能导致问题积累。在生产环境中，关闭连接时的异常通常仅记录日志而不中断业务流程，因为核心操作已完成。此外，方法内对conn的判空检查是必要的防御性编程措施：若getConnection()因网络异常而未能返回有效连接对象，对null调用close()将抛出NullPointerException，导致程序异常终止。")]),
        E(),
        P("系统全面使用PreparedStatement预编译语句防止SQL注入。下面这段add()方法是整个DAO层的核心代表，它完整展示了JDBC操作的四步：获取连接→编写SQL（?占位符)→绑定参数→执行。注意参数绑定从1开始而不是0——这是JDBC的硬性约定，初学者很容易踩坑。每个?对应一个setXxx()调用，String用setString、Double用setDouble、Integer用setInt，类型必须严格匹配："),
        E(),
        P([R("EmpDAO.queryById() —— 按ID查询员工：")]),
        CL("public Emp queryById(int id) throws Exception {"),
        CL("    conn = DBUtil.getConnection();"),
        CL("    String sql = \"select * from emp where emp_id = ?\";"),
        CL("    PreparedStatement pstmt = conn.prepareStatement(sql);"),
        CL("    pstmt.setInt(1, id);"),
        CL("    ResultSet rs = pstmt.executeQuery();"),
        CL("    Emp emp = null;"),
        CL("    if (rs.next()) {"),
        CL("        emp = new Emp();"),
        CL("        emp.setEmpId(rs.getInt(\"emp_id\"));"),
        CL("        emp.setEmpName(rs.getString(\"emp_name\"));"),
        CL("        emp.setEmpTel(rs.getString(\"emp_tel\"));"),
        CL("        emp.setEmpNo(rs.getString(\"emp_no\"));"),
        CL("        emp.setEmpAddr(rs.getString(\"emp_addr\"));"),
        CL("        emp.setEmpSalary(rs.getDouble(\"emp_salary\"));"),
        CL("        emp.setTypeId(rs.getInt(\"type_id\"));"),
        CL("    }"),
        CL("    DBUtil.close(conn);"),
        CL("    return emp;"),
        CL("}"),
        E(),
        P([R("查询操作与增删改存在本质区别：前者使用executeQuery()返回ResultSet结果集，后者使用executeUpdate()返回受影响行数。"),R("ResultSet是一个游标结构，初始位置在第一条记录之前，必须调用next()方法才能逐行下移读取数据。getXxx()方法按列名或列序号提取字段值——列名方式可读性更好但略有性能开销，列序号方式效率更高但在表结构变化时容易出错，实践推荐使用列名方式。代码中if (rs.next())保证只处理第一条结果，如果未查询到记录则返回null，由上层调用方进行判空处理。")]),

        H2("3.2  DAO设计模式"),
        P("系统定义泛型接口DAO<T>作为所有数据访问对象的统一契约。<T>在Java中叫类型参数——你可以把它理解为占位符，使用的时候再用具体的类（如Emp、EmpType)替换。正是因为这个设计，一套接口可以复用于所有数据表，新增一个Dept表时只需写class DeptDAO implements DAO<Dept>，接口本身完全不用动："),
        E(),
        P([R("DAO.java —— 泛型数据访问接口：")]),
        CL("public interface DAO<T> {"),
        CL("    int add(T t) throws Exception;"),
        CL("    int delete(int id) throws Exception;"),
        CL("    int update(T t) throws Exception;"),
        CL("    T queryById(int id) throws Exception;"),
        CL("    List<T> queryAll(int pageNum, int pageSize) throws Exception;"),
        CL("}"),
        E(),
        P([R("接口方法统一声明throws Exception，在学习阶段能够简化异常处理流程，调用方可通过统一的catch(Exception e)拦截所有数据库异常。"),R("但该设计存在异常信息模糊的不足——方法签名无法精确表达可能抛出的异常类型（如SQLException或IOException)，调用方难以根据异常类型采取差异化处理策略。工程实践中更推荐的做法是先定义自定义异常类（如DataAccessException)，DAO实现层用try-catch捕获底层SQLException后包装为自定义异常重新抛出，使上层代码能够根据异常类型进行精确处理（如数据库连接异常触发重试机制，业务规则违反则返回友好提示)。从统一throws Exception到自定义异常体系，是异常处理机制从学习阶段向生产环境演进的关键步骤。")]),
        E(),
        P("EmpDAO实现了DAO<Emp>接口，除5个标准CRUD方法外，还扩展了findAll()（查全部不分页)、checkEmpNo()（工号查重)、maxEmpNo()（最大工号)、getEmpCount()（统计总数)、getEmpAvgSalary()（平均工资)、getEmpMaxSalary()（按类型最高工资)、getEmpMinSalary()（按类型最低工资)等辅助方法。"),
        P("EmpTypeDAO实现了DAO<EmpType>接口，扩展了addEmpType()、deleteEmpType()、updateEmpType()、queryAllEmpType()、queryAvgSalaryByType()（按类型查平均工资)、getMaxId()（最大类型编号)、checkEmpTypeName()（类型名称查重)等方法。"),

        H2("3.3  业务层实现"),
        P("Service层作为Menu层和DAO层之间的桥梁，是整个分层架构中最关键的一环。如果让Menu层直接调用DAO层，菜单代码就会和SQL细节纠缠在一起，改菜单可能破坏数据逻辑、改数据库可能影响界面展示。引入Service层之后，Menu只管展示和分发，DAO只管执行SQL，Service在中间负责接收用户输入、进行业务校验（如addEmp中的编号查重和类型列表展示)、调用DAO完成操作。三层各司其职、互不干扰。"),
        E(),
        P([R("EmpService主要方法：")]),
        Bul("addEmp() —— 输入姓名/电话/编号/地址/工资/类型，支持手动编号（查重校验)和自动编号（maxEmpNo+1)两种模式"),
        Bul("deleteEmp() —— 展示全部员工 → 输入emp_id → 删除"),
        Bul("updateEmp() —— 输入emp_id及全部新字段值 → 更新"),
        Bul("queryEmpById() —— 输入emp_id → 查询并打印详情"),
        Bul("getEmpCount() / getEmpAvgSalary() / getEmpMaxSalary() / getEmpMinSalary() —— 统计功能"),
        E(),
        P([R("EmpTypeService主要方法：")]),
        Bul("addEmpType() —— 输入类型名称，查重后自动编号（getMaxId+1)添加"),
        Bul("deleteEmpType() / updateEmpType() —— 按ID删除/修改"),
        Bul("queryAllEmpType() —— 查询全部类型"),
        Bul("queryAvgSalaryByType() —— 输入类型ID，查询该类型员工平均工资"),

        H2("3.4  程序入口"),
        P("系统入口类为Test.java，只需两行代码：先new一个EmpSystem实例，再调用它的run()方法，整个系统就启动了。之所以如此简洁，恰恰说明了分层架构的价值——所有底层细节都被封装在DAO层和Service层内部，入口类完全不需要关心数据库怎么连接、SQL怎么写。调用链路为：Test.main() → EmpSystem.run()（主菜单)→ EmpMenu/EmpTypeMenu/StatisMenu.run()（子菜单)→ EmpService/EmpTypeService → EmpDAO/EmpTypeDAO → DBUtil → MySQL。"),
        E(),
        P([R("Test.java —— 系统启动入口：")]),
        CL("public class Test {"),
        CL("    public static void main(String[] args) {"),
        CL("        EmpSystem system = new EmpSystem();"),
        CL("        system.run();"),
        CL("    }"),
        CL("}"),
        E(),
        P([R("入口代码仅有两行，其简洁性来自分层架构对各层细节的封装。"),R("new EmpSystem()触发Java类加载机制，JVM依次加载EmpSystem、SysMenu及其所有依赖类，完成类型初始化和内存分配。system.run()调用将控制权交入while(true)主循环，整个程序的执行流从这两行代码展开为完整的控制台应用。与之形成对比的是项目中test目录下的App.java——未分层时main方法包含了大量JDBC初始化代码与业务处理逻辑，降低了可读性与可维护性。分层后入口类仅声明启动意图，所有实现细节封装在各层内部。这一设计原则与Spring Boot的SpringApplication.run()一脉相承——企业级框架同样追求入口的极简化，将复杂性收敛到框架内部。")]),
        E(),
        P([R("Emp.java —— 实体类。"),R("实体类使用Lombok框架的三个核心注解简化代码：@Data自动生成所有字段的getter、setter、toString、equals和hashCode方法；@NoArgsConstructor和@AllArgsConstructor分别生成无参和全参构造方法。在没有Lombok之前，上述方法需要手动编写约一百行模板代码，维护成本较高。empSalary字段采用Double包装类型而非double基本类型，是因为数据库对应列允许NULL值，而基本类型无法表达空值语义，在从数据库读取NULL列时会抛出异常。typeId字段作为外键关联emp_type表的主键，体现了面向对象模型与关系型数据库之间的对象-关系映射（ORM)思想。")]),
        CL("@Data @NoArgsConstructor @AllArgsConstructor @ToString"),
        CL("public class Emp {"),
        CL("    private Integer empId;    private String empName;"),
        CL("    private String empTel;    private String empNo;"),
        CL("    private String empAddr;   private Double empSalary;"),
        CL("    private Integer typeId;   // 外键，关联emp_type表"),
        CL("}"),
        E(),
        P("通过@Data注解，Lombok自动生成getter/setter/toString等方法，原本100+行手写代码缩减为约10行。"),
        new Paragraph({children:[new PageBreak()]}),

        // ═══════════════════════ 第4章 ═══════════════════════
        H1("第4章  结束语"), E(),
        P("本章对本次软件开发实践进行回顾与总结，归纳在JDBC技术、分层架构、面向对象编程等方面的主要收获，同时客观分析系统存在的不足之处，为后续学习指明改进方向。"),
        E(),
        P("通过本次软件开发实践，我完成了一个完整的员工管理系统，从需求分析、数据库设计到编码实现和功能测试，完整地体验了软件开发的各个阶段。主要收获："),
        E(),
        P([R("1. 掌握了JDBC数据库编程技术。通过实践深入理解了JDBC五步流程、PreparedStatement预编译语句的使用、ResultSet结果集的处理以及资源的正确释放方式。")],{indent:true}),
        P([R("2. 理解了分层架构和DAO设计模式。通过将系统划分为entity、dao、ds、service、menu等多个层次，体会到\"高内聚、低耦合\"的架构优势。DAO泛型接口的设计让我理解了面向接口编程的价值。")],{indent:true}),
        P([R("3. 掌握了面向对象编程的核心思想。从继承（SysMenu基类体系)、泛型（DAO<T>)、接口到Lombok注解，在实践中巩固了Java面向对象的各项关键技术。")],{indent:true}),
        P([R("4. 提升了问题分析与解决能力。在开发过程中遇到数据库连接失败、SQL语法错误、资源泄漏等问题，通过查阅资料和调试逐步解决，培养了独立分析和解决问题的能力。")],{indent:true}),
        E(),
        P("同时，本系统也存在一些不足：目前仅支持控制台操作界面，后续可考虑增加Web界面；Service层的部分业务逻辑校验（如类型ID校验)还需完善；尚未实现事务管理机制，涉及多表操作时可能存在数据一致性问题。这些都是在今后学习中需要继续深入的方向。"),
        P("总之，本次实践课题让我将课堂所学的Java基础知识、数据库原理和软件工程方法综合运用到了实际项目中，加深了对软件开发全流程的理解，为今后的学习和职业发展打下了坚实的基础。"),
        new Paragraph({children:[new PageBreak()]}),

        // ═══════════════════════ 参考文献 ═══════════════════════
        H1("参考文献"), E(),
        P("[01] 林信良. Java学习笔记 JDK9 [M]. 北京: 清华大学出版社, 2018.6"),
        P("[02] 李辉. 数据库原理与应用基础(MySQL) [M]. 北京: 高等教育出版社, 2019.8"),
        P("[03] 张帆等. Java范例开发大全 [M]. 北京: 清华大学出版社, 2010.6"),
        new Paragraph({children:[new PageBreak()]}),

        // ═══════════════════════ 附录 ═══════════════════════
        H1("附录  关键源代码"), E(),
        P("附录按层次列出系统的完整关键代码：实体层定义数据结构，数据访问层封装JDBC操作，工具层管理数据库连接，菜单层处理用户交互，最后是程序入口。这里列出的代码是正文中引用的完整版本，可以对照第3章的分析阅读，理解每一段代码在整个系统中所处的位置和承担的职责。"), E(),

        H2("一、实体层"), E(),
        CL("@Data @NoArgsConstructor @AllArgsConstructor @ToString"),
        CL("public class Emp {"),
        CL("    private Integer empId;"),
        CL("    private String empName;"),
        CL("    private String empTel;"),
        CL("    private String empNo;"),
        CL("    private String empAddr;"),
        CL("    private Double empSalary;"),
        CL("    private Integer typeId;"),
        CL("}"),
        E(),
        CL("@Data @NoArgsConstructor @AllArgsConstructor @ToString"),
        CL("public class EmpType {"),
        CL("    private int typeId;"),
        CL("    private String typeName;"),
        CL("}"),
        E(),

        H2("二、数据访问层"), E(),
        CL("public interface DAO<T> {"),
        CL("    int add(T t) throws Exception;"),
        CL("    int delete(int id) throws Exception;"),
        CL("    int update(T t) throws Exception;"),
        CL("    T queryById(int id) throws Exception;"),
        CL("    List<T> queryAll(int pageNum, int pageSize) throws Exception;"),
        CL("}"),
        E(),
        CL("public class EmpDAO implements DAO<Emp> {"),
        CL("    private Connection conn;"),
        CL(""),
        CL("    public int delete(int id) throws Exception {"),
        CL("        conn = DBUtil.getConnection();"),
        CL("        String sql = \"delete from emp where emp_id = ?\";"),
        CL("        PreparedStatement pstmt = conn.prepareStatement(sql);"),
        CL("        pstmt.setInt(1, id);"),
        CL("        int i = pstmt.executeUpdate();"),
        CL("        DBUtil.close(conn);"),
        CL("        return i;"),
        CL("    }"),
        CL(""),
        CL("    public Emp queryById(int id) throws Exception {"),
        CL("        conn = DBUtil.getConnection();"),
        CL("        String sql = \"select * from emp where emp_id = ?\";"),
        CL("        PreparedStatement pstmt = conn.prepareStatement(sql);"),
        CL("        pstmt.setInt(1, id);"),
        CL("        ResultSet rs = pstmt.executeQuery();"),
        CL("        Emp emp = null;"),
        CL("        if (rs.next()) {"),
        CL("            emp = new Emp();"),
        CL("            emp.setEmpId(rs.getInt(\"emp_id\"));"),
        CL("            emp.setEmpName(rs.getString(\"emp_name\"));"),
        CL("            emp.setEmpTel(rs.getString(\"emp_tel\"));"),
        CL("            emp.setEmpNo(rs.getString(\"emp_no\"));"),
        CL("            emp.setEmpAddr(rs.getString(\"emp_addr\"));"),
        CL("            emp.setEmpSalary(rs.getDouble(\"emp_salary\"));"),
        CL("            emp.setTypeId(rs.getInt(\"type_id\"));"),
        CL("        }"),
        CL("        DBUtil.close(conn);"),
        CL("        return emp;"),
        CL("    }"),
        CL(""),
        CL("    public List<Object[]> getEmpMaxSalary() throws Exception {"),
        CL("        conn = DBUtil.getConnection();"),
        CL("        String sql = \"select type_id,max(emp_salary) from emp group by type_id\";"),
        CL("        PreparedStatement pstmt = conn.prepareStatement(sql);"),
        CL("        ResultSet rs = pstmt.executeQuery();"),
        CL("        List<Object[]> list = new ArrayList<>();"),
        CL("        while (rs.next()) {"),
        CL("            list.add(new Object[]{rs.getInt(1),rs.getDouble(2)});"),
        CL("        }"),
        CL("        DBUtil.close(conn);"),
        CL("        return 0;"),
        CL("    }"),
        CL(""),
        CL("    public double getEmpAvgSalary() throws Exception {"),
        CL("        conn = DBUtil.getConnection();"),
        CL("        String sql = \"select avg(emp_salary) from emp\";"),
        CL("        PreparedStatement pstmt = conn.prepareStatement(sql);"),
        CL("        ResultSet rs = pstmt.executeQuery();"),
        CL("        if (rs.next()) {"),
        CL("            double avg = rs.getDouble(1);"),
        CL("            DBUtil.close(conn);"),
        CL("            return avg;"),
        CL("        }"),
        CL("        DBUtil.close(conn);"),
        CL("        return 0;"),
        CL("    }"),
        CL(""),
        CL("    public List<Object[]> getEmpMaxSalary() throws Exception {"),
        CL("        conn = DBUtil.getConnection();"),
        CL("        String sql = \"select type_id,max(emp_salary) from emp group by type_id\";"),
        CL("        PreparedStatement pstmt = conn.prepareStatement(sql);"),
        CL("        ResultSet rs = pstmt.executeQuery();"),
        CL("        List<Object[]> list = new ArrayList<>();"),
        CL("        while (rs.next())"),
        CL("            list.add(new Object[]{rs.getInt(1),rs.getDouble(2)});"),
        CL("        DBUtil.close(conn);"),
        CL("        return list;"),
        CL("    }"),
        CL("}"),
        new Paragraph({children:[new PageBreak()]}),

        H2("三、工具层"), E(),
        CL("public interface DBConfig {"),
        CL("    String URL = \"jdbc:mysql://localhost:3306/253254\";"),
        CL("    String USER = \"root\";"),
        CL("    String PASSWORD = \"****\";"),
        CL("}"),
        E(),
        CL("public class DBUtil {"),
        CL("    public static Connection getConnection() throws Exception {"),
        CL("        return DriverManager.getConnection("),
        CL("            DBConfig.URL, DBConfig.USER, DBConfig.PASSWORD);"),
        CL("    }"),
        CL("    public static void close(Connection conn) throws Exception {"),
        CL("        if (conn != null) conn.close();"),
        CL("    }"),
        CL("}"),

        H2("四、菜单层"), E(),
        CL("public class SysMenu {"),
        CL("    Scanner scanner = new Scanner(System.in);"),
        CL("    protected int choice() {"),
        CL("        Scanner s = new Scanner(System.in);"),
        CL("        return s.nextInt();"),
        CL("    }"),
        CL("}"),
        E(),
        CL("public class EmpSystem extends SysMenu {"),
        CL("    public void run() {"),
        CL("        int choice;"),
        CL("        while (true) {"),
        CL("            System.out.println(\"1.员工管理 2.类型管理 3.统计 0.退出\");"),
        CL("            choice = choice();"),
        CL("            switch (choice) {"),
        CL("                case 0: return;"),
        CL("                case 1: new EmpMenu().run(); break;"),
        CL("                case 2: new EmpTypeMenu().run(); break;"),
        CL("                case 3: new StatisMenu().run(); break;"),
        CL("            }"),
        CL("        }"),
        CL("    }"),
        CL("}"),
        E(),
        CL("public class EmpMenu extends SysMenu {"),
        CL("    private EmpService empService = new EmpService();"),
        CL("    public void run() throws Exception {"),
        CL("        int i = 1;"),
        CL("        while (i != 0) {"),
        CL("            System.out.println(\"1.添加 2.删除 3.修改 4.查询 0.返回\");"),
        CL("            i = scanner.nextInt();"),
        CL("            switch (i) {"),
        CL("                case 1: empService.addEmp(); break;"),
        CL("                case 2: empService.deleteEmp(); break;"),
        CL("                case 3: empService.updateEmp(); break;"),
        CL("                case 4: empService.queryEmpById(); break;"),
        CL("                case 0: return;"),
        CL("            }"),
        CL("        }"),
        CL("    }"),
        CL("}"),

        H2("五、程序入口"), E(),
        CL("public class Test {"),
        CL("    public static void main(String[] args) {"),
        CL("        EmpSystem system = new EmpSystem();"),
        CL("        system.run();"),
        CL("    }"),
        CL("}"),
      ]
    }
  ]
});

// ══════════ 输出 ══════════
const out = "E:\\我的桌面\\202532044329-朱柯旭\\202532044329-朱柯旭.docx";
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(out, buf);
  console.log("OK: " + out + " (" + buf.length + " bytes)");
});
