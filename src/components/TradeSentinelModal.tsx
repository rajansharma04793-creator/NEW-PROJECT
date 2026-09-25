import React from 'react';
import { Position, AssetPair, TickerInfo } from '../types';
import { auditPortfolioPositions, SentinelPositionAudit } from '../utils/tradeSentinelUtils';
import {
  ShieldAlert,
  ShieldCheck,
  X,
  AlertTriangle,
  Zap,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface TradeSentinelModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions: Position[];
  tickers: Record<AssetPair, TickerInfo>;
  onClosePosition: (posId: string) => void;
  onUpdatePositionSL?: (posId: string, newSL: number) => void;
  onOpenChatWithQuery?: (query: string) => void;
}

export const TradeSentinelModal: React.FC<TradeSentinelModalProps> = ({
  isOpen,
  onClose,
  positions,
  tickers,
  onClosePosition,
  onUpdatePositionSL,
  onOpenChatWithQuery,
}) => {
  if (!isOpen) return null;

  const summary = auditPortfolioPositions(positions, tickers);

  const getHealthBadge = (status: SentinelPositionAudit['healthStatus']) => {
    switch (status) {
      case 'CRITICAL_LIQUIDATION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ff3b4a] text-white animate-pulse">
            🚨 CRITICAL LIQUIDATION
          </span>
        );
      case 'ELEVATED_RISK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f6be16] text-[#0b0e11]">
            ⚠️ ELEVATED RISK
          </span>
        );
      case 'IN_PROFIT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ff94] text-[#002111]">
            🟢 PROFITABLE (LOCK GAINS)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#272a2d] text-[#00ff94] border border-[#00ff94]/30">
            🛡️ HEALTHY
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-hanken">
      <div className="bg-[#191c1f] border border-[#272a2d] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#111417] border-b border-[#272a2d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#f6be16]/10 border border-[#f6be16]/30 text-[#f6be16]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#fff8f1] flex items-center gap-2">
                <span>Automated AI Trade Sentinel & Risk Auditor</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00ff94]/10 text-[#00ff94] border border-[#00ff94]/30">
                  Active Real-Time
                </span>
              </h2>
              <p className="text-[11px] text-[#99907f]">
                Continuous monitoring of active positions, liquidation distance, and profit locking.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Portfolio Health Summary Banner */}
        <div className="px-5 py-3 bg-[#14171a] border-b border-[#272a2d] flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[#99907f] text-[10px] uppercase block">Open Positions:</span>
              <span className="font-bold text-[#fff8f1]">{summary.totalOpenPositions}</span>
            </div>
            <div>
              <span className="text-[#99907f] text-[10px] uppercase block">Unrealized PnL:</span>
              <span
                className={`font-bold ${
                  summary.totalUnrealizedPnl >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                }`}
              >
                {summary.totalUnrealizedPnl >= 0 ? `+$${summary.totalUnrealizedPnl.toFixed(2)}` : `-$${Math.abs(summary.totalUnrealizedPnl).toFixed(2)}`}
              </span>
            </div>
            <div>
              <span className="text-[#99907f] text-[10px] uppercase block">Margin Locked:</span>
              <span className="font-bold text-[#fff8f1]">${summary.totalMarginLocked.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#99907f] text-[11px]">System Status:</span>
            <span
              className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                summary.overallPortfolioHealth === 'CRITICAL'
                  ? 'bg-[#ff3b4a] text-white animate-bounce'
                  : summary.overallPortfolioHealth === 'WARNING'
                  ? 'bg-[#f6be16] text-[#0b0e11]'
                  : 'bg-[#00ff94] text-[#002111]'
              }`}
            >
              {summary.overallPortfolioHealth === 'CRITICAL'
                ? 'CRITICAL RISK DETECTED'
                : summary.overallPortfolioHealth === 'WARNING'
                ? 'ELEVATED DRAWDOWN'
                : 'PORTFOLIO HEALTHY & SECURED'}
            </span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 font-mono text-xs text-[#d0c5b3]">
          {summary.audits.length === 0 ? (
            <div className="p-8 text-center bg-[#111417] rounded-xl border border-[#272a2d] space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#00ff94]/10 text-[#00ff94] flex items-center justify-center mx-auto border border-[#00ff94]/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#fff8f1]">No Active Positions Under Risk</h3>
              <p className="text-xs text-[#99907f] max-w-md mx-auto">
                Your portfolio has 0 open positions. The Sentinel stands ready to monitor real-time drawdowns, liquidation buffers, and auto-propose break-even stop loss shifts as soon as you enter a trade.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onOpenChatWithQuery?.('Scan high probability 15m scalp setups with 1:3 R:R ratio');
                }}
                className="mt-2 py-2 px-4 bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#002111] font-bold rounded-lg text-xs transition-all cursor-pointer shadow-[0_0_12px_rgba(0,255,148,0.25)]"
              >
                Scan High-Conviction Trade Setups
              </button>
            </div>
          ) : (
            summary.audits.map((audit) => {
              const isLong = audit.side === 'long';
              const ticker = tickers[audit.symbol];
              return (
                <div
                  key={audit.positionId}
                  className={`p-4 rounded-xl border space-y-3 ${
                    audit.healthStatus === 'CRITICAL_LIQUIDATION'
                      ? 'bg-[#ff3b4a]/10 border-[#ff3b4a]/50 shadow-[0_0_15px_rgba(255,59,74,0.2)]'
                      : audit.healthStatus === 'IN_PROFIT'
                      ? 'bg-[#00ff94]/5 border-[#00ff94]/30 shadow-[0_0_15px_rgba(0,255,148,0.15)]'
                      : 'bg-[#111417] border-[#272a2d]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-2 py-0.5 rounded text-[11px] font-extrabold flex items-center gap-1 ${
                          isLong ? 'bg-[#00ff94] text-[#002111]' : 'bg-[#ff3b4a] text-white'
                        }`}
                      >
                        {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span>{audit.side.toUpperCase()}</span>
                      </div>
                      <span className="font-bold text-sm text-[#fff8f1]">{audit.symbol}</span>
                      <span className="text-[10px] text-[#99907f] bg-[#191c1f] px-2 py-0.5 rounded border border-[#272a2d]">
                        {audit.leverage}x Leverage
                      </span>
                    </div>

                    {getHealthBadge(audit.healthStatus)}
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="p-2 bg-[#191c1f] rounded border border-[#272a2d]">
                      <span className="block text-[9px] text-[#99907f] uppercase font-bold">Entry vs Mark</span>
                      <span className="font-bold text-[#fff8f1]">
                        ${audit.entryPrice.toFixed(ticker?.precision || 2)} → ${audit.markPrice.toFixed(ticker?.precision || 2)}
                      </span>
                    </div>

                    <div className="p-2 bg-[#191c1f] rounded border border-[#272a2d]">
                      <span className="block text-[9px] text-[#99907f] uppercase font-bold">Current PnL</span>
                      <span
                        className={`font-extrabold ${
                          audit.currentPnl >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                        }`}
                      >
                        {audit.currentPnl >= 0 ? `+$${audit.currentPnl}` : `-$${Math.abs(audit.currentPnl)}`} ({audit.currentPnlPercent}%)
                      </span>
                    </div>

                    <div className="p-2 bg-[#191c1f] rounded border border-[#272a2d]">
                      <span className="block text-[9px] text-[#99907f] uppercase font-bold">Liquidation Price</span>
                      <span className="font-bold text-[#fff8f1]">
                        ${audit.liquidationPrice.toFixed(ticker?.precision || 2)}
                      </span>
                    </div>

                    <div className="p-2 bg-[#191c1f] rounded border border-[#272a2d]">
                      <span className="block text-[9px] text-[#99907f] uppercase font-bold">Liquidation Buffer</span>
                      <span
                        className={`font-bold ${
                          audit.liquidationDistancePercent <= 5 ? 'text-[#ff3b4a]' : 'text-[#00ff94]'
                        }`}
                      >
                        {audit.liquidationDistancePercent}% safe
                      </span>
                    </div>
                  </div>

                  {/* Sentinel Recommendation Box */}
                  <div className="p-3 bg-[#191c1f]/80 rounded-lg border border-[#272a2d] flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="font-bold text-[#fff8f1] flex items-center gap-1.5 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-[#f6be16]" />
                        <span>{audit.recommendationTitle}</span>
                      </div>
                      <p className="text-[11px] text-[#99907f] leading-relaxed max-w-xl">
                        {audit.recommendationDetails}
                      </p>
                    </div>

                    {/* Action Triggers */}
                    <div className="flex items-center gap-2">
                      {audit.suggestedAction === 'TRAIL_BREAK_EVEN' && (
                        <button
                          onClick={() => {
                            if (onUpdatePositionSL && audit.suggestedNewStopLoss) {
                              onUpdatePositionSL(audit.positionId, audit.suggestedNewStopLoss);
                            }
                          }}
                          className="py-1.5 px-3 bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#002111] rounded font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_10px_rgba(0,255,148,0.3)]"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Set SL to Entry ($${audit.entryPrice})</span>
                        </button>
                      )}

                      <button
                        onClick={() => onClosePosition(audit.positionId)}
                        className={`py-1.5 px-3 rounded font-bold text-xs flex items-center gap-1 cursor-pointer transition-all ${
                          audit.healthStatus === 'CRITICAL_LIQUIDATION'
                            ? 'bg-[#ff3b4a] hover:bg-[#ff3b4a]/90 text-white shadow-[0_0_12px_rgba(255,59,74,0.4)]'
                            : 'bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] border border-[#37393d]'
                        }`}
                      >
                        <span>Market Close</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#111417] border-t border-[#272a2d] flex items-center justify-between">
          <span className="text-[10px] text-[#99907f] font-mono">
            Obsidian Sentinel Risk Engine • Evaluates CPR Traps & Volatility Spikes
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Close Sentinel
          </button>
        </div>
      </div>
    </div>
  );
};
