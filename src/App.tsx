import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
} from './types';
import {
  INITIAL_TICKERS,
  generateSyntheticCandles,
  generateEarlierCandles,
  INITIAL_AI_SIGNALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PRICE_ALERTS,
  ALL_COINS_METADATA,
} from './data/marketData';
import {
  fetchCoinDCXTickers,
  fetchCoinDCXCandles,
  fetchCoinDCXOrderBook,
  getCoinDCXPairKey,
} from './services/coindcxService';
import { computeClientSignal } from './services/aiSignalService';
import { HeroScreen } from './components/HeroScreen';
import { TradingTerminal } from './components/TradingTerminal';
import { AiCopilotDrawer } from './components/AiCopilotDrawer';
import { NotificationDrawer } from './components/NotificationDrawer';
import { PortfolioModal } from './components/PortfolioModal';
import { PriceAlertModal } from './components/PriceAlertModal';
import { AutoAlertPopupBanner } from './components/AutoAlertPopupBanner';
import { AutoAlertScannerModal } from './components/AutoAlertScannerModal';
import { MobileAppInstallModal } from './components/MobileAppInstallModal';
import { playAlertChime, playSignalAlertSound, speakSignalAlert } from './utils/soundEffects';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // App View Mode ('hero' or 'terminal')
  const [currentView, setCurrentView] = useState<'hero' | 'terminal'>('hero');

  // Active Trading Pair
  const [currentPair, setCurrentPair] = useState<AssetPair>('ETH/USDT');
  const [timeframe, setTimeframe] = useState<string>('15m');

  // Market Data State
  const [tickers, setTickers] = useState<Record<AssetPair, TickerInfo>>(INITIAL_TICKERS);
  const [candles, setCandles] = useState<Candle[]>(() =>
    generateSyntheticCandles(INITIAL_TICKERS['ETH/USDT'].price, 80, '15m')
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
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [aiSignals, setAiSignals] = useState<AISignal[]>(INITIAL_AI_SIGNALS);
  const [selectedSignal, setSelectedSignal] = useState<AISignal | null>(INITIAL_AI_SIGNALS[0] || null);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);

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
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);

  const showToast = useCallback((text: string, type: 'error' | 'success' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  }, []);

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
            } else if (currentPrice >= alert.targetPrice && alert.initialPriceAtCreation < alert.targetPrice) {
              breached = true;
            }
          } else if (alert.condition === 'drops_below') {
            if (currentPrice <= alert.targetPrice && prevPrice > alert.targetPrice) {
              breached = true;
            } else if (currentPrice <= alert.targetPrice && alert.initialPriceAtCreation > alert.targetPrice) {
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
              playAlertChime();
            }

            try {
              confetti({
                particleCount: 60,
                spread: 70,
                origin: { y: 0.15, x: 0.8 },
                colors: ['#f6be16', '#00ff94', '#ffffff'],
              });
            } catch {}

            const actionDesc =
              alert.condition === 'rises_above'
                ? 'climbed above target'
                : alert.condition === 'drops_below'
                ? 'dropped below target'
                : 'crossed target threshold';

            setNotifications((prevNotifs) => [
              {
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
              },
              ...prevNotifs,
            ]);

            showToast(
              `🔔 Alert: ${alert.symbol} hit $${alert.targetPrice.toFixed(ticker.precision)}!`,
              'success'
            );

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

        return hasChanges ? updatedAlerts : prevAlerts;
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

      // 6. Actionable Notification Record
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

      // 7. Floating Actionable Popup Banner
      if (autoAlertConfig.popupAlerts) {
        setLatestAutoAlertSignal(signal);
      }

      // 8. Toast confirmation
      showToast(
        `⚡ Auto Signal: ${signal.symbol} ${signal.side} (${signal.confidence}% Confidence)`,
        signal.side === 'LONG' ? 'success' : 'info'
      );
    },
    [autoAlertConfig, showToast]
  );

  // Background Multi-Asset Signal Scanner Engine (checks all coins/stocks continuously)
  useEffect(() => {
    if (!autoAlertConfig.enabled) return;

    const scanInterval = Math.max(8, autoAlertConfig.scanIntervalSeconds || 15) * 1000;
    const intervalId = setInterval(() => {
      setLastScannedTime(Date.now());

      let candidateCoins = ALL_COINS_METADATA;
      if (autoAlertConfig.categoryFilter && autoAlertConfig.categoryFilter !== 'all') {
        candidateCoins = candidateCoins.filter(
          (c) => c.category === autoAlertConfig.categoryFilter
        );
      }
      if (autoAlertConfig.selectedSymbols && autoAlertConfig.selectedSymbols.length > 0) {
        candidateCoins = candidateCoins.filter((c) =>
          autoAlertConfig.selectedSymbols.includes(c.symbol)
        );
      }
      if (candidateCoins.length === 0) {
        candidateCoins = ALL_COINS_METADATA;
      }

      // Pick a coin to perform technical momentum scan
      const targetCoin = candidateCoins[Math.floor(Math.random() * candidateCoins.length)];
      const targetTicker = tickers[targetCoin.symbol];
      const currentPrice = targetTicker?.price || 100;

      const newSignal = computeClientSignal(
        targetCoin.symbol,
        currentPrice,
        '15m',
        'Breakout Momentum',
        'Balanced',
        autoAlertConfig.minConfidence,
        targetTicker ? {
          high24h: targetTicker.high24h,
          low24h: targetTicker.low24h,
          change24h: targetTicker.change24h,
          volume24h: targetTicker.volume24h,
        } : undefined
      );

      if (newSignal.confidence >= autoAlertConfig.minConfidence) {
        if (
          autoAlertConfig.sideFilter === 'ALL' ||
          autoAlertConfig.sideFilter === newSignal.side
        ) {
          triggerAutoAlert(newSignal, false);
        }
      }
    }, scanInterval);

    return () => clearInterval(intervalId);
  }, [autoAlertConfig, tickers, triggerAutoAlert]);

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

    const targetPrice = tickers[pair]?.price || INITIAL_TICKERS[pair]?.price || 25.0;
    const count = timeframe === '1s' || timeframe === '1m' ? 100 : timeframe === '1D' ? 45 : 80;
    setCandles(generateSyntheticCandles(targetPrice, count, timeframe));

    // Fetch live CoinDCX exchange candles (with cache-busting & reverse sorting)
    fetchCoinDCXCandles(pair, timeframe, count).then((liveCandles) => {
      if (liveCandles && liveCandles.length > 0) {
        setCandles(liveCandles);
      }
    });

    const matchedSig = aiSignals.find((s) => s.symbol === pair);
    if (matchedSig) {
      setSelectedSignal(matchedSig);
    }
  }, [tickers, timeframe, aiSignals]);

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
      const priceToUse = tickers[symbolToUse]?.price || 100;
      const testSignal = computeClientSignal(
        symbolToUse,
        priceToUse,
        '15m',
        'High Volume Breakout Test',
        'Balanced',
        Math.max(autoAlertConfig.minConfidence, 88)
      );
      triggerAutoAlert(testSignal, true);
    },
    [currentPair, tickers, autoAlertConfig.minConfidence, triggerAutoAlert]
  );

  // When switching timeframes, regenerate candle density & try live fetch
  const handleTimeframeChange = useCallback((tf: string) => {
    setTimeframe(tf);
    const targetPrice = tickers[currentPair]?.price || INITIAL_TICKERS[currentPair]?.price || 100;
    const count = tf === '1s' || tf === '1m' ? 140 : tf === '1D' ? 60 : 180;
    setCandles(generateSyntheticCandles(targetPrice, count, tf));

    fetchCoinDCXCandles(currentPair, tf, count).then((liveCandles) => {
      if (liveCandles && liveCandles.length > 0) {
        setCandles(liveCandles);
      }
    });
  }, [currentPair, tickers]);

  // Seamless historical back-data infinite generation
  const handleLoadMoreHistoricalCandles = useCallback(() => {
    setCandles((prev) => {
      if (prev.length === 0 || prev.length >= 1000) return prev;
      const firstCandle = prev[0];
      const earlier = generateEarlierCandles(firstCandle, 80, timeframe);
      return [...earlier, ...prev];
    });
  }, [timeframe]);

  // CoinDCX live polling & synchronizer (3s for tickers, 10s for candles)
  useEffect(() => {
    let isMounted = true;

    const syncCoinDCXTickers = async () => {
      const { tickers: liveTickers, latencyMs, success } = await fetchCoinDCXTickers();
      if (!isMounted) return;

      if (success && Object.keys(liveTickers).length > 0) {
        setCoindcxLatency(latencyMs);
        setIsCoinDCXLive(true);
        setTickers((prev) => {
          const merged = {
            ...prev,
            ...(liveTickers as Record<AssetPair, TickerInfo>),
          };
          checkPriceAlerts(merged);
          return merged;
        });

        // Actively synchronize the latest forming candlestick with the real CoinDCX price
        const livePrice = (liveTickers as Record<AssetPair, TickerInfo>)[currentPair]?.price;
        if (livePrice && livePrice > 0) {
          setCandles((prevCandles) => {
            if (prevCandles.length === 0) {
              return generateSyntheticCandles(livePrice, 80, timeframe);
            }
            const last = { ...prevCandles[prevCandles.length - 1] };
            last.close = livePrice;
            last.high = Math.max(last.high, livePrice);
            last.low = Math.min(last.low, livePrice);
            return [...prevCandles.slice(0, -1), last];
          });
        }
      }
    };

    const syncCoinDCXCandles = async () => {
      if (!isMounted) return;
      const count = timeframe === '1s' || timeframe === '1m' ? 100 : timeframe === '1D' ? 45 : 80;
      const liveCandles = await fetchCoinDCXCandles(currentPair, timeframe, count);
      if (isMounted && liveCandles && liveCandles.length > 0) {
        setCandles(liveCandles);
      }
    };

    const syncCoinDCXOrderBook = async () => {
      if (!isMounted) return;
      const ob = await fetchCoinDCXOrderBook(currentPair);
      if (isMounted && ob && (ob.bids.length > 0 || ob.asks.length > 0)) {
        setLiveOrderBook(ob);
      }
    };

    // Initial fetch on mount / pair / timeframe change
    syncCoinDCXTickers();
    syncCoinDCXCandles();
    syncCoinDCXOrderBook();

    // Polling: 2.5 seconds for tickers (within 2-3s real-time synchronization rule)
    const tickerInterval = setInterval(syncCoinDCXTickers, 2500);
    // Polling: 10 seconds for candles (within 10s rule to prevent rate limits)
    const candleInterval = setInterval(syncCoinDCXCandles, 10000);
    // Polling: 4 seconds for order book
    const orderBookInterval = setInterval(syncCoinDCXOrderBook, 4000);

    return () => {
      isMounted = false;
      clearInterval(tickerInterval);
      clearInterval(candleInterval);
      clearInterval(orderBookInterval);
    };
  }, [currentPair, timeframe]);

  // Reset all prices directly from CoinDCX handler
  const handleResetAllPricesFromCoinDCX = useCallback(async () => {
    setIsResettingPrices(true);
    showToast('Connecting to CoinDCX live ticker exchange...', 'info');

    try {
      const { tickers: freshTickers, latencyMs, success } = await fetchCoinDCXTickers();
      if (success && Object.keys(freshTickers).length > 0) {
        setCoindcxLatency(latencyMs);
        setIsCoinDCXLive(true);
        setTickers((prev) => ({
          ...prev,
          ...(freshTickers as Record<AssetPair, TickerInfo>),
        }));

        // Reset candle base price for current active pair
        const newPrice = freshTickers[currentPair]?.price || tickers[currentPair]?.price || 100;
        setCandles(generateSyntheticCandles(newPrice, 80, timeframe));

        showToast('All asset prices & candlestick charts synced with CoinDCX!', 'success');
        setNotifications((prev) => [
          {
            id: `notif-reset-${Date.now()}`,
            title: 'Prices Reset: CoinDCX Feed Synced',
            message: `Updated all pairs with fresh CoinDCX live order book prices (${latencyMs}ms).`,
            type: 'system',
            timestamp: Date.now(),
            read: false,
          },
          ...prev,
        ]);
      } else {
        setTickers(INITIAL_TICKERS);
        const newPrice = INITIAL_TICKERS[currentPair]?.price || 100;
        setCandles(generateSyntheticCandles(newPrice, 80, timeframe));
        showToast('Prices reset to current CoinDCX baseline prices.', 'success');
      }
    } catch {
      setTickers(INITIAL_TICKERS);
      showToast('Prices reset to CoinDCX baseline values.', 'info');
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
    for (let i = 1; i <= 14; i++) {
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
    for (let i = 14; i >= 1; i--) {
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

  // Real-time market simulation engine (Micro trade feed & position monitor)
  useEffect(() => {
    const interval = setInterval(() => {
      const activeP = tickers[currentPair]?.price || 100;
      const precision = tickers[currentPair]?.precision ?? 2;

      // Only apply synthetic drift to ticker prices if CoinDCX feed is offline
      if (!isCoinDCXLive) {
        let latestCurrentPrice = 0;
        setTickers((prev) => {
          const next = { ...prev };
          const pairs = Object.keys(next) as AssetPair[];

          pairs.forEach((pair) => {
            const t = next[pair];
            if (!t) return;
            const volatility = t.price * 0.0002;
            const delta = (Math.random() - 0.5) * volatility;
            const newPrice = Math.max(0.00001, Number((t.price + delta).toFixed(t.precision)));

            next[pair] = {
              ...t,
              price: newPrice,
              high24h: Math.max(t.high24h, newPrice),
              low24h: Math.min(t.low24h, newPrice),
            };

            if (pair === currentPair) {
              latestCurrentPrice = newPrice;
            }
          });

          checkPriceAlerts(next);
          return next;
        });

        // Update Candlestick array for offline mode
        setCandles((prevCandles) => {
          if (prevCandles.length === 0) return prevCandles;
          const currentP = latestCurrentPrice || activeP;
          const lastCandle = { ...prevCandles[prevCandles.length - 1] };

          lastCandle.close = currentP;
          lastCandle.high = Math.max(lastCandle.high, currentP);
          lastCandle.low = Math.min(lastCandle.low, currentP);
          lastCandle.volume += Math.floor(Math.random() * 5 + 1);

          return [...prevCandles.slice(0, -1), lastCandle];
        });
      }

      // Generate live trade tape executions around current genuine price
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
        ...prevTrades.slice(0, 24),
      ]);

      // Update active positions' mark price & evaluate Take Profit / Stop Loss / Trailing SL
      setPositions((prevPositions) => {
        const remainingPositions: Position[] = [];

        prevPositions.forEach((pos) => {
          const currentP = tickers[pos.symbol]?.price || pos.markPrice;
          let newPeak = pos.peakPrice || pos.entryPrice;

          if (pos.side === 'long') {
            newPeak = Math.max(newPeak, currentP);
          } else {
            newPeak = Math.min(newPeak, currentP);
          }

          let autoCloseReason: string | null = null;

          // Check Take Profit
          if (pos.takeProfit) {
            if (pos.side === 'long' && currentP >= pos.takeProfit) {
              autoCloseReason = `Take Profit hit @ $${currentP.toFixed(2)}`;
            } else if (pos.side === 'short' && currentP <= pos.takeProfit) {
              autoCloseReason = `Take Profit hit @ $${currentP.toFixed(2)}`;
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
            setBalance((b) => Math.max(0, b + pos.margin + pnl));
            setNotifications((n) => [
              {
                id: `notif-autoclose-${Date.now()}`,
                title: `Auto-Executed: ${pos.symbol} ${pos.side.toUpperCase()}`,
                message: `${autoCloseReason}. PnL: ${pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`}`,
                type: 'order',
                timestamp: Date.now(),
                read: false,
              },
              ...n,
            ]);
            showToast(`${autoCloseReason} on ${pos.symbol}`, pnl >= 0 ? 'success' : 'info');
          } else {
            remainingPositions.push({
              ...pos,
              markPrice: currentP,
              peakPrice: newPeak,
            });
          }
        });

        return remainingPositions;
      });

      // Fluctuate AI Sentiment slightly (82% - 94%)
      setSentimentPercent((prev) => {
        const change = (Math.random() - 0.5) * 0.8;
        return Math.min(96, Math.max(78, Math.round(prev + change)));
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [currentPair, tickers]);

  // Order Placement Handler
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
    const total = orderParams.price * orderParams.amount;
    const requiredMargin = total / orderParams.leverage;

    if (requiredMargin > balance) {
      showToast('Insufficient available margin in demo wallet.', 'error');
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
      leverage: orderParams.leverage,
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

  // Execute AI Signal Handler (1-Click Execution with Entry, TP, SL)
  const handleExecuteSignal = (signal: AISignal) => {
    const isBullish = signal.side === 'LONG';
    const activeP = tickers[signal.symbol]?.price || signal.entryPrice || signal.entryRange[0];

    // Automatically switch chart to signal symbol
    if (signal.symbol !== currentPair) {
      handleSelectPair(signal.symbol);
    }
    setSelectedSignal(signal);

    const amount =
      signal.symbol === 'BTC/USDT' ? 0.25 :
      signal.symbol === 'ETH/USDT' ? 2 :
      signal.symbol === 'XAU/USDT' ? 1.5 :
      signal.symbol === 'BNB/USDT' ? 3 :
      signal.symbol === 'ZEC/USDT' ? 5 :
      signal.symbol === 'SOL/USDT' ? 10 :
      signal.symbol === 'HYPE/USDT' ? 20 :
      signal.symbol === 'XRP/USDT' ? 1000 :
      signal.symbol === 'DOGE/USDT' ? 10000 : 250;

    handlePlaceOrder({
      symbol: signal.symbol,
      type: 'ai-smart',
      side: isBullish ? 'buy' : 'sell',
      price: activeP,
      amount,
      leverage: signal.recommendedLeverage || 15,
      takeProfit: signal.target1,
      stopLoss: signal.stopLoss,
    });

    if (currentView === 'hero') {
      setCurrentView('terminal');
    }
  };

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

  return (
    <div className="w-full h-full min-h-screen bg-[#111417] text-[#e1e2e7] overflow-x-hidden">
      {/* Dynamic View rendering: Hero Showcase vs Full Obsidian Terminal */}
      {currentView === 'hero' ? (
        <HeroScreen
          tickers={tickers}
          onStartTrading={(symbol) => {
            if (symbol) handleSelectPair(symbol);
            setCurrentView('terminal');
          }}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenAlertsModal={() => handleOpenAlertsModal()}
          onOpenAutoAlertsModal={() => setIsAutoAlertModalOpen(true)}
          autoAlertEnabled={autoAlertConfig.enabled}
          unreadNotifications={unreadCount}
          sentimentPercent={sentimentPercent}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />
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
          onOpenAutoAlertsModal={() => setIsAutoAlertModalOpen(true)}
          autoAlertEnabled={autoAlertConfig.enabled}
          onPlaceOrder={handlePlaceOrder}
          onClosePosition={handleClosePosition}
          onCancelOrder={handleCancelOrder}
          onExecuteSignal={handleExecuteSignal}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenPortfolio={() => setIsPortfolioOpen(true)}
          onReturnToHero={() => setCurrentView('hero')}
          unreadNotifications={unreadCount}
          coindcxLatency={coindcxLatency}
          isCoinDCXLive={isCoinDCXLive}
          onResetCoinDCXPrices={handleResetAllPricesFromCoinDCX}
          isResettingPrices={isResettingPrices}
          onLoadMoreHistoricalCandles={handleLoadMoreHistoricalCandles}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />
      )}

      {/* Floating Actionable Auto-Alert Banner */}
      <AutoAlertPopupBanner
        signal={latestAutoAlertSignal}
        ticker={latestAutoAlertSignal ? tickers[latestAutoAlertSignal.symbol] : undefined}
        onDismiss={() => setLatestAutoAlertSignal(null)}
        onSelectAndTrade={handleSelectAndTradeSignal}
        onOpenAutoAlertSettings={() => setIsAutoAlertModalOpen(true)}
      />

      {/* Auto Alert Scanner Configuration & Radar Matrix Modal */}
      <AutoAlertScannerModal
        isOpen={isAutoAlertModalOpen}
        onClose={() => setIsAutoAlertModalOpen(false)}
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

      {/* AI Copilot Quantitative Strategy Drawer */}
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
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onOpenAlertsModal={() => handleOpenAlertsModal()}
      />

      {/* Price Alert Management Modal */}
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

      {/* Portfolio / Treasury Deposit Modal */}
      <PortfolioModal
        isOpen={isPortfolioOpen}
        onClose={() => setIsPortfolioOpen(false)}
        balance={balance}
        onDeposit={(amt) => setBalance((prev) => prev + amt)}
        onReset={() => setBalance(100000)}
      />

      {/* Mobile App Install & PWA Guide Modal */}
      <MobileAppInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* In-App Toast Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded shadow-2xl backdrop-blur-md border transition-all animate-bounce bg-[#191c1f]/95 border-[#f6be16]/50 text-[#fff8f1]">
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
        </div>
      )}
    </div>
  );
}
