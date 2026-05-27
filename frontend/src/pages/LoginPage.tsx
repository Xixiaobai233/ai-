import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from '@/components/ui/toaster';
import PageTitle from '@/components/PageTitle';
import { WorkspaceIllus } from '@/components/illustrations/WorkspaceIllus';
import { Bot } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <PageTitle title="登录" />
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-pink-200 dark:bg-pink-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* 樱花飘落 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[1,2,3,4,5].map(i => (
          <div
            key={i}
            className="absolute text-pink-300 dark:text-pink-600 opacity-40 text-2xl animate-float"
            style={{ left: `${10 + i * 18}%`, top: '-5%', animationDelay: `${i * 0.7}s`, animationDuration: `${6 + i}s` }}
          >
            🌸
          </div>
        ))}
      </div>

      <div className="flex w-full items-center justify-center p-4 sm:p-8 z-10">
        {/* 左侧插画区 */}
        <div className="hidden lg:flex flex-col items-center mr-16">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
            <WorkspaceIllus className="w-80 h-64" />
            <h2 className="text-center text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mt-4">
              AI 任务管理平台
            </h2>
            <p className="text-center text-sm text-muted-foreground mt-1">
              让AI协助您的团队高效协作
            </p>
          </div>
        </div>

        {/* 右侧登录卡 */}
        <Card className="w-full max-w-sm sm:w-96 shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <Bot className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle>欢迎回来</CardTitle>
            <CardDescription>登录您的账号继续</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input id="password" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </Button>
              <p className="text-sm text-muted-foreground">
                还没有账号？<Link to="/register" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">注册</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
