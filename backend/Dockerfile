# ============================================================
# Stage 1: 构建阶段 — 安装依赖、生成 Prisma 客户端、编译 TS
# ============================================================
FROM node:20-alpine AS builder

# 安装 libc6-compat 确保 Alpine 上的 Node.js 兼容性
RUN apk add --no-cache libc6-compat

WORKDIR /app

# 先复制依赖清单，利用 Docker 层缓存加速后续构建
COPY package.json package-lock.json ./
RUN npm ci

# 复制 Prisma schema 并生成客户端（需要 schema 和 prisma CLI）
COPY prisma/ ./prisma/
RUN npx prisma generate

# 复制 TypeScript 配置和源码并编译
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ============================================================
# Stage 2: 运行阶段 — 最小化的生产镜像
# ============================================================
FROM node:20-alpine AS runner

# libc6-compat: Node.js 兼容层
# postgresql-client: 提供 pg_isready，供启动等待脚本检查 PostgreSQL 连接
RUN apk add --no-cache libc6-compat postgresql-client

WORKDIR /app

# 从构建阶段复制编译产物和依赖
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# 复制启动等待脚本并赋予执行权限
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]
