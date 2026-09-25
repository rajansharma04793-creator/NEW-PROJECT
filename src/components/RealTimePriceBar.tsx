import React from 'react';
import { TickerInfo, AssetPair } from '../types';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface RealTimePriceBarProps {
  tickers: Record<string, TickerInfo>;
  currentPair: AssetPair;
  onSelectPair: (pair: AssetPair) => void;
  currencyMode: 'USDT' | 'INR';
  onToggleCurrencyMode: () => void;
  coindcxLatency?: number;
  isCoinDCXLive?: boolean;
  onResetPrices?: () => void;
  isResettingPrices?: boolean;
}

export const RealTimePriceBar: React.FC<RealTimePriceBarProps> = ({
  tickers,
  currentPair,
  onSelectPair,
  currencyMode,
  onToggleCurrencyMode,
  coindcxLatency = 42,
  isCoinDCXLive = true,
  onResetPrices,
  isResettingPrices = false,
}) => {
  const btcTicker = tickers['BTC/USDT'] || {
    price: 77450.2,
    change24h: 1.85,
    inrPrice: 7639500,
    spotInrPrice: 7642000,
    inrChange24h: 1.85,
    usdtInrRate: 98.63,
  };

  const ethTicker = tickers['ETH/USDT'] || {
    price: 2420.5,
    change24h: -0.92,
    inrPrice: 238734,
    inrChange24h: -0.92,
  };

  const solTicker = tickers['SOL/USDT'] || {
    price: 184.2,
    change24h: 4.12,
    inrPrice: 18167,
    inrChange24h: 4.12,
  };

  const xauTicker = tickers['XAU/USDT'] || {
    price: 4634.75,
    change24h: 0.97,
    inrPrice: 457489.9,
    inrChange24h: 0.5,
  };

  const xagTicker = tickers['XAG/USDT'] || {
    price: 31.85,
    change24h: 1.45,
    inrPrice: 3141.35,
    inrChange24h: 1.45,
  };

  const eurTicker = tickers['EUR/USD'] || {
    price: 1.0845,
    change24h: 0.32,
    inrPrice: 94.62,
    inrChange24h: 0.32,
  };

  const usdinrTicker = tickers['USD/INR'] || {
    price: 86.845,
    change24h: 0.18,
    inrPrice: 86.845,
    inrChange24h: 0.18,
  };

  const btcPriceUsd = btcTicker.price || 77450;
  const btcChangeUsd = btcTicker.change24h || 0;
  const btcPriceInr = btcTicker.inrPrice || btcTicker.spotInrPrice || btcPriceUsd * (btcTicker.usdtInrRate || 98.63);
  const btcChangeInr = btcTicker.inrChange24h !== undefined ? btcTicker.inrChange24h : btcChangeUsd;
  const usdtInrRate = btcTicker.usdtInrRate || 98.63;

  return (
    <div
      id="coindcx-realtime-price-bar"
      className="flex items-center justify-between px-3 py-1 bg-[#14171a] border-b border-[#272a2d] text-xs font-mono select-none overflow-x-auto no-scrollbar gap-2 shrink-0 z-20"
    >
      {/* Left: Real-Time Live Pairs Strip */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Dual Status Indicators */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#191c1f] border border-[#272a2d] text-[10px]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff94] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00ff94]" />
            </span>
            <span className="text-[#00ff94] font-bold">CoinDCX</span>
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#191c1f] border border-[#272a2d] text-[10px]" title="Investing.com & Global Interbank Live Feed for Forex, Gold & Silver">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38bdf8] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#38bdf8]" />
            </span>
            <span className="text-[#38bdf8] font-bold">Investing.com</span>
          </div>
        </div>

        {/* 1. BTCUSDT Live Rate */}
        <button
          onClick={() => onSelectPair('BTC/USDT')}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
            currentPair === 'BTC/USDT' && currencyMode === 'USDT'
              ? 'bg-[#272a2d] border border-[#f6be16]/40 text-[#fff8f1]'
              : 'hover:bg-[#272a2d]/60 text-[#e1e2e7]'
          }`}
          title="Click to view BTC/USDT live chart"
        >
          <span className="font-bold text-[#f6be16]">BTC:</span>
          <span className="font-bold">${btcPriceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span
            className={`flex items-center text-[10px] font-bold px-1 rounded ${
              btcChangeUsd >= 0 ? 'bg-[#00ff94]/15 text-[#00ff94]' : 'bg-[#ff3b4a]/15 text-[#ff3b4a]'
            }`}
          >
            {btcChangeUsd >= 0 ? `+${btcChangeUsd.toFixed(2)}%` : `${btcChangeUsd.toFixed(2)}%`}
          </span>
        </button>

        <div className="w-[1px] h-3.5 bg-[#272a2d]" />

        {/* 2. Gold Futures XAU Live Rate (Investing.com) */}
        <button
          onClick={() => onSelectPair('XAU/USDT')}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
            currentPair === 'XAU/USDT'
              ? 'bg-[#272a2d] border border-[#f6be16]/40 text-[#fff8f1]'
              : 'hover:bg-[#272a2d]/60 text-[#e1e2e7]'
          }`}
          title="Investing.com Live Feed: Gold Futures & Spot (XAU/USD)"
        >
          <span className="font-bold text-[#eab308]">🥇 GOLD:</span>
          <span className="font-bold">${xauTicker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span
            className={`flex items-center text-[10px] font-bold px-1 rounded ${
              xauTicker.change24h >= 0 ? 'bg-[#00ff94]/15 text-[#00ff94]' : 'bg-[#ff3b4a]/15 text-[#ff3b4a]'
            }`}
          >
            {xauTicker.change24h >= 0 ? `+${xauTicker.change24h.toFixed(2)}%` : `${xauTicker.change24h.toFixed(2)}%`}
          </span>
        </button>

        <div className="w-[1px] h-3.5 bg-[#272a2d]" />

        {/* 3. Silver Perpetual XAG Live Rate (Investing.com) */}
        <button
          onClick={() => onSelectPair('XAG/USDT')}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
            currentPair === 'XAG/USDT'
              ? 'bg-[#272a2d] border border-[#f6be16]/40 text-[#fff8f1]'
              : 'hover:bg-[#272a2d]/60 text-[#e1e2e7]'
          }`}
          title="Investing.com Live Feed: Silver Perpetual (XAG/USD)"
        >
          <span className="font-bold text-[#94a3b8]">🥈 SILVER:</span>
          <span className="font-bold">${xagTicker.price.toFixed(3)}</span>
          <span
            className={`flex items-center text-[10px] font-bold px-1 rounded ${
              xagTicker.change24h >= 0 ? 'bg-[#00ff94]/15 text-[#00ff94]' : 'bg-[#ff3b4a]/15 text-[#ff3b4a]'
            }`}
          >
            {xagTicker.change24h >= 0 ? `+${xagTicker.change24h.toFixed(2)}%` : `${xagTicker.change24h.toFixed(2)}%`}
          </span>
        </button>

        <div className="w-[1px] h-3.5 bg-[#272a2d]" />

        {/* 4. EUR/USD Forex Rate (Investing.com) */}
        <button
          onClick={() => onSelectPair('EUR/USD')}
          className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
            currentPair === 'EUR/USD'
              ? 'bg-[#272a2d] border border-[#f6be16]/40 text-[#fff8f1]'
              : 'hover:bg-[#272a2d]/60 text-[#e1e2e7]'
          }`}
          title="Investing.com Live Feed: EUR/USD Interbank Forex"
        >
          <span className="font-bold text-[#38bdf8]">💶 EUR/USD:</span>
          <span className="font-bold">{eurTicker.price.toFixed(5)}</span>
          <span
            className={`flex items-center text-[10px] font-bold px-1 rounded ${
              eurTicker.change24h >= 0 ? 'bg-[#00ff94]/15 text-[#00ff94]' : 'bg-[#ff3b4a]/15 text-[#ff3b4a]'
            }`}
          >
            {eurTicker.change24h >= 0 ? `+${eurTicker.change24h.toFixed(2)}%` : `${eurTicker.change24h.toFixed(2)}%`}
          </span>
        </button>

        <div className="w-[1px] h-3.5 bg-[#272a2d] hidden sm:block" />

        {/* 5. USD/INR Forex Rate (Investing.com) */}
        <button
          onClick={() => onSelectPair('USD/INR')}
          className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
            currentPair === 'USD/INR'
              ? 'bg-[#272a2d] border border-[#f6be16]/40 text-[#fff8f1]'
              : 'hover:bg-[#272a2d]/60 text-[#e1e2e7]'
          }`}
          title="Investing.com Live Feed: USD/INR Foreign Exchange"
        >
          <span className="font-bold text-[#fb923c]">🇮🇳 USD/INR:</span>
          <span className="font-bold">₹{usdinrTicker.price.toFixed(4)}</span>
          <span
            className={`flex items-center text-[10px] font-bold px-1 rounded ${
              usdinrTicker.change24h >= 0 ? 'bg-[#00ff94]/15 text-[#00ff94]' : 'bg-[#ff3b4a]/15 text-[#ff3b4a]'
            }`}
          >
            {usdinrTicker.change24h >= 0 ? `+${usdinrTicker.change24h.toFixed(2)}%` : `${usdinrTicker.change24h.toFixed(2)}%`}
          </span>
        </button>

        <div className="w-[1px] h-3.5 bg-[#272a2d] hidden md:block" />

        {/* 6. USDTINR Live Exchange Rate */}
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 bg-[#191c1f] rounded border border-[#272a2d]"
          title="CoinDCX Live USDT to INR exchange conversion rate"
        >
          <span className="text-[#38bdf8] font-bold">USDT:</span>
          <span className="text-[#fff8f1] font-bold">₹{usdtInrRate.toFixed(2)}</span>
        </div>

        {/* 7. Quick secondary coins ETH and SOL */}
        <button
          onClick={() => onSelectPair('ETH/USDT')}
          className={`hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
            currentPair === 'ETH/USDT' ? 'bg-[#272a2d] text-[#fff8f1]' : 'text-[#99907f] hover:text-[#fff8f1]'
          }`}
        >
          <span className="text-[#e1e2e7]">ETH:</span>
          <span>{currencyMode === 'INR' ? `₹${(ethTicker.inrPrice || ethTicker.price * usdtInrRate).toLocaleString('en-IN')}` : `$${ethTicker.price.toFixed(2)}`}</span>
          <span className={ethTicker.change24h >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'}>
            {ethTicker.change24h >= 0 ? `+${ethTicker.change24h.toFixed(2)}%` : `${ethTicker.change24h.toFixed(2)}%`}
          </span>
        </button>

        <button
          onClick={() => onSelectPair('SOL/USDT')}
          className={`hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded transition-all cursor-pointer ${
            currentPair === 'SOL/USDT' ? 'bg-[#272a2d] text-[#fff8f1]' : 'text-[#99907f] hover:text-[#fff8f1]'
          }`}
        >
          <span className="text-[#e1e2e7]">SOL:</span>
          <span>{currencyMode === 'INR' ? `₹${(solTicker.inrPrice || solTicker.price * usdtInrRate).toLocaleString('en-IN')}` : `$${solTicker.price.toFixed(2)}`}</span>
          <span className={solTicker.change24h >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'}>
            {solTicker.change24h >= 0 ? `+${solTicker.change24h.toFixed(2)}%` : `${solTicker.change24h.toFixed(2)}%`}
          </span>
        </button>
      </div>

      {/* Right: Currency Mode Switcher & Quick Reset */}
      <div className="flex items-center gap-2 shrink-0">
        {onResetPrices && (
          <button
            onClick={onResetPrices}
            disabled={isResettingPrices}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
              isResettingPrices
                ? 'bg-[#f59e0b]/25 text-[#f59e0b] border-[#f59e0b]/40 animate-pulse'
                : 'bg-[#2563eb]/20 hover:bg-[#2563eb]/35 text-[#60a5fa] hover:text-white border-[#2563eb]/40'
            }`}
            title="Purge all cached prices & re-sync 100% fresh live rates with Binance & CoinDCX exchanges"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isResettingPrices ? 'animate-spin text-[#f59e0b]' : ''}`} />
            <span>{isResettingPrices ? 'Syncing...' : 'Reset All API Data'}</span>
          </button>
        )}

        <button
          onClick={onToggleCurrencyMode}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#f6be16] border border-[#37393d] text-[10px] font-bold cursor-pointer transition-colors"
          title="Toggle between USDT ($) and CoinDCX INR (₹) rates"
        >
          <span>{currencyMode === 'INR' ? '🇮🇳 ₹ INR Active' : '🌐 $ USDT Active'}</span>
        </button>
      </div>
    </div>
  );
};
