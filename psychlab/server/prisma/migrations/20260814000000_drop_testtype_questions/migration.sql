-- DropColumn: TestType.questions 从未使用，题目数据改由各测试目录 data/*.json 承载
ALTER TABLE "TestType" DROP COLUMN "questions";
