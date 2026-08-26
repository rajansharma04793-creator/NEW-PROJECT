import React, { useState } from 'react';
import {
  X,
  Cpu,
  Layers,
  Clock,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { AssetPair, OrderSide } from '../types';

interface AlgorithmicSlicerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: AssetPair;
  currentPrice: number;
  balance: number;
  precision: number;
  onExecuteOrders: (
    orders: Array<{
      symbol: AssetPair;
      type: 'limit' | 'market';
      side: OrderSide;
      price: number;
      amount: number;
      leverage: number;
      takeProfit?: number;
      stopLoss?: number;
    }>
  ) => void;
}

export const AlgorithmicSlicerModal: React.FC<AlgorithmicSlicerModalProps> = ({
  isOpen,
  onClose,
  currentPair,
  currentPrice,
  balance,
  precision,
  onExecuteOrders,
}) => {
  const [algoMode, setAlgoMode] = useState<'twap' | 'dca_ladder'>('twap');
  const [side, setSide] = useState<OrderSide>('buy');
  const [totalCapitalUsd, setTotalCapitalUsd] = useState<number>(1000);
  const [leverage, setLeverage] = useState<number>(10);

  // TWAP parameters
  const [twapDurationMinutes, setTwapDurationMinutes] = useState<number>(15);
  const [twapSlices, setTwapSlices] = useState<number>(5);
  const [antiMevJitter, setAntiMevJitter] = useState<boolean>(true);

  // DCA Ladder parameters
  const [ladderTiers, setLadderTiers] = useState<number>(4);
  const [stepPercentage, setStepPercentage] = useState<number>(1.2);
  const [volumeWeighting, setVolumeWeighting] = useState<'equal' | 'pyramid' | 'fibonacci'>('pyramid');

  if (!isOpen) return null;

  const totalPositionSize = (totalCapitalUsd * leverage) / (currentPrice || 1);

  // Calculate generated orders preview
  const generatePreview = () => {
    if (algoMode === 'twap') {
      const sliceAmount = totalPositionSize / twapSlices;
      const intervalSec = Math.round((twapDurationMinutes * 60) / twapSlices);
      const orders = [];

      for (let i = 1; i <= twapSlices; i++) {
        // slight price variation simulation
        const priceVar = antiMevJitter ? (Math.random() - 0.5) * 0.001 * currentPrice : 0;
        const targetPrice = Number((currentPrice + priceVar).toFixed(precision));
        orders.push({
          sliceNumber: i,
          price: targetPrice,
          amount: Number(sliceAmount.toFixed(4)),
          valueUsd: Number((sliceAmount * targetPrice).toFixed(2)),
          scheduledDelay: `+${(i - 1) * intervalSec}s`,
          type: 'market' as const,
        });
      }
      return orders;
    } else {
      // DCA Ladder
      const orders = [];
      let weights: number[] = [];

      if (volumeWeighting === 'equal') {
        weights = Array(ladderTiers).fill(1 / ladderTiers);
      } else if (volumeWeighting === 'pyramid') {
        // 10%, 20%, 30%, 40%
        const raw = Array.from({ length: ladderTiers }, (_, i) => i + 1);
        const sum = raw.reduce((a, b) => a + b, 0);
        weights = raw.map((w) => w / sum);
      } else {
        // Fibonacci weights: 1, 2, 3, 5, 8
        const fib = [1, 2, 3, 5, 8, 13].slice(0, ladderTiers);
        const sum = fib.reduce((a, b) => a + b, 0);
        weights = fib.map((w) => w / sum);
      }

      for (let i = 0; i < ladderTiers; i++) {
        const offsetMultiplier = side === 'buy' ? 1 - ((i + 1) * stepPercentage) / 100 : 1 + ((i + 1) * stepPercentage) / 100;
        const targetPrice = Number((currentPrice * offsetMultiplier).toFixed(precision));
        const amount = Number((totalPositionSize * weights[i]).toFixed(4));
        orders.push({
          sliceNumber: i + 1,
          price: targetPrice,
          amount,
          valueUsd: Number((amount * targetPrice).toFixed(2)),
          scheduledDelay: `Limit @ ${(offsetMultiplier >= 1 ? '+' : '')}${(((offsetMultiplier - 1) * 100)).toFixed(1)}%`,
          type: 'limit' as const,
        });
      }
      return orders;
    }
  };

  const previewOrders = generatePreview();

  const handleLaunchExecution = () => {
    const formattedOrders = previewOrders.map((o) => ({
      symbol: currentPair,
      type: o.type,
      side,
      price: o.price,
      amount: o.amount,
      leverage,
      takeProfit: side === 'buy' ? o.price * 1.04 : o.price * 0.96,
      stopLoss: side === 'buy' ? o.price * 0.975 : o.price * 1.025,
    }));

    onExecuteOrders(formattedOrders);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#171a1d] border border-[#2b2f36] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2f36] bg-[#121417]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ffd87f]/10 border border-[#ffd87f]/30 text-[#ffd87f]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#fff8f1] font-mono tracking-wide">
                  ALGORITHMIC ORDER SLICER (TWAP & DCA)
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#00ff94]/10 text-[#00ff94] border border-[#00ff94]/30">
                  INSTITUTIONAL EXECUTION
                </span>
              </div>
              <p className="text-xs text-[#8e9099] font-mono">
                Minimize market impact, bypass predatory MEV bots, and scale in smoothly
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

        {/* Algorithm Strategy Selector Tabs */}
        <div className="flex border-b border-[#2b2f36] bg-[#121417]">
          <button
            onClick={() => setAlgoMode('twap')}
            className={`flex-1 py-3 px-6 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              algoMode === 'twap'
                ? 'border-[#ffd87f] text-[#ffd87f] bg-[#1c2024]'
                : 'border-transparent text-[#8e9099] hover:text-[#fff8f1]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>TWAP (Time-Weighted Average Price)</span>
          </button>
          <button
            onClick={() => setAlgoMode('dca_ladder')}
            className={`flex-1 py-3 px-6 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              algoMode === 'dca_ladder'
                ? 'border-[#00ff94] text-[#00ff94] bg-[#1c2024]'
                : 'border-transparent text-[#8e9099] hover:text-[#fff8f1]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>DCA Scale-In Ladder (Tiered Accumulation)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* Controls Form (Left 5 Cols) */}
          <div className="md:col-span-5 p-6 border-r border-[#2b2f36] space-y-5 bg-[#14171a]">
            {/* Side Selection */}
            <div>
              <label className="text-[11px] font-mono text-[#8e9099] block mb-1.5">
                EXECUTION DIRECTION
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSide('buy')}
                  className={`py-2 rounded font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    side === 'buy'
                      ? 'bg-[#00ff94] text-[#121417]'
                      : 'bg-[#272a2d] text-[#8e9099] hover:text-[#fff8f1]'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setSide('sell')}
                  className={`py-2 rounded font-mono text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                    side === 'sell'
                      ? 'bg-[#ff4d4d] text-[#121417]'
                      : 'bg-[#272a2d] text-[#8e9099] hover:text-[#fff8f1]'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  SELL / SHORT
                </button>
              </div>
            </div>

            {/* Total Capital (Margin) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-mono text-[#8e9099]">ALLOCATED MARGIN (USDT)</label>
                <span className="text-xs font-mono text-[#00ff94]">Avail: ${balance.toFixed(2)}</span>
              </div>
              <input
                type="number"
                value={totalCapitalUsd}
                onChange={(e) => setTotalCapitalUsd(Math.max(10, Number(e.target.value)))}
                className="w-full bg-[#1c2024] border border-[#2b2f36] rounded px-3 py-2 text-sm font-mono text-[#fff8f1] focus:outline-none focus:border-[#ffd87f]"
              />
            </div>

            {/* Leverage Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-mono text-[#8e9099]">LEVERAGE</label>
                <span className="text-xs font-mono font-bold text-[#ffd87f]">{leverage}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full accent-[#ffd87f] cursor-pointer"
              />
            </div>

            {algoMode === 'twap' ? (
              <>
                {/* TWAP Duration */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-mono text-[#8e9099]">EXECUTION TIMEFRAME</label>
                    <span className="text-xs font-mono text-[#fff8f1]">{twapDurationMinutes} mins</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 15, 30, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setTwapDurationMinutes(mins)}
                        className={`py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                          twapDurationMinutes === mins
                            ? 'bg-[#ffd87f] text-[#121417] font-bold'
                            : 'bg-[#272a2d] text-[#8e9099]'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slices count */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-mono text-[#8e9099]">NUMBER OF SUB-ORDERS (SLICES)</label>
                    <span className="text-xs font-mono font-bold text-[#ffd87f]">{twapSlices} orders</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    value={twapSlices}
                    onChange={(e) => setTwapSlices(Number(e.target.value))}
                    className="w-full accent-[#ffd87f] cursor-pointer"
                  />
                </div>

                {/* Anti-MEV Jitter */}
                <div className="flex items-center justify-between p-3 bg-[#1c2024] rounded-lg border border-[#2b2f36]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#00ff94]" />
                    <span className="text-xs font-mono text-[#fff8f1]">Anti-MEV Random Jitter</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={antiMevJitter}
                    onChange={(e) => setAntiMevJitter(e.target.checked)}
                    className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                  />
                </div>
              </>
            ) : (
              <>
                {/* DCA Ladder Tiers */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-mono text-[#8e9099]">LADDER TIERS</label>
                    <span className="text-xs font-mono font-bold text-[#00ff94]">{ladderTiers} limit orders</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[3, 4, 5, 6].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLadderTiers(t)}
                        className={`py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                          ladderTiers === t
                            ? 'bg-[#00ff94] text-[#121417] font-bold'
                            : 'bg-[#272a2d] text-[#8e9099]'
                        }`}
                      >
                        {t} Tiers
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step Percentage */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-mono text-[#8e9099]">STEP SPACING (%)</label>
                    <span className="text-xs font-mono text-[#fff8f1]">{stepPercentage}% per step</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0.3"
                    max="5.0"
                    value={stepPercentage}
                    onChange={(e) => setStepPercentage(Number(e.target.value))}
                    className="w-full bg-[#1c2024] border border-[#2b2f36] rounded px-3 py-1.5 text-sm font-mono text-[#fff8f1] focus:outline-none focus:border-[#00ff94]"
                  />
                </div>

                {/* Volume Sizing Weight */}
                <div>
                  <label className="text-[11px] font-mono text-[#8e9099] block mb-1.5">
                    VOLUME DISTRIBUTION
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'equal', label: 'Equal (1:1)' },
                      { id: 'pyramid', label: 'Pyramid (1-4)' },
                      { id: 'fibonacci', label: 'Fibonacci' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setVolumeWeighting(w.id as any)}
                        className={`py-1.5 px-2 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                          volumeWeighting === w.id
                            ? 'bg-[#00ff94] text-[#121417] font-bold'
                            : 'bg-[#272a2d] text-[#8e9099]'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sliced Orders Preview (Right 7 Cols) */}
          <div className="md:col-span-7 p-6 flex flex-col justify-between bg-[#171a1d]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-[#fff8f1] uppercase">
                  Generated Sub-Orders Breakdown ({previewOrders.length})
                </span>
                <span className="text-xs font-mono text-[#8e9099]">
                  Total Size: ${(totalCapitalUsd * leverage).toLocaleString()} USD
                </span>
              </div>

              {/* Table of slices */}
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {previewOrders.map((ord) => (
                  <div
                    key={ord.sliceNumber}
                    className="p-2.5 rounded bg-[#1c2024] border border-[#2b2f36] flex items-center justify-between font-mono text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#272a2d] text-[#ffd87f] flex items-center justify-center font-bold text-[11px]">
                        #{ord.sliceNumber}
                      </span>
                      <div>
                        <span className="font-bold text-[#fff8f1]">
                          ${ord.price.toLocaleString(undefined, { minimumFractionDigits: precision })}
                        </span>
                        <span className="text-[10px] text-[#8e9099] block">{ord.scheduledDelay}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-[#ffd87f]">
                        {ord.amount} {currentPair.split('/')[0]}
                      </span>
                      <span className="text-[10px] text-[#8e9099] block">${ord.valueUsd} USD</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Launch CTA */}
            <div className="mt-6 pt-4 border-t border-[#2b2f36]">
              <button
                onClick={handleLaunchExecution}
                className="w-full py-3 rounded-lg bg-[#00ff94] hover:bg-[#00e685] text-[#121417] font-mono font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>LAUNCH {algoMode.toUpperCase()} ORDER SLICER ({previewOrders.length} ORDERS)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
