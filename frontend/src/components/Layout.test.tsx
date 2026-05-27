import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Layout } from './Layout';

// ---------- Mocks ----------

const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'tsukikage@example.com', name: '月影酱' },
    logout: mockLogout,
    token: 'mock-token',
    login: vi.fn(),
    register: vi.fn(),
    loading: false,
  }),
}));

vi.mock('@/lib/theme-context', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------- Helpers ----------

function renderLayoutAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Layout>
        <div data-testid="child-content">页面内容</div>
      </Layout>
    </MemoryRouter>,
  );
}

// ---------- Tests ----------

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染侧边栏：标题、导航项和子内容', () => {
    renderLayoutAt('/');

    // 侧边栏标题
    expect(screen.getByText('AI 任务管理')).toBeInTheDocument();

    // 导航项
    expect(screen.getByText('项目列表')).toBeInTheDocument();
    expect(screen.getByText('仪表盘')).toBeInTheDocument();

    // children
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('高亮当前激活的导航项', () => {
    renderLayoutAt('/dashboard');

    const dashboardLink = screen.getByText('仪表盘').closest('a');
    const projectsLink = screen.getByText('项目列表').closest('a');

    expect(dashboardLink).toHaveClass('bg-slate-700');
    expect(projectsLink).not.toHaveClass('bg-slate-700');
  });

  it('在侧边栏底部显示当前用户名', () => {
    renderLayoutAt('/');

    expect(screen.getByText('月影酱')).toBeInTheDocument();
  });

  it('点击"退出登录"按钮时调用 logout 并导航到 /login', () => {
    renderLayoutAt('/');

    fireEvent.click(screen.getByText('退出登录'));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('显示「孙承希」制作信息', () => {
    renderLayoutAt('/');

    // 使用正则匹配包含「孙承希」的文字
    expect(screen.getByText(/孙承希/)).toBeInTheDocument();
  });
});
