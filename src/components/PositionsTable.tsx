import React, { useState } from 'react';
import { Position, Order, AISignal } from '../types';
import { 
  X, CheckCircle, Clock, Share2, Sparkles, TrendingUp, 
  Play, Target, Activity, Lock, ArrowUpRight, Zap, BellRing, 
  AlertOctagon, Check, AlertTriangle, ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playProfitHitChime } from '../utils/soundEffects';

interface PositionsTableProps {
  positions: Position[];
  openOrders: Order[];
  orderHistory: Order[];
  aiSignals: AISignal[];
  onClosePosition: (id: string) => void;
  onCancelOrder: (id: string) => void;
  onExecuteSignal?: (signal: AISignal) => void;
  defaultTab?: 'positions' | 'orders' | 'history' | 'signals';
  autoExecutionEnabled?: boolean;
  onToggleAutoExecution?: () => void;
  onOpenAutoAlertsModal?: () => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  openOrders,
  orderHistory,
  aiSignals,
  onClosePosition,
  onCancelOrder,
  onExecuteSignal,
  defaultTab,
  autoExecutionEnabled,
  onToggleAutoExecution,
  onOpenAutoAlertsModal,
}) => {
  const [activeTab, setActiveTab] = useState<
    'positions' | 'orders' | 'history' | 'signals'
  >(defaultTab || 'positions');

  React.useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  const [shareModalPos, setShareModalPos] = useState<Position | null>(null);
  
  // AI Trailing Stop & Partial TP Engine state tracking per position ID
  const [trailingEngineMap, setTrailingEngineMap] = useState<Record<string, {
    isTrailingEnabled: boolean;
    isTp1Locked: boolean;
    trailingPercent: number;
    breakEvenActivated: boolean;
  }>>({});

  const toggleTrailingEngine = (posId: string) => {
    setTrailingEngineMap((prev) => {
      const current = prev[posId] || { isTrailingEnabled: false, isTp1Locked: false, trailingPercent: 1.5, breakEvenActivated: false };
      return {
        ...prev,
        [posId]: {
          ...current,
          isTrailingEnabled: !current.isTrailingEnabled,
        },
      };
    });
  };

  const handleLockTp1 = (pos: Position) => {
    playProfitHitChime();
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#00ff94', '#f6be16', '#ffffff'],
    });

    setTrailingEngineMap((prev) => {
      const current = prev[pos.id] || { isTrailingEnabled: true, isTp1Locked: true, trailingPercent: 1.5, breakEvenActivated: true };
      return {
        ...prev,
        [pos.id]: {
          ...current,
          isTrailingEnabled: true,
          isTp1Locked: true,
          breakEvenActivated: true,
        },
      };
    });
  };

  const handleSharePnL = (pos: Position) => {
    setShareModalPos(pos);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f6be16', '#00ff94', '#fff8f1'],
    });
  };

  const handleBookProfit = (pos: Position, pnl: number) => {
    if (pnl > 0) {
      playProfitHitChime();
      confetti({
        particleCount: 65,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#00ff94', '#61feaf', '#ffd87f', '#ffffff'],
      });
    }
    onClosePosition(pos.id);
  };

  // Panic Kill-Switch (Emergency Flatten all positions and open orders)
  const handlePanicKillSwitch = () => {
    openOrders.forEach((o) => {
      onCancelOrder(o.id);
    });
    positions.forEach((p) => {
      onClosePosition(p.id);
    });
  };

  return (
    <div
      id="positions-bottom-panel"
      className="flex flex-col h-full bg-[#111417] border-t border-[#272a2d] font-mono text-[11px] select-none"
    >
      {/* Tabs Header */}
      <div role="tablist" aria-label="Positions and Orders Tabs" className="flex items-center justify-between px-3 py-1.5 bg-[#191c1f] border-b border-[#272a2d] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 shrink-0">
          <button
            role="tab"
            aria-selected={activeTab === 'positions'}
            onClick={() => setActiveTab('positions')}
            className={`pb-1 border-b-2 font-bold transition-colors cursor-pointer ${
              activeTab === 'positions'
                ? 'border-[#f6be16] text-[#fff8f1]'
                : 'border-transparent text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            Positions ({positions.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            className={`pb-1 border-b-2 font-bold transition-colors cursor-pointer ${
              activeTab === 'orders'
                ? 'border-[#f6be16] text-[#fff8f1]'
                : 'border-transparent text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            Open Orders ({openOrders.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            className={`pb-1 border-b-2 font-bold transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#f6be16] text-[#fff8f1]'
                : 'border-transparent text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            Trade History ({orderHistory.length})
          </button>
          <button
            id="positions-tab-signals-btn"
            role="tab"
            aria-selected={activeTab === 'signals'}
            onClick={() => setActiveTab('signals')}
            className={`pb-1 border-b-2 font-bold transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'signals'
                ? 'border-[#00ff94] text-[#00ff94]'
                : 'border-transparent text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#00ff94]" />
            <span>AI Signals ({aiSignals.length})</span>
            {autoExecutionEnabled && (
              <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] bg-emerald-400 text-black font-extrabold uppercase animate-pulse">
                AUTO ON
              </span>
            )}
          </button>
        </div>

        {/* Action Controls in Tab Bar */}
        <div className="flex items-center gap-2 text-[10px] pl-3 shrink-0">
          {onToggleAutoExecution && (
            <div
              id="positions-auto-trade-toggle-btn"
              className="px-2 py-0.5 rounded font-mono text-[10px] flex items-center gap-1 border bg-secondary/30 text-muted-foreground border-border"
              title="Execution Safety Policy: All orders require deliberate pre-trade review. Autonomous execution is disabled."
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Execution: Deliberate Review</span>
            </div>
          )}

          {(positions.length > 0 || openOrders.length > 0) && (
            <button
              onClick={handlePanicKillSwitch}
              title="Panic Kill-Switch: Emergency Cancel All Active Orders & Flatten Positions"
              className="px-2 py-0.5 rounded bg-[#ff3b4a]/20 hover:bg-[#ff3b4a] text-[#ff3b4a] hover:text-[#fff8f1] font-bold transition-all flex items-center gap-1 cursor-pointer border border-[#ff3b4a]/40"
            >
              <AlertOctagon className="w-3 h-3" />
              <span>KILL SWITCH</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {activeTab === 'positions' && (
          positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-[#99907f] gap-2">
              <Clock className="w-6 h-6 opacity-40" />
              <span>No open positions. Place an order from the terminal.</span>
            </div>
          ) : (
            <>
              {/* MOBILE CARDS VIEW (<md) */}
              <div className="md:hidden p-2 space-y-2.5">
                {positions.map((pos) => {
                  const pnl =
                    pos.side === 'long'
                      ? (pos.markPrice - pos.entryPrice) * pos.size
                      : (pos.entryPrice - pos.markPrice) * pos.size;
                  const roe = pos.margin > 0 ? (pnl / pos.margin) * 100 : 0;
                  const isProfit = pnl >= 0;

                  return (
                    <div
                      key={pos.id}
                      className="p-3 bg-[#191c1f] rounded-xl border border-[#272a2d] shadow-sm flex flex-col gap-2 font-mono"
                    >
                      {/* Top Row: Symbol, Side, Leverage & PnL */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                              pos.side === 'long'
                                ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                                : 'bg-[#ff3b4a]/20 text-[#ff3b4a] border border-[#ff3b4a]/40'
                            }`}
                          >
                            {pos.side.toUpperCase()} {pos.leverage}x
                          </span>
                          <span className="text-[#fff8f1] font-bold text-xs">{pos.symbol}</span>
                          <span className="text-[#99907f] text-[10px]">
                            ({pos.size.toFixed(3)} {pos.symbol.split('/')[0]})
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-extrabold text-xs ${
                              isProfit ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                            }`}
                          >
                            {isProfit ? '+' : ''}${pnl.toFixed(2)} ({isProfit ? '+' : ''}{roe.toFixed(2)}%)
                          </span>
                          <button
                            onClick={() => handleSharePnL(pos)}
                            className="p-1 text-[#99907f] hover:text-[#f6be16] hover:bg-[#272a2d] rounded cursor-pointer"
                            title="Share PnL Card"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Status Badges */}
                      {(trailingEngineMap[pos.id]?.isTp1Locked || trailingEngineMap[pos.id]?.isTrailingEnabled) && (
                        <div className="flex items-center gap-2">
                          {trailingEngineMap[pos.id]?.isTp1Locked && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#00ff94] bg-[#00ff94]/10 px-2 py-0.5 rounded border border-[#00ff94]/30">
                              <Lock className="w-2.5 h-2.5" />
                              <span>50% Profit Locked • SL at Cost</span>
                            </span>
                          )}
                          {trailingEngineMap[pos.id]?.isTrailingEnabled && !trailingEngineMap[pos.id]?.isTp1Locked && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-[#f6be16] bg-[#f6be16]/10 px-2 py-0.5 rounded border border-[#f6be16]/30 animate-pulse">
                              <Zap className="w-2.5 h-2.5" />
                              <span>AI Trailing SL Active (1.5%)</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Key Price Metrics Grid */}
                      <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-[10px]">
                        <div>
                          <span className="text-[#99907f] block text-[9px]">Entry</span>
                          <span className="text-[#d0c5b3] font-bold">${pos.entryPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[#99907f] block text-[9px]">Mark</span>
                          <span className="text-[#fff8f1] font-bold">${pos.markPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[#99907f] block text-[9px]">Est. Liq</span>
                          <span className="text-[#ff3b4a] font-bold">${pos.liquidationPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[#99907f] block text-[9px]">Margin</span>
                          <span className="text-[#ffd87f] font-bold">${pos.margin.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Action Buttons: 1-Click Lock 50%, Trail SL, Close */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        <button
                          onClick={() => handleLockTp1(pos)}
                          className={`py-2 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            trailingEngineMap[pos.id]?.isTp1Locked
                              ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                              : 'bg-[#272a2d] hover:bg-[#00ff94]/20 text-[#ffd87f] hover:text-[#00ff94] border border-[#323538]'
                          }`}
                        >
                          <Lock className="w-3 h-3" />
                          <span>{trailingEngineMap[pos.id]?.isTp1Locked ? 'Locked' : 'Lock 50% TP'}</span>
                        </button>

                        <button
                          onClick={() => toggleTrailingEngine(pos.id)}
                          className={`py-2 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            trailingEngineMap[pos.id]?.isTrailingEnabled
                              ? 'bg-[#f6be16]/20 text-[#f6be16] border border-[#f6be16]/40'
                              : 'bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1] border border-[#323538]'
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>{trailingEngineMap[pos.id]?.isTrailingEnabled ? 'Trailing ON' : 'Trail SL'}</span>
                        </button>

                        <button
                          onClick={() => handleBookProfit(pos, pnl)}
                          className={`py-2 rounded font-black transition-all cursor-pointer text-[11px] flex items-center justify-center gap-1 ${
                            isProfit
                              ? 'bg-[#00ff94] text-[#002111] hover:bg-[#40e397] shadow-[0_0_12px_rgba(0,255,148,0.4)] animate-pulse'
                              : 'bg-[#ff3b4a]/20 hover:bg-[#ff3b4a] text-[#ff3b4a] hover:text-[#fff8f1] border border-[#ff3b4a]/40'
                          }`}
                        >
                          {isProfit ? (
                            <span>💰 Book Profit (+${pnl.toFixed(2)})</span>
                          ) : (
                            <span>Close</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (>=md) */}
              <table className="hidden md:table w-full text-left border-collapse">
                <thead>
                  <tr className="text-[#99907f] text-[10px] uppercase border-b border-[#272a2d] bg-[#111417]">
                    <th className="py-2 px-3 font-normal">Symbol / Side</th>
                    <th className="py-2 px-3 font-normal">Size</th>
                    <th className="py-2 px-3 font-normal">Entry Price</th>
                    <th className="py-2 px-3 font-normal">Mark Price</th>
                    <th className="py-2 px-3 font-normal">Est. Liq Price</th>
                    <th className="py-2 px-3 font-normal">Margin</th>
                    <th className="py-2 px-3 font-normal">Unrealized PnL (ROE %)</th>
                    <th className="py-2 px-3 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#272a2d]">
                  {positions.map((pos) => {
                    const pnl =
                      pos.side === 'long'
                        ? (pos.markPrice - pos.entryPrice) * pos.size
                        : (pos.entryPrice - pos.markPrice) * pos.size;
                    const roe = pos.margin > 0 ? (pnl / pos.margin) * 100 : 0;
                    const isProfit = pnl >= 0;

                    return (
                      <tr key={pos.id} className="hover:bg-[#191c1f]/60 transition-colors">
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                pos.side === 'long'
                                  ? 'bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/30'
                                  : 'bg-[#ff3b4a]/15 text-[#ff3b4a] border border-[#ff3b4a]/30'
                              }`}
                            >
                              {pos.side.toUpperCase()} {pos.leverage}x
                            </span>
                            <span className="text-[#fff8f1] font-bold">{pos.symbol}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-[#e1e2e7] font-medium">
                          {pos.size.toFixed(3)} {pos.symbol.split('/')[0]}
                        </td>
                        <td className="py-2 px-3 text-[#d0c5b3]">${pos.entryPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-[#fff8f1] font-bold">${pos.markPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-[#ff3b4a]">${pos.liquidationPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-[#ffd87f]">${pos.margin.toFixed(2)}</td>
                        <td className="py-2 px-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-bold ${
                                  isProfit ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                                }`}
                              >
                                {isProfit ? '+' : ''}${pnl.toFixed(2)} ({isProfit ? '+' : ''}
                                {roe.toFixed(2)}%)
                              </span>
                              <button
                                onClick={() => handleSharePnL(pos)}
                                className="p-1 text-[#99907f] hover:text-[#f6be16] hover:bg-[#272a2d] rounded cursor-pointer"
                                title="Share PnL Card"
                              >
                                <Share2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Dynamic Trailing SL / TP1 Lock Status Badge */}
                            {trailingEngineMap[pos.id]?.isTp1Locked ? (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-[#00ff94] bg-[#00ff94]/10 px-1.5 py-0.5 rounded border border-[#00ff94]/30 w-fit">
                                <Lock className="w-2.5 h-2.5" />
                                <span>50% Locked • SL at Cost</span>
                              </span>
                            ) : trailingEngineMap[pos.id]?.isTrailingEnabled ? (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-[#f6be16] bg-[#f6be16]/10 px-1.5 py-0.5 rounded border border-[#f6be16]/30 w-fit animate-pulse">
                                <Zap className="w-2.5 h-2.5" />
                                <span>AI Trailing SL Active</span>
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* 1-Click Lock 50% TP1 & Move SL to Break-Even */}
                            <button
                              onClick={() => handleLockTp1(pos)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                trailingEngineMap[pos.id]?.isTp1Locked
                                  ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                                  : 'bg-[#272a2d] hover:bg-[#00ff94]/20 text-[#ffd87f] hover:text-[#00ff94] border border-[#323538]'
                              }`}
                              title="Auto-lock 50% TP1 profit and shift Stop Loss to Entry (Risk-Free)"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>{trailingEngineMap[pos.id]?.isTp1Locked ? 'Locked' : 'Lock 50% TP'}</span>
                            </button>

                            {/* Toggle Trailing SL */}
                            <button
                              onClick={() => toggleTrailingEngine(pos.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                trailingEngineMap[pos.id]?.isTrailingEnabled
                                  ? 'bg-[#f6be16]/20 text-[#f6be16] border border-[#f6be16]/40'
                                  : 'bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1] border border-[#323538]'
                              }`}
                              title="Enable candle-by-candle Dynamic Trailing Stop Loss (1.5% ATR)"
                            >
                              <Zap className="w-2.5 h-2.5" />
                              <span>Trail</span>
                            </button>

                            <button
                              onClick={() => handleBookProfit(pos, pnl)}
                              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer text-[10px] flex items-center gap-1 ${
                                isProfit
                                  ? 'bg-[#00ff94] text-[#002111] hover:bg-[#40e397] shadow-[0_0_10px_rgba(0,255,148,0.35)]'
                                  : 'bg-[#272a2d] hover:bg-[#ff3b4a] text-[#fff8f1]'
                              }`}
                              title={isProfit ? 'Book profit now and bank gains' : 'Close position'}
                            >
                              {isProfit ? `💰 Book Profit (+${pnl.toFixed(2)})` : 'Close'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )
        )}

        {activeTab === 'orders' && (
          <div className="flex flex-col h-full">
            {/* Active Orders List Section */}
            {openOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-[#99907f] gap-2">
                <Clock className="w-6 h-6 opacity-40" />
                <span>No active open orders on CoinDCX / Binance book.</span>
                <span className="text-[10px] text-[#555a60]">Engine is monitoring book for automated triggers and AI signals.</span>
              </div>
            ) : (
              <>
                {/* Mobile Orders Card View */}
                <div className="md:hidden p-2 space-y-2 font-mono text-xs">
                  {openOrders.map((o) => (
                    <div key={o.id} className="p-3 bg-[#191c1f] rounded-xl border border-[#272a2d] flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${o.side === 'buy' ? 'bg-[#00ff94]/15 text-[#00ff94]' : 'bg-[#ff3b4a]/15 text-[#ff3b4a]'}`}>
                            {o.side.toUpperCase()}
                          </span>
                          <span className="text-[#fff8f1] font-bold">{o.symbol}</span>
                          <span className="text-[#99907f] text-[10px] uppercase">({o.type})</span>
                        </div>
                        <div className="text-[11px] text-[#e1e2e7] flex items-center gap-3">
                          <span>Price: <strong className="text-[#fff8f1]">${o.price.toFixed(2)}</strong></span>
                          <span>Amount: <strong>{o.amount.toFixed(3)}</strong></span>
                          <span>Total: <strong className="text-[#ffd87f]">${o.total.toFixed(2)}</strong></span>
                        </div>
                      </div>
                      <button
                        onClick={() => onCancelOrder(o.id)}
                        className="px-2.5 py-1 rounded bg-[#ff3b4a]/20 hover:bg-[#ff3b4a] text-[#ff3b4a] hover:text-[#fff8f1] text-xs font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>

                {/* Desktop Orders Table */}
                <table className="hidden md:table w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[#99907f] text-[10px] uppercase border-b border-[#272a2d] bg-[#111417]">
                      <th className="py-2 px-3 font-normal">Time</th>
                      <th className="py-2 px-3 font-normal">Symbol</th>
                      <th className="py-2 px-3 font-normal">Type</th>
                      <th className="py-2 px-3 font-normal">Side</th>
                      <th className="py-2 px-3 font-normal">Price</th>
                      <th className="py-2 px-3 font-normal">Amount</th>
                      <th className="py-2 px-3 font-normal">Total</th>
                      <th className="py-2 px-3 font-normal text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#272a2d]">
                    {openOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#191c1f]/60 transition-colors">
                        <td className="py-2 px-3 text-[#99907f]">
                          {new Date(o.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-3 text-[#fff8f1] font-bold">{o.symbol}</td>
                        <td className="py-2 px-3 text-[#99907f] uppercase">{o.type}</td>
                        <td className="py-2 px-3">
                          <span
                            className={
                              o.side === 'buy' ? 'text-[#00ff94] font-bold' : 'text-[#ff3b4a] font-bold'
                            }
                          >
                            {o.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[#e1e2e7]">${o.price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-[#e1e2e7]">{o.amount.toFixed(3)}</td>
                        <td className="py-2 px-3 text-[#ffd87f]">${o.total.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => onCancelOrder(o.id)}
                            className="px-2 py-0.5 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#ff3b4a] transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          orderHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-[#99907f] gap-2">
              <Clock className="w-6 h-6 opacity-40" />
              <span>No trade history recorded yet.</span>
            </div>
          ) : (
            <>
              {/* Mobile History Card View */}
              <div className="md:hidden p-2 space-y-2 font-mono text-xs">
                {orderHistory.map((h) => (
                  <div key={h.id} className="p-2.5 bg-[#191c1f] rounded-xl border border-[#272a2d] flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${h.side === 'buy' ? 'bg-[#00ff94]/15 text-[#00ff94]' : 'bg-[#ff3b4a]/15 text-[#ff3b4a]'}`}>
                          {h.side.toUpperCase()}
                        </span>
                        <span className="text-[#fff8f1] font-bold">{h.symbol}</span>
                        <span className="text-[#99907f] text-[10px]">{new Date(h.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-[11px] text-[#e1e2e7]">
                        <span>Price: <strong className="text-[#fff8f1]">${h.price.toFixed(2)}</strong></span> • <span>Size: <strong>{h.amount.toFixed(3)}</strong></span>
                        {h.realizedPnl !== undefined && (
                          <span className={`ml-2 font-bold ${h.realizedPnl >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'}`}>
                            • PnL: {h.realizedPnl >= 0 ? '+' : ''}${h.realizedPnl.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-[#00ff94] flex items-center gap-1 text-[10px] font-bold bg-[#00ff94]/10 px-2 py-1 rounded">
                      <CheckCircle className="w-3 h-3" /> FILLED
                    </span>
                  </div>
                ))}
              </div>

              {/* Desktop History Table */}
              <table className="hidden md:table w-full text-left border-collapse">
                <thead>
                  <tr className="text-[#99907f] text-[10px] uppercase border-b border-[#272a2d] bg-[#111417]">
                    <th className="py-2 px-3 font-normal">Time</th>
                    <th className="py-2 px-3 font-normal">Symbol</th>
                    <th className="py-2 px-3 font-normal">Type</th>
                    <th className="py-2 px-3 font-normal">Side</th>
                    <th className="py-2 px-3 font-normal">Exec Price</th>
                    <th className="py-2 px-3 font-normal">Executed Size</th>
                    <th className="py-2 px-3 font-normal">Realized PnL</th>
                    <th className="py-2 px-3 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#272a2d]">
                  {orderHistory.map((h) => (
                    <tr key={h.id} className="hover:bg-[#191c1f]/60 transition-colors">
                      <td className="py-2 px-3 text-[#99907f]">
                        {new Date(h.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 text-[#fff8f1] font-bold">{h.symbol}</td>
                      <td className="py-2 px-3 text-[#99907f] uppercase">{h.type}</td>
                      <td className="py-2 px-3">
                        <span
                          className={
                            h.side === 'buy' ? 'text-[#00ff94] font-bold' : 'text-[#ff3b4a] font-bold'
                          }
                        >
                          {h.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#e1e2e7]">${h.price.toFixed(2)}</td>
                      <td className="py-2 px-3 text-[#e1e2e7]">{h.amount.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono text-xs">
                        {h.realizedPnl !== undefined ? (
                          <span className={`font-bold ${h.realizedPnl >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'}`}>
                            {h.realizedPnl >= 0 ? '+' : ''}${h.realizedPnl.toFixed(2)}
                            {h.pnlPercent !== undefined && ` (${h.pnlPercent >= 0 ? '+' : ''}${h.pnlPercent.toFixed(1)}%)`}
                          </span>
                        ) : (
                          <span className="text-[#99907f]">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[#00ff94] flex items-center gap-1 font-bold">
                          <CheckCircle className="w-3 h-3" />
                          FILLED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )
        )}

        {activeTab === 'signals' && (
          <div className="p-3 space-y-3">
            {/* Auto-Execution Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-[#15181b] border border-[#272a2d]">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${autoExecutionEnabled ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' : 'bg-[#99907f]'}`} />
                <span className="text-xs font-bold text-[#fff8f1]">
                  AUTONOMOUS AUTO ENTRY & EXIT ENGINE:
                </span>
                <span className={`text-xs font-mono font-bold ${autoExecutionEnabled ? 'text-emerald-400' : 'text-[#99907f]'}`}>
                  {autoExecutionEnabled ? 'ACTIVE (Taking entries automatically)' : 'MANUAL (Click to execute)'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onToggleAutoExecution && (
                  <button
                    onClick={onToggleAutoExecution}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      autoExecutionEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-[#272a2d] hover:bg-[#32363a] text-[#fff8f1] border-[#37393d]'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-emerald-400 fill-current" />
                    <span>{autoExecutionEnabled ? 'Disable Auto-Trade' : 'Turn ON Auto-Trade'}</span>
                  </button>
                )}

                {onOpenAutoAlertsModal && (
                  <button
                    onClick={onOpenAutoAlertsModal}
                    className="px-2 py-1 rounded text-[11px] bg-[#1c1f23] hover:bg-[#272a2d] text-[#d0c5b3] border border-[#272a2d] transition-colors cursor-pointer"
                  >
                    Rules / Settings
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiSignals.map((sig) => (
              <div
                key={sig.id}
                className="bg-[#191c1f] p-3 rounded-lg border border-[#272a2d] hover:border-[#00ff94]/60 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          sig.side === 'LONG'
                            ? 'bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/30'
                            : 'bg-[#ff3b4a]/15 text-[#ff3b4a] border border-[#ff3b4a]/30'
                        }`}
                      >
                        {sig.side} {sig.recommendedLeverage}x
                      </span>
                      <span className="text-[#f6be16] font-bold">{sig.symbol}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#00ff94]/15 text-[#00ff94] font-bold border border-[#00ff94]/30">
                        {sig.confidence}%
                      </span>
                      <span className="text-[10px] text-[#ffd87f] font-bold">{sig.riskReward}</span>
                    </div>
                  </div>

                  <h4 className="text-[#fff8f1] font-bold text-xs mb-1 line-clamp-1">{sig.title}</h4>
                  <p className="text-[#99907f] text-[10px] leading-relaxed mb-2 line-clamp-2">{sig.description}</p>

                  {/* Pricing Matrix */}
                  <div className="p-2 bg-[#111417] rounded border border-[#272a2d] mb-2 space-y-1.5 text-[9px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#99907f] flex items-center gap-1">
                        <Target className="w-2.5 h-2.5 text-[#f6be16]" />
                        Entry Price:
                      </span>
                      <span className="text-[#ffd87f] font-bold">${sig.entryPrice}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-[#272a2d]">
                      <div>
                        <span className="text-[#99907f] block text-[8px]">Target 1</span>
                        <span className="text-[#00ff94] font-bold">${sig.target1}</span>
                      </div>
                      <div>
                        <span className="text-[#99907f] block text-[8px]">Target 2</span>
                        <span className="text-[#00ff94] font-bold">${sig.target2}</span>
                      </div>
                      <div>
                        <span className="text-[#99907f] block text-[8px]">Stop Loss</span>
                        <span className="text-[#ff3b4a] font-bold">${sig.stopLoss}</span>
                      </div>
                    </div>
                  </div>

                  {/* Technical Support Tag */}
                  {sig.technicalSupport && (
                    <div className="flex items-center justify-between text-[9px] text-[#99907f] mb-2 px-1">
                      <span>RSI: <strong className="text-[#00ff94]">{sig.technicalSupport.rsi}</strong></span>
                      <span>EMA: <strong className="text-[#e1e2e7]">{sig.technicalSupport.emaTrend.split(' ')[0]}</strong></span>
                      <span>ATR: <strong className="text-[#ffd87f]">${sig.technicalSupport.atr}</strong></span>
                    </div>
                  )}
                </div>

                {onExecuteSignal && (
                  <button
                    onClick={() => onExecuteSignal(sig)}
                    className="w-full py-1.5 bg-[#00ff94] hover:bg-[#40e397] text-[#002111] font-bold rounded flex items-center justify-center gap-1 transition-colors cursor-pointer text-[10px] uppercase tracking-wider"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Auto-Execute Trade</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Share PnL Modal */}
      {shareModalPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#111417] border border-[#f6be16] rounded-lg p-6 max-w-sm w-full text-center relative shadow-[0_0_40px_rgba(246,190,22,0.3)]">
            <button
              onClick={() => setShareModalPos(null)}
              className="absolute top-3 right-3 text-[#99907f] hover:text-[#fff8f1] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-[#f6be16] font-bold tracking-tight text-lg">LUMINA TRADE</span>
            </div>

            <div className="text-xs text-[#99907f] uppercase font-mono">OBSIDIAN TERMINAL POSITION</div>
            <div className="text-xl font-bold text-[#fff8f1] mt-1 mb-4">{shareModalPos.symbol}</div>

            {(() => {
              const pnl =
                shareModalPos.side === 'long'
                  ? (shareModalPos.markPrice - shareModalPos.entryPrice) * shareModalPos.size
                  : (shareModalPos.entryPrice - shareModalPos.markPrice) * shareModalPos.size;
              const roe = shareModalPos.margin > 0 ? (pnl / shareModalPos.margin) * 100 : 0;
              const isProfit = pnl >= 0;

              return (
                <div className="p-4 bg-[#191c1f] rounded border border-[#272a2d] mb-4">
                  <div
                    className={`text-3xl font-extrabold tracking-tight ${
                      isProfit ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                    }`}
                  >
                    {isProfit ? '+' : ''}
                    {roe.toFixed(2)}%
                  </div>
                  <div className="text-sm font-bold text-[#fff8f1] mt-1">
                    {isProfit ? '+' : ''}${pnl.toFixed(2)} USDT
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-2 text-left text-[10px] text-[#99907f] mb-4 font-mono">
              <div>Entry: ${shareModalPos.entryPrice.toFixed(2)}</div>
              <div>Mark: ${shareModalPos.markPrice.toFixed(2)}</div>
              <div>Lev: {shareModalPos.leverage}x {shareModalPos.side.toUpperCase()}</div>
              <div>Margin: ${shareModalPos.margin.toFixed(2)}</div>
            </div>

            <button
              onClick={() => setShareModalPos(null)}
              className="w-full py-2 bg-[#f6be16] hover:bg-[#ffd87f] text-[#0b0e11] font-bold rounded text-xs transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
