import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AssetPair, OrderReviewPayload, AISignal, ProductTradingMode, UnifiedTradeSetup } from '../types';
import { useTradeSetup } from '../hooks/useTradeSetup';
import {
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Zap,
  Info,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Settings2,
} from 'lucide-react';

interface OrderPanelProps {
  symbol: AssetPair;
  currentPrice: number;
  selectedPrice: number | null;
  balance: number;
  precision: number;
  currencyMode?: 'USDT' | 'INR';
  inrPrice?: number;
  timeframe?: string;
  currentMode?: ProductTradingMode;
  activeSignal?: AISignal | null;
  onApplySignalSetup?: (sig: AISignal) => void;
  onRequestReviewOrder?: (payload: OrderReviewPayload) => void;
  onTradeSetupChange?: (setup: UnifiedTradeSetup) => void;
  onPlaceOrder: (order: {
    symbol: AssetPair;
    type: 'limit' | 'market' | 'stop-limit';
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    leverage: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => void;
  onOpenRiskCalculator?: () => void;
  onOpenSmartEntry?: () => void;
  autoExecutionEnabled?: boolean;
  onToggleAutoExecution?: () => void;
  onOpenAutoAlertsModal?: () => void;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({
  symbol,
  currentPrice,
  selectedPrice,
  balance,
  precision,
  currencyMode = 'USDT',
  inrPrice,
  timeframe = '15m',
  currentMode = 'PAPER',
  activeSignal,
  onRequestReviewOrder,
  onTradeSetupChange,
  onPlaceOrder,
  onOpenRiskCalculator,
  onOpenSmartEntry,
  autoExecutionEnabled,
  onToggleAutoExecution,
  onOpenAutoAlertsModal,
}) => {
  const isINR = currencyMode === 'INR' && inrPrice !== undefined && inrPrice > 0;
  const inrRateMultiplier = isINR && currentPrice > 0 ? inrPrice / currentPrice : 98.3;
  const currencySymbol = isINR ? '₹' : '$';

  // Instantiate Single Source of Truth (SSoT) hook
  const {
    setup,
    unifiedTradeSetup,
    validation,
    setSide,
    setEntryPrice,
    setStopLoss,
    setTakeProfit,
    setQuantity,
    setLeverage,
    setOrderType,
    syncFromSignal,
    syncSymbol,
    resetToDefaults,
  } = useTradeSetup({
    symbol,
    currentMarketPrice: currentPrice,
    balance,
    precision,
    currencyMode,
    inrRate: inrRateMultiplier,
    timeframe,
    initialSignal: activeSignal || undefined,
  });

  // Notify parent of unified trade setup changes (Single Source of Truth)
  useEffect(() => {
    if (onTradeSetupChange) {
      onTradeSetupChange(unifiedTradeSetup);
    }
  }, [unifiedTradeSetup, onTradeSetupChange]);

  const [marginType, setMarginType] = useState<'cross' | 'isolated'>('cross');
  const [percentSlider, setPercentSlider] = useState<number>(0);
  const [enableTPSL, setEnableTPSL] = useState<boolean>(true);
  const [enableTrailingSL, setEnableTrailingSL] = useState<boolean>(false);
  const [trailingStopPercent, setTrailingStopPercent] = useState<number>(1.5);
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState<boolean>(false);

  // Sync with activeSignal whenever activeSignal changes
  const prevSignalIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (activeSignal && activeSignal.symbol === symbol) {
      if (activeSignal.id !== prevSignalIdRef.current) {
        prevSignalIdRef.current = activeSignal.id;
        syncFromSignal(activeSignal, currentPrice);
      }
    }
  }, [activeSignal, symbol, currentPrice, syncFromSignal]);

  // Sync symbol whenever symbol prop changes (Requirement 3: clear old levels, load fresh setup)
  const prevSymbolRef = useRef<AssetPair>(symbol);
  useEffect(() => {
    if (prevSymbolRef.current !== symbol) {
      prevSymbolRef.current = symbol;
      prevSignalIdRef.current = null;
      syncSymbol(symbol, currentPrice);
    }
  }, [symbol, syncSymbol, currentPrice]);

  // When selectedPrice is picked from orderbook / chart, update entry
  useEffect(() => {
    if (selectedPrice !== null && selectedPrice > 0) {
      setEntryPrice(selectedPrice);
    }
  }, [selectedPrice, setEntryPrice]);

  // Handle amount change via percentage presets
  const handlePercentClick = (pct: number) => {
    setPercentSlider(pct);
    const maxMargin = (isINR ? balance * inrRateMultiplier : balance) * (pct / 100);
    const calculatedAmount = (maxMargin * setup.leverage) / (setup.entryPrice || currentPrice || 1);
    const safeQty = calculatedAmount > 0 ? +calculatedAmount.toFixed(4) : 0;
    setQuantity(safeQty);
  };

  const handleAmountInputChange = (valStr: string) => {
    const val = Number(valStr) || 0;
    setQuantity(val);
    const requiredMargin = (val * setup.entryPrice) / (setup.leverage || 1);
    const effectiveBalance = isINR ? balance * inrRateMultiplier : balance;
    const pct = effectiveBalance > 0 ? Math.min(100, (requiredMargin / effectiveBalance) * 100) : 0;
    setPercentSlider(Math.round(pct));
  };

  // Liquidation Price calculation preview
  const estBuyLiqPrice = setup.entryPrice > 0 && setup.leverage > 1
    ? setup.entryPrice * (1 - 0.9 / setup.leverage)
    : 0;
  const estSellLiqPrice = setup.entryPrice > 0 && setup.leverage > 1
    ? setup.entryPrice * (1 + 0.9 / setup.leverage)
    : 0;

  // Order Review & Execution Handler
  const handleInitiateOrder = () => {
    if (!validation.isValid || setup.quantity <= 0 || setup.totalValue <= 0 || currentMode === 'RESEARCH') {
      return;
    }

    const safePriceUsd = isINR ? setup.entryPrice / inrRateMultiplier : setup.entryPrice;
    const feeRate = setup.orderType === 'limit' ? 0.0002 : 0.0004;
    const tradingFeeUsd = +(setup.quantity * safePriceUsd * feeRate).toFixed(4);
    const fundingFeeUsd = +(setup.quantity * safePriceUsd * 0.0001).toFixed(4);
    const spreadUsd = +(setup.quantity * safePriceUsd * 0.0002).toFixed(4);
    const slippageUsd = +(setup.quantity * safePriceUsd * 0.0002).toFixed(4);

    let maxLossUsd = setup.marginRequired;
    if (setup.stopLoss) {
      const rawSlUsd = isINR ? setup.stopLoss / inrRateMultiplier : setup.stopLoss;
      maxLossUsd = +(Math.abs(safePriceUsd - rawSlUsd) * setup.quantity).toFixed(2);
    }

    const estimatedLiq = setup.side === 'buy'
      ? +(safePriceUsd * (1 - (1 / setup.leverage) + 0.004)).toFixed(2)
      : +(safePriceUsd * (1 + (1 / setup.leverage) - 0.004)).toFixed(2);

    const idempotencyKey = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const reviewPayload: OrderReviewPayload = {
      idempotencyKey,
      symbol,
      market: 'Perpetual Futures',
      side: setup.side,
      orderType: setup.orderType,
      quantity: setup.quantity,
      entryPrice: safePriceUsd,
      currentMarketPrice: currentPrice,
      leverage: setup.leverage,
      marginMode: marginType,
      requiredMargin: setup.marginRequired || 0,
      tradingFeeEstimate: tradingFeeUsd,
      fundingEstimate: fundingFeeUsd,
      spreadEstimate: spreadUsd,
      slippageEstimate: slippageUsd,
      maxPlannedLoss: maxLossUsd,
      takeProfit: setup.takeProfit ? (isINR ? setup.takeProfit / inrRateMultiplier : setup.takeProfit) : undefined,
      stopLoss: setup.stopLoss ? (isINR ? setup.stopLoss / inrRateMultiplier : setup.stopLoss) : undefined,
      estimatedLiqPrice: estimatedLiq,
      accountBalanceAfterTrade: Math.max(0, +(balance - (setup.marginRequired || 0)).toFixed(2)),
      remainingBuyingPower: Math.max(0, +(balance - (setup.marginRequired || 0)).toFixed(2)),
      dataSource: 'Unified Real-Time Exchange Feed',
      dataTimestamp: Date.now(),
      isDataStale: validation.isStale,
    };

    if (onRequestReviewOrder) {
      onRequestReviewOrder(reviewPayload);
    } else {
      onPlaceOrder({
        symbol,
        type: setup.orderType === 'ai-smart' ? 'limit' : setup.orderType,
        side: setup.side,
        price: safePriceUsd,
        amount: setup.quantity,
        leverage: setup.leverage,
        takeProfit: setup.takeProfit ? (isINR ? setup.takeProfit / inrRateMultiplier : setup.takeProfit) : undefined,
        stopLoss: setup.stopLoss ? (isINR ? setup.stopLoss / inrRateMultiplier : setup.stopLoss) : undefined,
      });
    }
  };

  const isSubmitDisabled = !validation.isValid || setup.quantity <= 0 || currentMode === 'RESEARCH';

  return (
    <div className="flex flex-col h-full bg-[#111417] text-[#fff8f1] select-none text-xs font-sans">
      {/* Header with Mode & Actions */}
      <div className="p-3 border-b border-[#272a2d] flex items-center justify-between bg-[#161a1e]">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-xs uppercase tracking-wider text-[#fff8f1] font-mono">
            ORDER ENTRY
          </span>
          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#ffd87f]/15 text-[#ffd87f] border border-[#ffd87f]/30">
            {currentMode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSmartEntry && (
            <button
              type="button"
              onClick={onOpenSmartEntry}
              className="p-1 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#60a5fa] transition-colors cursor-pointer"
              title="Open Smart Entry Radar"
            >
              <Zap className="w-3.5 h-3.5" />
            </button>
          )}
          {onOpenRiskCalculator && (
            <button
              type="button"
              onClick={onOpenRiskCalculator}
              className="p-1 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#ffd87f] transition-colors cursor-pointer"
              title="Open Risk Calculator"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Linked Signal Banner if Synced */}
        {setup.sourceSignal && (
          <div className="p-2 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-[#93c5fd] min-w-0">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#60a5fa]" />
              <span className="truncate font-bold">
                Synced: {setup.sourceSignal.side} ({setup.sourceSignal.strategy || 'AI Signal'})
              </span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-[#3b82f6]/30 text-[#bfdbfe]">
                {setup.sourceSignal.confidence}% Conviction
              </span>
            </div>
            <button
              type="button"
              onClick={resetToDefaults}
              className="text-[10px] text-[#99907f] hover:text-[#fff8f1] flex items-center gap-1 cursor-pointer shrink-0 ml-2"
              title="Unlink and reset to default levels"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        )}

        {/* Direction-Aware Side Selector: BUY / LONG vs SELL / SHORT */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#14171a] rounded-xl border border-[#272a2d]">
          <button
            type="button"
            id="order-side-buy"
            onClick={() => setSide('buy')}
            className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              setup.side === 'buy'
                ? 'bg-[#00ff94] text-[#002111] shadow-[0_0_12px_rgba(0,255,148,0.35)]'
                : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#1f2327]'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
            <span>BUY / LONG</span>
          </button>
          <button
            type="button"
            id="order-side-sell"
            onClick={() => setSide('sell')}
            className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              setup.side === 'sell'
                ? 'bg-[#ff3b4a] text-[#ffffff] shadow-[0_0_12px_rgba(255,59,74,0.35)]'
                : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#1f2327]'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 stroke-[3]" />
            <span>SELL / SHORT</span>
          </button>
        </div>

        {/* Order Execution Type Tabs */}
        <div>
          <label className="text-[10px] text-[#99907f] uppercase font-bold block mb-1">Execution Type</label>
          <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#14171a] rounded-lg border border-[#272a2d]">
            {(['limit', 'market', 'stop-limit'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setOrderType(t)}
                className={`py-1 rounded text-[10px] font-mono font-bold capitalize transition-all cursor-pointer ${
                  setup.orderType === t
                    ? 'bg-[#272a2d] text-[#fff8f1] shadow-xs'
                    : 'text-[#99907f] hover:text-[#fff8f1]'
                }`}
              >
                {t === 'stop-limit' ? 'Stop Limit' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Price Input */}
        <div>
          <div className="flex items-center justify-between mb-1 text-[11px] font-mono">
            <label className="text-[10px] text-[#99907f] uppercase font-bold" htmlFor="order-price-input">
              Entry Price ({currencyMode})
            </label>
            <span className="text-[#99907f] text-[10px]">
              Market: {currencySymbol}{currentPrice.toFixed(precision)}
            </span>
          </div>
          <div className="relative">
            <input
              id="order-price-input"
              type="number"
              step="any"
              disabled={setup.orderType === 'market'}
              value={setup.orderType === 'market' ? currentPrice : setup.entryPrice}
              onChange={(e) => setEntryPrice(Number(e.target.value) || 0)}
              className="w-full bg-[#191c1f] text-[#fff8f1] border border-[#272a2d] rounded-lg px-3 py-2 text-xs font-mono font-bold focus:border-[#3b82f6] outline-none disabled:opacity-50"
            />
            {setup.orderType === 'market' && (
              <span className="absolute right-3 top-2 text-[10px] text-[#ffd87f] font-mono font-bold">
                MARKET
              </span>
            )}
          </div>
        </div>

        {/* Amount Input & Percent Sliders */}
        <div>
          <div className="flex items-center justify-between mb-1 text-[11px] font-mono">
            <label className="text-[10px] text-[#99907f] uppercase font-bold" htmlFor="order-amount-input">
              Quantity ({symbol.split('/')[0]})
            </label>
            <span className="text-[#99907f] text-[10px]">
              Avail: {currencySymbol}{balance.toFixed(2)}
            </span>
          </div>
          <input
            id="order-amount-input"
            type="number"
            step="any"
            placeholder="0.00"
            value={setup.quantity > 0 ? setup.quantity : ''}
            onChange={(e) => handleAmountInputChange(e.target.value)}
            className="w-full bg-[#191c1f] text-[#fff8f1] border border-[#272a2d] rounded-lg px-3 py-2 text-xs font-mono font-bold focus:border-[#3b82f6] outline-none"
          />

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handlePercentClick(pct)}
                className={`py-1 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                  percentSlider === pct
                    ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#93c5fd]'
                    : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* TP / SL Group with Direction-Aware Inversion Protection */}
        <div className="p-2.5 rounded-xl bg-[#14171a] border border-[#272a2d] space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-[#99907f]">
              Take Profit & Stop Loss
            </span>
            <span className="text-[9px] font-mono text-[#00ff94] font-bold">
              {setup.side === 'buy' ? 'Long Setup (TP > Entry > SL)' : 'Short Setup (SL > Entry > TP)'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {/* Take Profit */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#00ff94] font-bold">Take Profit</span>
                <span className="text-[9px] text-[#99907f]">
                  {setup.side === 'buy' ? '+3.5%' : '-3.5%'}
                </span>
              </div>
              <input
                id="order-tp-input"
                type="number"
                step="any"
                value={setup.takeProfit || ''}
                onChange={(e) => setTakeProfit(Number(e.target.value) || 0)}
                placeholder={setup.side === 'buy' ? '> Entry' : '< Entry'}
                className="w-full bg-[#191c1f] text-[#00ff94] border border-[#272a2d] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:border-[#00ff94] outline-none"
              />
            </div>

            {/* Stop Loss */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[#ff3b4a] font-bold">Stop Loss</span>
                <span className="text-[9px] text-[#99907f]">
                  {setup.side === 'buy' ? '-1.5%' : '+1.5%'}
                </span>
              </div>
              <input
                id="order-sl-input"
                type="number"
                step="any"
                value={setup.stopLoss || ''}
                onChange={(e) => setStopLoss(Number(e.target.value) || 0)}
                placeholder={setup.side === 'buy' ? '< Entry' : '> Entry'}
                className="w-full bg-[#191c1f] text-[#ff3b4a] border border-[#272a2d] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:border-[#ff3b4a] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Validation Errors & Status Alerts */}
        {validation.directionalError && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-tight flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>{validation.directionalError}</span>
          </div>
        )}

        {validation.stopLossError && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-tight flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>{validation.stopLossError}</span>
          </div>
        )}

        {validation.takeProfitError && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] leading-tight flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>{validation.takeProfitError}</span>
          </div>
        )}

        {validation.riskError && (
          <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] leading-tight flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{validation.riskError}</span>
          </div>
        )}

        {validation.isStale && (
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Market quote is older than 2.0s. Verification pending...</span>
          </div>
        )}

        {/* Progressive Disclosure: Advanced Margin & Risk Settings Accordion (M-02) */}
        <div className="rounded-xl border border-[#272a2d] bg-[#14171a]/70 overflow-hidden">
          <button
            type="button"
            onClick={() => setIsAdvancedOptionsOpen((prev) => !prev)}
            aria-expanded={isAdvancedOptionsOpen}
            className="w-full px-2.5 py-2 flex items-center justify-between text-[11px] font-mono font-bold text-[#99907f] hover:text-[#fff8f1] hover:bg-[#1a1e22] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-[#ffd87f]" />
              <span>Advanced Settings</span>
              <span className="text-[10px] text-[#ffd87f] font-normal">
                ({setup.leverage}x • {marginType === 'cross' ? 'Cross' : 'Isolated'})
              </span>
            </div>
            {isAdvancedOptionsOpen ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#99907f]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-[#99907f]" />
            )}
          </button>

          {isAdvancedOptionsOpen && (
            <div className="p-2.5 pt-2 space-y-3 border-t border-[#272a2d]/60 bg-[#161a1e]/40">
              {/* Margin Mode Selector */}
              <div>
                <label className="text-[10px] text-[#99907f] uppercase font-bold block mb-1">Margin Mode</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['cross', 'isolated'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setMarginType(mode)}
                      className={`py-1 rounded text-xs font-mono font-bold border capitalize transition-colors cursor-pointer ${
                        marginType === mode
                          ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#93c5fd]'
                          : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                      }`}
                    >
                      {mode} Margin
                    </button>
                  ))}
                </div>
              </div>

              {/* Leverage Selector (Safety Capped at 3x) */}
              <div>
                <div className="flex items-center justify-between mb-1 text-[11px] font-mono">
                  <span className="text-[#99907f] uppercase font-bold text-[10px]">Leverage</span>
                  <span className="font-bold text-[#ffd87f]">{setup.leverage}x (Max 3x Safety Cap)</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((lev) => (
                    <button
                      key={lev}
                      type="button"
                      onClick={() => setLeverage(lev)}
                      className={`py-1 rounded text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        setup.leverage === lev
                          ? 'bg-[#ffd87f]/20 border-[#ffd87f] text-[#ffd87f]'
                          : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                      }`}
                    >
                      {lev}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Trailing Stop Loss Toggle */}
              <div className="flex items-center justify-between pt-1">
                <label className="text-[10px] text-[#99907f] uppercase font-bold flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableTrailingSL}
                    onChange={(e) => setEnableTrailingSL(e.target.checked)}
                    className="rounded bg-[#191c1f] border-[#272a2d] text-[#ffd87f] focus:ring-0"
                  />
                  <span>Trailing Stop Loss</span>
                </label>
                {enableTrailingSL && (
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="10"
                      value={trailingStopPercent}
                      onChange={(e) => setTrailingStopPercent(Number(e.target.value) || 1.5)}
                      className="w-12 bg-[#191c1f] border border-[#272a2d] rounded px-1 py-0.5 text-center text-[#ffd87f] font-bold"
                    />
                    <span className="text-[#99907f]">%</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Risk & Value Metrics */}
        <div className="p-2.5 rounded-xl bg-[#14171a] border border-[#272a2d] space-y-1.5 text-[10px] font-mono text-[#99907f]">
          <div className="flex justify-between">
            <span>Order Value:</span>
            <span className="text-[#fff8f1] font-bold">
              {currencySymbol}{setup.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Required Margin:</span>
            <span className="text-[#ffd87f] font-bold">
              {currencySymbol}{setup.marginRequired.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Est. Liq Price ({setup.side.toUpperCase()}):</span>
            <span className="text-[#ff3b4a] font-bold">
              {setup.side === 'buy' && estBuyLiqPrice > 0
                ? `${currencySymbol}${estBuyLiqPrice.toFixed(precision)}`
                : setup.side === 'sell' && estSellLiqPrice > 0
                ? `${currencySymbol}${estSellLiqPrice.toFixed(precision)}`
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Directional Validation Error Alert Banner (Requirement 2) */}
        {validation.directionalError && (
          <div className="p-2.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 font-mono text-[11px] flex items-start gap-2 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span className="font-semibold leading-tight">{validation.directionalError}</span>
          </div>
        )}

        {/* Submit Action Button */}
        <div className="pt-1">
          {currentMode === 'RESEARCH' ? (
            <div className="p-3 rounded-xl border border-blue-500/40 bg-blue-500/10 text-center text-blue-300 font-semibold text-xs">
              RESEARCH ONLY — NO REAL ORDERS EXECUTED
            </div>
          ) : (
            <button
              type="button"
              id={setup.side === 'buy' ? 'btn-buy-long' : 'btn-sell-short'}
              disabled={isSubmitDisabled}
              onClick={handleInitiateOrder}
              title={validation.directionalError || validation.messages[0] || undefined}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-mono font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                isSubmitDisabled
                  ? 'bg-[#1e2329] text-[#787b86] border border-[#272a2d] cursor-not-allowed opacity-50'
                  : setup.side === 'buy'
                  ? 'bg-[#00ff94] hover:bg-[#34e893] text-[#002111] shadow-[0_0_15px_rgba(0,255,148,0.35)]'
                  : 'bg-[#ff3b4a] hover:bg-[#ff5a66] text-white shadow-[0_0_15px_rgba(255,59,74,0.35)]'
              }`}
            >
              {setup.side === 'buy' ? (
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
              ) : (
                <ArrowDownRight className="w-4 h-4 stroke-[3]" />
              )}
              <span className="truncate">
                {isSubmitDisabled
                  ? validation.directionalError
                    ? 'Invalid Setup (Review Disabled)'
                    : validation.isStale
                    ? 'Awaiting Fresh Quote'
                    : validation.messages[0] || 'Enter Quantity'
                  : `Review ${setup.side === 'buy' ? 'BUY / LONG' : 'SELL / SHORT'} Order`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
