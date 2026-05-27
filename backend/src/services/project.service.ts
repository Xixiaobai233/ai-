import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError } from './auth.service';

export async function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { members: { some: { userId } } },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: { where: { deletedAt: null } }, members: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProject(name: string, description: string | undefined, ownerId: string) {
  return prisma.project.create({
    data: {
      name,
      description,
      ownerId,
      members: { create: { userId: ownerId, role: 'owner' } },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { tasks: true, members: true } },
    },
  });
}

export async function getProjectById(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, members: { some: { userId } } },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: { where: { deletedAt: null } } } },
    },
  });
  if (!project) throw new NotFoundError('项目不存在');
  return project;
}

export async function deleteProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: userId },
  });
  if (!project) throw new NotFoundError('项目不存在或无权删除');
  await prisma.project.delete({ where: { id: projectId } });
}

export async function listProjectTasks(projectId: string, filters: {
  status?: string; priority?: string; assignee?: string;
}) {
  const where: any = { projectId, deletedAt: null };
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assignee) where.assigneeId = filters.assignee;

  return prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createProjectTask(projectId: string, creatorId: string, data: {
  title: string; description?: string; status?: string; priority?: string;
  assigneeId?: string | null; dueDate?: string | null;
}) {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigneeId: data.assigneeId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId,
      creatorId,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });
}

export async function getProjectStats(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId, deletedAt: null },
    select: { status: true, priority: true, assigneeId: true },
  });

  const statusCount = { todo: 0, in_progress: 0, done: 0 };
  const priorityCount = { low: 0, medium: 0, high: 0 };
  const assigneeMap: Record<string, number> = {};

  for (const t of tasks) {
    statusCount[t.status as keyof typeof statusCount]++;
    priorityCount[t.priority as keyof typeof priorityCount]++;
    if (t.assigneeId) {
      assigneeMap[t.assigneeId] = (assigneeMap[t.assigneeId] || 0) + 1;
    }
  }

  const assigneeIds = Object.keys(assigneeMap);
  const users = assigneeIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: assigneeIds } },
        select: { id: true, name: true },
      })
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

  return {
    total: tasks.length,
    statusCount,
    priorityCount,
    assignees: assigneeIds.map(id => ({
      userId: id,
      name: userMap[id] || '未知',
      taskCount: assigneeMap[id],
    })),
  };
}
