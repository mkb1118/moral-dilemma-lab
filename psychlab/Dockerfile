# ============================================================
# Psychology Lab 云部署镜像
# 构建上下文 = 项目根目录（本文件所在目录）
# 后端会解析到 server/ 的上一级来读取前端目录，因此需一并拷贝
# ============================================================
FROM node:22-alpine

WORKDIR /app

# 1) 前端（页面 + 共享资源 + 题目数据，均为后端静态托管/数据源所需）
COPY index.html ./
COPY assets ./assets
COPY 测试广场 ./测试广场
COPY user-center ./user-center

# 2) 后端
COPY server ./server

WORKDIR /app/server
RUN npm install

EXPOSE 3000

# 启动前先迁移 + 播种（两者都幂等，重启安全），再启动 API
# 端口遵循平台注入的 $PORT（代码里已用 process.env.PORT || 3000）
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/index.js"]
