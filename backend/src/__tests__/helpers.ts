import express from 'express';
import cors from 'cors';
import { errorHandler } from '../middleware/error';

/**
 * 创建测试用的 Express 应用实例（不调用 listen）
 * 在调用此函数之前，必须设置好 process.env.DATABASE_URL 和 process.env.JWT_SECRET
 * 路由模块使用 require() 惰性加载，确保 prisma 单例使用正确的 DATABASE_URL
 */
export function createTestApp(): express.Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const { authRouter } = require('../routes/auth');
  const { projectRouter } = require('../routes/projects');
  const { taskRouter } = require('../routes/tasks');
  const { commentRouter } = require('../routes/comments');

  app.get('/api/health', (_req: any, res: any) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectRouter);
  app.use('/api/tasks', taskRouter);
  app.use('/api/tasks', commentRouter);
  app.use(errorHandler);

  return app;
}
