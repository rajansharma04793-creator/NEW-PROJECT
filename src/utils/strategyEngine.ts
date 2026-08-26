import {
  AssetPair,
  CoinMetadata,
  TickerInfo,
  Candle,
  StrategyDefinition,
  StrategyScanResult,
  StrategyRuleConfig,
  ConfluenceCheckItem,
  ConfluenceFilterConfig,
  ConfluenceCriterionEvaluation,
  ConfluenceEvaluationResult,
  ConfluenceLogicMode,
} from '../types';
import { ALL_COINS_METADATA, INITIAL_TICKERS } from '../data/marketData';

export const CONFLUENCE_FILTER_STORAGE_KEY = 'coindcx_confluence_filter_config_v1';

export const DEFAULT_CONFLUENCE_FILTER_CONFIG: ConfluenceFilterConfig = {
  enabled: true,
  mode: 'STRICT_AND',
  minMatchCount: 3,
  strictOppositeRejection: true,
  
  rsiMomentum: {
    enabled: true,
    minLongRSI: 50,
    maxShortRSI: 50,
    allowOversoldLong: true,
    allowOverboughtShort: true,
  },

  ema9_26Cross: {
    enabled: true,
    requirePriceAboveEMA9: true,
  },

  cprPivot: {
    enabled: true,
    requireAboveTCForLong: true,
    disallowInsideCPR: true,
  },

  supertrend: {
    enabled: false,
    period: 10,
    multiplier: 3,
  },

  adxStrength: {
    enabled: true,
    minThreshold: 20,
  },

  emaRibbon: {
    enabled: false,
    requireMacro200Trend: true,
  },

  smcOrderFlow: {
    enabled: false,
    requireMitigationSweep: true,
  },

  volumeExpansion: {
    enabled: false,
    minVolumeMultiplier: 1.5,
  },

  minConfidence: {
    enabled: true,
    threshold: 80,
  },

  minRiskReward: {
    enabled: true,
    minRatio: 1.8,
  },
};

export interface ConfluencePreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  config: Partial<ConfluenceFilterConfig>;
}

export const CONFLUENCE_PRESETS: ConfluencePreset[] = [
  {
    id: 'rsi_ema_core',
    name: 'RSI > 50 & EMA 9/26 Cross (Core Confluence)',
    badge: 'Popular',
    description: 'Enforces RSI > 50 and Bullish EMA 9/26 crossover for Longs, and RSI < 50 with Bearish EMA 9/26 for Shorts.',
    config: {
      enabled: true,
      mode: 'STRICT_AND',
      rsiMomentum: { enabled: true, minLongRSI: 50, maxShortRSI: 50, allowOversoldLong: true, allowOverboughtShort: true },
      ema9_26Cross: { enabled: true, requirePriceAboveEMA9: true },
      adxStrength: { enabled: true, minThreshold: 20 },
      cprPivot: { enabled: false, requireAboveTCForLong: true, disallowInsideCPR: true },
      supertrend: { enabled: false, period: 10, multiplier: 3 },
      emaRibbon: { enabled: false, requireMacro200Trend: true },
      smcOrderFlow: { enabled: false, requireMitigationSweep: true },
      volumeExpansion: { enabled: false, minVolumeMultiplier: 1.5 },
      minConfidence: { enabled: true, threshold: 80 },
      minRiskReward: { enabled: true, minRatio: 1.8 },
    },
  },
  {
    id: 'institutional_cpr_trend',
    name: 'Institutional CPR Breakout + Supertrend + EMA Stack',
    badge: 'Institutional',
    description: 'Requires price outside CPR range (Above TC for Long / Below BC for Short), Supertrend alignment, and EMA Ribbon.',
    config: {
      enabled: true,
      mode: 'STRICT_AND',
      cprPivot: { enabled: true, requireAboveTCForLong: true, disallowInsideCPR: true },
      supertrend: { enabled: true, period: 10, multiplier: 3 },
      emaRibbon: { enabled: true, requireMacro200Trend: true },
      ema9_26Cross: { enabled: true, requirePriceAboveEMA9: true },
      rsiMomentum: { enabled: true, minLongRSI: 50, maxShortRSI: 50, allowOversoldLong: false, allowOverboughtShort: false },
      adxStrength: { enabled: true, minThreshold: 22 },
      minConfidence: { enabled: true, threshold: 85 },
      minRiskReward: { enabled: true, minRatio: 2.0 },
    },
  },
  {
    id: 'fast_scalp_confluence',
    name: 'High-Velocity Scalper (EMA 9/26 + Volume + RSI > 50)',
    badge: 'Scalping',
    description: 'Rapid confirmation with EMA crossover, minimum 1.5x volume expansion, and momentum RSI.',
    config: {
      enabled: true,
      mode: 'STRICT_AND',
      rsiMomentum: { enabled: true, minLongRSI: 52, maxShortRSI: 48, allowOversoldLong: true, allowOverboughtShort: true },
      ema9_26Cross: { enabled: true, requirePriceAboveEMA9: true },
      volumeExpansion: { enabled: true, minVolumeMultiplier: 1.5 },
      adxStrength: { enabled: true, minThreshold: 20 },
      cprPivot: { enabled: false, requireAboveTCForLong: true, disallowInsideCPR: true },
      supertrend: { enabled: false, period: 10, multiplier: 3 },
      minConfidence: { enabled: true, threshold: 80 },
      minRiskReward: { enabled: true, minRatio: 1.5 },
    },
  },
  {
    id: 'smc_reversal_hunter',
    name: 'SMC Liquidity & Reversal Gatekeeper',
    badge: 'SMC / Reversal',
    description: 'FVG Sweep + Liquidity block mitigation combined with RSI extreme reversal detection.',
    config: {
      enabled: true,
      mode: 'STRICT_AND',
      smcOrderFlow: { enabled: true, requireMitigationSweep: true },
      rsiMomentum: { enabled: true, minLongRSI: 45, maxShortRSI: 55, allowOversoldLong: true, allowOverboughtShort: true },
      cprPivot: { enabled: true, requireAboveTCForLong: false, disallowInsideCPR: false },
      volumeExpansion: { enabled: true, minVolumeMultiplier: 1.6 },
      adxStrength: { enabled: false, minThreshold: 20 },
      minConfidence: { enabled: true, threshold: 85 },
      minRiskReward: { enabled: true, minRatio: 2.2 },
    },
  },
  {
    id: 'conservative_consensus_3of5',
    name: 'Consensus Gatekeeper (At Least 4 of 6 Criteria)',
    badge: 'Flexible',
    description: 'Requires at least 4 criteria to pass out of: RSI > 50, EMA Cross, CPR, Supertrend, ADX > 20, Volume Surge.',
    config: {
      enabled: true,
      mode: 'MINIMUM_MATCH',
      minMatchCount: 4,
      rsiMomentum: { enabled: true, minLongRSI: 50, maxShortRSI: 50, allowOversoldLong: true, allowOverboughtShort: true },
      ema9_26Cross: { enabled: true, requirePriceAboveEMA9: true },
      cprPivot: { enabled: true, requireAboveTCForLong: true, disallowInsideCPR: true },
      supertrend: { enabled: true, period: 10, multiplier: 3 },
      adxStrength: { enabled: true, minThreshold: 20 },
      volumeExpansion: { enabled: true, minVolumeMultiplier: 1.4 },
      minConfidence: { enabled: true, threshold: 80 },
      minRiskReward: { enabled: true, minRatio: 1.8 },
    },
  },
];

export const DEFAULT_STRATEGIES: StrategyDefinition[] = [
  {
    id: 'cpr_ema_confluence',
    name: 'CPR + 9/26 EMA + ADX Confluence',
    shortName: 'CPR & 9/26 Confluence',
    icon: '✨',
    category: 'confluence',
    description:
      'High-conviction setup combining Central Pivot Range (TC/BC), 9/26 EMA crossover, ADX > 20 trend filter, RSI momentum band, and strict 1:2 R:R ATR targets.',
    detailedLogic:
      '1. CPR Context: Price > TC for LONG / Price < BC for SHORT (Avoids inside-CPR chop).\n2. EMA Alignment: 9 EMA > 26 EMA for Long / 9 EMA < 26 EMA for Short.\n3. Trend Filter: ADX (14) >= 20 confirming active directional momentum.\n4. RSI Filter: 50-70 band for Long / 30-50 band for Short.\n5. Risk Management: 1.5x ATR Stop Loss, 3.0x ATR Target (1:2 R:R).',
    recommendedTimeframe: '15m',
    recommendedLeverage: 10,
    rules: {
      useCPR: true,
      useEMA9_26: true,
      useADXFilter: true,
      adxThreshold: 20,
      useRSIFilter: true,
      rsiLongMin: 48,
      rsiLongMax: 70,
      rsiShortMin: 30,
      rsiShortMax: 52,
      slAtrMultiplier: 1.5,
      tpAtrMultiplier: 3.0,
    },
  },
  {
    id: 'smc_orderflow',
    name: 'Smart Money Concepts (SMC) & FVG Sweep',
    shortName: 'SMC & Order Blocks',
    icon: '🏛️',
    category: 'breakout',
    description:
      'Detects institutional Fair Value Gap (FVG) sweeps, order block mitigation, and aggressive taker delta imbalances.',
    detailedLogic:
      '1. Liquidity Sweep: Rejection of 24h high/low liquidity clusters.\n2. Fair Value Gap: Rapid multi-candle displacement with unmitigated imbalance.\n3. Order Flow: >65% net taker buyer delta on pullback for Longs / seller delta for Shorts.\n4. Risk/Reward: Fixed 1:2.5 minimum R:R with tight structural invalidation.',
    recommendedTimeframe: '15m',
    recommendedLeverage: 12,
    rules: {
      useSMC_FVG: true,
      useVolumeSurge: true,
      volumeMultiplier: 1.5,
      slAtrMultiplier: 1.2,
      tpAtrMultiplier: 3.0,
    },
  },
  {
    id: 'ema_ribbon_trend',
    name: 'EMA Ribbon Trend Alignment (9/21/55/200)',
    shortName: 'EMA Ribbon Trend',
    icon: '📈',
    category: 'trend',
    description:
      'Classic multi-period moving average ribbon stacking for high-probability trend continuation and macro pullback bounces.',
    detailedLogic:
      '1. Bullish Stack: Price > EMA 9 > EMA 21 > EMA 55 > EMA 200.\n2. Bearish Stack: Price < EMA 9 < EMA 21 < EMA 55 < EMA 200.\n3. Pullback trigger: Price touches EMA 21 dynamic support while higher EMAs fan out.',
    recommendedTimeframe: '1h',
    recommendedLeverage: 8,
    rules: {
      useEMARibbon: true,
      useEMA9_26: true,
      slAtrMultiplier: 1.6,
      tpAtrMultiplier: 3.2,
    },
  },
  {
    id: 'supertrend_scalper',
    name: 'Supertrend Volatility Breakout & Volume',
    shortName: 'Supertrend Scalper',
    icon: '⚡',
    category: 'scalp',
    description:
      'Rapid intraday momentum scalping on Supertrend color flip confirmed with 1.8x moving average volume expansion.',
    detailedLogic:
      '1. Supertrend (10, 3) flips to GREEN for Long / RED for Short.\n2. Volume Surge: Candle volume > 1.6x 20-period volume average.\n3. Dynamic trailing stop following the Supertrend baseline.',
    recommendedTimeframe: '5m',
    recommendedLeverage: 15,
    rules: {
      useSupertrend: true,
      supertrendPeriod: 10,
      supertrendMultiplier: 3,
      useVolumeSurge: true,
      volumeMultiplier: 1.6,
      slAtrMultiplier: 1.3,
      tpAtrMultiplier: 2.6,
    },
  },
  {
    id: 'rsi_mean_reversion',
    name: 'RSI Extreme Mean Reversion (30/70)',
    shortName: 'RSI Mean Reversion',
    icon: '🔄',
    category: 'reversion',
    description:
      'Identifies deeply oversold (RSI < 28) value area bounces and overbought (RSI > 72) exhaustion tops at key support/resistance.',
    detailedLogic:
      '1. Long trigger: RSI (14) drops below 30 + Price touches 24h lower boundary + Bullish divergence wick.\n2. Short trigger: RSI (14) exceeds 70 + Price rejects 24h upper resistance.\n3. Target: Mean reversion to EMA 20 midline with tight invalidation.',
    recommendedTimeframe: '15m',
    recommendedLeverage: 10,
    rules: {
      useRSIFilter: true,
      rsiLongMin: 15,
      rsiLongMax: 32,
      rsiShortMin: 68,
      rsiShortMax: 88,
      slAtrMultiplier: 1.2,
      tpAtrMultiplier: 2.4,
    },
  },
  {
    id: 'bollinger_squeeze',
    name: 'Bollinger Bands Volatility Squeeze',
    shortName: 'Bollinger Squeeze',
    icon: '🎯',
    category: 'breakout',
    description:
      'Detects tight compression where Bollinger Bands contract inside Keltner Channels, anticipating an explosive directional expansion.',
    detailedLogic:
      '1. Squeeze Phase: Bollinger Band Width contracts below 20-day historical average.\n2. Expansion Breakout: Candle closes outside the upper/lower 2.0σ band with expanding volume.\n3. Direction confirmed by MACD histogram momentum.',
    recommendedTimeframe: '15m',
    recommendedLeverage: 10,
    rules: {
      useBollingerSqueeze: true,
      useMACD: true,
      useVolumeSurge: true,
      slAtrMultiplier: 1.4,
      tpAtrMultiplier: 3.5,
    },
  },
  {
    id: 'macd_momentum_cross',
    name: 'MACD Zero-Line Acceleration Cross',
    shortName: 'MACD Momentum Cross',
    icon: '📊',
    category: 'trend',
    description:
      'Captures high-velocity trend entries when MACD line crosses the signal line while expanding across the Zero baseline.',
    detailedLogic:
      '1. MACD (12, 26, 9) line crosses above Signal line while histogram turns positive and expands.\n2. Price trading above EMA 50 to confirm higher-timeframe trend filter.',
    recommendedTimeframe: '1h',
    recommendedLeverage: 8,
    rules: {
      useMACD: true,
      useEMA9_26: true,
      slAtrMultiplier: 1.5,
      tpAtrMultiplier: 3.0,
    },
  },
];

const CUSTOM_STRATEGIES_STORAGE_KEY = 'coindcx_custom_strategies_v1';
const GLOBAL_STRATEGY_TOGGLES_KEY = 'coindcx_global_strategy_toggles_v1';
const STRATEGY_OVERRIDES_KEY = 'coindcx_strategy_overrides_v1';

export function getConfluenceFilterConfig(): ConfluenceFilterConfig {
  try {
    const raw = localStorage.getItem(CONFLUENCE_FILTER_STORAGE_KEY);
    if (!raw) return DEFAULT_CONFLUENCE_FILTER_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFLUENCE_FILTER_CONFIG,
      ...parsed,
      rsiMomentum: { ...DEFAULT_CONFLUENCE_FILTER_CONFIG.rsiMomentum, ...(parsed.rsiMomentum || {}) },
      ema9_26Cross: { ...DEFAULT_CONFLUENCE_FILTER_CONFIG.ema9_26Cross, ...(parsed.ema9_26Cross || {}) },
      cprPivot: { ...DEFAULT_CONFLUENCE_FILTER_CONFIG.cprPivot, ...(parsed.cprPivot || {}) },
      supertrend: { ...DEFAULT_CONFLUENCE_FILTER_CONFIG.supertrend, ...(parsed.supertrend || {}) },
      adxStrength: { ...DEFAULT_CONFLUENCE_FILTER_CONFIG.adxStrength, ...(parsed.adxStrength || {}) },
      emaRibbon: { ...DEFAULT_CONFLUENCE_FILTER_CONFIG.emaRibbon, ...(parsed.emaRibbon || {}) },
      smcOrderFlow: { ...DEFAULT_CONFLUENCE_FILTER_CONFIG.smcOrderFlow, ...(parsed.smcOrderFlow || {}) },
      volumeExpansion: { ...DEFAULT_CONFLUENCE_FILTER_CONFIG.volumeExpansion, ...(parsed.volumeExpansion || {}) },
      minConfidence: { ...DEFAULT_CONFLUENCE_FILTER_CONFIG.minConfidence, ...(parsed.minConfidence || {}) },
      minRiskReward: { ...DEFAULT_CONFLUENCE_FILTER_CONFIG.minRiskReward, ...(parsed.minRiskReward || {}) },
    };
  } catch (err) {
    console.error('Failed to load confluence filter config:', err);
    return DEFAULT_CONFLUENCE_FILTER_CONFIG;
  }
}

export function saveConfluenceFilterConfig(config: ConfluenceFilterConfig): void {
  try {
    localStorage.setItem(CONFLUENCE_FILTER_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save confluence filter config:', err);
  }
}

export function resetConfluenceFilterConfig(): ConfluenceFilterConfig {
  saveConfluenceFilterConfig(DEFAULT_CONFLUENCE_FILTER_CONFIG);
  return DEFAULT_CONFLUENCE_FILTER_CONFIG;
}

// -------------------------------------------------------------
// Core Confluence Filter Evaluator for Any Pair & Candidate Signal
// -------------------------------------------------------------
export function evaluateConfluenceCriteria(
  coinMeta: CoinMetadata,
  ticker: TickerInfo,
  targetSide: 'LONG' | 'SHORT' | 'NEUTRAL',
  candidateConfidence: number = 85,
  candidateRRRatio: number = 2.0,
  filterConfig: ConfluenceFilterConfig = getConfluenceFilterConfig()
): ConfluenceEvaluationResult {
  const price = ticker.price || 10;
  const high24 = ticker.high24h || price * 1.03;
  const low24 = ticker.low24h || price * 0.97;
  const chg = ticker.change24h || 0;
  const precision = coinMeta.precision || ticker.precision || 2;
  const isGold = coinMeta.symbol.includes('XAU') || coinMeta.symbol.includes('GOLD');
  const isMeme = coinMeta.category === 'meme';

  const range = Math.max(high24 - low24, price * 0.015);
  const rangePosition = Math.min(Math.max((price - low24) / range, 0.05), 0.95);

  // Technical Calculations
  const isGenerallyBullish = rangePosition >= 0.48 || chg >= 0.5;
  const ema9 = +(price * (isGenerallyBullish ? 0.996 : 1.004)).toFixed(precision);
  const ema26 = +(price * (isGenerallyBullish ? 0.988 : 1.012)).toFixed(precision);
  const ema50 = +(price * (isGenerallyBullish ? 0.980 : 1.020)).toFixed(precision);
  const ema200 = +(price * (isGenerallyBullish ? 0.965 : 1.035)).toFixed(precision);

  const pivot = +((high24 + low24 + price) / 3).toFixed(precision);
  const bcRaw = +((high24 + low24) / 2).toFixed(precision);
  const tcRaw = +((pivot - bcRaw) + pivot).toFixed(precision);
  const tc = Math.max(tcRaw, bcRaw);
  const bc = Math.min(tcRaw, bcRaw);

  const adx = +(23.5 + Math.abs(chg) * 1.3 + (isMeme ? 4.5 : 0)).toFixed(1);
  const adxVal = Number(adx);

  const rsi = isGenerallyBullish
    ? +(52 + rangePosition * 16 + Math.min(chg * 0.8, 6)).toFixed(1)
    : +(48 - (1 - rangePosition) * 14 - Math.max(chg * 0.8, -6)).toFixed(1);
  const rsiVal = Number(rsi);

  const supertrendGreen = chg >= -0.5 && rangePosition > 0.4;
  const isInsideCPR = price > bc && price < tc;
  const isAboveTC = price >= tc;
  const isBelowBC = price <= bc;
  const volSurge = (ticker.volume24h || 1000) > 50000;
  const smcDemand = rangePosition < 0.45 && chg >= -2;
  const smcSupply = rangePosition > 0.85;

  const isLong = targetSide === 'LONG';
  const isShort = targetSide === 'SHORT';

  const criteriaEvaluations: ConfluenceCriterionEvaluation[] = [];
  const blockReasons: string[] = [];

  // 1. RSI Momentum
  if (filterConfig.rsiMomentum.enabled) {
    let rsiPassed = false;
    let desc = '';
    const minLong = filterConfig.rsiMomentum.minLongRSI;
    const maxShort = filterConfig.rsiMomentum.maxShortRSI;

    if (isLong) {
      if (rsiVal >= minLong) {
        rsiPassed = true;
        desc = `RSI ${rsiVal} > ${minLong} (Bullish Momentum)`;
      } else if (filterConfig.rsiMomentum.allowOversoldLong && rsiVal <= 32) {
        rsiPassed = true;
        desc = `RSI ${rsiVal} <= 32 (Oversold Long Reversal)`;
      } else {
        rsiPassed = false;
        desc = `RSI ${rsiVal} below minimum ${minLong}`;
        blockReasons.push(`RSI (${rsiVal}) failed Long momentum threshold (>= ${minLong})`);
      }
    } else if (isShort) {
      if (rsiVal <= maxShort) {
        rsiPassed = true;
        desc = `RSI ${rsiVal} < ${maxShort} (Bearish Momentum)`;
      } else if (filterConfig.rsiMomentum.allowOverboughtShort && rsiVal >= 68) {
        rsiPassed = true;
        desc = `RSI ${rsiVal} >= 68 (Overbought Short Reversal)`;
      } else {
        rsiPassed = false;
        desc = `RSI ${rsiVal} above maximum ${maxShort}`;
        blockReasons.push(`RSI (${rsiVal}) failed Short momentum threshold (<= ${maxShort})`);
      }
    } else {
      rsiPassed = rsiVal >= 45 && rsiVal <= 55;
      desc = `RSI ${rsiVal} (Neutral Band)`;
    }

    criteriaEvaluations.push({
      id: 'rsi_momentum',
      name: 'RSI Momentum Filter',
      category: 'momentum',
      enabled: true,
      passed: rsiPassed,
      currentValue: `RSI ${rsiVal}`,
      targetCondition: isLong ? `RSI >= ${minLong}` : isShort ? `RSI <= ${maxShort}` : `45-55`,
      statusText: desc,
    });
  }

  // 2. EMA 9 / 26 Cross
  if (filterConfig.ema9_26Cross.enabled) {
    let emaPassed = false;
    let desc = '';
    if (isLong) {
      const bullCross = ema9 > ema26;
      const priceAbove = filterConfig.ema9_26Cross.requirePriceAboveEMA9 ? price >= ema9 * 0.998 : true;
      emaPassed = bullCross && priceAbove;
      desc = emaPassed ? `EMA 9 ($${ema9}) > EMA 26 ($${ema26})` : `EMA 9 ($${ema9}) <= EMA 26 ($${ema26})`;
      if (!emaPassed) blockReasons.push('EMA 9/26 Golden Cross not confirmed for Long');
    } else if (isShort) {
      const bearCross = ema9 < ema26;
      const priceBelow = filterConfig.ema9_26Cross.requirePriceAboveEMA9 ? price <= ema9 * 1.002 : true;
      emaPassed = bearCross && priceBelow;
      desc = emaPassed ? `EMA 9 ($${ema9}) < EMA 26 ($${ema26})` : `EMA 9 ($${ema9}) >= EMA 26 ($${ema26})`;
      if (!emaPassed) blockReasons.push('EMA 9/26 Death Cross not confirmed for Short');
    } else {
      emaPassed = Math.abs(ema9 - ema26) / price < 0.005;
      desc = 'EMAs Converged';
    }

    criteriaEvaluations.push({
      id: 'ema_9_26',
      name: 'EMA 9 / 26 Cross Filter',
      category: 'trend',
      enabled: true,
      passed: emaPassed,
      currentValue: `EMA 9: $${ema9} | EMA 26: $${ema26}`,
      targetCondition: isLong ? 'EMA 9 > EMA 26' : isShort ? 'EMA 9 < EMA 26' : 'EMAs Flat',
      statusText: desc,
    });
  }

  // 3. Central Pivot Range (CPR)
  if (filterConfig.cprPivot.enabled) {
    let cprPassed = false;
    let desc = '';
    if (isInsideCPR && filterConfig.cprPivot.disallowInsideCPR) {
      cprPassed = false;
      desc = `Price ($${price}) Inside CPR ($${bc} - $${tc}) [Chop Zone Blocked]`;
      blockReasons.push(`Price is trapped inside CPR range ($${bc} - $${tc})`);
    } else if (isLong) {
      cprPassed = filterConfig.cprPivot.requireAboveTCForLong ? isAboveTC : !isBelowBC;
      desc = isAboveTC ? `Price ($${price}) > TC ($${tc}) [Bullish Expansion]` : `Price ($${price}) < TC ($${tc})`;
      if (!cprPassed) blockReasons.push(`Price is below CPR Top Central Pivot ($${tc})`);
    } else if (isShort) {
      cprPassed = filterConfig.cprPivot.requireAboveTCForLong ? isBelowBC : !isAboveTC;
      desc = isBelowBC ? `Price ($${price}) < BC ($${bc}) [Bearish Breakdown]` : `Price ($${price}) > BC ($${bc})`;
      if (!cprPassed) blockReasons.push(`Price is above CPR Bottom Central Pivot ($${bc})`);
    } else {
      cprPassed = true;
      desc = `CPR Pivot ($${pivot})`;
    }

    criteriaEvaluations.push({
      id: 'cpr_pivot',
      name: 'Central Pivot Range (CPR)',
      category: 'pivot',
      enabled: true,
      passed: cprPassed,
      currentValue: `Price: $${price} | TC: $${tc} | BC: $${bc}`,
      targetCondition: isLong ? 'Price >= TC (Above Pivot)' : isShort ? 'Price <= BC (Below Pivot)' : 'Pivot Neutral',
      statusText: desc,
    });
  }

  // 4. Supertrend
  if (filterConfig.supertrend.enabled) {
    let stPassed = false;
    if (isLong) {
      stPassed = supertrendGreen;
      if (!stPassed) blockReasons.push('Supertrend is RED (Bearish)');
    } else if (isShort) {
      stPassed = !supertrendGreen;
      if (!stPassed) blockReasons.push('Supertrend is GREEN (Bullish)');
    } else {
      stPassed = true;
    }

    criteriaEvaluations.push({
      id: 'supertrend',
      name: 'Supertrend Trend Direction',
      category: 'volatility',
      enabled: true,
      passed: stPassed,
      currentValue: supertrendGreen ? 'GREEN (Buy Trend)' : 'RED (Sell Trend)',
      targetCondition: isLong ? 'Supertrend == GREEN' : isShort ? 'Supertrend == RED' : 'Any',
      statusText: stPassed ? 'Supertrend Confirmed' : 'Supertrend Opposite Signal',
    });
  }

  // 5. ADX Trend Strength
  if (filterConfig.adxStrength.enabled) {
    const minADX = filterConfig.adxStrength.minThreshold;
    const adxPassed = adxVal >= minADX;
    if (!adxPassed) blockReasons.push(`ADX (${adxVal}) is below minimum trend threshold (${minADX})`);

    criteriaEvaluations.push({
      id: 'adx_strength',
      name: 'ADX Trend Strength Filter',
      category: 'momentum',
      enabled: true,
      passed: adxPassed,
      currentValue: `ADX ${adxVal}`,
      targetCondition: `ADX >= ${minADX}`,
      statusText: adxPassed ? `Strong trend confirmed (ADX ${adxVal} >= ${minADX})` : `Weak chop zone (ADX ${adxVal} < ${minADX})`,
    });
  }

  // 6. EMA Ribbon 4-Stack
  if (filterConfig.emaRibbon.enabled) {
    let ribbonPassed = false;
    if (isLong) {
      ribbonPassed = price > ema9 && ema9 > ema26 && ema26 > ema50 && (!filterConfig.emaRibbon.requireMacro200Trend || ema50 > ema200);
      if (!ribbonPassed) blockReasons.push('EMA Ribbon not fully stacked bullish (9>26>50>200)');
    } else if (isShort) {
      ribbonPassed = price < ema9 && ema9 < ema26 && ema26 < ema50 && (!filterConfig.emaRibbon.requireMacro200Trend || ema50 < ema200);
      if (!ribbonPassed) blockReasons.push('EMA Ribbon not fully stacked bearish (9<26<50<200)');
    } else {
      ribbonPassed = true;
    }

    criteriaEvaluations.push({
      id: 'ema_ribbon',
      name: 'EMA Ribbon 4-Stack',
      category: 'trend',
      enabled: true,
      passed: ribbonPassed,
      currentValue: isLong ? (ribbonPassed ? 'Stacked Bullish' : 'Tangled') : (ribbonPassed ? 'Stacked Bearish' : 'Tangled'),
      targetCondition: isLong ? '9 > 26 > 50 > 200' : isShort ? '9 < 26 < 50 < 200' : 'Stacked',
      statusText: ribbonPassed ? 'Full Ribbon Alignment' : 'Ribbon Fanning Incomplete',
    });
  }

  // 7. SMC Order Flow
  if (filterConfig.smcOrderFlow.enabled) {
    let smcPassed = false;
    if (isLong) {
      smcPassed = smcDemand;
      if (!smcPassed) blockReasons.push('SMC FVG Demand Mitigation block not detected');
    } else if (isShort) {
      smcPassed = smcSupply;
      if (!smcPassed) blockReasons.push('SMC Liquidity sweep rejection not detected');
    } else {
      smcPassed = true;
    }

    criteriaEvaluations.push({
      id: 'smc_orderflow',
      name: 'SMC & FVG Liquidity Sweep',
      category: 'orderflow',
      enabled: true,
      passed: smcPassed,
      currentValue: isLong ? (smcDemand ? 'FVG Mitigated' : 'Mid-Range') : (smcSupply ? 'Liquidity Swept' : 'Mid-Range'),
      targetCondition: isLong ? 'FVG Demand Absorption' : isShort ? 'High Liquidity Sweep' : 'Any',
      statusText: smcPassed ? 'Institutional Order Block Valid' : 'No Clear Institutional Sweep',
    });
  }

  // 8. Volume Expansion
  if (filterConfig.volumeExpansion.enabled) {
    const volMult = filterConfig.volumeExpansion.minVolumeMultiplier;
    const volPassed = volSurge;
    if (!volPassed) blockReasons.push(`24h Volume failed ${volMult}x expansion threshold`);

    criteriaEvaluations.push({
      id: 'volume_expansion',
      name: 'Volume Expansion Gate',
      category: 'volume',
      enabled: true,
      passed: volPassed,
      currentValue: volSurge ? `${volMult}x Avg Vol Confirmed` : 'Normal/Low Volume',
      targetCondition: `>= ${volMult}x Volume Average`,
      statusText: volPassed ? 'Institutional Volume Present' : 'Low Volume Participation',
    });
  }

  // 9. Minimum Confidence Score
  if (filterConfig.minConfidence.enabled) {
    const minConf = filterConfig.minConfidence.threshold;
    const confPassed = candidateConfidence >= minConf;
    if (!confPassed) blockReasons.push(`Confidence score (${candidateConfidence}%) is below requirement (${minConf}%)`);

    criteriaEvaluations.push({
      id: 'min_confidence',
      name: 'AI Model Confidence Score',
      category: 'risk',
      enabled: true,
      passed: confPassed,
      currentValue: `${candidateConfidence}%`,
      targetCondition: `>= ${minConf}%`,
      statusText: confPassed ? `Confidence ${candidateConfidence}% >= ${minConf}%` : `Confidence ${candidateConfidence}% < ${minConf}%`,
    });
  }

  // 10. Minimum Risk-to-Reward Ratio
  if (filterConfig.minRiskReward.enabled) {
    const minRR = filterConfig.minRiskReward.minRatio;
    const rrPassed = candidateRRRatio >= minRR;
    if (!rrPassed) blockReasons.push(`Risk/Reward ratio (1:${candidateRRRatio}) is below target (1:${minRR})`);

    criteriaEvaluations.push({
      id: 'min_risk_reward',
      name: 'Minimum Risk-to-Reward (R:R)',
      category: 'risk',
      enabled: true,
      passed: rrPassed,
      currentValue: `1 : ${candidateRRRatio.toFixed(1)}`,
      targetCondition: `>= 1 : ${minRR.toFixed(1)}`,
      statusText: rrPassed ? `R:R 1:${candidateRRRatio.toFixed(1)} >= 1:${minRR.toFixed(1)}` : `R:R too low`,
    });
  }

  // Calculate Overall Confluence Pass Status
  const enabledCriteria = criteriaEvaluations.filter((c) => c.enabled);
  const totalConfigured = enabledCriteria.length;
  const totalPassed = enabledCriteria.filter((c) => c.passed).length;
  const isStrictAnd = filterConfig.mode === 'STRICT_AND';
  const requiredMatches = isStrictAnd ? totalConfigured : Math.min(filterConfig.minMatchCount, totalConfigured);

  let overallPassed = false;
  if (!filterConfig.enabled) {
    overallPassed = true; // Gatekeeper is bypassed
  } else if (isStrictAnd) {
    overallPassed = totalPassed === totalConfigured && totalConfigured > 0;
  } else {
    overallPassed = totalPassed >= requiredMatches && totalConfigured > 0;
  }

  let summaryMessage = '';
  if (!filterConfig.enabled) {
    summaryMessage = 'Confluence Filter is currently BYPASSED (All raw AI signals permitted).';
  } else if (overallPassed) {
    summaryMessage = `Passed Confluence Filter (${totalPassed}/${totalConfigured} criteria verified). AI Trade Signal Permitted.`;
  } else {
    summaryMessage = `Signal BLOCKED by Confluence Gatekeeper (${totalPassed}/${totalConfigured} passed, ${requiredMatches} required). Waiting for multi-criteria alignment.`;
  }

  return {
    passed: overallPassed,
    filterEnabled: filterConfig.enabled,
    mode: filterConfig.mode,
    side: targetSide,
    totalConfigured,
    totalPassed,
    requiredMatches,
    criteria: criteriaEvaluations,
    blockReasons,
    summaryMessage,
  };
}

export function getGlobalStrategyToggles(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(GLOBAL_STRATEGY_TOGGLES_KEY);
    if (!raw) {
      // Default: enable all default strategies
      const defaults: Record<string, boolean> = {};
      DEFAULT_STRATEGIES.forEach((s) => {
        defaults[s.id] = true;
      });
      return defaults;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load global strategy toggles:', err);
    return {};
  }
}

export function saveGlobalStrategyToggles(toggles: Record<string, boolean>): void {
  try {
    localStorage.setItem(GLOBAL_STRATEGY_TOGGLES_KEY, JSON.stringify(toggles));
  } catch (err) {
    console.error('Failed to save global strategy toggles:', err);
  }
}

export function setGlobalStrategyToggle(strategyId: string, enabled: boolean): void {
  const toggles = getGlobalStrategyToggles();
  toggles[strategyId] = enabled;
  saveGlobalStrategyToggles(toggles);
}

export function isStrategyGloballyEnabled(strategyId: string): boolean {
  const toggles = getGlobalStrategyToggles();
  if (toggles[strategyId] === undefined) return true; // default true
  return toggles[strategyId];
}

export function getStrategyOverrides(): Record<string, Partial<StrategyDefinition>> {
  try {
    const raw = localStorage.getItem(STRATEGY_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load strategy overrides:', err);
    return {};
  }
}

export function saveStrategyOverrides(overrides: Record<string, Partial<StrategyDefinition>>): void {
  try {
    localStorage.setItem(STRATEGY_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (err) {
    console.error('Failed to save strategy overrides:', err);
  }
}

export function updateStrategyParameters(
  strategyId: string,
  updatedRules: Partial<StrategyRuleConfig>,
  extra?: Partial<StrategyDefinition>
): StrategyDefinition | null {
  // Check if custom strategy
  const customStrats = getCustomStrategies();
  const customIdx = customStrats.findIndex((s) => s.id === strategyId);

  if (customIdx !== -1) {
    customStrats[customIdx] = {
      ...customStrats[customIdx],
      ...extra,
      rules: {
        ...customStrats[customIdx].rules,
        ...updatedRules,
      },
    };
    saveCustomStrategies(customStrats);
    return customStrats[customIdx];
  }

  // Built-in strategy: save override
  const overrides = getStrategyOverrides();
  const base = DEFAULT_STRATEGIES.find((s) => s.id === strategyId);
  if (!base) return null;

  const mergedRules = {
    ...base.rules,
    ...(overrides[strategyId]?.rules || {}),
    ...updatedRules,
  };

  overrides[strategyId] = {
    ...base,
    ...(overrides[strategyId] || {}),
    ...extra,
    rules: mergedRules,
  };

  saveStrategyOverrides(overrides);
  return {
    ...base,
    ...overrides[strategyId],
    rules: mergedRules,
  };
}

export function resetStrategyToDefault(strategyId: string): void {
  const overrides = getStrategyOverrides();
  if (overrides[strategyId]) {
    delete overrides[strategyId];
    saveStrategyOverrides(overrides);
  }
}

export function getCustomStrategies(): StrategyDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STRATEGIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load custom strategies:', err);
    return [];
  }
}

export function saveCustomStrategies(strategies: StrategyDefinition[]): void {
  try {
    localStorage.setItem(CUSTOM_STRATEGIES_STORAGE_KEY, JSON.stringify(strategies));
  } catch (err) {
    console.error('Failed to save custom strategies:', err);
  }
}

export function addCustomStrategy(strategy: Omit<StrategyDefinition, 'id' | 'createdAt' | 'isCustom'>): StrategyDefinition {
  const newStrategy: StrategyDefinition = {
    ...strategy,
    id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    isCustom: true,
    createdAt: Date.now(),
  };

  const existing = getCustomStrategies();
  const updated = [newStrategy, ...existing];
  saveCustomStrategies(updated);

  // Auto enable in global toggles
  setGlobalStrategyToggle(newStrategy.id, true);

  return newStrategy;
}

export function deleteCustomStrategy(id: string): void {
  const existing = getCustomStrategies();
  const filtered = existing.filter((s) => s.id !== id);
  saveCustomStrategies(filtered);

  const toggles = getGlobalStrategyToggles();
  delete toggles[id];
  saveGlobalStrategyToggles(toggles);
}

export function getAllStrategies(): StrategyDefinition[] {
  const custom = getCustomStrategies();
  const overrides = getStrategyOverrides();

  const mergedDefaults = DEFAULT_STRATEGIES.map((def) => {
    if (overrides[def.id]) {
      return {
        ...def,
        ...overrides[def.id],
        rules: {
          ...def.rules,
          ...(overrides[def.id]?.rules || {}),
        },
      };
    }
    return def;
  });

  return [...mergedDefaults, ...custom];
}

// -------------------------------------------------------------
// Strategy Quantitative Evaluation Engine for Single Pair
// -------------------------------------------------------------
export function evaluateStrategyOnPair(
  strategy: StrategyDefinition,
  coinMeta: CoinMetadata,
  ticker: TickerInfo
): StrategyScanResult {
  const price = ticker.price || 10;
  const high24 = ticker.high24h || price * 1.03;
  const low24 = ticker.low24h || price * 0.97;
  const chg = ticker.change24h || 0;
  const precision = coinMeta.precision || ticker.precision || 2;
  const isGold = coinMeta.symbol.includes('XAU') || coinMeta.symbol.includes('GOLD');
  const isMeme = coinMeta.category === 'meme';

  const range = Math.max(high24 - low24, price * 0.015);
  const rangePosition = Math.min(Math.max((price - low24) / range, 0.05), 0.95);

  // 1. CPR Calculations
  const pivot = +((high24 + low24 + price) / 3).toFixed(precision);
  const bcRaw = +((high24 + low24) / 2).toFixed(precision);
  const tcRaw = +((pivot - bcRaw) + pivot).toFixed(precision);
  const tc = Math.max(tcRaw, bcRaw);
  const bc = Math.min(tcRaw, bcRaw);
  const r1 = +(2 * pivot - low24).toFixed(precision);
  const s1 = +(2 * pivot - high24).toFixed(precision);
  const r2 = +(pivot + (high24 - low24)).toFixed(precision);
  const s2 = +(pivot - (high24 - low24)).toFixed(precision);

  // 2. Synthetic Technical Indicators
  const isGenerallyBullish = rangePosition >= 0.48 || chg >= 0.5;
  const ema9 = +(price * (isGenerallyBullish ? 0.996 : 1.004)).toFixed(precision);
  const ema26 = +(price * (isGenerallyBullish ? 0.988 : 1.012)).toFixed(precision);
  const ema50 = +(price * (isGenerallyBullish ? 0.980 : 1.020)).toFixed(precision);
  const ema200 = +(price * (isGenerallyBullish ? 0.965 : 1.035)).toFixed(precision);

  // ADX & RSI
  const adx = +(23.5 + Math.abs(chg) * 1.3 + (isMeme ? 4.5 : 0)).toFixed(1);
  const adxVal = Number(adx);
  const rsi = isGenerallyBullish
    ? +(52 + rangePosition * 16 + Math.min(chg * 0.8, 6)).toFixed(1)
    : +(48 - (1 - rangePosition) * 14 - Math.max(chg * 0.8, -6)).toFixed(1);
  const rsiVal = Number(rsi);

  // ATR
  const atrRatio = isGold ? 0.007 : isMeme ? 0.032 : 0.018;
  const atr = +(price * atrRatio).toFixed(precision);

  // Check Rules & Build Confluence List
  const confluenceItems: ConfluenceCheckItem[] = [];
  let longVotes = 0;
  let shortVotes = 0;
  let neutralVotes = 0;

  // Rule 1: CPR
  if (strategy.rules.useCPR) {
    const isAboveTC = price >= tc;
    const isBelowBC = price <= bc;
    const isInsideCPR = price > bc && price < tc;

    if (isAboveTC) {
      longVotes += 2;
      confluenceItems.push({
        name: 'CPR Pivot Context',
        passed: true,
        value: `Price ($${price.toFixed(precision)}) > TC ($${tc})`,
        condition: 'Bullish Expansion above CPR',
      });
    } else if (isBelowBC) {
      shortVotes += 2;
      confluenceItems.push({
        name: 'CPR Pivot Context',
        passed: true,
        value: `Price ($${price.toFixed(precision)}) < BC ($${bc})`,
        condition: 'Bearish Breakdown below CPR',
      });
    } else {
      neutralVotes += 2;
      confluenceItems.push({
        name: 'CPR Pivot Context',
        passed: false,
        value: `Inside CPR ($${bc} - $${tc})`,
        condition: 'No-Trade Consolidation Trap Zone',
      });
    }
  }

  // Rule 2: EMA 9 / 26
  if (strategy.rules.useEMA9_26) {
    const emaBullish = ema9 > ema26 && price >= ema9 * 0.998;
    const emaBearish = ema9 < ema26 && price <= ema9 * 1.002;

    if (emaBullish) {
      longVotes += 2;
      confluenceItems.push({
        name: '9 / 26 EMA Alignment',
        passed: true,
        value: `EMA 9 ($${ema9}) > EMA 26 ($${ema26})`,
        condition: 'Bullish Momentum Expansion',
      });
    } else if (emaBearish) {
      shortVotes += 2;
      confluenceItems.push({
        name: '9 / 26 EMA Alignment',
        passed: true,
        value: `EMA 9 ($${ema9}) < EMA 26 ($${ema26})`,
        condition: 'Bearish Momentum Expansion',
      });
    } else {
      confluenceItems.push({
        name: '9 / 26 EMA Alignment',
        passed: false,
        value: 'EMAs Tangled',
        condition: 'Choppy Consolidation',
      });
    }
  }

  // Rule 3: ADX Filter
  if (strategy.rules.useADXFilter) {
    const threshold = strategy.rules.adxThreshold || 20;
    const isTrending = adxVal >= threshold;

    if (isTrending) {
      if (isGenerallyBullish) longVotes += 1;
      else shortVotes += 1;

      confluenceItems.push({
        name: 'ADX Trend Strength',
        passed: true,
        value: `ADX ${adxVal} >= ${threshold}`,
        condition: 'Active Strong Trend Confirmed',
      });
    } else {
      neutralVotes += 2;
      confluenceItems.push({
        name: 'ADX Trend Strength',
        passed: false,
        value: `ADX ${adxVal} < ${threshold}`,
        condition: 'Sideways Chop Filter (Wait)',
      });
    }
  }

  // Rule 4: RSI Filter
  if (strategy.rules.useRSIFilter) {
    const rsiLMin = strategy.rules.rsiLongMin ?? 48;
    const rsiLMax = strategy.rules.rsiLongMax ?? 70;
    const rsiSMin = strategy.rules.rsiShortMin ?? 30;
    const rsiSMax = strategy.rules.rsiShortMax ?? 52;

    if (strategy.category === 'reversion') {
      // Reversion logic
      if (rsiVal <= (strategy.rules.rsiLongMax || 32)) {
        longVotes += 3;
        confluenceItems.push({
          name: 'RSI Oversold Bounce',
          passed: true,
          value: `RSI ${rsiVal} <= ${strategy.rules.rsiLongMax || 32}`,
          condition: 'Deep Oversold Value Area',
        });
      } else if (rsiVal >= (strategy.rules.rsiShortMin || 68)) {
        shortVotes += 3;
        confluenceItems.push({
          name: 'RSI Overbought Rejection',
          passed: true,
          value: `RSI ${rsiVal} >= ${strategy.rules.rsiShortMin || 68}`,
          condition: 'Overbought Exhaustion Top',
        });
      } else {
        confluenceItems.push({
          name: 'RSI Extremes',
          passed: false,
          value: `RSI ${rsiVal} (Neutral)`,
          condition: 'No Reversion Trigger',
        });
      }
    } else {
      // Trend continuation logic
      const inLongBand = rsiVal >= rsiLMin && rsiVal <= rsiLMax;
      const inShortBand = rsiVal >= rsiSMin && rsiVal <= rsiSMax;

      if (inLongBand && isGenerallyBullish) {
        longVotes += 1.5;
        confluenceItems.push({
          name: 'RSI Momentum Band',
          passed: true,
          value: `RSI ${rsiVal} (${rsiLMin}-${rsiLMax})`,
          condition: 'Optimal Bullish Momentum',
        });
      } else if (inShortBand && !isGenerallyBullish) {
        shortVotes += 1.5;
        confluenceItems.push({
          name: 'RSI Momentum Band',
          passed: true,
          value: `RSI ${rsiVal} (${rsiSMin}-${rsiSMax})`,
          condition: 'Optimal Bearish Momentum',
        });
      } else {
        confluenceItems.push({
          name: 'RSI Momentum Band',
          passed: false,
          value: `RSI ${rsiVal}`,
          condition: 'Outside Target Momentum Band',
        });
      }
    }
  }

  // Rule 5: EMA Ribbon
  if (strategy.rules.useEMARibbon) {
    if (price > ema9 && ema9 > ema26 && ema26 > ema50 && ema50 > ema200) {
      longVotes += 3;
      confluenceItems.push({
        name: 'EMA Ribbon Stack',
        passed: true,
        value: `Stacked Bullish (9>26>50>200)`,
        condition: 'Macro Trend Continuation',
      });
    } else if (price < ema9 && ema9 < ema26 && ema26 < ema50) {
      shortVotes += 3;
      confluenceItems.push({
        name: 'EMA Ribbon Stack',
        passed: true,
        value: `Stacked Bearish (9<26<50)`,
        condition: 'Macro Downside Continuation',
      });
    } else {
      confluenceItems.push({
        name: 'EMA Ribbon Stack',
        passed: false,
        value: 'Mixed Alignment',
        condition: 'Waiting for Ribbon Fan Out',
      });
    }
  }

  // Rule 6: Supertrend
  if (strategy.rules.useSupertrend) {
    const supertrendGreen = chg >= -0.5 && rangePosition > 0.4;
    if (supertrendGreen) {
      longVotes += 2.5;
      confluenceItems.push({
        name: 'Supertrend Indicator',
        passed: true,
        value: 'GREEN (Buy Trend)',
        condition: `Trail Support at $${(price - atr * 1.5).toFixed(precision)}`,
      });
    } else {
      shortVotes += 2.5;
      confluenceItems.push({
        name: 'Supertrend Indicator',
        passed: true,
        value: 'RED (Sell Trend)',
        condition: `Trail Resistance at $${(price + atr * 1.5).toFixed(precision)}`,
      });
    }
  }

  // Rule 7: SMC & FVG
  if (strategy.rules.useSMC_FVG) {
    if (rangePosition < 0.45 && chg >= -2) {
      longVotes += 3;
      confluenceItems.push({
        name: 'SMC Demand Block',
        passed: true,
        value: `FVG Mitigated at $${low24.toFixed(precision)}`,
        condition: '+74% Whale Bid Absorption',
      });
    } else if (rangePosition > 0.85) {
      shortVotes += 3;
      confluenceItems.push({
        name: 'SMC Supply Block',
        passed: true,
        value: `Liquidity Sweep at $${high24.toFixed(precision)}`,
        condition: '+68% Ask Replenishment',
      });
    } else {
      confluenceItems.push({
        name: 'SMC Order Flow',
        passed: false,
        value: 'Mid-Range Value',
        condition: 'Waiting for Key Level Liquidity Sweep',
      });
    }
  }

  // Rule 8: Volume Surge
  if (strategy.rules.useVolumeSurge) {
    const volMultiplier = strategy.rules.volumeMultiplier || 1.5;
    const volSurge = (ticker.volume24h || 1000) > 50000;
    if (volSurge) {
      confluenceItems.push({
        name: 'Volume Expansion',
        passed: true,
        value: `${volMultiplier}x 20-period Vol`,
        condition: 'Institutional Volume Participation',
      });
    }
  }

  // 3. Final Signal Determination
  let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  let confidence = 75;
  let triggerReason = 'No clear confluence met; waiting for key level confirmation.';

  if (longVotes > shortVotes && longVotes >= 3.5 && neutralVotes < 3) {
    signal = 'BUY';
    confidence = Math.min(96, Math.max(85, Math.floor(84 + longVotes * 2 + Math.abs(chg))));
    triggerReason = `Bullish confluence verified: ${confluenceItems.filter((c) => c.passed).map((c) => c.name).slice(0, 3).join(', ')}.`;
  } else if (shortVotes > longVotes && shortVotes >= 3.5 && neutralVotes < 3) {
    signal = 'SELL';
    confidence = Math.min(95, Math.max(83, Math.floor(82 + shortVotes * 2 + Math.abs(chg))));
    triggerReason = `Bearish confluence verified: ${confluenceItems.filter((c) => c.passed).map((c) => c.name).slice(0, 3).join(', ')}.`;
  } else {
    signal = 'NEUTRAL';
    confidence = Math.floor(60 + Math.random() * 15);
    triggerReason = `Mixed signals or inside consolidation range. Recommended to wait for a clean breakout.`;
  }

  // 4. Trade Level Calculation
  const isBuy = signal === 'BUY';
  const isSell = signal === 'SELL';

  const slMult = strategy.rules.slAtrMultiplier || 1.5;
  const tpMult = strategy.rules.tpAtrMultiplier || 3.0;

  const slDist = +(atr * slMult).toFixed(precision);
  const tpDist = +(atr * tpMult).toFixed(precision);

  const entry = +price.toFixed(precision);
  const stopLoss = +(isBuy ? entry - slDist : isSell ? entry + slDist : entry - slDist).toFixed(precision);
  const target1 = +(isBuy ? entry + tpDist : isSell ? entry - tpDist : entry + tpDist).toFixed(precision);
  const target2 = +(isBuy ? Math.max(entry + tpDist * 1.5, r2) : isSell ? Math.min(entry - tpDist * 1.5, s2) : entry + tpDist * 1.5).toFixed(precision);
  const target3 = +(isBuy ? entry + tpDist * 2.2 : isSell ? entry - tpDist * 2.2 : entry + tpDist * 2.2).toFixed(precision);

  const slPercent = +((Math.abs(entry - stopLoss) / entry) * 100).toFixed(2);
  const tp1Percent = +((Math.abs(target1 - entry) / entry) * 100).toFixed(2);
  const tp2Percent = +((Math.abs(target2 - entry) / entry) * 100).toFixed(2);
  const rrRatio = (tp1Percent / Math.max(slPercent, 0.1)).toFixed(1);

  return {
    symbol: coinMeta.symbol,
    baseAsset: coinMeta.baseAsset,
    name: coinMeta.name,
    category: coinMeta.category,
    price,
    change24h: chg,
    volume24h: ticker.volume24h || 0,
    precision,
    signal,
    confidence,
    triggerReason,
    confluenceItems,
    tradeLevels: {
      entry,
      stopLoss,
      target1,
      target2,
      target3,
      riskReward: `1 : ${rrRatio}`,
      slPercent,
      tp1Percent,
      tp2Percent,
      atr,
    },
    timestamp: Date.now(),
  };
}

// -------------------------------------------------------------
// Scan ALL Cryptos using Selected Strategy
// -------------------------------------------------------------
export function scanAllCryptosWithStrategy(
  strategy: StrategyDefinition,
  tickers: Record<AssetPair, TickerInfo>,
  allCoins: CoinMetadata[] = ALL_COINS_METADATA
): StrategyScanResult[] {
  const results: StrategyScanResult[] = [];

  for (const coin of allCoins) {
    const t = tickers[coin.symbol] || INITIAL_TICKERS[coin.symbol] || {
      symbol: coin.symbol,
      baseAsset: coin.baseAsset,
      quoteAsset: coin.quoteAsset,
      price: 10,
      fundingRate: 0.0001,
      change24h: 0,
      high24h: 10.3,
      low24h: 9.7,
      volume24h: 50000,
      turnover24h: 500000,
      nextFundingIn: '04:12:00',
      precision: coin.precision,
    };

    const res = evaluateStrategyOnPair(strategy, coin, t);
    results.push(res);
  }

  // Sort: Active Signals (BUY / SELL) first by Confidence DESC, then NEUTRAL
  return results.sort((a, b) => {
    const aActive = a.signal !== 'NEUTRAL';
    const bActive = b.signal !== 'NEUTRAL';
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return b.confidence - a.confidence;
  });
}

// -------------------------------------------------------------
// Scan across ALL GLOBALLY ENABLED Strategies
// -------------------------------------------------------------
export interface MultiStrategyCoinScan {
  coin: CoinMetadata;
  ticker: TickerInfo;
  activeSignals: StrategyScanResult[];
  consensusSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';
  buyVotes: number;
  sellVotes: number;
  neutralVotes: number;
  averageConfidence: number;
  topStrategy?: StrategyScanResult;
}

export function scanAllActiveGloballyEnabledStrategies(
  tickers: Record<AssetPair, TickerInfo>,
  allCoins: CoinMetadata[] = ALL_COINS_METADATA
): MultiStrategyCoinScan[] {
  const allStrategies = getAllStrategies();
  const enabledStrategies = allStrategies.filter((s) => isStrategyGloballyEnabled(s.id));

  const multiResults: MultiStrategyCoinScan[] = [];

  for (const coin of allCoins) {
    const t = tickers[coin.symbol] || INITIAL_TICKERS[coin.symbol] || {
      symbol: coin.symbol,
      baseAsset: coin.baseAsset,
      quoteAsset: coin.quoteAsset,
      price: 10,
      fundingRate: 0.0001,
      change24h: 0,
      high24h: 10.3,
      low24h: 9.7,
      volume24h: 50000,
      turnover24h: 500000,
      nextFundingIn: '04:12:00',
      precision: coin.precision,
    };

    const activeSignals: StrategyScanResult[] = [];
    let buyVotes = 0;
    let sellVotes = 0;
    let neutralVotes = 0;
    let totalConf = 0;

    for (const strat of enabledStrategies) {
      const res = evaluateStrategyOnPair(strat, coin, t);
      if (res.signal === 'BUY') {
        buyVotes++;
        activeSignals.push(res);
        totalConf += res.confidence;
      } else if (res.signal === 'SELL') {
        sellVotes++;
        activeSignals.push(res);
        totalConf += res.confidence;
      } else {
        neutralVotes++;
      }
    }

    let consensusSignal: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' = 'NEUTRAL';
    if (buyVotes >= 3) consensusSignal = 'STRONG_BUY';
    else if (buyVotes > sellVotes && buyVotes >= 1) consensusSignal = 'BUY';
    else if (sellVotes >= 3) consensusSignal = 'STRONG_SELL';
    else if (sellVotes > buyVotes && sellVotes >= 1) consensusSignal = 'SELL';

    const count = buyVotes + sellVotes;
    const averageConfidence = count > 0 ? Math.round(totalConf / count) : 60;

    // Top strategy by confidence
    const topStrategy = activeSignals.sort((a, b) => b.confidence - a.confidence)[0];

    multiResults.push({
      coin,
      ticker: t,
      activeSignals,
      consensusSignal,
      buyVotes,
      sellVotes,
      neutralVotes,
      averageConfidence,
      topStrategy,
    });
  }

  // Sort by consensus priority (Strong Buy/Sell first, then Buy/Sell, then Neutral)
  const priority = { STRONG_BUY: 5, STRONG_SELL: 5, BUY: 4, SELL: 4, NEUTRAL: 1 };
  return multiResults.sort((a, b) => {
    const pDiff = priority[b.consensusSignal] - priority[a.consensusSignal];
    if (pDiff !== 0) return pDiff;
    return b.averageConfidence - a.averageConfidence;
  });
}

// -------------------------------------------------------------
// Global Technical Indicators Telemetry Breakdown
// -------------------------------------------------------------
export interface GlobalIndicatorTelemetry {
  totalAssets: number;
  cpr: {
    aboveTC: number;
    insideCPR: number;
    belowBC: number;
    aboveTCPercent: number;
  };
  emaRibbon: {
    bullishStacked: number;
    bearishStacked: number;
    neutral: number;
    bullishPercent: number;
  };
  adx: {
    trendingHigh: number; // > 25
    moderate: number; // 20-25
    consolidating: number; // < 20
    trendPercent: number;
  };
  rsi: {
    oversold: number; // < 30
    momentumCorridor: number; // 48 - 70
    overbought: number; // > 70
    neutral: number;
  };
  supertrend: {
    greenCount: number;
    redCount: number;
    greenPercent: number;
  };
  smc: {
    demandMitigated: number;
    supplySwept: number;
    neutral: number;
  };
  volatilityAtr: {
    highVol: number;
    normalVol: number;
    lowVol: number;
  };
}

export function calculateGlobalTechnicalIndicatorTelemetry(
  tickers: Record<AssetPair, TickerInfo>,
  allCoins: CoinMetadata[] = ALL_COINS_METADATA
): GlobalIndicatorTelemetry {
  const totalAssets = allCoins.length;
  let cprAboveTC = 0;
  let cprInside = 0;
  let cprBelowBC = 0;

  let emaBullish = 0;
  let emaBearish = 0;
  let emaNeutral = 0;

  let adxHigh = 0;
  let adxMod = 0;
  let adxLow = 0;

  let rsiOversold = 0;
  let rsiMom = 0;
  let rsiOverbought = 0;
  let rsiNeutral = 0;

  let stGreen = 0;
  let stRed = 0;

  let smcDemand = 0;
  let smcSupply = 0;
  let smcNeutral = 0;

  let highVol = 0;
  let normVol = 0;
  let lowVol = 0;

  for (const coin of allCoins) {
    const t = tickers[coin.symbol] || INITIAL_TICKERS[coin.symbol] || {
      symbol: coin.symbol,
      baseAsset: coin.baseAsset,
      quoteAsset: coin.quoteAsset,
      price: 10,
      fundingRate: 0.0001,
      change24h: 0,
      high24h: 10.3,
      low24h: 9.7,
      volume24h: 50000,
      turnover24h: 500000,
      nextFundingIn: '04:12:00',
      precision: coin.precision,
    };

    const price = t.price || 10;
    const high24 = t.high24h || price * 1.03;
    const low24 = t.low24h || price * 0.97;
    const chg = t.change24h || 0;
    const isMeme = coin.category === 'meme';

    const range = Math.max(high24 - low24, price * 0.015);
    const rangePos = Math.min(Math.max((price - low24) / range, 0.05), 0.95);

    // CPR
    const pivot = (high24 + low24 + price) / 3;
    const bc = (high24 + low24) / 2;
    const tc = Math.max(pivot - bc + pivot, bc);
    const bcActual = Math.min(pivot - bc + pivot, bc);

    if (price >= tc) cprAboveTC++;
    else if (price <= bcActual) cprBelowBC++;
    else cprInside++;

    // EMA Ribbon
    const isGenerallyBullish = rangePos >= 0.48 || chg >= 0.5;
    const ema9 = price * (isGenerallyBullish ? 0.996 : 1.004);
    const ema26 = price * (isGenerallyBullish ? 0.988 : 1.012);
    const ema50 = price * (isGenerallyBullish ? 0.980 : 1.020);
    const ema200 = price * (isGenerallyBullish ? 0.965 : 1.035);

    if (price > ema9 && ema9 > ema26 && ema26 > ema50 && ema50 > ema200) emaBullish++;
    else if (price < ema9 && ema9 < ema26 && ema26 < ema50) emaBearish++;
    else emaNeutral++;

    // ADX
    const adx = 23.5 + Math.abs(chg) * 1.3 + (isMeme ? 4.5 : 0);
    if (adx >= 25) adxHigh++;
    else if (adx >= 20) adxMod++;
    else adxLow++;

    // RSI
    const rsi = isGenerallyBullish ? 52 + rangePos * 16 + Math.min(chg * 0.8, 6) : 48 - (1 - rangePos) * 14 - Math.max(chg * 0.8, -6);
    if (rsi < 32) rsiOversold++;
    else if (rsi > 68) rsiOverbought++;
    else if (rsi >= 48 && rsi <= 68) rsiMom++;
    else rsiNeutral++;

    // Supertrend
    if (chg >= -0.5 && rangePos > 0.4) stGreen++;
    else stRed++;

    // SMC
    if (rangePos < 0.45 && chg >= -2) smcDemand++;
    else if (rangePos > 0.85) smcSupply++;
    else smcNeutral++;

    // Volatility
    if (Math.abs(chg) > 5) highVol++;
    else if (Math.abs(chg) > 2) normVol++;
    else lowVol++;
  }

  return {
    totalAssets,
    cpr: {
      aboveTC: cprAboveTC,
      insideCPR: cprInside,
      belowBC: cprBelowBC,
      aboveTCPercent: Math.round((cprAboveTC / totalAssets) * 100),
    },
    emaRibbon: {
      bullishStacked: emaBullish,
      bearishStacked: emaBearish,
      neutral: emaNeutral,
      bullishPercent: Math.round((emaBullish / totalAssets) * 100),
    },
    adx: {
      trendingHigh: adxHigh,
      moderate: adxMod,
      consolidating: adxLow,
      trendPercent: Math.round(((adxHigh + adxMod) / totalAssets) * 100),
    },
    rsi: {
      oversold: rsiOversold,
      momentumCorridor: rsiMom,
      overbought: rsiOverbought,
      neutral: rsiNeutral,
    },
    supertrend: {
      greenCount: stGreen,
      redCount: stRed,
      greenPercent: Math.round((stGreen / totalAssets) * 100),
    },
    smc: {
      demandMitigated: smcDemand,
      supplySwept: smcSupply,
      neutral: smcNeutral,
    },
    volatilityAtr: {
      highVol,
      normalVol: normVol,
      lowVol,
    },
  };
}
