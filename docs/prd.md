# AI Agent 协作式任务管理平台 — PRD

## 1. 产品概述

一个轻量级的团队任务管理工具，支持多项目、任务分配、状态跟踪、评论协作和可视化仪表盘。本平台同时作为 AI Agent 协作开发的训练项目，通过构建自身来实践 AI 辅助软件工程全流程。

## 2. 目标用户

- 小型团队（2-10 人）
- 需要简单的任务跟踪与协作
- 希望使用 AI 辅助日常开发管理

## 3. 核心功能（MVP）

| 功能模块 | 描述 | 优先级 |
|---------|------|-------|
| 用户注册/登录 | 邮箱+密码注册、JWT 登录 | P0 |
| 项目管理 | 创建/查看项目列表 | P0 |
| 任务管理 | 创建任务（标题、描述、指派人、截止日期）、编辑、删除 | P0 |
| 看板视图 | 任务按状态分列，支持拖拽更新状态 | P0 |
| 评论系统 | 任务详情页内可发表评论 | P1 |
| 仪表盘 | 任务统计图表（按状态、按成员） | P1 |
| DeepSeek V4 集成 | AI 助手辅助创建任务、分析进度 | P1 |

## 4. 用户故事

### 4.1 认证
- US-01：作为用户，我可以注册新账号
- US-02：作为用户，我可以登录已有账号
- US-03：作为用户，我可以查看当前登录状态

### 4.2 项目
- US-04：作为用户，我可以创建一个新项目
- US-05：作为用户，我可以查看我参与的所有项目列表
- US-06：作为用户，我可以进入某个项目查看详情

### 4.3 任务
- US-07：作为用户，我可以在项目中创建任务（标题、描述、指派人、截止日期）
- US-08：作为用户，我可以编辑和删除任务
- US-09：作为用户，我可以通过拖拽改变任务状态（待办/进行中/已完成）
- US-10：作为用户，我可以筛选和搜索任务

### 4.4 评论
- US-11：作为用户，我可以在任务下发表评论
- US-12：作为用户，我可以查看任务的所有评论

### 4.5 仪表盘
- US-13：作为用户，我可以看到项目的任务统计概览

### 4.6 AI 助手
- US-14：作为用户，我可以用自然语言让 AI 帮我创建任务
- US-15：作为用户，我可以让 AI 分析项目进度

## 5. 技术架构

```
Frontend (React + Vite + TailwindCSS + shadcn/ui)
    │  REST API (JSON)
    ▼
Backend (Node.js + Express)
    │  Prisma ORM
    ▼
Database (PostgreSQL)
```

### 5.1 前端技术选型
- **React 18** + **TypeScript** — 类型安全
- **Vite** — 快速构建
- **TailwindCSS** — 原子化样式
- **shadcn/ui** — 高质量组件库
- **@dnd-kit** — 拖拽功能
- **Recharts** — 图表展示
- **react-router-dom v6** — 路由

### 5.2 后端技术选型
- **Node.js** + **Express** — API 服务
- **Prisma** — ORM + 迁移
- **PostgreSQL** — 数据库
- **JWT** — 身份认证
- **bcrypt** — 密码加密

### 5.3 AI 集成
- **DeepSeek V4 API** — 自然语言任务创建、进度分析

## 6. 数据模型

```
User
  id          UUID
  email       String (unique)
  name        String
  password    String (hashed)
  createdAt   DateTime

Project
  id          UUID
  name        String
  description String?
  ownerId     UUID → User
  createdAt   DateTime

ProjectMember
  id          UUID
  projectId   UUID → Project
  userId      UUID → User
  role        String (owner/member)

Task
  id          UUID
  title       String
  description String?
  status      String (todo/in_progress/done)
  priority    String (low/medium/high)
  assigneeId  UUID? → User
  projectId   UUID → Project
  creatorId   UUID → User
  dueDate     DateTime?
  createdAt   DateTime
  updatedAt   DateTime

Comment
  id          UUID
  content     String
  taskId      UUID → Task
  authorId    UUID → User
  createdAt   DateTime
```

## 7. API 设计

### 认证
- `POST /api/auth/register` — 注册
- `POST /api/auth/login` — 登录
- `GET /api/auth/me` — 当前用户

### 项目
- `GET /api/projects` — 项目列表
- `POST /api/projects` — 创建项目
- `GET /api/projects/:id` — 项目详情
- `DELETE /api/projects/:id` — 删除项目

### 任务
- `GET /api/projects/:projectId/tasks` — 任务列表
- `POST /api/projects/:projectId/tasks` — 创建任务
- `PUT /api/tasks/:id` — 更新任务
- `DELETE /api/tasks/:id` — 删除任务
- `PATCH /api/tasks/:id/status` — 更新状态

### 评论
- `GET /api/tasks/:taskId/comments` — 评论列表
- `POST /api/tasks/:taskId/comments` — 发表评论

### 仪表盘
- `GET /api/projects/:id/stats` — 项目统计

### AI
- `POST /api/ai/ask` — AI 对话
- `POST /api/ai/create-task` — AI 创建任务

## 8. 页面路由

| 路径 | 页面 | 权限 |
|-----|------|------|
| `/login` | 登录 | 公开 |
| `/register` | 注册 | 公开 |
| `/` | 项目列表 | 需登录 |
| `/projects/:id` | 项目看板 | 需登录 |
| `/projects/:id/tasks/:taskId` | 任务详情 | 需登录 |
| `/projects/:id/dashboard` | 仪表盘 | 需登录 |

## 9. 非功能需求

- 响应式设计，支持桌面端
- 页面加载时间 < 2s
- API 响应时间 < 500ms
- 密码加密存储（bcrypt）
- JWT token 过期机制
- 输入验证与数据清洗
