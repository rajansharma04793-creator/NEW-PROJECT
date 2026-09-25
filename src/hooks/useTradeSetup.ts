import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AssetPair, AISignal, TradeSetup, TradeSetupValidation, UnifiedTradeSetup } from '../types';

export interface UseTradeSetupProps {
  symbol?: AssetPair;
  initialSymbol?: AssetPair;
  currentMarketPrice?: number;
  initialPrice?: number;
  balance?: number;
  accountEquity?: number;
  precision?: number;
  currencyMode?: 'USDT' | 'INR';
  inrRate?: number;
  timeframe?: string;
  initialSignal?: AISignal | null;
  onTradeSetupChange?: (setup: TradeSetup) => void;
}

/**
 * Validates any trade setup against directional rules (LONG: TP > Entry > SL; SHORT: SL > Entry > TP)
 */
export function validateUnifiedTradeSetup(setup: {
  side: 'LONG' | 'SHORT' | 'buy' | 'sell';
  entry: number;
  takeProfit: number;
  stopLoss: number;
}): { isValid: boolean; error: string | null } {
  const isBuy = setup.side === 'LONG' || setup.side === 'buy';
  if (isBuy) {
    if (setup.takeProfit <= setup.entry || setup.stopLoss >= setup.entry) {
      return {
        isValid: false,
        error: 'Invalid LONG setup: Target must be above Entry and Stop Loss must be below Entry.',
      };
    }
  } else {
    if (setup.takeProfit >= setup.entry || setup.stopLoss <= setup.entry) {
      return {
        isValid: false,
        error: 'Invalid SHORT setup: Target must be below Entry and Stop Loss must be above Entry.',
      };
    }
  }
  return { isValid: true, error: null };
}

/**
 * Calculates direction-aware defaults for Take Profit and Stop Loss with support for low-price coins
 */
export function calculateDirectionalTPSL(
  side: 'buy' | 'sell',
  entryPrice: number,
  precision: number = 2
): { takeProfit: number; stopLoss: number } {
  if (entryPrice <= 0) {
    return { takeProfit: 0, stopLoss: 0 };
  }

  // Ensure effective precision accommodates sub-dollar assets (e.g. DOGE $0.082, XRP $0.55)
  const effectivePrecision =
    precision && precision > 2
      ? precision
      : entryPrice < 0.001
      ? 6
      : entryPrice < 0.1
      ? 5
      : entryPrice < 1
      ? 4
      : precision || 2;

  const minStep = Math.pow(10, -effectivePrecision);

  if (side === 'buy') {
    // LONG: TP > Entry, SL < Entry
    let tp = +(entryPrice * 1.035).toFixed(effectivePrecision);
    let sl = +(entryPrice * 0.985).toFixed(effectivePrecision);

    // Guaranteed strict inequality even with rounding edge cases
    if (tp <= entryPrice) {
      tp = +(entryPrice + minStep).toFixed(effectivePrecision);
    }
    if (sl >= entryPrice) {
      sl = +(entryPrice - minStep).toFixed(effectivePrecision);
    }

    return { takeProfit: tp, stopLoss: sl };
  } else {
    // SHORT: TP < Entry, SL > Entry
    let tp = +(entryPrice * 0.965).toFixed(effectivePrecision);
    let sl = +(entryPrice * 1.015).toFixed(effectivePrecision);

    // Guaranteed strict inequality even with rounding edge cases
    if (tp >= entryPrice) {
      tp = +(entryPrice - minStep).toFixed(effectivePrecision);
    }
    if (sl <= entryPrice) {
      sl = +(entryPrice + minStep).toFixed(effectivePrecision);
    }

    return { takeProfit: tp, stopLoss: sl };
  }
}

/**
 * Validates a TradeSetup against institutional risk criteria
 */
export function validateTradeSetup(
  setup: TradeSetup,
  accountEquity: number = 100000
): TradeSetupValidation {
  const quoteAgeMs = Math.max(0, Date.now() - setup.quoteTimestamp);
  const isStale = quoteAgeMs > 2000;
  const maxAllowedRiskUsd = +(accountEquity * 0.01).toFixed(2);
  const messages: string[] = [];

  // Directional checks
  let directionalError: string | null = null;
  let stopLossError: string | null = null;
  let takeProfitError: string | null = null;

  if (setup.side === 'buy') {
    if (setup.stopLoss >= setup.entryPrice) {
      stopLossError = `For BUY / LONG: Stop Loss ($${setup.stopLoss}) must be strictly below Entry Price ($${setup.entryPrice})`;
      messages.push(stopLossError);
    }
    if (setup.takeProfit <= setup.entryPrice) {
      takeProfitError = `For BUY / LONG: Take Profit ($${setup.takeProfit}) must be strictly above Entry Price ($${setup.entryPrice})`;
      messages.push(takeProfitError);
    }
    if (stopLossError || takeProfitError) {
      directionalError = 'Invalid LONG setup: Target must be above Entry and Stop Loss must be below Entry.';
      messages.unshift(directionalError);
    }
  } else {
    if (setup.stopLoss <= setup.entryPrice) {
      stopLossError = `For SELL / SHORT: Stop Loss ($${setup.stopLoss}) must be strictly above Entry Price ($${setup.entryPrice})`;
      messages.push(stopLossError);
    }
    if (setup.takeProfit >= setup.entryPrice) {
      takeProfitError = `For SELL / SHORT: Take Profit ($${setup.takeProfit}) must be strictly below Entry Price ($${setup.entryPrice})`;
      messages.push(takeProfitError);
    }
    if (stopLossError || takeProfitError) {
      directionalError = 'Invalid SHORT setup: Target must be below Entry and Stop Loss must be above Entry.';
      messages.unshift(directionalError);
    }
  }

  // Leverage check (retail 3x cap)
  let leverageError: string | null = null;
  if (setup.leverage > 3) {
    leverageError = `Leverage ${setup.leverage}x exceeds conservative retail maximum of 3x`;
    messages.push(leverageError);
  }

  // Risk check: Max 1% equity
  const plannedLossPerUnit = Math.abs(setup.entryPrice - setup.stopLoss);
  const plannedLossUsd = +(plannedLossPerUnit * setup.quantity).toFixed(2);
  const plannedLossPercent = +((plannedLossUsd / Math.max(1, accountEquity)) * 100).toFixed(2);

  let riskError: string | null = null;
  if (setup.quantity > 0 && plannedLossUsd > maxAllowedRiskUsd + 0.01) {
    riskError = `Planned loss ($${plannedLossUsd}) exceeds 1.0% account equity risk limit ($${maxAllowedRiskUsd})`;
    messages.push(riskError);
  }

  // General checks
  let generalError: string | null = null;
  if (setup.quantity <= 0) {
    generalError = 'Quantity must be greater than zero';
    messages.push(generalError);
  } else if (setup.entryPrice <= 0) {
    generalError = 'Entry price must be valid';
    messages.push(generalError);
  } else if (isStale) {
    generalError = `Market quote is stale (${quoteAgeMs}ms old > 2000ms threshold)`;
    messages.push(generalError);
  }

  const isValid =
    !directionalError &&
    !stopLossError &&
    !takeProfitError &&
    !leverageError &&
    !riskError &&
    !generalError &&
    !isStale;

  return {
    isValid,
    isStale,
    quoteAgeMs,
    directionalError,
    stopLossError,
    takeProfitError,
    riskError,
    leverageError,
    generalError,
    plannedLossUsd,
    plannedLossPercent,
    maxAllowedRiskUsd,
    messages,
  };
}

export function useTradeSetup(options: UseTradeSetupProps = {}) {
  const activeSymbol = options.symbol || options.initialSymbol || 'BTC/USDT';
  const activePrice = options.currentMarketPrice || options.initialPrice || 68000;
  const activeEquity = options.balance || options.accountEquity || 100000;
  const activePrecision = options.precision ?? 2;
  const initialSignal = options.initialSignal || null;

  const [setupRaw, setSetup] = useState<TradeSetup>(() => {
    if (initialSignal) {
      const side = initialSignal.side === 'LONG' ? 'buy' : 'sell';
      return {
        symbol: initialSignal.symbol,
        side,
        orderType: 'limit',
        entryPrice: initialSignal.entryPrice,
        currentMarketPrice: activePrice,
        quantity: 0.1,
        leverage: Math.min(initialSignal.recommendedLeverage || 2, 3),
        stopLoss: initialSignal.stopLoss,
        takeProfit: initialSignal.target1,
        quoteTimestamp: Date.now(),
        source: 'signal',
        signalId: initialSignal.id,
        strategyName: initialSignal.strategy,
        marginType: 'cross',
        sourceSignal: initialSignal,
      };
    }

    const { takeProfit, stopLoss } = calculateDirectionalTPSL('buy', activePrice, activePrecision);
    return {
      symbol: activeSymbol,
      side: 'buy',
      orderType: 'limit',
      entryPrice: activePrice,
      currentMarketPrice: activePrice,
      quantity: 0.1,
      leverage: 2,
      stopLoss,
      takeProfit,
      quoteTimestamp: Date.now(),
      source: 'manual',
      marginType: 'cross',
      sourceSignal: null,
    };
  });

  // Calculate derived financial properties
  const totalValue = +(setupRaw.entryPrice * setupRaw.quantity).toFixed(2);
  const marginRequired = setupRaw.leverage > 0 ? +(totalValue / setupRaw.leverage).toFixed(2) : totalValue;

  const setup: TradeSetup = useMemo(() => ({
    ...setupRaw,
    totalValue,
    marginRequired,
  }), [setupRaw, totalValue, marginRequired]);

  // Keep quote timestamp fresh on live price updates
  const updateMarketPrice = useCallback((price: number) => {
    if (price <= 0) return;
    setSetup((prev) => ({
      ...prev,
      currentMarketPrice: price,
      quoteTimestamp: Date.now(),
    }));
  }, []);

  // Update Side with direction-aware TP/SL adaptation
  const setSide = useCallback((newSide: 'buy' | 'sell') => {
    setSetup((prev) => {
      if (prev.side === newSide) return prev;

      // Recalibrate TP/SL directionally
      const { takeProfit, stopLoss } = calculateDirectionalTPSL(newSide, prev.entryPrice, activePrecision);
      return {
        ...prev,
        side: newSide,
        takeProfit,
        stopLoss,
        quoteTimestamp: Date.now(),
      };
    });
  }, [activePrecision]);

  // Update entry price and optionally recompute TP/SL if requested
  const setEntryPrice = useCallback((price: number, autoAdjustTPSL: boolean = false) => {
    if (price <= 0) return;
    setSetup((prev) => {
      let tp = prev.takeProfit;
      let sl = prev.stopLoss;

      if (autoAdjustTPSL) {
        const calculated = calculateDirectionalTPSL(prev.side, price, activePrecision);
        tp = calculated.takeProfit;
        sl = calculated.stopLoss;
      } else {
        // Enforce basic directional sanity if entry crossed SL/TP
        if (prev.side === 'buy') {
          if (sl >= price) sl = +(price * 0.985).toFixed(activePrecision);
          if (tp <= price) tp = +(price * 1.035).toFixed(activePrecision);
        } else {
          if (sl <= price) sl = +(price * 1.015).toFixed(activePrecision);
          if (tp >= price) tp = +(price * 0.965).toFixed(activePrecision);
        }
      }

      return {
        ...prev,
        entryPrice: price,
        takeProfit: tp,
        stopLoss: sl,
        quoteTimestamp: Date.now(),
      };
    });
  }, [activePrecision]);

  // Update quantity
  const setQuantity = useCallback((quantity: number) => {
    setSetup((prev) => ({
      ...prev,
      quantity: Math.max(0, quantity),
    }));
  }, []);

  // Update leverage (strictly capped at 3x)
  const setLeverage = useCallback((leverage: number) => {
    setSetup((prev) => ({
      ...prev,
      leverage: Math.min(Math.max(1, leverage), 3),
    }));
  }, []);

  // Update order type
  const setOrderType = useCallback((orderType: 'limit' | 'market' | 'stop-limit' | 'ai-smart') => {
    setSetup((prev) => ({
      ...prev,
      orderType,
    }));
  }, []);

  // Explicitly update Stop Loss
  const setStopLoss = useCallback((stopLoss: number) => {
    setSetup((prev) => ({
      ...prev,
      stopLoss,
      quoteTimestamp: Date.now(),
    }));
  }, []);

  // Explicitly update Take Profit
  const setTakeProfit = useCallback((takeProfit: number) => {
    setSetup((prev) => ({
      ...prev,
      takeProfit,
      quoteTimestamp: Date.now(),
    }));
  }, []);

  // Synchronize entire trade setup directly from an AI signal
  const syncFromSignal = useCallback((signal: AISignal, marketPrice?: number) => {
    const side = signal.side === 'LONG' ? 'buy' : 'sell';
    const entry = signal.entryPrice;
    const cmp = marketPrice || entry;

    setSetup({
      symbol: signal.symbol,
      side,
      orderType: 'limit',
      entryPrice: entry,
      currentMarketPrice: cmp,
      quantity: 0.1,
      leverage: Math.min(signal.recommendedLeverage || 2, 3),
      stopLoss: signal.stopLoss,
      takeProfit: signal.target1,
      quoteTimestamp: Date.now(),
      source: 'signal',
      signalId: signal.id,
      strategyName: signal.strategy,
      marginType: 'cross',
      sourceSignal: signal,
    });
  }, []);

  // Reset to manual defaults
  const resetToDefaults = useCallback(() => {
    const { takeProfit, stopLoss } = calculateDirectionalTPSL('buy', activePrice, activePrecision);
    setSetup({
      symbol: activeSymbol,
      side: 'buy',
      orderType: 'limit',
      entryPrice: activePrice,
      currentMarketPrice: activePrice,
      quantity: 0.1,
      leverage: 2,
      stopLoss,
      takeProfit,
      quoteTimestamp: Date.now(),
      source: 'manual',
      marginType: 'cross',
      sourceSignal: null,
    });
  }, [activePrice, activeSymbol, activePrecision]);

  // Synchronize when switching symbols
  const syncSymbol = useCallback((newSymbol: AssetPair, newPrice: number) => {
    setSetup((prev) => {
      const { takeProfit, stopLoss } = calculateDirectionalTPSL(prev.side, newPrice, activePrecision);
      return {
        ...prev,
        symbol: newSymbol,
        entryPrice: newPrice,
        currentMarketPrice: newPrice,
        takeProfit,
        stopLoss,
        quoteTimestamp: Date.now(),
        source: 'manual',
        signalId: undefined,
        sourceSignal: null,
      };
    });
  }, [activePrecision]);

  // Single Source of Truth Unified Trade Setup
  const unifiedTradeSetup: UnifiedTradeSetup = useMemo(() => ({
    symbol: setup.symbol,
    side: setup.side === 'buy' ? 'LONG' : 'SHORT',
    entry: setup.entryPrice,
    takeProfit: setup.takeProfit,
    stopLoss: setup.stopLoss,
    timeframe: options.timeframe || '15m',
    signalId: setup.signalId,
    updatedAt: setup.quoteTimestamp,
  }), [setup, options.timeframe]);

  const onTradeSetupChange = options.onTradeSetupChange;
  useEffect(() => {
    if (onTradeSetupChange) {
      onTradeSetupChange(setup);
    }
  }, [setup, onTradeSetupChange]);

  // Validation output
  const validation = useMemo(() => {
    return validateTradeSetup(setup, activeEquity);
  }, [setup, activeEquity]);

  return {
    setup,
    unifiedTradeSetup,
    validation,
    setSide,
    setEntryPrice,
    setQuantity,
    setLeverage,
    setOrderType,
    setStopLoss,
    setTakeProfit,
    updateMarketPrice,
    syncFromSignal,
    syncSymbol,
    resetToDefaults,
    setSetup,
  };
}
