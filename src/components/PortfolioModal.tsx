import React, { useState, useMemo } from 'react';
import {
  X,
  Wallet,
  ArrowDownLeft,
  RefreshCcw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Order, Position } from '../types';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onDeposit: (amount: number) => void;
  onReset: () => void;
  orderHistory?: Order[];
  positions?: Position[];
}

export const PortfolioModal: React.FC<PortfolioModalProps> = ({
  isOpen,
  onClose,
  balance,
  onDeposit,
  onReset,
  orderHistory = [],
  positions = [],
}) => {
  const [activeTab, setActiveTab] = useState<'performance' | 'treasury'>('performance');
  const [depositAmount, setDepositAmount] = useState<string>('10000');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'wins' | 'losses'>('all');

  // Filter closed trades from order history
  const closedOrders = useMemo(() => {
    return orderHistory.filter((o) => typeof o.realizedPnl === 'number');
  }, [orderHistory]);

  // Compute performance metrics
  const performanceStats = useMemo(() => {
    const totalTrades = closedOrders.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winCount: 0,
        lossCount: 0,
        breakevenCount: 0,
        winRate: 0,
        totalRealizedPnl: 0,
        avgProfitPerTrade: 0,
        totalGains: 0,
        totalLosses: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        bestTrade: null as Order | null,
        worstTrade: null as Order | null,
      };
    }

    let totalPnl = 0;
    let wins = 0;
    let losses = 0;
    let breakeven = 0;
    let gains = 0;
    let lossAmount = 0;
    let best: Order | null = null;
    let worst: Order | null = null;

    for (const ord of closedOrders) {
      const pnl = ord.realizedPnl ?? 0;
      totalPnl += pnl;

      if (pnl > 0.001) {
        wins++;
        gains += pnl;
      } else if (pnl < -0.001) {
        losses++;
        lossAmount += Math.abs(pnl);
      } else {
        breakeven++;
      }

      if (!best || pnl > (best.realizedPnl ?? -Infinity)) {
        best = ord;
      }
      if (!worst || pnl < (worst.realizedPnl ?? Infinity)) {
        worst = ord;
      }
    }

    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const avgProfitPerTrade = totalTrades > 0 ? totalPnl / totalTrades : 0;
    const avgWin = wins > 0 ? gains / wins : 0;
    const avgLoss = losses > 0 ? lossAmount / losses : 0;
    const profitFactor = lossAmount > 0 ? gains / lossAmount : gains > 0 ? 99.9 : 0;

    return {
      totalTrades,
      winCount: wins,
      lossCount: losses,
      breakevenCount: breakeven,
      winRate: +winRate.toFixed(1),
      totalRealizedPnl: +totalPnl.toFixed(2),
      avgProfitPerTrade: +avgProfitPerTrade.toFixed(2),
      totalGains: +gains.toFixed(2),
      totalLosses: +lossAmount.toFixed(2),
      avgWin: +avgWin.toFixed(2),
      avgLoss: +avgLoss.toFixed(2),
      profitFactor: +profitFactor.toFixed(2),
      bestTrade: best,
      worstTrade: worst,
    };
  }, [closedOrders]);

  // Filtered trade list for table view
  const filteredClosedOrders = useMemo(() => {
    if (historyFilter === 'wins') {
      return closedOrders.filter((o) => (o.realizedPnl ?? 0) > 0);
    }
    if (historyFilter === 'losses') {
      return closedOrders.filter((o) => (o.realizedPnl ?? 0) < 0);
    }
    return closedOrders;
  }, [closedOrders, historyFilter]);

  if (!isOpen) return null;

  const handleDeposit = () => {
    const amt = Number(depositAmount) || 0;
    if (amt > 0) {
      onDeposit(amt);
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#f6be16', '#00ff94'],
        });
      } catch {}
      setActiveTab('treasury');
    }
  };

  return (
    <div
      id="portfolio-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 font-hanken animate-in fade-in duration-200"
    >
      <div
        id="portfolio-modal-dialog"
        className="bg-[#111417] border border-[#272a2d] rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col relative shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#272a2d] flex items-center justify-between bg-[#15181b]/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#f6be16]/10 text-[#f6be16] border border-[#f6be16]/25">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#fff8f1] text-base">Portfolio & Account Hub</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00ff94]/10 text-[#00ff94] border border-[#00ff94]/20">
                  PAPER MARGIN
                </span>
              </div>
              <p className="text-xs text-[#99907f] font-mono">
                Institutional Liquidity · Historical Performance Analytics
              </p>
            </div>
          </div>
          <button
            id="portfolio-modal-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 pb-2 border-b border-[#272a2d] bg-[#111417] flex items-center gap-2 shrink-0">
          <button
            id="portfolio-tab-performance"
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeTab === 'performance'
                ? 'bg-[#f6be16] text-[#111417] shadow-sm font-bold'
                : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#191c1f]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Performance Summary</span>
            {performanceStats.totalTrades > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded text-[10px] ${
                  activeTab === 'performance'
                    ? 'bg-[#111417]/20 text-[#111417]'
                    : 'bg-[#272a2d] text-[#e1e2e7]'
                }`}
              >
                {performanceStats.winRate}% Win
              </span>
            )}
          </button>

          <button
            id="portfolio-tab-treasury"
            onClick={() => setActiveTab('treasury')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeTab === 'treasury'
                ? 'bg-[#f6be16] text-[#111417] shadow-sm font-bold'
                : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#191c1f]'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Treasury & Margin</span>
            <span
              className={`ml-1 px-1.5 py-0.2 rounded text-[10px] ${
                activeTab === 'treasury'
                  ? 'bg-[#111417]/20 text-[#111417]'
                  : 'bg-[#272a2d] text-[#ffd87f]'
              }`}
            >
              ${balance >= 1000 ? `${(balance / 1000).toFixed(1)}k` : balance.toFixed(0)}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'performance' && (
            <div id="performance-summary-panel" className="space-y-4">
              {/* Primary 3 Key Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Win Rate Card */}
                <div
                  id="perf-metric-winrate"
                  className="p-3.5 bg-[#191c1f] rounded-xl border border-[#272a2d] relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-[#99907f] mb-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider">Win Rate</span>
                    <Award className="w-4 h-4 text-[#f6be16]" />
                  </div>
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-2xl font-black font-mono text-[#fff8f1] tracking-tight">
                      {performanceStats.winRate}%
                    </span>
                    <span className="text-[11px] text-[#99907f] font-mono">
                      ({performanceStats.winCount}W / {performanceStats.lossCount}L)
                    </span>
                  </div>
                  {/* Win rate visual ratio bar */}
                  <div className="w-full bg-[#272a2d] h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-[#00ff94] h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, performanceStats.winRate))}%` }}
                    />
                    <div
                      className="bg-[#ff3b4a] h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, 100 - performanceStats.winRate))}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#99907f] font-mono mt-1.5">
                    <span className="text-[#00ff94]">{performanceStats.winCount} Wins</span>
                    <span>{performanceStats.totalTrades} Total Closed</span>
                    <span className="text-[#ff3b4a]">{performanceStats.lossCount} Losses</span>
                  </div>
                </div>

                {/* 2. Average Profit Per Trade */}
                <div
                  id="perf-metric-avg-profit"
                  className="p-3.5 bg-[#191c1f] rounded-xl border border-[#272a2d] relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-[#99907f] mb-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider">
                      Avg Profit / Trade
                    </span>
                    {performanceStats.avgProfitPerTrade >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-[#00ff94]" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-[#ff3b4a]" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1.5">
                    <span
                      className={`text-2xl font-black font-mono tracking-tight ${
                        performanceStats.avgProfitPerTrade >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                      }`}
                    >
                      {performanceStats.avgProfitPerTrade >= 0 ? '+' : ''}$
                      {performanceStats.avgProfitPerTrade.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-[10px] text-[#99907f] font-mono">USDT</span>
                  </div>
                  <p className="text-[11px] text-[#99907f] font-mono leading-tight">
                    Expectancy: Avg Win{' '}
                    <span className="text-[#00ff94]">
                      +${performanceStats.avgWin.toFixed(0)}
                    </span>{' '}
                    vs Avg Loss{' '}
                    <span className="text-[#ff3b4a]">
                      -${performanceStats.avgLoss.toFixed(0)}
                    </span>
                  </p>
                </div>

                {/* 3. Total Realized PnL */}
                <div
                  id="perf-metric-total-realized-pnl"
                  className="p-3.5 bg-[#191c1f] rounded-xl border border-[#272a2d] relative overflow-hidden"
                >
                  <div className="flex items-center justify-between text-[#99907f] mb-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider">
                      Total Realized PnL
                    </span>
                    <div
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                        performanceStats.totalRealizedPnl >= 0
                          ? 'bg-[#00ff94]/15 text-[#00ff94]'
                          : 'bg-[#ff3b4a]/15 text-[#ff3b4a]'
                      }`}
                    >
                      {performanceStats.totalRealizedPnl >= 0 ? 'PROFITABLE' : 'DRAWDOWN'}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-1.5">
                    <span
                      className={`text-2xl font-black font-mono tracking-tight ${
                        performanceStats.totalRealizedPnl >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                      }`}
                    >
                      {performanceStats.totalRealizedPnl >= 0 ? '+' : ''}$
                      {performanceStats.totalRealizedPnl.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    <span className="text-[10px] text-[#99907f] font-mono">USDT</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#99907f] font-mono">
                    <span>Profit Factor:</span>
                    <span className="text-[#fff8f1] font-bold">
                      {performanceStats.profitFactor > 0 ? `${performanceStats.profitFactor}x` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Supporting Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 bg-[#16191c] rounded-lg border border-[#272a2d]">
                  <span className="text-[10px] text-[#99907f] font-mono block">Gross Gains</span>
                  <span className="text-sm font-bold text-[#00ff94] font-mono">
                    +${performanceStats.totalGains.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 bg-[#16191c] rounded-lg border border-[#272a2d]">
                  <span className="text-[10px] text-[#99907f] font-mono block">Gross Losses</span>
                  <span className="text-sm font-bold text-[#ff3b4a] font-mono">
                    -${performanceStats.totalLosses.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 bg-[#16191c] rounded-lg border border-[#272a2d]">
                  <span className="text-[10px] text-[#99907f] font-mono block">Best Trade</span>
                  <span className="text-sm font-bold text-[#00ff94] font-mono truncate block">
                    {performanceStats.bestTrade
                      ? `+$${(performanceStats.bestTrade.realizedPnl ?? 0).toFixed(1)} (${performanceStats.bestTrade.symbol})`
                      : 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 bg-[#16191c] rounded-lg border border-[#272a2d]">
                  <span className="text-[10px] text-[#99907f] font-mono block">Worst Trade</span>
                  <span className="text-sm font-bold text-[#ff3b4a] font-mono truncate block">
                    {performanceStats.worstTrade && (performanceStats.worstTrade.realizedPnl ?? 0) < 0
                      ? `-$${Math.abs(performanceStats.worstTrade.realizedPnl ?? 0).toFixed(1)} (${performanceStats.worstTrade.symbol})`
                      : 'None'}
                  </span>
                </div>
              </div>

              {/* Closed Trades History Log */}
              <div className="pt-2 border-t border-[#272a2d]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#f6be16]" />
                    <h4 className="text-xs font-bold text-[#fff8f1] font-mono uppercase tracking-wider">
                      Realized Order History ({filteredClosedOrders.length})
                    </h4>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 self-start sm:self-auto bg-[#191c1f] p-0.5 rounded-lg border border-[#272a2d]">
                    <button
                      id="perf-filter-all"
                      onClick={() => setHistoryFilter('all')}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                        historyFilter === 'all'
                          ? 'bg-[#272a2d] text-[#fff8f1]'
                          : 'text-[#99907f] hover:text-[#fff8f1]'
                      }`}
                    >
                      All ({performanceStats.totalTrades})
                    </button>
                    <button
                      id="perf-filter-wins"
                      onClick={() => setHistoryFilter('wins')}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                        historyFilter === 'wins'
                          ? 'bg-[#00ff94]/20 text-[#00ff94]'
                          : 'text-[#99907f] hover:text-[#00ff94]'
                      }`}
                    >
                      Wins ({performanceStats.winCount})
                    </button>
                    <button
                      id="perf-filter-losses"
                      onClick={() => setHistoryFilter('losses')}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                        historyFilter === 'losses'
                          ? 'bg-[#ff3b4a]/20 text-[#ff3b4a]'
                          : 'text-[#99907f] hover:text-[#ff3b4a]'
                      }`}
                    >
                      Losses ({performanceStats.lossCount})
                    </button>
                  </div>
                </div>

                {filteredClosedOrders.length === 0 ? (
                  <div
                    id="perf-empty-state"
                    className="p-8 text-center bg-[#191c1f]/40 rounded-xl border border-dashed border-[#272a2d] space-y-2"
                  >
                    <BarChart3 className="w-8 h-8 text-[#99907f]/50 mx-auto" />
                    <p className="text-xs text-[#fff8f1] font-medium">No closed trades found</p>
                    <p className="text-[11px] text-[#99907f] max-w-sm mx-auto">
                      Execute market or limit orders in the terminal, then close them to populate your
                      institutional win rate and realized PnL tracker.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {filteredClosedOrders.map((ord) => {
                      const pnl = ord.realizedPnl ?? 0;
                      const isWin = pnl >= 0;
                      return (
                        <div
                          key={ord.id}
                          id={`closed-order-${ord.id}`}
                          className="p-2.5 bg-[#191c1f] hover:bg-[#1f2327] rounded-xl border border-[#272a2d] flex items-center justify-between transition-colors font-mono text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${
                                isWin
                                  ? 'bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/25'
                                  : 'bg-[#ff3b4a]/15 text-[#ff3b4a] border border-[#ff3b4a]/25'
                              }`}
                            >
                              {isWin ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#fff8f1]">{ord.symbol}</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    ord.side === 'buy'
                                      ? 'bg-[#00ff94]/10 text-[#00ff94]'
                                      : 'bg-[#ff3b4a]/10 text-[#ff3b4a]'
                                  }`}
                                >
                                  {ord.side.toUpperCase()}
                                </span>
                                {ord.leverage && (
                                  <span className="text-[10px] text-[#99907f]">{ord.leverage}x</span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#99907f] flex items-center gap-2 mt-0.5">
                                <span>
                                  Close: <strong className="text-[#e1e2e7]">${ord.price.toFixed(2)}</strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Size: <strong className="text-[#e1e2e7]">{ord.amount.toFixed(3)}</strong>
                                </span>
                                <span>•</span>
                                <span>{new Date(ord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div
                              className={`text-sm font-black font-mono ${
                                isWin ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                              }`}
                            >
                              {isWin ? '+' : ''}${pnl.toFixed(2)}
                            </div>
                            {ord.pnlPercent !== undefined && (
                              <div
                                className={`text-[10px] font-bold ${
                                  isWin ? 'text-[#00ff94]/80' : 'text-[#ff3b4a]/80'
                                }`}
                              >
                                {ord.pnlPercent >= 0 ? '+' : ''}
                                {ord.pnlPercent.toFixed(1)}% ROI
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'treasury' && (
            <div id="treasury-management-panel" className="space-y-4">
              {/* Total Available Balance Card */}
              <div
                id="treasury-balance-card"
                className="p-4 bg-[#191c1f] rounded-xl border border-[#272a2d]"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#99907f] font-mono uppercase">
                    Total Available Margin (USDT)
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[#00ff94] font-mono bg-[#00ff94]/10 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3 h-3" /> Live Sandbox
                  </span>
                </div>
                <div className="text-3xl font-extrabold text-[#fff8f1] font-mono tracking-tight">
                  ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                {positions.length > 0 && (
                  <p className="text-[11px] text-[#ffd87f] font-mono mt-1">
                    {positions.length} active open position{positions.length > 1 ? 's' : ''} currently allocated
                  </p>
                )}
              </div>

              {/* Deposit Quick Form */}
              <div className="space-y-3">
                <label className="text-xs text-[#d0c5b3] font-mono block">
                  Add Demo Liquidity (USDT)
                </label>
                <div className="flex gap-2">
                  <input
                    id="deposit-amount-input"
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="flex-1 bg-[#191c1f] border border-[#272a2d] focus:border-[#f6be16] rounded-lg px-3 py-2 text-sm text-[#fff8f1] font-mono outline-none"
                    placeholder="Enter deposit amount..."
                  />
                  <button
                    id="deposit-submit-btn"
                    onClick={handleDeposit}
                    className="px-4 py-2 bg-[#00ff94] hover:bg-[#40e397] text-[#002111] font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    <span>Deposit Funds</span>
                  </button>
                </div>

                {/* Quick Add Amount Chips */}
                <div className="flex gap-2 pt-1">
                  {[5000, 10000, 50000, 100000].map((amt) => (
                    <button
                      key={amt}
                      id={`quick-deposit-${amt}`}
                      onClick={() => setDepositAmount(amt.toString())}
                      className="flex-1 py-1.5 bg-[#272a2d] hover:bg-[#37393d] rounded-lg text-[11px] font-mono text-[#e1e2e7] transition-colors cursor-pointer"
                    >
                      +${(amt / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#272a2d] bg-[#15181b]/80 flex items-center justify-between shrink-0">
          <button
            id="reset-account-balance-btn"
            onClick={() => {
              onReset();
              confetti({
                particleCount: 30,
                spread: 45,
                origin: { y: 0.7 },
                colors: ['#f6be16', '#ff3b4a'],
              });
            }}
            className="flex items-center gap-1.5 text-xs text-[#ff3b4a] hover:text-[#ff6b77] hover:underline font-mono cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Account to $100k</span>
          </button>

          <button
            id="portfolio-modal-footer-close-btn"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
