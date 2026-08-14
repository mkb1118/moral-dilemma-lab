const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// 我的资料
router.get("/me", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, nickname: true, avatarUrl: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "用户不存在" });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

// 我的测试历史（keyset 分页：?limit=&cursor=<startedAtIso>_<id>）
router.get("/me/history", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : null;

    const where = { userId: req.userId };
    if (cursor) {
      const idx = cursor.lastIndexOf("_");
      const startedAt = cursor.slice(0, idx);
      const id = cursor.slice(idx + 1);
      where.OR = [
        { startedAt: { lt: new Date(startedAt) } },
        { startedAt: new Date(startedAt), id: { lt: id } },
      ];
    }

    const sessions = await prisma.testSession.findMany({
      where,
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      take: limit + 1, // 多取一条判断是否还有下一页
      include: { testType: true, result: true },
    });

    const hasMore = sessions.length > limit;
    const items = hasMore ? sessions.slice(0, limit) : sessions;
    const nextCursor =
      hasMore && items.length
        ? `${items[items.length - 1].startedAt.toISOString()}_${items[items.length - 1].id}`
        : null;

    res.json({ items, nextCursor, hasMore });
  } catch (e) {
    next(e);
  }
});

// 收藏会话
router.post("/favorites/:sessionId", async (req, res, next) => {
  try {
    const fav = await prisma.userFavorite.create({
      data: { userId: req.userId, sessionId: req.params.sessionId },
    });
    res.status(201).json(fav);
  } catch (e) {
    next(e);
  }
});

// 取消收藏
router.delete("/favorites/:sessionId", async (req, res, next) => {
  try {
    await prisma.userFavorite.deleteMany({
      where: { userId: req.userId, sessionId: req.params.sessionId },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
