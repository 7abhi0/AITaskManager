import React from 'react';
import { useToastStore } from '../../store/useToastStore';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const ToastProvider: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((t) => {
        const bgStyles = {
          success: 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50',
          error: 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50',
          info: 'bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50',
          warning: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50',
        }[t.type];

        const Icon = {
          success: CheckCircle2,
          error: AlertCircle,
          info: Info,
          warning: AlertTriangle,
        }[t.type];

        return (
          <div
            key={t.id}
            className={`flex items-start gap-3 p-4 rounded-xl border glass shadow-lg transition-all duration-300 transform translate-y-0 ${bgStyles}`}
          >
            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm font-medium">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
export default ToastProvider;
