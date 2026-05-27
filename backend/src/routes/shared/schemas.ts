import { z } from 'zod';

// ─── 枚举 ─────────────────────────────────────────────
export const statusEnum = z.enum(['todo', 'in_progress', 'done']);
export const priorityEnum = z.enum(['low', 'medium', 'high']);

// ─── 任务基础字段（避免重复定义） ─────────────────────
const baseTaskFields = {
  title: z.string().min(1, '任务标题不能为空').max(200),
  description: z.string().max(2000),
  status: statusEnum,
  priority: priorityEnum,
  assigneeId: z.string().uuid(),
  dueDate: z.string().datetime(),
};

// ─── 创建任务 ─────────────────────────────────────────
export const createTaskSchema = z.object({
  title: baseTaskFields.title,
  description: baseTaskFields.description.optional(),
  status: baseTaskFields.status.optional(),
  priority: baseTaskFields.priority.optional(),
  assigneeId: baseTaskFields.assigneeId.optional().nullable(),
  dueDate: baseTaskFields.dueDate.optional().nullable(),
});

// ─── 更新任务（所有字段可选 + 部分字段允许 null） ────
export const updateTaskSchema = z.object({
  title: baseTaskFields.title.optional(),
  description: baseTaskFields.description.optional().nullable(),
  status: baseTaskFields.status.optional(),
  priority: baseTaskFields.priority.optional(),
  assigneeId: baseTaskFields.assigneeId.optional().nullable(),
  dueDate: baseTaskFields.dueDate.optional().nullable(),
});

// ─── 创建项目 ─────────────────────────────────────────
export const createProjectSchema = z.object({
  name: z.string().min(1, '项目名称不能为空').max(100),
  description: z.string().max(500).optional(),
});
