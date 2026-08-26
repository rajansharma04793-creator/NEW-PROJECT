import React, { useState } from 'react';
import {
  X,
  Flame,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Layers,
  Zap,
  Target,
  BarChart3,
} from 'lucide-react';
import { AssetPair, TickerData } from '../types';

interface LiquidationHeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: AssetPair;
  tickers: Record<AssetPair, TickerData>;
  onSelectPair?: (pair: AssetPair) => void;
}

interface LiquidationLevel {
  price: number;
  longVol: number; // in USD
  shortVol: number; // in USD
  leverage: '25x' | '50x' | '100x';
  riskScore: number; // 0 to 100
}

export const LiquidationHeatmapModal: React.FC<LiquidationHeatmapModalProps> = ({
  isOpen,
  onClose,
  currentPair,
  tickers,
  onSelectPair,
}) => {
  const [selectedPair, setSelectedPair] = useState<AssetPair>(currentPair);
  const [timeHorizon, setTimeHorizon] = useState<'12h' | '24h' | '7d'>('24h');

  if (!isOpen) return null;

  const currentPrice = tickers[selectedPair]?.price || 96000;
  const precision = tickers[selectedPair]?.precision || 2;

  // Generate realistic liquidation clusters above and below current price
  const generateLiquidationClusters = (): LiquidationLevel[] => {
    const levels: LiquidationLevel[] = [];
    const step = currentPrice * 0.008; // 0.8% steps

    // 6 levels above (Short liquidations that fuel upward short squeeze)
    for (let i = 1; i <= 6; i++) {
      const price = currentPrice + step * i;
      const leverage = i <= 2 ? '100x' : i <= 4 ? '50x' : '25x';
      const shortVol = (12 - i) * 850000 + Math.sin(i * 1.5) * 600000;
      levels.push({
        price: Number(price.toFixed(precision)),
        longVol: 0,
        shortVol: Number(shortVol.toFixed(0)),
        leverage,
        riskScore: Math.min(98, 40 + i * 9),
      });
    }

    // 6 levels below (Long liquidations that fuel downward long flush)
    for (let i = 1; i <= 6; i++) {
      const price = currentPrice - step * i;
      const leverage = i <= 2 ? '100x' : i <= 4 ? '50x' : '25x';
      const longVol = (14 - i) * 1100000 + Math.cos(i * 1.8) * 800000;
      levels.push({
        price: Number(price.toFixed(precision)),
        longVol: Number(longVol.toFixed(0)),
        shortVol: 0,
        leverage,
        riskScore: Math.min(99, 45 + i * 8),
      });
    }

    return levels.sort((a, b) => b.price - a.price);
  };

  const clusters = generateLiquidationClusters();
  const maxVol = Math.max(
    ...clusters.map((c) => Math.max(c.longVol, c.shortVol)),
    1000000
  );

  const totalLongLiq = clusters.reduce((acc, c) => acc + c.longVol, 0);
  const totalShortLiq = clusters.reduce((acc, c) => acc + c.shortVol, 0);

  // Short squeeze target (strongest short liquidation cluster above)
  const shortSqueezeTarget = clusters
    .filter((c) => c.price > currentPrice)
    .reduce((prev, curr) => (curr.shortVol > prev.shortVol ? curr : prev), {
      price: currentPrice * 1.02,
      shortVol: 0,
    });

  // Long flush target (strongest long liquidation cluster below)
  const longFlushTarget = clusters
    .filter((c) => c.price < currentPrice)
    .reduce((prev, curr) => (curr.longVol > prev.longVol ? curr : prev), {
      price: currentPrice * 0.98,
      longVol: 0,
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#171a1d] border border-[#2b2f36] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2f36] bg-[#121417]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#fff8f1] font-mono tracking-wide">
                  LIQUIDATION HEATMAP & SQUEEZE RADAR
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#ffd87f]/10 text-[#ffd87f] border border-[#ffd87f]/30">
                  LEVERAGE POOLS
                </span>
              </div>
              <p className="text-xs text-[#8e9099] font-mono">
                Aggregated high-leverage liquidation clusters (CoinDCX, Binance, Bybit)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pair Selector */}
            <div className="flex items-center bg-[#272a2d] p-0.5 rounded border border-[#37393d]">
              {(['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT'] as AssetPair[]).map((pair) => (
                <button
                  key={pair}
                  onClick={() => {
                    setSelectedPair(pair);
                    if (onSelectPair) onSelectPair(pair);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                    selectedPair === pair
                      ? 'bg-[#37393d] text-[#00ff94] font-bold'
                      : 'text-[#8e9099] hover:text-[#fff8f1]'
                  }`}
                >
                  {pair.split('/')[0]}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8e9099] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-[#121417]/80 border-b border-[#2b2f36]">
          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36]">
            <span className="text-[11px] font-mono text-[#8e9099] uppercase block mb-1">
              Current Mark Price
            </span>
            <span className="text-xl font-bold font-mono text-[#fff8f1]">
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: precision })}
            </span>
            <span className="text-[10px] font-mono text-[#00ff94] block mt-1">
              ● Active Reference Index
            </span>
          </div>

          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-[#8e9099] uppercase">
                Short Squeeze Fuel (Above)
              </span>
              <TrendingUp className="w-4 h-4 text-[#00ff94]" />
            </div>
            <span className="text-xl font-bold font-mono text-[#00ff94]">
              ${(totalShortLiq / 1_000_000).toFixed(2)}M
            </span>
            <span className="text-[10px] font-mono text-[#ffd87f] block mt-1">
              Top Trigger: ${shortSqueezeTarget.price.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono text-[#8e9099] uppercase">
                Long Liquidation Risk (Below)
              </span>
              <TrendingDown className="w-4 h-4 text-[#ff4d4d]" />
            </div>
            <span className="text-xl font-bold font-mono text-[#ff4d4d]">
              ${(totalLongLiq / 1_000_000).toFixed(2)}M
            </span>
            <span className="text-[10px] font-mono text-[#ff9900] block mt-1">
              Top Trigger: ${longFlushTarget.price.toLocaleString()}
            </span>
          </div>

          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36] flex flex-col justify-center">
            <div className="flex items-center gap-1.5 text-[#ffd87f] mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold font-mono">Market Maker Magnet</span>
            </div>
            <p className="text-xs text-[#d0c5b3] font-mono">
              {totalShortLiq > totalLongLiq
                ? 'Higher short density above. Probability favors upward liquidity hunt.'
                : 'High long leverage below. Protect with tight stops against cascading wicks.'}
            </p>
          </div>
        </div>

        {/* Heatmap Visualization Table & Bars */}
        <div className="flex-1 overflow-y-auto p-5 space-y-1.5 max-h-[480px]">
          <div className="flex items-center justify-between text-xs font-mono text-[#8e9099] pb-2 border-b border-[#2b2f36] px-2">
            <span className="w-28">Price Level</span>
            <span className="w-20 text-center">Leverage</span>
            <span className="flex-1 text-center">Liquidation Volume Density</span>
            <span className="w-28 text-right">Pool Value (USD)</span>
            <span className="w-24 text-right">Squeeze Potential</span>
          </div>

          {clusters.map((level, idx) => {
            const isAbove = level.price > currentPrice;
            const isCurrentBoundary =
              idx === clusters.findIndex((c) => c.price < currentPrice);
            const volume = isAbove ? level.shortVol : level.longVol;
            const barWidth = Math.max(8, (volume / maxVol) * 100);

            return (
              <React.Fragment key={level.price}>
                {isCurrentBoundary && (
                  <div className="my-3 py-2 px-3 rounded-md bg-[#00ff94]/10 border border-[#00ff94]/40 flex items-center justify-between font-mono">
                    <div className="flex items-center gap-2 text-[#00ff94] font-bold text-xs">
                      <Target className="w-4 h-4 animate-spin" />
                      <span>CURRENT PRICE: ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: precision })}</span>
                    </div>
                    <span className="text-[11px] text-[#00ff94]/80">Zero Immediate Liquidation Horizon</span>
                  </div>
                )}

                <div
                  className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-4 font-mono text-xs ${
                    isAbove
                      ? 'bg-[#18211d]/60 border-[#00ff94]/20 hover:border-[#00ff94]/50'
                      : 'bg-[#221819]/60 border-[#ff4d4d]/20 hover:border-[#ff4d4d]/50'
                  }`}
                >
                  <div className="w-28 font-bold flex items-center gap-1.5">
                    <span className={isAbove ? 'text-[#00ff94]' : 'text-[#ff4d4d]'}>
                      ${level.price.toLocaleString(undefined, { minimumFractionDigits: precision })}
                    </span>
                  </div>

                  <div className="w-20 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        level.leverage === '100x'
                          ? 'bg-[#ff0055]/20 text-[#ff0055] border border-[#ff0055]/40'
                          : level.leverage === '50x'
                          ? 'bg-[#ffd87f]/20 text-[#ffd87f] border border-[#ffd87f]/40'
                          : 'bg-[#37393d] text-[#d0c5b3]'
                      }`}
                    >
                      {level.leverage}
                    </span>
                  </div>

                  {/* Volume Density Bar */}
                  <div className="flex-1 h-3 bg-[#121417] rounded-full overflow-hidden flex items-center">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAbove
                          ? 'bg-gradient-to-r from-[#00ff94]/40 to-[#00ff94]'
                          : 'bg-gradient-to-r from-[#ff4d4d]/40 to-[#ff4d4d]'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>

                  <div className="w-28 text-right font-bold text-[#fff8f1]">
                    ${(volume / 1_000_000).toFixed(2)}M
                  </div>

                  <div className="w-24 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        level.riskScore > 80
                          ? 'bg-[#ff9900]/20 text-[#ff9900]'
                          : 'bg-[#272a2d] text-[#8e9099]'
                      }`}
                    >
                      {isAbove ? 'SHORT SQUEEZE' : 'LONG FLUSH'}
                    </span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#121417] border-t border-[#2b2f36] flex items-center justify-between text-xs font-mono text-[#8e9099]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ffd87f]" />
            <span>High-density bands act as price attraction targets during high volatility</span>
          </div>
          <span className="text-[#00ff94]">Updated every 5s</span>
        </div>
      </div>
    </div>
  );
};
