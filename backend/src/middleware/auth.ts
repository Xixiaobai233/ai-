import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { param } from '../lib/utils';
import { config } from '../lib/config';

export interface AuthRequest extends Request {
  userId?: string;
  task?: any;
}

const JWT_SECRET = config.jwtSecret;

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: '令牌无效或已过期' });
  }
}

/**
 * 中间件工厂：校验当前用户是指定项目的成员。
 * @param projectIdParam URL 参数名，默认 'id'，从中提取项目 ID
 */
export function requireProjectMember(projectIdParam: string = 'id') {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = param(req, projectIdParam);
      const member = await prisma.projectMember.findFirst({
        where: { projectId, userId: req.userId! },
      });
      if (!member) {
        res.status(403).json({ error: '无权访问该项目' });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * 中间件工厂：查找任务并校验当前用户是任务所在项目的成员。
 * 将任务对象附加到 req.task 上供后续 handler 使用。
 * @param taskIdParam URL 参数名，默认 'id'，从中提取任务 ID
 * @param errorMessage 权限不足时的错误消息，默认 '无权访问该任务'
 */
export function requireTaskAccess(taskIdParam: string = 'id', errorMessage?: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = param(req, taskIdParam);
      const task = await prisma.task.findUnique({ where: { id } });
      if (!task) {
        res.status(404).json({ error: '任务不存在' });
        return;
      }
      const member = await prisma.projectMember.findFirst({
        where: { projectId: task.projectId, userId: req.userId! },
      });
      if (!member) {
        res.status(403).json({ error: errorMessage || '无权访问该任务' });
        return;
      }
      req.task = task;
      next();
    } catch (err) {
      next(err);
    }
  };
}
