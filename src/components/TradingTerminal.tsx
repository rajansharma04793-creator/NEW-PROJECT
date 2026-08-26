import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AssetPair,
  TickerInfo,
  Candle,
  OrderBookItem,
  MarketTrade,
  Position,
  Order,
  AISignal,
  AppNotification,
  PriceAlert,
  ChartMainViewMode,
  ChartLayoutPattern,
  OrderFlowSwitchboardConfig,
  MarketCategory,
} from '../types';
import { ALL_COINS_METADATA, INITIAL_TICKERS, searchCoins } from '../data/marketData';
import { MarketSearchModal } from './MarketSearchModal';
import { CandleChart } from './CandleChart';
import { FootprintChart } from './FootprintChart';
import { LiquidityHeatmap } from './LiquidityHeatmap';
import { MarketProfileTPO } from './MarketProfileTPO';
import { DOMLadder } from './DOMLadder';
import { MultiChartGrid } from './MultiChartGrid';
import { OrderFlowSwitchboard } from './OrderFlowSwitchboard';
import { OrderBook } from './OrderBook';
import { OrderPanel } from './OrderPanel';
import { PositionsTable } from './PositionsTable';
import { ArbitrageSpreadModal } from './ArbitrageSpreadModal';
import { RiskCalculatorModal } from './RiskCalculatorModal';
import { StrategyBacktesterModal } from './StrategyBacktesterModal';
import { EconomicCalendarModal } from './EconomicCalendarModal';
import { MTFAnalysisModal } from './MTFAnalysisModal';
import { WebhookAlertsModal } from './WebhookAlertsModal';
import { WhaleTrackerModal } from './WhaleTrackerModal';
import { LiquidationHeatmapModal } from './LiquidationHeatmapModal';
import { AlgorithmicSlicerModal } from './AlgorithmicSlicerModal';
import { TradeJournalPnLModal } from './TradeJournalPnLModal';
import { HotkeysVoiceModal } from './HotkeysVoiceModal';
import { BarReplaySimulatorModal } from './BarReplaySimulatorModal';
import { AutoStrategyBotModal } from './AutoStrategyBotModal';
import { OrderFlowDeltaModal } from './OrderFlowDeltaModal';
import { StrategyHubModal } from './StrategyHubModal';
import { StrategyManagerModal } from './StrategyManagerModal';
import { MobileToolsDrawer } from './MobileToolsDrawer';
import { RealTimePriceBar } from './RealTimePriceBar';
import {
  Activity,
  ChevronDown,
  BrainCircuit,
  Wallet,
  Bell,
  BellRing,
  ArrowLeft,
  Sparkles,
  RefreshCw,
  Sliders,
  SlidersHorizontal,
  TrendingUp,
  BarChart2,
  Flame,
  Compass,
  Zap,
  LayoutGrid,
  Monitor,
  Smartphone,
  Search,
  Star,
  ExternalLink,
  Layers,
  Cpu,
  Coins,
  Gem,
  Check,
  BookOpen,
  ShoppingBag,
  ListOrdered,
  Calculator,
  FlaskConical,
  Calendar,
  Send,
  Scale,
  Fish,
  Keyboard,
  Volume2,
  Share2,
  History,
  Target,
} from 'lucide-react';

interface TradingTerminalProps {
  currentPair: AssetPair;
  tickers: Record<AssetPair, TickerInfo>;
  candles: Candle[];
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  onSelectPair: (pair: AssetPair) => void;
  bids: OrderBookItem[];
  asks: OrderBookItem[];
  recentTrades: MarketTrade[];
  lastTradeSide: 'buy' | 'sell';
  positions: Position[];
  openOrders: Order[];
  orderHistory: Order[];
  aiSignals: AISignal[];
  activeSignal?: AISignal | null;
  balance: number;
  alerts?: PriceAlert[];
  onOpenAlertsModal?: (prefillSymbol?: AssetPair, prefillPrice?: number) => void;
  onOpenAutoAlertsModal?: () => void;
  autoAlertEnabled?: boolean;
  onPlaceOrder: (order: {
    symbol: AssetPair;
    type: 'limit' | 'market' | 'stop-limit' | 'ai-smart';
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    leverage: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => void;
  onClosePosition: (id: string) => void;
  onCancelOrder: (id: string) => void;
  onExecuteSignal?: (signal: AISignal) => void;
  onOpenCopilot: () => void;
  onOpenNotifications: () => void;
  onOpenPortfolio: () => void;
  onReturnToHero: () => void;
  unreadNotifications: number;
  coindcxLatency?: number;
  isCoinDCXLive?: boolean;
  onResetCoinDCXPrices?: () => void;
  isResettingPrices?: boolean;
  onLoadMoreHistoricalCandles?: () => void;
  onOpenInstallModal?: () => void;
  currencyMode?: 'USDT' | 'INR';
  onToggleCurrencyMode?: () => void;
}

export const TradingTerminal: React.FC<TradingTerminalProps> = ({
  currentPair,
  tickers,
  candles,
  timeframe,
  onTimeframeChange,
  onSelectPair,
  bids,
  asks,
  recentTrades,
  lastTradeSide,
  positions,
  openOrders,
  orderHistory,
  aiSignals,
  activeSignal,
  balance,
  alerts = [],
  onOpenAlertsModal,
  onOpenAutoAlertsModal,
  autoAlertEnabled = true,
  onPlaceOrder,
  onClosePosition,
  onCancelOrder,
  onExecuteSignal,
  onOpenCopilot,
  onOpenNotifications,
  onOpenPortfolio,
  onReturnToHero,
  unreadNotifications,
  coindcxLatency = 18,
  isCoinDCXLive = true,
  onResetCoinDCXPrices,
  isResettingPrices = false,
  onLoadMoreHistoricalCandles,
  onOpenInstallModal,
  currencyMode: propCurrencyMode,
  onToggleCurrencyMode: propToggleCurrencyMode,
}) => {
  const [isPairDropdownOpen, setIsPairDropdownOpen] = useState(false);
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [isArbitrageModalOpen, setIsArbitrageModalOpen] = useState(false);
  const [isRiskCalcOpen, setIsRiskCalcOpen] = useState(false);
  const [isBacktesterOpen, setIsBacktesterOpen] = useState(false);
  const [isEcoCalendarOpen, setIsEcoCalendarOpen] = useState(false);
  const [isMTFOpen, setIsMTFOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isWhaleTrackerOpen, setIsWhaleTrackerOpen] = useState(false);
  const [isLiquidationModalOpen, setIsLiquidationModalOpen] = useState(false);
  const [isAlgoSlicerOpen, setIsAlgoSlicerOpen] = useState(false);
  const [isTradeJournalOpen, setIsTradeJournalOpen] = useState(false);
  const [isHotkeysModalOpen, setIsHotkeysModalOpen] = useState(false);
  const [isBarReplayOpen, setIsBarReplayOpen] = useState(false);
  const [isAutoBotOpen, setIsAutoBotOpen] = useState(false);
  const [isOrderFlowDeltaOpen, setIsOrderFlowDeltaOpen] = useState(false);
  const [isStrategyHubOpen, setIsStrategyHubOpen] = useState(false);
  const [isStrategyManagerOpen, setIsStrategyManagerOpen] = useState(false);
  const [isMobileToolsDrawerOpen, setIsMobileToolsDrawerOpen] = useState(false);
  const [isVoiceAlertsEnabled, setIsVoiceAlertsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('coindcx_voice_alerts') === 'true';
    } catch {
      return false;
    }
  });
  const [internalCurrencyMode, setInternalCurrencyMode] = useState<'USDT' | 'INR'>('USDT');
  const currencyMode = propCurrencyMode || internalCurrencyMode;
  const toggleCurrencyMode = propToggleCurrencyMode || (() => setInternalCurrencyMode((prev) => (prev === 'USDT' ? 'INR' : 'USDT')));
  const [selectedOrderPrice, setSelectedOrderPrice] = useState<number | null>(null);
  const [pairFilter, setPairFilter] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<MarketCategory>('all');
  const [quickHighlightIndex, setQuickHighlightIndex] = useState<number>(0);
  const pairDropdownRef = useRef<HTMLDivElement>(null);
  
  // Mobile Responsiveness & Layout Mode
  const [mobileTab, setMobileTab] = useState<'chart' | 'trade' | 'orderbook' | 'positions'>('chart');
  const [layoutMode, setLayoutMode] = useState<'auto' | 'mobile' | 'desktop'>('auto');
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  const handleToggleVoiceAlerts = (enabled: boolean) => {
    setIsVoiceAlertsEnabled(enabled);
    try {
      localStorage.setItem('coindcx_voice_alerts', enabled ? 'true' : 'false');
    } catch {}
    if (enabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('AI Voice Copilot Activated.');
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleOpenToolModal = (modalId: string) => {
    switch (modalId) {
      case 'strategy_manager':
        setIsStrategyManagerOpen(true);
        break;
      case 'strategy_hub':
        setIsStrategyHubOpen(true);
        break;
      case 'bar_replay':
        setIsBarReplayOpen(true);
        break;
      case 'auto_bot':
        setIsAutoBotOpen(true);
        break;
      case 'algo_slicer':
        setIsAlgoSlicerOpen(true);
        break;
      case 'whale_tracker':
        setIsWhaleTrackerOpen(true);
        break;
      case 'liquidation_heatmap':
        setIsLiquidationModalOpen(true);
        break;
      case 'orderflow_delta':
        setIsOrderFlowDeltaOpen(true);
        break;
      case 'mtf_matrix':
        setIsMTFOpen(true);
        break;
      case 'arbitrage':
        setIsArbitrageModalOpen(true);
        break;
      case 'risk_calc':
        setIsRiskCalcOpen(true);
        break;
      case 'backtester':
        setIsBacktesterOpen(true);
        break;
      case 'trade_journal':
        setIsTradeJournalOpen(true);
        break;
      case 'eco_calendar':
        setIsEcoCalendarOpen(true);
        break;
      case 'webhooks':
        setIsWebhookModalOpen(true);
        break;
      case 'hotkeys_voice':
        setIsHotkeysModalOpen(true);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K, Shift+W, Shift+L, Shift+T, Shift+J, Shift+R, Shift+H, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when user is typing inside an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsMarketModalOpen((prev) => !prev);
      } else if (e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        setIsWhaleTrackerOpen((prev) => !prev);
      } else if (e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setIsLiquidationModalOpen((prev) => !prev);
      } else if (e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsAlgoSlicerOpen((prev) => !prev);
      } else if (e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsTradeJournalOpen((prev) => !prev);
      } else if (e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setIsRiskCalcOpen((prev) => !prev);
      } else if (e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setIsHotkeysModalOpen((prev) => !prev);
      } else if (e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setIsBarReplayOpen((prev) => !prev);
      } else if (e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsAutoBotOpen((prev) => !prev);
      } else if (e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsOrderFlowDeltaOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsMarketModalOpen(false);
        setIsArbitrageModalOpen(false);
        setIsRiskCalcOpen(false);
        setIsBacktesterOpen(false);
        setIsEcoCalendarOpen(false);
        setIsMTFOpen(false);
        setIsWebhookModalOpen(false);
        setIsWhaleTrackerOpen(false);
        setIsLiquidationModalOpen(false);
        setIsAlgoSlicerOpen(false);
        setIsTradeJournalOpen(false);
        setIsHotkeysModalOpen(false);
        setIsBarReplayOpen(false);
        setIsAutoBotOpen(false);
        setIsOrderFlowDeltaOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for pair dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isPairDropdownOpen &&
        pairDropdownRef.current &&
        !pairDropdownRef.current.contains(e.target as Node)
      ) {
        setIsPairDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPairDropdownOpen]);

  // Reset highlight index when filter or category changes
  useEffect(() => {
    setQuickHighlightIndex(0);
  }, [pairFilter, quickCategory]);

  const isMobile = layoutMode === 'mobile' || (layoutMode === 'auto' && isMobileScreen);

  // Order Flow & Chart Switchboard State
  const [activeMainView, setActiveMainView] = useState<ChartMainViewMode>('candles');
  const [layoutPattern, setLayoutPattern] = useState<ChartLayoutPattern>('single');
  const [isChartSwitchDropdownOpen, setIsChartSwitchDropdownOpen] = useState(false);
  const [switchboardConfig, setSwitchboardConfig] = useState<OrderFlowSwitchboardConfig>({
    layoutPattern: 'single',
    activeView: 'candles',
    imbalanceRatio: 3.0,
    minDeltaHighlight: 10,
    showCVD: true,
    showPOC: true,
    showValueArea: true,
    showStackedImbalances: true,
    heatmapResolution: 'med',
    showLiquidityWalls: true,
    domTickSize: 0.1,
    autoCenterDOM: true,
  });

  const handleUpdateConfig = (newCfg: Partial<OrderFlowSwitchboardConfig>) => {
    setSwitchboardConfig((prev) => ({ ...prev, ...newCfg }));
  };

  const activeTicker = tickers[currentPair] || tickers['BTC/USDT'] || INITIAL_TICKERS['BTC/USDT'];

  // Smart searched coins list for quick dropdown
  const matchedQuickCoins = useMemo(() => {
    return searchCoins(pairFilter, quickCategory, 'volume');
  }, [pairFilter, quickCategory]);

  const activeAlertsForPair = alerts.filter(
    (a) => a.symbol === currentPair && a.status === 'active'
  ).length;
  const totalActiveAlerts = alerts.filter((a) => a.status === 'active').length;

  return (
    <div
      id="obsidian-trading-terminal-root"
      className="flex flex-col h-screen w-screen bg-[#111417] text-[#e1e2e7] overflow-hidden font-hanken"
    >
      {/* 1. Top Ticker & Navigation Header Strip */}
      <header className="flex items-center justify-between px-2.5 h-12 bg-[#191c1f] border-b border-[#272a2d] select-none z-30 overflow-x-auto no-scrollbar gap-2 shrink-0">
        {/* Left: Brand & Pair Selector */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Back to Hero Button */}
          <button
            onClick={onReturnToHero}
            className="flex items-center gap-1 text-xs text-[#99907f] hover:text-[#fff8f1] px-2 py-1 rounded hover:bg-[#272a2d] transition-colors cursor-pointer"
            title="Return to Hero Showcase"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Showcase</span>
          </button>

          <div className="w-[1px] h-4 bg-[#272a2d]" />

          {/* Logo */}
          <div className="flex items-center gap-1.5 font-bold text-[#fff8f1] text-sm">
            <Activity className="w-4 h-4 text-[#f6be16]" />
            <span className="hidden sm:inline">Lumina</span>
          </div>

          {/* Asset Dropdown / Quick Market Search */}
          <div className="relative" ref={pairDropdownRef}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPairDropdownOpen(!isPairDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#272a2d] hover:bg-[#37393d] rounded-lg text-xs font-bold text-[#fff8f1] border border-[#37393d] transition-colors cursor-pointer"
                title="Select trading pair"
              >
                <span>{currentPair}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#99907f]" />
              </button>

              <button
                onClick={() => setIsMarketModalOpen(true)}
                className="hidden sm:flex items-center gap-1 px-2 py-1 bg-[#191c1f] hover:bg-[#272a2d] border border-[#272a2d] hover:border-[#f6be16]/50 rounded-lg text-xs text-[#99907f] hover:text-[#fff8f1] transition-all cursor-pointer"
                title="Search all 30+ markets (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-[#f6be16]" />
                <span className="text-[11px] font-medium">Search</span>
                <kbd className="text-[9px] px-1 py-0.2 bg-[#272a2d] text-[#d0c5b3] rounded">⌘K</kbd>
              </button>
            </div>

            {isPairDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-80 sm:w-96 bg-[#191c1f] border border-[#272a2d] rounded-xl shadow-2xl py-2 z-50 animate-fadeIn">
                {/* Search Bar inside Dropdown */}
                <div className="px-3 pb-2 border-b border-[#272a2d] flex flex-col gap-2">
                  <div className="relative flex items-center">
                    <Search className="absolute left-2.5 w-3.5 h-3.5 text-[#99907f]" />
                    <input
                      type="text"
                      placeholder="Search coins (e.g. BTC, Solana, Gold, Doge, AI)..."
                      value={pairFilter}
                      onChange={(e) => setPairFilter(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setQuickHighlightIndex((prev) =>
                            matchedQuickCoins.length ? (prev + 1) % matchedQuickCoins.length : 0
                          );
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setQuickHighlightIndex((prev) =>
                            matchedQuickCoins.length
                              ? (prev - 1 + matchedQuickCoins.length) % matchedQuickCoins.length
                              : 0
                          );
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (matchedQuickCoins.length > 0 && matchedQuickCoins[quickHighlightIndex]) {
                            onSelectPair(matchedQuickCoins[quickHighlightIndex].symbol);
                            setIsPairDropdownOpen(false);
                            setPairFilter('');
                          } else if (pairFilter.trim()) {
                            const raw = pairFilter.trim().toUpperCase();
                            const customSym = raw.includes('USDT')
                              ? (raw as AssetPair)
                              : (`${raw}/USDT` as AssetPair);
                            onSelectPair(customSym);
                            setIsPairDropdownOpen(false);
                            setPairFilter('');
                          }
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setIsPairDropdownOpen(false);
                        }
                      }}
                      className="w-full bg-[#111417] text-xs pl-8 pr-7 py-1.5 rounded-lg text-[#fff8f1] border border-[#272a2d] focus:border-[#f6be16] focus:outline-none"
                      autoFocus
                    />
                    {pairFilter && (
                      <button
                        onClick={() => setPairFilter('')}
                        className="absolute right-2 text-[#99907f] hover:text-[#fff8f1] text-xs p-0.5"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Category Quick Chips */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[11px]">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'hot', label: '🔥 Hot' },
                      { id: 'layer1', label: '⚡ L1' },
                      { id: 'ai', label: '🤖 AI' },
                      { id: 'defi', label: '💎 DeFi' },
                      { id: 'meme', label: '🐶 Memes' },
                      { id: 'commodities', label: '🥇 Gold' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setQuickCategory(cat.id as MarketCategory)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 transition-colors cursor-pointer ${
                          quickCategory === cat.id
                            ? 'bg-[#f6be16] text-[#111417]'
                            : 'bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coin Results List */}
                <div className="max-h-72 overflow-y-auto divide-y divide-[#272a2d]/40">
                  {matchedQuickCoins.length > 0 ? (
                    matchedQuickCoins.map((coin, index) => {
                      const t = tickers[coin.symbol] || INITIAL_TICKERS[coin.symbol] || {
                        price: 10,
                        change24h: 0,
                        precision: coin.precision,
                      };
                      const isCurrent = coin.symbol === currentPair;
                      const isHighlighted = quickHighlightIndex === index;

                      return (
                        <div
                          key={coin.symbol}
                          onClick={() => {
                            onSelectPair(coin.symbol);
                            setIsPairDropdownOpen(false);
                            setPairFilter('');
                          }}
                          onMouseEnter={() => setQuickHighlightIndex(index)}
                          className={`flex items-center justify-between px-3 py-2 text-xs font-mono cursor-pointer transition-colors ${
                            isHighlighted
                              ? 'bg-[#272a2d] text-[#fff8f1] ring-1 ring-[#f6be16]/30'
                              : isCurrent
                              ? 'bg-[#272a2d]/70 text-[#f6be16]'
                              : 'text-[#e1e2e7] hover:bg-[#272a2d]/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#272a2d] flex items-center justify-center text-[10px] font-bold text-[#fff8f1] border border-[#37393d]">
                              {coin.baseAsset.slice(0, 3)}
                            </div>
                            <div>
                              <div className="font-bold flex items-center gap-1.5 text-xs text-[#fff8f1]">
                                <span>{coin.symbol}</span>
                                {isCurrent && (
                                  <span className="text-[9px] px-1 bg-[#00ff94]/20 text-[#00ff94] rounded">
                                    Active
                                  </span>
                                )}
                                {coin.isHot && (
                                  <span className="text-[9px] px-1 bg-[#ff8400]/20 text-[#ff8400] rounded">
                                    HOT
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-[#99907f]">{coin.name}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-[#fff8f1]">
                              ${t.price.toFixed(coin.precision)}
                            </div>
                            <span
                              className={`text-[10px] font-bold ${
                                t.change24h >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                              }`}
                            >
                              {t.change24h >= 0 ? `+${t.change24h.toFixed(2)}%` : `${t.change24h.toFixed(2)}%`}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 px-3 text-center">
                      <p className="text-xs font-bold text-[#fff8f1] mb-1">No default coin matches "{pairFilter}"</p>
                      <button
                        onClick={() => {
                          const customSym = pairFilter.toUpperCase().includes('USDT')
                            ? (pairFilter.toUpperCase().trim() as AssetPair)
                            : (`${pairFilter.toUpperCase().trim()}/USDT` as AssetPair);
                          onSelectPair(customSym);
                          setIsPairDropdownOpen(false);
                          setPairFilter('');
                        }}
                        className="mt-2 px-3 py-1 bg-[#f6be16] text-[#111417] text-[11px] font-bold rounded cursor-pointer"
                      >
                        Trade {pairFilter.toUpperCase()}/USDT Market
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Link to Modal */}
                <div className="pt-2 px-3 border-t border-[#272a2d] bg-[#14171a]">
                  <button
                    onClick={() => {
                      setIsPairDropdownOpen(false);
                      setIsMarketModalOpen(true);
                    }}
                    className="w-full py-1.5 px-2 bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] hover:text-[#f6be16] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Open Full 30+ Market Explorer (Ctrl + K)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Price Tag with Dual USDT / CoinDCX INR Display */}
          <div className="flex items-center gap-2 font-mono shrink-0">
            <div className="flex flex-col items-start leading-tight">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs sm:text-sm font-extrabold tracking-tight ${
                    lastTradeSide === 'buy' ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                  }`}
                >
                  {currencyMode === 'INR' && activeTicker.inrPrice
                    ? `₹${activeTicker.inrPrice.toLocaleString('en-IN')}`
                    : `$${activeTicker.price.toFixed(activeTicker.precision)}`}
                </span>
                <span
                  className={`text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded ${
                    activeTicker.change24h >= 0 ? 'bg-[#00ff94]/10 text-[#00ff94]' : 'bg-[#ff3b4a]/10 text-[#ff3b4a]'
                  }`}
                >
                  {activeTicker.change24h >= 0
                    ? `+${activeTicker.change24h.toFixed(2)}%`
                    : `${activeTicker.change24h.toFixed(2)}%`}
                </span>
              </div>
              {activeTicker.inrPrice ? (
                <div className="flex items-center gap-1.5 text-[9px] text-[#99907f] font-mono">
                  <span>
                    {currencyMode === 'INR'
                      ? `≈ $${activeTicker.price.toFixed(activeTicker.precision)} USDT`
                      : `≈ ₹${activeTicker.inrPrice.toLocaleString('en-IN')}`}
                  </span>
                  {activeTicker.spotInrPrice && currencyMode === 'INR' && (
                    <span className="hidden sm:inline text-[#ffd87f]/80" title="CoinDCX Spot INR Orderbook Price">
                      • Spot: ₹{activeTicker.spotInrPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              ) : null}
            </div>

            {/* Currency Switcher Toggle (USDT / INR) */}
            {activeTicker.inrPrice && (
              <button
                type="button"
                onClick={toggleCurrencyMode}
                className="px-2 py-0.5 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#323538] text-[10px] font-bold text-[#f6be16] transition-colors cursor-pointer flex items-center gap-1"
                title={`Switch currency rate. Current CoinDCX USDT/INR conversion: ₹${activeTicker.usdtInrRate || 98.63}`}
              >
                <span>{currencyMode === 'USDT' ? '🇮🇳 ₹ INR' : '🌐 $ USDT'}</span>
              </button>
            )}

            {/* Quick Alert Button for Active Coin */}
            {onOpenAlertsModal && (
              <button
                type="button"
                onClick={() => onOpenAlertsModal(currentPair, activeTicker.price)}
                className={`hidden sm:flex p-1 rounded transition-colors cursor-pointer ${
                  activeAlertsForPair > 0
                    ? 'bg-[#f6be16]/20 text-[#f6be16] border border-[#f6be16]/40'
                    : 'bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#f6be16]'
                }`}
                title={`Set or manage price alert for ${currentPair} (${activeAlertsForPair} active)`}
              >
                <BellRing className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Center: 24h Market Metrics Strip & CoinDCX Live Badge */}
        <div className="hidden xl:flex items-center gap-3.5 text-[11px] font-mono text-[#99907f] shrink-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#111417] border border-[#272a2d] text-[#00ff94]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff94] animate-pulse" />
            <span className="text-[10px] font-bold">CoinDCX Live Feed</span>
            <span className="text-[9px] text-[#99907f]">({coindcxLatency}ms)</span>
          </div>

          {activeTicker.markPrice && (
            <div>
              <span className="block text-[9px] text-[#38bdf8]/80 uppercase">Mark Price</span>
              <span className="text-[#38bdf8] font-bold">
                ${activeTicker.markPrice.toFixed(activeTicker.precision)}
              </span>
            </div>
          )}

          {activeTicker.indexPrice && (
            <div>
              <span className="block text-[9px] text-[#ffd87f]/80 uppercase">Index Price</span>
              <span className="text-[#ffd87f]">
                ${activeTicker.indexPrice.toFixed(activeTicker.precision)}
              </span>
            </div>
          )}

          <div>
            <span className="block text-[9px] text-[#99907f]/80 uppercase">24h High</span>
            <span className="text-[#e1e2e7]">
              {currencyMode === 'INR' && activeTicker.inrHigh24h
                ? `₹${activeTicker.inrHigh24h.toLocaleString('en-IN')}`
                : `$${activeTicker.high24h.toFixed(activeTicker.precision)}`}
            </span>
          </div>
          <div>
            <span className="block text-[9px] text-[#99907f]/80 uppercase">24h Low</span>
            <span className="text-[#e1e2e7]">
              {currencyMode === 'INR' && activeTicker.inrLow24h
                ? `₹${activeTicker.inrLow24h.toLocaleString('en-IN')}`
                : `$${activeTicker.low24h.toFixed(activeTicker.precision)}`}
            </span>
          </div>
          <div>
            <span className="block text-[9px] text-[#99907f]/80 uppercase">24h Volume</span>
            <span className="text-[#e1e2e7]">{activeTicker.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div>
            <span className="block text-[9px] text-[#99907f]/80 uppercase">Funding / Countdown</span>
            <span className="text-[#ffd87f]">
              {(activeTicker.fundingRate * 100).toFixed(4)}% in {activeTicker.nextFundingIn}
            </span>
          </div>
        </div>

        {/* Right: Layout Switcher, Chart Switcher, Price Alerts, AI Copilot, Wallet */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Mobile All-in-One Pro Tools Drawer Button */}
          <button
            onClick={() => setIsMobileToolsDrawerOpen(true)}
            className="flex lg:hidden items-center gap-1 px-2 py-1 rounded bg-[#00ff94]/15 hover:bg-[#00ff94]/25 border border-[#00ff94]/40 text-xs font-mono font-bold text-[#00ff94] transition-colors cursor-pointer shadow-[0_0_10px_rgba(0,255,148,0.2)]"
            title="Open Mobile Institutional Tools Drawer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#00ff94]" />
            <span>Tools</span>
          </button>

          {/* Layout Mode Toggle (Mobile / Pro Desktop) */}
          <button
            onClick={() => setLayoutMode(isMobile ? 'desktop' : 'mobile')}
            className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
              isMobile
                ? 'bg-[#f6be16]/20 text-[#f6be16] border border-[#f6be16]/40'
                : 'bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1]'
            }`}
            title={isMobile ? 'Switch to Multi-Pane Desktop Layout' : 'Switch to Focused Mobile Layout'}
          >
            {isMobile ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isMobile ? 'Mobile UI' : 'Pro Desktop'}</span>
          </button>

          {/* Quick Chart Switch Button / Dropdown */}
          <div className="relative hidden md:block">
            <button
              id="chart-switch-btn"
              onClick={() => setIsChartSwitchDropdownOpen(!isChartSwitchDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-xs font-mono font-bold text-[#00ff94] transition-colors cursor-pointer"
              title="Switch Chart & Order Flow Mode"
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#00ff94]" />
              <span className="hidden sm:inline capitalize">
                {activeMainView === 'candles'
                  ? 'Candlestick'
                  : activeMainView === 'footprint'
                  ? 'Footprint Δ'
                  : activeMainView === 'liquidity_heatmap'
                  ? 'Heatmap'
                  : activeMainView === 'market_profile'
                  ? 'TPO Profile'
                  : activeMainView === 'dom_ladder'
                  ? 'DOM Ladder'
                  : 'Multi-Grid'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#99907f]" />
            </button>

            {isChartSwitchDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-[#191c1f] border border-[#272a2d] rounded-lg shadow-2xl p-1.5 z-50 flex flex-col gap-1 font-mono text-xs">
                <div className="px-2 py-1 text-[10px] text-[#99907f] uppercase font-bold border-b border-[#272a2d]">
                  Select Chart Mode
                </div>
                {[
                  { id: 'candles', label: 'Candlestick Chart', icon: BarChart2, desc: 'TradingView Style' },
                  { id: 'footprint', label: 'Order Flow Footprint', icon: Activity, desc: 'Buy/Sell Delta Matrix' },
                  { id: 'liquidity_heatmap', label: 'Liquidity Heatmap', icon: Flame, desc: 'Resting Depth Walls' },
                  { id: 'market_profile', label: 'TPO Market Profile', icon: Compass, desc: 'Value Area 70% & POC' },
                  { id: 'dom_ladder', label: 'DOM Execution Ladder', icon: Zap, desc: '1-Click Direct Trading' },
                  { id: 'multi_chart', label: 'Multi-Chart Split Grid', icon: LayoutGrid, desc: '1x / 2x / 4x Layouts' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeMainView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveMainView(item.id as ChartMainViewMode);
                        setIsChartSwitchDropdownOpen(false);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#00ff94]/15 text-[#00ff94] font-bold border border-[#00ff94]/30'
                          : 'text-[#d0c5b3] hover:text-[#fff8f1] hover:bg-[#272a2d]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-[#00ff94]' : 'text-[#99907f]'}`} />
                      <div className="flex flex-col">
                        <span>{item.label}</span>
                        <span className="text-[10px] text-[#99907f]">{item.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bar Replay Simulator */}
          <button
            onClick={() => setIsBarReplayOpen(true)}
            className="hidden lg:flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#ffd87f] hover:text-[#fff8f1] transition-colors cursor-pointer"
            title="Open Historical Bar Replay & Paper Simulator (Shift+P)"
          >
            <History className="w-3 h-3 text-[#ffd87f]" />
            <span>Replay</span>
          </button>

          {/* AI Auto Strategy Bot */}
          <button
            onClick={() => setIsAutoBotOpen(true)}
            className="hidden lg:flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#a855f7] hover:text-[#fff8f1] transition-colors cursor-pointer"
            title="Open No-Code Automated Strategy Builder (Shift+B)"
          >
            <Zap className="w-3 h-3 text-[#a855f7]" />
            <span>Auto Bot</span>
          </button>

          {/* Order Flow & CVD Delta */}
          <button
            onClick={() => setIsOrderFlowDeltaOpen(true)}
            className="hidden xl:flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#38bdf8] hover:text-[#fff8f1] transition-colors cursor-pointer"
            title="Open Institutional Order Flow, CVD & OI (Shift+D)"
          >
            <Activity className="w-3 h-3 text-[#38bdf8]" />
            <span>Delta & OI</span>
          </button>

          {/* Whale Tracker */}
          <button
            onClick={() => setIsWhaleTrackerOpen(true)}
            className="hidden lg:flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#00ff94] hover:text-[#fff8f1] transition-colors cursor-pointer"
            title="Open Whale & Smart Money Radar (Shift+W)"
          >
            <Fish className="w-3 h-3 text-[#00ff94]" />
            <span>Whales</span>
          </button>

          {/* Liquidation Heatmap */}
          <button
            onClick={() => setIsLiquidationModalOpen(true)}
            className="hidden lg:flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#ff4d4d] hover:text-[#fff8f1] transition-colors cursor-pointer"
            title="Open Liquidation Heatmap & Squeeze Radar (Shift+L)"
          >
            <Flame className="w-3 h-3 text-[#ff4d4d]" />
            <span>Liq Heatmap</span>
          </button>

          {/* TWAP / DCA Algo Slicer */}
          <button
            onClick={() => setIsAlgoSlicerOpen(true)}
            className="hidden xl:flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#ffd87f] hover:text-[#fff8f1] transition-colors cursor-pointer"
            title="Open TWAP / DCA Algorithmic Slicer (Shift+T)"
          >
            <Cpu className="w-3 h-3 text-[#ffd87f]" />
            <span>Algo Slicer</span>
          </button>

          {/* Trade Journal & PnL Share Card */}
          <button
            onClick={() => setIsTradeJournalOpen(true)}
            className="hidden xl:flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#d0c5b3] hover:text-[#fff8f1] transition-colors cursor-pointer"
            title="Open Trade Journal & PnL Share Cards (Shift+J)"
          >
            <BookOpen className="w-3 h-3 text-[#00ff94]" />
            <span>Journal</span>
          </button>

          {/* MTF Multi-Timeframe Matrix */}
          <button
            onClick={() => setIsMTFOpen(true)}
            className="hidden lg:flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#00ff94] hover:text-[#fff8f1] transition-colors cursor-pointer"
            title="Open Multi-Timeframe Technical Confluence Matrix"
          >
            <Layers className="w-3 h-3 text-[#00ff94]" />
            <span>MTF</span>
          </button>

          {/* Arbitrage & Liquidity Spread Radar */}
          <button
            onClick={() => setIsArbitrageModalOpen(true)}
            className="hidden 2xl:flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#ffd87f] hover:text-[#fff8f1] transition-colors cursor-pointer"
            title="Open Cross-Exchange Arbitrage & Spread Radar (CoinDCX vs Binance vs Bybit)"
          >
            <Scale className="w-3 h-3 text-[#ffd87f]" />
            <span>Arbitrage</span>
          </button>

          {/* Strategy Backtester Engine */}
          <button
            onClick={() => setIsBacktesterOpen(true)}
            className="hidden 2xl:flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#ffd87f] hover:text-[#fff8f1] transition-colors cursor-pointer"
            title="Open Quantitative Strategy Backtester"
          >
            <FlaskConical className="w-3 h-3 text-[#ffd87f]" />
            <span>Backtest</span>
          </button>

          {/* Macro Economic Calendar */}
          <button
            onClick={() => setIsEcoCalendarOpen(true)}
            className="hidden 2xl:flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#d0c5b3] hover:text-[#fff8f1] transition-colors cursor-pointer"
            title="Open Macro Economic Volatility Calendar (FOMC, CPI, Token Unlocks)"
          >
            <Calendar className="w-3 h-3 text-[#f6be16]" />
            <span>Macro</span>
          </button>

          {/* Hotkeys / Voice Helper */}
          <button
            onClick={() => setIsHotkeysModalOpen(true)}
            className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#38bdf8] hover:text-[#fff8f1] transition-colors cursor-pointer"
            title="Keyboard Hotkeys & AI Voice Settings (Shift+H)"
          >
            <Keyboard className="w-3 h-3 text-[#38bdf8]" />
            <span className="hidden lg:inline">Hotkeys</span>
          </button>

          {/* Webhooks / Telegram Integrations */}
          <button
            onClick={() => setIsWebhookModalOpen(true)}
            className="hidden xl:flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#d0c5b3] hover:text-[#fff8f1] transition-colors cursor-pointer"
            title="Configure Telegram & Discord Trade Signal Webhooks"
          >
            <Send className="w-3 h-3 text-[#38bdf8]" />
            <span>Webhooks</span>
          </button>

          {/* Reset All Prices from CoinDCX Button */}
          {onResetCoinDCXPrices && (
            <button
              onClick={onResetCoinDCXPrices}
              disabled={isResettingPrices}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] font-mono text-[#d0c5b3] hover:text-[#fff8f1] transition-colors cursor-pointer disabled:opacity-50"
              title="Reset all prices and reconnect to CoinDCX live orderbooks"
            >
              <RefreshCw className={`w-3 h-3 text-[#f6be16] ${isResettingPrices ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}

          {/* Strategy Manager Dashboard Button */}
          <button
            id="terminal-strategy-manager-btn"
            onClick={() => setIsStrategyManagerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00ff94]/15 hover:bg-[#00ff94]/25 text-[#00ff94] border border-[#00ff94]/40 text-xs font-bold font-mono transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,148,0.2)] hover:scale-105"
            title="Open Strategy Manager - Global Strategy Toggles, Indicators Matrix & Custom Parameters"
          >
            <Sliders className="w-3.5 h-3.5 text-[#00ff94]" />
            <span className="hidden sm:inline">Strategy Manager</span>
            <span className="text-[10px] px-1 py-0.2 bg-[#00ff94]/20 rounded font-extrabold">
              Global
            </span>
          </button>

          {/* Strategy Command Hub & Multi-Crypto Scanner Button */}
          <button
            id="terminal-strategy-hub-btn"
            onClick={() => setIsStrategyHubOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] hover:text-[#00ff94] border border-[#37393d] text-xs font-bold font-mono transition-all cursor-pointer"
            title="Open Strategy Hub - View all strategies & scan all 30+ cryptos simultaneously"
          >
            <Target className="w-3.5 h-3.5 text-[#00ff94]" />
            <span className="hidden sm:inline">Strategy Hub</span>
            <span className="text-[10px] px-1 py-0.2 bg-[#00ff94]/20 text-[#00ff94] rounded font-extrabold">
              All-Crypto
            </span>
          </button>

          {/* Auto Alert Scanner Button */}
          {onOpenAutoAlertsModal && (
            <button
              id="terminal-auto-alerts-btn"
              onClick={onOpenAutoAlertsModal}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00ff94]/15 hover:bg-[#00ff94]/25 text-[#00ff94] border border-[#00ff94]/40 text-xs font-bold font-mono transition-all cursor-pointer shadow-[0_0_12px_rgba(0,255,148,0.15)]"
              title="Open Multi-Asset Auto Signal Scanner"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff94] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff94]" />
              </span>
              <span className="hidden sm:inline">Auto Signals</span>
              <span className="text-[10px] px-1 py-0.2 bg-[#00ff94]/20 rounded">
                {autoAlertEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          )}

          {/* Price Alerts Manager Button */}
          {onOpenAlertsModal && (
            <button
              id="terminal-price-alerts-btn"
              onClick={() => onOpenAlertsModal()}
              className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-[#f6be16]/15 hover:bg-[#f6be16]/25 text-[#f6be16] border border-[#f6be16]/40 text-xs font-bold font-mono transition-colors cursor-pointer shadow-[0_0_12px_rgba(246,190,22,0.15)]"
              title="Manage Target Price Threshold Alerts"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alerts</span>
              {totalActiveAlerts > 0 && (
                <span className="px-1.5 py-0.2 bg-[#f6be16] text-[#111417] text-[10px] font-extrabold rounded-full">
                  {totalActiveAlerts}
                </span>
              )}
            </button>
          )}

          {/* AI Copilot Button */}
          <button
            id="terminal-copilot-btn"
            onClick={onOpenCopilot}
            className="flex items-center gap-1 px-2 py-1 sm:px-2.5 rounded bg-[#00ff94]/15 hover:bg-[#00ff94]/25 text-[#00ff94] border border-[#00ff94]/40 text-xs font-bold font-mono transition-all cursor-pointer shadow-[0_0_12px_rgba(0,255,148,0.2)]"
            title="Open AI Market Copilot & Strategy Analyst"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-[#00ff94] animate-pulse" />
            <span className="inline sm:inline">AI</span>
          </button>

          {/* Install Mobile App Button */}
          {onOpenInstallModal && (
            <button
              id="terminal-install-app-btn"
              onClick={onOpenInstallModal}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00ff94]/10 hover:bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/30 text-xs font-bold font-mono transition-colors cursor-pointer"
              title="Install as Mobile App (PWA)"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#00ff94]" />
              <span className="hidden xl:inline">Install App</span>
            </button>
          )}

          {/* Wallet Balance Button */}
          <button
            id="terminal-portfolio-btn"
            onClick={onOpenPortfolio}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-xs font-mono text-[#fff8f1] transition-colors cursor-pointer"
            title="Portfolio & Balance"
          >
            <Wallet className="w-3.5 h-3.5 text-[#f6be16]" />
            <span className="hidden sm:inline">${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] rounded transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#f6be16] animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* Real-time CoinDCX Tickers & INR Exchange Price Bar */}
      <RealTimePriceBar
        tickers={tickers}
        currentPair={currentPair}
        onSelectPair={onSelectPair}
        currencyMode={currencyMode}
        onToggleCurrencyMode={toggleCurrencyMode}
        coindcxLatency={coindcxLatency}
        isCoinDCXLive={isCoinDCXLive}
      />

      {/* 2. Main Terminal Content */}
      {isMobile ? (
        /* MOBILE VIEW: Non-overlapping Tab Navigation Layout */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Mobile Top Navigation Sub-Tabs Bar */}
          <div className="flex items-center justify-around bg-[#14171a] border-b border-[#272a2d] px-1 py-1 shrink-0 font-mono text-xs z-20">
            <button
              onClick={() => setMobileTab('chart')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-all cursor-pointer font-bold ${
                mobileTab === 'chart'
                  ? 'bg-[#272a2d] text-[#00ff94] border border-[#00ff94]/40 shadow-xs'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Chart</span>
            </button>

            <button
              onClick={() => setMobileTab('trade')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-all cursor-pointer font-bold ${
                mobileTab === 'trade'
                  ? 'bg-[#272a2d] text-[#00ff94] border border-[#00ff94]/40 shadow-xs'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Trade</span>
            </button>

            <button
              onClick={() => setMobileTab('orderbook')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-all cursor-pointer font-bold ${
                mobileTab === 'orderbook'
                  ? 'bg-[#272a2d] text-[#00ff94] border border-[#00ff94]/40 shadow-xs'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Book</span>
            </button>

            <button
              onClick={() => setMobileTab('positions')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-all cursor-pointer font-bold ${
                mobileTab === 'positions'
                  ? 'bg-[#272a2d] text-[#00ff94] border border-[#00ff94]/40 shadow-xs'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Positions ({positions.length})</span>
            </button>
          </div>

          {/* Mobile Active Tab Content Container */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Tab 1: Chart View */}
            {mobileTab === 'chart' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <OrderFlowSwitchboard
                  activeView={activeMainView}
                  onChangeView={setActiveMainView}
                  layoutPattern={layoutPattern}
                  onChangeLayoutPattern={setLayoutPattern}
                  config={switchboardConfig}
                  onUpdateConfig={handleUpdateConfig}
                />

                <div className="flex-1 relative overflow-hidden">
                  {activeMainView === 'candles' && (
                    <CandleChart
                      candles={candles}
                      currentPrice={activeTicker.price}
                      symbol={currentPair}
                      timeframe={timeframe}
                      onTimeframeChange={onTimeframeChange}
                      activeSignal={activeSignal}
                      alerts={alerts}
                      onOpenAlertsModal={(price) => onOpenAlertsModal?.(currentPair, price)}
                      onLoadMoreHistoricalCandles={onLoadMoreHistoricalCandles}
                      currencyMode={currencyMode}
                      inrPrice={activeTicker.inrPrice}
                    />
                  )}

                  {activeMainView === 'footprint' && (
                    <FootprintChart
                      candles={candles}
                      currentPrice={activeTicker.price}
                      symbol={currentPair}
                      timeframe={timeframe}
                      imbalanceRatio={switchboardConfig.imbalanceRatio}
                      showCVD={switchboardConfig.showCVD}
                      showPOC={switchboardConfig.showPOC}
                      showValueArea={switchboardConfig.showValueArea}
                    />
                  )}

                  {activeMainView === 'liquidity_heatmap' && (
                    <LiquidityHeatmap
                      bids={bids}
                      asks={asks}
                      currentPrice={activeTicker.price}
                      symbol={currentPair}
                      precision={activeTicker.precision}
                    />
                  )}

                  {activeMainView === 'market_profile' && (
                    <MarketProfileTPO
                      candles={candles}
                      currentPrice={activeTicker.price}
                      symbol={currentPair}
                      timeframe={timeframe}
                    />
                  )}

                  {activeMainView === 'dom_ladder' && (
                    <DOMLadder
                      bids={bids}
                      asks={asks}
                      currentPrice={activeTicker.price}
                      symbol={currentPair}
                      precision={activeTicker.precision}
                      onPlaceOrder={onPlaceOrder}
                    />
                  )}

                  {activeMainView === 'multi_chart' && (
                    <MultiChartGrid
                      currentPair={currentPair}
                      tickers={tickers}
                      candles={candles}
                      timeframe={timeframe}
                      onTimeframeChange={onTimeframeChange}
                      activeSignal={activeSignal}
                      alerts={alerts}
                      onOpenAlertsModal={(price) => onOpenAlertsModal?.(currentPair, price)}
                      layoutPattern={layoutPattern}
                      onSelectLayoutPattern={setLayoutPattern}
                    />
                  )}
                </div>

                {/* Mobile Fast Action Buttons (Quick Buy / Quick Sell) */}
                <div className="flex items-center gap-2 p-2 bg-[#14171a] border-t border-[#272a2d] shrink-0 font-mono">
                  <button
                    onClick={() => {
                      setSelectedOrderPrice(activeTicker.price);
                      setMobileTab('trade');
                    }}
                    className="flex-1 py-2.5 rounded bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#0b0e11] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,255,148,0.25)] cursor-pointer"
                  >
                    <span>BUY / LONG</span>
                    <span className="text-[10px] opacity-80">${activeTicker.price.toFixed(activeTicker.precision)}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedOrderPrice(activeTicker.price);
                      setMobileTab('trade');
                    }}
                    className="flex-1 py-2.5 rounded bg-[#ff3b4a] hover:bg-[#ff3b4a]/90 text-[#fff8f1] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(255,59,74,0.25)] cursor-pointer"
                  >
                    <span>SELL / SHORT</span>
                    <span className="text-[10px] opacity-80">${activeTicker.price.toFixed(activeTicker.precision)}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Trade Panel */}
            {mobileTab === 'trade' && (
              <div className="flex-1 overflow-y-auto bg-[#111417] p-2">
                <OrderPanel
                  symbol={currentPair}
                  currentPrice={activeTicker.price}
                  selectedPrice={selectedOrderPrice}
                  balance={balance}
                  precision={activeTicker.precision}
                  currencyMode={currencyMode}
                  inrPrice={activeTicker.inrPrice}
                  onOpenRiskCalculator={() => setIsRiskCalcOpen(true)}
                  onPlaceOrder={(order) => {
                    onPlaceOrder(order);
                    setMobileTab('positions');
                  }}
                />
              </div>
            )}

            {/* Tab 3: Order Book & Market Trades */}
            {mobileTab === 'orderbook' && (
              <div className="flex-1 overflow-y-auto bg-[#111417]">
                <OrderBook
                  bids={bids}
                  asks={asks}
                  currentPrice={activeTicker.price}
                  lastTradeSide={lastTradeSide}
                  recentTrades={recentTrades}
                  precision={activeTicker.precision}
                  currencyMode={currencyMode}
                  inrPrice={activeTicker.inrPrice}
                  onSelectPrice={(p) => {
                    setSelectedOrderPrice(p);
                    setMobileTab('trade');
                  }}
                />
              </div>
            )}

            {/* Tab 4: Positions, Orders & Signals */}
            {mobileTab === 'positions' && (
              <div className="flex-1 overflow-y-auto bg-[#111417]">
                <PositionsTable
                  positions={positions}
                  openOrders={openOrders}
                  orderHistory={orderHistory}
                  aiSignals={aiSignals}
                  onClosePosition={onClosePosition}
                  onCancelOrder={onCancelOrder}
                  onExecuteSignal={onExecuteSignal}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PRO DESKTOP VIEW: Institutional Multi-Pane Grid Layout */
        <div className="flex-1 flex flex-row overflow-hidden">
          {/* Left / Center Section: Chart & Positions Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Order Flow & Chart Switchboard Bar */}
            <OrderFlowSwitchboard
              activeView={activeMainView}
              onChangeView={setActiveMainView}
              layoutPattern={layoutPattern}
              onChangeLayoutPattern={setLayoutPattern}
              config={switchboardConfig}
              onUpdateConfig={handleUpdateConfig}
            />

            {/* Top Chart Area */}
            <div className="flex-1 min-h-[300px] relative overflow-hidden">
              {activeMainView === 'candles' && (
                <CandleChart
                  candles={candles}
                  currentPrice={activeTicker.price}
                  symbol={currentPair}
                  timeframe={timeframe}
                  onTimeframeChange={onTimeframeChange}
                  activeSignal={activeSignal}
                  alerts={alerts}
                  onOpenAlertsModal={(price) => onOpenAlertsModal?.(currentPair, price)}
                  onLoadMoreHistoricalCandles={onLoadMoreHistoricalCandles}
                  currencyMode={currencyMode}
                  inrPrice={activeTicker.inrPrice}
                />
              )}

              {activeMainView === 'footprint' && (
                <FootprintChart
                  candles={candles}
                  currentPrice={activeTicker.price}
                  symbol={currentPair}
                  timeframe={timeframe}
                  imbalanceRatio={switchboardConfig.imbalanceRatio}
                  showCVD={switchboardConfig.showCVD}
                  showPOC={switchboardConfig.showPOC}
                  showValueArea={switchboardConfig.showValueArea}
                />
              )}

              {activeMainView === 'liquidity_heatmap' && (
                <LiquidityHeatmap
                  bids={bids}
                  asks={asks}
                  currentPrice={activeTicker.price}
                  symbol={currentPair}
                  precision={activeTicker.precision}
                />
              )}

              {activeMainView === 'market_profile' && (
                <MarketProfileTPO
                  candles={candles}
                  currentPrice={activeTicker.price}
                  symbol={currentPair}
                  timeframe={timeframe}
                />
              )}

              {activeMainView === 'dom_ladder' && (
                <DOMLadder
                  bids={bids}
                  asks={asks}
                  currentPrice={activeTicker.price}
                  symbol={currentPair}
                  precision={activeTicker.precision}
                  onPlaceOrder={onPlaceOrder}
                />
              )}

              {activeMainView === 'multi_chart' && (
                <MultiChartGrid
                  currentPair={currentPair}
                  tickers={tickers}
                  candles={candles}
                  timeframe={timeframe}
                  onTimeframeChange={onTimeframeChange}
                  activeSignal={activeSignal}
                  alerts={alerts}
                  onOpenAlertsModal={(price) => onOpenAlertsModal?.(currentPair, price)}
                  layoutPattern={layoutPattern}
                  onSelectLayoutPattern={setLayoutPattern}
                />
              )}
            </div>

            {/* Bottom Positions & Orders Panel */}
            <div className="h-56 min-h-[160px] border-t border-[#272a2d]">
              <PositionsTable
                positions={positions}
                openOrders={openOrders}
                orderHistory={orderHistory}
                aiSignals={aiSignals}
                onClosePosition={onClosePosition}
                onCancelOrder={onCancelOrder}
                onExecuteSignal={onExecuteSignal}
              />
            </div>
          </div>

          {/* Right Section: Order Book & Order Panel */}
          <div className="w-[520px] xl:w-[580px] flex flex-row border-l border-[#272a2d] shrink-0">
            {/* Order Book Column */}
            <div className="w-1/2 h-full border-r border-[#272a2d]">
              <OrderBook
                bids={bids}
                asks={asks}
                currentPrice={activeTicker.price}
                lastTradeSide={lastTradeSide}
                recentTrades={recentTrades}
                precision={activeTicker.precision}
                currencyMode={currencyMode}
                inrPrice={activeTicker.inrPrice}
                onSelectPrice={(p) => setSelectedOrderPrice(p)}
              />
            </div>

            {/* Order Entry Panel Column */}
            <div className="w-1/2 h-full">
              <OrderPanel
                symbol={currentPair}
                currentPrice={activeTicker.price}
                selectedPrice={selectedOrderPrice}
                balance={balance}
                precision={activeTicker.precision}
                currencyMode={currencyMode}
                inrPrice={activeTicker.inrPrice}
                onOpenRiskCalculator={() => setIsRiskCalcOpen(true)}
                onPlaceOrder={onPlaceOrder}
              />
            </div>
          </div>
        </div>
      )}

      {/* Market Search & Discovery Modal */}
      <MarketSearchModal
        isOpen={isMarketModalOpen}
        onClose={() => setIsMarketModalOpen(false)}
        currentPair={currentPair}
        tickers={tickers}
        onSelectPair={onSelectPair}
        currencyMode={currencyMode}
        onToggleCurrencyMode={toggleCurrencyMode}
      />

      {/* Cross-Exchange Arbitrage Spread Radar Modal */}
      <ArbitrageSpreadModal
        isOpen={isArbitrageModalOpen}
        onClose={() => setIsArbitrageModalOpen(false)}
        currentPair={currentPair}
        tickers={tickers}
        onSelectPair={onSelectPair}
      />

      {/* Risk Management & Position Sizing Modal */}
      <RiskCalculatorModal
        isOpen={isRiskCalcOpen}
        onClose={() => setIsRiskCalcOpen(false)}
        currentPair={currentPair}
        currentPrice={activeTicker.price}
        balance={balance}
        precision={activeTicker.precision}
        onApplyToOrderPanel={(params) => {
          onPlaceOrder({
            symbol: params.symbol,
            type: 'limit',
            side: params.side,
            price: params.price,
            amount: params.amount,
            leverage: params.leverage,
            takeProfit: params.takeProfit,
            stopLoss: params.stopLoss,
          });
        }}
      />

      {/* Quantitative Strategy Backtester Modal */}
      <StrategyBacktesterModal
        isOpen={isBacktesterOpen}
        onClose={() => setIsBacktesterOpen(false)}
        currentPair={currentPair}
        candles={candles}
        timeframe={timeframe}
      />

      {/* Macro Economic Calendar Modal */}
      <EconomicCalendarModal
        isOpen={isEcoCalendarOpen}
        onClose={() => setIsEcoCalendarOpen(false)}
      />

      {/* Multi-Timeframe Confluence Scanner Modal */}
      <MTFAnalysisModal
        isOpen={isMTFOpen}
        onClose={() => setIsMTFOpen(false)}
        currentPair={currentPair}
        currentPrice={activeTicker.price}
        tickers={tickers}
        onSelectPair={onSelectPair}
      />

      {/* Webhook Alerts, Telegram & Discord Modal */}
      <WebhookAlertsModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
      />

      {/* Whale & Smart Money Radar Modal */}
      <WhaleTrackerModal
        isOpen={isWhaleTrackerOpen}
        onClose={() => setIsWhaleTrackerOpen(false)}
        currentPair={currentPair}
        tickers={tickers}
        onSelectPair={onSelectPair}
      />

      {/* Liquidation Heatmap & Squeeze Radar Modal */}
      <LiquidationHeatmapModal
        isOpen={isLiquidationModalOpen}
        onClose={() => setIsLiquidationModalOpen(false)}
        currentPair={currentPair}
        tickers={tickers}
        onSelectPair={onSelectPair}
      />

      {/* TWAP / DCA Algorithmic Slicer Modal */}
      <AlgorithmicSlicerModal
        isOpen={isAlgoSlicerOpen}
        onClose={() => setIsAlgoSlicerOpen(false)}
        currentPair={currentPair}
        currentPrice={activeTicker.price}
        balance={balance}
        precision={activeTicker.precision}
        onExecuteOrders={(orders) => {
          orders.forEach((ord) => {
            onPlaceOrder({
              symbol: ord.symbol,
              type: ord.type,
              side: ord.side,
              price: ord.price,
              amount: ord.amount,
              leverage: ord.leverage,
              takeProfit: ord.takeProfit,
              stopLoss: ord.stopLoss,
            });
          });
        }}
      />

      {/* Trading Journal & Shareable PnL Cards Modal */}
      <TradeJournalPnLModal
        isOpen={isTradeJournalOpen}
        onClose={() => setIsTradeJournalOpen(false)}
        positions={positions}
        balance={balance}
        onShowToast={(msg, type) => {
          // Fallback toast alert
          if (type === 'success') {
            console.log(msg);
          }
        }}
      />

      {/* Keyboard Hotkeys & Voice Assistant Modal */}
      <HotkeysVoiceModal
        isOpen={isHotkeysModalOpen}
        onClose={() => setIsHotkeysModalOpen(false)}
        isVoiceAlertsEnabled={isVoiceAlertsEnabled}
        onToggleVoiceAlerts={handleToggleVoiceAlerts}
      />

      {/* Historical Bar Replay Simulator Modal */}
      <BarReplaySimulatorModal
        isOpen={isBarReplayOpen}
        onClose={() => setIsBarReplayOpen(false)}
        currentPair={currentPair}
        candles={candles}
        precision={activeTicker.precision}
        onShowToast={(msg, type) => {
          if (type === 'success') console.log(msg);
        }}
      />

      {/* No-Code Auto Strategy Bot Builder Modal */}
      <AutoStrategyBotModal
        isOpen={isAutoBotOpen}
        onClose={() => setIsAutoBotOpen(false)}
        currentPair={currentPair}
        onShowToast={(msg, type) => {
          if (type === 'success') console.log(msg);
        }}
      />

      {/* Institutional Order Flow & CVD Delta Modal */}
      <OrderFlowDeltaModal
        isOpen={isOrderFlowDeltaOpen}
        onClose={() => setIsOrderFlowDeltaOpen(false)}
        currentPair={currentPair}
        candles={candles}
        ticker={activeTicker}
      />

      {/* Strategy Manager Dashboard Modal */}
      <StrategyManagerModal
        isOpen={isStrategyManagerOpen}
        onClose={() => setIsStrategyManagerOpen(false)}
        tickers={tickers}
        currentPair={currentPair}
        onSelectPair={onSelectPair}
        onPlaceOrder={onPlaceOrder}
        onOpenAlertsModal={onOpenAlertsModal}
      />

      {/* Strategy Command Hub & Multi-Crypto Cross Scanner Modal */}
      <StrategyHubModal
        isOpen={isStrategyHubOpen}
        onClose={() => setIsStrategyHubOpen(false)}
        tickers={tickers}
        currentPair={currentPair}
        onSelectPair={onSelectPair}
        onPlaceOrder={onPlaceOrder}
        onOpenAlertsModal={onOpenAlertsModal}
      />

      {/* Mobile Institutional Tools Drawer */}
      <MobileToolsDrawer
        isOpen={isMobileToolsDrawerOpen}
        onClose={() => setIsMobileToolsDrawerOpen(false)}
        onOpenModal={handleOpenToolModal}
        isVoiceAlertsEnabled={isVoiceAlertsEnabled}
        onToggleVoiceAlerts={handleToggleVoiceAlerts}
        autoAlertEnabled={autoAlertEnabled}
        totalActiveAlerts={totalActiveAlerts}
        onOpenInstallModal={onOpenInstallModal}
      />

      {/* Floating Quick Action Pill for AI Chat Analyst (Desktop only, so it does not overlap mobile bottom actions) */}
      <button
        id="floating-ai-analyst-btn"
        onClick={onOpenCopilot}
        className="hidden lg:flex fixed bottom-4 right-4 z-40 items-center gap-2 px-3.5 py-2.5 bg-[#14171a] hover:bg-[#191c1f] text-[#00ff94] border border-[#00ff94]/40 rounded-full shadow-[0_4px_20px_rgba(0,255,148,0.25)] hover:shadow-[0_4px_25px_rgba(0,255,148,0.4)] transition-all cursor-pointer group"
      >
        <div className="p-1 rounded-full bg-[#00ff94]/20 border border-[#00ff94]/50 group-hover:scale-110 transition-transform">
          <BrainCircuit className="w-4 h-4 text-[#00ff94]" />
        </div>
        <span className="font-mono text-xs font-bold text-[#fff8f1]">Ask AI Analyst</span>
        <span className="text-[10px] px-1.5 py-0.5 bg-[#00ff94]/15 text-[#00ff94] rounded-full font-mono font-extrabold border border-[#00ff94]/30">
          BUY/SELL
        </span>
      </button>
    </div>
  );
};
