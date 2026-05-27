import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { config } from '../lib/config';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const aiRouter = Router();

aiRouter.use(requireAuth);

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions';

const askSchema = z.object({
  message: z.string().min(1, '消息不能为空'),
  projectContext: z.string().optional(),
});

const createTaskSchema = z.object({
  prompt: z.string().min(1, '描述不能为空'),
  projectId: z.string().uuid(),
});

async function callDeepSeek(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = config.deepseekApiKey;
  if (!apiKey || apiKey === 'your-deepseek-api-key') {
    throw new Error('DeepSeek API 密钥未配置');
  }

  const res = await fetch(DEEPSEEK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    throw new Error(`DeepSeek API error: ${res.status}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
}

aiRouter.post('/ask', async (req: AuthRequest, res: Response) => {
  try {
    const { message, projectContext } = askSchema.parse(req.body);
    const messages = [
      { role: 'system', content: '你是一个任务管理助手指南。帮助用户分析项目进度、提出建议。请用中文回答。' },
    ];
    if (projectContext) {
      messages.push({ role: 'user', content: `项目上下文：${projectContext}` });
    }
    messages.push({ role: 'user', content: message });

    const result = await callDeepSeek(messages);
    res.json({ reply: result });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'AI 服务调用失败' });
  }
});

aiRouter.post('/create-task', async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, projectId } = createTaskSchema.parse(req.body);
    const messages = [
      {
        role: 'system',
        content: '你是一个任务解析助手。根据用户自然语言描述，提取任务标题、描述、优先级(low/medium/high)。仅返回JSON格式：{"title":"...","description":"...","priority":"medium"}',
      },
      { role: 'user', content: prompt },
    ];

    const result = await callDeepSeek(messages);

    let taskData;
    try {
      taskData = JSON.parse(result);
    } catch {
      res.status(422).json({ error: 'AI 返回格式异常', raw: result });
      return;
    }

    const task = await prisma.task.create({
      data: {
        title: taskData.title || prompt.slice(0, 100),
        description: taskData.description || prompt,
        priority: taskData.priority || 'medium',
        projectId,
        creatorId: req.userId!,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(task);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    res.status(500).json({ error: 'AI 创建任务失败' });
  }
});
