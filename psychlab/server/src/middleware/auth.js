const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("缺少 JWT_SECRET 环境变量，请在 server/.env 中配置");
}

function signToken(user) {
  return jwt.sign({ sub: user.id, nickname: user.nickname }, JWT_SECRET, {
    expiresIn: "30d",
  });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "未登录" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "登录已过期" });
  }
}

module.exports = { signToken, requireAuth };
