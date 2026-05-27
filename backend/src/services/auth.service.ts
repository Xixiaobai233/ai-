import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { generateToken } from '../middleware/auth';

export async function registerUser(email: string, name: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError('该邮箱已被注册');

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name, password: hashed },
  });

  const token = generateToken(user.id);
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new UnauthorizedError('邮箱或密码错误');
  }

  const token = generateToken(user.id);
  return { token, user: { id: user.id, email: user.email, name: user.name } };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  if (!user) throw new NotFoundError('用户不存在');
  return user;
}

export class ServiceError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string) { super(message, 409); }
}

export class UnauthorizedError extends ServiceError {
  constructor(message: string) { super(message, 401); }
}

export class NotFoundError extends ServiceError {
  constructor(message: string) { super(message, 404); }
}

export class ForbiddenError extends ServiceError {
  constructor(message: string) { super(message, 403); }
}
