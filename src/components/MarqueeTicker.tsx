import React from 'react';
import { TickerInfo, AssetPair } from '../types';

interface MarqueeTickerProps {
  tickers: Record<AssetPair, TickerInfo> | Record<string, TickerInfo>;
  onSelectSymbol?: (symbol: AssetPair) => void;
  currencyMode?: 'USDT' | 'INR';
}

export const MarqueeTicker: React.FC<MarqueeTickerProps> = ({
  tickers,
  onSelectSymbol,
  currencyMode = 'USDT',
}) => {
  const tickerList: TickerInfo[] = Object.values(tickers) as TickerInfo[];

  const renderTickerItem = (t: TickerInfo, prefix: string) => {
    const isINR = currencyMode === 'INR' && t.inrPrice;
    const mainPriceText = isINR
      ? `₹${t.inrPrice!.toLocaleString('en-IN')}`
      : `$${t.price.toLocaleString(undefined, {
          minimumFractionDigits: t.precision,
          maximumFractionDigits: t.precision,
        })}`;

    const subPriceText = isINR
      ? `$${t.price.toFixed(t.precision)} USDT`
      : t.inrPrice
      ? `₹${t.inrPrice.toLocaleString('en-IN')}`
      : null;

    return (
      <div
        key={`${prefix}-${t.symbol}`}
        onClick={() => onSelectSymbol && onSelectSymbol(t.symbol as AssetPair)}
        className="flex items-center gap-2 cursor-pointer hover:bg-[#272a2d] px-2 py-1 rounded transition-colors"
      >
        <span className="text-[#d0c5b3] font-medium">{t.symbol}</span>
        <span className="text-[#fff8f1] font-bold">
          {mainPriceText}
          {subPriceText ? (
            <span className="text-[#ffd87f] font-normal ml-1.5 text-[10px]">
              ({subPriceText})
            </span>
          ) : null}
        </span>
        <span
          className={`font-medium ${
            t.change24h >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
          }`}
        >
          {t.change24h >= 0 ? `+${t.change24h.toFixed(1)}%` : `${t.change24h.toFixed(1)}%`}
        </span>
      </div>
    );
  };

  return (
    <div
      id="bottom-marquee-ticker"
      className="w-full bg-[#1d2023] border-t border-[#4d4638]/60 h-10 flex items-center marquee-container font-mono text-[11px] select-none z-30"
    >
      <div className="marquee-content flex gap-8 whitespace-nowrap px-4">
        {/* Set 1 */}
        {tickerList.map((t) => renderTickerItem(t, 't1'))}

        {/* Set 2 (for seamless loop) */}
        {tickerList.map((t) => renderTickerItem(t, 't2'))}
      </div>
    </div>
  );
};
