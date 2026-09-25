import React, { useState, useEffect } from 'react';
import {
  Candle,
  AssetPair,
  TickerInfo,
  AISignal,
  PriceAlert,
  ChartLayoutPattern,
} from '../types';
import { CandleChart } from './CandleChart';
import { LayoutGrid, Columns, Rows, Square, X, Maximize2 } from 'lucide-react';

interface MultiChartGridProps {
  currentPair: AssetPair;
  tickers: Record<AssetPair, TickerInfo>;
  candles: Candle[];
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  activeSignal?: AISignal | null;
  alerts?: PriceAlert[];
  onOpenAlertsModal?: (prefillPrice?: number) => void;
  layoutPattern: ChartLayoutPattern;
  onSelectLayoutPattern: (p: ChartLayoutPattern) => void;
}

export const MultiChartGrid: React.FC<MultiChartGridProps> = ({
  currentPair,
  tickers,
  candles,
  timeframe,
  onTimeframeChange,
  activeSignal,
  alerts = [],
  onOpenAlertsModal,
  layoutPattern,
  onSelectLayoutPattern,
}) => {
  const [subTimeframe1, setSubTimeframe1] = useState<string>('1m');
  const [subTimeframe2, setSubTimeframe2] = useState<string>('5m');
  const [subTimeframe3, setSubTimeframe3] = useState<string>('15m');
  const [subTimeframe4, setSubTimeframe4] = useState<string>('1h');
  const [secondaryPair, setSecondaryPair] = useState<AssetPair>(
    currentPair === 'BTC/USDT' ? 'ETH/USDT' : 'BTC/USDT'
  );

  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeTicker = tickers[currentPair] || tickers['BTC/USDT'];
  const secTicker = tickers[secondaryPair] || tickers['ETH/USDT'];

  return (
    <div className="w-full h-full bg-[#111417] select-none flex flex-col overflow-hidden">
      {/* Sleek Pattern Selector Strip */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#14171a] border-b border-[#272a2d] font-mono text-xs shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden sm:inline text-[#00ff94] font-bold text-[11px] tracking-wider">
            MULTI-CHART:
          </span>
          <div className="flex items-center gap-0.5 bg-[#191c1f] p-0.5 rounded border border-[#272a2d]">
            <button
              onClick={() => onSelectLayoutPattern('single')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                layoutPattern === 'single'
                  ? 'bg-[#272a2d] text-[#00ff94] border border-[#00ff94]/40'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Single Full Chart [ 1 ]"
            >
              <Square className="w-3 h-3" />
              <span>[ 1 ]</span>
            </button>
            <button
              onClick={() => onSelectLayoutPattern('dual_h')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                layoutPattern === 'dual_h'
                  ? 'bg-[#272a2d] text-[#00ff94] border border-[#00ff94]/40'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Dual Horizontal Split [ = ]"
            >
              <Rows className="w-3 h-3" />
              <span>[ = ]</span>
            </button>
            <button
              onClick={() => onSelectLayoutPattern('dual_v')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                layoutPattern === 'dual_v'
                  ? 'bg-[#272a2d] text-[#00ff94] border border-[#00ff94]/40'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Dual Vertical Split [ || ]"
            >
              <Columns className="w-3 h-3" />
              <span>[ || ]</span>
            </button>
            <button
              onClick={() => onSelectLayoutPattern('quad')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                layoutPattern === 'quad'
                  ? 'bg-[#272a2d] text-[#00ff94] border border-[#00ff94]/40'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Quad 4-Chart Grid [ :: ]"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>[ :: ]</span>
            </button>
          </div>
        </div>

        {/* 1-Click Exit Button to Return to Single View */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectLayoutPattern('single')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#f6be16]/10 hover:bg-[#f6be16]/20 text-[#f6be16] border border-[#f6be16]/40 text-[11px] font-bold transition-all cursor-pointer shadow-xs"
            title="Return to clean single chart view"
          >
            <X className="w-3 h-3" />
            <span className="hidden xs:inline">Single Chart</span>
          </button>
        </div>
      </div>

      {/* Grid Canvas Layouts */}
      <div className="flex-1 overflow-hidden relative">
        {/* On mobile screens, automatically render full single chart with multi-timeframe tabs for pristine clarity */}
        {isMobileScreen && layoutPattern !== 'single' ? (
          <div className="w-full h-full flex flex-col">
            <div className="flex items-center justify-between px-2 py-1 bg-[#191c1f] border-b border-[#272a2d] text-[10.5px]">
              <span className="text-[#ffd87f] font-bold">Timeframe Switch:</span>
              <div className="flex items-center gap-1">
                {['1m', '5m', '15m', '1h', '4h', '1D'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => onTimeframeChange(tf)}
                    className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                      timeframe === tf ? 'bg-[#f6be16] text-[#0b0e11]' : 'text-[#99907f] hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <CandleChart
                candles={candles}
                currentPrice={activeTicker.price}
                symbol={currentPair}
                timeframe={timeframe}
                onTimeframeChange={onTimeframeChange}
                activeSignal={activeSignal}
                alerts={alerts}
                onOpenAlertsModal={onOpenAlertsModal}
              />
            </div>
          </div>
        ) : (
          <>
            {layoutPattern === 'single' && (
              <div className="w-full h-full">
                <CandleChart
                  candles={candles}
                  currentPrice={activeTicker.price}
                  symbol={currentPair}
                  timeframe={timeframe}
                  onTimeframeChange={onTimeframeChange}
                  activeSignal={activeSignal}
                  alerts={alerts}
                  onOpenAlertsModal={onOpenAlertsModal}
                />
              </div>
            )}

            {layoutPattern === 'dual_v' && (
              <div className="w-full h-full grid grid-cols-2 divide-x divide-[#272a2d]">
                <div className="h-full overflow-hidden">
                  <CandleChart
                    candles={candles}
                    currentPrice={activeTicker.price}
                    symbol={currentPair}
                    timeframe={subTimeframe1}
                    onTimeframeChange={setSubTimeframe1}
                    activeSignal={activeSignal}
                    alerts={alerts}
                    onOpenAlertsModal={onOpenAlertsModal}
                    isSplitMode={true}
                    onMaximize={() => {
                      onTimeframeChange(subTimeframe1);
                      onSelectLayoutPattern('single');
                    }}
                  />
                </div>
                <div className="h-full overflow-hidden">
                  <CandleChart
                    candles={candles}
                    currentPrice={secTicker.price}
                    symbol={secondaryPair}
                    timeframe={subTimeframe2}
                    onTimeframeChange={setSubTimeframe2}
                    alerts={alerts}
                    onOpenAlertsModal={onOpenAlertsModal}
                    isSplitMode={true}
                    onMaximize={() => {
                      onTimeframeChange(subTimeframe2);
                      onSelectLayoutPattern('single');
                    }}
                  />
                </div>
              </div>
            )}

            {layoutPattern === 'dual_h' && (
              <div className="w-full h-full grid grid-rows-2 divide-y divide-[#272a2d]">
                <div className="h-full overflow-hidden">
                  <CandleChart
                    candles={candles}
                    currentPrice={activeTicker.price}
                    symbol={currentPair}
                    timeframe={subTimeframe1}
                    onTimeframeChange={setSubTimeframe1}
                    activeSignal={activeSignal}
                    alerts={alerts}
                    onOpenAlertsModal={onOpenAlertsModal}
                    isSplitMode={true}
                    onMaximize={() => {
                      onTimeframeChange(subTimeframe1);
                      onSelectLayoutPattern('single');
                    }}
                  />
                </div>
                <div className="h-full overflow-hidden">
                  <CandleChart
                    candles={candles}
                    currentPrice={activeTicker.price}
                    symbol={currentPair}
                    timeframe={subTimeframe2}
                    onTimeframeChange={setSubTimeframe2}
                    alerts={alerts}
                    onOpenAlertsModal={onOpenAlertsModal}
                    isSplitMode={true}
                    onMaximize={() => {
                      onTimeframeChange(subTimeframe2);
                      onSelectLayoutPattern('single');
                    }}
                  />
                </div>
              </div>
            )}

            {layoutPattern === 'quad' && (
              <div className="w-full h-full grid grid-cols-2 grid-rows-2 divide-x divide-y divide-[#272a2d]">
                <div className="h-full overflow-hidden">
                  <CandleChart
                    candles={candles}
                    currentPrice={activeTicker.price}
                    symbol={currentPair}
                    timeframe={subTimeframe1}
                    onTimeframeChange={setSubTimeframe1}
                    activeSignal={activeSignal}
                    alerts={alerts}
                    isSplitMode={true}
                    onMaximize={() => {
                      onTimeframeChange(subTimeframe1);
                      onSelectLayoutPattern('single');
                    }}
                  />
                </div>
                <div className="h-full overflow-hidden">
                  <CandleChart
                    candles={candles}
                    currentPrice={activeTicker.price}
                    symbol={currentPair}
                    timeframe={subTimeframe2}
                    onTimeframeChange={setSubTimeframe2}
                    alerts={alerts}
                    isSplitMode={true}
                    onMaximize={() => {
                      onTimeframeChange(subTimeframe2);
                      onSelectLayoutPattern('single');
                    }}
                  />
                </div>
                <div className="h-full overflow-hidden">
                  <CandleChart
                    candles={candles}
                    currentPrice={activeTicker.price}
                    symbol={currentPair}
                    timeframe={subTimeframe3}
                    onTimeframeChange={setSubTimeframe3}
                    alerts={alerts}
                    isSplitMode={true}
                    onMaximize={() => {
                      onTimeframeChange(subTimeframe3);
                      onSelectLayoutPattern('single');
                    }}
                  />
                </div>
                <div className="h-full overflow-hidden">
                  <CandleChart
                    candles={candles}
                    currentPrice={activeTicker.price}
                    symbol={currentPair}
                    timeframe={subTimeframe4}
                    onTimeframeChange={setSubTimeframe4}
                    alerts={alerts}
                    isSplitMode={true}
                    onMaximize={() => {
                      onTimeframeChange(subTimeframe4);
                      onSelectLayoutPattern('single');
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
