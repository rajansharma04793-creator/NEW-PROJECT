import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { OrderReviewPayload, ProductTradingMode } from '../types';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  X,
  RefreshCw,
  Lock,
  Clock,
  ShieldAlert,
  Percent,
  TrendingUp,
  TrendingDown,
  Info,
  Sliders,
} from 'lucide-react';
import { validateOrderWithZod } from '../utils/orderValidationSchema';

export interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderReviewPayload | null;
  mode?: ProductTradingMode;
  currentMode?: ProductTradingMode;
  onConfirmOrder: (order: OrderReviewPayload) => Promise<{ success: boolean; error?: string; message?: string }>;
}

export const OrderReviewModal: React.FC<OrderReviewModalProps> = ({
  isOpen,
  onClose,
  order,
  mode,
  currentMode,
  onConfirmOrder,
}) => {
  const activeMode: ProductTradingMode = mode || currentMode || 'PAPER';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [userAcknowledgedRisk, setUserAcknowledgedRisk] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  // Focus trap refs
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Quote freshness ticker: updates elapsed time every 250ms
  useEffect(() => {
    if (!isOpen) return;
    setNowTimestamp(Date.now());
    const interval = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 250);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Focus trap and keyboard handlers
  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element for focus restoration
    if (document.activeElement instanceof HTMLElement) {
      previousFocusRef.current = document.activeElement;
    }

    // Focus primary button or container initially
    const timer = setTimeout(() => {
      if (primaryButtonRef.current) {
        primaryButtonRef.current.focus();
      } else if (modalContainerRef.current) {
        modalContainerRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!isSubmitting) {
          onClose();
        }
        return;
      }

      // Focus trap navigation: Tab and Shift+Tab
      if (e.key === 'Tab' && modalContainerRef.current) {
        const focusableElements = modalContainerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !modalContainerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement || !modalContainerRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, isSubmitting, onClose]);

  // Reset state upon dialog open
  useEffect(() => {
    if (isOpen) {
      setSubmissionError(null);
      setIsSubmitting(false);
      setUserAcknowledgedRisk(false);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const isBuy = order.side === 'buy';
  const isLiveBlocked = activeMode === 'LIVE';
  const isResearchMode = activeMode === 'RESEARCH';

  // Dynamic Quote Freshness Evaluation (Principle #3: >2000ms threshold)
  const quoteTimestamp = order.dataTimestamp || nowTimestamp;
  const quoteAgeMs = Math.max(0, nowTimestamp - quoteTimestamp);
  const isQuoteStale = quoteAgeMs > 2000 || Boolean(order.isDataStale);

  // Equity calculations
  const totalEquity = Math.max(100, (order.accountBalanceAfterTrade || 0) + (order.requiredMargin || 0));
  const maxRiskAllowedUsd = +(totalEquity * 0.01).toFixed(2); // 1% account equity rule

  // Stop Loss and Take Profit
  const effectiveStopLoss = order.stopLoss ?? (isBuy ? +(order.entryPrice * 0.985).toFixed(2) : +(order.entryPrice * 1.015).toFixed(2));
  const effectiveTakeProfit = order.takeProfit ?? (isBuy ? +(order.entryPrice * 1.035).toFixed(2) : +(order.entryPrice * 0.965).toFixed(2));

  // Risk Calculations
  const plannedLossUsd = +(Math.abs(order.entryPrice - effectiveStopLoss) * order.quantity).toFixed(2);
  const plannedLossPercentEquity = +((plannedLossUsd / totalEquity) * 100).toFixed(2);
  const riskExceeds1Percent = plannedLossUsd > maxRiskAllowedUsd + 0.01;

  // Directional Validations
  const directionalLongError = isBuy && (effectiveStopLoss >= order.entryPrice || effectiveTakeProfit <= order.entryPrice);
  const directionalShortError = !isBuy && (effectiveStopLoss <= order.entryPrice || effectiveTakeProfit >= order.entryPrice);
  const hasDirectionalError = directionalLongError || directionalShortError;

  // Leverage Cap Validation (Safe cap: 3x)
  const isLeverageExceeded = order.leverage > 3;

  // Liquidation Distance
  const liquidationDistanceUsd = order.estimatedLiqPrice > 0 ? Math.abs(order.entryPrice - order.estimatedLiqPrice) : 0;
  const liquidationDistancePercent = order.entryPrice > 0 && order.estimatedLiqPrice > 0
    ? +((liquidationDistanceUsd / order.entryPrice) * 100).toFixed(2)
    : 0;

  // Margin Utilization
  const marginUtilizationPercent = +((order.requiredMargin / totalEquity) * 100).toFixed(1);

  // Zod Validation invocation
  const zodValidation = validateOrderWithZod({
    symbol: order.symbol,
    side: order.side,
    orderType: order.orderType,
    quantity: order.quantity,
    entryPrice: order.entryPrice,
    currentMarketPrice: order.currentMarketPrice,
    leverage: order.leverage,
    stopLoss: effectiveStopLoss,
    takeProfit: effectiveTakeProfit,
    accountEquity: totalEquity,
    quoteTimestamp: isQuoteStale ? Date.now() - 3000 : Date.now(),
    mode: isLiveBlocked ? 'LIVE' : isResearchMode ? 'RESEARCH' : 'PAPER',
    idempotencyKey: order.idempotencyKey,
  });

  // Overall invalidation determination
  const isOrderBlocked =
    order.quantity <= 0 ||
    order.entryPrice <= 0 ||
    order.requiredMargin <= 0 ||
    order.requiredMargin > totalEquity ||
    isLiveBlocked ||
    isResearchMode ||
    isQuoteStale ||
    riskExceeds1Percent ||
    hasDirectionalError ||
    isLeverageExceeded;

  const handleConfirm = async () => {
    if (isOrderBlocked || isSubmitting) return;

    if (!zodValidation.isValid) {
      setSubmissionError(zodValidation.errors[0] || 'Order parameters failed risk validation schema.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const res = await onConfirmOrder({
        ...order,
        stopLoss: effectiveStopLoss,
        takeProfit: effectiveTakeProfit,
        userAcceptedRisk: userAcknowledgedRisk,
      });

      if (!res.success) {
        setSubmissionError(res.error || 'Failed to submit order');
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        onClose();
      }
    } catch (err: any) {
      setSubmissionError(err?.message || 'Network exception during order execution');
      setIsSubmitting(false);
    }
  };

  const actionLabel = `Confirm ${order.side.toUpperCase()} ${order.quantity} ${order.symbol.split('/')[0]} (${order.leverage}x)`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-review-title"
      aria-describedby="order-review-summary"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        ref={modalContainerRef}
        tabIndex={-1}
        className="relative w-full max-w-xl rounded-xl border border-[#272a2d] bg-[#111417] text-[#fff8f1] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] font-mono outline-none"
      >
        {/* Header Strip */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[#272a2d] bg-[#191c1f]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                isBuy
                  ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                  : 'bg-[#ff3b4a]/20 text-[#ff3b4a] border border-[#ff3b4a]/40'
              }`}
            >
              {order.side.toUpperCase()}
            </span>
            <h2 id="order-review-title" className="text-sm font-bold text-white truncate">
              Order Review &amp; Safety Verification
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[#99907f] hover:text-white transition-colors p-1 rounded cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00ff94] focus-visible:outline-none disabled:opacity-40"
            aria-label="Close Order Review Dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Sub-Header: Mode & Quote Freshness Ticker */}
        <div className="px-4 sm:px-5 py-2 text-xs border-b border-[#272a2d] flex flex-wrap items-center justify-between gap-2 bg-[#14171a]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-[#99907f]">Mode:</span>
            {isResearchMode && (
              <span className="text-[#60a5fa] text-[11px] font-bold">
                RESEARCH ONLY — ORDERS BLOCKED
              </span>
            )}
            {activeMode === 'PAPER' && (
              <span className="text-[#00ff94] text-[11px] font-bold">
                PAPER TRADING — SIMULATED EXECUTION
              </span>
            )}
            {isLiveBlocked && (
              <span className="text-[#ff3b4a] text-[11px] font-bold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                LIVE TRADING DISARMED
              </span>
            )}
          </div>

          {/* Real-time Data Freshness Clock */}
          <div
            className={`flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded border ${
              isQuoteStale
                ? 'bg-[#ff3b4a]/15 text-[#ff3b4a] border-[#ff3b4a]/40 animate-pulse'
                : 'bg-[#00ff94]/10 text-[#00ff94] border-[#00ff94]/30'
            }`}
            title={`Market quote age: ${quoteAgeMs}ms. Max acceptable latency is 2000ms.`}
            aria-live="polite"
          >
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span className="tabular-nums">
              {isQuoteStale ? `Quote Stale (${quoteAgeMs}ms > 2000ms)` : `Fresh: ${quoteAgeMs}ms`}
            </span>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Summary Asset Card */}
          <div
            id="order-review-summary"
            className="rounded-lg border border-[#272a2d] bg-[#191c1f] p-3 sm:p-3.5 flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">{order.symbol}</span>
                <span className="text-[10px] text-[#99907f] uppercase px-1.5 py-0.5 rounded bg-[#272a2d]">
                  {order.market}
                </span>
                <span className="text-[10px] text-[#ffd87f] font-bold uppercase">
                  {order.orderType}
                </span>
              </div>
              <div className="text-[11px] text-[#99907f] mt-1 tabular-nums">
                Order Value: ${(order.quantity * order.entryPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-[#99907f] uppercase">Entry Price</div>
              <div className="text-sm font-bold text-white tabular-nums">
                ${order.entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-[#99907f] tabular-nums">
                CMP: ${order.currentMarketPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Core Risk Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg border border-[#272a2d] bg-[#16191c]">
              <div className="text-[10px] text-[#99907f] uppercase">Order Quantity</div>
              <div className="text-sm font-semibold text-white mt-0.5 tabular-nums">
                {order.quantity} {order.symbol.split('/')[0]}
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#272a2d] bg-[#16191c]">
              <div className="text-[10px] text-[#99907f] uppercase flex items-center justify-between">
                <span>Leverage</span>
                <span className={order.leverage <= 3 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'}>
                  {order.leverage <= 3 ? 'Safe (≤3x)' : 'Banned (>3x)'}
                </span>
              </div>
              <div className="text-sm font-semibold text-white mt-0.5 flex items-center justify-between tabular-nums">
                <span className={order.leverage <= 3 ? 'text-white' : 'text-[#ff3b4a]'}>
                  {order.leverage}x
                </span>
                <span className="text-[10px] text-[#99907f] uppercase">
                  {order.marginMode}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#272a2d] bg-[#16191c]">
              <div className="text-[10px] text-[#99907f] uppercase flex items-center justify-between">
                <span>Required Margin</span>
                <span className="text-[#99907f] tabular-nums">{marginUtilizationPercent}% equity</span>
              </div>
              <div className="text-sm font-bold text-[#ffd87f] mt-0.5 tabular-nums">
                ${order.requiredMargin.toFixed(2)} USD
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#272a2d] bg-[#16191c]">
              <div className="text-[10px] text-[#99907f] uppercase flex items-center justify-between">
                <span>Est. Liquidation</span>
                <span className="text-[#99907f] tabular-nums">+{liquidationDistancePercent}% buffer</span>
              </div>
              <div className="text-sm font-bold text-[#ff3b4a] mt-0.5 tabular-nums">
                ${order.estimatedLiqPrice > 0 ? order.estimatedLiqPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#272a2d] bg-[#16191c]">
              <div className="text-[10px] text-[#ff3b4a] uppercase flex items-center justify-between">
                <span>Stop Loss (Mandatory)</span>
                {isBuy ? (
                  <span className={effectiveStopLoss < order.entryPrice ? 'text-[#00ff94]' : 'text-[#ff3b4a]'}>
                    {effectiveStopLoss < order.entryPrice ? 'Valid (< Entry)' : 'Invalid (≥ Entry)'}
                  </span>
                ) : (
                  <span className={effectiveStopLoss > order.entryPrice ? 'text-[#00ff94]' : 'text-[#ff3b4a]'}>
                    {effectiveStopLoss > order.entryPrice ? 'Valid (> Entry)' : 'Invalid (≤ Entry)'}
                  </span>
                )}
              </div>
              <div className="text-sm text-white mt-0.5 tabular-nums font-bold">
                ${effectiveStopLoss.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-2.5 rounded-lg border border-[#272a2d] bg-[#16191c]">
              <div className="text-[10px] text-[#00ff94] uppercase flex items-center justify-between">
                <span>Take Profit Target</span>
                {isBuy ? (
                  <span className={effectiveTakeProfit > order.entryPrice ? 'text-[#00ff94]' : 'text-[#ff3b4a]'}>
                    {effectiveTakeProfit > order.entryPrice ? 'Valid (> Entry)' : 'Invalid (≤ Entry)'}
                  </span>
                ) : (
                  <span className={effectiveTakeProfit < order.entryPrice ? 'text-[#00ff94]' : 'text-[#ff3b4a]'}>
                    {effectiveTakeProfit < order.entryPrice ? 'Valid (< Entry)' : 'Invalid (≥ Entry)'}
                  </span>
                )}
              </div>
              <div className="text-sm text-[#00ff94] mt-0.5 tabular-nums font-bold">
                ${effectiveTakeProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Real-Time Risk & Fee Breakdown Table */}
          <div className="rounded-lg border border-[#272a2d] p-3 space-y-1.5 text-[11px] bg-[#16191c]">
            <div className="flex justify-between text-[#99907f]">
              <span>Estimated Trading Fee (Maker/Taker):</span>
              <span className="text-white tabular-nums">${order.tradingFeeEstimate.toFixed(4)} USD</span>
            </div>
            <div className="flex justify-between text-[#99907f]">
              <span>Simulated Spread Impact:</span>
              <span className="text-white tabular-nums">${order.spreadEstimate.toFixed(4)} USD</span>
            </div>
            <div className="flex justify-between text-[#99907f]">
              <span>Simulated Slippage Buffer (0.02%):</span>
              <span className="text-white tabular-nums">${order.slippageEstimate.toFixed(4)} USD</span>
            </div>
            <div className="flex justify-between text-[#99907f]">
              <span>Estimated 8-Hour Funding Rate:</span>
              <span className="text-white tabular-nums">${order.fundingEstimate.toFixed(4)} USD</span>
            </div>

            <div className="pt-2 border-t border-[#272a2d] flex justify-between font-bold">
              <span className={riskExceeds1Percent ? 'text-[#ff3b4a]' : 'text-[#ffaa40]'}>
                Planned Loss at Stop Loss:
              </span>
              <span className={`tabular-nums ${riskExceeds1Percent ? 'text-[#ff3b4a]' : 'text-[#ffaa40]'}`}>
                ${plannedLossUsd.toFixed(2)} USD ({plannedLossPercentEquity}% equity)
              </span>
            </div>

            <div className="flex justify-between text-[#99907f]">
              <span>1% Maximum Risk Cap (Institutional):</span>
              <span className="text-white tabular-nums">${maxRiskAllowedUsd.toFixed(2)} USD</span>
            </div>

            <div className="flex justify-between text-[#99907f]">
              <span>Remaining Buying Power:</span>
              <span className="text-white tabular-nums">${order.remainingBuyingPower.toFixed(2)} USD</span>
            </div>
          </div>

          {/* Validation Warnings and Policy Breaches */}
          {hasDirectionalError && (
            <div className="p-3 rounded-lg bg-[#ff3b4a]/15 border border-[#ff3b4a]/40 text-[#ff8089] text-[11px] leading-relaxed flex items-start gap-2" role="alert">
              <AlertTriangle className="w-4 h-4 text-[#ff3b4a] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="block font-bold">Directional Price Hierarchy Violation:</strong>
                <span>
                  {isBuy
                    ? `For BUY/LONG: Stop Loss ($${effectiveStopLoss}) must be strictly below Entry Price ($${order.entryPrice}), and Take Profit ($${effectiveTakeProfit}) must be strictly above Entry Price.`
                    : `For SELL/SHORT: Take Profit ($${effectiveTakeProfit}) must be strictly below Entry Price ($${order.entryPrice}), and Stop Loss ($${effectiveStopLoss}) must be strictly above Entry Price.`}
                </span>
              </div>
            </div>
          )}

          {riskExceeds1Percent && (
            <div className="p-3 rounded-lg bg-[#ff3b4a]/15 border border-[#ff3b4a]/40 text-[#ff8089] text-[11px] leading-relaxed flex items-start gap-2" role="alert">
              <ShieldAlert className="w-4 h-4 text-[#ff3b4a] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="block font-bold">1.0% Account Equity Risk Limit Exceeded:</strong>
                <span>
                  Planned loss of ${plannedLossUsd} ({plannedLossPercentEquity}%) exceeds the 1.0% account equity cap of ${maxRiskAllowedUsd}. Reduce position quantity or adjust the stop loss.
                </span>
              </div>
            </div>
          )}

          {isLeverageExceeded && (
            <div className="p-3 rounded-lg bg-[#ff3b4a]/15 border border-[#ff3b4a]/40 text-[#ff8089] text-[11px] leading-relaxed flex items-start gap-2" role="alert">
              <ShieldAlert className="w-4 h-4 text-[#ff3b4a] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="block font-bold">Leverage Policy Breach:</strong>
                <span>
                  Requested leverage ({order.leverage}x) exceeds the maximum allowed institutional retail cap of 3x.
                </span>
              </div>
            </div>
          )}

          {isQuoteStale && (
            <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-[11px] leading-relaxed flex items-start gap-2" role="alert">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="block font-bold">Execution Locked: Stale Market Data (&gt;2000ms):</strong>
                <span>
                  The quote timestamp is {quoteAgeMs}ms old. Live executions are held until fresh order book telemetry arrives to prevent adverse fill slippage.
                </span>
              </div>
            </div>
          )}

          {isLiveBlocked && (
            <div className="p-3 rounded-lg border border-[#ff3b4a]/50 bg-[#ff3b4a]/10 text-[#ff8089] flex items-start gap-2.5" role="alert">
              <Lock className="w-4 h-4 text-[#ff3b4a] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-[11px] space-y-1">
                <span className="font-bold text-white block">Real-Money Live Trading Execution Blocked</span>
                <span className="text-[#d1d5db] block leading-relaxed">
                  Real exchange order routing is completely disarmed under institutional safety protocol. Switch to RESEARCH or PAPER TRADING modes.
                </span>
              </div>
            </div>
          )}

          {/* Metadata & Idempotency Key */}
          <div className="text-[10px] text-[#787b86] space-y-0.5 pt-1 border-t border-[#272a2d]">
            <div>Data Feed: {order.dataSource}</div>
            <div className="tabular-nums">Quote Timestamp: {new Date(quoteTimestamp).toISOString()}</div>
            <div className="truncate">Idempotency Key: {order.idempotencyKey}</div>
          </div>

          {submissionError && (
            <div className="p-3 rounded-lg bg-[#ff3b4a]/20 border border-[#ff3b4a]/40 text-[#ff8089] text-xs font-medium" role="alert">
              {submissionError}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#272a2d] bg-[#191c1f] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-[#272a2d] text-xs text-[#99907f] hover:text-white hover:bg-[#272a2d] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00ff94] focus-visible:outline-none disabled:opacity-50"
          >
            Cancel
          </button>

          {isResearchMode ? (
            <div className="px-4 py-2 rounded-lg bg-[#272a2d] text-[#99907f] text-xs font-semibold border border-[#37393d]">
              Execution Disabled in Research Mode
            </div>
          ) : isLiveBlocked ? (
            <div className="px-4 py-2 rounded-lg bg-[#ff3b4a]/15 text-[#ff3b4a] text-xs font-semibold border border-[#ff3b4a]/40 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Live Trading Blocked</span>
            </div>
          ) : (
            <button
              ref={primaryButtonRef}
              type="button"
              id="confirm-order-review-btn"
              onClick={handleConfirm}
              disabled={isOrderBlocked || isSubmitting}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#00ff94] focus-visible:outline-none ${
                isOrderBlocked || isSubmitting
                  ? 'bg-[#272a2d] text-[#787b86] border border-[#37393d] cursor-not-allowed opacity-50'
                  : isBuy
                  ? 'bg-[#00ff94] hover:bg-[#40e397] text-[#002111] shadow-[0_0_12px_rgba(0,255,148,0.35)] active:scale-[0.98]'
                  : 'bg-[#ff3b4a] hover:bg-[#ff5a66] text-white shadow-[0_0_12px_rgba(255,59,74,0.35)] active:scale-[0.98]'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Validating &amp; Routing Order...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span>{actionLabel}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
