const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { signToken } = require("../middleware/auth");

const router = express.Router();

// 匿名/微信登录：用 openid 或临时用户名创建用户
router.post("/wx-login", async (req, res) => {
  try {
    const { openid, nickname, avatarUrl } = req.body || {};
    if (!openid) {
      return res.status(400).json({ error: "缺少 openid" });
    }
    let user = await prisma.user.findUnique({ where: { wxOpenid: openid } });
    if (!user) {
      user = await prisma.user.create({
        data: { wxOpenid: openid, nickname: nickname || "测试用户", avatarUrl },
      });
    } else if (nickname && !user.nickname) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { nickname, avatarUrl },
      });
    }
    res.json({ token: signToken(user), user: { id: user.id, nickname: user.nickname } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 密码注册（Web 端备用）
router.post("/register", async (req, res) => {
  try {
    const { nickname, password } = req.body || {};
    if (!nickname || !password) {
      return res.status(400).json({ error: "缺少昵称或密码" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { nickname, passwordHash },
    });
    res.json({ token: signToken(user), user: { id: user.id, nickname: user.nickname } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 密码登录
router.post("/login", async (req, res) => {
  try {
    const { nickname, password } = req.body || {};
    const user = await prisma.user.findFirst({ where: { nickname } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "用户不存在" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "密码错误" });
    res.json({ token: signToken(user), user: { id: user.id, nickname: user.nickname } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
