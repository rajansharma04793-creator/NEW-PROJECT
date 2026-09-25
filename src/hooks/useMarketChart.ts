import { useState, useEffect, useRef, useCallback } from 'react';
import { AssetPair, Candle } from '../types';
import { fetchCoinDCXCandles } from '../services/coindcxService';
import { generateSyntheticCandles } from '../data/marketData';

export interface UseMarketChartOptions {
  symbol: AssetPair;
  timeframe: string;
  targetPrice: number;
  currencyMode?: 'USDT' | 'INR';
  candleCount?: number;
}

export interface UseMarketChartResult {
  candles: Candle[];
  isLoading: boolean;
  isLive: boolean;
  dataKey: string;
  error: string | null;
  refreshCandles: () => Promise<void>;
  updateLatestPrice: (price: number) => void;
  appendCandle: (candle: Candle) => void;
}

/**
 * Custom hook to isolate chart data, prevent race conditions across symbol switches,
 * abort in-flight requests, and ensure data integrity.
 */
export function useMarketChart({
  symbol,
  timeframe,
  targetPrice,
  currencyMode = 'USDT',
  candleCount = 100,
}: UseMarketChartOptions): UseMarketChartResult {
  const currentKey = `${symbol}::${timeframe}::${currencyMode}`;
  const currentKeyRef = useRef<string>(currentKey);
  currentKeyRef.current = currentKey;

  // Chart data cache keyed strictly by symbol + timeframe + currency
  const candleCacheRef = useRef<Map<string, Candle[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Active state
  const [candles, setCandles] = useState<Candle[]>(() => {
    // Generate immediate clean synthetic candles matching the target asset's price
    return generateSyntheticCandles(Math.max(0.0001, targetPrice), candleCount, timeframe);
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch candles for a specific key
  const loadCandles = useCallback(
    async (sym: AssetPair, tf: string, curr: 'USDT' | 'INR', price: number) => {
      const fetchKey = `${sym}::${tf}::${curr}`;

      // 1. Abort any previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsLoading(true);
      setError(null);
      setIsLive(false);

      // 2. Clear / Quarantine previous candles immediately
      // If we have a cached series for this exact symbol+timeframe, use it immediately
      const cached = candleCacheRef.current.get(fetchKey);
      if (cached && cached.length > 0) {
        setCandles(cached);
        setIsLive(true);
      } else {
        // Otherwise, seed isolated synthetic candles at the exact price scale of the target asset
        const cleanSeed = generateSyntheticCandles(Math.max(0.0001, price), candleCount, tf);
        setCandles(cleanSeed);
      }

      try {
        const liveData = await fetchCoinDCXCandles(
          sym,
          tf,
          candleCount,
          curr,
          controller.signal
        );

        // 3. Race condition gate: Verify this response is still for the active symbol and not aborted
        if (controller.signal.aborted || currentKeyRef.current !== fetchKey) {
          return;
        }

        if (liveData && liveData.length > 0) {
          // Double verify candle scale matches reasonable bounds of targetPrice (prevent $80k BTC candles on $2500 ETH)
          const latestClose = liveData[liveData.length - 1].close;
          const ratio = latestClose / Math.max(0.0001, price);
          const isReasonableScale = ratio > 0.05 && ratio < 20;

          if (isReasonableScale) {
            candleCacheRef.current.set(fetchKey, liveData);
            setCandles(liveData);
            setIsLive(true);
          } else {
            // Quarantine mismatched scale
            console.warn(`[useMarketChart] Scale mismatch detected for ${fetchKey}: received ${latestClose}, expected near ${price}. Quarantined.`);
            setIsLive(false);
          }
        } else {
          setIsLive(false);
        }
      } catch (err: any) {
        if (!controller.signal.aborted && currentKeyRef.current === fetchKey) {
          setError(err?.message || 'Failed to load live exchange candles');
          setIsLive(false);
        }
      } finally {
        if (!controller.signal.aborted && currentKeyRef.current === fetchKey) {
          setIsLoading(false);
        }
      }
    },
    [candleCount]
  );

  // Trigger load whenever symbol, timeframe, or currencyMode changes
  useEffect(() => {
    loadCandles(symbol, timeframe, currencyMode, targetPrice);

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [symbol, timeframe, currencyMode, loadCandles]);

  // Update latest forming candle price
  const updateLatestPrice = useCallback(
    (livePrice: number) => {
      if (livePrice <= 0) return;

      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const lastIndex = prev.length - 1;
        const last = prev[lastIndex];

        // Ensure update is reasonable for this pair
        const ratio = livePrice / Math.max(0.0001, last.close);
        if (ratio < 0.2 || ratio > 5) {
          return prev; // Ignore stray prices from other pairs
        }

        const updated: Candle = {
          ...last,
          close: livePrice,
          high: Math.max(last.high, livePrice),
          low: Math.min(last.low, livePrice),
        };

        const next = [...prev];
        next[lastIndex] = updated;

        // Also update cache
        candleCacheRef.current.set(currentKeyRef.current, next);
        return next;
      });
    },
    []
  );

  // Append newly completed candle
  const appendCandle = useCallback(
    (candle: Candle) => {
      setCandles((prev) => {
        const next = [...prev.slice(1), candle];
        candleCacheRef.current.set(currentKeyRef.current, next);
        return next;
      });
    },
    []
  );

  const refreshCandles = useCallback(async () => {
    await loadCandles(symbol, timeframe, currencyMode, targetPrice);
  }, [symbol, timeframe, currencyMode, targetPrice, loadCandles]);

  return {
    candles,
    isLoading,
    isLive,
    dataKey: currentKey,
    error,
    refreshCandles,
    updateLatestPrice,
    appendCandle,
  };
}
