import { useState, useEffect, useRef, useCallback } from 'react';
import { AssetPair, TickerInfo } from '../types';
import { INITIAL_TICKERS } from '../data/marketData';
import { useVisibilityPolling } from './useVisibilityPolling';

export type TickerConnectionMode = 'sse' | 'polling' | 'paused' | 'offline';

export interface UseTickerFeedOptions {
  symbols?: AssetPair[];
  preferStreaming?: boolean;
  pollingIntervalMs?: number;
  onTickerUpdate?: (tickers: Record<AssetPair, TickerInfo>) => void;
}

export interface UseTickerFeedResult {
  tickers: Record<AssetPair, TickerInfo>;
  latencyMs: number;
  isLive: boolean;
  connectionMode: TickerConnectionMode;
  usdtInrRate: number;
  refresh: (force?: boolean) => Promise<void>;
}

/**
 * High-performance network hook for real-time market tickers.
 * - Streams via Server-Sent Events (SSE) when available.
 * - Gracefully falls back to compact mini-ticker polling (/api/market/watchlist-tickers, ~3KB vs 430KB).
 * - Implements strict visibility-aware lifecycle: zero background polling when tab is hidden.
 */
export function useTickerFeed(options: UseTickerFeedOptions = {}): UseTickerFeedResult {
  const {
    symbols,
    preferStreaming = true,
    pollingIntervalMs = 2500,
    onTickerUpdate,
  } = options;

  const [tickers, setTickers] = useState<Record<AssetPair, TickerInfo>>(INITIAL_TICKERS);
  const [latencyMs, setLatencyMs] = useState<number>(32);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [usdtInrRate, setUsdtInrRate] = useState<number>(98.63);
  const [connectionMode, setConnectionMode] = useState<TickerConnectionMode>('polling');

  const onTickerUpdateRef = useRef(onTickerUpdate);
  onTickerUpdateRef.current = onTickerUpdate;

  const eventSourceRef = useRef<EventSource | null>(null);
  const sseFailedRef = useRef(false);

  // Compact mini-ticker polling worker
  const fetchCompactTickers = useCallback(async (force: boolean = false) => {
    const startTime = performance.now();
    try {
      const queryParams = new URLSearchParams();
      if (symbols && symbols.length > 0) {
        queryParams.set('symbols', symbols.join(','));
      }
      if (force) {
        queryParams.set('force', 'true');
      }
      queryParams.set('_t', Date.now().toString());

      const res = await fetch(`/api/market/watchlist-tickers?${queryParams.toString()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data && data.tickers && Object.keys(data.tickers).length > 0) {
        const roundTrip = Math.round(performance.now() - startTime);
        setLatencyMs(roundTrip);
        setIsLive(true);
        if (data.usdtInrRate) setUsdtInrRate(data.usdtInrRate);

        setTickers((prev) => {
          const next = { ...prev, ...data.tickers };
          onTickerUpdateRef.current?.(next);
          return next;
        });
      }
    } catch (err) {
      console.warn('[useTickerFeed] Compact ticker fetch warning:', err);
    }
  }, [symbols]);

  // Visibility polling hook: pauses network polling whenever document is hidden
  const { isVisible, isOnline, triggerImmediate } = useVisibilityPolling(
    fetchCompactTickers,
    pollingIntervalMs,
    {
      enabled: connectionMode === 'polling',
      runImmediately: false,
      runOnVisible: true,
    }
  );

  // SSE Stream Management
  useEffect(() => {
    if (!preferStreaming || sseFailedRef.current) {
      setConnectionMode('polling');
      return;
    }

    if (!isVisible) {
      // Pause SSE while window is hidden
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnectionMode('paused');
      return;
    }

    if (!isOnline) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setConnectionMode('offline');
      return;
    }

    // Connect to SSE stream
    try {
      const streamUrl = symbols && symbols.length > 0
        ? `/api/market/ticker-stream?symbols=${encodeURIComponent(symbols.join(','))}`
        : '/api/market/ticker-stream';

      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnectionMode('sse');
        setIsLive(true);
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.tickers) {
            if (payload.usdtInrRate) setUsdtInrRate(payload.usdtInrRate);
            setTickers((prev) => {
              const next = { ...prev, ...payload.tickers };
              onTickerUpdateRef.current?.(next);
              return next;
            });
          }
        } catch {}
      };

      es.onerror = () => {
        // Fall back gracefully to compact polling
        es.close();
        eventSourceRef.current = null;
        sseFailedRef.current = true;
        setConnectionMode('polling');
        triggerImmediate();
      };
    } catch {
      sseFailedRef.current = true;
      setConnectionMode('polling');
      triggerImmediate();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [preferStreaming, isVisible, isOnline, symbols, triggerImmediate]);

  const refresh = useCallback(async (force: boolean = false) => {
    await fetchCompactTickers(force);
  }, [fetchCompactTickers]);

  return {
    tickers,
    latencyMs,
    isLive,
    connectionMode: !isOnline ? 'offline' : !isVisible ? 'paused' : connectionMode,
    usdtInrRate,
    refresh,
  };
}
