const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// 我的资料
router.get("/me", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, nickname: true, avatarUrl: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "用户不存在" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 我的测试历史
router.get("/me/history", async (req, res) => {
  try {
    const sessions = await prisma.testSession.findMany({
      where: { userId: req.userId },
      orderBy: { startedAt: "desc" },
      take: 50,
      include: { testType: true, result: true },
    });
    res.json(sessions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 收藏会话
router.post("/favorites/:sessionId", async (req, res) => {
  try {
    const fav = await prisma.userFavorite.create({
      data: { userId: req.userId, sessionId: req.params.sessionId },
    });
    res.json(fav);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 取消收藏
router.delete("/favorites/:sessionId", async (req, res) => {
  try {
    await prisma.userFavorite.deleteMany({
      where: { userId: req.userId, sessionId: req.params.sessionId },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
