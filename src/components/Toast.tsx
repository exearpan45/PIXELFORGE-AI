import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle2
            : toast.type === 'warning'
            ? AlertTriangle
            : toast.type === 'error'
            ? XCircle
            : Info;

        const borderClass =
          toast.type === 'success'
            ? 'border-emerald-500/30 bg-emerald-950/80 text-emerald-200'
            : toast.type === 'warning'
            ? 'border-amber-500/30 bg-amber-950/80 text-amber-200'
            : toast.type === 'error'
            ? 'border-rose-500/30 bg-rose-950/80 text-rose-200'
            : 'border-purple-500/30 bg-purple-950/80 text-purple-200';

        const iconColor =
          toast.type === 'success'
            ? 'text-emerald-400'
            : toast.type === 'warning'
            ? 'text-amber-400'
            : toast.type === 'error'
            ? 'text-rose-400'
            : 'text-purple-400';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-2 ${borderClass}`}
          >
            <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold tracking-wide">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs opacity-80 mt-0.5 leading-relaxed break-words">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-white/40 hover:text-white transition-colors p-1 -mr-1 -mt-1 rounded-lg"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
