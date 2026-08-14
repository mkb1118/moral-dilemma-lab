const { z } = require("zod");
const { HttpError } = require("./errors");

// 各接口入参 schema
const schemas = {
  register: z.object({
    nickname: z.string().trim().min(1, "昵称不能为空").max(20, "昵称最长 20 字"),
    password: z.string().min(6, "密码至少 6 位").max(64, "密码最长 64 位"),
  }),
  login: z.object({
    nickname: z.string().trim().min(1, "昵称不能为空"),
    password: z.string().min(1, "密码不能为空"),
  }),
  wxLogin: z.object({
    openid: z.string().trim().min(1, "缺少 openid"),
    nickname: z.string().trim().max(20).optional(),
    avatarUrl: z.string().optional(),
  }),
  createSession: z.object({
    testTypeId: z.string().trim().min(1, "缺少 testTypeId"),
    mode: z.string().trim().min(1, "缺少 mode"),
  }),
  answer: z.object({
    questionId: z.union([z.string(), z.number()]),
    answer: z.unknown(),
  }),
  complete: z.object({
    scores: z.unknown().refine((v) => v != null, "缺少 scores"),
    summary: z.string().optional(),
  }),
};

// 校验失败时抛出 400 HttpError；成功返回解析后的数据
function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0].message);
  }
  return result.data;
}

module.exports = { schemas, validate };
