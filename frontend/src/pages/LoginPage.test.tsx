import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from './LoginPage';

// ---------- Mocks ----------

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    token: null,
    logout: vi.fn(),
    register: vi.fn(),
    loading: false,
  }),
}));

vi.mock('react-helmet-async', () => ({
  Helmet: () => null,
  HelmetProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// ---------- Helpers ----------

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

// ---------- Tests ----------

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染登录表单：邮箱、密码输入框和提交按钮', () => {
    renderPage();

    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
    expect(screen.getByText('欢迎回来')).toBeInTheDocument();
  });

  it('允许在输入框中输入邮箱和密码', () => {
    renderPage();

    const emailInput = screen.getByLabelText('邮箱');
    const passwordInput = screen.getByLabelText('密码');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('提交表单时调用 login 并导航到首页', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    renderPage();

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'user@test.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('user@test.com', 'secret');
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('登录失败时保持登录页面不导航', async () => {
    mockLogin.mockRejectedValueOnce(new Error('邮箱或密码错误'));

    renderPage();

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'bad@user.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    // 登录失败后不应跳转
    expect(mockNavigate).not.toHaveBeenCalled();

    // 按钮重新可用
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
    });
  });

  it('提交时显示加载状态（按钮文字变为"登录中..."）', async () => {
    // 让 login 一直 pending，不 resolve
    mockLogin.mockImplementationOnce(() => new Promise<never>(() => {}));

    renderPage();

    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: '登录' }));

    expect(await screen.findByRole('button', { name: '登录中...' })).toBeInTheDocument();
  });

  it('包含指向注册页面的链接', () => {
    renderPage();

    const registerLink = screen.getByText('注册');
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });
});
