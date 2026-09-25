import React from 'react';
import { ActionToast } from '../hooks/useActionToast';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

interface ActionToastContainerProps {
  toasts: ActionToast[];
  onDismiss: (id: string) => void;
}

export const ActionToastContainer: React.FC<ActionToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notifications & Alerts"
      role="region"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        const borderColor = isSuccess
          ? 'border-[#00ff94]/40 bg-[#0d1f17]/95 text-[#e6fbf2]'
          : isError
          ? 'border-[#ff3b4a]/40 bg-[#251014]/95 text-[#ffebee]'
          : isWarning
          ? 'border-[#f6be16]/40 bg-[#221c08]/95 text-[#fef9c3]'
          : 'border-[#3b82f6]/40 bg-[#0f172a]/95 text-[#f0f9ff]';

        const Icon = isSuccess
          ? CheckCircle2
          : isError
          ? XCircle
          : isWarning
          ? AlertTriangle
          : Info;

        const iconColor = isSuccess
          ? 'text-[#00ff94]'
          : isError
          ? 'text-[#ff3b4a]'
          : isWarning
          ? 'text-[#f6be16]'
          : 'text-[#38bdf8]';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-200 animate-fadeIn ${borderColor}`}
          >
            <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1 text-xs leading-snug break-words">
              {toast.text}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#99907f] hover:text-white transition-colors cursor-pointer p-0.5 -mr-1 -mt-1 rounded"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
