import React, { useState } from 'react';
import {
  Candle,
  AssetPair,
  TickerInfo,
  AISignal,
  PriceAlert,
  ChartLayoutPattern,
} from '../types';
import { CandleChart } from './CandleChart';
import { LayoutGrid, Columns, Rows, Square } from 'lucide-react';

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
  const [subTimeframe2, setSubTimeframe2] = useState<string>('15m');
  const [subTimeframe3, setSubTimeframe3] = useState<string>('1h');
  const [secondaryPair, setSecondaryPair] = useState<AssetPair>(
    currentPair === 'BTC/USDT' ? 'ETH/USDT' : 'BTC/USDT'
  );

  const activeTicker = tickers[currentPair] || tickers['BTC/USDT'];
  const secTicker = tickers[secondaryPair] || tickers['ETH/USDT'];

  return (
    <div className="w-full h-full bg-[#111417] select-none flex flex-col overflow-hidden">
      {/* Pattern Selector Strip */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#14171a] border-b border-[#272a2d] font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#00ff94] font-bold">SPLIT CHART PATTERNS:</span>
          <div className="flex items-center gap-1 bg-[#191c1f] p-0.5 rounded border border-[#272a2d]">
            <button
              onClick={() => onSelectLayoutPattern('single')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                layoutPattern === 'single'
                  ? 'bg-[#272a2d] text-[#00ff94]'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Single Full Chart [ 1 ]"
            >
              <Square className="w-3 h-3" />
              <span>[ 1 ]</span>
            </button>
            <button
              onClick={() => onSelectLayoutPattern('dual_h')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                layoutPattern === 'dual_h'
                  ? 'bg-[#272a2d] text-[#00ff94]'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Dual Horizontal Split [ = ]"
            >
              <Rows className="w-3 h-3" />
              <span>[ = ]</span>
            </button>
            <button
              onClick={() => onSelectLayoutPattern('dual_v')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                layoutPattern === 'dual_v'
                  ? 'bg-[#272a2d] text-[#00ff94]'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Dual Vertical Split [ || ]"
            >
              <Columns className="w-3 h-3" />
              <span>[ || ]</span>
            </button>
            <button
              onClick={() => onSelectLayoutPattern('quad')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                layoutPattern === 'quad'
                  ? 'bg-[#272a2d] text-[#00ff94]'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Quad 4-Chart Grid [ :: ]"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>[ :: ]</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#99907f]">
          <span>Multi-Timeframe Sync Active</span>
        </div>
      </div>

      {/* Grid Canvas Layouts */}
      <div className="flex-1 overflow-hidden">
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
            <div className="h-full">
              <CandleChart
                candles={candles}
                currentPrice={activeTicker.price}
                symbol={currentPair}
                timeframe={subTimeframe1}
                onTimeframeChange={setSubTimeframe1}
                activeSignal={activeSignal}
                alerts={alerts}
                onOpenAlertsModal={onOpenAlertsModal}
              />
            </div>
            <div className="h-full">
              <CandleChart
                candles={candles}
                currentPrice={secTicker.price}
                symbol={secondaryPair}
                timeframe={subTimeframe2}
                onTimeframeChange={setSubTimeframe2}
                alerts={alerts}
                onOpenAlertsModal={onOpenAlertsModal}
              />
            </div>
          </div>
        )}

        {layoutPattern === 'dual_h' && (
          <div className="w-full h-full grid grid-rows-2 divide-y divide-[#272a2d]">
            <div className="h-full">
              <CandleChart
                candles={candles}
                currentPrice={activeTicker.price}
                symbol={currentPair}
                timeframe={subTimeframe1}
                onTimeframeChange={setSubTimeframe1}
                activeSignal={activeSignal}
                alerts={alerts}
                onOpenAlertsModal={onOpenAlertsModal}
              />
            </div>
            <div className="h-full">
              <CandleChart
                candles={candles}
                currentPrice={activeTicker.price}
                symbol={currentPair}
                timeframe={subTimeframe2}
                onTimeframeChange={setSubTimeframe2}
                alerts={alerts}
                onOpenAlertsModal={onOpenAlertsModal}
              />
            </div>
          </div>
        )}

        {layoutPattern === 'quad' && (
          <div className="w-full h-full grid grid-cols-2 grid-rows-2 divide-x divide-y divide-[#272a2d]">
            <div className="h-full">
              <CandleChart
                candles={candles}
                currentPrice={activeTicker.price}
                symbol={currentPair}
                timeframe="1m"
                onTimeframeChange={() => {}}
                activeSignal={activeSignal}
                alerts={alerts}
              />
            </div>
            <div className="h-full">
              <CandleChart
                candles={candles}
                currentPrice={activeTicker.price}
                symbol={currentPair}
                timeframe="5m"
                onTimeframeChange={() => {}}
                alerts={alerts}
              />
            </div>
            <div className="h-full">
              <CandleChart
                candles={candles}
                currentPrice={activeTicker.price}
                symbol={currentPair}
                timeframe="15m"
                onTimeframeChange={() => {}}
                alerts={alerts}
              />
            </div>
            <div className="h-full">
              <CandleChart
                candles={candles}
                currentPrice={activeTicker.price}
                symbol={currentPair}
                timeframe="1h"
                onTimeframeChange={() => {}}
                alerts={alerts}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
