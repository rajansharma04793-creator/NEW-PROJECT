import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Candle,
  AISignal,
  PriceAlert,
  DrawingElement,
  DrawingToolType,
  ActiveIndicatorState,
  ChartPoint,
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
} from '../utils/indicators';
import {
  Maximize2,
  Minimize2,
  BarChart2,
  Sparkles,
  Bell,
  Camera,
  ChevronDown,
  PenTool,
  Hand,
  Plus,
  Minus,
  RotateCcw,
  Crosshair,
  Play,
  Zap,
} from 'lucide-react';

interface CandleChartProps {
  candles: Candle[];
  currentPrice: number;
  symbol: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  activeSignal?: AISignal | null;
  alerts?: PriceAlert[];
  onOpenAlertsModal?: (prefillPrice?: number) => void;
  height?: number;
  onLoadMoreHistoricalCandles?: () => void;
  currencyMode?: 'USDT' | 'INR';
  inrPrice?: number;
}

const DEFAULT_ACTIVE_INDICATORS: ActiveIndicatorState[] = [
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
    id: 'bollinger_bands',
    indicatorId: 'bollinger_bands',
    enabled: false,
    params: { period: 20, stdDev: 2 },
    color: '#38bdf8',
    visible: true,
  },
  {
    id: 'supertrend',
    indicatorId: 'supertrend',
    enabled: false,
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
    enabled: true,
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
    id: 'smart_money_zones',
    indicatorId: 'smart_money_zones',
    enabled: false,
    params: {},
    color: '#00ff94',
    secondaryColor: '#ff3b4a',
    visible: true,
  },
];

export const CandleChart: React.FC<CandleChartProps> = ({
  candles: rawCandles,
  currentPrice: rawCurrentPrice,
  symbol,
  timeframe,
  onTimeframeChange,
  activeSignal,
  alerts = [],
  onOpenAlertsModal,
  onLoadMoreHistoricalCandles,
  currencyMode = 'USDT',
  inrPrice,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isINR = currencyMode === 'INR' && inrPrice !== undefined && inrPrice > 0;
  const inrRateMultiplier = isINR && rawCurrentPrice > 0 ? inrPrice / rawCurrentPrice : 1;
  const currentPrice = isINR ? inrPrice : rawCurrentPrice;

  // Chart Style State
  const [chartType, setChartType] = useState<
    'candles' | 'line' | 'heikin_ashi' | 'hollow' | 'bars'
  >('candles');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Viewport & Interactive Navigation State
  const [visibleCandleCount, setVisibleCandleCount] = useState<number>(45);
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

  // Reset price scaling when asset or timeframe changes
  useEffect(() => {
    setPriceScaleZoom(1.0);
    setPricePanOffset(0);
    setIsAutoScale(true);
  }, [symbol, timeframe]);

  // Indicators State
  const [activeIndicators, setActiveIndicators] = useState<ActiveIndicatorState[]>(() => {
    try {
      const saved = localStorage.getItem('lumina_chart_indicators');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ACTIVE_INDICATORS;
  });
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [showAiLevels, setShowAiLevels] = useState(true);
  const [showSMC, setShowSMC] = useState(true);
  const [showAlerts, setShowAlerts] = useState(true);

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState<DrawingToolType>('cursor');
  const [isDrawingToolbarOpen, setIsDrawingToolbarOpen] = useState(() => {
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
      last.close = currentPrice;
      last.high = Math.max(last.high, currentPrice);
      last.low = Math.min(last.low, currentPrice);
    }
    if (chartType === 'heikin_ashi') {
      return convertToHeikinAshi(list);
    }
    return list;
  }, [rawCandles, currentPrice, isINR, inrRateMultiplier, chartType]);

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
      if (ind.enabled) map.set(ind.indicatorId, ind);
    });
    return map;
  }, [activeIndicators]);

  // Technical Calculations across full history
  const ema9 = useMemo(() => (indMap.has('ema_9') ? calculateEMA(candles, 9) : []), [candles, indMap]);
  const ema21 = useMemo(() => (indMap.has('ema_21') ? calculateEMA(candles, 21) : []), [candles, indMap]);
  const ema50 = useMemo(() => (indMap.has('ema_50') ? calculateEMA(candles, 50) : []), [candles, indMap]);
  const ema200 = useMemo(() => (indMap.has('ema_200') ? calculateEMA(candles, 200) : []), [candles, indMap]);
  const sma20 = useMemo(() => (indMap.has('sma_20') ? calculateSMA(candles, 20) : []), [candles, indMap]);
  const vwap = useMemo(() => (indMap.has('vwap') ? calculateVWAP(candles) : []), [candles, indMap]);
  const supertrend = useMemo(
    () => (indMap.has('supertrend') ? calculateSupertrend(candles, 10, 3) : null),
    [candles, indMap]
  );
  const parabolicSar = useMemo(
    () => (indMap.has('parabolic_sar') ? calculateParabolicSAR(candles) : []),
    [candles, indMap]
  );
  const pivots = useMemo(
    () => (indMap.has('pivot_points') ? calculatePivotPoints(candles) : null),
    [candles, indMap]
  );
  const bollinger = useMemo(
    () => (indMap.has('bollinger_bands') ? calculateBollingerBands(candles, 20, 2) : null),
    [candles, indMap]
  );
  const keltner = useMemo(
    () => (indMap.has('keltner_channels') ? calculateKeltnerChannels(candles, 20, 2) : null),
    [candles, indMap]
  );
  const donchian = useMemo(
    () => (indMap.has('donchian_channels') ? calculateDonchianChannels(candles, 20) : null),
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
  const rsi = useMemo(() => (indMap.has('rsi_14') ? calculateRSI(candles, 14) : []), [candles, indMap]);
  const macd = useMemo(() => (indMap.has('macd') ? calculateMACD(candles) : null), [candles, indMap]);
  const stochastic = useMemo(
    () => (indMap.has('stochastic') ? calculateStochastic(candles) : null),
    [candles, indMap]
  );
  const atr = useMemo(() => (indMap.has('atr_14') ? calculateATR(candles, 14) : []), [candles, indMap]);
  const obv = useMemo(() => (indMap.has('obv') ? calculateOBV(candles) : []), [candles, indMap]);
  const cci = useMemo(() => (indMap.has('cci') ? calculateCCI(candles) : []), [candles, indMap]);
  const williamsR = useMemo(
    () => (indMap.has('williams_r') ? calculateWilliamsR(candles) : []),
    [candles, indMap]
  );

  // Determine active sub-charts
  const activeSubCharts = useMemo(() => {
    const list: string[] = [];
    if (indMap.has('rsi_14')) list.push('rsi_14');
    if (indMap.has('macd')) list.push('macd');
    if (indMap.has('stochastic')) list.push('stochastic');
    if (indMap.has('atr_14')) list.push('atr_14');
    if (indMap.has('obv')) list.push('obv');
    if (indMap.has('cci')) list.push('cci');
    if (indMap.has('williams_r')) list.push('williams_r');
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

  // Main Canvas Rendering Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || visibleCandles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight || 450;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Layout configuration
    const paddingRight = 78; // Price axis width
    const subChartHeight = 52;
    const totalSubChartHeight = activeSubCharts.length * (subChartHeight + 10);
    const paddingBottom = totalSubChartHeight + 24;
    const chartWidth = Math.max(100, width - paddingRight);
    const mainChartHeight = Math.max(160, height - paddingBottom);

    // Clear background
    ctx.fillStyle = '#111417';
    ctx.fillRect(0, 0, width, height);

    // Visible candles metrics - Calculate optimal bar width and crisp rendering
    const count = visibleCandles.length;
    const candleWidth = Math.max(3.5, (chartWidth - 20) / count);
    const candleSpacing = Math.max(1.2, Math.min(6, candleWidth * 0.22));
    const barWidth = Math.max(3, Math.round(candleWidth - candleSpacing));

    // Dynamic Price Bounds for visible view
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    visibleCandles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    // Factor in AI signals if visible in range
    if (activeSignal && showAiLevels && activeSignal.symbol === symbol) {
      if (activeSignal.target2 && activeSignal.target2 > maxPrice) maxPrice = activeSignal.target2;
      if (activeSignal.stopLoss && activeSignal.stopLoss < minPrice) minPrice = activeSignal.stopLoss;
    }

    // Factor in active price alerts
    if (showAlerts) {
      alerts
        .filter((a) => a.symbol === symbol && a.status === 'active')
        .forEach((a) => {
          if (a.targetPrice > maxPrice) maxPrice = a.targetPrice;
          if (a.targetPrice < minPrice) minPrice = a.targetPrice;
        });
    }

    // Fallback if no prices found
    if (minPrice === Infinity || maxPrice === -Infinity || minPrice === maxPrice) {
      minPrice = currentPrice * 0.98;
      maxPrice = currentPrice * 1.02;
    }

    // Apply interactive price scale zoom & vertical pan
    const baseMid = (maxPrice + minPrice) / 2;
    const baseSpan = Math.max(maxPrice - minPrice, baseMid * 0.005);
    const bufferFactor = 0.16; // 16% breathing room
    const effectiveSpan = (baseSpan * (1 + bufferFactor)) / Math.max(0.12, priceScaleZoom);
    const centerPrice = baseMid + pricePanOffset;

    const yMin = centerPrice - effectiveSpan / 2;
    const yMax = centerPrice + effectiveSpan / 2;
    const priceRange = Math.max(yMax - yMin, 0.000001);

    const getPriceY = (price: number) => {
      return mainChartHeight - ((price - yMin) / priceRange) * (mainChartHeight - 20) - 10;
    };

    const getIndexX = (localIndex: number) => {
      return 10 + localIndex * candleWidth + candleWidth / 2;
    };

    const getPointX = (pt: ChartPoint) => {
      let gIdx = pt.candleIndex;
      if (pt.time) {
        const found = candles.findIndex((c) => Math.abs(c.time - pt.time) < 1000);
        if (found !== -1) gIdx = found;
      }
      const localIdx = gIdx - startIdx;
      return getIndexX(localIdx);
    };

    // Draw Right Price Axis Column Background & Border
    ctx.fillStyle = isPriceScaleDragging
      ? '#171b20'
      : isHoveringPriceAxis
      ? '#15181c'
      : '#121518';
    ctx.fillRect(chartWidth, 0, paddingRight, height);

    ctx.strokeStyle = isPriceScaleDragging
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
    ctx.strokeStyle = '#1d2023';
    ctx.lineWidth = 1;
    ctx.fillStyle = isHoveringPriceAxis || isPriceScaleDragging ? '#e1ded8' : '#99907f';
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
      ctx.fillStyle = '#22262b';
      ctx.fillRect(chartWidth + 6, autoY, paddingRight - 12, 16);
      ctx.strokeStyle = '#00ff94';
      ctx.lineWidth = 1;
      ctx.strokeRect(chartWidth + 6, autoY, paddingRight - 12, 16);
      ctx.fillStyle = '#00ff94';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AUTO ↺', chartWidth + (paddingRight / 2), autoY + 11.5);
    }

    // Draw Vertical Time Grid Lines & Bottom Time Labels
    const timeStep = Math.max(1, Math.floor(visibleCandles.length / 7));
    ctx.strokeStyle = '#181b1e';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#99907f';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    for (let i = 0; i < visibleCandles.length; i += timeStep) {
      const c = visibleCandles[i];
      if (!c) continue;
      const x = getIndexX(i);

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mainChartHeight);
      ctx.stroke();

      ctx.fillText(formatTimeLabel(c.time), x, mainChartHeight + 14);
    }

    // Draw Volume Bars
    if (indMap.has('volume_bars')) {
      const volumeAreaHeight = mainChartHeight * 0.22;
      visibleCandles.forEach((c, i) => {
        const x = getIndexX(i);
        const volHeight = (c.volume / (maxVolume || 1)) * volumeAreaHeight;
        const y = mainChartHeight - volHeight;

        ctx.fillStyle =
          c.close >= c.open ? 'rgba(0, 255, 148, 0.18)' : 'rgba(255, 59, 74, 0.18)';
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
        const color = isUp ? '#00ff94' : '#ff3b4a';

        const yOpen = getPriceY(c.open);
        const yClose = getPriceY(c.close);
        const yHigh = getPriceY(c.high);
        const yLow = getPriceY(c.low);

        // Wick - Clean centered stroke
        ctx.strokeStyle = color;
        ctx.lineWidth = candleWidth > 12 ? 1.8 : candleWidth > 7 ? 1.4 : 1.1;
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
          ctx.fillStyle = '#111417';
          ctx.fillRect(bodyX, topY, barWidth, bodyHeight);
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.6;
          ctx.strokeRect(bodyX, topY, barWidth, bodyHeight);
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(bodyX, topY, barWidth, bodyHeight);
          if (candleWidth > 6) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.strokeRect(bodyX, topY, barWidth, bodyHeight);
          }
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
    drawIndicatorLine(ema9, '#f6be16', 1.4);
    drawIndicatorLine(ema21, '#38bdf8', 1.4);
    drawIndicatorLine(ema50, '#a855f7', 1.4);
    drawIndicatorLine(ema200, '#f43f5e', 1.6);
    drawIndicatorLine(sma20, '#e2e8f0', 1.2);
    drawIndicatorLine(vwap, '#fb923c', 1.5);

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

    // Draw AI Signal Levels (TP1, TP2, Stop Loss)
    if (activeSignal && showAiLevels && activeSignal.symbol === symbol) {
      const isBuy = activeSignal.side === 'LONG';

      // Entry line
      const entryY = getPriceY(activeSignal.entryPrice);
      ctx.strokeStyle = isBuy ? '#00ff94' : '#ff3b4a';
      ctx.setLineDash([6, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(chartWidth, entryY);
      ctx.stroke();

      ctx.fillStyle = isBuy ? '#00ff94' : '#ff3b4a';
      ctx.fillRect(chartWidth + 2, entryY - 8, paddingRight - 4, 16);
      ctx.fillStyle = '#002111';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(
        `AI $${activeSignal.entryPrice.toFixed(activeSignal.entryPrice > 100 ? 1 : 3)}`,
        chartWidth + 5,
        entryY + 4
      );

      // Target 1
      const t1Y = getPriceY(activeSignal.target1);
      ctx.strokeStyle = '#00ff94';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, t1Y);
      ctx.lineTo(chartWidth, t1Y);
      ctx.stroke();

      ctx.fillStyle = '#00ff94';
      ctx.fillRect(chartWidth + 2, t1Y - 8, paddingRight - 4, 16);
      ctx.fillStyle = '#002111';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(
        `TP1 $${activeSignal.target1.toFixed(activeSignal.target1 > 100 ? 1 : 3)}`,
        chartWidth + 5,
        t1Y + 4
      );

      // Target 2
      if (activeSignal.target2) {
        const t2Y = getPriceY(activeSignal.target2);
        ctx.strokeStyle = '#40e397';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, t2Y);
        ctx.lineTo(chartWidth, t2Y);
        ctx.stroke();

        ctx.fillStyle = '#40e397';
        ctx.fillRect(chartWidth + 2, t2Y - 8, paddingRight - 4, 16);
        ctx.fillStyle = '#002111';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillText(
          `TP2 $${activeSignal.target2.toFixed(activeSignal.target2 > 100 ? 1 : 3)}`,
          chartWidth + 5,
          t2Y + 4
        );
      }

      // Stop Loss
      const slY = getPriceY(activeSignal.stopLoss);
      ctx.strokeStyle = '#ff3b4a';
      ctx.setLineDash([5, 3]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, slY);
      ctx.lineTo(chartWidth, slY);
      ctx.stroke();

      ctx.fillStyle = '#ff3b4a';
      ctx.fillRect(chartWidth + 2, slY - 8, paddingRight - 4, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(
        `SL $${activeSignal.stopLoss.toFixed(activeSignal.stopLoss > 100 ? 1 : 3)}`,
        chartWidth + 5,
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

    // Current Price Indicator Line & Pulsing Badge
    const curY = getPriceY(currentPrice);
    ctx.strokeStyle = '#00ff94';
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, curY);
    ctx.lineTo(chartWidth, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price Bubble on Axis
    ctx.fillStyle = '#00c77e';
    ctx.fillRect(chartWidth + 2, curY - 9, paddingRight - 4, 18);
    ctx.fillStyle = '#002111';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(currentPrice.toFixed(currentPrice > 100 ? 2 : 4), chartWidth + 6, curY + 4);

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
            break;
          }

          case 'vertical_line': {
            ctx.beginPath();
            ctx.moveTo(x1, 0);
            ctx.lineTo(x1, mainChartHeight);
            ctx.stroke();
            break;
          }

          case 'rectangle': {
            const rx = Math.min(x1, x2);
            const ry = Math.min(y1, y2);
            const rw = Math.abs(x2 - x1);
            const rh = Math.abs(y2 - y1);
            ctx.fillStyle = `${d.color}22`;
            ctx.fillRect(rx, ry, rw, rh);
            ctx.strokeRect(rx, ry, rw, rh);
            break;
          }

          case 'fib_retracement': {
            const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
            const pDiff = p2.price - p1.price;
            levels.forEach((lvl) => {
              const fibPrice = p1.price + pDiff * lvl;
              const fibY = getPriceY(fibPrice);

              ctx.strokeStyle = d.color;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(x1, fibY);
              ctx.lineTo(Math.max(x2, chartWidth), fibY);
              ctx.stroke();

              ctx.fillStyle = d.color;
              ctx.font = '9px "JetBrains Mono", monospace';
              ctx.fillText(`${lvl} ($${fibPrice.toFixed(2)})`, x1 + 4, fibY - 3);
            });
            break;
          }

          case 'long_position': {
            // Risk-Reward Box
            const stopY = y2;
            const targetPrice = p1.price + Math.abs(p1.price - p2.price) * 2;
            const targetY = getPriceY(targetPrice);

            // Profit Zone
            ctx.fillStyle = 'rgba(0, 255, 148, 0.15)';
            ctx.fillRect(x1, Math.min(y1, targetY), Math.max(80, x2 - x1), Math.abs(targetY - y1));
            // Loss Zone
            ctx.fillStyle = 'rgba(255, 59, 74, 0.15)';
            ctx.fillRect(x1, Math.min(y1, stopY), Math.max(80, x2 - x1), Math.abs(stopY - y1));

            ctx.fillStyle = '#00ff94';
            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.fillText(`Target (2:1)`, x1 + 4, targetY + 12);
            break;
          }

          case 'text': {
            ctx.fillStyle = d.color;
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.fillText(d.text || 'Note', x1 + 4, y1);
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
        ctx.setLineDash([]);
      };

      drawings.forEach(renderDrawing);
      if (currentDrawing) renderDrawing(currentDrawing);
    }

    // ==========================================
    // SUB-CHARTS (RSI, MACD, STOCH, ATR, OBV)
    // ==========================================
    let currentSubChartTop = mainChartHeight + 24;

    activeSubCharts.forEach((subType) => {
      // Subchart border & background
      ctx.fillStyle = '#0c0e11';
      ctx.fillRect(0, currentSubChartTop, chartWidth, subChartHeight);
      ctx.strokeStyle = '#272a2d';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, currentSubChartTop, chartWidth, subChartHeight);

      if (subType === 'rsi_14') {
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

      currentSubChartTop += subChartHeight + 10;
    });

    // Crosshair & Tooltip Overlay
    if (mousePos && mousePos.x < chartWidth && mousePos.y < height) {
      const localIdx = Math.min(
        visibleCandles.length - 1,
        Math.max(0, Math.floor((mousePos.x - 10) / candleWidth))
      );
      const candleX = getIndexX(localIdx);
      const activeC = visibleCandles[localIdx];

      // Vertical line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(candleX, 0);
      ctx.lineTo(candleX, height);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(chartWidth, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Time tag on bottom
      if (activeC) {
        const timeStr = formatTimeLabel(activeC.time);
        const tagW = Math.max(70, timeStr.length * 7 + 12);
        ctx.fillStyle = '#272a2d';
        ctx.fillRect(candleX - tagW / 2, mainChartHeight + 2, tagW, 16);
        ctx.strokeStyle = '#f6be16';
        ctx.lineWidth = 1;
        ctx.strokeRect(candleX - tagW / 2, mainChartHeight + 2, tagW, 16);

        ctx.fillStyle = '#ffd87f';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, candleX, mainChartHeight + 13);
      }

      // Price tag on right price axis
      if (mousePos.y <= mainChartHeight) {
        const mousePrice =
          yMax - ((mousePos.y - 10) / (mainChartHeight - 20)) * priceRange;
        ctx.fillStyle = '#f6be16';
        ctx.fillRect(chartWidth + 2, mousePos.y - 8, paddingRight - 4, 16);
        ctx.fillStyle = '#0b0e11';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
          mousePrice.toFixed(mousePrice > 100 ? 2 : 4),
          chartWidth + 6,
          mousePos.y + 4
        );
      }
    }
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
    ema9,
    ema21,
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
    mousePos,
    formatTimeLabel,
    priceScaleZoom,
    pricePanOffset,
    isPriceScaleDragging,
    isHoveringPriceAxis,
    isAutoScale,
  ]);

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

      const localIdx = Math.min(count - 1, Math.max(0, Math.floor((x - 10) / candleWidth)));
      const globalIdx = Math.min(candles.length - 1, Math.max(0, startIdx + localIdx));
      const c = candles[globalIdx];
      if (!c) return null;

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

      // Magnet Mode: Snap to candle High / Low / Close / Open
      if (isMagnetMode && c) {
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
      }

      return {
        candleIndex: globalIdx,
        time: c.time,
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
        return;
      }

      setIsPriceScaleDragging(true);
      setPriceDragStartY(e.clientY);
      setPriceDragStartZoom(priceScaleZoom);
      setPriceDragStartPan(pricePanOffset);
      setIsAutoScale(false);
      return;
    }

    // 2. If chart pan mode or right mouse / middle click or dragging with cursor
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

    if (activeTool === 'horizontal_line') {
      const newD: DrawingElement = {
        id: `d_${Date.now()}`,
        type: 'horizontal_line',
        points: [point],
        color: currentColor,
        lineWidth: currentLineWidth,
        lineStyle: currentLineStyle,
        symbol,
      };
      setDrawings((prev) => [...prev, newD]);
      return;
    }

    if (activeTool === 'vertical_line') {
      const newD: DrawingElement = {
        id: `d_${Date.now()}`,
        type: 'vertical_line',
        points: [point],
        color: currentColor,
        lineWidth: currentLineWidth,
        lineStyle: currentLineStyle,
        symbol,
      };
      setDrawings((prev) => [...prev, newD]);
      return;
    }

    if (activeTool === 'text') {
      const text = window.prompt('Enter chart annotation text:', 'Key Level');
      if (text) {
        const newD: DrawingElement = {
          id: `d_${Date.now()}`,
          type: 'text',
          points: [point],
          color: currentColor,
          lineWidth: currentLineWidth,
          lineStyle: currentLineStyle,
          text,
          symbol,
        };
        setDrawings((prev) => [...prev, newD]);
      }
      return;
    }

    if (!isDrawingInProgress) {
      setIsDrawingInProgress(true);
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
        const updated = {
          ...currentDrawing,
          points: [...currentDrawing.points, point],
        };
        setDrawings((prev) => [...prev, updated]);
      }
      setCurrentDrawing(null);
      setIsDrawingInProgress(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const chartWidth = rect.width - 78;
    const totalSubChartHeight = activeSubCharts.length * 62;
    const mainChartHeight = Math.max(160, rect.height - totalSubChartHeight - 24);
    const isOverPrice = x >= chartWidth;
    setIsHoveringPriceAxis(isOverPrice);

    // 1. Handling Smooth Vertical Drag on the Price Bar
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

    const visibleCount = visibleCandles.length || 1;
    const candleWidth = Math.max(3.5, (chartWidth - 20) / visibleCount);
    const localIdx = Math.min(visibleCount - 1, Math.max(0, Math.floor((x - 10) / candleWidth)));
    setHoveredCandle(visibleCandles[localIdx] || null);

    // 2. Handling Full 2D Chart Panning (Horizontal Time + Vertical Price)
    if (isDragging) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;

      // Horizontal time pan
      const barsDelta = Math.round(dx / candleWidth);
      const nextOffset = Math.max(0, Math.min(candles.length - 12, dragStartPanOffset + barsDelta));
      setPanOffset(nextOffset);

      if (nextOffset + visibleCandleCount >= candles.length - 15) {
        onLoadMoreHistoricalCandles?.();
      }

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

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsPriceScaleDragging(false);
    if (isDrawingInProgress && currentDrawing?.type === 'brush') {
      setDrawings((prev) => [...prev, currentDrawing]);
      setCurrentDrawing(null);
      setIsDrawingInProgress(false);
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    setHoveredCandle(null);
    setIsDragging(false);
    setIsPriceScaleDragging(false);
    setIsHoveringPriceAxis(false);
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
    }
  };

  // Touch handlers for Mobile / Tablet support
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const chartWidth = rect.width - 78;

      if (x >= chartWidth) {
        setIsPriceScaleDragging(true);
        setPriceDragStartY(touch.clientY);
        setPriceDragStartZoom(priceScaleZoom);
        setPriceDragStartPan(pricePanOffset);
        setIsAutoScale(false);
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

        if (nextOffset + visibleCandleCount >= candles.length - 15) {
          onLoadMoreHistoricalCandles?.();
        }

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

        if (nextOffset + visibleCandleCount >= candles.length - 15) {
          onLoadMoreHistoricalCandles?.();
        }

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
    onLoadMoreHistoricalCandles,
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
      setPanOffset((prev) => {
        const next = Math.max(0, Math.min(candles.length - 12, prev + delta));
        if (next + visibleCandleCount >= candles.length - 15) {
          onLoadMoreHistoricalCandles?.();
        }
        return next;
      });
    } else {
      // Smooth Horizontal Zoom in / out
      const zoomStep = e.deltaY < 0 ? -4 : 4;
      setVisibleCandleCount((prev) => Math.max(14, Math.min(250, prev + zoomStep)));
    }
  };

  // Indicator Handlers
  const handleToggleIndicator = (id: string) => {
    setActiveIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, enabled: !ind.enabled } : ind))
    );
  };

  const handleUpdateIndicatorParams = (id: string, params: Record<string, any>) => {
    setActiveIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, params: { ...ind.params, ...params } } : ind))
    );
  };

  const handleUpdateIndicatorColor = (id: string, color: string) => {
    setActiveIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, color } : ind))
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
      className={`w-full h-full bg-[#111417] flex flex-col font-mono select-none ${
        isFullscreen ? 'fixed inset-0 z-50 p-3' : 'relative'
      }`}
    >
      {/* 1. TOP TRADINGVIEW TOOLBAR */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#191c1f] border-b border-[#272a2d] text-xs overflow-x-auto no-scrollbar gap-2">
        {/* Left: Timeframe Selectors, Chart Type Dropdown, Drawing Toolbar Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Drawing Tools Toggle */}
          <button
            onClick={() => setIsDrawingToolbarOpen(!isDrawingToolbarOpen)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
              isDrawingToolbarOpen
                ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                : 'bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1]'
            }`}
            title="Toggle Drawing & Annotation Tools Toolbar"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tools</span>
          </button>

          <div className="w-[1px] h-3.5 bg-[#272a2d] mx-0.5" />

          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                timeframe === tf
                  ? 'bg-[#f6be16] text-[#0b0e11]'
                  : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d]'
              }`}
            >
              {tf}
            </button>
          ))}

          <div className="w-[1px] h-3.5 bg-[#272a2d] mx-0.5" />

          {/* Chart Type Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsChartTypeDropdownOpen(!isChartTypeDropdownOpen)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#e1e2e7] text-[11px] font-bold transition-colors cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#00ff94]" />
              <span className="capitalize">{chartType.replace('_', ' ')}</span>
              <ChevronDown className="w-3 h-3 text-[#99907f]" />
            </button>

            {isChartTypeDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-40 bg-[#191c1f] border border-[#272a2d] rounded-lg shadow-2xl p-1 z-50 flex flex-col gap-0.5">
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
                    className={`text-left px-2 py-1.5 rounded text-xs transition-colors cursor-pointer ${
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
        </div>

        {/* Right: Technical Indicators, AI Levels, Alerts & Fullscreen */}
        <div className="flex items-center gap-1.5 text-[11px] shrink-0">
          {/* fx Indicators Dialog Button */}
          <button
            id="chart-indicators-modal-btn"
            onClick={() => setIsIndicatorsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#ffd87f] border border-[#37393d] font-bold transition-colors cursor-pointer shadow-xs"
            title="Open Indicators & Strategies Library (fx)"
          >
            <span className="text-[#f6be16] font-extrabold text-xs">fx</span>
            <span>Indicators</span>
            <span className="text-[10px] px-1 bg-[#ffd87f]/20 text-[#ffd87f] rounded-full">
              {activeIndicators.filter((i) => i.enabled).length}
            </span>
          </button>

          {/* AI Levels Overlay */}
          {activeSignal && activeSignal.symbol === symbol && (
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

      {/* 2. MAIN WORKSPACE: LEFT DRAWING TOOLBAR + CANVAS */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Drawing Toolbar - Collapsible on Mobile */}
        {isDrawingToolbarOpen && (
          <div className="shrink-0 z-20">
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
              onUndo={handleUndo}
              onClearAll={handleClearAll}
            />
          </div>
        )}

        {/* OHLC HUD Readout - Mobile friendly */}
        {activeDisplayCandle && (() => {
          const dispPrecision = currentPrice < 0.001 ? 8 : currentPrice < 0.1 ? 6 : currentPrice < 2 ? 4 : currentPrice < 100 ? 3 : 2;
          return (
            <div className="absolute top-1.5 left-2 sm:left-4 z-10 flex flex-wrap items-center gap-1.5 sm:gap-3 text-[10px] sm:text-[11px] font-mono pointer-events-none bg-[#111417]/90 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded border border-[#272a2d]/80 shadow-lg max-w-[92%] sm:max-w-none">
              <span className="text-[#f6be16] font-bold">{symbol}</span>
              <span className="text-[#99907f]">
                O: <span className="text-[#e1e2e7]">{activeDisplayCandle.open.toFixed(dispPrecision)}</span>
              </span>
              <span className="text-[#99907f]">
                H: <span className="text-[#00ff94]">{activeDisplayCandle.high.toFixed(dispPrecision)}</span>
              </span>
              <span className="text-[#99907f]">
                L: <span className="text-[#ff3b4a]">{activeDisplayCandle.low.toFixed(dispPrecision)}</span>
              </span>
              <span className="text-[#99907f]">
                C:{' '}
                <span
                  className={
                    activeDisplayCandle.close >= activeDisplayCandle.open
                      ? 'text-[#00ff94]'
                      : 'text-[#ff3b4a]'
                  }
                >
                  {activeDisplayCandle.close.toFixed(dispPrecision)}
                </span>
              </span>
              <span className="hidden sm:inline text-[#99907f]">
                Vol: <span className="text-[#ffd87f]">{activeDisplayCandle.volume.toLocaleString()}</span>
              </span>
            </div>
          );
        })()}

        {/* Active Tool Floating Helper Pill */}
        {activeTool !== 'cursor' && (
          <div className="absolute top-2 right-12 sm:right-24 z-10 bg-[#191c1f]/95 backdrop-blur-md border border-[#00ff94]/40 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs flex items-center gap-1.5 text-[#00ff94] font-bold shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#00ff94] animate-pulse" />
            <span className="capitalize text-[11px] sm:text-xs">{activeTool.replace('_', ' ')}</span>
            <button
              onClick={() => setActiveTool('cursor')}
              className="text-[#99907f] hover:text-[#fff8f1] ml-1 text-xs cursor-pointer p-0.5"
              title="Cancel Tool"
            >
              ✕
            </button>
          </div>
        )}

        {/* Floating Return-to-Live Feed Pill when panned into historical data */}
        {panOffset > 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#191c1f]/95 border border-[#00ff94]/60 px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#f6be16] animate-ping" />
            <span className="text-xs text-[#ffd87f] font-mono font-bold">
              ◀ History Mode ({panOffset} bars back)
            </span>
            <button
              onClick={() => setPanOffset(0)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00ff94] text-[#0b0e11] text-xs font-black font-mono hover:bg-[#00ff94]/90 transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95"
              title="Return to real-time live ticker feed"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Live ▶</span>
            </button>
          </div>
        )}

        {/* Bottom-Right Quick Navigation & Zoom Dock (Visible on Mobile & Desktop) */}
        <div className="absolute bottom-6 right-2 sm:right-22 z-20 flex items-center gap-1 bg-[#191c1f]/95 border border-[#272a2d] p-1 rounded-lg shadow-2xl backdrop-blur-md text-xs font-mono">
          {/* Pan / Crosshair Toggle */}
          <button
            onClick={() =>
              setChartInteractionMode(
                chartInteractionMode === 'crosshair' ? 'pan' : 'crosshair'
              )
            }
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              chartInteractionMode === 'pan'
                ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d]'
            }`}
            title={
              chartInteractionMode === 'pan'
                ? 'Pan Mode (Drag in 2D anywhere on chart)'
                : 'Crosshair Mode'
            }
          >
            {chartInteractionMode === 'pan' ? (
              <Hand className="w-3.5 h-3.5" />
            ) : (
              <Crosshair className="w-3.5 h-3.5" />
            )}
          </button>

          <div className="w-[1px] h-3 bg-[#272a2d]" />

          {/* Directional Step Pan Left & Right */}
          <button
            onClick={() => {
              setPanOffset((prev) => {
                const next = Math.min(candles.length - 12, prev + 8);
                if (next + visibleCandleCount >= candles.length - 15) {
                  onLoadMoreHistoricalCandles?.();
                }
                return next;
              });
            }}
            className="p-1 text-[#99907f] hover:text-[#00ff94] hover:bg-[#272a2d] rounded cursor-pointer text-[11px] font-bold"
            title="Pan Left (View Past History ◀)"
          >
            ◀
          </button>
          <button
            onClick={() => setPanOffset((prev) => Math.max(0, prev - 8))}
            className="p-1 text-[#99907f] hover:text-[#00ff94] hover:bg-[#272a2d] rounded cursor-pointer text-[11px] font-bold"
            title="Pan Right (View Recent / Live ▶)"
          >
            ▶
          </button>

          {/* Directional Step Pan Up & Down */}
          <button
            onClick={() => {
              let minPrice = Infinity;
              let maxPrice = -Infinity;
              visibleCandles.forEach((c) => {
                if (c.low < minPrice) minPrice = c.low;
                if (c.high > maxPrice) maxPrice = c.high;
              });
              const baseSpan = Math.max(maxPrice - minPrice, currentPrice * 0.01);
              setPricePanOffset((prev) => prev - baseSpan * 0.12);
              setIsAutoScale(false);
            }}
            className="hidden xs:inline-block p-1 text-[#99907f] hover:text-[#00ff94] hover:bg-[#272a2d] rounded cursor-pointer text-[11px] font-bold"
            title="Pan Price Down (▼)"
          >
            ▼
          </button>
          <button
            onClick={() => {
              let minPrice = Infinity;
              let maxPrice = -Infinity;
              visibleCandles.forEach((c) => {
                if (c.low < minPrice) minPrice = c.low;
                if (c.high > maxPrice) maxPrice = c.high;
              });
              const baseSpan = Math.max(maxPrice - minPrice, currentPrice * 0.01);
              setPricePanOffset((prev) => prev + baseSpan * 0.12);
              setIsAutoScale(false);
            }}
            className="hidden xs:inline-block p-1 text-[#99907f] hover:text-[#00ff94] hover:bg-[#272a2d] rounded cursor-pointer text-[11px] font-bold"
            title="Pan Price Up (▲)"
          >
            ▲
          </button>

          <div className="w-[1px] h-3 bg-[#272a2d]" />

          {/* Time Zoom In (Thicker Candles) */}
          <button
            onClick={() => setVisibleCandleCount((prev) => Math.max(14, prev - 8))}
            className="p-1.5 text-[#99907f] hover:text-[#00ff94] rounded hover:bg-[#272a2d] cursor-pointer"
            title="Zoom In (Thicker Candles +)"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Time Zoom Out */}
          <button
            onClick={() => {
              setVisibleCandleCount((prev) => {
                const next = Math.min(250, prev + 8);
                if (next + panOffset >= candles.length - 15) {
                  onLoadMoreHistoricalCandles?.();
                }
                return next;
              });
            }}
            className="p-1.5 text-[#99907f] hover:text-[#00ff94] rounded hover:bg-[#272a2d] cursor-pointer"
            title="Zoom Out (−)"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Auto-Fit Price Scale */}
          <button
            onClick={() => {
              setPriceScaleZoom(1.0);
              setPricePanOffset(0);
              setIsAutoScale(true);
            }}
            className={`px-1.5 py-0.5 text-[10px] rounded cursor-pointer font-bold transition-colors ${
              isAutoScale && Math.abs(priceScaleZoom - 1.0) < 0.01 && Math.abs(pricePanOffset) < 0.0001
                ? 'text-[#00ff94] bg-[#00ff94]/15'
                : 'text-[#f6be16] hover:bg-[#272a2d] animate-pulse'
            }`}
            title="Auto-Fit Price Scale (Double-click price axis to reset)"
          >
            Auto
          </button>

          {/* Reset All View */}
          <button
            onClick={() => {
              setPanOffset(0);
              setVisibleCandleCount(45);
              setPriceScaleZoom(1.0);
              setPricePanOffset(0);
              setIsAutoScale(true);
            }}
            className="p-1.5 text-[#99907f] hover:text-[#fff8f1] rounded hover:bg-[#272a2d] cursor-pointer"
            title="Reset All View (Live, Thick Candles, Auto Price)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="hidden sm:block w-[1px] h-3 bg-[#272a2d]" />

          {/* Candle Thickness / Density Presets */}
          <div className="hidden sm:flex items-center gap-0.5">
            {[
              { label: 'Thick', count: 30 },
              { label: 'Normal', count: 45 },
              { label: 'Dense', count: 85 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setVisibleCandleCount(preset.count);
                  if (preset.count > candles.length - 15) {
                    onLoadMoreHistoricalCandles?.();
                  }
                }}
                className={`px-1.5 py-0.5 text-[10px] rounded cursor-pointer font-bold transition-colors ${
                  visibleCandleCount === preset.count
                    ? 'text-[#00ff94] bg-[#00ff94]/15'
                    : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Area with Touch, Mouse & Double-Click Listeners */}
        <div className="flex-1 relative w-full h-full min-h-[300px]">
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
        </div>
      </div>

      {/* 3. Indicators & Strategies Modal */}
      <IndicatorsModal
        isOpen={isIndicatorsModalOpen}
        onClose={() => setIsIndicatorsModalOpen(false)}
        activeIndicators={activeIndicators}
        onToggleIndicator={handleToggleIndicator}
        onUpdateParams={handleUpdateIndicatorParams}
        onUpdateColor={handleUpdateIndicatorColor}
      />
    </div>
  );
};
