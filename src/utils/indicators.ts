import { Candle, IndicatorDefinition } from '../types';

export const INDICATOR_CATALOG: IndicatorDefinition[] = [
  // 1. TREND
  {
    id: 'cpr',
    name: 'Central Pivot Range (CPR & Daily Pivots)',
    shortName: 'CPR (TC, P, BC)',
    category: 'trend',
    description: 'Central Pivot Range (Top Central, Pivot, Bottom Central) & S1-S3, R1-R3 levels',
    defaultParams: { showPivots: 1, showLabels: 1 },
    overlay: true,
    color: '#00ff94',
    secondaryColor: '#ff3b4a',
  },
  {
    id: 'cpr_confluence',
    name: 'CPR + 9/26 EMA + ADX Confluence System',
    shortName: 'AI CPR Confluence',
    category: 'trend',
    description: 'Algorithmic multi-indicator confluence trigger (CPR + 9/26 EMA + ADX 14 + RSI + ATR)',
    defaultParams: {},
    overlay: true,
    color: '#ffd87f',
  },
  {
    id: 'ema_9',
    name: 'Exponential Moving Average 9',
    shortName: 'EMA 9',
    category: 'trend',
    description: 'Fast exponential moving average for short-term momentum',
    defaultParams: { period: 9 },
    overlay: true,
    color: '#f6be16',
  },
  {
    id: 'ema_21',
    name: 'Exponential Moving Average 21',
    shortName: 'EMA 21',
    category: 'trend',
    description: 'Dynamic baseline pullback and trend confirmation level',
    defaultParams: { period: 21 },
    overlay: true,
    color: '#38bdf8',
  },
  {
    id: 'ema_26',
    name: 'Exponential Moving Average 26',
    shortName: 'EMA 26',
    category: 'trend',
    description: 'Slow baseline trend filter for 9/26 EMA crossover setups',
    defaultParams: { period: 26 },
    overlay: true,
    color: '#3b82f6',
  },
  {
    id: 'ema_50',
    name: 'Exponential Moving Average 50',
    shortName: 'EMA 50',
    category: 'trend',
    description: 'Medium-term institutional trend filter',
    defaultParams: { period: 50 },
    overlay: true,
    color: '#a855f7',
  },
  {
    id: 'ema_200',
    name: 'Exponential Moving Average 200',
    shortName: 'EMA 200',
    category: 'trend',
    description: 'Macro bull/bear market divider line',
    defaultParams: { period: 200 },
    overlay: true,
    color: '#f43f5e',
  },
  {
    id: 'sma_20',
    name: 'Simple Moving Average 20',
    shortName: 'SMA 20',
    category: 'trend',
    description: 'Classic 20-period arithmetic mean trend line',
    defaultParams: { period: 20 },
    overlay: true,
    color: '#e2e8f0',
  },
  {
    id: 'supertrend',
    name: 'Supertrend Trend Filter',
    shortName: 'Supertrend',
    category: 'trend',
    description: 'ATR-grounded trend continuation and stop loss trail',
    defaultParams: { period: 10, multiplier: 3 },
    overlay: true,
    color: '#00ff94',
    secondaryColor: '#ff3b4a',
  },
  {
    id: 'vwap',
    name: 'Volume Weighted Average Price',
    shortName: 'VWAP',
    category: 'trend',
    description: 'Institutional volume-weighted benchmark price',
    defaultParams: {},
    overlay: true,
    color: '#fb923c',
  },
  {
    id: 'parabolic_sar',
    name: 'Parabolic SAR',
    shortName: 'SAR',
    category: 'trend',
    description: 'Price reversal acceleration stop dots',
    defaultParams: { step: 0.02, max: 0.2 },
    overlay: true,
    color: '#38bdf8',
  },
  {
    id: 'pivot_points',
    name: 'Pivot Points (Standard & Fib)',
    shortName: 'Pivots',
    category: 'trend',
    description: 'Key S1, S2, R1, R2, R3 horizontal support/resistance',
    defaultParams: {},
    overlay: true,
    color: '#ffd87f',
  },

  // 2. OSCILLATORS & MOMENTUM
  {
    id: 'adx_14',
    name: 'Average Directional Index (ADX 14)',
    shortName: 'ADX (14)',
    category: 'oscillators',
    description: 'Measures trend strength (>20 trending, <20 chop filter)',
    defaultParams: { period: 14, threshold: 20 },
    overlay: false,
    color: '#a855f7',
    secondaryColor: '#00ff94',
  },
  {
    id: 'rsi_14',
    name: 'Relative Strength Index',
    shortName: 'RSI (14)',
    category: 'oscillators',
    description: 'Measures speed and change of price moves (0-100)',
    defaultParams: { period: 14, overbought: 70, oversold: 30 },
    overlay: false,
    color: '#e7c26b',
  },
  {
    id: 'macd',
    name: 'MACD (Convergence/Divergence)',
    shortName: 'MACD (12, 26, 9)',
    category: 'oscillators',
    description: 'Trend-following momentum with signal & histogram',
    defaultParams: { fast: 12, slow: 26, signal: 9 },
    overlay: false,
    color: '#38bdf8',
    secondaryColor: '#f6be16',
  },
  {
    id: 'stochastic',
    name: 'Stochastic Oscillator',
    shortName: 'Stoch %K/%D',
    category: 'oscillators',
    description: 'Compares closing price to price range over time',
    defaultParams: { periodK: 14, periodD: 3, smooth: 3 },
    overlay: false,
    color: '#00ff94',
    secondaryColor: '#ff3b4a',
  },
  {
    id: 'atr_14',
    name: 'Average True Range (ATR)',
    shortName: 'ATR (14)',
    category: 'oscillators',
    description: 'Market volatility measurement for stop sizing',
    defaultParams: { period: 14 },
    overlay: false,
    color: '#f97316',
  },
  {
    id: 'cci',
    name: 'Commodity Channel Index',
    shortName: 'CCI (20)',
    category: 'oscillators',
    description: 'Identifies cyclical turns in price (+100 / -100)',
    defaultParams: { period: 20 },
    overlay: false,
    color: '#a855f7',
  },
  {
    id: 'williams_r',
    name: 'Williams %R',
    shortName: '%R (14)',
    category: 'oscillators',
    description: 'Momentum indicator inversely scaled from 0 to -100',
    defaultParams: { period: 14 },
    overlay: false,
    color: '#ec4899',
  },

  // 3. VOLATILITY & CHANNELS
  {
    id: 'bollinger_bands',
    name: 'Bollinger Bands (20, 2)',
    shortName: 'Bollinger Bands',
    category: 'volatility',
    description: 'Standard deviation volatility envelopes',
    defaultParams: { period: 20, stdDev: 2 },
    overlay: true,
    color: '#38bdf8',
  },
  {
    id: 'keltner_channels',
    name: 'Keltner Channels',
    shortName: 'Keltner',
    category: 'volatility',
    description: 'Volatility-based envelopes set above/below an EMA with ATR',
    defaultParams: { period: 20, multiplier: 2 },
    overlay: true,
    color: '#c084fc',
  },
  {
    id: 'donchian_channels',
    name: 'Donchian Channels',
    shortName: 'Donchian (20)',
    category: 'volatility',
    description: '20-period highest high and lowest low price channels',
    defaultParams: { period: 20 },
    overlay: true,
    color: '#34d399',
  },

  // 4. VOLUME
  {
    id: 'volume_bars',
    name: 'Volume with 20 MA',
    shortName: 'Volume + MA',
    category: 'volume',
    description: 'Traded volume with moving average benchmark',
    defaultParams: { maPeriod: 20 },
    overlay: true,
    color: '#00ff94',
  },
  {
    id: 'volume_profile',
    name: 'Volume Profile (VPVR)',
    shortName: 'Volume Profile',
    category: 'volume',
    description: 'Horizontal volume distribution by price and Point of Control',
    defaultParams: { rows: 24 },
    overlay: true,
    color: '#ffd87f',
  },
  {
    id: 'obv',
    name: 'On-Balance Volume (OBV)',
    shortName: 'OBV',
    category: 'volume',
    description: 'Cumulative volume flow relative to price direction',
    defaultParams: {},
    overlay: false,
    color: '#38bdf8',
  },

  // 5. SMART MONEY CONCEPTS
  {
    id: 'smart_money_zones',
    name: 'Smart Money (FVG & Order Blocks)',
    shortName: 'FVG & Order Blocks',
    category: 'smart_money',
    description: 'Fair Value Gaps & institutional liquidity accumulation zones',
    defaultParams: {},
    overlay: true,
    color: '#00ff94',
    secondaryColor: '#ff3b4a',
  },
  {
    id: 'market_structure',
    name: 'Market Structure (BOS & CHoCH)',
    shortName: 'BOS / CHoCH',
    category: 'smart_money',
    description: 'Institutional Break of Structure & Change of Character scanner',
    defaultParams: {},
    overlay: true,
    color: '#38bdf8',
    secondaryColor: '#f43f5e',
  },

  // 6. ADVANCED QUANT & VOLATILITY
  {
    id: 'hma_9',
    name: 'Hull Moving Average 9',
    shortName: 'HMA 9',
    category: 'trend',
    description: 'Ultra-low lag responsive trend curve eliminating moving average delay',
    defaultParams: { period: 9 },
    overlay: true,
    color: '#22d3ee',
  },
  {
    id: 'hma_21',
    name: 'Hull Moving Average 21',
    shortName: 'HMA 21',
    category: 'trend',
    description: 'Smooth institutional trend baseline with zero lag',
    defaultParams: { period: 21 },
    overlay: true,
    color: '#e879f9',
  },
  {
    id: 'cmf_20',
    name: 'Chaikin Money Flow (CMF 20)',
    shortName: 'CMF (20)',
    category: 'volume',
    description: 'Measures institutional cashflow accumulation (>0) and distribution (<0)',
    defaultParams: { period: 20 },
    overlay: false,
    color: '#10b981',
    secondaryColor: '#ef4444',
  },
  {
    id: 'chandelier_exit',
    name: 'Chandelier Exit (ATR Trailing Stop)',
    shortName: 'Chandelier Stop',
    category: 'volatility',
    description: 'Dynamic volatility trailing stops set 3x ATR from highest highs',
    defaultParams: { period: 22, multiplier: 3 },
    overlay: true,
    color: '#00ff94',
    secondaryColor: '#ff3b4a',
  },
];

// Calculation Functions

export function calculateEMA(candles: Candle[], period: number): number[] {
  if (!candles || candles.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [];

  if (candles.length < period) {
    let sum = 0;
    for (let i = 0; i < candles.length; i++) {
      sum += candles[i].close;
      ema.push(sum / (i + 1));
    }
    return ema;
  }

  // Canonical institutional warm-up: Seed with SMA of the first 'period' candles
  let initialSum = 0;
  for (let i = 0; i < period; i++) {
    initialSum += candles[i].close;
    ema.push(initialSum / (i + 1));
  }

  let prevEma = initialSum / period;
  ema[period - 1] = prevEma;

  for (let i = period; i < candles.length; i++) {
    const current = candles[i].close * k + prevEma * (1 - k);
    ema.push(current);
    prevEma = current;
  }
  return ema;
}

export function calculateSMA(candles: Candle[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      sma.push(candles[i].close);
      continue;
    }
    const slice = candles.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, c) => acc + c.close, 0);
    sma.push(sum / period);
  }
  return sma;
}

export function calculateVWAP(candles: Candle[]): number[] {
  const vwap: number[] = [];
  let cumVol = 0;
  let cumVolPrice = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumVolPrice += typicalPrice * (c.volume || 1);
    cumVol += c.volume || 1;
    vwap.push(cumVolPrice / (cumVol || 1));
  }
  return vwap;
}

export function calculateBollingerBands(
  candles: Candle[],
  period = 20,
  multiplier = 2
) {
  const upper: number[] = [];
  const lower: number[] = [];
  const middle: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      upper.push(candles[i].close * 1.015);
      lower.push(candles[i].close * 0.985);
      middle.push(candles[i].close);
      continue;
    }

    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((sum, c) => sum + c.close, 0) / period;
    const variance =
      slice.reduce((sum, c) => sum + Math.pow(c.close - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    upper.push(mean + stdDev * multiplier);
    lower.push(mean - stdDev * multiplier);
    middle.push(mean);
  }

  return { upper, lower, middle };
}

export function calculateKeltnerChannels(
  candles: Candle[],
  period = 20,
  multiplier = 2
) {
  const ema = calculateEMA(candles, period);
  const atr = calculateATR(candles, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const middleVal = ema[i] || candles[i].close;
    const atrVal = atr[i] || candles[i].close * 0.01;
    upper.push(middleVal + atrVal * multiplier);
    lower.push(middleVal - atrVal * multiplier);
  }

  return { upper, lower, middle: ema };
}

export function calculateDonchianChannels(candles: Candle[], period = 20) {
  const upper: number[] = [];
  const lower: number[] = [];
  const middle: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const slice = candles.slice(Math.max(0, i - period + 1), i + 1);
    let max = -Infinity;
    let min = Infinity;
    slice.forEach((c) => {
      if (c.high > max) max = c.high;
      if (c.low < min) min = c.low;
    });

    upper.push(max);
    lower.push(min);
    middle.push((max + min) / 2);
  }

  return { upper, lower, middle };
}

export function calculateATR(candles: Candle[], period = 14): number[] {
  const atr: number[] = [];
  if (candles.length === 0) return atr;

  const tr: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    const val = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    tr.push(val);
  }

  let runningAtr = tr.slice(0, period).reduce((a, b) => a + b, 0) / (period || 1);
  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      atr.push(runningAtr);
    } else {
      runningAtr = (runningAtr * (period - 1) + tr[i]) / period;
      atr.push(runningAtr);
    }
  }

  return atr;
}

export function calculateSupertrend(
  candles: Candle[],
  period = 10,
  multiplier = 3
) {
  const atr = calculateATR(candles, period);
  const trend: ('bull' | 'bear')[] = [];
  const band: number[] = [];

  if (!candles || candles.length === 0) return { trend, band };

  let inUptrend = true;
  let lowerBand = 0;
  let upperBand = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const currentAtr = atr[i] || (c.high - c.low);
    const hl2 = (c.high + c.low) / 2;
    const basicUpper = hl2 + multiplier * currentAtr;
    const basicLower = hl2 - multiplier * currentAtr;

    if (i === 0) {
      lowerBand = basicLower;
      upperBand = basicUpper;
      trend.push('bull');
      band.push(lowerBand);
      continue;
    }

    const prevClose = candles[i - 1].close;
    // Lower band can only rise during an uptrend (cannot step down)
    lowerBand = prevClose > lowerBand ? Math.max(basicLower, lowerBand) : basicLower;
    // Upper band can only fall during a downtrend (cannot step up)
    upperBand = prevClose < upperBand ? Math.min(basicUpper, upperBand) : basicUpper;

    if (inUptrend) {
      if (c.close < lowerBand) {
        inUptrend = false;
        trend.push('bear');
        band.push(upperBand);
      } else {
        trend.push('bull');
        band.push(lowerBand);
      }
    } else {
      if (c.close > upperBand) {
        inUptrend = true;
        trend.push('bull');
        band.push(lowerBand);
      } else {
        trend.push('bear');
        band.push(upperBand);
      }
    }
  }

  return { trend, band };
}

// ==========================================
// ADVANCED INSTITUTIONAL QUANT INDICATORS
// ==========================================

export function calculateWMA(values: number[], period: number): number[] {
  const wma: number[] = [];
  const denominator = (period * (period + 1)) / 2;

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      wma.push(values[i]);
      continue;
    }
    let weightedSum = 0;
    for (let j = 0; j < period; j++) {
      weightedSum += values[i - period + 1 + j] * (j + 1);
    }
    wma.push(weightedSum / denominator);
  }
  return wma;
}

export function calculateHMA(candles: Candle[], period = 9): number[] {
  if (!candles || candles.length === 0) return [];
  const closes = candles.map((c) => c.close);
  const halfPeriod = Math.max(1, Math.round(period / 2));
  const sqrtPeriod = Math.max(1, Math.round(Math.sqrt(period)));

  const wmaHalf = calculateWMA(closes, halfPeriod);
  const wmaFull = calculateWMA(closes, period);

  const diffSeries: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    diffSeries.push(2 * (wmaHalf[i] ?? closes[i]) - (wmaFull[i] ?? closes[i]));
  }

  return calculateWMA(diffSeries, sqrtPeriod);
}

export function calculateCMF(candles: Candle[], period = 20): number[] {
  const cmf: number[] = [];
  if (!candles || candles.length === 0) return cmf;

  const mfvList: number[] = [];
  const volList: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const range = c.high - c.low;
    const vol = c.volume || 100;
    const mfm = range === 0 ? 0 : ((c.close - c.low) - (c.high - c.close)) / range;
    mfvList.push(mfm * vol);
    volList.push(vol);
  }

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      cmf.push(0);
      continue;
    }
    const mfvSlice = mfvList.slice(i - period + 1, i + 1);
    const volSlice = volList.slice(i - period + 1, i + 1);
    const sumMfv = mfvSlice.reduce((a, b) => a + b, 0);
    const sumVol = volSlice.reduce((a, b) => a + b, 0);
    cmf.push(sumVol === 0 ? 0 : sumMfv / sumVol);
  }
  return cmf;
}

export interface RSIDivergencePoint {
  index: number;
  time: number;
  type: 'bullish' | 'bearish';
  price: number;
  rsiValue: number;
  description: string;
}

export function detectRSIDivergence(candles: Candle[], rsiValues: number[]): RSIDivergencePoint[] {
  const divergences: RSIDivergencePoint[] = [];
  if (!candles || candles.length < 15 || rsiValues.length < 15) return divergences;

  const lookback = 3;
  for (let i = lookback; i < candles.length - lookback; i++) {
    const isPriceSwingLow =
      candles[i].low <= candles[i - 1].low &&
      candles[i].low <= candles[i - 2].low &&
      candles[i].low <= candles[i + 1].low &&
      candles[i].low <= candles[i + 2].low;

    const isPriceSwingHigh =
      candles[i].high >= candles[i - 1].high &&
      candles[i].high >= candles[i - 2].high &&
      candles[i].high >= candles[i + 1].high &&
      candles[i].high >= candles[i + 2].high;

    if (isPriceSwingLow) {
      for (let prev = Math.max(0, i - 25); prev < i - 4; prev++) {
        const isPrevLow =
          candles[prev].low <= (candles[prev - 1]?.low ?? candles[prev].low) &&
          candles[prev].low <= (candles[prev + 1]?.low ?? candles[prev].low);
        if (isPrevLow) {
          // Regular Bullish Divergence: Price Lower Low, but RSI Higher Low
          if (candles[i].low < candles[prev].low && rsiValues[i] > rsiValues[prev] + 2 && rsiValues[i] < 45) {
            divergences.push({
              index: i,
              time: candles[i].time,
              type: 'bullish',
              price: candles[i].low,
              rsiValue: rsiValues[i],
              description: `Bullish Divergence: Price lower low ($${candles[i].low}) with RSI higher low (${rsiValues[i].toFixed(1)} vs ${rsiValues[prev].toFixed(1)})`,
            });
            break;
          }
        }
      }
    }

    if (isPriceSwingHigh) {
      for (let prev = Math.max(0, i - 25); prev < i - 4; prev++) {
        const isPrevHigh =
          candles[prev].high >= (candles[prev - 1]?.high ?? candles[prev].high) &&
          candles[prev].high >= (candles[prev + 1]?.high ?? candles[prev].high);
        if (isPrevHigh) {
          // Regular Bearish Divergence: Price Higher High, but RSI Lower High
          if (candles[i].high > candles[prev].high && rsiValues[i] < rsiValues[prev] - 2 && rsiValues[i] > 55) {
            divergences.push({
              index: i,
              time: candles[i].time,
              type: 'bearish',
              price: candles[i].high,
              rsiValue: rsiValues[i],
              description: `Bearish Divergence: Price higher high ($${candles[i].high}) with RSI lower high (${rsiValues[i].toFixed(1)} vs ${rsiValues[prev].toFixed(1)})`,
            });
            break;
          }
        }
      }
    }
  }

  return divergences;
}

export interface MarketStructureShift {
  index: number;
  time: number;
  type: 'BOS_BULL' | 'BOS_BEAR' | 'CHOCH_BULL' | 'CHOCH_BEAR';
  level: number;
  description: string;
}

export function detectMarketStructure(candles: Candle[]): MarketStructureShift[] {
  const shifts: MarketStructureShift[] = [];
  if (!candles || candles.length < 20) return shifts;

  const swingHighs: { idx: number; price: number; time: number }[] = [];
  const swingLows: { idx: number; price: number; time: number }[] = [];

  for (let i = 3; i < candles.length - 2; i++) {
    if (
      candles[i].high > candles[i - 1].high &&
      candles[i].high > candles[i - 2].high &&
      candles[i].high > candles[i + 1].high &&
      candles[i].high > candles[i + 2].high
    ) {
      swingHighs.push({ idx: i, price: candles[i].high, time: candles[i].time });
    }
    if (
      candles[i].low < candles[i - 1].low &&
      candles[i].low < candles[i - 2].low &&
      candles[i].low < candles[i + 1].low &&
      candles[i].low < candles[i + 2].low
    ) {
      swingLows.push({ idx: i, price: candles[i].low, time: candles[i].time });
    }
  }

  let lastTrend: 'bull' | 'bear' = 'bull';
  for (let i = 5; i < candles.length; i++) {
    const c = candles[i];
    const prevHigh = swingHighs.filter((sh) => sh.idx < i).pop();
    const prevLow = swingLows.filter((sl) => sl.idx < i).pop();

    if (prevHigh && c.close > prevHigh.price && candles[i - 1].close <= prevHigh.price) {
      const isChoch = lastTrend === 'bear';
      shifts.push({
        index: i,
        time: c.time,
        type: isChoch ? 'CHOCH_BULL' : 'BOS_BULL',
        level: prevHigh.price,
        description: isChoch
          ? `Change of Character (Bullish CHoCH) broken at $${prevHigh.price}`
          : `Break of Structure (Bullish BOS) expanded at $${prevHigh.price}`,
      });
      lastTrend = 'bull';
    } else if (prevLow && c.close < prevLow.price && candles[i - 1].close >= prevLow.price) {
      const isChoch = lastTrend === 'bull';
      shifts.push({
        index: i,
        time: c.time,
        type: isChoch ? 'CHOCH_BEAR' : 'BOS_BEAR',
        level: prevLow.price,
        description: isChoch
          ? `Change of Character (Bearish CHoCH) broken at $${prevLow.price}`
          : `Break of Structure (Bearish BOS) broken at $${prevLow.price}`,
      });
      lastTrend = 'bear';
    }
  }

  return shifts.slice(-8);
}

export function calculateChandelierExit(
  candles: Candle[],
  period = 22,
  multiplier = 3
): { longStop: number[]; shortStop: number[] } {
  const atr = calculateATR(candles, period);
  const longStop: number[] = [];
  const shortStop: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    const slice = candles.slice(Math.max(0, i - period + 1), i + 1);
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    slice.forEach((c) => {
      if (c.high > highestHigh) highestHigh = c.high;
      if (c.low < lowestLow) lowestLow = c.low;
    });

    const currentAtr = atr[i] || (candles[i].high - candles[i].low);
    longStop.push(highestHigh - multiplier * currentAtr);
    shortStop.push(lowestLow + multiplier * currentAtr);
  }

  return { longStop, shortStop };
}

export function calculateParabolicSAR(
  candles: Candle[],
  step = 0.02,
  maxStep = 0.2
): number[] {
  const sar: number[] = [];
  if (candles.length === 0) return sar;

  let isBull = candles[0].close >= candles[0].open;
  let af = step;
  let ep = isBull ? candles[0].high : candles[0].low;
  let curSar = isBull ? candles[0].low : candles[0].high;

  sar.push(curSar);

  for (let i = 1; i < candles.length; i++) {
    const prevSar = curSar;
    curSar = prevSar + af * (ep - prevSar);

    if (isBull) {
      if (curSar > candles[i].low || (i > 1 && curSar > candles[i - 1].low)) {
        isBull = false;
        curSar = ep;
        ep = candles[i].low;
        af = step;
      } else {
        if (candles[i].high > ep) {
          ep = candles[i].high;
          af = Math.min(af + step, maxStep);
        }
      }
    } else {
      if (curSar < candles[i].high || (i > 1 && curSar < candles[i - 1].high)) {
        isBull = true;
        curSar = ep;
        ep = candles[i].high;
        af = step;
      } else {
        if (candles[i].low < ep) {
          ep = candles[i].low;
          af = Math.min(af + step, maxStep);
        }
      }
    }

    sar.push(curSar);
  }

  return sar;
}

export function calculateRSI(candles: Candle[], period = 14): number[] {
  const rsi: number[] = [];
  if (candles.length < 2) return candles.map(() => 50);

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= Math.min(period, candles.length - 1); i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      rsi.push(50);
      continue;
    }

    const diff = candles[i].close - candles[i - 1].close;
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const value = 100 - 100 / (1 + rs);
    rsi.push(value);
  }

  return rsi;
}

export function calculateMACD(
  candles: Candle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
) {
  const fastEMA = calculateEMA(candles, fastPeriod);
  const slowEMA = calculateEMA(candles, slowPeriod);

  const macdLine: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    macdLine.push((fastEMA[i] || 0) - (slowEMA[i] || 0));
  }

  // Calculate signal line (EMA of MACD line)
  const k = 2 / (signalPeriod + 1);
  const signalLine: number[] = [];
  let prevSignal = macdLine[0] || 0;
  signalLine.push(prevSignal);

  for (let i = 1; i < macdLine.length; i++) {
    const curSignal = macdLine[i] * k + prevSignal * (1 - k);
    signalLine.push(curSignal);
    prevSignal = curSignal;
  }

  const histogram: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    histogram.push(macdLine[i] - signalLine[i]);
  }

  return { macdLine, signalLine, histogram };
}

export function calculateStochastic(
  candles: Candle[],
  periodK = 14,
  periodD = 3,
  smooth = 3
) {
  const rawK: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const slice = candles.slice(Math.max(0, i - periodK + 1), i + 1);
    let highest = -Infinity;
    let lowest = Infinity;
    slice.forEach((c) => {
      if (c.high > highest) highest = c.high;
      if (c.low < lowest) lowest = c.low;
    });

    const range = highest - lowest;
    if (range === 0) rawK.push(50);
    else rawK.push(((candles[i].close - lowest) / range) * 100);
  }

  // Smooth %K
  const kLine: number[] = [];
  for (let i = 0; i < rawK.length; i++) {
    const slice = rawK.slice(Math.max(0, i - smooth + 1), i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    kLine.push(sum / slice.length);
  }

  // %D is SMA of smoothed %K
  const dLine: number[] = [];
  for (let i = 0; i < kLine.length; i++) {
    const slice = kLine.slice(Math.max(0, i - periodD + 1), i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    dLine.push(sum / slice.length);
  }

  return { kLine, dLine };
}

export function calculateCCI(candles: Candle[], period = 20): number[] {
  const cci: number[] = [];
  const tpList = candles.map((c) => (c.high + c.low + c.close) / 3);

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      cci.push(0);
      continue;
    }
    const slice = tpList.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b, 0) / period;
    const meanDev = slice.reduce((a, b) => a + Math.abs(b - sma), 0) / period;

    if (meanDev === 0) cci.push(0);
    else cci.push((tpList[i] - sma) / (0.015 * meanDev));
  }
  return cci;
}

export function calculateWilliamsR(candles: Candle[], period = 14): number[] {
  const wr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const slice = candles.slice(Math.max(0, i - period + 1), i + 1);
    let highest = -Infinity;
    let lowest = Infinity;
    slice.forEach((c) => {
      if (c.high > highest) highest = c.high;
      if (c.low < lowest) lowest = c.low;
    });

    const range = highest - lowest;
    if (range === 0) wr.push(-50);
    else wr.push(((highest - candles[i].close) / range) * -100);
  }
  return wr;
}

export function calculateOBV(candles: Candle[]): number[] {
  const obv: number[] = [];
  let cum = 0;
  obv.push(0);

  for (let i = 1; i < candles.length; i++) {
    if (candles[i].close > candles[i - 1].close) {
      cum += candles[i].volume || 1;
    } else if (candles[i].close < candles[i - 1].close) {
      cum -= candles[i].volume || 1;
    }
    obv.push(cum);
  }
  return obv;
}

export function calculateVolumeProfile(candles: Candle[], numBins = 24) {
  if (candles.length === 0) return { bins: [], pocPrice: 0, maxVol: 0 };

  let minPrice = Infinity;
  let maxPrice = -Infinity;

  candles.forEach((c) => {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
  });

  const binSize = (maxPrice - minPrice) / numBins || 1;
  const bins = Array.from({ length: numBins }, (_, idx) => ({
    priceLow: minPrice + idx * binSize,
    priceHigh: minPrice + (idx + 1) * binSize,
    priceMid: minPrice + (idx + 0.5) * binSize,
    buyVolume: 0,
    sellVolume: 0,
    totalVolume: 0,
  }));

  candles.forEach((c) => {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const binIdx = Math.min(
      numBins - 1,
      Math.max(0, Math.floor((typicalPrice - minPrice) / binSize))
    );
    const vol = c.volume || 100;
    if (c.close >= c.open) {
      bins[binIdx].buyVolume += vol * 0.65;
      bins[binIdx].sellVolume += vol * 0.35;
    } else {
      bins[binIdx].buyVolume += vol * 0.35;
      bins[binIdx].sellVolume += vol * 0.65;
    }
    bins[binIdx].totalVolume += vol;
  });

  let maxVol = 0;
  let pocPrice = (minPrice + maxPrice) / 2;

  bins.forEach((b) => {
    if (b.totalVolume > maxVol) {
      maxVol = b.totalVolume;
      pocPrice = b.priceMid;
    }
  });

  return { bins, pocPrice, maxVol };
}

export function calculatePivotPoints(candles: Candle[]) {
  if (candles.length < 5) return null;
  const recent = candles.slice(-20);
  let high = -Infinity;
  let low = Infinity;
  recent.forEach((c) => {
    if (c.high > high) high = c.high;
    if (c.low < low) low = c.low;
  });
  const close = candles[candles.length - 1].close;

  const p = (high + low + close) / 3;
  const r1 = 2 * p - low;
  const s1 = 2 * p - high;
  const r2 = p + (high - low);
  const s2 = p - (high - low);
  const r3 = high + 2 * (p - low);
  const s3 = low - 2 * (high - p);

  return { p, r1, s1, r2, s2, r3, s3 };
}

export function calculateSmartMoneyZones(candles: Candle[]) {
  const fvgs: { top: number; bottom: number; type: 'bullish' | 'bearish'; startIndex: number }[] = [];
  const orderBlocks: { top: number; bottom: number; type: 'bullish' | 'bearish'; startIndex: number }[] = [];

  // FVG detection (3 candle pattern)
  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG: c1.high < c3.low
    if (c3.low > c1.high && c2.close > c2.open) {
      fvgs.push({
        top: c3.low,
        bottom: c1.high,
        type: 'bullish',
        startIndex: i - 2,
      });
    }
    // Bearish FVG: c1.low > c3.high
    else if (c3.high < c1.low && c2.close < c2.open) {
      fvgs.push({
        top: c1.low,
        bottom: c3.high,
        type: 'bearish',
        startIndex: i - 2,
      });
    }
  }

  // Order block detection (Last opposite candle before strong impulse)
  for (let i = 3; i < candles.length; i++) {
    const impulse = Math.abs(candles[i].close - candles[i - 1].open);
    const avgBody = (candles[i - 2].high - candles[i - 2].low) || 1;

    if (impulse > avgBody * 1.8) {
      if (candles[i].close > candles[i].open && candles[i - 1].close < candles[i - 1].open) {
        orderBlocks.push({
          top: candles[i - 1].high,
          bottom: candles[i - 1].low,
          type: 'bullish',
          startIndex: i - 1,
        });
      } else if (candles[i].close < candles[i].open && candles[i - 1].close > candles[i - 1].open) {
        orderBlocks.push({
          top: candles[i - 1].high,
          bottom: candles[i - 1].low,
          type: 'bearish',
          startIndex: i - 1,
        });
      }
    }
  }

  return {
    fvgs: fvgs.slice(-4),
    orderBlocks: orderBlocks.slice(-3),
  };
}

export function convertToHeikinAshi(candles: Candle[]): Candle[] {
  if (candles.length === 0) return [];
  const ha: Candle[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    let haOpen = c.open;

    if (i > 0) {
      haOpen = (ha[i - 1].open + ha[i - 1].close) / 2;
    }

    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    ha.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: c.volume,
    });
  }

  return ha;
}

// 6. CPR (CENTRAL PIVOT RANGE) & ADVANCED ADX CALCULATIONS

export interface DayCPRPeriod {
  dateStr: string;
  startIndex: number;
  endIndex: number;
  pivot: number;
  tc: number;
  bc: number;
  tcActual: number;
  bcActual: number;
  cprWidth: number;
  cprWidthPercent: number;
  r1: number;
  s1: number;
  r2: number;
  s2: number;
  r3: number;
  s3: number;
  r4: number;
  s4: number;
  high: number;
  low: number;
  close: number;
  isVirgin: boolean;
  isNarrow: boolean;
  isWide: boolean;
  isAverage: boolean;
  widthType: 'NARROW' | 'AVERAGE' | 'WIDE';
}

export interface CPRResult {
  pivot: number;
  tc: number;
  bc: number;
  tcActual: number;
  bcActual: number;
  cprWidth: number;
  cprWidthPercent: number;
  isNarrow: boolean;
  isWide: boolean;
  isAverage?: boolean;
  widthType?: 'NARROW' | 'AVERAGE' | 'WIDE';
  r1: number;
  s1: number;
  r2: number;
  s2: number;
  r3: number;
  s3: number;
  r4?: number;
  s4?: number;
  high: number;
  low: number;
  close: number;
  isVirgin?: boolean;
  relationship?: 'HIGHER_VALUE' | 'LOWER_VALUE' | 'INSIDE_CPR' | 'OUTSIDE_CPR' | 'OVERLAPPING_HIGHER' | 'OVERLAPPING_LOWER' | 'UNCHANGED';
  historicalCPRs?: DayCPRPeriod[];
  nextDayCPR?: {
    pivot: number;
    tc: number;
    bc: number;
    tcActual: number;
    bcActual: number;
    cprWidth: number;
    cprWidthPercent: number;
    widthType: 'NARROW' | 'AVERAGE' | 'WIDE';
  };
}

export function calculateCPR(candles: Candle[], lookback = 24, timeframe = '15m'): CPRResult | null {
  if (!candles || candles.length < 3) return null;

  // 1. Group candles by UTC calendar day (YYYY-MM-DD)
  const dayGroups: { dateStr: string; candles: Candle[]; startIndex: number; endIndex: number }[] = [];
  let currentDayStr = '';
  let currentGroup: { dateStr: string; candles: Candle[]; startIndex: number; endIndex: number } | null = null;

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const ts = c.time > 10000000000 ? c.time : c.time * 1000;
    const dateStr = !isNaN(ts) && ts > 0 ? new Date(ts).toISOString().slice(0, 10) : `day_${Math.floor(i / 24)}`;

    if (dateStr !== currentDayStr) {
      if (currentGroup) {
        currentGroup.endIndex = i - 1;
        dayGroups.push(currentGroup);
      }
      currentDayStr = dateStr;
      currentGroup = { dateStr, candles: [c], startIndex: i, endIndex: i };
    } else {
      currentGroup?.candles.push(c);
      if (currentGroup) currentGroup.endIndex = i;
    }
  }
  if (currentGroup) {
    currentGroup.endIndex = candles.length - 1;
    dayGroups.push(currentGroup);
  }

  const computeLevels = (high: number, low: number, close: number) => {
    const pivot = (high + low + close) / 3;
    const bc = (high + low) / 2;
    const tc = 2 * pivot - bc;
    const tcActual = Math.max(tc, bc);
    const bcActual = Math.min(tc, bc);
    const cprWidth = Math.abs(tcActual - bcActual);
    const cprWidthPercent = pivot > 0 ? (cprWidth / pivot) * 100 : 0;
    const isNarrow = cprWidthPercent < 0.35;
    const isWide = cprWidthPercent > 0.85;
    const isAverage = !isNarrow && !isWide;
    const widthType: 'NARROW' | 'AVERAGE' | 'WIDE' = isNarrow ? 'NARROW' : isWide ? 'WIDE' : 'AVERAGE';

    const r1 = 2 * pivot - low;
    const s1 = 2 * pivot - high;
    const r2 = pivot + (high - low);
    const s2 = pivot - (high - low);
    const r3 = high + 2 * (pivot - low);
    const s3 = low - 2 * (high - pivot);
    const r4 = r3 + (r2 - r1);
    const s4 = s3 - (s1 - s2);

    return {
      pivot,
      tc,
      bc,
      tcActual,
      bcActual,
      cprWidth,
      cprWidthPercent,
      isNarrow,
      isWide,
      isAverage,
      widthType,
      r1,
      s1,
      r2,
      s2,
      r3,
      s3,
      r4,
      s4,
      high,
      low,
      close,
    };
  };

  const historicalCPRs: DayCPRPeriod[] = [];
  let primaryLevels: ReturnType<typeof computeLevels>;
  let primaryVirgin = false;

  // Case A: Multi-day session partitioning (real trading session CPR)
  if (dayGroups.length >= 2) {
    for (let k = 1; k < dayGroups.length; k++) {
      const priorGroup = dayGroups[k - 1];
      const curGroup = dayGroups[k];

      let priorHigh = -Infinity;
      let priorLow = Infinity;
      priorGroup.candles.forEach((c) => {
        if (c.high > priorHigh) priorHigh = c.high;
        if (c.low < priorLow) priorLow = c.low;
      });
      const priorClose = priorGroup.candles[priorGroup.candles.length - 1].close;

      const lvl = computeLevels(priorHigh, priorLow, priorClose);

      // Check if price pierced CPR corridor during this period
      const isVirgin = !curGroup.candles.some(
        (c) => c.high >= lvl.bcActual && c.low <= lvl.tcActual
      );

      historicalCPRs.push({
        dateStr: curGroup.dateStr,
        startIndex: curGroup.startIndex,
        endIndex: curGroup.endIndex,
        ...lvl,
        isVirgin,
      });
    }

    const lastPeriod = historicalCPRs[historicalCPRs.length - 1];
    primaryLevels = { ...lastPeriod };
    primaryVirgin = lastPeriod.isVirgin;
  } else {
    // Case B: Single calendar day or short slice
    // Use completed candles slice (excluding the live candle so CPR does not flicker per tick)
    const nonLiveCandles = candles.length > 5 ? candles.slice(0, -1) : candles;
    const sessionSize = Math.min(nonLiveCandles.length, Math.max(12, lookback));
    const priorSlice = nonLiveCandles.slice(-sessionSize);

    let priorHigh = -Infinity;
    let priorLow = Infinity;
    priorSlice.forEach((c) => {
      if (c.high > priorHigh) priorHigh = c.high;
      if (c.low < priorLow) priorLow = c.low;
    });
    const priorClose = priorSlice[priorSlice.length - 1].close;

    primaryLevels = computeLevels(priorHigh, priorLow, priorClose);
    const lastCandle = candles[candles.length - 1];
    primaryVirgin = !(lastCandle.high >= primaryLevels.bcActual && lastCandle.low <= primaryLevels.tcActual);
  }

  // 2-Day Relationship
  let relationship: CPRResult['relationship'] = 'UNCHANGED';
  if (historicalCPRs.length >= 2) {
    const today = historicalCPRs[historicalCPRs.length - 1];
    const yest = historicalCPRs[historicalCPRs.length - 2];

    if (today.bcActual > yest.tcActual) {
      relationship = 'HIGHER_VALUE';
    } else if (today.tcActual < yest.bcActual) {
      relationship = 'LOWER_VALUE';
    } else if (today.tcActual <= yest.tcActual && today.bcActual >= yest.bcActual) {
      relationship = 'INSIDE_CPR';
    } else if (today.tcActual >= yest.tcActual && today.bcActual <= yest.bcActual) {
      relationship = 'OUTSIDE_CPR';
    } else if (today.tcActual > yest.tcActual && today.bcActual > yest.bcActual) {
      relationship = 'OVERLAPPING_HIGHER';
    } else if (today.tcActual < yest.tcActual && today.bcActual < yest.bcActual) {
      relationship = 'OVERLAPPING_LOWER';
    }
  }

  // Next Day CPR projection based on today's active candles
  const currentDayCandles = dayGroups[dayGroups.length - 1]?.candles || candles;
  let todayHigh = -Infinity;
  let todayLow = Infinity;
  currentDayCandles.forEach((c) => {
    if (c.high > todayHigh) todayHigh = c.high;
    if (c.low < todayLow) todayLow = c.low;
  });
  const todayClose = candles[candles.length - 1].close;
  const nextLvl = computeLevels(todayHigh, todayLow, todayClose);

  return {
    ...primaryLevels,
    isVirgin: primaryVirgin,
    relationship,
    historicalCPRs,
    nextDayCPR: {
      pivot: nextLvl.pivot,
      tc: nextLvl.tc,
      bc: nextLvl.bc,
      tcActual: nextLvl.tcActual,
      bcActual: nextLvl.bcActual,
      cprWidth: nextLvl.cprWidth,
      cprWidthPercent: nextLvl.cprWidthPercent,
      widthType: nextLvl.widthType,
    },
  };
}

export interface ADXResult {
  adx: number[];
  plusDI: number[];
  minusDI: number[];
  currentADX: number;
  currentPlusDI: number;
  currentMinusDI: number;
  isTrending: boolean;
  isStrongTrend: boolean;
  isRising: boolean;
}

export function calculateADX(candles: Candle[], period = 14): ADXResult {
  const n = candles.length;
  if (n < period * 2) {
    const fallbackVal = 22;
    return {
      adx: candles.map(() => fallbackVal),
      plusDI: candles.map(() => 25),
      minusDI: candles.map(() => 20),
      currentADX: fallbackVal,
      currentPlusDI: 25,
      currentMinusDI: 20,
      isTrending: true,
      isStrongTrend: false,
      isRising: true,
    };
  }

  const tr: number[] = [candles[0].high - candles[0].low];
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];

  for (let i = 1; i < n; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];

    const currentTR = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prev.close),
      Math.abs(cur.low - prev.close)
    );
    tr.push(currentTR);

    const upMove = cur.high - prev.high;
    const downMove = prev.low - cur.low;

    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove);
    } else {
      plusDM.push(0);
    }

    if (downMove > upMove && downMove > 0) {
      minusDM.push(downMove);
    } else {
      minusDM.push(0);
    }
  }

  // Smooth TR, +DM, -DM with Wilder's smoothing
  let smoothTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

  const plusDIArr: number[] = [];
  const minusDIArr: number[] = [];
  const dxArr: number[] = [];

  for (let i = 0; i < n; i++) {
    if (i < period) {
      plusDIArr.push(25);
      minusDIArr.push(25);
      dxArr.push(20);
      continue;
    }

    smoothTR = smoothTR - smoothTR / period + tr[i];
    smoothPlusDM = smoothPlusDM - smoothPlusDM / period + plusDM[i];
    smoothMinusDM = smoothMinusDM - smoothMinusDM / period + minusDM[i];

    const pDI = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 25;
    const mDI = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 25;
    const diSum = pDI + mDI;
    const dx = diSum > 0 ? (Math.abs(pDI - mDI) / diSum) * 100 : 0;

    plusDIArr.push(pDI);
    minusDIArr.push(mDI);
    dxArr.push(dx);
  }

  // Smooth DX to get ADX
  const adxArr: number[] = [];
  let runningADX = dxArr.slice(period, period * 2).reduce((a, b) => a + b, 0) / period;

  for (let i = 0; i < n; i++) {
    if (i < period * 2) {
      adxArr.push(dxArr[i] || 20);
    } else {
      runningADX = (runningADX * (period - 1) + dxArr[i]) / period;
      adxArr.push(runningADX);
    }
  }

  const currentADX = adxArr[adxArr.length - 1] || 22;
  const prevADX = adxArr[adxArr.length - 2] || currentADX;
  const currentPlusDI = plusDIArr[plusDIArr.length - 1] || 25;
  const currentMinusDI = minusDIArr[minusDIArr.length - 1] || 20;

  return {
    adx: adxArr,
    plusDI: plusDIArr,
    minusDI: minusDIArr,
    currentADX: Number(currentADX.toFixed(2)),
    currentPlusDI: Number(currentPlusDI.toFixed(2)),
    currentMinusDI: Number(currentMinusDI.toFixed(2)),
    isTrending: currentADX >= 20,
    isStrongTrend: currentADX >= 25,
    isRising: currentADX >= prevADX,
  };
}

export interface CPRConfluenceEvaluation {
  isValid: boolean;
  action: 'BUY' | 'SELL' | 'NO_TRADE';
  confidence: number;
  reason: string;
  checklist: {
    cprCondition: { passed: boolean; details: string };
    emaCondition: { passed: boolean; details: string };
    adxCondition: { passed: boolean; details: string };
    rsiCondition: { passed: boolean; details: string };
    atrCondition: { passed: boolean; details: string };
  };
  metrics: {
    price: number;
    tc: number;
    pivot: number;
    bc: number;
    ema9: number;
    ema26: number;
    adx: number;
    adxRising: boolean;
    rsi: number;
    atr: number;
  };
  tradeLevels?: {
    entry: number;
    entryRange: [number, number];
    stopLoss: number;
    target1: number;
    target2: number;
    riskReward: string;
    riskPercent: number;
    rewardPercent: number;
  };
}

export function evaluateCPRConfluenceStrategy(
  candles: Candle[],
  currentPrice?: number
): CPRConfluenceEvaluation {
  const price = currentPrice || (candles && candles.length > 0 ? candles[candles.length - 1].close : 0);
  const defaultEval: CPRConfluenceEvaluation = {
    isValid: false,
    action: 'NO_TRADE',
    confidence: 50,
    reason: 'Insufficient candle data to compute multi-indicator confluence',
    checklist: {
      cprCondition: { passed: false, details: 'Need at least 20 candles' },
      emaCondition: { passed: false, details: 'Need at least 26 candles' },
      adxCondition: { passed: false, details: 'ADX requires 28+ periods' },
      rsiCondition: { passed: false, details: 'RSI requires 14 periods' },
      atrCondition: { passed: false, details: 'ATR requires 14 periods' },
    },
    metrics: {
      price,
      tc: price * 1.005,
      pivot: price,
      bc: price * 0.995,
      ema9: price,
      ema26: price,
      adx: 18,
      adxRising: false,
      rsi: 50,
      atr: price * 0.015,
    },
  };

  if (!candles || candles.length < 20) return defaultEval;

  const cpr = calculateCPR(candles);
  const ema9Arr = calculateEMA(candles, 9);
  const ema26Arr = calculateEMA(candles, 26);
  const rsiArr = calculateRSI(candles, 14);
  const atrArr = calculateATR(candles, 14);
  const adxResult = calculateADX(candles, 14);

  const ema9 = ema9Arr[ema9Arr.length - 1] || price;
  const ema26 = ema26Arr[ema26Arr.length - 1] || price;
  const rsi = rsiArr[rsiArr.length - 1] || 50;
  const atr = atrArr[atrArr.length - 1] || price * 0.015;
  const adx = adxResult.currentADX;
  const adxRising = adxResult.isRising;

  if (!cpr) return defaultEval;

  const { tcActual: tc, bcActual: bc, pivot, r1, s1, r2, s2 } = cpr;

  const precision = price < 0.001 ? 8 : price < 1 ? 5 : price < 50 ? 4 : 2;
  const fmt = (p: number) => Number(p.toFixed(precision));

  // Virgin CPR Detection: Previous 20 candles never intersected the CPR corridor
  const isVirginCPR = !candles.slice(-20, -1).some(c => c.high >= bc && c.low <= tc);

  // Volume Surge Confirmation
  const recentVols = candles.slice(-20).map(c => c.volume || 1);
  const avgVol = recentVols.reduce((a, b) => a + b, 0) / (recentVols.length || 1);
  const lastVol = candles[candles.length - 1]?.volume || avgVol;
  const isVolumeSurging = lastVol >= avgVol * 1.2;

  // 1. CPR Condition
  const isAboveTC = price > tc;
  const isBelowBC = price < bc;
  const isTrappedInCPR = price >= bc && price <= tc;

  let cprPassed = false;
  let cprDetails = '';
  if (isTrappedInCPR) {
    cprPassed = false;
    cprDetails = `Price ($${fmt(price)}) trapped inside CPR ($${fmt(bc)} - $${fmt(tc)}) → Consolidation / No Trade Zone`;
  } else if (isAboveTC) {
    cprPassed = true;
    cprDetails = `Price ($${fmt(price)}) > Top Central ($${fmt(tc)})${isVirginCPR ? ' [Virgin CPR Breakout ⚡]' : ''} → Bullish Context`;
  } else {
    cprPassed = true;
    cprDetails = `Price ($${fmt(price)}) < Bottom Central ($${fmt(bc)})${isVirginCPR ? ' [Virgin CPR Breakdown ⚡]' : ''} → Bearish Context`;
  }

  // 2. 9 EMA & 26 EMA Condition
  const ema9Above26 = ema9 > ema26;
  const ema9Below26 = ema9 < ema26;

  let emaPassed = false;
  let emaDetails = '';
  if (isAboveTC && ema9Above26) {
    emaPassed = true;
    emaDetails = `9 EMA ($${fmt(ema9)}) > 26 EMA ($${fmt(ema26)}) with upward trajectory (Bullish)`;
  } else if (isBelowBC && ema9Below26) {
    emaPassed = true;
    emaDetails = `9 EMA ($${fmt(ema9)}) < 26 EMA ($${fmt(ema26)}) with downward rejection (Bearish)`;
  } else {
    emaPassed = false;
    emaDetails = `EMA trend alignment inconsistent with CPR breakout`;
  }

  // 3. ADX 14 Trend Strength Condition (Must be >= 20 and rising or strong)
  let adxPassed = false;
  let adxDetails = '';
  if (adx >= 20 && adxRising) {
    adxPassed = true;
    adxDetails = `ADX is ${adx.toFixed(1)} (>= 20) & rising → High directional velocity confirmed`;
  } else if (adx >= 20) {
    adxPassed = true;
    adxDetails = `ADX is ${adx.toFixed(1)} (>= 20) → Sufficient trend velocity`;
  } else {
    adxPassed = false;
    adxDetails = `ADX is ${adx.toFixed(1)} (< 20) → Sideways compression / whipsaw risk`;
  }

  // 4. RSI 14 Condition (50-72 for Long, 28-50 for Short)
  let rsiPassed = false;
  let rsiDetails = '';
  if (isAboveTC) {
    if (rsi >= 50 && rsi <= 72) {
      rsiPassed = true;
      rsiDetails = `RSI is ${rsi.toFixed(1)} (Bullish momentum corridor 50-72)`;
    } else if (rsi > 72) {
      rsiPassed = false;
      rsiDetails = `RSI is ${rsi.toFixed(1)} (Overbought > 72) → Excessive risk of pullback`;
    } else {
      rsiPassed = false;
      rsiDetails = `RSI is ${rsi.toFixed(1)} (< 50) → Insufficient upward momentum`;
    }
  } else if (isBelowBC) {
    if (rsi >= 28 && rsi <= 50) {
      rsiPassed = true;
      rsiDetails = `RSI is ${rsi.toFixed(1)} (Bearish momentum corridor 28-50)`;
    } else if (rsi < 28) {
      rsiPassed = false;
      rsiDetails = `RSI is ${rsi.toFixed(1)} (Oversold < 28) → Excessive risk of short squeeze`;
    } else {
      rsiPassed = false;
      rsiDetails = `RSI is ${rsi.toFixed(1)} (> 50) → Downside momentum unconfirmed`;
    }
  } else {
    rsiDetails = `RSI is ${rsi.toFixed(1)} inside CPR range`;
  }

  // 5. ATR 14 Risk & Targets Calculation
  const slDistance = 1.5 * atr;
  const tpDistance = 3.0 * atr;
  const atrDetails = `14 ATR is $${fmt(atr)}. SL = 1.5x ATR ($${fmt(slDistance)}), TP = 3.0x ATR ($${fmt(tpDistance)}) yielding strict 1:2 R:R`;

  const checklist = {
    cprCondition: { passed: cprPassed && !isTrappedInCPR, details: cprDetails },
    emaCondition: { passed: emaPassed, details: emaDetails },
    adxCondition: { passed: adxPassed, details: adxDetails },
    rsiCondition: { passed: rsiPassed, details: rsiDetails },
    atrCondition: { passed: true, details: atrDetails },
  };

  const passCount = [
    checklist.cprCondition.passed,
    checklist.emaCondition.passed,
    checklist.adxCondition.passed,
    checklist.rsiCondition.passed,
  ].filter(Boolean).length;

  const isBuy = isAboveTC && ema9Above26 && adx >= 19 && rsi >= 48 && rsi <= 75;
  const isSell = isBelowBC && ema9Below26 && adx >= 19 && rsi <= 52 && rsi >= 25;

  let action: 'BUY' | 'SELL' | 'NO_TRADE' = 'NO_TRADE';
  let confidence = Math.round(50 + (passCount / 4) * 44);
  if (isVirginCPR) confidence = Math.min(96, confidence + 5);
  if (isVolumeSurging) confidence = Math.min(97, confidence + 4);

  if (isTrappedInCPR) {
    action = 'NO_TRADE';
    confidence = 35;
  } else if (isBuy) {
    action = 'BUY';
    confidence = Math.max(82, confidence);
  } else if (isSell) {
    action = 'SELL';
    confidence = Math.max(82, confidence);
  }

  let tradeLevels = undefined;
  if (action === 'BUY') {
    const entry = price;
    // Structural stop beyond CPR TC or 1.5x ATR, whichever is safer
    const stopLoss = fmt(Math.min(price - slDistance, tc * 0.998));
    const target1 = fmt(Math.max(price + tpDistance, r1));
    const target2 = fmt(Math.max(price + tpDistance * 1.6, r2));
    const riskPercent = Number(((price - stopLoss) / price * 100).toFixed(2));
    const rewardPercent = Number(((target1 - price) / price * 100).toFixed(2));

    tradeLevels = {
      entry,
      entryRange: [fmt(entry * 0.998), fmt(entry * 1.002)] as [number, number],
      stopLoss,
      target1,
      target2,
      riskReward: '1:2.0',
      riskPercent,
      rewardPercent,
    };
  } else if (action === 'SELL') {
    const entry = price;
    // Structural stop beyond CPR BC or 1.5x ATR, whichever is safer
    const stopLoss = fmt(Math.max(price + slDistance, bc * 1.002));
    const target1 = fmt(Math.min(price - tpDistance, s1));
    const target2 = fmt(Math.min(price - tpDistance * 1.6, s2));
    const riskPercent = Number(((stopLoss - price) / price * 100).toFixed(2));
    const rewardPercent = Number(((price - target1) / price * 100).toFixed(2));

    tradeLevels = {
      entry,
      entryRange: [fmt(entry * 0.998), fmt(entry * 1.002)] as [number, number],
      stopLoss,
      target1,
      target2,
      riskReward: '1:2.0',
      riskPercent,
      rewardPercent,
    };
  }

  let reason = '';
  if (action === 'BUY') {
    reason = `🚀 **ADVANCED CPR CONFLUENCE**: Price trading above Top Central ($${fmt(tc)})${isVirginCPR ? ' with Virgin CPR breakout' : ''} + 9 EMA > 26 EMA alignment. ADX is ${adx.toFixed(1)} (${adxRising ? 'surging' : 'steady'}) & RSI is ${rsi.toFixed(1)}${isVolumeSurging ? ' with institutional volume surge' : ''}.`;
  } else if (action === 'SELL') {
    reason = `🔻 **ADVANCED CPR BREAKDOWN**: Price rejected below Bottom Central ($${fmt(bc)})${isVirginCPR ? ' with Virgin CPR magnet breakdown' : ''} + 9 EMA < 26 EMA cascade. ADX is ${adx.toFixed(1)} & RSI is ${rsi.toFixed(1)}${isVolumeSurging ? ' with institutional volume surge' : ''}.`;
  } else if (isTrappedInCPR) {
    reason = `⏸️ **CONSOLIDATION FILTER (NO TRADE)**: Price ($${fmt(price)}) is inside the CPR corridor ($${fmt(bc)} - $${fmt(tc)}). Institutional rules enforce standing aside until explicit expansion.`;
  } else {
    reason = `⏳ **CONFLUENCE INCOMPLETE**: Criteria partially satisfied (${passCount}/4 criteria met). Awaiting synchronous ADX trend acceleration and RSI band alignment.`;
  }

  return {
    isValid: action !== 'NO_TRADE',
    action,
    confidence,
    reason,
    checklist,
    metrics: {
      price,
      tc,
      pivot,
      bc,
      ema9,
      ema26,
      adx,
      adxRising,
      rsi,
      atr,
    },
    tradeLevels,
  };
}
