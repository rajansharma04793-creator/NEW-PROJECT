import { AssetPair, Candle, CoinMetadata, TickerInfo } from '../types';
import { ALL_COINS_METADATA, INITIAL_TICKERS, generateSyntheticCandles } from '../data/marketData';
import { calculateCPR, CPRResult } from './indicators';

export type CPRTrendCategory =
  | 'STRONG_BULLISH' // Price > TC
  | 'MILD_BULLISH'   // TC >= Price > Pivot
  | 'RANGEBOUND'     // Price inside CPR (BC <= Price <= TC)
  | 'MILD_BEARISH'   // Pivot >= Price > BC
  | 'STRONG_BEARISH'; // Price < BC

export type CPRWidthType = 'NARROW' | 'AVERAGE' | 'WIDE';

export interface AssetCPRTrendData {
  symbol: AssetPair;
  name: string;
  category: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  precision: number;
  cpr: {
    pivot: number;
    tc: number;
    bc: number;
    tcActual: number;
    bcActual: number;
    cprWidth: number;
    cprWidthPercent: number;
    widthType: CPRWidthType;
    r1: number;
    s1: number;
    r2: number;
    s2: number;
    r3: number;
    s3: number;
  };
  nextDayCPR: {
    pivot: number;
    tc: number;
    bc: number;
    widthPercent: number;
    widthType: CPRWidthType;
  };
  trendCategory: CPRTrendCategory;
  trendLabel: string;
  trendScore: number; // -100 to +100
  isVirginCPR: boolean;
  confluenceSignal: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  tradeLevels: {
    action: 'LONG' | 'SHORT' | 'WAIT';
    entry: number;
    stopLoss: number;
    target1: number;
    target2: number;
    riskReward: string;
  };
  explanationHindi: string;
  explanationEnglish: string;
}

export interface CPRMarketOverview {
  totalAssets: number;
  strongBullishCount: number;
  mildBullishCount: number;
  rangeboundCount: number;
  mildBearishCount: number;
  strongBearishCount: number;
  narrowCPRCount: number;
  wideCPRCount: number;
  bullishBreadthPercent: number;
  bearishBreadthPercent: number;
  marketSentiment: 'EXTREME_BULLISH' | 'BULLISH' | 'NEUTRAL_CHOP' | 'BEARISH' | 'EXTREME_BEARISH';
  summaryHindi: string;
  summaryEnglish: string;
}

/**
 * Calculates CPR and Trend metrics for a specific asset given its ticker and candles.
 */
export function calculateAssetCPRTrend(
  coin: CoinMetadata,
  ticker: TickerInfo,
  timeframe: string = '15m'
): AssetCPRTrendData {
  const price = ticker.price;
  const high24h = ticker.high24h || price * 1.025;
  const low24h = ticker.low24h || price * 0.975;
  const change24h = ticker.change24h || 0;
  const precision = ticker.precision ?? (price > 100 ? 2 : price > 1 ? 4 : 5);

  // Derive static prior 24h close using 24h price delta
  const priorClose = change24h !== 0 ? price / (1 + (change24h / 100)) : price;

  // Generate synthetic candles if needed to calculate accurate multi-candle CPR
  const candles = generateSyntheticCandles(price, 48, timeframe);
  const cprResult = calculateCPR(candles, 24, timeframe);

  const pivot = cprResult?.pivot ?? (high24h + low24h + priorClose) / 3;
  const bc = cprResult?.bc ?? (high24h + low24h) / 2;
  const tc = cprResult?.tc ?? (2 * pivot - bc);
  const tcActual = cprResult?.tcActual ?? Math.max(tc, bc);
  const bcActual = cprResult?.bcActual ?? Math.min(tc, bc);
  const cprWidth = cprResult?.cprWidth ?? Math.abs(tcActual - bcActual);
  const cprWidthPercent = cprResult?.cprWidthPercent ?? (pivot > 0 ? (cprWidth / pivot) * 100 : 0.5);

  let widthType: CPRWidthType = (cprResult?.widthType as CPRWidthType) || 'AVERAGE';
  if (!cprResult?.widthType) {
    if (cprWidthPercent < 0.35) {
      widthType = 'NARROW';
    } else if (cprWidthPercent > 0.85) {
      widthType = 'WIDE';
    }
  }

  // Next Session CPR Projection based on current High, Low, and Close
  const nextPivot = (high24h + low24h + price) / 3;
  const nextBc = (high24h + low24h) / 2;
  const nextTc = 2 * nextPivot - nextBc;
  const nextTcActual = Math.max(nextTc, nextBc);
  const nextBcActual = Math.min(nextTc, nextBc);
  const nextWidth = Math.abs(nextTcActual - nextBcActual);
  const nextWidthPercent = nextPivot > 0 ? (nextWidth / nextPivot) * 100 : 0.5;
  const nextWidthType: CPRWidthType = nextWidthPercent < 0.35 ? 'NARROW' : nextWidthPercent > 0.85 ? 'WIDE' : 'AVERAGE';

  // Support & Resistance (Pivot levels)
  const r1 = cprResult?.r1 || 2 * pivot - low24h;
  const s1 = cprResult?.s1 || 2 * pivot - high24h;
  const r2 = cprResult?.r2 || pivot + (high24h - low24h);
  const s2 = cprResult?.s2 || pivot - (high24h - low24h);
  const r3 = cprResult?.r3 || high24h + 2 * (pivot - low24h);
  const s3 = cprResult?.s3 || low24h - 2 * (high24h - pivot);

  // Virgin CPR: Price has not touched the central pivot range in recent candles
  const isVirginCPR = cprResult?.isVirgin ?? candles.slice(-12).every((c) => Math.abs(c.low - pivot) > cprWidth * 0.4 && Math.abs(c.high - pivot) > cprWidth * 0.4);

  // Trend Categorization
  let trendCategory: CPRTrendCategory = 'RANGEBOUND';
  let trendLabel = 'Inside CPR (Consolidation)';
  let trendScore = 0;
  let confluenceSignal: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
  let confidence = 65;

  if (price > tcActual) {
    trendCategory = 'STRONG_BULLISH';
    trendLabel = 'Above TC (Strong Bullish)';
    trendScore = Math.min(98, Math.round(75 + (change24h > 0 ? change24h * 2 : 5)));
    confluenceSignal = 'BUY';
    confidence = widthType === 'NARROW' ? 92 : 86;
  } else if (price < bcActual) {
    trendCategory = 'STRONG_BEARISH';
    trendLabel = 'Below BC (Strong Bearish)';
    trendScore = Math.max(-98, Math.round(-75 + (change24h < 0 ? change24h * 2 : -5)));
    confluenceSignal = 'SELL';
    confidence = widthType === 'NARROW' ? 90 : 84;
  } else if (price > pivot) {
    trendCategory = 'MILD_BULLISH';
    trendLabel = 'Above Pivot (Mild Bullish)';
    trendScore = 35;
    confluenceSignal = widthType === 'NARROW' ? 'BUY' : 'WAIT';
    confidence = 72;
  } else if (price < pivot) {
    trendCategory = 'MILD_BEARISH';
    trendLabel = 'Below Pivot (Mild Bearish)';
    trendScore = -35;
    confluenceSignal = widthType === 'NARROW' ? 'SELL' : 'WAIT';
    confidence = 70;
  } else {
    trendCategory = 'RANGEBOUND';
    trendLabel = 'At Pivot (Neutral Chop)';
    trendScore = 0;
    confluenceSignal = 'WAIT';
    confidence = 50;
  }

  // Trade Setup Calculations
  let action: 'LONG' | 'SHORT' | 'WAIT' = 'WAIT';
  let entry = price;
  let stopLoss = bcActual;
  let target1 = r1;
  let target2 = r2;
  let riskReward = '1 : 2.2';

  if (trendCategory === 'STRONG_BULLISH') {
    action = 'LONG';
    entry = price;
    stopLoss = Number((tcActual * 0.994).toFixed(precision));
    target1 = Number(r1.toFixed(precision));
    target2 = Number(r2.toFixed(precision));
    const risk = Math.max(0.001, entry - stopLoss);
    const reward = Math.max(0.002, target1 - entry);
    riskReward = `1 : ${(reward / risk).toFixed(1)}`;
  } else if (trendCategory === 'STRONG_BEARISH') {
    action = 'SHORT';
    entry = price;
    stopLoss = Number((bcActual * 1.006).toFixed(precision));
    target1 = Number(s1.toFixed(precision));
    target2 = Number(s2.toFixed(precision));
    const risk = Math.max(0.001, stopLoss - entry);
    const reward = Math.max(0.002, entry - target1);
    riskReward = `1 : ${(reward / risk).toFixed(1)}`;
  } else {
    action = 'WAIT';
    entry = price;
    stopLoss = bcActual;
    target1 = tcActual;
    target2 = r1;
    riskReward = '1 : 1.5';
  }

  const hindiExplanation =
    trendCategory === 'STRONG_BULLISH'
      ? `Price Top Central ($${tcActual.toFixed(precision)}) ke upar trade kar raha hai. Yeh strong institutional buying trend dikhata hai. ${
          widthType === 'NARROW' ? 'Narrow CPR hone ki wajah se explosive breakout setup bana hua hai.' : ''
        }`
      : trendCategory === 'STRONG_BEARISH'
      ? `Price Bottom Central ($${bcActual.toFixed(precision)}) ke neeche trade kar raha hai. Heavy seller supply active hai.`
      : `Price CPR zone ($${bcActual.toFixed(precision)} - $${tcActual.toFixed(precision)}) ke andar trap hai. Yahan sideway chop ho sakta hai, breakout ka intezar karein.`;

  const englishExplanation =
    trendCategory === 'STRONG_BULLISH'
      ? `Price trading above Top Central Pivot ($${tcActual.toFixed(precision)}). High conviction bullish trend with buyers in control.`
      : trendCategory === 'STRONG_BEARISH'
      ? `Price trading below Bottom Central Pivot ($${bcActual.toFixed(precision)}). Aggressive seller supply dominates.`
      : `Price oscillating inside CPR range ($${bcActual.toFixed(precision)} - $${tcActual.toFixed(precision)}). Neutral consolidation.`;

  return {
    symbol: coin.symbol,
    name: coin.name,
    category: coin.category || 'all',
    price,
    change24h,
    high24h,
    low24h,
    volume24h: ticker.volume24h || 100000,
    precision,
    cpr: {
      pivot: Number(pivot.toFixed(precision)),
      tc: Number(tc.toFixed(precision)),
      bc: Number(bc.toFixed(precision)),
      tcActual: Number(tcActual.toFixed(precision)),
      bcActual: Number(bcActual.toFixed(precision)),
      cprWidth: Number(cprWidth.toFixed(precision)),
      cprWidthPercent: Number(cprWidthPercent.toFixed(2)),
      widthType,
      r1: Number(r1.toFixed(precision)),
      s1: Number(s1.toFixed(precision)),
      r2: Number(r2.toFixed(precision)),
      s2: Number(s2.toFixed(precision)),
      r3: Number(r3.toFixed(precision)),
      s3: Number(s3.toFixed(precision)),
    },
    nextDayCPR: {
      pivot: Number(nextPivot.toFixed(precision)),
      tc: Number(nextTcActual.toFixed(precision)),
      bc: Number(nextBcActual.toFixed(precision)),
      widthPercent: Number(nextWidthPercent.toFixed(2)),
      widthType: nextWidthType,
    },
    trendCategory,
    trendLabel,
    trendScore,
    isVirginCPR,
    confluenceSignal,
    confidence,
    tradeLevels: {
      action,
      entry,
      stopLoss,
      target1,
      target2,
      riskReward,
    },
    explanationHindi: hindiExplanation,
    explanationEnglish: englishExplanation,
  };
}

/**
 * Computes CPR trends across all available assets in the system.
 */
export function scanAllAssetsCPRTrend(
  tickers: Record<AssetPair, TickerInfo>,
  timeframe: string = '15m'
): {
  assets: AssetCPRTrendData[];
  overview: CPRMarketOverview;
} {
  const assets: AssetCPRTrendData[] = ALL_COINS_METADATA.map((coin) => {
    const ticker = tickers[coin.symbol] || INITIAL_TICKERS[coin.symbol] || {
      symbol: coin.symbol,
      price: 100,
      change24h: 0,
      high24h: 105,
      low24h: 95,
      volume24h: 1000000,
      precision: coin.precision || 2,
    };
    return calculateAssetCPRTrend(coin, ticker as TickerInfo, timeframe);
  });

  // Sort by highest absolute trend score and volume
  assets.sort((a, b) => Math.abs(b.trendScore) - Math.abs(a.trendScore) || b.volume24h - a.volume24h);

  const total = assets.length;
  const strongBullishCount = assets.filter((a) => a.trendCategory === 'STRONG_BULLISH').length;
  const mildBullishCount = assets.filter((a) => a.trendCategory === 'MILD_BULLISH').length;
  const rangeboundCount = assets.filter((a) => a.trendCategory === 'RANGEBOUND').length;
  const mildBearishCount = assets.filter((a) => a.trendCategory === 'MILD_BEARISH').length;
  const strongBearishCount = assets.filter((a) => a.trendCategory === 'STRONG_BEARISH').length;
  const narrowCPRCount = assets.filter((a) => a.cpr.widthType === 'NARROW').length;
  const wideCPRCount = assets.filter((a) => a.cpr.widthType === 'WIDE').length;

  const bullishTotal = strongBullishCount + mildBullishCount;
  const bearishTotal = strongBearishCount + mildBearishCount;
  const bullishBreadthPercent = total > 0 ? Math.round((bullishTotal / total) * 100) : 50;
  const bearishBreadthPercent = total > 0 ? Math.round((bearishTotal / total) * 100) : 50;

  let marketSentiment: 'EXTREME_BULLISH' | 'BULLISH' | 'NEUTRAL_CHOP' | 'BEARISH' | 'EXTREME_BEARISH' = 'NEUTRAL_CHOP';
  if (bullishBreadthPercent >= 70) marketSentiment = 'EXTREME_BULLISH';
  else if (bullishBreadthPercent >= 55) marketSentiment = 'BULLISH';
  else if (bearishBreadthPercent >= 70) marketSentiment = 'EXTREME_BEARISH';
  else if (bearishBreadthPercent >= 55) marketSentiment = 'BEARISH';
  else marketSentiment = 'NEUTRAL_CHOP';

  const summaryHindi = `Market me ${bullishBreadthPercent}% coins Bullish CPR zone (Above TC/Pivot) me hain aur ${narrowCPRCount} coins me Narrow CPR Breakout ban raha hai.`;
  const summaryEnglish = `${bullishBreadthPercent}% of tracked assets are trading in Bullish CPR zones (Above TC/Pivot), with ${narrowCPRCount} assets displaying Narrow CPR breakout readiness.`;

  const overview: CPRMarketOverview = {
    totalAssets: total,
    strongBullishCount,
    mildBullishCount,
    rangeboundCount,
    mildBearishCount,
    strongBearishCount,
    narrowCPRCount,
    wideCPRCount,
    bullishBreadthPercent,
    bearishBreadthPercent,
    marketSentiment,
    summaryHindi,
    summaryEnglish,
  };

  return { assets, overview };
}
