const test = require("node:test");
const assert = require("node:assert");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { signToken, requireAuth } = require("../src/middleware/auth");
const { schemas, validate } = require("../src/lib/validation");
const { HttpError } = require("../src/lib/errors");

test("signToken / requireAuth 往返成功", () => {
  const token = signToken({ id: "user-1", nickname: "小明" });
  const req = { headers: { authorization: "Bearer " + token } };
  let called = false;
  requireAuth(req, {}, () => { called = true; });
  assert.strictEqual(req.userId, "user-1");
  assert.strictEqual(called, true);
});

test("requireAuth 拒绝缺失 token", () => {
  let status = 0, body = null;
  const res = { status: (s) => { status = s; return { json: (b) => { body = b; } }; } };
  requireAuth({ headers: {} }, res, () => {});
  assert.strictEqual(status, 401);
  assert.strictEqual(body.error, "未登录");
});

test("requireAuth 拒绝非法 token", () => {
  let status = 0;
  const res = { status: (s) => { status = s; return { json: () => {} }; } };
  requireAuth({ headers: { authorization: "Bearer not-a-jwt" } }, res, () => {});
  assert.strictEqual(status, 401);
});

test("register schema 校验密码长度", () => {
  assert.strictEqual(schemas.register.safeParse({ nickname: "小明", password: "123456" }).success, true);
  assert.strictEqual(schemas.register.safeParse({ nickname: "小明", password: "123" }).success, false);
});

test("answer schema 接受数字或字符串 questionId", () => {
  assert.strictEqual(schemas.answer.safeParse({ questionId: 1, answer: "A" }).success, true);
  assert.strictEqual(schemas.answer.safeParse({ questionId: "q1", answer: { x: 1 } }).success, true);
  assert.strictEqual(schemas.answer.safeParse({ questionId: null, answer: "A" }).success, false);
});

test("validate 失败时抛 400 HttpError", () => {
  assert.throws(
    () => validate(schemas.login, { nickname: "", password: "" }),
    (e) => e instanceof HttpError && e.status === 400
  );
});
