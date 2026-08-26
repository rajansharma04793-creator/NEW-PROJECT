import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  SkipForward,
  Rewind,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  CheckCircle2,
  AlertTriangle,
  History,
  Sliders,
} from 'lucide-react';
import { AssetPair, Candle, OrderSide, Position } from '../types';

interface BarReplaySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: AssetPair;
  candles: Candle[];
  precision: number;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface ReplayTrade {
  id: string;
  side: OrderSide;
  entryPrice: number;
  exitPrice?: number;
  entryIndex: number;
  exitIndex?: number;
  amount: number;
  leverage: number;
  pnlUsd: number;
  status: 'open' | 'closed';
}

export const BarReplaySimulatorModal: React.FC<BarReplaySimulatorModalProps> = ({
  isOpen,
  onClose,
  currentPair,
  candles,
  precision,
  onShowToast,
}) => {
  const [replayIndex, setReplayIndex] = useState<number>(() => Math.max(30, Math.floor(candles.length * 0.4)));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(600); // interval ms
  const [virtualBalance, setVirtualBalance] = useState<number>(10000);
  const [orderAmountUsd, setOrderAmountUsd] = useState<number>(1000);
  const [leverage, setLeverage] = useState<number>(10);
  const [trades, setTrades] = useState<ReplayTrade[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset or adjust index when candles change
  useEffect(() => {
    if (candles.length > 50 && replayIndex >= candles.length) {
      setReplayIndex(Math.floor(candles.length * 0.5));
    }
  }, [candles.length]);

  // Autoplay ticker loop
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setReplayIndex((prev) => {
        if (prev >= candles.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeedMs);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying, playbackSpeedMs, candles.length]);

  // Render Canvas Chart for Visible Replay Slice
  useEffect(() => {
    if (!isOpen || !canvasRef.current || candles.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 750);
    const height = (canvas.height = 360);

    ctx.clearRect(0, 0, width, height);

    // Visible slice of candles up to replayIndex
    const visibleCount = 45;
    const startIndex = Math.max(0, replayIndex - visibleCount + 1);
    const visibleCandles = candles.slice(startIndex, replayIndex + 1);

    if (visibleCandles.length === 0) return;

    let minPrice = Infinity;
    let maxPrice = -Infinity;
    visibleCandles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    });

    const priceRange = maxPrice - minPrice || 1;
    const candleWidth = Math.max(4, (width - 80) / visibleCount - 3);

    // Draw Grid
    ctx.strokeStyle = '#272a2d';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 70, y);
      ctx.stroke();

      const priceAtY = maxPrice - (i / 5) * priceRange;
      ctx.fillStyle = '#8e9099';
      ctx.font = '10px monospace';
      ctx.fillText(priceAtY.toFixed(precision), width - 65, y + 3);
    }

    // Draw Candlesticks
    visibleCandles.forEach((candle, idx) => {
      const x = idx * (candleWidth + 3) + 15;
      const isGreen = candle.close >= candle.open;
      const bodyTop = Math.min(candle.open, candle.close);
      const bodyBottom = Math.max(candle.open, candle.close);

      const yHigh = height - ((candle.high - minPrice) / priceRange) * (height - 40) - 20;
      const yLow = height - ((candle.low - minPrice) / priceRange) * (height - 40) - 20;
      const yOpen = height - ((candle.open - minPrice) / priceRange) * (height - 40) - 20;
      const yClose = height - ((candle.close - minPrice) / priceRange) * (height - 40) - 20;

      // Wick
      ctx.strokeStyle = isGreen ? '#00ff94' : '#ff4d4d';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, yHigh);
      ctx.lineTo(x + candleWidth / 2, yLow);
      ctx.stroke();

      // Body
      const topY = Math.min(yOpen, yClose);
      const bodyH = Math.max(2, Math.abs(yClose - yOpen));
      ctx.fillStyle = isGreen ? '#00ff94' : '#ff4d4d';
      ctx.fillRect(x, topY, candleWidth, bodyH);
    });

    // Draw current active trades entry lines on canvas
    trades.forEach((trade) => {
      if (trade.status === 'open') {
        const tradeY = height - ((trade.entryPrice - minPrice) / priceRange) * (height - 40) - 20;
        ctx.strokeStyle = trade.side === 'buy' ? '#00ff94' : '#ff4d4d';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, tradeY);
        ctx.lineTo(width - 70, tradeY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = trade.side === 'buy' ? '#00ff94' : '#ff4d4d';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(
          `${trade.side.toUpperCase()} @ ${trade.entryPrice.toFixed(precision)}`,
          width - 160,
          tradeY - 4
        );
      }
    });

    // Draw "FUTURE HIDDEN" wall line on current candle
    const lastX = (visibleCandles.length - 1) * (candleWidth + 3) + 15 + candleWidth;
    ctx.strokeStyle = '#ffd87f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lastX + 4, 0);
    ctx.lineTo(lastX + 4, height);
    ctx.stroke();

    ctx.fillStyle = '#ffd87f';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('◀ REPLAY HEAD', lastX - 90, 16);
  }, [isOpen, replayIndex, candles, precision, trades]);

  if (!isOpen) return null;

  const currentCandle = candles[replayIndex] || candles[candles.length - 1];
  const currentPrice = currentCandle?.close || 100;

  // Open simulated trade
  const handleOpenTrade = (side: OrderSide) => {
    const margin = orderAmountUsd;
    if (virtualBalance < margin) {
      if (onShowToast) onShowToast('Insufficient virtual replay balance!', 'error');
      return;
    }

    const tradeAmount = (margin * leverage) / currentPrice;
    const newTrade: ReplayTrade = {
      id: `rt-${Date.now()}`,
      side,
      entryPrice: currentPrice,
      entryIndex: replayIndex,
      amount: Number(tradeAmount.toFixed(4)),
      leverage,
      pnlUsd: 0,
      status: 'open',
    };

    setVirtualBalance((prev) => prev - margin);
    setTrades((prev) => [newTrade, ...prev]);
    if (onShowToast) onShowToast(`Opened ${side.toUpperCase()} position at $${currentPrice}!`, 'success');
  };

  // Close simulated trade
  const handleCloseTrade = (tradeId: string) => {
    setTrades((prev) =>
      prev.map((t) => {
        if (t.id !== tradeId || t.status !== 'open') return t;
        const diff = t.side === 'buy' ? currentPrice - t.entryPrice : t.entryPrice - currentPrice;
        const finalPnl = diff * t.amount;
        const marginReturn = (t.amount * t.entryPrice) / t.leverage;

        setVirtualBalance((b) => b + marginReturn + finalPnl);
        return {
          ...t,
          exitPrice: currentPrice,
          exitIndex: replayIndex,
          pnlUsd: Number(finalPnl.toFixed(2)),
          status: 'closed',
        };
      })
    );
  };

  // Calculate live unrealized PnL
  const openTrades = trades.filter((t) => t.status === 'open');
  const closedTrades = trades.filter((t) => t.status === 'closed');
  const unrealizedPnl = openTrades.reduce((acc, t) => {
    const diff = t.side === 'buy' ? currentPrice - t.entryPrice : t.entryPrice - currentPrice;
    return acc + diff * t.amount;
  }, 0);
  const realizedPnl = closedTrades.reduce((acc, t) => acc + t.pnlUsd, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#171a1d] border border-[#2b2f36] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2f36] bg-[#121417]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ffd87f]/10 border border-[#ffd87f]/30 text-[#ffd87f]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#fff8f1] font-mono tracking-wide">
                  HISTORICAL BAR REPLAY & SIMULATOR
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#ffd87f]/20 text-[#ffd87f] border border-[#ffd87f]/40 animate-pulse">
                  SIMULATION ACTIVE
                </span>
              </div>
              <p className="text-xs text-[#8e9099] font-mono">
                Rewind market conditions, step bar-by-bar, and practice paper trading without risk
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

        {/* Top Control Timeline Bar */}
        <div className="px-6 py-3 bg-[#14171a] border-b border-[#2b2f36] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReplayIndex((prev) => Math.max(30, prev - 10))}
              className="p-1.5 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#d0c5b3] transition-colors cursor-pointer"
              title="Jump back 10 bars"
            >
              <Rewind className="w-4 h-4" />
            </button>
            <button
              onClick={() => setReplayIndex((prev) => Math.max(30, prev - 1))}
              className="p-1.5 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#d0c5b3] transition-colors cursor-pointer"
              title="Step back 1 bar"
            >
              <SkipForward className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-1.5 rounded font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-[#ffd87f] text-[#121417] shadow-md'
                  : 'bg-[#00ff94] text-[#121417] hover:bg-[#00e685]'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>
            <button
              onClick={() => setReplayIndex((prev) => Math.min(candles.length - 1, prev + 1))}
              className="p-1.5 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#d0c5b3] transition-colors cursor-pointer"
              title="Step forward 1 bar"
            >
              <SkipForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => setReplayIndex((prev) => Math.min(candles.length - 1, prev + 10))}
              className="p-1.5 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#d0c5b3] transition-colors cursor-pointer"
              title="Jump forward 10 bars"
            >
              <FastForward className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setReplayIndex(Math.floor(candles.length * 0.4));
                setIsPlaying(false);
              }}
              className="p-1.5 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#8e9099] transition-colors cursor-pointer"
              title="Reset to 40%"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#8e9099]">Speed:</span>
            {[
              { label: '0.5x', speed: 1000 },
              { label: '1x', speed: 600 },
              { label: '2x', speed: 300 },
              { label: '5x', speed: 100 },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setPlaybackSpeedMs(s.speed)}
                className={`px-2 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  playbackSpeedMs === s.speed
                    ? 'bg-[#ffd87f] text-[#121417] font-bold'
                    : 'bg-[#272a2d] text-[#8e9099] hover:text-[#fff8f1]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Timeframe Position Slider */}
          <div className="flex items-center gap-3 w-full md:w-64">
            <span className="text-xs font-mono text-[#8e9099] whitespace-nowrap">
              Bar {replayIndex + 1}/{candles.length}
            </span>
            <input
              type="range"
              min="30"
              max={candles.length - 1}
              value={replayIndex}
              onChange={(e) => {
                setReplayIndex(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full accent-[#ffd87f] cursor-pointer"
            />
          </div>
        </div>

        {/* Main Canvas & Replay Chart Container */}
        <div className="p-4 bg-[#121417] relative flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2 px-2">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-bold text-[#fff8f1]">{currentPair} (Replay)</span>
              <span className="text-[#00ff94] font-bold">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: precision })}
              </span>
              <span className="text-[#8e9099]">
                Date: {currentCandle ? new Date(currentCandle.time).toLocaleString() : ''}
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-xs">
              <span className="text-[#8e9099]">
                Virtual Balance:{' '}
                <strong className="text-[#fff8f1]">${virtualBalance.toFixed(2)}</strong>
              </span>
              <span className="text-[#8e9099]">
                Unrealized:{' '}
                <strong className={unrealizedPnl >= 0 ? 'text-[#00ff94]' : 'text-[#ff4d4d]'}>
                  {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
                </strong>
              </span>
            </div>
          </div>

          <div className="w-full bg-[#171a1d] rounded-lg border border-[#2b2f36] p-2 overflow-hidden flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full" />
          </div>
        </div>

        {/* Bottom Interactive Order & Active Positions Panel */}
        <div className="grid grid-cols-1 md:grid-cols-12 border-t border-[#2b2f36] bg-[#14171a] p-4 gap-4">
          {/* Quick Execution Form (Left 5 Cols) */}
          <div className="md:col-span-5 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#fff8f1] uppercase">
                Replay Trade Entry
              </span>
              <span className="text-[11px] text-[#ffd87f]">1-Click Market Order</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[#8e9099] block mb-1">MARGIN (USDT)</label>
                <input
                  type="number"
                  value={orderAmountUsd}
                  onChange={(e) => setOrderAmountUsd(Number(e.target.value))}
                  className="w-full bg-[#1c2024] border border-[#2b2f36] rounded px-2.5 py-1 text-xs text-[#fff8f1]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#8e9099] block mb-1">LEVERAGE ({leverage}x)</label>
                <select
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full bg-[#1c2024] border border-[#2b2f36] rounded px-2.5 py-1 text-xs text-[#fff8f1]"
                >
                  <option value={1}>1x (Spot)</option>
                  <option value={5}>5x</option>
                  <option value={10}>10x</option>
                  <option value={20}>20x</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOpenTrade('buy')}
                className="py-2.5 rounded bg-[#00ff94] hover:bg-[#00e685] text-[#121417] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <TrendingUp className="w-4 h-4" />
                BUY / LONG
              </button>
              <button
                onClick={() => handleOpenTrade('sell')}
                className="py-2.5 rounded bg-[#ff4d4d] hover:bg-[#e63939] text-[#121417] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <TrendingDown className="w-4 h-4" />
                SELL / SHORT
              </button>
            </div>
          </div>

          {/* Active & Closed Positions in Replay (Right 7 Cols) */}
          <div className="md:col-span-7 font-mono max-h-[160px] overflow-y-auto space-y-2 pr-1">
            <div className="flex items-center justify-between text-xs text-[#8e9099] border-b border-[#2b2f36] pb-1">
              <span>Replay Positions ({trades.length})</span>
              <span className="text-[#00ff94]">Realized: ${realizedPnl.toFixed(2)}</span>
            </div>

            {trades.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#8e9099]">
                No trades taken in this replay session yet. Use Buy/Sell to test your thesis.
              </div>
            ) : (
              trades.map((tr) => {
                const isCurrentOpen = tr.status === 'open';
                const diff =
                  tr.side === 'buy' ? currentPrice - tr.entryPrice : tr.entryPrice - currentPrice;
                const livePnl = isCurrentOpen ? diff * tr.amount : tr.pnlUsd;

                return (
                  <div
                    key={tr.id}
                    className="p-2 rounded bg-[#1c2024] border border-[#2b2f36] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span
                        className={`font-bold mr-2 ${
                          tr.side === 'buy' ? 'text-[#00ff94]' : 'text-[#ff4d4d]'
                        }`}
                      >
                        {tr.side.toUpperCase()} {tr.leverage}X
                      </span>
                      <span className="text-[#8e9099]">In: ${tr.entryPrice.toFixed(precision)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold ${
                          livePnl >= 0 ? 'text-[#00ff94]' : 'text-[#ff4d4d]'
                        }`}
                      >
                        {livePnl >= 0 ? '+' : ''}${livePnl.toFixed(2)}
                      </span>
                      {isCurrentOpen ? (
                        <button
                          onClick={() => handleCloseTrade(tr.id)}
                          className="px-2 py-0.5 rounded bg-[#ff4d4d]/20 text-[#ff4d4d] hover:bg-[#ff4d4d] hover:text-[#121417] transition-colors text-[11px] cursor-pointer"
                        >
                          Close
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#8e9099]">CLOSED</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
