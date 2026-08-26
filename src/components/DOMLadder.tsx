import React, { useState } from 'react';
import { OrderBookItem, AssetPair } from '../types';
import { Layers, ArrowUpRight, ArrowDownRight, Zap, Target } from 'lucide-react';

interface DOMLadderProps {
  bids: OrderBookItem[];
  asks: OrderBookItem[];
  currentPrice: number;
  symbol: AssetPair;
  precision?: number;
  onPlaceOrder?: (order: {
    symbol: AssetPair;
    type: 'limit' | 'market';
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    leverage: number;
  }) => void;
}

export const DOMLadder: React.FC<DOMLadderProps> = ({
  bids,
  asks,
  currentPrice,
  symbol,
  precision = 2,
  onPlaceOrder,
}) => {
  const [orderSize, setOrderSize] = useState<number>(0.1);
  const [leverage, setLeverage] = useState<number>(10);

  const maxBidVol = Math.max(...bids.map((b) => b.amount), 1);
  const maxAskVol = Math.max(...asks.map((a) => a.amount), 1);

  const handleQuickLimit = (price: number, side: 'buy' | 'sell') => {
    onPlaceOrder?.({
      symbol,
      type: 'limit',
      side,
      price,
      amount: orderSize,
      leverage,
    });
  };

  const handleQuickMarket = (side: 'buy' | 'sell') => {
    onPlaceOrder?.({
      symbol,
      type: 'market',
      side,
      price: currentPrice,
      amount: orderSize,
      leverage,
    });
  };

  return (
    <div className="w-full h-full bg-[#111417] select-none flex flex-col font-mono text-xs overflow-hidden">
      {/* Top Quick Order Control Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#14171a] border-b border-[#272a2d] gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[#ffd87f] font-bold flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[#ffd87f]" />
            DOM LADDER
          </span>
          <span className="text-[#99907f]">({symbol})</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#1c2024] px-2 py-0.5 rounded border border-[#272a2d]">
            <span className="text-[#99907f] text-[10px]">Size:</span>
            <input
              type="number"
              value={orderSize}
              onChange={(e) => setOrderSize(Math.max(0.001, parseFloat(e.target.value) || 0.1))}
              className="w-14 bg-transparent text-[#e1e2e7] text-xs font-bold focus:outline-none"
              step="0.05"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#1c2024] px-2 py-0.5 rounded border border-[#272a2d]">
            <span className="text-[#99907f] text-[10px]">Lev:</span>
            <select
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value))}
              className="bg-transparent text-[#f6be16] text-xs font-bold focus:outline-none cursor-pointer"
            >
              {[1, 2, 5, 10, 20, 50, 100].map((l) => (
                <option key={l} value={l} className="bg-[#191c1f]">
                  {l}x
                </option>
              ))}
            </select>
          </div>

          {/* Quick Buy Market */}
          <button
            onClick={() => handleQuickMarket('buy')}
            className="px-2.5 py-1 rounded bg-[#00ff94] hover:bg-[#00e685] text-[#002111] font-bold text-[11px] transition-colors cursor-pointer"
          >
            MKT BUY
          </button>
          {/* Quick Sell Market */}
          <button
            onClick={() => handleQuickMarket('sell')}
            className="px-2.5 py-1 rounded bg-[#ff3b4a] hover:bg-[#e62b3a] text-white font-bold text-[11px] transition-colors cursor-pointer"
          >
            MKT SELL
          </button>
        </div>
      </div>

      {/* Ladder Header */}
      <div className="grid grid-cols-12 px-3 py-1 bg-[#191c1f] text-[10px] text-[#99907f] border-b border-[#272a2d] font-bold">
        <div className="col-span-3 text-left">BUY (BID) VOL</div>
        <div className="col-span-2 text-center">LIMIT BUY</div>
        <div className="col-span-2 text-center text-[#e1e2e7]">PRICE</div>
        <div className="col-span-2 text-center">LIMIT SELL</div>
        <div className="col-span-3 text-right">SELL (ASK) VOL</div>
      </div>

      {/* Ladder Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#1e2226]">
        {/* Asks (Desc) */}
        {asks.slice(0, 14).reverse().map((a, idx) => {
          const askDepth = (a.amount / maxAskVol) * 100;
          return (
            <div
              key={`ask-${idx}`}
              className="grid grid-cols-12 px-3 py-1 items-center hover:bg-[#191c1f] transition-colors relative"
            >
              {/* Bid side empty for ask price */}
              <div className="col-span-3"></div>

              <div className="col-span-2 text-center"></div>

              {/* Price */}
              <div className="col-span-2 text-center text-[#ff3b4a] font-bold">
                ${a.price.toFixed(precision)}
              </div>

              {/* 1-Click Limit Sell */}
              <div className="col-span-2 text-center">
                <button
                  onClick={() => handleQuickLimit(a.price, 'sell')}
                  className="px-1.5 py-0.5 rounded bg-[#ff3b4a]/20 hover:bg-[#ff3b4a]/40 text-[#ff3b4a] text-[10px] font-bold transition-colors cursor-pointer"
                >
                  SELL
                </button>
              </div>

              {/* Ask Volume with background bar */}
              <div className="col-span-3 text-right relative flex items-center justify-end">
                <div
                  className="absolute right-0 top-0 bottom-0 bg-[#ff3b4a]/15 rounded-xs"
                  style={{ width: `${askDepth}%` }}
                />
                <span className="relative z-10 text-[#e1e2e7]">{a.amount.toFixed(2)}</span>
              </div>
            </div>
          );
        })}

        {/* SPREAD / CURRENT PRICE ROW */}
        <div className="grid grid-cols-12 px-3 py-1.5 bg-[#f6be16]/10 border-y border-[#f6be16]/30 font-bold text-xs items-center">
          <div className="col-span-4 text-[#00ff94] text-left">MARKET SPREAD</div>
          <div className="col-span-4 text-center text-[#f6be16]">
            ${currentPrice.toFixed(precision)}
          </div>
          <div className="col-span-4 text-right text-[#99907f] text-[10px]">
            Tick Spread: $0.05
          </div>
        </div>

        {/* Bids */}
        {bids.slice(0, 14).map((b, idx) => {
          const bidDepth = (b.amount / maxBidVol) * 100;
          return (
            <div
              key={`bid-${idx}`}
              className="grid grid-cols-12 px-3 py-1 items-center hover:bg-[#191c1f] transition-colors relative"
            >
              {/* Bid Volume with background bar */}
              <div className="col-span-3 text-left relative flex items-center justify-start">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-[#00ff94]/15 rounded-xs"
                  style={{ width: `${bidDepth}%` }}
                />
                <span className="relative z-10 text-[#e1e2e7]">{b.amount.toFixed(2)}</span>
              </div>

              {/* 1-Click Limit Buy */}
              <div className="col-span-2 text-center">
                <button
                  onClick={() => handleQuickLimit(b.price, 'buy')}
                  className="px-1.5 py-0.5 rounded bg-[#00ff94]/20 hover:bg-[#00ff94]/40 text-[#00ff94] text-[10px] font-bold transition-colors cursor-pointer"
                >
                  BUY
                </button>
              </div>

              {/* Price */}
              <div className="col-span-2 text-center text-[#00ff94] font-bold">
                ${b.price.toFixed(precision)}
              </div>

              <div className="col-span-2 text-center"></div>
              <div className="col-span-3"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
