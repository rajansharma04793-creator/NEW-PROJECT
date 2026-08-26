import React, { useState } from 'react';
import { OrderBookItem, MarketTrade } from '../types';
import { ArrowUp, ArrowDown, Layers, History } from 'lucide-react';

interface OrderBookProps {
  bids: OrderBookItem[];
  asks: OrderBookItem[];
  currentPrice: number;
  lastTradeSide: 'buy' | 'sell';
  recentTrades: MarketTrade[];
  precision: number;
  onSelectPrice: (price: number) => void;
  currencyMode?: 'USDT' | 'INR';
  inrPrice?: number;
}

export const OrderBook: React.FC<OrderBookProps> = ({
  bids,
  asks,
  currentPrice,
  lastTradeSide,
  recentTrades,
  precision,
  onSelectPrice,
  currencyMode = 'USDT',
  inrPrice,
}) => {
  const [activeTab, setActiveTab] = useState<'book' | 'trades'>('book');
  const [grouping, setGrouping] = useState<number>(0.1);

  const isINR = currencyMode === 'INR' && inrPrice && inrPrice > 0;
  const inrRateMultiplier = isINR && currentPrice > 0 ? inrPrice / currentPrice : 1;
  const displayCurrentPrice = isINR ? inrPrice : currentPrice;
  const currencyLabel = isINR ? 'INR (₹)' : 'USDT ($)';

  // Helper to format price
  const formatPrice = (p: number) => {
    if (isINR) {
      const converted = p * inrRateMultiplier;
      return converted >= 1000 ? converted.toLocaleString('en-IN', { maximumFractionDigits: 1 }) : converted.toFixed(2);
    }
    return p.toFixed(precision);
  };

  // Spread calculation
  const bestBid = bids[0]?.price || currentPrice;
  const bestAsk = asks[asks.length - 1]?.price || currentPrice;
  const spread = Math.max(0, bestAsk - bestBid);
  const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;

  // Max totals for depth bar calculation
  const maxBidTotal = bids[bids.length - 1]?.total || 1;
  const maxAskTotal = asks[0]?.total || 1;
  const maxTotal = Math.max(maxBidTotal, maxAskTotal, 1);

  return (
    <div
      id="order-book-container"
      className="flex flex-col h-full bg-[#111417] border-l border-[#272a2d] font-mono text-[11px] select-none"
    >
      {/* Header Tabs & Grouping */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#191c1f] border-b border-[#272a2d]">
        <div className="flex items-center gap-2">
          <button
            id="tab-orderbook"
            onClick={() => setActiveTab('book')}
            className={`flex items-center gap-1 font-bold text-xs pb-0.5 border-b-2 transition-colors ${
              activeTab === 'book'
                ? 'border-[#f6be16] text-[#fff8f1]'
                : 'border-transparent text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Order Book</span>
          </button>
          <button
            id="tab-trades"
            onClick={() => setActiveTab('trades')}
            className={`flex items-center gap-1 font-bold text-xs pb-0.5 border-b-2 transition-colors ${
              activeTab === 'trades'
                ? 'border-[#f6be16] text-[#fff8f1]'
                : 'border-transparent text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Trades</span>
          </button>
        </div>

        {activeTab === 'book' && (
          <div className="flex items-center gap-1 text-[10px] text-[#99907f]">
            <span>{isINR ? '₹' : '$'}</span>
            <select
              value={grouping}
              onChange={(e) => setGrouping(Number(e.target.value))}
              className="bg-[#272a2d] text-[#e1e2e7] px-1 py-0.5 rounded border border-[#323538] outline-none text-[10px]"
            >
              <option value={0.01}>0.01</option>
              <option value={0.1}>0.1</option>
              <option value={1}>1.0</option>
              <option value={10}>10.0</option>
            </select>
          </div>
        )}
      </div>

      {activeTab === 'book' ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Table Headers */}
          <div className="grid grid-cols-3 px-3 py-1 text-[#99907f] text-[10px] uppercase border-b border-[#272a2d]/50 bg-[#111417]">
            <span>Price ({currencyLabel})</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>

          {/* Asks (Sells) - Top Half */}
          <div className="flex-1 flex flex-col justify-end overflow-hidden">
            <div className="space-y-[1px] py-1 overflow-y-auto">
              {asks.slice(0, 11).map((item, idx) => {
                const depthPct = Math.min(100, (item.total / maxTotal) * 100);
                return (
                  <div
                    key={`ask-${idx}`}
                    onClick={() => onSelectPrice(item.price)}
                    className="grid grid-cols-3 px-3 py-[2px] cursor-pointer hover:bg-[#272a2d]/60 relative transition-colors"
                  >
                    {/* Ruby Depth Backfill */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#ff3b4a]/12 pointer-events-none transition-all duration-150"
                      style={{ width: `${depthPct}%` }}
                    />
                    <span className="text-[#ff3b4a] font-medium z-10">
                      {formatPrice(item.price)}
                    </span>
                    <span className="text-right text-[#e1e2e7] z-10">
                      {item.amount.toFixed(3)}
                    </span>
                    <span className="text-right text-[#99907f] z-10">
                      {item.total.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mid Market Spread Banner */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#191c1f] border-y border-[#272a2d] z-20">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-bold tracking-tight ${
                  lastTradeSide === 'buy' ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                }`}
              >
                {isINR ? `₹${displayCurrentPrice.toLocaleString('en-IN')}` : `$${displayCurrentPrice.toFixed(precision)}`}
              </span>
              {lastTradeSide === 'buy' ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#00ff94]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#ff3b4a]" />
              )}
            </div>

            <div className="flex items-center gap-1 text-[10px] text-[#99907f]">
              <span>Spread:</span>
              <span className="text-[#e1e2e7]">{isINR ? `₹${(spread * inrRateMultiplier).toFixed(2)}` : spread.toFixed(precision)}</span>
              <span className="text-[#99907f]">({spreadPercent.toFixed(3)}%)</span>
            </div>
          </div>

          {/* Bids (Buys) - Bottom Half */}
          <div className="flex-1 overflow-hidden">
            <div className="space-y-[1px] py-1 overflow-y-auto">
              {bids.slice(0, 11).map((item, idx) => {
                const depthPct = Math.min(100, (item.total / maxTotal) * 100);
                return (
                  <div
                    key={`bid-${idx}`}
                    onClick={() => onSelectPrice(item.price)}
                    className="grid grid-cols-3 px-3 py-[2px] cursor-pointer hover:bg-[#272a2d]/60 relative transition-colors"
                  >
                    {/* Emerald Depth Backfill */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#00ff94]/12 pointer-events-none transition-all duration-150"
                      style={{ width: `${depthPct}%` }}
                    />
                    <span className="text-[#00ff94] font-medium z-10">
                      {formatPrice(item.price)}
                    </span>
                    <span className="text-right text-[#e1e2e7] z-10">
                      {item.amount.toFixed(3)}
                    </span>
                    <span className="text-right text-[#99907f] z-10">
                      {item.total.toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Recent Trades Feed */
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="grid grid-cols-3 px-3 py-1 text-[#99907f] text-[10px] uppercase border-b border-[#272a2d]/50 bg-[#111417]">
            <span>Price ({currencyLabel})</span>
            <span className="text-right">Size</span>
            <span className="text-right">Time</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-[1px] py-1">
            {recentTrades.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-3 px-3 py-[3px] hover:bg-[#272a2d]/40 transition-colors"
              >
                <span
                  className={
                    t.side === 'buy' ? 'text-[#00ff94] font-medium' : 'text-[#ff3b4a] font-medium'
                  }
                >
                  {formatPrice(t.price)}
                </span>
                <span className="text-right text-[#e1e2e7]">{t.amount.toFixed(3)}</span>
                <span className="text-right text-[#99907f]">
                  {new Date(t.time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
