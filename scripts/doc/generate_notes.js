const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  PageBreak, LevelFormat, Header, Footer, PageNumber, TableOfContents
} = require("docx");

// ============ 辅助函数 ============

const BLUE = "2E75B6";
const DARK = "333333";
const GRAY = "666666";
const LIGHT = "999999";
const RED = "E74C3C";

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const hdrBorder = { style: BorderStyle.SINGLE, size: 1, color: BLUE };
const hdrBorders = { top: hdrBorder, bottom: hdrBorder, left: hdrBorder, right: hdrBorder };

function hdrCell(text, width) {
  return new TableCell({
    borders: hdrBorders, width: { size: width, type: WidthType.DXA },
    shading: { fill: BLUE, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })] })]
  });
}

function tc(text, width, opts = {}) {
  return new TableCell({
    borders: cellBorders, width: { size: width, type: WidthType.DXA },
    shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      children: [new TextRun({ text, font: "Arial", size: 19, bold: opts.bold || false, color: opts.color || DARK })]
    })]
  });
}

// Java 代码块：一个带标题的跑得通的完整示例
function javaExample(title, code, output) {
  const blocks = [];
  blocks.push(new Paragraph({ spacing: { before: 200, after: 60 },
    children: [new TextRun({ text: "▎" + title, font: "Arial", size: 20, bold: true, color: BLUE })] }));
  blocks.push(new Paragraph({
    spacing: { before: 0, after: 0 }, indent: { left: 240 },
    border: { left: { style: BorderStyle.SINGLE, size: 4, color: "D5E8F0", space: 8 } },
    children: [new TextRun({ text: "文件名：", font: "Arial", size: 17, color: LIGHT }), new TextRun({ text: title + ".java", font: "Consolas", size: 17, color: "888888", italics: true })]
  }));
  const lines = code.split("\n");
  lines.forEach((line, i) => {
    blocks.push(new Paragraph({
      spacing: { before: 0, after: 0 }, indent: { left: 480 },
      children: [new TextRun({ text: line || " ", font: "Consolas", size: 17, color: "1A5276" })]
    }));
  });
  if (output) {
    blocks.push(new Paragraph({ spacing: { before: 60, after: 40 }, indent: { left: 360 },
      children: [new TextRun({ text: "运行结果：", font: "Arial", size: 18, bold: true, color: "27AE60" }),
                 new TextRun({ text: output, font: "Consolas", size: 17, color: "555555" })] }));
  }
  return blocks;
}

// 要点归纳框
function keyPoints(title, items) {
  const blocks = [];
  blocks.push(new Paragraph({ spacing: { before: 200, after: 80 },
    children: [new TextRun({ text: "📌 " + title, font: "Arial", size: 20, bold: true, color: BLUE })] }));
  items.forEach(item => {
    blocks.push(new Paragraph({
      spacing: { before: 30, after: 30 }, indent: { left: 360 },
      children: [new TextRun({ text: "▸ " + item, font: "Arial", size: 19, color: DARK })]
    }));
  });
  return blocks;
}

function warnBox(title, text) {
  return new Paragraph({
    spacing: { before: 120, after: 120 }, indent: { left: 240 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: RED, space: 8 } },
    children: [
      new TextRun({ text: "⚠ " + title + "：", font: "Arial", size: 19, bold: true, color: RED }),
      new TextRun({ text, font: "Arial", size: 19, color: "C0392B" })
    ]
  });
}

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, font: "Arial", bold: true, size: 30, color: BLUE })] });
}

function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 140 },
    children: [new TextRun({ text, font: "Arial", bold: true, size: 24, color: BLUE })] });
}

function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: "Arial", bold: true, size: 21, color: "444444" })] });
}

function p(text) {
  return new Paragraph({ spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: "Arial", size: 20, color: DARK })] });
}

function bullet(text) {
  return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { before: 30, after: 30 },
    children: [new TextRun({ text, font: "Arial", size: 19, color: DARK })] });
}

// ============ 正文内容 ============

const C = [];

// —————————— 封面 ——————————
C.push(new Paragraph({ spacing: { before: 2800 }, children: [] }));
C.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 150 },
  children: [new TextRun({ text: "Java 集合框架", font: "Arial", bold: true, size: 50, color: BLUE })] }));
C.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
  children: [new TextRun({ text: "Collection Framework", font: "Arial", size: 26, color: GRAY })] }));
C.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [new TextRun({ text: "从入门到考试通关", font: "Arial", size: 22, color: GRAY })] }));
C.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 12 } },
  children: [new TextRun({ text: "所有示例均可直接编译运行", font: "Arial", size: 19, color: LIGHT })] }));

// —————————— 目录 ——————————
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(new Paragraph({ spacing: { after: 200 },
  children: [new TextRun({ text: "目  录", font: "Arial", bold: true, size: 30, color: BLUE })] }));
C.push(new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }));

// ================================================================
// 第一层：为什么需要集合？从数组说起
// ================================================================
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(h1("第一部分  从数组到集合 — 为什么要学集合？"));

C.push(h2("1.1 先看数组有什么痛点"));

C.push(...javaExample("ArrayProblem",
`public class ArrayProblem {
    public static void main(String[] args) {
        // 痛点1：长度固定，不能动态扩容
        String[] names = new String[3];
        names[0] = "张三";
        names[1] = "李四";
        names[2] = "王五";
        // names[3] = "赵六";  // ❌ 数组越界！ArrayIndexOutOfBoundsException

        // 痛点2：删除元素要自己写逻辑
        // 痛点3：没有现成的方法，查找、排序全得自己写
        // 痛点4：数组不能直接打印，得用 Arrays.toString()
        System.out.println("数组：" + java.util.Arrays.toString(names));
    }
}`,
"数组：[张三, 李四, 王五]"
));

C.push(p("数组的四大缺陷："));
C.push(bullet("长度固定 — 一旦创建无法扩容"));
C.push(bullet("功能单一 — 没有增删改查的现成方法"));
C.push(bullet("操作麻烦 — 删除要移位，插入要腾位置"));
C.push(bullet("没有统一接口 — 不同数据结构遍历方式各异"));

C.push(h2("1.2 集合框架一图总览"));
C.push(p("Java 把常见的数据结构抽象成一套接口和实现类，这就是「集合框架」："));

C.push(new Paragraph({
  spacing: { before: 100, after: 100 }, indent: { left: 240 },
  border: { left: { style: BorderStyle.SINGLE, size: 4, color: "D5E8F0", space: 8 } },
  children: [
    new TextRun({ text: `Iterable（最顶层，表示「可被遍历」）\n`, font: "Consolas", size: 17, color: "555555" }),
    new TextRun({ text: "  └── Collection（存单个元素）\n", font: "Consolas", size: 17, color: "555555" }),
    new TextRun({ text: "        ├── List（有序可重复）  → ArrayList / LinkedList\n", font: "Consolas", size: 17, color: "555555" }),
    new TextRun({ text: "        ├── Set（无序不可重复） → HashSet / TreeSet\n", font: "Consolas", size: 17, color: "555555" }),
    new TextRun({ text: "        └── Queue（队列）       → LinkedList / PriorityQueue\n", font: "Consolas", size: 17, color: "555555" }),
    new TextRun({ text: "  \nMap（存键值对，独立接口）\n", font: "Consolas", size: 17, color: "555555" }),
    new TextRun({ text: "        └── HashMap / TreeMap / LinkedHashMap", font: "Consolas", size: 17, color: "555555" }),
  ]
}));

C.push(p("记住这个层级关系：Iterable → Collection → List/Set/Queue，Map 是另一个分支。"));

// ================================================================
// 第二层：迭代器 — 所有集合遍历的基石
// ================================================================
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(h1("第二部分  迭代器 Iterator — 遍历的统一方式"));

C.push(h2("2.1 一句话理解迭代器"));
C.push(p("迭代器就像磁带播放机的磁头，它不拥有数据，只是指向数据中的一个位置，每次「读」完就往前挪一格。"));

C.push(...javaExample("IteratorDemo",
`import java.util.*;

public class IteratorDemo {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("A");
        list.add("B");
        list.add("C");

        // 第1步：拿到迭代器
        Iterator<String> it = list.iterator();

        // 第2步：hasNext() 问"还有吗？"→ next() 取出来
        while (it.hasNext()) {
            String s = it.next();
            System.out.println(s);
        }
        // 输出：A B C（每行一个）
    }
}`,
"A\nB\nC"
));

C.push(h2("2.2 Iterator 接口的三个方法"));
const T1 = 2400, T2 = 3400, T3 = 3560;
C.push(new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [T1, T2, T3],
  rows: [
    new TableRow({ children: [hdrCell("方法", T1), hdrCell("作用", T2), hdrCell("注意", T3)] }),
    ...[
      ["hasNext()", "判断是否还有下一个元素", "返回 true/false，不移动指针"],
      ["next()", "返回当前元素，指针后移一步", "没元素时调用抛异常"],
      ["remove()", "删除刚刚 next() 返回的元素", "每次 next() 后只能调一次"],
    ].map((r, i) => new TableRow({ children: [
      tc(r[0], T1, { bold: true, shading: i % 2 === 0 ? "F5F5F5" : undefined }),
      tc(r[1], T2, { shading: i % 2 === 0 ? "F5F5F5" : undefined }),
      tc(r[2], T3, { shading: i % 2 === 0 ? "F5F5F5" : undefined }),
    ]}))
  ]
}));
C.push(p(""));

C.push(h2("2.3 for-each 的本质就是迭代器"));
C.push(...javaExample("ForEachPrinciple",
`import java.util.*;

public class ForEachPrinciple {
    public static void main(String[] args) {
        List<String> list = Arrays.asList("X", "Y", "Z");

        // 写法一：for-each（语法糖）
        for (String s : list) {
            System.out.println(s);
        }

        // 写法二：上面的 for-each 编译后等价于这个
        System.out.println("---");
        Iterator<String> it = list.iterator();
        while (it.hasNext()) {
            String s = it.next();
            System.out.println(s);
        }
    }
}`,
"X\nY\nZ\n---\nX\nY\nZ"
));

C.push(h2("2.4 考试最核心的两个陷阱"));

C.push(h3("陷阱一：遍历时删元素 → 必须用迭代器的 remove()"));
C.push(...javaExample("FailFastDemo",
`import java.util.*;

public class FailFastDemo {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
        list.add("A"); list.add("B"); list.add("C"); list.add("D");

        // ===== 错误写法：用集合的 remove =====
        // for (String s : list) {
        //     if (s.equals("B")) {
        //         list.remove(s);  // ❌ ConcurrentModificationException
        //     }
        // }

        // ===== 正确写法：用迭代器的 remove =====
        Iterator<String> it = list.iterator();
        while (it.hasNext()) {
            String s = it.next();
            if (s.equals("B")) {
                it.remove();  // ✅ 删除迭代器刚返回的元素
            }
        }
        System.out.println("删除后：" + list);
    }
}`,
"删除后：[A, C, D]"
));

C.push(h3("陷阱二：空集合直接 next()"));
C.push(...javaExample("NoSuchElementDemo",
`import java.util.*;

public class NoSuchElementDemo {
    public static void main(String[] args) {
        Set<String> emptySet = new HashSet<>(); // 空集合
        Iterator<String> it = emptySet.iterator();
        System.out.println(it.hasNext());     // false
        // it.next();  // ❌ NoSuchElementException！
    }
}`,
"false"
));

C.push(...keyPoints("迭代器考点速记", [
  "for-each 底层就是迭代器",
  "ConcurrentModificationException → 边遍历边用集合的 remove() 修改",
  "NoSuchElementException → 没判断 hasNext() 就调 next()",
  "遍历时删除元素 → 只能用迭代器的 remove()，不能用集合的 remove()",
  "Set 和 Map 没有索引，只能靠迭代器或 for-each 遍历",
]));

// ================================================================
// 第三层：List — 有索引、有顺序、可重复
// ================================================================
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(h1("第三部分  List — 有序、可重复、有索引"));

C.push(h2("3.1 List 就像带编号的座位"));
C.push(p("List 最像数组：每个元素有固定位置（索引），可以按号入座，同一个元素可以坐在多个位置。"));

C.push(h3("List 核心方法速览"));
const LW1 = 3200, LW2 = 6160;
C.push(new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [LW1, LW2],
  rows: [
    new TableRow({ children: [hdrCell("方法签名", LW1), hdrCell("作用", LW2)] }),
    ...[
      ["add(E e)", "在末尾添加元素"],
      ["add(int index, E e)", "在指定位置插入，原位置及后面元素往后移"],
      ["get(int index)", "返回指定索引的元素"],
      ["set(int index, E e)", "替换指定位置的元素，返回旧值"],
      ["remove(int index)", "删除指定索引的元素，返回被删元素"],
      ["remove(Object o)", "删除第一个匹配的元素，返回是否成功"],
      ["indexOf(Object o)", "返回第一次出现的索引，不存在返回 -1"],
      ["size()", "返回元素个数"],
      ["subList(from, to)", "截取子列表 [from, to)"],
    ].map((r, i) => new TableRow({ children: [
      tc(r[0], LW1, { bold: true, shading: i % 2 === 0 ? "F5F5F5" : undefined }),
      tc(r[1], LW2, { shading: i % 2 === 0 ? "F5F5F5" : undefined }),
    ]}))
  ]
}));
C.push(p(""));

C.push(h2("3.2 完整可运行示例"));
C.push(...javaExample("ListExample",
`import java.util.*;

public class ListExample {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();

        // --- 增 ---
        list.add("A");                       // 末尾添加
        list.add("B");
        list.add(1, "X");                    // 在索引1处插入
        System.out.println("增后：" + list);  // [A, X, B]

        // --- 查 ---
        System.out.println("索引1的元素：" + list.get(1));  // X
        System.out.println("A的位置：" + list.indexOf("A")); // 0

        // --- 改 ---
        list.set(0, "Z");                    // 把索引0改成 Z
        System.out.println("改后：" + list);  // [Z, X, B]

        // --- 删 ---
        list.remove(1);                      // 删除索引1
        System.out.println("删后：" + list);  // [Z, B]

        // --- 遍历 ---
        for (int i = 0; i < list.size(); i++) {
            System.out.println("list[" + i + "] = " + list.get(i));
        }
    }
}`,
"增后：[A, X, B]\n索引1的元素：X\nA的位置：0\n改后：[Z, X, B]\n删后：[Z, B]\nlist[0] = Z\nlist[1] = B"
));

C.push(h2("3.3 必考陷阱：remove() 重载"));
C.push(...javaExample("ListRemoveTrap",
`import java.util.*;

public class ListRemoveTrap {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        list.add(10);
        list.add(20);
        list.add(30);
        //          索引: 0    1    2

        list.remove(1);
        //  ↑ 匹配的是 remove(int index)，删除索引1 → 删掉了 20！
        System.out.println("remove(1) 后：" + list);  // [10, 30]

        list.remove(Integer.valueOf(10));
        //  ↑ 匹配的是 remove(Object o)，删除值为10的元素
        System.out.println("remove(Integer.valueOf(10)) 后：" + list); // [30]
    }
}`,
"remove(1) 后：[10, 30]\nremove(Integer.valueOf(10)) 后：[30]"
));
C.push(warnBox("考试必考", "List<Integer> 中 remove(1) 默认走 remove(int index)，不是 remove(Object)。要按值删必须写成 remove(Integer.valueOf(1))。"));

C.push(h2("3.4 ArrayList vs LinkedList 对比"));
const ALW = 2000, ALV = 3680, ALV2 = 3680;
C.push(new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [ALW, ALV, ALV2],
  rows: [
    new TableRow({ children: [hdrCell("", ALW), hdrCell("ArrayList", ALV), hdrCell("LinkedList", ALV2)] }),
    ...[
      ["底层", "动态数组 Object[]", "双向链表（节点+指针）"],
      ["查询 get(i)", "⚡ 快 O(1)，直接算偏移", "🐢 慢 O(n)，从头开始数"],
      ["头部增删", "🐢 慢 O(n)，全部要搬", "⚡ 快 O(1)，改两个指针"],
      ["中间增删", "🐢 慢 O(n)，后面元素搬移", "⚡ 快（找到位置后是O(1)）"],
      ["尾部增删", "⚡ 快（均摊O(1)）", "⚡ 快 O(1)"],
      ["内存", "紧凑，只存数据", "每节点多存两个指针（prev/next）"],
      ["一句话", "查多用这个", "改多用这个"],
    ].map((r, i) => new TableRow({ children: [
      tc(r[0], ALW, { bold: true, shading: i % 2 === 0 ? "F5F5F5" : undefined }),
      tc(r[1], ALV, { shading: i % 2 === 0 ? "F5F5F5" : undefined }),
      tc(r[2], ALV2, { shading: i % 2 === 0 ? "F5F5F5" : undefined }),
    ]}))
  ]
}));
C.push(p(""));

C.push(...keyPoints("List 考点速记", [
  "有序、可重复、有索引 → 能用 for 循环 + get(i) 遍历",
  "add(index, e) 是插入，原来位置的元素往后移",
  "remove(int) 删索引，remove(Object) 删值 → Integer 要小心",
  "日常开发 90% 用 ArrayList，只有频繁头部插入才用 LinkedList",
]));

// ================================================================
// 第四层：Set — 没有重复元素
// ================================================================
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(h1("第四部分  Set — 无序、不可重复"));

C.push(h2("4.1 Set 就是一袋子不同的东西"));
C.push(p("Set 的核心价值：自动去重。同一个东西放不进去第二次。没有索引，不能按位置取值。"));

C.push(...javaExample("SetBasic",
`import java.util.*;

public class SetBasic {
    public static void main(String[] args) {
        Set<String> set = new HashSet<>();

        set.add("apple");
        set.add("banana");
        set.add("apple");       // 重复！不会加进去，返回 false
        boolean added = set.add("apple");
        System.out.println("第二次加apple：" + added);  // false

        System.out.println("集合内容：" + set);
        System.out.println("大小：" + set.size());       // 2
        System.out.println("有apple吗？" + set.contains("apple")); // true

        // Set 没有 get() 方法！只能用 for-each
        for (String s : set) {
            System.out.println(s);
        }
    }
}`,
"第二次加apple：false\n集合内容：[banana, apple]\n大小：2\n有apple吗？true\nbanana\napple"
));

C.push(h2("4.2 ⭐ HashSet 去重原理（考试必考）"));
C.push(p("HashSet 判断两个元素是否相同，分两步走："));

C.push(new Paragraph({
  spacing: { before: 80, after: 80 }, indent: { left: 360 },
  children: [new TextRun({ text: "第①步：hashCode() → 哈希值不同？那肯定不是同一个东西，直接放进去\n第②步：哈希值相同？→ 再调 equals() → 内容也相同？→ 认为是重复，不放", font: "Arial", size: 19, color: DARK })]
}));

C.push(p("所以如果存自定义对象，两个方法必须同时重写！"));
C.push(...javaExample("HashSetStudent",
`import java.util.*;

class Student {
    String name;
    int age;

    Student(String name, int age) { this.name = name; this.age = age; }

    // 必须重写 equals
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Student)) return false;
        Student s = (Student) o;
        return age == s.age && Objects.equals(name, s.name);
    }

    // 必须重写 hashCode
    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }

    @Override
    public String toString() { return name + "(" + age + ")"; }
}

public class HashSetStudent {
    public static void main(String[] args) {
        Set<Student> set = new HashSet<>();
        set.add(new Student("张三", 20));
        set.add(new Student("李四", 21));
        set.add(new Student("张三", 20)); // name、age 都一样 → 去重！
        System.out.println(set); // 只有两个元素
    }
}`,
"[张三(20), 李四(21)]"
));
C.push(warnBox("考试口诀", "hashCode 先过筛，equals 定终身。重写必成对，否则去重失效！"));

C.push(h2("4.3 三种 Set 怎么选"));
const SW = 2200, SV = 2500, SV2 = 2300, SV3 = 2360;
C.push(new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [SW, SV, SV2, SV3],
  rows: [
    new TableRow({ children: [hdrCell("实现类", SW), hdrCell("顺序", SV), hdrCell("底层", SV2), hdrCell("速度", SV3)] }),
    ...[
      ["HashSet", "无序", "HashMap", "O(1) 最快"],
      ["LinkedHashSet", "保持插入顺序", "HashMap + 链表", "O(1) 稍慢"],
      ["TreeSet", "自动排序", "红黑树", "O(log n)"],
    ].map((r, i) => new TableRow({ children: [
      tc(r[0], SW, { bold: true, shading: i % 2 === 0 ? "F5F5F5" : undefined }),
      tc(r[1], SV, { shading: i % 2 === 0 ? "F5F5F5" : undefined }),
      tc(r[2], SV2, { shading: i % 2 === 0 ? "F5F5F5" : undefined }),
      tc(r[3], SV3, { center: true, shading: i % 2 === 0 ? "F5F5F5" : undefined }),
    ]}))
  ]
}));
C.push(p(""));

C.push(...keyPoints("Set 考点速记", [
  "无序、不可重复、无索引 → 不能用 get()，不能用普通 for",
  "去重靠 hashCode + equals → 自定义对象必须同时重写",
  "日常去重用 HashSet，要排序用 TreeSet，要保留插入顺序用 LinkedHashSet",
]));

// ================================================================
// 第五层：Map — 键值对
// ================================================================
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(h1("第五部分  Map — 键值对存储"));

C.push(h2("5.1 Map 就像字典"));
C.push(p("你查字典的时候，是通过「字（键）」找到「释义（值）」。Map 就是做这件事的——一个键映射一个值。"));

C.push(...javaExample("MapBasic",
`import java.util.*;

public class MapBasic {
    public static void main(String[] args) {
        Map<String, Integer> map = new HashMap<>();

        // --- 增/改 ---
        map.put("apple", 3);               // 存入键值对
        map.put("banana", 5);
        map.put("apple", 10);              // 键相同 → 覆盖旧值！
        System.out.println("put后：" + map); // {apple=10, banana=5}

        // --- 查 ---
        System.out.println("apple的值：" + map.get("apple"));       // 10
        System.out.println("有orange吗？" + map.containsKey("orange")); // false
        System.out.println("默认值：" + map.getOrDefault("orange", 0)); // 0

        // --- 删 ---
        map.remove("banana");
        System.out.println("删后：" + map);  // {apple=10}

        System.out.println("大小：" + map.size());  // 1
    }
}`,
"put后：{apple=10, banana=5}\napple的值：10\n有orange吗？false\n默认值：0\n删后：{apple=10}\n大小：1"
));

C.push(h2("5.2 三种遍历方式（考点）"));

C.push(...javaExample("MapIterate",
`import java.util.*;

public class MapIterate {
    public static void main(String[] args) {
        Map<String, Integer> map = new HashMap<>();
        map.put("语文", 90);
        map.put("数学", 85);
        map.put("英语", 92);

        // 方式一：entrySet → 推荐！一次拿到键和值
        System.out.println("=== entrySet ===");
        for (Map.Entry<String, Integer> entry : map.entrySet()) {
            System.out.println(entry.getKey() + " = " + entry.getValue());
        }

        // 方式二：keySet → 拿到键后再查值（多一次查找）
        System.out.println("=== keySet ===");
        for (String key : map.keySet()) {
            System.out.println(key + " = " + map.get(key));
        }

        // 方式三：forEach（Java 8+）
        System.out.println("=== forEach ===");
        map.forEach((k, v) -> System.out.println(k + " = " + v));
    }
}`,
"=== entrySet ===\n语文 = 90\n数学 = 85\n英语 = 92\n=== keySet ===\n语文 = 90\n数学 = 85\n英语 = 92\n=== forEach ===\n语文 = 90\n数学 = 85\n英语 = 92"
));

C.push(h2("5.3 HashMap vs TreeMap vs Hashtable"));
const MW = 1900, MV = 2500, MV2 = 2500, MV3 = 2460;
C.push(new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [MW, MV, MV2, MV3],
  rows: [
    new TableRow({ children: [hdrCell("", MW), hdrCell("HashMap", MV), hdrCell("TreeMap", MV2), hdrCell("Hashtable", MV3)] }),
    ...[
      ["null 键", "✅ 允许一个", "❌ 不允许", "❌ 不允许"],
      ["null 值", "✅ 允许", "✅ 允许", "❌ 不允许"],
      ["顺序", "无序", "按键排序", "无序"],
      ["线程安全", "❌", "❌", "✅ 但已过时"],
      ["速度", "最快 O(1)", "O(log n)", "慢"],
      ["用在哪", "日常首选", "要排序时", "已淘汰，用 ConcurrentHashMap"],
    ].map((r, i) => new TableRow({ children: [
      tc(r[0], MW, { bold: true, shading: i % 2 === 0 ? "F5F5F5" : undefined }),
      tc(r[1], MV, { shading: i % 2 === 0 ? "F5F5F5" : undefined }),
      tc(r[2], MV2, { shading: i % 2 === 0 ? "F5F5F5" : undefined }),
      tc(r[3], MV3, { shading: i % 2 === 0 ? "F5F5F5" : undefined }),
    ]}))
  ]
}));
C.push(p(""));

C.push(...keyPoints("Map 考点速记", [
  "键不可重复（重复 put 会覆盖），值可以重复",
  "遍历首选 entrySet()，一次取键值效率最高",
  "HashMap 的键也要重写 hashCode + equals（和 HashSet 一样）",
  "HashMap 允许一个 null 键、多个 null 值；Hashtable 都不允许",
]));

// ================================================================
// 第六层：Collections 工具类
// ================================================================
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(h1("第六部分  Collections 工具类"));

C.push(h2("6.1 注意区分"));

C.push(new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [3000, 6360],
  rows: [
    new TableRow({ children: [hdrCell("名词", 3000), hdrCell("是什么", 6360)] }),
    new TableRow({ children: [
      tc("Collection", 3000, { bold: true, shading: "F5F5F5" }),
      tc("接口 — List、Set 的父接口", 6360, { shading: "F5F5F5" })
    ]}),
    new TableRow({ children: [
      tc("Collections", 3000, { bold: true }),
      tc("工具类 — 全是静态方法，操作集合用", 6360)
    ]}),
  ]
}));
C.push(p(""));

C.push(h2("6.2 常用方法演示"));
C.push(...javaExample("CollectionsDemo",
`import java.util.*;

public class CollectionsDemo {
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>();
        Collections.addAll(list, 3, 1, 4, 1, 5, 9);

        Collections.sort(list);              // 排序
        System.out.println("排序：" + list);  // [1, 1, 3, 4, 5, 9]

        Collections.reverse(list);           // 反转
        System.out.println("反转：" + list);  // [9, 5, 4, 3, 1, 1]

        Collections.shuffle(list);           // 随机打乱
        System.out.println("打乱：" + list);

        System.out.println("最大：" + Collections.max(list));
        System.out.println("最小：" + Collections.min(list));
        System.out.println("1出现了几次：" + Collections.frequency(list, 1));

        int idx = Collections.binarySearch(list, 5); // 二分查找（必须已排序！）
        System.out.println("5的位置：" + idx);
    }
}`,
"排序：[1, 1, 3, 4, 5, 9]\n反转：[9, 5, 4, 3, 1, 1]\n打乱：（随机）\n最大：9\n最小：1\n1出现了几次：2\n5的位置：（排序后二分查找结果）"
));

// ================================================================
// 第七层：总复习
// ================================================================
C.push(new Paragraph({ children: [new PageBreak()] }));
C.push(h1("第七部分  总复习 — 一张表搞定"));

C.push(h2("7.1 选择决策树"));
C.push(new Paragraph({
  spacing: { before: 100, after: 100 }, indent: { left: 240 },
  border: { left: { style: BorderStyle.SINGLE, size: 4, color: "D5E8F0", space: 8 } },
  children: [
    new TextRun({ text: "需要「键→值」的映射？\n", font: "Consolas", size: 17, color: DARK }),
    new TextRun({ text: "  ├── 是 → 需要排序？\n", font: "Consolas", size: 17, color: DARK }),
    new TextRun({ text: "  │        ├── 是 → TreeMap\n", font: "Consolas", size: 17, color: "1A5276" }),
    new TextRun({ text: "  │        └── 否 → HashMap\n", font: "Consolas", size: 17, color: "1A5276" }),
    new TextRun({ text: "  └── 否 → 元素能重复吗？\n", font: "Consolas", size: 17, color: DARK }),
    new TextRun({ text: "           ├── 能 → 要频繁按索引查？\n", font: "Consolas", size: 17, color: DARK }),
    new TextRun({ text: "           │        ├── 是 → ArrayList\n", font: "Consolas", size: 17, color: "1A5276" }),
    new TextRun({ text: "           │        └── 否 → LinkedList\n", font: "Consolas", size: 17, color: "1A5276" }),
    new TextRun({ text: "           └── 不能 → 需要排序？\n", font: "Consolas", size: 17, color: DARK }),
    new TextRun({ text: "                    ├── 是 → TreeSet\n", font: "Consolas", size: 17, color: "1A5276" }),
    new TextRun({ text: "                    └── 否 → HashSet\n", font: "Consolas", size: 17, color: "1A5276" }),
  ]
}));

C.push(h2("7.2 四大异常速查"));
const EW = 2600, EV = 3400, EV2 = 3360;
C.push(new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [EW, EV, EV2],
  rows: [
    new TableRow({ children: [hdrCell("异常", EW), hdrCell("什么时候触发", EV), hdrCell("一句话记忆", EV2)] }),
    ...[
      ["ConcurrentModificationException", "遍历时（for-each/迭代器）用集合的 add/remove 修改", "边遍历边改集合就炸"],
      ["NoSuchElementException", "迭代器没元素了还调 next()", "不问 hasNext 就 next"],
      ["IndexOutOfBoundsException", "List 索引 <0 或 >=size()", "越界了"],
      ["ClassCastException", "TreeSet/TreeMap 存不可比较的对象", "要排序但没实现 Comparable"],
    ].map((r, i) => new TableRow({ children: [
      tc(r[0], EW, { bold: true, color: RED, shading: i % 2 === 0 ? "F5F5F5" : undefined }),
      tc(r[1], EV, { shading: i % 2 === 0 ? "F5F5F5" : undefined }),
      tc(r[2], EV2, { shading: i % 2 === 0 ? "F5F5F5" : undefined }),
    ]}))
  ]
}));
C.push(p(""));

C.push(h2("7.3 三大接口终极对比"));
const FW = 1400, FV = 1200, FV2 = 1400, FV3 = 1300, FV4 = 1800, FV5 = 2260;
C.push(new Table({
  width: { size: 9360, type: WidthType.DXA }, columnWidths: [FW, FV, FV2, FV3, FV4, FV5],
  rows: [
    new TableRow({ children: [
      hdrCell("接口", FW), hdrCell("有序", FV), hdrCell("可重复", FV2), hdrCell("有索引", FV3), hdrCell("遍历方式", FV4), hdrCell("第一选择", FV5)
    ]}),
    new TableRow({ children: [
      tc("List", FW, { bold: true, shading: "F5F5F5" }),
      tc("✅", FV, { center: true, shading: "F5F5F5" }),
      tc("✅", FV2, { center: true, shading: "F5F5F5" }),
      tc("✅", FV3, { center: true, shading: "F5F5F5" }),
      tc("for/for-each/迭代器", FV4, { shading: "F5F5F5" }),
      tc("ArrayList", FV5, { bold: true, shading: "F5F5F5" }),
    ]}),
    new TableRow({ children: [
      tc("Set", FW, { bold: true }),
      tc("❌", FV, { center: true }),
      tc("❌", FV2, { center: true }),
      tc("❌", FV3, { center: true }),
      tc("for-each/迭代器", FV4),
      tc("HashSet", FV5, { bold: true }),
    ]}),
    new TableRow({ children: [
      tc("Map", FW, { bold: true, shading: "F5F5F5" }),
      tc("❌(键)", FV, { center: true, shading: "F5F5F5" }),
      tc("❌(键)", FV2, { center: true, shading: "F5F5F5" }),
      tc("❌", FV3, { center: true, shading: "F5F5F5" }),
      tc("entrySet/keySet", FV4, { shading: "F5F5F5" }),
      tc("HashMap", FV5, { bold: true, shading: "F5F5F5" }),
    ]}),
  ]
}));
C.push(p(""));

C.push(h2("7.4 考前背诵清单"));
C.push(bullet("List = 有序 + 可重复 + 有索引 → ArrayList 查快，LinkedList 改快"));
C.push(bullet("Set = 无序 + 不可重复 + 无索引 → 去重靠 hashCode + equals"));
C.push(bullet("Map = 键值对 + 键不可重复 → 遍历用 entrySet，键要重写 hashCode + equals"));
C.push(bullet("迭代器 = hasNext() + next() + remove() → for-each 是它的语法糖"));
C.push(bullet("遍历时删元素 = 必须用迭代器的 remove() → 否则并发修改异常"));
C.push(bullet("Collection 是接口，Collections 是工具类 → 完全不同的东西"));
C.push(bullet("ArrayList 删索引，LinkedList 改指针 → 底层决定性能"));

C.push(new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER,
  children: [new TextRun({ text: "— END —", font: "Arial", size: 19, color: LIGHT, italics: true })] }));

// ============ 构建文档 ============
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 300, after: 140 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 21, bold: true, font: "Arial", color: "444444" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
    }]
  },
  sections: [{
    properties: {
      page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1200, bottom: 1200, left: 1200 } }
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 4 } },
        children: [new TextRun({ text: "Java 集合框架学习笔记", font: "Arial", size: 15, color: LIGHT, italics: true })]
      })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 4 } },
        children: [
          new TextRun({ text: "第 ", font: "Arial", size: 15, color: LIGHT }),
          new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 15, color: LIGHT }),
          new TextRun({ text: " 页", font: "Arial", size: 15, color: LIGHT })
        ]
      })] })
    },
    children: C
  }]
});

const outPath = "C:\\Users\\LENOVO\\Desktop\\Java集合框架学习笔记.docx";
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log("Done: " + outPath);
});
