import { Router, Response } from 'express';
import { z } from 'zod';
import { param } from '../lib/utils';
import { requireAuth, requireProjectMember, AuthRequest } from '../middleware/auth';
import { createTaskSchema, createProjectSchema, statusEnum, priorityEnum } from './shared/schemas';
import {
  listProjects, createProject, getProjectById, deleteProject,
  listProjectTasks, createProjectTask, getProjectStats,
} from '../services/project.service';
import { ServiceError } from '../services/auth.service';

export const projectRouter = Router();

projectRouter.use(requireAuth);

// POST / — 创建项目
projectRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createProjectSchema.parse(req.body);
    const project = await createProject(data.name, data.description, req.userId!);
    res.status(201).json(project);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors[0].message }); return; }
    throw err;
  }
});

// GET / — 项目列表
projectRouter.get('/', async (req: AuthRequest, res: Response) => {
  const projects = await listProjects(req.userId!);
  res.json(projects);
});

// GET /:id — 单个项目
projectRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const project = await getProjectById(param(req, 'id'), req.userId!);
    res.json(project);
  } catch (err) {
    if (err instanceof ServiceError) { res.status(err.status).json({ error: err.message }); return; }
    throw err;
  }
});

// DELETE /:id — 删除项目
projectRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await deleteProject(param(req, 'id'), req.userId!);
    res.json({ message: '已删除' });
  } catch (err) {
    if (err instanceof ServiceError) { res.status(err.status).json({ error: err.message }); return; }
    throw err;
  }
});

// GET /api/projects/:id/tasks — 项目任务列表
projectRouter.get('/:id/tasks', requireProjectMember('id'), async (req: AuthRequest, res: Response) => {
  const querySchema = z.object({
    status: statusEnum.optional(),
    priority: priorityEnum.optional(),
    assignee: z.string().uuid().optional(),
  });
  const filters = querySchema.parse(req.query);
  const tasks = await listProjectTasks(param(req, 'id'), filters);
  res.json(tasks);
});

// POST /api/projects/:id/tasks — 在项目中创建任务
projectRouter.post('/:id/tasks', requireProjectMember('id'), async (req: AuthRequest, res: Response) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const task = await createProjectTask(param(req, 'id'), req.userId!, data);
    res.status(201).json(task);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors[0].message }); return; }
    throw err;
  }
});
