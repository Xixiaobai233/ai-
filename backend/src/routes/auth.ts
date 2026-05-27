import { Router, Response } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { generateToken, requireAuth, AuthRequest } from '../middleware/auth';
import { registerUser, loginUser, getCurrentUser, ServiceError } from '../services/auth.service';

export const authRouter = Router();

// 登录/注册专用限流: 10 请求 / 15 分钟
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '登录/注册请求过于频繁，请稍后再试' },
});

const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  name: z.string().min(1, '姓名不能为空').max(50),
  password: z.string().min(6, '密码至少6位').max(100),
});

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
});

authRouter.post('/register', authLimiter, async (req, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data.email, data.name, data.password);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors[0].message }); return; }
    if (err instanceof ServiceError) { res.status(err.status).json({ error: err.message }); return; }
    throw err;
  }
});

authRouter.post('/login', authLimiter, async (req, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data.email, data.password);
    res.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors[0].message }); return; }
    if (err instanceof ServiceError) { res.status(err.status).json({ error: err.message }); return; }
    throw err;
  }
});

authRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getCurrentUser(req.userId!);
    res.json(user);
  } catch (err) {
    if (err instanceof ServiceError) { res.status(err.status).json({ error: err.message }); return; }
    throw err;
  }
});
