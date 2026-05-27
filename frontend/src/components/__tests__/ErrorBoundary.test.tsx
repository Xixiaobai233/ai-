import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';

// ---------- Tests ----------

describe('ErrorBoundary', () => {
  it('正常渲染子组件', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">正常内容</div>
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('正常内容')).toBeInTheDocument();
  });

  it('抛出错误后显示错误界面和刷新按钮', () => {
    // 阻止 console.error 在测试时输出错误堆栈
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // 模拟 window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    const ThrowError = () => {
      throw new Error('测试错误');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText('页面出错了')).toBeInTheDocument();
    expect(screen.getByText('测试错误')).toBeInTheDocument();

    const refreshBtn = screen.getByText('刷新页面');
    expect(refreshBtn).toBeInTheDocument();

    // 点击刷新按钮
    refreshBtn.click();
    expect(reloadMock).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
