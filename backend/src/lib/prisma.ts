import type { PrismaClient } from '@prisma/client';

/**
 * 根据 DATABASE_URL 自动选择正确的 PrismaClient 实现：
 * - "file:" 开头 → 测试模式（SQLite，从 schema.test.prisma 生成）
 * - 其他（默认 postgresql://）→ 生产模式（PostgreSQL，从 schema.prisma 生成）
 */
const url = process.env.DATABASE_URL ?? '';

const { PrismaClient: PrismaClientImpl } = (
  url.startsWith('file:')
    ? require('../../node_modules/.prisma/client-test') as { PrismaClient: new () => PrismaClient }
    : require('@prisma/client') as { PrismaClient: new () => PrismaClient }
);

export const prisma: PrismaClient = new PrismaClientImpl();
