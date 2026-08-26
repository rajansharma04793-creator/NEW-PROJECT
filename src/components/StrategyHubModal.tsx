import React, { useState, useMemo, useEffect } from 'react';
import {
  AssetPair,
  TickerInfo,
  MarketCategory,
  StrategyDefinition,
  StrategyScanResult,
  StrategyCategory,
  StrategyRuleConfig,
} from '../types';
import { ALL_COINS_METADATA } from '../data/marketData';
import {
  getAllStrategies,
  scanAllCryptosWithStrategy,
  addCustomStrategy,
  deleteCustomStrategy,
  DEFAULT_STRATEGIES,
} from '../utils/strategyEngine';
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  Flame,
  Filter,
  BarChart2,
  RefreshCw,
  X,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  Coins,
  Cpu,
  BookmarkPlus,
  Play,
} from 'lucide-react';

interface StrategyHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickers: Record<AssetPair, TickerInfo>;
  currentPair: AssetPair;
  onSelectPair: (pair: AssetPair) => void;
  onPlaceOrder?: (order: {
    symbol: AssetPair;
    type: 'limit' | 'market' | 'stop-limit' | 'ai-smart';
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    leverage: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => void;
  onOpenAlertsModal?: (symbol?: AssetPair, price?: number) => void;
}

const CATEGORY_TABS: { id: MarketCategory; label: string }[] = [
  { id: 'all', label: 'All Cryptos' },
  { id: 'hot', label: '🔥 Hot' },
  { id: 'layer1', label: '⚡ Layer 1' },
  { id: 'ai', label: '🤖 AI' },
  { id: 'defi', label: '💎 DeFi' },
  { id: 'meme', label: '🐶 Memes' },
  { id: 'commodities', label: '🥇 Gold' },
];

export const StrategyHubModal: React.FC<StrategyHubModalProps> = ({
  isOpen,
  onClose,
  tickers,
  currentPair,
  onSelectPair,
  onPlaceOrder,
  onOpenAlertsModal,
}) => {
  const [strategies, setStrategies] = useState<StrategyDefinition[]>(() => getAllStrategies());
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('cpr_ema_confluence');
  const [activeCategoryTab, setActiveCategoryTab] = useState<MarketCategory>('all');
  const [signalFilter, setSignalFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'NEUTRAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'confidence' | 'change' | 'volume' | 'symbol'>('confidence');
  
  // Custom Strategy Creator Drawer / Modal
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState('');
  const [newStrategyShortName, setNewStrategyShortName] = useState('');
  const [newStrategyCategory, setNewStrategyCategory] = useState<StrategyCategory>('confluence');
  const [newStrategyIcon, setNewStrategyIcon] = useState('✨');
  const [newStrategyDesc, setNewStrategyDesc] = useState('');
  const [newStrategyTF, setNewStrategyTF] = useState('15m');
  const [newStrategyLev, setNewStrategyLev] = useState(10);
  
  // Rule Config State for Builder
  const [ruleUseCPR, setRuleUseCPR] = useState(true);
  const [ruleUseEMA9_26, setRuleUseEMA9_26] = useState(true);
  const [ruleUseEMARibbon, setRuleUseEMARibbon] = useState(false);
  const [ruleUseADX, setRuleUseADX] = useState(true);
  const [ruleADXThresh, setRuleADXThresh] = useState(20);
  const [ruleUseRSI, setRuleUseRSI] = useState(true);
  const [ruleRSILongMin, setRuleRSILongMin] = useState(48);
  const [ruleRSILongMax, setRuleRSILongMax] = useState(70);
  const [ruleUseSupertrend, setRuleUseSupertrend] = useState(false);
  const [ruleUseSMC, setRuleUseSMC] = useState(false);
  const [ruleUseVolSurge, setRuleUseVolSurge] = useState(false);
  const [ruleSLMultiple, setRuleSLMultiple] = useState(1.5);
  const [ruleTPMultiple, setRuleTPMultiple] = useState(3.0);

  // Expanded Confluence Row
  const [expandedSymbol, setExpandedSymbol] = useState<AssetPair | null>(null);
  const [executedSymbols, setExecutedSymbols] = useState<Record<string, boolean>>({});

  // Reload strategies when opened
  useEffect(() => {
    if (isOpen) {
      setStrategies(getAllStrategies());
    }
  }, [isOpen]);

  const selectedStrategy = useMemo(() => {
    return strategies.find((s) => s.id === selectedStrategyId) || strategies[0] || DEFAULT_STRATEGIES[0];
  }, [strategies, selectedStrategyId]);

  // Scan ALL Cryptos with selected strategy
  const scanResults = useMemo(() => {
    if (!selectedStrategy) return [];
    return scanAllCryptosWithStrategy(selectedStrategy, tickers, ALL_COINS_METADATA);
  }, [selectedStrategy, tickers]);

  // Calculate statistics across all cryptos
  const stats = useMemo(() => {
    const total = scanResults.length;
    const buys = scanResults.filter((r) => r.signal === 'BUY').length;
    const sells = scanResults.filter((r) => r.signal === 'SELL').length;
    const neutrals = scanResults.filter((r) => r.signal === 'NEUTRAL').length;
    return { total, buys, sells, neutrals };
  }, [scanResults]);

  // Filter and Sort results
  const filteredResults = useMemo(() => {
    return scanResults
      .filter((r) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchSym = r.symbol.toLowerCase().includes(q);
          const matchName = r.name.toLowerCase().includes(q);
          const matchBase = r.baseAsset.toLowerCase().includes(q);
          if (!matchSym && !matchName && !matchBase) return false;
        }

        // Category tab
        if (activeCategoryTab !== 'all') {
          if (r.category !== activeCategoryTab) return false;
        }

        // Signal filter
        if (signalFilter !== 'ALL') {
          if (r.signal !== signalFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'confidence') {
          return b.confidence - a.confidence;
        }
        if (sortBy === 'change') {
          return Math.abs(b.change24h) - Math.abs(a.change24h);
        }
        if (sortBy === 'volume') {
          return b.volume24h - a.volume24h;
        }
        if (sortBy === 'symbol') {
          return a.symbol.localeCompare(b.symbol);
        }
        return 0;
      });
  }, [scanResults, searchQuery, activeCategoryTab, signalFilter, sortBy]);

  // Handle Creating Strategy
  const handleCreateStrategy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStrategyName.trim()) return;

    const rules: StrategyRuleConfig = {
      useCPR: ruleUseCPR,
      useEMA9_26: ruleUseEMA9_26,
      useEMARibbon: ruleUseEMARibbon,
      useADXFilter: ruleUseADX,
      adxThreshold: ruleADXThresh,
      useRSIFilter: ruleUseRSI,
      rsiLongMin: ruleRSILongMin,
      rsiLongMax: ruleRSILongMax,
      rsiShortMin: 30,
      rsiShortMax: 50,
      useSupertrend: ruleUseSupertrend,
      useSMC_FVG: ruleUseSMC,
      useVolumeSurge: ruleUseVolSurge,
      slAtrMultiplier: ruleSLMultiple,
      tpAtrMultiplier: ruleTPMultiple,
    };

    const newStrat = addCustomStrategy({
      name: newStrategyName.trim(),
      shortName: newStrategyShortName.trim() || newStrategyName.trim().slice(0, 18),
      category: newStrategyCategory,
      icon: newStrategyIcon || '✨',
      description: newStrategyDesc.trim() || 'Custom user-configured quantitative confluence strategy.',
      detailedLogic: `Custom Strategy Rules:\n- CPR: ${ruleUseCPR ? 'ON' : 'OFF'}\n- 9/26 EMA: ${ruleUseEMA9_26 ? 'ON' : 'OFF'}\n- ADX Filter (> ${ruleADXThresh}): ${ruleUseADX ? 'ON' : 'OFF'}\n- RSI Momentum (${ruleRSILongMin}-${ruleRSILongMax}): ${ruleUseRSI ? 'ON' : 'OFF'}\n- SL Multiple: ${ruleSLMultiple}x ATR | TP Multiple: ${ruleTPMultiple}x ATR`,
      rules,
      recommendedTimeframe: newStrategyTF,
      recommendedLeverage: newStrategyLev,
    });

    const updated = getAllStrategies();
    setStrategies(updated);
    setSelectedStrategyId(newStrat.id);
    setIsCreatorOpen(false);

    // Reset Form
    setNewStrategyName('');
    setNewStrategyShortName('');
    setNewStrategyDesc('');
  };

  // Handle Deleting Custom Strategy
  const handleDeleteStrategy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this custom strategy?')) {
      deleteCustomStrategy(id);
      const updated = getAllStrategies();
      setStrategies(updated);
      if (selectedStrategyId === id) {
        setSelectedStrategyId(updated[0]?.id || 'cpr_ema_confluence');
      }
    }
  };

  // Handle 1-Click Order Execution
  const handleExecuteTrade = (res: StrategyScanResult) => {
    if (!onPlaceOrder || !res.tradeLevels) return;

    const side = res.signal === 'BUY' ? 'buy' : 'sell';
    const amount = +(1000 / res.tradeLevels.entry).toFixed(res.precision > 2 ? 4 : 2);

    onPlaceOrder({
      symbol: res.symbol,
      type: 'limit',
      side,
      price: res.tradeLevels.entry,
      amount: Math.max(amount, 1),
      leverage: selectedStrategy.recommendedLeverage || 10,
      takeProfit: res.tradeLevels.target1,
      stopLoss: res.tradeLevels.stopLoss,
    });

    setExecutedSymbols((prev) => ({ ...prev, [res.symbol]: true }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-7xl h-[94vh] bg-[#111417] border border-[#272a2d] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#fff8f1] font-sans">
        {/* Top Modal Header */}
        <div className="px-4 py-3 bg-[#191c1f] border-b border-[#272a2d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00ff94]/15 border border-[#00ff94]/30 flex items-center justify-center text-[#00ff94] shadow-[0_0_12px_rgba(0,255,148,0.2)]">
              <Target className="w-5 h-5 text-[#00ff94]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#fff8f1] flex items-center gap-2">
                  <span>Strategy Command Hub & Cross-Crypto Scanner</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#f6be16]/20 text-[#f6be16] border border-[#f6be16]/40 font-mono">
                    All-in-One
                  </span>
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-[#99907f]">
                Select any strategy to scan & execute across all 30+ crypto markets simultaneously, or build your own custom algorithmic setup.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreatorOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#111417] text-xs font-bold font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,148,0.3)] transition-transform hover:scale-105 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ Create New Strategy</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: 2-Column Responsive Layout (Left: Strategy Selector Column, Right: Live Cross-Crypto Scanner) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* ============================================================== */}
          {/* COLUMN 1: Strategy List & Selector Column (Left)              */}
          {/* ============================================================== */}
          <div className="w-full lg:w-80 xl:w-96 bg-[#14171a] border-r border-[#272a2d] flex flex-col shrink-0 overflow-hidden">
            {/* Column Header */}
            <div className="p-3 border-b border-[#272a2d] flex items-center justify-between bg-[#191c1f]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#ffd87f]">
                <Layers className="w-4 h-4 text-[#ffd87f]" />
                <span>Strategy Library ({strategies.length})</span>
              </div>
              <button
                onClick={() => setIsCreatorOpen(true)}
                className="text-[11px] text-[#00ff94] hover:underline font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Custom</span>
              </button>
            </div>

            {/* Strategy Items List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {strategies.map((strat) => {
                const isSelected = strat.id === selectedStrategyId;
                // Count quick active signals for badge
                const quickScan = scanAllCryptosWithStrategy(strat, tickers, ALL_COINS_METADATA);
                const buys = quickScan.filter((r) => r.signal === 'BUY').length;
                const sells = quickScan.filter((r) => r.signal === 'SELL').length;

                return (
                  <div
                    key={strat.id}
                    onClick={() => {
                      setSelectedStrategyId(strat.id);
                      setExecutedSymbols({});
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-[#272a2d] border-[#00ff94] shadow-[0_0_15px_rgba(0,255,148,0.12)]'
                        : 'bg-[#191c1f]/60 hover:bg-[#191c1f] border-[#272a2d]/80 hover:border-[#37393d]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="text-lg">{strat.icon}</div>
                        <div>
                          <div className="font-bold text-xs text-[#fff8f1] flex items-center gap-1.5">
                            <span>{strat.name}</span>
                            {strat.isCustom && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/40 rounded font-mono">
                                Custom
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-[#99907f] capitalize">
                            {strat.category} • {strat.recommendedTimeframe} • {strat.recommendedLeverage}x
                          </span>
                        </div>
                      </div>

                      {/* Signal Count Badges */}
                      <div className="flex items-center gap-1 font-mono text-[10px]">
                        {buys > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[#00ff94]/15 text-[#00ff94] font-bold border border-[#00ff94]/30">
                            +{buys} Buy
                          </span>
                        )}
                        {sells > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[#ff3b4a]/15 text-[#ff3b4a] font-bold border border-[#ff3b4a]/30">
                            -{sells} Sell
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-[#d0c5b3] mt-2 line-clamp-2 leading-relaxed">
                      {strat.description}
                    </p>

                    {/* Footer Tags & Delete for Custom */}
                    <div className="mt-2.5 pt-2 border-t border-[#272a2d]/50 flex items-center justify-between text-[10px] font-mono text-[#99907f]">
                      <div className="flex items-center gap-1 flex-wrap">
                        {strat.rules.useCPR && <span className="px-1 bg-[#111417] rounded text-[#00ff94]">CPR</span>}
                        {strat.rules.useEMA9_26 && <span className="px-1 bg-[#111417] rounded text-[#ffd87f]">9/26 EMA</span>}
                        {strat.rules.useADXFilter && <span className="px-1 bg-[#111417] rounded text-[#a855f7]">ADX</span>}
                        {strat.rules.useRSIFilter && <span className="px-1 bg-[#111417] rounded text-[#38bdf8]">RSI</span>}
                        {strat.rules.useSupertrend && <span className="px-1 bg-[#111417] rounded text-[#00ff94]">ST</span>}
                        {strat.rules.useSMC_FVG && <span className="px-1 bg-[#111417] rounded text-[#fb923c]">SMC</span>}
                      </div>

                      {strat.isCustom && (
                        <button
                          onClick={(e) => handleDeleteStrategy(strat.id, e)}
                          className="text-[#ff3b4a] hover:text-[#ff3b4a]/80 p-1 hover:bg-[#ff3b4a]/10 rounded transition-colors"
                          title="Delete Custom Strategy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================== */}
          {/* COLUMN 2: Real-time Multi-Crypto Scanner & Execution (Right)   */}
          {/* ============================================================== */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#111417]">
            {/* Active Strategy Banner */}
            <div className="p-3 sm:p-4 bg-[#191c1f]/80 border-b border-[#272a2d] flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
              <div className="flex items-start gap-3">
                <div className="text-2xl sm:text-3xl p-2 rounded-xl bg-[#272a2d] border border-[#37393d]">
                  {selectedStrategy.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-[#fff8f1]">
                      {selectedStrategy.name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#00ff94]/15 text-[#00ff94] font-mono font-bold border border-[#00ff94]/30 uppercase">
                      Active Scanner
                    </span>
                  </div>
                  <p className="text-xs text-[#d0c5b3] mt-0.5 max-w-2xl leading-relaxed">
                    {selectedStrategy.description}
                  </p>
                </div>
              </div>

              {/* Live Signal Summary Counters */}
              <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-[#111417] border border-[#272a2d] text-center">
                  <span className="block text-[9px] text-[#99907f] uppercase">Total Scanned</span>
                  <span className="font-bold text-[#fff8f1]">{stats.total} Cryptos</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[#00ff94]/10 border border-[#00ff94]/30 text-center">
                  <span className="block text-[9px] text-[#00ff94] uppercase">Buy Setups</span>
                  <span className="font-bold text-[#00ff94]">{stats.buys}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[#ff3b4a]/10 border border-[#ff3b4a]/30 text-center">
                  <span className="block text-[9px] text-[#ff3b4a] uppercase">Sell Setups</span>
                  <span className="font-bold text-[#ff3b4a]">{stats.sells}</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-[#272a2d] border border-[#37393d] text-center hidden sm:block">
                  <span className="block text-[9px] text-[#99907f] uppercase">Neutral / Wait</span>
                  <span className="font-bold text-[#d0c5b3]">{stats.neutrals}</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-2.5 sm:p-3 border-b border-[#272a2d] bg-[#14171a] flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-xs">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#99907f]" />
                <input
                  type="text"
                  placeholder="Filter cryptos (e.g. BTC, ETH, Solana, PEPE, Gold)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111417] text-xs pl-8 pr-7 py-1.5 rounded-lg text-[#fff8f1] border border-[#272a2d] focus:border-[#00ff94] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#99907f] hover:text-[#fff8f1] text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Signal Filter Buttons */}
              <div className="flex items-center gap-1 bg-[#111417] p-1 rounded-lg border border-[#272a2d] font-mono text-[11px]">
                {[
                  { id: 'ALL', label: 'All Signals' },
                  { id: 'BUY', label: `🟢 Buy Only (${stats.buys})` },
                  { id: 'SELL', label: `🔴 Sell Only (${stats.sells})` },
                  { id: 'NEUTRAL', label: `⚪ Wait (${stats.neutrals})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSignalFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                      signalFilter === tab.id
                        ? 'bg-[#272a2d] text-[#00ff94] border border-[#00ff94]/40'
                        : 'text-[#99907f] hover:text-[#fff8f1]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryTab(cat.id)}
                    className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 transition-colors cursor-pointer ${
                      activeCategoryTab === cat.id
                        ? 'bg-[#f6be16] text-[#111417]'
                        : 'bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Crypto Results Grid / Cards List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
              {filteredResults.length > 0 ? (
                filteredResults.map((item) => {
                  const isCurrent = item.symbol === currentPair;
                  const isBuy = item.signal === 'BUY';
                  const isSell = item.signal === 'SELL';
                  const isNeutral = item.signal === 'NEUTRAL';
                  const isExpanded = expandedSymbol === item.symbol;
                  const isExecuted = executedSymbols[item.symbol];

                  return (
                    <div
                      key={item.symbol}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-[#191c1f] border-[#f6be16]/60 shadow-[0_0_12px_rgba(246,190,22,0.1)]'
                          : isBuy
                          ? 'bg-[#191c1f]/80 hover:bg-[#191c1f] border-[#00ff94]/40 hover:border-[#00ff94]'
                          : isSell
                          ? 'bg-[#191c1f]/80 hover:bg-[#191c1f] border-[#ff3b4a]/40 hover:border-[#ff3b4a]'
                          : 'bg-[#14171a]/70 hover:bg-[#191c1f] border-[#272a2d]'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Coin Info & Live Price */}
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <div className="w-8 h-8 rounded-full bg-[#272a2d] flex items-center justify-center text-xs font-bold text-[#fff8f1] border border-[#37393d]">
                            {item.baseAsset.slice(0, 3)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#fff8f1]">
                              <span>{item.symbol}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-[#272a2d] text-[#99907f] rounded font-mono">
                                {item.category}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 bg-[#f6be16]/20 text-[#f6be16] rounded font-mono">
                                  Viewing
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
                              <span className="font-bold text-[#fff8f1]">
                                ${item.price.toFixed(item.precision)}
                              </span>
                              <span
                                className={`text-[10px] font-bold ${
                                  item.change24h >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                                }`}
                              >
                                {item.change24h >= 0 ? `+${item.change24h.toFixed(2)}%` : `${item.change24h.toFixed(2)}%`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Strategy Signal & Confidence */}
                        <div className="flex items-center gap-2 shrink-0 font-mono">
                          <div
                            className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border ${
                              isBuy
                                ? 'bg-[#00ff94]/15 text-[#00ff94] border-[#00ff94]/40 shadow-[0_0_10px_rgba(0,255,148,0.2)]'
                                : isSell
                                ? 'bg-[#ff3b4a]/15 text-[#ff3b4a] border-[#ff3b4a]/40 shadow-[0_0_10px_rgba(255,59,74,0.2)]'
                                : 'bg-[#272a2d] text-[#99907f] border-[#37393d]'
                            }`}
                          >
                            {isBuy && <TrendingUp className="w-3.5 h-3.5 text-[#00ff94]" />}
                            {isSell && <TrendingDown className="w-3.5 h-3.5 text-[#ff3b4a]" />}
                            {isNeutral && <Clock className="w-3.5 h-3.5 text-[#99907f]" />}
                            <span>{item.signal === 'BUY' ? 'BUY / LONG' : item.signal === 'SELL' ? 'SELL / SHORT' : 'NEUTRAL / WAIT'}</span>
                          </div>

                          <div className="px-2 py-1 bg-[#111417] border border-[#272a2d] rounded-lg text-[10px] text-center">
                            <span className="block text-[#99907f] text-[8px] uppercase">Conviction</span>
                            <span className={`font-bold ${isBuy ? 'text-[#00ff94]' : isSell ? 'text-[#ff3b4a]' : 'text-[#d0c5b3]'}`}>
                              {item.confidence}%
                            </span>
                          </div>
                        </div>

                        {/* Confluence Quick Indicators */}
                        <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                          {item.confluenceItems.slice(0, 3).map((conf, idx) => (
                            <div
                              key={idx}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 ${
                                conf.passed
                                  ? 'bg-[#00ff94]/10 border-[#00ff94]/30 text-[#00ff94]'
                                  : 'bg-[#272a2d]/50 border-[#272a2d] text-[#99907f]'
                              }`}
                            >
                              {conf.passed ? (
                                <CheckCircle2 className="w-2.5 h-2.5 text-[#00ff94]" />
                              ) : (
                                <XCircle className="w-2.5 h-2.5 text-[#99907f]" />
                              )}
                              <span>{conf.name}: {conf.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                          {/* 1-Click Order Execution */}
                          {!isNeutral && item.tradeLevels && (
                            <button
                              onClick={() => handleExecuteTrade(item)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer shadow-md ${
                                isExecuted
                                  ? 'bg-[#00ff94]/30 text-[#00ff94] border border-[#00ff94]'
                                  : isBuy
                                  ? 'bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#111417]'
                                  : 'bg-[#ff3b4a] hover:bg-[#ff3b4a]/90 text-white'
                              }`}
                            >
                              <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>{isExecuted ? '✓ Order Sent' : '1-Click Trade'}</span>
                            </button>
                          )}

                          {/* Open on Terminal Chart */}
                          <button
                            onClick={() => {
                              onSelectPair(item.symbol);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] hover:text-[#f6be16] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Switch trading chart to this pair"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>Chart</span>
                          </button>

                          {/* Expand Details */}
                          <button
                            onClick={() => setExpandedSymbol(isExpanded ? null : item.symbol)}
                            className="p-1.5 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1] transition-colors cursor-pointer"
                            title="Toggle Full Confluence Details"
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Section: Complete Trade Levels & All Confluence Check Items */}
                      {isExpanded && item.tradeLevels && (
                        <div className="mt-3 pt-3 border-t border-[#272a2d] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs animate-fadeIn">
                          {/* Calculated Trade Setup Card */}
                          <div className="p-2.5 bg-[#111417] rounded-xl border border-[#272a2d] space-y-2">
                            <div className="text-[11px] font-bold text-[#ffd87f] flex items-center justify-between">
                              <span>🎯 Strategy Calculated Trade Levels</span>
                              <span className="font-mono text-[#00ff94]">R:R {item.tradeLevels.riskReward}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 font-mono text-[11px]">
                              <div className="p-1.5 bg-[#191c1f] rounded border border-[#272a2d]">
                                <span className="block text-[9px] text-[#99907f]">Entry</span>
                                <span className="font-bold text-[#fff8f1]">${item.tradeLevels.entry}</span>
                              </div>
                              <div className="p-1.5 bg-[#191c1f] rounded border border-[#272a2d]">
                                <span className="block text-[9px] text-[#ff3b4a]">Stop Loss</span>
                                <span className="font-bold text-[#ff3b4a]">${item.tradeLevels.stopLoss}</span>
                                <span className="block text-[9px] text-[#ff3b4a]/70">(-{item.tradeLevels.slPercent}%)</span>
                              </div>
                              <div className="p-1.5 bg-[#191c1f] rounded border border-[#272a2d]">
                                <span className="block text-[9px] text-[#00ff94]">Target 1</span>
                                <span className="font-bold text-[#00ff94]">${item.tradeLevels.target1}</span>
                                <span className="block text-[9px] text-[#00ff94]/70">(+{item.tradeLevels.tp1Percent}%)</span>
                              </div>
                              <div className="p-1.5 bg-[#191c1f] rounded border border-[#272a2d]">
                                <span className="block text-[9px] text-[#00ff94]">Target 2</span>
                                <span className="font-bold text-[#00ff94]">${item.tradeLevels.target2}</span>
                                <span className="block text-[9px] text-[#00ff94]/70">(+{item.tradeLevels.tp2Percent}%)</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-[#99907f] leading-tight">
                              {item.triggerReason}
                            </p>
                          </div>

                          {/* Full Confluence Checklist */}
                          <div className="p-2.5 bg-[#111417] rounded-xl border border-[#272a2d] space-y-1.5">
                            <div className="text-[11px] font-bold text-[#fff8f1] flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-[#00ff94]" />
                              <span>Confluence Indicators Verification</span>
                            </div>
                            <div className="space-y-1 max-h-28 overflow-y-auto font-mono text-[10px]">
                              {item.confluenceItems.map((c, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-1 rounded bg-[#191c1f] border border-[#272a2d]/60"
                                >
                                  <div className="flex items-center gap-1.5">
                                    {c.passed ? (
                                      <CheckCircle2 className="w-3 h-3 text-[#00ff94]" />
                                    ) : (
                                      <XCircle className="w-3 h-3 text-[#ff3b4a]" />
                                    )}
                                    <span className="text-[#fff8f1] font-bold">{c.name}</span>
                                  </div>
                                  <span className={c.passed ? 'text-[#00ff94]' : 'text-[#99907f]'}>
                                    {c.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center text-[#99907f]">
                  <p className="text-sm font-bold text-[#fff8f1] mb-1">No cryptos matched the selected filter</p>
                  <p className="text-xs">Try clearing the search query or changing the signal filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODAL / DRAWER: Strategy Builder (Create New Strategy)         */}
        {/* ============================================================== */}
        {isCreatorOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-2xl bg-[#191c1f] border border-[#272a2d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Creator Header */}
              <div className="px-4 py-3 border-b border-[#272a2d] bg-[#14171a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <div>
                    <h3 className="text-base font-bold text-[#fff8f1]">Build & Add New Strategy</h3>
                    <p className="text-xs text-[#99907f]">Define custom rules to automatically scan all crypto markets</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreatorOpen(false)}
                  className="p-1 rounded bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Creator Form */}
              <form onSubmit={handleCreateStrategy} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#fff8f1] mb-1">Strategy Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. My 5m Scalper / EMA + RSI Confluence"
                      value={newStrategyName}
                      onChange={(e) => setNewStrategyName(e.target.value)}
                      className="w-full py-2 px-3 bg-[#111417] border border-[#272a2d] rounded-lg text-[#fff8f1] focus:border-[#00ff94] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#fff8f1] mb-1">Category</label>
                    <select
                      value={newStrategyCategory}
                      onChange={(e) => setNewStrategyCategory(e.target.value as StrategyCategory)}
                      className="w-full py-2 px-3 bg-[#111417] border border-[#272a2d] rounded-lg text-[#fff8f1] focus:border-[#00ff94] focus:outline-none"
                    >
                      <option value="confluence">Confluence (Multi-Indicator)</option>
                      <option value="trend">Trend Following</option>
                      <option value="scalp">Fast Scalp</option>
                      <option value="reversion">Mean Reversion</option>
                      <option value="breakout">Breakout / Smart Money</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold text-[#fff8f1] mb-1">Description / Thesis</label>
                  <input
                    type="text"
                    placeholder="Short summary of what this strategy looks for..."
                    value={newStrategyDesc}
                    onChange={(e) => setNewStrategyDesc(e.target.value)}
                    className="w-full py-2 px-3 bg-[#111417] border border-[#272a2d] rounded-lg text-[#fff8f1] focus:border-[#00ff94] focus:outline-none"
                  />
                </div>

                {/* Indicator Rules Selection Grid */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-[#ffd87f]">
                    ⚡ Indicator Confluence Rules (Enable to require in scan)
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
                    {/* CPR Rule */}
                    <div className="p-2.5 bg-[#111417] rounded-xl border border-[#272a2d] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#fff8f1] block">CPR Pivots (TC / BC)</span>
                        <span className="text-[9px] text-[#99907f]">Long above TC / Short below BC</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={ruleUseCPR}
                        onChange={(e) => setRuleUseCPR(e.target.checked)}
                        className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {/* EMA 9/26 */}
                    <div className="p-2.5 bg-[#111417] rounded-xl border border-[#272a2d] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#fff8f1] block">9 & 26 EMA Crossover</span>
                        <span className="text-[9px] text-[#99907f]">Fast momentum stack</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={ruleUseEMA9_26}
                        onChange={(e) => setRuleUseEMA9_26(e.target.checked)}
                        className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {/* ADX Filter */}
                    <div className="p-2.5 bg-[#111417] rounded-xl border border-[#272a2d] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#fff8f1] block">ADX Trend Filter (&gt; 20)</span>
                        <span className="text-[9px] text-[#99907f]">Avoid sideways consolidation</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={ruleUseADX}
                        onChange={(e) => setRuleUseADX(e.target.checked)}
                        className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {/* RSI Momentum Band */}
                    <div className="p-2.5 bg-[#111417] rounded-xl border border-[#272a2d] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#fff8f1] block">RSI Momentum Filter</span>
                        <span className="text-[9px] text-[#99907f]">50-70 band (Long) / 30-50 (Short)</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={ruleUseRSI}
                        onChange={(e) => setRuleUseRSI(e.target.checked)}
                        className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {/* Supertrend */}
                    <div className="p-2.5 bg-[#111417] rounded-xl border border-[#272a2d] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#fff8f1] block">Supertrend (10, 3)</span>
                        <span className="text-[9px] text-[#99907f]">Dynamic trailing trend filter</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={ruleUseSupertrend}
                        onChange={(e) => setRuleUseSupertrend(e.target.checked)}
                        className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {/* SMC & FVG */}
                    <div className="p-2.5 bg-[#111417] rounded-xl border border-[#272a2d] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#fff8f1] block">Smart Money FVG Sweeps</span>
                        <span className="text-[9px] text-[#99907f]">Order block liquidity mitigation</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={ruleUseSMC}
                        onChange={(e) => setRuleUseSMC(e.target.checked)}
                        className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Risk Management / ATR Multipliers */}
                <div className="p-3 bg-[#111417] rounded-xl border border-[#272a2d] space-y-2">
                  <span className="text-[11px] font-bold text-[#ffd87f] block">
                    🛡️ Risk Management Parameters (1:2 R:R Default)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
                    <div>
                      <label className="block text-[9px] text-[#99907f] mb-1">Stop Loss (ATR Multiple)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={ruleSLMultiple}
                        onChange={(e) => setRuleSLMultiple(Number(e.target.value))}
                        className="w-full py-1.5 px-2 bg-[#191c1f] border border-[#272a2d] rounded text-[#fff8f1]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#99907f] mb-1">Target 1 (ATR Multiple)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={ruleTPMultiple}
                        onChange={(e) => setRuleTPMultiple(Number(e.target.value))}
                        className="w-full py-1.5 px-2 bg-[#191c1f] border border-[#272a2d] rounded text-[#fff8f1]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#99907f] mb-1">Rec. Timeframe</label>
                      <select
                        value={newStrategyTF}
                        onChange={(e) => setNewStrategyTF(e.target.value)}
                        className="w-full py-1.5 px-2 bg-[#191c1f] border border-[#272a2d] rounded text-[#fff8f1]"
                      >
                        <option value="5m">5m</option>
                        <option value="15m">15m</option>
                        <option value="1h">1h</option>
                        <option value="4h">4h</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#99907f] mb-1">Rec. Leverage</label>
                      <input
                        type="number"
                        value={newStrategyLev}
                        onChange={(e) => setNewStrategyLev(Number(e.target.value))}
                        className="w-full py-1.5 px-2 bg-[#191c1f] border border-[#272a2d] rounded text-[#fff8f1]"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatorOpen(false)}
                    className="px-4 py-2 rounded-xl bg-[#272a2d] hover:bg-[#37393d] text-[#d0c5b3] text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#111417] text-xs font-bold font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,148,0.3)] cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Scan All Cryptos</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
