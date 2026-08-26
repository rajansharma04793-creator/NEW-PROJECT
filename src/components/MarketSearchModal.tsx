import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AssetPair, TickerInfo, CoinMetadata, MarketCategory } from '../types';
import { ALL_COINS_METADATA, searchCoins, INITIAL_TICKERS } from '../data/marketData';
import {
  Search,
  X,
  TrendingUp,
  Star,
  Flame,
  Layers,
  Cpu,
  Coins,
  Shield,
  Gem,
  ArrowUpDown,
  Check,
  Zap,
  Clock,
} from 'lucide-react';

interface MarketSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: AssetPair;
  tickers: Record<string, TickerInfo>;
  onSelectPair: (pair: AssetPair) => void;
  currencyMode?: 'USDT' | 'INR';
  onToggleCurrencyMode?: () => void;
}

const CATEGORY_TABS: { id: MarketCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'hot', label: 'Trending', icon: <Flame className="w-3.5 h-3.5 text-[#ff8400]" /> },
  { id: 'layer1', label: 'Layer 1', icon: <Zap className="w-3.5 h-3.5 text-[#f6be16]" /> },
  { id: 'ai', label: 'AI & Compute', icon: <Cpu className="w-3.5 h-3.5 text-[#00ff94]" /> },
  { id: 'defi', label: 'DeFi', icon: <Coins className="w-3.5 h-3.5 text-[#3b82f6]" /> },
  { id: 'meme', label: 'Memes', icon: <Flame className="w-3.5 h-3.5 text-[#ff3b4a]" /> },
  { id: 'commodities', label: 'Commodities', icon: <Gem className="w-3.5 h-3.5 text-[#e5c07b]" /> },
  { id: 'privacy', label: 'Privacy', icon: <Shield className="w-3.5 h-3.5 text-[#a855f7]" /> },
  { id: 'gainers', label: 'Top Gainers', icon: <TrendingUp className="w-3.5 h-3.5 text-[#00ff94]" /> },
];

export const MarketSearchModal: React.FC<MarketSearchModalProps> = ({
  isOpen,
  onClose,
  currentPair,
  tickers,
  onSelectPair,
  currencyMode = 'USDT',
  onToggleCurrencyMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'change' | 'price' | 'name'>('volume');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lumina_favorite_pairs');
      return saved ? JSON.parse(saved) : ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XAU/USDT', 'ZEC/USDT'];
    } catch {
      return ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
    }
  });

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lumina_recent_searches');
      return saved ? JSON.parse(saved) : ['BTC/USDT', 'SOL/USDT', 'XRP/USDT', 'ZEC/USDT'];
    } catch {
      return ['BTC/USDT', 'SOL/USDT'];
    }
  });

  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setHighlightedIndex(0);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Reset highlight index when query or category changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery, selectedCategory]);

  const toggleFavorite = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol];
      try {
        localStorage.setItem('lumina_favorite_pairs', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSelect = (symbol: AssetPair) => {
    onSelectPair(symbol);
    setRecentSearches((prev) => {
      const updated = [symbol, ...prev.filter((s) => s !== symbol)].slice(0, 8);
      try {
        localStorage.setItem('lumina_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    onClose();
  };

  // Filtered Coins List
  const filteredCoins = useMemo(() => {
    const matched = searchCoins(searchQuery, selectedCategory, sortBy);

    // Merge live ticker data
    return matched.map((coin) => {
      const live = tickers[coin.symbol] || INITIAL_TICKERS[coin.symbol];
      return {
        ...coin,
        liveTicker: live,
        isFavorite: favorites.includes(coin.symbol),
      };
    });
  }, [searchQuery, selectedCategory, sortBy, tickers, favorites]);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (filteredCoins.length > 0 ? (prev + 1) % filteredCoins.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          filteredCoins.length > 0 ? (prev - 1 + filteredCoins.length) % filteredCoins.length : 0
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCoins.length > 0 && filteredCoins[highlightedIndex]) {
          handleSelect(filteredCoins[highlightedIndex].symbol);
        } else if (searchQuery.trim()) {
          const raw = searchQuery.trim().toUpperCase();
          const customSym = raw.includes('USDT')
            ? (raw as AssetPair)
            : (`${raw}/USDT` as AssetPair);
          handleSelect(customSym);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filteredCoins, highlightedIndex, searchQuery]);

  if (!isOpen) return null;

  const cleanQuery = searchQuery.trim().toUpperCase().replace(/[\s\/-]+/g, '');
  const isCustomPairPossible =
    cleanQuery.length >= 2 &&
    !ALL_COINS_METADATA.some(
      (c) =>
        c.symbol.replace(/[\s\/-]+/g, '') === cleanQuery ||
        c.baseAsset.toUpperCase() === cleanQuery
    );

  const customPairSymbol = cleanQuery.endsWith('USDT')
    ? `${cleanQuery.slice(0, -4)}/USDT`
    : `${cleanQuery}/USDT`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#14171a] border border-[#272a2d] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#e1e2e7] font-mono z-10 animate-scaleUp">
        {/* Header & Search Bar */}
        <div className="p-3 sm:p-4 border-b border-[#272a2d] bg-[#191c1f] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#f6be16]/10 text-[#f6be16]">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#fff8f1] font-hanken">Select Trading Market</h2>
                <p className="text-[11px] text-[#99907f]">30+ Live perpetual & spot crypto, layer-1s, memes, AI & commodities</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onToggleCurrencyMode && (
                <button
                  type="button"
                  onClick={onToggleCurrencyMode}
                  className="px-2.5 py-1 rounded-lg bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-xs font-bold text-[#f6be16] transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Switch between CoinDCX INR (₹) and USDT ($) rates"
                >
                  <span>{currencyMode === 'INR' ? '🇮🇳 ₹ INR' : '🌐 $ USDT'}</span>
                  <span className="text-[9px] text-[#99907f] font-normal">Switch</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-[#99907f]" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by coin name, ticker, or tag (e.g. BTC, Bitcoin, Solana, Gold, AI, ZEC)..."
              className="w-full bg-[#111417] text-sm pl-10 pr-10 py-2.5 rounded-xl text-[#fff8f1] border border-[#272a2d] focus:border-[#f6be16] focus:outline-none placeholder-[#99907f]/60 transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded hover:bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Tag Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0 font-bold transition-all cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-[#f6be16] text-[#111417] shadow-sm'
                    : 'bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Access Strip: Favorites & Recents */}
        {!searchQuery && selectedCategory === 'all' && (
          <div className="px-4 py-2 bg-[#111417] border-b border-[#272a2d] flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[10px] text-[#99907f] flex items-center gap-1 font-bold">
              <Star className="w-3 h-3 text-[#f6be16]" /> Pinned:
            </span>
            {favorites.map((fav) => {
              const t = tickers[fav] || INITIAL_TICKERS[fav];
              if (!t) return null;
              return (
                <button
                  key={fav}
                  onClick={() => handleSelect(fav as AssetPair)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                    fav === currentPair
                      ? 'bg-[#f6be16]/20 text-[#f6be16] border-[#f6be16]/50'
                      : 'bg-[#191c1f] text-[#d0c5b3] border-[#272a2d] hover:border-[#99907f]'
                  }`}
                >
                  <span>{t.baseAsset}</span>
                  <span
                    className={`text-[10px] ${
                      t.change24h >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                    }`}
                  >
                    {t.change24h >= 0 ? `+${t.change24h.toFixed(1)}%` : `${t.change24h.toFixed(1)}%`}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sort Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#14171a] border-b border-[#272a2d] text-[11px] text-[#99907f]">
          <div className="flex items-center gap-2">
            <span>Markets ({filteredCoins.length})</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3" /> Sort by:
            </span>
            <button
              onClick={() => setSortBy('volume')}
              className={`hover:text-[#fff8f1] cursor-pointer ${sortBy === 'volume' ? 'text-[#f6be16] font-bold' : ''}`}
            >
              Volume
            </button>
            <button
              onClick={() => setSortBy('change')}
              className={`hover:text-[#fff8f1] cursor-pointer ${sortBy === 'change' ? 'text-[#f6be16] font-bold' : ''}`}
            >
              24h Change
            </button>
            <button
              onClick={() => setSortBy('price')}
              className={`hover:text-[#fff8f1] cursor-pointer ${sortBy === 'price' ? 'text-[#f6be16] font-bold' : ''}`}
            >
              Price
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`hover:text-[#fff8f1] cursor-pointer ${sortBy === 'name' ? 'text-[#f6be16] font-bold' : ''}`}
            >
              Name
            </button>
          </div>
        </div>

        {/* Coin List Scroll View */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#272a2d]/60 max-h-[55vh]">
          {filteredCoins.length > 0 ? (
            filteredCoins.map((coin, index) => {
              const isCurrent = coin.symbol === currentPair;
              const isHighlighted = highlightedIndex === index;
              const t: Partial<TickerInfo> & { price: number; change24h: number; high24h: number; low24h: number; turnover24h: number; precision: number } = coin.liveTicker || {
                price: 10,
                inrPrice: undefined,
                change24h: 0,
                high24h: 10.5,
                low24h: 9.5,
                turnover24h: 1000000,
                precision: coin.precision,
              };

              return (
                <div
                  key={coin.symbol}
                  onClick={() => handleSelect(coin.symbol)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-[#1f2327] transition-all cursor-pointer group ${
                    isHighlighted ? 'bg-[#272a2d] ring-1 ring-[#f6be16]/40' : isCurrent ? 'bg-[#272a2d]/60' : ''
                  }`}
                >
                  {/* Left: Star, Icon, Symbol, Name & Category */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => toggleFavorite(coin.symbol, e)}
                      className="text-[#99907f] hover:text-[#f6be16] transition-colors p-1"
                      title="Pin favorite"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          coin.isFavorite ? 'fill-[#f6be16] text-[#f6be16]' : ''
                        }`}
                      />
                    </button>

                    <div className="w-8 h-8 rounded-full bg-[#272a2d] flex items-center justify-center font-bold text-xs text-[#fff8f1] border border-[#37393d] group-hover:border-[#f6be16] transition-colors">
                      {coin.baseAsset.slice(0, 3)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 font-bold text-sm text-[#fff8f1]">
                        <span>{coin.symbol}</span>
                        {isCurrent && (
                          <span className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#00ff94]/15 text-[#00ff94] text-[10px] font-bold">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                        {coin.isHot && (
                          <span className="px-1.5 py-0.2 rounded bg-[#ff8400]/15 text-[#ff8400] text-[9px] font-bold">
                            HOT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#99907f] flex items-center gap-2">
                        <span>{coin.name}</span>
                        <span className="text-[10px] uppercase px-1 py-0.2 rounded bg-[#111417] text-[#99907f]">
                          {coin.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: 24h Stats, Price & % Change */}
                  <div className="flex items-center gap-6 text-right">
                    {/* 24h Volume */}
                    <div className="hidden sm:block">
                      <div className="text-[10px] text-[#99907f]">24h Volume</div>
                      <div className="text-xs font-bold text-[#d0c5b3]">
                        ${(t.turnover24h >= 1e9
                          ? (t.turnover24h / 1e9).toFixed(2) + 'B'
                          : t.turnover24h >= 1e6
                          ? (t.turnover24h / 1e6).toFixed(2) + 'M'
                          : (t.turnover24h / 1e3).toFixed(1) + 'K'
                        )}
                      </div>
                    </div>

                    {/* Price & Change Badge */}
                    <div className="min-w-[110px]">
                      <div className="text-sm font-extrabold text-[#fff8f1]">
                        {currencyMode === 'INR' && t.inrPrice
                          ? `₹${t.inrPrice.toLocaleString('en-IN')}`
                          : `$${t.price.toFixed(coin.precision)}`}
                      </div>
                      <div className="text-[10px] text-[#99907f] font-mono">
                        {currencyMode === 'INR'
                          ? `$${t.price.toFixed(coin.precision)} USDT`
                          : t.inrPrice
                          ? `₹${t.inrPrice.toLocaleString('en-IN')}`
                          : null}
                      </div>
                      <span
                        className={`inline-block text-[11px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                          (currencyMode === 'INR' && t.inrChange24h !== undefined ? t.inrChange24h : t.change24h) >= 0
                            ? 'bg-[#00ff94]/15 text-[#00ff94]'
                            : 'bg-[#ff3b4a]/15 text-[#ff3b4a]'
                        }`}
                      >
                        {(currencyMode === 'INR' && t.inrChange24h !== undefined ? t.inrChange24h : t.change24h) >= 0
                          ? `+${(currencyMode === 'INR' && t.inrChange24h !== undefined ? t.inrChange24h : t.change24h).toFixed(2)}%`
                          : `${(currencyMode === 'INR' && t.inrChange24h !== undefined ? t.inrChange24h : t.change24h).toFixed(2)}%`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 px-4 text-center">
              <p className="text-sm font-bold text-[#fff8f1] mb-1">No default markets match "{searchQuery}"</p>
              <p className="text-xs text-[#99907f] max-w-md mx-auto mb-4">
                You can trade any custom cryptocurrency or perpetual pair on Lumina Terminal with live synthetic depth.
              </p>

              {isCustomPairPossible && (
                <button
                  onClick={() => handleSelect(customPairSymbol as AssetPair)}
                  className="px-4 py-2 rounded-xl bg-[#f6be16] hover:bg-[#f6be16]/90 text-[#111417] font-bold text-xs flex items-center gap-2 mx-auto cursor-pointer shadow-lg transition-all"
                >
                  <Zap className="w-4 h-4" />
                  <span>Launch {customPairSymbol} Perpetual Market</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#191c1f] border-t border-[#272a2d] flex items-center justify-between text-[11px] text-[#99907f]">
          <div className="flex items-center gap-3">
            <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-[#272a2d] rounded text-[#fff8f1]">Ctrl + K</kbd> anytime to open</span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] rounded font-bold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
