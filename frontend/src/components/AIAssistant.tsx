import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';
import { Bot, X, Send, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  failed?: boolean;
}

interface AIAssistantProps {
  projectId?: string;
}

function formatTime(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

export default function AIAssistant({ projectId }: AIAssistantProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好！我是 AI 助手，可以帮你创建任务、分析项目进度。有什么需要帮助的？', timestamp: new Date() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingContent, setTypingContent] = useState<Record<number, string>>({});
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Stop the typewriter interval
  const stopTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start typewriter effect when a new assistant message arrives
  useEffect(() => {
    if (messages.length === 0) return;

    const lastIdx = messages.length - 1;
    const lastMsg = messages[lastIdx];

    // If message count decreased (retry removed a message), clean up
    // If the last message is not assistant or is failed, clear typewriter
    stopTyping();

    // Complete any previous partially-typed content
    setTypingContent(prev => {
      const next: Record<number, string> = {};
      for (const key of Object.keys(prev)) {
        const idx = parseInt(key);
        if (idx < lastIdx && messages[idx]?.role === 'assistant' && !messages[idx]?.failed) {
          // This message was being typed — it's now fully shown since a new message arrived
          continue;
        }
        if (idx === lastIdx) {
          // Will handle this below
          continue;
        }
        next[idx] = prev[idx];
      }
      return next;
    });

    if (lastMsg.role === 'assistant' && !lastMsg.failed && messages.length >= 1) {
      let i = 0;
      const content = lastMsg.content;

      intervalRef.current = setInterval(() => {
        i++;
        setTypingContent(prev => ({ ...prev, [lastIdx]: content.slice(0, i) }));
        if (i >= content.length) {
          stopTyping();
          setTypingContent(prev => {
            const next = { ...prev };
            delete next[lastIdx];
            return next;
          });
        }
      }, 25);
    }

    return () => {
      stopTyping();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Scroll to bottom on messages/typing change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingContent]);

  const sendMessage = useCallback(async (userMsg: string) => {
    if (!userMsg.trim() || loading) return;
    setInput('');
    const userMessage: Message = { role: 'user', content: userMsg, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const res = await api.post<{ reply: string }>('/ai/ask', {
        message: userMsg,
        projectContext: projectId ? `当前项目ID: ${projectId}` : undefined,
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply, timestamp: new Date() }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `出错了：${err.message}`,
        timestamp: new Date(),
        failed: true,
      }]);
    }
    setLoading(false);
  }, [loading, projectId]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const retry = async (failedIdx: number) => {
    // Find the user message immediately before this failed assistant response
    for (let i = failedIdx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const userMsg = messages[i].content;
        // Remove the failed message from the list
        const newMessages = messages.filter((_, idx) => idx !== failedIdx);
        setMessages(newMessages);
        setLoading(true);

        try {
          const res = await api.post<{ reply: string }>('/ai/ask', {
            message: userMsg,
            projectContext: projectId ? `当前项目ID: ${projectId}` : undefined,
          });
          setMessages(prev => [...prev, { role: 'assistant', content: res.reply, timestamp: new Date() }]);
        } catch (err: any) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `出错了：${err.message}`,
            timestamp: new Date(),
            failed: true,
          }]);
        }
        setLoading(false);
        return;
      }
    }
  };

  const handleCreateTask = async () => {
    if (!projectId) { toast('请先进入具体项目', 'error'); return; }
    const taskPrompt = window.prompt('请描述要创建的任务：');
    if (!taskPrompt) return;

    setLoading(true);
    try {
      await api.post('/ai/create-task', { prompt: taskPrompt, projectId });
      toast('AI 创建任务成功！请刷新看板', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
    setLoading(false);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  if (!open) {
    return (
      <Button
        className="fixed bottom-6 right-6 shadow-lg z-50 gap-2 pr-5"
        onClick={() => setOpen(true)}
      >
        <Bot className="h-5 w-5" />
        <span>AI 助手</span>
      </Button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border flex flex-col transition-all ${expanded ? 'w-[500px] h-[600px]' : 'w-[360px] h-[480px]'}`}>
      <div className="flex items-center justify-between p-3 border-b bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <span className="font-medium">AI 助手</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-blue-500 rounded">
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-blue-500 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {messages.map((m, i) => {
          const displayContent = typingContent[i] !== undefined ? typingContent[i] : m.content;
          const isTyping = typingContent[i] !== undefined;
          return (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 dark:text-slate-200'}`}>
                <div className="whitespace-pre-wrap break-words">
                  {displayContent}
                  {isTyping && <span className="inline-block w-[2px] h-4 bg-blue-600 ml-0.5 animate-pulse" />}
                </div>
                <div className={`flex items-center gap-1 mt-1 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className={`text-[10px] ${m.role === 'user' ? 'text-blue-200' : 'text-muted-foreground'}`}>
                    {formatTime(m.timestamp)}
                  </span>
                  {m.failed && !isTyping && (
                    <button
                      onClick={() => retry(i)}
                      className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                      title="重试"
                      disabled={loading}
                    >
                      <RefreshCw className={`h-3 w-3 text-red-500 ${loading ? 'opacity-50' : ''}`} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-700 dark:text-slate-200 rounded-lg px-3 py-2 text-sm">思考中...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t">
        <div className="flex gap-2 mb-2">
          <Button size="sm" variant="outline" onClick={handleCreateTask} disabled={loading || !projectId}>
            创建任务
          </Button>
        </div>
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none min-h-[36px] max-h-[120px] leading-5"
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
          />
          <Button type="button" size="icon" disabled={loading || !input.trim()} onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
