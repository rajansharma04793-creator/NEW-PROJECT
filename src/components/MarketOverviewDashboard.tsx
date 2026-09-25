import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AssetPair, TickerInfo, CoinMetadata } from '../types';
import { ALL_COINS_METADATA } from '../data/marketData';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Flame,
  Globe,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Bell,
  BarChart2,
  Sparkles,
  Layers,
  Zap,
  DollarSign,
  Compass,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Grid,
  List,
} from 'lucide-react';

interface MarketOverviewDashboardProps {
  tickers: Record<AssetPair, TickerInfo>;
  currentPair: AssetPair;
  onSelectPair: (pair: AssetPair) => void;
  onOpenTerminal: (pair?: AssetPair) => void;
  onOpenPipCalculator: (pair?: AssetPair) => void;
  onOpenEconomicCalendar: () => void;
  onOpenAlertsModal: (symbol?: AssetPair, price?: number) => void;
  onOpenApiSettings: () => void;
  isSimulatorActive?: boolean;
}

type TabCategory = 'all' | 'commodities' | 'forex' | 'stocks' | 'indices' | 'crypto';
type SortField = 'gainers' | 'losers' | 'volume' | 'price' | 'name';

// Mini Sparkline SVG generator
const MiniSparkline: React.FC<{
  change: number;
  width?: number;
  height?: number;
}> = ({ change, width = 90, height = 28 }) => {
  const isPositive = change >= 0;
  const strokeColor = isPositive ? '#10B981' : '#F43F5E';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

  const points = useMemo(() => {
    const count = 12;
    const pts: number[] = [];
    let current = 50;
    const trend = isPositive ? 2.5 : -2.5;

    for (let i = 0; i < count; i++) {
      const noise = (Math.sin(i * 1.5) + (Math.random() - 0.5)) * 8;
      current = Math.max(10, Math.min(90, current + trend + noise));
      pts.push(current);
    }
    // ensure last point reflects direction
    pts[count - 1] = isPositive ? Math.max(...pts) * 0.95 : Math.min(...pts) * 1.05;

    const stepX = width / (count - 1);
    const coords = pts.map((val, idx) => {
      const x = idx * stepX;
      // map 0-100 to height-2 down to 2
      const y = height - (val / 100) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${coords.join(' L ')}`;
    const areaD = `M 0,${height} L ${coords.join(' L ')} L ${width},${height} Z`;

    return { pathD, areaD };
  }, [change, isPositive, width, height]);

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={points.areaD} fill={fillColor} />
      <path
        d={points.pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const MarketOverviewDashboard: React.FC<MarketOverviewDashboardProps> = ({
  tickers,
  currentPair,
  onSelectPair,
  onOpenTerminal,
  onOpenPipCalculator,
  onOpenEconomicCalendar,
  onOpenAlertsModal,
  onOpenApiSettings,
  isSimulatorActive = true,
}) => {
  const [selectedTab, setSelectedTab] = useState<TabCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortField>('gainers');
  const [viewLayout, setViewLayout] = useState<'table' | 'grid'>('table');
  const [currencyDisplay, setCurrencyDisplay] = useState<'USD' | 'INR'>('USD');
  const [flashingSymbols, setFlashingSymbols] = useState<Record<string, 'up' | 'down'>>({});
  const previousPricesRef = useRef<Record<string, number>>({});

  // Detect price changes and trigger subtle green/red flashes
  useEffect(() => {
    const flashes: Record<string, 'up' | 'down'> = {};
    Object.entries(tickers).forEach(([sym, t]) => {
      const prev = previousPricesRef.current[sym];
      if (prev && t.price !== prev) {
        flashes[sym] = t.price > prev ? 'up' : 'down';
      }
      previousPricesRef.current[sym] = t.price;
    });

    if (Object.keys(flashes).length > 0) {
      setFlashingSymbols(flashes);
      const timer = setTimeout(() => setFlashingSymbols({}), 800);
      return () => clearTimeout(timer);
    }
  }, [tickers]);

  // Merge metadata with live tickers
  const enrichedList = useMemo(() => {
    return ALL_COINS_METADATA.map((meta) => {
      const ticker = tickers[meta.symbol] || {
        symbol: meta.symbol,
        baseAsset: meta.baseAsset,
        quoteAsset: meta.quoteAsset,
        price: 100,
        change24h: 0,
        high24h: 105,
        low24h: 95,
        volume24h: 150000,
        turnover24h: 15000000,
        precision: meta.precision,
        fundingRate: 0.0001,
        nextFundingIn: '04:00:00',
      };

      const isCommodity =
        meta.category === 'commodities' ||
        meta.symbol.startsWith('XAU') ||
        meta.symbol.startsWith('XAG') ||
        meta.symbol.startsWith('WTI') ||
        meta.symbol.startsWith('BRENT') ||
        meta.symbol.startsWith('COPPER');

      const isForex =
        meta.category === 'forex' ||
        meta.symbol.includes('EUR') ||
        meta.symbol.includes('GBP') ||
        meta.symbol.includes('JPY') ||
        meta.symbol.includes('AUD') ||
        meta.symbol.includes('CAD') ||
        meta.symbol.includes('CHF') ||
        (meta.symbol.includes('USD/INR') && !meta.tags.includes('crypto'));

      const isIndex =
        meta.symbol === 'SPX500' ||
        meta.symbol === 'QQQ/USD' ||
        meta.symbol === 'NIFTY50' ||
        meta.tags.includes('index');

      const isStock =
        (meta.category === 'stocks' ||
          ['NVDA/USD', 'AAPL/USD', 'TSLA/USD', 'MSFT/USD', 'AMZN/USD', 'GOOGL/USD', 'META/USD', 'RELIANCE/INR', 'TCS/INR', 'HDFCBANK/INR'].includes(meta.symbol)) &&
        !isIndex;

      let mappedTab: TabCategory = 'crypto';
      if (isCommodity) mappedTab = 'commodities';
      else if (isForex) mappedTab = 'forex';
      else if (isIndex) mappedTab = 'indices';
      else if (isStock) mappedTab = 'stocks';

      return {
        ...meta,
        ticker,
        mappedTab,
        isCommodity,
        isForex,
        isStock,
        isIndex,
      };
    });
  }, [tickers]);

  // Filter and sort items
  const filteredList = useMemo(() => {
    let list = enrichedList;

    // 1. Tab Filter
    if (selectedTab !== 'all') {
      list = list.filter((item) => {
        if (selectedTab === 'commodities') return item.isCommodity;
        if (selectedTab === 'forex') return item.isForex;
        if (selectedTab === 'stocks') return item.isStock;
        if (selectedTab === 'indices') return item.isIndex;
        if (selectedTab === 'crypto') return !item.isCommodity && !item.isForex && !item.isStock && !item.isIndex;
        return true;
      });
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.symbol.toLowerCase().includes(q) ||
          item.baseAsset.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // 3. Sorting
    return [...list].sort((a, b) => {
      const aChange = a.ticker.change24h || 0;
      const bChange = b.ticker.change24h || 0;
      const aVol = (a.ticker.volume24h || 0) * (a.ticker.price || 1);
      const bVol = (b.ticker.volume24h || 0) * (b.ticker.price || 1);
      const aPrice = a.ticker.price || 0;
      const bPrice = b.ticker.price || 0;

      if (sortOption === 'gainers') return bChange - aChange;
      if (sortOption === 'losers') return aChange - bChange;
      if (sortOption === 'volume') return bVol - aVol;
      if (sortOption === 'price') return bPrice - aPrice;
      if (sortOption === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [enrichedList, selectedTab, searchQuery, sortOption]);

  // Market Macro Stats Highlights
  const macroStats = useMemo(() => {
    const all = enrichedList;
    const gainers = [...all].sort((a, b) => (b.ticker.change24h || 0) - (a.ticker.change24h || 0));
    const losers = [...all].sort((a, b) => (a.ticker.change24h || 0) - (b.ticker.change24h || 0));
    const mostActive = [...all].sort(
      (a, b) =>
        (b.ticker.volume24h || 0) * (b.ticker.price || 1) -
        (a.ticker.volume24h || 0) * (a.ticker.price || 1)
    );

    const totalTurnover = all.reduce(
      (acc, item) => acc + (item.ticker.volume24h || 0) * (item.ticker.price || 1),
      0
    );

    const gold = all.find((i) => i.symbol === 'XAU/USDT' || i.symbol === 'XAU/USD');
    const btc = all.find((i) => i.symbol === 'BTC/USDT');
    const eur = all.find((i) => i.symbol === 'EUR/USD');
    const spx = all.find((i) => i.symbol === 'SPX500');

    return {
      topGainer: gainers[0],
      topLoser: losers[0],
      mostActive: mostActive[0],
      totalTurnover,
      gold,
      btc,
      eur,
      spx,
    };
  }, [enrichedList]);

  // Format price helper
  const formatPrice = (val: number, precision: number, isINR = false) => {
    if (isINR) {
      return `₹${val.toLocaleString('en-IN', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      })}`;
    }
    return `$${val.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    })}`;
  };

  return (
    <div id="financial-market-dashboard" className="w-full min-h-screen bg-[#0F172A] text-[#F8FAFC] pb-16">
      {/* Top Header & Quick Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#0B0F19]/95 backdrop-blur-md border-b border-[#1E293B] px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#38BDF8] flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]" aria-hidden="true">
            <Activity className="w-5 h-5 text-[#0F172A] font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-wider text-[#F8FAFC]">LUMINA TERMINAL</h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                Institutional Market Hub
              </span>
            </div>
            <p className="text-xs text-[#94A3B8]">Commodities • Forex • Global Equities • Indices • Digital Assets</p>
          </div>
        </div>

        {/* Global Action Tools */}
        <nav role="navigation" aria-label="Dashboard Tools Navigation" className="flex items-center flex-wrap gap-2">
          {/* Economic Calendar Trigger */}
          <button
            onClick={onOpenEconomicCalendar}
            aria-label="Open Macro Economic Calendar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-xs font-semibold text-[#CBD5E1] transition-all cursor-pointer border border-[#334155]"
            title="Open Macro Economic Calendar with Upcoming High-Impact Events"
          >
            <Clock className="w-4 h-4 text-[#F59E0B]" aria-hidden="true" />
            <span>Economic Calendar</span>
          </button>

          {/* Pip & Margin Calculator Trigger */}
          <button
            onClick={() => onOpenPipCalculator(currentPair)}
            aria-label="Open Forex & Metals Pip and Lot Size Calculator"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-xs font-semibold text-[#CBD5E1] transition-all cursor-pointer border border-[#334155]"
            title="Open Forex & Metals Pip / Lot Size / Margin Calculator"
          >
            <Calculator className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
            <span>Pip & Lot Calculator</span>
          </button>

          {/* API Pipeline & Simulator Settings */}
          <button
            onClick={onOpenApiSettings}
            aria-label="Configure API Settings and Market Feeds"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-xs font-semibold text-[#CBD5E1] transition-all cursor-pointer border border-[#334155]"
            title="Configure Market Feeds, Real-Time Sync & Simulation"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#A855F7]" aria-hidden="true" />
            <span>Feed Settings</span>
          </button>

          {/* Launch Terminal CTA */}
          <a
            href="#terminal"
            onClick={(e) => {
              e.preventDefault();
              onOpenTerminal(currentPair);
            }}
            aria-label={`Open Trading Terminal for ${currentPair}`}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-xs font-bold text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
          >
            <BarChart2 className="w-4 h-4" aria-hidden="true" />
            <span>Open Terminal ({currentPair})</span>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </nav>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-6">
        <div>
          <h2 className="text-xs uppercase font-mono font-bold tracking-wider text-[#94A3B8] mb-3">
            Institutional Market Macro Pulse
          </h2>
          {/* Top Market Pulse Highlight Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Gold Spot / Futures Spot */}
          {macroStats.gold && (
            <div
              onClick={() => onOpenTerminal(macroStats.gold?.symbol)}
              className="p-4 rounded-xl bg-[#1E293B]/70 hover:bg-[#1E293B] border border-[#334155]/60 hover:border-[#F59E0B]/50 transition-all cursor-pointer shadow-lg group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#F59E0B]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
                <span className="font-semibold flex items-center gap-1.5 text-[#F59E0B]">
                  🥇 Precious Metals
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] font-bold">
                  Spot / Futures
                </span>
              </div>
              <div className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#F59E0B] transition-colors">
                {macroStats.gold.name}
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-black font-mono text-[#F8FAFC]">
                  ${macroStats.gold.ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded flex items-center gap-0.5 ${
                    (macroStats.gold.ticker.change24h || 0) >= 0
                      ? 'bg-[#10B981]/15 text-[#10B981]'
                      : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                  }`}
                >
                  {(macroStats.gold.ticker.change24h || 0) >= 0 ? '+' : ''}
                  {macroStats.gold.ticker.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {/* 2. EUR / USD Benchmark */}
          {macroStats.eur && (
            <div
              onClick={() => onOpenTerminal(macroStats.eur?.symbol)}
              className="p-4 rounded-xl bg-[#1E293B]/70 hover:bg-[#1E293B] border border-[#334155]/60 hover:border-[#38BDF8]/50 transition-all cursor-pointer shadow-lg group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#38BDF8]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
                <span className="font-semibold flex items-center gap-1.5 text-[#38BDF8]">
                  💶 Interbank FX
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] font-bold">
                  EUR/USD
                </span>
              </div>
              <div className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors">
                {macroStats.eur.name}
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-black font-mono text-[#F8FAFC]">
                  {macroStats.eur.ticker.price.toFixed(5)}
                </span>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded flex items-center gap-0.5 ${
                    (macroStats.eur.ticker.change24h || 0) >= 0
                      ? 'bg-[#10B981]/15 text-[#10B981]'
                      : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                  }`}
                >
                  {(macroStats.eur.ticker.change24h || 0) >= 0 ? '+' : ''}
                  {macroStats.eur.ticker.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {/* 3. Top Market Gainer */}
          {macroStats.topGainer && (
            <div
              onClick={() => onOpenTerminal(macroStats.topGainer?.symbol)}
              className="p-4 rounded-xl bg-[#1E293B]/70 hover:bg-[#1E293B] border border-[#334155]/60 hover:border-[#10B981]/50 transition-all cursor-pointer shadow-lg group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
                <span className="font-semibold flex items-center gap-1.5 text-[#10B981]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" /> Top 24h Gainer
                </span>
                <span className="text-[10px] uppercase font-bold text-[#94A3B8]">
                  {macroStats.topGainer.category}
                </span>
              </div>
              <div className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#10B981] transition-colors truncate">
                {macroStats.topGainer.name} ({macroStats.topGainer.symbol})
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-black font-mono text-[#F8FAFC]">
                  ${macroStats.topGainer.ticker.price.toFixed(macroStats.topGainer.precision)}
                </span>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{macroStats.topGainer.ticker.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {/* 4. Global Index / Macro Benchmark */}
          {macroStats.spx && (
            <div
              onClick={() => onOpenTerminal(macroStats.spx?.symbol)}
              className="p-4 rounded-xl bg-[#1E293B]/70 hover:bg-[#1E293B] border border-[#334155]/60 hover:border-[#A855F7]/50 transition-all cursor-pointer shadow-lg group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#A855F7]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-1">
                <span className="font-semibold flex items-center gap-1.5 text-[#A855F7]">
                  📈 Global Index
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#A855F7]/15 text-[#A855F7] font-bold">
                  S&P 500
                </span>
              </div>
              <div className="text-sm font-bold text-[#F8FAFC] group-hover:text-[#A855F7] transition-colors">
                {macroStats.spx.name}
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-black font-mono text-[#F8FAFC]">
                  {macroStats.spx.ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded flex items-center gap-0.5 ${
                    (macroStats.spx.ticker.change24h || 0) >= 0
                      ? 'bg-[#10B981]/15 text-[#10B981]'
                      : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                  }`}
                >
                  {(macroStats.spx.ticker.change24h || 0) >= 0 ? '+' : ''}
                  {macroStats.spx.ticker.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          )}
        </section>
        </div>

        {/* Watchlist Controls Bar: Tabs, Search, Sort & Layout Switcher */}
        <section className="bg-[#1E293B]/60 border border-[#334155] rounded-2xl p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Category Tabs */}
            <div role="tablist" aria-label="Market Categories" className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
              {[
                { id: 'all', label: 'All Markets', icon: Globe, count: enrichedList.length },
                {
                  id: 'commodities',
                  label: '🥇 Metals & Commodities',
                  icon: Flame,
                  count: enrichedList.filter((i) => i.isCommodity).length,
                },
                {
                  id: 'forex',
                  label: '💱 Forex (FX)',
                  icon: DollarSign,
                  count: enrichedList.filter((i) => i.isForex).length,
                },
                {
                  id: 'stocks',
                  label: '🏢 Global Stocks',
                  icon: BarChart2,
                  count: enrichedList.filter((i) => i.isStock).length,
                },
                {
                  id: 'indices',
                  label: '📈 Indices',
                  icon: Activity,
                  count: enrichedList.filter((i) => i.isIndex).length,
                },
                {
                  id: 'crypto',
                  label: '⚡ Crypto & Perps',
                  icon: Zap,
                  count: enrichedList.filter((i) => !i.isCommodity && !i.isForex && !i.isStock && !i.isIndex).length,
                },
              ].map((tab) => {
                const isActive = selectedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${tab.label} (${tab.count} instruments)`}
                    onClick={() => setSelectedTab(tab.id as TabCategory)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#10B981] text-[#0F172A] shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155]/60'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-[#0F172A]/30 text-[#0F172A]' : 'bg-[#0F172A] text-[#94A3B8]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input & Sorters */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search symbol, gold, forex, stocks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#10B981] transition-colors font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Sort Filter Dropdown */}
              <div className="flex items-center gap-1 bg-[#0F172A] p-0.5 rounded-xl border border-[#334155]">
                {[
                  { id: 'gainers', label: 'Top Gainers' },
                  { id: 'losers', label: 'Top Losers' },
                  { id: 'volume', label: '24h Vol' },
                  { id: 'price', label: 'Price' },
                  { id: 'name', label: 'A-Z' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSortOption(st.id as SortField)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                      sortOption === st.id
                        ? 'bg-[#334155] text-[#10B981]'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* View Layout Toggle (Table vs Grid) */}
              <div className="flex items-center bg-[#0F172A] p-0.5 rounded-xl border border-[#334155]">
                <button
                  onClick={() => setViewLayout('table')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewLayout === 'table' ? 'bg-[#334155] text-[#10B981]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewLayout === 'grid' ? 'bg-[#334155] text-[#10B981]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                  title="Grid Card View"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Data Stream Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#94A3B8] pt-2 border-t border-[#334155]/60 font-mono">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
              </span>
              <span className="text-[#F8FAFC] font-semibold">Live Market Pipeline</span>
              <span className="text-[11px] text-[#64748B]">
                (Interbank FX • Commodities Spot • CoinDCX Futures • Yahoo Finance Proxy)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span>Showing {filteredList.length} assets</span>
              <span>•</span>
              <span className="text-[#38BDF8]">
                24h Total Turnover: ${macroStats.totalTurnover.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </section>

        {/* Watchlist Main Display: Table or Grid */}
        {viewLayout === 'table' ? (
          <section className="bg-[#1E293B]/70 border border-[#334155] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0B0F19]/80 text-[#94A3B8] border-b border-[#334155] uppercase font-mono text-[11px]">
                    <th className="py-3.5 px-4 font-semibold">Asset / Instrument</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Live Price</th>
                    <th className="py-3.5 px-4 font-semibold text-right">24h Change</th>
                    <th className="py-3.5 px-4 font-semibold text-center hidden md:table-cell">24h High / Low</th>
                    <th className="py-3.5 px-4 font-semibold text-right hidden sm:table-cell">24h Volume</th>
                    <th className="py-3.5 px-4 font-semibold text-center hidden lg:table-cell">7D Trend</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/60 font-mono">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#94A3B8] font-sans">
                        <p className="text-base font-semibold">No assets found matching "{searchQuery}"</p>
                        <p className="text-xs text-[#64748B] mt-1">Try searching for Gold, EUR, NVDA, or Bitcoin</p>
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item) => {
                      const ticker = item.ticker;
                      const isPositive = (ticker.change24h || 0) >= 0;
                      const flash = flashingSymbols[item.symbol];
                      const isCurrentActive = item.symbol === currentPair;

                      return (
                        <tr
                          key={item.symbol}
                          className={`hover:bg-[#334155]/40 transition-colors group cursor-pointer ${
                            isCurrentActive ? 'bg-[#334155]/30' : ''
                          }`}
                          onClick={() => onOpenTerminal(item.symbol)}
                        >
                          {/* 1. Asset Name & Badge */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-[#0F172A] border border-[#334155] flex items-center justify-center font-bold text-xs text-[#F8FAFC] shadow group-hover:border-[#10B981]/40 transition-colors">
                                {item.isCommodity ? '🥇' : item.isForex ? '💱' : item.isStock ? '📈' : item.isIndex ? '🏛️' : '⚡'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-[#F8FAFC] group-hover:text-[#10B981] transition-colors">
                                    {item.symbol}
                                  </span>
                                  {item.isHot && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-bold">
                                      HOT
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#94A3B8] font-sans truncate max-w-[160px] sm:max-w-[220px]">
                                  {item.name}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Live Price with Flash Animation */}
                          <td className="py-3.5 px-4 text-right">
                            <div
                              className={`inline-block font-bold text-sm transition-all duration-300 ${
                                flash === 'up'
                                  ? 'text-[#10B981] scale-105'
                                  : flash === 'down'
                                  ? 'text-[#F43F5E] scale-105'
                                  : 'text-[#F8FAFC]'
                              }`}
                            >
                              {formatPrice(ticker.price, item.precision, item.symbol.includes('/INR'))}
                            </div>
                            <div className="text-[10px] text-[#64748B]">
                              Bid: {(ticker.price * 0.9998).toFixed(item.precision)}
                            </div>
                          </td>

                          {/* 3. 24h Change (%) and Amount */}
                          <td className="py-3.5 px-4 text-right">
                            <div
                              className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                isPositive
                                  ? 'bg-[#10B981]/15 text-[#10B981]'
                                  : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                              }`}
                            >
                              {isPositive ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                              ) : (
                                <TrendingDown className="w-3.5 h-3.5" />
                              )}
                              <span>
                                {isPositive ? '+' : ''}
                                {ticker.change24h.toFixed(2)}%
                              </span>
                            </div>
                          </td>

                          {/* 4. 24h High / Low Range */}
                          <td className="py-3.5 px-4 text-center hidden md:table-cell">
                            <div className="w-36 mx-auto">
                              <div className="flex justify-between text-[10px] text-[#94A3B8] mb-1">
                                <span className="text-[#F43F5E]">L: {ticker.low24h.toFixed(item.precision)}</span>
                                <span className="text-[#10B981]">H: {ticker.high24h.toFixed(item.precision)}</span>
                              </div>
                              {/* Range Progress Bar */}
                              <div className="w-full h-1.5 bg-[#0F172A] rounded-full overflow-hidden relative">
                                {ticker.high24h > ticker.low24h && (
                                  <div
                                    className="h-full bg-gradient-to-r from-[#F43F5E] via-[#F59E0B] to-[#10B981] rounded-full"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.max(
                                          5,
                                          ((ticker.price - ticker.low24h) /
                                            (ticker.high24h - ticker.low24h)) *
                                            100
                                        )
                                      )}%`,
                                    }}
                                  />
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 5. 24h Volume */}
                          <td className="py-3.5 px-4 text-right hidden sm:table-cell text-[#CBD5E1]">
                            <div className="font-semibold">
                              ${((ticker.volume24h || 1200) * ticker.price).toLocaleString(undefined, {
                                maximumFractionDigits: 0,
                              })}
                            </div>
                            <div className="text-[10px] text-[#64748B]">
                              {ticker.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })} units
                            </div>
                          </td>

                          {/* 6. Mini Sparkline */}
                          <td className="py-3.5 px-4 text-center hidden lg:table-cell">
                            <div className="flex justify-center">
                              <MiniSparkline change={ticker.change24h} />
                            </div>
                          </td>

                          {/* 7. Action Buttons */}
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Pip Calculator Shortcut */}
                              {(item.isForex || item.isCommodity) && (
                                <button
                                  onClick={() => onOpenPipCalculator(item.symbol)}
                                  className="p-1.5 rounded-lg bg-[#0F172A] hover:bg-[#38BDF8]/20 text-[#94A3B8] hover:text-[#38BDF8] border border-[#334155] transition-colors cursor-pointer"
                                  title="Calculate Lot Size & Pip Value"
                                >
                                  <Calculator className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Alert Shortcut */}
                              <button
                                onClick={() => onOpenAlertsModal(item.symbol, ticker.price)}
                                className="p-1.5 rounded-lg bg-[#0F172A] hover:bg-[#F59E0B]/20 text-[#94A3B8] hover:text-[#F59E0B] border border-[#334155] transition-colors cursor-pointer"
                                title="Create Price Alert"
                              >
                                <Bell className="w-3.5 h-3.5" />
                              </button>

                              {/* Trade Terminal Button */}
                              <button
                                onClick={() => onOpenTerminal(item.symbol)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#0F172A] font-bold text-xs transition-colors cursor-pointer"
                              >
                                <span>Trade</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          /* Grid Card Layout */
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((item) => {
              const ticker = item.ticker;
              const isPositive = (ticker.change24h || 0) >= 0;

              return (
                <div
                  key={item.symbol}
                  onClick={() => onOpenTerminal(item.symbol)}
                  className="p-5 rounded-2xl bg-[#1E293B]/70 hover:bg-[#1E293B] border border-[#334155] hover:border-[#10B981]/50 transition-all cursor-pointer shadow-lg group flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Symbol, Category & Change */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#0F172A] border border-[#334155] flex items-center justify-center font-bold text-xs">
                          {item.isCommodity ? '🥇' : item.isForex ? '💱' : item.isStock ? '📈' : '⚡'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#F8FAFC] group-hover:text-[#10B981] transition-colors">
                            {item.symbol}
                          </div>
                          <div className="text-[11px] text-[#94A3B8] font-sans truncate max-w-[140px]">
                            {item.name}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded flex items-center gap-0.5 ${
                          isPositive ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#F43F5E]/15 text-[#F43F5E]'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {ticker.change24h.toFixed(2)}%
                      </span>
                    </div>

                    {/* Price and Sparkline Row */}
                    <div className="flex items-center justify-between my-3">
                      <div>
                        <div className="text-xl font-black font-mono text-[#F8FAFC]">
                          {formatPrice(ticker.price, item.precision, item.symbol.includes('/INR'))}
                        </div>
                        <div className="text-[10px] text-[#64748B] font-mono">
                          24h Vol: ${(ticker.volume24h * ticker.price / 1000).toFixed(0)}k
                        </div>
                      </div>
                      <MiniSparkline change={ticker.change24h} width={100} height={32} />
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div
                    className="flex items-center justify-between pt-3 border-t border-[#334155]/60 mt-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] uppercase font-bold text-[#64748B] font-mono">
                      {item.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {(item.isForex || item.isCommodity) && (
                        <button
                          onClick={() => onOpenPipCalculator(item.symbol)}
                          className="p-1 rounded bg-[#0F172A] hover:bg-[#38BDF8]/20 text-[#94A3B8] hover:text-[#38BDF8] border border-[#334155] text-xs cursor-pointer"
                          title="Pip Calculator"
                        >
                          <Calculator className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onOpenTerminal(item.symbol)}
                        className="px-3 py-1 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#0F172A] font-bold text-xs transition-colors cursor-pointer"
                      >
                        Trade Chart
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
};
