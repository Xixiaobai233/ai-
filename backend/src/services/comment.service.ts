import { prisma } from '../lib/prisma';

export async function listComments(taskId: string) {
  return prisma.comment.findMany({
    where: { taskId },
    include: { author: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createComment(taskId: string, authorId: string, content: string) {
  return prisma.comment.create({
    data: { content, taskId, authorId },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
}
