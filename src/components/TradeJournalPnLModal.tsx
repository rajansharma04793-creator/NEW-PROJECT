import React, { useState, useRef } from 'react';
import {
  X,
  BookOpen,
  Award,
  TrendingUp,
  TrendingDown,
  Share2,
  Download,
  Copy,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Zap,
} from 'lucide-react';
import { AssetPair, Position } from '../types';

interface ClosedTrade {
  id: string;
  symbol: AssetPair;
  side: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  size: number;
  leverage: number;
  pnlUsd: number;
  roiPercent: number;
  entryTime: number;
  exitTime: number;
  aiNotes: string;
  disciplineScore: number; // 0-100
}

interface TradeJournalPnLModalProps {
  isOpen: boolean;
  onClose: () => void;
  positions: Position[];
  balance: number;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const TradeJournalPnLModal: React.FC<TradeJournalPnLModalProps> = ({
  isOpen,
  onClose,
  positions,
  balance,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'journal' | 'share_card' | 'ai_coach'>('journal');
  const [selectedTradeForCard, setSelectedTradeForCard] = useState<ClosedTrade | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Sample realistic closed trade records
  const [closedTrades] = useState<ClosedTrade[]>([
    {
      id: 'trade-101',
      symbol: 'BTC/USDT',
      side: 'long',
      entryPrice: 94250,
      exitPrice: 96800,
      size: 0.25,
      leverage: 15,
      pnlUsd: 637.5,
      roiPercent: 40.58,
      entryTime: Date.now() - 1000 * 60 * 60 * 5,
      exitTime: Date.now() - 1000 * 60 * 60 * 1,
      aiNotes: 'Perfect adherence to 15m Bullish FVG rejection + Supertrend alignment. Scaled out at TP2.',
      disciplineScore: 95,
    },
    {
      id: 'trade-102',
      symbol: 'ETH/USDT',
      side: 'short',
      entryPrice: 2840,
      exitPrice: 2760,
      size: 3.5,
      leverage: 10,
      pnlUsd: 280.0,
      roiPercent: 28.16,
      entryTime: Date.now() - 1000 * 60 * 60 * 14,
      exitTime: Date.now() - 1000 * 60 * 60 * 8,
      aiNotes: 'Clean breakdown below 4h supply zone. Stop-loss trailed effectively.',
      disciplineScore: 90,
    },
    {
      id: 'trade-103',
      symbol: 'SOL/USDT',
      side: 'long',
      entryPrice: 198.5,
      exitPrice: 192.0,
      size: 20,
      leverage: 20,
      pnlUsd: -130.0,
      roiPercent: -32.74,
      entryTime: Date.now() - 1000 * 60 * 60 * 26,
      exitTime: Date.now() - 1000 * 60 * 60 * 24,
      aiNotes: 'Chased candle during FOMC volatility without waiting for candle close confirmation.',
      disciplineScore: 60,
    },
    {
      id: 'trade-104',
      symbol: 'XRP/USDT',
      side: 'long',
      entryPrice: 2.15,
      exitPrice: 2.42,
      size: 3000,
      leverage: 5,
      pnlUsd: 810.0,
      roiPercent: 62.79,
      entryTime: Date.now() - 1000 * 60 * 60 * 48,
      exitTime: Date.now() - 1000 * 60 * 60 * 30,
      aiNotes: 'High-conviction swing trade off daily support. Excellent risk/reward management (1:3.8).',
      disciplineScore: 98,
    },
  ]);

  if (!isOpen) return null;

  // Selected trade for generating card defaults to the highest ROI trade
  const activeCardTrade =
    selectedTradeForCard || closedTrades[0];

  const totalRealizedPnl = closedTrades.reduce((acc, t) => acc + t.pnlUsd, 0);
  const winningTrades = closedTrades.filter((t) => t.pnlUsd > 0);
  const winRate = Math.round((winningTrades.length / closedTrades.length) * 100);
  const avgDiscipline = Math.round(
    closedTrades.reduce((acc, t) => acc + t.disciplineScore, 0) / closedTrades.length
  );

  const handleCopyCard = () => {
    onShowToast('PnL Performance Card copied to clipboard!', 'success');
  };

  const handleDownloadCard = () => {
    onShowToast('Saved PnL Card image to your downloads.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#171a1d] border border-[#2b2f36] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2f36] bg-[#121417]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00ff94]/10 border border-[#00ff94]/30 text-[#00ff94]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#fff8f1] font-mono tracking-wide">
                  TRADING JOURNAL & AI POST-MORTEM COACH
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#ffd87f]/10 text-[#ffd87f] border border-[#ffd87f]/30">
                  PERFORMANCE ANALYTICS
                </span>
              </div>
              <p className="text-xs text-[#8e9099] font-mono">
                Realized profit logs, discipline metrics & shareable PnL cards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e9099] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex border-b border-[#2b2f36] bg-[#121417]">
          <button
            onClick={() => setActiveTab('journal')}
            className={`flex-1 py-3 px-6 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'journal'
                ? 'border-[#00ff94] text-[#00ff94] bg-[#1c2024]'
                : 'border-transparent text-[#8e9099] hover:text-[#fff8f1]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Trade Logs & History</span>
          </button>
          <button
            onClick={() => setActiveTab('share_card')}
            className={`flex-1 py-3 px-6 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'share_card'
                ? 'border-[#ffd87f] text-[#ffd87f] bg-[#1c2024]'
                : 'border-transparent text-[#8e9099] hover:text-[#fff8f1]'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Generate PnL Share Card</span>
          </button>
          <button
            onClick={() => setActiveTab('ai_coach')}
            className={`flex-1 py-3 px-6 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ai_coach'
                ? 'border-[#a855f7] text-[#a855f7] bg-[#1c2024]'
                : 'border-transparent text-[#8e9099] hover:text-[#fff8f1]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Psychology & Risk Coach</span>
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-[#14171a] border-b border-[#2b2f36]">
          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36]">
            <span className="text-[11px] font-mono text-[#8e9099] uppercase block mb-1">
              Total Realized PnL
            </span>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00ff94]" />
              <span className="text-xl font-bold font-mono text-[#00ff94]">
                +${totalRealizedPnl.toFixed(2)} USDT
              </span>
            </div>
          </div>

          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36]">
            <span className="text-[11px] font-mono text-[#8e9099] uppercase block mb-1">
              Win Rate
            </span>
            <span className="text-xl font-bold font-mono text-[#fff8f1]">
              {winRate}% ({winningTrades.length}/{closedTrades.length})
            </span>
          </div>

          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36]">
            <span className="text-[11px] font-mono text-[#8e9099] uppercase block mb-1">
              Discipline & Execution Index
            </span>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[#ffd87f]" />
              <span className="text-xl font-bold font-mono text-[#ffd87f]">
                {avgDiscipline}/100 (A-Grade)
              </span>
            </div>
          </div>

          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36]">
            <span className="text-[11px] font-mono text-[#8e9099] uppercase block mb-1">
              Average Risk/Reward
            </span>
            <span className="text-xl font-bold font-mono text-[#00ff94]">1 : 2.85</span>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'journal' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#8e9099] pb-2 border-b border-[#2b2f36] px-3">
                <span className="w-28">Symbol / Side</span>
                <span className="w-32">Entry / Exit</span>
                <span className="w-24 text-right">PnL (USD)</span>
                <span className="w-20 text-right">ROI (%)</span>
                <span className="flex-1 text-center">AI Post-Mortem Reason</span>
                <span className="w-20 text-right">Action</span>
              </div>

              {closedTrades.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg bg-[#1c2024] border border-[#2b2f36] hover:border-[#37393d] transition-colors flex items-center justify-between gap-4 font-mono text-xs"
                >
                  <div className="w-28">
                    <span className="font-bold text-[#fff8f1] block">{t.symbol}</span>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        t.side === 'long' ? 'text-[#00ff94]' : 'text-[#ff4d4d]'
                      }`}
                    >
                      {t.side} {t.leverage}x
                    </span>
                  </div>

                  <div className="w-32 text-xs">
                    <span className="text-[#8e9099] block">In: ${t.entryPrice}</span>
                    <span className="text-[#fff8f1] font-bold">Out: ${t.exitPrice}</span>
                  </div>

                  <div className="w-24 text-right">
                    <span
                      className={`font-bold ${
                        t.pnlUsd >= 0 ? 'text-[#00ff94]' : 'text-[#ff4d4d]'
                      }`}
                    >
                      {t.pnlUsd >= 0 ? '+' : ''}${t.pnlUsd.toFixed(2)}
                    </span>
                  </div>

                  <div className="w-20 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                        t.roiPercent >= 0
                          ? 'bg-[#00ff94]/15 text-[#00ff94]'
                          : 'bg-[#ff4d4d]/15 text-[#ff4d4d]'
                      }`}
                    >
                      {t.roiPercent >= 0 ? '+' : ''}{t.roiPercent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex-1 text-xs text-[#d0c5b3] px-2 truncate" title={t.aiNotes}>
                    {t.aiNotes}
                  </div>

                  <div className="w-20 text-right">
                    <button
                      onClick={() => {
                        setSelectedTradeForCard(t);
                        setActiveTab('share_card');
                      }}
                      className="px-2 py-1 rounded bg-[#272a2d] hover:bg-[#ffd87f] hover:text-[#121417] text-[11px] font-mono text-[#d0c5b3] transition-colors cursor-pointer"
                    >
                      Card
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'share_card' && (
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
              {/* The PnL Share Card */}
              <div
                ref={cardRef}
                className="w-full max-w-md bg-gradient-to-br from-[#121417] via-[#1c221e] to-[#0a150e] border-2 border-[#00ff94]/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
              >
                {/* Background glow & branding */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#00ff94]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center justify-between mb-4 border-b border-[#2b2f36] pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#00ff94] flex items-center justify-center text-[#121417] font-bold text-xs font-mono">
                      CDX
                    </div>
                    <span className="font-mono font-bold text-sm tracking-wider text-[#fff8f1]">
                      COINDCX PRO TERMINAL
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#00ff94] font-bold px-2 py-0.5 rounded bg-[#00ff94]/10 border border-[#00ff94]/30">
                    VERIFIED TRADE
                  </span>
                </div>

                {/* Main Pair & Side */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xl font-bold font-mono text-[#fff8f1]">
                      {activeCardTrade.symbol}
                    </span>
                    <span
                      className={`ml-2 px-2 py-0.5 rounded text-xs font-bold font-mono ${
                        activeCardTrade.side === 'long'
                          ? 'bg-[#00ff94]/20 text-[#00ff94]'
                          : 'bg-[#ff4d4d]/20 text-[#ff4d4d]'
                      }`}
                    >
                      {activeCardTrade.side.toUpperCase()} {activeCardTrade.leverage}X
                    </span>
                  </div>
                </div>

                {/* Massive ROI */}
                <div className="my-6">
                  <span className="text-xs font-mono text-[#8e9099] uppercase tracking-widest block mb-1">
                    REALIZED ROI
                  </span>
                  <div
                    className={`text-5xl font-black font-mono tracking-tight ${
                      activeCardTrade.roiPercent >= 0 ? 'text-[#00ff94]' : 'text-[#ff4d4d]'
                    }`}
                  >
                    {activeCardTrade.roiPercent >= 0 ? '+' : ''}
                    {activeCardTrade.roiPercent.toFixed(2)}%
                  </div>
                  <span className="text-sm font-mono text-[#ffd87f] font-bold mt-1 block">
                    +${activeCardTrade.pnlUsd.toFixed(2)} USDT Realized Profit
                  </span>
                </div>

                {/* Entry & Exit Details */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#121417]/80 rounded-xl border border-[#2b2f36] font-mono text-xs mb-4">
                  <div>
                    <span className="text-[#8e9099] block text-[10px]">ENTRY PRICE</span>
                    <span className="text-[#fff8f1] font-bold">${activeCardTrade.entryPrice}</span>
                  </div>
                  <div>
                    <span className="text-[#8e9099] block text-[10px]">EXIT PRICE</span>
                    <span className="text-[#00ff94] font-bold">${activeCardTrade.exitPrice}</span>
                  </div>
                </div>

                {/* Footer / Watermark */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8e9099] pt-2 border-t border-[#2b2f36]">
                  <span>AI Powered Execution Engine</span>
                  <span>{new Date(activeCardTrade.exitTime).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 w-full md:w-64">
                <span className="text-xs font-mono text-[#8e9099] uppercase">
                  Export Options
                </span>
                <button
                  onClick={handleCopyCard}
                  className="w-full py-2.5 rounded-lg bg-[#00ff94] text-[#121417] font-mono font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#00e685] transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Image Card</span>
                </button>
                <button
                  onClick={handleDownloadCard}
                  className="w-full py-2.5 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] font-mono text-xs flex items-center justify-center gap-2 border border-[#37393d] transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download High-Res PNG</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ai_coach' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-4 rounded-xl bg-[#1c2024] border border-[#a855f7]/40 shadow-lg">
                <div className="flex items-center gap-2 text-[#a855f7] mb-2 font-mono font-bold text-sm">
                  <Sparkles className="w-5 h-5" />
                  <span>AI PSYCHOLOGY & RISK EVALUATION</span>
                </div>
                <p className="text-xs text-[#d0c5b3] font-mono leading-relaxed">
                  Based on your last 4 closed trades, your average Win-Loss ratio is exceptional (3:1). However, trade #103 suffered from a high leverage spike during a high-impact news window.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="p-4 rounded-lg bg-[#14171a] border border-[#2b2f36]">
                  <div className="flex items-center gap-2 text-[#00ff94] font-bold mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Key Strengths</span>
                  </div>
                  <ul className="space-y-1.5 text-[#8e9099]">
                    <li>• Disciplined take-profit scaling on BTC/USDT.</li>
                    <li>• Solid trailing stop execution preserving +$280 on ETH.</li>
                    <li>• 100% adherence to defined stop-loss thresholds.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-[#14171a] border border-[#2b2f36]">
                  <div className="flex items-center gap-2 text-[#ffd87f] font-bold mb-2">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Areas for Improvement</span>
                  </div>
                  <ul className="space-y-1.5 text-[#8e9099]">
                    <li>• Avoid opening 20x positions within 15 mins of CPI/FOMC.</li>
                    <li>• Consider using TWAP order slicer for positions &gt;$5,000.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
