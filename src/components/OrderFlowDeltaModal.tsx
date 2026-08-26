import React, { useState } from 'react';
import {
  X,
  Layers,
  Activity,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Info,
  Maximize2,
  Minimize2,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from 'lucide-react';
import { AssetPair, Candle, TickerInfo } from '../types';

interface OrderFlowDeltaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: AssetPair;
  candles: Candle[];
  ticker: TickerInfo;
}

export const OrderFlowDeltaModal: React.FC<OrderFlowDeltaModalProps> = ({
  isOpen,
  onClose,
  currentPair,
  candles,
  ticker,
}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<'cvd' | 'open_interest' | 'funding'>('cvd');

  if (!isOpen) return null;

  // Generate realistic CVD (Cumulative Volume Delta) bars from candles
  let runningCvd = 0;
  const deltaBars = candles.slice(-25).map((c, i) => {
    const isUp = c.close >= c.open;
    const bodySize = Math.abs(c.close - c.open);
    const wickTotal = c.high - c.low;
    const buyRatio = isUp ? 0.55 + (bodySize / (wickTotal || 1)) * 0.25 : 0.45 - (bodySize / (wickTotal || 1)) * 0.25;

    const buyVol = c.volume * buyRatio;
    const sellVol = c.volume * (1 - buyRatio);
    const delta = buyVol - sellVol;
    runningCvd += delta;

    return {
      time: new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price: c.close,
      buyVol,
      sellVol,
      delta,
      cvd: runningCvd,
      isUp,
    };
  });

  const maxDeltaAbs = Math.max(...deltaBars.map((d) => Math.abs(d.delta)), 100);
  const maxCvd = Math.max(...deltaBars.map((d) => Math.abs(d.cvd)), 100);

  // Simulated Open Interest (OI)
  const baseOI = currentPair === 'BTC/USDT' ? 45200 : currentPair === 'ETH/USDT' ? 320000 : 1850000;
  const changeVal = ticker.change24h || 0;
  const currentOI = Number((baseOI + (changeVal * baseOI) / 100).toFixed(0));
  const oiChange24h = (changeVal * 1.25).toFixed(2);

  // Predicted Funding Rate
  const fundingRate = ticker.fundingRate || (changeVal >= 0 ? 0.0105 : -0.0045);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#171a1d] border border-[#2b2f36] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2f36] bg-[#121417]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#38bdf8]">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#fff8f1] font-mono tracking-wide">
                  INSTITUTIONAL ORDER FLOW & CVD DELTA
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
                  REAL-TIME ORDERFLOW
                </span>
              </div>
              <p className="text-xs text-[#8e9099] font-mono">
                Cumulative Volume Delta (CVD), Open Interest (OI) & Predicted Funding
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

        {/* Tab Selection */}
        <div className="flex border-b border-[#2b2f36] bg-[#121417]">
          <button
            onClick={() => setSelectedSubTab('cvd')}
            className={`flex-1 py-3 px-6 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              selectedSubTab === 'cvd'
                ? 'border-[#38bdf8] text-[#38bdf8] bg-[#1c2024]'
                : 'border-transparent text-[#8e9099] hover:text-[#fff8f1]'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Cumulative Volume Delta (CVD)</span>
          </button>
          <button
            onClick={() => setSelectedSubTab('open_interest')}
            className={`flex-1 py-3 px-6 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              selectedSubTab === 'open_interest'
                ? 'border-[#00ff94] text-[#00ff94] bg-[#1c2024]'
                : 'border-transparent text-[#8e9099] hover:text-[#fff8f1]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Open Interest (OI) Analysis</span>
          </button>
          <button
            onClick={() => setSelectedSubTab('funding')}
            className={`flex-1 py-3 px-6 text-xs font-mono font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
              selectedSubTab === 'funding'
                ? 'border-[#ffd87f] text-[#ffd87f] bg-[#1c2024]'
                : 'border-transparent text-[#8e9099] hover:text-[#fff8f1]'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Predicted Funding Rate Heat</span>
          </button>
        </div>

        {/* Metric Overview Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-[#14171a] border-b border-[#2b2f36]">
          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36] font-mono">
            <span className="text-[11px] text-[#8e9099] block mb-1">AGGRESSIVE BUY/SELL RATIO</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#00ff94]">56.4% Buys</span>
              <span className="text-xs text-[#8e9099]">/ 43.6% Sells</span>
            </div>
          </div>

          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36] font-mono">
            <span className="text-[11px] text-[#8e9099] block mb-1">TOTAL OPEN INTEREST</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[#fff8f1]">{currentOI.toLocaleString()}</span>
              <span
                className={`text-xs font-bold ${
                  Number(oiChange24h) >= 0 ? 'text-[#00ff94]' : 'text-[#ff4d4d]'
                }`}
              >
                {Number(oiChange24h) >= 0 ? '+' : ''}{oiChange24h}% (24h)
              </span>
            </div>
          </div>

          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36] font-mono">
            <span className="text-[11px] text-[#8e9099] block mb-1">PREDICTED FUNDING RATE</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-xl font-bold ${
                  fundingRate >= 0 ? 'text-[#ffd87f]' : 'text-[#38bdf8]'
                }`}
              >
                {fundingRate >= 0 ? '+' : ''}{(fundingRate * 100).toFixed(4)}%
              </span>
              <span className="text-xs text-[#8e9099]">8h Countdown: 03:42:15</span>
            </div>
          </div>

          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36] font-mono flex flex-col justify-center">
            <div className="flex items-center gap-1 text-[#00ff94] text-xs font-bold mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Divergence Status</span>
            </div>
            <span className="text-xs text-[#d0c5b3]">
              Bullish Absorption: Aggressive market sellers absorbed without new lower lows.
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {selectedSubTab === 'cvd' && (
            <div className="space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs text-[#8e9099] pb-2 border-b border-[#2b2f36]">
                <span className="w-20">Time</span>
                <span className="w-24 text-right">Price</span>
                <span className="flex-1 text-center">Net Aggressive Delta Volume Bar</span>
                <span className="w-28 text-right">Bar Delta</span>
                <span className="w-28 text-right">Running CVD</span>
              </div>

              {deltaBars.map((bar, idx) => {
                const isPositive = bar.delta >= 0;
                const widthPercent = Math.min(100, Math.max(8, (Math.abs(bar.delta) / maxDeltaAbs) * 100));

                return (
                  <div
                    key={idx}
                    className="p-2 rounded bg-[#1c2024] border border-[#2b2f36] flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="w-20 text-[#8e9099]">{bar.time}</span>
                    <span className="w-24 text-right font-bold text-[#fff8f1]">
                      ${bar.price.toLocaleString()}
                    </span>

                    {/* Delta visualizer bar */}
                    <div className="flex-1 h-3.5 bg-[#14171a] rounded flex items-center px-1 overflow-hidden">
                      <div
                        className={`h-2 rounded transition-all duration-300 ${
                          isPositive ? 'bg-[#00ff94]' : 'bg-[#ff4d4d]'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>

                    <span
                      className={`w-28 text-right font-bold ${
                        isPositive ? 'text-[#00ff94]' : 'text-[#ff4d4d]'
                      }`}
                    >
                      {isPositive ? '+' : ''}{bar.delta.toFixed(2)}
                    </span>

                    <span
                      className={`w-28 text-right font-bold ${
                        bar.cvd >= 0 ? 'text-[#38bdf8]' : 'text-[#f59e0b]'
                      }`}
                    >
                      {bar.cvd >= 0 ? '+' : ''}{bar.cvd.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {selectedSubTab === 'open_interest' && (
            <div className="space-y-4 font-mono text-xs max-w-3xl mx-auto">
              <div className="p-4 rounded-xl bg-[#1c2024] border border-[#00ff94]/30">
                <h3 className="text-sm font-bold text-[#00ff94] mb-2">
                  What is Open Interest (OI) telling us right now?
                </h3>
                <p className="text-[#d0c5b3] leading-relaxed">
                  Open interest has increased by <strong>{oiChange24h}%</strong> over the past 24 hours alongside price expansion. This confirms <strong>new capital entering the market (Trend Continuation)</strong> rather than just short covering.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#14171a] border border-[#2b2f36]">
                  <span className="text-[#8e9099] block mb-1">LONG POSITION SHARE</span>
                  <span className="text-2xl font-bold text-[#00ff94]">58.2%</span>
                  <span className="text-[11px] text-[#8e9099] block mt-1">Slight long bias</span>
                </div>
                <div className="p-4 rounded-lg bg-[#14171a] border border-[#2b2f36]">
                  <span className="text-[#8e9099] block mb-1">SHORT POSITION SHARE</span>
                  <span className="text-2xl font-bold text-[#ff4d4d]">41.8%</span>
                  <span className="text-[11px] text-[#8e9099] block mt-1">Short squeeze risk present</span>
                </div>
              </div>
            </div>
          )}

          {selectedSubTab === 'funding' && (
            <div className="space-y-4 font-mono text-xs max-w-3xl mx-auto">
              <div className="p-4 rounded-xl bg-[#1c2024] border border-[#ffd87f]/30">
                <h3 className="text-sm font-bold text-[#ffd87f] mb-2">
                  Perpetual Funding Rate Dynamics
                </h3>
                <p className="text-[#d0c5b3] leading-relaxed">
                  Current funding rate is <strong>+0.0105%</strong>. Longs are paying shorts. The market is moderately bullish without reaching extreme overbought funding euphoria (&gt;+0.05%).
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
