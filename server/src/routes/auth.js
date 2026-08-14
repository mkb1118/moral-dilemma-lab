const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { signToken } = require("../middleware/auth");
const { schemas, validate } = require("../lib/validation");
const { HttpError } = require("../lib/errors");

const router = express.Router();

// 匿名/微信登录：用 openid 或临时用户名创建用户
router.post("/wx-login", async (req, res, next) => {
  try {
    const { openid, nickname, avatarUrl } = validate(schemas.wxLogin, req.body);
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
    next(e);
  }
});

// 密码注册（Web 端备用）
router.post("/register", async (req, res, next) => {
  try {
    const { nickname, password } = validate(schemas.register, req.body);
    // nickname 未加数据库唯一约束（wx 登录默认昵称会冲突），故在应用层显式查重
    const existing = await prisma.user.findFirst({ where: { nickname } });
    if (existing) throw new HttpError(409, "该昵称已被注册");
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { nickname, passwordHash } });
    res.json({ token: signToken(user), user: { id: user.id, nickname: user.nickname } });
  } catch (e) {
    next(e);
  }
});

// 密码登录
router.post("/login", async (req, res, next) => {
  try {
    const { nickname, password } = validate(schemas.login, req.body);
    const user = await prisma.user.findFirst({ where: { nickname } });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "用户不存在" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "密码错误" });
    res.json({ token: signToken(user), user: { id: user.id, nickname: user.nickname } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
