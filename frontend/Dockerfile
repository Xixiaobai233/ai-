# ================================================================
# Stage 1 — Builder: build static assets with Vite
# ================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制依赖描述文件，利用 Docker 缓存层
COPY package.json package-lock.json ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# ================================================================
# Stage 2 — Runner: serve with Nginx (non-root)
# ================================================================
FROM nginx:alpine AS runner

# 授予 nginx 绑定低端口（80）的能力，使容器能以非 root 用户运行
RUN apk add --no-cache libcap && \
    setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx && \
    apk del libcap

# 确保 nginx 用户对运行时目录有写权限
RUN chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx

# 复制构建产物及自定义 nginx 配置
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 静态文件归 nginx 用户所有
RUN chown -R nginx:nginx /usr/share/nginx/html

# 切换到非 root 用户
USER nginx

EXPOSE 80

# nginx 默认 CMD 即可（nginx -g daemon off;）
