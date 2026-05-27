import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FolderKanban, BarChart3, LogOut, Bot, Sun, Moon, Menu, X } from 'lucide-react';
import AIAssistant from '@/components/AIAssistant';

const navItems = [
  { path: '/', label: '项目列表', icon: FolderKanban },
  { path: '/dashboard', label: '仪表盘', icon: BarChart3 },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen">
      {/* Mobile hamburger */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-md bg-slate-800 text-white shadow-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'w-56 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white flex flex-col flex-shrink-0 transition-transform duration-200',
        'md:relative md:translate-x-0',
        'fixed inset-y-0 left-0 z-40',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-1.5 rounded-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">AI 任务管理</h1>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                location.pathname === item.path
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <div className="text-sm text-slate-300 mb-2 truncate">{user?.name}</div>
          <Button variant="ghost" size="sm" className="w-full text-slate-300 hover:text-white" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
        </div>

        {/* Dark mode toggle */}
        <div className="px-3 pb-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="切换主题"
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-4 w-4" />
                <span>深色模式</span>
              </>
            ) : (
              <>
                <Sun className="h-4 w-4" />
                <span>浅色模式</span>
              </>
            )}
          </button>
        </div>

        <div className="px-3 pb-3">
          <div className="text-xs text-center bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent font-bold tracking-wider">
            孙承希制作该网站
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto relative">
        <img src="/bg.png" alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-60 dark:opacity-30 pointer-events-none" />
        <div className="relative p-4 md:p-6 min-h-full bg-slate-50/70 dark:bg-slate-900/80">{children}</div>
      </main>
      <AIAssistant />
    </div>
  );
}
