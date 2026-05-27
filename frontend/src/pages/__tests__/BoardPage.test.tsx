import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BoardPage from '../BoardPage';

// ---------- Hoisted mock functions ----------

const { mockApiGet, mockApiPost } = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
}));

// ---------- Mocks ----------

vi.mock('@/lib/utils', () => ({
  api: {
    get: mockApiGet,
    post: mockApiPost,
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'user-1', name: '测试用户', email: 'test@test.com' },
    logout: vi.fn(),
    token: 'mock-token',
    login: vi.fn(),
    register: vi.fn(),
    loading: false,
  }),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'project-1' }),
  };
});

vi.mock('react-helmet-async', () => ({
  Helmet: () => null,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// ---------- Test data ----------

const mockProject = {
  id: 'project-1',
  name: '测试项目',
  description: null,
  members: [
    { user: { id: 'user-2', name: '成员A' } },
    { user: { id: 'user-3', name: '成员B' } },
  ],
};

const mockTasks = [
  {
    id: 'task-1',
    title: '设计登录页面',
    description: '完成用户登录界面的UI设计',
    status: 'todo',
    priority: 'high',
    assignee: { id: 'user-2', name: '成员A', email: 'a@test.com' },
    creator: { id: 'user-1', name: '创建者' },
    dueDate: null,
    _count: { comments: 2 },
  },
  {
    id: 'task-2',
    title: '实现API接口',
    description: null,
    status: 'in_progress',
    priority: 'medium',
    assignee: null,
    creator: { id: 'user-1', name: '创建者' },
    dueDate: '2026-06-01T00:00:00.000Z',
    _count: { comments: 0 },
  },
  {
    id: 'task-3',
    title: '编写测试用例',
    description: '覆盖核心功能',
    status: 'done',
    priority: 'low',
    assignee: { id: 'user-3', name: '成员B', email: 'b@test.com' },
    creator: { id: 'user-1', name: '创建者' },
    dueDate: null,
    _count: { comments: 1 },
  },
];

// ---------- Helpers ----------

function renderBoard() {
  return render(
    <MemoryRouter>
      <BoardPage />
    </MemoryRouter>,
  );
}

// ---------- Tests ----------

describe('BoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('加载 loading 时显示 skeleton', () => {
    // 让 API 永远不 resolve，保持 loading 状态
    mockApiGet.mockImplementation(() => new Promise(() => {}));

    renderBoard();

    // skeleton 组件有 animate-pulse 类
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('能渲染看板列（待办/进行中/已完成）', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/projects/project-1') return Promise.resolve(mockProject);
      if (url === '/projects/project-1/tasks') return Promise.resolve(mockTasks);
      return Promise.reject(new Error('not found'));
    });

    renderBoard();

    await waitFor(() => {
      expect(screen.getByText('待办')).toBeInTheDocument();
    });
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();

    // 验证任务标题出现在对应列
    expect(screen.getByText('设计登录页面')).toBeInTheDocument();
    expect(screen.getByText('实现API接口')).toBeInTheDocument();
    expect(screen.getByText('编写测试用例')).toBeInTheDocument();
  });

  it('点击"创建任务"按钮能打开弹窗', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/projects/project-1') return Promise.resolve(mockProject);
      if (url === '/projects/project-1/tasks') return Promise.resolve([]);
      return Promise.reject(new Error('not found'));
    });

    renderBoard();

    // 等待加载完毕
    await waitFor(() => {
      expect(screen.getByText('待办')).toBeInTheDocument();
    });

    // 点击创建任务按钮
    fireEvent.click(screen.getByRole('button', { name: /创建任务/ }));

    // 弹窗应该打开——检测 dialog 描述文字（唯一）
    expect(screen.getByText('填写任务信息')).toBeInTheDocument();
    // 表单中应该有两个输入框（标题 + 描述）
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('表单提交时调用 API', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/projects/project-1') return Promise.resolve(mockProject);
      if (url === '/projects/project-1/tasks') return Promise.resolve([]);
      return Promise.reject(new Error('not found'));
    });
    mockApiPost.mockResolvedValue({
      id: 'new-task',
      title: '新创建的任务',
      description: null,
      status: 'todo',
      priority: 'medium',
      assignee: null,
      creator: { id: 'user-1', name: '创建者' },
      dueDate: null,
      _count: { comments: 0 },
    });

    renderBoard();

    // 等待加载完毕
    await waitFor(() => {
      expect(screen.getByText('待办')).toBeInTheDocument();
    });

    // 打开创建弹窗
    fireEvent.click(screen.getByRole('button', { name: /创建任务/ }));

    await waitFor(() => {
      expect(screen.getByText('填写任务信息')).toBeInTheDocument();
    });

    // 填写标题（第一个 textbox）
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '新创建的任务' } });

    // 提交表单
    fireEvent.click(screen.getByRole('button', { name: '创建' }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        '/projects/project-1/tasks',
        expect.objectContaining({
          title: '新创建的任务',
          priority: 'medium',
        }),
      );
    });
  });

  it('搜索输入框能过滤任务', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/projects/project-1') return Promise.resolve(mockProject);
      if (url === '/projects/project-1/tasks') return Promise.resolve(mockTasks);
      return Promise.reject(new Error('not found'));
    });

    renderBoard();

    // 等待数据加载
    await waitFor(() => {
      expect(screen.getByText('设计登录页面')).toBeInTheDocument();
    });
    expect(screen.getByText('实现API接口')).toBeInTheDocument();

    // 输入搜索关键词
    const searchInput = screen.getByPlaceholderText('搜索任务标题或描述...');
    fireEvent.change(searchInput, { target: { value: '登录' } });

    // 应该只显示匹配"设计登录页面"的任务
    expect(screen.getByText('设计登录页面')).toBeInTheDocument();
    expect(screen.queryByText('实现API接口')).not.toBeInTheDocument();
    expect(screen.queryByText('编写测试用例')).not.toBeInTheDocument();
  });

  it('优先级筛选能正确过滤', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url === '/projects/project-1') return Promise.resolve(mockProject);
      if (url === '/projects/project-1/tasks') return Promise.resolve(mockTasks);
      return Promise.reject(new Error('not found'));
    });

    renderBoard();

    await waitFor(() => {
      expect(screen.getByText('设计登录页面')).toBeInTheDocument();
    });

    // 查找页面上所有的 select，第一个是优先级筛选
    const selects = document.querySelectorAll('select');
    const prioritySelectEl = selects[0];
    fireEvent.change(prioritySelectEl, { target: { value: 'high' } });

    // 只有 high 优先级的任务应该显示
    expect(screen.getByText('设计登录页面')).toBeInTheDocument();
    expect(screen.queryByText('实现API接口')).not.toBeInTheDocument();
    expect(screen.queryByText('编写测试用例')).not.toBeInTheDocument();
  });
});
