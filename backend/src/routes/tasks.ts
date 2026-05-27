import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireTaskAccess, AuthRequest } from '../middleware/auth';
import { updateTaskSchema, statusEnum } from './shared/schemas';
import { getTaskById, updateTask, deleteTask, updateTaskStatus } from '../services/task.service';
import { ServiceError } from '../services/auth.service';

export const taskRouter = Router();

taskRouter.use(requireAuth);

// GET /api/tasks/:id
taskRouter.get('/:id', requireTaskAccess('id', '无权访问该任务'), async (req: AuthRequest, res: Response) => {
  const task = await getTaskById(req.task!.id);
  res.json(task);
});

// PUT /api/tasks/:id
taskRouter.put('/:id', requireTaskAccess('id', '无权修改该任务'), async (req: AuthRequest, res: Response) => {
  try {
    const data = updateTaskSchema.parse(req.body);
    const updated = await updateTask(req.task!.id, data);
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors[0].message }); return; }
    if (err instanceof ServiceError) { res.status(err.status).json({ error: err.message }); return; }
    throw err;
  }
});

// DELETE /api/tasks/:id
taskRouter.delete('/:id', requireTaskAccess('id', '无权删除该任务'), async (req: AuthRequest, res: Response) => {
  await deleteTask(req.task!.id);
  res.json({ message: '已删除' });
});

// PATCH /api/tasks/:id/status
taskRouter.patch('/:id/status', requireTaskAccess('id', '无权修改该任务'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = z.object({ status: statusEnum }).parse(req.body);
    const updated = await updateTaskStatus(req.task!.id, status);
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors[0].message }); return; }
    throw err;
  }
});
