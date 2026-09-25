import { useState, useCallback, useRef, useEffect } from 'react';

export interface ActionToast {
  id: string;
  triggerId?: string;
  text: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: number;
  ttlMs: number;
}

export function useActionToast(defaultTtlMs = 3500) {
  const [toasts, setToasts] = useState<ActionToast[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up timers on unmount
  useEffect(() => {
    const currentTimers = timeoutsRef.current;
    return () => {
      currentTimers.forEach((timer) => clearTimeout(timer));
      currentTimers.clear();
    };
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id)!);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (
      text: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
      triggerId?: string,
      ttlMs = defaultTtlMs
    ) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const now = Date.now();

      setToasts((prev) => {
        // If triggerId is provided, dismiss any pending stale toast for the same trigger
        let filtered = prev;
        if (triggerId) {
          const stale = prev.filter((t) => t.triggerId === triggerId);
          stale.forEach((t) => {
            if (timeoutsRef.current.has(t.id)) {
              clearTimeout(timeoutsRef.current.get(t.id)!);
              timeoutsRef.current.delete(t.id);
            }
          });
          filtered = prev.filter((t) => t.triggerId !== triggerId);
        }

        // Limit maximum concurrent toasts to 3 to prevent screen overcrowding
        const capped = filtered.slice(-2);
        return [
          ...capped,
          {
            id,
            triggerId,
            text,
            type,
            timestamp: now,
            ttlMs,
          },
        ];
      });

      const timer = setTimeout(() => {
        dismissToast(id);
      }, ttlMs);

      timeoutsRef.current.set(id, timer);
      return id;
    },
    [defaultTtlMs, dismissToast]
  );

  const clearAllToasts = useCallback(() => {
    timeoutsRef.current.forEach((timer) => clearTimeout(timer));
    timeoutsRef.current.clear();
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    dismissToast,
    clearAllToasts,
  };
}
