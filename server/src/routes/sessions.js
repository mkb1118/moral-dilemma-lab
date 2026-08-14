const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");
const { schemas, validate } = require("../lib/validation");

const router = express.Router();
router.use(requireAuth);

// 创建会话
router.post("/", async (req, res, next) => {
  try {
    const { testTypeId, mode } = validate(schemas.createSession, req.body);
    const session = await prisma.testSession.create({
      data: { userId: req.userId, testTypeId, mode },
    });
    res.status(201).json(session);
  } catch (e) {
    next(e);
  }
});

// 提交单题答案
router.post("/:id/answer", async (req, res, next) => {
  try {
    const session = await prisma.testSession.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!session) return res.status(404).json({ error: "会话不存在" });
    if (session.status !== "in_progress") {
      return res.status(400).json({ error: "会话已完成" });
    }
    const { questionId, answer } = validate(schemas.answer, req.body);
    const saved = await prisma.sessionAnswer.upsert({
      where: { sessionId_questionId: { sessionId: session.id, questionId: String(questionId) } },
      update: { answer },
      create: { sessionId: session.id, questionId: String(questionId), answer },
    });
    res.json(saved);
  } catch (e) {
    next(e);
  }
});

// 完成会话并保存结果
router.post("/:id/complete", async (req, res, next) => {
  try {
    const session = await prisma.testSession.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { answers: true },
    });
    if (!session) return res.status(404).json({ error: "会话不存在" });

    const { scores, summary } = validate(schemas.complete, req.body);

    await prisma.testSession.update({
      where: { id: session.id },
      data: { status: "completed", completedAt: new Date() },
    });
    const result = await prisma.testResult.upsert({
      where: { sessionId: session.id },
      update: { scores, summary },
      create: { sessionId: session.id, scores, summary },
    });
    res.json({ sessionId: session.id, result });
  } catch (e) {
    next(e);
  }
});

// 查询会话详情（含答案与结果）
router.get("/:id", async (req, res, next) => {
  try {
    const session = await prisma.testSession.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { answers: true, result: true },
    });
    if (!session) return res.status(404).json({ error: "会话不存在" });
    res.json(session);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
