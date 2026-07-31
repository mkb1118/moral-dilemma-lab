require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TEST_TYPES = [
  { id: "big-five", name: "大五人格评测", description: "基于 OCEAN 模型的人格全貌评测", modes: ["lite", "pro"] },
  { id: "cognitive-bias", name: "认知偏差检测", description: "12 类认知偏差情境检测", modes: ["standard"] },
  { id: "decision-style", name: "决策风格分析", description: "GDMS 框架决策风格分析", modes: ["standard"] },
  { id: "eq", name: "情绪智力评估", description: "MSCEIT + Goleman 情绪智力评估", modes: ["lite", "pro"] },
  { id: "moral", name: "道德困境实验室", description: "经典道德困境与人格画像", modes: ["lite", "pro"] },
  { id: "values-sort", name: "核心价值观排序", description: "Schwartz 价值观优先级排序", modes: ["standard"] },
];

async function main() {
  for (const t of TEST_TYPES) {
    await prisma.testType.upsert({
      where: { id: t.id },
      update: t,
      create: t,
    });
  }
  console.log(`Seeded ${TEST_TYPES.length} test types`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
