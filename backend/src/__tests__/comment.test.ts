import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const TEST_NAME = 'comment';
const DB_FILE = `file:./test.${TEST_NAME}.db`;
const DB_PATH = path.join(__dirname, '..', '..', 'prisma', `test.${TEST_NAME}.db`);

describe('Comment API', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(() => {
    process.env.DATABASE_URL = DB_FILE;
    process.env.JWT_SECRET = 'test-secret-key';

    jest.resetModules();

    execSync('npx prisma db push --schema=prisma/schema.test.prisma --skip-generate --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: DB_FILE },
      cwd: path.resolve(__dirname, '..', '..'),
      stdio: 'pipe',
    });

    const { prisma: p } = require('../lib/prisma');
    const { createTestApp } = require('./helpers');
    prisma = p;
    app = createTestApp();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    try {
      if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
      for (const suffix of ['-journal', '-wal', '-shm']) {
        const p = DB_PATH + suffix;
        if (fs.existsSync(p)) fs.unlinkSync(p);
      }
    } catch {
      // ignore
    }
  });

  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
  });

  /** 注册用户并返回 token */
  async function register(email: string, name: string) {
    const res = await supertest(app)
      .post('/api/auth/register')
      .send({ email, name, password: '123456' });
    return { token: res.body.token, userId: res.body.user.id };
  }

  /** 创建项目并返回项目对象 */
  async function createProj(token: string) {
    const res = await supertest(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '项目' });
    return res.body;
  }

  /** 在项目中创建任务并返回任务对象 */
  async function createTask(token: string, projectId: string) {
    const res = await supertest(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '默认任务' });
    return res.body;
  }

  // ──────────────────────────────────────────────
  // 创建评论
  // ──────────────────────────────────────────────
  describe('POST /api/tasks/:taskId/comments', () => {
    let token: string;
    let task: any;

    beforeEach(async () => {
      const u = await register('com@test.com', '评论用户');
      token = u.token;
      const project = await createProj(token);
      task = await createTask(token, project.id);
    });

    it('应成功创建评论 (201)', async () => {
      const res = await supertest(app)
        .post(`/api/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '这是一条测试评论' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('这是一条测试评论');
      expect(res.body).toHaveProperty('author');
      expect(res.body.author.email).toBe('com@test.com');
      expect(res.body.taskId).toBe(task.id);
    });

    it('空内容应返回 400', async () => {
      const res = await supertest(app)
        .post(`/api/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '' });

      expect(res.status).toBe(400);
    });

    it('不存在任务应返回 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await supertest(app)
        .post(`/api/tasks/${fakeId}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '评论' });

      expect(res.status).toBe(404);
    });

    it('无 auth 应返回 401', async () => {
      const res = await supertest(app)
        .post(`/api/tasks/${task.id}/comments`)
        .send({ content: '评论' });

      expect(res.status).toBe(401);
    });

    it('非项目成员应返回 403', async () => {
      const intruder = await register('intruder@test.com', '入侵者');
      const res = await supertest(app)
        .post(`/api/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${intruder.token}`)
        .send({ content: '恶意评论' });

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────────────────────
  // 评论列表
  // ──────────────────────────────────────────────
  describe('GET /api/tasks/:taskId/comments', () => {
    let token: string;
    let task: any;

    beforeEach(async () => {
      const u = await register('list@test.com', '列表用户');
      token = u.token;
      const project = await createProj(token);
      task = await createTask(token, project.id);

      // 创建几条评论
      await supertest(app)
        .post(`/api/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '第一条评论' });
      await supertest(app)
        .post(`/api/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: '第二条评论' });
    });

    it('应返回任务的所有评论 (200)', async () => {
      const res = await supertest(app)
        .get(`/api/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('content');
      expect(res.body[0]).toHaveProperty('author');
    });

    it('不存在任务应返回 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await supertest(app)
        .get(`/api/tasks/${fakeId}/comments`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('无 auth 应返回 401', async () => {
      const res = await supertest(app).get(`/api/tasks/${task.id}/comments`);
      expect(res.status).toBe(401);
    });

    it('非项目成员应返回 403', async () => {
      const intruder = await register('intruder2@test.com', '入侵者');
      const res = await supertest(app)
        .get(`/api/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${intruder.token}`);

      expect(res.status).toBe(403);
    });
  });
});
