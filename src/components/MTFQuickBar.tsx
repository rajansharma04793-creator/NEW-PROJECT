import React, { useMemo } from 'react';
import { AssetPair, Candle, TickerInfo } from '../types';
import { Layers, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';
import { computeMTFAnalysis } from '../utils/mtfEngine';

interface MTFQuickBarProps {
  currentPair: AssetPair;
  ticker?: Partial<TickerInfo> & { price?: number; change24h?: number; high24h?: number; low24h?: number; volume24h?: number; precision?: number };
  candles?: Candle[];
  onOpenMTFModal: () => void;
}

export const MTFQuickBar: React.FC<MTFQuickBarProps> = ({
  currentPair,
  ticker = {},
  candles,
  onOpenMTFModal,
}) => {
  const mtfAnalysis = useMemo(
    () => computeMTFAnalysis(currentPair, ticker, candles),
    [currentPair, ticker.price, ticker.change24h, candles?.length]
  );

  const { bullishCount, bearishCount, confidenceScore, timeframes, aggregateBias } = mtfAnalysis;
  const isSuperLong = aggregateBias === 'STRONG_BULLISH' || bullishCount >= 5;
  const isSuperShort = aggregateBias === 'STRONG_BEARISH' || bearishCount >= 5;
  const isModerateLong = aggregateBias === 'BULLISH' || (bullishCount >= 4 && !isSuperLong);
  const isModerateShort = aggregateBias === 'BEARISH' || (bearishCount >= 4 && !isSuperShort);
  const isConflict = !isSuperLong && !isSuperShort && !isModerateLong && !isModerateShort;

  return (
    <div
      id="mtf-confluence-quickbar"
      onClick={onOpenMTFModal}
      className="flex items-center justify-between px-2 sm:px-3 py-1 bg-[#14171a] border-b border-[#272a2d] hover:border-[#37393d] transition-all cursor-pointer select-none text-[11px] sm:text-xs font-mono group shrink-0"
      title="Click to open Full Multi-Timeframe Confluence Matrix & Key S/R Zones"
    >
      {/* Left: MTF Label & Confluence Status */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
        <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-[#191c1f] border border-[#272a2d] text-[#00ff94] shrink-0">
          <Layers className="w-3 h-3 text-[#00ff94]" />
          <span className="font-bold text-[10px] sm:text-[11px]">MTF</span>
        </div>

        {/* Dynamic Confluence Badge */}
        <div
          className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded border text-[10px] sm:text-[11px] font-extrabold shrink-0 ${
            isSuperLong
              ? 'bg-[#00ff94]/15 border-[#00ff94]/40 text-[#00ff94] shadow-[0_0_8px_rgba(0,255,148,0.2)]'
              : isSuperShort
              ? 'bg-[#ff3b4a]/15 border-[#ff3b4a]/40 text-[#ff3b4a] shadow-[0_0_8px_rgba(255,59,74,0.2)]'
              : isModerateLong
              ? 'bg-[#00ff94]/10 border-[#00ff94]/30 text-[#00ff94]'
              : isModerateShort
              ? 'bg-[#ff3b4a]/10 border-[#ff3b4a]/30 text-[#ff3b4a]'
              : isConflict
              ? 'bg-[#f6be16]/15 border-[#f6be16]/40 text-[#f6be16]'
              : 'bg-[#272a2d] border-[#37393d] text-[#d0c5b3]'
          }`}
        >
          {isSuperLong ? (
            <>
              <ShieldCheck className="w-3 h-3 text-[#00ff94]" />
              <span className="hidden xs:inline">{confidenceScore}% SUPER LONG (BUY)</span>
              <span className="xs:hidden">{confidenceScore}% BUY</span>
            </>
          ) : isSuperShort ? (
            <>
              <ShieldCheck className="w-3 h-3 text-[#ff3b4a]" />
              <span className="hidden xs:inline">{confidenceScore}% SUPER SHORT (SELL)</span>
              <span className="xs:hidden">{confidenceScore}% SELL</span>
            </>
          ) : isModerateLong ? (
            <>
              <TrendingUp className="w-3 h-3 text-[#00ff94]" />
              <span className="hidden xs:inline">{confidenceScore}% BULLISH BIAS</span>
              <span className="xs:hidden">{confidenceScore}% BULL</span>
            </>
          ) : isModerateShort ? (
            <>
              <TrendingDown className="w-3 h-3 text-[#ff3b4a]" />
              <span className="hidden xs:inline">{confidenceScore}% BEARISH BIAS</span>
              <span className="xs:hidden">{confidenceScore}% BEAR</span>
            </>
          ) : isConflict ? (
            <>
              <AlertTriangle className="w-3 h-3 text-[#f6be16]" />
              <span>DIVERGENCE (SCALP)</span>
            </>
          ) : (
            <span>{confidenceScore}% CONFLUENCE</span>
          )}
        </div>

        {/* Timeframe Micro Chips */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {timeframes.map((state) => (
            <div
              key={state.timeframe}
              className={`px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-bold border flex items-center gap-0.5 ${
                state.bias === 'BULLISH'
                  ? 'bg-[#00ff94]/10 border-[#00ff94]/30 text-[#00ff94]'
                  : state.bias === 'BEARISH'
                  ? 'bg-[#ff3b4a]/10 border-[#ff3b4a]/30 text-[#ff3b4a]'
                  : 'bg-[#272a2d]/50 border-[#272a2d] text-[#99907f]'
              }`}
            >
              <span>{state.timeframe}</span>
              {state.bias === 'BULLISH' ? (
                <TrendingUp className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              ) : state.bias === 'BEARISH' ? (
                <TrendingDown className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              ) : (
                <span className="text-[7px]">•</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Trigger Hint */}
      <div className="flex items-center gap-1 text-[#99907f] group-hover:text-[#fff8f1] transition-colors shrink-0 text-[10px] pl-1">
        <span className="hidden md:inline font-sans">Open Deep MTF Analyzer</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#f6be16] group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
};
