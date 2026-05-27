import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIAssistant from './AIAssistant';

const mockApiPost = vi.hoisted(() => vi.fn());

vi.mock('@/lib/utils', () => ({
  api: {
    post: mockApiPost,
    get: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
}));

function getSendButton() {
  const textarea = screen.getByPlaceholderText(/输入消息/);
  const container = textarea.parentElement!;
  return container.querySelector('button')!;
}

describe('AIAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初始状态显示悬浮的"AI 助手"按钮，不显示聊天面板', () => {
    render(<AIAssistant />);

    expect(screen.getByRole('button', { name: /AI 助手/ })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/输入消息/)).not.toBeInTheDocument();
  });

  it('点击按钮后打开聊天面板，显示欢迎消息和输入框', () => {
    render(<AIAssistant />);

    fireEvent.click(screen.getByRole('button', { name: /AI 助手/ }));

    expect(screen.getByPlaceholderText(/输入消息/)).toBeInTheDocument();
    expect(screen.getByText(/你好！我是 AI 助手/)).toBeInTheDocument();
  });

  it('点击关闭按钮（X 图标）后关闭面板，恢复悬浮按钮', () => {
    render(<AIAssistant />);

    fireEvent.click(screen.getByRole('button', { name: /AI 助手/ }));
    expect(screen.getByPlaceholderText(/输入消息/)).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[1];
    fireEvent.click(closeButton);

    expect(screen.queryByPlaceholderText(/输入消息/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AI 助手/ })).toBeInTheDocument();
  });

  it('可以输入消息并点击发送按钮，显示用户消息和 AI 回复', async () => {
    mockApiPost.mockResolvedValueOnce({ reply: '这是一个 AI 回复' });

    render(<AIAssistant />);

    fireEvent.click(screen.getByRole('button', { name: /AI 助手/ }));

    const textarea = screen.getByPlaceholderText(/输入消息/);
    fireEvent.change(textarea, { target: { value: '你好吗' } });

    fireEvent.click(getSendButton());

    expect(screen.getByText('你好吗')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('这是一个 AI 回复')).toBeInTheDocument();
    });

    expect(mockApiPost).toHaveBeenCalledWith('/ai/ask', {
      message: '你好吗',
      projectContext: undefined,
    });
  });

  it('输入框为空时发送按钮应被禁用', () => {
    render(<AIAssistant />);

    fireEvent.click(screen.getByRole('button', { name: /AI 助手/ }));

    expect(getSendButton()).toBeDisabled();
  });

  it('发送消息后显示"思考中..."占位状态', async () => {
    mockApiPost.mockImplementationOnce(() => new Promise<never>(() => {}));

    render(<AIAssistant />);

    fireEvent.click(screen.getByRole('button', { name: /AI 助手/ }));

    const textarea = screen.getByPlaceholderText(/输入消息/);
    fireEvent.change(textarea, { target: { value: '测试消息' } });
    fireEvent.click(getSendButton());

    expect(screen.getByText('思考中...')).toBeInTheDocument();
  });
});
