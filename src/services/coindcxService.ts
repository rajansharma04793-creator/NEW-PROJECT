import { AssetPair, TickerInfo, CoinDCXTickerRaw, Candle, OrderBookItem, FuturesInstrument } from '../types';
import { ALL_COINS_METADATA, INITIAL_TICKERS } from '../data/marketData';

export interface CoinPairConfig {
  coindcxMarkets: string[];
  precision: number;
  baseAsset: string;
  defaultPrice: number;
  defaultHigh: number;
  defaultLow: number;
  defaultChange: number;
  defaultVolume: number;
}

export const PAIR_CONFIG: Record<string, CoinPairConfig> = ALL_COINS_METADATA.reduce(
  (acc, meta) => {
    const init = INITIAL_TICKERS[meta.symbol];
    const base = meta.baseAsset.toUpperCase();
    acc[meta.symbol] = {
      coindcxMarkets: [
        base === 'XAU' ? 'XAUUSDT' : '',
        base === 'XAU' ? 'B-XAU_USDT' : '',
        base === 'XAU' ? 'XAU_USDT' : '',
        base === 'XAU' ? 'PAXGUSDT' : '',
        base === 'XAU' ? 'B-PAXG_USDT' : '',
        base === 'POL' ? 'POLUSDT' : '',
        base === 'POL' ? 'MATICUSDT' : '',
        base === 'MATIC' ? 'POLUSDT' : '',
        base === 'MATIC' ? 'MATICUSDT' : '',
        base === 'S' ? 'SUSDT' : '',
        base === 'S' ? 'SONICUSDT' : '',
        `${base}USDT`,
        `B-${base}_USDT`,
        `${base}_USDT`,
        `I-${base}_USDT`,
        base === 'WTI' ? 'B-USOIL_USDT' : '',
        base === 'SPX' ? 'B-SP500_USDT' : '',
        base === 'NDX' ? 'B-NAS100_USDT' : '',
      ].filter(Boolean),
      precision: meta.precision,
      baseAsset: base,
      defaultPrice: init?.price || 10.0,
      defaultHigh: init?.high24h || (init?.price ? init.price * 1.03 : 10.3),
      defaultLow: init?.low24h || (init?.price ? init.price * 0.97 : 9.7),
      defaultChange: init?.change24h || 0.5,
      defaultVolume: init?.volume24h || 1000000,
    };
    return acc;
  },
  {} as Record<string, CoinPairConfig>
);

/**
 * Fetches raw live ticker records from CoinDCX with fallback strategy & cache-busting
 */
async function fetchRawCoinDCXData(): Promise<CoinDCXTickerRaw[] | null> {
  const endpoints = [
    `/api/coindcx/ticker?_t=${Date.now()}`, // Server-side proxy (fastest, CORS bypassed, cache-busting)
    'https://api.coindcx.com/exchange/ticker', // Direct public fallback
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      }
    } catch {
      // Continue to next endpoint if failed
    }
  }
  return null;
}

/**
 * Fetches real-time contract prices from CoinDCX Global Futures Active Instruments
 * - Extracts last_price, mark_price, index_price, funding_rate, 24h change
 */
export async function fetchCoinDCXFuturesActiveInstruments(): Promise<Map<string, FuturesInstrument> | null> {
  const endpoints = [
    `/api/coindcx/futures/active_instruments?_t=${Date.now()}`,
    `/api/coindcx/futures/tickers?_t=${Date.now()}`,
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const instrumentsList = data?.instruments || (Array.isArray(data) ? data : null);
        if (Array.isArray(instrumentsList) && instrumentsList.length > 0) {
          const map = new Map<string, FuturesInstrument>();
          for (const item of instrumentsList) {
            const rawPair = item.pair || (typeof item.instrument === 'string' ? item.instrument.replace('B-', '').replace('I-', '').replace('_', '') : '');
            const cleanPair = rawPair.toUpperCase();
            const instKey = (item.instrument || '').toUpperCase();

            const parsed: FuturesInstrument = {
              instrument: item.instrument || cleanPair,
              pair: cleanPair,
              symbol: item.symbol || `${cleanPair.replace('USDT', '')}/USDT`,
              last_price: parseFloat(item.last_price) || 0,
              mark_price: parseFloat(item.mark_price) || parseFloat(item.last_price) || 0,
              index_price: parseFloat(item.index_price) || parseFloat(item.last_price) || 0,
              funding_rate: parseFloat(item.funding_rate) || 0.0001,
              change_24h: parseFloat(item.change_24h) || 0,
              change_percentage_24h: parseFloat(item.change_percentage_24h) || 0,
              high_24h: parseFloat(item.high_24h) || 0,
              low_24h: parseFloat(item.low_24h) || 0,
              volume_24h: parseFloat(item.volume_24h) || 0,
              turnover_24h: parseFloat(item.turnover_24h) || 0,
              timestamp: item.timestamp || Date.now(),
            };

            if (cleanPair) map.set(cleanPair, parsed);
            if (instKey) map.set(instKey, parsed);
          }
          return map;
        }
      }
    } catch {
      // Continue to next fallback
    }
  }

  // Direct public fallback to Binance Futures FAPI if server proxy is unavailable
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const [fapiTickerRes, fapiPremRes] = await Promise.all([
      fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?_t=${Date.now()}`, { signal: controller.signal, cache: 'no-store' }),
      fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?_t=${Date.now()}`, { signal: controller.signal, cache: 'no-store' }),
    ]);
    clearTimeout(timeoutId);

    if (fapiTickerRes.ok && fapiPremRes.ok) {
      const fapiTickers = await fapiTickerRes.json();
      const fapiPrem = await fapiPremRes.json();

      const premMap = new Map<string, any>();
      for (const p of fapiPrem) {
        if (p?.symbol) premMap.set(p.symbol, p);
      }

      const map = new Map<string, FuturesInstrument>();
      for (const t of fapiTickers) {
        if (t?.symbol) {
          const sym = t.symbol.toUpperCase();
          const p = premMap.get(sym);
          const last_price = parseFloat(t.lastPrice) || 0;
          const mark_price = p ? parseFloat(p.markPrice) : last_price;
          const index_price = p ? parseFloat(p.indexPrice) : last_price;
          const funding_rate = p ? parseFloat(p.lastFundingRate) : 0.0001;

          const parsed: FuturesInstrument = {
            instrument: `B-${sym.replace('USDT', '_USDT')}`,
            pair: sym,
            symbol: `${sym.replace('USDT', '')}/USDT`,
            last_price,
            mark_price,
            index_price,
            funding_rate,
            change_24h: parseFloat(t.priceChange) || 0,
            change_percentage_24h: parseFloat(t.priceChangePercent) || 0,
            high_24h: parseFloat(t.highPrice) || 0,
            low_24h: parseFloat(t.lowPrice) || 0,
            volume_24h: parseFloat(t.volume) || 0,
            turnover_24h: parseFloat(t.quoteVolume) || 0,
            timestamp: Date.now(),
          };

          map.set(sym, parsed);
          map.set(`B-${sym.replace('USDT', '_USDT')}`, parsed);
        }
      }
      return map;
    }
  } catch {}

  return null;
}

/**
 * Returns the correct CoinDCX pair identifier for tickers or candles/orderbooks
 * - Ticker: BTCUSDT, BTCINR, USDTINR, XAUUSDT
 * - Candles/Orderbook: B-BTC_USDT, I-BTC_INR, B-XAU_USDT
 */
export function getCoinDCXPairKey(
  symbol: string,
  type: 'ticker' | 'candle_orderbook' = 'candle_orderbook',
  currency: 'USDT' | 'INR' = 'USDT'
): string {
  const base = symbol.replace('/USDT', '').replace('-USDT', '').replace('/INR', '').replace('-INR', '').toUpperCase();
  if (type === 'ticker') {
    return currency === 'INR' ? `${base}INR` : `${base}USDT`;
  }
  // Candles & Orderbook require B- or I- prefixes
  if (currency === 'INR') {
    return `I-${base}_INR`;
  }
  if (base === 'XAU') return 'B-XAU_USDT';
  if (base === 'WTI') return 'B-USOIL_USDT';
  return `B-${base}_USDT`;
}

/**
 * Fetches real historical/live candles from CoinDCX Proxy:
 * /api/coindcx/candles?pair={PAIR}&interval={INTERVAL}
 * - Automatically reverses descending order to chronological ascending order
 * - Parses string numbers with parseFloat()
 */
export async function fetchCoinDCXCandles(
  pairOrSymbol: string,
  interval: string = '15m',
  limit: number = 150,
  currency: 'USDT' | 'INR' = 'USDT'
): Promise<Candle[] | null> {
  try {
    const pairKey = pairOrSymbol.startsWith('B-') || pairOrSymbol.startsWith('I-')
      ? pairOrSymbol
      : getCoinDCXPairKey(pairOrSymbol, 'candle_orderbook', currency);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `/api/coindcx/candles?pair=${encodeURIComponent(pairKey)}&interval=${encodeURIComponent(
        interval
      )}&limit=${limit}&_t=${Date.now()}`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const rawCandles = await res.json();
      if (Array.isArray(rawCandles) && rawCandles.length > 0) {
        // Ensure chronological ascending order (oldest first)
        const isDescending = rawCandles.length > 1 && Number(rawCandles[0].time) > Number(rawCandles[rawCandles.length - 1].time);
        const ordered = isDescending ? [...rawCandles].reverse() : rawCandles;

        const formattedCandles: Candle[] = ordered
          .map((c: any) => ({
            time: Number(c.time),
            open: parseFloat(c.open),
            high: parseFloat(c.high),
            low: parseFloat(c.low),
            close: parseFloat(c.close),
            volume: parseFloat(c.volume || 0),
          }))
          .filter((c) => !isNaN(c.open) && !isNaN(c.close) && c.open > 0);

        if (formattedCandles.length > 0) {
          return formattedCandles;
        }
      }
    }
  } catch (err) {
    console.warn('fetchCoinDCXCandles error:', err);
  }
  return null;
}

/**
 * Fetches real-time depth orderbook from CoinDCX Proxy:
 * /api/coindcx/orderbook?pair={PAIR}
 */
export async function fetchCoinDCXOrderBook(
  pairOrSymbol: string,
  currency: 'USDT' | 'INR' = 'USDT'
): Promise<{
  bids: OrderBookItem[];
  asks: OrderBookItem[];
  timestamp: number;
} | null> {
  try {
    const pairKey = pairOrSymbol.startsWith('B-') || pairOrSymbol.startsWith('I-')
      ? pairOrSymbol
      : getCoinDCXPairKey(pairOrSymbol, 'candle_orderbook', currency);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(
      `/api/coindcx/orderbook?pair=${encodeURIComponent(pairKey)}&_t=${Date.now()}`,
      {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && (Array.isArray(data.bids) || Array.isArray(data.asks))) {
        const rawBids = Array.isArray(data.bids) ? data.bids : [];
        const rawAsks = Array.isArray(data.asks) ? data.asks : [];

        const bids: OrderBookItem[] = rawBids.map((b: any) => ({
          price: parseFloat(b.price) || 0,
          amount: parseFloat(b.amount) || 0,
          total: parseFloat(b.total) || 0,
          depthPercent: 0,
        }));

        const asks: OrderBookItem[] = rawAsks.map((a: any) => ({
          price: parseFloat(a.price) || 0,
          amount: parseFloat(a.amount) || 0,
          total: parseFloat(a.total) || 0,
          depthPercent: 0,
        }));

        return {
          bids,
          asks,
          timestamp: data.timestamp || Date.now(),
        };
      }
    }
  } catch (err) {
    console.warn('fetchCoinDCXOrderBook error:', err);
  }
  return null;
}

/**
 * Fetches live ticker records from CoinDCX API and maps them to standard TickerInfo objects
 * - Synchronizes with CoinDCX Global Futures Active Instruments for derivatives and commodities (e.g. XAU/USDT)
 */
export async function fetchCoinDCXTickers(): Promise<{
  tickers: Partial<Record<AssetPair, TickerInfo>>;
  latencyMs: number;
  success: boolean;
}> {
  const start = performance.now();
  try {
    const [rawList, futuresMap] = await Promise.all([
      fetchRawCoinDCXData(),
      fetchCoinDCXFuturesActiveInstruments(),
    ]);

    const rawMap = new Map<string, CoinDCXTickerRaw>();

    if (rawList) {
      rawList.forEach((item) => {
        if (item && item.market) {
          rawMap.set(item.market.toUpperCase(), item);
        }
      });
    }

    const result: Partial<Record<AssetPair, TickerInfo>> = {};
    const pairs = Object.keys(PAIR_CONFIG) as AssetPair[];

    // Extract live CoinDCX USDT/INR rate (used by CoinDCX Futures INR valuation)
    const usdtInrItem = rawMap.get('USDTINR') || rawMap.get('I-USDT_INR') || rawMap.get('B-USDT_INR');
    const usdtInrRate = usdtInrItem && !isNaN(parseFloat(usdtInrItem.last_price)) && parseFloat(usdtInrItem.last_price) > 0
      ? parseFloat(usdtInrItem.last_price)
      : 98.63;

    pairs.forEach((pair) => {
      const config = PAIR_CONFIG[pair];
      let raw: CoinDCXTickerRaw | undefined;
      let rawInr: CoinDCXTickerRaw | undefined;

      // Check if pair has CoinDCX Futures Active Instrument data
      const futuresKeys = [
        config.baseAsset === 'XAU' ? 'XAUUSDT' : '',
        config.baseAsset === 'XAU' ? 'B-XAU_USDT' : '',
        config.baseAsset === 'WTI' ? 'B-USOIL_USDT' : '',
        `${config.baseAsset}USDT`,
        `B-${config.baseAsset}_USDT`,
      ].filter(Boolean);

      let futuresData: FuturesInstrument | undefined;
      if (futuresMap) {
        for (const fk of futuresKeys) {
          const found = futuresMap.get(fk.toUpperCase());
          if (found) {
            futuresData = found;
            break;
          }
        }
      }

      // Match USDT spot market
      for (const m of config.coindcxMarkets) {
        const found = rawMap.get(m.toUpperCase());
        if (found) {
          raw = found;
          break;
        }
      }

      // Match INR market from CoinDCX (e.g. BTCINR, I-BTC_INR, PAXGINR)
      const inrKeys = [
        config.baseAsset === 'XAU' ? 'PAXGINR' : '',
        config.baseAsset === 'XAU' ? 'I-PAXG_INR' : '',
        config.baseAsset === 'XAU' ? 'B-PAXG_INR' : '',
        config.baseAsset === 'POL' ? 'POLINR' : '',
        config.baseAsset === 'POL' ? 'MATICINR' : '',
        config.baseAsset === 'MATIC' ? 'POLINR' : '',
        config.baseAsset === 'MATIC' ? 'MATICINR' : '',
        config.baseAsset === 'S' ? 'SINR' : '',
        `${config.baseAsset}INR`,
        `I-${config.baseAsset}_INR`,
        `B-${config.baseAsset}_INR`,
      ].filter(Boolean);

      for (const k of inrKeys) {
        const found = rawMap.get(k.toUpperCase());
        if (found) {
          rawInr = found;
          break;
        }
      }

      // If Futures contract data is available, use Futures price; otherwise fallback to Spot
      const rawPrice = futuresData && futuresData.last_price > 0
        ? futuresData.last_price
        : (raw ? parseFloat(raw.last_price) : NaN);
      const price = !isNaN(rawPrice) && rawPrice > 0 ? rawPrice : config.defaultPrice;

      const rawChange = futuresData && futuresData.change_percentage_24h !== undefined
        ? futuresData.change_percentage_24h
        : (raw ? parseFloat(raw.change_24_hour) : NaN);
      const change24h = !isNaN(rawChange) ? rawChange : config.defaultChange;

      const rawHigh = futuresData && futuresData.high_24h > 0
        ? futuresData.high_24h
        : (raw ? parseFloat(raw.high) : NaN);
      const high24h = !isNaN(rawHigh) && rawHigh > 0 ? Math.max(rawHigh, price) : config.defaultHigh;

      const rawLow = futuresData && futuresData.low_24h > 0
        ? futuresData.low_24h
        : (raw ? parseFloat(raw.low) : NaN);
      const low24h = !isNaN(rawLow) && rawLow > 0 ? Math.min(rawLow, price) : config.defaultLow;

      const rawVolume = futuresData && futuresData.volume_24h > 0
        ? futuresData.volume_24h
        : (raw ? parseFloat(raw.volume) : NaN);
      const volume24h = !isNaN(rawVolume) && rawVolume > 0 ? rawVolume : config.defaultVolume;

      const turnover24h = futuresData && futuresData.turnover_24h > 0
        ? futuresData.turnover_24h
        : volume24h * price;

      // Extract CoinDCX Spot & Futures INR metrics
      const rawInrPrice = rawInr ? parseFloat(rawInr.last_price) : NaN;
      const spotInrPrice = !isNaN(rawInrPrice) && rawInrPrice > 0 ? rawInrPrice : undefined;

      // CoinDCX Futures INR price = USDT contract price * CoinDCX live USDT/INR rate
      const futuresInrPrice = price * usdtInrRate;
      const inrPrice = futuresInrPrice;

      const rawInrChange = rawInr ? parseFloat(rawInr.change_24_hour) : NaN;
      const inrChange24h = !isNaN(rawInrChange) ? rawInrChange : change24h;

      const rawInrHigh = rawInr ? parseFloat(rawInr.high) : NaN;
      const inrHigh24h = !isNaN(rawInrHigh) && rawInrHigh > 0 ? rawInrHigh : high24h * usdtInrRate;

      const rawInrLow = rawInr ? parseFloat(rawInr.low) : NaN;
      const inrLow24h = !isNaN(rawInrLow) && rawInrLow > 0 ? rawInrLow : low24h * usdtInrRate;

      const markPrice = futuresData?.mark_price || price;
      const indexPrice = futuresData?.index_price || price;
      const fundingRate = futuresData?.funding_rate !== undefined ? futuresData.funding_rate : 0.0001;

      result[pair] = {
        symbol: pair,
        baseAsset: config.baseAsset,
        quoteAsset: 'USDT',
        price: Number(price.toFixed(config.precision)),
        last_price: Number(price.toFixed(config.precision)),
        mark_price: Number(markPrice.toFixed(config.precision)),
        markPrice: Number(markPrice.toFixed(config.precision)),
        index_price: Number(indexPrice.toFixed(config.precision)),
        indexPrice: Number(indexPrice.toFixed(config.precision)),
        funding_rate: fundingRate,
        fundingRate,
        change_24h: Number(change24h.toFixed(2)),
        change_percentage_24h: Number(change24h.toFixed(2)),
        inrPrice: inrPrice ? Number(inrPrice.toFixed(inrPrice < 1 ? 4 : inrPrice < 100 ? 2 : 1)) : undefined,
        futuresInrPrice: Number(futuresInrPrice.toFixed(futuresInrPrice < 1 ? 4 : futuresInrPrice < 100 ? 2 : 1)),
        spotInrPrice: spotInrPrice ? Number(spotInrPrice.toFixed(spotInrPrice < 1 ? 4 : spotInrPrice < 100 ? 2 : 1)) : undefined,
        usdtInrRate: Number(usdtInrRate.toFixed(2)),
        change24h: Number(change24h.toFixed(2)),
        inrChange24h: inrChange24h !== undefined ? Number(inrChange24h.toFixed(2)) : undefined,
        high24h: Number(high24h.toFixed(config.precision)),
        low24h: Number(low24h.toFixed(config.precision)),
        inrHigh24h: inrHigh24h ? Number(inrHigh24h.toFixed(2)) : undefined,
        inrLow24h: inrLow24h ? Number(inrLow24h.toFixed(2)) : undefined,
        volume24h,
        turnover24h,
        nextFundingIn: '03:42:15',
        precision: config.precision,
        isFutures: !!futuresData,
      };
    });

    const latencyMs = Math.round(performance.now() - start);
    return { tickers: result, latencyMs, success: rawList !== null || futuresMap !== null };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start);
    console.warn('CoinDCX fetch fallback used:', error);
    return { tickers: {}, latencyMs, success: false };
  }
}

/**
 * Fetches real historical candles from server proxy with fallback to synthetic candles
 */
export async function fetchLiveCandles(
  symbol: AssetPair,
  timeframe: string = '15m',
  limit: number = 100
): Promise<Candle[] | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `/api/market/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(
        timeframe
      )}&limit=${limit}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Return null to allow client generation fallback
  }
  return null;
}
