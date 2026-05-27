import React, { useState, useEffect } from 'react';
import { api } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from '@/components/ui/toaster';
import PageTitle from '@/components/PageTitle';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Project {
  id: string;
  name: string;
}

interface Stats {
  total: number;
  statusCount: { todo: number; in_progress: number; done: number };
  priorityCount: { low: number; medium: number; high: number };
  assignees: { userId: string; name: string; taskCount: number }[];
}

const COLORS = ['#94a3b8', '#3b82f6', '#22c55e'];
const STATUS_LABELS: Record<string, string> = { todo: '待办', in_progress: '进行中', done: '已完成' };
const PRIORITY_COLORS = ['#eab308', '#f97316', '#ef4444'];
const PRIORITY_LABELS: Record<string, string> = { low: '低', medium: '中', high: '高' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Project[]>('/projects')
      .then(projs => {
        setProjects(projs);
        if (projs.length > 0) setSelectedProject(projs[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    setLoading(true);
    api.get<Stats>(`/projects/${selectedProject}/stats`)
      .then(setStats)
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [selectedProject]);

  const statusData = stats
    ? Object.entries(stats.statusCount).map(([k, v]) => ({ name: STATUS_LABELS[k] || k, value: v }))
    : [];
  const priorityData = stats
    ? Object.entries(stats.priorityCount).map(([k, v]) => ({ name: PRIORITY_LABELS[k] || k, value: v }))
    : [];

  return (
    <div>
      <PageTitle title="仪表盘" />
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">仪表盘</h2>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-48"><SelectValue placeholder="选择项目" /></SelectTrigger>
          <SelectContent>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!selectedProject ? (
        <div className="text-center py-20 text-muted-foreground"><p>请先选择一个项目</p></div>
      ) : loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="flex flex-col space-y-1.5 p-6 pb-2">
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="p-6 pt-0">
                  <Skeleton className="h-8 w-12" />
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="p-6 pt-0">
                <Skeleton className="h-[250px] w-full rounded-md" />
              </div>
            </div>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="p-6 pt-0">
                <Skeleton className="h-[250px] w-full rounded-md" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="p-6 pt-0">
              <Skeleton className="h-[250px] w-full rounded-md" />
            </div>
          </div>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">总任务</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{stats.total}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">进行中</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-blue-600">{stats.statusCount.in_progress}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">已完成</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{stats.statusCount.done}</p></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>任务状态分布</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>优先级分布</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" name="任务数">
                      {priorityData.map((_, i) => <Cell key={i} fill={PRIORITY_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {stats.assignees.length > 0 && (
            <Card>
              <CardHeader><CardTitle>成员任务分布</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.assignees.map(a => ({ name: a.name, 任务数: a.taskCount }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="任务数" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      ) : <p className="text-center text-muted-foreground">暂无统计数据</p>}
    </div>
  );
}
