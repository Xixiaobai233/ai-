import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let addToastFn: ((msg: string, type: 'success' | 'error' | 'info') => void) | null = null;

export function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  addToastFn?.(message, type);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  let nextId = 0;

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = ++nextId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  useEffect(() => { addToastFn = addToast; return () => { addToastFn = null; }; }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'rounded-md px-4 py-3 text-sm font-medium shadow-lg text-white animate-in slide-in-from-right',
            t.type === 'success' && 'bg-green-600',
            t.type === 'error' && 'bg-red-600',
            t.type === 'info' && 'bg-blue-600',
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
