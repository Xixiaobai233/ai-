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

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast('密码至少6位', 'error'); return; }
    setLoading(true);
    try {
      await register(email, name, password);
      navigate('/');
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <PageTitle title="注册" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-1/2 -left-20 w-96 h-96 bg-pink-200 dark:bg-pink-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-20 right-1/4 w-80 h-80 bg-blue-200 dark:bg-blue-800 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[1,2,3,4].map(i => (
          <div
            key={i}
            className="absolute text-pink-300 dark:text-pink-600 opacity-30 text-xl animate-float"
            style={{ left: `${15 + i * 20}%`, top: '-3%', animationDelay: `${i * 1}s`, animationDuration: `${7 + i}s` }}
          >
            🌸
          </div>
        ))}
      </div>

      <div className="flex w-full items-center justify-center p-4 sm:p-8 z-10">
        <Card className="w-full max-w-sm sm:w-96 shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-2xl shadow-lg">
                <Bot className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle>创建账号</CardTitle>
            <CardDescription>加入 AI 任务管理平台</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input id="name" placeholder="您的名字" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input id="password" type="password" placeholder="至少6位" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" disabled={loading}>
                {loading ? '注册中...' : '注册'}
              </Button>
              <p className="text-sm text-muted-foreground">
                已有账号？<Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">登录</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
