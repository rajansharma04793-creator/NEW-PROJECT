import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseVisibilityPollingOptions {
  enabled?: boolean;
  runImmediately?: boolean;
  runOnVisible?: boolean;
}

/**
 * Visibility-aware interval runner hook.
 * Completely pauses network execution when the browser tab/window is hidden or minimized,
 * and immediately triggers a refresh when the user refocuses the page.
 */
export function useVisibilityPolling(
  callback: () => Promise<void> | void,
  intervalMs: number,
  options: UseVisibilityPollingOptions = {}
) {
  const { enabled = true, runImmediately = true, runOnVisible = true } = options;

  const [isVisible, setIsVisible] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' && 'onLine' in navigator ? navigator.onLine : true
  );

  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const isRunningRef = useRef(false);

  const execute = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    try {
      await callbackRef.current();
    } catch (err) {
      console.warn('[VisibilityPolling] Polling iteration error:', err);
    } finally {
      isRunningRef.current = false;
    }
  }, []);

  // Listen to visibility and online/offline status
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);
      if (visible && enabled && runOnVisible) {
        execute();
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      if (document.visibilityState === 'visible' && enabled) {
        execute();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, runOnVisible, execute]);

  // Manage interval when visible & online & enabled
  useEffect(() => {
    if (!enabled || !isVisible || !isOnline || intervalMs <= 0) {
      return;
    }

    if (runImmediately) {
      execute();
    }

    const intervalId = setInterval(execute, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, isVisible, isOnline, intervalMs, runImmediately, execute]);

  return {
    isVisible,
    isOnline,
    isPolling: enabled && isVisible && isOnline,
    triggerImmediate: execute,
  };
}
