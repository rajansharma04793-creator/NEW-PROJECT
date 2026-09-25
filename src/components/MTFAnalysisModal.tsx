import React, { useState } from 'react';
import { AssetPair, Candle, TickerInfo } from '../types';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  X,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { computeMTFAnalysis } from '../utils/mtfEngine';

interface MTFAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: AssetPair;
  currentPrice: number;
  tickers: Record<AssetPair, TickerInfo>;
  candles?: Candle[];
  onSelectPair?: (pair: AssetPair) => void;
}

export const MTFAnalysisModal: React.FC<MTFAnalysisModalProps> = ({
  isOpen,
  onClose,
  currentPair,
  currentPrice,
  tickers,
  candles,
  onSelectPair,
}) => {
  const [selectedPair, setSelectedPair] = useState<AssetPair>(currentPair);

  if (!isOpen) return null;

  const currentTicker = tickers[selectedPair] || {
    symbol: selectedPair,
    baseAsset: selectedPair.split('/')[0] || '',
    quoteAsset: selectedPair.split('/')[1] || 'USDT',
    price: currentPrice || 100,
    change24h: 0,
    high24h: currentPrice * 1.02,
    low24h: currentPrice * 0.98,
    volume24h: 1000000,
    precision: 2,
  };

  // Only pass candles if selectedPair matches currentPair (as candles is for currentPair)
  const pairCandles = selectedPair === currentPair ? candles : undefined;
  const mtfAnalysis = computeMTFAnalysis(selectedPair, currentTicker, pairCandles);

  const {
    aggregateBias,
    confidenceScore,
    bullishCount,
    bearishCount,
    neutralCount,
    recommendedAction,
    timeframes,
  } = mtfAnalysis;

  const isSuperLong = aggregateBias === 'STRONG_BULLISH' || bullishCount >= 5;
  const isSuperShort = aggregateBias === 'STRONG_BEARISH' || bearishCount >= 5;
  const isLong = aggregateBias === 'BULLISH' || (bullishCount >= 4 && !isSuperLong);
  const isShort = aggregateBias === 'BEARISH' || (bearishCount >= 4 && !isSuperShort);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono select-none">
      <div className="bg-[#14171a] border border-[#272a2d] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#272a2d] bg-[#191c1f]">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                isSuperLong || isLong
                  ? 'bg-[#00ff94]/15 border-[#00ff94]/30 text-[#00ff94]'
                  : isSuperShort || isShort
                  ? 'bg-[#ff3b4a]/15 border-[#ff3b4a]/30 text-[#ff3b4a]'
                  : 'bg-[#f6be16]/15 border-[#f6be16]/30 text-[#f6be16]'
              }`}
            >
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#fff8f1]">Multi-Timeframe (MTF) Confluence Matrix</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isSuperLong
                      ? 'bg-[#00ff94]/20 text-[#00ff94] border-[#00ff94]/30'
                      : isSuperShort
                      ? 'bg-[#ff3b4a]/20 text-[#ff3b4a] border-[#ff3b4a]/30'
                      : isLong
                      ? 'bg-[#00ff94]/15 text-[#00ff94] border-[#00ff94]/25'
                      : isShort
                      ? 'bg-[#ff3b4a]/15 text-[#ff3b4a] border-[#ff3b4a]/25'
                      : 'bg-[#f6be16]/20 text-[#f6be16] border-[#f6be16]/30'
                  }`}
                >
                  {confidenceScore}%{' '}
                  {isSuperLong
                    ? 'Super Bullish (BUY)'
                    : isSuperShort
                    ? 'Super Bearish (SELL)'
                    : isLong
                    ? 'Bullish Bias'
                    : isShort
                    ? 'Bearish Bias'
                    : 'Mixed / Divergence'}
                </span>
              </div>
              <p className="text-[11px] text-[#99907f]">
                Algorithmic consensus across 1m, 5m, 15m, 1h, 4h & 1D time horizons
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pair Switcher Bar */}
        <div className="px-6 py-2.5 bg-[#16191c] border-b border-[#272a2d] flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-[#99907f] shrink-0 font-bold">Pair:</span>
          {Object.keys(tickers)
            .slice(0, 12)
            .map((pair) => {
              const pTicker = tickers[pair as AssetPair];
              const pChange = pTicker?.change24h ?? 0;
              return (
                <button
                  key={pair}
                  onClick={() => {
                    setSelectedPair(pair as AssetPair);
                    onSelectPair?.(pair as AssetPair);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    selectedPair === pair
                      ? 'bg-[#00ff94] text-[#002111] shadow-md shadow-[#00ff94]/20'
                      : 'bg-[#1e2226] text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d]'
                  }`}
                >
                  <span>{pair.split('/')[0]}</span>
                  <span
                    className={`text-[9px] font-mono ${
                      selectedPair === pair
                        ? 'text-[#002111]/80 font-bold'
                        : pChange >= 0
                        ? 'text-[#00ff94]'
                        : 'text-[#ff3b4a]'
                    }`}
                  >
                    {pChange >= 0 ? '+' : ''}
                    {pChange.toFixed(1)}%
                  </span>
                </button>
              );
            })}
        </div>

        {/* Top Summary Banner */}
        <div className="p-6 bg-[#111417] border-b border-[#272a2d] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-[#191c1f] border border-[#272a2d]">
            <span className="text-[10px] text-[#99907f] block">Overall Consensus</span>
            <span
              className={`text-sm sm:text-base font-bold flex items-center gap-1.5 mt-1 ${
                isSuperLong || isLong
                  ? 'text-[#00ff94]'
                  : isSuperShort || isShort
                  ? 'text-[#ff3b4a]'
                  : 'text-[#f6be16]'
              }`}
            >
              {isSuperLong ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#00ff94]" /> STRONG BULLISH CONVERGENCE (BUY)
                </>
              ) : isSuperShort ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-[#ff3b4a]" /> STRONG BEARISH CONVERGENCE (SELL)
                </>
              ) : isLong ? (
                <>
                  <TrendingUp className="w-4 h-4 text-[#00ff94]" /> MODERATE BULLISH TREND
                </>
              ) : isShort ? (
                <>
                  <TrendingDown className="w-4 h-4 text-[#ff3b4a]" /> MODERATE BEARISH TREND
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-[#f6be16]" /> MTF TIMEFRAME DIVERGENCE
                </>
              )}
            </span>
            <span className="text-[10px] text-[#99907f] block mt-0.5">
              {bullishCount} Bull • {bearishCount} Bear • {neutralCount} Neutral
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#191c1f] border border-[#272a2d]">
            <span className="text-[10px] text-[#99907f] block">Confluence Quality Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-bold text-[#ffd87f]">{confidenceScore} / 100</span>
              <span
                className={`text-[10px] font-bold ${
                  confidenceScore >= 85
                    ? 'text-[#00ff94]'
                    : confidenceScore >= 70
                    ? 'text-[#ffd87f]'
                    : 'text-[#99907f]'
                }`}
              >
                {confidenceScore >= 85 ? 'High Conviction' : confidenceScore >= 70 ? 'Moderate' : 'Chop/Mixed'}
              </span>
            </div>
            <span className="text-[10px] text-[#99907f] block mt-0.5">
              {isSuperLong || isSuperShort
                ? 'High Institutional Order Flow Alignment'
                : 'Selective Multi-Timeframe Alignment'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#191c1f] border border-[#272a2d]">
            <span className="text-[10px] text-[#99907f] block">Recommended Action</span>
            <span className="text-xs sm:text-sm font-bold text-[#fff8f1] mt-1 block">
              {recommendedAction}
            </span>
            <span className="text-[10px] text-[#99907f] block mt-0.5">
              {isSuperLong || isLong ? 'Optimal Risk:Reward ≥ 1:2.4' : isSuperShort || isShort ? 'Optimal Short RR ≥ 1:2.4' : 'Tight Stop Loss Mandatory'}
            </span>
          </div>
        </div>

        {/* Matrix Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-[#272a2d] text-[#99907f] text-[10px] uppercase font-bold">
                <th className="pb-3">Timeframe</th>
                <th className="pb-3">Bias</th>
                <th className="pb-3">Confidence</th>
                <th className="pb-3">RSI (14)</th>
                <th className="pb-3">EMA Stack</th>
                <th className="pb-3">MACD Momentum</th>
                <th className="pb-3 text-right">Key Price Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#272a2d]/60">
              {timeframes.map((tf) => (
                <tr key={tf.timeframe} className="hover:bg-[#191c1f]/60 transition-colors">
                  <td className="py-3 font-bold text-[#fff8f1]">{tf.timeframe}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tf.bias === 'BULLISH'
                          ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                          : tf.bias === 'BEARISH'
                          ? 'bg-[#ff3b4a]/20 text-[#ff3b4a] border border-[#ff3b4a]/40'
                          : 'bg-[#ffd87f]/20 text-[#ffd87f] border border-[#ffd87f]/40'
                      }`}
                    >
                      {tf.bias}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-[#ffd87f]">{tf.score}%</td>
                  <td className="py-3 text-[#e1e2e7]">{tf.rsi}</td>
                  <td className="py-3 text-[#99907f]">{tf.emaTrend}</td>
                  <td className="py-3 text-[#38bdf8]">{tf.macdState}</td>
                  <td className="py-3 text-right font-bold text-[#ffd87f]">{tf.keyLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
