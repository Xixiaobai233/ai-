import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toaster';
import PageTitle from '@/components/PageTitle';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyStateIllus } from '@/components/illustrations/WorkspaceIllus';
import { Plus, FolderKanban, Users, ListTodo } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  owner: { id: string; name: string };
  _count: { tasks: number; members: number };
  createdAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Project[]>('/projects')
      .then(setProjects)
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast('项目名称不能为空', 'error'); return; }
    setCreating(true);
    try {
      const project = await api.post<Project>('/projects', { name, description });
      setProjects(prev => [project, ...prev]);
      setOpen(false);
      setName('');
      setDescription('');
      toast('项目创建成功', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setCreating(false);
  };

  if (loading) return (
    <div>
      <PageTitle title="项目列表" />
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 pb-2">
              <Skeleton className="h-5 w-3/4" />
            </div>
            <div className="p-6 pt-0">
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <PageTitle title="项目列表" />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">我的项目</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />新建项目</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新建项目</DialogTitle>
              <DialogDescription>创建一个新的项目管理空间</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pname">项目名称</Label>
                <Input id="pname" value={name} onChange={e => setName(e.target.value)} placeholder="输入项目名称" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdesc">项目描述</Label>
                <Input id="pdesc" value={description} onChange={e => setDescription(e.target.value)} placeholder="可选描述" />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>{creating ? '创建中...' : '创建项目'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16">
          <EmptyStateIllus className="h-40 mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">还没有项目哦~</p>
          <p className="text-sm text-muted-foreground mt-1">点击右上角「新建项目」开始吧 ✨</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <Card key={p.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/projects/${p.id}`)}>
              <CardHeader>
                <CardTitle className="text-lg">{p.name}</CardTitle>
                {p.description && <CardDescription>{p.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><ListTodo className="h-4 w-4" />{p._count.tasks} 任务</span>
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />{p._count.members} 成员</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
