import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Candle,
  AISignal,
  PriceAlert,
  DrawingElement,
  DrawingToolType,
  ActiveIndicatorState,
  ChartPoint,
  UnifiedTradeSetup,
} from '../types';
import { DrawingToolbar } from './DrawingToolbar';
import { IndicatorsModal } from './IndicatorsModal';
import {
  INDICATOR_CATALOG,
  calculateEMA,
  calculateSMA,
  calculateVWAP,
  calculateBollingerBands,
  calculateKeltnerChannels,
  calculateDonchianChannels,
  calculateATR,
  calculateSupertrend,
  calculateParabolicSAR,
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  calculateCCI,
  calculateWilliamsR,
  calculateOBV,
  calculateVolumeProfile,
  calculatePivotPoints,
  calculateSmartMoneyZones,
  convertToHeikinAshi,
  calculateCPR,
  calculateADX,
  evaluateCPRConfluenceStrategy,
} from '../utils/indicators';
import {
  AlertTriangle,
  Maximize2,
  Minimize2,
  BarChart2,
  Sparkles,
  Bell,
  Camera,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  PenTool,
  Hand,
  Plus,
  Minus,
  RotateCcw,
  Crosshair,
  Play,
  Zap,
  Eye,
  EyeOff,
  Sliders,
  X,
  Lock,
  Unlock,
  RefreshCw,
  Info,
  Undo2,
  Redo2,
  Trash2,
  Calendar,
  Clock,
} from 'lucide-react';

interface CandleChartProps {
  candles: Candle[];
  currentPrice: number;
  symbol: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  activeSignal?: AISignal | null;
  onAcceptSignal?: (sig: AISignal) => void;
  onUnlockSignal?: () => void;
  onRefreshAnalysis?: () => void;
  isRefreshingAnalysis?: boolean;
  alerts?: PriceAlert[];
  onOpenAlertsModal?: (prefillPrice?: number) => void;
  height?: number;
  onLoadMoreHistoricalCandles?: () => void;
  currencyMode?: 'USDT' | 'INR';
  inrPrice?: number;
  theme?: 'light' | 'dark';
  onAddTpSl?: () => void;
  onOpenTradeModal?: () => void;
  onClearSignal?: () => void;
  signalCompletionStatus?: {
    status: 'TP_HIT' | 'SL_HIT';
    hitPrice: number;
    pnlPercent?: number;
  } | null;
  autoRefreshMode?: string;
  autoRefreshCountdown?: number;
  onToggleAutoRefresh?: () => void;
  isSplitMode?: boolean;
  onMaximize?: () => void;
  isLoadingCandles?: boolean;
  loadingMessage?: string;
  errorMessage?: string | null;
  onRetryLoadCandles?: () => void;
  tradeSetup?: UnifiedTradeSetup | null;
}

const DEFAULT_ACTIVE_INDICATORS: ActiveIndicatorState[] = [
  {
    id: 'cpr',
    indicatorId: 'cpr',
    enabled: true,
    params: { showPivots: 1, showBand: 1, showHistory: 1, showLabels: 1 },
    color: '#00ff94',
    visible: true,
  },
  {
    id: 'ema_9',
    indicatorId: 'ema_9',
    enabled: true,
    params: { period: 9 },
    color: '#f6be16',
    visible: true,
  },
  {
    id: 'ema_21',
    indicatorId: 'ema_21',
    enabled: true,
    params: { period: 21 },
    color: '#38bdf8',
    visible: true,
  },
  {
    id: 'supertrend',
    indicatorId: 'supertrend',
    enabled: true,
    params: { period: 10, multiplier: 3 },
    color: '#00ff94',
    secondaryColor: '#ff3b4a',
    visible: true,
  },
  {
    id: 'volume_bars',
    indicatorId: 'volume_bars',
    enabled: true,
    params: { maPeriod: 20 },
    color: '#00ff94',
    visible: true,
  },
  {
    id: 'rsi_14',
    indicatorId: 'rsi_14',
    enabled: false,
    params: { period: 14, overbought: 70, oversold: 30 },
    color: '#e7c26b',
    visible: true,
  },
  {
    id: 'macd',
    indicatorId: 'macd',
    enabled: false,
    params: { fast: 12, slow: 26, signal: 9 },
    color: '#38bdf8',
    secondaryColor: '#f6be16',
    visible: true,
  },
  {
    id: 'adx_14',
    indicatorId: 'adx_14',
    enabled: false,
    params: { period: 14 },
    color: '#a855f7',
    visible: true,
  },
  {
    id: 'smart_money_zones',
    indicatorId: 'smart_money_zones',
    enabled: false,
    params: {},
    color: '#00ff94',
    secondaryColor: '#ff3b4a',
    visible: true,
  },
];

// Helper to convert timeframe string to milliseconds without re-instantiation
function getTimeframeMs(tf: string): number {
  switch (tf) {
    case '1s': return 1000;
    case '1m': return 60 * 1000;
    case '5m': return 5 * 60 * 1000;
    case '15m': return 15 * 60 * 1000;
    case '1h': return 60 * 60 * 1000;
    case '4h': return 4 * 60 * 60 * 1000;
    case '1D': return 24 * 60 * 60 * 1000;
    default: return 60 * 1000;
  }
}

// Dedicated micro-component for the ticking candle countdown to isolate 1s renders from the main 5000-line chart
const CandleCountdownBadge: React.FC<{
  lastCandleTime?: number;
  timeframe: string;
  onCountdownUpdate?: (str: string) => void;
}> = React.memo(({ lastCandleTime, timeframe, onCountdownUpdate }) => {
  const [countdown, setCountdown] = useState<string>('00:00');

  useEffect(() => {
    const update = () => {
      if (!lastCandleTime) return;
      const tfMs = getTimeframeMs(timeframe);
      const nextClose = lastCandleTime + tfMs;
      const now = Date.now();
      let diff = nextClose - now;
      if (diff <= 0 || diff > tfMs * 2) {
        diff = tfMs - (now % tfMs);
      }
      const totalSec = Math.max(0, Math.floor(diff / 1000));
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      const str = hours > 0
        ? `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setCountdown(str);
      if (onCountdownUpdate) onCountdownUpdate(str);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [lastCandleTime, timeframe, onCountdownUpdate]);

  return <span>Close: {countdown}</span>;
});

export const CandleChart: React.FC<CandleChartProps> = React.memo(({
  candles: rawCandles,
  currentPrice: rawCurrentPrice,
  symbol,
  timeframe,
  onTimeframeChange,
  activeSignal,
  onAcceptSignal,
  onUnlockSignal,
  onRefreshAnalysis,
  isRefreshingAnalysis = false,
  alerts = [],
  onOpenAlertsModal,
  onLoadMoreHistoricalCandles,
  currencyMode = 'USDT',
  inrPrice,
  theme = 'light',
  onAddTpSl,
  onOpenTradeModal,
  onClearSignal,
  signalCompletionStatus,
  autoRefreshMode,
  autoRefreshCountdown,
  onToggleAutoRefresh,
  isSplitMode = false,
  onMaximize,
  isLoadingCandles = false,
  loadingMessage,
  errorMessage = null,
  onRetryLoadCandles,
  tradeSetup,
}) => {
  const isLight = theme === 'light';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Responsive chart dimensions tracking via ResizeObserver
  const [chartDimensions, setChartDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const container = canvasContainerRef.current || containerRef.current;
    if (!container) return;

    const measure = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        setChartDimensions((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
      }
    };

    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            setChartDimensions({ width: Math.round(width), height: Math.round(height) });
          }
        }
      });
      ro.observe(container);
    }

    window.addEventListener('resize', measure);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Cached chart bounds & geometry for ultra-fast overlay rendering (0 re-renders on mousemove)
  const chartBoundsRef = useRef<{
    yMin: number;
    yMax: number;
    priceRange: number;
    chartWidth: number;
    mainChartHeight: number;
    paddingRight: number;
    candleWidth: number;
    visibleCount: number;
    startIdx: number;
  } | null>(null);

  // Stable TradingView-style price scale bounds to prevent jitter and automatic vertical jumping
  const stableBoundsRef = useRef<{
    yMin: number;
    yMax: number;
    symbol: string;
    currencyMode: string;
    timeframe: string;
    panOffset: number;
    visibleCount: number;
  } | null>(null);

  const lastHoveredCandleTimeRef = useRef<number | null>(null);
  const isHoveringPriceAxisRef = useRef<boolean>(false);
  const rafCrosshairId = useRef<number | null>(null);

  const isINR = currencyMode === 'INR' && inrPrice !== undefined && inrPrice > 0;
  const inrRateMultiplier = isINR && rawCurrentPrice > 0 ? inrPrice / rawCurrentPrice : 1;
  const currentPrice = isINR ? inrPrice : rawCurrentPrice;

  // Chart Style State
  const [chartType, setChartType] = useState<
    'candles' | 'line' | 'heikin_ashi' | 'hollow' | 'bars'
  >('candles');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Viewport & Interactive Navigation State
  const [visibleCandleCount, setVisibleCandleCount] = useState<number>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 24; // Bold, thick, clearly visible candles on mobile screens
    }
    return 44;
  });
  const [panOffset, setPanOffset] = useState<number>(0);
  const [chartInteractionMode, setChartInteractionMode] = useState<'crosshair' | 'pan'>('crosshair');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [dragStartPanOffset, setDragStartPanOffset] = useState<number>(0);
  const [dragStartPricePan, setDragStartPricePan] = useState<number>(0);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  // Price Scale Vertical Zoom & Pan State (TradingView-style interactive price axis)
  const [priceScaleZoom, setPriceScaleZoom] = useState<number>(1.0);
  const [pricePanOffset, setPricePanOffset] = useState<number>(0);
  const [isPriceScaleDragging, setIsPriceScaleDragging] = useState<boolean>(false);
  const [priceDragStartY, setPriceDragStartY] = useState<number>(0);
  const [priceDragStartZoom, setPriceDragStartZoom] = useState<number>(1.0);
  const [priceDragStartPan, setPriceDragStartPan] = useState<number>(0);
  const [isAutoScale, setIsAutoScale] = useState<boolean>(true);
  const [isHoveringPriceAxis, setIsHoveringPriceAxis] = useState<boolean>(false);

  // Reset price scaling when asset, timeframe, or currency mode changes
  useEffect(() => {
    setPriceScaleZoom(1.0);
    setPricePanOffset(0);
    setIsAutoScale(true);
    stableBoundsRef.current = null;
  }, [symbol, timeframe, currencyMode]);

  // Indicators State
  const [activeIndicators, setActiveIndicators] = useState<ActiveIndicatorState[]>(() => {
    try {
      const saved = localStorage.getItem('lumina_chart_indicators');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ACTIVE_INDICATORS;
  });

  const handleResetDefaultIndicators = useCallback(() => {
    setActiveIndicators(DEFAULT_ACTIVE_INDICATORS);
    try {
      localStorage.setItem('lumina_chart_indicators', JSON.stringify(DEFAULT_ACTIVE_INDICATORS));
    } catch {}
  }, []);
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [showAiLevels, setShowAiLevels] = useState(true);
  const [showSMC, setShowSMC] = useState(false); // SMC off by default for pristine clean candles
  const [showAlerts, setShowAlerts] = useState(true);
  const [isAiHudCollapsed, setIsAiHudCollapsed] = useState<boolean>(true);
  const [isIndicatorsCollapsed, setIsIndicatorsCollapsed] = useState<boolean>(() => {
    if (isSplitMode) return true;
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1440; // Progressive disclosure on <=1280px screens (M-02)
    }
    return false;
  });

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState<DrawingToolType>('cursor');
  const [isDrawingToolbarOpen, setIsDrawingToolbarOpen] = useState(() => {
    if (isSplitMode) return false;
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [currentColor, setCurrentColor] = useState('#00ff94');
  const [currentLineWidth, setCurrentLineWidth] = useState(2);
  const [currentLineStyle, setCurrentLineStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');
  const [isMagnetMode, setIsMagnetMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isDrawingsVisible, setIsDrawingsVisible] = useState(true);
  const [drawings, setDrawings] = useState<DrawingElement[]>(() => {
    try {
      const saved = localStorage.getItem(`lumina_drawings_${symbol}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);

  // In-progress drawing
  const [currentDrawing, setCurrentDrawing] = useState<DrawingElement | null>(null);
  const [isDrawingInProgress, setIsDrawingInProgress] = useState(false);
  const dragStartPointRef = useRef<{ x: number; y: number } | null>(null);

  // Keyboard shortcut listener for deleting selected drawing, undo, escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDrawingId) {
        setDrawings((prev) => prev.filter((d) => d.id !== selectedDrawingId));
        setSelectedDrawingId(null);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        setDrawings((prev) => prev.slice(0, -1));
        setSelectedDrawingId(null);
      }

      if (e.key === 'Escape') {
        setSelectedDrawingId(null);
        setCurrentDrawing(null);
        setIsDrawingInProgress(false);
        setActiveTool('cursor');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDrawingId]);

  // Mouse & HUD State
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [isChartTypeDropdownOpen, setIsChartTypeDropdownOpen] = useState(false);

  // Persist Indicators & Drawings
  useEffect(() => {
    try {
      localStorage.setItem('lumina_chart_indicators', JSON.stringify(activeIndicators));
    } catch {}
  }, [activeIndicators]);

  useEffect(() => {
    try {
      localStorage.setItem(`lumina_drawings_${symbol}`, JSON.stringify(drawings));
    } catch {}
  }, [drawings, symbol]);

  // Timeframe list
  const TIMEFRAMES = ['1s', '1m', '5m', '15m', '1h', '4h', '1D'];

  // Ref for latest candle countdown text (avoids 1s canvas re-rendering loops)
  const candleCountdownRef = useRef<string>('00:00');

  // Calculate Candle Formats & strictly synchronize live currentPrice
  const candles = useMemo(() => {
    if (!rawCandles || rawCandles.length === 0) return [];
    const list = rawCandles.map((c) => ({
      ...c,
      open: isINR ? c.open * inrRateMultiplier : c.open,
      high: isINR ? c.high * inrRateMultiplier : c.high,
      low: isINR ? c.low * inrRateMultiplier : c.low,
      close: isINR ? c.close * inrRateMultiplier : c.close,
    }));
    // Always align the latest active candle's close, high, and low with the real-time live currentPrice
    if (typeof currentPrice === 'number' && !isNaN(currentPrice) && currentPrice > 0) {
      const lastIdx = list.length - 1;
      const last = list[lastIdx];
      list[lastIdx] = {
        ...last,
        close: currentPrice,
        high: Math.max(last.high, currentPrice),
        low: Math.min(last.low, currentPrice),
      };
    }
    if (chartType === 'heikin_ashi') {
      return convertToHeikinAshi(list);
    }
    return list;
  }, [rawCandles, currentPrice, isINR, inrRateMultiplier, chartType]);

  // Safely trigger historical candle loading when panning near the historical boundary
  const lastLoadedCandleCountRef = useRef<number>(0);
  useEffect(() => {
    if (!onLoadMoreHistoricalCandles) return;
    if (
      candles.length > 0 &&
      candles.length < 1000 &&
      candles.length !== lastLoadedCandleCountRef.current &&
      panOffset + visibleCandleCount >= candles.length - 15
    ) {
      lastLoadedCandleCountRef.current = candles.length;
      onLoadMoreHistoricalCandles();
    }
  }, [panOffset, visibleCandleCount, candles.length, onLoadMoreHistoricalCandles]);

  // Viewport Slicing for Smooth Historical Panning
  const { visibleCandles, startIdx, endIdx } = useMemo(() => {
    const total = candles.length;
    if (total === 0) return { visibleCandles: [], startIdx: 0, endIdx: 0 };
    const clampedVisible = Math.max(12, Math.min(260, visibleCandleCount));
    const maxOffset = Math.max(0, total - 12);
    const clampedOffset = Math.max(0, Math.min(maxOffset, panOffset));
    const end = Math.max(clampedVisible, total - clampedOffset);
    const start = Math.max(0, end - clampedVisible);
    return {
      visibleCandles: candles.slice(start, end),
      startIdx: start,
      endIdx: end,
    };
  }, [candles, visibleCandleCount, panOffset]);

  // Indicator Map helper
  const indMap = useMemo(() => {
    const map = new Map<string, ActiveIndicatorState>();
    activeIndicators.forEach((ind) => {
      if (ind.enabled && ind.visible !== false) {
        map.set(ind.indicatorId || ind.id, ind);
        map.set(ind.id, ind);
      }
    });
    return map;
  }, [activeIndicators]);

  // CPR (Central Pivot Range) Calculations
  const cpr = useMemo(
    () => (indMap.has('cpr') ? calculateCPR(candles, Number(indMap.get('cpr')?.params?.lookback) || 24, timeframe) : null),
    [candles, indMap, timeframe]
  );
  const cprConfluence = useMemo(
    () => (indMap.has('cpr_confluence') ? evaluateCPRConfluenceStrategy(candles) : null),
    [candles, indMap]
  );

  // Technical Calculations across full history
  const ema9 = useMemo(
    () => (indMap.has('ema_9') ? calculateEMA(candles, Number(indMap.get('ema_9')?.params?.period) || 9) : []),
    [candles, indMap]
  );
  const ema21 = useMemo(
    () => (indMap.has('ema_21') ? calculateEMA(candles, Number(indMap.get('ema_21')?.params?.period) || 21) : []),
    [candles, indMap]
  );
  const ema26 = useMemo(
    () => (indMap.has('ema_26') ? calculateEMA(candles, Number(indMap.get('ema_26')?.params?.period) || 26) : []),
    [candles, indMap]
  );
  const ema50 = useMemo(
    () => (indMap.has('ema_50') ? calculateEMA(candles, Number(indMap.get('ema_50')?.params?.period) || 50) : []),
    [candles, indMap]
  );
  const ema200 = useMemo(
    () => (indMap.has('ema_200') ? calculateEMA(candles, Number(indMap.get('ema_200')?.params?.period) || 200) : []),
    [candles, indMap]
  );
  const sma20 = useMemo(
    () => (indMap.has('sma_20') ? calculateSMA(candles, Number(indMap.get('sma_20')?.params?.period) || 20) : []),
    [candles, indMap]
  );
  const vwap = useMemo(() => (indMap.has('vwap') ? calculateVWAP(candles) : []), [candles, indMap]);
  const supertrend = useMemo(
    () =>
      indMap.has('supertrend')
        ? calculateSupertrend(
            candles,
            Number(indMap.get('supertrend')?.params?.period) || 10,
            Number(indMap.get('supertrend')?.params?.multiplier) || 3
          )
        : null,
    [candles, indMap]
  );
  const parabolicSar = useMemo(
    () =>
      indMap.has('parabolic_sar')
        ? calculateParabolicSAR(
            candles,
            Number(indMap.get('parabolic_sar')?.params?.step) || 0.02,
            Number(indMap.get('parabolic_sar')?.params?.max) || 0.2
          )
        : [],
    [candles, indMap]
  );
  const pivots = useMemo(
    () => (indMap.has('pivot_points') ? calculatePivotPoints(candles) : null),
    [candles, indMap]
  );
  const bollinger = useMemo(
    () =>
      indMap.has('bollinger_bands')
        ? calculateBollingerBands(
            candles,
            Number(indMap.get('bollinger_bands')?.params?.period) || 20,
            Number(indMap.get('bollinger_bands')?.params?.stdDev) || 2
          )
        : null,
    [candles, indMap]
  );
  const keltner = useMemo(
    () =>
      indMap.has('keltner_channels')
        ? calculateKeltnerChannels(
            candles,
            Number(indMap.get('keltner_channels')?.params?.period) || 20,
            Number(indMap.get('keltner_channels')?.params?.multiplier) || 2
          )
        : null,
    [candles, indMap]
  );
  const donchian = useMemo(
    () =>
      indMap.has('donchian_channels')
        ? calculateDonchianChannels(
            candles,
            Number(indMap.get('donchian_channels')?.params?.period) || 20
          )
        : null,
    [candles, indMap]
  );
  const volumeProfile = useMemo(
    () => (indMap.has('volume_profile') ? calculateVolumeProfile(visibleCandles, 24) : null),
    [visibleCandles, indMap]
  );
  const smartMoney = useMemo(
    () => (indMap.has('smart_money_zones') ? calculateSmartMoneyZones(candles) : null),
    [candles, indMap]
  );

  // Sub-charts calculations
  const adx = useMemo(
    () => (indMap.has('adx_14') ? calculateADX(candles, Number(indMap.get('adx_14')?.params?.period) || 14) : null),
    [candles, indMap]
  );
  const rsi = useMemo(
    () => (indMap.has('rsi_14') ? calculateRSI(candles, Number(indMap.get('rsi_14')?.params?.period) || 14) : []),
    [candles, indMap]
  );
  const macd = useMemo(
    () =>
      indMap.has('macd')
        ? calculateMACD(
            candles,
            Number(indMap.get('macd')?.params?.fast) || 12,
            Number(indMap.get('macd')?.params?.slow) || 26,
            Number(indMap.get('macd')?.params?.signal) || 9
          )
        : null,
    [candles, indMap]
  );
  const stochastic = useMemo(
    () =>
      indMap.has('stochastic')
        ? calculateStochastic(
            candles,
            Number(indMap.get('stochastic')?.params?.periodK) || 14,
            Number(indMap.get('stochastic')?.params?.periodD) || 3,
            Number(indMap.get('stochastic')?.params?.smooth) || 3
          )
        : null,
    [candles, indMap]
  );
  const atr = useMemo(
    () => (indMap.has('atr_14') ? calculateATR(candles, Number(indMap.get('atr_14')?.params?.period) || 14) : []),
    [candles, indMap]
  );
  const obv = useMemo(() => (indMap.has('obv') ? calculateOBV(candles) : []), [candles, indMap]);
  const cci = useMemo(
    () => (indMap.has('cci') ? calculateCCI(candles, Number(indMap.get('cci')?.params?.period) || 20) : []),
    [candles, indMap]
  );
  const williamsR = useMemo(
    () => (indMap.has('williams_r') ? calculateWilliamsR(candles, Number(indMap.get('williams_r')?.params?.period) || 14) : []),
    [candles, indMap]
  );

  // Determine active sub-charts
  const activeSubCharts = useMemo(() => {
    const list: string[] = [];
    if (indMap.has('rsi_14')) list.push('rsi_14');
    if (indMap.has('macd')) list.push('macd');
    if (indMap.has('stochastic')) list.push('stochastic');
    if (indMap.has('adx_14')) list.push('adx_14');
    if (indMap.has('atr_14')) list.push('atr_14');
    if (indMap.has('cci')) list.push('cci');
    if (indMap.has('williams_r')) list.push('williams_r');
    if (indMap.has('obv')) list.push('obv');
    return list;
  }, [indMap]);

  // Helper to format timestamps along bottom time axis
  const formatTimeLabel = useCallback((timestamp: number) => {
    const d = new Date(timestamp);
    if (timeframe === '1s') {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    if (timeframe === '1m' || timeframe === '5m' || timeframe === '15m') {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (timeframe === '1h' || timeframe === '4h') {
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' });
  }, [timeframe]);

  // Helper to format full date and time for crosshair hover and tooltips
  const formatFullDateTime = useCallback((timestamp: number) => {
    const d = new Date(timestamp);
    const dayStr = d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    return `${dayStr} ${timeStr}`;
  }, []);

  // Ultra-fast zero-re-render overlay crosshairs using dedicated overlay canvas
  const drawCrosshair = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = overlayCanvasRef.current;
      const baseCanvas = canvasRef.current;
      if (!canvas || !baseCanvas) return;
      const rect = baseCanvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const height = rect.height;

      // Fast clear overlay canvas
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      const bounds = chartBoundsRef.current;
      if (!bounds) {
        ctx.restore();
        return;
      }

      const { chartWidth, mainChartHeight, paddingRight, yMax, priceRange, candleWidth, visibleCount } = bounds;

      if (x >= 0 && x < chartWidth && y >= 0 && y < height) {
        const localIdx = Math.min(
          visibleCount - 1,
          Math.max(0, Math.floor((x - 10) / candleWidth))
        );
        const candleX = Math.round(10 + localIdx * candleWidth + candleWidth / 2);
        const activeC = visibleCandles[localIdx];

        // Update hovered candle ONLY when candle bar changes
        if (activeC && activeC.time !== lastHoveredCandleTimeRef.current) {
          lastHoveredCandleTimeRef.current = activeC.time;
          setHoveredCandle(activeC);
        }

        // Vertical line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(candleX, 0);
        ctx.lineTo(candleX, height);
        ctx.stroke();

        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Time & Date tag on bottom axis
        if (activeC) {
          const fullTimeStr = formatFullDateTime(activeC.time);
          const tagW = Math.max(135, fullTimeStr.length * 6.5 + 14);
          const clampedX = Math.max(tagW / 2 + 2, Math.min(chartWidth - tagW / 2 - 2, candleX));

          ctx.fillStyle = '#1e222d';
          ctx.fillRect(clampedX - tagW / 2, mainChartHeight + 2, tagW, 18);
          ctx.strokeStyle = '#f6be16';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(clampedX - tagW / 2, mainChartHeight + 2, tagW, 18);

          ctx.fillStyle = '#ffd87f';
          ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(fullTimeStr, clampedX, mainChartHeight + 14.5);
        }

        // Price tag on right price axis
        if (y <= mainChartHeight) {
          const mousePrice = yMax - ((y - 10) / (mainChartHeight - 20)) * priceRange;
          ctx.fillStyle = '#f6be16';
          ctx.fillRect(chartWidth + 2, y - 8, paddingRight - 4, 16);
          ctx.fillStyle = '#0b0e11';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(
            mousePrice.toFixed(mousePrice > 100 ? 2 : 4),
            chartWidth + 6,
            y + 4
          );
        }
      }
      ctx.restore();
    },
    [visibleCandles, formatTimeLabel, formatFullDateTime]
  );

  const clearCrosshair = useCallback(() => {
    if (rafCrosshairId.current) {
      cancelAnimationFrame(rafCrosshairId.current);
      rafCrosshairId.current = null;
    }
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    lastHoveredCandleTimeRef.current = null;
    setHoveredCandle(null);
  }, []);

  // Main Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current || containerRef.current;
    if (!canvas || !container || visibleCandles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = chartDimensions.width > 0 ? chartDimensions.width : (container.clientWidth || 600);
    const height = chartDimensions.height > 0 ? chartDimensions.height : (container.clientHeight || 450);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    const overlayCanvas = overlayCanvasRef.current;
    if (overlayCanvas) {
      overlayCanvas.width = width * dpr;
      overlayCanvas.height = height * dpr;
      overlayCanvas.style.width = `${width}px`;
      overlayCanvas.style.height = `${height}px`;
    }

    // Layout configuration
    const paddingRight = 78; // Price axis width
    const subChartCount = activeSubCharts.length;
    const maxSubChartsArea = height * 0.42; // cap subcharts to 42% of total chart height
    const subChartHeight = subChartCount > 0 ? Math.max(38, Math.min(62, Math.floor((maxSubChartsArea - subChartCount * 8) / subChartCount))) : 0;
    const totalSubChartHeight = subChartCount > 0 ? subChartCount * (subChartHeight + 8) : 0;
    const paddingBottom = totalSubChartHeight + 22;
    const chartWidth = Math.max(100, width - paddingRight);
    const mainChartHeight = Math.max(120, height - paddingBottom);

    const isLight = theme === 'light';

    // Clear background
    ctx.fillStyle = isLight ? '#ffffff' : '#111417';
    ctx.fillRect(0, 0, width, height);

    // Visible candles metrics - Calculate optimal bar width and crisp rendering
    // TradingView-style right margin ensures the active forming candle is never squished against price axis
    const count = visibleCandles.length;
    const rightOffsetBars = panOffset === 0 ? 4 : 0;
    const totalSlots = Math.max(12, count + rightOffsetBars);
    const candleWidth = Math.max(3.5, (chartWidth - 20) / totalSlots);
    const candleSpacing = Math.max(1.2, Math.min(6, candleWidth * 0.22));
    const barWidth = Math.max(3, Math.round(candleWidth - candleSpacing));

    // Dynamic Price Bounds based on actual visible candles
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    visibleCandles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    // Always keep currentPrice inside the bounds so price line is never off screen
    if (panOffset === 0 && typeof currentPrice === 'number' && !isNaN(currentPrice) && currentPrice > 0) {
      if (currentPrice < minPrice) minPrice = currentPrice;
      if (currentPrice > maxPrice) maxPrice = currentPrice;
    }

    // Fallback if no valid prices found
    if (minPrice === Infinity || maxPrice === -Infinity || minPrice === maxPrice) {
      minPrice = currentPrice * 0.98;
      maxPrice = currentPrice * 1.02;
    }

    // Measure the actual candlestick price span
    const candleSpan = Math.max(maxPrice - minPrice, currentPrice * 0.004);

    // Factor in AI signals with currency conversion so they render stably without flickering
    if (activeSignal && showAiLevels && activeSignal.symbol === symbol) {
      const sigMultiplier = isINR && inrRateMultiplier > 0 ? inrRateMultiplier : 1;
      const sigEntry = activeSignal.entryPrice * sigMultiplier;
      const sigTarget = (activeSignal.target1 || activeSignal.target2) * sigMultiplier;
      const sigSL = activeSignal.stopLoss * sigMultiplier;

      // Gracefully include signal levels if they are within a clean 45% margin
      const proximitySpan = candleSpan * 0.45;
      if (sigTarget > maxPrice && sigTarget - maxPrice <= proximitySpan) {
        maxPrice = sigTarget;
      }
      if (sigEntry > maxPrice && sigEntry - maxPrice <= proximitySpan) {
        maxPrice = sigEntry;
      }
      if (sigEntry < minPrice && minPrice - sigEntry <= proximitySpan) {
        minPrice = sigEntry;
      }
      if (sigSL < minPrice && minPrice - sigSL <= proximitySpan) {
        minPrice = sigSL;
      }
    }

    // Factor in active price alerts if within close proximity
    if (showAlerts) {
      const proximitySpan = candleSpan * 0.4;
      alerts
        .filter((a) => a.symbol === symbol && a.status === 'active')
        .forEach((a) => {
          if (a.targetPrice <= maxPrice + proximitySpan && a.targetPrice > maxPrice) maxPrice = a.targetPrice;
          if (a.targetPrice >= minPrice - proximitySpan && a.targetPrice < minPrice) minPrice = a.targetPrice;
        });
    }

    // TradingView-Style Rock-Solid Vertical Auto-Scale System:
    // When prices fluctuate inside the visible chart, we lock the Y-axis bounds
    // so historical candlesticks, grid lines, and price labels do NOT jump or bob up and down.
    const baseMid = (maxPrice + minPrice) / 2;
    const baseSpan = Math.max(maxPrice - minPrice, baseMid * 0.005);
    const bufferFactor = 0.12; // 12% headroom gives tall, bold, readable candles
    const desiredEffectiveSpan = baseSpan * (1 + bufferFactor);
    const desiredYMin = baseMid - desiredEffectiveSpan / 2;
    const desiredYMax = baseMid + desiredEffectiveSpan / 2;

    let computedYMin = desiredYMin;
    let computedYMax = desiredYMax;

    // Check cached stable bounds
    const prevStable = stableBoundsRef.current;
    const isContextChanged =
      !prevStable ||
      prevStable.symbol !== symbol ||
      prevStable.currencyMode !== currencyMode ||
      prevStable.timeframe !== timeframe ||
      Math.abs(prevStable.panOffset - panOffset) > 2 ||
      Math.abs(prevStable.visibleCount - count) > 4;

    if (isContextChanged) {
      stableBoundsRef.current = {
        yMin: desiredYMin,
        yMax: desiredYMax,
        symbol,
        currencyMode,
        timeframe,
        panOffset,
        visibleCount: count,
      };
      computedYMin = desiredYMin;
      computedYMax = desiredYMax;
    } else {
      // Continuous live mode:
      // Verify if current price and visible candles are comfortably within cached bounds
      const cachedMin = prevStable.yMin;
      const cachedMax = prevStable.yMax;
      const cachedSpan = cachedMax - cachedMin;

      // Safe inner boundary (3% cushion from edge)
      const isComfortablyInside =
        minPrice >= cachedMin + cachedSpan * 0.03 &&
        maxPrice <= cachedMax - cachedSpan * 0.03 &&
        cachedSpan / desiredEffectiveSpan <= 1.35 &&
        cachedSpan / desiredEffectiveSpan >= 0.75;

      if (isComfortablyInside && !isDragging && !isPriceScaleDragging) {
        // LOCK BOUNDS: Completely eliminates micro-jitter and vertical jumping!
        computedYMin = cachedMin;
        computedYMax = cachedMax;
      } else {
        // Smoothly adapt bounds towards desired range with damping (lerp)
        const dampingFactor = isDragging || isPriceScaleDragging ? 0.85 : 0.16;
        const newYMin = cachedMin + (desiredYMin - cachedMin) * dampingFactor;
        const newYMax = cachedMax + (desiredYMax - cachedMax) * dampingFactor;

        stableBoundsRef.current = {
          yMin: newYMin,
          yMax: newYMax,
          symbol,
          currencyMode,
          timeframe,
          panOffset,
          visibleCount: count,
        };
        computedYMin = newYMin;
        computedYMax = newYMax;
      }
    }

    // Apply interactive price scale zoom & vertical pan if adjusted by user
    let yMin = computedYMin;
    let yMax = computedYMax;

    if (priceScaleZoom !== 1.0 || pricePanOffset !== 0) {
      const activeMid = (computedYMax + computedYMin) / 2 + pricePanOffset;
      const activeSpan = (computedYMax - computedYMin) / Math.max(0.12, priceScaleZoom);
      yMin = activeMid - activeSpan / 2;
      yMax = activeMid + activeSpan / 2;
    }

    const priceRange = Math.max(yMax - yMin, 0.000001);

    // Cache bounds for instant zero-lag overlay crosshairs
    chartBoundsRef.current = {
      yMin,
      yMax,
      priceRange,
      chartWidth,
      mainChartHeight,
      paddingRight,
      candleWidth,
      visibleCount: count,
      startIdx,
    };

    const getPriceY = (price: number) => {
      return mainChartHeight - ((price - yMin) / priceRange) * (mainChartHeight - 20) - 10;
    };

    const getIndexX = (localIndex: number) => {
      return 10 + localIndex * candleWidth + candleWidth / 2;
    };

    const getPointX = (pt: ChartPoint) => {
      let gIdx = pt.candleIndex;
      if (pt.time && candles.length > 0) {
        const interval = candles.length >= 2
          ? Math.max(1000, Math.abs(candles[candles.length - 1].time - candles[candles.length - 2].time))
          : 60000;

        if (pt.time >= candles[0].time && pt.time <= candles[candles.length - 1].time) {
          let closestIdx = 0;
          let minDiff = Infinity;
          for (let i = 0; i < candles.length; i++) {
            const diff = Math.abs(candles[i].time - pt.time);
            if (diff < minDiff) {
              minDiff = diff;
              closestIdx = i;
            } else if (diff > minDiff) {
              break;
            }
          }
          // Exact sub-bar interpolation
          const cTime = candles[closestIdx].time;
          const subFraction = (pt.time - cTime) / interval;
          gIdx = closestIdx + subFraction;
        } else if (pt.time > candles[candles.length - 1].time) {
          const futureDiff = pt.time - candles[candles.length - 1].time;
          gIdx = candles.length - 1 + futureDiff / interval;
        } else {
          const pastDiff = candles[0].time - pt.time;
          gIdx = -pastDiff / interval;
        }
      }
      const localIdx = gIdx - startIdx;
      return 10 + localIdx * candleWidth + candleWidth / 2;
    };

    // Draw Right Price Axis Column Background & Border
    ctx.fillStyle = isLight
      ? isPriceScaleDragging
        ? '#f1f5f9'
        : isHoveringPriceAxis
        ? '#f8fafc'
        : '#ffffff'
      : isPriceScaleDragging
      ? '#171b20'
      : isHoveringPriceAxis
      ? '#15181c'
      : '#121518';
    ctx.fillRect(chartWidth, 0, paddingRight, height);

    ctx.strokeStyle = isLight
      ? isPriceScaleDragging
        ? 'rgba(37, 99, 235, 0.4)'
        : '#e0e3eb'
      : isPriceScaleDragging
      ? 'rgba(0, 255, 148, 0.5)'
      : isHoveringPriceAxis
      ? '#373a3e'
      : '#222529';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartWidth, 0);
    ctx.lineTo(chartWidth, height);
    ctx.stroke();

    // Draw Dynamic Adaptive Horizontal Price Grid Lines & Labels
    const roughSteps = Math.max(4, Math.min(10, Math.floor(mainChartHeight / 42)));
    const rawStep = priceRange / roughSteps;
    const mag = Math.pow(10, Math.floor(Math.log10(Math.max(rawStep, 0.000001))));
    let niceStep = mag;
    const residual = rawStep / mag;
    if (residual > 5) niceStep = 5 * mag;
    else if (residual > 2) niceStep = 2 * mag;
    else niceStep = mag;

    const startGridPrice = Math.floor(yMin / niceStep) * niceStep;
    ctx.strokeStyle = isLight ? '#f0f3fa' : '#1d2023';
    ctx.lineWidth = 1;
    ctx.fillStyle = isLight
      ? '#131722'
      : isHoveringPriceAxis || isPriceScaleDragging
      ? '#e1ded8'
      : '#99907f';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';

    const decimals =
      niceStep < 0.001 ? 5 : niceStep < 0.01 ? 4 : niceStep < 1 ? 3 : niceStep < 10 ? 2 : currentPrice > 1000 ? 1 : 2;

    for (let p = startGridPrice; p <= yMax + niceStep; p += niceStep) {
      const y = getPriceY(p);
      if (y < 4 || y > mainChartHeight + 2) continue;

      // Grid line across chart
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Tick mark on axis
      ctx.beginPath();
      ctx.moveTo(chartWidth, y);
      ctx.lineTo(chartWidth + 4, y);
      ctx.stroke();

      // Price Axis Text
      ctx.fillText(p.toFixed(decimals), chartWidth + 7, y + 3.5);
    }

    // Draw "AUTO" tag on bottom right of price scale if manually scaled or panned
    if (!isAutoScale || Math.abs(priceScaleZoom - 1.0) > 0.01 || Math.abs(pricePanOffset) > 0.0001) {
      const autoY = mainChartHeight - 16;
      ctx.fillStyle = isLight ? '#eff6ff' : '#22262b';
      ctx.fillRect(chartWidth + 6, autoY, paddingRight - 12, 16);
      ctx.strokeStyle = isLight ? '#2563eb' : '#00ff94';
      ctx.lineWidth = 1;
      ctx.strokeRect(chartWidth + 6, autoY, paddingRight - 12, 16);
      ctx.fillStyle = isLight ? '#2563eb' : '#00ff94';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AUTO ↺', chartWidth + (paddingRight / 2), autoY + 11.5);
    }

    // Draw Bottom Time Axis Bar Background & Separator Line
    ctx.fillStyle = isLight ? '#f8fafc' : '#131619';
    ctx.fillRect(0, mainChartHeight, chartWidth, 24);
    ctx.strokeStyle = isLight ? '#e0e3eb' : '#222529';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mainChartHeight);
    ctx.lineTo(chartWidth, mainChartHeight);
    ctx.stroke();

    // Corner Timezone / Clock Indicator Box
    ctx.fillStyle = isLight ? '#f1f5f9' : '#171a1e';
    ctx.fillRect(chartWidth, mainChartHeight, paddingRight, 24);
    ctx.strokeStyle = isLight ? '#e0e3eb' : '#222529';
    ctx.lineWidth = 1;
    ctx.strokeRect(chartWidth, mainChartHeight, paddingRight, 24);
    ctx.fillStyle = isLight ? '#64748b' : '#ffd87f';
    ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('UTC+5:30', chartWidth + (paddingRight / 2), mainChartHeight + 15);

    // Draw Vertical Time Grid Lines & Bottom Time Labels (Multi-tier Date & Candle Time)
    const timeStep = Math.max(1, Math.floor(visibleCandles.length / 7));
    ctx.textAlign = 'center';

    let lastRenderedDate = '';
    for (let i = 0; i < visibleCandles.length; i += timeStep) {
      const c = visibleCandles[i];
      if (!c) continue;
      const x = getIndexX(i);

      // Grid line extending up the chart
      ctx.strokeStyle = isLight ? '#f0f3fa' : '#181b1e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mainChartHeight);
      ctx.stroke();

      const d = new Date(c.time);
      const dateDay = d.toLocaleDateString([], { day: 'numeric', month: 'short' });
      const timeStr = timeframe === '1s'
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (timeframe === '1D') {
        const yearDateStr = d.toLocaleDateString([], { day: 'numeric', month: 'short', year: '2-digit' });
        ctx.fillStyle = isLight ? '#334155' : '#e1e2e7';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillText(yearDateStr, x, mainChartHeight + 15);
      } else {
        // Multi-tier display: Time on top, Date underneath
        ctx.fillStyle = isLight ? '#0f172a' : '#e1e2e7';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillText(timeStr, x, mainChartHeight + 10);

        const isNewDay = dateDay !== lastRenderedDate;
        lastRenderedDate = dateDay;
        ctx.fillStyle = isNewDay ? '#f6be16' : (isLight ? '#64748b' : '#99907f');
        ctx.font = isNewDay ? 'bold 8.5px "JetBrains Mono", monospace' : '8px "JetBrains Mono", monospace';
        ctx.fillText(dateDay, x, mainChartHeight + 19);
      }
    }

    // Draw Volume Bars
    if (indMap.has('volume_bars')) {
      const volumeAreaHeight = mainChartHeight * 0.22;
      visibleCandles.forEach((c, i) => {
        const x = getIndexX(i);
        const volHeight = (c.volume / (maxVolume || 1)) * volumeAreaHeight;
        const y = mainChartHeight - volHeight;

        ctx.fillStyle =
          c.close >= c.open
            ? isLight
              ? 'rgba(8, 153, 129, 0.35)'
              : 'rgba(8, 153, 129, 0.22)'
            : isLight
            ? 'rgba(242, 54, 69, 0.35)'
            : 'rgba(242, 54, 69, 0.22)';
        ctx.fillRect(x - barWidth / 2, y, barWidth, volHeight);
      });
    }

    // Draw Volume Profile (VPVR on Right Axis)
    if (volumeProfile && volumeProfile.bins.length > 0) {
      const vpMaxWidth = chartWidth * 0.18;
      volumeProfile.bins.forEach((bin) => {
        const yTop = getPriceY(bin.priceHigh);
        const yBottom = getPriceY(bin.priceLow);
        const binHeight = Math.max(2, Math.abs(yBottom - yTop));
        const totalW = (bin.totalVolume / (volumeProfile.maxVol || 1)) * vpMaxWidth;
        const buyW = (bin.buyVolume / (volumeProfile.maxVol || 1)) * vpMaxWidth;
        const sellW = totalW - buyW;

        const xRight = chartWidth;
        ctx.fillStyle = 'rgba(0, 255, 148, 0.12)';
        ctx.fillRect(xRight - totalW, yTop, buyW, binHeight - 1);
        ctx.fillStyle = 'rgba(255, 59, 74, 0.12)';
        ctx.fillRect(xRight - totalW + buyW, yTop, sellW, binHeight - 1);
      });

      // Point of Control (POC) Line
      const pocY = getPriceY(volumeProfile.pocPrice);
      ctx.strokeStyle = '#ffd87f';
      ctx.setLineDash([4, 2]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartWidth - vpMaxWidth - 10, pocY);
      ctx.lineTo(chartWidth, pocY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Bollinger Bands
    if (bollinger && bollinger.upper.length > 0) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.beginPath();
      visibleCandles.forEach((_, i) => {
        const gIdx = startIdx + i;
        const val = bollinger.upper[gIdx];
        if (val !== undefined) {
          const x = getIndexX(i);
          const y = getPriceY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      for (let i = visibleCandles.length - 1; i >= 0; i--) {
        const gIdx = startIdx + i;
        const val = bollinger.lower[gIdx];
        if (val !== undefined) {
          const x = getIndexX(i);
          const y = getPriceY(val);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      // Band Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      visibleCandles.forEach((_, i) => {
        const gIdx = startIdx + i;
        const val = bollinger.upper[gIdx];
        if (val !== undefined) {
          const x = getIndexX(i);
          const y = getPriceY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      ctx.beginPath();
      visibleCandles.forEach((_, i) => {
        const gIdx = startIdx + i;
        const val = bollinger.lower[gIdx];
        if (val !== undefined) {
          const x = getIndexX(i);
          const y = getPriceY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw Keltner Channels
    if (keltner && keltner.upper.length > 0) {
      ctx.fillStyle = 'rgba(192, 132, 252, 0.04)';
      ctx.beginPath();
      visibleCandles.forEach((_, i) => {
        const gIdx = startIdx + i;
        const val = keltner.upper[gIdx];
        if (val !== undefined) {
          const x = getIndexX(i);
          const y = getPriceY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      for (let i = visibleCandles.length - 1; i >= 0; i--) {
        const gIdx = startIdx + i;
        const val = keltner.lower[gIdx];
        if (val !== undefined) {
          const x = getIndexX(i);
          const y = getPriceY(val);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      visibleCandles.forEach((_, i) => {
        const gIdx = startIdx + i;
        const val = keltner.upper[gIdx];
        if (val !== undefined) {
          const x = getIndexX(i);
          const y = getPriceY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      ctx.beginPath();
      visibleCandles.forEach((_, i) => {
        const gIdx = startIdx + i;
        const val = keltner.lower[gIdx];
        if (val !== undefined) {
          const x = getIndexX(i);
          const y = getPriceY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw Donchian Channels
    if (donchian && donchian.upper.length > 0) {
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      visibleCandles.forEach((_, i) => {
        const gIdx = startIdx + i;
        const val = donchian.upper[gIdx];
        if (val !== undefined) {
          const x = getIndexX(i);
          const y = getPriceY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      ctx.beginPath();
      visibleCandles.forEach((_, i) => {
        const gIdx = startIdx + i;
        const val = donchian.lower[gIdx];
        if (val !== undefined) {
          const x = getIndexX(i);
          const y = getPriceY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Draw Smart Money Zones (FVGs and Order Blocks)
    if (smartMoney) {
      // FVGs
      smartMoney.fvgs.forEach((fvg) => {
        const localStart = fvg.startIndex - startIdx;
        if (localStart < visibleCandles.length && localStart + 30 >= 0) {
          const yTop = getPriceY(fvg.top);
          const yBottom = getPriceY(fvg.bottom);
          const xStart = Math.max(0, getIndexX(Math.max(0, localStart)));
          const isBull = fvg.type === 'bullish';

          ctx.fillStyle = isBull ? 'rgba(0, 255, 148, 0.12)' : 'rgba(255, 59, 74, 0.12)';
          ctx.strokeStyle = isBull ? 'rgba(0, 255, 148, 0.4)' : 'rgba(255, 59, 74, 0.4)';
          ctx.lineWidth = 1;
          ctx.fillRect(xStart, yTop, chartWidth - xStart, yBottom - yTop);
          ctx.strokeRect(xStart, yTop, chartWidth - xStart, yBottom - yTop);

          ctx.fillStyle = isBull ? '#00ff94' : '#ff3b4a';
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.fillText(`FVG ${fvg.type.toUpperCase()}`, xStart + 4, yTop + 10);
        }
      });

      // Order Blocks
      smartMoney.orderBlocks.forEach((ob) => {
        const localStart = ob.startIndex - startIdx;
        if (localStart < visibleCandles.length && localStart + 30 >= 0) {
          const yTop = getPriceY(ob.top);
          const yBottom = getPriceY(ob.bottom);
          const xStart = Math.max(0, getIndexX(Math.max(0, localStart)));
          const isBull = ob.type === 'bullish';

          ctx.fillStyle = isBull ? 'rgba(0, 255, 148, 0.18)' : 'rgba(255, 59, 74, 0.18)';
          ctx.strokeStyle = isBull ? '#00ff94' : '#ff3b4a';
          ctx.lineWidth = 1.2;
          ctx.fillRect(xStart, yTop, chartWidth - xStart, yBottom - yTop);
          ctx.strokeRect(xStart, yTop, chartWidth - xStart, yBottom - yTop);

          ctx.fillStyle = isBull ? '#00ff94' : '#ff3b4a';
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillText(`OB ${ob.type.toUpperCase()}`, xStart + 4, yTop + 10);
        }
      });
    }

    // Draw Candlesticks / Chart Type
    if (chartType === 'line') {
      ctx.fillStyle = 'rgba(0, 255, 148, 0.08)';
      ctx.beginPath();
      visibleCandles.forEach((c, i) => {
        const x = getIndexX(i);
        const y = getPriceY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(getIndexX(visibleCandles.length - 1), mainChartHeight);
      ctx.lineTo(getIndexX(0), mainChartHeight);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#00ff94';
      ctx.lineWidth = 2;
      ctx.beginPath();
      visibleCandles.forEach((c, i) => {
        const x = getIndexX(i);
        const y = getPriceY(c.close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    } else if (chartType === 'bars') {
      visibleCandles.forEach((c, i) => {
        const x = getIndexX(i);
        const isUp = c.close >= c.open;
        const color = isUp ? '#00ff94' : '#ff3b4a';

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, getPriceY(c.high));
        ctx.lineTo(x, getPriceY(c.low));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - barWidth / 2, getPriceY(c.open));
        ctx.lineTo(x, getPriceY(c.open));
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, getPriceY(c.close));
        ctx.lineTo(x + barWidth / 2, getPriceY(c.close));
        ctx.stroke();
      });
    } else {
      // Standard / Hollow / Heikin Ashi Candles - Thick, high-contrast, crisp rendering
      visibleCandles.forEach((c, i) => {
        const x = Math.round(getIndexX(i));
        const isUp = c.close >= c.open;

        // TradingView High-Contrast Palette: Rich deep emerald & crimson in light mode; neon emerald & coral in dark mode
        const bullColor = isLight ? '#089981' : '#00ff94';
        const bearColor = isLight ? '#f23645' : '#ff3b4a';
        const color = isUp ? bullColor : bearColor;

        const yOpen = getPriceY(c.open);
        const yClose = getPriceY(c.close);
        const yHigh = getPriceY(c.high);
        const yLow = getPriceY(c.low);

        // Wick - Clean centered high-contrast stroke
        ctx.strokeStyle = color;
        ctx.lineWidth = candleWidth > 12 ? 2.0 : candleWidth > 7 ? 1.5 : 1.2;
        ctx.beginPath();
        ctx.moveTo(x, Math.round(yHigh));
        ctx.lineTo(x, Math.round(yLow));
        ctx.stroke();

        // Candle Body - Sharp edges with minimum height for Doji visibility
        const topY = Math.round(Math.min(yOpen, yClose));
        const rawHeight = Math.abs(yClose - yOpen);
        const bodyHeight = Math.max(2, Math.round(rawHeight));
        const bodyX = Math.round(x - barWidth / 2);

        if (chartType === 'hollow' && isUp) {
          ctx.fillStyle = isLight ? '#ffffff' : '#111417';
          ctx.fillRect(bodyX, topY, barWidth, bodyHeight);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.6;
          ctx.strokeRect(bodyX, topY, barWidth, bodyHeight);
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(bodyX, topY, barWidth, bodyHeight);
          // Crisp defining edge stroke
          ctx.strokeStyle = isLight ? (isUp ? '#067a67' : '#cf2534') : (isUp ? '#00e685' : '#e62f3e');
          ctx.lineWidth = 1;
          ctx.strokeRect(bodyX, topY, barWidth, bodyHeight);
        }
      });
    }

    // Helper: Draw continuous indicator line
    const drawIndicatorLine = (data: number[], color: string, width = 1.3) => {
      if (data.length === 0) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      let started = false;
      visibleCandles.forEach((_, i) => {
        const gIdx = startIdx + i;
        const val = data[gIdx];
        if (val !== undefined && !isNaN(val)) {
          const x = getIndexX(i);
          const y = getPriceY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    };

    // Draw Moving Averages
    if (indMap.has('ema_9')) drawIndicatorLine(ema9, indMap.get('ema_9')?.color || '#f6be16', 1.4);
    if (indMap.has('ema_21')) drawIndicatorLine(ema21, indMap.get('ema_21')?.color || '#38bdf8', 1.4);
    if (indMap.has('ema_26')) drawIndicatorLine(ema26, indMap.get('ema_26')?.color || '#3b82f6', 1.4);
    if (indMap.has('ema_50')) drawIndicatorLine(ema50, indMap.get('ema_50')?.color || '#a855f7', 1.4);
    if (indMap.has('ema_200')) drawIndicatorLine(ema200, indMap.get('ema_200')?.color || '#f43f5e', 1.6);
    if (indMap.has('sma_20')) drawIndicatorLine(sma20, indMap.get('sma_20')?.color || '#e2e8f0', 1.2);
    if (indMap.has('vwap')) drawIndicatorLine(vwap, indMap.get('vwap')?.color || '#fb923c', 1.5);

    // Draw Central Pivot Range (CPR) & Key Confluence Levels
    if (cpr && indMap.has('cpr')) {
      const cprParams = indMap.get('cpr')?.params || {};
      const showPivots = cprParams.showPivots !== 0 && String(cprParams.showPivots) !== '0';
      const showBand = cprParams.showBand !== 0 && String(cprParams.showBand) !== '0';
      const showHistory = cprParams.showHistory !== 0 && String(cprParams.showHistory) !== '0';
      const showLabels = cprParams.showLabels !== 0 && String(cprParams.showLabels) !== '0';

      // 1. Multi-Day Historical CPR Sessions
      if (showHistory && cpr.historicalCPRs && cpr.historicalCPRs.length > 1) {
        for (let hIdx = 0; hIdx < cpr.historicalCPRs.length - 1; hIdx++) {
          const period = cpr.historicalCPRs[hIdx];
          const pStartX = Math.max(0, getIndexX(period.startIndex - startIdx));
          const pEndX = Math.min(chartWidth, getIndexX(period.endIndex - startIdx));

          if (pEndX > pStartX && pEndX > 0 && pStartX < chartWidth) {
            const pTcY = getPriceY(period.tcActual);
            const pBcY = getPriceY(period.bcActual);
            const pPivotY = getPriceY(period.pivot);

            // Corridor fill
            if (showBand) {
              ctx.fillStyle = period.isNarrow ? 'rgba(0, 255, 148, 0.08)' : 'rgba(246, 190, 22, 0.05)';
              ctx.fillRect(pStartX, Math.min(pTcY, pBcY), pEndX - pStartX, Math.max(2, Math.abs(pBcY - pTcY)));
            }

            // Historical lines
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 3]);

            ctx.strokeStyle = '#00ff94';
            ctx.beginPath();
            ctx.moveTo(pStartX, pTcY);
            ctx.lineTo(pEndX, pTcY);
            ctx.stroke();

            ctx.strokeStyle = '#ffd87f';
            ctx.beginPath();
            ctx.moveTo(pStartX, pPivotY);
            ctx.lineTo(pEndX, pPivotY);
            ctx.stroke();

            ctx.strokeStyle = '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(pStartX, pBcY);
            ctx.lineTo(pEndX, pBcY);
            ctx.stroke();
            ctx.setLineDash([]);

            if (period.isVirgin && showLabels) {
              ctx.fillStyle = '#f59e0b';
              ctx.font = 'bold 8px "JetBrains Mono", monospace';
              ctx.textAlign = 'left';
              ctx.fillText('VIRGIN CPR', pStartX + 4, Math.min(pTcY, pBcY) - 3);
            }
          }
        }
      }

      // 2. Today's CPR (Current Active Session)
      const todayPeriod = cpr.historicalCPRs && cpr.historicalCPRs.length > 0 ? cpr.historicalCPRs[cpr.historicalCPRs.length - 1] : null;
      const todayCandleLocalX = todayPeriod ? getIndexX(todayPeriod.startIndex - startIdx) : 0;
      const todayStartX = showHistory ? Math.max(0, todayCandleLocalX) : 0;

      const tcY = getPriceY(cpr.tcActual);
      const bcY = getPriceY(cpr.bcActual);

      // Shaded CPR Range
      if (showBand) {
        ctx.fillStyle = cpr.isNarrow ? 'rgba(0, 255, 148, 0.14)' : cpr.isWide ? 'rgba(239, 68, 68, 0.08)' : 'rgba(246, 190, 22, 0.08)';
        ctx.fillRect(todayStartX, Math.min(tcY, bcY), chartWidth - todayStartX, Math.max(2, Math.abs(bcY - tcY)));
      }

      const drawCprLine = (val: number, label: string, color: string, dash: number[] = [5, 3], lineW = 1.3, fromX = todayStartX) => {
        const y = getPriceY(val);
        ctx.strokeStyle = color;
        ctx.setLineDash(dash);
        ctx.lineWidth = lineW;
        ctx.beginPath();
        ctx.moveTo(fromX, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        if (showLabels) {
          ctx.fillStyle = color;
          ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          const labelX = Math.max(fromX + 6, 8);
          ctx.fillText(`${label} $${val.toFixed(val > 100 ? 1 : 3)}`, labelX, y - 3);
        }
      };

      // TC, Pivot, BC
      drawCprLine(cpr.tcActual, 'CPR TC', '#00ff94', [6, 2], 1.4);
      drawCprLine(cpr.pivot, 'CPR PIVOT', '#ffd87f', [6, 2], 1.5);
      drawCprLine(cpr.bcActual, 'CPR BC', '#38bdf8', [6, 2], 1.4);

      // S1-S4 & R1-R4
      if (showPivots) {
        drawCprLine(cpr.r1, 'R1', '#00ff94', [3, 3], 1);
        drawCprLine(cpr.r2, 'R2', '#40e397', [3, 3], 1);
        drawCprLine(cpr.r3, 'R3', '#00ff94', [3, 3], 1);
        if (cpr.r4) drawCprLine(cpr.r4, 'R4', '#34d399', [3, 3], 1);
        drawCprLine(cpr.s1, 'S1', '#ff3b4a', [3, 3], 1);
        drawCprLine(cpr.s2, 'S2', '#f43f5e', [3, 3], 1);
        drawCprLine(cpr.s3, 'S3', '#ff3b4a', [3, 3], 1);
        if (cpr.s4) drawCprLine(cpr.s4, 'S4', '#fb7185', [3, 3], 1);
      }

      // Virgin CPR badge on chart if untouched today
      if (cpr.isVirgin && showLabels) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('⭐ TODAY VIRGIN CPR (MAGNET)', Math.max(todayStartX + 8, 8), Math.min(tcY, bcY) - 5);
      }

      // 3. Price Axis Badges for CPR
      const drawAxisBadge = (val: number, label: string, bg: string, textCol: string) => {
        const y = getPriceY(val);
        if (y >= 8 && y <= mainChartHeight - 8) {
          ctx.fillStyle = bg;
          ctx.fillRect(chartWidth + 2, y - 7, paddingRight - 4, 14);
          ctx.fillStyle = textCol;
          ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${label} ${val.toFixed(val > 100 ? 1 : 2)}`, chartWidth + 5, y + 3.5);
        }
      };

      drawAxisBadge(cpr.tcActual, 'TC', '#00ff94', '#0b0f14');
      drawAxisBadge(cpr.pivot, 'P', '#ffd87f', '#0b0f14');
      drawAxisBadge(cpr.bcActual, 'BC', '#38bdf8', '#0b0f14');
      if (showPivots) {
        drawAxisBadge(cpr.r1, 'R1', '#10b981', '#ffffff');
        drawAxisBadge(cpr.s1, 'S1', '#ef4444', '#ffffff');
      }

      // 4. On-Chart CPR HUD Ribbon (Top-left info pill)
      const cprHudX = 10;
      const cprHudY = 22;
      const isPriceAboveTC = currentPrice >= cpr.tcActual;
      const isPriceBelowBC = currentPrice <= cpr.bcActual;
      const hudStatus = isPriceAboveTC ? 'Above TC (Bullish)' : isPriceBelowBC ? 'Below BC (Bearish)' : 'Inside CPR (Trap Zone)';
      const hudThemeColor = isPriceAboveTC ? '#00ff94' : isPriceBelowBC ? '#ff3b4a' : '#ffd87f';
      const hudText = `CPR: ${cpr.widthType || (cpr.isNarrow ? 'NARROW' : cpr.isWide ? 'WIDE' : 'AVG')} (${cpr.cprWidthPercent.toFixed(2)}%) • ${hudStatus}${cpr.isVirgin ? ' • ⭐ Virgin' : ''}${cpr.relationship && cpr.relationship !== 'UNCHANGED' ? ` • ${cpr.relationship.replace(/_/g, ' ')}` : ''}`;

      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      const hudWidth = Math.min(chartWidth - 20, ctx.measureText(hudText).width + 16);
      ctx.fillStyle = isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(17, 20, 23, 0.88)';
      ctx.fillRect(cprHudX, cprHudY, hudWidth, 16);
      ctx.strokeStyle = hudThemeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(cprHudX, cprHudY, hudWidth, 16);

      ctx.fillStyle = hudThemeColor;
      ctx.textAlign = 'left';
      ctx.fillText(hudText, cprHudX + 8, cprHudY + 11.5);
    }

    // Draw CPR Confluence Strategy Signals
    if (cprConfluence && indMap.has('cpr_confluence') && cprConfluence.isValid && cprConfluence.action !== 'NO_TRADE') {
      const isBull = cprConfluence.action === 'BUY';
      const badgeY = 6;
      const bWidth = 135;
      ctx.fillStyle = isBull ? 'rgba(0, 255, 148, 0.15)' : 'rgba(255, 59, 74, 0.15)';
      ctx.strokeStyle = isBull ? (isLight ? '#089981' : '#00ff94') : '#ff3b4a';
      ctx.lineWidth = 1;
      ctx.fillRect(chartWidth - bWidth - 8, badgeY, bWidth, 18);
      ctx.strokeRect(chartWidth - bWidth - 8, badgeY, bWidth, 18);
      ctx.fillStyle = isBull ? (isLight ? '#089981' : '#00ff94') : '#ff3b4a';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `⚡ CPR ${cprConfluence.action} (${cprConfluence.confidence}%)`,
        chartWidth - bWidth - 2,
        badgeY + 12
      );
    }

    // Draw Supertrend
    if (supertrend && supertrend.band.length > 0) {
      for (let i = 1; i < visibleCandles.length; i++) {
        const g1 = startIdx + i - 1;
        const g2 = startIdx + i;
        if (supertrend.band[g1] !== undefined && supertrend.band[g2] !== undefined) {
          const x1 = getIndexX(i - 1);
          const y1 = getPriceY(supertrend.band[g1]);
          const x2 = getIndexX(i);
          const y2 = getPriceY(supertrend.band[g2]);
          const isBull = supertrend.trend[g2] === 'bull';

          ctx.strokeStyle = isBull ? '#00ff94' : '#ff3b4a';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
    }

    // Draw Parabolic SAR dots
    if (parabolicSar.length > 0) {
      ctx.fillStyle = '#38bdf8';
      visibleCandles.forEach((_, i) => {
        const gIdx = startIdx + i;
        const val = parabolicSar[gIdx];
        if (val !== undefined) {
          const x = getIndexX(i);
          const y = getPriceY(val);
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // Draw Pivot Points
    if (pivots) {
      const drawPivotLine = (val: number, label: string, color: string) => {
        const y = getPriceY(val);
        ctx.strokeStyle = color;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = color;
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillText(label, 6, y - 2);
      };

      drawPivotLine(pivots.p, 'P', '#ffd87f');
      drawPivotLine(pivots.r1, 'R1', '#00ff94');
      drawPivotLine(pivots.r2, 'R2', '#00ff94');
      drawPivotLine(pivots.s1, 'S1', '#ff3b4a');
      drawPivotLine(pivots.s2, 'S2', '#ff3b4a');
    }

    // Draw Trade Setup / AI Signal Levels (TP1, TP2, Stop Loss) - Single Source of Truth
    const activeSetup = (tradeSetup && tradeSetup.symbol === symbol)
      ? {
          side: tradeSetup.side,
          entryPrice: tradeSetup.entry,
          target1: tradeSetup.takeProfit,
          target2: undefined,
          stopLoss: tradeSetup.stopLoss,
          isLocked: true,
          rewardPercent: activeSignal?.rewardPercent,
          riskPercent: activeSignal?.riskPercent,
        }
      : (activeSignal && showAiLevels && activeSignal.symbol === symbol)
      ? {
          side: activeSignal.side,
          entryPrice: activeSignal.entryPrice,
          target1: activeSignal.target1,
          target2: activeSignal.target2,
          stopLoss: activeSignal.stopLoss,
          isLocked: Boolean(activeSignal.isAccepted || activeSignal.isLocked),
          rewardPercent: activeSignal.rewardPercent,
          riskPercent: activeSignal.riskPercent,
        }
      : null;

    if (activeSetup) {
      const isBuy = activeSetup.side === 'LONG';
      const isLocked = activeSetup.isLocked;

      // Precise Y positions adjusted for INR or USD
      const sigMult = isINR && inrRateMultiplier > 0 ? inrRateMultiplier : 1;
      const currSym = isINR ? '₹' : '$';
      const entryVal = activeSetup.entryPrice * sigMult;
      const t1Val = activeSetup.target1 * sigMult;
      const t2Val = activeSetup.target2 ? activeSetup.target2 * sigMult : undefined;
      const slVal = activeSetup.stopLoss * sigMult;

      const entryY = getPriceY(entryVal);
      const t1Y = getPriceY(t1Val);
      const slY = getPriceY(slVal);

      // 1. Shaded Risk/Reward Zones on Chart
      if (isLocked) {
        // Profit target zone (between entry and TP1)
        const profitTopY = Math.min(entryY, t1Y);
        const profitHeight = Math.max(2, Math.abs(t1Y - entryY));
        ctx.fillStyle = 'rgba(0, 255, 148, 0.07)';
        ctx.fillRect(0, profitTopY, chartWidth, profitHeight);

        // Stop Loss risk zone (between entry and SL)
        const riskTopY = Math.min(entryY, slY);
        const riskHeight = Math.max(2, Math.abs(slY - entryY));
        ctx.fillStyle = 'rgba(255, 59, 74, 0.07)';
        ctx.fillRect(0, riskTopY, chartWidth, riskHeight);
      }

      // 2. Entry Line (Golden Amber if locked, bright green/red if suggested)
      ctx.strokeStyle = isLocked ? '#ffd87f' : (isBuy ? '#00ff94' : '#ff3b4a');
      ctx.setLineDash(isLocked ? [8, 4] : [6, 3]);
      ctx.lineWidth = isLocked ? 2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(chartWidth, entryY);
      ctx.stroke();

      // Left Marker Flag for Entry
      const entryLabel = isLocked
        ? `🔒 LOCKED ENTRY ${currSym}${entryVal.toFixed(entryVal > 100 ? 2 : 4)}`
        : `AI ENTRY ${currSym}${entryVal.toFixed(entryVal > 100 ? 2 : 4)}`;
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      const entryTagW = ctx.measureText(entryLabel).width + 12;
      ctx.fillStyle = '#14171a';
      ctx.fillRect(6, entryY - 9, entryTagW, 17);
      ctx.strokeStyle = isLocked ? '#ffd87f' : (isBuy ? '#00ff94' : '#ff3b4a');
      ctx.lineWidth = 1;
      ctx.strokeRect(6, entryY - 9, entryTagW, 17);
      ctx.fillStyle = isLocked ? '#ffd87f' : (isBuy ? '#00ff94' : '#ff3b4a');
      ctx.textAlign = 'left';
      ctx.fillText(entryLabel, 12, entryY + 3);

      // Right Axis Tag for Entry
      ctx.fillStyle = isLocked ? '#ffd87f' : (isBuy ? '#00ff94' : '#ff3b4a');
      ctx.fillRect(chartWidth + 2, entryY - 8, paddingRight - 4, 16);
      ctx.fillStyle = '#0b0e11';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(
        `${isLocked ? '🔒 ' : ''}${currSym}${entryVal.toFixed(entryVal > 100 ? 1 : 3)}`,
        chartWidth + 4,
        entryY + 4
      );

      // 3. Target 1 Line
      ctx.strokeStyle = '#00ff94';
      ctx.setLineDash(isLocked ? [8, 4] : [4, 4]);
      ctx.lineWidth = isLocked ? 1.8 : 1.2;
      ctx.beginPath();
      ctx.moveTo(0, t1Y);
      ctx.lineTo(chartWidth, t1Y);
      ctx.stroke();

      // Left Marker Flag for TP1
      const tp1Label = isLocked
        ? `🎯 LOCKED TP1 ${currSym}${t1Val.toFixed(t1Val > 100 ? 2 : 4)} (+${activeSignal.rewardPercent || 3.5}%)`
        : `TP1 ${currSym}${t1Val.toFixed(t1Val > 100 ? 2 : 4)}`;
      const tp1TagW = ctx.measureText(tp1Label).width + 12;
      ctx.fillStyle = '#072718';
      ctx.fillRect(6, t1Y - 9, tp1TagW, 17);
      ctx.strokeStyle = '#00ff94';
      ctx.lineWidth = 1;
      ctx.strokeRect(6, t1Y - 9, tp1TagW, 17);
      ctx.fillStyle = '#00ff94';
      ctx.textAlign = 'left';
      ctx.fillText(tp1Label, 12, t1Y + 3);

      // Right Axis Tag for TP1
      ctx.fillStyle = '#00ff94';
      ctx.fillRect(chartWidth + 2, t1Y - 8, paddingRight - 4, 16);
      ctx.fillStyle = '#002111';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(
        `TP1 ${currSym}${t1Val.toFixed(t1Val > 100 ? 1 : 3)}`,
        chartWidth + 4,
        t1Y + 4
      );

      // 4. Target 2 Line (if present)
      if (t2Val !== undefined) {
        const t2Y = getPriceY(t2Val);
        ctx.strokeStyle = '#38bdf8';
        ctx.setLineDash(isLocked ? [8, 4] : [4, 4]);
        ctx.lineWidth = isLocked ? 1.6 : 1.2;
        ctx.beginPath();
        ctx.moveTo(0, t2Y);
        ctx.lineTo(chartWidth, t2Y);
        ctx.stroke();

        const tp2Label = isLocked
          ? `🎯 LOCKED TP2 ${currSym}${t2Val.toFixed(t2Val > 100 ? 2 : 4)} (RUNNER)`
          : `TP2 ${currSym}${t2Val.toFixed(t2Val > 100 ? 2 : 4)}`;
        const tp2TagW = ctx.measureText(tp2Label).width + 12;
        ctx.fillStyle = '#0c2233';
        ctx.fillRect(6, t2Y - 9, tp2TagW, 17);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(6, t2Y - 9, tp2TagW, 17);
        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'left';
        ctx.fillText(tp2Label, 12, t2Y + 3);

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(chartWidth + 2, t2Y - 8, paddingRight - 4, 16);
        ctx.fillStyle = '#082f49';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillText(
          `TP2 ${currSym}${t2Val.toFixed(t2Val > 100 ? 1 : 3)}`,
          chartWidth + 4,
          t2Y + 4
        );
      }

      // 5. Stop Loss Line
      ctx.strokeStyle = '#ff3b4a';
      ctx.setLineDash(isLocked ? [8, 4] : [5, 3]);
      ctx.lineWidth = isLocked ? 2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(0, slY);
      ctx.lineTo(chartWidth, slY);
      ctx.stroke();

      // Left Marker Flag for SL
      const slLabel = isLocked
        ? `🛑 LOCKED SL ${currSym}${slVal.toFixed(slVal > 100 ? 2 : 4)} (-${activeSignal.riskPercent || 1.5}%)`
        : `SL ${currSym}${slVal.toFixed(slVal > 100 ? 2 : 4)}`;
      const slTagW = ctx.measureText(slLabel).width + 12;
      ctx.fillStyle = '#2d0e12';
      ctx.fillRect(6, slY - 9, slTagW, 17);
      ctx.strokeStyle = '#ff3b4a';
      ctx.lineWidth = 1;
      ctx.strokeRect(6, slY - 9, slTagW, 17);
      ctx.fillStyle = '#ff3b4a';
      ctx.textAlign = 'left';
      ctx.fillText(slLabel, 12, slY + 3);

      // Right Axis Tag for SL
      ctx.fillStyle = '#ff3b4a';
      ctx.fillRect(chartWidth + 2, slY - 8, paddingRight - 4, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(
        `SL ${currSym}${slVal.toFixed(slVal > 100 ? 1 : 3)}`,
        chartWidth + 4,
        slY + 4
      );

      ctx.setLineDash([]);
    }

    // Draw Smart Money Concepts (FVG Imbalances & Order Blocks)
    if (showSMC && visibleCandles.length >= 4) {
      for (let i = 2; i < visibleCandles.length; i++) {
        const cCurrent = visibleCandles[i];
        const cPrev2 = visibleCandles[i - 2];
        const xStart = getIndexX(i - 2);
        const xEnd = Math.min(chartWidth, xStart + barWidth * 8);

        // Bullish FVG: Low of current candle > High of candle 2 periods ago
        if (cCurrent.low > cPrev2.high && cCurrent.close > cCurrent.open) {
          const yTop = getPriceY(cCurrent.low);
          const yBottom = getPriceY(cPrev2.high);
          const boxH = Math.max(3, yBottom - yTop);

          ctx.fillStyle = 'rgba(0, 255, 148, 0.12)';
          ctx.fillRect(xStart, yTop, xEnd - xStart, boxH);
          ctx.strokeStyle = 'rgba(0, 255, 148, 0.45)';
          ctx.lineWidth = 1;
          ctx.strokeRect(xStart, yTop, xEnd - xStart, boxH);

          // Midline (50% Consequent Encroachment)
          const yMid = (yTop + yBottom) / 2;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(xStart, yMid);
          ctx.lineTo(xEnd, yMid);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#00ff94';
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillText('FVG+', xStart + 2, yTop + 7);
        }

        // Bearish FVG: High of current candle < Low of candle 2 periods ago
        if (cCurrent.high < cPrev2.low && cCurrent.close < cCurrent.open) {
          const yTop = getPriceY(cPrev2.low);
          const yBottom = getPriceY(cCurrent.high);
          const boxH = Math.max(3, yBottom - yTop);

          ctx.fillStyle = 'rgba(255, 59, 74, 0.12)';
          ctx.fillRect(xStart, yTop, xEnd - xStart, boxH);
          ctx.strokeStyle = 'rgba(255, 59, 74, 0.45)';
          ctx.lineWidth = 1;
          ctx.strokeRect(xStart, yTop, xEnd - xStart, boxH);

          // Midline
          const yMid = (yTop + yBottom) / 2;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(xStart, yMid);
          ctx.lineTo(xEnd, yMid);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#ff3b4a';
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillText('FVG-', xStart + 2, yTop + 7);
        }
      }
    }

    // Draw Price Alerts
    if (showAlerts) {
      alerts
        .filter((a) => a.symbol === symbol && a.status === 'active')
        .forEach((alert) => {
          const alertY = getPriceY(alert.targetPrice);
          const isAbove = alert.condition === 'rises_above';
          const alertColor = isAbove ? '#f6be16' : '#ff9800';

          ctx.strokeStyle = alertColor;
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(0, alertY);
          ctx.lineTo(chartWidth, alertY);
          ctx.stroke();

          ctx.fillStyle = alertColor;
          ctx.fillRect(4, alertY - 8, 88, 16);
          ctx.fillStyle = '#111417';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(
            `🔔 ALERT ${isAbove ? '≥' : '≤'} $${alert.targetPrice.toFixed(
              alert.targetPrice > 100 ? 1 : 3
            )}`,
            6,
            alertY + 4
          );

          ctx.fillStyle = alertColor;
          ctx.fillRect(chartWidth + 2, alertY - 8, paddingRight - 4, 16);
          ctx.fillStyle = '#111417';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillText(
            `🔔 $${alert.targetPrice.toFixed(alert.targetPrice > 100 ? 1 : 3)}`,
            chartWidth + 5,
            alertY + 4
          );

          ctx.setLineDash([]);
        });
    }

    // Draw High and Low Pointers on Right Price Axis (Matching Screenshot)
    const highY = getPriceY(maxPrice);
    const lowY = getPriceY(minPrice);

    if (highY >= 6 && highY <= mainChartHeight - 6) {
      ctx.fillStyle = isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.2)';
      ctx.fillRect(chartWidth + 2, highY - 8, paddingRight - 4, 16);
      ctx.strokeStyle = isLight ? '#93c5fd' : '#3b82f6';
      ctx.lineWidth = 1;
      ctx.strokeRect(chartWidth + 2, highY - 8, paddingRight - 4, 16);
      ctx.fillStyle = isLight ? '#1d4ed8' : '#60a5fa';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`High ${maxPrice.toFixed(maxPrice > 100 ? 1 : 2)}`, chartWidth + 5, highY + 3.5);
    }

    if (lowY >= 6 && lowY <= mainChartHeight - 6) {
      ctx.fillStyle = isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.2)';
      ctx.fillRect(chartWidth + 2, lowY - 8, paddingRight - 4, 16);
      ctx.strokeStyle = isLight ? '#93c5fd' : '#3b82f6';
      ctx.lineWidth = 1;
      ctx.strokeRect(chartWidth + 2, lowY - 8, paddingRight - 4, 16);
      ctx.fillStyle = isLight ? '#1d4ed8' : '#60a5fa';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Low ${minPrice.toFixed(minPrice > 100 ? 1 : 2)}`, chartWidth + 5, lowY + 3.5);
    }

    // Current Price Indicator Line & Pulsing Badge (Direction-aware)
    const curY = getPriceY(currentPrice);
    const lastVisibleCandle = visibleCandles[visibleCandles.length - 1];
    const isLiveUp = lastVisibleCandle ? currentPrice >= lastVisibleCandle.open : true;
    const priceColor = isLiveUp
      ? (isLight ? '#089981' : '#00ff94')
      : (isLight ? '#f23645' : '#ff3b4a');
    ctx.strokeStyle = priceColor;
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, curY);
    ctx.lineTo(chartWidth, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price Bubble on Axis
    ctx.fillStyle = priceColor;
    ctx.fillRect(chartWidth + 2, curY - 9, paddingRight - 4, 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(currentPrice.toFixed(currentPrice > 100 ? 2 : 4), chartWidth + 6, curY + 4);

    // Candle Countdown Timer badge directly below price bubble (TradingView style)
    if (curY + 28 <= mainChartHeight) {
      const cdY = curY + 11;
      ctx.fillStyle = isLight ? '#f1f5f9' : '#1a1d21';
      ctx.fillRect(chartWidth + 2, cdY, paddingRight - 4, 14);
      ctx.strokeStyle = isLight ? '#cbd5e1' : '#2d3136';
      ctx.lineWidth = 1;
      ctx.strokeRect(chartWidth + 2, cdY, paddingRight - 4, 14);

      ctx.fillStyle = isLight ? '#0f172a' : '#ffd87f';
      ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(candleCountdownRef.current, chartWidth + (paddingRight / 2), cdY + 10);
    }

    // Volume badge on axis
    if (indMap.has('volume_bars')) {
      const volY = mainChartHeight - 14;
      ctx.fillStyle = isLight ? '#089981' : '#00c77e';
      ctx.fillRect(chartWidth + 2, volY - 7, paddingRight - 4, 15);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      const lastVol = visibleCandles[visibleCandles.length - 1]?.volume || 0;
      const volStr = lastVol > 1000 ? `${(lastVol / 1000).toFixed(2)} K` : lastVol.toFixed(0);
      ctx.fillText(volStr, chartWidth + (paddingRight / 2), volY + 4);
    }

    // ==========================================
    // DRAWING LAYER (TRADINGVIEW DRAWINGS)
    // ==========================================
    if (isDrawingsVisible) {
      const renderDrawing = (d: DrawingElement) => {
        if (d.points.length === 0) return;
        const p1 = d.points[0];
        const p2 = d.points[1] || p1;

        const x1 = getPointX(p1);
        const y1 = getPriceY(p1.price);
        const x2 = getPointX(p2);
        const y2 = getPriceY(p2.price);

        ctx.strokeStyle = d.color;
        ctx.lineWidth = d.lineWidth;
        if (d.lineStyle === 'dashed') ctx.setLineDash([6, 4]);
        else if (d.lineStyle === 'dotted') ctx.setLineDash([2, 2]);
        else ctx.setLineDash([]);

        switch (d.type) {
          case 'trendline': {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // End handles
            ctx.fillStyle = d.color;
            ctx.beginPath();
            ctx.arc(x1, y1, 3.5, 0, Math.PI * 2);
            ctx.arc(x2, y2, 3.5, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case 'horizontal_line': {
            ctx.beginPath();
            ctx.moveTo(0, y1);
            ctx.lineTo(chartWidth, y1);
            ctx.stroke();

            // Price badge on right axis
            ctx.fillStyle = d.color;
            ctx.fillRect(chartWidth + 2, y1 - 8, paddingRight - 4, 16);
            ctx.fillStyle = '#111417';
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`$${p1.price.toFixed(p1.price > 100 ? 2 : 4)}`, chartWidth + 5, y1 + 3.5);
            break;
          }

          case 'horizontal_ray': {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(chartWidth, y1);
            ctx.stroke();

            // Ray start dot
            ctx.fillStyle = d.color;
            ctx.beginPath();
            ctx.arc(x1, y1, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Price badge on right axis
            ctx.fillStyle = d.color;
            ctx.fillRect(chartWidth + 2, y1 - 8, paddingRight - 4, 16);
            ctx.fillStyle = '#111417';
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`$${p1.price.toFixed(p1.price > 100 ? 2 : 4)}`, chartWidth + 5, y1 + 3.5);
            break;
          }

          case 'vertical_line': {
            ctx.beginPath();
            ctx.moveTo(x1, 0);
            ctx.lineTo(x1, mainChartHeight);
            ctx.stroke();
            break;
          }

          case 'channel': {
            // Parallel Channel
            const channelHeight = Math.max(16, Math.abs(y2 - y1));
            const offset = (y2 >= y1 ? 1 : -1) * channelHeight;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x1, y1 + offset);
            ctx.lineTo(x2, y2 + offset);
            ctx.stroke();

            // Shaded channel interior
            ctx.fillStyle = `${d.color}15`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x2, y2 + offset);
            ctx.lineTo(x1, y1 + offset);
            ctx.closePath();
            ctx.fill();

            // Midline
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(x1, y1 + offset / 2);
            ctx.lineTo(x2, y2 + offset / 2);
            ctx.stroke();
            break;
          }

          case 'rectangle': {
            const rx = Math.min(x1, x2);
            const ry = Math.min(y1, y2);
            const rw = Math.max(4, Math.abs(x2 - x1));
            const rh = Math.max(4, Math.abs(y2 - y1));
            ctx.fillStyle = `${d.color}22`;
            ctx.fillRect(rx, ry, rw, rh);
            ctx.strokeRect(rx, ry, rw, rh);
            break;
          }

          case 'circle': {
            const rx = Math.max(8, Math.abs(x2 - x1) / 2);
            const ry = Math.max(6, Math.abs(y2 - y1) / 2);
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2;

            ctx.fillStyle = `${d.color}18`;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
          }

          case 'fib_retracement': {
            const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
            const pDiff = p2.price - p1.price;
            const endX = Math.max(x2, chartWidth);

            // Shaded Golden Pocket between 0.5 and 0.618
            const y05 = getPriceY(p1.price + pDiff * 0.5);
            const y0618 = getPriceY(p1.price + pDiff * 0.618);
            ctx.fillStyle = 'rgba(246, 190, 22, 0.16)';
            ctx.fillRect(Math.min(x1, x2), Math.min(y05, y0618), Math.abs(endX - Math.min(x1, x2)), Math.abs(y0618 - y05));

            levels.forEach((lvl) => {
              const fibPrice = p1.price + pDiff * lvl;
              const fibY = getPriceY(fibPrice);

              ctx.strokeStyle = lvl === 0.618 ? '#f6be16' : d.color;
              ctx.lineWidth = lvl === 0.618 ? 1.5 : 1;
              ctx.beginPath();
              ctx.moveTo(x1, fibY);
              ctx.lineTo(endX, fibY);
              ctx.stroke();

              ctx.fillStyle = lvl === 0.618 ? '#f6be16' : d.color;
              ctx.font = 'bold 9px "JetBrains Mono", monospace';
              ctx.fillText(`${lvl} ($${fibPrice.toFixed(fibPrice > 100 ? 2 : 4)})`, x1 + 4, fibY - 3);
            });
            break;
          }

          case 'long_position': {
            const stopY = y2;
            const stopPriceDiff = Math.abs(p1.price - p2.price);
            const targetPrice = p1.price + stopPriceDiff * 2;
            const targetY = getPriceY(targetPrice);
            const boxWidth = Math.max(80, Math.abs(x2 - x1));

            // Profit Zone (Green)
            const profitTop = Math.min(y1, targetY);
            const profitHeight = Math.abs(targetY - y1);
            ctx.fillStyle = 'rgba(0, 255, 148, 0.18)';
            ctx.fillRect(x1, profitTop, boxWidth, profitHeight);
            ctx.strokeStyle = '#00ff94';
            ctx.lineWidth = 1;
            ctx.strokeRect(x1, profitTop, boxWidth, profitHeight);

            // Loss Zone (Red)
            const lossTop = Math.min(y1, stopY);
            const lossHeight = Math.abs(stopY - y1);
            ctx.fillStyle = 'rgba(255, 59, 74, 0.18)';
            ctx.fillRect(x1, lossTop, boxWidth, lossHeight);
            ctx.strokeStyle = '#ff3b4a';
            ctx.lineWidth = 1;
            ctx.strokeRect(x1, lossTop, boxWidth, lossHeight);

            // Entry Line
            ctx.strokeStyle = d.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + boxWidth, y1);
            ctx.stroke();

            // Labels
            ctx.fillStyle = '#00ff94';
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.fillText(`Target (2.00 R:R): $${targetPrice.toFixed(targetPrice > 100 ? 2 : 4)}`, x1 + 4, profitTop + 12);
            ctx.fillStyle = '#ff3b4a';
            ctx.fillText(`Stop Loss: $${p2.price.toFixed(p2.price > 100 ? 2 : 4)}`, x1 + 4, lossTop + lossHeight - 5);
            break;
          }

          case 'short_position': {
            const stopY = y2;
            const stopPriceDiff = Math.abs(p2.price - p1.price);
            const targetPrice = p1.price - stopPriceDiff * 2;
            const targetY = getPriceY(targetPrice);
            const boxWidth = Math.max(80, Math.abs(x2 - x1));

            // Loss Zone (Red above entry)
            const lossTop = Math.min(y1, stopY);
            const lossHeight = Math.abs(stopY - y1);
            ctx.fillStyle = 'rgba(255, 59, 74, 0.18)';
            ctx.fillRect(x1, lossTop, boxWidth, lossHeight);
            ctx.strokeStyle = '#ff3b4a';
            ctx.lineWidth = 1;
            ctx.strokeRect(x1, lossTop, boxWidth, lossHeight);

            // Profit Zone (Green below entry)
            const profitTop = Math.min(y1, targetY);
            const profitHeight = Math.abs(targetY - y1);
            ctx.fillStyle = 'rgba(0, 255, 148, 0.18)';
            ctx.fillRect(x1, profitTop, boxWidth, profitHeight);
            ctx.strokeStyle = '#00ff94';
            ctx.lineWidth = 1;
            ctx.strokeRect(x1, profitTop, boxWidth, profitHeight);

            // Entry Line
            ctx.strokeStyle = d.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 + boxWidth, y1);
            ctx.stroke();

            // Labels
            ctx.fillStyle = '#ff3b4a';
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.fillText(`Stop Loss: $${p2.price.toFixed(p2.price > 100 ? 2 : 4)}`, x1 + 4, lossTop + 12);
            ctx.fillStyle = '#00ff94';
            ctx.fillText(`Target (2.00 R:R): $${targetPrice.toFixed(targetPrice > 100 ? 2 : 4)}`, x1 + 4, profitTop + profitHeight - 5);
            break;
          }

          case 'price_range': {
            const pDiff = p2.price - p1.price;
            const pct = p1.price > 0 ? (pDiff / p1.price) * 100 : 0;
            const isUp = pDiff >= 0;
            const rangeColor = isUp ? '#00ff94' : '#ff3b4a';
            const rx = Math.min(x1, x2);
            const ry = Math.min(y1, y2);
            const rw = Math.max(40, Math.abs(x2 - x1));
            const rh = Math.max(10, Math.abs(y2 - y1));

            ctx.fillStyle = isUp ? 'rgba(0, 255, 148, 0.12)' : 'rgba(255, 59, 74, 0.12)';
            ctx.fillRect(rx, ry, rw, rh);
            ctx.strokeStyle = rangeColor;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(rx, ry, rw, rh);

            // Center Badge
            const midX = rx + rw / 2;
            const midY = ry + rh / 2;
            const label = `${isUp ? '+' : ''}${pct.toFixed(2)}% (${isUp ? '+$' : '-$'}${Math.abs(pDiff).toFixed(pDiff > 100 ? 2 : 4)})`;
            ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
            const textW = ctx.measureText(label).width + 12;

            ctx.fillStyle = '#111417';
            ctx.fillRect(midX - textW / 2, midY - 9, textW, 18);
            ctx.strokeStyle = rangeColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(midX - textW / 2, midY - 9, textW, 18);

            ctx.fillStyle = rangeColor;
            ctx.textAlign = 'center';
            ctx.fillText(label, midX, midY + 3.5);
            ctx.textAlign = 'left';
            break;
          }

          case 'arrow_up': {
            ctx.fillStyle = '#00ff94';
            ctx.strokeStyle = '#00ff94';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 - 7, y1 + 12);
            ctx.lineTo(x1 - 3, y1 + 12);
            ctx.lineTo(x1 - 3, y1 + 18);
            ctx.lineTo(x1 + 3, y1 + 18);
            ctx.lineTo(x1 + 3, y1 + 12);
            ctx.lineTo(x1 + 7, y1 + 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 8px "JetBrains Mono", monospace';
            ctx.fillText('BUY', x1 - 8, y1 + 27);
            break;
          }

          case 'arrow_down': {
            ctx.fillStyle = '#ff3b4a';
            ctx.strokeStyle = '#ff3b4a';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1 - 7, y1 - 12);
            ctx.lineTo(x1 - 3, y1 - 12);
            ctx.lineTo(x1 - 3, y1 - 18);
            ctx.lineTo(x1 + 3, y1 - 18);
            ctx.lineTo(x1 + 3, y1 - 12);
            ctx.lineTo(x1 + 7, y1 - 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 8px "JetBrains Mono", monospace';
            ctx.fillText('SELL', x1 - 9, y1 - 22);
            break;
          }

          case 'text': {
            const noteText = d.text || 'Key Level';
            ctx.font = 'bold 11px "JetBrains Mono", monospace';
            const textWidth = ctx.measureText(noteText).width + 10;
            ctx.fillStyle = 'rgba(20, 23, 26, 0.85)';
            ctx.fillRect(x1 + 2, y1 - 14, textWidth, 18);
            ctx.strokeStyle = d.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(x1 + 2, y1 - 14, textWidth, 18);
            ctx.fillStyle = d.color;
            ctx.fillText(noteText, x1 + 7, y1 - 1);
            break;
          }

          case 'brush': {
            if (d.points.length > 1) {
              ctx.beginPath();
              d.points.forEach((pt, idx) => {
                const bx = getPointX(pt);
                const by = getPriceY(pt.price);
                if (idx === 0) ctx.moveTo(bx, by);
                else ctx.lineTo(bx, by);
              });
              ctx.stroke();
            }
            break;
          }
        }

        // Selection Handles when this drawing is active/selected
        if (d.id === selectedDrawingId) {
          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.fillStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);

          [
            { x: x1, y: y1 },
            { x: x2, y: y2 },
          ].forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });
          ctx.restore();
        }

        ctx.setLineDash([]);
      };

      drawings.forEach(renderDrawing);
      if (currentDrawing) renderDrawing(currentDrawing);
    }

    // ==========================================
    // SUB-CHARTS (RSI, MACD, STOCH, ATR, OBV)
    // ==========================================
    let currentSubChartTop = mainChartHeight + 20;

    activeSubCharts.forEach((subType) => {
      // Subchart border & background
      ctx.fillStyle = '#0c0e11';
      ctx.fillRect(0, currentSubChartTop, chartWidth, subChartHeight);
      ctx.strokeStyle = '#272a2d';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, currentSubChartTop, chartWidth, subChartHeight);

      if (subType === 'adx_14' && adx) {
        const getAdxY = (val: number) =>
          currentSubChartTop + subChartHeight - (Math.min(100, Math.max(0, val)) / 100) * subChartHeight;

        // 20/25 Threshold lines (Chop vs Trend strength)
        ctx.strokeStyle = 'rgba(246, 190, 22, 0.35)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, getAdxY(20));
        ctx.lineTo(chartWidth, getAdxY(20));
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 255, 148, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, getAdxY(25));
        ctx.lineTo(chartWidth, getAdxY(25));
        ctx.stroke();
        ctx.setLineDash([]);

        // +DI Line (Green)
        ctx.strokeStyle = '#00ff94';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const val = adx.plusDI[gIdx] || 20;
          const x = getIndexX(i);
          const y = getAdxY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // -DI Line (Red)
        ctx.strokeStyle = '#ff3b4a';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const val = adx.minusDI[gIdx] || 20;
          const x = getIndexX(i);
          const y = getAdxY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // ADX Line (Purple)
        ctx.strokeStyle = indMap.get('adx_14')?.color || '#a855f7';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const val = adx.adx[gIdx] || 20;
          const x = getIndexX(i);
          const y = getAdxY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.fillStyle = '#99907f';
        ctx.font = '10px "JetBrains Mono", monospace';
        const lastAdx = adx.adx[endIdx - 1] || adx.currentADX || 20;
        const trendTag = lastAdx >= 25 ? '🔥 STRONG' : lastAdx >= 20 ? '📈 TREND' : '⚡ CHOP';
        ctx.fillText(`ADX (14): ${lastAdx.toFixed(1)} [${trendTag}]`, 8, currentSubChartTop + 12);
      } else if (subType === 'cci') {
        const getCciY = (val: number) => {
          const clamped = Math.max(-250, Math.min(250, val));
          return currentSubChartTop + subChartHeight / 2 - (clamped / 250) * (subChartHeight / 2);
        };

        // +100 / -100 levels
        ctx.strokeStyle = 'rgba(255, 59, 74, 0.35)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, getCciY(100));
        ctx.lineTo(chartWidth, getCciY(100));
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 255, 148, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, getCciY(-100));
        ctx.lineTo(chartWidth, getCciY(-100));
        ctx.stroke();
        ctx.setLineDash([]);

        // CCI Line
        ctx.strokeStyle = indMap.get('cci')?.color || '#a855f7';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const val = cci[gIdx] || 0;
          const x = getIndexX(i);
          const y = getCciY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.fillStyle = '#99907f';
        ctx.font = '10px "JetBrains Mono", monospace';
        const lastCci = cci[endIdx - 1] || 0;
        ctx.fillText(`CCI (20): ${lastCci.toFixed(1)}`, 8, currentSubChartTop + 12);
      } else if (subType === 'williams_r') {
        const getWrY = (val: number) => {
          const clamped = Math.max(-100, Math.min(0, val));
          return currentSubChartTop + subChartHeight - ((clamped + 100) / 100) * subChartHeight;
        };

        // -20 / -80 levels
        ctx.strokeStyle = 'rgba(255, 59, 74, 0.35)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, getWrY(-20));
        ctx.lineTo(chartWidth, getWrY(-20));
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 255, 148, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, getWrY(-80));
        ctx.lineTo(chartWidth, getWrY(-80));
        ctx.stroke();
        ctx.setLineDash([]);

        // Williams %R Line
        ctx.strokeStyle = indMap.get('williams_r')?.color || '#ec4899';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const val = williamsR[gIdx] ?? -50;
          const x = getIndexX(i);
          const y = getWrY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.fillStyle = '#99907f';
        ctx.font = '10px "JetBrains Mono", monospace';
        const lastWr = williamsR[endIdx - 1] ?? -50;
        ctx.fillText(`Williams %R (14): ${lastWr.toFixed(1)}`, 8, currentSubChartTop + 12);
      } else if (subType === 'rsi_14') {
        const getRsiY = (val: number) =>
          currentSubChartTop + subChartHeight - (val / 100) * subChartHeight;

        // 70 / 30 zones
        ctx.strokeStyle = 'rgba(255, 59, 74, 0.35)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(0, getRsiY(70));
        ctx.lineTo(chartWidth, getRsiY(70));
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 255, 148, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, getRsiY(30));
        ctx.lineTo(chartWidth, getRsiY(30));
        ctx.stroke();
        ctx.setLineDash([]);

        // RSI Line
        ctx.strokeStyle = '#e7c26b';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const val = rsi[gIdx] || 50;
          const x = getIndexX(i);
          const y = getRsiY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.fillStyle = '#99907f';
        ctx.font = '10px "JetBrains Mono", monospace';
        const lastRsi = rsi[endIdx - 1] || 50;
        ctx.fillText(`RSI (14): ${lastRsi.toFixed(1)}`, 8, currentSubChartTop + 12);
      } else if (subType === 'macd' && macd) {
        let maxHist = 0.001;
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const h = macd.histogram[gIdx] || 0;
          if (Math.abs(h) > maxHist) maxHist = Math.abs(h);
        });

        const zeroY = currentSubChartTop + subChartHeight / 2;
        const getMacdY = (val: number) => zeroY - (val / (maxHist * 1.5)) * (subChartHeight / 2);

        // Zero line
        ctx.strokeStyle = '#272a2d';
        ctx.beginPath();
        ctx.moveTo(0, zeroY);
        ctx.lineTo(chartWidth, zeroY);
        ctx.stroke();

        // Histogram bars
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const x = getIndexX(i);
          const hVal = macd.histogram[gIdx] || 0;
          const barH = (hVal / (maxHist * 1.5)) * (subChartHeight / 2);
          ctx.fillStyle =
            hVal >= 0
              ? 'rgba(0, 255, 148, 0.45)'
              : 'rgba(255, 59, 74, 0.45)';
          ctx.fillRect(x - barWidth / 2, zeroY - barH, barWidth, barH);
        });

        // MACD & Signal lines
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const val = macd.macdLine[gIdx] || 0;
          const x = getIndexX(i);
          const y = getMacdY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.strokeStyle = '#f6be16';
        ctx.beginPath();
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const val = macd.signalLine[gIdx] || 0;
          const x = getIndexX(i);
          const y = getMacdY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.fillStyle = '#99907f';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('MACD (12, 26, 9)', 8, currentSubChartTop + 12);
      } else if (subType === 'stochastic' && stochastic) {
        const getStochY = (val: number) =>
          currentSubChartTop + subChartHeight - (val / 100) * subChartHeight;

        ctx.fillStyle = '#99907f';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('Stoch %K/%D (14, 3, 3)', 8, currentSubChartTop + 12);

        // %K
        ctx.strokeStyle = '#00ff94';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const val = stochastic.kLine[gIdx] || 50;
          const x = getIndexX(i);
          const y = getStochY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // %D
        ctx.strokeStyle = '#ff3b4a';
        ctx.beginPath();
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const val = stochastic.dLine[gIdx] || 50;
          const x = getIndexX(i);
          const y = getStochY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      } else if (subType === 'atr_14') {
        let maxAtr = 0.0001;
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const a = atr[gIdx] || 0;
          if (a > maxAtr) maxAtr = a;
        });

        const getAtrY = (val: number) =>
          currentSubChartTop + subChartHeight - (val / (maxAtr * 1.2)) * subChartHeight;

        ctx.fillStyle = '#99907f';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText(`ATR (14): ${(atr[endIdx - 1] || 0).toFixed(2)}`, 8, currentSubChartTop + 12);

        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const val = atr[gIdx] || 0;
          const x = getIndexX(i);
          const y = getAtrY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      } else if (subType === 'obv') {
        let minObv = Infinity;
        let maxObv = -Infinity;
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const v = obv[gIdx] || 0;
          if (v < minObv) minObv = v;
          if (v > maxObv) maxObv = v;
        });
        const obvRange = maxObv - minObv || 1;
        const getObvY = (val: number) =>
          currentSubChartTop + subChartHeight - ((val - minObv) / obvRange) * subChartHeight;

        ctx.fillStyle = '#99907f';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillText('OBV (On-Balance Volume)', 8, currentSubChartTop + 12);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        visibleCandles.forEach((_, i) => {
          const gIdx = startIdx + i;
          const val = obv[gIdx] || 0;
          const x = getIndexX(i);
          const y = getObvY(val);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      currentSubChartTop += subChartHeight + 8;
    });
  }, [
    visibleCandles,
    candles,
    startIdx,
    endIdx,
    currentPrice,
    symbol,
    timeframe,
    chartType,
    activeIndicators,
    activeSubCharts,
    indMap,
    cpr,
    cprConfluence,
    ema9,
    ema21,
    ema26,
    ema50,
    ema200,
    sma20,
    vwap,
    supertrend,
    parabolicSar,
    pivots,
    bollinger,
    keltner,
    donchian,
    volumeProfile,
    smartMoney,
    adx,
    rsi,
    macd,
    stochastic,
    atr,
    obv,
    cci,
    williamsR,
    activeSignal,
    showAiLevels,
    alerts,
    showAlerts,
    drawings,
    currentDrawing,
    isDrawingsVisible,
    formatTimeLabel,
    priceScaleZoom,
    pricePanOffset,
    isAutoScale,
    chartDimensions,
    theme,
  ]);

  // Helper to calculate distance from point (px, py) to line segment (x1, y1)-(x2, y2)
  const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  };

  // Find drawing clicked at screen coordinate (mouseX, mouseY)
  const findDrawingAtPoint = useCallback(
    (mouseX: number, mouseY: number): DrawingElement | null => {
      const canvas = canvasRef.current;
      if (!canvas || visibleCandles.length === 0 || drawings.length === 0) return null;
      const rect = canvas.getBoundingClientRect();
      const chartWidth = rect.width - 78;
      const totalSubChartHeight = activeSubCharts.length * 62;
      const mainChartHeight = Math.max(160, rect.height - totalSubChartHeight - 24);

      let minPrice = Infinity;
      let maxPrice = -Infinity;
      visibleCandles.forEach((item) => {
        if (item.low < minPrice) minPrice = item.low;
        if (item.high > maxPrice) maxPrice = item.high;
      });
      if (minPrice === Infinity || maxPrice === -Infinity || minPrice === maxPrice) {
        minPrice = currentPrice * 0.98;
        maxPrice = currentPrice * 1.02;
      }
      const baseMid = (maxPrice + minPrice) / 2;
      const baseSpan = Math.max(maxPrice - minPrice, baseMid * 0.005);
      const effectiveSpan = (baseSpan * 1.16) / Math.max(0.12, priceScaleZoom);
      const centerPrice = baseMid + pricePanOffset;
      const yMin = centerPrice - effectiveSpan / 2;
      const yMax = centerPrice + effectiveSpan / 2;
      const priceRange = Math.max(yMax - yMin, 0.000001);

      const toY = (p: number) => mainChartHeight - 10 - ((p - yMin) / priceRange) * (mainChartHeight - 20);

      const count = visibleCandles.length;
      const candleWidth = Math.max(2, (chartWidth - 20) / count);

      const interval = candles.length >= 2
        ? Math.max(1000, Math.abs(candles[candles.length - 1].time - candles[candles.length - 2].time))
        : 60000;

      const toX = (pt: ChartPoint) => {
        let gIdx = pt.candleIndex;
        if (pt.time && candles.length > 0) {
          if (pt.time >= candles[0].time && pt.time <= candles[candles.length - 1].time) {
            let closest = 0;
            let minD = Infinity;
            for (let i = 0; i < candles.length; i++) {
              const diff = Math.abs(candles[i].time - pt.time);
              if (diff < minD) {
                minD = diff;
                closest = i;
              } else if (diff > minD) break;
            }
            gIdx = closest + (pt.time - candles[closest].time) / interval;
          } else if (pt.time > candles[candles.length - 1].time) {
            gIdx = candles.length - 1 + (pt.time - candles[candles.length - 1].time) / interval;
          } else {
            gIdx = -(candles[0].time - pt.time) / interval;
          }
        }
        const local = gIdx - startIdx;
        return 10 + local * candleWidth + candleWidth / 2;
      };

      const HIT_DIST = 14;

      for (let i = drawings.length - 1; i >= 0; i--) {
        const d = drawings[i];
        if (!d.points || d.points.length === 0) continue;
        const p1 = d.points[0];
        const p2 = d.points[1] || p1;
        const x1 = toX(p1);
        const y1 = toY(p1.price);
        const x2 = toX(p2);
        const y2 = toY(p2.price);

        switch (d.type) {
          case 'trendline': {
            if (distToSegment(mouseX, mouseY, x1, y1, x2, y2) <= HIT_DIST) return d;
            break;
          }
          case 'horizontal_line': {
            if (Math.abs(mouseY - y1) <= HIT_DIST && mouseX <= chartWidth) return d;
            break;
          }
          case 'horizontal_ray': {
            if (Math.abs(mouseY - y1) <= HIT_DIST && mouseX >= x1 - HIT_DIST && mouseX <= chartWidth) return d;
            break;
          }
          case 'vertical_line': {
            if (Math.abs(mouseX - x1) <= HIT_DIST && mouseY <= mainChartHeight) return d;
            break;
          }
          case 'channel': {
            const h = Math.max(16, Math.abs(y2 - y1));
            const offset = (y2 >= y1 ? 1 : -1) * h;
            if (
              distToSegment(mouseX, mouseY, x1, y1, x2, y2) <= HIT_DIST ||
              distToSegment(mouseX, mouseY, x1, y1 + offset, x2, y2 + offset) <= HIT_DIST
            ) return d;
            break;
          }
          case 'rectangle': {
            const rx = Math.min(x1, x2);
            const ry = Math.min(y1, y2);
            const rw = Math.max(8, Math.abs(x2 - x1));
            const rh = Math.max(8, Math.abs(y2 - y1));
            if (
              mouseX >= rx - HIT_DIST &&
              mouseX <= rx + rw + HIT_DIST &&
              mouseY >= ry - HIT_DIST &&
              mouseY <= ry + rh + HIT_DIST
            ) return d;
            break;
          }
          case 'circle': {
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2;
            const rx = Math.max(8, Math.abs(x2 - x1) / 2);
            const ry = Math.max(6, Math.abs(y2 - y1) / 2);
            const normDist = Math.pow((mouseX - cx) / (rx + HIT_DIST), 2) + Math.pow((mouseY - cy) / (ry + HIT_DIST), 2);
            if (normDist <= 1.25) return d;
            break;
          }
          case 'fib_retracement': {
            const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
            const pDiff = p2.price - p1.price;
            const endX = Math.max(x2, chartWidth);
            const startX = Math.min(x1, x2);
            for (const lvl of levels) {
              const fibY = toY(p1.price + pDiff * lvl);
              if (Math.abs(mouseY - fibY) <= HIT_DIST && mouseX >= startX - HIT_DIST && mouseX <= endX + HIT_DIST) {
                return d;
              }
            }
            break;
          }
          case 'long_position':
          case 'short_position': {
            const boxW = Math.max(80, Math.abs(x2 - x1));
            const targetP = d.type === 'long_position' ? p1.price + Math.abs(p1.price - p2.price) * 2 : p1.price - Math.abs(p2.price - p1.price) * 2;
            const topY = Math.min(y1, toY(targetP), y2);
            const botY = Math.max(y1, toY(targetP), y2);
            if (mouseX >= x1 - HIT_DIST && mouseX <= x1 + boxW + HIT_DIST && mouseY >= topY - HIT_DIST && mouseY <= botY + HIT_DIST) {
              return d;
            }
            break;
          }
          case 'price_range': {
            const rx = Math.min(x1, x2);
            const ry = Math.min(y1, y2);
            const rw = Math.max(40, Math.abs(x2 - x1));
            const rh = Math.max(10, Math.abs(y2 - y1));
            if (mouseX >= rx - HIT_DIST && mouseX <= rx + rw + HIT_DIST && mouseY >= ry - HIT_DIST && mouseY <= ry + rh + HIT_DIST) {
              return d;
            }
            break;
          }
          case 'arrow_up':
          case 'arrow_down': {
            if (Math.hypot(mouseX - x1, mouseY - y1) <= 24) return d;
            break;
          }
          case 'text': {
            if (Math.hypot(mouseX - x1, mouseY - y1) <= 28) return d;
            break;
          }
          case 'brush': {
            if (d.points.length > 0) {
              for (let j = 0; j < d.points.length; j++) {
                const bx = toX(d.points[j]);
                const by = toY(d.points[j].price);
                if (Math.hypot(mouseX - bx, mouseY - by) <= HIT_DIST) return d;
              }
            }
            break;
          }
        }
      }
      return null;
    },
    [drawings, visibleCandles, candles, startIdx, activeSubCharts, priceScaleZoom, pricePanOffset, currentPrice]
  );

  // Coordinate Conversion Helper for drawing tools (Accurate with Price Zoom & Pan)
  const getPointFromMouse = useCallback(
    (clientX: number, clientY: number): ChartPoint | null => {
      const canvas = canvasRef.current;
      if (!canvas || visibleCandles.length === 0) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const paddingRight = 78;
      const totalSubChartHeight = activeSubCharts.length * 62;
      const mainChartHeight = Math.max(160, rect.height - totalSubChartHeight - 24);
      const chartWidth = rect.width - paddingRight;

      const count = visibleCandles.length;
      const candleWidth = Math.max(2, (chartWidth - 20) / count);

      let minPrice = Infinity;
      let maxPrice = -Infinity;
      visibleCandles.forEach((item) => {
        if (item.low < minPrice) minPrice = item.low;
        if (item.high > maxPrice) maxPrice = item.high;
      });
      if (minPrice === Infinity || maxPrice === -Infinity || minPrice === maxPrice) {
        minPrice = currentPrice * 0.98;
        maxPrice = currentPrice * 1.02;
      }

      const baseMid = (maxPrice + minPrice) / 2;
      const baseSpan = Math.max(maxPrice - minPrice, baseMid * 0.005);
      const bufferFactor = 0.16;
      const effectiveSpan = (baseSpan * (1 + bufferFactor)) / Math.max(0.12, priceScaleZoom);
      const centerPrice = baseMid + pricePanOffset;

      const yMin = centerPrice - effectiveSpan / 2;
      const yMax = centerPrice + effectiveSpan / 2;
      const priceRange = Math.max(yMax - yMin, 0.000001);

      let calcPrice = yMin + ((mainChartHeight - 10 - y) / (mainChartHeight - 20)) * priceRange;

      // Exact fractional local index matching getPointX
      const localExactIdx = (x - 10 - candleWidth / 2) / candleWidth;
      const globalIdx = startIdx + localExactIdx;

      const interval = candles.length >= 2
        ? Math.max(1000, Math.abs(candles[candles.length - 1].time - candles[candles.length - 2].time))
        : 60000;

      let candleTime: number;
      const intIdx = Math.round(globalIdx);
      if (intIdx >= 0 && intIdx < candles.length) {
        candleTime = candles[intIdx].time + (globalIdx - intIdx) * interval;
      } else if (intIdx >= candles.length && candles.length > 0) {
        candleTime = candles[candles.length - 1].time + (globalIdx - (candles.length - 1)) * interval;
      } else if (candles.length > 0) {
        candleTime = candles[0].time + globalIdx * interval;
      } else {
        candleTime = Date.now();
      }

      // Magnet Mode: Snap to candle High / Low / Close / Open and center on candle
      if (isMagnetMode && intIdx >= 0 && intIdx < candles.length) {
        const c = candles[intIdx];
        if (c) {
          const prices = [c.high, c.low, c.open, c.close];
          let closest = prices[0];
          let minDiff = Math.abs(calcPrice - closest);
          prices.forEach((p) => {
            const diff = Math.abs(calcPrice - p);
            if (diff < minDiff) {
              minDiff = diff;
              closest = p;
            }
          });
          calcPrice = closest;
          candleTime = c.time;
          return {
            candleIndex: intIdx,
            time: candleTime,
            price: calcPrice,
          };
        }
      }

      return {
        candleIndex: Math.round(globalIdx),
        time: candleTime,
        price: calcPrice,
      };
    },
    [visibleCandles, candles, startIdx, activeSubCharts, isMagnetMode, priceScaleZoom, pricePanOffset, currentPrice]
  );

  // Mouse & Touch Event Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const chartWidth = rect.width - 78;
    const totalSubChartHeight = activeSubCharts.length * 62;
    const mainChartHeight = Math.max(160, rect.height - totalSubChartHeight - 24);

    // 1. Check if user clicked on the Right Price Bar to scale / pan price axis
    if (x >= chartWidth) {
      // Check if user clicked the [AUTO ↺] button at bottom right of price scale
      if (y >= mainChartHeight - 22 && y <= mainChartHeight) {
        setPriceScaleZoom(1.0);
        setPricePanOffset(0);
        setIsAutoScale(true);
        stableBoundsRef.current = null;
        return;
      }

      setIsPriceScaleDragging(true);
      setPriceDragStartY(e.clientY);
      setPriceDragStartZoom(priceScaleZoom);
      setPriceDragStartPan(pricePanOffset);
      setIsAutoScale(false);
      return;
    }

    // 2. ERASER TOOL: Click any drawing on chart to delete it immediately!
    if (activeTool === 'eraser') {
      const clicked = findDrawingAtPoint(x, y);
      if (clicked) {
        setDrawings((prev) => prev.filter((d) => d.id !== clicked.id));
        if (selectedDrawingId === clicked.id) {
          setSelectedDrawingId(null);
        }
      }
      return;
    }

    // 3. CURSOR TOOL: Check if clicking on an existing drawing to select it!
    if (activeTool === 'cursor') {
      const clicked = findDrawingAtPoint(x, y);
      if (clicked) {
        setSelectedDrawingId(clicked.id);
        return; // Selection handled - do not pan the chart
      } else {
        setSelectedDrawingId(null);
      }
    }

    // 4. If chart pan mode or right mouse / middle click or dragging with cursor
    if (
      chartInteractionMode === 'pan' ||
      e.button === 1 ||
      e.button === 2 ||
      (activeTool === 'cursor' && !isLocked)
    ) {
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      setDragStartPanOffset(panOffset);
      setDragStartPricePan(pricePanOffset);
      return;
    }

    if (activeTool === 'cursor' || isLocked) return;

    const point = getPointFromMouse(e.clientX, e.clientY);
    if (!point) return;

    // Single-click immediate placement tools
    if (
      activeTool === 'horizontal_line' ||
      activeTool === 'horizontal_ray' ||
      activeTool === 'vertical_line' ||
      activeTool === 'arrow_up' ||
      activeTool === 'arrow_down' ||
      activeTool === 'text'
    ) {
      let annotationText = 'Key Level';
      if (activeTool === 'text') {
        const inputVal = window.prompt('Enter chart annotation text:', 'Key Level');
        if (inputVal === null) return;
        if (inputVal.trim()) annotationText = inputVal.trim();
      }

      const newD: DrawingElement = {
        id: `d_${Date.now()}`,
        type: activeTool,
        points: [point],
        color: currentColor,
        lineWidth: currentLineWidth,
        lineStyle: currentLineStyle,
        text: activeTool === 'text' ? annotationText : undefined,
        symbol,
      };
      setDrawings((prev) => [...prev, newD]);
      setSelectedDrawingId(newD.id);
      return;
    }

    // Two-point tools or brush
    if (!isDrawingInProgress) {
      setIsDrawingInProgress(true);
      dragStartPointRef.current = { x, y };
      setCurrentDrawing({
        id: `d_${Date.now()}`,
        type: activeTool,
        points: [point],
        color: currentColor,
        lineWidth: currentLineWidth,
        lineStyle: currentLineStyle,
        symbol,
      });
    } else {
      if (currentDrawing) {
        const completed: DrawingElement = {
          ...currentDrawing,
          points: [currentDrawing.points[0], point],
        };
        setDrawings((prev) => [...prev, completed]);
        setSelectedDrawingId(completed.id);
      }
      setCurrentDrawing(null);
      setIsDrawingInProgress(false);
      dragStartPointRef.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const chartWidth = rect.width - 78;
    const totalSubChartHeight = activeSubCharts.length * 62;
    const mainChartHeight = Math.max(160, rect.height - totalSubChartHeight - 24);
    const isOverPrice = x >= chartWidth;

    if (isOverPrice !== isHoveringPriceAxisRef.current) {
      isHoveringPriceAxisRef.current = isOverPrice;
      setIsHoveringPriceAxis(isOverPrice);
    }

    // 1. Handling Smooth Vertical Drag on the Price Bar
    if (isPriceScaleDragging) {
      clearCrosshair();
      const dy = e.clientY - priceDragStartY;

      let minPrice = Infinity;
      let maxPrice = -Infinity;
      visibleCandles.forEach((c) => {
        if (c.low < minPrice) minPrice = c.low;
        if (c.high > maxPrice) maxPrice = c.high;
      });
      const baseSpan = Math.max(maxPrice - minPrice, currentPrice * 0.01);
      const effectiveSpan = (baseSpan * 1.16) / Math.max(0.12, priceDragStartZoom);
      const pricePerPixel = effectiveSpan / Math.max(100, mainChartHeight - 20);

      if (e.shiftKey || e.buttons === 2 || e.buttons === 4) {
        // Shift + Drag / Right-drag: pure vertical price pan
        setPricePanOffset(priceDragStartPan + dy * pricePerPixel);
      } else {
        // Standard vertical price scale drag: stretches/compresses price axis smoothly
        const zoomFactor = Math.exp(-dy * 0.0075);
        const nextZoom = Math.max(0.15, Math.min(8.0, priceDragStartZoom * zoomFactor));
        setPriceScaleZoom(nextZoom);
        setPricePanOffset(priceDragStartPan + dy * pricePerPixel * 0.4);
      }
      return;
    }

    const candleWidth = Math.max(3.5, (chartWidth - 20) / (visibleCandles.length || 1));

    // 2. Handling Full 2D Chart Panning (Horizontal Time + Vertical Price)
    if (isDragging) {
      clearCrosshair();
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;

      // Horizontal time pan
      const barsDelta = Math.round(dx / candleWidth);
      const nextOffset = Math.max(0, Math.min(candles.length - 12, dragStartPanOffset + barsDelta));
      setPanOffset(nextOffset);

      // Vertical price pan
      let minPrice = Infinity;
      let maxPrice = -Infinity;
      visibleCandles.forEach((c) => {
        if (c.low < minPrice) minPrice = c.low;
        if (c.high > maxPrice) maxPrice = c.high;
      });
      const baseSpan = Math.max(maxPrice - minPrice, currentPrice * 0.01);
      const effectiveSpan = (baseSpan * 1.16) / Math.max(0.12, priceScaleZoom);
      const pricePerPixel = effectiveSpan / Math.max(100, mainChartHeight - 20);

      if (Math.abs(dy) > 1) {
        setPricePanOffset(dragStartPricePan + dy * pricePerPixel);
        setIsAutoScale(false);
      }
      return;
    }

    // Zero-lag crosshairs using requestAnimationFrame on overlay canvas
    if (!isDrawingInProgress) {
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (rafCrosshairId.current) {
        cancelAnimationFrame(rafCrosshairId.current);
      }
      rafCrosshairId.current = requestAnimationFrame(() => {
        drawCrosshair(clientX, clientY);
      });
    }

    // 3. Handling Drawing in Progress
    if (isDrawingInProgress && currentDrawing) {
      const point = getPointFromMouse(e.clientX, e.clientY);
      if (!point) return;

      if (currentDrawing.type === 'brush') {
        setCurrentDrawing((prev) =>
          prev ? { ...prev, points: [...prev.points, point] } : null
        );
      } else {
        setCurrentDrawing((prev) =>
          prev
            ? {
                ...prev,
                points: [prev.points[0], point],
              }
            : null
        );
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    setIsPriceScaleDragging(false);

    if (isDrawingInProgress && currentDrawing) {
      if (currentDrawing.type === 'brush') {
        if (currentDrawing.points.length > 1) {
          setDrawings((prev) => [...prev, currentDrawing]);
          setSelectedDrawingId(currentDrawing.id);
        }
        setCurrentDrawing(null);
        setIsDrawingInProgress(false);
        dragStartPointRef.current = null;
        return;
      }

      // If user dragged more than 15px from start, complete the drawing on mouse release!
      if (dragStartPointRef.current) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const dist = Math.hypot(x - dragStartPointRef.current.x, y - dragStartPointRef.current.y);

        if (dist > 15) {
          const finalPt = getPointFromMouse(e.clientX, e.clientY);
          if (finalPt) {
            const completed: DrawingElement = {
              ...currentDrawing,
              points: [currentDrawing.points[0], finalPt],
            };
            setDrawings((prev) => [...prev, completed]);
            setSelectedDrawingId(completed.id);
          }
          setCurrentDrawing(null);
          setIsDrawingInProgress(false);
          dragStartPointRef.current = null;
        }
      }
    }
  };

  const handleMouseLeave = () => {
    clearCrosshair();
    setIsDragging(false);
    setIsPriceScaleDragging(false);
    setIsHoveringPriceAxis(false);
    isHoveringPriceAxisRef.current = false;
  };

  // Double click resets price scale and auto fits chart
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const chartWidth = rect.width - 78;
    if (x >= chartWidth || isPriceScaleDragging || !isAutoScale) {
      setPriceScaleZoom(1.0);
      setPricePanOffset(0);
      setIsAutoScale(true);
      stableBoundsRef.current = null;
    }
  };

  // Touch handlers for Mobile / Tablet support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const chartWidth = rect.width - 78;

      if (x >= chartWidth) {
        setIsPriceScaleDragging(true);
        setPriceDragStartY(touch.clientY);
        setPriceDragStartZoom(priceScaleZoom);
        setPriceDragStartPan(pricePanOffset);
        setIsAutoScale(false);
        return;
      }

      // Touch Eraser
      if (activeTool === 'eraser') {
        const clicked = findDrawingAtPoint(x, y);
        if (clicked) {
          setDrawings((prev) => prev.filter((d) => d.id !== clicked.id));
          if (selectedDrawingId === clicked.id) {
            setSelectedDrawingId(null);
          }
        }
        return;
      }

      // Touch Selection
      if (activeTool === 'cursor') {
        const clicked = findDrawingAtPoint(x, y);
        if (clicked) {
          setSelectedDrawingId(clicked.id);
          return;
        } else {
          setSelectedDrawingId(null);
        }
      }

      // Touch Drawing Placement
      if (activeTool !== 'cursor' && !isLocked) {
        const point = getPointFromMouse(touch.clientX, touch.clientY);
        if (point) {
          if (
            activeTool === 'horizontal_line' ||
            activeTool === 'horizontal_ray' ||
            activeTool === 'vertical_line' ||
            activeTool === 'arrow_up' ||
            activeTool === 'arrow_down' ||
            activeTool === 'text'
          ) {
            let annotationText = 'Key Level';
            if (activeTool === 'text') {
              const inputVal = window.prompt('Enter chart annotation text:', 'Key Level');
              if (inputVal === null) return;
              if (inputVal.trim()) annotationText = inputVal.trim();
            }
            const newD: DrawingElement = {
              id: `d_${Date.now()}`,
              type: activeTool,
              points: [point],
              color: currentColor,
              lineWidth: currentLineWidth,
              lineStyle: currentLineStyle,
              text: activeTool === 'text' ? annotationText : undefined,
              symbol,
            };
            setDrawings((prev) => [...prev, newD]);
            setSelectedDrawingId(newD.id);
            return;
          }

          if (!isDrawingInProgress) {
            setIsDrawingInProgress(true);
            dragStartPointRef.current = { x, y };
            setCurrentDrawing({
              id: `d_${Date.now()}`,
              type: activeTool,
              points: [point],
              color: currentColor,
              lineWidth: currentLineWidth,
              lineStyle: currentLineStyle,
              symbol,
            });
          } else {
            if (currentDrawing) {
              const completed: DrawingElement = {
                ...currentDrawing,
                points: [currentDrawing.points[0], point],
              };
              setDrawings((prev) => [...prev, completed]);
              setSelectedDrawingId(completed.id);
            }
            setCurrentDrawing(null);
            setIsDrawingInProgress(false);
            dragStartPointRef.current = null;
          }
        }
        return;
      }

      setIsDragging(true);
      setDragStartX(touch.clientX);
      setDragStartY(touch.clientY);
      setDragStartPanOffset(panOffset);
      setDragStartPricePan(pricePanOffset);
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setLastTouchDistance(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      if (isPriceScaleDragging) {
        const touch = e.touches[0];
        const dy = touch.clientY - priceDragStartY;
        const zoomFactor = Math.exp(-dy * 0.008);
        const nextZoom = Math.max(0.15, Math.min(8.0, priceDragStartZoom * zoomFactor));
        setPriceScaleZoom(nextZoom);
        return;
      }

      if (isDragging) {
        const touch = e.touches[0];
        const rect = e.currentTarget.getBoundingClientRect();
        const chartWidth = rect.width - 78;
        const candleWidth = Math.max(3.5, (chartWidth - 20) / (visibleCandles.length || 1));
        const totalSubChartHeight = activeSubCharts.length * 62;
        const mainChartHeight = Math.max(160, rect.height - totalSubChartHeight - 24);

        const dx = touch.clientX - dragStartX;
        const dy = touch.clientY - dragStartY;

        // Horizontal time pan
        const barsDelta = Math.round(dx / candleWidth);
        const nextOffset = Math.max(0, Math.min(candles.length - 12, dragStartPanOffset + barsDelta));
        setPanOffset(nextOffset);

        // Vertical price pan
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        visibleCandles.forEach((c) => {
          if (c.low < minPrice) minPrice = c.low;
          if (c.high > maxPrice) maxPrice = c.high;
        });
        const baseSpan = Math.max(maxPrice - minPrice, currentPrice * 0.01);
        const effectiveSpan = (baseSpan * 1.16) / Math.max(0.12, priceScaleZoom);
        const pricePerPixel = effectiveSpan / Math.max(100, mainChartHeight - 20);

        if (Math.abs(dy) > 1) {
          setPricePanOffset(dragStartPricePan + dy * pricePerPixel);
          setIsAutoScale(false);
        }
      }
    } else if (e.touches.length === 2 && lastTouchDistance !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const diff = currentDist - lastTouchDistance;
      if (Math.abs(diff) > 4) {
        const zoomDelta = diff > 0 ? -2 : 2;
        setVisibleCandleCount((prev) => Math.max(12, Math.min(250, prev + zoomDelta)));
        setLastTouchDistance(currentDist);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsPriceScaleDragging(false);
    setLastTouchDistance(null);
  };

  // Global mouse move and mouse up listeners so dragging never drops or stutters
  useEffect(() => {
    if (!isDragging && !isPriceScaleDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const chartWidth = rect.width - 78;
      const totalSubChartHeight = activeSubCharts.length * 62;
      const mainChartHeight = Math.max(160, rect.height - totalSubChartHeight - 24);

      if (isPriceScaleDragging) {
        const dy = e.clientY - priceDragStartY;
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        visibleCandles.forEach((c) => {
          if (c.low < minPrice) minPrice = c.low;
          if (c.high > maxPrice) maxPrice = c.high;
        });
        const baseSpan = Math.max(maxPrice - minPrice, currentPrice * 0.01);
        const effectiveSpan = (baseSpan * 1.16) / Math.max(0.12, priceDragStartZoom);
        const pricePerPixel = effectiveSpan / Math.max(100, mainChartHeight - 20);

        if (e.shiftKey || e.buttons === 2 || e.buttons === 4) {
          setPricePanOffset(priceDragStartPan + dy * pricePerPixel);
        } else {
          const zoomFactor = Math.exp(-dy * 0.0075);
          const nextZoom = Math.max(0.15, Math.min(8.0, priceDragStartZoom * zoomFactor));
          setPriceScaleZoom(nextZoom);
          setPricePanOffset(priceDragStartPan + dy * pricePerPixel * 0.4);
        }
        return;
      }

      if (isDragging) {
        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;
        const visibleCount = visibleCandles.length || 1;
        const candleWidth = Math.max(3.5, (chartWidth - 20) / visibleCount);

        const barsDelta = Math.round(dx / candleWidth);
        const nextOffset = Math.max(0, Math.min(candles.length - 12, dragStartPanOffset + barsDelta));
        setPanOffset(nextOffset);

        let minPrice = Infinity;
        let maxPrice = -Infinity;
        visibleCandles.forEach((c) => {
          if (c.low < minPrice) minPrice = c.low;
          if (c.high > maxPrice) maxPrice = c.high;
        });
        const baseSpan = Math.max(maxPrice - minPrice, currentPrice * 0.01);
        const effectiveSpan = (baseSpan * 1.16) / Math.max(0.12, priceScaleZoom);
        const pricePerPixel = effectiveSpan / Math.max(100, mainChartHeight - 20);

        if (Math.abs(dy) > 1) {
          setPricePanOffset(dragStartPricePan + dy * pricePerPixel);
          setIsAutoScale(false);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsPriceScaleDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    isDragging,
    isPriceScaleDragging,
    dragStartX,
    dragStartY,
    dragStartPanOffset,
    dragStartPricePan,
    priceDragStartY,
    priceDragStartZoom,
    priceDragStartPan,
    visibleCandles,
    candles.length,
    visibleCandleCount,
    priceScaleZoom,
    currentPrice,
    activeSubCharts.length,
  ]);

  // Wheel zoom and horizontal trackpad navigation
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const chartWidth = rect.width - 78;

      // When cursor is over Right Price Scale: zoom/pan vertical price scale
      if (mouseX >= chartWidth) {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          // Shift + Scroll: vertical price pan
          let minPrice = Infinity;
          let maxPrice = -Infinity;
          visibleCandles.forEach((c) => {
            if (c.low < minPrice) minPrice = c.low;
            if (c.high > maxPrice) maxPrice = c.high;
          });
          const baseSpan = Math.max(maxPrice - minPrice, currentPrice * 0.01);
          const panStep = baseSpan * 0.08 * (e.deltaY < 0 ? 1 : -1);
          setPricePanOffset((prev) => prev + panStep);
        } else {
          // Smooth vertical scale zoom
          const zoomDelta = e.deltaY < 0 ? 1.08 : 0.92;
          setPriceScaleZoom((prev) => Math.max(0.15, Math.min(8.0, prev * zoomDelta)));
        }
        setIsAutoScale(false);
        return;
      }
    }

    e.preventDefault();
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // Horizontal pan
      const delta = (e.deltaX || e.deltaY) > 0 ? 3 : -3;
      setPanOffset((prev) => Math.max(0, Math.min(candles.length - 12, prev + delta)));
    } else {
      // Smooth Horizontal Zoom in / out
      const zoomStep = e.deltaY < 0 ? -4 : 4;
      setVisibleCandleCount((prev) => Math.max(14, Math.min(250, prev + zoomStep)));
    }
  };

  // Indicator Persistence
  useEffect(() => {
    try {
      localStorage.setItem('lumina_chart_indicators', JSON.stringify(activeIndicators));
    } catch {}
  }, [activeIndicators]);

  // Indicator Handlers
  const handleToggleIndicator = (id: string) => {
    setActiveIndicators((prev) => {
      const existing = prev.find((ind) => ind.id === id || ind.indicatorId === id);
      if (existing) {
        return prev.map((ind) =>
          ind.id === id || ind.indicatorId === id
            ? { ...ind, enabled: !ind.enabled, visible: !ind.enabled ? true : ind.visible }
            : ind
        );
      }
      const catalogItem = INDICATOR_CATALOG.find((item) => item.id === id);
      if (catalogItem) {
        return [
          ...prev,
          {
            id: catalogItem.id,
            indicatorId: catalogItem.id,
            enabled: true,
            params: { ...catalogItem.defaultParams },
            color: catalogItem.color,
            secondaryColor: catalogItem.secondaryColor,
            visible: true,
          },
        ];
      }
      return prev;
    });
  };

  const handleToggleIndicatorVisibility = (id: string) => {
    setActiveIndicators((prev) =>
      prev.map((ind) =>
        ind.id === id || ind.indicatorId === id
          ? { ...ind, visible: ind.visible === false ? true : false }
          : ind
      )
    );
  };

  const handleRemoveIndicator = (id: string) => {
    setActiveIndicators((prev) =>
      prev.filter((ind) => ind.id !== id && ind.indicatorId !== id)
    );
  };

  const handleUpdateIndicatorParams = (id: string, params: Record<string, any>) => {
    setActiveIndicators((prev) => {
      const existing = prev.find((ind) => ind.id === id || ind.indicatorId === id);
      if (existing) {
        return prev.map((ind) =>
          ind.id === id || ind.indicatorId === id
            ? { ...ind, params: { ...ind.params, ...params } }
            : ind
        );
      }
      const catalogItem = INDICATOR_CATALOG.find((item) => item.id === id);
      if (catalogItem) {
        return [
          ...prev,
          {
            id: catalogItem.id,
            indicatorId: catalogItem.id,
            enabled: true,
            params: { ...catalogItem.defaultParams, ...params },
            color: catalogItem.color,
            secondaryColor: catalogItem.secondaryColor,
            visible: true,
          },
        ];
      }
      return prev;
    });
  };

  const handleUpdateIndicatorColor = (id: string, color: string) => {
    setActiveIndicators((prev) =>
      prev.map((ind) =>
        ind.id === id || ind.indicatorId === id ? { ...ind, color } : ind
      )
    );
  };

  // Drawing Actions
  const handleUndo = () => {
    setDrawings((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all drawings and annotations?')) {
      setDrawings([]);
    }
  };

  const handleSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumina_${symbol.replace('/', '_')}_${timeframe}_chart.png`;
    a.click();
  };

  const activeDisplayCandle = hoveredCandle || visibleCandles[visibleCandles.length - 1] || candles[candles.length - 1];

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className={`w-full h-full flex flex-col font-mono select-none ${
        theme === 'light' ? 'bg-white text-[#131722]' : 'bg-[#111417] text-[#e1e2e7]'
      } ${isFullscreen ? 'fixed inset-0 z-50 p-3' : 'relative'}`}
    >
      {/* 1. TOP TRADINGVIEW TOOLBAR / SPLIT HEADER */}
      {isSplitMode ? (
        <div
          className={`flex items-center justify-between px-2.5 py-1 border-b text-[11px] relative z-30 font-mono select-none shrink-0 ${
            theme === 'light' ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-[#191c1f] border-[#272a2d]'
          }`}
        >
          {/* Left: Symbol & Compact Timeframe selector */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-[#f6be16] text-[11px] shrink-0">{symbol}</span>
            <div className="flex items-center gap-0.5 bg-black/25 p-0.5 rounded border border-white/5 shrink-0">
              {['1m', '5m', '15m', '1h', '4h', '1D'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => onTimeframeChange(tf)}
                  className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold cursor-pointer transition-colors ${
                    timeframe === tf
                      ? 'bg-[#f6be16] text-[#0b0e11] font-black'
                      : 'text-[#99907f] hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          {/* Right: Live Price & 1-Click Maximize */}
          <div className="flex items-center gap-2 shrink-0">
            <span className={`font-bold font-mono text-[11px] ${
              rawCurrentPrice >= (rawCandles[rawCandles.length - 2]?.close || rawCurrentPrice)
                ? 'text-[#089981] dark:text-[#00ff94]'
                : 'text-[#f23645]'
            }`}>
              ${rawCurrentPrice < 1 ? rawCurrentPrice.toFixed(4) : rawCurrentPrice.toFixed(2)}
            </span>
            {onMaximize && (
              <button
                onClick={onMaximize}
                className="p-1 rounded hover:bg-white/10 text-[#99907f] hover:text-[#00ff94] transition-colors cursor-pointer"
                title="Focus / Maximize this chart (Single Full View)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
      <div
        onWheel={(e) => {
          e.stopPropagation();
          if (e.deltaY !== 0 || e.deltaX !== 0) {
            e.currentTarget.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX;
          }
        }}
        className={`flex items-center justify-between px-2 py-1 border-b text-[11px] relative z-30 overflow-x-auto no-scrollbar gap-1.5 ${
          theme === 'light' ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-[#191c1f] border-[#272a2d]'
        }`}
      >
        {/* Left: Drawing Tools, Timeframes, Chart Type, and fx Indicators Button */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Drawing Tools Toggle */}
          <button
            onClick={() => setIsDrawingToolbarOpen(!isDrawingToolbarOpen)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold transition-colors cursor-pointer ${
              isDrawingToolbarOpen
                ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                : 'bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1]'
            }`}
            title="Toggle Drawing & Annotation Tools Toolbar"
          >
            <PenTool className="w-3 h-3" />
            <span className="hidden sm:inline">Tools</span>
          </button>

          <div className="w-[1px] h-3 bg-[#272a2d] mx-0.5" />

          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                timeframe === tf
                  ? 'bg-[#f6be16] text-[#0b0e11]'
                  : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d]'
              }`}
            >
              {tf}
            </button>
          ))}

          <div className="w-[1px] h-3 bg-[#272a2d] mx-0.5" />

          {/* Chart Type Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsChartTypeDropdownOpen(!isChartTypeDropdownOpen)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#e1e2e7] text-[10.5px] font-bold transition-colors cursor-pointer"
            >
              <BarChart2 className="w-3 h-3 text-[#00ff94]" />
              <span className="capitalize">{chartType.replace('_', ' ')}</span>
              <ChevronDown className="w-2.5 h-2.5 text-[#99907f]" />
            </button>

            {isChartTypeDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-36 bg-[#191c1f] border border-[#272a2d] rounded-lg shadow-2xl p-1 z-50 flex flex-col gap-0.5 text-xs">
                {[
                  { id: 'candles', label: 'Candlestick' },
                  { id: 'hollow', label: 'Hollow Candles' },
                  { id: 'heikin_ashi', label: 'Heikin Ashi' },
                  { id: 'bars', label: 'OHLC Bars' },
                  { id: 'line', label: 'Area Line' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setChartType(type.id as any);
                      setIsChartTypeDropdownOpen(false);
                    }}
                    className={`text-left px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                      chartType === type.id
                        ? 'bg-[#272a2d] text-[#00ff94] font-bold'
                        : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d]/50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* fx Indicators Dialog Button (Prominent in main toolbar cluster) */}
          <button
            id="chart-indicators-modal-btn"
            onClick={() => setIsIndicatorsModalOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#ffd87f] border border-[#f6be16]/40 hover:border-[#f6be16] font-bold transition-all cursor-pointer shadow-xs shrink-0 text-[11px]"
            title="Open Indicators & Strategies Library (fx) - EMA, Supertrend, RSI, MACD..."
          >
            <span className="text-[#f6be16] font-extrabold text-[11px]">fx</span>
            <span>Indicators</span>
            <span className="text-[9.5px] px-1 py-0.1 bg-[#ffd87f]/20 text-[#ffd87f] rounded-full font-bold">
              {activeIndicators.filter((i) => i.enabled).length}
            </span>
          </button>
        </div>

        {/* Right: AI Levels, SMC/FVG, Price Alerts, Snapshot & Fullscreen */}
        <div className="flex items-center gap-1 text-[10.5px] shrink-0">

          {/* AI Levels Overlay */}
          {activeSignal && activeSignal.symbol === symbol && (
            <>
              <button
                onClick={() => setShowAiLevels(!showAiLevels)}
                className={`flex items-center gap-1 px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                  showAiLevels
                    ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                    : 'text-[#99907f] bg-[#272a2d]/60'
                }`}
                title="Toggle AI Signal Target & Stop Loss overlays"
              >
                <Sparkles className="w-3 h-3 text-[#00ff94]" />
                <span className="hidden sm:inline">AI Levels</span>
              </button>

              {/* Static Level Status / Accept Lock */}
              {activeSignal.isAccepted || activeSignal.isLocked ? (
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#00ff94]/15 border border-[#00ff94]/40 text-[#00ff94] font-bold"
                  title="Entry, TP, and SL are locked as static markers on this chart"
                >
                  <Lock className="w-3 h-3 text-[#00ff94]" />
                  <span className="hidden xl:inline">Static Locked</span>
                  {onUnlockSignal && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnlockSignal();
                      }}
                      className="ml-1 text-[10px] text-[#99907f] hover:text-[#ff8892] underline cursor-pointer"
                      title="Unlock static markers"
                    >
                      Unlock
                    </button>
                  )}
                </div>
              ) : (
                onAcceptSignal && (
                  <button
                    onClick={() => onAcceptSignal(activeSignal)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#ffd87f]/20 hover:bg-[#ffd87f]/30 text-[#ffd87f] border border-[#ffd87f]/50 font-bold transition-all cursor-pointer shadow-xs"
                    title="Lock current suggested Entry, TP, and SL as static markers on this chart"
                  >
                    <Lock className="w-3 h-3" />
                    <span className="hidden xl:inline">Accept & Lock</span>
                  </button>
                )
              )}

              {/* Refresh Analysis Button */}
              {onRefreshAnalysis && (
                <button
                  onClick={onRefreshAnalysis}
                  disabled={isRefreshingAnalysis}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-[#60a5fa] border border-[#3b82f6]/50 font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Re-run 5-Agent calculation based on current market price"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingAnalysis ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh Analysis</span>
                </button>
              )}
            </>
          )}

          {/* Smart Money / FVG Quick Toggle */}
          <button
            onClick={() => setShowSMC(!showSMC)}
            className={`flex items-center gap-1 px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
              showSMC
                ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                : 'text-[#99907f] bg-[#272a2d]/60'
            }`}
            title="Toggle Smart Money Concepts (Fair Value Gaps & Order Blocks)"
          >
            <Zap className="w-3 h-3 text-[#00ff94]" />
            <span className="hidden sm:inline">SMC/FVG</span>
          </button>

          {/* Price Alerts Toggle */}
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
              showAlerts ? 'text-[#f6be16] bg-[#272a2d]/80 font-bold' : 'text-[#99907f]'
            }`}
            title="Toggle Visual Price Alerts on chart"
          >
            <Bell className="w-3 h-3" />
            <span className="hidden sm:inline">Alerts</span>
          </button>

          {/* Quick + Alert Button */}
          {onOpenAlertsModal && (
            <button
              onClick={() => onOpenAlertsModal(currentPrice)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#f6be16]/15 hover:bg-[#f6be16]/25 text-[#f6be16] border border-[#f6be16]/30 font-bold transition-all cursor-pointer shadow-xs"
              title="Set Price Alert"
            >
              <span>+ Alert</span>
            </button>
          )}

          {/* Snapshot Button */}
          <button
            onClick={handleSnapshot}
            className="p-1.5 text-[#99907f] hover:text-[#fff8f1] rounded hover:bg-[#272a2d] cursor-pointer"
            title="Take Snapshot / Export Chart Image"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-[#99907f] hover:text-[#fff8f1] rounded hover:bg-[#272a2d] cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      )}

      {/* 2. MAIN WORKSPACE: LEFT DRAWING TOOLBAR + CANVAS */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Drawing Toolbar - Collapsible on Mobile */}
        {isDrawingToolbarOpen && (
          <div className="shrink-0 z-30 h-full max-h-full relative overflow-visible">
            <DrawingToolbar
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              currentColor={currentColor}
              onChangeColor={setCurrentColor}
              currentLineWidth={currentLineWidth}
              onChangeLineWidth={setCurrentLineWidth}
              currentLineStyle={currentLineStyle}
              onChangeLineStyle={setCurrentLineStyle}
              isMagnetMode={isMagnetMode}
              onToggleMagnetMode={() => setIsMagnetMode(!isMagnetMode)}
              isLocked={isLocked}
              onToggleLock={() => setIsLocked(!isLocked)}
              isDrawingsVisible={isDrawingsVisible}
              onToggleVisibility={() => setIsDrawingsVisible(!isDrawingsVisible)}
              drawingCount={drawings.length}
              drawings={drawings}
              onDeleteDrawing={(id) => {
                setDrawings((prev) => prev.filter((d) => d.id !== id));
                if (selectedDrawingId === id) setSelectedDrawingId(null);
              }}
              onUndo={handleUndo}
              onClearAll={handleClearAll}
            />
          </div>
        )}

        {/* OHLC HUD Readout - High Contrast & Mobile Friendly with Date & Candle Time */}
        {activeDisplayCandle && (() => {
          const dispPrecision = currentPrice < 0.001 ? 8 : currentPrice < 0.1 ? 6 : currentPrice < 2 ? 4 : currentPrice < 100 ? 3 : 2;
          const isUp = activeDisplayCandle.close >= activeDisplayCandle.open;
          const change = activeDisplayCandle.close - activeDisplayCandle.open;
          const changePct = activeDisplayCandle.open > 0 ? (change / activeDisplayCandle.open) * 100 : 0;
          const cd = new Date(activeDisplayCandle.time);
          const dateStr = cd.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
          const timeStr = cd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

          return (
            <div className={`absolute top-1.5 left-2 sm:left-4 z-10 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-mono pointer-events-none px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border shadow-xs max-w-[96%] overflow-x-auto no-scrollbar whitespace-nowrap backdrop-blur-md ${
              isLight ? 'bg-white/95 text-[#131722] border-[#e0e3eb]' : 'bg-[#111417]/95 text-[#e1e2e7] border-[#272a2d]'
            }`}>
              <span className="text-[#f6be16] font-bold">{symbol}</span>
              <span className={isLight ? 'text-[#94a3b8]' : 'text-[#555b62]'}>·</span>
              <span className="text-[#ffd87f] font-bold">{timeframe}</span>

              {/* Exact Candle Date & Time Badge (Only in full mode) */}
              {!isSplitMode && (
                <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#f6be16]/10 text-[#f6be16] border border-[#f6be16]/30 text-[9.5px] sm:text-[10px] font-bold">
                  <Calendar className="w-2.5 h-2.5 text-[#f6be16] shrink-0" />
                  <span>{dateStr}</span>
                  <Clock className="w-2.5 h-2.5 text-[#f6be16] shrink-0 ml-0.5" />
                  <span>{timeStr}</span>
                  {hoveredCandle ? (
                    <span className="ml-0.5 text-[8px] px-1 py-0.2 rounded bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/40 font-semibold">
                      Hover
                    </span>
                  ) : (
                    <span className="ml-0.5 text-[8px] px-1 py-0.2 rounded bg-[#089981]/20 text-[#089981] dark:text-[#00ff94] border border-[#089981]/40 font-semibold">
                      Live
                    </span>
                  )}
                </div>
              )}

              {/* Candle Countdown Timer (Only in full mode) */}
              {!isSplitMode && (
                <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#089981]/10 text-[#089981] dark:text-[#00ff94] border border-[#089981]/30 text-[9.5px] sm:text-[10px] font-bold" title="Time remaining until this candle closes">
                  <Clock className="w-2.5 h-2.5 animate-pulse shrink-0" />
                  <CandleCountdownBadge
                    lastCandleTime={candles[candles.length - 1]?.time}
                    timeframe={timeframe}
                    onCountdownUpdate={(str) => {
                      candleCountdownRef.current = str;
                    }}
                  />
                </div>
              )}

              {!isSplitMode && <div className={`h-3 w-px ${isLight ? 'bg-[#e0e3eb]' : 'bg-[#272a2d]'}`} />}

              <span className={isLight ? 'text-[#787b86]' : 'text-[#99907f]'}>
                O: <span className={isLight ? 'text-[#131722]' : 'text-[#e1e2e7]'}>{activeDisplayCandle.open.toFixed(dispPrecision)}</span>
              </span>
              <span className={isLight ? 'text-[#787b86]' : 'text-[#99907f]'}>
                H: <span className="text-[#089981] font-semibold">{activeDisplayCandle.high.toFixed(dispPrecision)}</span>
              </span>
              <span className={isLight ? 'text-[#787b86]' : 'text-[#99907f]'}>
                L: <span className="text-[#f23645] font-semibold">{activeDisplayCandle.low.toFixed(dispPrecision)}</span>
              </span>
              <span className={isLight ? 'text-[#787b86]' : 'text-[#99907f]'}>
                C:{' '}
                <span className={`font-semibold ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                  {activeDisplayCandle.close.toFixed(dispPrecision)}
                </span>
              </span>
              <span className={`font-bold ${isUp ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(dispPrecision)} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
              </span>
              <span className={`hidden sm:inline ${isLight ? 'text-[#787b86]' : 'text-[#99907f]'}`}>
                Vol: <span className="text-[#f6be16]">{activeDisplayCandle.volume.toLocaleString()}</span>
              </span>
            </div>
          );
        })()}

        {/* On-Chart Active Indicators Legend & Quick Controls */}
        {!isSplitMode && (
        <div className="absolute top-8 sm:top-8.5 left-2 sm:left-4 z-10 flex items-center gap-1 max-w-[95%] sm:max-w-[85%] font-mono text-[10px] pointer-events-none overflow-x-auto no-scrollbar py-0.5">
          {activeIndicators.filter((i) => i.enabled).length === 0 ? (
            <button
              onClick={() => setIsIndicatorsModalOpen(true)}
              className={`pointer-events-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[#f6be16] border border-[#f6be16]/40 hover:border-[#f6be16] transition-all cursor-pointer shadow-md text-[10px] font-bold ${
                isLight ? 'bg-white/95 hover:bg-gray-50' : 'bg-[#191c1f]/90 hover:bg-[#272a2d]'
              }`}
              title="Add Technical Indicators (EMA, Supertrend, RSI, MACD...)"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>+ Add Indicators (fx)</span>
            </button>
          ) : isIndicatorsCollapsed ? (
            <button
              onClick={() => setIsIndicatorsCollapsed(false)}
              className={`pointer-events-auto flex items-center gap-1 px-2 py-0.5 rounded-md border backdrop-blur-md shadow-xs transition-colors cursor-pointer text-[10px] font-bold ${
                isLight ? 'bg-white/95 border-[#e0e3eb] text-[#131722]' : 'bg-[#111417]/90 border-[#272a2d] text-[#e1e2e7]'
              }`}
              title="Expand active indicators list"
            >
              <span className="text-[#f6be16] font-bold">fx</span>
              <span>Indicators ({activeIndicators.filter((i) => i.enabled).length})</span>
              <ChevronDown className="w-2.5 h-2.5 ml-0.5 text-[#99907f]" />
            </button>
          ) : (
            <>
              {/* Collapse indicator bar button */}
              <button
                onClick={() => setIsIndicatorsCollapsed(true)}
                className={`pointer-events-auto p-1 rounded border backdrop-blur-md transition-colors cursor-pointer text-[10px] shrink-0 ${
                  isLight ? 'bg-white/95 border-[#e0e3eb] text-[#787b86] hover:text-[#131722]' : 'bg-[#111417]/90 border-[#272a2d] text-[#99907f] hover:text-white'
                }`}
                title="Collapse indicators bar"
              >
                <ChevronUp className="w-2.5 h-2.5" />
              </button>

              {activeIndicators
                .filter((ind) => ind.enabled)
                .map((ind) => {
                  const catalogInfo = INDICATOR_CATALOG.find((c) => c.id === ind.id);
                  const isVisible = ind.visible !== false;
                  
                  // Get live readout value
                  let readoutVal = '';
                  const dispPrecision = currentPrice < 0.001 ? 8 : currentPrice < 0.1 ? 6 : currentPrice < 2 ? 4 : currentPrice < 100 ? 3 : 2;
                  if (ind.id === 'ema_9') {
                    const val = ema9[ema9.length - 1];
                    if (typeof val === 'number') readoutVal = val.toFixed(dispPrecision);
                  } else if (ind.id === 'ema_21') {
                    const val = ema21[ema21.length - 1];
                    if (typeof val === 'number') readoutVal = val.toFixed(dispPrecision);
                  } else if (ind.id === 'ema_26') {
                    const val = ema26[ema26.length - 1];
                    if (typeof val === 'number') readoutVal = val.toFixed(dispPrecision);
                  } else if (ind.id === 'ema_50') {
                    const val = ema50[ema50.length - 1];
                    if (typeof val === 'number') readoutVal = val.toFixed(dispPrecision);
                  } else if (ind.id === 'ema_200') {
                    const val = ema200[ema200.length - 1];
                    if (typeof val === 'number') readoutVal = val.toFixed(dispPrecision);
                  } else if (ind.id === 'sma_20') {
                    const val = sma20[sma20.length - 1];
                    if (typeof val === 'number') readoutVal = val.toFixed(dispPrecision);
                  } else if (ind.id === 'vwap') {
                    const val = vwap[vwap.length - 1];
                    if (typeof val === 'number') readoutVal = val.toFixed(dispPrecision);
                  } else if (ind.id === 'supertrend') {
                    if (supertrend && supertrend.band.length > 0) {
                      const val = supertrend.band[supertrend.band.length - 1];
                      const tr = supertrend.trend[supertrend.trend.length - 1] || 'bull';
                      if (typeof val === 'number') readoutVal = `${val.toFixed(dispPrecision)} (${tr})`;
                    }
                  } else if (ind.id === 'cpr') {
                    if (cpr) readoutVal = `TC:${cpr.tcActual.toFixed(dispPrecision)} P:${cpr.pivot.toFixed(dispPrecision)} BC:${cpr.bcActual.toFixed(dispPrecision)} [${cpr.widthType || (cpr.isNarrow ? 'NARROW' : cpr.isWide ? 'WIDE' : 'AVG')}]`;
                  } else if (ind.id === 'rsi_14') {
                    const val = rsi[rsi.length - 1];
                    if (typeof val === 'number') readoutVal = val.toFixed(1);
                  } else if (ind.id === 'macd') {
                    if (macd && macd.macdLine.length > 0) {
                      const m = macd.macdLine[macd.macdLine.length - 1];
                      const s = macd.signalLine[macd.signalLine.length - 1];
                      if (typeof m === 'number' && typeof s === 'number') readoutVal = `M:${m.toFixed(1)} S:${s.toFixed(1)}`;
                    }
                  } else if (ind.id === 'stochastic') {
                    if (stochastic && stochastic.kLine.length > 0) {
                      const k = stochastic.kLine[stochastic.kLine.length - 1];
                      if (typeof k === 'number') readoutVal = `%K:${k.toFixed(1)}`;
                    }
                  } else if (ind.id === 'adx_14') {
                    if (adx && adx.adx.length > 0) {
                      const a = adx.adx[adx.adx.length - 1];
                      if (typeof a === 'number') readoutVal = a.toFixed(1);
                    }
                  } else if (ind.id === 'atr_14') {
                    const a = atr[atr.length - 1];
                    if (typeof a === 'number') readoutVal = a.toFixed(dispPrecision);
                  } else if (ind.id === 'obv') {
                    const o = obv[obv.length - 1];
                    if (typeof o === 'number') readoutVal = o.toLocaleString();
                  }

                  return (
                    <div
                      key={ind.id}
                      className={`pointer-events-auto flex items-center gap-1.5 px-2 py-0.5 rounded-md border backdrop-blur-md shadow-xs transition-all group ${
                        isLight ? 'bg-white/95' : 'bg-[#111417]/90'
                      } ${
                        isVisible
                          ? isLight ? 'border-[#e0e3eb] text-[#131722]' : 'border-[#272a2d] text-[#e1e2e7]'
                          : isLight ? 'border-[#e0e3eb]/50 text-[#787b86] opacity-60' : 'border-[#272a2d]/40 text-[#99907f] opacity-60'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: ind.color || catalogInfo?.color || '#00ff94' }}
                      />
                      <span className="font-bold whitespace-nowrap">
                        {catalogInfo?.shortName || catalogInfo?.name || ind.id}
                      </span>
                      {readoutVal && (
                        <span
                          className="font-bold text-[10px] whitespace-nowrap"
                          style={{ color: ind.color || catalogInfo?.color || '#ffd87f' }}
                        >
                          {readoutVal}
                        </span>
                      )}

                      {/* Action buttons on chip */}
                      <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleToggleIndicatorVisibility(ind.id)}
                          className={`p-0.5 rounded cursor-pointer ${isLight ? 'hover:text-[#131722]' : 'hover:text-[#fff8f1]'}`}
                          title={isVisible ? 'Hide Indicator' : 'Show Indicator'}
                        >
                          {isVisible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5 text-[#ff3b4a]" />}
                        </button>
                        <button
                          onClick={() => setIsIndicatorsModalOpen(true)}
                          className="p-0.5 hover:text-[#00ff94] rounded cursor-pointer"
                          title="Configure Indicator Parameters"
                        >
                          <Sliders className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={() => handleToggleIndicator(ind.id)}
                          className="p-0.5 hover:text-[#ff3b4a] rounded cursor-pointer"
                          title="Remove Indicator"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

              {/* Quick Add Button */}
              <button
                onClick={() => setIsIndicatorsModalOpen(true)}
                className={`pointer-events-auto flex items-center gap-1 px-1.5 py-0.5 rounded-md border transition-colors cursor-pointer ${
                  isLight ? 'bg-gray-100 hover:bg-gray-200 text-[#b45309] border-[#e0e3eb]' : 'bg-[#272a2d]/80 hover:bg-[#37393d] text-[#ffd87f] border-[#37393d]'
                }`}
                title="Add more technical indicators"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>fx</span>
              </button>
            </>
          )}
        </div>
        )}

        {/* On-Chart 5-Agent Trade Signal HUD (Static Level Status & Refresh) */}
        {!isSplitMode && activeSignal && showAiLevels && activeSignal.symbol === symbol && (
          isAiHudCollapsed ? (
            <div className={`absolute top-13 sm:top-14 left-2 sm:left-4 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-md backdrop-blur-md border text-[10px] font-mono shadow-md pointer-events-auto ${
              isLight ? 'bg-white/95 border-[#e0e3eb] text-[#131722]' : 'bg-[#14171a]/95 border-[#272a2d] text-white'
            }`}>
              <span className="flex items-center gap-1 text-[#f6be16] font-bold">
                <Sparkles className="w-2.5 h-2.5" />
                <span>AI SIGNAL:</span>
              </span>
              <span className={`font-bold ${activeSignal.side === 'LONG' ? (isLight ? 'text-[#089981]' : 'text-[#00D084]') : 'text-[#F23645]'}`}>
                {activeSignal.side} ${activeSignal.entryPrice.toFixed(activeSignal.entryPrice < 1 ? 4 : activeSignal.entryPrice > 100 ? 1 : 2)}
              </span>
              <button
                onClick={() => setIsAiHudCollapsed(false)}
                className={`p-0.5 rounded cursor-pointer transition-colors ${
                  isLight ? 'hover:bg-gray-100 text-[#787b86] hover:text-[#131722]' : 'hover:bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                }`}
                title="Expand AI Signal Details (TP/SL)"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowAiLevels(false)}
                className={`p-0.5 rounded cursor-pointer transition-colors ml-0.5 ${
                  isLight ? 'hover:bg-red-50 text-gray-400 hover:text-red-500' : 'hover:bg-red-950/40 text-[#99907f] hover:text-[#ff3b4a]'
                }`}
                title="Hide AI Signal Overlay"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ) : (
            <div className={`absolute top-13 sm:top-14 left-2 sm:left-4 z-10 flex flex-wrap items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-lg backdrop-blur-md border text-[10px] sm:text-[11px] font-mono shadow-xl pointer-events-auto max-w-[95%] sm:max-w-max ${
              isLight ? 'bg-white/95 border-[#e0e3eb] text-[#131722]' : 'bg-[#14171a]/95 border-[#272a2d] text-white'
            }`}>
              <div className="flex items-center gap-1">
                {activeSignal.isAccepted || activeSignal.isLocked ? (
                  <span className={`flex items-center gap-1 font-bold text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded border ${
                    isLight ? 'text-[#089981] bg-[#089981]/10 border-[#089981]/30' : 'text-[#00D084] bg-[#00D084]/15 border-[#00D084]/30'
                  }`}>
                    <Lock className="w-2.5 h-2.5" />
                    STATIC LOCKED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[#f6be16] font-bold text-[9px] sm:text-[10px] bg-[#f6be16]/15 px-1.5 py-0.5 rounded border border-[#f6be16]/30">
                    <Sparkles className="w-2.5 h-2.5" />
                    SUGGESTED
                  </span>
                )}
                <span className={`font-bold ${activeSignal.side === 'LONG' ? (isLight ? 'text-[#089981]' : 'text-[#00D084]') : 'text-[#F23645]'}`}>
                  {activeSignal.side}
                </span>
                {activeSignal.setupType && (
                  <span className="hidden sm:inline-block text-[8px] px-1.5 py-0.5 rounded bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/40 font-bold uppercase tracking-wider">
                    {activeSignal.setupType.replace('_', ' ')}
                  </span>
                )}
              </div>

              <div className={`h-3 w-px ${isLight ? 'bg-[#e0e3eb]' : 'bg-[#272a2d]'}`} />

              <div className="flex items-center gap-2">
                <span className={isLight ? 'text-[#787b86]' : 'text-[#99907f]'}>
                  Entry: <strong className={isLight ? 'text-[#131722]' : 'text-[#fff8f1]'}>{isINR ? '₹' : '$'}{(activeSignal.entryPrice * (isINR && inrRateMultiplier > 0 ? inrRateMultiplier : 1)).toFixed(activeSignal.entryPrice > 100 ? 2 : 4)}</strong>
                </span>
                <span className={isLight ? 'text-[#787b86]' : 'text-[#99907f]'}>
                  TP: <strong className={isLight ? 'text-[#089981]' : 'text-[#00D084]'}>{isINR ? '₹' : '$'}{(activeSignal.target1 * (isINR && inrRateMultiplier > 0 ? inrRateMultiplier : 1)).toFixed(activeSignal.target1 > 100 ? 2 : 4)}</strong>
                </span>
                <span className={isLight ? 'text-[#787b86]' : 'text-[#99907f]'}>
                  SL: <strong className="text-[#F23645]">{isINR ? '₹' : '$'}{(activeSignal.stopLoss * (isINR && inrRateMultiplier > 0 ? inrRateMultiplier : 1)).toFixed(activeSignal.stopLoss > 100 ? 2 : 4)}</strong>
                </span>
              </div>

              <div className={`h-3 w-px ${isLight ? 'bg-[#e0e3eb]' : 'bg-[#272a2d]'}`} />

              {/* Action Buttons: 1-Click Auto-Placement, Refresh Analysis & Collapse */}
              <div className="flex items-center gap-1.5">
                {signalCompletionStatus && (
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-black text-[9px] sm:text-[10px] border shadow-xs animate-pulse ${
                    signalCompletionStatus.status === 'TP_HIT'
                      ? 'bg-[#00ff94]/20 border-[#00ff94]/60 text-[#00ff94]'
                      : 'bg-[#ff3b4a]/20 border-[#ff3b4a]/60 text-[#ff3b4a]'
                  }`}>
                    <span>{signalCompletionStatus.status === 'TP_HIT' ? '🎯 TP1 HIT' : '🛑 SL HIT'}</span>
                    <span>(${signalCompletionStatus.hitPrice.toFixed(activeSignal.entryPrice > 100 ? 2 : 4)})</span>
                    {signalCompletionStatus.pnlPercent !== undefined && (
                      <span>({signalCompletionStatus.pnlPercent > 0 ? '+' : ''}{signalCompletionStatus.pnlPercent}%)</span>
                    )}
                  </div>
                )}

                {!(activeSignal.isAccepted || activeSignal.isLocked) && onAcceptSignal && (
                  <button
                    onClick={() => onAcceptSignal(activeSignal)}
                    className="px-2.5 py-1 rounded bg-[#ffd87f] hover:bg-[#ffe29a] text-[#0b0e11] font-black transition-all cursor-pointer text-[10px] sm:text-[11px] flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95"
                    title="Single Click: Lock SL, TP and Entry directly onto the chart"
                  >
                    <Lock className="w-3 h-3 text-[#0b0e11]" />
                    <span>⚡ 1-Click Chart Par Lagayein</span>
                  </button>
                )}

                {onRefreshAnalysis && (
                  <button
                    onClick={onRefreshAnalysis}
                    disabled={isRefreshingAnalysis}
                    className="px-2 py-0.5 rounded bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-[#60a5fa] border border-[#3b82f6]/50 font-bold transition-all cursor-pointer text-[10px] flex items-center gap-1 shadow-xs disabled:opacity-50"
                    title="Re-run quantitative strategy calculation based on current market price"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isRefreshingAnalysis ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                )}

                {onToggleAutoRefresh && (
                  <button
                    onClick={onToggleAutoRefresh}
                    className={`px-1.5 sm:px-2 py-0.5 rounded font-bold text-[9px] sm:text-[10px] flex items-center gap-1 transition-all cursor-pointer border ${
                      autoRefreshMode && autoRefreshMode !== 'off'
                        ? 'bg-[#00ff94]/15 border-[#00ff94]/40 text-[#00ff94]'
                        : 'bg-[#272a2d] border-[#373a3e] text-[#99907f]'
                    }`}
                    title={`Auto-Refresh: ${autoRefreshMode || 'off'}. Click to toggle.`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${autoRefreshMode && autoRefreshMode !== 'off' ? 'bg-[#00ff94] animate-ping' : 'bg-[#99907f]'}`} />
                    <span>{autoRefreshMode && autoRefreshMode !== 'off' ? `Auto (${autoRefreshCountdown || 30}s)` : 'Auto: Off'}</span>
                  </button>
                )}

                {onClearSignal && (
                  <button
                    onClick={onClearSignal}
                    className="px-1.5 sm:px-2 py-0.5 rounded bg-[#ff3b4a]/20 hover:bg-[#ff3b4a]/30 text-[#ff3b4a] border border-[#ff3b4a]/40 font-bold transition-all cursor-pointer text-[9px] sm:text-[10px] flex items-center gap-1 shadow-xs"
                    title="Signal hatayein (Clear from chart)"
                  >
                    <X className="w-2.5 h-2.5" />
                    <span>Clear</span>
                  </button>
                )}

                <button
                  onClick={() => setIsAiHudCollapsed(true)}
                  className={`p-0.5 rounded cursor-pointer transition-colors ml-0.5 ${
                    isLight ? 'hover:bg-gray-100 text-[#787b86] hover:text-[#131722]' : 'hover:bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                  }`}
                  title="Minimize AI Signal HUD"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>

                <button
                  onClick={() => setShowAiLevels(false)}
                  className={`p-0.5 rounded cursor-pointer transition-colors ml-0.5 ${
                    isLight ? 'hover:bg-red-50 text-gray-400 hover:text-red-500' : 'hover:bg-red-950/40 text-[#99907f] hover:text-[#ff3b4a]'
                  }`}
                  title="Hide AI Signal Overlay"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          )
        )}

        {/* Floating Toolbar when a drawing is selected in Cursor mode */}
        {selectedDrawingId && activeTool === 'cursor' && (() => {
          const selectedD = drawings.find((d) => d.id === selectedDrawingId);
          if (!selectedD) return null;
          return (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#191c1f]/95 backdrop-blur-md border border-[#f6be16] px-3 py-1.5 rounded-xl text-xs shadow-2xl animate-fadeIn font-mono">
              <div className="flex items-center gap-1.5 font-bold text-[#f6be16]">
                <span className="w-2 h-2 rounded-full bg-[#f6be16]" />
                <span className="capitalize">{selectedD.type.replace('_', ' ')} Selected</span>
              </div>

              <div className="h-4 w-[1px] bg-[#272a2d] mx-1" />

              {/* Quick Color Dots for Selected Drawing */}
              <div className="flex items-center gap-1">
                {['#00ff94', '#f6be16', '#ff3b4a', '#38bdf8', '#c084fc', '#ffffff'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setDrawings((prev) =>
                        prev.map((item) => (item.id === selectedD.id ? { ...item, color: c } : item))
                      );
                    }}
                    className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform ${
                      selectedD.color === c ? 'scale-125 ring-2 ring-white/70' : 'hover:scale-110 opacity-70'
                    }`}
                    style={{ backgroundColor: c }}
                    title={`Change color to ${c}`}
                  />
                ))}
              </div>

              <div className="h-4 w-[1px] bg-[#272a2d] mx-1" />

              {/* Prominent Red Delete Button */}
              <button
                onClick={() => {
                  setDrawings((prev) => prev.filter((d) => d.id !== selectedD.id));
                  setSelectedDrawingId(null);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ff3b4a] hover:bg-[#ff1f32] text-white font-bold transition-all cursor-pointer shadow-md text-[11px]"
                title="Delete this drawing (or press Delete/Backspace key)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete / हटाएं</span>
              </button>

              {/* Deselect / Close Button */}
              <button
                onClick={() => setSelectedDrawingId(null)}
                className="p-1 rounded text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
                title="Deselect (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })()}

        {/* Floating Banner when Eraser tool is active */}
        {activeTool === 'eraser' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-[#191c1f]/95 backdrop-blur-md border border-[#ff3b4a]/80 px-3.5 py-1.5 rounded-xl text-xs shadow-2xl animate-fadeIn font-mono text-[#ff8892]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff3b4a] animate-ping shrink-0" />
            <span className="font-bold text-white">Eraser Active:</span>
            <span className="hidden sm:inline">Click any line or drawing on chart to remove it</span>
            <span className="sm:hidden">Tap drawing to erase</span>
            <button
              onClick={() => setActiveTool('cursor')}
              className="ml-1 px-2 py-0.5 rounded bg-[#ff3b4a] hover:bg-[#ff1f32] text-white font-bold cursor-pointer transition-colors text-[11px]"
            >
              Done ✕
            </button>
          </div>
        )}

        {/* Enhanced Interactive Floating Drawing Action Bar (When any drawing tool is active except cursor and eraser) */}
        {activeTool !== 'cursor' && activeTool !== 'eraser' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#191c1f]/95 backdrop-blur-md border border-[#00ff94]/60 px-3.5 py-1.5 rounded-xl text-xs shadow-2xl animate-fadeIn font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00ff94] animate-ping shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-bold text-[#00ff94]">
                <span className="capitalize">{activeTool.replace('_', ' ')} Mode</span>
              </div>
              <span className="text-[10px] text-[#99907f] hidden sm:inline">
                {currentDrawing
                  ? 'Click next point to complete drawing'
                  : 'Click on chart to place starting anchor'}
              </span>
            </div>

            <div className="h-5 w-[1px] bg-[#272a2d] mx-1" />

            {/* Quick Color Dots */}
            <div className="flex items-center gap-1">
              {['#00ff94', '#f6be16', '#ff3b4a', '#38bdf8', '#c084fc', '#ffffff'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrentColor(c)}
                  className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-transform ${
                    currentColor === c ? 'scale-125 ring-2 ring-white/60' : 'hover:scale-110 opacity-70'
                  }`}
                  style={{ backgroundColor: c }}
                  title={`Change color to ${c}`}
                />
              ))}
            </div>

            <div className="h-5 w-[1px] bg-[#272a2d] mx-1" />

            {/* Magnet Toggle */}
            <button
              onClick={() => setIsMagnetMode(!isMagnetMode)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                isMagnetMode
                  ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Toggle Magnet Snap Mode (snaps to candle OHLC)"
            >
              🧲 Magnet: {isMagnetMode ? 'ON' : 'OFF'}
            </button>

            {/* Cancel / Finish Tool Button */}
            <button
              onClick={() => {
                setActiveTool('cursor');
                setCurrentDrawing(null);
                setIsDrawingInProgress(false);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#ff3b4a]/20 hover:bg-[#ff3b4a]/30 text-[#ff3b4a] border border-[#ff3b4a]/40 font-bold transition-all cursor-pointer shadow-xs ml-1"
              title="Exit Drawing Tool (Esc)"
            >
              <span>Done ✕</span>
            </button>
          </div>
        )}

        {/* Bottom-Right Chart Navigation & Zoom Pill (Clean, unobtrusive corner dock that never obscures candles) */}
        {!isSplitMode && (
        <div className={`absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-20 flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg shadow-xl text-[10px] sm:text-[11px] font-mono border backdrop-blur-md ${
          isLight ? 'bg-white/95 border-[#cbd5e1] text-[#131722]' : 'bg-[#14171a]/95 border-[#272a2d] text-white'
        }`}>
          {panOffset > 0 ? (
            <button
              onClick={() => setPanOffset(0)}
              className="px-2 py-0.5 rounded font-black cursor-pointer bg-[#00ff94] text-[#0b0e11] animate-pulse shadow-xs"
              title="Return to real-time live candle"
            >
              ▶ Live ({panOffset}b)
            </button>
          ) : (
            <button
              onClick={() => {
                setPriceScaleZoom(1.0);
                setPricePanOffset(0);
                setIsAutoScale(true);
                setPanOffset(0);
                stableBoundsRef.current = null;
              }}
              className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                isAutoScale && Math.abs(priceScaleZoom - 1.0) < 0.01 && panOffset === 0
                  ? isLight ? 'text-[#089981] bg-[#089981]/15' : 'text-[#00D084] bg-[#00D084]/15'
                  : 'text-[#f6be16] hover:bg-[#272a2d]/30'
              }`}
              title="Auto-Fit Price & Reset to Live"
            >
              Auto
            </button>
          )}

          <div className={`w-[1px] h-3 ${isLight ? 'bg-[#cbd5e1]' : 'bg-[#272a2d]'}`} />

          {/* Crosshair / Pan toggle on desktop */}
          <button
            onClick={() =>
              setChartInteractionMode(
                chartInteractionMode === 'crosshair' ? 'pan' : 'crosshair'
              )
            }
            className={`hidden sm:flex p-1 rounded cursor-pointer transition-colors ${
              chartInteractionMode === 'pan'
                ? isLight ? 'bg-[#089981]/20 text-[#089981]' : 'bg-[#00D084]/20 text-[#00D084]'
                : isLight ? 'text-[#787b86] hover:text-[#131722]' : 'text-[#99907f] hover:text-white'
            }`}
            title={chartInteractionMode === 'pan' ? 'Pan Mode (Active)' : 'Switch to Pan Mode'}
          >
            {chartInteractionMode === 'pan' ? <Hand className="w-3 h-3" /> : <Crosshair className="w-3 h-3" />}
          </button>

          {/* Zoom In (Thicker Candles +) */}
          <button
            onClick={() => setVisibleCandleCount((prev) => Math.max(14, prev - 4))}
            className={`p-1 rounded cursor-pointer transition-colors ${
              isLight ? 'text-[#787b86] hover:text-[#089981] hover:bg-gray-100' : 'text-[#99907f] hover:text-[#00D084] hover:bg-[#272a2d]'
            }`}
            title="Zoom In (Thicker Candles +)"
          >
            <Plus className="w-3 h-3" />
          </button>

          {/* Zoom Out (−) */}
          <button
            onClick={() => setVisibleCandleCount((prev) => Math.min(120, prev + 6))}
            className={`p-1 rounded cursor-pointer transition-colors ${
              isLight ? 'text-[#787b86] hover:text-[#089981] hover:bg-gray-100' : 'text-[#99907f] hover:text-[#00D084] hover:bg-[#272a2d]'
            }`}
            title="Zoom Out (−)"
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Reset All View */}
          <button
            onClick={() => {
              setPanOffset(0);
              setVisibleCandleCount(typeof window !== 'undefined' && window.innerWidth < 768 ? 24 : 44);
              setPriceScaleZoom(1.0);
              setPricePanOffset(0);
              setIsAutoScale(true);
              stableBoundsRef.current = null;
            }}
            className={`p-1 rounded cursor-pointer transition-colors ${
              isLight ? 'text-[#787b86] hover:text-[#131722] hover:bg-gray-100' : 'text-[#99907f] hover:text-white hover:bg-[#272a2d]'
            }`}
            title="Reset View"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
        )}

        {/* Canvas Area with Touch, Mouse & Double-Click Listeners */}
        <div ref={canvasContainerRef} className={`flex-1 relative w-full h-full ${isSplitMode ? 'min-h-[140px]' : 'min-h-[280px] sm:min-h-[450px]'}`}>

          {/* Loading Overlay (Requirement 5) */}
          {isLoadingCandles && (
            <div className="absolute inset-0 z-40 bg-[#0e1114]/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200">
              <div className="w-10 h-10 rounded-full border-2 border-[#00ff94] border-t-transparent animate-spin mb-3 shadow-[0_0_15px_rgba(0,255,148,0.3)]" />
              <div className="text-sm font-bold font-mono text-[#fff8f1]">
                {loadingMessage || `Loading ${symbol} ${timeframe} data...`}
              </div>
              <div className="text-xs text-[#99907f] font-mono mt-1">
                Institutional Candle Verification Active
              </div>
            </div>
          )}

          {/* Error with Retry Overlay (Requirement 5) */}
          {errorMessage && (
            <div className="absolute inset-0 z-40 bg-[#0e1114]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-200">
              <AlertTriangle className="w-10 h-10 text-[#ff3b4a] mb-2" />
              <div className="text-sm font-bold font-mono text-[#fff8f1] mb-1">
                Market data load nahi hua. Retry
              </div>
              <p className="text-xs text-red-300 font-mono mb-4 max-w-sm">
                {errorMessage}
              </p>
              {onRetryLoadCandles && (
                <button
                  type="button"
                  onClick={onRetryLoadCandles}
                  className="px-4 py-2 rounded-xl bg-[#272a2d] hover:bg-[#37393d] border border-[#00ff94]/50 text-[#00ff94] font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Market data load nahi hua. Retry</span>
                </button>
              )}
            </div>
          )}

          {/* Left Edge Drawing Tools Expand Handle */}
          <button
            onClick={() => setIsDrawingToolbarOpen(!isDrawingToolbarOpen)}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 py-3 px-0.5 rounded-r border shadow-sm transition-colors cursor-pointer ${
              theme === 'light'
                ? 'bg-white border-[#e0e3eb] text-[#787b86] hover:text-[#131722]'
                : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:text-white'
            }`}
            title="Toggle Drawing Tools"
          >
            <ChevronRight className="w-3 h-3" />
          </button>

          {/* Bottom-Left TV Badge */}
          <div className="absolute bottom-2 left-3 z-10 select-none pointer-events-none">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] shadow-xs ${
              theme === 'light'
                ? 'bg-[#131722] text-white'
                : 'bg-[#272a2d] text-[#00ff94]'
            }`}>
              TV
            </div>
          </div>

          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            style={{ touchAction: 'none' }}
            className={`w-full h-full block ${
              isPriceScaleDragging || isHoveringPriceAxis
                ? 'cursor-ns-resize'
                : chartInteractionMode === 'pan' || isDragging
                ? 'cursor-grab active:cursor-grabbing'
                : 'cursor-crosshair'
            }`}
          />
          {/* Hardware-accelerated zero-lag overlay canvas for crosshairs, tooltips & hover tags */}
          <canvas
            ref={overlayCanvasRef}
            style={{ touchAction: 'none' }}
            className="absolute inset-0 w-full h-full pointer-events-none block z-[5]"
          />
        </div>
      </div>

      {/* Under-Chart Action Bar (Add TP/SL | Info | Reset | Fullscreen) */}
      {!isSplitMode && (
      <div className={`flex items-center justify-between px-3 py-1.5 border-t text-xs select-none shrink-0 ${
        theme === 'light' ? 'bg-white border-[#e0e3eb]' : 'bg-[#14171a] border-[#272a2d]'
      }`}>
        <button
          onClick={() => {
            if (onAddTpSl) {
              onAddTpSl();
            } else if (onOpenTradeModal) {
              onOpenTradeModal();
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold text-xs transition-all cursor-pointer shadow-xs ${
            theme === 'light'
              ? 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b] border border-[#cbd5e1]'
              : 'bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] border border-[#37393d]'
          }`}
        >
          <span className="text-[#2563eb] text-sm font-black">+</span>
          <span>Add TP/SL</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPriceScaleZoom(1.0);
              setPricePanOffset(0);
              setIsAutoScale(true);
              setPanOffset(0);
              stableBoundsRef.current = null;
            }}
            className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
              theme === 'light' ? 'text-[#787b86] hover:text-[#131722]' : 'text-[#99907f] hover:text-white'
            }`}
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
              theme === 'light' ? 'text-[#787b86] hover:text-[#131722]' : 'text-[#99907f] hover:text-white'
            }`}
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      )}

      {/* 3. Indicators & Strategies Modal */}
      <IndicatorsModal
        isOpen={isIndicatorsModalOpen}
        onClose={() => setIsIndicatorsModalOpen(false)}
        activeIndicators={activeIndicators}
        onToggleIndicator={handleToggleIndicator}
        onUpdateParams={handleUpdateIndicatorParams}
        onUpdateColor={handleUpdateIndicatorColor}
        onResetDefaults={handleResetDefaultIndicators}
      />
    </div>
  );
});
