import React, { useState, useMemo } from 'react';
import {
  AssetPair,
  TickerInfo,
  AISignal,
  AutoAlertConfig,
  MarketCategory,
} from '../types';
import { ALL_COINS_METADATA } from '../data/marketData';
import {
  Bell,
  BellRing,
  X,
  Zap,
  Volume2,
  VolumeX,
  Mic,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Flame,
  Globe,
  Radio,
  Clock,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Bot,
  Cpu,
  Target,
  Search,
  Power,
  CheckSquare,
  Square,
  Filter,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { playSignalAlertSound, speakSignalAlert } from '../utils/soundEffects';

interface AutoAlertScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoAlertConfig;
  onUpdateConfig: (newConfig: Partial<AutoAlertConfig>) => void;
  tickers: Record<AssetPair, TickerInfo>;
  signals: AISignal[];
  onTriggerTestSignal: (customSymbol?: AssetPair) => void;
  onSelectAndTrade: (signal: AISignal) => void;
  lastScannedTime?: number;
  totalAssetsMonitored: number;
}

const CATEGORIES: { id: MarketCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All Markets', icon: '🌐' },
  { id: 'stocks', label: 'Stocks & Equities', icon: '📈' },
  { id: 'layer1', label: 'Layer 1s', icon: '⚡' },
  { id: 'defi', label: 'DeFi & Perps', icon: '🏛️' },
  { id: 'meme', label: 'Meme & Gainers', icon: '🔥' },
  { id: 'commodities', label: 'Gold & Metals', icon: '🏆' },
  { id: 'privacy', label: 'Privacy Coins', icon: '🛡️' },
  { id: 'ai', label: 'AI & Compute', icon: '🤖' },
  { id: 'forex', label: 'Forex Pairs', icon: '💱' },
];

const STOCK_PRESETS: { id: string; label: string; icon: string; symbols: AssetPair[] }[] = [
  {
    id: 'us_tech',
    label: 'US Tech Stocks',
    icon: '💻',
    symbols: ['NVDA/USD', 'AAPL/USD', 'TSLA/USD', 'MSFT/USD', 'AMZN/USD', 'GOOGL/USD', 'META/USD', 'QQQ/USD'],
  },
  {
    id: 'india_stocks',
    label: 'Indian Stocks & Nifty',
    icon: '🇮🇳',
    symbols: ['RELIANCE/INR', 'TCS/INR', 'HDFCBANK/INR', 'NIFTY50'],
  },
  {
    id: 'crypto_majors',
    label: 'Crypto Majors',
    icon: '⚡',
    symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'BNB/USDT', 'DOGE/USDT'],
  },
  {
    id: 'metals_gold',
    label: 'Gold & Commodities',
    icon: '🏆',
    symbols: ['XAU/USDT', 'XAG/USDT', 'COPPER/USDT', 'WTI/USDT'],
  },
];

export const AutoAlertScannerModal: React.FC<AutoAlertScannerModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  tickers,
  signals,
  onTriggerTestSignal,
  onSelectAndTrade,
  lastScannedTime = Date.now(),
  totalAssetsMonitored,
}) => {
  const [activeTab, setActiveTab] = useState<'stocks' | 'settings' | 'matrix' | 'signals'>('stocks');
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategoryTab, setStockCategoryTab] = useState<string>('all');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  if (!isOpen) return null;

  const handleRequestBrowserPush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Desktop Push Notifications are not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        onUpdateConfig({ browserNotifications: true });
        new Notification('🔔 Auto Alert System Activated!', {
          body: 'Lumina Trade will now notify you instantly when high-conviction signals are detected across selected assets.',
        });
      } else {
        onUpdateConfig({ browserNotifications: false });
      }
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
    }
  };

  const handleTestVoiceAlert = () => {
    speakSignalAlert('Alert! High confidence Buy breakout detected on Solana at 94 dollars 20 cents. Target 105.');
  };

  const handleToggleSymbol = (symbol: AssetPair) => {
    const current = config.selectedSymbols || [];
    let updated: AssetPair[];
    if (current.includes(symbol)) {
      updated = current.filter((s) => s !== symbol);
    } else {
      updated = [...current, symbol];
    }
    onUpdateConfig({
      selectedSymbols: updated,
      scanTargetMode: 'custom',
    });
  };

  const handleSelectAllSymbols = () => {
    onUpdateConfig({
      selectedSymbols: [],
      scanTargetMode: 'all',
    });
  };

  const handleApplyPreset = (symbols: AssetPair[]) => {
    onUpdateConfig({
      selectedSymbols: symbols,
      scanTargetMode: 'custom',
    });
  };

  const handleClearAllSelected = () => {
    onUpdateConfig({
      selectedSymbols: [],
      scanTargetMode: 'custom',
    });
  };

  const filteredCoins = ALL_COINS_METADATA.filter((coin) => {
    if (stockCategoryTab !== 'all') {
      if (stockCategoryTab === 'stocks' && coin.category !== 'stocks') return false;
      if (stockCategoryTab !== 'stocks' && coin.category !== stockCategoryTab) return false;
    }
    if (stockSearch.trim()) {
      const q = stockSearch.toLowerCase().trim();
      const matchSymbol = coin.symbol.toLowerCase().includes(q);
      const matchName = coin.name.toLowerCase().includes(q);
      const matchTags = coin.tags?.some((t) => t.toLowerCase().includes(q));
      return matchSymbol || matchName || matchTags;
    }
    return true;
  });

  const selectedCount = config.selectedSymbols?.length || 0;
  const currentMode = config.scanTargetMode || (selectedCount > 0 ? 'custom' : 'all');

  return (
    <div
      id="auto-alert-modal-root"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-sm font-hanken animate-in fade-in duration-200"
    >
      <div className="w-full max-w-4xl bg-[#111417] border border-[#272a2d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 md:p-5 bg-[#191c1f] border-b border-[#272a2d] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border relative ${
              config.enabled ? 'bg-[#00ff94]/15 text-[#00ff94] border-[#00ff94]/30' : 'bg-[#272a2d] text-[#99907f] border-[#373a3d]'
            }`}>
              <Zap className="w-5 h-5" />
              {config.enabled && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff94] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ff94]" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#fff8f1] tracking-tight">
                  Auto Signal Alert System
                </h2>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    config.enabled
                      ? 'bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/30'
                      : 'bg-[#ff3b4a]/15 text-[#ff3b4a] border border-[#ff3b4a]/30'
                  }`}
                >
                  {config.enabled ? '● SCANNER ON' : '○ SCANNER OFF'}
                </span>
              </div>
              <p className="text-xs text-[#99907f]">
                {currentMode === 'custom'
                  ? `Scanner restricted to ONLY ${selectedCount} custom selected stocks/assets.`
                  : currentMode === 'current_only'
                    ? 'Scanner restricted to ONLY the active chart asset.'
                    : `Monitoring all ${ALL_COINS_METADATA.length} CoinDCX pairs, US stocks & commodities.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerTestSignal(config.selectedSymbols?.[0])}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#f6be16]/15 hover:bg-[#f6be16]/25 text-[#f6be16] border border-[#f6be16]/40 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Test immediate sound, voice & popup alert"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test Signal Alert</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Master ON/OFF Switch & Target Mode Strip */}
        <div className="p-3.5 sm:p-4 bg-[#14171a] border-b border-[#272a2d] space-y-3">
          {/* Master ON/OFF Banner */}
          <div className="bg-[#191c1f] p-3.5 rounded-xl border border-[#272a2d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                id="auto-alert-master-power-toggle"
                onClick={() => onUpdateConfig({ enabled: !config.enabled })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                  config.enabled ? 'bg-[#00ff94]' : 'bg-[#272a2d]'
                }`}
                title="Toggle Signal Detection ON or OFF"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-[#111417] transition-transform shadow-md ${
                    config.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-[#fff8f1]">
                    {config.enabled ? 'Signal Detection: ON (चालू है)' : 'Signal Detection: OFF (बंद है)'}
                  </span>
                  <span
                    className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      config.enabled
                        ? 'bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/30'
                        : 'bg-[#ff3b4a]/15 text-[#ff3b4a] border border-[#ff3b4a]/30'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${config.enabled ? 'bg-[#00ff94] animate-pulse' : 'bg-[#ff3b4a]'}`} />
                    {config.enabled ? 'ACTIVE' : 'MUTED'}
                  </span>
                </div>
                <p className="text-[11px] text-[#99907f]">
                  {config.enabled
                    ? 'Live technical breakout & momentum scanner is actively searching for high-conviction trades.'
                    : 'Signal detection is paused. You will not receive any sound or popup alerts until turned back ON.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onUpdateConfig({ enabled: !config.enabled })}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto ${
                config.enabled
                  ? 'bg-[#ff3b4a]/15 hover:bg-[#ff3b4a]/25 text-[#ff3b4a] border border-[#ff3b4a]/30'
                  : 'bg-[#00ff94]/20 hover:bg-[#00ff94]/30 text-[#00ff94] border border-[#00ff94]/40'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{config.enabled ? 'Turn OFF' : 'Turn ON'}</span>
            </button>
          </div>

          {/* 3 Target Modes: All vs Custom Selected vs Current Chart */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => onUpdateConfig({ scanTargetMode: 'all' })}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                currentMode === 'all'
                  ? 'bg-[#00ff94]/10 border-[#00ff94] text-[#fff8f1] shadow-[0_0_12px_rgba(0,255,148,0.12)]'
                  : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:border-[#373a3d]'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold flex items-center gap-1 text-[#fff8f1]">
                  🌐 All Assets ({ALL_COINS_METADATA.length})
                </span>
                {currentMode === 'all' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff94]" />
                )}
              </div>
              <p className="text-[10px] text-[#99907f] leading-tight">
                Scan all cryptos, US stocks, and metals.
              </p>
            </button>

            <button
              onClick={() => {
                onUpdateConfig({ scanTargetMode: 'custom' });
                setActiveTab('stocks');
              }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                currentMode === 'custom'
                  ? 'bg-[#00ff94]/10 border-[#00ff94] text-[#fff8f1] shadow-[0_0_12px_rgba(0,255,148,0.12)]'
                  : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:border-[#373a3d]'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold flex items-center gap-1 text-[#fff8f1]">
                  🎯 Custom Stocks Only
                </span>
                {currentMode === 'custom' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff94]" />
                )}
              </div>
              <p className="text-[10px] text-[#99907f] leading-tight">
                {selectedCount > 0
                  ? `Signals ONLY for ${selectedCount} chosen stocks.`
                  : 'Pick custom stocks you want signals for.'}
              </p>
            </button>

            <button
              onClick={() => onUpdateConfig({ scanTargetMode: 'current_only' })}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                currentMode === 'current_only'
                  ? 'bg-[#00ff94]/10 border-[#00ff94] text-[#fff8f1] shadow-[0_0_12px_rgba(0,255,148,0.12)]'
                  : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:border-[#373a3d]'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-bold flex items-center gap-1 text-[#fff8f1]">
                  📌 Active Chart Only
                </span>
                {currentMode === 'current_only' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff94]" />
                )}
              </div>
              <p className="text-[10px] text-[#99907f] leading-tight">
                Only alert for current open terminal pair.
              </p>
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-[#14171a] border-b border-[#272a2d] text-xs font-mono overflow-x-auto">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'stocks'
                ? 'bg-[#272a2d] text-[#fff8f1] border border-[#00ff94]/40 text-[#00ff94]'
                : 'text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-[#00ff94]" />
            <span>Select Stocks & Assets</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              currentMode === 'custom' && selectedCount > 0
                ? 'bg-[#00ff94]/20 text-[#00ff94]'
                : 'bg-[#272a2d] text-[#99907f]'
            }`}>
              {currentMode === 'custom' ? `${selectedCount} Selected` : currentMode === 'current_only' ? 'Active Chart' : 'All'}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-[#272a2d] text-[#fff8f1] border border-[#4d4638]/40'
                : 'text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#f6be16]" />
            Alert Delivery & Sound
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-[#272a2d] text-[#fff8f1] border border-[#4d4638]/40'
                : 'text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-[#38bdf8]" />
            Live Market Radar ({totalAssetsMonitored})
          </button>
          <button
            onClick={() => setActiveTab('signals')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'signals'
                ? 'bg-[#272a2d] text-[#fff8f1] border border-[#4d4638]/40'
                : 'text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#a855f7]" />
            Live Signals ({signals.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* TAB 1: CUSTOM STOCKS & ASSET SELECTOR */}
          {activeTab === 'stocks' && (
            <div className="space-y-4">
              {/* Presets & Quick Actions */}
              <div className="bg-[#191c1f] p-3.5 rounded-xl border border-[#272a2d] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#fff8f1] flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#00ff94]" />
                    Quick Selection Presets (त्वरित चयन)
                  </span>
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <button
                      onClick={handleSelectAllSymbols}
                      className="text-[#00ff94] hover:underline cursor-pointer"
                    >
                      Select All 32+
                    </button>
                    <span className="text-[#373a3d]">|</span>
                    <button
                      onClick={handleClearAllSelected}
                      className="text-[#ff3b4a] hover:underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  {STOCK_PRESETS.map((preset) => {
                    const isAllSelected = preset.symbols.every((s) =>
                      config.selectedSymbols?.includes(s)
                    );
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset.symbols)}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isAllSelected && currentMode === 'custom'
                            ? 'bg-[#00ff94]/15 border-[#00ff94] text-[#00ff94]'
                            : 'bg-[#14171a] border-[#272a2d] text-[#e1e2e7] hover:border-[#373a3d]'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{preset.icon}</span>
                          <span className="truncate">{preset.label}</span>
                        </span>
                        {isAllSelected && currentMode === 'custom' && (
                          <Check className="w-3.5 h-3.5 text-[#00ff94] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search and Category Filter Strip */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-[#99907f] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                      placeholder="Search stock, coin or company (e.g. NVDA, Tesla, Reliance, BTC, Gold)..."
                      className="w-full bg-[#191c1f] border border-[#272a2d] focus:border-[#00ff94] rounded-xl pl-9 pr-8 py-2 text-xs text-[#fff8f1] placeholder-[#99907f] focus:outline-hidden font-mono"
                    />
                    {stockSearch && (
                      <button
                        onClick={() => setStockSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#99907f] hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setStockCategoryTab(cat.id)}
                      className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                        stockCategoryTab === cat.id
                          ? 'bg-[#00ff94]/20 border-[#00ff94] text-[#00ff94] font-bold'
                          : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Header: How many selected */}
              <div className="flex items-center justify-between text-xs font-mono px-1">
                <div className="text-[#99907f] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#00ff94]" />
                  <span>Showing {filteredCoins.length} assets</span>
                  {currentMode === 'custom' && (
                    <span className="text-[#00ff94] font-bold">
                      ({selectedCount} custom stocks selected for alerts)
                    </span>
                  )}
                </div>
                {currentMode === 'custom' && selectedCount > 0 && (
                  <span className="text-[#00ff94] text-[11px]">
                    ✓ Scanner locked to selected stocks only
                  </span>
                )}
              </div>

              {/* Grid of Selectable Stock & Asset Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredCoins.map((coin) => {
                  const isSelected = config.selectedSymbols?.includes(coin.symbol);
                  const isMonitoredInCurrentMode =
                    currentMode === 'all'
                      ? true
                      : currentMode === 'custom'
                        ? isSelected
                        : false;
                  const t = tickers[coin.symbol];
                  const price = t?.price ?? 100;
                  const change = t?.change24h ?? 0;
                  const isPositive = change >= 0;

                  return (
                    <div
                      key={coin.symbol}
                      onClick={() => handleToggleSymbol(coin.symbol)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                        isSelected && currentMode === 'custom'
                          ? 'bg-[#00ff94]/10 border-[#00ff94] shadow-[0_0_12px_rgba(0,255,148,0.15)]'
                          : currentMode === 'all'
                            ? 'bg-[#191c1f] border-[#272a2d] hover:border-[#373a3d]'
                            : 'bg-[#14171a] border-[#272a2d] opacity-70 hover:opacity-100 hover:border-[#373a3d]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 shrink-0">
                            {currentMode === 'custom' ? (
                              isSelected ? (
                                <CheckSquare className="w-4 h-4 text-[#00ff94]" />
                              ) : (
                                <Square className="w-4 h-4 text-[#787b86]" />
                              )
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-[#00ff94]" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-[#fff8f1]">
                                {coin.symbol}
                              </span>
                              {coin.isHot && (
                                <Flame className="w-3 h-3 text-[#f6be16]" />
                              )}
                            </div>
                            <div className="text-[10px] text-[#99907f] truncate max-w-[130px]">
                              {coin.name}
                            </div>
                          </div>
                        </div>

                        <div className="text-right font-mono shrink-0">
                          <div className="text-xs font-bold text-[#fff8f1]">
                            {coin.quoteAsset === 'INR' ? '₹' : '$'}
                            {price < 1 ? price.toFixed(4) : price.toFixed(2)}
                          </div>
                          <div
                            className={`text-[10px] font-bold ${
                              isPositive ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {change.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-[#272a2d]/60 flex items-center justify-between text-[10px] font-mono">
                        <span className="uppercase px-1.5 py-0.2 rounded bg-[#272a2d] text-[#99907f]">
                          {coin.category}
                        </span>
                        {currentMode === 'custom' ? (
                          <span
                            className={`font-bold ${
                              isSelected ? 'text-[#00ff94]' : 'text-[#787b86]'
                            }`}
                          >
                            {isSelected ? '● SELECTED' : '○ CLICK TO SELECT'}
                          </span>
                        ) : (
                          <span className="text-[#00ff94]/80">● MONITORED (ALL)</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Guidance Note */}
              <div className="bg-[#14171a] p-3 rounded-xl border border-[#272a2d] flex items-center justify-between text-xs font-mono">
                <div className="text-[#99907f] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00ff94]" />
                  <span>
                    {currentMode === 'custom'
                      ? `सिग्नल सिर्फ इन ${selectedCount} चुने हुए स्टॉक्स/क्रिप्टो के लिए ही आएंगे।`
                      : 'सिग्नल सभी 32+ मार्केट्स के लिए जनरेट होंगे।'}
                  </span>
                </div>
                {currentMode === 'custom' && selectedCount > 0 && (
                  <button
                    onClick={() => onTriggerTestSignal(config.selectedSymbols?.[0])}
                    className="px-3 py-1 bg-[#f6be16]/20 hover:bg-[#f6be16]/30 text-[#f6be16] border border-[#f6be16]/40 rounded-lg text-xs font-mono font-bold cursor-pointer"
                  >
                    Test on {config.selectedSymbols?.[0]}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SETTINGS & DELIVERY */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Master Alert Switch */}
              <div className="bg-[#191c1f] p-4 rounded-2xl border border-[#272a2d] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      config.enabled ? 'bg-[#00ff94]/20 text-[#00ff94]' : 'bg-[#272a2d] text-[#99907f]'
                    }`}
                  >
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#fff8f1] text-sm">
                      Automated Multi-Asset Scanner
                    </h3>
                    <p className="text-xs text-[#99907f]">
                      Scans price momentum, RSI divergences, and order flow every {config.scanIntervalSeconds}s.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => onUpdateConfig({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-[#272a2d] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00ff94]" />
                </label>
              </div>

              {/* Autonomous Auto Entry & Exit Execution Card (Automatic Trading by Rules) */}
              <div
                id="auto-entry-exit-panel"
                className={`p-4 md:p-5 rounded-2xl border transition-all ${
                  config.autoExecutionEnabled
                    ? 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                    : 'bg-[#191c1f] border-[#272a2d]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        config.autoExecutionEnabled
                          ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : 'bg-[#272a2d] text-[#99907f]'
                      }`}
                    >
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#fff8f1] text-sm flex items-center gap-1.5">
                          <span>Autonomous Auto Entry & Exit (खुद-ब-खुद ट्रेड)</span>
                        </h3>
                        {config.autoExecutionEnabled ? (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            ACTIVE • AUTO EXECUTING
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#272a2d] text-[#99907f]">
                            DISABLED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#d0c5b3] mt-1 leading-relaxed">
                        जब भी AI सिग्नल जनरेट होगा, सिस्टम <strong>नियमों (Rules) के अनुसार अपने आप तुरंत Entry</strong> लेगा, और <strong>Take Profit (TP1) या Stop Loss (SL) हिट होने पर अपने आप Exit</strong> कर देगा।
                      </p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      id="auto-execution-toggle-input"
                      type="checkbox"
                      checked={!!config.autoExecutionEnabled}
                      onChange={(e) =>
                        onUpdateConfig({
                          autoExecutionEnabled: e.target.checked,
                          autoExecutionRiskPercent: config.autoExecutionRiskPercent || 2.5,
                          maxConcurrentAutoPositions: config.maxConcurrentAutoPositions || 3,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-[#272a2d] peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-400" />
                  </label>
                </div>

                {/* Sub-parameters for Auto-Execution */}
                {config.autoExecutionEnabled && (
                  <div className="mt-4 pt-4 border-t border-[#272a2d]/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#99907f]">Auto Entry Position Size (Risk %)</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {config.autoExecutionRiskPercent || 2.5}% of Balance
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[1, 2.5, 5, 10].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => onUpdateConfig({ autoExecutionRiskPercent: val })}
                            className={`flex-1 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                              (config.autoExecutionRiskPercent || 2.5) === val
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                                : 'bg-[#14171a] text-[#99907f] hover:text-[#fff8f1] border border-[#272a2d]'
                            }`}
                          >
                            {val}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#99907f]">Max Concurrent Positions (Safety Cap)</span>
                        <span className="font-mono font-bold text-[#f6be16]">
                          {config.maxConcurrentAutoPositions || 3} Max Trades
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 5].map((cap) => (
                          <button
                            key={cap}
                            type="button"
                            onClick={() => onUpdateConfig({ maxConcurrentAutoPositions: cap })}
                            className={`flex-1 py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                              (config.maxConcurrentAutoPositions || 3) === cap
                                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                                : 'bg-[#14171a] text-[#99907f] hover:text-[#fff8f1] border border-[#272a2d]'
                            }`}
                          >
                            {cap} Max
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 bg-[#14171a] p-2.5 rounded-xl border border-[#272a2d] text-[11px] text-[#99907f] flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        <span>Rules: Min {config.minConfidence}% Conviction • Auto TP1 Limit + SL Safety Order Included</span>
                      </span>
                      <span className="text-[10px] text-[#ffd87f] font-mono hidden sm:inline">
                        Auto Exit on Target/Stop
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-Channel Alert Delivery Methods */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-[#99907f] font-bold">
                  Notification Delivery Channels
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Sound Chimes */}
                  <div className="bg-[#191c1f] p-4 rounded-xl border border-[#272a2d] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#f6be16]/10 text-[#f6be16]">
                        {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Audio Chime Alert</div>
                        <div className="text-[11px] text-[#99907f]">Plays harmonic chime on new signal</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => playSignalAlertSound('LONG')}
                        className="px-2 py-1 bg-[#272a2d] hover:bg-[#373a3d] text-[10px] font-mono text-[#fff8f1] rounded cursor-pointer"
                        title="Test Sound"
                      >
                        Play
                      </button>
                      <input
                        type="checkbox"
                        checked={config.soundEnabled}
                        onChange={(e) => onUpdateConfig({ soundEnabled: e.target.checked })}
                        className="w-4 h-4 accent-[#00ff94] rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Voice AI Spoken Announcement */}
                  <div className="bg-[#191c1f] p-4 rounded-xl border border-[#272a2d] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#00ff94]/10 text-[#00ff94]">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">AI Voice Announcement</div>
                        <div className="text-[11px] text-[#99907f]">Speaks asset, price, and target</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleTestVoiceAlert}
                        className="px-2 py-1 bg-[#272a2d] hover:bg-[#373a3d] text-[10px] font-mono text-[#fff8f1] rounded cursor-pointer"
                        title="Test Voice"
                      >
                        Test Voice
                      </button>
                      <input
                        type="checkbox"
                        checked={config.voiceEnabled}
                        onChange={(e) => onUpdateConfig({ voiceEnabled: e.target.checked })}
                        className="w-4 h-4 accent-[#00ff94] rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Floating Actionable Popup Banner */}
                  <div className="bg-[#191c1f] p-4 rounded-xl border border-[#272a2d] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#38bdf8]/10 text-[#38bdf8]">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Instant Floating Banner</div>
                        <div className="text-[11px] text-[#99907f]">Actionable popup with 1-click trade</div>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={config.popupAlerts}
                      onChange={(e) => onUpdateConfig({ popupAlerts: e.target.checked })}
                      className="w-4 h-4 accent-[#00ff94] rounded cursor-pointer"
                    />
                  </div>

                  {/* Browser Native Push Notification */}
                  <div className="bg-[#191c1f] p-4 rounded-xl border border-[#272a2d] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#f6be16]/10 text-[#f6be16]">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Desktop Push Notifications</div>
                        <div className="text-[11px] text-[#99907f]">
                          {browserPermission === 'granted' ? 'Permission granted' : 'Alerts when tab is in background'}
                        </div>
                      </div>
                    </div>

                    {browserPermission !== 'granted' ? (
                      <button
                        onClick={handleRequestBrowserPush}
                        className="px-2.5 py-1 bg-[#f6be16]/20 hover:bg-[#f6be16]/30 text-[#f6be16] border border-[#f6be16]/40 text-[10px] font-mono font-bold rounded cursor-pointer"
                      >
                        Enable Push
                      </button>
                    ) : (
                      <input
                        type="checkbox"
                        checked={config.browserNotifications}
                        onChange={(e) => onUpdateConfig({ browserNotifications: e.target.checked })}
                        className="w-4 h-4 accent-[#00ff94] rounded cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Threshold & Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Confidence Threshold */}
                <div className="bg-[#191c1f] p-4 rounded-xl border border-[#272a2d] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#fff8f1]">
                      Minimum AI Confidence Threshold
                    </span>
                    <span className="text-xs font-mono font-bold text-[#00ff94] bg-[#00ff94]/15 px-2 py-0.5 rounded border border-[#00ff94]/30">
                      ≥ {config.minConfidence}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min={70}
                    max={95}
                    step={1}
                    value={config.minConfidence}
                    onChange={(e) => onUpdateConfig({ minConfidence: Number(e.target.value) })}
                    className="w-full h-1.5 bg-[#272a2d] rounded-lg appearance-none cursor-pointer accent-[#00ff94]"
                  />

                  <div className="flex justify-between text-[10px] font-mono text-[#99907f]">
                    <span>70% (More frequent)</span>
                    <span>85% (Balanced)</span>
                    <span>95% (Highest Conviction)</span>
                  </div>
                </div>

                {/* Scan Interval */}
                <div className="bg-[#191c1f] p-4 rounded-xl border border-[#272a2d] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#fff8f1]">
                      Background Scan Frequency
                    </span>
                    <span className="text-xs font-mono font-bold text-[#f6be16] bg-[#f6be16]/15 px-2 py-0.5 rounded border border-[#f6be16]/30">
                      Every {config.scanIntervalSeconds}s
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs font-mono">
                    {[10, 15, 30, 60].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => onUpdateConfig({ scanIntervalSeconds: sec })}
                        className={`py-1.5 rounded-lg font-bold border transition-colors cursor-pointer text-center ${
                          config.scanIntervalSeconds === sec
                            ? 'bg-[#f6be16]/20 border-[#f6be16] text-[#f6be16]'
                            : 'bg-[#14171a] border-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Asset Filter Selector */}
              <div className="bg-[#191c1f] p-4 rounded-xl border border-[#272a2d] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#fff8f1]">
                    Asset Category Coverage
                  </span>
                  <button
                    onClick={handleSelectAllSymbols}
                    className="text-[11px] font-mono text-[#00ff94] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Monitoring All Assets ({ALL_COINS_METADATA.length})
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => onUpdateConfig({ categoryFilter: cat.id })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                        config.categoryFilter === cat.id
                          ? 'bg-[#00ff94]/20 border-[#00ff94]/50 text-[#00ff94]'
                          : 'bg-[#14171a] border-[#272a2d] text-[#99907f] hover:text-[#e1e2e7]'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Live Radar Matrix View */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#99907f] font-mono">
                <span>All {ALL_COINS_METADATA.length} live pairs monitored in real-time</span>
                <span className="flex items-center gap-1 text-[#00ff94]">
                  <span className="w-2 h-2 rounded-full bg-[#00ff94] animate-pulse" />
                  Live Syncing
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {ALL_COINS_METADATA.map((coin) => {
                  const t = tickers[coin.symbol];
                  const price = t?.price ?? 100;
                  const change = t?.change24h ?? 0;
                  const isPositive = change >= 0;
                  const matchedSignal = signals.find((s) => s.symbol === coin.symbol);

                  return (
                    <div
                      key={coin.symbol}
                      className={`p-3 rounded-xl border transition-all ${
                        matchedSignal
                          ? 'bg-[#191c1f] border-[#00ff94]/50 shadow-sm'
                          : 'bg-[#14171a] border-[#272a2d] hover:border-[#373a3d]'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#fff8f1]">
                              {coin.symbol}
                            </span>
                            {coin.isHot && (
                              <Flame className="w-3 h-3 text-[#f6be16]" />
                            )}
                          </div>
                          <div className="text-[10px] text-[#99907f] truncate max-w-[120px]">
                            {coin.name}
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <div className="text-xs font-bold text-[#fff8f1]">
                            ${price < 1 ? price.toFixed(4) : price.toFixed(2)}
                          </div>
                          <div
                            className={`text-[10px] font-bold ${
                              isPositive ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {change.toFixed(2)}%
                          </div>
                        </div>
                      </div>

                      {/* Active Signal Status */}
                      {matchedSignal ? (
                        <div className="mt-2 pt-2 border-t border-[#272a2d] flex items-center justify-between">
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                              matchedSignal.side === 'LONG'
                                ? 'bg-[#00ff94]/15 text-[#00ff94]'
                                : 'bg-[#ff3b4a]/15 text-[#ff3b4a]'
                            }`}
                          >
                            <Zap className="w-2.5 h-2.5" />
                            {matchedSignal.side} {matchedSignal.confidence}%
                          </span>

                          <button
                            onClick={() => {
                              onSelectAndTrade(matchedSignal);
                              onClose();
                            }}
                            className="text-[10px] font-mono text-[#00ff94] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            Trade <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 pt-2 border-t border-[#272a2d]/50 flex items-center justify-between text-[10px] font-mono text-[#99907f]">
                          <span>RSI 54.2 • Neutral</span>
                          <span className="text-[#00ff94]/70">Scanning...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Signals Feed View */}
          {activeTab === 'signals' && (
            <div className="space-y-3">
              {signals.length === 0 ? (
                <div className="text-center py-12 text-[#99907f] space-y-2">
                  <Sparkles className="w-8 h-8 mx-auto opacity-30 text-[#00ff94]" />
                  <p className="text-xs font-mono">No active signals at this moment</p>
                  <button
                    onClick={() => onTriggerTestSignal()}
                    className="px-3 py-1.5 bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/30 rounded-lg text-xs font-mono font-bold cursor-pointer"
                  >
                    Generate Test Signal
                  </button>
                </div>
              ) : (
                signals.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-4 bg-[#191c1f] rounded-xl border border-[#272a2d] hover:border-[#00ff94]/40 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#fff8f1]">
                          {sig.symbol}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                            sig.side === 'LONG'
                              ? 'bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/30'
                              : 'bg-[#ff3b4a]/15 text-[#ff3b4a] border border-[#ff3b4a]/30'
                          }`}
                        >
                          {sig.side === 'LONG' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {sig.side}
                        </span>
                        <span className="text-xs font-mono text-[#f6be16]">
                          {sig.confidence}% Conviction
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          onSelectAndTrade(sig);
                          onClose();
                        }}
                        className="px-3 py-1 bg-[#00ff94] hover:bg-[#00e685] text-[#111417] text-xs font-bold font-mono rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        <span>Trade Chart</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-[#99907f]">{sig.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-[#e1e2e7]">
                      <span>Entry: <strong className="text-[#fff8f1]">${sig.entryPrice}</strong></span>
                      <span>Target 1: <strong className="text-[#00ff94]">${sig.target1}</strong></span>
                      <span>Stop Loss: <strong className="text-[#ff3b4a]">${sig.stopLoss}</strong></span>
                      <span>R:R: <strong>{sig.riskReward}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#191c1f] border-t border-[#272a2d] flex items-center justify-between">
          <div className="text-xs font-mono text-[#99907f] flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${config.enabled ? 'bg-[#00ff94] animate-pulse' : 'bg-[#ff3b4a]'}`} />
            <span>
              {config.enabled
                ? currentMode === 'custom'
                  ? `Scanning ONLY ${selectedCount} selected custom stocks`
                  : currentMode === 'current_only'
                    ? 'Scanning active terminal chart only'
                    : `Scanning all ${ALL_COINS_METADATA.length} CoinDCX & global markets`
                : 'Signal detection is paused (OFF)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onTriggerTestSignal(config.selectedSymbols?.[0])}
              className="px-4 py-2 bg-[#f6be16]/20 hover:bg-[#f6be16]/30 text-[#f6be16] border border-[#f6be16]/40 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate Alert</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#00ff94] hover:bg-[#00e685] text-[#111417] rounded-xl text-xs font-bold font-mono transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
