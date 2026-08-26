import React, { useState } from 'react';
import { Position, Order, AISignal } from '../types';
import { X, CheckCircle, Clock, ShieldCheck, Share2, Sparkles, TrendingUp, Play, Target, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PositionsTableProps {
  positions: Position[];
  openOrders: Order[];
  orderHistory: Order[];
  aiSignals: AISignal[];
  onClosePosition: (id: string) => void;
  onCancelOrder: (id: string) => void;
  onExecuteSignal?: (signal: AISignal) => void;
}

export const PositionsTable: React.FC<PositionsTableProps> = ({
  positions,
  openOrders,
  orderHistory,
  aiSignals,
  onClosePosition,
  onCancelOrder,
  onExecuteSignal,
}) => {
  const [activeTab, setActiveTab] = useState<
    'positions' | 'orders' | 'history' | 'signals'
  >('positions');

  const [shareModalPos, setShareModalPos] = useState<Position | null>(null);

  const handleSharePnL = (pos: Position) => {
    setShareModalPos(pos);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f6be16', '#00ff94', '#fff8f1'],
    });
  };

  return (
    <div
      id="positions-bottom-panel"
      className="flex flex-col h-full bg-[#111417] border-t border-[#272a2d] font-mono text-[11px] select-none"
    >
      {/* Tabs Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#191c1f] border-b border-[#272a2d] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-4 shrink-0">
          <button
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
            onClick={() => setActiveTab('signals')}
            className={`pb-1 border-b-2 font-bold transition-colors flex items-center gap-1 cursor-pointer ${
              activeTab === 'signals'
                ? 'border-[#00ff94] text-[#00ff94]'
                : 'border-transparent text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            <Sparkles className="w-3 h-3 text-[#00ff94]" />
            <span>AI Signals ({aiSignals.length})</span>
          </button>
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
            <table className="w-full text-left border-collapse">
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
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => onClosePosition(pos.id)}
                          className="px-2 py-0.5 rounded bg-[#272a2d] hover:bg-[#ff3b4a] text-[#fff8f1] transition-colors cursor-pointer"
                        >
                          Market Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

        {activeTab === 'orders' && (
          openOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-[#99907f] gap-2">
              <Clock className="w-6 h-6 opacity-40" />
              <span>No open orders.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
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
          )
        )}

        {activeTab === 'history' && (
          orderHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-[#99907f] gap-2">
              <Clock className="w-6 h-6 opacity-40" />
              <span>No trade history recorded yet.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[#99907f] text-[10px] uppercase border-b border-[#272a2d] bg-[#111417]">
                  <th className="py-2 px-3 font-normal">Time</th>
                  <th className="py-2 px-3 font-normal">Symbol</th>
                  <th className="py-2 px-3 font-normal">Type</th>
                  <th className="py-2 px-3 font-normal">Side</th>
                  <th className="py-2 px-3 font-normal">Exec Price</th>
                  <th className="py-2 px-3 font-normal">Executed Size</th>
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
          )
        )}

        {activeTab === 'signals' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
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
