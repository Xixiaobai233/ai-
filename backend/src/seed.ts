import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 清理旧数据
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // 创建用户
  const password = await bcrypt.hash('123456', 10);
  const alice = await prisma.user.create({
    data: { email: 'alice@test.com', name: 'Alice', password },
  });
  const bob = await prisma.user.create({
    data: { email: 'bob@test.com', name: 'Bob', password },
  });

  // 创建项目
  const project = await prisma.project.create({
    data: {
      name: 'AI 协作平台开发',
      description: '开发一个AI Agent协作式任务管理平台',
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: 'owner' },
          { userId: bob.id, role: 'member' },
        ],
      },
    },
  });

  // 创建任务
  const tasks = [
    { title: '设计数据库模型', description: '设计User/Project/Task/Comment模型', status: 'done', priority: 'high', assigneeId: alice.id },
    { title: '实现用户认证API', description: '注册、登录、JWT', status: 'done', priority: 'high', assigneeId: alice.id },
    { title: '实现看板拖拽功能', description: '使用@dnd-kit实现拖拽', status: 'in_progress', priority: 'medium', assigneeId: bob.id },
    { title: '编写单元测试', description: '为后端API编写Jest测试', status: 'todo', priority: 'medium', assigneeId: null },
    { title: 'Docker部署配置', description: '编写Dockerfile和docker-compose', status: 'todo', priority: 'low', assigneeId: null },
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: {
        ...t,
        projectId: project.id,
        creatorId: alice.id,
        dueDate: new Date('2026-06-15'),
      },
    });
  }

  console.log('种子数据已插入！');
  console.log(`用户: alice@test.com / 123456, bob@test.com / 123456`);
  console.log(`项目: ${project.name} (${project.id})`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
