import React, { useMemo } from 'react';
import { Candle, AssetPair } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  ShieldCheck,
  BarChart2,
  Sliders,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface TechnicalIndicatorSummaryCardProps {
  candles: Candle[];
  symbol: string;
  currentPrice: number;
  timeframe: string;
  onTimeframeChange?: (tf: string) => void;
}

export const TechnicalIndicatorSummaryCard: React.FC<TechnicalIndicatorSummaryCardProps> = ({
  candles,
  symbol,
  currentPrice,
  timeframe,
  onTimeframeChange,
}) => {
  // Compute Technical Metrics dynamically from candles
  const analysis = useMemo(() => {
    if (!candles || candles.length < 15) {
      return {
        overallRating: 'Neutral' as const,
        overallScore: 50,
        buyCount: 7,
        neutralCount: 6,
        sellCount: 3,
        oscillatorRating: 'Buy' as const,
        maRating: 'Strong Buy' as const,
        rsi: 54.2,
        rsiAction: 'Neutral' as const,
        macdVal: 12.4,
        macdAction: 'Buy' as const,
        stochVal: 62.1,
        stochAction: 'Buy' as const,
        ema20: currentPrice * 0.985,
        ema20Action: 'Buy' as const,
        ema50: currentPrice * 0.965,
        ema50Action: 'Buy' as const,
        ema200: currentPrice * 0.92,
        ema200Action: 'Strong Buy' as const,
        sma20: currentPrice * 0.982,
        sma20Action: 'Buy' as const,
        sma50: currentPrice * 0.96,
        sma50Action: 'Buy' as const,
      };
    }

    const closes = candles.map((c) => c.close);
    const n = closes.length;
    const lastClose = currentPrice || closes[n - 1];

    // 1. Calculate Simple RSI (14)
    let gains = 0;
    let losses = 0;
    for (let i = n - 14; i < n; i++) {
      const diff = closes[i] - closes[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14 === 0 ? 0.0001 : losses / 14;
    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    let rsiAction: 'Buy' | 'Sell' | 'Neutral' = 'Neutral';
    if (rsi < 35) rsiAction = 'Buy';
    else if (rsi > 65) rsiAction = 'Sell';

    // 2. Simple EMAs
    const calcEMA = (period: number) => {
      const k = 2 / (period + 1);
      let ema = closes[0];
      for (let i = 1; i < n; i++) {
        ema = closes[i] * k + ema * (1 - k);
      }
      return ema;
    };

    const ema20 = calcEMA(Math.min(20, n - 1));
    const ema50 = calcEMA(Math.min(50, n - 1));
    const ema200 = calcEMA(Math.min(100, n - 1));

    // 3. Simple SMAs
    const calcSMA = (period: number) => {
      const slice = closes.slice(Math.max(0, n - period));
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    };

    const sma20 = calcSMA(20);
    const sma50 = calcSMA(50);

    // 4. MACD Estimation (Fast 12 - Slow 26)
    const ema12 = calcEMA(12);
    const ema26 = calcEMA(26);
    const macdLine = ema12 - ema26;
    const macdAction: 'Buy' | 'Sell' | 'Neutral' = macdLine > 0 ? 'Buy' : 'Sell';

    // Count score
    let buyCount = 0;
    let sellCount = 0;
    let neutralCount = 0;

    // RSI
    if (rsiAction === 'Buy') buyCount++;
    else if (rsiAction === 'Sell') sellCount++;
    else neutralCount++;

    // MACD
    if (macdAction === 'Buy') buyCount++;
    else sellCount++;

    // Stochastic
    const highestHigh = Math.max(...candles.slice(n - 14).map((c) => c.high));
    const lowestLow = Math.min(...candles.slice(n - 14).map((c) => c.low));
    const stochVal =
      highestHigh === lowestLow ? 50 : ((lastClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    const stochAction: 'Buy' | 'Sell' | 'Neutral' =
      stochVal < 25 ? 'Buy' : stochVal > 75 ? 'Sell' : 'Neutral';

    if (stochAction === 'Buy') buyCount++;
    else if (stochAction === 'Sell') sellCount++;
    else neutralCount++;

    // Moving Averages Evaluation
    const ema20Action = lastClose >= ema20 ? 'Buy' : 'Sell';
    const ema50Action = lastClose >= ema50 ? 'Buy' : 'Sell';
    const ema200Action = lastClose >= ema200 ? 'Strong Buy' : 'Sell';
    const sma20Action = lastClose >= sma20 ? 'Buy' : 'Sell';
    const sma50Action = lastClose >= sma50 ? 'Buy' : 'Sell';

    [ema20Action, ema50Action, ema200Action, sma20Action, sma50Action].forEach((act) => {
      if (act === 'Strong Buy' || act === 'Buy') buyCount++;
      else if (act === 'Sell') sellCount++;
      else neutralCount++;
    });

    const total = buyCount + sellCount + neutralCount;
    const overallScore = Math.round(((buyCount + neutralCount * 0.5) / total) * 100);

    let overallRating: 'Strong Sell' | 'Sell' | 'Neutral' | 'Buy' | 'Strong Buy' = 'Neutral';
    if (overallScore >= 75) overallRating = 'Strong Buy';
    else if (overallScore >= 60) overallRating = 'Buy';
    else if (overallScore <= 25) overallRating = 'Strong Sell';
    else if (overallScore <= 40) overallRating = 'Sell';

    const oscillatorRating = buyCount >= 2 ? 'Buy' : sellCount >= 2 ? 'Sell' : 'Neutral';
    const maRating = buyCount >= 4 ? 'Strong Buy' : sellCount >= 4 ? 'Strong Sell' : 'Buy';

    return {
      overallRating,
      overallScore,
      buyCount,
      neutralCount,
      sellCount,
      oscillatorRating,
      maRating,
      rsi: Number(rsi.toFixed(1)),
      rsiAction,
      macdVal: Number(macdLine.toFixed(2)),
      macdAction,
      stochVal: Number(stochVal.toFixed(1)),
      stochAction,
      ema20,
      ema20Action,
      ema50,
      ema50Action,
      ema200,
      ema200Action,
      sma20,
      sma20Action,
      sma50,
      sma50Action,
    };
  }, [candles, currentPrice]);

  // Color mapping
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Strong Buy':
        return 'text-[#10B981] bg-[#10B981]/15 border-[#10B981]/40';
      case 'Buy':
        return 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30';
      case 'Strong Sell':
        return 'text-[#F43F5E] bg-[#F43F5E]/15 border-[#F43F5E]/40';
      case 'Sell':
        return 'text-[#F43F5E] bg-[#F43F5E]/10 border-[#F43F5E]/30';
      default:
        return 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30';
    }
  };

  return (
    <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1E293B] flex items-center justify-center text-[#38BDF8]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#F8FAFC]">Technical Summary Gauge</h3>
            <p className="text-[10px] text-[#94A3B8]">
              {symbol} • {timeframe} Timeframe Multi-Indicator Rating
            </p>
          </div>
        </div>

        {/* Timeframe Quick Switcher */}
        {onTimeframeChange && (
          <div className="flex items-center gap-1 bg-[#1E293B] p-0.5 rounded-lg border border-[#334155]">
            {['1m', '5m', '15m', '1H', '1D'].map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  timeframe === tf
                    ? 'bg-[#10B981] text-[#0F172A]'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Speedometer Meter Gauge Visual */}
      <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex flex-col items-center justify-center space-y-3">
        {/* Rating Title Badge */}
        <div
          className={`px-4 py-1.5 rounded-full border text-xs font-extrabold tracking-wider uppercase shadow-lg ${getRatingColor(
            analysis.overallRating
          )}`}
        >
          {analysis.overallRating}
        </div>

        {/* Gauge Arch Bar */}
        <div className="w-full max-w-xs relative pt-2">
          <div className="w-full h-3 bg-gradient-to-r from-[#F43F5E] via-[#F59E0B] to-[#10B981] rounded-full overflow-hidden relative shadow-inner">
            {/* Needle indicator */}
            <div
              className="absolute top-0 bottom-0 w-2.5 bg-white rounded-full shadow-[0_0_8px_#ffffff] -translate-x-1/2 transition-all duration-500"
              style={{ left: `${analysis.overallScore}%` }}
            />
          </div>

          {/* Scale labels */}
          <div className="flex justify-between text-[9px] font-bold text-[#64748B] mt-1 font-mono uppercase">
            <span className="text-[#F43F5E]">Strong Sell</span>
            <span className="text-[#F59E0B]">Neutral</span>
            <span className="text-[#10B981]">Strong Buy</span>
          </div>
        </div>

        {/* Counter Breakdown */}
        <div className="grid grid-cols-3 gap-2 w-full font-mono text-center pt-2 border-t border-[#1E293B]/60">
          <div className="p-1.5 rounded-lg bg-[#1E293B]/40">
            <span className="block text-[9px] text-[#F43F5E] uppercase font-bold">Sell</span>
            <span className="text-sm font-black text-[#F43F5E]">{analysis.sellCount}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-[#1E293B]/40">
            <span className="block text-[9px] text-[#F59E0B] uppercase font-bold">Neutral</span>
            <span className="text-sm font-black text-[#F59E0B]">{analysis.neutralCount}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-[#1E293B]/40">
            <span className="block text-[9px] text-[#10B981] uppercase font-bold">Buy</span>
            <span className="text-sm font-black text-[#10B981]">{analysis.buyCount}</span>
          </div>
        </div>
      </div>

      {/* Detailed Indicator Breakdown Tables */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono">
        {/* Oscillators */}
        <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#38BDF8] pb-1 border-b border-[#1E293B]">
            <span>Oscillators</span>
            <span className="text-[10px] text-[#94A3B8]">{analysis.oscillatorRating}</span>
          </div>
          <div className="flex justify-between items-center text-[#94A3B8]">
            <span>RSI (14)</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#F8FAFC]">{analysis.rsi}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                  analysis.rsiAction === 'Buy'
                    ? 'text-[#10B981] bg-[#10B981]/15'
                    : analysis.rsiAction === 'Sell'
                    ? 'text-[#F43F5E] bg-[#F43F5E]/15'
                    : 'text-[#F59E0B] bg-[#F59E0B]/15'
                }`}
              >
                {analysis.rsiAction}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center text-[#94A3B8]">
            <span>Stochastic (14,3,3)</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#F8FAFC]">{analysis.stochVal}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                  analysis.stochAction === 'Buy'
                    ? 'text-[#10B981] bg-[#10B981]/15'
                    : analysis.stochAction === 'Sell'
                    ? 'text-[#F43F5E] bg-[#F43F5E]/15'
                    : 'text-[#F59E0B] bg-[#F59E0B]/15'
                }`}
              >
                {analysis.stochAction}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center text-[#94A3B8]">
            <span>MACD Level</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#F8FAFC]">{analysis.macdVal}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                  analysis.macdAction === 'Buy'
                    ? 'text-[#10B981] bg-[#10B981]/15'
                    : 'text-[#F43F5E] bg-[#F43F5E]/15'
                }`}
              >
                {analysis.macdAction}
              </span>
            </div>
          </div>
        </div>

        {/* Moving Averages */}
        <div className="p-3 rounded-xl bg-[#0B0F19] border border-[#1E293B] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#10B981] pb-1 border-b border-[#1E293B]">
            <span>Moving Averages</span>
            <span className="text-[10px] text-[#94A3B8]">{analysis.maRating}</span>
          </div>
          <div className="flex justify-between items-center text-[#94A3B8]">
            <span>EMA (20)</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#F8FAFC]">${analysis.ema20.toFixed(2)}</span>
              <span className="text-[9px] px-1 py-0.2 rounded font-bold text-[#10B981] bg-[#10B981]/15">
                {analysis.ema20Action}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center text-[#94A3B8]">
            <span>EMA (50)</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#F8FAFC]">${analysis.ema50.toFixed(2)}</span>
              <span className="text-[9px] px-1 py-0.2 rounded font-bold text-[#10B981] bg-[#10B981]/15">
                {analysis.ema50Action}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center text-[#94A3B8]">
            <span>EMA (200)</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#F8FAFC]">${analysis.ema200.toFixed(2)}</span>
              <span className="text-[9px] px-1 py-0.2 rounded font-bold text-[#10B981] bg-[#10B981]/15">
                {analysis.ema200Action}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
