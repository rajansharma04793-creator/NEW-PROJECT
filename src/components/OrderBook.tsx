import React, { useState, useMemo, useCallback } from 'react';
import { List } from 'react-window';
import { OrderBookItem, MarketTrade } from '../types';
import {
  ArrowUp,
  ArrowDown,
  Layers,
  History,
  ArrowDownUp,
  TrendingUp,
  TrendingDown,
  Zap,
} from 'lucide-react';

export interface OrderBookProps {
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

type OrderBookViewMode = 'both' | 'bids' | 'asks';

interface AskRowData {
  items: OrderBookItem[];
  maxTotal: number;
  formatPrice: (p: number) => string;
  onSelectPrice: (p: number) => void;
}

interface BidRowData {
  items: OrderBookItem[];
  maxTotal: number;
  formatPrice: (p: number) => string;
  onSelectPrice: (p: number) => void;
}

interface TradeRowData {
  trades: MarketTrade[];
  formatPrice: (p: number) => string;
  onSelectPrice: (p: number) => void;
}

interface VirtualizedRowProps {
  index: number;
  style: React.CSSProperties;
  ariaAttributes?: {
    'aria-posinset': number;
    'aria-setsize': number;
    role: 'listitem';
  };
}

type VirtualizedRowComponent<T> = (props: {
  ariaAttributes: {
    'aria-posinset': number;
    'aria-setsize': number;
    role: 'listitem';
  };
  index: number;
  style: React.CSSProperties;
} & T) => React.ReactElement | null;

// 1. Memoized Ask Row for Virtualized List
const VirtualizedAskRow: VirtualizedRowComponent<AskRowData> = React.memo(function VirtualizedAskRow({
  index,
  style,
  items,
  maxTotal,
  formatPrice,
  onSelectPrice,
}: VirtualizedRowProps & AskRowData): React.ReactElement | null {
  const item = items[index];
  if (!item) return null;
  const depthPct = maxTotal > 0 ? Math.min(100, (item.total / maxTotal) * 100) : 0;

  return (
    <div
      style={style}
      onClick={() => onSelectPrice(item.price)}
      className="grid grid-cols-3 px-3 py-[2px] cursor-pointer hover:bg-[#272a2d]/70 relative transition-colors select-none text-[11px] items-center group"
    >
      {/* Ruby Depth Backfill */}
      <div
        className="absolute right-0 top-0 bottom-0 bg-[#ff3b4a]/12 pointer-events-none transition-all duration-150"
        style={{ width: `${depthPct}%` }}
      />
      <span className="text-[#ff3b4a] font-medium z-10 truncate tabular-nums">
        {formatPrice(item.price)}
      </span>
      <span className="text-right text-[#e1e2e7] z-10 tabular-nums">
        {item.amount.toFixed(3)}
      </span>
      <span className="text-right text-[#99907f] z-10 tabular-nums">
        {item.total.toFixed(3)}
      </span>
    </div>
  );
}) as unknown as VirtualizedRowComponent<AskRowData>;

// 2. Memoized Bid Row for Virtualized List
const VirtualizedBidRow: VirtualizedRowComponent<BidRowData> = React.memo(function VirtualizedBidRow({
  index,
  style,
  items,
  maxTotal,
  formatPrice,
  onSelectPrice,
}: VirtualizedRowProps & BidRowData): React.ReactElement | null {
  const item = items[index];
  if (!item) return null;
  const depthPct = maxTotal > 0 ? Math.min(100, (item.total / maxTotal) * 100) : 0;

  return (
    <div
      style={style}
      onClick={() => onSelectPrice(item.price)}
      className="grid grid-cols-3 px-3 py-[2px] cursor-pointer hover:bg-[#272a2d]/70 relative transition-colors select-none text-[11px] items-center group"
    >
      {/* Emerald Depth Backfill */}
      <div
        className="absolute right-0 top-0 bottom-0 bg-[#00ff94]/12 pointer-events-none transition-all duration-150"
        style={{ width: `${depthPct}%` }}
      />
      <span className="text-[#00ff94] font-medium z-10 truncate tabular-nums">
        {formatPrice(item.price)}
      </span>
      <span className="text-right text-[#e1e2e7] z-10 tabular-nums">
        {item.amount.toFixed(3)}
      </span>
      <span className="text-right text-[#99907f] z-10 tabular-nums">
        {item.total.toFixed(3)}
      </span>
    </div>
  );
}) as unknown as VirtualizedRowComponent<BidRowData>;

// 3. Memoized Trade Row for Virtualized Feed
const VirtualizedTradeRow: VirtualizedRowComponent<TradeRowData> = React.memo(function VirtualizedTradeRow({
  index,
  style,
  trades,
  formatPrice,
  onSelectPrice,
}: VirtualizedRowProps & TradeRowData): React.ReactElement | null {
  const t = trades[index];
  if (!t) return null;
  const isBuy = t.side === 'buy';
  const isWhale = t.amount >= 15;

  return (
    <div
      style={style}
      onClick={() => onSelectPrice(t.price)}
      className={`grid grid-cols-3 px-3 py-[2px] cursor-pointer hover:bg-[#272a2d]/60 transition-colors text-[11px] items-center select-none ${
        isWhale ? 'bg-[#f6be16]/10 font-semibold' : ''
      }`}
    >
      <span
        className={`font-medium truncate tabular-nums ${
          isBuy ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
        }`}
      >
        {formatPrice(t.price)}
      </span>
      <span className="text-right text-[#e1e2e7] tabular-nums">
        {t.amount.toFixed(3)}
        {isWhale && (
          <span
            className="ml-1 text-[9px] text-[#f6be16] font-bold inline-block"
            title="Large / Whale Execution"
          >
            ⚡
          </span>
        )}
      </span>
      <span className="text-right text-[#99907f] tabular-nums text-[10px]">
        {new Date(t.time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })}
      </span>
    </div>
  );
}) as unknown as VirtualizedRowComponent<TradeRowData>;

// 4. Memoized Mid-Market Spread Banner
interface SpreadBannerProps {
  currentPrice: number;
  displayCurrentPrice: number;
  lastTradeSide: 'buy' | 'sell';
  spread: number;
  spreadPercent: number;
  isINR: boolean;
  inrRateMultiplier: number;
  precision: number;
}

const SpreadBanner: React.FC<SpreadBannerProps> = React.memo(
  ({
    displayCurrentPrice,
    lastTradeSide,
    spread,
    spreadPercent,
    isINR,
    inrRateMultiplier,
    precision,
  }) => {
    return (
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#191c1f] border-y border-[#272a2d] z-20 shrink-0 select-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm font-bold tracking-tight tabular-nums ${
              lastTradeSide === 'buy' ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
            }`}
          >
            {isINR
              ? `₹${displayCurrentPrice.toLocaleString('en-IN')}`
              : `$${displayCurrentPrice.toFixed(precision)}`}
          </span>
          {lastTradeSide === 'buy' ? (
            <ArrowUp className="w-3.5 h-3.5 text-[#00ff94]" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 text-[#ff3b4a]" />
          )}
        </div>

        <div className="flex items-center gap-1 text-[10px] text-[#99907f]">
          <span>Spread:</span>
          <span className="text-[#e1e2e7] font-medium tabular-nums">
            {isINR
              ? `₹${(spread * inrRateMultiplier).toFixed(2)}`
              : spread.toFixed(precision)}
          </span>
          <span className="text-[#99907f] tabular-nums">({spreadPercent.toFixed(3)}%)</span>
        </div>
      </div>
    );
  }
);

export const OrderBook: React.FC<OrderBookProps> = React.memo(
  ({
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
    const [viewMode, setViewMode] = useState<OrderBookViewMode>('both');
    const [grouping, setGrouping] = useState<number>(0.1);

    const isINR = currencyMode === 'INR' && inrPrice !== undefined && inrPrice > 0;
    const inrRateMultiplier = isINR && currentPrice > 0 ? inrPrice / currentPrice : 1;
    const displayCurrentPrice = isINR ? inrPrice : currentPrice;
    const currencyLabel = isINR ? 'INR (₹)' : 'USDT ($)';

    // Memoized price formatter to avoid unnecessary string allocations during tick storm
    const formatPrice = useCallback(
      (p: number) => {
        if (isINR) {
          const converted = p * inrRateMultiplier;
          return converted >= 1000
            ? converted.toLocaleString('en-IN', { maximumFractionDigits: 1 })
            : converted.toFixed(2);
        }
        return p.toFixed(precision);
      },
      [isINR, inrRateMultiplier, precision]
    );

    // Grouping & aggregation for Bids (descending: highest price first)
    const groupedBids = useMemo(() => {
      if (!bids || bids.length === 0) return [];
      if (grouping <= 0) return bids;

      const map = new Map<number, number>();
      for (let i = 0; i < bids.length; i++) {
        const b = bids[i];
        const grouped = Math.floor(b.price / grouping) * grouping;
        const rounded = Number(grouped.toFixed(precision));
        map.set(rounded, (map.get(rounded) || 0) + b.amount);
      }

      const sortedPrices = Array.from(map.keys()).sort((a, b) => b - a);
      const result: OrderBookItem[] = [];
      let cumTotal = 0;
      for (let i = 0; i < sortedPrices.length; i++) {
        const p = sortedPrices[i];
        const amount = map.get(p)!;
        cumTotal += amount;
        result.push({
          price: p,
          amount: Number(amount.toFixed(3)),
          total: Number(cumTotal.toFixed(3)),
          depthPercent: 0,
        });
      }
      return result;
    }, [bids, grouping, precision]);

    // Grouping & aggregation for Asks (ascending: lowest ask first)
    const groupedAsks = useMemo(() => {
      if (!asks || asks.length === 0) return [];
      if (grouping <= 0) return asks;

      const map = new Map<number, number>();
      for (let i = 0; i < asks.length; i++) {
        const a = asks[i];
        const grouped = Math.ceil(a.price / grouping) * grouping;
        const rounded = Number(grouped.toFixed(precision));
        map.set(rounded, (map.get(rounded) || 0) + a.amount);
      }

      const sortedPrices = Array.from(map.keys()).sort((a, b) => a - b);
      const result: OrderBookItem[] = [];
      let cumTotal = 0;
      for (let i = 0; i < sortedPrices.length; i++) {
        const p = sortedPrices[i];
        const amount = map.get(p)!;
        cumTotal += amount;
        result.push({
          price: p,
          amount: Number(amount.toFixed(3)),
          total: Number(cumTotal.toFixed(3)),
          depthPercent: 0,
        });
      }
      return result;
    }, [asks, grouping, precision]);

    // For split view (both): Asks are above the spread banner.
    // In standard exchange layout, lowest ask (best ask) sits directly above the spread banner,
    // and higher asks ascend upward. Reversing groupedAsks places the highest ask at index 0 and best ask at the bottom.
    const splitAsks = useMemo(() => {
      return [...groupedAsks].reverse();
    }, [groupedAsks]);

    // In asks-only mode, show from lowest ask (best ask) descending downward
    const asksOnlyList = useMemo(() => {
      return groupedAsks;
    }, [groupedAsks]);

    // Spread calculation
    const bestBid = groupedBids[0]?.price || currentPrice;
    const bestAsk = groupedAsks[0]?.price || currentPrice;
    const spread = Math.max(0, bestAsk - bestBid);
    const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;

    // Max totals for depth bar calculation
    const maxBidTotal = useMemo(() => {
      return groupedBids.length > 0 ? groupedBids[groupedBids.length - 1].total : 1;
    }, [groupedBids]);

    const maxAskTotal = useMemo(() => {
      return groupedAsks.length > 0 ? groupedAsks[groupedAsks.length - 1].total : 1;
    }, [groupedAsks]);

    const maxTotal = useMemo(() => {
      return Math.max(maxBidTotal, maxAskTotal, 1);
    }, [maxBidTotal, maxAskTotal]);

    // Stable rowProps objects for react-window List instances
    const splitAskRowProps = useMemo<AskRowData>(() => {
      return {
        items: splitAsks,
        maxTotal,
        formatPrice,
        onSelectPrice,
      };
    }, [splitAsks, maxTotal, formatPrice, onSelectPrice]);

    const asksOnlyRowProps = useMemo<AskRowData>(() => {
      return {
        items: asksOnlyList,
        maxTotal,
        formatPrice,
        onSelectPrice,
      };
    }, [asksOnlyList, maxTotal, formatPrice, onSelectPrice]);

    const bidRowProps = useMemo<BidRowData>(() => {
      return {
        items: groupedBids,
        maxTotal,
        formatPrice,
        onSelectPrice,
      };
    }, [groupedBids, maxTotal, formatPrice, onSelectPrice]);

    const tradeRowProps = useMemo<TradeRowData>(() => {
      return {
        trades: recentTrades,
        formatPrice,
        onSelectPrice,
      };
    }, [recentTrades, formatPrice, onSelectPrice]);

    return (
      <div
        id="order-book-container"
        className="flex flex-col h-full w-full bg-[#111417] border-l border-[#272a2d] font-mono text-[11px] select-none overflow-hidden"
      >
        {/* Header Tabs & Layout Controls */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[#191c1f] border-b border-[#272a2d] shrink-0 gap-2">
          {/* Main Tabs: Order Book vs Trades */}
          <div className="flex items-center gap-2">
            <button
              id="tab-orderbook"
              onClick={() => setActiveTab('book')}
              className={`flex items-center gap-1 font-bold text-xs pb-0.5 border-b-2 transition-colors cursor-pointer ${
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
              className={`flex items-center gap-1 font-bold text-xs pb-0.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'trades'
                  ? 'border-[#f6be16] text-[#fff8f1]'
                  : 'border-transparent text-[#99907f] hover:text-[#e1e2e7]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Trades</span>
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-[#272a2d] text-[#ffd87f] font-normal">
                {recentTrades.length}
              </span>
            </button>
          </div>

          {/* Controls: View Modes & Grouping */}
          {activeTab === 'book' ? (
            <div className="flex items-center gap-2 text-[10px]">
              {/* View Mode Selectors: Both, Bids Only, Asks Only */}
              <div className="flex items-center bg-[#14171a] p-0.5 rounded border border-[#272a2d] gap-0.5">
                <button
                  onClick={() => setViewMode('both')}
                  title="Default Split View (Asks & Bids)"
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    viewMode === 'both'
                      ? 'bg-[#272a2d] text-[#f6be16]'
                      : 'text-[#99907f] hover:text-[#e1e2e7]'
                  }`}
                >
                  <ArrowDownUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setViewMode('bids')}
                  title="Bids Only (Buys)"
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    viewMode === 'bids'
                      ? 'bg-[#272a2d] text-[#00ff94]'
                      : 'text-[#99907f] hover:text-[#e1e2e7]'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setViewMode('asks')}
                  title="Asks Only (Sells)"
                  className={`p-1 rounded cursor-pointer transition-colors ${
                    viewMode === 'asks'
                      ? 'bg-[#272a2d] text-[#ff3b4a]'
                      : 'text-[#99907f] hover:text-[#e1e2e7]'
                  }`}
                >
                  <TrendingDown className="w-3 h-3" />
                </button>
              </div>

              {/* Grouping Select Dropdown */}
              <div className="flex items-center gap-1 text-[#99907f]">
                <select
                  value={grouping}
                  onChange={(e) => setGrouping(Number(e.target.value))}
                  className="bg-[#272a2d] text-[#e1e2e7] px-1.5 py-0.5 rounded border border-[#323538] outline-none text-[10px] cursor-pointer hover:border-[#f6be16]/50 transition-colors"
                >
                  <option value={0.01}>0.01</option>
                  <option value={0.1}>0.1</option>
                  <option value={1}>1.0</option>
                  <option value={10}>10.0</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-[#99907f]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff94] animate-pulse" />
              <span className="text-[#00ff94] font-semibold">Live Tape</span>
            </div>
          )}
        </div>

        {/* Content View: Order Book vs Recent Trades */}
        {activeTab === 'book' ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Table Column Headers */}
            <div className="grid grid-cols-3 px-3 py-1 text-[#99907f] text-[10px] uppercase border-b border-[#272a2d]/50 bg-[#111417] shrink-0">
              <span>Price ({currencyLabel})</span>
              <span className="text-right">Size</span>
              <span className="text-right">Total</span>
            </div>

            {/* Split View: Top Asks + Mid Spread + Bottom Bids */}
            {viewMode === 'both' && (
              <>
                {/* 1. Virtualized Asks (Top Half) */}
                <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col justify-end">
                  <List<AskRowData>
                    rowCount={splitAsks.length}
                    rowHeight={22}
                    rowComponent={VirtualizedAskRow}
                    rowProps={splitAskRowProps}
                    style={{ height: '100%', width: '100%' }}
                    defaultHeight={180}
                    overscanCount={5}
                    rowKey={(index, data) => `${data.items[index]?.price}-${index}`}
                  />
                </div>

                {/* 2. Mid Market Spread Banner */}
                <SpreadBanner
                  currentPrice={currentPrice}
                  displayCurrentPrice={displayCurrentPrice}
                  lastTradeSide={lastTradeSide}
                  spread={spread}
                  spreadPercent={spreadPercent}
                  isINR={isINR}
                  inrRateMultiplier={inrRateMultiplier}
                  precision={precision}
                />

                {/* 3. Virtualized Bids (Bottom Half) */}
                <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                  <List<BidRowData>
                    rowCount={groupedBids.length}
                    rowHeight={22}
                    rowComponent={VirtualizedBidRow}
                    rowProps={bidRowProps}
                    style={{ height: '100%', width: '100%' }}
                    defaultHeight={180}
                    overscanCount={5}
                    rowKey={(index, data) => `${data.items[index]?.price}-${index}`}
                  />
                </div>
              </>
            )}

            {/* Full-Height Bids Only Mode */}
            {viewMode === 'bids' && (
              <>
                <SpreadBanner
                  currentPrice={currentPrice}
                  displayCurrentPrice={displayCurrentPrice}
                  lastTradeSide={lastTradeSide}
                  spread={spread}
                  spreadPercent={spreadPercent}
                  isINR={isINR}
                  inrRateMultiplier={inrRateMultiplier}
                  precision={precision}
                />
                <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                  <List<BidRowData>
                    rowCount={groupedBids.length}
                    rowHeight={22}
                    rowComponent={VirtualizedBidRow}
                    rowProps={bidRowProps}
                    style={{ height: '100%', width: '100%' }}
                    defaultHeight={360}
                    overscanCount={8}
                    rowKey={(index, data) => `${data.items[index]?.price}-${index}`}
                  />
                </div>
              </>
            )}

            {/* Full-Height Asks Only Mode */}
            {viewMode === 'asks' && (
              <>
                <SpreadBanner
                  currentPrice={currentPrice}
                  displayCurrentPrice={displayCurrentPrice}
                  lastTradeSide={lastTradeSide}
                  spread={spread}
                  spreadPercent={spreadPercent}
                  isINR={isINR}
                  inrRateMultiplier={inrRateMultiplier}
                  precision={precision}
                />
                <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                  <List<AskRowData>
                    rowCount={asksOnlyList.length}
                    rowHeight={22}
                    rowComponent={VirtualizedAskRow}
                    rowProps={asksOnlyRowProps}
                    style={{ height: '100%', width: '100%' }}
                    defaultHeight={360}
                    overscanCount={8}
                    rowKey={(index, data) => `${data.items[index]?.price}-${index}`}
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          /* Virtualized Recent Trades Feed */
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Table Column Headers */}
            <div className="grid grid-cols-3 px-3 py-1 text-[#99907f] text-[10px] uppercase border-b border-[#272a2d]/50 bg-[#111417] shrink-0">
              <span>Price ({currencyLabel})</span>
              <span className="text-right">Size</span>
              <span className="text-right">Time</span>
            </div>

            {/* Virtualized Trades List */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
              <List<TradeRowData>
                rowCount={recentTrades.length}
                rowHeight={24}
                rowComponent={VirtualizedTradeRow}
                rowProps={tradeRowProps}
                style={{ height: '100%', width: '100%' }}
                defaultHeight={380}
                overscanCount={8}
                rowKey={(index, data) => data.trades[index]?.id || index}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

