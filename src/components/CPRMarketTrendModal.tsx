import React, { useState, useMemo } from 'react';
import {
  AssetPair,
  TickerInfo,
  AISignal,
} from '../types';
import {
  AssetCPRTrendData,
  CPRTrendCategory,
  CPRWidthType,
  scanAllAssetsCPRTrend,
} from '../utils/cprScannerUtils';
import {
  Compass,
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Shield,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  Copy,
  Check,
  BarChart2,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Flame,
  AlertTriangle,
  RefreshCw,
  X,
  Maximize2,
  Table,
  LayoutGrid,
} from 'lucide-react';

interface CPRMarketTrendModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: Record<AssetPair, TickerInfo>;
  onSelectPair: (pair: AssetPair) => void;
  onOpenCopilot?: () => void;
  onExecuteTrade?: (params: any) => void;
  currentTimeframe?: string;
}

export const CPRMarketTrendModal: React.FC<CPRMarketTrendModalProps> = ({
  isOpen,
  onClose,
  tickers,
  onSelectPair,
  onOpenCopilot,
  onExecuteTrade,
  currentTimeframe = '15m',
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(currentTimeframe);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [trendFilter, setTrendFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<AssetCPRTrendData | null>(null);
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Scan all assets
  const { assets, overview } = useMemo(() => {
    return scanAllAssetsCPRTrend(tickers, selectedTimeframe);
  }, [tickers, selectedTimeframe, isRefreshing]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      // Search query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // Trend filter
      if (trendFilter === 'bullish') {
        return item.trendCategory === 'STRONG_BULLISH' || item.trendCategory === 'MILD_BULLISH';
      }
      if (trendFilter === 'above_tc') {
        return item.trendCategory === 'STRONG_BULLISH';
      }
      if (trendFilter === 'bearish') {
        return item.trendCategory === 'STRONG_BEARISH' || item.trendCategory === 'MILD_BEARISH';
      }
      if (trendFilter === 'below_bc') {
        return item.trendCategory === 'STRONG_BEARISH';
      }
      if (trendFilter === 'narrow') {
        return item.cpr.widthType === 'NARROW';
      }
      if (trendFilter === 'inside_cpr') {
        return item.trendCategory === 'RANGEBOUND';
      }
      if (trendFilter === 'virgin') {
        return item.isVirginCPR;
      }

      return true;
    });
  }, [assets, searchQuery, categoryFilter, trendFilter]);

  const handleCopyLevels = (item: AssetCPRTrendData, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `🎯 ${item.symbol} CPR LEVELS (${selectedTimeframe}):
• Live Price: $${item.price}
• Top Central (TC): $${item.cpr.tcActual}
• Central Pivot (P): $${item.cpr.pivot}
• Bottom Central (BC): $${item.cpr.bcActual}
• CPR Width: ${item.cpr.cprWidthPercent}% (${item.cpr.widthType})
• Trend Bias: ${item.trendLabel}
• R1 Target: $${item.cpr.r1} | S1 Support: $${item.cpr.s1}`;

    navigator.clipboard.writeText(text);
    setCopiedSymbol(item.symbol);
    setTimeout(() => setCopiedSymbol(null), 2000);
  };

  const handleSelectAndClose = (symbol: AssetPair) => {
    onSelectPair(symbol);
    onClose();
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-[#111417] border border-[#272a2d] w-full max-w-7xl h-[92vh] max-h-[920px] rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Top Header */}
        <div className="p-3 sm:p-4 border-b border-[#272a2d] bg-[#15191d] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#00ff94]/15 border border-[#00ff94]/40 flex items-center justify-center text-[#00ff94] shadow-[0_0_15px_rgba(0,255,148,0.2)]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold font-mono text-white tracking-wide">
                  CENTRAL PIVOT RANGE (CPR) MARKET TREND SCANNER
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/30">
                  LIVE 30+ PAIRS
                </span>
              </div>
              <p className="text-[11px] text-[#99907f] hidden sm:block">
                Real-time multi-asset CPR geometry, institutional trend detection, and breakout radar.
              </p>
            </div>
          </div>

          {/* Timeframe & Action Controls */}
          <div className="flex items-center gap-2">
            {/* Timeframe Pills */}
            <div className="flex bg-[#191c1f] p-1 rounded-lg border border-[#272a2d]">
              {['5m', '15m', '1h', '4h', '1D'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-all ${
                    selectedTimeframe === tf
                      ? 'bg-[#00ff94] text-[#002111] font-bold shadow-sm'
                      : 'text-[#99907f] hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex bg-[#191c1f] p-1 rounded-lg border border-[#272a2d]">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'cards' ? 'bg-[#272a2d] text-[#00ff94]' : 'text-[#99907f] hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'table' ? 'bg-[#272a2d] text-[#00ff94]' : 'text-[#99907f] hover:text-white'
                }`}
                title="Matrix Table View"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>

            {/* Guide Button */}
            <button
              onClick={() => setShowGuide((prev) => !prev)}
              className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5 ${
                showGuide
                  ? 'bg-[#ffd87f]/20 border-[#ffd87f] text-[#ffd87f]'
                  : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CPR Guide</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-lg bg-[#191c1f] border border-[#272a2d] text-[#99907f] hover:text-white transition-all ${
                isRefreshing ? 'animate-spin text-[#00ff94]' : ''
              }`}
              title="Refresh CPR Scanner"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#191c1f] border border-[#272a2d] text-[#99907f] hover:text-white hover:bg-[#ff3b4a]/20 hover:border-[#ff3b4a]/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CPR Market Breadth Summary Bar */}
        <div className="bg-[#0e1114] border-b border-[#272a2d] p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 text-xs font-mono">
          {/* Breadth Gauge */}
          <div className="bg-[#15191d] p-2.5 rounded-lg border border-[#272a2d] flex flex-col justify-between">
            <span className="text-[10px] text-[#99907f] uppercase">Market CPR Breadth</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-bold text-[#00ff94]">{overview.bullishBreadthPercent}% Bullish</span>
              <span className="text-[10px] text-[#ff3b4a]">{overview.bearishBreadthPercent}% Bear</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-[#ff3b4a]/30 rounded-full mt-1.5 overflow-hidden flex">
              <div
                className="h-full bg-[#00ff94]"
                style={{ width: `${overview.bullishBreadthPercent}%` }}
              />
            </div>
          </div>

          {/* Above TC (Strong Bullish) */}
          <div
            onClick={() => setTrendFilter('above_tc')}
            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
              trendFilter === 'above_tc'
                ? 'bg-[#00ff94]/15 border-[#00ff94]'
                : 'bg-[#15191d] border-[#272a2d] hover:border-[#00ff94]/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#99907f]">ABOVE TOP CENTRAL</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#00ff94]" />
            </div>
            <div className="text-lg font-bold text-[#00ff94] mt-0.5">{overview.strongBullishCount}</div>
            <span className="text-[9px] text-[#00ff94]/80">Strong Bullish Bias</span>
          </div>

          {/* Below BC (Strong Bearish) */}
          <div
            onClick={() => setTrendFilter('below_bc')}
            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
              trendFilter === 'below_bc'
                ? 'bg-[#ff3b4a]/15 border-[#ff3b4a]'
                : 'bg-[#15191d] border-[#272a2d] hover:border-[#ff3b4a]/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#99907f]">BELOW BOTTOM CENTRAL</span>
              <TrendingDown className="w-3.5 h-3.5 text-[#ff3b4a]" />
            </div>
            <div className="text-lg font-bold text-[#ff3b4a] mt-0.5">{overview.strongBearishCount}</div>
            <span className="text-[9px] text-[#ff3b4a]/80">Strong Bearish Supply</span>
          </div>

          {/* Narrow CPR (Breakout Scanner) */}
          <div
            onClick={() => setTrendFilter('narrow')}
            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
              trendFilter === 'narrow'
                ? 'bg-[#ffd87f]/15 border-[#ffd87f]'
                : 'bg-[#15191d] border-[#272a2d] hover:border-[#ffd87f]/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#ffd87f]">NARROW CPR RADAR</span>
              <Zap className="w-3.5 h-3.5 text-[#ffd87f]" />
            </div>
            <div className="text-lg font-bold text-[#ffd87f] mt-0.5">{overview.narrowCPRCount}</div>
            <span className="text-[9px] text-[#ffd87f]/80">Explosive Breakouts</span>
          </div>

          {/* Rangebound / Inside CPR */}
          <div
            onClick={() => setTrendFilter('inside_cpr')}
            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
              trendFilter === 'inside_cpr'
                ? 'bg-[#38bdf8]/15 border-[#38bdf8]'
                : 'bg-[#15191d] border-[#272a2d] hover:border-[#38bdf8]/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#99907f]">INSIDE CPR (CHOP)</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#e5c07b]" />
            </div>
            <div className="text-lg font-bold text-[#e5c07b] mt-0.5">{overview.rangeboundCount}</div>
            <span className="text-[9px] text-[#99907f]">No-Trade Chop Zone</span>
          </div>

          {/* Quick Summary Pill */}
          <div className="bg-[#15191d] p-2.5 rounded-lg border border-[#272a2d] flex flex-col justify-between">
            <span className="text-[10px] text-[#99907f]">AI MARKET VERDICT</span>
            <div className="text-xs font-bold text-white leading-tight mt-1 line-clamp-2">
              {overview.marketSentiment === 'EXTREME_BULLISH' || overview.marketSentiment === 'BULLISH' ? (
                <span className="text-[#00ff94]">🟢 Long Breakouts Dominant</span>
              ) : overview.marketSentiment === 'EXTREME_BEARISH' || overview.marketSentiment === 'BEARISH' ? (
                <span className="text-[#ff3b4a]">🔴 Short Resistance Rejections</span>
              ) : (
                <span className="text-[#ffd87f]">🟡 Neutral CPR Rangebound</span>
              )}
            </div>
            <span className="text-[9px] text-[#99907f]">{selectedTimeframe} Session</span>
          </div>
        </div>

        {/* Educational Guide Drawer (Collapsible) */}
        {showGuide && (
          <div className="bg-[#191c1f] border-b border-[#272a2d] p-4 text-xs font-mono space-y-3 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#ffd87f] flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                CPR (CENTRAL PIVOT RANGE) TRADING SYSTEM GUIDE
              </span>
              <button onClick={() => setShowGuide(false)} className="text-[#99907f] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] leading-relaxed">
              <div className="bg-[#111417] p-3 rounded border border-[#272a2d]">
                <span className="font-bold text-[#00ff94] block mb-1">1. Price Above TC (Top Central)</span>
                <p className="text-[#99907f]">
                  Jab price Top Central ke upar candle close karta hai, toh market <b>High Conviction Bullish</b> hota hai. 
                  Yahan dips par Buy / Long setup plan karein targeting R1 ($R1) aur R2.
                </p>
              </div>
              <div className="bg-[#111417] p-3 rounded border border-[#272a2d]">
                <span className="font-bold text-[#ff3b4a] block mb-1">2. Price Below BC (Bottom Central)</span>
                <p className="text-[#99907f]">
                  Jab price Bottom Central ke neeche break karta hai, toh heavy seller dominance hoti hai.
                  Yahan rallies par Sell / Short setup banayein targeting S1 ($S1) aur S2.
                </p>
              </div>
              <div className="bg-[#111417] p-3 rounded border border-[#272a2d]">
                <span className="font-bold text-[#ffd87f] block mb-1">3. Narrow CPR vs Wide CPR</span>
                <p className="text-[#99907f]">
                  <b>Narrow CPR:</b> Explosive trending day / breakout trigger. <br />
                  <b>Wide CPR:</b> Sideways chop day, mean-reversion trading between BC and TC.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filter Toolbar & Search */}
        <div className="p-3 border-b border-[#272a2d] bg-[#131619] flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#99907f]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symbol (e.g. BTC, ETH, SOL, DOGE, Gold, ZEC)..."
              className="w-full bg-[#191c1f] border border-[#272a2d] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#686357] font-mono focus:outline-none focus:border-[#00ff94]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-[#99907f] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All Pairs (${assets.length})` },
              { id: 'above_tc', label: `🟢 Above TC (${overview.strongBullishCount})` },
              { id: 'below_bc', label: `🔴 Below BC (${overview.strongBearishCount})` },
              { id: 'narrow', label: `⚡ Narrow CPR (${overview.narrowCPRCount})` },
              { id: 'inside_cpr', label: `⚠️ Inside CPR (${overview.rangeboundCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTrendFilter(tab.id)}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all border ${
                  trendFilter === tab.id
                    ? 'bg-[#00ff94] border-[#00ff94] text-[#002111] font-bold'
                    : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#191c1f] border border-[#272a2d] text-xs font-mono text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00ff94]"
          >
            <option value="all">All Categories</option>
            <option value="layer1">Layer 1</option>
            <option value="defi">DeFi</option>
            <option value="meme">Meme Coins</option>
            <option value="privacy">Privacy</option>
            <option value="commodities">Commodities</option>
            <option value="ai">AI Coins</option>
          </select>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-[#0d0f11]">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Compass className="w-12 h-12 text-[#99907f]/40 mb-3" />
              <h3 className="text-sm font-mono font-bold text-white">No Assets Match CPR Filters</h3>
              <p className="text-xs text-[#99907f] mt-1">Try resetting search query or selecting 'All Pairs'.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTrendFilter('all');
                  setCategoryFilter('all');
                }}
                className="mt-3 px-3 py-1.5 bg-[#191c1f] border border-[#272a2d] text-[#00ff94] text-xs font-mono rounded-lg hover:bg-[#272a2d]"
              >
                Reset Filters
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredAssets.map((item) => {
                const isBullish = item.trendCategory === 'STRONG_BULLISH' || item.trendCategory === 'MILD_BULLISH';
                const isStrongBull = item.trendCategory === 'STRONG_BULLISH';
                const isStrongBear = item.trendCategory === 'STRONG_BEARISH';
                const isInside = item.trendCategory === 'RANGEBOUND';

                return (
                  <div
                    key={item.symbol}
                    onClick={() => setSelectedAssetDetail(item)}
                    className={`bg-[#14171a] border rounded-xl p-3.5 transition-all cursor-pointer hover:shadow-lg relative overflow-hidden flex flex-col justify-between ${
                      isStrongBull
                        ? 'border-[#00ff94]/40 hover:border-[#00ff94]'
                        : isStrongBear
                        ? 'border-[#ff3b4a]/40 hover:border-[#ff3b4a]'
                        : 'border-[#272a2d] hover:border-[#38bdf8]/50'
                    }`}
                  >
                    {/* Top Bar: Symbol, 24h Change, CPR Width badge */}
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-white">{item.symbol}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#1f2429] text-[#99907f]">
                              {item.category.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#99907f] truncate max-w-[140px]">{item.name}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-white">
                            ${item.price.toFixed(item.precision)}
                          </div>
                          <div
                            className={`text-[11px] font-mono font-bold flex items-center justify-end gap-0.5 ${
                              item.change24h >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                            }`}
                          >
                            {item.change24h >= 0 ? '+' : ''}
                            {item.change24h.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      {/* CPR Trend Status Badge */}
                      <div className="mt-2.5 flex items-center justify-between gap-1.5">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                            isStrongBull
                              ? 'bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/30'
                              : isStrongBear
                              ? 'bg-[#ff3b4a]/15 text-[#ff3b4a] border border-[#ff3b4a]/30'
                              : isInside
                              ? 'bg-[#ffd87f]/15 text-[#ffd87f] border border-[#ffd87f]/30'
                              : 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30'
                          }`}
                        >
                          {isStrongBull ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : isStrongBear ? (
                            <ArrowDownRight className="w-3 h-3" />
                          ) : (
                            <Activity className="w-3 h-3" />
                          )}
                          {item.trendLabel}
                        </span>

                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            item.cpr.widthType === 'NARROW'
                              ? 'bg-[#ffd87f]/20 text-[#ffd87f] border border-[#ffd87f]/40'
                              : item.cpr.widthType === 'WIDE'
                              ? 'bg-[#272a2d] text-[#99907f]'
                              : 'bg-[#191c1f] text-[#38bdf8]'
                          }`}
                        >
                          {item.cpr.widthType === 'NARROW' ? '⚡ NARROW CPR' : `${item.cpr.widthType} CPR`}
                        </span>
                      </div>

                      {/* CPR Key Levels Geometry Grid */}
                      <div className="mt-3 bg-[#0d0f11] rounded-lg p-2.5 border border-[#22262a] text-[10px] font-mono space-y-1.5">
                        <div className="flex justify-between items-center text-[#99907f]">
                          <span>Top Central (TC):</span>
                          <span className="text-white font-bold">${item.cpr.tcActual}</span>
                        </div>
                        <div className="flex justify-between items-center text-[#99907f]">
                          <span>Central Pivot (P):</span>
                          <span className="text-[#00ff94] font-bold">${item.cpr.pivot}</span>
                        </div>
                        <div className="flex justify-between items-center text-[#99907f]">
                          <span>Bottom Central (BC):</span>
                          <span className="text-white font-bold">${item.cpr.bcActual}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-[#22262a] pt-1 text-[#99907f]">
                          <span>Targets:</span>
                          <span className="text-[#ffd87f]">
                            R1: ${item.cpr.r1} | S1: ${item.cpr.s1}
                          </span>
                        </div>
                      </div>

                      {/* Action Plan Summary */}
                      <div className="mt-2 text-[10px] font-mono text-[#99907f] line-clamp-2 leading-relaxed">
                        {item.explanationHindi}
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="mt-3 pt-2.5 border-t border-[#22262a] flex items-center justify-between gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAndClose(item.symbol);
                        }}
                        className="flex-1 py-1.5 px-2 bg-[#00ff94]/15 hover:bg-[#00ff94] text-[#00ff94] hover:text-[#002111] text-[10px] font-mono font-bold rounded-lg transition-colors border border-[#00ff94]/30 flex items-center justify-center gap-1"
                      >
                        <BarChart2 className="w-3 h-3" />
                        VIEW CHART
                      </button>

                      <button
                        onClick={(e) => handleCopyLevels(item, e)}
                        className="p-1.5 bg-[#191c1f] hover:bg-[#272a2d] text-[#99907f] hover:text-white rounded-lg border border-[#272a2d] transition-colors"
                        title="Copy CPR Levels"
                      >
                        {copiedSymbol === item.symbol ? (
                          <Check className="w-3.5 h-3.5 text-[#00ff94]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Matrix Table View */
            <div className="bg-[#14171a] rounded-xl border border-[#272a2d] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#191c1f] text-[#99907f] border-b border-[#272a2d]">
                    <tr>
                      <th className="p-3">ASSET / PAIR</th>
                      <th className="p-3 text-right">PRICE</th>
                      <th className="p-3 text-right">24H CHANGE</th>
                      <th className="p-3 text-center">CPR TREND BIAS</th>
                      <th className="p-3 text-center">CPR WIDTH</th>
                      <th className="p-3 text-right">TC (TOP)</th>
                      <th className="p-3 text-right">PIVOT (P)</th>
                      <th className="p-3 text-right">BC (BOTTOM)</th>
                      <th className="p-3 text-right">R1 / S1</th>
                      <th className="p-3 text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22262a]">
                    {filteredAssets.map((item) => {
                      const isStrongBull = item.trendCategory === 'STRONG_BULLISH';
                      const isStrongBear = item.trendCategory === 'STRONG_BEARISH';

                      return (
                        <tr
                          key={item.symbol}
                          onClick={() => setSelectedAssetDetail(item)}
                          className="hover:bg-[#1c2024] cursor-pointer transition-colors"
                        >
                          <td className="p-3">
                            <div className="font-bold text-white">{item.symbol}</div>
                            <div className="text-[10px] text-[#99907f]">{item.name}</div>
                          </td>
                          <td className="p-3 text-right font-bold text-white">
                            ${item.price.toFixed(item.precision)}
                          </td>
                          <td
                            className={`p-3 text-right font-bold ${
                              item.change24h >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                            }`}
                          >
                            {item.change24h >= 0 ? '+' : ''}
                            {item.change24h.toFixed(2)}%
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                isStrongBull
                                  ? 'bg-[#00ff94]/15 text-[#00ff94]'
                                  : isStrongBear
                                  ? 'bg-[#ff3b4a]/15 text-[#ff3b4a]'
                                  : 'bg-[#ffd87f]/15 text-[#ffd87f]'
                              }`}
                            >
                              {item.trendLabel}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                item.cpr.widthType === 'NARROW'
                                  ? 'bg-[#ffd87f]/20 text-[#ffd87f]'
                                  : 'text-[#99907f]'
                              }`}
                            >
                              {item.cpr.widthType} ({item.cpr.cprWidthPercent}%)
                            </span>
                          </td>
                          <td className="p-3 text-right text-[#e0e0e0]">${item.cpr.tcActual}</td>
                          <td className="p-3 text-right text-[#00ff94] font-bold">${item.cpr.pivot}</td>
                          <td className="p-3 text-right text-[#e0e0e0]">${item.cpr.bcActual}</td>
                          <td className="p-3 text-right text-[#ffd87f]">
                            R1: ${item.cpr.r1} | S1: ${item.cpr.s1}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAndClose(item.symbol);
                              }}
                              className="px-2.5 py-1 bg-[#00ff94]/15 hover:bg-[#00ff94] text-[#00ff94] hover:text-[#002111] font-bold text-[10px] rounded border border-[#00ff94]/30"
                            >
                              CHART
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Asset Inspector Modal / Slide-over */}
        {selectedAssetDetail && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-3">
            <div className="bg-[#15191d] border border-[#272a2d] rounded-xl max-w-xl w-full p-4 sm:p-5 text-xs font-mono space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-[#272a2d] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-[#00ff94]/20 border border-[#00ff94]/40 flex items-center justify-center text-[#00ff94]">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{selectedAssetDetail.symbol} CPR ANALYSIS</h3>
                    <p className="text-[10px] text-[#99907f]">{selectedTimeframe} Institutional Pivot Structure</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAssetDetail(null)}
                  className="p-1.5 bg-[#191c1f] text-[#99907f] hover:text-white rounded-lg border border-[#272a2d]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3 rounded-lg border ${
                  selectedAssetDetail.trendCategory === 'STRONG_BULLISH'
                    ? 'bg-[#00ff94]/10 border-[#00ff94]/30 text-[#00ff94]'
                    : selectedAssetDetail.trendCategory === 'STRONG_BEARISH'
                    ? 'bg-[#ff3b4a]/10 border-[#ff3b4a]/30 text-[#ff3b4a]'
                    : 'bg-[#ffd87f]/10 border-[#ffd87f]/30 text-[#ffd87f]'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{selectedAssetDetail.trendLabel}</span>
                  <span>Confidence: {selectedAssetDetail.confidence}%</span>
                </div>
                <p className="text-[11px] text-[#e0e0e0] mt-1 leading-relaxed">
                  {selectedAssetDetail.explanationHindi}
                </p>
              </div>

              {/* CPR Numerical Matrix */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#0d0f11] p-2.5 rounded border border-[#22262a]">
                  <span className="text-[10px] text-[#99907f] block">Top Central (TC)</span>
                  <span className="text-sm font-bold text-white">${selectedAssetDetail.cpr.tcActual}</span>
                </div>
                <div className="bg-[#0d0f11] p-2.5 rounded border border-[#22262a]">
                  <span className="text-[10px] text-[#00ff94] block">Central Pivot (P)</span>
                  <span className="text-sm font-bold text-[#00ff94]">${selectedAssetDetail.cpr.pivot}</span>
                </div>
                <div className="bg-[#0d0f11] p-2.5 rounded border border-[#22262a]">
                  <span className="text-[10px] text-[#99907f] block">Bottom Central (BC)</span>
                  <span className="text-sm font-bold text-white">${selectedAssetDetail.cpr.bcActual}</span>
                </div>
              </div>

              {/* Support & Resistance Targets */}
              <div className="bg-[#0d0f11] p-3 rounded-lg border border-[#22262a] space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#99907f]">Resistance Targets:</span>
                  <span className="text-[#ffd87f] font-bold">
                    R1: ${selectedAssetDetail.cpr.r1} | R2: ${selectedAssetDetail.cpr.r2} | R3: ${selectedAssetDetail.cpr.r3}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#99907f]">Support Targets:</span>
                  <span className="text-[#38bdf8] font-bold">
                    S1: ${selectedAssetDetail.cpr.s1} | S2: ${selectedAssetDetail.cpr.s2} | S3: ${selectedAssetDetail.cpr.s3}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#99907f]">Tomorrow's Projected CPR:</span>
                  <span className="text-white">
                    P: ${selectedAssetDetail.nextDayCPR.pivot} ({selectedAssetDetail.nextDayCPR.widthType})
                  </span>
                </div>
              </div>

              {/* Execution Blueprint */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectAndClose(selectedAssetDetail.symbol)}
                  className="flex-1 py-2.5 bg-[#00ff94] text-[#002111] font-bold rounded-lg text-xs hover:bg-[#00cc7a] transition-colors flex items-center justify-center gap-1.5"
                >
                  <BarChart2 className="w-4 h-4" />
                  SWITCH CHART TO {selectedAssetDetail.symbol}
                </button>
                {onOpenCopilot && (
                  <button
                    onClick={() => {
                      onSelectPair(selectedAssetDetail.symbol);
                      setSelectedAssetDetail(null);
                      onClose();
                      onOpenCopilot();
                    }}
                    className="py-2.5 px-3 bg-[#191c1f] text-[#ffd87f] border border-[#ffd87f]/40 font-bold rounded-lg text-xs hover:bg-[#272a2d] transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI COPILOT
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
