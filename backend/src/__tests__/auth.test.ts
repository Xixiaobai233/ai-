import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

/** 测试数据库标识名 */
const TEST_NAME = 'auth';
/** 相对 Prisma schema 目录的数据库文件路径（file:./ 相对于 prisma/） */
const DB_FILE = `file:./test.${TEST_NAME}.db`;
/** 磁盘上的绝对路径，用于清理 */
const DB_PATH = path.join(__dirname, '..', '..', 'prisma', `test.${TEST_NAME}.db`);

describe('Auth API', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(() => {
    // 必须在任何 prisma 依赖模块加载前设置环境变量
    process.env.DATABASE_URL = DB_FILE;
    process.env.JWT_SECRET = 'test-secret-key';

    // 清除模块缓存，使后续 require() 加载全新模块
    jest.resetModules();

    // 向测试数据库推送 schema
    execSync('npx prisma db push --schema=prisma/schema.test.prisma --skip-generate --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: DB_FILE },
      cwd: path.resolve(__dirname, '..', '..'),
      stdio: 'pipe',
    });

    // 惰性加载 prisma 和 app（此时 DATABASE_URL 已指向测试库）
    const { prisma: p } = require('../lib/prisma');
    const { createTestApp } = require('./helpers');
    prisma = p;
    app = createTestApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    // 清理数据库文件
    try {
      if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
      for (const suffix of ['-journal', '-wal', '-shm']) {
        const p = DB_PATH + suffix;
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    } catch {
      // 忽略清理错误
    }
  });

  beforeEach(async () => {
    // 按外键依赖顺序清空所有表
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  // ──────────────────────────────────────────────
  // 注册
  // ──────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('应该成功注册新用户 (201)', async () => {
      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', name: '测试用户', password: '123456' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({
        email: 'test@example.com',
        name: '测试用户',
      });
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('使用重复邮箱应返回 409', async () => {
      await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'dup@example.com', name: '用户1', password: '123456' });

      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'dup@example.com', name: '用户2', password: '123456' });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error');
    });

    it('无效邮箱应返回 400', async () => {
      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', name: '测试', password: '123456' });

      expect(res.status).toBe(400);
    });

    it('密码少于6位应返回 400', async () => {
      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'a@b.com', name: '测试', password: '123' });

      expect(res.status).toBe(400);
    });

    it('姓名为空应返回 400', async () => {
      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'a@b.com', name: '', password: '123456' });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────────
  // 登录
  // ──────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 预先注册一个用户
      await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'login@example.com', name: '登录测试', password: '123456' });
    });

    it('正确凭据应返回 token (200)', async () => {
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: '123456' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('错误密码应返回 401', async () => {
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'wrong-password' });

      expect(res.status).toBe(401);
    });

    it('不存在的邮箱应返回 401', async () => {
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'noone@example.com', password: '123456' });

      expect(res.status).toBe(401);
    });

    it('空密码应返回 400', async () => {
      const res = await supertest(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: '' });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────────
  // 获取当前用户
  // ──────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    let token: string;

    beforeEach(async () => {
      const res = await supertest(app)
        .post('/api/auth/register')
        .send({ email: 'me@example.com', name: '我', password: '123456' });
      token = res.body.token;
    });

    it('有效 token 应返回用户信息 (200)', async () => {
      const res = await supertest(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('me@example.com');
      expect(res.body.name).toBe('我');
      expect(res.body).toHaveProperty('createdAt');
    });

    it('无 token 应返回 401', async () => {
      const res = await supertest(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('无效 token 应返回 401', async () => {
      const res = await supertest(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(res.status).toBe(401);
    });

    it('缺少 Bearer 前缀应返回 401', async () => {
      const res = await supertest(app)
        .get('/api/auth/me')
        .set('Authorization', token);

      expect(res.status).toBe(401);
    });
  });
});
