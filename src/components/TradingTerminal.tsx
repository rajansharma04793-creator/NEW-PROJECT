import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  QuantExecutionMode,
  ProductTradingMode,
  OrderReviewPayload,
  UnifiedTradeSetup,
} from '../types';
import { ALL_COINS_METADATA, INITIAL_TICKERS, searchCoins } from '../data/marketData';
import { ModeSelectorBanner } from './ModeSelectorBanner';
import { CandleChart } from './CandleChart';
import { OrderFlowSwitchboard } from './OrderFlowSwitchboard';
import { OrderBook } from './OrderBook';
import { OrderPanel } from './OrderPanel';
import { PositionsTable } from './PositionsTable';
import { RealTimePriceBar } from './RealTimePriceBar';
import { validateUnifiedTradeSetup, calculateDirectionalTPSL } from '../hooks/useTradeSetup';

// Lazy-loaded heavy secondary charts & modals to dramatically reduce main bundle size (M-03)
const SignalLedgerModal = React.lazy(() => import('./SignalLedgerModal').then((m) => ({ default: m.SignalLedgerModal })));
const MarketSearchModal = React.lazy(() => import('./MarketSearchModal').then((m) => ({ default: m.MarketSearchModal })));
const FootprintChart = React.lazy(() => import('./FootprintChart').then((m) => ({ default: m.FootprintChart })));
const LiquidityHeatmap = React.lazy(() => import('./LiquidityHeatmap').then((m) => ({ default: m.LiquidityHeatmap })));
const MarketProfileTPO = React.lazy(() => import('./MarketProfileTPO').then((m) => ({ default: m.MarketProfileTPO })));
const DOMLadder = React.lazy(() => import('./DOMLadder').then((m) => ({ default: m.DOMLadder })));
const MultiChartGrid = React.lazy(() => import('./MultiChartGrid').then((m) => ({ default: m.MultiChartGrid })));
const ArbitrageSpreadModal = React.lazy(() => import('./ArbitrageSpreadModal').then((m) => ({ default: m.ArbitrageSpreadModal })));
const QuantExecutionConsoleModal = React.lazy(() => import('./QuantExecutionConsoleModal').then((m) => ({ default: m.QuantExecutionConsoleModal })));
const RiskCalculatorModal = React.lazy(() => import('./RiskCalculatorModal').then((m) => ({ default: m.RiskCalculatorModal })));
const StrategyBacktesterModal = React.lazy(() => import('./StrategyBacktesterModal').then((m) => ({ default: m.StrategyBacktesterModal })));
const EconomicCalendarModal = React.lazy(() => import('./EconomicCalendarModal').then((m) => ({ default: m.EconomicCalendarModal })));
const MTFAnalysisModal = React.lazy(() => import('./MTFAnalysisModal').then((m) => ({ default: m.MTFAnalysisModal })));
const WebhookAlertsModal = React.lazy(() => import('./WebhookAlertsModal').then((m) => ({ default: m.WebhookAlertsModal })));
const WhaleTrackerModal = React.lazy(() => import('./WhaleTrackerModal').then((m) => ({ default: m.WhaleTrackerModal })));
const LiquidationHeatmapModal = React.lazy(() => import('./LiquidationHeatmapModal').then((m) => ({ default: m.LiquidationHeatmapModal })));
const AlgorithmicSlicerModal = React.lazy(() => import('./AlgorithmicSlicerModal').then((m) => ({ default: m.AlgorithmicSlicerModal })));
const TradeJournalPnLModal = React.lazy(() => import('./TradeJournalPnLModal').then((m) => ({ default: m.TradeJournalPnLModal })));
const HotkeysVoiceModal = React.lazy(() => import('./HotkeysVoiceModal').then((m) => ({ default: m.HotkeysVoiceModal })));
const BarReplaySimulatorModal = React.lazy(() => import('./BarReplaySimulatorModal').then((m) => ({ default: m.BarReplaySimulatorModal })));
const AutoStrategyBotModal = React.lazy(() => import('./AutoStrategyBotModal').then((m) => ({ default: m.AutoStrategyBotModal })));
const OrderFlowDeltaModal = React.lazy(() => import('./OrderFlowDeltaModal').then((m) => ({ default: m.OrderFlowDeltaModal })));
const StrategyHubModal = React.lazy(() => import('./StrategyHubModal').then((m) => ({ default: m.StrategyHubModal })));
const StrategyManagerModal = React.lazy(() => import('./StrategyManagerModal').then((m) => ({ default: m.StrategyManagerModal })));
const CPRMarketTrendModal = React.lazy(() => import('./CPRMarketTrendModal').then((m) => ({ default: m.CPRMarketTrendModal })));
const SmartEntryRadarModal = React.lazy(() => import('./SmartEntryRadarModal').then((m) => ({ default: m.SmartEntryRadarModal })));
const MobileToolsDrawer = React.lazy(() => import('./MobileToolsDrawer').then((m) => ({ default: m.MobileToolsDrawer })));
const MTFQuickBar = React.lazy(() => import('./MTFQuickBar').then((m) => ({ default: m.MTFQuickBar })));
const QuickProfitBar = React.lazy(() => import('./QuickProfitBar').then((m) => ({ default: m.QuickProfitBar })));
const TradeGuideModal = React.lazy(() => import('./TradeGuideModal').then((m) => ({ default: m.TradeGuideModal })));
const AgentDeliberationOverlay = React.lazy(() => import('./AgentDeliberationOverlay').then((m) => ({ default: m.AgentDeliberationOverlay })));
const TradeLearningTooltipModal = React.lazy(() => import('./TradeLearningTooltipModal').then((m) => ({ default: m.TradeLearningTooltipModal })));
import { playBreakoutChime, speakSignalAlert, playProfitHitChime, playAlertChime, playSignalAlertSound } from '../utils/soundEffects';
import { calculate5AgentSignal, convertReportToSignal } from '../services/agentDeliberationEngine';
import { computeClientSignal } from '../services/aiSignalService';
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  Globe,
  Settings,
  HelpCircle,
  ShieldCheck,
  GraduationCap,
  Lock,
  Unlock,
  X,
  Home,
  Repeat,
  PieChart,
  MoreVertical,
  Menu,
  Clock,
  ArrowUpDown,
  Sun,
  Moon,
  CandlestickChart,
  Plus,
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
  autoExecutionEnabled?: boolean;
  onToggleAutoExecution?: () => void;
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
  onPlaceQuickTrade?: (params: {
    symbol: AssetPair;
    side: 'buy' | 'sell';
    leverage?: number;
    marginPercent?: number;
    takeProfitPercent?: number;
    stopLossPercent?: number;
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
  onOpenMarketOverview?: () => void;
  onOpenPipCalculator?: (symbol?: AssetPair) => void;
  onOpenEconomicCalendar?: () => void;
  onOpenApiSettings?: () => void;
  currencyMode?: 'USDT' | 'INR';
  onToggleCurrencyMode?: () => void;
  currentMode?: ProductTradingMode;
  onModeChange?: (mode: ProductTradingMode) => void;
  onRequestReviewOrder?: (payload: OrderReviewPayload) => void;
  onOpenSignalLedger?: () => void;
  isChartLoading?: boolean;
  chartLoadingMessage?: string;
  chartErrorMessage?: string | null;
  onRetryLoadCandles?: () => void;
}

export const TradingTerminal: React.FC<TradingTerminalProps> = React.memo(({
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
  autoExecutionEnabled = false,
  onToggleAutoExecution,
  onPlaceOrder,
  onPlaceQuickTrade,
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
  isChartLoading = false,
  chartLoadingMessage,
  chartErrorMessage = null,
  onRetryLoadCandles,
  onLoadMoreHistoricalCandles,
  onOpenInstallModal,
  onOpenMarketOverview,
  onOpenPipCalculator,
  onOpenEconomicCalendar,
  onOpenApiSettings,
  currencyMode: propCurrencyMode,
  onToggleCurrencyMode: propToggleCurrencyMode,
  currentMode = 'PAPER',
  onModeChange,
  onRequestReviewOrder,
  onOpenSignalLedger,
}) => {
  const activeTicker = tickers[currentPair] || tickers['BTC/USDT'] || INITIAL_TICKERS['BTC/USDT'];
  const [isPairDropdownOpen, setIsPairDropdownOpen] = useState(false);
  const [isTradeGuideOpen, setIsTradeGuideOpen] = useState(false);
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);
  const [isArbitrageModalOpen, setIsArbitrageModalOpen] = useState(false);
  const [isQuantConsoleOpen, setIsQuantConsoleOpen] = useState(false);
  const [isRiskCalcOpen, setIsRiskCalcOpen] = useState(false);
  const [isBacktesterOpen, setIsBacktesterOpen] = useState(false);
  const [isEcoCalendarOpen, setIsEcoCalendarOpen] = useState(false);
  const [isMTFOpen, setIsMTFOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isWhaleTrackerOpen, setIsWhaleTrackerOpen] = useState(false);
  const [isLiquidationModalOpen, setIsLiquidationModalOpen] = useState(false);
  const [isAlgoSlicerOpen, setIsAlgoSlicerOpen] = useState(false);
  const [isTradeJournalOpen, setIsTradeJournalOpen] = useState(false);
  const [isSignalLedgerLocalOpen, setIsSignalLedgerLocalOpen] = useState(false);
  const [isHotkeysModalOpen, setIsHotkeysModalOpen] = useState(false);
  const [isBarReplayOpen, setIsBarReplayOpen] = useState(false);
  const [isAutoBotOpen, setIsAutoBotOpen] = useState(false);
  const [isOrderFlowDeltaOpen, setIsOrderFlowDeltaOpen] = useState(false);
  const [isStrategyHubOpen, setIsStrategyHubOpen] = useState(false);
  const [isStrategyManagerOpen, setIsStrategyManagerOpen] = useState(false);
  const [isCPRModalOpen, setIsCPRModalOpen] = useState(false);
  const [isSmartEntryRadarOpen, setIsSmartEntryRadarOpen] = useState(false);
  const [isAgentDeliberationOpen, setIsAgentDeliberationOpen] = useState(false);
  const [isTradeLearningTooltipOpen, setIsTradeLearningTooltipOpen] = useState<boolean>(() => {
    try {
      const seen = localStorage.getItem('coindcx_trade_learning_tooltip_seen');
      return !seen; // Triggers first time user views the terminal
    } catch {
      return false;
    }
  });
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
  const handleSelectOrderPrice = useCallback((p: number) => {
    setSelectedOrderPrice(p);
  }, []);
  const handleSelectMobileOrderPrice = useCallback((p: number) => {
    setSelectedOrderPrice(p);
    setMobileTab('trade');
  }, []);
  const [pairFilter, setPairFilter] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<MarketCategory>('all');
  const [quickHighlightIndex, setQuickHighlightIndex] = useState<number>(0);
  const pairDropdownRef = useRef<HTMLDivElement>(null);
  
  // Theme state: defaults to 'light' to match the user's requested screenshot, switchable to dark
  const [terminalTheme, setTerminalTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('lumina_terminal_theme') as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  });

  const toggleTerminalTheme = useCallback(() => {
    setTerminalTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('lumina_terminal_theme', next);
      } catch {}
      return next;
    });
  }, []);

  // Futures Dropdown & Options states
  const [selectedFuturesMarket, setSelectedFuturesMarket] = useState<'Global Futures' | 'Crypto Futures' | 'Spot'>('Global Futures');
  const [isFuturesDropdownOpen, setIsFuturesDropdownOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [favoritesList, setFavoritesList] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('lumina_favorites');
      return stored ? JSON.parse(stored) : ['XAU/USDT', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
    } catch {
      return ['XAU/USDT', 'BTC/USDT', 'ETH/USDT', 'SOL/USDT'];
    }
  });

  const toggleFavorite = useCallback((sym: string) => {
    setFavoritesList((prev) => {
      const next = prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym];
      try {
        localStorage.setItem('lumina_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Quick Order Execution states (matching screenshot)
  const [quickOrderType, setQuickOrderType] = useState<'Market' | 'Limit'>('Market');
  const [quickLeverage, setQuickLeverage] = useState<number>(30);
  const [quickMarginInput, setQuickMarginInput] = useState<string>('');

  // Mobile Responsiveness & Layout Mode
  const [viewMode, setViewMode] = useState<'simple' | 'pro'>('simple'); // Default to clean, simple mode
  const [mobileTab, setMobileTab] = useState<'chart' | 'trade' | 'signals' | 'orderbook' | 'positions'>('chart');
  const [mobilePositionsSubTab, setMobilePositionsSubTab] = useState<'positions' | 'orders' | 'history' | 'signals'>('positions');
  const [mobileSignalFilter, setMobileSignalFilter] = useState<'all' | 'buy' | 'sell' | 'high_confidence'>('all');
  const [layoutMode, setLayoutMode] = useState<'auto' | 'mobile' | 'desktop'>('auto');
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [uiDensity, setUiDensity] = useState<'med_small' | 'compact' | 'standard'>(() => {
    try {
      const saved = localStorage.getItem('lumina_ui_density');
      if (saved === 'compact' || saved === 'standard' || saved === 'med_small') return saved;
    } catch {}
    return 'med_small';
  });

  const handleSetUiDensity = (d: 'med_small' | 'compact' | 'standard') => {
    setUiDensity(d);
    try {
      localStorage.setItem('lumina_ui_density', d);
    } catch {}
  };

  // Visibility toggles for progressive disclosure on 1280px / standard displays (M-02)
  const [showPriceTickerBar, setShowPriceTickerBar] = useState(() => {
    try {
      const saved = localStorage.getItem('lumina_show_ticker_bar');
      if (saved !== null) return saved === 'true';
    } catch {}
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1440;
    }
    return false;
  });
  const [showMTFBar, setShowMTFBar] = useState(() => {
    try {
      const saved = localStorage.getItem('lumina_show_mtf_bar');
      if (saved !== null) return saved === 'true';
    } catch {}
    return false;
  });
  const [showProQuickBar, setShowProQuickBar] = useState(false);
  const [isMobileSwitchboardOpen, setIsMobileSwitchboardOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close tools menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick margin execution handler matching mobile fast action bar
  const handleExecuteQuickMarginOrder = useCallback((side: 'buy' | 'sell') => {
    if (currentMode === 'RESEARCH') return;

    const rawMargin = parseFloat(quickMarginInput);
    const margin = !isNaN(rawMargin) && rawMargin > 0 ? rawMargin : 41.19;
    const price = activeTicker.price || 4350.71;
    const lev = Math.min(quickLeverage, 3);
    const notional = margin * lev;
    const qty = Number((notional / price).toFixed(4));
    const safeQty = qty > 0 ? qty : 0.01;
    const reqMargin = +((safeQty * price) / lev).toFixed(2);
    const tpPrice = Number((price * (side === 'buy' ? 1.035 : 0.965)).toFixed(activeTicker.precision ?? 2));
    const slPrice = Number((price * (side === 'buy' ? 0.985 : 1.015)).toFixed(activeTicker.precision ?? 2));

    if (onRequestReviewOrder) {
      onRequestReviewOrder({
        idempotencyKey: `ORD-QUICK-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        symbol: currentPair,
        market: 'Perpetual Futures',
        side,
        quantity: safeQty,
        orderType: quickOrderType === 'Market' ? 'market' : 'limit',
        entryPrice: price,
        currentMarketPrice: price,
        leverage: lev,
        marginMode: 'cross',
        requiredMargin: reqMargin,
        tradingFeeEstimate: +(safeQty * price * 0.0004).toFixed(4),
        fundingEstimate: +(safeQty * price * 0.0001).toFixed(4),
        spreadEstimate: +(safeQty * price * 0.0002).toFixed(4),
        slippageEstimate: +(safeQty * price * 0.0002).toFixed(4),
        maxPlannedLoss: +(safeQty * price * 0.015).toFixed(2),
        takeProfit: tpPrice,
        stopLoss: slPrice,
        estimatedLiqPrice: side === 'buy' ? +(price * (1 - 1 / lev + 0.004)).toFixed(2) : +(price * (1 + 1 / lev - 0.004)).toFixed(2),
        accountBalanceAfterTrade: Math.max(0, +(balance - reqMargin).toFixed(2)),
        remainingBuyingPower: Math.max(0, +(balance - reqMargin).toFixed(2)),
        dataSource: 'Unified Real-Time Exchange Feed',
        dataTimestamp: Date.now(),
        isDataStale: false,
      });
      setQuickMarginInput('');
      return;
    }

    if (onPlaceQuickTrade) {
      onPlaceQuickTrade({
        symbol: currentPair,
        side,
        leverage: lev,
      });
    } else {
      onPlaceOrder({
        symbol: currentPair,
        type: quickOrderType === 'Market' ? 'market' : 'limit',
        side,
        price,
        amount: safeQty,
        leverage: lev,
        takeProfit: tpPrice,
        stopLoss: slPrice,
      });
    }
    setQuickMarginInput('');
    setMobileTab('positions');
  }, [currentMode, quickMarginInput, quickLeverage, quickOrderType, activeTicker, currentPair, onRequestReviewOrder, onPlaceQuickTrade, onPlaceOrder, balance]);

  // 5-Agent Quantitative Desk Signal Locking & Dynamic Auto-Refresh Management
  const [acceptedSignals, setAcceptedSignals] = useState<Record<string, AISignal>>(() => {
    try {
      const saved = localStorage.getItem('coindcx_accepted_signals');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [refreshedSignals, setRefreshedSignals] = useState<Record<string, AISignal>>({});
  const [isRefreshingAnalysis, setIsRefreshingAnalysis] = useState<boolean>(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('5-Agent Desk (CPR + SMC)');
  const [autoRefreshMode, setAutoRefreshMode] = useState<'off' | '15s' | '30s' | '1m' | '5m'>('30s');
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState<number>(30);
  const [signalCompletionStatus, setSignalCompletionStatus] = useState<{
    signalId: string;
    status: 'TP_HIT' | 'SL_HIT';
    hitPrice: number;
    hitTime: number;
    pnlPercent?: number;
  } | null>(null);
  const [lastHandledActiveSignalId, setLastHandledActiveSignalId] = useState<string | null>(null);

  const [terminalNotice, setTerminalNotice] = useState<{
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning';
    timestamp: number;
  } | null>(null);
  const noticeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showTerminalNotice = useCallback(
    (message: string, type: 'success' | 'info' | 'warning' = 'success', triggerId?: string) => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
      const id = triggerId || `notice_${Date.now()}`;
      setTerminalNotice({ id, message, type, timestamp: Date.now() });
      noticeTimerRef.current = setTimeout(() => {
        setTerminalNotice((curr) => (curr?.id === id ? null : curr));
      }, 3200);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  // Synchronize incoming activeSignal prop: attach signal without delayed toast spam
  useEffect(() => {
    if (activeSignal && activeSignal.symbol === currentPair) {
      if (activeSignal.id !== lastHandledActiveSignalId) {
        setLastHandledActiveSignalId(activeSignal.id);
        setSignalCompletionStatus(null);
        setRefreshedSignals((prev) => ({
          ...prev,
          [activeSignal.symbol]: activeSignal,
        }));
        // If there was an old accepted signal with a different ID, replace it so the new signal attaches immediately
        setAcceptedSignals((prev) => {
          if (prev[activeSignal.symbol] && prev[activeSignal.symbol].id !== activeSignal.id) {
            const next = { ...prev };
            delete next[activeSignal.symbol];
            try {
              localStorage.setItem('coindcx_accepted_signals', JSON.stringify(next));
            } catch {}
            return next;
          }
          return prev;
        });

        // Only notify if signal is fresh (within last 3 seconds), preventing delayed toast spam on re-renders
        const isFresh = activeSignal.timestamp && Date.now() - activeSignal.timestamp < 3000;
        if (isFresh) {
          showTerminalNotice(
            `⚡ Signal Attached: ${activeSignal.symbol} ${activeSignal.side} (${activeSignal.strategy || 'Quantitative Setup'})`,
            'success',
            `sig_attach_${activeSignal.id}`
          );
        }
      }
    }
  }, [activeSignal, currentPair, lastHandledActiveSignalId, showTerminalNotice]);

  // Compute stable effective signal for the current trading pair
  // Priority: 1. Active incoming signal -> 2. Refreshed calculation -> 3. Accepted/Locked signal -> 4. Radar list
  const effectiveSignal: AISignal | null = useMemo(() => {
    if (activeSignal && activeSignal.symbol === currentPair) {
      if (acceptedSignals[currentPair]?.id === activeSignal.id) {
        return acceptedSignals[currentPair];
      }
      return activeSignal;
    }
    if (refreshedSignals[currentPair]) {
      if (acceptedSignals[currentPair]?.id === refreshedSignals[currentPair].id) {
        return acceptedSignals[currentPair];
      }
      return refreshedSignals[currentPair];
    }
    if (acceptedSignals[currentPair]) {
      return acceptedSignals[currentPair];
    }
    const matching = aiSignals.find((s) => s.symbol === currentPair);
    return matching || null;
  }, [acceptedSignals, refreshedSignals, activeSignal, currentPair, aiSignals]);

  // Handler to Accept & Lock Signal Levels onto the chart
  const handleAcceptSignal = useCallback(
    (sig: AISignal) => {
      const lockedSig: AISignal = {
        ...sig,
        isAccepted: true,
        isLocked: true,
        lockedAt: Date.now(),
      };
      setAcceptedSignals((prev) => {
        const next = { ...prev, [sig.symbol]: lockedSig };
        try {
          localStorage.setItem('coindcx_accepted_signals', JSON.stringify(next));
        } catch {}
        return next;
      });
      playBreakoutChime();
      showTerminalNotice(
        `🔒 Signal Accepted! Entry ($${lockedSig.entryPrice.toFixed(
          activeTicker.precision
        )}), TP ($${lockedSig.target1.toFixed(
          activeTicker.precision
        )}), and SL ($${lockedSig.stopLoss.toFixed(
          activeTicker.precision
        )}) are locked as static markers on the chart.`,
        'success'
      );
    },
    [activeTicker.precision, showTerminalNotice]
  );

  // Single Source of Truth for trade setup across Chart, AI Card, Order Form, and Review Screen (Requirement 1 & 3)
  const [unifiedTradeSetup, setUnifiedTradeSetup] = useState<UnifiedTradeSetup>(() => {
    const curPrice = activeTicker.price;
    const isLong = !effectiveSignal || effectiveSignal.side === 'LONG';
    const entry = (effectiveSignal && effectiveSignal.symbol === currentPair) ? effectiveSignal.entryPrice : curPrice;
    const defaultTPSL = calculateDirectionalTPSL(isLong ? 'buy' : 'sell', entry, activeTicker.precision);
    const tp = (effectiveSignal && effectiveSignal.symbol === currentPair)
      ? effectiveSignal.target1
      : defaultTPSL.takeProfit;
    const sl = (effectiveSignal && effectiveSignal.symbol === currentPair)
      ? effectiveSignal.stopLoss
      : defaultTPSL.stopLoss;
    return {
      symbol: currentPair,
      side: isLong ? 'LONG' : 'SHORT',
      entry,
      takeProfit: tp,
      stopLoss: sl,
      timeframe,
      signalId: (effectiveSignal && effectiveSignal.symbol === currentPair) ? effectiveSignal.id : undefined,
      updatedAt: Date.now(),
    };
  });

  const prevTerminalPairRef = useRef<AssetPair>(currentPair);
  const prevTerminalSignalIdRef = useRef<string | undefined>(effectiveSignal?.id);
  useEffect(() => {
    const pairChanged = prevTerminalPairRef.current !== currentPair;
    const signalChanged = prevTerminalSignalIdRef.current !== effectiveSignal?.id;
    if (pairChanged || signalChanged) {
      prevTerminalPairRef.current = currentPair;
      prevTerminalSignalIdRef.current = effectiveSignal?.id;

      const curPrice = activeTicker.price;
      const isLong = !effectiveSignal || effectiveSignal.side === 'LONG';
      const entry = (effectiveSignal && effectiveSignal.symbol === currentPair) ? effectiveSignal.entryPrice : curPrice;
      const defaultTPSL = calculateDirectionalTPSL(isLong ? 'buy' : 'sell', entry, activeTicker.precision);
      const tp = (effectiveSignal && effectiveSignal.symbol === currentPair)
        ? effectiveSignal.target1
        : defaultTPSL.takeProfit;
      const sl = (effectiveSignal && effectiveSignal.symbol === currentPair)
        ? effectiveSignal.stopLoss
        : defaultTPSL.stopLoss;

      setUnifiedTradeSetup({
        symbol: currentPair,
        side: isLong ? 'LONG' : 'SHORT',
        entry,
        takeProfit: tp,
        stopLoss: sl,
        timeframe,
        signalId: (effectiveSignal && effectiveSignal.symbol === currentPair) ? effectiveSignal.id : undefined,
        updatedAt: Date.now(),
      });
    }
  }, [currentPair, effectiveSignal, timeframe, activeTicker.price, activeTicker.precision]);

  // Handler to Unlock Signal Levels
  const handleUnlockSignal = useCallback(
    (sym: AssetPair = currentPair) => {
      setAcceptedSignals((prev) => {
        const next = { ...prev };
        delete next[sym];
        try {
          localStorage.setItem('coindcx_accepted_signals', JSON.stringify(next));
        } catch {}
        return next;
      });
      showTerminalNotice(
        `Signal levels unlocked for ${sym}. You can now refresh analysis or lock a new setup.`,
        'info'
      );
    },
    [currentPair, showTerminalNotice]
  );

  // Handler to Clear / Dismiss Signal Levels from Chart & Storage ("jab nikal jay to wo hat jana chaya")
  const handleClearSignal = useCallback(
    (sym: AssetPair = currentPair) => {
      setAcceptedSignals((prev) => {
        const next = { ...prev };
        delete next[sym];
        try {
          localStorage.setItem('coindcx_accepted_signals', JSON.stringify(next));
        } catch {}
        return next;
      });
      setRefreshedSignals((prev) => {
        const next = { ...prev };
        delete next[sym];
        return next;
      });
      setSignalCompletionStatus(null);
      showTerminalNotice(`Signal cleared for ${sym}. Chart HUD reset.`, 'info');
    },
    [currentPair, showTerminalNotice]
  );

  // Stable refs for real-time tickers and candles to prevent handleRefreshAnalysis recreation
  const activeTickerRef = useRef(activeTicker);
  useEffect(() => {
    activeTickerRef.current = activeTicker;
  }, [activeTicker]);

  const candlesRef = useRef(candles);
  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);

  // Strategy-Driven Refresh Handler (5-Agent Desk or Selected Quant Strategy)
  const handleRefreshAnalysis = useCallback(
    (showNotification: boolean = true) => {
      setIsRefreshingAnalysis(true);
      if (showNotification) playBreakoutChime();

      const curTicker = activeTickerRef.current;
      const curCandles = candlesRef.current;

      let freshSignal: AISignal;
      if (selectedStrategy === '5-Agent Desk (CPR + SMC)') {
        freshSignal = calculate5AgentSignal(
          currentPair,
          curTicker.price,
          curTicker,
          curCandles,
          timeframe,
          false
        );
      } else {
        freshSignal = computeClientSignal(
          currentPair,
          curTicker.price,
          timeframe,
          selectedStrategy,
          'Balanced',
          85,
          {
            high24h: curTicker.high24h,
            low24h: curTicker.low24h,
            change24h: curTicker.change24h,
            volume24h: curTicker.volume24h,
            candles: curCandles,
          }
        );
      }

      setRefreshedSignals((prev) => ({
        ...prev,
        [currentPair]: freshSignal,
      }));
      setSignalCompletionStatus(null);

      // Remove any old accepted signal so user immediately sees fresh levels
      setAcceptedSignals((prev) => {
        if (!prev[currentPair]) return prev;
        const next = { ...prev };
        delete next[currentPair];
        try {
          localStorage.setItem('coindcx_accepted_signals', JSON.stringify(next));
        } catch {}
        return next;
      });

      setTimeout(() => {
        setIsRefreshingAnalysis(false);
        if (showNotification) {
          showTerminalNotice(
            `🔄 ${selectedStrategy} refreshed at $${curTicker.price.toFixed(
              curTicker.precision
            )}! Entry: $${freshSignal.entryPrice.toFixed(curTicker.precision)}, TP: $${freshSignal.target1.toFixed(
              curTicker.precision
            )}, SL: $${freshSignal.stopLoss.toFixed(curTicker.precision)}.`,
            'success'
          );
        }
      }, 300);
    },
    [currentPair, timeframe, selectedStrategy, showTerminalNotice]
  );

  // Real-Time Signal Exit & Target/SL Hit Detection ("jab nikal jay to wo hat jana chaya")
  useEffect(() => {
    if (!effectiveSignal || effectiveSignal.symbol !== currentPair) {
      return;
    }
    const currentP = activeTicker.price;
    if (!currentP || currentP <= 0) return;

    const isLong = effectiveSignal.side === 'LONG';
    const tp1 = effectiveSignal.target1;
    const sl = effectiveSignal.stopLoss;

    const isTpHit = isLong ? currentP >= tp1 : currentP <= tp1;
    const isSlHit = isLong ? currentP <= sl : currentP >= sl;

    if (isTpHit && signalCompletionStatus?.signalId !== effectiveSignal.id) {
      const pnl = effectiveSignal.rewardPercent || 3.2;
      setSignalCompletionStatus({
        signalId: effectiveSignal.id,
        status: 'TP_HIT',
        hitPrice: currentP,
        hitTime: Date.now(),
        pnlPercent: pnl,
      });
      playProfitHitChime();
      showTerminalNotice(
        `🎯 TAKE PROFIT 1 HIT! ${effectiveSignal.symbol} touched $${currentP.toFixed(activeTicker.precision)} (+${pnl}% Gain). Signal completed!`,
        'success'
      );
    } else if (isSlHit && signalCompletionStatus?.signalId !== effectiveSignal.id) {
      const loss = effectiveSignal.riskPercent || 1.5;
      setSignalCompletionStatus({
        signalId: effectiveSignal.id,
        status: 'SL_HIT',
        hitPrice: currentP,
        hitTime: Date.now(),
        pnlPercent: -loss,
      });
      playAlertChime();
      showTerminalNotice(
        `🛑 STOP LOSS HIT: ${effectiveSignal.symbol} reached invalidation at $${currentP.toFixed(activeTicker.precision)}. Signal exited.`,
        'warning'
      );
    }
  }, [effectiveSignal, activeTicker.price, currentPair, signalCompletionStatus, activeTicker.precision, showTerminalNotice]);

  // Auto-Clear Completed/Exited Signals after display window ("jab nikal jay to wo hat jana chaya")
  useEffect(() => {
    if (signalCompletionStatus) {
      const timer = setTimeout(() => {
        handleClearSignal(currentPair);
        // If auto-refresh is active, automatically calculate the next strategy-driven setup!
        if (autoRefreshMode !== 'off') {
          handleRefreshAnalysis(false);
        }
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [signalCompletionStatus, currentPair, autoRefreshMode, handleClearSignal, handleRefreshAnalysis]);

  // Stable refs for auto-refresh interval execution
  const effectiveSignalRef = useRef(effectiveSignal);
  useEffect(() => {
    effectiveSignalRef.current = effectiveSignal;
  }, [effectiveSignal]);

  const signalCompletionStatusRef = useRef(signalCompletionStatus);
  useEffect(() => {
    signalCompletionStatusRef.current = signalCompletionStatus;
  }, [signalCompletionStatus]);

  const handleRefreshAnalysisRef = useRef(handleRefreshAnalysis);
  useEffect(() => {
    handleRefreshAnalysisRef.current = handleRefreshAnalysis;
  }, [handleRefreshAnalysis]);

  // Background Auto-Refresh Interval Engine ("auto refresh hota rahi or sahi signal generat kary")
  useEffect(() => {
    if (autoRefreshMode === 'off') return;

    const intervalSec =
      autoRefreshMode === '15s' ? 15 : autoRefreshMode === '30s' ? 30 : autoRefreshMode === '1m' ? 60 : 300;
    setAutoRefreshCountdown(intervalSec);

    let remaining = intervalSec;
    const interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        remaining = intervalSec;
        const isLocked = effectiveSignalRef.current?.isAccepted || effectiveSignalRef.current?.isLocked;
        if (!isLocked || signalCompletionStatusRef.current) {
          handleRefreshAnalysisRef.current?.(false);
        }
      }
      setAutoRefreshCountdown(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshMode]);

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

  // High-Speed Quant Engine Execution Mode State ('PASSIVE_MAKER' | 'AGGRESSIVE_TAKER')
  const [quantMode, setQuantMode] = useState<QuantExecutionMode>('AGGRESSIVE_TAKER');
  const [isTogglingQuantMode, setIsTogglingQuantMode] = useState<boolean>(false);

  // Synchronize Quant Execution Mode from Backend Engine via Telemetry
  useEffect(() => {
    let isMounted = true;
    const fetchQuantTelemetry = async () => {
      try {
        const res = await fetch('/api/quant/telemetry');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.mode && (data.mode === 'PASSIVE_MAKER' || data.mode === 'AGGRESSIVE_TAKER')) {
            setQuantMode(data.mode);
          }
        }
      } catch {
        // Silent fallback on transient network hiccup
      }
    };

    fetchQuantTelemetry();
    const interval = setInterval(fetchQuantTelemetry, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Handler to toggle or set execution mode dynamically via backend API
  const handleToggleQuantMode = useCallback(
    async (targetMode?: QuantExecutionMode) => {
      if (isTogglingQuantMode) return;
      setIsTogglingQuantMode(true);
      try {
        const res = await fetch('/api/quant/action/toggle_mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: targetMode ? JSON.stringify({ mode: targetMode }) : undefined,
        });
        if (res.ok) {
          const data = await res.json();
          const nextMode: QuantExecutionMode =
            data.mode || (quantMode === 'PASSIVE_MAKER' ? 'AGGRESSIVE_TAKER' : 'PASSIVE_MAKER');
          setQuantMode(nextMode);
          playBreakoutChime();
          showTerminalNotice(
            `⚡ Quant Mode Switched to: ${
              nextMode === 'PASSIVE_MAKER'
                ? 'PASSIVE_MAKER (Post-Only Maker Rebate Mode)'
                : 'AGGRESSIVE_TAKER (Cross-Spread Taker Execution Mode)'
            }`,
            'success'
          );
        } else {
          showTerminalNotice('Failed to update Quant Mode on engine.', 'warning');
        }
      } catch (err: any) {
        showTerminalNotice(`Quant Mode API error: ${err.message}`, 'warning');
      } finally {
        setIsTogglingQuantMode(false);
      }
    },
    [quantMode, isTogglingQuantMode, showTerminalNotice]
  );

  const handleOpenToolModal = (modalId: string) => {
    switch (modalId) {
      case 'market_overview':
        onOpenMarketOverview?.();
        break;
      case 'copilot':
        onOpenCopilot();
        break;
      case 'alerts':
        onOpenAlertsModal?.(currentPair, activeTicker.price);
        break;
      case 'portfolio':
        onOpenPortfolio();
        break;
      case 'pip_calculator':
        onOpenPipCalculator?.(currentPair);
        break;
      case 'api_settings':
        onOpenApiSettings?.();
        break;
      case 'auto_alerts':
        onOpenAutoAlertsModal?.();
        break;
      case 'agent_deliberation':
        setIsAgentDeliberationOpen(true);
        break;
      case 'trade_learning':
        setIsTradeLearningTooltipOpen(true);
        break;
      case 'strategy_manager':
        setIsStrategyManagerOpen(true);
        break;
      case 'cpr_scanner':
        setIsCPRModalOpen(true);
        break;
      case 'smart_entry':
        setIsSmartEntryRadarOpen(true);
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
        if (onOpenEconomicCalendar) {
          onOpenEconomicCalendar();
        } else {
          setIsEcoCalendarOpen(true);
        }
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

  // Automated CPR Breakout / Breakdown Audio & Notification Alerts
  const lastCprCrossRef = useRef<'BULLISH' | 'BEARISH' | null>(null);
  useEffect(() => {
    if (!candles || candles.length < 2) return;
    const lastCandle = candles[candles.length - 1];
    const prevCandle = candles[candles.length - 2];
    const pivot = (prevCandle.high + prevCandle.low + prevCandle.close) / 3;
    const bc = (prevCandle.high + prevCandle.low) / 2;
    const tc = 2 * pivot - bc;
    const topCpr = Math.max(tc, bc);
    const bottomCpr = Math.min(tc, bc);

    if (lastCandle.close > topCpr && prevCandle.close <= topCpr) {
      if (lastCprCrossRef.current !== 'BULLISH') {
        lastCprCrossRef.current = 'BULLISH';
        playBreakoutChime('BULLISH');
        if (autoAlertEnabled) {
          speakSignalAlert(`${currentPair.split('/')[0]} CPR Top Central Bullish Breakout Confirmed`);
        }
      }
    } else if (lastCandle.close < bottomCpr && prevCandle.close >= bottomCpr) {
      if (lastCprCrossRef.current !== 'BEARISH') {
        lastCprCrossRef.current = 'BEARISH';
        playBreakoutChime('BEARISH');
        if (autoAlertEnabled) {
          speakSignalAlert(`${currentPair.split('/')[0]} CPR Bottom Central Bearish Breakdown Confirmed`);
        }
      }
    }
  }, [candles, currentPair, autoAlertEnabled]);

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
      } else if (e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsSmartEntryRadarOpen((prev) => !prev);
      } else if (e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setIsCPRModalOpen((prev) => !prev);
      } else if (e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsOrderFlowDeltaOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsMarketModalOpen(false);
        setIsCPRModalOpen(false);
        setIsSmartEntryRadarOpen(false);
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

  const handleSelectMainView = (view: ChartMainViewMode) => {
    setActiveMainView(view);
    if (view !== 'candles') {
      setViewMode('pro');
    }
  };

  // Smart searched coins list for quick dropdown
  const matchedQuickCoins = useMemo(() => {
    return searchCoins(pairFilter, quickCategory, 'volume');
  }, [pairFilter, quickCategory]);

  const activeAlertsForPair = alerts.filter(
    (a) => a.symbol === currentPair && a.status === 'active'
  ).length;
  const totalActiveAlerts = alerts.filter((a) => a.status === 'active').length;

  // Top Header Options Horizontal Scroll & Drag Handlers
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const [canHeaderScrollLeft, setCanHeaderScrollLeft] = useState(false);
  const [canHeaderScrollRight, setCanHeaderScrollRight] = useState(false);

  const checkHeaderScroll = useCallback(() => {
    const el = headerScrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    setCanHeaderScrollLeft(el.scrollLeft > 6);
    setCanHeaderScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  }, []);

  useEffect(() => {
    checkHeaderScroll();
    const handleResize = () => checkHeaderScroll();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(checkHeaderScroll, 200);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [checkHeaderScroll]);

  const scrollHeader = (direction: 'left' | 'right') => {
    if (headerScrollRef.current) {
      const scrollAmount = 260;
      headerScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkHeaderScroll, 320);
    }
  };

  // Search Dropdown Category Chips Scroll
  const pairCategoryScrollRef = useRef<HTMLDivElement>(null);
  const [canPairCatScrollLeft, setCanPairCatScrollLeft] = useState(false);
  const [canPairCatScrollRight, setCanPairCatScrollRight] = useState(true);

  const checkPairCatScroll = useCallback(() => {
    const el = pairCategoryScrollRef.current;
    if (!el) return;
    setCanPairCatScrollLeft(el.scrollLeft > 4);
    setCanPairCatScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const scrollPairCategory = (direction: 'left' | 'right') => {
    if (pairCategoryScrollRef.current) {
      pairCategoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -140 : 140,
        behavior: 'smooth',
      });
      setTimeout(checkPairCatScroll, 250);
    }
  };

  return (
    <div
      id="obsidian-trading-terminal-root"
      className={`flex flex-col h-[100dvh] w-full max-w-full overflow-hidden font-hanken ${
        terminalTheme === 'light' ? 'bg-white text-[#131722]' : 'bg-[#111417] text-[#e1e2e7]'
      }`}
    >
      {/* Platform Mode Indicator & Safety Banner */}
      <ModeSelectorBanner
        currentMode={currentMode}
        onModeChange={onModeChange}
        balance={balance}
      />

      {/* 1. Header Area: Renders clean, space-efficient Med-Small header on Mobile / Split-screen view */}
      {isMobile ? (
        <div className={`flex flex-col shrink-0 select-none z-40 border-b ${
          terminalTheme === 'light' ? 'bg-white border-[#e0e3eb] text-[#131722]' : 'bg-[#191c1f] border-[#272a2d] text-[#fff8f1]'
        }`}>
          {/* Main compact header row: ☰ Menu | Coin Badge (BTC • USDT) | Live Price & Change | Quick Density | Action Icons */}
          <div className="flex items-center justify-between px-2 py-1 gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Menu Hamburger Button */}
              <button
                onClick={() => setIsMobileToolsDrawerOpen(true)}
                className={`p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-[#00ff94] focus-visible:outline-none ${
                  terminalTheme === 'light' ? 'text-[#131722]' : 'text-[#fff8f1]'
                }`}
                title="Open Trading Tools & Navigation"
                aria-label="Open Trading Tools & Navigation"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Coin Badge */}
              <button
                onClick={() => setIsMarketModalOpen(true)}
                aria-label={`Select trading pair, currently ${currentPair}`}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-[#f6be16] focus-visible:outline-none ${
                  terminalTheme === 'light'
                    ? 'bg-[#f8fafc] border-[#e2e8f0] hover:bg-[#f1f5f9]'
                    : 'bg-[#272a2d] border-[#37393d] hover:bg-[#37393d]'
                }`}
              >
                <div className="w-4 h-4 rounded bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 font-black text-[9px] flex items-center justify-center font-mono">
                  {currentPair.slice(0, 3)}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span>{currentPair.replace('/', ' · ')}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-[#787b86]" />
                </div>
              </button>

              {/* Live Price + % Change - Compact Inline (Saves 40px of vertical height!) */}
              <div className="flex items-baseline gap-1 font-mono truncate">
                <span className={`text-sm sm:text-base font-black tracking-tight ${
                  terminalTheme === 'light' ? 'text-[#131722]' : 'text-white'
                }`}>
                  {activeTicker.price.toLocaleString('en-US', {
                    minimumFractionDigits: activeTicker.precision ?? 2,
                    maximumFractionDigits: activeTicker.precision ?? 2,
                  })}
                </span>
                <span className={`text-[10px] sm:text-[11px] font-bold ${
                  activeTicker.change24h >= 0 ? 'text-[#089981]' : 'text-[#f23645]'
                }`}>
                  {activeTicker.change24h >= 0 ? '+' : ''}{activeTicker.change24h.toFixed(2)}%
                </span>
                <span className={`text-[9px] font-medium inline ${
                  terminalTheme === 'light' ? 'text-[#787b86]' : 'text-[#99907f]'
                }`}>
                  ≈ ₹{(activeTicker.inrPrice || activeTicker.price * 102).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
                </span>
              </div>
            </div>

            {/* Right Action Icons: UI Density Badge, ★, 📊, 🔔, ⋮ */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Density Indicator / Quick Cycle Button */}
              <button
                onClick={() => {
                  const nextDensity = uiDensity === 'med_small' ? 'compact' : uiDensity === 'compact' ? 'standard' : 'med_small';
                  handleSetUiDensity(nextDensity);
                }}
                className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold border transition-colors cursor-pointer hidden xs:flex items-center gap-0.5 ${
                  uiDensity === 'med_small'
                    ? 'bg-[#00ff94]/15 text-[#00ff94] border-[#00ff94]/30'
                    : uiDensity === 'compact'
                      ? 'bg-[#3b82f6]/15 text-[#60a5fa] border-[#3b82f6]/30'
                      : terminalTheme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-300' : 'bg-[#272a2d] text-gray-300 border-[#37393d]'
                }`}
                title={`Current UI Size: ${uiDensity.replace('_', ' ').toUpperCase()}. Click to switch size.`}
                aria-label={`Current UI Size: ${uiDensity.replace('_', ' ').toUpperCase()}. Click to switch size.`}
              >
                <span>{uiDensity === 'med_small' ? 'Med-Sm' : uiDensity === 'compact' ? 'Compact' : 'Standard'}</span>
              </button>

              {/* Favorite Toggle Star */}
              <button
                onClick={() => toggleFavorite(currentPair)}
                className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                  favoritesList.includes(currentPair) ? 'text-[#f59e0b]' : 'text-[#787b86]'
                }`}
                title="Add to Favorites"
                aria-label={favoritesList.includes(currentPair) ? `Remove ${currentPair} from favorites` : `Add ${currentPair} to favorites`}
              >
                <Star className={`w-3.5 h-3.5 ${favoritesList.includes(currentPair) ? 'fill-[#f59e0b]' : ''}`} />
              </button>

              {/* Technical Indicators / Modal */}
              <button
                onClick={() => {
                  const btn = document.getElementById('chart-indicators-modal-btn');
                  if (btn) btn.click();
                  else setIsRiskCalcOpen(true);
                }}
                className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                  terminalTheme === 'light' ? 'text-[#131722]' : 'text-[#fff8f1]'
                }`}
                title="Indicators & Strategies (fx)"
                aria-label="Technical Indicators & Strategies (fx)"
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>

              {/* Price Alerts */}
              <button
                onClick={() => onOpenAlertsModal?.(currentPair, activeTicker.price)}
                className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                  terminalTheme === 'light' ? 'text-[#131722]' : 'text-[#fff8f1]'
                }`}
                title="Set Price Alert"
                aria-label={`Set price alert for ${currentPair}`}
              >
                <Bell className="w-3.5 h-3.5" />
              </button>

              {/* Auto Signal Alert (ON/OFF & Custom Stocks Modal) */}
              {onOpenAutoAlertsModal && (
                <button
                  id="terminal-auto-signals-btn"
                  onClick={onOpenAutoAlertsModal}
                  className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                    autoAlertEnabled
                      ? 'bg-[#00ff94]/15 hover:bg-[#00ff94]/25 text-[#00ff94] border-[#00ff94]/40 shadow-[0_0_8px_rgba(0,255,148,0.2)]'
                      : 'bg-[#ff3b4a]/10 hover:bg-[#ff3b4a]/20 text-[#ff3b4a] border-[#ff3b4a]/30'
                  }`}
                  title={autoAlertEnabled ? 'Signal Detection is ON. Click to customize stocks or toggle.' : 'Signal Detection is OFF. Click to turn ON & customize stocks.'}
                  aria-label={autoAlertEnabled ? 'Automatic signal detection is enabled. Click to configure.' : 'Automatic signal detection is disabled. Click to configure.'}
                >
                  <Zap className={`w-3 h-3 ${autoAlertEnabled ? 'text-[#00ff94]' : 'text-[#ff3b4a]'}`} />
                  <span className="hidden md:inline">Signals:</span>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-black ${
                    autoAlertEnabled ? 'bg-[#00ff94]/20 text-[#00ff94]' : 'bg-[#ff3b4a]/20 text-[#ff3b4a]'
                  }`}>
                    {autoAlertEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>
              )}

              {/* More Options Menu (⋮) */}
              <div className="relative">
                <button
                  onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
                  className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                    terminalTheme === 'light' ? 'text-[#131722]' : 'text-[#fff8f1]'
                  }`}
                  title="Options & Settings"
                  aria-label="Options and settings menu"
                  aria-haspopup="true"
                  aria-expanded={isOptionsMenuOpen}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {isOptionsMenuOpen && (
                  <div className={`absolute right-0 top-full mt-1 w-52 rounded-xl shadow-2xl border py-1.5 z-50 animate-fadeIn ${
                    terminalTheme === 'light' ? 'bg-white border-[#e0e3eb] text-[#131722]' : 'bg-[#191c1f] border-[#272a2d] text-white'
                  }`}>
                    {/* UI Size / Density Selector */}
                    <div className="px-3 py-1.5 border-b border-black/5 dark:border-white/5">
                      <div className="text-[10px] uppercase font-bold text-[#787b86] mb-1">UI Size / Density</div>
                      <div className="grid grid-cols-3 gap-1">
                        {(['med_small', 'compact', 'standard'] as const).map((d) => (
                          <button
                            key={d}
                            onClick={() => handleSetUiDensity(d)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                              uiDensity === d
                                ? 'bg-[#00ff94]/20 text-[#00ff94] border-[#00ff94]/60'
                                : 'bg-black/5 dark:bg-white/5 text-[#787b86] border-transparent'
                            }`}
                          >
                            {d === 'med_small' ? 'Med-Sm' : d === 'compact' ? 'Compact' : 'Standard'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Theme Toggle */}
                    <button
                      onClick={() => {
                        toggleTerminalTheme();
                        setIsOptionsMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {terminalTheme === 'light' ? <Moon className="w-3.5 h-3.5 text-[#2563eb]" /> : <Sun className="w-3.5 h-3.5 text-[#f59e0b]" />}
                        <span>Theme: {terminalTheme === 'light' ? 'Light' : 'Dark'}</span>
                      </div>
                      <span className="text-[10px] text-[#787b86]">Toggle</span>
                    </button>

                    {/* Currency Toggle */}
                    <button
                      onClick={() => {
                        toggleCurrencyMode();
                        setIsOptionsMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Coins className="w-3.5 h-3.5 text-[#089981]" />
                        <span>Currency: {currencyMode}</span>
                      </div>
                      <span className="text-[10px] text-[#787b86]">Switch</span>
                    </button>

                    {/* Auto Signal Alert Settings & Custom Stocks */}
                    {onOpenAutoAlertsModal && (
                      <button
                        onClick={() => {
                          onOpenAutoAlertsModal();
                          setIsOptionsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-[#00ff94]"
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Signal Alerts & Custom Stocks</span>
                        </div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          autoAlertEnabled ? 'bg-[#00ff94]/20 text-[#00ff94]' : 'bg-[#ff3b4a]/20 text-[#ff3b4a]'
                        }`}>
                          {autoAlertEnabled ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    )}

                    {/* Markets Overview */}
                    {onOpenMarketOverview && (
                      <button
                        onClick={() => {
                          onOpenMarketOverview();
                          setIsOptionsMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5 text-[#2563eb]" />
                        <span>Global Markets</span>
                      </button>
                    )}

                    {/* Reset All Market API Data */}
                    {onResetCoinDCXPrices && (
                      <button
                        onClick={() => {
                          onResetCoinDCXPrices();
                          setIsOptionsMenuOpen(false);
                        }}
                        disabled={isResettingPrices}
                        className="w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-[#3b82f6]"
                      >
                        <div className="flex items-center gap-2">
                          <RefreshCw className={`w-3.5 h-3.5 ${isResettingPrices ? 'animate-spin' : ''}`} />
                          <span>Reset All API Data</span>
                        </div>
                        <span className="text-[10px] text-[#787b86]">Live Sync</span>
                      </button>
                    )}

                    {/* Showcase */}
                    <button
                      onClick={() => {
                        onReturnToHero();
                        setIsOptionsMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer border-t border-black/5 dark:border-white/5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#787b86]" />
                      <span>Back to Showcase</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Sub-Navigation Tabs: Chart | Trade | Positions | Orders | (Right: Market category ▾ & History 🕒) */}
          <div className="flex items-center justify-between px-2 border-t border-black/5 dark:border-white/5 text-[11px] font-bold">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileTab('chart')}
                className={`py-1 relative cursor-pointer ${
                  mobileTab === 'chart'
                    ? 'text-[#2563eb]'
                    : terminalTheme === 'light' ? 'text-[#787b86] hover:text-[#131722]' : 'text-[#99907f] hover:text-white'
                }`}
              >
                <span>Chart</span>
                {mobileTab === 'chart' && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#2563eb] rounded-full" />
                )}
              </button>

              <button
                onClick={() => setMobileTab('trade')}
                className={`py-1 relative cursor-pointer ${
                  mobileTab === 'trade'
                    ? 'text-[#2563eb]'
                    : terminalTheme === 'light' ? 'text-[#787b86] hover:text-[#131722]' : 'text-[#99907f] hover:text-white'
                }`}
              >
                <span>Trade</span>
                {mobileTab === 'trade' && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#2563eb] rounded-full" />
                )}
              </button>

              <button
                onClick={() => {
                  setMobileTab('positions');
                  setMobilePositionsSubTab('positions');
                }}
                className={`py-1 relative cursor-pointer flex items-center gap-1 ${
                  mobileTab === 'positions' && mobilePositionsSubTab === 'positions'
                    ? 'text-[#2563eb]'
                    : terminalTheme === 'light' ? 'text-[#787b86] hover:text-[#131722]' : 'text-[#99907f] hover:text-white'
                }`}
              >
                <span>Positions</span>
                {positions.length > 0 && (
                  <span className="px-1 py-0.2 bg-[#2563eb] text-white rounded-full text-[8.5px] font-extrabold">
                    {positions.length}
                  </span>
                )}
                {mobileTab === 'positions' && mobilePositionsSubTab === 'positions' && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#2563eb] rounded-full" />
                )}
              </button>

              <button
                onClick={() => {
                  setMobileTab('positions');
                  setMobilePositionsSubTab('orders');
                }}
                className={`py-1 relative cursor-pointer flex items-center gap-1 ${
                  mobileTab === 'positions' && mobilePositionsSubTab === 'orders'
                    ? 'text-[#2563eb]'
                    : terminalTheme === 'light' ? 'text-[#787b86] hover:text-[#131722]' : 'text-[#99907f] hover:text-white'
                }`}
              >
                <span>Orders</span>
                {openOrders.length > 0 && (
                  <span className="px-1 py-0.2 bg-[#f59e0b] text-white rounded-full text-[8.5px] font-extrabold">
                    {openOrders.length}
                  </span>
                )}
                {mobileTab === 'positions' && mobilePositionsSubTab === 'orders' && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#2563eb] rounded-full" />
                )}
              </button>
            </div>

            {/* Right side of Tab bar: Market Category Selector & History Clock */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <button
                  onClick={() => setIsFuturesDropdownOpen(!isFuturesDropdownOpen)}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer border ${
                    terminalTheme === 'light'
                      ? 'bg-gray-50 border-gray-200 text-[#475569] hover:bg-gray-100'
                      : 'bg-[#272a2d]/60 border-[#37393d] text-[#d0c5b3] hover:bg-[#272a2d]'
                  }`}
                >
                  <span>{selectedFuturesMarket}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-[#787b86]" />
                </button>

                {isFuturesDropdownOpen && (
                  <div className={`absolute right-0 top-full mt-1 w-36 rounded-lg shadow-xl border py-1 z-50 animate-fadeIn ${
                    terminalTheme === 'light' ? 'bg-white border-[#e0e3eb] text-[#131722]' : 'bg-[#191c1f] border-[#272a2d] text-white'
                  }`}>
                    {(['Global Futures', 'Crypto Futures', 'Spot'] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedFuturesMarket(m);
                          setIsFuturesDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1 text-[11px] font-semibold flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/10 ${
                          selectedFuturesMarket === m ? 'text-[#2563eb] font-bold' : ''
                        }`}
                      >
                        <span>{m}</span>
                        {selectedFuturesMarket === m && <Check className="w-3 h-3 text-[#2563eb]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* History Clock Icon */}
              <button
                onClick={() => setIsTradeJournalOpen(true)}
                className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                  terminalTheme === 'light' ? 'text-[#787b86] hover:text-[#131722]' : 'text-[#99907f] hover:text-white'
                }`}
                title="Trade History & Journal"
                aria-label="Trade History & Journal"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
        {/* Desktop Header Strip */}
        <header className="flex items-center px-1.5 sm:px-2.5 h-11 sm:h-12 bg-[#191c1f] border-b border-[#272a2d] select-none relative z-40 gap-1.5 sm:gap-2 shrink-0 w-full max-w-full overflow-hidden">
        <h1 className="sr-only">Lumina Trade Institutional Trading Terminal - {currentPair}</h1>
        {/* Left: Brand & Pair Selector & Quick Search Anchor */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 z-30">
          {/* Back to Hero Link */}
          <a
            href="#showcase"
            onClick={(e) => {
              e.preventDefault();
              onReturnToHero();
            }}
            aria-label="Return to Hero Showcase"
            className="flex items-center gap-1 text-xs text-[#99907f] hover:text-[#fff8f1] p-1.5 sm:px-2 sm:py-1 rounded hover:bg-[#272a2d] transition-colors cursor-pointer"
            title="Return to Hero Showcase"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span className="hidden md:inline">Showcase</span>
          </a>

          <div className="w-[1px] h-4 bg-[#272a2d] hidden sm:block" />

          {/* Logo */}
          <div className="hidden sm:flex items-center gap-1.5 font-bold text-[#fff8f1] text-sm" aria-hidden="true">
            <Activity className="w-4 h-4 text-[#f6be16]" />
            <span className="hidden lg:inline">Lumina</span>
          </div>

          {/* Market Overview Dashboard Navigation Link */}
          {onOpenMarketOverview && (
            <a
              href="#markets"
              onClick={(e) => {
                e.preventDefault();
                onOpenMarketOverview();
              }}
              aria-label="Open Global Financial Market Overview (Gold, Silver, Forex, Stocks, Indices)"
              className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/40 rounded-lg text-xs font-bold text-[#10b981] transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.2)]"
              title="Open Global Financial Market Overview (Gold, Silver, Forex, Stocks, Indices)"
            >
              <Globe className="w-3.5 h-3.5 text-[#10b981]" aria-hidden="true" />
              <span>Markets</span>
            </a>
          )}

          {/* Asset Dropdown / Quick Market Search */}
          <div className="relative" ref={pairDropdownRef}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPairDropdownOpen(!isPairDropdownOpen)}
                aria-label={`Select trading pair. Currently trading ${currentPair}`}
                aria-haspopup="listbox"
                aria-expanded={isPairDropdownOpen}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 bg-[#272a2d] hover:bg-[#37393d] rounded-lg text-xs font-bold text-[#fff8f1] border border-[#37393d] transition-colors cursor-pointer"
                title="Select trading pair"
              >
                <span className="max-w-[78px] sm:max-w-none truncate">{currentPair}</span>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#99907f] shrink-0" aria-hidden="true" />
              </button>

              <button
                onClick={() => setIsMarketModalOpen(true)}
                aria-label="Search all 30+ markets"
                className="flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-[#191c1f] hover:bg-[#272a2d] border border-[#272a2d] hover:border-[#f6be16]/50 rounded-lg text-xs text-[#99907f] hover:text-[#fff8f1] transition-all cursor-pointer"
                title="Search all 30+ markets (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-[#f6be16]" aria-hidden="true" />
                <span className="text-[11px] font-medium hidden xs:inline">Search</span>
                <kbd className="text-[9px] px-1 py-0.2 bg-[#272a2d] text-[#d0c5b3] rounded hidden sm:inline">⌘K</kbd>
              </button>
            </div>

            {isPairDropdownOpen && (
              <div className="fixed inset-x-2 top-12 sm:absolute sm:top-full sm:left-0 sm:inset-x-auto sm:w-96 bg-[#191c1f] border border-[#272a2d] rounded-xl shadow-2xl py-2 z-[100] animate-fadeIn ring-1 ring-white/10 max-h-[80vh] flex flex-col">
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
                        aria-label="Clear pair filter"
                        className="absolute right-2 text-[#99907f] hover:text-[#fff8f1] text-xs p-0.5"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Category Quick Chips with Left & Right scroll buttons */}
                  <div className="relative flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollPairCategory('left')}
                      className={`p-1 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1] transition-colors shrink-0 ${
                        canPairCatScrollLeft ? 'opacity-100' : 'opacity-40'
                      }`}
                      title="Scroll Left"
                      aria-label="Scroll market categories left"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <div
                      ref={pairCategoryScrollRef}
                      onScroll={checkPairCatScroll}
                      className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth text-[11px] flex-1"
                    >
                      {[
                        { id: 'all', label: 'All' },
                        { id: 'commodities', label: 'Gold & Silver' },
                        { id: 'forex', label: 'Forex' },
                        { id: 'stocks', label: 'Stocks' },
                        { id: 'hot', label: 'High Volatility' },
                        { id: 'layer1', label: 'Layer 1' },
                        { id: 'ai', label: 'AI & Data' },
                        { id: 'defi', label: 'DeFi' },
                        { id: 'meme', label: 'High Beta' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setQuickCategory(cat.id as MarketCategory)}
                          aria-pressed={quickCategory === cat.id}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold shrink-0 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#f6be16] focus-visible:outline-none ${
                            quickCategory === cat.id
                              ? 'bg-[#f6be16] text-[#111417]'
                              : 'bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => scrollPairCategory('right')}
                      className={`p-1 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1] transition-colors shrink-0 ${
                        canPairCatScrollRight ? 'opacity-100' : 'opacity-40'
                      }`}
                      title="Scroll Right"
                      aria-label="Scroll market categories right"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
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
        </div>

        {/* Live Price Tag with Dual USDT / CoinDCX INR Display */}
        <div className="flex items-center gap-1.5 font-mono shrink-0">
          <div className="flex items-baseline gap-1.5">
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
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                activeTicker.change24h >= 0 ? 'bg-[#00ff94]/15 text-[#00ff94]' : 'bg-[#ff3b4a]/15 text-[#ff3b4a]'
              }`}
            >
              {activeTicker.change24h >= 0
                ? `+${activeTicker.change24h.toFixed(2)}%`
                : `${activeTicker.change24h.toFixed(2)}%`}
            </span>
          </div>

          {/* Currency Switcher Toggle (USDT / INR) */}
          {activeTicker.inrPrice && (
            <button
              type="button"
              onClick={toggleCurrencyMode}
              aria-label={`Switch currency rate to ${currencyMode === 'USDT' ? 'INR' : 'USD'}`}
              className="px-1.5 py-0.5 rounded bg-[#22262c] hover:bg-[#2c323b] border border-[#323741] text-[10px] font-bold text-[#f6be16] transition-colors cursor-pointer"
              title={`Switch currency rate. Conversion: ₹${activeTicker.usdtInrRate || 98.63}`}
            >
              <span>{currencyMode === 'USDT' ? '₹ INR' : '$ USD'}</span>
            </button>
          )}

          {/* Quick Alert Button for Active Coin */}
          {onOpenAlertsModal && (
            <button
              type="button"
              onClick={() => onOpenAlertsModal(currentPair, activeTicker.price)}
              aria-label={`Set price alert for ${currentPair}`}
              className={`p-1 rounded transition-colors cursor-pointer ${
                activeAlertsForPair > 0
                  ? 'bg-[#f6be16]/20 text-[#f6be16] border border-[#f6be16]/40'
                  : 'text-[#99907f] hover:text-[#f6be16] hover:bg-[#272a2d]'
              }`}
              title={`Set price alert for ${currentPair}`}
            >
              <BellRing className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Center: Clean Muted 24h Market Stats (Visible on desktop/laptop) */}
        <div className="hidden xl:flex items-center gap-3.5 text-[11px] font-mono text-[#8a919e] shrink-0">
          <div>
            <span className="block text-[9px] text-[#6b7280] uppercase">24h High</span>
            <span className="text-[#d1d5db]">
              {currencyMode === 'INR' && activeTicker.inrHigh24h
                ? `₹${activeTicker.inrHigh24h.toLocaleString('en-IN')}`
                : `$${activeTicker.high24h.toFixed(activeTicker.precision)}`}
            </span>
          </div>
          <div>
            <span className="block text-[9px] text-[#6b7280] uppercase">24h Low</span>
            <span className="text-[#d1d5db]">
              {currencyMode === 'INR' && activeTicker.inrLow24h
                ? `₹${activeTicker.inrLow24h.toLocaleString('en-IN')}`
                : `$${activeTicker.low24h.toFixed(activeTicker.precision)}`}
            </span>
          </div>
          <div>
            <span className="block text-[9px] text-[#6b7280] uppercase">24h Vol</span>
            <span className="text-[#d1d5db]">{activeTicker.volume24h.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
          <div>
            <span className="block text-[9px] text-[#6b7280] uppercase">Funding</span>
            <span className="text-[#ffd87f]">{(activeTicker.fundingRate * 100).toFixed(4)}%</span>
          </div>
        </div>

        {/* Right: Clean View Switcher, Chart Mode, 5-Agent Desk, Tools Menu, Tickers Toggle, Copilot, Balance */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
          {/* Mode Switcher: Simple vs Pro */}
          <div className="flex items-center bg-[#111417] p-0.5 rounded-lg border border-[#272a2d]">
            <button
              onClick={() => setViewMode('simple')}
              aria-label="Switch to Clean, Simple Trading View"
              aria-pressed={viewMode === 'simple'}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'simple'
                  ? 'bg-[#00ff94] text-[#002111] shadow-[0_0_10px_rgba(0,255,148,0.3)]'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Switch to Clean, Simple Trading View"
            >
              <Sparkles className="w-3 h-3" />
              <span>Simple</span>
            </button>
            <button
              onClick={() => setViewMode('pro')}
              aria-label="Switch to Full Institutional Pro Terminal"
              aria-pressed={viewMode === 'pro'}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'pro'
                  ? 'bg-[#f6be16] text-[#191400] shadow-[0_0_10px_rgba(246,190,22,0.3)]'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Switch to Full Institutional Pro Terminal"
            >
              <BarChart2 className="w-3 h-3" />
              <span>Pro</span>
            </button>
          </div>

          {/* Pro-Only: Chart Switcher Dropdown */}
          {viewMode === 'pro' && (
            <div className="relative hidden md:block">
              <button
                id="chart-switch-btn"
                onClick={() => setIsChartSwitchDropdownOpen(!isChartSwitchDropdownOpen)}
                aria-label="Switch Chart Mode"
                aria-expanded={isChartSwitchDropdownOpen}
                aria-haspopup="true"
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#22262c] hover:bg-[#2c323b] border border-[#323741] text-xs font-mono font-bold text-[#00ff94] transition-colors cursor-pointer"
                title="Switch Chart Mode"
              >
                <Activity className="w-3.5 h-3.5 text-[#00ff94]" />
                <span className="hidden lg:inline capitalize">
                  {activeMainView === 'candles'
                    ? 'Candles'
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
                <div className="fixed top-12 right-20 sm:right-40 w-56 bg-[#191c1f] border border-[#272a2d] rounded-lg shadow-2xl p-1.5 z-[100] flex flex-col gap-1 font-mono text-xs">
                  <div className="px-2 py-1 text-[10px] text-[#99907f] uppercase font-bold border-b border-[#272a2d]">
                    Chart Mode
                  </div>
                  {[
                    { id: 'candles', label: 'Candlestick Chart', icon: BarChart2, desc: 'Classic View' },
                    { id: 'liquidity_heatmap', label: 'Liquidity Heatmap', icon: Flame, desc: 'Order Walls' },
                    { id: 'market_profile', label: 'TPO Market Profile', icon: Compass, desc: 'Value Area 70%' },
                    { id: 'dom_ladder', label: 'DOM Execution Ladder', icon: Zap, desc: '1-Click Direct' },
                    { id: 'multi_chart', label: 'Multi-Chart Split Grid', icon: LayoutGrid, desc: '1x / 2x / 4x' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = activeMainView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          handleSelectMainView(item.id as ChartMainViewMode);
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
          )}

          {/* 5-Agent Quantitative Desk Button */}
          <button
            id="terminal-5agent-desk-btn"
            aria-expanded={isAgentDeliberationOpen}
            aria-controls="agent-deliberation-drawer"
            aria-label="Open 5-Agent Quantitative Desk Deliberation"
            onClick={() => setIsAgentDeliberationOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.2)] ${
              isAgentDeliberationOpen
                ? 'bg-[#3b82f6]/30 text-[#93c5fd] border-[#3b82f6] ring-1 ring-[#3b82f6]'
                : 'bg-[#3b82f6]/15 hover:bg-[#3b82f6]/25 text-[#60a5fa] border-[#3b82f6]/40'
            }`}
            title="Open 5-Agent Quantitative Desk Deliberation (Scout, Analyst, News, Validator, Risk Controller)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#60a5fa]" />
            <span className="hidden sm:inline font-bold">5-Agent Desk</span>
            <span className="text-[9px] px-1 py-0.2 bg-[#3b82f6]/30 text-[#bfdbfe] rounded font-bold">1:2+</span>
          </button>

          {/* Unified Organized Tools Dropdown Menu */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => {
                if (isMobile) {
                  setIsMobileToolsDrawerOpen(true);
                } else {
                  setIsToolsMenuOpen(!isToolsMenuOpen);
                }
              }}
              aria-label="All Trading & Analysis Tools"
              aria-expanded={isToolsMenuOpen || isMobileToolsDrawerOpen}
              aria-haspopup="true"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                (isToolsMenuOpen || isMobileToolsDrawerOpen)
                  ? 'bg-[#f6be16] text-[#111417] border-[#f6be16] shadow-[0_0_12px_rgba(246,190,22,0.3)]'
                  : 'bg-[#22262c] hover:bg-[#2c323b] text-[#e1e2e7] border-[#323741]'
              }`}
              title="All Trading & Analysis Tools"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#f6be16]" />
              <span className="hidden sm:inline">Tools</span>
              <ChevronDown className="w-3 h-3 text-[#99907f] hidden sm:inline" />
            </button>

            {isToolsMenuOpen && (
              <div className="fixed right-3 top-12 w-80 sm:w-96 max-h-[85vh] overflow-y-auto bg-[#191c1f] border border-[#272a2d] rounded-xl shadow-2xl p-3 z-[100] animate-fadeIn divide-y divide-[#272a2d] ring-1 ring-white/10">
                {/* Header */}
                <div className="pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-[#f6be16]" />
                    <span className="text-xs font-bold text-[#fff8f1]">Institutional Trading Suite</span>
                  </div>
                  <span className="text-[10px] text-[#99907f] font-mono">Tools Hub</span>
                </div>

                {/* Section 1: Execution & Quant Desk */}
                <div className="py-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider px-1">
                    ⚡ Execution & Arbitrage
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    <button
                      id="tools-quant-console-btn"
                      onClick={() => {
                        setIsQuantConsoleOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-colors cursor-pointer border border-emerald-500/30"
                    >
                      <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 fill-current" />
                      <div>
                        <div className="text-xs font-bold text-emerald-300">Quant Lead-Lag Arb</div>
                        <div className="text-[10px] text-emerald-400/80">Binance 50Hz Signal</div>
                      </div>
                    </button>

                    <div className="p-2 rounded-lg bg-[#272a2d]/50 border border-[#37393d]/50 flex flex-col justify-between">
                      <div className="text-[10px] text-[#99907f] font-bold">Arb Exec Mode:</div>
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          type="button"
                          disabled={isTogglingQuantMode}
                          onClick={() => handleToggleQuantMode('PASSIVE_MAKER')}
                          className={`flex-1 py-1 text-[9px] font-bold rounded cursor-pointer ${
                            quantMode === 'PASSIVE_MAKER'
                              ? 'bg-amber-400 text-black'
                              : 'bg-[#1e2124] text-[#99907f]'
                          }`}
                        >
                          Maker
                        </button>
                        <button
                          type="button"
                          disabled={isTogglingQuantMode}
                          onClick={() => handleToggleQuantMode('AGGRESSIVE_TAKER')}
                          className={`flex-1 py-1 text-[9px] font-bold rounded cursor-pointer ${
                            quantMode === 'AGGRESSIVE_TAKER'
                              ? 'bg-rose-500 text-white'
                              : 'bg-[#1e2124] text-[#99907f]'
                          }`}
                        >
                          Taker
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsCPRModalOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#ffd87f]/40"
                    >
                      <Scale className="w-4 h-4 text-[#ffd87f] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Arbitrage Spread</div>
                        <div className="text-[10px] text-[#99907f]">CoinDCX vs Binance</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsAutoBotOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#a855f7]/40"
                    >
                      <Zap className="w-4 h-4 text-[#a855f7] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Auto Bot</div>
                        <div className="text-[10px] text-[#99907f]">Automated rules</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Section 2: Order Flow & Signals */}
                <div className="py-2">
                  <span className="text-[10px] uppercase font-bold text-[#99907f] tracking-wider px-1">
                    🎯 Scanners & Market Flow
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    <button
                      onClick={() => {
                        setIsSmartEntryRadarOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#ffd87f]/40"
                    >
                      <Zap className="w-4 h-4 text-[#ffd87f] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#ffd87f]">Smart Entry</div>
                        <div className="text-[10px] text-[#99907f]">Kab Entry Lu?</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsWhaleTrackerOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#00ff94]/40"
                    >
                      <Fish className="w-4 h-4 text-[#00ff94] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Whale Tracker</div>
                        <div className="text-[10px] text-[#99907f]">Smart money flow</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsLiquidationModalOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#ff4d4d]/40"
                    >
                      <Flame className="w-4 h-4 text-[#ff4d4d] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Liq Heatmap</div>
                        <div className="text-[10px] text-[#99907f]">Squeeze levels</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsOrderFlowDeltaOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#38bdf8]/40"
                    >
                      <Activity className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Delta & OI</div>
                        <div className="text-[10px] text-[#99907f]">CVD accumulation</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsMTFOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#00ff94]/40"
                    >
                      <Layers className="w-4 h-4 text-[#00ff94] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">MTF Matrix</div>
                        <div className="text-[10px] text-[#99907f]">1m to 1D confluence</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsStrategyHubOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#00ff94]/40"
                    >
                      <Target className="w-4 h-4 text-[#00ff94] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Strategy Hub</div>
                        <div className="text-[10px] text-[#99907f]">All-crypto matrix</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Section 3: Risk, Simulation & Learning */}
                <div className="py-2">
                  <span className="text-[10px] uppercase font-bold text-[#99907f] tracking-wider px-1">
                    📊 Risk, Simulation & Guide
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    <button
                      onClick={() => {
                        setIsRiskCalcOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#f6be16]/40"
                    >
                      <Calculator className="w-4 h-4 text-[#f6be16] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Risk Calculator</div>
                        <div className="text-[10px] text-[#99907f]">Position sizing</div>
                      </div>
                    </button>

                    {onOpenPipCalculator && (
                      <button
                        onClick={() => {
                          onOpenPipCalculator(currentPair);
                          setIsToolsMenuOpen(false);
                        }}
                        className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#38bdf8]/40"
                      >
                        <Coins className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-[#fff8f1]">Pip & Lot Calc</div>
                          <div className="text-[10px] text-[#99907f]">Forex / Gold lots</div>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsBarReplayOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#ffd87f]/40"
                    >
                      <History className="w-4 h-4 text-[#ffd87f] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Bar Replay</div>
                        <div className="text-[10px] text-[#99907f]">Practice simulator</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsTradeJournalOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#00ff94]/40"
                    >
                      <BookOpen className="w-4 h-4 text-[#00ff94] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Trade Journal</div>
                        <div className="text-[10px] text-[#99907f]">PnL share cards</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsBacktesterOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#ffd87f]/40"
                    >
                      <FlaskConical className="w-4 h-4 text-[#ffd87f] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Backtester</div>
                        <div className="text-[10px] text-[#99907f]">Historical test</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsEcoCalendarOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#272a2d]/50 hover:bg-[#272a2d] text-left transition-colors cursor-pointer border border-[#37393d]/50 hover:border-[#38bdf8]/40"
                    >
                      <Calendar className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#fff8f1]">Macro Calendar</div>
                        <div className="text-[10px] text-[#99907f]">CPI & FOMC events</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsTradeGuideOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-[#ffd87f]/10 hover:bg-[#ffd87f]/20 text-left transition-colors cursor-pointer border border-[#f6be16]/40"
                    >
                      <HelpCircle className="w-4 h-4 text-[#f6be16] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-[#ffd87f]">💡 कैसे ट्रेड लें?</div>
                        <div className="text-[10px] text-[#99907f]">Trade & Profit guide</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setIsTradeLearningTooltipOpen(true);
                        setIsToolsMenuOpen(false);
                      }}
                      className="flex items-start gap-2 p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-left transition-colors cursor-pointer border border-blue-500/30"
                    >
                      <GraduationCap className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-blue-300">5-Agent Tour</div>
                        <div className="text-[10px] text-[#99907f]">Interactive walk</div>
                      </div>
                    </button>
                  </div>

                  {/* Clean Laptop View Toggles */}
                  <div className="mt-3 pt-3 border-t border-[#272a2d]">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#99907f] font-bold mb-2">
                      Screen Layout &amp; De-Clutter
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setShowPriceTickerBar((prev) => !prev)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                          showPriceTickerBar
                            ? 'bg-[#00ff94]/15 text-[#00ff94] border-[#00ff94]/40'
                            : 'bg-[#22262c] text-[#787b86] border-[#323741]'
                        }`}
                      >
                        <span>Tickers</span>
                        <span className="font-bold text-[9px]">{showPriceTickerBar ? 'ON' : 'OFF'}</span>
                      </button>

                      <button
                        onClick={() => setShowMTFBar((prev) => !prev)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                          showMTFBar
                            ? 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/40'
                            : 'bg-[#22262c] text-[#787b86] border-[#323741]'
                        }`}
                      >
                        <span>MTF Bar</span>
                        <span className="font-bold text-[9px]">{showMTFBar ? 'ON' : 'OFF'}</span>
                      </button>

                      <button
                        onClick={() => setShowProQuickBar((prev) => !prev)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                          showProQuickBar
                            ? 'bg-[#ffd87f]/15 text-[#ffd87f] border-[#ffd87f]/40'
                            : 'bg-[#22262c] text-[#787b86] border-[#323741]'
                        }`}
                      >
                        <span>Quick Bar</span>
                        <span className="font-bold text-[9px]">{showProQuickBar ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ticker Bar Toggle (Reclaim 32px of height!) */}
          <button
            onClick={() => setShowPriceTickerBar(!showPriceTickerBar)}
            aria-label={showPriceTickerBar ? 'Hide market ticker bar' : 'Show market ticker bar'}
            className={`p-1.5 rounded-lg border text-xs font-mono transition-colors cursor-pointer hidden md:flex items-center gap-1 ${
              showPriceTickerBar
                ? 'bg-[#22262c] text-[#d0c5b3] border-[#323741]'
                : 'bg-[#f6be16]/15 text-[#f6be16] border-[#f6be16]/40'
            }`}
            title={showPriceTickerBar ? 'Hide Ticker Bar (Reclaim height)' : 'Show Ticker Bar'}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden lg:inline">{showPriceTickerBar ? 'Tickers' : 'Show Tickers'}</span>
          </button>

          {/* AI Copilot Button */}
          <button
            id="terminal-copilot-btn"
            aria-controls="ai-copilot-drawer"
            aria-label="Open AI Copilot & Analyst"
            onClick={onOpenCopilot}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#00ff94]/15 hover:bg-[#00ff94]/25 text-[#00ff94] border border-[#00ff94]/40 text-xs font-bold font-mono transition-all cursor-pointer shadow-[0_0_12px_rgba(0,255,148,0.2)]"
            title="Open AI Market Copilot & Trading Analyst"
          >
            <BrainCircuit className="w-3.5 h-3.5 text-[#00ff94] animate-pulse" />
            <span className="hidden xs:inline font-extrabold">Copilot</span>
          </button>

          {/* Balance Pill */}
          <button
            id="terminal-portfolio-btn"
            onClick={onOpenPortfolio}
            aria-label={`Portfolio Balance: $${balance.toLocaleString()}`}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#22262c] hover:bg-[#2c323b] border border-[#323741] text-xs font-mono text-[#fff8f1] transition-colors cursor-pointer"
            title="Portfolio Balance"
          >
            <Wallet className="w-3.5 h-3.5 text-[#f6be16]" />
            <span className="font-bold text-[#f6be16]">${balance >= 1000 ? `${(balance / 1000).toFixed(0)}k` : balance.toFixed(0)}</span>
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
            className="relative p-1.5 text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] rounded-lg transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#f6be16] animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* Real-time CoinDCX Tickers & INR Exchange Price Bar (Toggleable to save laptop height) */}
      {showPriceTickerBar && (
        <RealTimePriceBar
          tickers={tickers}
          currentPair={currentPair}
          onSelectPair={onSelectPair}
          currencyMode={currencyMode}
          onToggleCurrencyMode={toggleCurrencyMode}
          coindcxLatency={coindcxLatency}
          isCoinDCXLive={isCoinDCXLive}
          onResetPrices={onResetCoinDCXPrices}
          isResettingPrices={isResettingPrices}
        />
      )}

      {/* Multi-Timeframe (MTF) Trend Confluence Matrix Quick Bar (Pro Mode Only, Toggleable) */}
      {viewMode === 'pro' && showMTFBar && (
        <React.Suspense fallback={null}>
          <MTFQuickBar
            currentPair={currentPair}
            ticker={
              tickers[currentPair] || {
                symbol: currentPair,
                baseAsset: currentPair.split('/')[0] || '',
                quoteAsset: currentPair.split('/')[1] || 'USDT',
                price: candles[candles.length - 1]?.close || 0,
                change24h: 0,
                high24h: 0,
                low24h: 0,
                volume24h: 0,
              }
            }
            candles={candles}
            onOpenMTFModal={() => setIsMTFOpen(true)}
          />
        </React.Suspense>
      )}
      </>
      )}

      {/* 2. Main Terminal Content */}
      {isMobile ? (
        /* MOBILE VIEW: High-Performance Tab Navigation & Bottom Dock */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Mobile Active Tab Content Container */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Tab 1: Chart View */}
            {mobileTab === 'chart' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="relative z-30 shrink-0">
                  {/* Mobile Compact View Indicator & Toggle Bar */}
                  <div className={`sm:hidden flex items-center justify-between px-2.5 py-1 border-b text-[11px] font-mono select-none ${
                    terminalTheme === 'light' ? 'bg-[#f8fafc] border-[#e0e3eb] text-[#131722]' : 'bg-[#14171a] border-[#272a2d] text-white'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#787b86]">View:</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 ${
                        terminalTheme === 'light' ? 'bg-[#089981]/15 text-[#089981] border-[#089981]/30' : 'bg-[#00ff94]/15 text-[#00ff94] border-[#00ff94]/30'
                      }`}>
                        <BarChart2 className="w-3 h-3" />
                        <span className="capitalize">{activeMainView.replace('_', ' ')}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => setIsMobileSwitchboardOpen(!isMobileSwitchboardOpen)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        isMobileSwitchboardOpen
                          ? 'bg-[#f6be16]/20 text-[#f6be16] border-[#f6be16]/50'
                          : terminalTheme === 'light'
                            ? 'bg-white text-[#b45309] border-[#e0e3eb] hover:bg-gray-50'
                            : 'bg-[#191c1f] text-[#ffd87f] border-[#272a2d] hover:bg-[#272a2d]'
                      }`}
                    >
                      <span>{isMobileSwitchboardOpen ? '▲ Close Views' : '▼ Change View'}</span>
                    </button>
                  </div>

                  {/* OrderFlow Switchboard (Toggleable on mobile, always visible on tablet/desktop) */}
                  <div className={`${isMobileSwitchboardOpen ? 'block' : 'hidden'} sm:block`}>
                    <OrderFlowSwitchboard
                      activeView={activeMainView}
                      onChangeView={(view) => {
                        handleSelectMainView(view);
                        setIsMobileSwitchboardOpen(false);
                      }}
                      layoutPattern={layoutPattern}
                      onChangeLayoutPattern={setLayoutPattern}
                      config={switchboardConfig}
                      onUpdateConfig={handleUpdateConfig}
                      autoExecutionEnabled={autoExecutionEnabled}
                      onToggleAutoExecution={onToggleAutoExecution}
                      onOpenAutoAlertsModal={onOpenAutoAlertsModal}
                    />
                  </div>
                </div>

                <div className="flex-1 relative overflow-hidden z-10 flex flex-col min-h-[400px] sm:min-h-[500px]">
                  {activeMainView === 'candles' && (
                    <CandleChart
                      candles={candles}
                      currentPrice={activeTicker.price}
                      symbol={currentPair}
                      timeframe={timeframe}
                      onTimeframeChange={onTimeframeChange}
                      tradeSetup={unifiedTradeSetup}
                      isLoadingCandles={isChartLoading}
                      loadingMessage={chartLoadingMessage}
                      errorMessage={chartErrorMessage}
                      onRetryLoadCandles={onRetryLoadCandles}
                      activeSignal={effectiveSignal}
                      onAcceptSignal={handleAcceptSignal}
                      onUnlockSignal={handleUnlockSignal}
                      onRefreshAnalysis={handleRefreshAnalysis}
                      isRefreshingAnalysis={isRefreshingAnalysis}
                      alerts={alerts}
                      onOpenAlertsModal={(price) => onOpenAlertsModal?.(currentPair, price)}
                      onLoadMoreHistoricalCandles={onLoadMoreHistoricalCandles}
                      currencyMode={currencyMode}
                      inrPrice={activeTicker.inrPrice}
                      theme={terminalTheme}
                      onAddTpSl={() => setIsRiskCalcOpen(true)}
                      onOpenTradeModal={() => setMobileTab('trade')}
                      onClearSignal={() => handleClearSignal(currentPair)}
                      signalCompletionStatus={signalCompletionStatus}
                      autoRefreshMode={autoRefreshMode}
                      autoRefreshCountdown={autoRefreshCountdown}
                      onToggleAutoRefresh={() =>
                        setAutoRefreshMode((prev) =>
                          prev === 'off' ? '30s' : prev === '30s' ? '15s' : prev === '15s' ? '1m' : 'off'
                        )
                      }
                    />
                  )}

                  <React.Suspense
                    fallback={
                      <div className="h-full w-full flex items-center justify-center font-mono text-xs text-[#99907f] bg-[#111417]">
                        Loading Chart Engine...
                      </div>
                    }
                  >
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
                  </React.Suspense>
                </div>

                {/* Mobile Fast Action Execution Bar (Matching TradingView Screenshot) */}
                <div className={`flex flex-col p-2 sm:p-2.5 border-t shrink-0 select-none ${
                  terminalTheme === 'light' ? 'bg-white border-[#e0e3eb]' : 'bg-[#14171a] border-[#272a2d]'
                }`}>
                  {/* Top quick settings row: Avl : ₹41.19 ⊕ | Market ⬍ | 30x Isolated ▾ | ⌄ */}
                  <div className="flex items-center justify-between text-xs mb-1.5 px-1">
                    {/* Available Margin / Balance */}
                    <div className="flex items-center gap-1">
                      <span className={`text-[11px] font-medium ${terminalTheme === 'light' ? 'text-[#787b86]' : 'text-[#99907f]'}`}>
                        Avl :
                      </span>
                      <span className={`text-xs font-bold font-mono ${terminalTheme === 'light' ? 'text-[#131722]' : 'text-white'}`}>
                        ₹{((balance || 41.19) * 102).toFixed(2)}
                      </span>
                      <button
                        onClick={onOpenPortfolio}
                        className="w-4 h-4 rounded-full bg-[#2563eb] text-white text-[10px] flex items-center justify-center font-black cursor-pointer hover:bg-[#1d4ed8]"
                        title="Add funds / Portfolio"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Market / Limit Selector */}
                      <button
                        onClick={() => setQuickOrderType((prev) => (prev === 'Market' ? 'Limit' : 'Market'))}
                        className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                          terminalTheme === 'light' ? 'text-[#131722] hover:bg-gray-100' : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <span>{quickOrderType}</span>
                        <ArrowUpDown className="w-3 h-3 text-[#787b86]" />
                      </button>

                      {/* Leverage Selector */}
                      <button
                        onClick={() => {
                          const nextLev = quickLeverage === 10 ? 20 : quickLeverage === 20 ? 30 : quickLeverage === 30 ? 50 : 10;
                          setQuickLeverage(nextLev);
                        }}
                        className={`flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                          terminalTheme === 'light' ? 'text-[#131722] hover:bg-gray-100' : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <span>{quickLeverage}x Isolated</span>
                        <ChevronDown className="w-3 h-3 text-[#787b86]" />
                      </button>

                      {/* Trade Guide / Help Chevron */}
                      <button
                        onClick={() => setIsTradeGuideOpen(true)}
                        className="p-0.5 text-[#787b86] hover:text-[#131722] dark:hover:text-white cursor-pointer"
                        title="Trading Guide"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Buttons & Margin Input Row: Buy / Long | Enter Margin | Sell / Short */}
                  <div className="flex items-center gap-2">
                    {/* Buy / Long Button */}
                    <button
                      onClick={() => handleExecuteQuickMarginOrder('buy')}
                      className="flex-1 py-2 sm:py-2.5 px-2 rounded-lg bg-[#089981] hover:bg-[#07806c] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-sm"
                    >
                      Buy / Long
                    </button>

                    {/* Enter Margin Input Field */}
                    <div className="relative w-26 sm:w-32 shrink-0">
                      <input
                        type="number"
                        placeholder="Margin"
                        value={quickMarginInput}
                        onChange={(e) => setQuickMarginInput(e.target.value)}
                        className={`w-full py-1.5 sm:py-2 px-2 text-xs rounded-lg border font-mono text-center font-semibold focus:outline-none transition-colors ${
                          terminalTheme === 'light'
                            ? 'bg-[#f8fafc] border-[#cbd5e1] text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#2563eb]'
                            : 'bg-[#191c1f] border-[#272a2d] text-white placeholder:text-[#64748b] focus:border-[#2563eb]'
                        }`}
                      />
                    </div>

                    {/* Sell / Short Button */}
                    <button
                      onClick={() => handleExecuteQuickMarginOrder('sell')}
                      className="flex-1 py-2 sm:py-2.5 px-2 rounded-lg bg-[#f23645] hover:bg-[#d82a38] active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-sm"
                    >
                      Sell / Short
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Trade Panel */}
            {mobileTab === 'trade' && (
              <div className="flex-1 overflow-y-auto bg-[#111417] p-2 sm:p-3">
                <OrderPanel
                  symbol={currentPair}
                  currentPrice={activeTicker.price}
                  selectedPrice={selectedOrderPrice}
                  balance={balance}
                  precision={activeTicker.precision}
                  currencyMode={currencyMode}
                  inrPrice={activeTicker.inrPrice}
                  timeframe={timeframe}
                  currentMode={currentMode}
                  activeSignal={effectiveSignal}
                  onTradeSetupChange={setUnifiedTradeSetup}
                  onRequestReviewOrder={onRequestReviewOrder}
                  onOpenRiskCalculator={() => setIsRiskCalcOpen(true)}
                  onOpenSmartEntry={() => setIsSmartEntryRadarOpen(true)}
                  onPlaceOrder={(order) => {
                    onPlaceOrder(order);
                    setMobileTab('positions');
                  }}
                />
              </div>
            )}

            {/* Tab 3: AI Signals Hub (Mobile Dedicated) */}
            {mobileTab === 'signals' && (
              <div className="flex-1 overflow-y-auto bg-[#111417] p-3 space-y-4 font-mono">
                {/* AI Engine Status Banner */}
                <div className="p-3 rounded-xl bg-[#14171a] border border-[#272a2d] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#00ff94]/15 border border-[#00ff94]/30 text-[#00ff94]">
                      <BrainCircuit className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#fff8f1] flex items-center gap-1.5">
                        <span>AI Quant Engine 4.2</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#00ff94]/20 text-[#00ff94] text-[9px] font-bold">
                          ACTIVE
                        </span>
                      </div>
                      <div className="text-[10px] text-[#99907f]">
                        Scanning 30+ multi-asset liquidity pools in real-time
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSmartEntryRadarOpen(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#ffd87f]/15 hover:bg-[#ffd87f]/25 border border-[#ffd87f]/40 text-[#ffd87f] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Radar</span>
                  </button>
                </div>

                {/* Signal Completion / Target Hit Alert Banner */}
                {signalCompletionStatus && (
                  <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 shadow-md animate-pulse ${
                    signalCompletionStatus.status === 'TP_HIT'
                      ? 'bg-[#00ff94]/15 border-[#00ff94]/50 text-[#00ff94]'
                      : 'bg-[#ff3b4a]/15 border-[#ff3b4a]/50 text-[#ff3b4a]'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black">
                        {signalCompletionStatus.status === 'TP_HIT' ? '🎯 TARGET 1 HIT!' : '🛑 STOP LOSS REACHED!'}
                      </span>
                      <span className="font-mono text-xs font-bold">
                        ${signalCompletionStatus.hitPrice.toFixed(activeTicker.precision)}
                      </span>
                      {signalCompletionStatus.pnlPercent !== undefined && (
                        <span className="font-mono text-xs font-extrabold px-1.5 py-0.5 rounded bg-black/40">
                          {signalCompletionStatus.pnlPercent > 0 ? '+' : ''}{signalCompletionStatus.pnlPercent}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleClearSignal(currentPair)}
                        className="px-2 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Dismiss</span>
                      </button>
                      <button
                        onClick={() => handleRefreshAnalysis(true)}
                        className="px-2 py-1 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>New Setup</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Current Pair Highlighted Signal Card */}
                {effectiveSignal ? (
                  <div className="p-4 rounded-xl bg-[#191c1f] border border-[#00ff94]/30 shadow-lg relative overflow-hidden space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#fff8f1]">{effectiveSignal.symbol}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-extrabold ${
                            effectiveSignal.side === 'LONG'
                              ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                              : 'bg-[#ff3b4a]/20 text-[#ff3b4a] border border-[#ff3b4a]/40'
                          }`}
                        >
                          {effectiveSignal.side === 'LONG' ? '🟢 BUY / LONG' : '🔴 SELL / SHORT'}
                        </span>
                        {effectiveSignal.isAccepted || effectiveSignal.isLocked ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            LOCKED
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ffd87f]/20 text-[#ffd87f] border border-[#ffd87f]/40 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            SUGGESTED
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Auto-Refresh Toggle Button */}
                        <button
                          onClick={() => setAutoRefreshMode((prev) => prev === 'off' ? '30s' : prev === '30s' ? '15s' : prev === '15s' ? '1m' : 'off')}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                            autoRefreshMode !== 'off'
                              ? 'bg-[#00ff94]/15 border-[#00ff94]/40 text-[#00ff94]'
                              : 'bg-[#14171a] border-[#272a2d] text-[#99907f]'
                          }`}
                          title={`Auto-Refresh Interval: ${autoRefreshMode}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${autoRefreshMode !== 'off' ? 'bg-[#00ff94] animate-ping' : 'bg-[#99907f]'}`} />
                          <span>{autoRefreshMode !== 'off' ? `Auto: ${autoRefreshCountdown}s` : 'Auto: Off'}</span>
                        </button>

                        <button
                          onClick={() => handleRefreshAnalysis(true)}
                          disabled={isRefreshingAnalysis}
                          className="p-1.5 rounded-lg bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 border border-[#3b82f6]/50 text-[#60a5fa] text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          title="Re-run strategy calculation based on current market price"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRefreshingAnalysis ? 'animate-spin' : ''}`} />
                          <span className="hidden sm:inline">Refresh</span>
                        </button>

                        <div className="text-right">
                          <span className="text-xs font-extrabold text-[#00ff94]">
                            {effectiveSignal.confidence}% Conf.
                          </span>
                          <div className="w-16 bg-[#272a2d] h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-[#00ff94] h-full"
                              style={{ width: `${effectiveSignal.confidence}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Strategy Selector Row */}
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#14171a] border border-[#272a2d]">
                      <span className="text-[10px] font-bold text-[#99907f] uppercase tracking-wider">Strategy:</span>
                      <select
                        value={selectedStrategy}
                        onChange={(e) => {
                          setSelectedStrategy(e.target.value);
                          setTimeout(() => handleRefreshAnalysis(true), 50);
                        }}
                        className="bg-[#191c1f] text-[#00ff94] border border-[#272a2d] text-[11px] font-bold px-2 py-1 rounded-md cursor-pointer focus:outline-none focus:border-[#00ff94]"
                      >
                        <option value="5-Agent Desk (CPR + SMC)">5-Agent Desk (CPR + SMC)</option>
                        <option value="CPR + 9/21 EMA Confluence">CPR + 9/21 EMA Confluence</option>
                        <option value="Breakout Momentum">Breakout Momentum</option>
                        <option value="Smart Money (SMC) & Orderflow">Smart Money (SMC) & Orderflow</option>
                        <option value="Fibonacci Golden Pocket">Fibonacci Golden Pocket</option>
                        <option value="Mean Reversion Scalp">Mean Reversion Scalp</option>
                      </select>
                    </div>

                    {/* Price Targets Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-[#14171a] border border-[#272a2d]">
                        <span className="text-[10px] text-[#99907f] block">
                          {effectiveSignal.isAccepted || effectiveSignal.isLocked ? '🔒 Locked Entry' : 'Suggested Entry'}
                        </span>
                        <span className="font-bold text-[#fff8f1]">${effectiveSignal.entryPrice.toFixed(activeTicker.precision)}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#14171a] border border-[#272a2d]">
                        <span className="text-[10px] text-[#00ff94] block">
                          {effectiveSignal.isAccepted || effectiveSignal.isLocked ? '🎯 Locked TP1' : 'Take Profit 1'}
                        </span>
                        <span className="font-bold text-[#00ff94]">${effectiveSignal.target1.toFixed(activeTicker.precision)}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#14171a] border border-[#272a2d]">
                        <span className="text-[10px] text-[#ff3b4a] block">
                          {effectiveSignal.isAccepted || effectiveSignal.isLocked ? '🛑 Locked SL' : 'Stop Loss'}
                        </span>
                        <span className="font-bold text-[#ff3b4a]">${effectiveSignal.stopLoss.toFixed(activeTicker.precision)}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#14171a] border border-[#272a2d]">
                        <span className="text-[10px] text-[#ffd87f] block">Risk : Reward</span>
                        <span className="font-bold text-[#ffd87f]">{effectiveSignal.riskReward || '1 : 3.2'}</span>
                      </div>
                    </div>

                    {/* AI Reasoning Summary */}
                    {(effectiveSignal.rationale || effectiveSignal.description) && (
                      <p className="text-[11px] text-[#d0c5b3] bg-[#14171a]/70 p-2.5 rounded-lg border border-[#272a2d] leading-relaxed">
                        💡 <span className="font-medium">{effectiveSignal.rationale || effectiveSignal.description}</span>
                      </p>
                    )}

                    {/* Action Buttons: Accept / Lock, Clear & 1-Tap Execute */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {effectiveSignal.isAccepted || effectiveSignal.isLocked ? (
                        <button
                          onClick={() => handleUnlockSignal(currentPair)}
                          className="py-2.5 px-3 rounded-xl bg-[#272a2d] hover:bg-[#37393d] text-[#f6be16] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#37393d]"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>Unlock Levels</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAcceptSignal(effectiveSignal)}
                          className="py-2.5 px-3 rounded-xl bg-[#ffd87f]/20 hover:bg-[#ffd87f]/30 border border-[#ffd87f]/50 text-[#ffd87f] font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          title="Lock Entry, TP, and SL as static markers on the chart"
                        >
                          <Lock className="w-4 h-4" />
                          <span>Accept & Lock to Chart</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleClearSignal(currentPair)}
                        className="py-2.5 px-3 rounded-xl bg-[#ff3b4a]/15 hover:bg-[#ff3b4a]/25 text-[#ff3b4a] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#ff3b4a]/30"
                        title="Clear signal from chart and terminal"
                      >
                        <X className="w-4 h-4" />
                        <span>Clear Signal</span>
                      </button>

                      <button
                        onClick={() => {
                          handleAcceptSignal(effectiveSignal);
                          if (onExecuteSignal) {
                            onExecuteSignal(effectiveSignal);
                          } else {
                            onPlaceOrder({
                              symbol: effectiveSignal.symbol,
                              type: 'market',
                              side: effectiveSignal.side === 'LONG' ? 'buy' : 'sell',
                              price: effectiveSignal.entryPrice,
                              amount: 0.1,
                              leverage: effectiveSignal.recommendedLeverage || 10,
                              takeProfit: effectiveSignal.target1,
                              stopLoss: effectiveSignal.stopLoss,
                            });
                          }
                          setMobileTab('positions');
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#0b0e11] font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(0,255,148,0.3)] active:scale-98 transition-transform cursor-pointer"
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>1-Tap Execute & Lock Trade</span>
                      </button>

                      <button
                        onClick={() => setMobileTab('chart')}
                        className="px-3 py-2.5 rounded-xl bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] font-bold text-xs border border-[#37393d] transition-colors cursor-pointer"
                      >
                        View Chart
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#191c1f] border border-[#272a2d] text-center space-y-2">
                    <p className="text-xs text-[#99907f]">No active high-conviction signal for {currentPair} right now.</p>
                    <button
                      onClick={() => setIsSmartEntryRadarOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#00ff94]/15 hover:bg-[#00ff94]/25 text-[#00ff94] border border-[#00ff94]/40 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Scan Smart Entry Pullback</span>
                    </button>
                  </div>
                )}

                {/* All Market Signals List */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#fff8f1] uppercase tracking-wider">
                      Market-Wide Signals ({aiSignals.length})
                    </h3>
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        onClick={() => setMobileSignalFilter('all')}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          mobileSignalFilter === 'all'
                            ? 'bg-[#00ff94] text-[#111417] font-bold'
                            : 'bg-[#272a2d] text-[#99907f]'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setMobileSignalFilter('buy')}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          mobileSignalFilter === 'buy'
                            ? 'bg-[#00ff94] text-[#111417] font-bold'
                            : 'bg-[#272a2d] text-[#99907f]'
                        }`}
                      >
                        🟢 Long
                      </button>
                      <button
                        onClick={() => setMobileSignalFilter('sell')}
                        className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                          mobileSignalFilter === 'sell'
                            ? 'bg-[#ff3b4a] text-[#fff8f1] font-bold'
                            : 'bg-[#272a2d] text-[#99907f]'
                        }`}
                      >
                        🔴 Short
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {aiSignals
                      .filter((sig) => {
                        if (mobileSignalFilter === 'buy') return sig.side === 'LONG';
                        if (mobileSignalFilter === 'sell') return sig.side === 'SHORT';
                        if (mobileSignalFilter === 'high_confidence') return sig.confidence >= 85;
                        return true;
                      })
                      .map((sig) => (
                        <div
                          key={sig.id}
                          className="p-3 rounded-xl bg-[#14171a] border border-[#272a2d] hover:border-[#37393d] transition-all flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#fff8f1]">{sig.symbol}</span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                                  sig.side === 'LONG'
                                    ? 'bg-[#00ff94]/20 text-[#00ff94]'
                                    : 'bg-[#ff3b4a]/20 text-[#ff3b4a]'
                                }`}
                              >
                                {sig.side === 'LONG' ? 'BUY' : 'SELL'}
                              </span>
                              <span className="text-[10px] text-[#00ff94] font-bold">
                                {sig.confidence}%
                              </span>
                            </div>
                            <div className="text-[10px] text-[#99907f] mt-1 flex items-center gap-2">
                              <span>Entry: ${sig.entryPrice.toFixed(2)}</span>
                              <span>•</span>
                              <span className="text-[#00ff94]">TP: ${sig.target1.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                onSelectPair(sig.symbol);
                                setMobileTab('chart');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Chart
                            </button>
                            <button
                              onClick={() => {
                                onSelectPair(sig.symbol);
                                if (onExecuteSignal) {
                                  onExecuteSignal(sig);
                                }
                                setMobileTab('trade');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-[#00ff94]/15 hover:bg-[#00ff94]/25 text-[#00ff94] border border-[#00ff94]/40 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Trade
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Order Book & Market Trades */}
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
                  onSelectPrice={handleSelectMobileOrderPrice}
                />
              </div>
            )}

            {/* Tab 5: Positions, Orders & History */}
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
                  defaultTab={mobilePositionsSubTab}
                />
              </div>
            )}
          </div>

          {/* Mobile Bottom Navigation Dock (Matching TradingView / Exchange Screenshot - Med-Small Density) */}
          <div className={`flex items-center justify-around border-t px-1.5 py-1 shrink-0 text-xs font-semibold z-30 shadow-2xl pb-[max(0.4rem,env(safe-area-inset-bottom))] ${
            terminalTheme === 'light' ? 'bg-white border-[#e0e3eb]' : 'bg-[#14171a] border-[#272a2d]'
          }`}>
            {/* 1. Home */}
            <button
              onClick={onReturnToHero}
              className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 cursor-pointer transition-colors ${
                terminalTheme === 'light' ? 'text-[#787b86] hover:text-[#131722]' : 'text-[#99907f] hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="text-[10px]">Home</span>
            </button>

            {/* 2. Invest */}
            <button
              onClick={() => (onOpenMarketOverview ? onOpenMarketOverview() : setIsMarketModalOpen(true))}
              className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 cursor-pointer transition-colors ${
                terminalTheme === 'light' ? 'text-[#787b86] hover:text-[#131722]' : 'text-[#99907f] hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px]">Invest</span>
            </button>

            {/* 3. Futures (Active Blue Tab) */}
            <button
              onClick={() => setMobileTab('chart')}
              className="flex-1 flex flex-col items-center gap-0.5 py-0.5 cursor-pointer text-[#2563eb] font-bold relative"
            >
              <BarChart2 className="w-4 h-4 text-[#2563eb]" />
              <span className="text-[10px]">Futures</span>
            </button>

            {/* 4. Agent Analysis */}
            <button
              id="bottom-dock-agent-analysis"
              onClick={() => setIsAgentDeliberationOpen(true)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 cursor-pointer transition-colors relative min-w-0 ${
                terminalTheme === 'light' ? 'text-[#787b86] hover:text-[#131722]' : 'text-[#99907f] hover:text-white'
              }`}
            >
              <span className="absolute -top-2 px-1 py-0.1 bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40 text-[7px] font-black rounded tracking-tight">
                AI
              </span>
              <BrainCircuit className="w-4 h-4 text-[#00ff94]" />
              <span className="text-[9.5px] font-bold text-center leading-tight whitespace-nowrap">
                Agents
              </span>
            </button>

            {/* 5. Portfolio */}
            <button
              onClick={onOpenPortfolio}
              className={`flex-1 flex flex-col items-center gap-0.5 py-0.5 cursor-pointer transition-colors ${
                terminalTheme === 'light' ? 'text-[#787b86] hover:text-[#131722]' : 'text-[#99907f] hover:text-white'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="text-[10px]">Portfolio</span>
            </button>
          </div>
        </div>
      ) : (viewMode === 'simple' && activeMainView === 'candles') ? (
        /* SIMPLE MODE DESKTOP VIEW: Clean, Focused, Uncluttered Interface */
        <div className="flex-1 flex flex-row overflow-hidden">
          {/* Main Chart & Positions Column (Left ~68%) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 1-Click Quick Profit Bar */}
            <div className="p-2 bg-[#14171a] border-b border-[#272a2d] shrink-0">
              <QuickProfitBar
                currentPair={currentPair}
                ticker={activeTicker}
                balance={balance}
                currencyMode={currencyMode}
                activeSignal={activeSignal}
                currentMode={currentMode}
                onRequestReviewOrder={onRequestReviewOrder}
                onOpenSignalLedger={onOpenSignalLedger || (() => setIsSignalLedgerLocalOpen(true))}
                onOpenTradeGuide={() => setIsTradeGuideOpen(true)}
                onOpenAgentDeliberation={() => setIsAgentDeliberationOpen(true)}
                onExecuteQuickTrade={(params) => {
                  if (onPlaceQuickTrade) {
                    onPlaceQuickTrade(params);
                  }
                }}
              />
            </div>

            {/* Clean Candlestick Chart Area */}
            <div className="flex-1 min-h-[350px] relative overflow-hidden">
              <CandleChart
                candles={candles}
                currentPrice={activeTicker.price}
                symbol={currentPair}
                timeframe={timeframe}
                onTimeframeChange={onTimeframeChange}
                tradeSetup={unifiedTradeSetup}
                isLoadingCandles={isChartLoading}
                loadingMessage={chartLoadingMessage}
                errorMessage={chartErrorMessage}
                onRetryLoadCandles={onRetryLoadCandles}
                activeSignal={effectiveSignal}
                onAcceptSignal={handleAcceptSignal}
                onUnlockSignal={handleUnlockSignal}
                onRefreshAnalysis={handleRefreshAnalysis}
                isRefreshingAnalysis={isRefreshingAnalysis}
                alerts={alerts}
                onOpenAlertsModal={(price) => onOpenAlertsModal?.(currentPair, price)}
                onLoadMoreHistoricalCandles={onLoadMoreHistoricalCandles}
                currencyMode={currencyMode}
                inrPrice={activeTicker.inrPrice}
                theme={terminalTheme}
                onAddTpSl={() => setIsRiskCalcOpen(true)}
                onOpenTradeModal={() => setMobileTab('trade')}
                onClearSignal={() => handleClearSignal(currentPair)}
                signalCompletionStatus={signalCompletionStatus}
                autoRefreshMode={autoRefreshMode}
                autoRefreshCountdown={autoRefreshCountdown}
                onToggleAutoRefresh={() =>
                  setAutoRefreshMode((prev) =>
                    prev === 'off' ? '30s' : prev === '30s' ? '15s' : prev === '15s' ? '1m' : 'off'
                  )
                }
              />
            </div>

            {/* Bottom Positions & Orders Panel */}
            <div className="h-60 min-h-[180px] border-t border-[#272a2d]">
              <PositionsTable
                positions={positions}
                openOrders={openOrders}
                orderHistory={orderHistory}
                aiSignals={aiSignals}
                onClosePosition={onClosePosition}
                onCancelOrder={onCancelOrder}
                onExecuteSignal={onExecuteSignal}
                autoExecutionEnabled={autoExecutionEnabled}
                onToggleAutoExecution={onToggleAutoExecution}
                onOpenAutoAlertsModal={onOpenAutoAlertsModal}
              />
            </div>
          </div>

          {/* Simple Trade & AI Signal Column (Right 340px - 380px) */}
          <div className="w-[360px] xl:w-[380px] flex flex-col border-l border-[#272a2d] bg-[#14171a] shrink-0 overflow-y-auto">
            {/* Quick Active AI Signal Recommendation Banner */}
            {effectiveSignal && (
              <div className="p-3 bg-linear-to-b from-[#00ff94]/10 to-transparent border-b border-[#00ff94]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BrainCircuit className="w-4 h-4 text-[#00ff94] animate-pulse" />
                    <span className="text-xs font-bold text-[#fff8f1]">
                      {effectiveSignal.isAccepted || effectiveSignal.isLocked ? 'Locked AI Trade Blueprint' : 'Live AI Trade Setup'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {effectiveSignal.isAccepted || effectiveSignal.isLocked ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        LOCKED
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          effectiveSignal.side === 'LONG'
                            ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                            : 'bg-[#ff3b4a]/20 text-[#ff3b4a] border border-[#ff3b4a]/40'
                        }`}
                      >
                        {effectiveSignal.side} (Est: {effectiveSignal.confidence}% Confluence)
                      </span>
                    )}
                  </div>
                </div>

                {/* Static Marker Readout from Single Source of Truth */}
                <div className="grid grid-cols-3 gap-1.5 text-xs font-mono bg-[#14171a]/80 p-2 rounded-lg border border-[#272a2d]">
                  <div>
                    <span className="text-[9px] text-[#99907f] block">Entry</span>
                    <span className="font-bold text-[#fff8f1] text-[11px]">
                      ${(unifiedTradeSetup.symbol === currentPair ? unifiedTradeSetup.entry : effectiveSignal.entryPrice).toFixed(activeTicker.precision)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#00ff94] block">TP1</span>
                    <span className="font-bold text-[#00ff94] text-[11px]">
                      ${(unifiedTradeSetup.symbol === currentPair ? unifiedTradeSetup.takeProfit : effectiveSignal.target1).toFixed(activeTicker.precision)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#ff3b4a] block">Stop Loss</span>
                    <span className="font-bold text-[#ff3b4a] text-[11px]">
                      ${(unifiedTradeSetup.symbol === currentPair ? unifiedTradeSetup.stopLoss : effectiveSignal.stopLoss).toFixed(activeTicker.precision)}
                    </span>
                  </div>
                </div>

                {/* Accept / Refresh Button Row */}
                <div className="flex items-center gap-1.5">
                  {effectiveSignal.isAccepted || effectiveSignal.isLocked ? (
                    <button
                      onClick={() => handleUnlockSignal(currentPair)}
                      className="flex-1 py-1 px-2 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#d0c5b3] hover:text-[#fff8f1] text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Unlock static markers"
                    >
                      <Unlock className="w-3 h-3 text-[#f6be16]" />
                      <span>Unlock Levels</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAcceptSignal(effectiveSignal)}
                      className="flex-1 py-1 px-2 rounded-lg bg-[#ffd87f]/20 hover:bg-[#ffd87f]/30 border border-[#ffd87f]/50 text-[#ffd87f] text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Lock current suggested Entry, TP, and SL as static markers on the chart"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Accept & Lock Levels</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleRefreshAnalysis(true)}
                    disabled={isRefreshingAnalysis}
                    className="py-1 px-2 rounded-lg bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 border border-[#3b82f6]/50 text-[#60a5fa] text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                    title="Re-calculate deliberation based on current market price"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshingAnalysis ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>

                  <button
                    onClick={() => handleClearSignal(currentPair)}
                    className="py-1 px-2 rounded-lg bg-[#ff3b4a]/15 hover:bg-[#ff3b4a]/25 text-[#ff3b4a] border border-[#ff3b4a]/30 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    title="Clear signal from chart and terminal"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>

                {/* Deliberate Order Review Action */}
                <div className="space-y-1.5">
                  {currentMode === 'RESEARCH' ? (
                    <div className="py-1.5 px-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-center text-[10px] font-mono font-semibold">
                      RESEARCH ONLY — NO ORDERS
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleAcceptSignal(effectiveSignal);

                        const activeSetupEntry = unifiedTradeSetup.symbol === currentPair ? unifiedTradeSetup.entry : effectiveSignal.entryPrice;
                        const activeSetupTP = unifiedTradeSetup.symbol === currentPair ? unifiedTradeSetup.takeProfit : effectiveSignal.target1;
                        const activeSetupSL = unifiedTradeSetup.symbol === currentPair ? unifiedTradeSetup.stopLoss : effectiveSignal.stopLoss;
                        const activeSetupSide: 'buy' | 'sell' = (unifiedTradeSetup.symbol === currentPair ? unifiedTradeSetup.side : effectiveSignal.side) === 'LONG' ? 'buy' : 'sell';

                        // Validate directional hierarchy (Requirement 2)
                        const directionalCheck = validateUnifiedTradeSetup({
                          side: activeSetupSide,
                          entry: activeSetupEntry,
                          takeProfit: activeSetupTP,
                          stopLoss: activeSetupSL,
                        });
                        if (!directionalCheck.isValid) {
                          showTerminalNotice(directionalCheck.error || 'Invalid trade setup.', 'warning');
                          return;
                        }

                        if (onRequestReviewOrder) {
                          const side = activeSetupSide;
                          const lev = Math.min(effectiveSignal.recommendedLeverage || 2, 3);
                          const safeQty = 0.1;
                          const reqMargin = +((safeQty * activeSetupEntry) / lev).toFixed(2);
                          onRequestReviewOrder({
                            idempotencyKey: `ORD-SIG-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                            symbol: currentPair,
                            market: 'Perpetual Futures',
                            side,
                            quantity: safeQty,
                            orderType: 'limit',
                            entryPrice: activeSetupEntry,
                            currentMarketPrice: activeTicker.price,
                            leverage: lev,
                            marginMode: 'cross',
                            requiredMargin: reqMargin,
                            tradingFeeEstimate: +(safeQty * activeSetupEntry * 0.0004).toFixed(4),
                            fundingEstimate: +(safeQty * activeSetupEntry * 0.0001).toFixed(4),
                            spreadEstimate: +(safeQty * activeSetupEntry * 0.0002).toFixed(4),
                            slippageEstimate: +(safeQty * activeSetupEntry * 0.0002).toFixed(4),
                            maxPlannedLoss: +(Math.abs(activeSetupEntry - activeSetupSL) * safeQty).toFixed(2),
                            takeProfit: activeSetupTP,
                            stopLoss: activeSetupSL,
                            estimatedLiqPrice: side === 'buy' ? +(activeSetupEntry * (1 - 1 / lev + 0.004)).toFixed(2) : +(activeSetupEntry * (1 + 1 / lev - 0.004)).toFixed(2),
                            accountBalanceAfterTrade: Math.max(0, +(balance - reqMargin).toFixed(2)),
                            remainingBuyingPower: Math.max(0, +(balance - reqMargin).toFixed(2)),
                            dataSource: 'Unified Real-Time Exchange Feed',
                            dataTimestamp: Date.now(),
                            isDataStale: false,
                          });
                        } else if (onExecuteSignal) {
                          onExecuteSignal(effectiveSignal);
                        } else {
                          onPlaceOrder({
                            symbol: currentPair,
                            type: 'limit',
                            side: activeSetupSide,
                            price: activeSetupEntry,
                            amount: 0.1,
                            leverage: Math.min(effectiveSignal.recommendedLeverage || 2, 3),
                            takeProfit: activeSetupTP,
                            stopLoss: activeSetupSL,
                          });
                        }
                      }}
                      className="w-full py-1.5 rounded-lg bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#002111] font-bold text-xs font-mono flex items-center justify-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,255,148,0.2)] cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Review Signal Setup & Lock</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Standard Clean Order Panel */}
            <div className="flex-1">
              <OrderPanel
                symbol={currentPair}
                currentPrice={activeTicker.price}
                selectedPrice={selectedOrderPrice}
                balance={balance}
                precision={activeTicker.precision}
                currencyMode={currencyMode}
                inrPrice={activeTicker.inrPrice}
                timeframe={timeframe}
                currentMode={currentMode}
                activeSignal={effectiveSignal}
                onTradeSetupChange={setUnifiedTradeSetup}
                onRequestReviewOrder={onRequestReviewOrder}
                onOpenRiskCalculator={() => setIsRiskCalcOpen(true)}
                onOpenSmartEntry={() => setIsSmartEntryRadarOpen(true)}
                onPlaceOrder={onPlaceOrder}
              />
            </div>
          </div>
        </div>
      ) : (
        /* PRO DESKTOP VIEW: Institutional Multi-Pane Grid Layout */
        <div className="flex-1 flex flex-row overflow-hidden">
          {/* Left / Center Section: Chart & Positions Panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Order Flow & Chart Switchboard Bar */}
            <div className="relative z-30 shrink-0">
              <OrderFlowSwitchboard
                activeView={activeMainView}
                onChangeView={handleSelectMainView}
                layoutPattern={layoutPattern}
                onChangeLayoutPattern={setLayoutPattern}
                config={switchboardConfig}
                onUpdateConfig={handleUpdateConfig}
                autoExecutionEnabled={autoExecutionEnabled}
                onToggleAutoExecution={onToggleAutoExecution}
                onOpenAutoAlertsModal={onOpenAutoAlertsModal}
              />
            </div>

            {/* Desktop Pro 1-Click Quick Profit Bar (Toggleable to save laptop screen height) */}
            {showProQuickBar && (
              <div className="p-2 bg-[#14171a] border-b border-[#272a2d] shrink-0">
                <React.Suspense fallback={null}>
                  <QuickProfitBar
                    currentPair={currentPair}
                    ticker={activeTicker}
                    balance={balance}
                    currencyMode={currencyMode}
                    activeSignal={activeSignal}
                    currentMode={currentMode}
                    onRequestReviewOrder={onRequestReviewOrder}
                    onOpenSignalLedger={onOpenSignalLedger || (() => setIsSignalLedgerLocalOpen(true))}
                    onOpenTradeGuide={() => setIsTradeGuideOpen(true)}
                    onOpenAgentDeliberation={() => setIsAgentDeliberationOpen(true)}
                    onExecuteQuickTrade={(params) => {
                      if (onPlaceQuickTrade) {
                        onPlaceQuickTrade(params);
                      }
                    }}
                  />
                </React.Suspense>
              </div>
            )}

            {/* Top Chart Area */}
            <div className="flex-1 min-h-[300px] relative overflow-hidden z-10">
              <h2 className="sr-only">Interactive Market Chart and Technical Analysis Canvas</h2>
              {activeMainView === 'candles' && (
                <CandleChart
                  candles={candles}
                  currentPrice={activeTicker.price}
                  symbol={currentPair}
                  timeframe={timeframe}
                  onTimeframeChange={onTimeframeChange}
                  tradeSetup={unifiedTradeSetup}
                  isLoadingCandles={isChartLoading}
                  loadingMessage={chartLoadingMessage}
                  errorMessage={chartErrorMessage}
                  onRetryLoadCandles={onRetryLoadCandles}
                  activeSignal={effectiveSignal}
                  onAcceptSignal={handleAcceptSignal}
                  onUnlockSignal={handleUnlockSignal}
                  onRefreshAnalysis={handleRefreshAnalysis}
                  isRefreshingAnalysis={isRefreshingAnalysis}
                  alerts={alerts}
                  onOpenAlertsModal={(price) => onOpenAlertsModal?.(currentPair, price)}
                  onLoadMoreHistoricalCandles={onLoadMoreHistoricalCandles}
                  currencyMode={currencyMode}
                  inrPrice={activeTicker.inrPrice}
                  theme={terminalTheme}
                  onAddTpSl={() => setIsRiskCalcOpen(true)}
                  onOpenTradeModal={() => setMobileTab('trade')}
                  onClearSignal={() => handleClearSignal(currentPair)}
                  signalCompletionStatus={signalCompletionStatus}
                  autoRefreshMode={autoRefreshMode}
                  autoRefreshCountdown={autoRefreshCountdown}
                  onToggleAutoRefresh={() =>
                    setAutoRefreshMode((prev) =>
                      prev === 'off' ? '30s' : prev === '30s' ? '15s' : prev === '15s' ? '1m' : 'off'
                    )
                  }
                />
              )}

              <React.Suspense
                fallback={
                  <div className="h-full w-full flex items-center justify-center font-mono text-xs text-[#99907f] bg-[#111417]">
                    Loading Order Flow Engine...
                  </div>
                }
              >
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
              </React.Suspense>
            </div>

            {/* Bottom Positions & Orders Panel */}
            <div className="h-56 min-h-[160px] border-t border-[#272a2d]">
              <h2 className="sr-only">Positions, Open Orders, and Trade History</h2>
              <PositionsTable
                positions={positions}
                openOrders={openOrders}
                orderHistory={orderHistory}
                aiSignals={aiSignals}
                onClosePosition={onClosePosition}
                onCancelOrder={onCancelOrder}
                onExecuteSignal={onExecuteSignal}
                defaultTab={mobilePositionsSubTab}
                autoExecutionEnabled={autoExecutionEnabled}
                onToggleAutoExecution={onToggleAutoExecution}
                onOpenAutoAlertsModal={onOpenAutoAlertsModal}
              />
            </div>
          </div>

          {/* Right Section: Order Book & Order Panel (M-02 responsive spatial math) */}
          <div className="w-[440px] lg:w-[480px] xl:w-[520px] 2xl:w-[560px] flex flex-row border-l border-[#272a2d] shrink-0">
            {/* Order Book Column */}
            <div className="w-1/2 h-full border-r border-[#272a2d]">
              <h2 className="sr-only">Market Depth and Order Book</h2>
              <OrderBook
                bids={bids}
                asks={asks}
                currentPrice={activeTicker.price}
                lastTradeSide={lastTradeSide}
                recentTrades={recentTrades}
                precision={activeTicker.precision}
                currencyMode={currencyMode}
                inrPrice={activeTicker.inrPrice}
                onSelectPrice={handleSelectOrderPrice}
              />
            </div>

            {/* Order Entry Panel Column */}
            <div className="w-1/2 h-full">
              <h2 className="sr-only">Order Placement and Risk Execution</h2>
              <OrderPanel
                symbol={currentPair}
                currentPrice={activeTicker.price}
                selectedPrice={selectedOrderPrice}
                balance={balance}
                precision={activeTicker.precision}
                currencyMode={currencyMode}
                inrPrice={activeTicker.inrPrice}
                timeframe={timeframe}
                currentMode={currentMode}
                activeSignal={effectiveSignal}
                onTradeSetupChange={setUnifiedTradeSetup}
                onRequestReviewOrder={onRequestReviewOrder}
                onOpenRiskCalculator={() => setIsRiskCalcOpen(true)}
                onOpenSmartEntry={() => setIsSmartEntryRadarOpen(true)}
                autoExecutionEnabled={autoExecutionEnabled}
                onToggleAutoExecution={onToggleAutoExecution}
                onOpenAutoAlertsModal={onOpenAutoAlertsModal}
                onPlaceOrder={onPlaceOrder}
              />
            </div>
          </div>
        </div>
      )}

      {/* Heavy secondary modals loaded dynamically via React.lazy with zero impact on initial bundle (M-03) */}
      <React.Suspense fallback={null}>
        {isMarketModalOpen && (
          <MarketSearchModal
            isOpen={isMarketModalOpen}
            onClose={() => setIsMarketModalOpen(false)}
            currentPair={currentPair}
            tickers={tickers}
            onSelectPair={onSelectPair}
            currencyMode={currencyMode}
            onToggleCurrencyMode={toggleCurrencyMode}
          />
        )}

        {isArbitrageModalOpen && (
          <ArbitrageSpreadModal
            isOpen={isArbitrageModalOpen}
            onClose={() => setIsArbitrageModalOpen(false)}
            currentPair={currentPair}
            tickers={tickers}
            onSelectPair={onSelectPair}
            onOpenQuantConsole={() => setIsQuantConsoleOpen(true)}
          />
        )}

        {isQuantConsoleOpen && (
          <QuantExecutionConsoleModal
            isOpen={isQuantConsoleOpen}
            onClose={() => setIsQuantConsoleOpen(false)}
            currencyMode={currencyMode}
          />
        )}

        {isRiskCalcOpen && (
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
        )}

        {isBacktesterOpen && (
          <StrategyBacktesterModal
            isOpen={isBacktesterOpen}
            onClose={() => setIsBacktesterOpen(false)}
            currentPair={currentPair}
            candles={candles}
            timeframe={timeframe}
          />
        )}

        {isEcoCalendarOpen && (
          <EconomicCalendarModal
            isOpen={isEcoCalendarOpen}
            onClose={() => setIsEcoCalendarOpen(false)}
          />
        )}

        {isMTFOpen && (
          <MTFAnalysisModal
            isOpen={isMTFOpen}
            onClose={() => setIsMTFOpen(false)}
            currentPair={currentPair}
            currentPrice={activeTicker.price}
            tickers={tickers}
            candles={candles}
            onSelectPair={onSelectPair}
          />
        )}

        {isWebhookModalOpen && (
          <WebhookAlertsModal
            isOpen={isWebhookModalOpen}
            onClose={() => setIsWebhookModalOpen(false)}
          />
        )}

        {isWhaleTrackerOpen && (
          <WhaleTrackerModal
            isOpen={isWhaleTrackerOpen}
            onClose={() => setIsWhaleTrackerOpen(false)}
            currentPair={currentPair}
            tickers={tickers}
            onSelectPair={onSelectPair}
          />
        )}

        {isLiquidationModalOpen && (
          <LiquidationHeatmapModal
            isOpen={isLiquidationModalOpen}
            onClose={() => setIsLiquidationModalOpen(false)}
            currentPair={currentPair}
            tickers={tickers}
            onSelectPair={onSelectPair}
          />
        )}

        {isAlgoSlicerOpen && (
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
        )}

        {isTradeJournalOpen && (
          <TradeJournalPnLModal
            isOpen={isTradeJournalOpen}
            onClose={() => setIsTradeJournalOpen(false)}
            positions={positions}
            balance={balance}
            onShowToast={(msg, type) => {
              if (type === 'success') {
                console.log(msg);
              }
            }}
          />
        )}

        {isHotkeysModalOpen && (
          <HotkeysVoiceModal
            isOpen={isHotkeysModalOpen}
            onClose={() => setIsHotkeysModalOpen(false)}
            isVoiceAlertsEnabled={isVoiceAlertsEnabled}
            onToggleVoiceAlerts={handleToggleVoiceAlerts}
          />
        )}

        {isBarReplayOpen && (
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
        )}

        {isAutoBotOpen && (
          <AutoStrategyBotModal
            isOpen={isAutoBotOpen}
            onClose={() => setIsAutoBotOpen(false)}
            currentPair={currentPair}
            onShowToast={(msg, type) => {
              if (type === 'success') console.log(msg);
            }}
          />
        )}

        {isOrderFlowDeltaOpen && (
          <OrderFlowDeltaModal
            isOpen={isOrderFlowDeltaOpen}
            onClose={() => setIsOrderFlowDeltaOpen(false)}
            currentPair={currentPair}
            candles={candles}
            ticker={activeTicker}
          />
        )}

        {isStrategyManagerOpen && (
          <StrategyManagerModal
            isOpen={isStrategyManagerOpen}
            onClose={() => setIsStrategyManagerOpen(false)}
            tickers={tickers}
            currentPair={currentPair}
            onSelectPair={onSelectPair}
            onPlaceOrder={onPlaceOrder}
            onOpenAlertsModal={onOpenAlertsModal}
          />
        )}

        {isStrategyHubOpen && (
          <StrategyHubModal
            isOpen={isStrategyHubOpen}
            onClose={() => setIsStrategyHubOpen(false)}
            tickers={tickers}
            currentPair={currentPair}
            onSelectPair={onSelectPair}
            onPlaceOrder={onPlaceOrder}
            onOpenAlertsModal={onOpenAlertsModal}
          />
        )}

        {isCPRModalOpen && (
          <CPRMarketTrendModal
            isOpen={isCPRModalOpen}
            onClose={() => setIsCPRModalOpen(false)}
            tickers={tickers}
            onSelectPair={onSelectPair}
            onOpenCopilot={onOpenCopilot}
            onExecuteTrade={onPlaceOrder}
            currentTimeframe={timeframe}
          />
        )}

        {isSmartEntryRadarOpen && (
          <SmartEntryRadarModal
            isOpen={isSmartEntryRadarOpen}
            onClose={() => setIsSmartEntryRadarOpen(false)}
            currentPair={currentPair}
            tickers={tickers}
            balance={balance}
            currentTimeframe={timeframe}
            onSelectPair={onSelectPair}
            onPlaceOrder={onPlaceOrder}
            currentMode={currentMode}
            onRequestReviewOrder={onRequestReviewOrder}
          />
        )}

        {isSignalLedgerLocalOpen && (
          <SignalLedgerModal
            isOpen={isSignalLedgerLocalOpen}
            onClose={() => setIsSignalLedgerLocalOpen(false)}
          />
        )}

        {isMobileToolsDrawerOpen && (
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
        )}

        {isTradeGuideOpen && (
          <TradeGuideModal
            isOpen={isTradeGuideOpen}
            onClose={() => setIsTradeGuideOpen(false)}
            currentPair={currentPair}
            ticker={activeTicker}
            balance={balance}
            currencyMode={currencyMode}
            onPlaceQuickTrade={(params) => {
              if (onPlaceQuickTrade) {
                onPlaceQuickTrade(params);
              }
              if (isMobile) {
                setMobileTab('positions');
              }
            }}
          />
        )}

        {isAgentDeliberationOpen && (
          <AgentDeliberationOverlay
            isOpen={isAgentDeliberationOpen}
            onClose={() => setIsAgentDeliberationOpen(false)}
            currentPair={currentPair}
            ticker={activeTicker}
            candles={candles}
            timeframe={timeframe}
            balance={balance}
            currencyMode={currencyMode}
            onPlaceOrder={(order) => {
              onPlaceOrder(order);
              if (isMobile) {
                setMobileTab('positions');
              }
            }}
            onPlaceQuickTrade={(params) => {
              if (onPlaceQuickTrade) {
                onPlaceQuickTrade(params);
              }
              if (isMobile) {
                setMobileTab('positions');
              }
            }}
            onAcceptSignal={handleAcceptSignal}
            onOpenLearningGuide={() => setIsTradeLearningTooltipOpen(true)}
            onOpenCopilot={onOpenCopilot}
          />
        )}

        {isTradeLearningTooltipOpen && (
          <TradeLearningTooltipModal
            isOpen={isTradeLearningTooltipOpen}
            onClose={() => setIsTradeLearningTooltipOpen(false)}
            onOpenAgentDeliberation={() => setIsAgentDeliberationOpen(true)}
            currentPair={currentPair}
            currentPrice={activeTicker?.price}
          />
        )}
      </React.Suspense>

      {/* Floating Interactive Toast Alert for Signal Locking & Analysis Updates */}
      {terminalNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[90%] md:w-auto px-4 py-2.5 rounded-xl bg-[#14171a]/95 border border-[#00ff94]/50 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(0,255,148,0.25)] backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-1 rounded-full bg-[#00ff94]/20 border border-[#00ff94]/40 shrink-0">
            <Lock className="w-3.5 h-3.5 text-[#00ff94]" />
          </div>
          <p className="text-xs text-[#fff8f1] font-mono leading-tight">{terminalNotice.message}</p>
          <button
            onClick={() => setTerminalNotice(null)}
            className="ml-auto text-[#99907f] hover:text-[#fff8f1] text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
});
