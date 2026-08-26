import { Candle, FootprintCandleData, FootprintClusterLevel, OrderBookItem } from '../types';

/**
 * Generate Footprint Order Flow Clusters from Candle and Volume Data
 */
export function generateFootprintData(
  candles: Candle[],
  tickCount = 10,
  imbalanceRatio = 3.0
): FootprintCandleData[] {
  let runningCumulativeDelta = 0;

  return candles.map((c, cIdx) => {
    const range = Math.max(c.high - c.low, 0.01);
    const numLevels = Math.max(5, Math.min(tickCount, 16));
    const step = range / numLevels;

    const clusters: FootprintClusterLevel[] = [];
    const isBull = c.close >= c.open;
    let candleDelta = 0;
    let maxClusterVol = 0;
    let pocPrice = c.low + range / 2;

    const volumePerLevel = c.volume / numLevels;

    for (let i = 0; i < numLevels; i++) {
      const price = c.low + step * (i + 0.5);
      // Bias buy/sell based on whether price is close to close vs open
      const priceNorm = (price - c.low) / range; // 0 to 1
      const buyBias = isBull ? 0.35 + priceNorm * 0.4 : 0.65 - priceNorm * 0.4;
      
      // Add slight organic variance based on candle index and level
      const noise = (Math.sin(cIdx * 7 + i * 13) + 1) * 0.1;
      const effectiveBuyBias = Math.min(0.9, Math.max(0.1, buyBias + (noise - 0.05)));

      const levelVol = volumePerLevel * (0.6 + (Math.cos(i - numLevels / 2) + 1) * 0.4);
      const buyVol = Math.round(levelVol * effectiveBuyBias * 10) / 10;
      const sellVol = Math.round(levelVol * (1 - effectiveBuyBias) * 10) / 10;
      const delta = Math.round((buyVol - sellVol) * 10) / 10;

      if (buyVol + sellVol > maxClusterVol) {
        maxClusterVol = buyVol + sellVol;
        pocPrice = price;
      }

      candleDelta += delta;
      clusters.push({
        price,
        buyVol,
        sellVol,
        delta,
      });
    }

    // Flag POC and Imbalances (Diagonal or Horizontal)
    clusters.forEach((cl, i) => {
      if (Math.abs(cl.price - pocPrice) < step / 2) {
        cl.isPOC = true;
      }
      // Diagonal Imbalance check: Buy vol against lower Sell vol, Sell vol against upper Buy vol
      if (cl.buyVol >= cl.sellVol * imbalanceRatio && cl.buyVol > 5) {
        cl.isImbalance = true;
        cl.imbalanceSide = 'buy';
      } else if (cl.sellVol >= cl.buyVol * imbalanceRatio && cl.sellVol > 5) {
        cl.isImbalance = true;
        cl.imbalanceSide = 'sell';
      }
    });

    runningCumulativeDelta += candleDelta;

    // Calculate Value Area (70% of volume)
    const sortedByVol = [...clusters].sort((a, b) => b.buyVol + b.sellVol - (a.buyVol + a.sellVol));
    const totalCandleVol = clusters.reduce((acc, curr) => acc + curr.buyVol + curr.sellVol, 0);
    const target70Vol = totalCandleVol * 0.7;
    let accumulatedVol = 0;
    const valueAreaClusters: FootprintClusterLevel[] = [];

    for (const cl of sortedByVol) {
      valueAreaClusters.push(cl);
      accumulatedVol += cl.buyVol + cl.sellVol;
      if (accumulatedVol >= target70Vol) break;
    }

    let vahPrice = Math.max(...valueAreaClusters.map((v) => v.price));
    let valPrice = Math.min(...valueAreaClusters.map((v) => v.price));

    return {
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      totalVolume: c.volume,
      delta: Math.round(candleDelta * 10) / 10,
      cumulativeDelta: Math.round(runningCumulativeDelta * 10) / 10,
      pocPrice,
      vahPrice,
      valPrice,
      clusters,
    };
  });
}

/**
 * TPO Market Profile Distribution
 */
export interface TPORow {
  price: number;
  letters: string;
  count: number;
  isPOC: boolean;
  isVA: boolean;
  isIB: boolean; // Initial Balance
  volume: number;
}

export interface MarketProfileData {
  rows: TPORow[];
  pocPrice: number;
  vahPrice: number;
  valPrice: number;
  ibHigh: number;
  ibLow: number;
  singlePrints: { high: number; low: number }[];
}

export function calculateMarketProfile(
  candles: Candle[],
  numPriceBins = 24
): MarketProfileData | null {
  if (candles.length === 0) return null;

  let minPrice = Infinity;
  let maxPrice = -Infinity;

  candles.forEach((c) => {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
  });

  const range = maxPrice - minPrice || 1;
  const binSize = range / numPriceBins;

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const binMap = new Map<number, { letters: Set<string>; volume: number }>();

  for (let i = 0; i < numPriceBins; i++) {
    binMap.set(i, { letters: new Set(), volume: 0 });
  }

  // Initial Balance (first 4 periods = A, B, C, D)
  let ibHigh = -Infinity;
  let ibLow = Infinity;
  const ibCandles = candles.slice(0, Math.min(4, candles.length));
  ibCandles.forEach((c) => {
    if (c.high > ibHigh) ibHigh = c.high;
    if (c.low < ibLow) ibLow = c.low;
  });

  candles.forEach((c, idx) => {
    const letter = letters[idx % letters.length];
    const lowBin = Math.max(0, Math.min(numPriceBins - 1, Math.floor((c.low - minPrice) / binSize)));
    const highBin = Math.max(0, Math.min(numPriceBins - 1, Math.floor((c.high - minPrice) / binSize)));

    const binsCount = highBin - lowBin + 1;
    const volPerBin = c.volume / binsCount;

    for (let b = lowBin; b <= highBin; b++) {
      const entry = binMap.get(b);
      if (entry) {
        entry.letters.add(letter);
        entry.volume += volPerBin;
      }
    }
  });

  let maxCount = 0;
  let pocBin = 0;
  let totalTPOs = 0;

  const rows: { bin: number; price: number; letters: string; count: number; volume: number }[] = [];

  for (let i = numPriceBins - 1; i >= 0; i--) {
    const entry = binMap.get(i)!;
    const sortedLetters = Array.from(entry.letters).sort().join('');
    const count = entry.letters.size;
    totalTPOs += count;

    if (count > maxCount) {
      maxCount = count;
      pocBin = i;
    }

    rows.push({
      bin: i,
      price: minPrice + (i + 0.5) * binSize,
      letters: sortedLetters,
      count,
      volume: Math.round(entry.volume),
    });
  }

  const pocPrice = minPrice + (pocBin + 0.5) * binSize;

  // Value Area = 70% of TPOs starting from POC
  const sortedByCount = [...rows].sort((a, b) => b.count - a.count);
  const target70 = totalTPOs * 0.7;
  let currentTPOs = 0;
  const vaBins = new Set<number>();

  for (const r of sortedByCount) {
    vaBins.add(r.bin);
    currentTPOs += r.count;
    if (currentTPOs >= target70) break;
  }

  const vaPrices = rows.filter((r) => vaBins.has(r.bin)).map((r) => r.price);
  const vahPrice = Math.max(...vaPrices);
  const valPrice = Math.min(...vaPrices);

  // Single prints (bins with only 1 letter, indicative of fast directional liquidity sweeps)
  const singlePrints: { high: number; low: number }[] = [];
  rows.forEach((r) => {
    if (r.count === 1) {
      singlePrints.push({ high: r.price + binSize / 2, low: r.price - binSize / 2 });
    }
  });

  const finalRows: TPORow[] = rows.map((r) => ({
    price: r.price,
    letters: r.letters,
    count: r.count,
    isPOC: r.bin === pocBin,
    isVA: vaBins.has(r.bin),
    isIB: r.price <= ibHigh && r.price >= ibLow,
    volume: r.volume,
  }));

  return {
    rows: finalRows,
    pocPrice,
    vahPrice,
    valPrice,
    ibHigh: ibHigh === -Infinity ? maxPrice : ibHigh,
    ibLow: ibLow === Infinity ? minPrice : ibLow,
    singlePrints,
  };
}

/**
 * Liquidity Heatmap Snapshot generator
 */
export interface LiquiditySnapshot {
  timestamp: number;
  priceMin: number;
  priceMax: number;
  levels: { price: number; bidDensity: number; askDensity: number; totalDensity: number }[];
}

export function generateLiquidityHeatmapHistory(
  bids: OrderBookItem[],
  asks: OrderBookItem[],
  currentPrice: number,
  historySteps = 40
): LiquiditySnapshot[] {
  const snapshots: LiquiditySnapshot[] = [];
  const now = Date.now();

  const maxBidVol = Math.max(...bids.map((b) => b.amount), 1);
  const maxAskVol = Math.max(...asks.map((a) => a.amount), 1);

  for (let s = historySteps - 1; s >= 0; s--) {
    const time = now - s * 2000;
    const priceDrift = Math.sin(s * 0.4) * (currentPrice * 0.002);
    const snapPrice = currentPrice + priceDrift;

    const levels = [];

    // Combine top bids & asks
    for (const a of asks.slice(0, 15)) {
      const askVolNorm = Math.min(1, (a.amount / maxAskVol) * (0.8 + Math.random() * 0.4));
      levels.push({
        price: a.price + priceDrift * 0.5,
        bidDensity: 0,
        askDensity: askVolNorm,
        totalDensity: askVolNorm,
      });
    }

    for (const b of bids.slice(0, 15)) {
      const bidVolNorm = Math.min(1, (b.amount / maxBidVol) * (0.8 + Math.random() * 0.4));
      levels.push({
        price: b.price + priceDrift * 0.5,
        bidDensity: bidVolNorm,
        askDensity: 0,
        totalDensity: bidVolNorm,
      });
    }

    levels.sort((a, b) => b.price - a.price);

    snapshots.push({
      timestamp: time,
      priceMin: snapPrice * 0.985,
      priceMax: snapPrice * 1.015,
      levels,
    });
  }

  return snapshots;
}
