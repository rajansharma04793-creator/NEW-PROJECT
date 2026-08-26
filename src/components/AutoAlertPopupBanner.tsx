import React, { useEffect, useState } from 'react';
import { AISignal, AssetPair, TickerInfo } from '../types';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  X,
  ArrowRight,
  Zap,
  Volume2,
  VolumeX,
  Clock,
  ShieldAlert,
  Target,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';

interface AutoAlertPopupBannerProps {
  signal: AISignal | null;
  ticker?: TickerInfo;
  onDismiss: () => void;
  onSelectAndTrade: (signal: AISignal) => void;
  onOpenAutoAlertSettings?: () => void;
}

export const AutoAlertPopupBanner: React.FC<AutoAlertPopupBannerProps> = ({
  signal,
  ticker,
  onDismiss,
  onSelectAndTrade,
  onOpenAutoAlertSettings,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!signal) return;
    setProgress(100);

    const DURATION = 12000; // 12 seconds auto dismiss
    const INTERVAL = 100;
    const step = (INTERVAL / DURATION) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            onDismiss();
            return 0;
          }
          return prev - step;
        });
      }
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [signal, isPaused, onDismiss]);

  if (!signal) return null;

  const isBuy = signal.side === 'LONG';
  const pricePrecision = ticker?.precision ?? (signal.entryPrice < 1 ? 4 : 2);

  return (
    <div
      id="auto-alert-popup-root"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="fixed top-14 right-3 md:right-6 z-50 w-[calc(100vw-24px)] max-w-md bg-[#14171a]/95 backdrop-blur-md border border-[#00ff94]/40 shadow-[0_12px_40px_rgba(0,0,0,0.7)] rounded-2xl overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300 font-hanken"
    >
      {/* Top Banner Accent with Progress Bar */}
      <div className="relative h-1 w-full bg-[#272a2d] overflow-hidden">
        <div
          className={`h-full transition-all ease-linear ${
            isBuy ? 'bg-[#00ff94]' : 'bg-[#ff3b4a]'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-3.5 sm:p-4 space-y-3">
        {/* Header Strip: Live Signal Radar & Close */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isBuy ? 'bg-[#00ff94]' : 'bg-[#ff3b4a]'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isBuy ? 'bg-[#00ff94]' : 'bg-[#ff3b4a]'
                }`}
              />
            </span>
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/30 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#00ff94]" />
              AUTO SIGNAL DETECTED
            </span>
            <span className="text-[10px] text-[#99907f] font-mono hidden sm:inline">
              {new Date(signal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onDismiss}
              className="p-1 rounded-lg text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
              title="Dismiss Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Core Asset Details */}
        <div className="flex items-start justify-between gap-3 bg-[#191c1f] p-3 rounded-xl border border-[#272a2d]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-[#fff8f1] tracking-tight">
                {signal.symbol}
              </span>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  isBuy
                    ? 'bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/30'
                    : 'bg-[#ff3b4a]/15 text-[#ff3b4a] border border-[#ff3b4a]/30'
                }`}
              >
                {isBuy ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {signal.side}
              </span>
              <span className="text-[11px] font-mono text-[#f6be16] bg-[#f6be16]/10 px-1.5 py-0.5 rounded border border-[#f6be16]/20">
                {signal.confidence}% Conviction
              </span>
            </div>
            <p className="text-xs text-[#99907f] line-clamp-1">
              {signal.title || signal.strategy} • {signal.timeframe} Chart
            </p>
          </div>

          <div className="text-right">
            <div className="text-sm font-mono font-bold text-[#fff8f1]">
              ${signal.entryPrice.toFixed(pricePrecision)}
            </div>
            <div className="text-[10px] font-mono text-[#99907f]">
              R:R {signal.riskReward}
            </div>
          </div>
        </div>

        {/* Target & Stop Levels Grid */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="bg-[#191c1f]/80 p-2 rounded-lg border border-[#272a2d]">
            <div className="text-[10px] text-[#99907f] mb-0.5">Entry Zone</div>
            <div className="text-[#e1e2e7] font-bold">
              ${signal.entryRange ? signal.entryRange[0].toFixed(pricePrecision) : signal.entryPrice.toFixed(pricePrecision)}
            </div>
          </div>

          <div className="bg-[#00ff94]/10 p-2 rounded-lg border border-[#00ff94]/20">
            <div className="text-[10px] text-[#00ff94] mb-0.5 flex items-center justify-center gap-1">
              <Target className="w-2.5 h-2.5" /> Target 1
            </div>
            <div className="text-[#00ff94] font-bold">
              ${signal.target1.toFixed(pricePrecision)}
            </div>
          </div>

          <div className="bg-[#ff3b4a]/10 p-2 rounded-lg border border-[#ff3b4a]/20">
            <div className="text-[10px] text-[#ff3b4a] mb-0.5 flex items-center justify-center gap-1">
              <ShieldAlert className="w-2.5 h-2.5" /> Stop Loss
            </div>
            <div className="text-[#ff3b4a] font-bold">
              ${signal.stopLoss.toFixed(pricePrecision)}
            </div>
          </div>
        </div>

        {/* Brief Rationale */}
        {signal.description && (
          <p className="text-[11px] text-[#d0c5b3] bg-[#14171a] p-2 rounded-lg border border-[#272a2d] line-clamp-2 leading-relaxed">
            {signal.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onSelectAndTrade(signal)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-[#00ff94] hover:bg-[#00e685] text-[#111417] shadow-lg shadow-[#00ff94]/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <BarChart2 className="w-4 h-4" />
            <span>View Chart & Trade {signal.symbol.split('/')[0]}</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>

          <button
            onClick={onDismiss}
            className="py-2.5 px-3 rounded-xl text-xs font-medium text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] border border-[#272a2d] transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
