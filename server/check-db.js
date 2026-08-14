require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
(async () => {
  const result = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log("Tables in psychlab:", result.map(r => r.table_name).join(", "));
  const users = await prisma.user.count();
  const tests = await prisma.testType.count();
  console.log("User rows:", users, "| TestType rows:", tests);
  await prisma.$disconnect();
})();
