import { Router, Response } from 'express';
import { param } from '../lib/utils';
import { requireAuth, requireProjectMember, AuthRequest } from '../middleware/auth';
import { getProjectStats } from '../services/project.service';

export const statsRouter = Router();

statsRouter.use(requireAuth);

// GET /api/projects/:id/stats
statsRouter.get('/:id/stats', requireProjectMember('id'), async (req: AuthRequest, res: Response) => {
  const stats = await getProjectStats(param(req, 'id'));
  res.json(stats);
});
