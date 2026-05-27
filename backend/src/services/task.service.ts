import { prisma } from '../lib/prisma';

export async function getTaskById(taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      comments: {
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function updateTask(taskId: string, data: Record<string, any>) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      dueDate: data.dueDate !== undefined
        ? (data.dueDate ? new Date(data.dueDate) : null)
        : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });
}

export async function deleteTask(taskId: string) {
  await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() },
  });
}

export async function updateTaskStatus(taskId: string, status: string) {
  return prisma.task.update({
    where: { id: taskId },
    data: { status },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
  });
}
