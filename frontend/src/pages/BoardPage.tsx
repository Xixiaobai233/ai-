import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toaster';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import PageTitle from '@/components/PageTitle';
import { Plus, ArrowLeft, MessageSquare, Search, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee: { id: string; name: string; email: string } | null;
  creator: { id: string; name: string };
  dueDate: string | null;
  _count: { comments: number };
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  members: { user: { id: string; name: string } }[];
}

const COLUMNS = [
  { key: 'todo', label: '待办', color: 'bg-gray-100 dark:bg-gray-800' },
  { key: 'in_progress', label: '进行中', color: 'bg-blue-50 dark:bg-blue-900/30' },
  { key: 'done', label: '已完成', color: 'bg-green-50 dark:bg-green-900/30' },
];

const priorityColor: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-200',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
};

export default function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState('medium');
  const [formAssignee, setFormAssignee] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');

  // 从 tasks 中提取唯一的指派人列表（供筛选下拉框使用）
  const uniqueAssignees = useMemo(() => {
    const seen = new Set<string>();
    return tasks.filter(t => {
      if (!t.assignee) return false;
      if (seen.has(t.assignee.id)) return false;
      seen.add(t.assignee.id);
      return true;
    }).map(t => t.assignee!);
  }, [tasks]);

  // 根据筛选条件过滤任务
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(kw);
        const matchesDesc = task.description?.toLowerCase().includes(kw) ?? false;
        if (!matchesTitle && !matchesDesc) return false;
      }
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterAssignee !== 'all' && task.assignee?.id !== filterAssignee) return false;
      return true;
    });
  }, [tasks, searchKeyword, filterPriority, filterAssignee]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [proj, ts] = await Promise.all([
        api.get<ProjectDetail>(`/projects/${id}`),
        api.get<Task[]>(`/projects/${id}/tasks`),
      ]);
      setProject(proj);
      setTasks(ts);
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setEditTask(null);
    setFormTitle('');
    setFormDesc('');
    setFormPriority('medium');
    setFormAssignee('');
    setFormDueDate('');
    setDialogOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setFormTitle(task.title);
    setFormDesc(task.description || '');
    setFormPriority(task.priority);
    setFormAssignee(task.assignee?.id || '');
    setFormDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) { toast('任务标题不能为空', 'error'); return; }
    try {
      const body = {
        title: formTitle,
        description: formDesc || undefined,
        priority: formPriority,
        assigneeId: formAssignee || null,
        dueDate: formDueDate ? new Date(formDueDate).toISOString() : null,
      };
      if (editTask) {
        const updated = await api.put<Task>(`/tasks/${editTask.id}`, body);
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
        toast('任务已更新', 'success');
      } else {
        const created = await api.post<Task>(`/projects/${id}/tasks`, body);
        setTasks(prev => [created, ...prev]);
        toast('任务已创建', 'success');
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as string;
    if (!['todo', 'in_progress', 'done'].includes(newStatus)) return;

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
    } catch {
      loadData();
      toast('状态更新失败', 'error');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast('任务已删除', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  if (loading) return (
    <div>
      <PageTitle title={project?.name ? `${project.name} — 看板` : '看板'} />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-md" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <div key={col.key} className="flex-1 min-w-[280px]">
            <div className={`rounded-lg p-3 ${col.color}`}>
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <div className="space-y-2 min-h-[200px]">
                {[1, 2, 3].map(i => (
                  <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <PageTitle title={project?.name ? `${project.name} — 看板` : '看板'} />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="h-5 w-5" /></Button>
          <h2 className="text-2xl font-bold">{project?.name || '看板'}</h2>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />创建任务</Button>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索任务标题或描述..."
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="all">全部优先级</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="all">全部成员</option>
          {uniqueAssignees.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
          {COLUMNS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.key);
            return (
              <div key={col.key} className="flex-1 min-w-[280px] snap-start">
                <div className={`rounded-lg p-3 ${col.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{col.label}</h3>
                    <span className="text-sm text-muted-foreground bg-white dark:bg-slate-700 rounded-full px-2 py-0.5">{colTasks.length}</span>
                  </div>
                  <div
                    className="space-y-2 min-h-[200px]"
                    onDragOver={e => e.preventDefault()}
                  >
                    {colTasks.map(task => (
                      <Card
                        key={task.id}
                        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={e => {
                          // @dnd-kit handles this
                        }}
                      >
                        <CardContent className="p-3" onClick={() => navigate(`/projects/${id}/tasks/${task.id}`)}>
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium text-sm">{task.title}</span>
                            <Badge className={`text-xs ${priorityColor[task.priority] || ''}`}>{task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{task.assignee?.name || '未指派'}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{task._count.comments}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <DragOverlay>
          {activeTask && (
            <Card className="shadow-xl">
              <CardContent className="p-3"><span className="font-medium">{activeTask.title}</span></CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTask ? '编辑任务' : '创建任务'}</DialogTitle>
            <DialogDescription>填写任务信息</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Input value={formDesc} onChange={e => setFormDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>优先级</Label>
                <select
                  value={formPriority}
                  onChange={e => setFormPriority(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>指派人</Label>
                <select
                  value={formAssignee}
                  onChange={e => setFormAssignee(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">未指派</option>
                  {project?.members.filter(m => m.user.id !== user?.id).map(m => (
                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>截止日期</Label>
              <Input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              {editTask && (
                <Button type="button" variant="destructive" onClick={() => { setDialogOpen(false); deleteTask(editTask.id); }}>
                  删除
                </Button>
              )}
              <Button type="submit">{editTask ? '保存' : '创建'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
