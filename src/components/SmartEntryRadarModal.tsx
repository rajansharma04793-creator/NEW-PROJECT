import React, { useState, useEffect, useMemo } from 'react';
import { AssetPair, TickerInfo, AISignal, ProductTradingMode, OrderReviewPayload } from '../types';
import { ALL_COINS_METADATA, INITIAL_TICKERS, generateSyntheticCandles } from '../data/marketData';
import { calculateCPR } from '../utils/indicators';
import {
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Shield,
  Compass,
  Play,
  Copy,
  Check,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Volume2,
  X,
  Sparkles,
  Sliders,
  BarChart2,
  DollarSign,
  Maximize2,
  Radio,
  Lock,
  Unlock,
} from 'lucide-react';

export type EntryTimingStatus =
  | 'ENTER_MARKET_NOW'      // 🟢 Price is in optimal entry sweet-spot
  | 'PLACE_LIMIT_PULLBACK'  // ⏳ Price is ahead, place limit order at pullback level
  | 'WAIT_CANDLE_CLOSE'     // ⏱️ Wait for 15m candle close confirmation
  | 'OVEREXTENDED_WAIT';    // 🛑 Price moved too far, don't chase FOMO

export interface SmartEntryPlan {
  symbol: AssetPair;
  side: 'BUY' | 'SELL';
  status: EntryTimingStatus;
  statusTitle: string;
  statusBadgeColor: string;
  livePrice: number;
  entryPrice: number;
  entryType: 'market' | 'limit';
  pullbackDistancePercent: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward: string;
  riskPercent: number;
  recommendedLeverage: number;
  candleSecondsRemaining: number;
  triggerLevel: number;
  hindiActionStep: string;
  englishActionStep: string;
  strategyName: string;
}

const getTimeframePeriodSeconds = (tf: string): number => {
  switch (tf) {
    case '1s': return 1;
    case '1m': return 60;
    case '3m': return 180;
    case '5m': return 300;
    case '15m': return 900;
    case '30m': return 1800;
    case '1h': return 3600;
    case '2h': return 7200;
    case '4h': return 14400;
    case '1D': return 86400;
    default: return 900;
  }
};

const getRemainingSecondsForTimeframe = (tf: string): number => {
  const period = getTimeframePeriodSeconds(tf);
  const now = Math.floor(Date.now() / 1000);
  const elapsed = now % period;
  return Math.max(1, period - elapsed);
};

const formatCandleTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const formatCandleTimeText = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

interface SmartEntryRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: AssetPair;
  tickers: Record<AssetPair, TickerInfo>;
  balance: number;
  currentTimeframe?: string;
  onSelectPair: (pair: AssetPair) => void;
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
  currentMode?: ProductTradingMode;
  onRequestReviewOrder?: (payload: OrderReviewPayload) => void;
}

export const SmartEntryRadarModal: React.FC<SmartEntryRadarModalProps> = ({
  isOpen,
  onClose,
  currentPair,
  tickers,
  balance,
  currentTimeframe = '15m',
  currentMode = 'PAPER',
  onRequestReviewOrder,
  onSelectPair,
  onPlaceOrder,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<AssetPair>(currentPair);
  const [timeframe, setTimeframe] = useState<string>(currentTimeframe);
  const [directionMode, setDirectionMode] = useState<'AUTO' | 'BUY' | 'SELL'>('AUTO');
  const [selectedPercent, setSelectedPercent] = useState<number>(25);
  const [copied, setCopied] = useState<boolean>(false);
  const [orderExecutedSuccess, setOrderExecutedSuccess] = useState<boolean>(false);
  const [candleSeconds, setCandleSeconds] = useState<number>(() => getRemainingSecondsForTimeframe(currentTimeframe));
  const [showTrendEducation, setShowTrendEducation] = useState<boolean>(false);
  const [isPlanFrozen, setIsPlanFrozen] = useState<boolean>(false);
  const [frozenPlan, setFrozenPlan] = useState<SmartEntryPlan | null>(null);

  // Keep selectedAsset in sync when currentPair changes
  useEffect(() => {
    if (currentPair) setSelectedAsset(currentPair);
  }, [currentPair]);

  // Synchronize initial currentTimeframe if passed from outside
  useEffect(() => {
    if (currentTimeframe) {
      setTimeframe(currentTimeframe);
      setCandleSeconds(getRemainingSecondsForTimeframe(currentTimeframe));
    }
  }, [currentTimeframe]);

  // Live Candle Timer Countdown strictly synchronized with real UTC clock & selected timeframe
  useEffect(() => {
    setCandleSeconds(getRemainingSecondsForTimeframe(timeframe));

    const timer = setInterval(() => {
      setCandleSeconds(getRemainingSecondsForTimeframe(timeframe));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeframe]);

  const activeTicker = tickers[selectedAsset] || INITIAL_TICKERS[selectedAsset] || {
    symbol: selectedAsset,
    price: 2420,
    change24h: 1.5,
    high24h: 2490,
    low24h: 2380,
    volume24h: 1000000,
    precision: 2,
  };

  const precision = activeTicker.precision || (activeTicker.price > 100 ? 2 : 4);
  const livePrice = activeTicker.price;
  const high24h = activeTicker.high24h || livePrice * 1.025;
  const low24h = activeTicker.low24h || livePrice * 0.975;

  // Calculate CPR Geometry & Dynamic Technical Entry Timing
  const smartPlan: SmartEntryPlan = useMemo(() => {
    const candles = generateSyntheticCandles(livePrice, 48, timeframe);
    const cpr = calculateCPR(candles) || {
      pivot: (high24h + low24h + livePrice) / 3,
      tc: 0,
      bc: (high24h + low24h) / 2,
      tcActual: 0,
      bcActual: 0,
      cprWidthPercent: 0.5,
      r1: 0,
      s1: 0,
      r2: 0,
      s2: 0,
    };

    const pivot = cpr.pivot;
    const tcActual = cpr.tcActual || (pivot + (pivot - (high24h + low24h) / 2));
    const bcActual = cpr.bcActual || ((high24h + low24h) / 2);
    const r1 = cpr.r1 || 2 * pivot - low24h;
    const s1 = cpr.s1 || 2 * pivot - high24h;
    const r2 = cpr.r2 || pivot + (high24h - low24h);
    const s2 = cpr.s2 || pivot - (high24h - low24h);

    // Confluence Trend Calculation:
    // If price is below pivot & 24h change is negative -> strictly BEARISH
    const isStrictBearish = livePrice < pivot || activeTicker.change24h < 0 || livePrice < bcActual;
    
    let isBullishBias = !isStrictBearish;
    if (directionMode === 'BUY') {
      isBullishBias = true;
    } else if (directionMode === 'SELL') {
      isBullishBias = false;
    }

    const side: 'BUY' | 'SELL' = isBullishBias ? 'BUY' : 'SELL';

    let status: EntryTimingStatus = 'ENTER_MARKET_NOW';
    let statusTitle = '🟢 ENTER NOW (MARKET ORDER)';
    let statusBadgeColor = 'bg-[#00ff94]/20 border-[#00ff94] text-[#00ff94]';
    let entryPrice = livePrice;
    let entryType: 'market' | 'limit' = 'market';
    let pullbackDistancePercent = 0;
    let stopLoss = isBullishBias ? bcActual : tcActual;
    let takeProfit1 = isBullishBias ? r1 : s1;
    let takeProfit2 = isBullishBias ? r2 : s2;
    let recommendedLeverage = 2; // Capped at safe beginner leverage under mandate
    let hindiAction = '';
    let englishAction = '';
    let strategyName = '';

    // Measure distance from sweet spot (TC for Long, BC for Short)
    const distanceToTC = ((livePrice - tcActual) / tcActual) * 100;
    const distanceToBC = ((bcActual - livePrice) / bcActual) * 100;

    if (isBullishBias) {
      // If user selected BUY but market is strictly down, note that it's a Dip Buy / Reversal scalp
      if (isStrictBearish) {
        strategyName = 'Oversold Dip-Buying / Support Bounce (Counter-Trend)';
      } else {
        strategyName = 'CPR Bullish Breakout + EMA 20 Momentum';
      }

      if (distanceToTC >= -0.3 && distanceToTC <= 0.4) {
        // Price is right around Top Central Breakout
        status = 'ENTER_MARKET_NOW';
        statusTitle = '🟢 PERFECT BUY ZONE (ENTER NOW)';
        statusBadgeColor = 'bg-[#00ff94]/20 border-[#00ff94] text-[#00ff94]';
        entryPrice = livePrice;
        entryType = 'market';
        stopLoss = Number((Math.min(bcActual, livePrice * 0.985)).toFixed(precision));
        takeProfit1 = Number(r1.toFixed(precision));
        takeProfit2 = Number(r2.toFixed(precision));
        hindiAction = isStrictBearish 
          ? 'Market girne ke baad support level par hai. Yahan se bounce aane par MARKET BUY le sakte hain. Stop Loss zaroor lagayein!'
          : 'Price optimal breakout level par hai. Seedha MARKET BUY karein aur niche diye Stop Loss ko strictly lagayein.';
        englishAction = 'Price is resting directly in the optimal breakout sweet-spot. Execute MARKET BUY instantly with tight stop loss.';
      } else if (distanceToTC > 0.4 && distanceToTC <= 2.0) {
        // Price moved ahead, wait for pullback limit order
        status = 'PLACE_LIMIT_PULLBACK';
        statusTitle = '⏳ PLACE LIMIT BUY (WAIT FOR PULLBACK)';
        statusBadgeColor = 'bg-[#ffd87f]/20 border-[#ffd87f] text-[#ffd87f]';
        entryPrice = Number((tcActual * 1.002).toFixed(precision));
        entryType = 'limit';
        pullbackDistancePercent = +(distanceToTC - 0.2).toFixed(2);
        stopLoss = Number((bcActual * 0.994).toFixed(precision));
        takeProfit1 = Number(r1.toFixed(precision));
        takeProfit2 = Number(r2.toFixed(precision));
        hindiAction = `Price thoda upar nikal chuka hai (+${pullbackDistancePercent}%). Upar FOMO buy mat karein! $${entryPrice} par LIMIT BUY lagakar pullback ka wait karein.`;
        englishAction = `Price is currently stretched (+${pullbackDistancePercent}%). Avoid chasing. Place a pending LIMIT BUY order at $${entryPrice} and wait for the retest.`;
      } else if (distanceToTC < -0.3 && livePrice > pivot) {
        // Between Pivot & TC, wait for candle close above TC
        status = 'WAIT_CANDLE_CLOSE';
        statusTitle = '⏱️ WAIT FOR CANDLE CLOSE CONFIRMATION';
        statusBadgeColor = 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8]';
        entryPrice = Number((tcActual * 1.001).toFixed(precision));
        entryType = 'limit';
        stopLoss = Number((pivot * 0.995).toFixed(precision));
        takeProfit1 = Number(r1.toFixed(precision));
        takeProfit2 = Number(r2.toFixed(precision));
        hindiAction = `${timeframe} candle ko Top Central ($${tcActual.toFixed(precision)}) ke upar green close hone dein (${formatCandleTimeText(candleSeconds)} baki). Close hote hi entry lein.`;
        englishAction = `Wait for the current ${timeframe} candle to close decisively above TC ($${tcActual.toFixed(precision)}) before pulling the trigger.`;
      } else {
        // Too extended or deep in dip
        status = 'ENTER_MARKET_NOW';
        statusTitle = '🟢 SUPPORT DIP BUY (ENTER NOW)';
        statusBadgeColor = 'bg-[#00ff94]/20 border-[#00ff94] text-[#00ff94]';
        entryPrice = livePrice;
        entryType = 'market';
        stopLoss = Number((livePrice * 0.985).toFixed(precision));
        takeProfit1 = Number((livePrice * 1.03).toFixed(precision));
        takeProfit2 = Number((livePrice * 1.06).toFixed(precision));
        hindiAction = `Dip Buying Zone: Market down hone par Support ($${s1.toFixed(precision)}) se bounce capture karne ke liye BUY entry. SL: $${stopLoss}.`;
        englishAction = 'Support Dip Entry: Buying oversold bounce with calculated stop loss.';
      }
    } else {
      // Bearish Short Setup
      strategyName = 'CPR Resistance Rejection + Downtrend Supply Breakdown';

      if (distanceToBC >= -0.3 && distanceToBC <= 0.4) {
        status = 'ENTER_MARKET_NOW';
        statusTitle = '🔴 PERFECT SHORT / SELL ZONE (DOWNTREND)';
        statusBadgeColor = 'bg-[#ff3b4a]/20 border-[#ff3b4a] text-[#ff3b4a]';
        entryPrice = livePrice;
        entryType = 'market';
        stopLoss = Number((Math.max(tcActual, livePrice * 1.015)).toFixed(precision));
        takeProfit1 = Number(s1.toFixed(precision));
        takeProfit2 = Number(s2.toFixed(precision));
        hindiAction = 'Market down ja raha hai aur breakdown zone par hai. Seedha MARKET SHORT (SELL) karein aur Stop Loss BC ke upar rakhein.';
        englishAction = 'Price is in active breakdown zone in a down-trending market. Execute MARKET SHORT immediately.';
      } else if (distanceToBC > 0.4 && distanceToBC <= 2.0) {
        status = 'PLACE_LIMIT_PULLBACK';
        statusTitle = '⏳ PLACE LIMIT SHORT (WAIT FOR RETEST)';
        statusBadgeColor = 'bg-[#ffd87f]/20 border-[#ffd87f] text-[#ffd87f]';
        entryPrice = Number((bcActual * 0.998).toFixed(precision));
        entryType = 'limit';
        pullbackDistancePercent = +(distanceToBC - 0.2).toFixed(2);
        stopLoss = Number((tcActual * 1.006).toFixed(precision));
        takeProfit1 = Number(s1.toFixed(precision));
        takeProfit2 = Number(s2.toFixed(precision));
        hindiAction = `Market gir chuka hai (-${pullbackDistancePercent}%). Seedha niche mat bechein, $${entryPrice} par LIMIT SHORT (SELL) lagayein taaki thoda upar aane par best entry mile.`;
        englishAction = `Price is stretched downwards (-${pullbackDistancePercent}%). Place a pending LIMIT SHORT at $${entryPrice} for high-probability retest entry.`;
      } else {
        status = 'ENTER_MARKET_NOW';
        statusTitle = '🔴 ACTIVE SHORT DOWNTREND (SELL NOW)';
        statusBadgeColor = 'bg-[#ff3b4a]/20 border-[#ff3b4a] text-[#ff3b4a]';
        entryPrice = livePrice;
        entryType = 'market';
        stopLoss = Number((livePrice * 1.015).toFixed(precision));
        takeProfit1 = Number(s1.toFixed(precision));
        takeProfit2 = Number(s2.toFixed(precision));
        hindiAction = `Market Red / Down chal raha hai. Trend ke sath chalne ke liye SHORT (SELL) karein. Target 1: $${takeProfit1}, SL: $${stopLoss}.`;
        englishAction = `Down-trending market continuation. Enter SHORT with trend.`;
      }
    }

    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit1 - entryPrice);
    const rrRatio = risk > 0 ? (reward / risk).toFixed(1) : '2.2';

    return {
      symbol: selectedAsset,
      side,
      status,
      statusTitle,
      statusBadgeColor,
      livePrice,
      entryPrice,
      entryType,
      pullbackDistancePercent,
      stopLoss,
      takeProfit1,
      takeProfit2,
      riskReward: `1 : ${rrRatio}`,
      riskPercent: +(Math.abs((entryPrice - stopLoss) / entryPrice) * 100).toFixed(2),
      recommendedLeverage,
      candleSecondsRemaining: candleSeconds,
      triggerLevel: isBullishBias ? tcActual : bcActual,
      hindiActionStep: hindiAction,
      englishActionStep: englishAction,
      strategyName,
    };
  }, [selectedAsset, livePrice, high24h, low24h, activeTicker.change24h, timeframe, precision, candleSeconds, directionMode]);

  // Use frozen snapshot if user clicked "Lock/Freeze Plan", otherwise live calculated plan
  const activePlan: SmartEntryPlan = (isPlanFrozen && frozenPlan) ? frozenPlan : smartPlan;

  const toggleFreezePlan = () => {
    if (isPlanFrozen) {
      setIsPlanFrozen(false);
      setFrozenPlan(null);
    } else {
      setIsPlanFrozen(true);
      setFrozenPlan(smartPlan);
    }
  };

  // Position Size Calculation based on Selected Balance %
  const marginUsd = (balance * (selectedPercent / 100)) || 250;
  const totalPositionSizeUsd = marginUsd * activePlan.recommendedLeverage;
  const coinAmount = activePlan.entryPrice > 0 ? +(totalPositionSizeUsd / activePlan.entryPrice).toFixed(3) : 0.1;
  const riskAmountUsd = +((Math.abs(activePlan.entryPrice - activePlan.stopLoss) / activePlan.entryPrice) * totalPositionSizeUsd).toFixed(2);
  const rewardAmountUsd = +((Math.abs(activePlan.takeProfit1 - activePlan.entryPrice) / activePlan.entryPrice) * totalPositionSizeUsd).toFixed(2);

  const handle1ClickExecute = (executionType: 'market' | 'limit' = activePlan.entryType) => {
    if (currentMode === 'RESEARCH') return;

    // 1. Sync pair with active terminal chart
    onSelectPair(activePlan.symbol);

    const execPrice = executionType === 'market' ? activePlan.livePrice : activePlan.entryPrice;
    const side = activePlan.side.toLowerCase() as 'buy' | 'sell';
    const lev = Math.min(activePlan.recommendedLeverage || 2, 3);
    const safeAmount = coinAmount > 0 ? coinAmount : 0.1;
    const reqMargin = +((safeAmount * execPrice) / lev).toFixed(2);

    if (onRequestReviewOrder) {
      onRequestReviewOrder({
        idempotencyKey: `ORD-RADAR-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        symbol: activePlan.symbol,
        market: 'Perpetual Futures',
        side,
        quantity: safeAmount,
        orderType: executionType,
        entryPrice: execPrice,
        currentMarketPrice: activePlan.livePrice,
        leverage: lev,
        marginMode: 'cross',
        requiredMargin: reqMargin,
        tradingFeeEstimate: +(safeAmount * execPrice * 0.0004).toFixed(4),
        fundingEstimate: +(safeAmount * execPrice * 0.0001).toFixed(4),
        spreadEstimate: +(safeAmount * execPrice * 0.0002).toFixed(4),
        slippageEstimate: +(safeAmount * execPrice * 0.0002).toFixed(4),
        maxPlannedLoss: +(Math.abs(execPrice - activePlan.stopLoss) * safeAmount).toFixed(2),
        takeProfit: activePlan.takeProfit1,
        stopLoss: activePlan.stopLoss,
        estimatedLiqPrice: side === 'buy' ? +(execPrice * (1 - 1 / lev + 0.004)).toFixed(2) : +(execPrice * (1 + 1 / lev - 0.004)).toFixed(2),
        accountBalanceAfterTrade: Math.max(0, +(balance - reqMargin).toFixed(2)),
        remainingBuyingPower: Math.max(0, +(balance - reqMargin).toFixed(2)),
        dataSource: 'Unified Real-Time Exchange Feed',
        dataTimestamp: Date.now(),
        isDataStale: false,
      });
      onClose();
      return;
    }

    // 2. Place Order fallback
    onPlaceOrder({
      symbol: activePlan.symbol,
      type: executionType,
      side,
      price: execPrice,
      amount: safeAmount,
      leverage: lev,
      takeProfit: activePlan.takeProfit1,
      stopLoss: activePlan.stopLoss,
    });

    setOrderExecutedSuccess(true);
    setTimeout(() => {
      setOrderExecutedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleOpenOnChart = () => {
    onSelectPair(activePlan.symbol);
    onClose();
  };

  const handleCopySetup = () => {
    const text = `🎯 ${activePlan.symbol} SMART ENTRY PLAN:
• Action: ${activePlan.side} (${activePlan.statusTitle})
• Entry Price: $${activePlan.entryPrice} (${activePlan.entryType.toUpperCase()})
• Stop Loss: $${activePlan.stopLoss} (Risk: ${activePlan.riskPercent}%)
• Target 1: $${activePlan.takeProfit1} (50% partials)
• Target 2: $${activePlan.takeProfit2} (Runner)
• Risk/Reward: ${activePlan.riskReward}
• Leverage: ${activePlan.recommendedLeverage}x
• Guidance: ${activePlan.hindiActionStep}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#111417] border border-[#272a2d] w-full max-w-4xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-[#161a1e] border-b border-[#272a2d] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00ff94]/15 border border-[#00ff94]/40 flex items-center justify-center text-[#00ff94] shadow-[0_0_15px_rgba(0,255,148,0.25)]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-mono text-white tracking-wide">
                  SMART ENTRY & TIMING RADAR
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ffd87f]/20 text-[#ffd87f] border border-[#ffd87f]/40 animate-pulse">
                  KAB ENTRY LU?
                </span>
              </div>
              <p className="text-xs text-[#99907f]">
                Institutional Entry Timing, Live Confirmation Counter & 1-Click Execution Setup
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Timeframe selector */}
            <div className="flex bg-[#1c2024] p-1 rounded-lg border border-[#272a2d]">
              {['1m', '5m', '15m', '1h', '4h', '1D'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 py-0.5 text-xs font-mono rounded cursor-pointer transition-all ${
                    timeframe === tf ? 'bg-[#00ff94] text-[#002111] font-bold shadow-xs' : 'text-[#99907f] hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#1c2024] border border-[#272a2d] text-[#99907f] hover:text-white hover:bg-[#ff3b4a]/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Multi-Asset Ribbon */}
        <div className="bg-[#0e1114] border-b border-[#272a2d] px-3 py-2 flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <span className="text-[#99907f] text-[11px] shrink-0">Track Asset:</span>
          {ALL_COINS_METADATA.slice(0, 10).map((coin) => {
            const isSelected = selectedAsset === coin.symbol;
            const t = tickers[coin.symbol] || INITIAL_TICKERS[coin.symbol];
            const isUp = (t?.change24h || 0) >= 0;

            return (
              <button
                key={coin.symbol}
                onClick={() => {
                  setSelectedAsset(coin.symbol);
                  onSelectPair(coin.symbol);
                }}
                className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shrink-0 transition-all ${
                  isSelected
                    ? 'bg-[#00ff94]/15 border-[#00ff94] text-white font-bold'
                    : 'bg-[#15191d] border-[#272a2d] text-[#99907f] hover:text-white'
                }`}
              >
                <span>{coin.symbol.split('/')[0]}</span>
                <span className={`text-[10px] ${isUp ? 'text-[#00ff94]' : 'text-[#ff3b4a]'}`}>
                  {isUp ? '+' : ''}
                  {(t?.change24h || 0).toFixed(1)}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#0d0f11] font-mono text-xs">
          {/* Direction Override Selector, Lock Snapshot & Educational Helper */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-[#161a1e] border border-[#272a2d]">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[#99907f] text-[11px] font-bold">Trade Direction:</span>
                <div className="flex bg-[#0f1215] p-0.5 rounded-lg border border-[#272a2d]">
                  <button
                    onClick={() => setDirectionMode('AUTO')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all font-bold cursor-pointer flex items-center gap-1 ${
                      directionMode === 'AUTO'
                        ? 'bg-[#38bdf8] text-[#001726] shadow-xs'
                        : 'text-[#99907f] hover:text-white'
                    }`}
                    title="Auto-detect Trend from CPR & Price Momentum"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto Trend</span>
                  </button>
                  <button
                    onClick={() => setDirectionMode('BUY')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all font-bold cursor-pointer flex items-center gap-1 ${
                      directionMode === 'BUY'
                        ? 'bg-[#00ff94] text-[#002111] shadow-[0_0_10px_rgba(0,255,148,0.3)]'
                        : 'text-[#99907f] hover:text-[#00ff94]'
                    }`}
                    title="Force Bullish Breakout / Dip Buy Setup"
                  >
                    <span>🟢 BUY (Long)</span>
                  </button>
                  <button
                    onClick={() => setDirectionMode('SELL')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all font-bold cursor-pointer flex items-center gap-1 ${
                      directionMode === 'SELL'
                        ? 'bg-[#ff3b4a] text-white shadow-[0_0_10px_rgba(255,59,74,0.3)]'
                        : 'text-[#99907f] hover:text-[#ff3b4a]'
                    }`}
                    title="Force Bearish Breakdown / Trend Short Setup"
                  >
                    <span>🔴 SELL (Short)</span>
                  </button>
                </div>
              </div>

              {/* Lock / Freeze Real-Time Recalculation Button */}
              <button
                onClick={toggleFreezePlan}
                className={`px-2.5 py-1 text-xs rounded-lg border font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isPlanFrozen
                    ? 'bg-[#ffd87f]/20 border-[#ffd87f] text-[#ffd87f] shadow-[0_0_12px_rgba(255,216,127,0.3)]'
                    : 'bg-[#15191d] border-[#272a2d] text-[#99907f] hover:text-white'
                }`}
                title="Freeze levels to prevent values from updating with every tick"
              >
                {isPlanFrozen ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-[#ffd87f]" />
                    <span>Plan Locked (Fixed)</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-[#99907f]" />
                    <span>Lock Levels (Stop Updates)</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => setShowTrendEducation(!showTrendEducation)}
              className="text-[11px] text-[#ffd87f] hover:underline flex items-center gap-1 cursor-pointer bg-[#ffd87f]/10 px-2 py-1 rounded-lg border border-[#ffd87f]/30"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>TP/SL baar baar kyun badal raha hai? (Click to understand)</span>
            </button>
          </div>

          {/* Educational Explanation Box */}
          {showTrendEducation && (
            <div className="p-3.5 rounded-xl bg-[#221600]/80 border border-[#ffd87f]/50 text-[#fff8f1] space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#ffd87f] text-xs flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#ffd87f]" />
                  Entry, Target aur Stop Loss Kyun Badalte Hain? (Guide)
                </span>
                <button
                  onClick={() => setShowTrendEducation(false)}
                  className="text-[#99907f] hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#e1e2e7] font-sans">
                <div className="p-2.5 rounded-lg bg-black/40 border border-[#ffd87f]/30">
                  <div className="font-bold text-[#ffd87f] mb-1">1. Live Dynamic Pricing:</div>
                  <p>
                    Radar har second ke live price aur institutional CPR Pivot levels se calculate hota hai. Agar price thoda aage-peeche hota hai, toh optimal Entry aur SL adjust hota hai taaki apka Risk-to-Reward ratio hamesha best rahe.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-[#00ff94]/30">
                  <div className="font-bold text-[#00ff94] mb-1">2. Kon Si Entry &amp; TP/SL Lein?</div>
                  <p>
                    Jab bhi aap trade lena chahein, screen par dikh rahe <strong>current levels</strong> ko lein, ya fir upar bane <strong>"Lock Levels"</strong> button par click kar dein taaki values freeze ho jayein. Niche diye <strong>"⚡ 1-Click Market"</strong> ya <strong>"⏳ Limit"</strong> button se auto-fill ho jata hai!
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-[#ffd87f] font-mono">
                💡 <strong>Tip:</strong> Agar market down chal raha ho, toh upar <strong>"🔴 SELL (Short)"</strong> dabayein taaki girte market ka plan active ho!
              </p>
            </div>
          )}

          {/* 🚦 1. MAIN TRAFFIC LIGHT ENTRY RADAR BANNER */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg ${activePlan.statusBadgeColor}`}>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-black/40 flex items-center justify-center shrink-0 mt-0.5">
                {activePlan.status === 'ENTER_MARKET_NOW' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#00ff94] animate-bounce" />
                ) : activePlan.status === 'PLACE_LIMIT_PULLBACK' ? (
                  <Clock className="w-5 h-5 text-[#ffd87f] animate-pulse" />
                ) : (
                  <Radio className="w-5 h-5 text-[#38bdf8] animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                    {activePlan.statusTitle}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/40 text-[10px] font-bold">
                    {activePlan.side} {activePlan.symbol}
                  </span>
                  {isPlanFrozen && (
                    <span className="px-1.5 py-0.5 rounded bg-[#ffd87f]/20 border border-[#ffd87f]/50 text-[#ffd87f] text-[9px] font-bold">
                      LOCKED
                    </span>
                  )}
                </div>
                <p className="text-white/90 text-xs sm:text-[13px] mt-1 font-sans font-medium">
                  {activePlan.hindiActionStep}
                </p>
              </div>
            </div>

            {/* Candle Countdown Timer Pill */}
            <div className="bg-black/50 px-3 py-2 rounded-lg border border-white/10 text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between">
              <span className="text-[10px] text-[#99907f]">{timeframe} Candle Timer</span>
              <div className="text-base font-bold text-white flex items-center gap-1 mt-0.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#ffd87f] animate-pulse" />
                <span>{formatCandleTime(activePlan.candleSecondsRemaining)}</span>
              </div>
            </div>
          </div>

          {/* 🎯 2. HOW TO ENTER - 3 SIMPLE RULES VISUAL BREAKDOWN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div
              className={`p-3 rounded-xl border transition-all ${
                activePlan.entryType === 'market'
                  ? 'bg-[#00ff94]/10 border-[#00ff94] shadow-[0_0_12px_rgba(0,255,148,0.15)]'
                  : 'bg-[#15191d] border-[#272a2d] opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-[#00ff94] font-bold">
                <span>1. Market Order</span>
                {activePlan.entryType === 'market' && <Check className="w-4 h-4" />}
              </div>
              <p className="text-[11px] text-[#99907f] mt-1">
                Current price (${activePlan.livePrice}) par turant entry lein agar breakout trigger ho chuka hai.
              </p>
            </div>

            <div
              className={`p-3 rounded-xl border transition-all ${
                activePlan.entryType === 'limit'
                  ? 'bg-[#ffd87f]/10 border-[#ffd87f] shadow-[0_0_12px_rgba(255,216,127,0.15)]'
                  : 'bg-[#15191d] border-[#272a2d] opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-[#ffd87f] font-bold">
                <span>2. Limit Pullback</span>
                {activePlan.entryType === 'limit' && <Check className="w-4 h-4" />}
              </div>
              <p className="text-[11px] text-[#99907f] mt-1">
                ${activePlan.entryPrice} par pending limit order lagayein aur price ke wapas aane ka wait karein.
              </p>
            </div>

            <div
              className={`p-3 rounded-xl border transition-all ${
                activePlan.status === 'WAIT_CANDLE_CLOSE'
                  ? 'bg-[#38bdf8]/10 border-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                  : 'bg-[#15191d] border-[#272a2d] opacity-60'
              }`}
            >
              <div className="flex items-center justify-between text-[#38bdf8] font-bold">
                <span>3. Candle Close</span>
                {activePlan.status === 'WAIT_CANDLE_CLOSE' && <Check className="w-4 h-4" />}
              </div>
              <p className="text-[11px] text-[#99907f] mt-1">
                15m candle close hone ke baad hi next candle ke open par trade execute karein.
              </p>
            </div>
          </div>

          {/* 📊 3. THE COMPLETE 1-CLICK TRADE NUMERICAL SETUP CARD */}
          <div className="bg-[#14171a] border border-[#272a2d] rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#22262a] pb-2.5">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#00ff94]" />
                <span className="font-bold text-white text-sm">PRE-CONFIGURED TRADE BLUEPRINT</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#99907f] text-[11px]">Strategy:</span>
                <span className="text-[#ffd87f] font-bold">{activePlan.strategyName}</span>
              </div>
            </div>

            {/* Key Level Boxes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Entry */}
              <div className="bg-[#0d0f11] p-3 rounded-lg border border-[#272a2d]">
                <div className="text-[10px] text-[#99907f]">OPTIMAL ENTRY ({activePlan.entryType.toUpperCase()})</div>
                <div className="text-base font-bold text-white mt-1">${activePlan.entryPrice}</div>
                <div className="text-[9px] text-[#00ff94]">Live: ${activePlan.livePrice}</div>
              </div>

              {/* Stop Loss */}
              <div className="bg-[#0d0f11] p-3 rounded-lg border border-[#ff3b4a]/30">
                <div className="text-[10px] text-[#ff3b4a] font-bold">STOP LOSS (INVALIDATION)</div>
                <div className="text-base font-bold text-[#ff3b4a] mt-1">${activePlan.stopLoss}</div>
                <div className="text-[9px] text-[#99907f]">Risk: -{activePlan.riskPercent}%</div>
              </div>

              {/* Target 1 */}
              <div className="bg-[#0d0f11] p-3 rounded-lg border border-[#00ff94]/30">
                <div className="text-[10px] text-[#00ff94] font-bold">TARGET 1 (50% PROFIT)</div>
                <div className="text-base font-bold text-[#00ff94] mt-1">${activePlan.takeProfit1}</div>
                <div className="text-[9px] text-[#ffd87f]">R:R {activePlan.riskReward}</div>
              </div>

              {/* Target 2 */}
              <div className="bg-[#0d0f11] p-3 rounded-lg border border-[#38bdf8]/30">
                <div className="text-[10px] text-[#38bdf8] font-bold">TARGET 2 (RUNNER)</div>
                <div className="text-base font-bold text-[#38bdf8] mt-1">${activePlan.takeProfit2}</div>
                <div className="text-[9px] text-[#99907f]">Trail SL to Entry</div>
              </div>
            </div>

            {/* Position Sizing & Risk Simulator */}
            <div className="bg-[#181c20] p-3 rounded-lg border border-[#272a2d] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[#99907f]">Position Sizing (Wallet Balance: ${balance.toFixed(2)}):</span>
                <div className="flex gap-1">
                  {[10, 25, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setSelectedPercent(pct)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedPercent === pct
                          ? 'bg-[#00ff94] text-[#002111]'
                          : 'bg-[#272a2d] text-[#99907f] hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-[#272a2d]">
                <div>
                  <span className="text-[#99907f] block text-[10px]">Margin Used:</span>
                  <span className="text-white font-bold">${marginUsd.toFixed(2)} ({activePlan.recommendedLeverage}x)</span>
                </div>
                <div>
                  <span className="text-[#ff3b4a] block text-[10px]">Max Risk (SL Hit):</span>
                  <span className="text-[#ff3b4a] font-bold">-${riskAmountUsd}</span>
                </div>
                <div>
                  <span className="text-[#00ff94] block text-[10px]">Target 1 Profit:</span>
                  <span className="text-[#00ff94] font-bold">+${rewardAmountUsd}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ⚡ 4. DELIBERATE ORDER ACTIONS */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            {currentMode === 'RESEARCH' ? (
              <div className="w-full py-2.5 px-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-center text-blue-400 font-mono text-xs font-semibold">
                RESEARCH ONLY — NO ORDERS WILL BE PLACED
              </div>
            ) : (
              <>
                {/* Primary Action Button 1: Market Review */}
                <button
                  type="button"
                  onClick={() => handle1ClickExecute('market')}
                  className={`flex-1 w-full py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer ${
                    activePlan.side === 'BUY'
                      ? 'bg-[#00ff94] hover:bg-[#34e893] text-[#002111] shadow-[0_0_20px_rgba(0,255,148,0.35)]'
                      : 'bg-[#ff3b4a] hover:bg-[#ff5a66] text-white shadow-[0_0_20px_rgba(255,59,74,0.35)]'
                  }`}
                >
                  <Zap className="w-4 h-4 fill-current" />
                  {orderExecutedSuccess ? (
                    <span>ORDER ROUTED! ✅</span>
                  ) : (
                    <span>
                      Review Market {activePlan.side} (${activePlan.livePrice})
                    </span>
                  )}
                </button>

                {/* Action Button 2: Limit Pullback Review */}
                <button
                  type="button"
                  onClick={() => handle1ClickExecute('limit')}
                  className="w-full sm:w-auto py-3 px-3.5 bg-[#ffd87f]/15 hover:bg-[#ffd87f]/25 text-[#ffd87f] border border-[#ffd87f]/40 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Review Pending Limit Order at Pullback Level"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Review Limit {activePlan.side} (${activePlan.entryPrice})</span>
                </button>
              </>
            )}

            {/* Action Button 3: Open on Chart */}
            <button
              onClick={handleOpenOnChart}
              className="w-full sm:w-auto py-3 px-3 bg-[#191c1f] hover:bg-[#272a2d] text-[#fff8f1] hover:text-[#00ff94] rounded-xl border border-[#272a2d] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shrink-0"
              title="Open pair on live chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Chart</span>
            </button>

            {/* Action Button 4: Copy Setup */}
            <button
              onClick={handleCopySetup}
              className="w-full sm:w-auto py-3 px-3 bg-[#191c1f] hover:bg-[#272a2d] text-[#99907f] hover:text-white rounded-xl border border-[#272a2d] transition-colors flex items-center justify-center gap-1.5 shrink-0 text-xs"
              title="Copy Trade Setup"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00ff94]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
