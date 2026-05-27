import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const TEST_NAME = 'task';
const DB_FILE = `file:./test.${TEST_NAME}.db`;
const DB_PATH = path.join(__dirname, '..', '..', 'prisma', `test.${TEST_NAME}.db`);

describe('Task API', () => {
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
  async function createProj(token: string, name = '项目') {
    const res = await supertest(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name });
    return res.body;
  }

  /** 在项目中创建任务并返回任务对象 */
  async function createTask(token: string, projectId: string, overrides: Record<string, any> = {}) {
    const res = await supertest(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '默认任务', ...overrides });
    return res.body;
  }

  // ──────────────────────────────────────────────
  // 获取单个任务
  // ──────────────────────────────────────────────
  describe('GET /api/tasks/:id', () => {
    let token: string;
    let task: any;

    beforeEach(async () => {
      const u = await register('get@test.com', '获取用户');
      token = u.token;
      const project = await createProj(token);
      task = await createTask(token, project.id);
    });

    it('应返回任务详情 (200)', async () => {
      const res = await supertest(app)
        .get(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(task.id);
      expect(res.body.title).toBe('默认任务');
      expect(res.body).toHaveProperty('assignee');
      expect(res.body).toHaveProperty('creator');
      expect(res.body).toHaveProperty('comments');
    });

    it('不存在的任务应返回 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await supertest(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('无 auth 应返回 401', async () => {
      const res = await supertest(app).get(`/api/tasks/${task.id}`);
      expect(res.status).toBe(401);
    });

    it('非项目成员应返回 403', async () => {
      const intruder = await register('intruder@test.com', '入侵者');
      const res = await supertest(app)
        .get(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${intruder.token}`);

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────────────────────
  // 更新任务
  // ──────────────────────────────────────────────
  describe('PUT /api/tasks/:id', () => {
    let token: string;
    let task: any;

    beforeEach(async () => {
      const u = await register('put@test.com', '更新用户');
      token = u.token;
      const project = await createProj(token);
      task = await createTask(token, project.id);
    });

    it('应成功更新任务标题 (200)', async () => {
      const res = await supertest(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '更新后的标题' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('更新后的标题');
    });

    it('应成功更新任务状态 (200)', async () => {
      const res = await supertest(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in_progress');
    });

    it('无效状态应返回 400', async () => {
      const res = await supertest(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
    });

    it('无效优先级应返回 400', async () => {
      const res = await supertest(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ priority: 'urgent' });

      expect(res.status).toBe(400);
    });

    it('空标题应返回 400', async () => {
      const res = await supertest(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '' });

      expect(res.status).toBe(400);
    });

    it('不存在的任务应返回 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await supertest(app)
        .put(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '新标题' });

      expect(res.status).toBe(404);
    });

    it('非项目成员应返回 403', async () => {
      const intruder = await register('intruder2@test.com', '入侵者');
      const res = await supertest(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${intruder.token}`)
        .send({ title: '入侵修改' });

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────────────────────
  // 删除任务
  // ──────────────────────────────────────────────
  describe('DELETE /api/tasks/:id', () => {
    let token: string;
    let task: any;

    beforeEach(async () => {
      const u = await register('del@test.com', '删除用户');
      token = u.token;
      const project = await createProj(token);
      task = await createTask(token, project.id);
    });

    it('应成功删除任务 (200)', async () => {
      const res = await supertest(app)
        .delete(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');

      // 确认已删除
      const getRes = await supertest(app)
        .get(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.status).toBe(404);
    });

    it('不存在的任务应返回 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await supertest(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('非项目成员应返回 403', async () => {
      const intruder = await register('intruder3@test.com', '入侵者');
      const res = await supertest(app)
        .delete(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${intruder.token}`);

      expect(res.status).toBe(403);
    });
  });

  // ──────────────────────────────────────────────
  // 状态更新
  // ──────────────────────────────────────────────
  describe('PATCH /api/tasks/:id/status', () => {
    let token: string;
    let task: any;

    beforeEach(async () => {
      const u = await register('patch@test.com', '状态用户');
      token = u.token;
      const project = await createProj(token);
      task = await createTask(token, project.id);
    });

    it('应成功将状态改为 in_progress (200)', async () => {
      const res = await supertest(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_progress' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in_progress');
    });

    it('应成功将状态改为 done (200)', async () => {
      const res = await supertest(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'done' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('done');
    });

    it('无效状态应返回 400', async () => {
      const res = await supertest(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'canceled' });

      expect(res.status).toBe(400);
    });

    it('缺少 status 字段应返回 400', async () => {
      const res = await supertest(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('不存在的任务应返回 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await supertest(app)
        .patch(`/api/tasks/${fakeId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'done' });

      expect(res.status).toBe(404);
    });

    it('非项目成员应返回 403', async () => {
      const intruder = await register('intruder4@test.com', '入侵者');
      const res = await supertest(app)
        .patch(`/api/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${intruder.token}`)
        .send({ status: 'done' });

      expect(res.status).toBe(403);
    });
  });
});
