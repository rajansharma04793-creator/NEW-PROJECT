import React, { useState, useEffect } from 'react';
import {
  X,
  Fish,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Building2,
  Wallet,
  ExternalLink,
  Filter,
  RefreshCw,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { AssetPair, TickerData } from '../types';

interface WhaleTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: AssetPair;
  tickers: Record<AssetPair, TickerData>;
  onSelectPair?: (pair: AssetPair) => void;
}

interface WhaleTransaction {
  id: string;
  symbol: AssetPair;
  amount: number;
  valueUsd: number;
  type: 'market_buy' | 'market_sell' | 'exchange_inflow' | 'exchange_outflow' | 'transfer';
  source: string;
  destination: string;
  txHash: string;
  timestamp: number;
  significance: 'ultra' | 'high' | 'medium';
}

export const WhaleTrackerModal: React.FC<WhaleTrackerModalProps> = ({
  isOpen,
  onClose,
  currentPair,
  tickers,
  onSelectPair,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('ALL');
  const [minValueUsd, setMinValueUsd] = useState<number>(250000);
  const [filterType, setFilterType] = useState<string>('all');
  const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
  const [isLivePaused, setIsLivePaused] = useState(false);

  // Generate realistic historical and live whale alerts
  useEffect(() => {
    if (!isOpen) return;

    const initialTxs: WhaleTransaction[] = [
      {
        id: 'tx-1',
        symbol: 'BTC/USDT',
        amount: 85.4,
        valueUsd: 85.4 * (tickers['BTC/USDT']?.price || 96200),
        type: 'exchange_outflow',
        source: 'Binance Cold Storage',
        destination: 'Unknown Institutional Wallet (0x7a3...9b)',
        txHash: '0x8f4d...3e12',
        timestamp: Date.now() - 1000 * 60 * 2,
        significance: 'ultra',
      },
      {
        id: 'tx-2',
        symbol: 'ETH/USDT',
        amount: 1420.0,
        valueUsd: 1420.0 * (tickers['ETH/USDT']?.price || 2750),
        type: 'market_buy',
        source: 'CoinDCX Aggregated Orderbook',
        destination: 'Whale MultiSig Fund',
        txHash: '0x3c2a...89ff',
        timestamp: Date.now() - 1000 * 60 * 5,
        significance: 'high',
      },
      {
        id: 'tx-3',
        symbol: 'SOL/USDT',
        amount: 18500,
        valueUsd: 18500 * (tickers['SOL/USDT']?.price || 192),
        type: 'exchange_inflow',
        source: 'Whale Treasury',
        destination: 'CoinDCX Prime Desk',
        txHash: '5Knp...9mQq',
        timestamp: Date.now() - 1000 * 60 * 9,
        significance: 'high',
      },
      {
        id: 'tx-4',
        symbol: 'BTC/USDT',
        amount: 42.1,
        valueUsd: 42.1 * (tickers['BTC/USDT']?.price || 96200),
        type: 'market_buy',
        source: 'Bybit Institutional',
        destination: 'Spot Vault',
        txHash: '0x12a0...e89b',
        timestamp: Date.now() - 1000 * 60 * 14,
        significance: 'medium',
      },
      {
        id: 'tx-5',
        symbol: 'XRP/USDT',
        amount: 1250000,
        valueUsd: 1250000 * (tickers['XRP/USDT']?.price || 2.45),
        type: 'transfer',
        source: 'Ripple Custody',
        destination: 'Market Maker Escrow',
        txHash: 'rP4Q...88Lx',
        timestamp: Date.now() - 1000 * 60 * 22,
        significance: 'medium',
      },
      {
        id: 'tx-6',
        symbol: 'DOGE/USDT',
        amount: 8500000,
        valueUsd: 8500000 * (tickers['DOGE/USDT']?.price || 0.26),
        type: 'market_sell',
        source: 'Whale Wallet #104',
        destination: 'Binance Liquidity Pool',
        txHash: '0x992b...fa21',
        timestamp: Date.now() - 1000 * 60 * 31,
        significance: 'medium',
      },
    ];

    setTransactions(initialTxs);

    // Live stream interval adding new transactions every 8-15 seconds
    const interval = setInterval(() => {
      if (isLivePaused) return;

      const pairs: AssetPair[] = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'BNB/USDT'];
      const randomPair = pairs[Math.floor(Math.random() * pairs.length)];
      const currentP = tickers[randomPair]?.price || 100;

      const types: WhaleTransaction['type'][] = [
        'market_buy',
        'market_sell',
        'exchange_outflow',
        'exchange_inflow',
        'transfer',
      ];
      const randomType = types[Math.floor(Math.random() * types.length)];

      let baseAmount = 0;
      if (randomPair === 'BTC/USDT') baseAmount = 15 + Math.random() * 90;
      else if (randomPair === 'ETH/USDT') baseAmount = 300 + Math.random() * 1800;
      else if (randomPair === 'SOL/USDT') baseAmount = 4000 + Math.random() * 25000;
      else baseAmount = 50000 + Math.random() * 500000;

      const valueUsd = baseAmount * currentP;
      const significance: WhaleTransaction['significance'] =
        valueUsd > 3000000 ? 'ultra' : valueUsd > 1000000 ? 'high' : 'medium';

      const sources = [
        'Unknown Whale (0x4a...e1)',
        'Binance Cold Storage',
        'CoinDCX Custody',
        'Coinbase Prime',
        'Jump Trading',
        'Wintermute Market Maker',
        'Whale OTC Desk',
      ];
      const dests = [
        'Whale Private Vault',
        'CoinDCX Liquidity Pool',
        'Binance Hot Wallet',
        'Arbitrage Smart Contract',
        'BitGo Institutional Trust',
        'Spot Accumulation Desk',
      ];

      const newTx: WhaleTransaction = {
        id: `tx-live-${Date.now()}`,
        symbol: randomPair,
        amount: Number(baseAmount.toFixed(2)),
        valueUsd: Number(valueUsd.toFixed(2)),
        type: randomType,
        source: sources[Math.floor(Math.random() * sources.length)],
        destination: dests[Math.floor(Math.random() * dests.length)],
        txHash: `0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
        timestamp: Date.now(),
        significance,
      };

      setTransactions((prev) => [newTx, ...prev.slice(0, 35)]);
    }, 9000);

    return () => clearInterval(interval);
  }, [isOpen, tickers, isLivePaused]);

  if (!isOpen) return null;

  const filtered = transactions.filter((tx) => {
    if (selectedSymbol !== 'ALL' && tx.symbol !== selectedSymbol) return false;
    if (tx.valueUsd < minValueUsd) return false;
    if (filterType !== 'all') {
      if (filterType === 'buys' && tx.type !== 'market_buy' && tx.type !== 'exchange_outflow')
        return false;
      if (filterType === 'sells' && tx.type !== 'market_sell' && tx.type !== 'exchange_inflow')
        return false;
    }
    return true;
  });

  // Calculate net whale flow (Inflows vs Outflows / Buys vs Sells)
  const totalBuyFlow = transactions
    .filter((t) => t.type === 'market_buy' || t.type === 'exchange_outflow')
    .reduce((acc, t) => acc + t.valueUsd, 0);

  const totalSellFlow = transactions
    .filter((t) => t.type === 'market_sell' || t.type === 'exchange_inflow')
    .reduce((acc, t) => acc + t.valueUsd, 0);

  const netFlow = totalBuyFlow - totalSellFlow;
  const netBuyPercent = Math.round((totalBuyFlow / (totalBuyFlow + totalSellFlow || 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#171a1d] border border-[#2b2f36] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2f36] bg-[#121417]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00ff94]/10 border border-[#00ff94]/30 text-[#00ff94]">
              <Fish className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#fff8f1] font-mono tracking-wide">
                  WHALE & SMART MONEY RADAR
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#00ff94]/10 text-[#00ff94] border border-[#00ff94]/30 animate-pulse">
                  ● LIVE ON-CHAIN
                </span>
              </div>
              <p className="text-xs text-[#8e9099] font-mono">
                Real-time institutional transaction flow & exchange balance shifts (&gt;$250K)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLivePaused(!isLivePaused)}
              className={`px-3 py-1 text-xs font-mono rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
                isLivePaused
                  ? 'bg-[#ffd87f]/10 text-[#ffd87f] border-[#ffd87f]/30'
                  : 'bg-[#272a2d] text-[#d0c5b3] border-[#37393d] hover:bg-[#37393d]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${!isLivePaused ? 'animate-spin' : ''}`} />
              {isLivePaused ? 'Paused' : 'Streaming'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8e9099] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Whale Sentiment & Flow Barometer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-[#121417]/80 border-b border-[#2b2f36]">
          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36]">
            <span className="text-[11px] font-mono text-[#8e9099] uppercase block mb-1">
              Whale Accumulation Ratio
            </span>
            <div className="flex items-baseline justify-between mb-1.5">
              <span
                className={`text-xl font-bold font-mono ${netBuyPercent >= 50 ? 'text-[#00ff94]' : 'text-[#ff4d4d]'}`}
              >
                {netBuyPercent}% {netBuyPercent >= 50 ? 'BULLISH' : 'BEARISH'}
              </span>
              <span className="text-xs font-mono text-[#8e9099]">24h Sample</span>
            </div>
            <div className="w-full bg-[#272a2d] h-2 rounded-full overflow-hidden flex">
              <div
                className="bg-[#00ff94] h-full transition-all duration-500"
                style={{ width: `${netBuyPercent}%` }}
              />
              <div
                className="bg-[#ff4d4d] h-full transition-all duration-500"
                style={{ width: `${100 - netBuyPercent}%` }}
              />
            </div>
          </div>

          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36]">
            <span className="text-[11px] font-mono text-[#8e9099] uppercase block mb-1">
              Net Whale Flow (USD)
            </span>
            <div className="flex items-center gap-2">
              {netFlow >= 0 ? (
                <TrendingUp className="w-5 h-5 text-[#00ff94]" />
              ) : (
                <TrendingDown className="w-5 h-5 text-[#ff4d4d]" />
              )}
              <span
                className={`text-xl font-bold font-mono ${netFlow >= 0 ? 'text-[#00ff94]' : 'text-[#ff4d4d]'}`}
              >
                {netFlow >= 0 ? '+' : '-'}${Math.abs(netFlow / 1_000_000).toFixed(2)}M
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#8e9099] mt-1 block">
              {netFlow >= 0 ? 'Net Outflow from Exchanges (Hold)' : 'Net Inflow to Exchanges (Sell Risk)'}
            </span>
          </div>

          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36]">
            <span className="text-[11px] font-mono text-[#8e9099] uppercase block mb-1">
              Active Institutional Tickers
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT'] as AssetPair[]).map((pair) => (
                <button
                  key={pair}
                  onClick={() => {
                    setSelectedSymbol(pair);
                    if (onSelectPair) onSelectPair(pair);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                    currentPair === pair
                      ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40 font-bold'
                      : 'bg-[#272a2d] text-[#d0c5b3] hover:bg-[#37393d]'
                  }`}
                >
                  {pair.split('/')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#1c2024] p-3 rounded-lg border border-[#2b2f36] flex flex-col justify-center">
            <div className="flex items-center gap-2 text-[#ffd87f]">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold font-mono">Institutional Bias</span>
            </div>
            <p className="text-xs text-[#d0c5b3] font-mono mt-1">
              Heavy spot absorption observed below key support levels. Smart money setting limit buy walls.
            </p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#171a1d] border-b border-[#2b2f36] flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-[#8e9099] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Symbol:
            </span>
            {['ALL', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT'].map((sym) => (
              <button
                key={sym}
                onClick={() => setSelectedSymbol(sym)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  selectedSymbol === sym
                    ? 'bg-[#00ff94] text-[#121417] font-bold shadow-sm'
                    : 'bg-[#272a2d] text-[#8e9099] hover:text-[#fff8f1]'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#8e9099]">Min Value:</span>
              <select
                value={minValueUsd}
                onChange={(e) => setMinValueUsd(Number(e.target.value))}
                className="bg-[#272a2d] border border-[#37393d] rounded px-2.5 py-1 text-xs font-mono text-[#fff8f1] focus:outline-none focus:border-[#00ff94]"
              >
                <option value={100000}>&gt; $100K</option>
                <option value={250000}>&gt; $250K</option>
                <option value={1000000}>&gt; $1.0M (Whale)</option>
                <option value={3000000}>&gt; $3.0M (Mega Whale)</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[#272a2d] p-0.5 rounded border border-[#37393d]">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  filterType === 'all' ? 'bg-[#37393d] text-[#fff8f1]' : 'text-[#8e9099]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('buys')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  filterType === 'buys' ? 'bg-[#00ff94]/20 text-[#00ff94]' : 'text-[#8e9099]'
                }`}
              >
                Buys / Outflows
              </button>
              <button
                onClick={() => setFilterType('sells')}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  filterType === 'sells' ? 'bg-[#ff4d4d]/20 text-[#ff4d4d]' : 'text-[#8e9099]'
                }`}
              >
                Sells / Inflows
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table Feed */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[500px] space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-[#8e9099] font-mono text-sm">
              No whale transactions meet the current filter criteria.
            </div>
          ) : (
            filtered.map((tx) => {
              const isBullish = tx.type === 'market_buy' || tx.type === 'exchange_outflow';
              const isBearish = tx.type === 'market_sell' || tx.type === 'exchange_inflow';

              return (
                <div
                  key={tx.id}
                  className={`p-3.5 rounded-lg border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    tx.significance === 'ultra'
                      ? 'bg-[#1c221e] border-[#00ff94]/40 shadow-lg'
                      : 'bg-[#1a1d20] border-[#2b2f36] hover:border-[#3d424b]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isBullish
                          ? 'bg-[#00ff94]/10 text-[#00ff94] border border-[#00ff94]/30'
                          : isBearish
                          ? 'bg-[#ff4d4d]/10 text-[#ff4d4d] border border-[#ff4d4d]/30'
                          : 'bg-[#ffd87f]/10 text-[#ffd87f] border border-[#ffd87f]/30'
                      }`}
                    >
                      {isBullish ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : isBearish ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : (
                        <Wallet className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm font-mono text-[#fff8f1]">
                          {tx.amount.toLocaleString()} {tx.symbol.split('/')[0]}
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#272a2d] text-[#ffd87f]">
                          ${(tx.valueUsd / 1_000_000).toFixed(2)}M USD
                        </span>
                        {tx.significance === 'ultra' && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#ff9900]/20 text-[#ff9900] border border-[#ff9900]/40 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> MEGA WHALE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs font-mono text-[#8e9099]">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-[#d0c5b3]" /> {tx.source}
                        </span>
                        <span>➔</span>
                        <span>{tx.destination}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-[#2b2f36]">
                    <div className="text-right">
                      <span
                        className={`text-xs font-mono font-bold block ${
                          isBullish ? 'text-[#00ff94]' : isBearish ? 'text-[#ff4d4d]' : 'text-[#ffd87f]'
                        }`}
                      >
                        {tx.type === 'market_buy' && 'SPOT MARKET BUY'}
                        {tx.type === 'market_sell' && 'SPOT MARKET SELL'}
                        {tx.type === 'exchange_outflow' && 'EXCHANGE OUTFLOW (ACCUMULATION)'}
                        {tx.type === 'exchange_inflow' && 'EXCHANGE INFLOW (DUMP RISK)'}
                        {tx.type === 'transfer' && 'INTERNAL WHALE SHUFFLE'}
                      </span>
                      <span className="text-[10px] font-mono text-[#8e9099]">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (onSelectPair) onSelectPair(tx.symbol);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded bg-[#272a2d] hover:bg-[#00ff94] hover:text-[#121417] text-xs font-mono text-[#d0c5b3] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Trade</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-[#121417] border-t border-[#2b2f36] flex items-center justify-between text-xs font-mono text-[#8e9099]">
          <span>Integrated with CoinDCX, Binance, Bybit & On-Chain Mempools</span>
          <span className="text-[#00ff94]">● Latency: &lt;18ms</span>
        </div>
      </div>
    </div>
  );
};
