import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const TEST_NAME = 'project';
const DB_FILE = `file:./test.${TEST_NAME}.db`;
const DB_PATH = path.join(__dirname, '..', '..', 'prisma', `test.${TEST_NAME}.db`);

describe('Project API', () => {
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

  /** 辅助：注册用户并返回 { token, userId } */
  async function registerUser(email: string, name: string) {
    const res = await supertest(app)
      .post('/api/auth/register')
      .send({ email, name, password: '123456' });
    return { token: res.body.token, userId: res.body.user.id };
  }

  /** 辅助：创建项目并返回项目对象 */
  async function createProject(token: string, name = '测试项目', description?: string) {
    const res = await supertest(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name, description });
    return res.body;
  }

  // ──────────────────────────────────────────────
  // 创建项目
  // ──────────────────────────────────────────────
  describe('POST /api/projects', () => {
    it('应成功创建项目 (201)', async () => {
      const { token } = await registerUser('owner@example.com', '项目所有者');

      const res = await supertest(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '我的项目', description: '项目描述' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('我的项目');
      expect(res.body.description).toBe('项目描述');
      expect(res.body.ownerId).toBeDefined();
    });

    it('不提供 auth 应返回 401', async () => {
      const res = await supertest(app)
        .post('/api/projects')
        .send({ name: '项目' });

      expect(res.status).toBe(401);
    });

    it('名称为空应返回 400', async () => {
      const { token } = await registerUser('a@b.com', '用户');

      const res = await supertest(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '', description: 'desc' });

      expect(res.status).toBe(400);
    });

    it('名称超过100字符应返回 400', async () => {
      const { token } = await registerUser('c@d.com', '用户');

      const res = await supertest(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'x'.repeat(101) });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────────
  // 项目列表
  // ──────────────────────────────────────────────
  describe('GET /api/projects', () => {
    it('应返回当前用户的项目列表 (200)', async () => {
      const { token } = await registerUser('list@test.com', '列表用户');

      await createProject(token, '项目A');
      await createProject(token, '项目B');

      const res = await supertest(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('_count');
    });

    it('不提供 auth 应返回 401', async () => {
      const res = await supertest(app).get('/api/projects');
      expect(res.status).toBe(401);
    });

    it('无项目时应返回空数组', async () => {
      const { token } = await registerUser('empty@test.com', '空用户');

      const res = await supertest(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────
  // 获取单个项目
  // ──────────────────────────────────────────────
  describe('GET /api/projects/:id', () => {
    it('应返回项目详情 (200)', async () => {
      const { token } = await registerUser('detail@test.com', '详情用户');
      const project = await createProject(token, '详情项目', '描述');

      const res = await supertest(app)
        .get(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('详情项目');
      expect(res.body).toHaveProperty('owner');
      expect(res.body).toHaveProperty('members');
    });

    it('不存在的项目应返回 404', async () => {
      const { token } = await registerUser('notfound@test.com', '用户');
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await supertest(app)
        .get(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('非成员用户应返回 404（不暴露项目存在性）', async () => {
      const { token: tokenA } = await registerUser('a@test.com', '用户A');
      const { token: tokenB } = await registerUser('b@test.com', '用户B');
      const project = await createProject(tokenA, '私有项目');

      const res = await supertest(app)
        .get(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
    });
  });

  // ──────────────────────────────────────────────
  // 删除项目
  // ──────────────────────────────────────────────
  describe('DELETE /api/projects/:id', () => {
    it('项目所有者应能删除项目 (200)', async () => {
      const { token } = await registerUser('del@test.com', '删除用户');
      const project = await createProject(token, '待删除');

      const res = await supertest(app)
        .delete(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('非所有者删除应返回 404', async () => {
      const { token: tokenA } = await registerUser('owner@test.com', '所有者');
      const { token: tokenB } = await registerUser('other@test.com', '其他人');
      const project = await createProject(tokenA, '我的项目');

      const res = await supertest(app)
        .delete(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
    });

    it('不存在的项目应返回 404', async () => {
      const { token } = await registerUser('del2@test.com', '用户');
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const res = await supertest(app)
        .delete(`/api/projects/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // ──────────────────────────────────────────────
  // 项目内操作：创建任务
  // ──────────────────────────────────────────────
  describe('POST /api/projects/:id/tasks', () => {
    it('应在项目中创建任务 (201)', async () => {
      const { token } = await registerUser('task@test.com', '任务用户');
      const project = await createProject(token, '项目');

      const res = await supertest(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '测试任务', description: '任务描述' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('测试任务');
      expect(res.body.projectId).toBe(project.id);
      expect(res.body).toHaveProperty('creator');
    });

    it('非成员用户在项目中创建任务应返回 403', async () => {
      const { token: tokenA } = await registerUser('owner@test.com', '所有者');
      const { token: tokenB } = await registerUser('intruder@test.com', '入侵者');
      const project = await createProject(tokenA, '私有');

      const res = await supertest(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ title: '偷偷创建' });

      expect(res.status).toBe(403);
    });

    it('任务标题为空应返回 400', async () => {
      const { token } = await registerUser('valid@test.com', '用户');
      const project = await createProject(token, '项目');

      const res = await supertest(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '', description: 'desc' });

      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────────
  // 项目内操作：获取任务列表
  // ──────────────────────────────────────────────
  describe('GET /api/projects/:id/tasks', () => {
    it('应返回项目中的任务列表 (200)', async () => {
      const { token } = await registerUser('pt@test.com', '用户');
      const project = await createProject(token, '项目');

      await supertest(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '任务1' });
      await supertest(app)
        .post(`/api/projects/${project.id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '任务2' });

      const res = await supertest(app)
        .get(`/api/projects/${project.id}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
    });

    it('非成员用户应返回 403', async () => {
      const { token: tokenA } = await registerUser('a@test.com', '用户A');
      const { token: tokenB } = await registerUser('b@test.com', '用户B');
      const project = await createProject(tokenA, '私有');

      const res = await supertest(app)
        .get(`/api/projects/${project.id}/tasks`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(403);
    });
  });
});
