import React, { useState, useMemo, useEffect } from 'react';
import {
  AssetPair,
  TickerInfo,
  MarketCategory,
  StrategyDefinition,
  StrategyScanResult,
  StrategyCategory,
  StrategyRuleConfig,
  ConfluenceFilterConfig,
  ConfluenceLogicMode,
  ConfluenceEvaluationResult,
} from '../types';
import { ALL_COINS_METADATA } from '../data/marketData';
import {
  getAllStrategies,
  getGlobalStrategyToggles,
  setGlobalStrategyToggle,
  saveGlobalStrategyToggles,
  updateStrategyParameters,
  resetStrategyToDefault,
  addCustomStrategy,
  deleteCustomStrategy,
  scanAllActiveGloballyEnabledStrategies,
  calculateGlobalTechnicalIndicatorTelemetry,
  MultiStrategyCoinScan,
  DEFAULT_STRATEGIES,
  getConfluenceFilterConfig,
  saveConfluenceFilterConfig,
  resetConfluenceFilterConfig,
  evaluateConfluenceCriteria,
  CONFLUENCE_PRESETS,
  DEFAULT_CONFLUENCE_FILTER_CONFIG,
} from '../utils/strategyEngine';
import {
  Sliders,
  Target,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Activity,
  Layers,
  BarChart2,
  SlidersHorizontal,
  Settings,
  Shield,
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  Filter,
  Check,
  ChevronRight,
  Info,
  X,
  Flame,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
  Cpu,
  GitMerge,
  ShieldCheck,
  CheckSquare,
  Square,
} from 'lucide-react';

interface StrategyManagerModalProps {
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

type TabType = 'strategies' | 'confluence' | 'indicators' | 'builder' | 'consensus';

export const StrategyManagerModal: React.FC<StrategyManagerModalProps> = ({
  isOpen,
  onClose,
  tickers,
  currentPair,
  onSelectPair,
  onPlaceOrder,
  onOpenAlertsModal,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('strategies');
  const [strategies, setStrategies] = useState<StrategyDefinition[]>(() => getAllStrategies());
  const [toggles, setToggles] = useState<Record<string, boolean>>(() => getGlobalStrategyToggles());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingStrategy, setEditingStrategy] = useState<StrategyDefinition | null>(null);

  // Confluence Filter State
  const [confluenceConfig, setConfluenceConfig] = useState<ConfluenceFilterConfig>(() => getConfluenceFilterConfig());
  const [selectedConfluencePair, setSelectedConfluencePair] = useState<AssetPair>(currentPair || 'BTC/USDT');
  const [testTargetSide, setTestTargetSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [confluenceSaveToast, setConfluenceSaveToast] = useState<string | null>(null);

  // Form State for Custom Strategy / Edit Parameter
  const [selectedInfoStrategy, setSelectedInfoStrategy] = useState<StrategyDefinition | null>(null);
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formCategory, setFormCategory] = useState<StrategyCategory>('confluence');
  const [formIcon, setFormIcon] = useState('✨');
  const [formDesc, setFormDesc] = useState('');
  const [formTimeframe, setFormTimeframe] = useState('15m');
  const [formLeverage, setFormLeverage] = useState(10);

  // Form Rules
  const [ruleUseCPR, setRuleUseCPR] = useState(true);
  const [ruleUseEMA9_26, setRuleUseEMA9_26] = useState(true);
  const [ruleUseEMARibbon, setRuleUseEMARibbon] = useState(false);
  const [ruleUseADX, setRuleUseADX] = useState(true);
  const [ruleADXThresh, setRuleADXThresh] = useState(20);
  const [ruleUseRSI, setRuleUseRSI] = useState(true);
  const [ruleRSILongMin, setRuleRSILongMin] = useState(48);
  const [ruleRSILongMax, setRuleRSILongMax] = useState(70);
  const [ruleRSIShortMin, setRuleRSIShortMin] = useState(30);
  const [ruleRSIShortMax, setRuleRSIShortMax] = useState(52);
  const [ruleUseSupertrend, setRuleUseSupertrend] = useState(false);
  const [ruleSupertrendPeriod, setRuleSupertrendPeriod] = useState(10);
  const [ruleSupertrendMultiplier, setRuleSupertrendMultiplier] = useState(3);
  const [ruleUseSMC, setRuleUseSMC] = useState(false);
  const [ruleUseBollinger, setRuleUseBollinger] = useState(false);
  const [ruleUseMACD, setRuleUseMACD] = useState(false);
  const [ruleUseVolSurge, setRuleUseVolSurge] = useState(false);
  const [ruleVolMultiplier, setRuleVolMultiplier] = useState(1.5);
  const [ruleSLMultiple, setRuleSLMultiple] = useState(1.5);
  const [ruleTPMultiple, setRuleTPMultiple] = useState(3.0);

  // Execution feedback
  const [executedCoins, setExecutedCoins] = useState<Record<string, boolean>>({});

  // Sync state on open
  useEffect(() => {
    if (isOpen) {
      setStrategies(getAllStrategies());
      setToggles(getGlobalStrategyToggles());
    }
  }, [isOpen]);

  // Global indicator telemetry across all 30+ coins
  const indicatorTelemetry = useMemo(() => {
    return calculateGlobalTechnicalIndicatorTelemetry(tickers, ALL_COINS_METADATA);
  }, [tickers]);

  // Consensus multi-strategy scan across all 30+ coins
  const consensusScans = useMemo(() => {
    return scanAllActiveGloballyEnabledStrategies(tickers, ALL_COINS_METADATA);
  }, [tickers, toggles, strategies]);

  // Total active strategies count
  const activeCount = useMemo(() => {
    return strategies.filter((s) => toggles[s.id] !== false).length;
  }, [strategies, toggles]);

  // Toggle single strategy globally
  const handleToggleStrategy = (id: string) => {
    const nextVal = toggles[id] === false ? true : false;
    const updated = { ...toggles, [id]: nextVal };
    setToggles(updated);
    saveGlobalStrategyToggles(updated);
  };

  // Toggle ALL Strategies globally
  const handleToggleAll = (enable: boolean) => {
    const updated: Record<string, boolean> = {};
    strategies.forEach((s) => {
      updated[s.id] = enable;
    });
    setToggles(updated);
    saveGlobalStrategyToggles(updated);
  };

  // Reset all to defaults
  const handleResetAllToDefault = () => {
    if (confirm('Reset all strategies and parameter settings to system defaults?')) {
      DEFAULT_STRATEGIES.forEach((s) => resetStrategyToDefault(s.id));
      const defToggles: Record<string, boolean> = {};
      DEFAULT_STRATEGIES.forEach((s) => (defToggles[s.id] = true));
      setToggles(defToggles);
      saveGlobalStrategyToggles(defToggles);
      setStrategies(getAllStrategies());
    }
  };

  // Populate form for editing existing strategy parameters
  const handleStartEdit = (strat: StrategyDefinition) => {
    setEditingStrategy(strat);
    setFormName(strat.name);
    setFormShortName(strat.shortName);
    setFormCategory(strat.category);
    setFormIcon(strat.icon);
    setFormDesc(strat.description);
    setFormTimeframe(strat.recommendedTimeframe);
    setFormLeverage(strat.recommendedLeverage);

    // Rules
    setRuleUseCPR(!!strat.rules.useCPR);
    setRuleUseEMA9_26(!!strat.rules.useEMA9_26);
    setRuleUseEMARibbon(!!strat.rules.useEMARibbon);
    setRuleUseADX(!!strat.rules.useADXFilter);
    setRuleADXThresh(strat.rules.adxThreshold || 20);
    setRuleUseRSI(!!strat.rules.useRSIFilter);
    setRuleRSILongMin(strat.rules.rsiLongMin ?? 48);
    setRuleRSILongMax(strat.rules.rsiLongMax ?? 70);
    setRuleRSIShortMin(strat.rules.rsiShortMin ?? 30);
    setRuleRSIShortMax(strat.rules.rsiShortMax ?? 52);
    setRuleUseSupertrend(!!strat.rules.useSupertrend);
    setRuleSupertrendPeriod(strat.rules.supertrendPeriod || 10);
    setRuleSupertrendMultiplier(strat.rules.supertrendMultiplier || 3);
    setRuleUseSMC(!!strat.rules.useSMC_FVG);
    setRuleUseBollinger(!!strat.rules.useBollingerSqueeze);
    setRuleUseMACD(!!strat.rules.useMACD);
    setRuleUseVolSurge(!!strat.rules.useVolumeSurge);
    setRuleVolMultiplier(strat.rules.volumeMultiplier || 1.5);
    setRuleSLMultiple(strat.rules.slAtrMultiplier || 1.5);
    setRuleTPMultiple(strat.rules.tpAtrMultiplier || 3.0);

    setActiveTab('builder');
  };

  // Reset form to blank new strategy
  const handleStartCreateNew = () => {
    setEditingStrategy(null);
    setFormName('');
    setFormShortName('');
    setFormCategory('confluence');
    setFormIcon('✨');
    setFormDesc('');
    setFormTimeframe('15m');
    setFormLeverage(10);

    setRuleUseCPR(true);
    setRuleUseEMA9_26(true);
    setRuleUseEMARibbon(false);
    setRuleUseADX(true);
    setRuleADXThresh(20);
    setRuleUseRSI(true);
    setRuleRSILongMin(48);
    setRuleRSILongMax(70);
    setRuleRSIShortMin(30);
    setRuleRSIShortMax(52);
    setRuleUseSupertrend(false);
    setRuleSupertrendPeriod(10);
    setRuleSupertrendMultiplier(3);
    setRuleUseSMC(false);
    setRuleUseBollinger(false);
    setRuleUseMACD(false);
    setRuleUseVolSurge(false);
    setRuleVolMultiplier(1.5);
    setRuleSLMultiple(1.5);
    setRuleTPMultiple(3.0);

    setActiveTab('builder');
  };

  // Handle Form Submission (Add new or Update existing)
  const handleSaveStrategyForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const rules: StrategyRuleConfig = {
      useCPR: ruleUseCPR,
      useEMA9_26: ruleUseEMA9_26,
      useEMARibbon: ruleUseEMARibbon,
      useADXFilter: ruleUseADX,
      adxThreshold: ruleADXThresh,
      useRSIFilter: ruleUseRSI,
      rsiLongMin: ruleRSILongMin,
      rsiLongMax: ruleRSILongMax,
      rsiShortMin: ruleRSIShortMin,
      rsiShortMax: ruleRSIShortMax,
      useSupertrend: ruleUseSupertrend,
      supertrendPeriod: ruleSupertrendPeriod,
      supertrendMultiplier: ruleSupertrendMultiplier,
      useSMC_FVG: ruleUseSMC,
      useBollingerSqueeze: ruleUseBollinger,
      useMACD: ruleUseMACD,
      useVolumeSurge: ruleUseVolSurge,
      volumeMultiplier: ruleVolMultiplier,
      slAtrMultiplier: ruleSLMultiple,
      tpAtrMultiplier: ruleTPMultiple,
    };

    if (editingStrategy) {
      // Update existing strategy parameters
      updateStrategyParameters(editingStrategy.id, rules, {
        name: formName.trim(),
        shortName: formShortName.trim() || formName.trim().slice(0, 18),
        category: formCategory,
        icon: formIcon,
        description: formDesc.trim() || editingStrategy.description,
        recommendedTimeframe: formTimeframe,
        recommendedLeverage: formLeverage,
      });
    } else {
      // Create new custom strategy
      addCustomStrategy({
        name: formName.trim(),
        shortName: formShortName.trim() || formName.trim().slice(0, 18),
        category: formCategory,
        icon: formIcon,
        description: formDesc.trim() || 'Custom quantitative trading strategy with user-defined parameters.',
        detailedLogic: `Custom Strategy Rules:\n- CPR: ${ruleUseCPR ? 'ON' : 'OFF'}\n- EMA 9/26: ${ruleUseEMA9_26 ? 'ON' : 'OFF'}\n- ADX Filter: ${ruleUseADX ? `ON (>${ruleADXThresh})` : 'OFF'}\n- RSI: ${ruleUseRSI ? `ON (${ruleRSILongMin}-${ruleRSILongMax})` : 'OFF'}\n- SL ATR: ${ruleSLMultiple}x | TP ATR: ${ruleTPMultiple}x`,
        rules,
        recommendedTimeframe: formTimeframe,
        recommendedLeverage: formLeverage,
      });
    }

    setStrategies(getAllStrategies());
    setToggles(getGlobalStrategyToggles());
    setActiveTab('strategies');
    setEditingStrategy(null);
  };

  // Delete custom strategy
  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this custom strategy?')) {
      deleteCustomStrategy(id);
      setStrategies(getAllStrategies());
      setToggles(getGlobalStrategyToggles());
    }
  };

  // Quick 1-Click Order Placement from Consensus Scan
  const handleExecuteConsensusTrade = (scan: MultiStrategyCoinScan) => {
    if (!onPlaceOrder || !scan.topStrategy?.tradeLevels) return;

    const top = scan.topStrategy;
    const side = top.signal === 'BUY' ? 'buy' : 'sell';
    const amount = +(1000 / top.tradeLevels.entry).toFixed(scan.coin.precision > 2 ? 4 : 2);

    onPlaceOrder({
      symbol: scan.coin.symbol,
      type: 'limit',
      side,
      price: top.tradeLevels.entry,
      amount: Math.max(amount, 1),
      leverage: 10,
      takeProfit: top.tradeLevels.target1,
      stopLoss: top.tradeLevels.stopLoss,
    });

    setExecutedCoins((prev) => ({ ...prev, [scan.coin.symbol]: true }));
  };

  // Confluence Filter Handlers
  const handleSaveConfluenceConfig = (newConfig?: ConfluenceFilterConfig) => {
    const toSave = newConfig || confluenceConfig;
    saveConfluenceFilterConfig(toSave);
    setConfluenceConfig(toSave);
    setConfluenceSaveToast('Confluence Filter configuration saved and active!');
    setTimeout(() => setConfluenceSaveToast(null), 3000);
  };

  const handleApplyConfluencePreset = (preset: (typeof CONFLUENCE_PRESETS)[0]) => {
    const updated: ConfluenceFilterConfig = {
      ...confluenceConfig,
      ...preset.config,
    };
    setConfluenceConfig(updated);
    saveConfluenceFilterConfig(updated);
    setConfluenceSaveToast(`Preset applied: ${preset.name}`);
    setTimeout(() => setConfluenceSaveToast(null), 3000);
  };

  const handleResetConfluence = () => {
    if (confirm('Reset Confluence Filter settings to default?')) {
      const def = resetConfluenceFilterConfig();
      setConfluenceConfig(def);
      setConfluenceSaveToast('Confluence Filter reset to defaults.');
      setTimeout(() => setConfluenceSaveToast(null), 3000);
    }
  };

  // Live Confluence evaluation for the selected coin in simulator
  const liveConfluenceEvaluation = useMemo(() => {
    const coin = ALL_COINS_METADATA.find((c) => c.symbol === selectedConfluencePair) || ALL_COINS_METADATA[0];
    const ticker = tickers[selectedConfluencePair] || {
      symbol: selectedConfluencePair,
      baseAsset: coin.baseAsset,
      quoteAsset: coin.quoteAsset,
      price: 89500,
      change24h: 2.5,
      high24h: 91000,
      low24h: 88000,
      volume24h: 120000,
      precision: coin.precision,
    };

    return evaluateConfluenceCriteria(
      coin,
      ticker as TickerInfo,
      testTargetSide,
      85,
      2.0,
      confluenceConfig
    );
  }, [selectedConfluencePair, testTargetSide, tickers, confluenceConfig]);

  // Filter strategies list
  const filteredStrategies = useMemo(() => {
    return strategies.filter((s) => {
      if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          s.name.toLowerCase().includes(q) ||
          s.shortName.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [strategies, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-7xl h-[95vh] bg-[#111417] border border-[#272a2d] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#fff8f1] font-sans">
        {/* ============================================================== */}
        {/* TOP BAR: Dashboard Title & Global Telemetry Stats              */}
        {/* ============================================================== */}
        <div className="px-4 py-3 bg-[#191c1f] border-b border-[#272a2d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00ff94]/15 border border-[#00ff94]/30 flex items-center justify-center text-[#00ff94] shadow-[0_0_15px_rgba(0,255,148,0.25)]">
              <Sliders className="w-5 h-5 text-[#00ff94]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-[#fff8f1] flex items-center gap-2">
                  <span>Strategy Manager</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/30 font-mono font-bold">
                    Global Engine
                  </span>
                </h2>
              </div>
              <p className="text-[11px] sm:text-xs text-[#99907f]">
                Manage all active technical indicators, toggle strategies globally across all 30+ tracked assets, and tune quantitative parameters.
              </p>
            </div>
          </div>

          {/* Quick Metrics Badges & Close Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <div className="px-2.5 py-1 rounded-lg bg-[#111417] border border-[#272a2d] text-center">
                <span className="block text-[8px] text-[#99907f] uppercase">Active Strategies</span>
                <span className="font-bold text-[#00ff94]">
                  {activeCount} / {strategies.length} ON
                </span>
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-[#111417] border border-[#272a2d] text-center">
                <span className="block text-[8px] text-[#99907f] uppercase">Tracked Assets</span>
                <span className="font-bold text-[#ffd87f]">30+ Markets</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* NAVIGATION TABS BAR                                           */}
        {/* ============================================================== */}
        <div className="px-4 py-2 bg-[#14171a] border-b border-[#272a2d] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-[#111417] p-1 rounded-xl border border-[#272a2d] text-xs font-mono">
            {[
              { id: 'strategies', label: 'Global Strategy Toggles', icon: Target },
              {
                id: 'confluence',
                label: 'Confluence Filter',
                icon: GitMerge,
                badge: confluenceConfig.enabled ? '⚡ GATEKEEPER' : 'BYPASS',
              },
              { id: 'indicators', label: 'Technical Indicators Matrix', icon: Activity },
              { id: 'consensus', label: 'Multi-Asset Signal Feed', icon: Zap },
              { id: 'builder', label: editingStrategy ? '✏️ Edit Strategy' : '+ Custom Parameter Builder', icon: SlidersHorizontal },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as TabType)}
                  className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#00ff94] text-[#111417] shadow-[0_0_12px_rgba(0,255,148,0.3)]'
                      : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#191c1f]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                  {t.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-black ${
                        isActive
                          ? 'bg-[#111417] text-[#00ff94]'
                          : confluenceConfig.enabled
                          ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                          : 'bg-[#ff3b4a]/20 text-[#ff3b4a]'
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Bulk Action Buttons */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => handleToggleAll(true)}
              className="px-2.5 py-1 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#00ff94] font-bold border border-[#00ff94]/30 flex items-center gap-1 transition-colors cursor-pointer"
              title="Enable all strategies globally across all assets"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Enable All</span>
            </button>
            <button
              onClick={() => handleToggleAll(false)}
              className="px-2.5 py-1 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#ff3b4a] font-bold border border-[#ff3b4a]/30 flex items-center gap-1 transition-colors cursor-pointer"
              title="Disable all strategies globally"
            >
              <X className="w-3.5 h-3.5" />
              <span>Disable All</span>
            </button>
            <button
              onClick={handleResetAllToDefault}
              className="px-2 py-1 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1] border border-[#272a2d] flex items-center gap-1 transition-colors cursor-pointer"
              title="Reset all settings to default"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MAIN BODY CONTENT AREA (TAB SWITCHER)                          */}
        {/* ============================================================== */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {/* ------------------------------------------------------------ */}
          {/* TAB 1: Global Strategy Toggles Switchboard                    */}
          {/* ------------------------------------------------------------ */}
          {activeTab === 'strategies' && (
            <div className="space-y-4">
              {/* Category Filter & Search */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#191c1f] rounded-xl border border-[#272a2d]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#ffd87f] flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter:</span>
                  </span>
                  {[
                    { id: 'all', label: 'All Strategies' },
                    { id: 'confluence', label: 'Confluence' },
                    { id: 'trend', label: 'Trend' },
                    { id: 'breakout', label: 'Breakout & SMC' },
                    { id: 'scalp', label: 'Fast Scalp' },
                    { id: 'reversion', label: 'Mean Reversion' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-[#f6be16] text-[#111417]'
                          : 'bg-[#111417] text-[#99907f] hover:text-[#fff8f1] border border-[#272a2d]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative min-w-[220px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#99907f]" />
                    <input
                      type="text"
                      placeholder="Search strategy..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#111417] text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#272a2d] text-[#fff8f1] focus:border-[#00ff94] focus:outline-none font-mono"
                    />
                  </div>

                  <button
                    onClick={handleStartCreateNew}
                    className="px-3 py-1.5 rounded-lg bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#111417] text-xs font-bold font-mono flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add Custom</span>
                  </button>
                </div>
              </div>

              {/* Strategy Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredStrategies.map((strat) => {
                  const isEnabled = toggles[strat.id] !== false;
                  return (
                    <div
                      key={strat.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                        isEnabled
                          ? 'bg-[#191c1f] border-[#00ff94]/40 shadow-[0_0_15px_rgba(0,255,148,0.08)]'
                          : 'bg-[#14171a]/60 border-[#272a2d] opacity-75'
                      }`}
                    >
                      <div>
                        {/* Top Header with Master Toggle */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl p-1.5 rounded-lg bg-[#111417] border border-[#272a2d]">
                              {strat.icon}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-xs sm:text-sm text-[#fff8f1]">{strat.name}</h3>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInfoStrategy(strat);
                                  }}
                                  className="p-1 rounded-md text-[#99907f] hover:text-[#00ff94] hover:bg-[#00ff94]/10 transition-colors cursor-pointer"
                                  title="Click to view Confluence Logic Breakdown (RSI, EMA, CPR, etc.)"
                                >
                                  <Info className="w-3.5 h-3.5 text-[#ffd87f] hover:text-[#00ff94]" />
                                </button>
                                {strat.isCustom && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/40 rounded font-mono">
                                    Custom
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-[#99907f] font-mono mt-0.5">
                                <span className="capitalize">{strat.category}</span>
                                <span>•</span>
                                <span>{strat.recommendedTimeframe}</span>
                                <span>•</span>
                                <span>{strat.recommendedLeverage}x Lev</span>
                              </div>
                            </div>
                          </div>

                          {/* Global Toggle Switch */}
                          <button
                            onClick={() => handleToggleStrategy(strat.id)}
                            className="cursor-pointer transition-transform hover:scale-105"
                            title={isEnabled ? 'Click to disable globally' : 'Click to enable globally across all assets'}
                          >
                            {isEnabled ? (
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00ff94]/20 border border-[#00ff94]/50 text-[#00ff94] font-mono text-[10px] font-bold">
                                <span>GLOBAL ON</span>
                                <ToggleRight className="w-4 h-4 text-[#00ff94]" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#272a2d] border border-[#37393d] text-[#99907f] font-mono text-[10px] font-bold">
                                <span>OFF</span>
                                <ToggleLeft className="w-4 h-4 text-[#99907f]" />
                              </div>
                            )}
                          </button>
                        </div>

                        {/* Description */}
                        <p className="text-[11px] text-[#d0c5b3] mt-2.5 leading-relaxed">
                          {strat.description}
                        </p>

                        {/* Indicator Rule Badges */}
                        <div className="mt-3 flex items-center gap-1 flex-wrap font-mono text-[9px]">
                          {strat.rules.useCPR && (
                            <span className="px-1.5 py-0.5 rounded bg-[#00ff94]/10 text-[#00ff94] border border-[#00ff94]/20">
                              ✓ CPR TC/BC
                            </span>
                          )}
                          {strat.rules.useEMA9_26 && (
                            <span className="px-1.5 py-0.5 rounded bg-[#ffd87f]/10 text-[#ffd87f] border border-[#ffd87f]/20">
                              ✓ 9/26 EMA
                            </span>
                          )}
                          {strat.rules.useEMARibbon && (
                            <span className="px-1.5 py-0.5 rounded bg-[#ffd87f]/10 text-[#ffd87f] border border-[#ffd87f]/20">
                              ✓ EMA Ribbon (9/21/55/200)
                            </span>
                          )}
                          {strat.rules.useADXFilter && (
                            <span className="px-1.5 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20">
                              ✓ ADX &gt; {strat.rules.adxThreshold || 20}
                            </span>
                          )}
                          {strat.rules.useRSIFilter && (
                            <span className="px-1.5 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20">
                              ✓ RSI ({strat.rules.rsiLongMin || 48}-{strat.rules.rsiLongMax || 70})
                            </span>
                          )}
                          {strat.rules.useSupertrend && (
                            <span className="px-1.5 py-0.5 rounded bg-[#00ff94]/10 text-[#00ff94] border border-[#00ff94]/20">
                              ✓ Supertrend ({strat.rules.supertrendPeriod || 10}, {strat.rules.supertrendMultiplier || 3})
                            </span>
                          )}
                          {strat.rules.useSMC_FVG && (
                            <span className="px-1.5 py-0.5 rounded bg-[#fb923c]/10 text-[#fb923c] border border-[#fb923c]/20">
                              ✓ SMC FVG &amp; Liquidity
                            </span>
                          )}
                          {strat.rules.useBollingerSqueeze && (
                            <span className="px-1.5 py-0.5 rounded bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/20">
                              ✓ Bollinger Squeeze
                            </span>
                          )}
                          {strat.rules.useMACD && (
                            <span className="px-1.5 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20">
                              ✓ MACD Cross
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Parameters & Edit Action */}
                      <div className="mt-4 pt-2.5 border-t border-[#272a2d] flex items-center justify-between font-mono text-[10px]">
                        <div className="text-[#99907f]">
                          <span>R:R </span>
                          <span className="text-[#00ff94] font-bold">
                            1 : {((strat.rules.tpAtrMultiplier || 3) / (strat.rules.slAtrMultiplier || 1.5)).toFixed(1)}
                          </span>
                          <span className="text-[#99907f] ml-1.5">
                            ({strat.rules.slAtrMultiplier || 1.5}x / {strat.rules.tpAtrMultiplier || 3}x ATR)
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(strat)}
                            className="px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] hover:text-[#f6be16] flex items-center gap-1 transition-colors cursor-pointer"
                            title="Edit strategy rules & parameters"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Params</span>
                          </button>

                          {strat.isCustom && (
                            <button
                              onClick={(e) => handleDeleteCustom(strat.id, e)}
                              className="p-1 rounded bg-[#ff3b4a]/10 hover:bg-[#ff3b4a]/20 text-[#ff3b4a] transition-colors cursor-pointer"
                              title="Delete Custom Strategy"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* TAB: Confluence Filter (Multi-Criteria Signal Gatekeeper)     */}
          {/* ------------------------------------------------------------ */}
          {activeTab === 'confluence' && (
            <div className="space-y-5">
              {/* Toast alert */}
              {confluenceSaveToast && (
                <div className="p-3 bg-[#00ff94]/15 border border-[#00ff94] rounded-xl text-[#00ff94] text-xs font-mono flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-bold">{confluenceSaveToast}</span>
                  </div>
                  <button onClick={() => setConfluenceSaveToast(null)} className="text-[#99907f] hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Master Confluence Switchboard & Global Mode */}
              <div className="p-4 bg-[#191c1f] rounded-2xl border border-[#272a2d] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                      confluenceConfig.enabled
                        ? 'bg-[#00ff94]/20 border-[#00ff94] text-[#00ff94] shadow-[0_0_20px_rgba(0,255,148,0.3)]'
                        : 'bg-[#ff3b4a]/15 border-[#ff3b4a]/30 text-[#ff3b4a]'
                    }`}
                  >
                    <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-[#fff8f1] flex items-center gap-2">
                        <span>Confluence Signal Gatekeeper</span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold ${
                            confluenceConfig.enabled
                              ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                              : 'bg-[#ff3b4a]/20 text-[#ff3b4a] border border-[#ff3b4a]/40'
                          }`}
                        >
                          {confluenceConfig.enabled ? 'ACTIVE GATEKEEPER' : 'BYPASSED'}
                        </span>
                      </h3>
                    </div>
                    <p className="text-xs text-[#99907f] mt-0.5">
                      Enforces multi-criteria verification (e.g. <span className="text-[#00ff94] font-mono font-bold">RSI &gt; 50 AND EMA 9/26 Cross</span>) before any AI trade signal is issued across all 30+ coins.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Master Toggle Button */}
                  <button
                    onClick={() => {
                      const next = !confluenceConfig.enabled;
                      const updated = { ...confluenceConfig, enabled: next };
                      setConfluenceConfig(updated);
                      handleSaveConfluenceConfig(updated);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer shadow-md ${
                      confluenceConfig.enabled
                        ? 'bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#111417]'
                        : 'bg-[#ff3b4a] hover:bg-[#ff3b4a]/90 text-white'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>{confluenceConfig.enabled ? 'Gatekeeper Active (ON)' : 'Bypass Gatekeeper (OFF)'}</span>
                  </button>

                  <button
                    onClick={handleResetConfluence}
                    className="px-3 py-2 rounded-xl bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1] text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border border-[#272a2d]"
                    title="Reset to system defaults"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Logic Mode Selector & Quick Presets */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Logic Mode */}
                <div className="p-4 bg-[#14171a] rounded-xl border border-[#272a2d] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ffd87f] font-mono uppercase flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-[#ffd87f]" />
                      <span>Logic Mode</span>
                    </span>
                    <span className="text-[10px] text-[#99907f] font-mono">
                      {confluenceConfig.mode === 'STRICT_AND' ? 'Strict Verification' : 'Threshold Matching'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const updated = { ...confluenceConfig, mode: 'STRICT_AND' as ConfluenceLogicMode };
                        setConfluenceConfig(updated);
                        handleSaveConfluenceConfig(updated);
                      }}
                      className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
                        confluenceConfig.mode === 'STRICT_AND'
                          ? 'bg-[#00ff94]/15 border-[#00ff94] text-[#00ff94]'
                          : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                      }`}
                    >
                      <span className="block font-bold text-xs">Strict AND</span>
                      <span className="text-[10px] block opacity-80 mt-0.5 leading-tight">
                        ALL enabled criteria must pass simultaneously.
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        const updated = { ...confluenceConfig, mode: 'MINIMUM_MATCH' as ConfluenceLogicMode };
                        setConfluenceConfig(updated);
                        handleSaveConfluenceConfig(updated);
                      }}
                      className={`p-2.5 rounded-lg text-left transition-all border cursor-pointer ${
                        confluenceConfig.mode === 'MINIMUM_MATCH'
                          ? 'bg-[#00ff94]/15 border-[#00ff94] text-[#00ff94]'
                          : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                      }`}
                    >
                      <span className="block font-bold text-xs">Consensus (X of N)</span>
                      <span className="text-[10px] block opacity-80 mt-0.5 leading-tight">
                        At least X enabled criteria must be met.
                      </span>
                    </button>
                  </div>

                  {confluenceConfig.mode === 'MINIMUM_MATCH' && (
                    <div className="pt-2 border-t border-[#272a2d] flex items-center justify-between font-mono text-xs">
                      <span className="text-[#99907f]">Minimum Criteria Match:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="8"
                          value={confluenceConfig.minMatchCount}
                          onChange={(e) => {
                            const updated = { ...confluenceConfig, minMatchCount: Number(e.target.value) };
                            setConfluenceConfig(updated);
                            handleSaveConfluenceConfig(updated);
                          }}
                          className="w-24 accent-[#00ff94] cursor-pointer"
                        />
                        <span className="font-bold text-[#00ff94] w-6 text-right">
                          {confluenceConfig.minMatchCount}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Middle & Right: 1-Click Quick Presets */}
                <div className="lg:col-span-2 p-4 bg-[#14171a] rounded-xl border border-[#272a2d] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#ffd87f] font-mono uppercase flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#ffd87f]" />
                      <span>1-Click Confluence Presets</span>
                    </span>
                    <span className="text-[10px] text-[#99907f]">Click to load pre-configured institutional filter</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {CONFLUENCE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => handleApplyConfluencePreset(preset)}
                        className="p-2.5 rounded-lg bg-[#191c1f] hover:bg-[#202428] border border-[#272a2d] hover:border-[#00ff94]/40 text-left transition-all group cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-[#fff8f1] group-hover:text-[#00ff94] line-clamp-1">
                              {preset.name}
                            </span>
                            <span className="text-[8px] px-1.5 py-0.2 rounded bg-[#00ff94]/15 text-[#00ff94] font-mono shrink-0">
                              {preset.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#99907f] mt-1 line-clamp-2 leading-tight">
                            {preset.description}
                          </p>
                        </div>
                        <span className="text-[9px] text-[#00ff94] font-mono mt-2 flex items-center gap-1">
                          <span>Apply Filter</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* REAL-TIME CONFLUENCE TEST SIMULATOR & SIGNAL VALIDATOR CARD     */}
              {/* ============================================================== */}
              <div className="p-4 bg-[#191c1f] rounded-2xl border border-[#272a2d] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#272a2d]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#ffd87f]/15 border border-[#ffd87f]/30 flex items-center justify-center text-[#ffd87f]">
                      <Activity className="w-4 h-4 text-[#ffd87f]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-[#fff8f1] flex items-center gap-2">
                        <span>Live Confluence Validator &amp; Signal Gate</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#00ff94]/10 text-[#00ff94] font-mono">
                          REAL-TIME TEST
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#99907f]">
                        Simulate how the Confluence Filter validates candidate trade signals on any live asset.
                      </p>
                    </div>
                  </div>

                  {/* Pair & Side Selectors */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    {/* Pair Selector */}
                    <select
                      value={selectedConfluencePair}
                      onChange={(e) => setSelectedConfluencePair(e.target.value as AssetPair)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#111417] border border-[#272a2d] text-[#fff8f1] font-bold focus:outline-none focus:border-[#00ff94] cursor-pointer"
                    >
                      {ALL_COINS_METADATA.map((c) => (
                        <option key={c.symbol} value={c.symbol}>
                          {c.symbol} (${(tickers[c.symbol]?.price || 10).toLocaleString()})
                        </option>
                      ))}
                    </select>

                    {/* Direction Toggle */}
                    <div className="flex items-center bg-[#111417] p-0.5 rounded-lg border border-[#272a2d]">
                      <button
                        onClick={() => setTestTargetSide('LONG')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                          testTargetSide === 'LONG'
                            ? 'bg-[#00ff94] text-[#111417]'
                            : 'text-[#99907f] hover:text-[#fff8f1]'
                        }`}
                      >
                        LONG
                      </button>
                      <button
                        onClick={() => setTestTargetSide('SHORT')}
                        className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                          testTargetSide === 'SHORT'
                            ? 'bg-[#ff3b4a] text-white'
                            : 'text-[#99907f] hover:text-[#fff8f1]'
                        }`}
                      >
                        SHORT
                      </button>
                    </div>
                  </div>
                </div>

                {/* Validation Status Banner */}
                <div
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    !liveConfluenceEvaluation.filterEnabled
                      ? 'bg-[#14171a] border-[#272a2d] text-[#99907f]'
                      : liveConfluenceEvaluation.passed
                      ? 'bg-[#00ff94]/15 border-[#00ff94] text-[#00ff94] shadow-[0_0_20px_rgba(0,255,148,0.2)]'
                      : 'bg-[#ff3b4a]/15 border-[#ff3b4a] text-[#ff3b4a] shadow-[0_0_20px_rgba(255,59,74,0.2)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {liveConfluenceEvaluation.passed ? (
                      <CheckCircle2 className="w-7 h-7 text-[#00ff94] shrink-0" />
                    ) : (
                      <XCircle className="w-7 h-7 text-[#ff3b4a] shrink-0" />
                    )}
                    <div>
                      <span className="font-extrabold text-sm sm:text-base block">
                        {!liveConfluenceEvaluation.filterEnabled
                          ? 'GATEKEEPER BYPASSED (Signals Free Flow)'
                          : liveConfluenceEvaluation.passed
                          ? `✓ CONFLUENCE VERIFIED - ${testTargetSide} TRADE SIGNAL PERMITTED`
                          : `✕ CONFLUENCE GATEKEEPER BLOCKED - ${testTargetSide} SIGNAL HELD`}
                      </span>
                      <span className="text-xs text-[#d0c5b3] block mt-0.5">
                        {liveConfluenceEvaluation.summaryMessage}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                    <div className="px-3 py-1.5 rounded-lg bg-[#111417] border border-[#272a2d] text-center">
                      <span className="block text-[8px] text-[#99907f] uppercase">Passed Criteria</span>
                      <span className="font-extrabold text-sm text-[#fff8f1]">
                        {liveConfluenceEvaluation.totalPassed} / {liveConfluenceEvaluation.totalConfigured}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-[#111417] border border-[#272a2d] text-center">
                      <span className="block text-[8px] text-[#99907f] uppercase">Required</span>
                      <span className="font-extrabold text-sm text-[#ffd87f]">
                        {liveConfluenceEvaluation.requiredMatches}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Criteria Breakdown Tiles */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {liveConfluenceEvaluation.criteria.map((crit) => (
                    <div
                      key={crit.id}
                      className={`p-3 rounded-xl border font-mono text-xs flex flex-col justify-between ${
                        crit.passed
                          ? 'bg-[#14171a] border-[#00ff94]/30 text-[#fff8f1]'
                          : 'bg-[#14171a]/70 border-[#ff3b4a]/30 text-[#d0c5b3]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-[#fff8f1] flex items-center gap-1.5">
                          {crit.passed ? (
                            <Check className="w-3.5 h-3.5 text-[#00ff94] stroke-[3]" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-[#ff3b4a] stroke-[3]" />
                          )}
                          <span>{crit.name}</span>
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            crit.passed ? 'bg-[#00ff94]/20 text-[#00ff94]' : 'bg-[#ff3b4a]/20 text-[#ff3b4a]'
                          }`}
                        >
                          {crit.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between text-[#99907f]">
                          <span>Condition:</span>
                          <span className="text-[#ffd87f]">{crit.targetCondition}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#99907f]">Live Value:</span>
                          <span className="text-[#fff8f1] font-bold">{crit.currentValue}</span>
                        </div>
                        <div className="text-[10px] text-[#99907f] pt-1 border-t border-[#272a2d]/60 line-clamp-1">
                          {crit.statusText}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ============================================================== */}
              {/* INTERACTIVE CRITERIA CONFIGURATOR GRID (10 CARDS)              */}
              {/* ============================================================== */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-[#fff8f1] flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#00ff94]" />
                    <span>Confluence Filter Criteria Parameters</span>
                  </h4>
                  <span className="text-xs text-[#99907f] font-mono">
                    Configure thresholds required to permit signals
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* CRITERION 1: RSI Momentum Corridor */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      confluenceConfig.rsiMomentum.enabled
                        ? 'bg-[#191c1f] border-[#00ff94]/40'
                        : 'bg-[#14171a]/70 border-[#272a2d] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg p-1.5 bg-[#111417] rounded-lg border border-[#272a2d]">📊</span>
                        <div>
                          <h5 className="text-sm font-bold text-[#fff8f1]">RSI Momentum Gate (RSI &gt; 50)</h5>
                          <span className="text-[10px] text-[#99907f]">Requires directional RSI momentum alignment</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={confluenceConfig.rsiMomentum.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...confluenceConfig,
                            rsiMomentum: { ...confluenceConfig.rsiMomentum, enabled: e.target.checked },
                          };
                          setConfluenceConfig(updated);
                          handleSaveConfluenceConfig(updated);
                        }}
                        className="w-5 h-5 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {confluenceConfig.rsiMomentum.enabled && (
                      <div className="mt-3 pt-3 border-t border-[#272a2d] space-y-2 font-mono text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-[10px] text-[#99907f] block">Min Long RSI (Bullish):</span>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="number"
                                min="40"
                                max="70"
                                value={confluenceConfig.rsiMomentum.minLongRSI}
                                onChange={(e) => {
                                  const updated = {
                                    ...confluenceConfig,
                                    rsiMomentum: { ...confluenceConfig.rsiMomentum, minLongRSI: Number(e.target.value) },
                                  };
                                  setConfluenceConfig(updated);
                                  handleSaveConfluenceConfig(updated);
                                }}
                                className="w-16 py-1 px-2 bg-[#111417] border border-[#272a2d] rounded text-[#fff8f1] font-bold text-center"
                              />
                              <span className="text-[10px] text-[#00ff94] font-bold">RSI &gt;= {confluenceConfig.rsiMomentum.minLongRSI}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#99907f] block">Max Short RSI (Bearish):</span>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="number"
                                min="30"
                                max="60"
                                value={confluenceConfig.rsiMomentum.maxShortRSI}
                                onChange={(e) => {
                                  const updated = {
                                    ...confluenceConfig,
                                    rsiMomentum: { ...confluenceConfig.rsiMomentum, maxShortRSI: Number(e.target.value) },
                                  };
                                  setConfluenceConfig(updated);
                                  handleSaveConfluenceConfig(updated);
                                }}
                                className="w-16 py-1 px-2 bg-[#111417] border border-[#272a2d] rounded text-[#fff8f1] font-bold text-center"
                              />
                              <span className="text-[10px] text-[#ff3b4a] font-bold">RSI &lt;= {confluenceConfig.rsiMomentum.maxShortRSI}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 flex items-center gap-2 text-[10px] text-[#d0c5b3]">
                          <input
                            type="checkbox"
                            checked={confluenceConfig.rsiMomentum.allowOversoldLong}
                            onChange={(e) => {
                              const updated = {
                                ...confluenceConfig,
                                rsiMomentum: {
                                  ...confluenceConfig.rsiMomentum,
                                  allowOversoldLong: e.target.checked,
                                  allowOverboughtShort: e.target.checked,
                                },
                              };
                              setConfluenceConfig(updated);
                              handleSaveConfluenceConfig(updated);
                            }}
                            className="accent-[#00ff94] cursor-pointer"
                          />
                          <span>Allow Reversal Bounces (Long on RSI &lt;= 32 / Short on RSI &gt;= 68)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CRITERION 2: EMA 9 / 26 Cross Filter */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      confluenceConfig.ema9_26Cross.enabled
                        ? 'bg-[#191c1f] border-[#00ff94]/40'
                        : 'bg-[#14171a]/70 border-[#272a2d] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg p-1.5 bg-[#111417] rounded-lg border border-[#272a2d]">⚡</span>
                        <div>
                          <h5 className="text-sm font-bold text-[#fff8f1]">EMA 9 / 26 Crossover Gate</h5>
                          <span className="text-[10px] text-[#99907f]">Golden Cross (9&gt;26) Long / Death Cross (9&lt;26) Short</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={confluenceConfig.ema9_26Cross.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...confluenceConfig,
                            ema9_26Cross: { ...confluenceConfig.ema9_26Cross, enabled: e.target.checked },
                          };
                          setConfluenceConfig(updated);
                          handleSaveConfluenceConfig(updated);
                        }}
                        className="w-5 h-5 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {confluenceConfig.ema9_26Cross.enabled && (
                      <div className="mt-3 pt-3 border-t border-[#272a2d] space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between text-[#99907f]">
                          <span>Long Requirement:</span>
                          <span className="text-[#00ff94] font-bold">EMA 9 &gt; EMA 26 (Bullish Cross)</span>
                        </div>
                        <div className="flex items-center justify-between text-[#99907f]">
                          <span>Short Requirement:</span>
                          <span className="text-[#ff3b4a] font-bold">EMA 9 &lt; EMA 26 (Bearish Cross)</span>
                        </div>
                        <div className="pt-2 flex items-center gap-2 text-[10px] text-[#d0c5b3]">
                          <input
                            type="checkbox"
                            checked={confluenceConfig.ema9_26Cross.requirePriceAboveEMA9}
                            onChange={(e) => {
                              const updated = {
                                ...confluenceConfig,
                                ema9_26Cross: { ...confluenceConfig.ema9_26Cross, requirePriceAboveEMA9: e.target.checked },
                              };
                              setConfluenceConfig(updated);
                              handleSaveConfluenceConfig(updated);
                            }}
                            className="accent-[#00ff94] cursor-pointer"
                          />
                          <span>Strict: Require live price above EMA 9 for Long / below EMA 9 for Short</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CRITERION 3: Central Pivot Range (CPR) */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      confluenceConfig.cprPivot.enabled
                        ? 'bg-[#191c1f] border-[#00ff94]/40'
                        : 'bg-[#14171a]/70 border-[#272a2d] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg p-1.5 bg-[#111417] rounded-lg border border-[#272a2d]">🎯</span>
                        <div>
                          <h5 className="text-sm font-bold text-[#fff8f1]">Central Pivot Range (CPR TC/BC)</h5>
                          <span className="text-[10px] text-[#99907f]">Price above TC for Long / below BC for Short</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={confluenceConfig.cprPivot.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...confluenceConfig,
                            cprPivot: { ...confluenceConfig.cprPivot, enabled: e.target.checked },
                          };
                          setConfluenceConfig(updated);
                          handleSaveConfluenceConfig(updated);
                        }}
                        className="w-5 h-5 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {confluenceConfig.cprPivot.enabled && (
                      <div className="mt-3 pt-3 border-t border-[#272a2d] space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between text-[#99907f]">
                          <span>Long Zone:</span>
                          <span className="text-[#00ff94] font-bold">Price &gt;= TC (Top Central Pivot)</span>
                        </div>
                        <div className="flex items-center justify-between text-[#99907f]">
                          <span>Short Zone:</span>
                          <span className="text-[#ff3b4a] font-bold">Price &lt;= BC (Bottom Central Pivot)</span>
                        </div>
                        <div className="pt-2 flex items-center gap-2 text-[10px] text-[#ffd87f]">
                          <input
                            type="checkbox"
                            checked={confluenceConfig.cprPivot.disallowInsideCPR}
                            onChange={(e) => {
                              const updated = {
                                ...confluenceConfig,
                                cprPivot: { ...confluenceConfig.cprPivot, disallowInsideCPR: e.target.checked },
                              };
                              setConfluenceConfig(updated);
                              handleSaveConfluenceConfig(updated);
                            }}
                            className="accent-[#00ff94] cursor-pointer"
                          />
                          <span>Reject all signals trapped inside CPR Chop Range (TC-BC trap)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CRITERION 4: Supertrend Indicator */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      confluenceConfig.supertrend.enabled
                        ? 'bg-[#191c1f] border-[#00ff94]/40'
                        : 'bg-[#14171a]/70 border-[#272a2d] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg p-1.5 bg-[#111417] rounded-lg border border-[#272a2d]">🌊</span>
                        <div>
                          <h5 className="text-sm font-bold text-[#fff8f1]">Supertrend Volatility Trail</h5>
                          <span className="text-[10px] text-[#99907f]">Green for Longs / Red for Shorts</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={confluenceConfig.supertrend.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...confluenceConfig,
                            supertrend: { ...confluenceConfig.supertrend, enabled: e.target.checked },
                          };
                          setConfluenceConfig(updated);
                          handleSaveConfluenceConfig(updated);
                        }}
                        className="w-5 h-5 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {confluenceConfig.supertrend.enabled && (
                      <div className="mt-3 pt-3 border-t border-[#272a2d] space-y-2 font-mono text-xs">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center justify-between text-[#99907f]">
                            <span>Period:</span>
                            <span className="text-[#fff8f1] font-bold">{confluenceConfig.supertrend.period || 10}</span>
                          </div>
                          <div className="flex items-center justify-between text-[#99907f]">
                            <span>Multiplier:</span>
                            <span className="text-[#fff8f1] font-bold">{confluenceConfig.supertrend.multiplier || 3}x</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-[#00ff94]">
                          ✓ Signals matching opposite Supertrend state will be automatically rejected.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CRITERION 5: ADX Trend Strength */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      confluenceConfig.adxStrength.enabled
                        ? 'bg-[#191c1f] border-[#00ff94]/40'
                        : 'bg-[#14171a]/70 border-[#272a2d] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg p-1.5 bg-[#111417] rounded-lg border border-[#272a2d]">📈</span>
                        <div>
                          <h5 className="text-sm font-bold text-[#fff8f1]">ADX Trend Strength Gate</h5>
                          <span className="text-[10px] text-[#99907f]">Filters out low-momentum chop and sideways noise</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={confluenceConfig.adxStrength.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...confluenceConfig,
                            adxStrength: { ...confluenceConfig.adxStrength, enabled: e.target.checked },
                          };
                          setConfluenceConfig(updated);
                          handleSaveConfluenceConfig(updated);
                        }}
                        className="w-5 h-5 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {confluenceConfig.adxStrength.enabled && (
                      <div className="mt-3 pt-3 border-t border-[#272a2d] space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#99907f]">Minimum ADX Value:</span>
                          <span className="font-bold text-[#a855f7]">ADX &gt;= {confluenceConfig.adxStrength.minThreshold}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="15"
                            max="35"
                            value={confluenceConfig.adxStrength.minThreshold}
                            onChange={(e) => {
                              const updated = {
                                ...confluenceConfig,
                                adxStrength: { ...confluenceConfig.adxStrength, minThreshold: Number(e.target.value) },
                              };
                              setConfluenceConfig(updated);
                              handleSaveConfluenceConfig(updated);
                            }}
                            className="w-full accent-[#a855f7] cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CRITERION 6: EMA Ribbon 4-Stack */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      confluenceConfig.emaRibbon.enabled
                        ? 'bg-[#191c1f] border-[#00ff94]/40'
                        : 'bg-[#14171a]/70 border-[#272a2d] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg p-1.5 bg-[#111417] rounded-lg border border-[#272a2d]">🎗️</span>
                        <div>
                          <h5 className="text-sm font-bold text-[#fff8f1]">EMA Ribbon 4-Stack (9/26/50/200)</h5>
                          <span className="text-[10px] text-[#99907f]">Requires full geometric moving average fanning</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={confluenceConfig.emaRibbon.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...confluenceConfig,
                            emaRibbon: { ...confluenceConfig.emaRibbon, enabled: e.target.checked },
                          };
                          setConfluenceConfig(updated);
                          handleSaveConfluenceConfig(updated);
                        }}
                        className="w-5 h-5 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {confluenceConfig.emaRibbon.enabled && (
                      <div className="mt-3 pt-3 border-t border-[#272a2d] space-y-1.5 font-mono text-xs">
                        <div className="flex items-center justify-between text-[#99907f]">
                          <span>Bullish Stack:</span>
                          <span className="text-[#00ff94] font-bold">9 &gt; 26 &gt; 50 &gt; 200</span>
                        </div>
                        <div className="flex items-center justify-between text-[#99907f]">
                          <span>Bearish Stack:</span>
                          <span className="text-[#ff3b4a] font-bold">9 &lt; 26 &lt; 50 &lt; 200</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CRITERION 7: Smart Money Concepts (SMC) & FVG */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      confluenceConfig.smcOrderFlow.enabled
                        ? 'bg-[#191c1f] border-[#00ff94]/40'
                        : 'bg-[#14171a]/70 border-[#272a2d] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg p-1.5 bg-[#111417] rounded-lg border border-[#272a2d]">🏛️</span>
                        <div>
                          <h5 className="text-sm font-bold text-[#fff8f1]">Smart Money Concepts (SMC Sweep)</h5>
                          <span className="text-[10px] text-[#99907f]">Fair Value Gap mitigation &amp; liquidity absorption</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={confluenceConfig.smcOrderFlow.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...confluenceConfig,
                            smcOrderFlow: { ...confluenceConfig.smcOrderFlow, enabled: e.target.checked },
                          };
                          setConfluenceConfig(updated);
                          handleSaveConfluenceConfig(updated);
                        }}
                        className="w-5 h-5 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {confluenceConfig.smcOrderFlow.enabled && (
                      <div className="mt-3 pt-3 border-t border-[#272a2d] space-y-1.5 font-mono text-xs">
                        <div className="text-[10px] text-[#ffd87f]">
                          ✓ Checks institutional order block touches and high-volume taker liquidity imbalance.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CRITERION 8: Volume Expansion Gate */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      confluenceConfig.volumeExpansion.enabled
                        ? 'bg-[#191c1f] border-[#00ff94]/40'
                        : 'bg-[#14171a]/70 border-[#272a2d] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg p-1.5 bg-[#111417] rounded-lg border border-[#272a2d]">🔊</span>
                        <div>
                          <h5 className="text-sm font-bold text-[#fff8f1]">Volume Expansion Gate</h5>
                          <span className="text-[10px] text-[#99907f]">Requires minimum volume surge above average</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={confluenceConfig.volumeExpansion.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...confluenceConfig,
                            volumeExpansion: { ...confluenceConfig.volumeExpansion, enabled: e.target.checked },
                          };
                          setConfluenceConfig(updated);
                          handleSaveConfluenceConfig(updated);
                        }}
                        className="w-5 h-5 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {confluenceConfig.volumeExpansion.enabled && (
                      <div className="mt-3 pt-3 border-t border-[#272a2d] space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#99907f]">Min Volume Multiplier:</span>
                          <span className="font-bold text-[#ffd87f]">{confluenceConfig.volumeExpansion.minVolumeMultiplier}x Avg</span>
                        </div>
                        <input
                          type="range"
                          min="1.1"
                          max="3.0"
                          step="0.1"
                          value={confluenceConfig.volumeExpansion.minVolumeMultiplier}
                          onChange={(e) => {
                            const updated = {
                              ...confluenceConfig,
                              volumeExpansion: { ...confluenceConfig.volumeExpansion, minVolumeMultiplier: Number(e.target.value) },
                            };
                            setConfluenceConfig(updated);
                            handleSaveConfluenceConfig(updated);
                          }}
                          className="w-full accent-[#ffd87f] cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* CRITERION 9: AI Confidence Score Gate */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      confluenceConfig.minConfidence.enabled
                        ? 'bg-[#191c1f] border-[#00ff94]/40'
                        : 'bg-[#14171a]/70 border-[#272a2d] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg p-1.5 bg-[#111417] rounded-lg border border-[#272a2d]">🤖</span>
                        <div>
                          <h5 className="text-sm font-bold text-[#fff8f1]">Minimum AI Confidence Gate</h5>
                          <span className="text-[10px] text-[#99907f]">Rejects signals below strict conviction threshold</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={confluenceConfig.minConfidence.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...confluenceConfig,
                            minConfidence: { ...confluenceConfig.minConfidence, enabled: e.target.checked },
                          };
                          setConfluenceConfig(updated);
                          handleSaveConfluenceConfig(updated);
                        }}
                        className="w-5 h-5 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {confluenceConfig.minConfidence.enabled && (
                      <div className="mt-3 pt-3 border-t border-[#272a2d] space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#99907f]">Minimum Conviction:</span>
                          <span className="font-bold text-[#00ff94]">&gt;= {confluenceConfig.minConfidence.threshold}%</span>
                        </div>
                        <input
                          type="range"
                          min="70"
                          max="95"
                          value={confluenceConfig.minConfidence.threshold}
                          onChange={(e) => {
                            const updated = {
                              ...confluenceConfig,
                              minConfidence: { ...confluenceConfig.minConfidence, threshold: Number(e.target.value) },
                            };
                            setConfluenceConfig(updated);
                            handleSaveConfluenceConfig(updated);
                          }}
                          className="w-full accent-[#00ff94] cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* CRITERION 10: Minimum Risk-to-Reward Ratio */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      confluenceConfig.minRiskReward.enabled
                        ? 'bg-[#191c1f] border-[#00ff94]/40'
                        : 'bg-[#14171a]/70 border-[#272a2d] opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg p-1.5 bg-[#111417] rounded-lg border border-[#272a2d]">⚖️</span>
                        <div>
                          <h5 className="text-sm font-bold text-[#fff8f1]">Minimum Risk:Reward Ratio</h5>
                          <span className="text-[10px] text-[#99907f]">Enforces positive mathematical expectancy</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={confluenceConfig.minRiskReward.enabled}
                        onChange={(e) => {
                          const updated = {
                            ...confluenceConfig,
                            minRiskReward: { ...confluenceConfig.minRiskReward, enabled: e.target.checked },
                          };
                          setConfluenceConfig(updated);
                          handleSaveConfluenceConfig(updated);
                        }}
                        className="w-5 h-5 accent-[#00ff94] cursor-pointer"
                      />
                    </div>

                    {confluenceConfig.minRiskReward.enabled && (
                      <div className="mt-3 pt-3 border-t border-[#272a2d] space-y-2 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#99907f]">Minimum R:R:</span>
                          <span className="font-bold text-[#ffd87f]">1 : {confluenceConfig.minRiskReward.minRatio}</span>
                        </div>
                        <input
                          type="range"
                          min="1.2"
                          max="3.0"
                          step="0.1"
                          value={confluenceConfig.minRiskReward.minRatio}
                          onChange={(e) => {
                            const updated = {
                              ...confluenceConfig,
                              minRiskReward: { ...confluenceConfig.minRiskReward, minRatio: Number(e.target.value) },
                            };
                            setConfluenceConfig(updated);
                            handleSaveConfluenceConfig(updated);
                          }}
                          className="w-full accent-[#ffd87f] cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* TAB 2: Consolidated Technical Indicators Telemetry Matrix   */}
          {/* ------------------------------------------------------------ */}
          {activeTab === 'indicators' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#191c1f] rounded-xl border border-[#272a2d] flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#fff8f1] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00ff94]" />
                    <span>Real-Time Technical Indicator Coverage Across All 30+ Tracked Assets</span>
                  </h3>
                  <p className="text-xs text-[#99907f] mt-0.5">
                    Live quantitative aggregation of indicator parameters, market regime distribution, and confluence signals.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-1 bg-[#111417] rounded-lg border border-[#272a2d] text-[#00ff94] font-bold">
                    100% Quantitative Real-Time
                  </span>
                </div>
              </div>

              {/* Indicator Telemetry Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. Central Pivot Range (CPR) */}
                <div className="p-4 bg-[#191c1f] rounded-xl border border-[#272a2d] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎯</span>
                      <div>
                        <h4 className="font-bold text-xs text-[#fff8f1]">Central Pivot Range (CPR)</h4>
                        <span className="text-[10px] text-[#99907f] font-mono">TC, Pivot, BC Formula</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#00ff94]/15 text-[#00ff94] font-mono font-bold">
                      {indicatorTelemetry.cpr.aboveTCPercent}% Above TC
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#00ff94]">Above TC</span>
                      <span className="font-bold text-[#00ff94]">{indicatorTelemetry.cpr.aboveTC} Assets</span>
                    </div>
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#ffd87f]">Inside CPR</span>
                      <span className="font-bold text-[#ffd87f]">{indicatorTelemetry.cpr.insideCPR} Assets</span>
                    </div>
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#ff3b4a]">Below BC</span>
                      <span className="font-bold text-[#ff3b4a]">{indicatorTelemetry.cpr.belowBC} Assets</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#99907f]">
                    Filters out low-probability chop when price is inside CPR corridor; triggers directional expansion above TC / below BC.
                  </p>
                </div>

                {/* 2. EMA Multi-Ribbon & Crosses */}
                <div className="p-4 bg-[#191c1f] rounded-xl border border-[#272a2d] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📈</span>
                      <div>
                        <h4 className="font-bold text-xs text-[#fff8f1]">EMA Multi-Ribbon (9/21/55/200)</h4>
                        <span className="text-[10px] text-[#99907f] font-mono">Dynamic Trend Alignment</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#ffd87f]/15 text-[#ffd87f] font-mono font-bold">
                      {indicatorTelemetry.emaRibbon.bullishPercent}% Bullish Stack
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#00ff94]">Bullish Stack</span>
                      <span className="font-bold text-[#00ff94]">{indicatorTelemetry.emaRibbon.bullishStacked} Assets</span>
                    </div>
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#99907f]">Mixed Chop</span>
                      <span className="font-bold text-[#d0c5b3]">{indicatorTelemetry.emaRibbon.neutral} Assets</span>
                    </div>
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#ff3b4a]">Bearish Stack</span>
                      <span className="font-bold text-[#ff3b4a]">{indicatorTelemetry.emaRibbon.bearishStacked} Assets</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#99907f]">
                    9/26 EMA momentum crossovers and 9/21/55/200 macro trend fan-out detection.
                  </p>
                </div>

                {/* 3. ADX Directional Trend Strength */}
                <div className="p-4 bg-[#191c1f] rounded-xl border border-[#272a2d] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <div>
                        <h4 className="font-bold text-xs text-[#fff8f1]">ADX Trend Filter (14)</h4>
                        <span className="text-[10px] text-[#99907f] font-mono">Directional Strength Index</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#a855f7]/15 text-[#a855f7] font-mono font-bold">
                      {indicatorTelemetry.adx.trendPercent}% Active Trends
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#00ff94]">Strong (&gt; 25)</span>
                      <span className="font-bold text-[#00ff94]">{indicatorTelemetry.adx.trendingHigh} Assets</span>
                    </div>
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#a855f7]">Active (20-25)</span>
                      <span className="font-bold text-[#a855f7]">{indicatorTelemetry.adx.moderate} Assets</span>
                    </div>
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#99907f]">Chop (&lt; 20)</span>
                      <span className="font-bold text-[#99907f]">{indicatorTelemetry.adx.consolidating} Assets</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#99907f]">
                    Filters out false breakout traps during low-volatility sideways consolidation.
                  </p>
                </div>

                {/* 4. RSI Momentum & Mean Reversion Corridor */}
                <div className="p-4 bg-[#191c1f] rounded-xl border border-[#272a2d] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔄</span>
                      <div>
                        <h4 className="font-bold text-xs text-[#fff8f1]">RSI Momentum &amp; Reversion (14)</h4>
                        <span className="text-[10px] text-[#99907f] font-mono">Extremes &amp; Corridor</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-mono font-bold">
                      {indicatorTelemetry.rsi.momentumCorridor} in Corridor
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
                    <div className="p-1.5 bg-[#111417] rounded border border-[#272a2d] text-center">
                      <span className="block text-[8px] text-[#00ff94]">Oversold (&lt;32)</span>
                      <span className="font-bold text-[#00ff94]">{indicatorTelemetry.rsi.oversold}</span>
                    </div>
                    <div className="p-1.5 bg-[#111417] rounded border border-[#272a2d] text-center">
                      <span className="block text-[8px] text-[#38bdf8]">Corridor (48-68)</span>
                      <span className="font-bold text-[#38bdf8]">{indicatorTelemetry.rsi.momentumCorridor}</span>
                    </div>
                    <div className="p-1.5 bg-[#111417] rounded border border-[#272a2d] text-center">
                      <span className="block text-[8px] text-[#ff3b4a]">Overbought (&gt;68)</span>
                      <span className="font-bold text-[#ff3b4a]">{indicatorTelemetry.rsi.overbought}</span>
                    </div>
                    <div className="p-1.5 bg-[#111417] rounded border border-[#272a2d] text-center">
                      <span className="block text-[8px] text-[#99907f]">Neutral</span>
                      <span className="font-bold text-[#d0c5b3]">{indicatorTelemetry.rsi.neutral}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#99907f]">
                    Supports trend momentum expansion and identifies extreme RSI reversal exhaustion zones.
                  </p>
                </div>

                {/* 5. Supertrend Volatility Trailing Engine */}
                <div className="p-4 bg-[#191c1f] rounded-xl border border-[#272a2d] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚡</span>
                      <div>
                        <h4 className="font-bold text-xs text-[#fff8f1]">Supertrend (10, 3)</h4>
                        <span className="text-[10px] text-[#99907f] font-mono">ATR Trailing Stop Engine</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#00ff94]/15 text-[#00ff94] font-mono font-bold">
                      {indicatorTelemetry.supertrend.greenPercent}% Green
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#00ff94]">Green / Bullish Trail</span>
                      <span className="font-bold text-[#00ff94]">{indicatorTelemetry.supertrend.greenCount} Assets</span>
                    </div>
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#ff3b4a]">Red / Bearish Trail</span>
                      <span className="font-bold text-[#ff3b4a]">{indicatorTelemetry.supertrend.redCount} Assets</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#99907f]">
                    Dynamically trails prices with 3.0x ATR multiplier to capture strong directional swings.
                  </p>
                </div>

                {/* 6. Smart Money Concepts (SMC) & FVG Imbalance */}
                <div className="p-4 bg-[#191c1f] rounded-xl border border-[#272a2d] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏛️</span>
                      <div>
                        <h4 className="font-bold text-xs text-[#fff8f1]">Smart Money Concepts (SMC)</h4>
                        <span className="text-[10px] text-[#99907f] font-mono">FVG &amp; Order Blocks</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#fb923c]/15 text-[#fb923c] font-mono font-bold">
                      Institutional Flow
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#00ff94]">Demand Mitigated</span>
                      <span className="font-bold text-[#00ff94]">{indicatorTelemetry.smc.demandMitigated} Assets</span>
                    </div>
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#99907f]">Mid-Range</span>
                      <span className="font-bold text-[#d0c5b3]">{indicatorTelemetry.smc.neutral} Assets</span>
                    </div>
                    <div className="p-2 bg-[#111417] rounded-lg border border-[#272a2d] text-center">
                      <span className="block text-[9px] text-[#ff3b4a]">Supply Swept</span>
                      <span className="font-bold text-[#ff3b4a]">{indicatorTelemetry.smc.supplySwept} Assets</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#99907f]">
                    Detects Fair Value Gap imbalances and aggressive whale taker absorption.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------ */}
          {/* TAB 3: Custom Strategy Parameters Form & Tuner               */}
          {/* ------------------------------------------------------------ */}
          {activeTab === 'builder' && (
            <form onSubmit={handleSaveStrategyForm} className="max-w-4xl mx-auto space-y-4">
              {/* Form Title */}
              <div className="p-3.5 bg-[#191c1f] rounded-xl border border-[#272a2d] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="text-2xl p-1.5 rounded-lg bg-[#111417] border border-[#272a2d]">
                    {formIcon || '✨'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#fff8f1]">
                      {editingStrategy ? `Edit Parameters: ${editingStrategy.name}` : 'Create New Custom Strategy'}
                    </h3>
                    <p className="text-xs text-[#99907f]">
                      Configure technical indicators, momentum corridors, and ATR risk parameters.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-[#ffd87f]">
                    Target R:R: 1 : {(ruleTPMultiple / Math.max(ruleSLMultiple, 0.1)).toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Basic Details */}
              <div className="p-4 bg-[#191c1f] rounded-xl border border-[#272a2d] space-y-3">
                <h4 className="font-bold text-xs text-[#ffd87f] uppercase tracking-wider font-mono">
                  1. Strategy Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#fff8f1] mb-1">Strategy Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. My 15m Trend Pullback Engine"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full py-2 px-3 bg-[#111417] border border-[#272a2d] rounded-lg text-[#fff8f1] focus:border-[#00ff94] focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#fff8f1] mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as StrategyCategory)}
                      className="w-full py-2 px-3 bg-[#111417] border border-[#272a2d] rounded-lg text-[#fff8f1] focus:border-[#00ff94] focus:outline-none font-mono"
                    >
                      <option value="confluence">Confluence (Multi-Indicator)</option>
                      <option value="trend">Trend Following</option>
                      <option value="scalp">Fast Scalp</option>
                      <option value="reversion">Mean Reversion</option>
                      <option value="breakout">Breakout / Smart Money</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-bold text-[#fff8f1] mb-1">Description / Thesis</label>
                    <input
                      type="text"
                      placeholder="Short summary of entry conditions and trade setup..."
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      className="w-full py-2 px-3 bg-[#111417] border border-[#272a2d] rounded-lg text-[#fff8f1] focus:border-[#00ff94] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Indicator Rule Selectors */}
              <div className="p-4 bg-[#191c1f] rounded-xl border border-[#272a2d] space-y-3">
                <h4 className="font-bold text-xs text-[#00ff94] uppercase tracking-wider font-mono">
                  2. Indicator Confluence Knobs &amp; Conditions
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* CPR */}
                  <div className="p-3 bg-[#111417] rounded-xl border border-[#272a2d] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#fff8f1] block">Central Pivot Range (CPR)</span>
                      <span className="text-[10px] text-[#99907f]">Long &gt; TC / Short &lt; BC (Avoids inside-CPR trap)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ruleUseCPR}
                      onChange={(e) => setRuleUseCPR(e.target.checked)}
                      className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                    />
                  </div>

                  {/* 9 & 26 EMA */}
                  <div className="p-3 bg-[#111417] rounded-xl border border-[#272a2d] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#fff8f1] block">9 &amp; 26 EMA Momentum Cross</span>
                      <span className="text-[10px] text-[#99907f]">Fast directional momentum confirmation</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ruleUseEMA9_26}
                      onChange={(e) => setRuleUseEMA9_26(e.target.checked)}
                      className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                    />
                  </div>

                  {/* EMA Ribbon */}
                  <div className="p-3 bg-[#111417] rounded-xl border border-[#272a2d] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#fff8f1] block">EMA Ribbon (9/21/55/200)</span>
                      <span className="text-[10px] text-[#99907f]">Macro trend stacking alignment</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ruleUseEMARibbon}
                      onChange={(e) => setRuleUseEMARibbon(e.target.checked)}
                      className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                    />
                  </div>

                  {/* ADX Filter */}
                  <div className="p-3 bg-[#111417] rounded-xl border border-[#272a2d] space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#fff8f1] block">ADX Trend Filter</span>
                        <span className="text-[10px] text-[#99907f]">Directional momentum threshold</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={ruleUseADX}
                        onChange={(e) => setRuleUseADX(e.target.checked)}
                        className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                      />
                    </div>
                    {ruleUseADX && (
                      <div className="flex items-center gap-2 pt-1 border-t border-[#272a2d]">
                        <span className="text-[10px] text-[#99907f] font-mono">Min Threshold:</span>
                        <input
                          type="number"
                          value={ruleADXThresh}
                          onChange={(e) => setRuleADXThresh(Number(e.target.value))}
                          className="w-16 py-1 px-2 bg-[#191c1f] border border-[#272a2d] rounded text-[#fff8f1] font-mono text-xs text-center"
                        />
                        <span className="text-[10px] text-[#99907f]">(Default: 20)</span>
                      </div>
                    )}
                  </div>

                  {/* RSI Momentum Band */}
                  <div className="p-3 bg-[#111417] rounded-xl border border-[#272a2d] space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#fff8f1] block">RSI Momentum Corridor</span>
                        <span className="text-[10px] text-[#99907f]">Target entry range for Long/Short</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={ruleUseRSI}
                        onChange={(e) => setRuleUseRSI(e.target.checked)}
                        className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                      />
                    </div>
                    {ruleUseRSI && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#272a2d] font-mono text-[10px]">
                        <div>
                          <span className="text-[#99907f] block">Long Band:</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <input
                              type="number"
                              value={ruleRSILongMin}
                              onChange={(e) => setRuleRSILongMin(Number(e.target.value))}
                              className="w-12 py-0.5 px-1 bg-[#191c1f] border border-[#272a2d] rounded text-[#fff8f1] text-center"
                            />
                            <span>-</span>
                            <input
                              type="number"
                              value={ruleRSILongMax}
                              onChange={(e) => setRuleRSILongMax(Number(e.target.value))}
                              className="w-12 py-0.5 px-1 bg-[#191c1f] border border-[#272a2d] rounded text-[#fff8f1] text-center"
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-[#99907f] block">Short Band:</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <input
                              type="number"
                              value={ruleRSIShortMin}
                              onChange={(e) => setRuleRSIShortMin(Number(e.target.value))}
                              className="w-12 py-0.5 px-1 bg-[#191c1f] border border-[#272a2d] rounded text-[#fff8f1] text-center"
                            />
                            <span>-</span>
                            <input
                              type="number"
                              value={ruleRSIShortMax}
                              onChange={(e) => setRuleRSIShortMax(Number(e.target.value))}
                              className="w-12 py-0.5 px-1 bg-[#191c1f] border border-[#272a2d] rounded text-[#fff8f1] text-center"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Supertrend */}
                  <div className="p-3 bg-[#111417] rounded-xl border border-[#272a2d] space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#fff8f1] block">Supertrend Trailing Stop</span>
                        <span className="text-[10px] text-[#99907f]">Dynamic volatility band trail</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={ruleUseSupertrend}
                        onChange={(e) => setRuleUseSupertrend(e.target.checked)}
                        className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                      />
                    </div>
                    {ruleUseSupertrend && (
                      <div className="flex items-center gap-3 pt-1 border-t border-[#272a2d] font-mono text-[10px]">
                        <div className="flex items-center gap-1">
                          <span className="text-[#99907f]">Period:</span>
                          <input
                            type="number"
                            value={ruleSupertrendPeriod}
                            onChange={(e) => setRuleSupertrendPeriod(Number(e.target.value))}
                            className="w-12 py-0.5 px-1 bg-[#191c1f] border border-[#272a2d] rounded text-[#fff8f1] text-center"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[#99907f]">Multiplier:</span>
                          <input
                            type="number"
                            step="0.5"
                            value={ruleSupertrendMultiplier}
                            onChange={(e) => setRuleSupertrendMultiplier(Number(e.target.value))}
                            className="w-12 py-0.5 px-1 bg-[#191c1f] border border-[#272a2d] rounded text-[#fff8f1] text-center"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Smart Money Concepts (SMC & FVG) */}
                  <div className="p-3 bg-[#111417] rounded-xl border border-[#272a2d] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#fff8f1] block">Smart Money FVG Sweeps</span>
                      <span className="text-[10px] text-[#99907f]">Order block liquidity mitigation</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={ruleUseSMC}
                      onChange={(e) => setRuleUseSMC(e.target.checked)}
                      className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                    />
                  </div>

                  {/* Volume Surge */}
                  <div className="p-3 bg-[#111417] rounded-xl border border-[#272a2d] space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#fff8f1] block">Volume Surge Multiplier</span>
                        <span className="text-[10px] text-[#99907f]">Expansion vs 20-period moving average</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={ruleUseVolSurge}
                        onChange={(e) => setRuleUseVolSurge(e.target.checked)}
                        className="w-4 h-4 accent-[#00ff94] cursor-pointer"
                      />
                    </div>
                    {ruleUseVolSurge && (
                      <div className="flex items-center gap-2 pt-1 border-t border-[#272a2d]">
                        <span className="text-[10px] text-[#99907f] font-mono">Surge Factor:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={ruleVolMultiplier}
                          onChange={(e) => setRuleVolMultiplier(Number(e.target.value))}
                          className="w-16 py-1 px-2 bg-[#191c1f] border border-[#272a2d] rounded text-[#fff8f1] font-mono text-xs text-center"
                        />
                        <span className="text-[10px] text-[#99907f]">(e.g. 1.5x)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Risk Management & ATR Multipliers */}
              <div className="p-4 bg-[#191c1f] rounded-xl border border-[#272a2d] space-y-3">
                <h4 className="font-bold text-xs text-[#ffd87f] uppercase tracking-wider font-mono">
                  3. Risk Management &amp; ATR Targets
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] text-[#99907f] mb-1">Stop Loss (ATR Multiple)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="5.0"
                      value={ruleSLMultiple}
                      onChange={(e) => setRuleSLMultiple(Number(e.target.value))}
                      className="w-full py-1.5 px-2.5 bg-[#111417] border border-[#272a2d] rounded-lg text-[#ff3b4a] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#99907f] mb-1">Take Profit 1 (ATR Multiple)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="10.0"
                      value={ruleTPMultiple}
                      onChange={(e) => setRuleTPMultiple(Number(e.target.value))}
                      className="w-full py-1.5 px-2.5 bg-[#111417] border border-[#272a2d] rounded-lg text-[#00ff94] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#99907f] mb-1">Rec. Timeframe</label>
                    <select
                      value={formTimeframe}
                      onChange={(e) => setFormTimeframe(e.target.value)}
                      className="w-full py-1.5 px-2 bg-[#111417] border border-[#272a2d] rounded-lg text-[#fff8f1]"
                    >
                      <option value="5m">5m (Scalping)</option>
                      <option value="15m">15m (Intraday)</option>
                      <option value="1h">1h (Swing)</option>
                      <option value="4h">4h (Position)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#99907f] mb-1">Rec. Leverage</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={formLeverage}
                      onChange={(e) => setFormLeverage(Number(e.target.value))}
                      className="w-full py-1.5 px-2.5 bg-[#111417] border border-[#272a2d] rounded-lg text-[#fff8f1]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('strategies');
                    setEditingStrategy(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1] text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#111417] text-xs font-extrabold font-mono flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,148,0.3)] transition-transform hover:scale-105 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingStrategy ? 'Save Changes & Apply Globally' : 'Create & Enable Globally'}</span>
                </button>
              </div>
            </form>
          )}

          {/* ------------------------------------------------------------ */}
          {/* TAB 4: Multi-Asset Global Consensus Signal Feed              */}
          {/* ------------------------------------------------------------ */}
          {activeTab === 'consensus' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#191c1f] rounded-xl border border-[#272a2d] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#fff8f1] flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#00ff94]" />
                    <span>Cross-Asset Consensus Signal Matrix</span>
                  </h3>
                  <p className="text-xs text-[#99907f]">
                    Live consensus generated by running all globally enabled strategies across every crypto pair.
                  </p>
                </div>
                <div className="font-mono text-xs text-[#99907f]">
                  Showing <span className="text-[#00ff94] font-bold">{consensusScans.length}</span> Tracked Assets
                </div>
              </div>

              {/* Scans List Table */}
              <div className="space-y-2">
                {consensusScans.map((scan) => {
                  const isCurrent = scan.coin.symbol === currentPair;
                  const isStrongBuy = scan.consensusSignal === 'STRONG_BUY';
                  const isBuy = scan.consensusSignal === 'BUY' || isStrongBuy;
                  const isStrongSell = scan.consensusSignal === 'STRONG_SELL';
                  const isSell = scan.consensusSignal === 'SELL' || isStrongSell;
                  const isNeutral = scan.consensusSignal === 'NEUTRAL';
                  const isExecuted = executedCoins[scan.coin.symbol];

                  return (
                    <div
                      key={scan.coin.symbol}
                      className={`p-3 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-[#191c1f] border-[#f6be16]/60'
                          : isBuy
                          ? 'bg-[#191c1f]/90 border-[#00ff94]/40 hover:border-[#00ff94]'
                          : isSell
                          ? 'bg-[#191c1f]/90 border-[#ff3b4a]/40 hover:border-[#ff3b4a]'
                          : 'bg-[#14171a]/70 border-[#272a2d]'
                      }`}
                    >
                      {/* Left: Coin Name & Price */}
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-8 h-8 rounded-full bg-[#272a2d] border border-[#37393d] flex items-center justify-center text-xs font-bold text-[#fff8f1]">
                          {scan.coin.baseAsset.slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-xs text-[#fff8f1]">
                            <span>{scan.coin.symbol}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#272a2d] text-[#99907f] font-mono">
                              {scan.coin.category}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] px-1 bg-[#f6be16]/20 text-[#f6be16] rounded font-mono">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 font-mono text-xs mt-0.5">
                            <span className="text-[#fff8f1] font-bold">
                              ${scan.ticker.price?.toFixed(scan.coin.precision)}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                (scan.ticker.change24h || 0) >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                              }`}
                            >
                              {(scan.ticker.change24h || 0) >= 0
                                ? `+${scan.ticker.change24h?.toFixed(2)}%`
                                : `${scan.ticker.change24h?.toFixed(2)}%`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Consensus Signal Badge & Votes */}
                      <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                        <div
                          className={`px-3 py-1 rounded-lg font-extrabold flex items-center gap-1.5 border ${
                            isStrongBuy
                              ? 'bg-[#00ff94]/25 text-[#00ff94] border-[#00ff94] shadow-[0_0_12px_rgba(0,255,148,0.3)]'
                              : isBuy
                              ? 'bg-[#00ff94]/15 text-[#00ff94] border-[#00ff94]/40'
                              : isStrongSell
                              ? 'bg-[#ff3b4a]/25 text-[#ff3b4a] border-[#ff3b4a] shadow-[0_0_12px_rgba(255,59,74,0.3)]'
                              : isSell
                              ? 'bg-[#ff3b4a]/15 text-[#ff3b4a] border-[#ff3b4a]/40'
                              : 'bg-[#272a2d] text-[#99907f] border-[#37393d]'
                          }`}
                        >
                          {isBuy && <TrendingUp className="w-3.5 h-3.5 text-[#00ff94]" />}
                          {isSell && <TrendingDown className="w-3.5 h-3.5 text-[#ff3b4a]" />}
                          {isNeutral && <Clock className="w-3.5 h-3.5 text-[#99907f]" />}
                          <span>{scan.consensusSignal.replace('_', ' ')}</span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-[#00ff94]/15 text-[#00ff94] font-bold">
                            +{scan.buyVotes} Buy
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#ff3b4a]/15 text-[#ff3b4a] font-bold">
                            -{scan.sellVotes} Sell
                          </span>
                        </div>
                      </div>

                      {/* Top Strategy Trigger */}
                      <div className="flex-1 text-xs text-[#d0c5b3] line-clamp-1">
                        {scan.topStrategy ? (
                          <span className="font-mono text-[11px] text-[#ffd87f]">
                            🎯 {scan.topStrategy.triggerReason}
                          </span>
                        ) : (
                          <span className="text-[#99907f] text-[11px]">No active directional confluence</span>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                        {!isNeutral && scan.topStrategy && (
                          <button
                            onClick={() => handleExecuteConsensusTrade(scan)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-transform hover:scale-105 cursor-pointer shadow-md ${
                              isExecuted
                                ? 'bg-[#00ff94]/30 text-[#00ff94] border border-[#00ff94]'
                                : isBuy
                                ? 'bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#111417]'
                                : 'bg-[#ff3b4a] hover:bg-[#ff3b4a]/90 text-white'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>{isExecuted ? '✓ Executed' : '1-Click Trade'}</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onSelectPair(scan.coin.symbol);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] hover:text-[#f6be16] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Open Chart"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                          <span>Chart</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* STRATEGY CONFLUENCE LOGIC BREAKDOWN MODAL / TOOLTIP DIALOG     */}
        {/* ============================================================== */}
        {selectedInfoStrategy && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-[#191c1f] border border-[#ffd87f]/40 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleUp">
              {/* Header */}
              <div className="p-4 bg-[#14171a] border-b border-[#272a2d] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 rounded-xl bg-[#191c1f] border border-[#272a2d]">
                    {selectedInfoStrategy.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-[#fff8f1]">
                        {selectedInfoStrategy.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#ffd87f]/15 text-[#ffd87f] font-mono font-bold uppercase">
                        Confluence Logic
                      </span>
                    </div>
                    <span className="text-xs text-[#99907f] font-mono">
                      Category: <span className="text-[#00ff94] capitalize">{selectedInfoStrategy.category}</span> • TF: {selectedInfoStrategy.recommendedTimeframe} • {selectedInfoStrategy.recommendedLeverage}x Leverage
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInfoStrategy(null)}
                  className="p-1.5 rounded-lg text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 font-mono text-xs">
                {/* Description */}
                <div className="p-3 bg-[#111417] rounded-xl border border-[#272a2d] text-[#d0c5b3] text-xs leading-relaxed font-sans">
                  <span className="text-[#ffd87f] font-bold font-mono text-xs block mb-1">📖 Strategy Overview:</span>
                  {selectedInfoStrategy.description}
                </div>

                {/* Why It Triggers - Confluence Requirements */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#00ff94] uppercase flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-[#00ff94]" />
                    <span>Confluence Entry Conditions (Why Signals Trigger):</span>
                  </h4>

                  <div className="space-y-2">
                    {/* RSI */}
                    {selectedInfoStrategy.rules.useRSIFilter && (
                      <div className="p-3 rounded-lg bg-[#111417] border border-[#38bdf8]/30 space-y-1">
                        <div className="flex items-center justify-between text-[#38bdf8] font-bold">
                          <span>1. RSI Momentum Corridor</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#38bdf8]/10 rounded">RSI Gating</span>
                        </div>
                        <p className="text-[11px] text-[#99907f] font-sans">
                          • <strong className="text-[#00ff94]">LONG Signal:</strong> Requires RSI between <span className="text-[#fff8f1] font-mono">{selectedInfoStrategy.rules.rsiLongMin || 48}</span> and <span className="text-[#fff8f1] font-mono">{selectedInfoStrategy.rules.rsiLongMax || 70}</span> (Confirms strong bullish momentum without buying extreme exhaustion).<br />
                          • <strong className="text-[#ff3b4a]">SHORT Signal:</strong> Requires RSI between <span className="text-[#fff8f1] font-mono">{selectedInfoStrategy.rules.rsiShortMin || 30}</span> and <span className="text-[#fff8f1] font-mono">{selectedInfoStrategy.rules.rsiShortMax || 52}</span> (Confirms bearish breakdown).
                        </p>
                      </div>
                    )}

                    {/* EMA 9 / 26 */}
                    {selectedInfoStrategy.rules.useEMA9_26 && (
                      <div className="p-3 rounded-lg bg-[#111417] border border-[#ffd87f]/30 space-y-1">
                        <div className="flex items-center justify-between text-[#ffd87f] font-bold">
                          <span>2. EMA 9 / 26 Moving Average Trend</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#ffd87f]/10 rounded">Trend Bias</span>
                        </div>
                        <p className="text-[11px] text-[#99907f] font-sans">
                          • <strong className="text-[#00ff94]">LONG:</strong> Fast EMA 9 must be crossing or trending firmly above Slow EMA 26 (Golden Cross pattern).<br />
                          • <strong className="text-[#ff3b4a]">SHORT:</strong> Fast EMA 9 must be crossing or trending below Slow EMA 26 (Death Cross pattern).
                        </p>
                      </div>
                    )}

                    {/* CPR */}
                    {selectedInfoStrategy.rules.useCPR && (
                      <div className="p-3 rounded-lg bg-[#111417] border border-[#00ff94]/30 space-y-1">
                        <div className="flex items-center justify-between text-[#00ff94] font-bold">
                          <span>3. Central Pivot Range (CPR Floor/Ceiling)</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#00ff94]/10 rounded">Key Support/Resistance</span>
                        </div>
                        <p className="text-[11px] text-[#99907f] font-sans">
                          • <strong className="text-[#00ff94]">LONG:</strong> Price action must be above Top Central (TC) Pivot level, ensuring clearance of overhead institutional resistance.<br />
                          • <strong className="text-[#ff3b4a]">SHORT:</strong> Price action must be below Bottom Central (BC) Pivot level, confirming floor failure.
                        </p>
                      </div>
                    )}

                    {/* Supertrend */}
                    {selectedInfoStrategy.rules.useSupertrend && (
                      <div className="p-3 rounded-lg bg-[#111417] border border-[#00ff94]/30 space-y-1">
                        <div className="flex items-center justify-between text-[#00ff94] font-bold">
                          <span>4. Supertrend Volatility Baseline</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#00ff94]/10 rounded">ATR {selectedInfoStrategy.rules.supertrendMultiplier || 3}x</span>
                        </div>
                        <p className="text-[11px] text-[#99907f] font-sans">
                          Directional volatility filter requiring Green baseline under price for Longs, or Red baseline above price for Shorts ({selectedInfoStrategy.rules.supertrendPeriod || 10} Period, {selectedInfoStrategy.rules.supertrendMultiplier || 3}x Multiplier).
                        </p>
                      </div>
                    )}

                    {/* ADX */}
                    {selectedInfoStrategy.rules.useADXFilter && (
                      <div className="p-3 rounded-lg bg-[#111417] border border-[#a855f7]/30 space-y-1">
                        <div className="flex items-center justify-between text-[#a855f7] font-bold">
                          <span>5. ADX Trend Strength Filter</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#a855f7]/10 rounded">ADX &gt; {selectedInfoStrategy.rules.adxThreshold || 20}</span>
                        </div>
                        <p className="text-[11px] text-[#99907f] font-sans">
                          Rejects flat, ranging sideways noise. Signals will ONLY trigger when ADX is &gt; <span className="text-[#fff8f1] font-mono">{selectedInfoStrategy.rules.adxThreshold || 20}</span> to ensure strong directional follow-through.
                        </p>
                      </div>
                    )}

                    {/* EMA Ribbon */}
                    {selectedInfoStrategy.rules.useEMARibbon && (
                      <div className="p-3 rounded-lg bg-[#111417] border border-[#fb923c]/30 space-y-1">
                        <div className="flex items-center justify-between text-[#fb923c] font-bold">
                          <span>6. 4-Stack EMA Ribbon Alignment</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#fb923c]/10 rounded">9 / 21 / 55 / 200</span>
                        </div>
                        <p className="text-[11px] text-[#99907f] font-sans">
                          Requires geometric alignment of all 4 moving averages (Bullish fan: 9 &gt; 21 &gt; 55 &gt; 200; Bearish fan: 9 &lt; 21 &lt; 55 &lt; 200).
                        </p>
                      </div>
                    )}

                    {/* SMC FVG */}
                    {selectedInfoStrategy.rules.useSMC_FVG && (
                      <div className="p-3 rounded-lg bg-[#111417] border border-[#fb923c]/30 space-y-1">
                        <div className="flex items-center justify-between text-[#fb923c] font-bold">
                          <span>7. Smart Money Concepts (SMC) &amp; FVG</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#fb923c]/10 rounded">Liquidity Imbalance</span>
                        </div>
                        <p className="text-[11px] text-[#99907f] font-sans">
                          Detects Fair Value Gap mitigation, liquidity sweeps at key swing highs/lows, and institutional taker volume imbalance.
                        </p>
                      </div>
                    )}

                    {/* Bollinger Squeeze */}
                    {selectedInfoStrategy.rules.useBollingerSqueeze && (
                      <div className="p-3 rounded-lg bg-[#111417] border border-[#ec4899]/30 space-y-1">
                        <div className="flex items-center justify-between text-[#ec4899] font-bold">
                          <span>8. Bollinger Band Squeeze &amp; Expansion</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#ec4899]/10 rounded">Volatility Breakout</span>
                        </div>
                        <p className="text-[11px] text-[#99907f] font-sans">
                          Enters when bandwidth tightens to multi-day lows and candle closes outside upper/lower band with volume surge.
                        </p>
                      </div>
                    )}

                    {/* MACD */}
                    {selectedInfoStrategy.rules.useMACD && (
                      <div className="p-3 rounded-lg bg-[#111417] border border-[#38bdf8]/30 space-y-1">
                        <div className="flex items-center justify-between text-[#38bdf8] font-bold">
                          <span>9. MACD Histogram Divergence</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-[#38bdf8]/10 rounded">Signal Crossover</span>
                        </div>
                        <p className="text-[11px] text-[#99907f] font-sans">
                          MACD Line crossing Signal line with positive/negative expanding histogram bars confirming fresh acceleration.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Risk-to-Reward Execution Matrix */}
                <div className="p-3 bg-[#14171a] rounded-xl border border-[#272a2d] space-y-2">
                  <div className="flex items-center justify-between text-[#ffd87f] font-bold">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Execution &amp; Risk Parameters:</span>
                    </span>
                    <span className="text-[#00ff94]">
                      R:R 1 : {((selectedInfoStrategy.rules.tpAtrMultiplier || 3) / (selectedInfoStrategy.rules.slAtrMultiplier || 1.5)).toFixed(1)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="p-2 rounded bg-[#111417] border border-[#272a2d]">
                      <span className="block text-[#99907f]">Stop-Loss:</span>
                      <span className="font-bold text-[#ff3b4a]">{selectedInfoStrategy.rules.slAtrMultiplier || 1.5}x ATR</span>
                    </div>
                    <div className="p-2 rounded bg-[#111417] border border-[#272a2d]">
                      <span className="block text-[#99907f]">Take-Profit:</span>
                      <span className="font-bold text-[#00ff94]">{selectedInfoStrategy.rules.tpAtrMultiplier || 3.0}x ATR</span>
                    </div>
                    <div className="p-2 rounded bg-[#111417] border border-[#272a2d]">
                      <span className="block text-[#99907f]">Rec. Leverage:</span>
                      <span className="font-bold text-[#ffd87f]">{selectedInfoStrategy.recommendedLeverage}x</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3.5 bg-[#14171a] border-t border-[#272a2d] flex items-center justify-between">
                <button
                  onClick={() => {
                    handleToggleStrategy(selectedInfoStrategy.id);
                    setSelectedInfoStrategy(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                    toggles[selectedInfoStrategy.id] !== false
                      ? 'bg-[#ff3b4a]/20 hover:bg-[#ff3b4a]/30 text-[#ff3b4a] border border-[#ff3b4a]/40'
                      : 'bg-[#00ff94]/20 hover:bg-[#00ff94]/30 text-[#00ff94] border border-[#00ff94]/40'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    {toggles[selectedInfoStrategy.id] !== false ? 'Turn Strategy OFF' : 'Turn Strategy ON'}
                  </span>
                </button>

                <button
                  onClick={() => setSelectedInfoStrategy(null)}
                  className="px-4 py-1.5 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] font-mono text-xs font-bold transition-colors cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
