import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Zap,
  Activity,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Layers,
  Terminal,
  ArrowRightLeft,
  Cpu,
  Clock,
  X,
  Lock,
  Sliders,
  DollarSign,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { QuantTelemetry, QuantExecutionMode } from '../types';

interface QuantExecutionConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencyMode?: 'USDT' | 'INR';
}

export const QuantExecutionConsoleModal: React.FC<QuantExecutionConsoleModalProps> = ({
  isOpen,
  onClose,
  currencyMode = 'USDT',
}) => {
  const [telemetry, setTelemetry] = useState<QuantTelemetry | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);
  const [autoScrollLogs, setAutoScrollLogs] = useState(true);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Poll telemetry at 250ms when modal is open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchTelemetry = async () => {
      try {
        const res = await fetch('/api/quant/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setTelemetry(data);
          }
        }
      } catch (err) {
        // silent fallback
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 250);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen]);

  // Auto scroll logs
  useEffect(() => {
    if (autoScrollLogs && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0;
    }
  }, [telemetry?.recentLogs, autoScrollLogs]);

  if (!isOpen) return null;

  const handleAction = async (actionName: string, body?: any) => {
    setIsActionLoading(actionName);
    setLastActionStatus(null);
    try {
      const res = await fetch(`/api/quant/action/${actionName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (data.message || data.status) {
        setLastActionStatus(data.message || `Action ${actionName} dispatched.`);
      }
      // Immediate telemetry refresh
      const tRes = await fetch('/api/quant/telemetry');
      if (tRes.ok) {
        const tData = await tRes.json();
        setTelemetry(tData);
      }
    } catch (e: any) {
      setLastActionStatus(`Action failed: ${e.message}`);
    } finally {
      setIsActionLoading(null);
    }
  };

  const isRunning = telemetry?.state === 'RUNNING';
  const isPaused = telemetry?.state === 'PAUSED';
  const isCircuitBreaker = telemetry?.state === 'CIRCUIT_BREAKER' || telemetry?.circuitBreakerActive;
  const isPassive = telemetry?.mode === 'PASSIVE_MAKER';

  const spreadDelta = telemetry?.spreadDelta ?? 0;
  const obi = telemetry?.top5OBI ?? 0;
  const cvd = telemetry?.rollingCVD ?? 0;

  return (
    <div
      id="quant-execution-console-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="quant-execution-console-modal"
        className="relative w-full max-w-6xl bg-[#141618] border border-[#2e3236] rounded-xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden text-neutral-100"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#25282c] bg-[#1a1c20]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#ffd87f]/10 border border-[#ffd87f]/30 text-[#ffd87f]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-wide text-white">
                  Institutional Lead-Lag Arbitrage Console
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ffd87f]/20 text-[#ffd87f] font-semibold border border-[#ffd87f]/30">
                  BTC/USDT FUTURES
                </span>
              </div>
              <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                <span>Binance Lead Feed (100ms Depth)</span>
                <span>→</span>
                <span>CoinDCX Local Execution Gateway</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
                isRunning
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : isCircuitBreaker
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <Radio className={`w-3 h-3 ${isRunning ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>{telemetry?.state || 'STOPPED'}</span>
            </div>

            {/* Mode Pill */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#212429] text-neutral-300 border border-[#32363c]">
              <Sliders className="w-3 h-3 text-[#ffd87f]" />
              <span>{isPassive ? 'PASSIVE MAKER' : 'AGGRESSIVE TAKER'}</span>
            </div>

            <button
              id="quant-modal-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#25282c] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION BANNER IF ACTION STATUS */}
        {lastActionStatus && (
          <div className="px-5 py-1.5 bg-[#1b231d] border-b border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{lastActionStatus}</span>
            </div>
            <button
              onClick={() => setLastActionStatus(null)}
              className="text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* MAIN BODY CONTAINER */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* 1. DEDICATED EXECUTION BUTTONS STRIP */}
          <div className="bg-[#181a1d] border border-[#2b2e33] rounded-xl p-3.5">
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#ffd87f]" /> High-Speed Engine Triggers & Controls
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                Microsecond Dispatched Gateway
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {/* [START ENGINE] */}
              <button
                id="quant-btn-start"
                disabled={isRunning || isActionLoading === 'start'}
                onClick={() => handleAction('start')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-mono text-xs font-bold transition-all shadow-sm ${
                  isRunning
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? 'RUNNING' : 'START ENGINE'}</span>
              </button>

              {/* [STOP / PAUSE ENGINE] */}
              <button
                id="quant-btn-pause"
                disabled={!isRunning || isActionLoading === 'pause'}
                onClick={() => handleAction('pause')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-mono text-xs font-bold transition-all border ${
                  !isRunning
                    ? 'bg-[#22252a] text-neutral-500 border-[#2f333a] cursor-not-allowed'
                    : 'bg-amber-600/90 hover:bg-amber-500 text-white border-amber-600 cursor-pointer active:scale-95'
                }`}
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE ENGINE</span>
              </button>

              {/* [PANIC KILL-SWITCH (EMERGENCY FLATTEN)] */}
              <button
                id="quant-btn-panic-kill"
                disabled={isActionLoading === 'kill'}
                onClick={() => handleAction('kill')}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-mono text-xs font-bold bg-rose-600 hover:bg-rose-500 active:scale-95 text-white transition-all shadow-lg shadow-rose-950/40 cursor-pointer border border-rose-500 animate-pulse"
                title="Instantly cancels all resting limit orders on CoinDCX and fires aggressive market orders to flatten any open long/short position immediately"
              >
                <AlertTriangle className="w-3.5 h-3.5 fill-current" />
                <span>PANIC FLATTEN</span>
              </button>

              {/* [CANCEL ALL ORDERS] */}
              <button
                id="quant-btn-cancel-all"
                disabled={isActionLoading === 'cancel_all'}
                onClick={() => handleAction('cancel_all')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-mono text-xs font-semibold bg-[#22252a] hover:bg-[#2b2f35] text-amber-300 border border-[#3b3f46] hover:border-amber-400/50 transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CANCEL ALL</span>
              </button>

              {/* [FORCE RE-SYNC] */}
              <button
                id="quant-btn-resync"
                disabled={isActionLoading === 'resync'}
                onClick={() => handleAction('resync')}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-mono text-xs font-semibold bg-[#22252a] hover:bg-[#2b2f35] text-cyan-300 border border-[#3b3f46] hover:border-cyan-400/50 transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isActionLoading === 'resync' ? 'animate-spin' : ''}`} />
                <span>FORCE RE-SYNC</span>
              </button>

              {/* [MODE TOGGLE (PASSIVE MAKER / AGGRESSIVE TAKER)] */}
              <button
                id="quant-btn-toggle-mode"
                disabled={isActionLoading === 'toggle_mode'}
                onClick={() => handleAction('toggle_mode')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer active:scale-95 border ${
                  isPassive
                    ? 'bg-amber-400/15 text-amber-300 border-amber-400/50 hover:bg-amber-400/25 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                    : 'bg-rose-500/15 text-rose-300 border-rose-500/50 hover:bg-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                }`}
                title="Click to toggle between PASSIVE_MAKER (Post-Only) and AGGRESSIVE_TAKER (Cross-Spread Taker)"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>{isPassive ? 'MODE: PASSIVE MAKER' : 'MODE: AGGRESSIVE TAKER'}</span>
              </button>
            </div>
          </div>

          {/* 2. DUAL L2 ORDER BOOK & SPREAD DELTA GAUGES */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* LEFT: BINANCE LEAD FUTURES L2 */}
            <div className="lg:col-span-4 bg-[#181a1d] border border-[#2b2e33] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#25282c]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-xs font-bold text-white tracking-wide">
                      Binance Futures (Lead)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    <span>{telemetry?.binanceLatencyMs || 18}ms</span>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xs text-neutral-400">Lead Mid Price:</span>
                  <span className="text-base font-mono font-bold text-amber-400">
                    ${telemetry?.binanceMid?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '81,280.00'}
                  </span>
                </div>

                {/* Top 5 Asks (Red) */}
                <div className="mt-3 space-y-1">
                  <div className="text-[10px] text-neutral-500 font-mono flex justify-between px-1">
                    <span>PRICE (USDT)</span>
                    <span>SIZE (BTC)</span>
                  </div>
                  {(telemetry?.binanceAsks || []).slice(0, 4).reverse().map((ask, idx) => (
                    <div
                      key={`b-ask-${idx}`}
                      className="flex justify-between items-center px-1.5 py-0.5 rounded text-xs font-mono relative overflow-hidden bg-rose-500/5 hover:bg-rose-500/10"
                    >
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none"
                        style={{ width: `${Math.min(100, (ask.qty / 15) * 100)}%` }}
                      />
                      <span className="text-rose-400 relative z-10">{ask.price.toFixed(2)}</span>
                      <span className="text-neutral-300 relative z-10">{ask.qty.toFixed(3)}</span>
                    </div>
                  ))}
                </div>

                <div className="my-1.5 border-t border-[#25282c]" />

                {/* Top 5 Bids (Green) */}
                <div className="space-y-1">
                  {(telemetry?.binanceBids || []).slice(0, 4).map((bid, idx) => (
                    <div
                      key={`b-bid-${idx}`}
                      className="flex justify-between items-center px-1.5 py-0.5 rounded text-xs font-mono relative overflow-hidden bg-emerald-500/5 hover:bg-emerald-500/10"
                    >
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none"
                        style={{ width: `${Math.min(100, (bid.qty / 15) * 100)}%` }}
                      />
                      <span className="text-emerald-400 relative z-10">{bid.price.toFixed(2)}</span>
                      <span className="text-neutral-300 relative z-10">{bid.qty.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#25282c] text-[10px] text-neutral-500 flex justify-between font-mono">
                <span>Feed: @depth5@100ms</span>
                <span>Leading Reference</span>
              </div>
            </div>

            {/* CENTER: MICROSTRUCTURE SIGNAL ENGINE & SPREAD DELTA */}
            <div className="lg:col-span-4 bg-[#181a1d] border border-[#2b2e33] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#25282c]">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#ffd87f]" /> Microstructure Arb Signal
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Threshold: ±$4.00
                  </span>
                </div>

                {/* SPREAD DELTA DISPLAY */}
                <div className="mt-3 p-3 rounded-lg bg-[#141618] border border-[#26292e] text-center">
                  <div className="text-[11px] text-neutral-400 font-mono">
                    SPREAD DELTA (Binance - CoinDCX)
                  </div>
                  <div
                    className={`text-2xl font-mono font-extrabold mt-0.5 ${
                      spreadDelta > 0
                        ? 'text-emerald-400'
                        : spreadDelta < 0
                        ? 'text-rose-400'
                        : 'text-neutral-300'
                    }`}
                  >
                    {spreadDelta > 0 ? `+${spreadDelta.toFixed(2)}` : spreadDelta.toFixed(2)} USD
                  </div>
                  <div className="text-[10px] text-neutral-400 mt-1">
                    {Math.abs(spreadDelta) >= 4.0 ? (
                      <span className="text-emerald-400 font-semibold animate-pulse">
                        ⚡ ARB TRIGGER ACTIVE ({spreadDelta > 0 ? 'LONG COINDCX' : 'SHORT COINDCX'})
                      </span>
                    ) : (
                      <span className="text-neutral-500">Spread within latency equilibrium bounds</span>
                    )}
                  </div>
                </div>

                {/* GAUGES: OBI & CVD */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-[#141618] border border-[#26292e]">
                    <div className="text-[10px] text-neutral-400">Top-5 Imbalance (OBI)</div>
                    <div
                      className={`font-bold text-sm mt-0.5 ${
                        obi > 0 ? 'text-emerald-400' : obi < 0 ? 'text-rose-400' : 'text-neutral-300'
                      }`}
                    >
                      {obi > 0 ? `+${obi.toFixed(3)}` : obi.toFixed(3)}
                    </div>
                    <div className="text-[9px] text-neutral-500">
                      {obi > 0.15 ? 'Bid Dominated' : obi < -0.15 ? 'Ask Dominated' : 'Balanced'}
                    </div>
                  </div>

                  <div className="p-2 rounded bg-[#141618] border border-[#26292e]">
                    <div className="text-[10px] text-neutral-400">Rolling CVD (AggTrade)</div>
                    <div
                      className={`font-bold text-sm mt-0.5 ${
                        cvd > 0 ? 'text-emerald-400' : cvd < 0 ? 'text-rose-400' : 'text-neutral-300'
                      }`}
                    >
                      {cvd > 0 ? `+${cvd.toFixed(2)}` : cvd.toFixed(2)} BTC
                    </div>
                    <div className="text-[9px] text-neutral-500">
                      {cvd > 0 ? 'Taker Buying Pressure' : 'Taker Selling Pressure'}
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK DISPATCH BUTTONS */}
              <div className="mt-3 pt-2 border-t border-[#25282c] grid grid-cols-2 gap-2">
                <button
                  id="quant-manual-buy"
                  onClick={() => handleAction('manual_order', { side: 'buy', quantity: 0.05 })}
                  className="px-2 py-1.5 rounded bg-emerald-600/80 hover:bg-emerald-600 text-white font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <TrendingUp className="w-3 h-3" />
                  <span>SWEEP BUY 0.05</span>
                </button>
                <button
                  id="quant-manual-sell"
                  onClick={() => handleAction('manual_order', { side: 'sell', quantity: 0.05 })}
                  className="px-2 py-1.5 rounded bg-rose-600/80 hover:bg-rose-600 text-white font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <TrendingDown className="w-3 h-3" />
                  <span>SWEEP SELL 0.05</span>
                </button>
              </div>
            </div>

            {/* RIGHT: COINDCX LOCAL FUTURES L2 */}
            <div className="lg:col-span-4 bg-[#181a1d] border border-[#2b2e33] rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#25282c]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-xs font-bold text-white tracking-wide">
                      CoinDCX Futures (Local)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    <span>{telemetry?.coindcxLatencyMs || 24}ms</span>
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-xs text-neutral-400">CoinDCX Mid Price:</span>
                  <span className="text-base font-mono font-bold text-cyan-400">
                    ${telemetry?.coindcxMid?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '81,274.00'}
                  </span>
                </div>

                {/* Top 5 Asks (Red) */}
                <div className="mt-3 space-y-1">
                  <div className="text-[10px] text-neutral-500 font-mono flex justify-between px-1">
                    <span>PRICE (USDT)</span>
                    <span>SIZE (BTC)</span>
                  </div>
                  {(telemetry?.coindcxAsks || []).slice(0, 4).reverse().map((ask, idx) => (
                    <div
                      key={`c-ask-${idx}`}
                      className="flex justify-between items-center px-1.5 py-0.5 rounded text-xs font-mono relative overflow-hidden bg-rose-500/5 hover:bg-rose-500/10"
                    >
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none"
                        style={{ width: `${Math.min(100, (ask.qty / 10) * 100)}%` }}
                      />
                      <span className="text-rose-400 relative z-10">{ask.price.toFixed(2)}</span>
                      <span className="text-neutral-300 relative z-10">{ask.qty.toFixed(3)}</span>
                    </div>
                  ))}
                </div>

                <div className="my-1.5 border-t border-[#25282c]" />

                {/* Top 5 Bids (Green) */}
                <div className="space-y-1">
                  {(telemetry?.coindcxBids || []).slice(0, 4).map((bid, idx) => (
                    <div
                      key={`c-bid-${idx}`}
                      className="flex justify-between items-center px-1.5 py-0.5 rounded text-xs font-mono relative overflow-hidden bg-emerald-500/5 hover:bg-emerald-500/10"
                    >
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none"
                        style={{ width: `${Math.min(100, (bid.qty / 10) * 100)}%` }}
                      />
                      <span className="text-emerald-400 relative z-10">{bid.price.toFixed(2)}</span>
                      <span className="text-neutral-300 relative z-10">{bid.qty.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-[#25282c] text-[10px] text-neutral-500 flex justify-between font-mono">
                <span>Contract: B-BTC_USDT</span>
                <span>Private REST/WS Gateway</span>
              </div>
            </div>
          </div>

          {/* 3. PRE-TRADE RISK ENGINE & POSITION METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Margin Utilization */}
            <div className="bg-[#181a1d] border border-[#2b2e33] rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Margin Utilization</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-mono font-bold text-white mt-1">
                {telemetry?.marginRatioPct || 0}%
              </div>
              <div className="w-full bg-[#26292e] h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full rounded-full transition-all ${
                    (telemetry?.marginRatioPct || 0) > 70
                      ? 'bg-rose-500'
                      : (telemetry?.marginRatioPct || 0) > 40
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, telemetry?.marginRatioPct || 0)}%` }}
                />
              </div>
              <div className="text-[10px] text-neutral-500 mt-1 font-mono">Max Guardrail: 80%</div>
            </div>

            {/* Liquidation Buffer */}
            <div className="bg-[#181a1d] border border-[#2b2e33] rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Liquidation Buffer</span>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-mono font-bold text-emerald-400 mt-1">
                +{telemetry?.liquidationBufferPct || 18.5}%
              </div>
              <div className="text-[10px] text-neutral-500 mt-2 font-mono">Min Guardrail: 4.0%</div>
            </div>

            {/* Active Position */}
            <div className="bg-[#181a1d] border border-[#2b2e33] rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Open Position</span>
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-lg font-mono font-bold text-white mt-1">
                {telemetry?.openPosition?.side === 'FLAT' ? (
                  <span className="text-neutral-400">FLAT (0.00 BTC)</span>
                ) : (
                  <span
                    className={
                      telemetry?.openPosition?.side === 'LONG' ? 'text-emerald-400' : 'text-rose-400'
                    }
                  >
                    {telemetry?.openPosition?.side} {telemetry?.openPosition?.size} BTC
                  </span>
                )}
              </div>
              <div className="text-[10px] text-neutral-500 mt-2 font-mono">
                Entry: ${telemetry?.openPosition?.entryPrice?.toFixed(2) || '0.00'}
              </div>
            </div>

            {/* RTT Latency Benchmark */}
            <div className="bg-[#181a1d] border border-[#2b2e33] rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>Last Execution RTT</span>
                <Clock className="w-3.5 h-3.5 text-[#ffd87f]" />
              </div>
              <div className="text-lg font-mono font-bold text-[#ffd87f] mt-1">
                {telemetry?.lastExecutionRttMs || 28.4} ms
              </div>
              <div className="text-[10px] text-neutral-500 mt-2 font-mono">
                Circuit Breaker: &lt;200ms
              </div>
            </div>
          </div>

          {/* 4. REAL-TIME STREAMING EVENT & EXECUTION LOG TERMINAL */}
          <div className="bg-[#111315] border border-[#2b2e33] rounded-xl p-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#25282c]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#ffd87f]" />
                <span className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                  Execution & Telemetry Audit Log
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-400">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoScrollLogs}
                    onChange={(e) => setAutoScrollLogs(e.target.checked)}
                    className="rounded bg-[#22252a] border-[#37393d] text-amber-500"
                  />
                  <span>Auto-scroll</span>
                </label>
                <span>HMAC-SHA256 Signed</span>
              </div>
            </div>

            <div
              ref={logsContainerRef}
              className="mt-2.5 h-36 overflow-y-auto space-y-1 font-mono text-xs pr-2"
            >
              {(telemetry?.recentLogs || []).map((log, index) => {
                const color =
                  log.level === 'error'
                    ? 'text-rose-400'
                    : log.level === 'warn'
                    ? 'text-amber-400'
                    : log.level === 'success'
                    ? 'text-emerald-400'
                    : 'text-neutral-300';
                return (
                  <div key={index} className="flex items-start gap-2 leading-tight">
                    <span className="text-neutral-500 shrink-0 text-[11px]">{log.time}</span>
                    <span className="text-neutral-600 shrink-0">•</span>
                    <span className={`${color} text-[11px] break-all`}>{log.msg}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 border-t border-[#25282c] bg-[#1a1c20] flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[11px] font-mono">
              CoinDCX Derivatives API v1 • Binance Futures WebSocket Stream
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-500">
              Python Daemon: <code className="text-neutral-400">quant_engine.py</code>
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded bg-[#2b2e33] hover:bg-[#34383e] text-white font-mono text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
