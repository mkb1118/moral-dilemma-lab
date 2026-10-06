require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { ZodError } = require("zod");
const { HttpError } = require("./lib/errors");
const authRoutes = require("./routes/auth");
const testRoutes = require("./routes/tests");
const sessionRoutes = require("./routes/sessions");
const userRoutes = require("./routes/users");

const app = express();
const PORT = process.env.PORT || 3000;
// 项目根目录（server/src -> ../../）
const ROOT = path.resolve(__dirname, "..", "..");

// 安全头（关闭 CSP：前端页面依赖大量内联 <script>/<style>）
app.use(helmet({ contentSecurityPolicy: false }));

// CORS 白名单（默认仅本地）+ 同源自动放行（兼容反向代理，http/https 均视为同源）
const CORS_ORIGIN = (process.env.CORS_ORIGIN || "http://127.0.0.1:3000,http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use((req, res, next) => {
  cors({
    origin: (origin, cb) => {
      // 无 origin（curl、部分请求）或白名单放行
      if (!origin || CORS_ORIGIN.includes(origin)) return cb(null, true);
      // 同源请求（Origin 的 host 与请求 host 一致）自动放行
      let host = "";
      try { host = new URL(origin).host; } catch (e) {}
      if (host && host === req.get("host")) return cb(null, true);
      return cb(new HttpError(403, "CORS 拒绝该来源"));
    },
    credentials: true,
  })(req, res, next);
});

// 解码 URL 中的中文路径（express.static 需要真实 Unicode 路径）
app.use((req, res, next) => {
  try { req.url = decodeURIComponent(req.url); } catch (e) {}
  next();
});

app.use(express.json({ limit: "2mb" }));

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`
    );
  });
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "psychlab-api" });
});

// 认证接口限流：防爆破
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "请求过于频繁，请稍后再试" },
});
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/users", userRoutes);

// 前端静态托管（白名单目录，避免暴露 vault 内其他内容）
const STATIC_DIRS = [
  "assets",
  "测试广场",
  "user-center",
];
STATIC_DIRS.forEach((dir) => app.use("/" + dir, express.static(path.join(ROOT, dir))));
app.get("/", (req, res) => res.sendFile(path.join(ROOT, "index.html")));

// 统一错误处理：不向客户端泄露内部信息
app.use((err, req, res, next) => {
  let status = 500;
  let message = "服务器内部错误";

  if (err instanceof HttpError) {
    status = err.status;
    message = err.message;
  } else if (err instanceof ZodError) {
    status = 400;
    message = err.issues[0]?.message || "请求参数不合法";
  } else if (err.code === "P2002") {
    status = 409;
    message = "记录已存在（唯一约束冲突）";
  } else {
    console.error(err); // 完整错误只记录在服务端日志
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`PsychLab API running at http://127.0.0.1:${PORT}`);
});
