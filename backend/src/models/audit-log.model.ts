import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

export async function createAuditLog(
  action: string,
  entityType: string,
  entityId: string,
  userId: string,
  metadata?: Prisma.InputJsonValue,
) {
  return prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      metadata: metadata ?? undefined,
    },
  });
}
