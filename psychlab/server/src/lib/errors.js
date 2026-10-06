// 统一业务错误：携带 HTTP 状态码，供全局错误处理中间件识别
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

module.exports = { HttpError };
