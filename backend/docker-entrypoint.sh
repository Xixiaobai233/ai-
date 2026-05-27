#!/bin/sh
set -e

echo "========================================"
echo "  PostgreSQL 连接等待"
echo "========================================"

# 从环境变量中读取数据库连接信息，提供合理默认值
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"

# 循环等待 PostgreSQL 就绪
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; do
  echo "  -> PostgreSQL 尚未就绪，2 秒后重试..."
  sleep 2
done

echo "  -> PostgreSQL 已就绪！"

echo ""
echo "========================================"
echo "  执行数据库迁移"
echo "========================================"

# 优先尝试正式迁移，失败则回退到 db push（开发/快速迭代场景）
npx prisma migrate deploy 2>/dev/null || npx prisma db push

echo ""
echo "========================================"
echo "  启动后端应用"
echo "========================================"

exec "$@"
