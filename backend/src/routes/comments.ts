import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireTaskAccess, AuthRequest } from '../middleware/auth';
import { listComments, createComment } from '../services/comment.service';

export const commentRouter = Router();

commentRouter.use(requireAuth);

const createSchema = z.object({
  content: z.string().min(1, '评论不能为空').max(2000),
});

// GET /api/tasks/:taskId/comments
commentRouter.get('/:taskId/comments', requireTaskAccess('taskId', '无权查看'), async (req: AuthRequest, res: Response) => {
  const comments = await listComments(req.task!.id);
  res.json(comments);
});

// POST /api/tasks/:taskId/comments
commentRouter.post('/:taskId/comments', requireTaskAccess('taskId', '无权评论'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    const comment = await createComment(req.task!.id, req.userId!, data.content);
    res.status(201).json(comment);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors[0].message }); return; }
    throw err;
  }
});
