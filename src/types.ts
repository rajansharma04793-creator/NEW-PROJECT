export type AssetPair =
  | 'BTC/USDT'
  | 'ETH/USDT'
  | 'SOL/USDT'
  | 'XRP/USDT'
  | 'BNB/USDT'
  | 'DOGE/USDT'
  | 'ADA/USDT'
  | 'AVAX/USDT'
  | 'SUI/USDT'
  | 'NEAR/USDT'
  | 'LINK/USDT'
  | 'APT/USDT'
  | 'PEPE/USDT'
  | 'SHIB/USDT'
  | 'BONK/USDT'
  | 'WIF/USDT'
  | 'RENDER/USDT'
  | 'TAO/USDT'
  | 'FET/USDT'
  | 'HYPE/USDT'
  | 'UNI/USDT'
  | 'AAVE/USDT'
  | 'INJ/USDT'
  | 'DOT/USDT'
  | 'ATOM/USDT'
  | 'TRX/USDT'
  | 'TON/USDT'
  | 'LTC/USDT'
  | 'ZEC/USDT'
  | 'XMR/USDT'
  | 'XAU/USDT'
  | 'XAG/USDT'
  | 'WTI/USDT'
  | 'BRENT/USDT'
  | 'COPPER/USDT'
  | 'EUR/USD'
  | 'GBP/USD'
  | 'USD/JPY'
  | 'USD/INR'
  | 'AUD/USD'
  | 'USD/CAD'
  | 'USD/CHF'
  | 'NVDA/USD'
  | 'AAPL/USD'
  | 'TSLA/USD'
  | 'MSFT/USD'
  | 'AMZN/USD'
  | 'GOOGL/USD'
  | 'META/USD'
  | 'RELIANCE/INR'
  | 'TCS/INR'
  | 'HDFCBANK/INR'
  | 'NIFTY50'
  | 'SPX500'
  | 'QQQ/USD'
  | 'LUM/USDT'
  | (string & {});

export type MarketCategory =
  | 'all'
  | 'hot'
  | 'crypto'
  | 'commodities'
  | 'forex'
  | 'stocks'
  | 'layer1'
  | 'ai'
  | 'defi'
  | 'meme'
  | 'privacy'
  | 'gainers';

export interface CoinMetadata {
  symbol: AssetPair;
  name: string;
  baseAsset: string;
  quoteAsset: string;
  category: MarketCategory;
  tags: string[];
  precision?: number;
  isHot?: boolean;
  isNew?: boolean;
}

export interface CoinDCXTickerRaw {
  market: string;
  change_24_hour: string;
  high: string;
  low: string;
  volume: string;
  last_price: string;
  bid: string;
  ask: string;
  timestamp: number;
}

export interface TickerInfo {
  symbol: AssetPair;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  last_price?: number;
  mark_price?: number;
  markPrice?: number;
  index_price?: number;
  indexPrice?: number;
  funding_rate?: number;
  fundingRate: number;
  change_24h?: number;
  change_percentage_24h?: number;
  inrPrice?: number;
  futuresInrPrice?: number;
  spotInrPrice?: number;
  usdtInrRate?: number;
  change24h: number;
  inrChange24h?: number;
  high24h: number;
  low24h: number;
  inrHigh24h?: number;
  inrLow24h?: number;
  volume24h: number;
  turnover24h: number;
  nextFundingIn: string;
  precision: number;
  isFutures?: boolean;
}

export interface FuturesInstrument {
  instrument: string;
  pair: string;
  symbol: string;
  last_price: number;
  mark_price: number;
  index_price: number;
  funding_rate: number;
  change_24h: number;
  change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  turnover_24h: number;
  timestamp: number;
}

export type TickerData = TickerInfo;
export type OrderSide = 'buy' | 'sell';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookItem {
  price: number;
  amount: number;
  total: number;
  depthPercent: number;
}

export interface MarketTrade {
  id: string;
  price: number;
  amount: number;
  side: 'buy' | 'sell';
  time: number;
}

export interface Position {
  id: string;
  symbol: AssetPair;
  side: 'long' | 'short';
  entryPrice: number;
  markPrice: number;
  size: number;
  leverage: number;
  margin: number;
  liquidationPrice: number;
  takeProfit?: number;
  stopLoss?: number;
  trailingStopPercent?: number;
  peakPrice?: number;
  timestamp: number;
}

export interface Order {
  id: string;
  symbol: AssetPair;
  type: 'limit' | 'market' | 'stop-limit' | 'ai-smart';
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  status: 'open' | 'filled' | 'cancelled';
  timestamp: number;
  leverage: number;
  takeProfit?: number;
  stopLoss?: number;
  realizedPnl?: number;
  pnlPercent?: number;
}

export interface TechnicalSupportData {
  rsi: number;
  rsiSignal: 'Oversold' | 'Neutral' | 'Overbought' | 'Bullish Divergence' | 'Bearish Divergence';
  macd: {
    macd: number;
    signal: number;
    histogram: number;
    trend: 'Bullish Expansion' | 'Bearish Expansion' | 'Bullish Cross' | 'Bearish Cross';
  };
  emaTrend: string;
  ema9?: number;
  ema20: number;
  ema21?: number;
  ema26?: number;
  ema50: number;
  ema200: number;
  supportLevel: number;
  resistanceLevel: number;
  atr: number;
  bollingerPosition?: string;
  orderflowImbalance: string;
  volumeSurge: string;
  pivotPoint?: number;
  fibonacci382?: number;
  fibonacci618?: number;
  adx?: number;
  adxTrending?: boolean;
  cpr?: {
    tc: number;
    pivot: number;
    bc: number;
    r1: number;
    s1: number;
    r2: number;
    s2: number;
    r3: number;
    s3: number;
    bias: 'BULLISH' | 'BEARISH' | 'CONSOLIDATION' | 'NEUTRAL';
    status: string;
  };
}

export interface AISignal {
  id: string;
  symbol: AssetPair;
  title: string;
  side: 'LONG' | 'SHORT';
  type:
    | 'BULLISH_BREAKOUT'
    | 'MOMENTUM_LONG'
    | 'SHORT_REVERSAL'
    | 'INSTITUTIONAL_ACCUMULATION'
    | 'BEARISH_REJECTION'
    | 'MEAN_REVERSION_SCALP'
    | 'FIBONACCI_RETRACEMENT'
    | 'CPR_EMA_CONFLUENCE';
  confidence: number;
  timeframe: string;
  entryPrice: number;
  entryRange: [number, number];
  target1: number;
  target2: number;
  target3?: number;
  stopLoss: number;
  riskReward: string;
  riskPercent: number;
  rewardPercent: number;
  recommendedLeverage: number;
  strategy: string;
  description: string;
  rationale: string;
  technicalSupport: TechnicalSupportData;
  timestamp: number;
  active: boolean;
  confluenceEvaluation?: ConfluenceEvaluationResult;
  isAccepted?: boolean;
  isLocked?: boolean;
  lockedAt?: number;
  setupType?: 'LIMIT_PULLBACK' | 'BREAKOUT_STOP' | 'DEMAND_RETEST' | 'SUPPLY_RETEST';
  entryTypeDescription?: string;
  sampleSize?: number;
  backtestPeriod?: string;
  maxDrawdownPercent?: number;
  historicalLossRate?: number;
}

export interface AIChatTradeSignal {
  symbol: AssetPair;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice: number;
  entryRange?: [number, number];
  setupType?: 'LIMIT_PULLBACK' | 'BREAKOUT_STOP' | 'DEMAND_RETEST' | 'SUPPLY_RETEST';
  entryTypeDescription?: string;
  target1: number;
  target2: number;
  target3?: number;
  stopLoss: number;
  riskReward: string;
  leverage?: number;
  timeframe?: string;
  strategy?: string;
  reasoning?: string;
  executed?: boolean;
}

export interface AIChatMetrics {
  rsi?: number;
  rsiSignal?: string;
  macdTrend?: string;
  emaStack?: string;
  support?: number;
  resistance?: number;
  orderflowBias?: string;
  atr?: number;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: number;
  tradeSignal?: AIChatTradeSignal;
  metrics?: AIChatMetrics;
  isStreaming?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'ai_signal' | 'system' | 'price_alert' | 'alert';
  timestamp: number;
  read: boolean;
  symbol?: AssetPair;
  targetPrice?: number;
}

export interface PriceAlert {
  id: string;
  symbol: AssetPair;
  targetPrice: number;
  condition: 'rises_above' | 'drops_below' | 'crosses';
  note?: string;
  createdAt: number;
  triggeredAt?: number;
  status: 'active' | 'triggered' | 'disabled';
  isRecurring?: boolean;
  soundEnabled?: boolean;
  initialPriceAtCreation: number;
}

export interface AutoAlertConfig {
  enabled: boolean;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  browserNotifications: boolean;
  minConfidence: number; // 70 to 95
  scanIntervalSeconds: number; // 10, 15, 30, 60
  categoryFilter: MarketCategory;
  sideFilter: 'ALL' | 'LONG' | 'SHORT';
  selectedSymbols: AssetPair[]; // specific stocks/coins selected by user
  scanTargetMode?: 'all' | 'custom' | 'current_only'; // All Assets vs Custom Selected Stocks vs Current Chart Only
  popupAlerts: boolean;
  autoExecutionEnabled?: boolean; // Autonomous Auto Entry & Exit execution
  autoExecutionRiskPercent?: number; // Margin risk % per auto trade (1% to 10%, default 2.5%)
  maxConcurrentAutoPositions?: number; // Max open auto positions simultaneously (1 to 5, default 3)
}

export interface AutoAlertSignalEvent {
  id: string;
  signal: AISignal;
  timestamp: number;
  read: boolean;
  source: 'auto_scanner' | 'manual_test' | 'gemini_engine';
}

export type DrawingToolType =
  | 'cursor'
  | 'trendline'
  | 'horizontal_line'
  | 'horizontal_ray'
  | 'vertical_line'
  | 'channel'
  | 'fib_retracement'
  | 'rectangle'
  | 'circle'
  | 'long_position'
  | 'short_position'
  | 'price_range'
  | 'text'
  | 'arrow_up'
  | 'arrow_down'
  | 'brush'
  | 'eraser';

export interface ChartPoint {
  candleIndex: number;
  time: number;
  price: number;
}

export interface DrawingElement {
  id: string;
  type: DrawingToolType;
  points: ChartPoint[];
  color: string;
  fillColor?: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  text?: string;
  fontSize?: number;
  extraData?: {
    entryPrice?: number;
    targetPrice?: number;
    stopLossPrice?: number;
    riskReward?: number;
    channelWidth?: number;
    pips?: number;
    percentChange?: number;
    brushPoints?: { price: number; candleIndex: number }[];
  };
  symbol: string;
  locked?: boolean;
}

export type IndicatorCategory = 'trend' | 'oscillators' | 'volatility' | 'volume' | 'smart_money';

export type ChartLayoutPattern = 'single' | 'dual_h' | 'dual_v' | 'quad';

export type ChartMainViewMode =
  | 'candles'
  | 'footprint'
  | 'liquidity_heatmap'
  | 'market_profile'
  | 'dom_ladder'
  | 'multi_chart';

export interface FootprintClusterLevel {
  price: number;
  buyVol: number;
  sellVol: number;
  delta: number;
  isPOC?: boolean;
  isImbalance?: boolean;
  imbalanceSide?: 'buy' | 'sell';
}

export interface FootprintCandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  totalVolume: number;
  delta: number;
  cumulativeDelta: number;
  pocPrice: number;
  vahPrice: number;
  valPrice: number;
  clusters: FootprintClusterLevel[];
}

export interface OrderFlowSwitchboardConfig {
  layoutPattern: ChartLayoutPattern;
  activeView: ChartMainViewMode;
  imbalanceRatio: number; // e.g. 3.0 (300%)
  minDeltaHighlight: number;
  showCVD: boolean;
  showPOC: boolean;
  showValueArea: boolean;
  showStackedImbalances: boolean;
  heatmapResolution: 'low' | 'med' | 'ultra';
  showLiquidityWalls: boolean;
  domTickSize: number;
  autoCenterDOM: boolean;
}

export interface IndicatorDefinition {
  id: string;
  name: string;
  shortName: string;
  category: IndicatorCategory;
  description: string;
  defaultParams: Record<string, number | string>;
  overlay: boolean;
  color: string;
  secondaryColor?: string;
}

export interface ActiveIndicatorState {
  id: string;
  indicatorId: string;
  enabled: boolean;
  params: Record<string, number | string>;
  color: string;
  secondaryColor?: string;
  visible: boolean;
}

export interface ExchangeArbitrageItem {
  exchange: 'CoinDCX' | 'Binance' | 'Bybit' | 'OKX' | 'Coinbase';
  price: number;
  bid: number;
  ask: number;
  spreadPercent: number;
  fundingRate: number;
  volume24hUsd: number;
  status: 'optimal_buy' | 'optimal_sell' | 'neutral';
  latencyMs: number;
}

export type BacktestStrategyId =
  | 'smc_orderflow'
  | 'breakout_momentum'
  | 'ema_golden_cross'
  | 'rsi_mean_reversion'
  | 'supertrend_pullback'
  | 'bollinger_squeeze'
  | 'cpr_confluence';

export interface BacktestTrade {
  id: string;
  entryTime: number;
  exitTime: number;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  outcome: 'WIN' | 'LOSS';
  reason: 'TP1' | 'TP2' | 'SL' | 'SIGNAL_REVERSAL';
}

export interface BacktestResult {
  strategyId: BacktestStrategyId;
  strategyName: string;
  pair: AssetPair;
  timeframe: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  netProfitUsd: number;
  netProfitPercent: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  avgWinUsd: number;
  avgLossUsd: number;
  equityCurve: { time: number; equity: number }[];
  trades: BacktestTrade[];
}

export interface EconomicEvent {
  id: string;
  title: string;
  titleHindi?: string;
  country: 'US' | 'EU' | 'IN' | 'UK' | 'JP' | 'GLOBAL' | 'CRYPTO';
  category: 'inflation' | 'central_bank' | 'employment' | 'growth' | 'token_unlock' | 'options_expiry' | 'commodity' | 'macro';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  impactHindi?: string;
  impactDirection?: 'BULLISH' | 'BEARISH' | 'VOLATILE' | 'NEUTRAL';
  date: string; // ISO or formatted
  timestamp: number;
  timeUntil: string;
  previous?: string;
  forecast?: string;
  actual?: string;
  volatilityRisk: 'EXTREME' | 'ELEVATED' | 'NORMAL' | 'HIGH';
  description: string;
  descriptionHindi?: string;
  marketImpactSummaryHindi?: string;
  affectedAssets?: string[];
}

export interface MTFTimeframeData {
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1D';
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  score: number; // 0 to 100
  rsi: number;
  emaTrend: string;
  macdState: string;
  keyLevel: string;
}

export interface MTFConfluenceSummary {
  symbol: AssetPair;
  aggregateBias: 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
  confidenceScore: number;
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  recommendedAction: string;
  timeframes: MTFTimeframeData[];
}

export interface WebhookConfig {
  tradingViewWebhookUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  discordWebhookUrl: string;
  notifyOnAiSignal: boolean;
  notifyOnPriceAlert: boolean;
  notifyOnSLTP: boolean;
  notifyOnEconomicEvents: boolean;
}

export type StrategyCategory =
  | 'confluence'
  | 'trend'
  | 'reversion'
  | 'breakout'
  | 'scalp'
  | 'custom';

export interface StrategyRuleConfig {
  useCPR?: boolean;
  useEMA9_26?: boolean;
  useEMARibbon?: boolean; // 9, 21, 55, 200
  useADXFilter?: boolean;
  adxThreshold?: number; // default 20
  useRSIFilter?: boolean;
  rsiLongMin?: number; // default 48
  rsiLongMax?: number; // default 70
  rsiShortMin?: number; // default 30
  rsiShortMax?: number; // default 52
  useSupertrend?: boolean;
  supertrendPeriod?: number;
  supertrendMultiplier?: number;
  useBollingerSqueeze?: boolean;
  useMACD?: boolean;
  useVolumeSurge?: boolean;
  volumeMultiplier?: number;
  useSMC_FVG?: boolean;
  slAtrMultiplier?: number; // default 1.5
  tpAtrMultiplier?: number; // default 3.0
  customLogicDescription?: string;
}

export interface StrategyDefinition {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  category: StrategyCategory;
  description: string;
  detailedLogic: string;
  isCustom?: boolean;
  author?: string;
  createdAt?: number;
  rules: StrategyRuleConfig;
  recommendedTimeframe: string;
  recommendedLeverage: number;
}

export interface ConfluenceCheckItem {
  name: string;
  passed: boolean;
  value: string;
  condition: string;
}

export type ConfluenceLogicMode = 'STRICT_AND' | 'MINIMUM_MATCH';

export interface ConfluenceCriterionItem {
  id: string;
  name: string;
  shortLabel: string;
  category: 'momentum' | 'trend' | 'pivot' | 'volatility' | 'volume' | 'orderflow' | 'risk';
  description: string;
  enabled: boolean;
  icon: string;
  conditionDescription: string;
}

export interface ConfluenceFilterConfig {
  enabled: boolean; // Master gatekeeper switch
  mode: ConfluenceLogicMode; // STRICT_AND = All enabled criteria must pass, MINIMUM_MATCH = At least N must pass
  minMatchCount: number; // e.g. 3 of 5
  strictOppositeRejection: boolean; // Automatically block if opposite criteria triggered
  
  // 1. RSI Momentum (e.g. RSI > 50 for Long, RSI < 50 for Short)
  rsiMomentum: {
    enabled: boolean;
    minLongRSI: number; // default 50
    maxShortRSI: number; // default 50
    allowOversoldLong: boolean; // allow RSI < 32 as reversal long
    allowOverboughtShort: boolean; // allow RSI > 68 as reversal short
  };

  // 2. EMA 9 / 26 Cross
  ema9_26Cross: {
    enabled: boolean;
    requirePriceAboveEMA9: boolean;
  };

  // 3. Central Pivot Range (CPR)
  cprPivot: {
    enabled: boolean;
    requireAboveTCForLong: boolean; // Price >= TC for Long / Price <= BC for Short
    disallowInsideCPR: boolean; // Block signals inside the chop zone
  };

  // 4. Supertrend Engine
  supertrend: {
    enabled: boolean;
    period: number;
    multiplier: number;
  };

  // 5. ADX Trend Filter
  adxStrength: {
    enabled: boolean;
    minThreshold: number; // e.g. 20 or 25
  };

  // 6. EMA Multi-Ribbon (9/21/55/200)
  emaRibbon: {
    enabled: boolean;
    requireMacro200Trend: boolean; // Price above/below 200 EMA
  };

  // 7. Smart Money Concepts (SMC & FVG)
  smcOrderFlow: {
    enabled: boolean;
    requireMitigationSweep: boolean;
  };

  // 8. Volume Expansion
  volumeExpansion: {
    enabled: boolean;
    minVolumeMultiplier: number; // default 1.5x
  };

  // 9. Minimum Confidence Score
  minConfidence: {
    enabled: boolean;
    threshold: number; // default 85%
  };

  // 10. Minimum Risk-to-Reward Ratio
  minRiskReward: {
    enabled: boolean;
    minRatio: number; // default 2.0 (1:2.0)
  };
}

export interface ConfluenceCriterionEvaluation {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  passed: boolean;
  currentValue: string;
  targetCondition: string;
  statusText: string;
}

export interface ConfluenceEvaluationResult {
  passed: boolean; // Whether the trade signal is permitted by the Confluence Filter
  filterEnabled: boolean;
  mode: ConfluenceLogicMode;
  side: 'LONG' | 'SHORT' | 'NEUTRAL';
  totalConfigured: number;
  totalPassed: number;
  requiredMatches: number;
  criteria: ConfluenceCriterionEvaluation[];
  blockReasons: string[];
  summaryMessage: string;
}

export interface StrategyScanResult {
  symbol: AssetPair;
  baseAsset: string;
  name: string;
  category: MarketCategory;
  price: number;
  change24h: number;
  volume24h: number;
  precision: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  triggerReason: string;
  confluenceItems: ConfluenceCheckItem[];
  confluenceEvaluation?: ConfluenceEvaluationResult;
  tradeLevels?: {
    entry: number;
    stopLoss: number;
    target1: number;
    target2: number;
    target3?: number;
    riskReward: string;
    slPercent: number;
    tp1Percent: number;
    tp2Percent: number;
    atr: number;
  };
  timestamp: number;
}

// 5-Agent Quantitative Desk Framework Interfaces
export interface AgentScoutOutput {
  marketStructure: string;
  structureType: 'BOS' | 'CHoCH' | 'RANGE' | 'LIQUIDITY_SWEEP';
  swingHigh: number;
  swingLow: number;
  orderBlock: {
    type: 'Bullish' | 'Bearish';
    range: [number, number];
    timeframe: string;
  };
  fairValueGap: {
    present: boolean;
    range: [number, number];
    timeframe: string;
  };
  liquidityPools: {
    buySideLiquidity: number;
    sellSideLiquidity: number;
    stopsSwept: boolean;
    sweepNote: string;
  };
  keySupport: number;
  keyResistance: number;
  summary: string;
}

export interface AgentAnalystOutput {
  trendAlignment: string;
  emaMatrix: {
    ema20: number;
    ema50: number;
    ema200: number;
    status: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'STRONG_UPTREND' | 'STRONG_DOWNTREND' | 'CONSOLIDATION';
    slope: string;
  };
  rsi: {
    value: number;
    zone: 'OVERSOLD' | 'BULLISH_DYNAMIC_SUPPORT' | 'NEUTRAL' | 'BEARISH_RESISTANCE' | 'OVERBOUGHT';
    divergence: 'BULLISH_REGULAR' | 'BULLISH_HIDDEN' | 'BEARISH_REGULAR' | 'BEARISH_HIDDEN' | 'NONE';
  };
  volumeSpread: {
    ratioVs20MA: number;
    flow: 'INSTITUTIONAL_ABSORPTION' | 'EXPANSION_IMPULSE' | 'LOW_VOLUME_TEST' | 'DISTRIBUTION_CHURN';
    description: string;
  };
  cpr: {
    pivot: number;
    tc: number;
    bc: number;
    width: 'VIRGIN_NARROW' | 'NARROW_TREND' | 'AVERAGE' | 'WIDE_RANGE';
    status: 'ABOVE_CPR' | 'INSIDE_CPR' | 'BELOW_CPR';
    r1: number;
    r2: number;
    s1: number;
    s2: number;
  };
  summary: string;
}

export interface AgentNewsOutput {
  assetClass: 'Crypto' | 'Forex' | 'Commodities' | 'Stocks' | 'Indices';
  session: string;
  macroRisk: 'LOW' | 'MODERATE' | 'ELEVATED';
  catalysts: string[];
  catalystsHindi?: string[];
  metrics: {
    label1: string;
    value1: string;
    label2: string;
    value2: string;
    label3?: string;
    value3?: string;
  };
  volatilityNote: string;
  summary: string;
  summaryHindi?: string;
  marketImpactHindi?: string;
}

export interface AgentValidatorOutput {
  status: 'PASSED' | 'CAUTION' | 'REJECTED';
  confidenceScore: number;
  trapAudit: {
    liquidityGrabVerified: boolean;
    bearBullTrapDetected: boolean;
    divergenceRisk: boolean;
    fakeBreakoutRisk: boolean;
  };
  reasons: string[];
  auditVerdict: string;
}

export interface AgentRiskControllerOutput {
  enforcedMinRR: number;
  action: 'STRONG BUY' | 'BUY' | 'WAIT' | 'SELL' | 'STRONG SELL';
  entryZone: [number, number];
  entryPrice: number;
  stopLoss: number;
  tp1Conservative: number;
  tp2Runner: number;
  riskPerShareOrUnit: number;
  riskRewardTP1: number;
  riskRewardTP2: number;
  invalidationTrigger: string;
  suggestedPositionSizePercent: number;
  suggestedLeverage: number;
  setupType?: 'LIMIT_PULLBACK' | 'BREAKOUT_STOP' | 'DEMAND_RETEST' | 'SUPPLY_RETEST';
  entryTypeDescription?: string;
}

export interface AgentDeliberationReport {
  id: string;
  symbol: AssetPair;
  assetClass: 'Crypto' | 'Forex' | 'Commodities' | 'Stocks' | 'Indices';
  timeframe: string;
  timestamp: number;
  currentPrice: number;
  action: 'STRONG BUY' | 'BUY' | 'WAIT' | 'SELL' | 'STRONG SELL';
  validatorStatus: 'PASSED' | 'CAUTION' | 'REJECTED';
  confidenceScore: number;
  riskRewardRatio: string;
  tradeScout: AgentScoutOutput;
  marketAnalyst: AgentAnalystOutput;
  newsContext: AgentNewsOutput;
  validator: AgentValidatorOutput;
  riskController: AgentRiskControllerOutput;
  markdownSummary: string;
}

export type QuantEngineState = 'STOPPED' | 'RUNNING' | 'PAUSED' | 'CIRCUIT_BREAKER';
export type QuantExecutionMode = 'PASSIVE_MAKER' | 'AGGRESSIVE_TAKER';

export interface QuantOrderBookLevel {
  price: number;
  qty: number;
}

export interface QuantTelemetry {
  state: QuantEngineState;
  mode: QuantExecutionMode;
  symbol: string;
  binanceMid: number;
  binanceBestBid: number;
  binanceBestAsk: number;
  binanceBids: QuantOrderBookLevel[];
  binanceAsks: QuantOrderBookLevel[];
  binanceLatencyMs: number;
  coindcxMid: number;
  coindcxBestBid: number;
  coindcxBestAsk: number;
  coindcxBids: QuantOrderBookLevel[];
  coindcxAsks: QuantOrderBookLevel[];
  coindcxLatencyMs: number;
  spreadDelta: number;
  top5OBI: number;
  rollingCVD: number;
  walletBalance: number;
  usedMargin: number;
  marginRatioPct: number;
  liquidationBufferPct: number;
  openPosition: {
    side: 'LONG' | 'SHORT' | 'FLAT';
    size: number;
    entryPrice: number;
    pnl: number;
  };
  lastExecutionRttMs: number;
  circuitBreakerActive: boolean;
  consecutiveErrors: number;
  recentLogs: { time: string; level: 'info' | 'warn' | 'error' | 'success'; msg: string }[];
}

/**
 * Three explicitly separated product trading modes
 */
export type ProductTradingMode = 'RESEARCH' | 'PAPER' | 'LIVE';

/**
 * Order review payload for deliberate 2-step confirmation
 */
export interface OrderReviewPayload {
  idempotencyKey: string;
  symbol: AssetPair;
  market: string;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop-limit' | 'ai-smart';
  quantity: number;
  entryPrice: number;
  currentMarketPrice: number;
  leverage: number;
  marginMode: 'cross' | 'isolated';
  requiredMargin: number;
  tradingFeeEstimate: number;
  fundingEstimate: number;
  spreadEstimate: number;
  slippageEstimate: number;
  maxPlannedLoss: number;
  takeProfit?: number;
  stopLoss?: number;
  estimatedLiqPrice: number;
  accountBalanceAfterTrade: number;
  remainingBuyingPower: number;
  dataSource: string;
  dataTimestamp: number;
  isDataStale: boolean;
  userAcceptedRisk?: boolean;
}

/**
 * Risk Engine validation result
 */
export interface RiskValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    positionSizeUsd: number;
    requiredMargin: number;
    initialMargin: number;
    maintenanceMargin: number;
    tradingFee: number;
    fundingFee: number;
    spread: number;
    slippage: number;
    maxPlannedLoss: number;
    estimatedLiqPrice: number;
    accountExposurePct: number;
    symbolExposurePct: number;
    dailyLossPct: number;
    openPositionsCount: number;
    maxLeverageAllowed: number;
    remainingBuyingPower: number;
  };
}

/**
 * Audit log entry for every order decision
 */
export interface OrderAuditLogEntry {
  id: string;
  idempotencyKey: string;
  timestamp: number;
  mode: ProductTradingMode;
  symbol: AssetPair;
  side: 'buy' | 'sell';
  orderType: string;
  quantity: number;
  price: number;
  leverage: number;
  marginRequired: number;
  status: 'VALIDATED' | 'REJECTED' | 'EXECUTED_SIMULATED' | 'BLOCKED_RISK' | 'BLOCKED_AUTH';
  rejectionReason?: string;
  riskMetricsSnapshot?: Record<string, number>;
}

/**
 * Signal ledger record for full transparency and documented methodology
 */
export interface SignalLedgerEntry {
  id: string;
  symbol: AssetPair;
  timestamp: number;
  timeframe: string;
  side: 'LONG' | 'SHORT';
  status: 'WINNER' | 'LOSER' | 'INVALIDATED' | 'EXPIRED' | 'CANCELLED';
  strategyVersion: string;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  target1: number;
  target2: number;
  pnlPercent: number;
  riskReward: string;
  feesDeducted: boolean;
  slippageDeducted: boolean;
  isSimulated: boolean;
  durationMinutes: number;
}

/**
 * Single source of truth for trade setups across signals, charts, and order form (Requirement 1)
 */
export interface UnifiedTradeSetup {
  symbol: AssetPair;
  side: 'LONG' | 'SHORT';
  entry: number;
  takeProfit: number;
  stopLoss: number;
  timeframe: string;
  signalId?: string;
  updatedAt: number;
}

/**
 * Single source of truth for trade setups across signals, charts, and order form
 */
export interface TradeSetup {
  symbol: AssetPair;
  side: 'buy' | 'sell';
  orderType: 'limit' | 'market' | 'stop-limit' | 'ai-smart';
  entryPrice: number;
  currentMarketPrice: number;
  quantity: number;
  leverage: number;
  stopLoss: number;
  takeProfit: number;
  quoteTimestamp: number;
  source: 'manual' | 'signal' | 'chart' | 'radar';
  signalId?: string;
  strategyName?: string;
  marginType?: 'cross' | 'isolated';
  totalValue?: number;
  marginRequired?: number;
  sourceSignal?: AISignal | null;
}

export interface TradeSetupValidation {
  isValid: boolean;
  isStale: boolean;
  quoteAgeMs: number;
  directionalError: string | null;
  riskError: string | null;
  leverageError: string | null;
  generalError: string | null;
  stopLossError?: string | null;
  takeProfitError?: string | null;
  plannedLossUsd: number;
  plannedLossPercent: number;
  maxAllowedRiskUsd: number;
  messages: string[];
}


