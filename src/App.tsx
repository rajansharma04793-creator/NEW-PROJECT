import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  AutoAlertConfig,
  ProductTradingMode,
  OrderReviewPayload,
} from './types';
import {
  INITIAL_TICKERS,
  generateSyntheticCandles,
  generateEarlierCandles,
  INITIAL_AI_SIGNALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PRICE_ALERTS,
  ALL_COINS_METADATA,
  INITIAL_ORDER_HISTORY,
} from './data/marketData';
import { fetchCoinDCXCandles, fetchCoinDCXOrderBook, resetAllApiMarketData } from './services/coindcxService';
import { computeClientSignal } from './services/aiSignalService';
import { HeroScreen } from './components/HeroScreen';
import { TradingTerminal } from './components/TradingTerminal';
import { AutoAlertPopupBanner } from './components/AutoAlertPopupBanner';
import { useTickerFeed } from './hooks/useTickerFeed';
import { useVisibilityPolling } from './hooks/useVisibilityPolling';

// Dynamically imported components to prevent main bundle bloat (M-03)
const MarketOverviewDashboard = React.lazy(() =>
  import('./components/MarketOverviewDashboard').then((m) => ({ default: m.MarketOverviewDashboard }))
);
const PipCalculatorModal = React.lazy(() =>
  import('./components/PipCalculatorModal').then((m) => ({ default: m.PipCalculatorModal }))
);
const ApiConfigModal = React.lazy(() =>
  import('./components/ApiConfigModal').then((m) => ({ default: m.ApiConfigModal }))
);
const EconomicCalendarModal = React.lazy(() =>
  import('./components/EconomicCalendarModal').then((m) => ({ default: m.EconomicCalendarModal }))
);
const AiCopilotDrawer = React.lazy(() =>
  import('./components/AiCopilotDrawer').then((m) => ({ default: m.AiCopilotDrawer }))
);
const NotificationDrawer = React.lazy(() =>
  import('./components/NotificationDrawer').then((m) => ({ default: m.NotificationDrawer }))
);
const PortfolioModal = React.lazy(() =>
  import('./components/PortfolioModal').then((m) => ({ default: m.PortfolioModal }))
);
const PriceAlertModal = React.lazy(() =>
  import('./components/PriceAlertModal').then((m) => ({ default: m.PriceAlertModal }))
);
const AutoAlertScannerModal = React.lazy(() =>
  import('./components/AutoAlertScannerModal').then((m) => ({ default: m.AutoAlertScannerModal }))
);
const MobileAppInstallModal = React.lazy(() =>
  import('./components/MobileAppInstallModal').then((m) => ({ default: m.MobileAppInstallModal }))
);
const OrderReviewModal = React.lazy(() =>
  import('./components/OrderReviewModal').then((m) => ({ default: m.OrderReviewModal }))
);
import { playAlertChime, playSignalAlertSound, speakSignalAlert, playProfitHitChime } from './utils/soundEffects';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // App View Mode ('hero', 'terminal', or 'overview')
  const [currentView, setCurrentView] = useState<'hero' | 'terminal' | 'overview'>(() => {
    try {
      const saved = localStorage.getItem('lumina_current_view');
      if (saved === 'hero' || saved === 'terminal' || saved === 'overview') {
        return saved;
      }
    } catch {}
    return 'terminal';
  });
  const [currencyMode, setCurrencyMode] = useState<'USDT' | 'INR'>('USDT');

  // Hardened Platform Mode Architecture: RESEARCH | PAPER | LIVE
  const [currentMode, setCurrentMode] = useState<ProductTradingMode>(() => {
    try {
      const saved = localStorage.getItem('obsidian_product_mode');
      if (saved === 'RESEARCH' || saved === 'PAPER' || saved === 'LIVE') {
        return saved as ProductTradingMode;
      }
    } catch {}
    return 'PAPER';
  });

  const handleModeChange = useCallback((mode: ProductTradingMode) => {
    setCurrentMode(mode);
    try {
      localStorage.setItem('obsidian_product_mode', mode);
    } catch {}
  }, []);

  // Deliberate Pre-Trade Review State & Modal Control
  const [reviewOrderPayload, setReviewOrderPayload] = useState<OrderReviewPayload | null>(null);
  const [isOrderReviewOpen, setIsOrderReviewOpen] = useState<boolean>(false);

  const handleRequestReviewOrder = useCallback((payload: OrderReviewPayload) => {
    setReviewOrderPayload(payload);
    setIsOrderReviewOpen(true);
  }, []);

  // Active Trading Pair
  const [currentPair, setCurrentPair] = useState<AssetPair>('ETH/USDT');
  const [timeframe, setTimeframe] = useState<string>('15m');

  // Market Data State
  const [tickers, setTickers] = useState<Record<AssetPair, TickerInfo>>(INITIAL_TICKERS);
  const [candles, setCandles] = useState<Candle[]>(() =>
    generateSyntheticCandles(INITIAL_TICKERS['BTC/USDT'].price, 80, '15m')
  );
  const [lastTradeSide, setLastTradeSide] = useState<'buy' | 'sell'>('buy');
  const [recentTrades, setRecentTrades] = useState<MarketTrade[]>([]);
  const [sentimentPercent, setSentimentPercent] = useState<number>(88);
  const [liveOrderBook, setLiveOrderBook] = useState<{ bids: OrderBookItem[]; asks: OrderBookItem[] } | null>(null);

  // Price Alert System State
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('lumina_price_alerts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PRICE_ALERTS;
  });
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [alertPrefillSymbol, setAlertPrefillSymbol] = useState<AssetPair | undefined>(undefined);
  const [alertPrefillPrice, setAlertPrefillPrice] = useState<number | undefined>(undefined);
  const previousPricesRef = React.useRef<Record<string, number>>({});

  // CoinDCX live connection state
  const [coindcxLatency, setCoindcxLatency] = useState<number>(16);
  const [isCoinDCXLive, setIsCoinDCXLive] = useState<boolean>(true);
  const [isResettingPrices, setIsResettingPrices] = useState<boolean>(false);

  // User Portfolio & Trading State
  const [balance, setBalance] = useState<number>(100000);
  const [positions, setPositions] = useState<Position[]>([]);
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [orderHistory, setOrderHistory] = useState<Order[]>(INITIAL_ORDER_HISTORY);
  const [aiSignals, setAiSignals] = useState<AISignal[]>(INITIAL_AI_SIGNALS);
  const [selectedSignal, setSelectedSignal] = useState<AISignal | null>(INITIAL_AI_SIGNALS[0] || null);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

  // Synchronized state refs for stable asynchronous operations & timer ticks
  const tickersRef = useRef<Record<AssetPair, TickerInfo>>(tickers);
  const positionsRef = useRef<Position[]>(positions);
  const openOrdersRef = useRef<Order[]>(openOrders);
  const currentPairRef = useRef<AssetPair>(currentPair);
  const timeframeRef = useRef<string>(timeframe);
  const candlesRef = useRef<Candle[]>(candles);
  const isCoinDCXLiveRef = useRef<boolean>(isCoinDCXLive);
  const handleExecuteSignalRef = useRef<((signal: AISignal, options?: { customRiskPercent?: number; isAutonomous?: boolean }) => void) | null>(null);

  // Chart data isolation and race condition mitigation refs
  const candleFetchAbortControllerRef = useRef<AbortController | null>(null);
  const currentActivePairKeyRef = useRef<string>(`${currentPair}::${timeframe}`);
  // 60-second alert deduplication and throttling cache
  const lastAlertedPairTimestampsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    tickersRef.current = tickers;
  }, [tickers]);
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);
  useEffect(() => {
    openOrdersRef.current = openOrders;
  }, [openOrders]);
  useEffect(() => {
    currentPairRef.current = currentPair;
  }, [currentPair]);
  useEffect(() => {
    timeframeRef.current = timeframe;
  }, [timeframe]);
  useEffect(() => {
    candlesRef.current = candles;
  }, [candles]);
  useEffect(() => {
    isCoinDCXLiveRef.current = isCoinDCXLive;
  }, [isCoinDCXLive]);

  // Auto Alert Scanner System State
  const [autoAlertConfig, setAutoAlertConfig] = useState<AutoAlertConfig>(() => {
    try {
      const saved = localStorage.getItem('lumina_auto_alert_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: true,
      soundEnabled: true,
      voiceEnabled: true,
      browserNotifications: false,
      minConfidence: 80,
      scanIntervalSeconds: 15,
      categoryFilter: 'all',
      sideFilter: 'ALL',
      selectedSymbols: [],
      popupAlerts: true,
      autoExecutionEnabled: false,
      autoExecutionRiskPercent: 2,
      maxConcurrentAutoPositions: 3,
    };
  });
  const [latestAutoAlertSignal, setLatestAutoAlertSignal] = useState<AISignal | null>(null);
  const [isAutoAlertModalOpen, setIsAutoAlertModalOpen] = useState<boolean>(false);
  const [lastScannedTime, setLastScannedTime] = useState<number>(Date.now());

  // Modals & Drawers
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isPipCalculatorOpen, setIsPipCalculatorOpen] = useState(false);
  const [pipCalcSymbol, setPipCalcSymbol] = useState<AssetPair | undefined>(undefined);
  const [isApiConfigOpen, setIsApiConfigOpen] = useState(false);
  const [isEcoCalendarOpen, setIsEcoCalendarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((text: string, type: 'error' | 'success' | 'info' = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage({ text, type });
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  // Synchronize current view to local storage
  useEffect(() => {
    try {
      localStorage.setItem('lumina_current_view', currentView);
    } catch {}
  }, [currentView]);

  // Synchronize auto alert configuration to local storage
  useEffect(() => {
    try {
      localStorage.setItem('lumina_auto_alert_config', JSON.stringify(autoAlertConfig));
    } catch {}
  }, [autoAlertConfig]);

  // Synchronize price alerts to local storage
  useEffect(() => {
    try {
      localStorage.setItem('lumina_price_alerts', JSON.stringify(priceAlerts));
    } catch {}
  }, [priceAlerts]);

  // Price Alert Breach Evaluation Engine
  const checkPriceAlerts = useCallback(
    (currentTickers: Record<AssetPair, TickerInfo>) => {
      setPriceAlerts((prevAlerts) => {
        let hasChanges = false;
        const triggeredNotifications: AppNotification[] = [];
        const triggeredToasts: { text: string; type: 'success' }[] = [];
        let shouldPlayAlertChime = false;
        let shouldConfetti = false;

        const updatedAlerts = prevAlerts.map((alert) => {
          if (alert.status !== 'active') return alert;
          const ticker = currentTickers[alert.symbol];
          if (!ticker) return alert;

          const currentPrice = ticker.price;
          const prevPrice =
            previousPricesRef.current[alert.symbol] ?? alert.initialPriceAtCreation;

          let breached = false;
          if (alert.condition === 'rises_above') {
            if (currentPrice >= alert.targetPrice && prevPrice < alert.targetPrice) {
              breached = true;
            }
          } else if (alert.condition === 'drops_below') {
            if (currentPrice <= alert.targetPrice && prevPrice > alert.targetPrice) {
              breached = true;
            }
          } else if (alert.condition === 'crosses') {
            if (
              (prevPrice < alert.targetPrice && currentPrice >= alert.targetPrice) ||
              (prevPrice > alert.targetPrice && currentPrice <= alert.targetPrice)
            ) {
              breached = true;
            }
          }

          if (breached) {
            hasChanges = true;
            if (alert.soundEnabled !== false) {
              shouldPlayAlertChime = true;
            }
            shouldConfetti = true;

            const actionDesc =
              alert.condition === 'rises_above'
                ? 'climbed above target'
                : alert.condition === 'drops_below'
                ? 'dropped below target'
                : 'crossed target threshold';

            triggeredNotifications.push({
              id: `notif-alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              title: `🔔 Price Alert: ${alert.symbol} Target Reached!`,
              message: `${alert.symbol} ${actionDesc} of $${alert.targetPrice.toFixed(
                ticker.precision
              )} (Market: $${currentPrice.toFixed(ticker.precision)}).${
                alert.note ? ` Note: "${alert.note}"` : ''
              }`,
              type: 'price_alert',
              timestamp: Date.now(),
              read: false,
              symbol: alert.symbol,
              targetPrice: alert.targetPrice,
            });

            triggeredToasts.push({
              text: `🔔 Alert: ${alert.symbol} hit $${alert.targetPrice.toFixed(ticker.precision)}!`,
              type: 'success',
            });

            return {
              ...alert,
              triggeredAt: Date.now(),
              status: (alert.isRecurring ? 'active' : 'triggered') as 'active' | 'triggered',
              initialPriceAtCreation: currentPrice,
            };
          }

          return alert;
        });

        // Update previous price cache
        Object.entries(currentTickers).forEach(([sym, info]) => {
          previousPricesRef.current[sym] = (info as TickerInfo).price;
        });

        if (hasChanges) {
          setTimeout(() => {
            if (shouldPlayAlertChime) playAlertChime();
            if (shouldConfetti) {
              try {
                confetti({
                  particleCount: 60,
                  spread: 70,
                  origin: { y: 0.15, x: 0.8 },
                  colors: ['#f6be16', '#00ff94', '#ffffff'],
                });
              } catch {}
            }
            if (triggeredNotifications.length > 0) {
              setNotifications((prevNotifs) => [...triggeredNotifications, ...prevNotifs]);
            }
            triggeredToasts.forEach((t) => showToast(t.text, t.type));
          }, 0);
          return updatedAlerts;
        }

        return prevAlerts;
      });
    },
    [showToast]
  );

  // Price Alert Management Handlers
  const handleCreateAlert = useCallback(
    (newAlert: Omit<PriceAlert, 'id' | 'createdAt' | 'status'>) => {
      const alert: PriceAlert = {
        ...newAlert,
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: Date.now(),
        status: 'active',
      };
      setPriceAlerts((prev) => [alert, ...prev]);
      showToast(`Price alert created for ${alert.symbol} at $${alert.targetPrice}`, 'success');
    },
    [showToast]
  );

  const handleToggleAlert = useCallback(
    (id: string) => {
      setPriceAlerts((prev) =>
        prev.map((a) => {
          if (a.id === id) {
            const newStatus = a.status === 'active' ? 'disabled' : 'active';
            return {
              ...a,
              status: newStatus,
              initialPriceAtCreation: tickers[a.symbol]?.price || a.initialPriceAtCreation,
            };
          }
          return a;
        })
      );
    },
    [tickers]
  );

  const handleDeleteAlert = useCallback(
    (id: string) => {
      setPriceAlerts((prev) => prev.filter((a) => a.id !== id));
      showToast('Price alert removed', 'info');
    },
    [showToast]
  );

  const handleTriggerTestAlert = useCallback(
    (alert: PriceAlert) => {
      if (alert.soundEnabled !== false) {
        playAlertChime();
      }
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.2, x: 0.8 },
          colors: ['#f6be16', '#00ff94', '#ffffff'],
        });
      } catch {}

      const t = tickers[alert.symbol];
      setNotifications((prev) => [
        {
          id: `notif-test-alert-${Date.now()}`,
          title: `🧪 Test Alert Triggered: ${alert.symbol}`,
          message: `Simulation test triggered for $${alert.targetPrice} threshold.${
            alert.note ? ` Note: "${alert.note}"` : ''
          }`,
          type: 'price_alert',
          timestamp: Date.now(),
          read: false,
          symbol: alert.symbol,
          targetPrice: alert.targetPrice,
        },
        ...prev,
      ]);
      showToast(`Test alert fired for ${alert.symbol} at $${alert.targetPrice}`, 'success');
    },
    [tickers, showToast]
  );

  const handleOpenAlertsModal = useCallback(
    (prefillSymbol?: AssetPair, prefillPrice?: number) => {
      setAlertPrefillSymbol(prefillSymbol);
      setAlertPrefillPrice(prefillPrice);
      setIsAlertsModalOpen(true);
    },
    []
  );

  // Automated Multi-Asset AI Signal Alert Dispatcher
  const triggerAutoAlert = useCallback(
    (signal: AISignal, isTest: boolean = false) => {
      // Deduplicate/throttle: same pair cannot trigger repeated alerts within 60 seconds unless manual test
      const now = Date.now();
      const lastAlertedTime = lastAlertedPairTimestampsRef.current[signal.symbol] || 0;
      if (!isTest && now - lastAlertedTime < 60000) {
        return; // Suppress duplicate alert within 60s window
      }
      lastAlertedPairTimestampsRef.current[signal.symbol] = now;

      // 1. Update Signals list and selected signal
      setAiSignals((prev) => {
        const filtered = prev.filter((s) => s.symbol !== signal.symbol);
        return [signal, ...filtered];
      });
      setSelectedSignal(signal);

      // 2. Play Audio chime if enabled
      if (autoAlertConfig.soundEnabled) {
        playSignalAlertSound(signal.side);
      }

      // 3. Spoken Voice announcement if enabled
      if (autoAlertConfig.voiceEnabled) {
        const coinName = signal.symbol.split('/')[0];
        const sideText = signal.side === 'LONG' ? 'Buy' : 'Sell';
        const priceStr = signal.entryPrice < 1 ? signal.entryPrice.toFixed(4) : signal.entryPrice.toFixed(2);
        const speechText = `${isTest ? 'Test Alert!' : 'Alert!'} New ${sideText} signal detected on ${coinName} at ${priceStr} dollars. Target ${signal.target1}.`;
        speakSignalAlert(speechText);
      }

      // 4. Confetti visual celebration
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.12, x: 0.85 },
          colors: signal.side === 'LONG' ? ['#00ff94', '#f6be16', '#ffffff'] : ['#ff3b4a', '#f6be16', '#ffffff'],
        });
      } catch {}

      // 5. Native Browser Desktop Push Notification
      if (
        autoAlertConfig.browserNotifications &&
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        try {
          new Notification(`⚡ AI ${signal.side} Signal: ${signal.symbol}`, {
            body: `Confidence: ${signal.confidence}% | Entry: $${signal.entryPrice} | Target: $${signal.target1}`,
          });
        } catch (err) {
          console.warn('Desktop notification error:', err);
        }
      }

      // 6. Actionable Notification Record in Notification Center
      setNotifications((prev) => [
        {
          id: `notif-signal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: `⚡ AI ${signal.side} Signal: ${signal.symbol} (${signal.confidence}% Conviction)`,
          message: `${signal.description} | Target: $${signal.target1} | SL: $${signal.stopLoss}`,
          type: 'ai_signal',
          timestamp: Date.now(),
          read: false,
          symbol: signal.symbol,
          signalId: signal.id,
        },
        ...prev,
      ]);

      // 7. Unobtrusive notification toast (floating modal overlay removed to protect order controls)
      showToast(
        `⚡ Auto Signal: ${signal.symbol} ${signal.side} (${signal.confidence}% Confidence)`,
        signal.side === 'LONG' ? 'success' : 'info'
      );
    },
    [autoAlertConfig, showToast]
  );

  // Background Multi-Asset Signal Scanner Engine (checks coins/stocks based on user scanTargetMode and custom selection)
  useEffect(() => {
    if (!autoAlertConfig.enabled) return;

    const scanInterval = Math.max(8, autoAlertConfig.scanIntervalSeconds || 15) * 1000;
    const intervalId = setInterval(() => {
      setLastScannedTime(Date.now());

      let candidateCoins = ALL_COINS_METADATA;

      // 1. Scan Target Mode routing
      if (autoAlertConfig.scanTargetMode === 'current_only') {
        candidateCoins = ALL_COINS_METADATA.filter(
          (c) => c.symbol === currentPairRef.current
        );
        if (candidateCoins.length === 0) {
          // Construct entry if custom asset
          candidateCoins = [{
            symbol: currentPairRef.current,
            name: currentPairRef.current,
            baseAsset: currentPairRef.current.split('/')[0],
            quoteAsset: currentPairRef.current.split('/')[1] || 'USDT',
            category: 'crypto',
            tags: [],
          }];
        }
      } else if (autoAlertConfig.scanTargetMode === 'custom') {
        const selected = autoAlertConfig.selectedSymbols || [];
        if (selected.length > 0) {
          candidateCoins = ALL_COINS_METADATA.filter((c) =>
            selected.includes(c.symbol)
          );
          // If any custom symbols not in metadata list, include them
          for (const s of selected) {
            if (!candidateCoins.some((c) => c.symbol === s)) {
              candidateCoins.push({
                symbol: s,
                name: s,
                baseAsset: s.split('/')[0],
                quoteAsset: s.split('/')[1] || 'USDT',
                category: 'crypto',
                tags: [],
              });
            }
          }
        }
      } else {
        // Mode === 'all'
        if (autoAlertConfig.categoryFilter && autoAlertConfig.categoryFilter !== 'all') {
          candidateCoins = candidateCoins.filter(
            (c) => c.category === autoAlertConfig.categoryFilter
          );
        }
      }

      if (candidateCoins.length === 0) return;

      // Pick a coin to perform technical momentum scan
      const targetCoin = candidateCoins[Math.floor(Math.random() * candidateCoins.length)];
      const targetTicker = tickersRef.current[targetCoin.symbol];
      const currentPrice = targetTicker?.price || 100;

      const newSignal = computeClientSignal(
        targetCoin.symbol,
        currentPrice,
        '15m',
        'Trend Following',
        'Balanced',
        autoAlertConfig.minConfidence,
        targetTicker ? {
          high24h: targetTicker.high24h,
          low24h: targetTicker.low24h,
          change24h: targetTicker.change24h,
          volume24h: targetTicker.volume24h,
        } : undefined,
        targetCoin.symbol === currentPairRef.current ? candlesRef.current : undefined
      );

      if (newSignal.active && newSignal.confidence >= autoAlertConfig.minConfidence) {
        if (
          autoAlertConfig.sideFilter === 'ALL' ||
          autoAlertConfig.sideFilter === newSignal.side
        ) {
          triggerAutoAlert(newSignal, false);
        }
      }
    }, scanInterval);

    return () => clearInterval(intervalId);
  }, [autoAlertConfig, triggerAutoAlert]);

  // When switching pairs, regenerate initial candle data & match active signal if available
  const handleSelectPair = useCallback((pair: AssetPair) => {
    setCurrentPair(pair);

    // Ensure ticker entry exists in tickers state if from extended catalog or custom created
    setTickers((prev) => {
      if (prev[pair]) return prev;
      const initial = INITIAL_TICKERS[pair];
      if (initial) {
        return { ...prev, [pair]: initial };
      }
      const base = pair.split('/')[0] || pair;
      const customPrice = pair.includes('BTC') ? 77000 : pair.includes('ETH') ? 2400 : 25.0;
      return {
        ...prev,
        [pair]: {
          symbol: pair,
          baseAsset: base,
          quoteAsset: 'USDT',
          price: customPrice,
          change24h: 1.5,
          high24h: customPrice * 1.05,
          low24h: customPrice * 0.95,
          volume24h: 1500000,
          turnover24h: 1500000 * customPrice,
          fundingRate: 0.0001,
          nextFundingIn: '03:42:15',
          precision: customPrice < 0.01 ? 8 : customPrice < 1 ? 4 : 2,
        },
      };
    });

    // 1. Abort previous in-flight candle fetch request to avoid race condition
    if (candleFetchAbortControllerRef.current) {
      candleFetchAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    candleFetchAbortControllerRef.current = controller;

    const requestKey = `${pair}::${timeframe}::${currencyMode}`;
    currentActivePairKeyRef.current = requestKey;

    // 2. Immediately isolate and seed clean synthetic candles scaled to the target pair's price
    const targetPrice = tickers[pair]?.price || INITIAL_TICKERS[pair]?.price || 25.0;
    const count = 100;
    setCandles(generateSyntheticCandles(targetPrice, count, timeframe));

    // 3. Fetch live CoinDCX exchange candles with AbortSignal & verify payload matches active pair
    fetchCoinDCXCandles(pair, timeframe, count, currencyMode, controller.signal)
      .then((liveCandles) => {
        if (controller.signal.aborted || currentActivePairKeyRef.current !== requestKey) {
          return; // Quarantined: Symbol or timeframe has switched
        }
        if (liveCandles && liveCandles.length > 0) {
          // Double verify candle scale matches reasonable bounds of target asset
          const latestClose = liveCandles[liveCandles.length - 1].close;
          const ratio = latestClose / Math.max(0.0001, targetPrice);
          if (ratio > 0.05 && ratio < 20) {
            setCandles(liveCandles);
          }
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn('[Candles] Fetch failed:', err);
        }
      });

    const matchedSig = aiSignals.find((s) => s.symbol === pair);
    if (matchedSig) {
      setSelectedSignal(matchedSig);
    }
  }, [tickers, timeframe, aiSignals, currencyMode]);

  // Handler for 1-Click trading directly from an auto-alert
  const handleSelectAndTradeSignal = useCallback(
    (signal: AISignal) => {
      setSelectedSignal(signal);
      if (currentPair !== signal.symbol) {
        handleSelectPair(signal.symbol);
      }
      setCurrentView('terminal');
      setLatestAutoAlertSignal(null);
      showToast(`Switched chart to ${signal.symbol} for ${signal.side} setup`, 'info');
    },
    [currentPair, handleSelectPair, showToast]
  );

  // Instant Test Signal Trigger
  const handleTriggerTestAutoSignal = useCallback(
    (customSymbol?: AssetPair) => {
      const symbolToUse = customSymbol || currentPair;
      const targetTicker = tickers[symbolToUse];
      const priceToUse = targetTicker?.price || 100;
      const testSignal = computeClientSignal(
        symbolToUse,
        priceToUse,
        '15m',
        'Trend Following',
        'Balanced',
        Math.max(autoAlertConfig.minConfidence, 88),
        targetTicker ? {
          high24h: targetTicker.high24h,
          low24h: targetTicker.low24h,
          change24h: targetTicker.change24h,
          volume24h: targetTicker.volume24h,
        } : undefined,
        symbolToUse === currentPair ? candles : undefined
      );
      testSignal.active = true;
      triggerAutoAlert(testSignal, true);
    },
    [currentPair, tickers, autoAlertConfig.minConfidence, triggerAutoAlert, candles]
  );

  // When switching timeframes, regenerate candle density & try live fetch with AbortController
  const handleTimeframeChange = useCallback((tf: string) => {
    setTimeframe(tf);

    if (candleFetchAbortControllerRef.current) {
      candleFetchAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    candleFetchAbortControllerRef.current = controller;

    const requestKey = `${currentPair}::${tf}::${currencyMode}`;
    currentActivePairKeyRef.current = requestKey;

    const targetPrice = tickers[currentPair]?.price || INITIAL_TICKERS[currentPair]?.price || 100;
    const count = 100;
    setCandles(generateSyntheticCandles(targetPrice, count, tf));

    fetchCoinDCXCandles(currentPair, tf, count, currencyMode, controller.signal)
      .then((liveCandles) => {
        if (controller.signal.aborted || currentActivePairKeyRef.current !== requestKey) {
          return;
        }
        if (liveCandles && liveCandles.length > 0) {
          const latestClose = liveCandles[liveCandles.length - 1].close;
          const ratio = latestClose / Math.max(0.0001, targetPrice);
          if (ratio > 0.05 && ratio < 20) {
            setCandles(liveCandles);
          }
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          console.warn('[Candles] Timeframe fetch failed:', err);
        }
      });
  }, [currentPair, tickers, currencyMode]);

  // Seamless historical back-data infinite generation
  const handleLoadMoreHistoricalCandles = useCallback(() => {
    setCandles((prev) => {
      if (prev.length === 0 || prev.length >= 1000) return prev;
      const firstCandle = prev[0];
      const earlier = generateEarlierCandles(firstCandle, 80, timeframe);
      return [...earlier, ...prev];
    });
  }, [timeframe]);

  // Network hook for real-time tickers (SSE streaming + compact watchlist polling + visibility-aware lifecycle) (M-04)
  const handleTickerUpdate = useCallback((updatedTickers: Record<AssetPair, TickerInfo>) => {
    setTickers(updatedTickers);
    checkPriceAlerts(updatedTickers);

    // Synchronize AI signals to track live exchange prices dynamically
    setAiSignals((prevSignals) =>
      prevSignals.map((sig) => {
        const live = updatedTickers[sig.symbol];
        if (!live || !live.price || sig.isLocked) return sig;
        const priceDiffPct = Math.abs((sig.entryPrice - live.price) / live.price) * 100;
        if (priceDiffPct > 4) {
          const isLong = sig.side === 'LONG';
          const entry = Number((live.price * (isLong ? 0.9985 : 1.0015)).toFixed(live.precision || 2));
          const mult = isLong ? 1 : -1;
          return {
            ...sig,
            entryPrice: entry,
            entryRange: [entry * (isLong ? 0.997 : 1.001), entry * (isLong ? 1.001 : 0.997)],
            target1: Number((entry + mult * entry * 0.015).toFixed(live.precision || 2)),
            target2: Number((entry + mult * entry * 0.03).toFixed(live.precision || 2)),
            target3: Number((entry + mult * entry * 0.05).toFixed(live.precision || 2)),
            stopLoss: Number((entry - mult * entry * 0.012).toFixed(live.precision || 2)),
          };
        }
        return sig;
      })
    );

    // Actively synchronize the latest forming candlestick with the real live exchange price
    const livePrice = updatedTickers[currentPairRef.current]?.price;
    if (livePrice && livePrice > 0) {
      setCandles((prevCandles) => {
        if (prevCandles.length === 0) {
          return generateSyntheticCandles(livePrice, 80, timeframeRef.current);
        }
        const last = { ...prevCandles[prevCandles.length - 1] };
        last.close = livePrice;
        last.high = Math.max(last.high, livePrice);
        last.low = Math.min(last.low, livePrice);
        return [...prevCandles.slice(0, -1), last];
      });
    }
  }, []);

  const tickerFeed = useTickerFeed({
    preferStreaming: true,
    pollingIntervalMs: 2500,
    onTickerUpdate: handleTickerUpdate,
  });

  // Sync latency and live connection state from useTickerFeed
  useEffect(() => {
    setCoindcxLatency(tickerFeed.latencyMs);
    setIsCoinDCXLive(tickerFeed.isLive);
  }, [tickerFeed.latencyMs, tickerFeed.isLive]);

  // Visibility-aware candle sync worker
  const syncCoinDCXCandles = useCallback(async () => {
    try {
      const count = 100;
      const liveCandles = await fetchCoinDCXCandles(currentPair, timeframe, count);
      if (liveCandles && liveCandles.length > 0) {
        const activePrice = tickersRef.current[currentPair]?.price;
        if (activePrice && activePrice > 0) {
          const lastIdx = liveCandles.length - 1;
          liveCandles[lastIdx] = {
            ...liveCandles[lastIdx],
            close: activePrice,
            high: Math.max(liveCandles[lastIdx].high, activePrice),
            low: Math.min(liveCandles[lastIdx].low, activePrice),
          };
        }
        setCandles(liveCandles);
      }
    } catch (err) {
      console.warn('[Candles] Visibility poll error:', err);
    }
  }, [currentPair, timeframe]);

  // Visibility-aware orderbook sync worker
  const syncCoinDCXOrderBook = useCallback(async () => {
    try {
      const ob = await fetchCoinDCXOrderBook(currentPair);
      if (ob && (ob.bids.length > 0 || ob.asks.length > 0)) {
        setLiveOrderBook(ob);
      }
    } catch (err) {
      console.warn('[OrderBook] Visibility poll error:', err);
    }
  }, [currentPair]);

  // Visibility polling for candles (every 6s, pauses on document.hidden)
  useVisibilityPolling(syncCoinDCXCandles, 6000, {
    enabled: true,
    runImmediately: true,
    runOnVisible: true,
  });

  // Visibility polling for orderbook (every 3s, pauses on document.hidden)
  useVisibilityPolling(syncCoinDCXOrderBook, 3000, {
    enabled: true,
    runImmediately: true,
    runOnVisible: true,
  });

  // Reset all prices directly from live market feeds (Binance + CoinDCX + Investing.com)
  const handleResetAllPricesFromCoinDCX = useCallback(async () => {
    setIsResettingPrices(true);
    showToast('Resetting all API cache & syncing real-time market prices...', 'info');

    try {
      await tickerFeed.refresh(true);
      const { tickers: freshTickers, latencyMs, success } = await resetAllApiMarketData();
      if (success && Object.keys(freshTickers).length > 0) {
        setCoindcxLatency(latencyMs);
        setIsCoinDCXLive(true);
        setTickers((prev) => ({
          ...prev,
          ...(freshTickers as Record<AssetPair, TickerInfo>),
        }));

        // Fetch actual live exchange candles for current active pair
        const realCandles = await fetchCoinDCXCandles(currentPair, timeframe, 80);
        if (realCandles && realCandles.length > 0) {
          setCandles(realCandles);
        } else {
          const newPrice = freshTickers[currentPair]?.price || tickers[currentPair]?.price || 100;
          setCandles(generateSyntheticCandles(newPrice, 80, timeframe));
        }

        // Fetch fresh order book for current pair
        try {
          const ob = await fetchCoinDCXOrderBook(currentPair);
          if (ob && ob.bids.length > 0 && ob.asks.length > 0) {
            setLiveOrderBook(ob);
          }
        } catch {}

        // Clear stale local storage signals
        try {
          localStorage.removeItem('coindcx_accepted_signals');
        } catch {}

        showToast('All API data reset! Market prices 100% synchronized with live exchanges.', 'success');
        setNotifications((prev) => [
          {
            id: `notif-reset-${Date.now()}`,
            title: 'Market API Data Reset: 100% Synced',
            message: `Purged stale cache and updated all ${Object.keys(freshTickers).length} assets with real-time exchange rates (${latencyMs}ms latency).`,
            type: 'system',
            timestamp: Date.now(),
            read: false,
          },
          ...prev,
        ]);
      } else {
        showToast('Connected to exchange feed, synchronizing live rates...', 'info');
      }
    } catch {
      showToast('Exchange feed reconnected. Refreshing live quotes...', 'info');
    } finally {
      setIsResettingPrices(false);
    }
  }, [currentPair, tickers, timeframe, showToast]);

  // Dynamic / Live Order Book
  const activeTicker = tickers[currentPair] || tickers['ETH/USDT'] || tickers['BTC/USDT'];
  const { bids, asks } = useMemo(() => {
    if (liveOrderBook && liveOrderBook.bids.length > 0 && liveOrderBook.asks.length > 0) {
      return liveOrderBook;
    }

    const p = activeTicker.price;
    const step = p > 1000 ? 5 : p > 50 ? 0.25 : p > 1 ? 0.005 : 0.0001;

    const newBids: OrderBookItem[] = [];
    let runningBidTotal = 0;
    for (let i = 1; i <= 30; i++) {
      const price = p - i * step;
      const amount = Number((Math.random() * (p > 1000 ? 1.5 : p > 50 ? 25 : 5000) + 0.1).toFixed(3));
      runningBidTotal += amount;
      newBids.push({
        price: Number(price.toFixed(activeTicker.precision)),
        amount,
        total: Number(runningBidTotal.toFixed(3)),
        depthPercent: 0,
      });
    }

    const newAsks: OrderBookItem[] = [];
    let runningAskTotal = 0;
    for (let i = 30; i >= 1; i--) {
      const price = p + i * step;
      const amount = Number((Math.random() * (p > 1000 ? 1.5 : p > 50 ? 25 : 5000) + 0.1).toFixed(3));
      runningAskTotal += amount;
      newAsks.push({
        price: Number(price.toFixed(activeTicker.precision)),
        amount,
        total: Number(runningAskTotal.toFixed(3)),
        depthPercent: 0,
      });
    }

    return { bids: newBids, asks: newAsks };
  }, [liveOrderBook, activeTicker.price, activeTicker.precision]);

  // Real-time market simulation engine (Micro trade feed, active tick fluctuations, limit order fill & position monitor)
  useEffect(() => {
    const interval = setInterval(() => {
      const activeCurrentPair = currentPairRef.current;
      const curTickers = tickersRef.current;
      const curPositions = positionsRef.current;
      const curOpenOrders = openOrdersRef.current;

      // 1. Compute dynamic micro-price ticks for currentPair & any open positions
      const activeSymbols = new Set<AssetPair>([activeCurrentPair]);
      curPositions.forEach((p) => activeSymbols.add(p.symbol));
      curOpenOrders.forEach((o) => activeSymbols.add(o.symbol));

      const nextTickers = { ...curTickers };
      let currentPairUpdatedPrice: number | null = null;

      activeSymbols.forEach((sym) => {
        const t = nextTickers[sym];
        if (!t) return;

        const basePrice = t.price;
        const precision = t.precision ?? 2;

        // When CoinDCX is connected and live, real prices are streamed and synchronized
        // Do NOT corrupt live exchange tickers with artificial ping-pong random bias!
        if (!isCoinDCXLiveRef.current) {
          const posForSymbol = curPositions.find((p) => p.symbol === sym);
          let bias = 0;

          if (posForSymbol) {
            const direction = posForSymbol.side === 'long' ? 1 : -1;
            const isFavorable = Math.random() < 0.65;
            bias = isFavorable ? direction * 0.0001 : -direction * 0.00008;
          } else {
            bias = (Math.random() - 0.49) * 0.00008;
          }

          const priceDelta = basePrice * bias;
          const newPrice = Number(Math.max(0.00001, basePrice + priceDelta).toFixed(precision));

          if (newPrice !== basePrice) {
            nextTickers[sym] = {
              ...t,
              price: newPrice,
              inrPrice: t.inrPrice ? Number((newPrice * 98.3).toFixed(precision)) : undefined,
              high24h: Math.max(t.high24h, newPrice),
              low24h: Math.min(t.low24h, newPrice),
            };

            if (sym === activeCurrentPair) {
              currentPairUpdatedPrice = newPrice;
            }
          }
        }
      });

      if (!isCoinDCXLiveRef.current && currentPairUpdatedPrice !== null) {
        setTickers(nextTickers);
      }

      // 2. Update the live forming candle in the chart & dynamically roll over when duration elapses
      const targetP = currentPairUpdatedPrice ?? curTickers[activeCurrentPair]?.price;
      if (targetP !== undefined && targetP !== null && targetP > 0) {
        setCandles((prevCandles) => {
          if (prevCandles.length === 0) return prevCandles;
          const lastIndex = prevCandles.length - 1;
          const lastCandle = prevCandles[lastIndex];

          const tf = timeframeRef.current;
          const stepMs =
            tf === '1s'
              ? 1000
              : tf === '1m'
              ? 60 * 1000
              : tf === '5m'
              ? 5 * 60 * 1000
              : tf === '15m'
              ? 15 * 60 * 1000
              : tf === '1h'
              ? 60 * 60 * 1000
              : tf === '4h'
              ? 4 * 60 * 60 * 1000
              : 24 * 60 * 60 * 1000;

          const now = Date.now();
          if (lastCandle && now - lastCandle.time >= stepMs) {
            const newCandle: Candle = {
              time: lastCandle.time + stepMs,
              open: lastCandle.close,
              high: Math.max(lastCandle.close, targetP),
              low: Math.min(lastCandle.close, targetP),
              close: targetP,
              volume: Math.floor(Math.random() * 25 + 5),
            };
            return [...prevCandles.slice(1), newCandle];
          }

          // If price hasn't moved and bounds are covered, avoid triggering re-render
          if (
            lastCandle.close === targetP &&
            lastCandle.high >= targetP &&
            lastCandle.low <= targetP
          ) {
            return prevCandles;
          }

          const updatedCandle: Candle = {
            ...lastCandle,
            close: targetP,
            high: Math.max(lastCandle.high, targetP),
            low: Math.min(lastCandle.low, targetP),
            volume: (lastCandle.volume || 100) + 1,
          };
          const nextCandles = [...prevCandles];
          nextCandles[lastIndex] = updatedCandle;
          return nextCandles;
        });
      }

      const activeP = currentPairUpdatedPrice || curTickers[activeCurrentPair]?.price || 100;
      const precision = curTickers[activeCurrentPair]?.precision ?? 2;

      // 3. Generate live trade tape executions (throttled to avoid DOM churning)
      if (Math.random() < 0.45) {
        const spread = activeP * 0.00008;
        const side: 'buy' | 'sell' = Math.random() > 0.48 ? 'buy' : 'sell';
        const tradePrice = Number(
          (side === 'buy' ? activeP + Math.random() * spread : activeP - Math.random() * spread).toFixed(precision)
        );

        setLastTradeSide(side);
        setRecentTrades((prevTrades) => [
          {
            id: `trade-${Date.now()}-${Math.random()}`,
            price: tradePrice,
            amount: Number((Math.random() * (activeP > 1000 ? 0.8 : activeP > 50 ? 20 : 2500) + 0.02).toFixed(3)),
            side,
            time: Date.now(),
          },
          ...prevTrades.slice(0, 79),
        ]);
      }

      // 4. Fill matching Limit Orders in openOrders
      if (curOpenOrders.length > 0) {
        const remainingOrders: Order[] = [];
        const filledPositions: Position[] = [];
        const newlyFilledOrders: Order[] = [];
        const filledToasts: string[] = [];

        curOpenOrders.forEach((order) => {
          const currentPriceForSym = nextTickers[order.symbol]?.price || order.price;
          let shouldFill = false;

          if (order.side === 'buy' && currentPriceForSym <= order.price) {
            shouldFill = true;
          } else if (order.side === 'sell' && currentPriceForSym >= order.price) {
            shouldFill = true;
          }

          if (shouldFill) {
            const requiredMargin = (order.price * order.amount) / order.leverage;
            const liquidationPrice =
              order.side === 'buy'
                ? order.price * (1 - 0.9 / order.leverage)
                : order.price * (1 + 0.9 / order.leverage);

            const newPos: Position = {
              id: `pos-${order.id}`,
              symbol: order.symbol,
              side: order.side === 'buy' ? 'long' : 'short',
              entryPrice: order.price,
              markPrice: currentPriceForSym,
              peakPrice: currentPriceForSym,
              size: order.amount,
              leverage: order.leverage,
              margin: requiredMargin,
              liquidationPrice,
              takeProfit: order.takeProfit || Number((order.price * (order.side === 'buy' ? 1.035 : 0.965)).toFixed(2)),
              stopLoss: order.stopLoss || Number((order.price * (order.side === 'buy' ? 0.985 : 1.015)).toFixed(2)),
              timestamp: Date.now(),
            };

            filledPositions.push(newPos);
            newlyFilledOrders.push({ ...order, status: 'filled' });
            filledToasts.push(`🎯 Limit Order Filled: ${order.symbol} ${order.side.toUpperCase()} @ $${order.price}`);
          } else {
            remainingOrders.push(order);
          }
        });

        if (filledPositions.length > 0) {
          setOpenOrders(remainingOrders);
          setPositions((p) => [...filledPositions, ...p]);
          setOrderHistory((h) => [...newlyFilledOrders, ...h]);
          filledToasts.forEach((msg) => showToast(msg, 'success'));
        }
      }

      // 5. Update active positions' mark price & evaluate Take Profit / Stop Loss / Trailing SL
      if (curPositions.length > 0) {
        const remainingPositions: Position[] = [];
        let totalBalanceDelta = 0;
        const autoCloseNotifs: AppNotification[] = [];
        const closeToasts: { msg: string; type: 'success' | 'info' }[] = [];
        const autoClosedOrders: Order[] = [];
        let hasProfitHit = false;

        curPositions.forEach((pos) => {
          const currentP = nextTickers[pos.symbol]?.price || pos.markPrice;
          let newPeak = pos.peakPrice || pos.entryPrice;

          if (pos.side === 'long') {
            newPeak = Math.max(newPeak, currentP);
          } else {
            newPeak = Math.min(newPeak, currentP);
          }

          let autoCloseReason: string | null = null;
          let isTPHit = false;

          // Check Take Profit
          if (pos.takeProfit) {
            if (pos.side === 'long' && currentP >= pos.takeProfit) {
              autoCloseReason = `Take Profit hit @ $${currentP.toFixed(2)}`;
              isTPHit = true;
            } else if (pos.side === 'short' && currentP <= pos.takeProfit) {
              autoCloseReason = `Take Profit hit @ $${currentP.toFixed(2)}`;
              isTPHit = true;
            }
          }

          // Check Fixed Stop Loss
          if (!autoCloseReason && pos.stopLoss) {
            if (pos.side === 'long' && currentP <= pos.stopLoss) {
              autoCloseReason = `Stop Loss triggered @ $${currentP.toFixed(2)}`;
            } else if (pos.side === 'short' && currentP >= pos.stopLoss) {
              autoCloseReason = `Stop Loss triggered @ $${currentP.toFixed(2)}`;
            }
          }

          // Check Trailing Stop Loss
          if (!autoCloseReason && pos.trailingStopPercent && pos.trailingStopPercent > 0) {
            const trailDrop = pos.trailingStopPercent / 100;
            if (pos.side === 'long') {
              const trailStopPrice = newPeak * (1 - trailDrop);
              if (currentP <= trailStopPrice && newPeak > pos.entryPrice) {
                autoCloseReason = `Trailing SL (${pos.trailingStopPercent}%) executed @ $${currentP.toFixed(2)}`;
              }
            } else {
              const trailStopPrice = newPeak * (1 + trailDrop);
              if (currentP >= trailStopPrice && newPeak < pos.entryPrice) {
                autoCloseReason = `Trailing SL (${pos.trailingStopPercent}%) executed @ $${currentP.toFixed(2)}`;
              }
            }
          }

          // Check Liquidation
          if (!autoCloseReason) {
            if (pos.side === 'long' && currentP <= pos.liquidationPrice) {
              autoCloseReason = `Position liquidated @ $${currentP.toFixed(2)}`;
            } else if (pos.side === 'short' && currentP >= pos.liquidationPrice) {
              autoCloseReason = `Position liquidated @ $${currentP.toFixed(2)}`;
            }
          }

          if (autoCloseReason) {
            const pnl =
              pos.side === 'long'
                ? (currentP - pos.entryPrice) * pos.size
                : (pos.entryPrice - currentP) * pos.size;
            totalBalanceDelta += pos.margin + pnl;

            if (isTPHit || pnl > 0) {
              hasProfitHit = true;
            }

            autoClosedOrders.push({
              id: `autoclose-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              symbol: pos.symbol,
              type: 'market',
              side: pos.side === 'long' ? 'sell' : 'buy',
              price: currentP,
              amount: pos.size,
              total: currentP * pos.size,
              status: 'filled',
              timestamp: Date.now(),
              leverage: pos.leverage,
              realizedPnl: +pnl.toFixed(2),
              pnlPercent: pos.margin > 0 ? +((pnl / pos.margin) * 100).toFixed(2) : 0,
            });

            autoCloseNotifs.push({
              id: `notif-autoclose-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              title: `Auto-Executed: ${pos.symbol} ${pos.side.toUpperCase()}`,
              message: `${autoCloseReason}. PnL: ${pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`}`,
              type: 'order',
              timestamp: Date.now(),
              read: false,
            });

            closeToasts.push({
              msg: isTPHit
                ? `🎉 Take Profit Hit! +$${pnl.toFixed(2)} Profit booked on ${pos.symbol}!`
                : `${autoCloseReason} on ${pos.symbol}`,
              type: pnl >= 0 ? 'success' : 'info',
            });
          } else {
            remainingPositions.push({
              ...pos,
              markPrice: currentP,
              peakPrice: newPeak,
            });
          }
        });

        if (totalBalanceDelta > 0) {
          setBalance((b) => Math.max(0, b + totalBalanceDelta));
        }
        if (hasProfitHit) {
          playProfitHitChime();
          try {
            confetti({
              particleCount: 75,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#00ff94', '#61feaf', '#ffd87f', '#ffffff'],
            });
          } catch {}
        }
        if (autoCloseNotifs.length > 0) {
          setNotifications((n) => [...autoCloseNotifs, ...n]);
        }
        if (autoClosedOrders.length > 0) {
          setOrderHistory((h) => [...autoClosedOrders, ...h]);
        }
        closeToasts.forEach((t) => showToast(t.msg, t.type));
        const hasPositionChanges =
          remainingPositions.length !== curPositions.length ||
          remainingPositions.some((pos, idx) => {
            const orig = curPositions[idx];
            return (
              !orig ||
              orig.markPrice !== pos.markPrice ||
              orig.peakPrice !== pos.peakPrice
            );
          });
        if (hasPositionChanges) {
          setPositions(remainingPositions);
        }
      }
    }, 2400);

    return () => clearInterval(interval);
  }, [showToast]);

  // Slow background sentiment update (does not burden the render loop)
  useEffect(() => {
    const timer = setInterval(() => {
      setSentimentPercent((prev) => {
        const change = (Math.random() - 0.5) * 0.8;
        return Math.min(96, Math.max(78, Math.round(prev + change)));
      });
    }, 45000);
    return () => clearInterval(timer);
  }, []);

  // 1-Click Quick Profit Trade Handler (Automatic sizing, leverage, TP +3.5%, SL -1.5%)
  const handleQuickProfitTrade = (params: {
    symbol: AssetPair;
    side: 'buy' | 'sell';
    leverage?: number;
    marginPercent?: number;
    takeProfitPercent?: number;
    stopLossPercent?: number;
  }) => {
    const sym = params.symbol;
    const currentP = tickers[sym]?.price || 100;
    const precision = tickers[sym]?.precision ?? 2;
    const lev = params.leverage || 15;
    const marginPct = params.marginPercent || 25;
    const marginToUse = Math.max(10, balance * (marginPct / 100));
    const totalPositionVal = marginToUse * lev;
    const amount = Number((totalPositionVal / currentP).toFixed(4));
    const tpPct = (params.takeProfitPercent || 3.5) / 100;
    const slPct = (params.stopLossPercent || 1.5) / 100;

    const takeProfit = Number(
      (params.side === 'buy' ? currentP * (1 + tpPct) : currentP * (1 - tpPct)).toFixed(precision)
    );
    const stopLoss = Number(
      (params.side === 'buy' ? currentP * (1 - slPct) : currentP * (1 + slPct)).toFixed(precision)
    );

    handlePlaceOrder({
      symbol: sym,
      type: 'market',
      side: params.side,
      price: currentP,
      amount,
      leverage: lev,
      takeProfit,
      stopLoss,
    });
  };

  // Order Placement Handler (Hardened with Risk Checks & Policy Enforcements)
  const handlePlaceOrder = (orderParams: {
    symbol: AssetPair;
    type: 'limit' | 'market' | 'stop-limit' | 'ai-smart';
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    leverage: number;
    takeProfit?: number;
    stopLoss?: number;
    trailingStopPercent?: number;
  }) => {
    // Mode Guard: Research mode forbids any order placement
    if (currentMode === 'RESEARCH') {
      showToast('Research Mode is Active: Order execution is strictly disabled.', 'error');
      return;
    }

    // Beginner / Standard Safety Leverage Cap
    const safeLeverage = Math.max(1, Math.min(orderParams.leverage || 1, 3));

    // Long / Short SL/TP Relationship Validation
    if (orderParams.side === 'buy') {
      if (orderParams.stopLoss && orderParams.stopLoss >= orderParams.price) {
        showToast('Invalid Stop Loss: For BUY/LONG, Stop Loss must be lower than entry price.', 'error');
        return;
      }
      if (orderParams.takeProfit && orderParams.takeProfit <= orderParams.price) {
        showToast('Invalid Take Profit: For BUY/LONG, Take Profit must be higher than entry price.', 'error');
        return;
      }
    } else {
      if (orderParams.stopLoss && orderParams.stopLoss <= orderParams.price) {
        showToast('Invalid Stop Loss: For SELL/SHORT, Stop Loss must be higher than entry price.', 'error');
        return;
      }
      if (orderParams.takeProfit && orderParams.takeProfit >= orderParams.price) {
        showToast('Invalid Take Profit: For SELL/SHORT, Take Profit must be lower than entry price.', 'error');
        return;
      }
    }

    const total = orderParams.price * orderParams.amount;
    const requiredMargin = total / safeLeverage;

    if (requiredMargin > balance) {
      showToast('Insufficient available margin in wallet.', 'error');
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: `Order Rejected: ${orderParams.symbol}`,
          message: `Margin required ($${requiredMargin.toFixed(2)}) exceeds balance ($${balance.toFixed(2)}).`,
          type: 'alert',
          timestamp: Date.now(),
          read: false,
        },
        ...prev,
      ]);
      return;
    }

    setBalance((prev) => Math.max(0, prev - requiredMargin));

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      symbol: orderParams.symbol,
      type: orderParams.type,
      side: orderParams.side,
      price: orderParams.price,
      amount: orderParams.amount,
      total,
      status: orderParams.type === 'market' || orderParams.type === 'ai-smart' ? 'filled' : 'open',
      timestamp: Date.now(),
      leverage: safeLeverage,
    };

    if (orderParams.type === 'market' || orderParams.type === 'ai-smart') {
      const liquidationPrice =
        orderParams.side === 'buy'
          ? orderParams.price * (1 - 0.9 / orderParams.leverage)
          : orderParams.price * (1 + 0.9 / orderParams.leverage);

      const newPosition: Position = {
        id: `pos-${Date.now()}`,
        symbol: orderParams.symbol,
        side: orderParams.side === 'buy' ? 'long' : 'short',
        entryPrice: orderParams.price,
        markPrice: orderParams.price,
        peakPrice: orderParams.price,
        size: orderParams.amount,
        leverage: orderParams.leverage,
        margin: requiredMargin,
        liquidationPrice,
        takeProfit: orderParams.takeProfit,
        stopLoss: orderParams.stopLoss,
        trailingStopPercent: orderParams.trailingStopPercent,
        timestamp: Date.now(),
      };

      setPositions((prev) => [newPosition, ...prev]);
      setOrderHistory((prev) => [newOrder, ...prev]);

      confetti({
        particleCount: 40,
        spread: 55,
        origin: { y: 0.8 },
        colors: orderParams.side === 'buy' ? ['#00ff94', '#61feaf', '#ffd87f'] : ['#ff3b4a', '#ffd2d1'],
      });

      showToast(`Position opened: ${orderParams.side.toUpperCase()} ${orderParams.symbol} @ $${orderParams.price.toFixed(2)}`, 'success');

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: `Order Filled: ${orderParams.side.toUpperCase()} ${orderParams.symbol}`,
          message: `Executed ${orderParams.amount} @ $${orderParams.price.toFixed(2)} with ${orderParams.leverage}x leverage. TP: $${orderParams.takeProfit || 'N/A'} | SL: $${orderParams.stopLoss || 'N/A'}`,
          type: 'order',
          timestamp: Date.now(),
          read: false,
        },
        ...prev,
      ]);
    } else {
      setOpenOrders((prev) => [newOrder, ...prev]);
      showToast(`Limit order placed for ${orderParams.symbol}`, 'info');
    }
  };

  // Hardened Deliberate Order Confirmation Handler (Routes through Backend Risk Engine)
  const handleConfirmOrder = useCallback(
    async (payload: OrderReviewPayload): Promise<{ success: boolean; message?: string }> => {
      try {
        const res = await fetch('/api/orders/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idempotencyKey: payload.idempotencyKey,
            symbol: payload.symbol,
            market: payload.market,
            side: payload.side,
            quantity: payload.quantity,
            orderType: payload.orderType,
            entryPrice: payload.entryPrice,
            currentMarketPrice: payload.currentMarketPrice,
            leverage: payload.leverage,
            marginMode: payload.marginMode,
            requiredMargin: payload.requiredMargin,
            takeProfit: payload.takeProfit,
            stopLoss: payload.stopLoss,
            userMode: currentMode,
            accountBalance: balance,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, message: data.error || data.message || 'Order failed risk check' };
        }

        handlePlaceOrder({
          symbol: payload.symbol,
          type: payload.orderType,
          side: payload.side,
          price: payload.entryPrice,
          amount: payload.quantity,
          leverage: payload.leverage,
          takeProfit: payload.takeProfit,
          stopLoss: payload.stopLoss,
        });

        return { success: true, message: data.message };
      } catch (err: any) {
        return { success: false, message: err.message || 'Execution error during order submission' };
      }
    },
    [currentMode, balance]
  );

  // Update Position Stop Loss Handler
  const handleUpdatePositionSL = (posId: string, newSL: number) => {
    setPositions((prev) =>
      prev.map((pos) => {
        if (pos.id === posId) {
          return { ...pos, stopLoss: newSL };
        }
        return pos;
      })
    );
    showToast(`Stop Loss updated to $${newSL.toFixed(2)} (Break-Even Locked)`, 'success');
  };

  // Close Position Handler
  const handleClosePosition = (posId: string) => {
    const pos = positions.find((p) => p.id === posId);
    if (!pos) return;

    const currentP = tickers[pos.symbol]?.price || pos.markPrice;
    const pnl =
      pos.side === 'long'
        ? (currentP - pos.entryPrice) * pos.size
        : (pos.entryPrice - currentP) * pos.size;

    setBalance((prev) => Math.max(0, prev + pos.margin + pnl));
    setPositions((prev) => prev.filter((p) => p.id !== posId));

    setOrderHistory((prev) => [
      {
        id: `close-${Date.now()}`,
        symbol: pos.symbol,
        type: 'market',
        side: pos.side === 'long' ? 'sell' : 'buy',
        price: currentP,
        amount: pos.size,
        total: currentP * pos.size,
        status: 'filled',
        timestamp: Date.now(),
        leverage: pos.leverage,
        realizedPnl: +pnl.toFixed(2),
        pnlPercent: pos.margin > 0 ? +((pnl / pos.margin) * 100).toFixed(2) : 0,
      },
      ...prev,
    ]);

    showToast(`Position closed: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} USDT`, pnl >= 0 ? 'success' : 'error');

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `Position Closed: ${pos.symbol}`,
        message: `Realized PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} USDT.`,
        type: 'order',
        timestamp: Date.now(),
        read: false,
      },
      ...prev,
    ]);
  };

  // Cancel Open Order Handler
  const handleCancelOrder = (orderId: string) => {
    const ord = openOrders.find((o) => o.id === orderId);
    if (ord) {
      const refundMargin = ord.total / ord.leverage;
      setBalance((prev) => prev + refundMargin);
      setOpenOrders((prev) => prev.filter((o) => o.id !== orderId));
      showToast('Order cancelled', 'info');
    }
  };

  // Execute AI Signal Handler (1-Click & Autonomous Execution with Entry, TP, SL)
  const handleExecuteSignal = (
    signal: AISignal,
    options?: { customRiskPercent?: number; isAutonomous?: boolean }
  ) => {
    const isBullish = signal.side === 'LONG';
    const activeP = tickers[signal.symbol]?.price || signal.entryPrice || signal.entryRange[0];

    // Check if autonomous execution safety limits apply
    if (options?.isAutonomous) {
      // Safety limit: Don't exceed max configured concurrent positions
      const maxPositions = autoAlertConfig.maxConcurrentAutoPositions || 3;
      if (positions.length >= maxPositions) {
        showToast(
          `Auto-Trade skipped for ${signal.symbol}: Max concurrent positions (${maxPositions}) reached.`,
          'info'
        );
        return;
      }

      // Safety limit: Don't double-open the same symbol in same direction
      const existingPos = positions.find((p) => p.symbol === signal.symbol);
      if (existingPos) {
        return;
      }
    }

    // Automatically switch chart to signal symbol (only if manual or explicitly viewing)
    if (!options?.isAutonomous) {
      if (signal.symbol !== currentPair) {
        handleSelectPair(signal.symbol);
      }
      setSelectedSignal(signal);
    }

    // Calculate position size based on user's configured risk % or fallback
    const riskPercent = options?.customRiskPercent || autoAlertConfig.autoExecutionRiskPercent || 2;
    const leverage = signal.recommendedLeverage || 15;
    let amount: number;

    if (activeP > 0 && balance > 0) {
      // Target margin is riskPercent% of available balance
      const targetMargin = Math.max(10, balance * (riskPercent / 100));
      const notional = targetMargin * leverage;
      const rawAmount = notional / activeP;
      // Round amount appropriately based on asset price magnitude
      amount = activeP > 1000 ? +rawAmount.toFixed(4) : activeP > 10 ? +rawAmount.toFixed(2) : Math.max(1, Math.round(rawAmount));
    } else {
      amount =
        signal.symbol === 'BTC/USDT' ? 0.25 :
        signal.symbol === 'ETH/USDT' ? 2 :
        signal.symbol === 'XAU/USDT' ? 1.5 :
        signal.symbol === 'BNB/USDT' ? 3 :
        signal.symbol === 'ZEC/USDT' ? 5 :
        signal.symbol === 'SOL/USDT' ? 10 :
        signal.symbol === 'HYPE/USDT' ? 20 :
        signal.symbol === 'XRP/USDT' ? 1000 :
        signal.symbol === 'DOGE/USDT' ? 10000 : 250;
    }

    handlePlaceOrder({
      symbol: signal.symbol,
      type: 'ai-smart',
      side: isBullish ? 'buy' : 'sell',
      price: activeP,
      amount,
      leverage,
      takeProfit: signal.target1,
      stopLoss: signal.stopLoss,
    });

    if (options?.isAutonomous) {
      showToast(
        `🤖 Auto-Trade Executed: ${signal.side} ${signal.symbol} @ $${activeP.toFixed(2)} | TP: $${signal.target1} | SL: $${signal.stopLoss}`,
        'success'
      );
    }

    if (!options?.isAutonomous && currentView === 'hero') {
      setCurrentView('terminal');
    }
  };

  useEffect(() => {
    handleExecuteSignalRef.current = handleExecuteSignal;
  });

  const handleAddNewSignal = (signal: AISignal) => {
    setAiSignals((prev) => [signal, ...prev]);
    setSelectedSignal(signal);
    if (signal.symbol !== currentPair) {
      handleSelectPair(signal.symbol);
    }
    showToast(`New AI Signal generated for ${signal.symbol}!`, 'success');
    setNotifications((prev) => [
      {
        id: `notif-sig-${Date.now()}`,
        title: `AI Signal: ${signal.symbol} (${signal.side})`,
        message: `${signal.confidence}% Conviction | Entry: $${signal.entryPrice} | TP1: $${signal.target1} | SL: $${signal.stopLoss}`,
        type: 'ai_signal',
        timestamp: Date.now(),
        read: false,
      },
      ...prev,
    ]);
  };

  const handleUpdateSignals = (signals: AISignal[]) => {
    setAiSignals(signals);
    if (signals.length > 0) {
      setSelectedSignal(signals[0]);
    }
    showToast(`Batch scan completed: ${signals.length} high-probability signals loaded!`, 'success');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Memoized handlers to prevent child re-render cascading
  const handleOpenAutoAlertsModal = useCallback(() => setIsAutoAlertModalOpen(true), []);
  const handleCloseAutoAlertsModal = useCallback(() => setIsAutoAlertModalOpen(false), []);
  const handleOpenCopilot = useCallback(() => setIsCopilotOpen(true), []);
  const handleCloseCopilot = useCallback(() => setIsCopilotOpen(false), []);
  const handleOpenNotifications = useCallback(() => setIsNotificationsOpen(true), []);
  const handleCloseNotifications = useCallback(() => setIsNotificationsOpen(false), []);
  const handleOpenPortfolio = useCallback(() => setIsPortfolioOpen(true), []);
  const handleClosePortfolio = useCallback(() => setIsPortfolioOpen(false), []);
  const handleReturnToHero = useCallback(() => setCurrentView('hero'), []);
  const handleOpenMarketOverview = useCallback(() => setCurrentView('overview'), []);
  const handleOpenInstallModal = useCallback(() => setIsInstallModalOpen(true), []);
  const handleCloseInstallModal = useCallback(() => setIsInstallModalOpen(false), []);
  const handleOpenEconomicCalendar = useCallback(() => setIsEcoCalendarOpen(true), []);
  const handleCloseEconomicCalendar = useCallback(() => setIsEcoCalendarOpen(false), []);
  const handleOpenApiSettings = useCallback(() => setIsApiConfigOpen(true), []);
  const handleCloseApiSettings = useCallback(() => setIsApiConfigOpen(false), []);
  const handleToggleCurrencyMode = useCallback(() => setCurrencyMode((prev) => (prev === 'USDT' ? 'INR' : 'USDT')), []);
  const handleOpenPipCalc = useCallback((sym?: AssetPair) => {
    setPipCalcSymbol(sym || currentPairRef.current);
    setIsPipCalculatorOpen(true);
  }, []);
  const handleToggleAutoExecution = useCallback(() => {
    setAutoAlertConfig((prev) => {
      const nextVal = !prev.autoExecutionEnabled;
      showToast(
        nextVal
          ? '🤖 Autonomous Auto Entry & Exit is now ON! AI signals will execute trades automatically.'
          : '⏸️ Autonomous Auto Trade is now OFF. Manual confirmation required.',
        nextVal ? 'success' : 'info'
      );
      return { ...prev, autoExecutionEnabled: nextVal };
    });
  }, [showToast]);

  return (
    <div className="w-full h-full min-h-screen bg-[#111417] text-[#e1e2e7] overflow-x-hidden">
      {/* Dynamic View rendering: Hero Showcase vs Market Overview Hub vs Full Obsidian Terminal */}
      {currentView === 'hero' ? (
        <HeroScreen
          tickers={tickers}
          onStartTrading={(symbol) => {
            if (symbol) handleSelectPair(symbol);
            setCurrentView('terminal');
          }}
          onOpenMarketOverview={handleOpenMarketOverview}
          onOpenPipCalculator={handleOpenPipCalc}
          onOpenCopilot={handleOpenCopilot}
          onOpenNotifications={handleOpenNotifications}
          onOpenAlertsModal={handleOpenAlertsModal}
          onOpenAutoAlertsModal={handleOpenAutoAlertsModal}
          autoAlertEnabled={autoAlertConfig.enabled}
          autoExecutionEnabled={autoAlertConfig.autoExecutionEnabled}
          onToggleAutoExecution={handleToggleAutoExecution}
          unreadNotifications={unreadCount}
          sentimentPercent={sentimentPercent}
          onOpenInstallModal={handleOpenInstallModal}
          currencyMode={currencyMode}
          onToggleCurrencyMode={handleToggleCurrencyMode}
          onResetPrices={handleResetAllPricesFromCoinDCX}
          isResettingPrices={isResettingPrices}
        />
      ) : currentView === 'overview' ? (
        <React.Suspense
          fallback={
            <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center font-mono text-sm text-[#94A3B8]">
              Loading Global Financial Markets...
            </div>
          }
        >
          <MarketOverviewDashboard
            tickers={tickers}
            currentPair={currentPair}
            onSelectPair={(symbol) => {
              handleSelectPair(symbol);
              setCurrentView('terminal');
            }}
            onOpenTerminal={(symbol) => {
              if (symbol) handleSelectPair(symbol);
              setCurrentView('terminal');
            }}
            onOpenAlertsModal={handleOpenAlertsModal}
            onOpenPipCalculator={handleOpenPipCalc}
            onOpenEconomicCalendar={handleOpenEconomicCalendar}
            onOpenApiSettings={handleOpenApiSettings}
          />
        </React.Suspense>
      ) : (
        <TradingTerminal
          currentPair={currentPair}
          tickers={tickers}
          candles={candles}
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          onSelectPair={handleSelectPair}
          bids={bids}
          asks={asks}
          recentTrades={recentTrades}
          lastTradeSide={lastTradeSide}
          positions={positions}
          openOrders={openOrders}
          orderHistory={orderHistory}
          aiSignals={aiSignals}
          activeSignal={selectedSignal}
          balance={balance}
          alerts={priceAlerts}
          onOpenAlertsModal={handleOpenAlertsModal}
          onOpenAutoAlertsModal={handleOpenAutoAlertsModal}
          autoAlertEnabled={autoAlertConfig.enabled}
          autoExecutionEnabled={autoAlertConfig.autoExecutionEnabled}
          onToggleAutoExecution={handleToggleAutoExecution}
          onPlaceOrder={handlePlaceOrder}
          onPlaceQuickTrade={handleQuickProfitTrade}
          onClosePosition={handleClosePosition}
          onCancelOrder={handleCancelOrder}
          onExecuteSignal={handleExecuteSignal}
          onOpenCopilot={handleOpenCopilot}
          onOpenNotifications={handleOpenNotifications}
          onOpenPortfolio={handleOpenPortfolio}
          onReturnToHero={handleReturnToHero}
          unreadNotifications={unreadCount}
          coindcxLatency={coindcxLatency}
          isCoinDCXLive={isCoinDCXLive}
          onResetCoinDCXPrices={handleResetAllPricesFromCoinDCX}
          isResettingPrices={isResettingPrices}
          onLoadMoreHistoricalCandles={handleLoadMoreHistoricalCandles}
          onOpenInstallModal={handleOpenInstallModal}
          onOpenMarketOverview={handleOpenMarketOverview}
          onOpenPipCalculator={handleOpenPipCalc}
          onOpenEconomicCalendar={handleOpenEconomicCalendar}
          onOpenApiSettings={handleOpenApiSettings}
          currencyMode={currencyMode}
          onToggleCurrencyMode={handleToggleCurrencyMode}
          currentMode={currentMode}
          onModeChange={handleModeChange}
          onRequestReviewOrder={handleRequestReviewOrder}
        />
      )}

      {/* Code-split dynamic modal overlays with zero impact on initial bundle (M-03) */}
      <React.Suspense fallback={null}>
        {/* Central Deliberate Order Review & Safety Confirmation Modal */}
        {isOrderReviewOpen && reviewOrderPayload && (
          <OrderReviewModal
            isOpen={isOrderReviewOpen}
            onClose={() => setIsOrderReviewOpen(false)}
            order={reviewOrderPayload}
            onConfirmOrder={handleConfirmOrder}
            currentMode={currentMode}
          />
        )}

        {/* Auto Alert Scanner Configuration & Radar Matrix Modal */}
        {isAutoAlertModalOpen && (
          <AutoAlertScannerModal
            isOpen={isAutoAlertModalOpen}
            onClose={handleCloseAutoAlertsModal}
            config={autoAlertConfig}
            onUpdateConfig={(updates) =>
              setAutoAlertConfig((prev) => ({ ...prev, ...updates }))
            }
            tickers={tickers}
            signals={aiSignals}
            onTriggerTestSignal={handleTriggerTestAutoSignal}
            onSelectAndTrade={handleSelectAndTradeSignal}
            lastScannedTime={lastScannedTime}
            totalAssetsMonitored={ALL_COINS_METADATA.length}
          />
        )}

        {/* AI Copilot Quantitative Strategy Drawer */}
        {isCopilotOpen && (
          <AiCopilotDrawer
            isOpen={isCopilotOpen}
            onClose={() => setIsCopilotOpen(false)}
            signals={aiSignals}
            currentPair={currentPair}
            tickers={tickers}
            onSelectPair={handleSelectPair}
            onExecuteSignal={handleExecuteSignal}
            onSelectSignalForChart={(sig) => {
              setSelectedSignal(sig);
              if (sig.symbol !== currentPair) {
                handleSelectPair(sig.symbol);
              }
            }}
            onAddNewSignal={handleAddNewSignal}
            onUpdateSignals={handleUpdateSignals}
            positions={positions}
            balance={balance}
            onClosePosition={handleClosePosition}
            onUpdatePositionSL={handleUpdatePositionSL}
            candles={candles}
          />
        )}

        {/* Notifications Drawer */}
        {isNotificationsOpen && (
          <NotificationDrawer
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            notifications={notifications}
            onMarkAllRead={() =>
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
            }
            onOpenAlertsModal={() => handleOpenAlertsModal()}
          />
        )}

        {/* Price Alert Management Modal */}
        {isAlertsModalOpen && (
          <PriceAlertModal
            isOpen={isAlertsModalOpen}
            onClose={() => setIsAlertsModalOpen(false)}
            alerts={priceAlerts}
            tickers={tickers}
            currentPair={currentPair}
            onSelectPair={(p) => setCurrentPair(p)}
            prefillSymbol={alertPrefillSymbol}
            prefillPrice={alertPrefillPrice}
            onCreateAlert={handleCreateAlert}
            onToggleAlert={handleToggleAlert}
            onDeleteAlert={handleDeleteAlert}
            onTriggerTestAlert={handleTriggerTestAlert}
          />
        )}

        {/* Portfolio / Treasury Deposit Modal */}
        {isPortfolioOpen && (
          <PortfolioModal
            isOpen={isPortfolioOpen}
            onClose={() => setIsPortfolioOpen(false)}
            balance={balance}
            onDeposit={(amt) => setBalance((prev) => prev + amt)}
            onReset={() => setBalance(100000)}
            orderHistory={orderHistory}
            positions={positions}
          />
        )}

        {/* Mobile App Install & PWA Guide Modal */}
        {isInstallModalOpen && (
          <MobileAppInstallModal
            isOpen={isInstallModalOpen}
            onClose={() => setIsInstallModalOpen(false)}
          />
        )}

        {/* Pip, Lot Size & Margin Calculator Modal */}
        {isPipCalculatorOpen && (
          <PipCalculatorModal
            isOpen={isPipCalculatorOpen}
            onClose={() => setIsPipCalculatorOpen(false)}
            currentPair={pipCalcSymbol || currentPair}
            tickers={tickers}
            onSelectPair={(sym) => {
              handleSelectPair(sym);
              setCurrentView('terminal');
            }}
          />
        )}

        {/* API Configuration & Market Simulator Modal */}
        {isApiConfigOpen && (
          <ApiConfigModal
            isOpen={isApiConfigOpen}
            onClose={() => setIsApiConfigOpen(false)}
          />
        )}

        {/* Global Macro & Economic Events Calendar Modal */}
        {isEcoCalendarOpen && (
          <EconomicCalendarModal
            isOpen={isEcoCalendarOpen}
            onClose={() => setIsEcoCalendarOpen(false)}
          />
        )}
      </React.Suspense>

      {/* In-App Action Toast Banner (M-05) */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-2xl backdrop-blur-md border border-[#272a2d] bg-[#14171a]/95 text-[#fff8f1] animate-in fade-in slide-in-from-top-2 duration-200">
          {toastMessage.type === 'error' && (
            <AlertTriangle className="w-4 h-4 text-[#ff3b4a] shrink-0" />
          )}
          {toastMessage.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-[#00ff94] shrink-0" />
          )}
          {toastMessage.type === 'info' && (
            <Info className="w-4 h-4 text-[#f6be16] shrink-0" />
          )}
          <span className="text-xs font-mono">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-1 text-[#99907f] hover:text-[#fff8f1] text-xs font-bold cursor-pointer"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
