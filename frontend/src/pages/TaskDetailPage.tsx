import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/toaster';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import PageTitle from '@/components/PageTitle';
import { Skeleton } from '@/components/ui/skeleton';

interface Comment {
  id: string;
  content: string;
  author: { id: string; name: string; email: string };
  createdAt: string;
}

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignee: { id: string; name: string } | null;
  creator: { id: string; name: string };
  dueDate: string | null;
  createdAt: string;
  comments: Comment[];
}

const statusLabel: Record<string, string> = { todo: '待办', in_progress: '进行中', done: '已完成' };
const priorityLabel: Record<string, string> = { low: '低', medium: '中', high: '高' };

export default function TaskDetailPage() {
  const { id, taskId } = useParams<{ id: string; taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTask = async () => {
    try {
      const [ts, comments] = await Promise.all([
        api.get<TaskDetail>(`/tasks/${taskId}`),
        api.get<Comment[]>(`/tasks/${taskId}/comments`),
      ]);
      setTask({ ...ts, comments });
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => { loadTask(); }, [taskId]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const comment = await api.post<Comment>(`/tasks/${taskId}/comments`, { content: commentText });
      setTask(prev => prev ? { ...prev, comments: [...prev.comments, comment] } : prev);
      setCommentText('');
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto">
      <PageTitle title="任务详情" />
      <Skeleton className="h-9 w-28 mb-4 rounded-md" />
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm mb-6">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex flex-wrap gap-4 mb-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-20 w-full rounded-md" />
        </div>
      </div>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <Skeleton className="h-5 w-24 mb-4" />
          <Skeleton className="h-10 w-full mb-6 rounded-md" />
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-3/4 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  if (!task) return <><PageTitle title="任务详情" /><p>任务不存在</p></>;

  return (
    <div className="max-w-3xl mx-auto px-0 md:px-0">
      <PageTitle title={task.title} />
      <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />返回看板
      </Button>

      <Card className="mb-6">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-2">
            <h2 className="text-xl md:text-2xl font-bold">{task.title}</h2>
            <Badge>{priorityLabel[task.priority] || task.priority}优先级</Badge>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1"><User className="h-4 w-4" />指派给：{task.assignee?.name || '未指派'}</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />截止：{task.dueDate ? new Date(task.dueDate).toLocaleDateString('zh-CN') : '无'}</span>
            <span>状态：{statusLabel[task.status] || task.status}</span>
            <span>创建者：{task.creator.name}</span>
          </div>

          {task.description && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-md p-4 mb-4">
              <p className="whitespace-pre-wrap text-sm">{task.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <h3 className="font-semibold mb-4">评论 ({task.comments.length})</h3>

          <form onSubmit={handleComment} className="flex gap-2 mb-6">
            <input
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="输入评论..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={submitting || !commentText.trim()}>发送</Button>
          </form>

          <div className="space-y-4">
            {task.comments.map(c => (
              <div key={c.id}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{c.author.name}</span>
                  <span className="text-muted-foreground text-xs">{new Date(c.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <p className="text-sm mt-1">{c.content}</p>
                <Separator className="mt-3" />
              </div>
            ))}
            {task.comments.length === 0 && <p className="text-sm text-muted-foreground">暂无评论</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
