import {
  AssetPair,
  TickerInfo,
  Position,
  Order,
  AISignal,
  AppNotification,
  Candle,
  PriceAlert,
  CoinMetadata,
} from '../types';

export const ALL_COINS_METADATA: CoinMetadata[] = [
  {
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['bitcoin', 'btc', 'layer1', 'pow', 'store of value', 'digital gold', 'hot', 'crypto'],
    precision: 2,
    isHot: true,
  },
  {
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['ethereum', 'eth', 'layer1', 'pos', 'smart contracts', 'defi', 'hot', 'crypto'],
    precision: 2,
    isHot: true,
  },
  {
    symbol: 'SOL/USDT',
    name: 'Solana',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['solana', 'sol', 'layer1', 'fast', 'defi', 'meme', 'hot', 'crypto'],
    precision: 2,
    isHot: true,
  },
  {
    symbol: 'XRP/USDT',
    name: 'Ripple',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['ripple', 'xrp', 'payments', 'layer1', 'cross-border', 'hot', 'crypto'],
    precision: 4,
    isHot: true,
  },
  {
    symbol: 'BNB/USDT',
    name: 'BNB Chain',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['binance', 'bnb', 'layer1', 'bsc', 'exchange', 'crypto'],
    precision: 2,
  },
  {
    symbol: 'DOGE/USDT',
    name: 'Dogecoin',
    baseAsset: 'DOGE',
    quoteAsset: 'USDT',
    category: 'meme',
    tags: ['dogecoin', 'doge', 'meme', 'elon', 'dog', 'hot', 'crypto'],
    precision: 5,
    isHot: true,
  },
  {
    symbol: 'ZEC/USDT',
    name: 'Zcash',
    baseAsset: 'ZEC',
    quoteAsset: 'USDT',
    category: 'privacy',
    tags: ['zcash', 'zec', 'privacy', 'zk-snarks', 'shielded', 'gainers', 'hot', 'crypto'],
    precision: 2,
    isHot: true,
  },
  {
    symbol: 'HYPE/USDT',
    name: 'Hyperliquid',
    baseAsset: 'HYPE',
    quoteAsset: 'USDT',
    category: 'defi',
    tags: ['hyperliquid', 'hype', 'perp', 'dex', 'defi', 'hot', 'crypto'],
    precision: 3,
    isHot: true,
  },
  {
    symbol: 'XAU/USDT',
    name: 'Gold Futures (XAU/USDT)',
    baseAsset: 'XAU',
    quoteAsset: 'USDT',
    category: 'commodities',
    tags: ['gold', 'xau', 'futures', 'commodity', 'metal', 'safe haven', 'commodities'],
    precision: 2,
    isHot: true,
  },
  {
    symbol: 'XAG/USDT',
    name: 'Silver Perpetual',
    baseAsset: 'XAG',
    quoteAsset: 'USDT',
    category: 'commodities',
    tags: ['silver', 'xag', 'metal', 'precious metal', 'commodity', 'commodities'],
    precision: 3,
  },
  {
    symbol: 'WTI/USDT',
    name: 'Crude Oil WTI',
    baseAsset: 'WTI',
    quoteAsset: 'USDT',
    category: 'commodities',
    tags: ['oil', 'wti', 'crude', 'energy', 'commodity', 'commodities'],
    precision: 2,
  },
  {
    symbol: 'ADA/USDT',
    name: 'Cardano',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['cardano', 'ada', 'layer1', 'pos', 'smart contracts', 'crypto'],
    precision: 4,
  },
  {
    symbol: 'AVAX/USDT',
    name: 'Avalanche',
    baseAsset: 'AVAX',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['avalanche', 'avax', 'layer1', 'subnets', 'crypto'],
    precision: 2,
  },
  {
    symbol: 'SUI/USDT',
    name: 'Sui Network',
    baseAsset: 'SUI',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['sui', 'move', 'layer1', 'high throughput', 'hot', 'crypto'],
    precision: 4,
    isHot: true,
  },
  {
    symbol: 'NEAR/USDT',
    name: 'NEAR Protocol (AI)',
    baseAsset: 'NEAR',
    quoteAsset: 'USDT',
    category: 'ai',
    tags: ['near', 'ai', 'layer1', 'sharding', 'compute', 'crypto'],
    precision: 3,
    isHot: true,
  },
  {
    symbol: 'TAO/USDT',
    name: 'Bittensor (AI)',
    baseAsset: 'TAO',
    quoteAsset: 'USDT',
    category: 'ai',
    tags: ['bittensor', 'tao', 'ai', 'machine learning', 'neural net', 'hot', 'crypto'],
    precision: 2,
    isHot: true,
  },
  {
    symbol: 'RENDER/USDT',
    name: 'Render Network',
    baseAsset: 'RENDER',
    quoteAsset: 'USDT',
    category: 'ai',
    tags: ['render', 'rndr', 'ai', 'gpu', 'graphics', 'crypto'],
    precision: 3,
  },
  {
    symbol: 'FET/USDT',
    name: 'Artificial Superintelligence (ASI)',
    baseAsset: 'FET',
    quoteAsset: 'USDT',
    category: 'ai',
    tags: ['fet', 'fetch', 'asi', 'ai', 'agents', 'crypto'],
    precision: 4,
  },
  {
    symbol: 'LINK/USDT',
    name: 'Chainlink',
    baseAsset: 'LINK',
    quoteAsset: 'USDT',
    category: 'defi',
    tags: ['chainlink', 'link', 'oracle', 'ccip', 'rwa', 'defi', 'crypto'],
    precision: 2,
  },
  {
    symbol: 'UNI/USDT',
    name: 'Uniswap',
    baseAsset: 'UNI',
    quoteAsset: 'USDT',
    category: 'defi',
    tags: ['uniswap', 'uni', 'dex', 'amm', 'defi', 'crypto'],
    precision: 3,
  },
  {
    symbol: 'AAVE/USDT',
    name: 'Aave',
    baseAsset: 'AAVE',
    quoteAsset: 'USDT',
    category: 'defi',
    tags: ['aave', 'lending', 'borrowing', 'defi', 'crypto'],
    precision: 2,
  },
  {
    symbol: 'INJ/USDT',
    name: 'Injective',
    baseAsset: 'INJ',
    quoteAsset: 'USDT',
    category: 'defi',
    tags: ['injective', 'inj', 'orderbook', 'defi', 'cosmos', 'crypto'],
    precision: 3,
  },
  {
    symbol: 'PEPE/USDT',
    name: 'Pepe',
    baseAsset: 'PEPE',
    quoteAsset: 'USDT',
    category: 'meme',
    tags: ['pepe', 'frog', 'meme', 'hot', 'crypto'],
    precision: 8,
    isHot: true,
  },
  {
    symbol: 'SHIB/USDT',
    name: 'Shiba Inu',
    baseAsset: 'SHIB',
    quoteAsset: 'USDT',
    category: 'meme',
    tags: ['shiba inu', 'shib', 'meme', 'dog', 'crypto'],
    precision: 8,
  },
  {
    symbol: 'WIF/USDT',
    name: 'dogwifhat',
    baseAsset: 'WIF',
    quoteAsset: 'USDT',
    category: 'meme',
    tags: ['dogwifhat', 'wif', 'hat', 'solana meme', 'meme', 'hot', 'crypto'],
    precision: 4,
    isHot: true,
  },
  {
    symbol: 'BONK/USDT',
    name: 'Bonk',
    baseAsset: 'BONK',
    quoteAsset: 'USDT',
    category: 'meme',
    tags: ['bonk', 'meme', 'solana dog', 'crypto'],
    precision: 8,
  },
  {
    symbol: 'APT/USDT',
    name: 'Aptos',
    baseAsset: 'APT',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['aptos', 'apt', 'move', 'layer1', 'crypto'],
    precision: 3,
  },
  {
    symbol: 'DOT/USDT',
    name: 'Polkadot',
    baseAsset: 'DOT',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['polkadot', 'dot', 'parachains', 'interoperability', 'crypto'],
    precision: 3,
  },
  {
    symbol: 'ATOM/USDT',
    name: 'Cosmos',
    baseAsset: 'ATOM',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['cosmos', 'atom', 'ibc', 'interchain', 'crypto'],
    precision: 3,
  },
  {
    symbol: 'TRX/USDT',
    name: 'TRON',
    baseAsset: 'TRX',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['tron', 'trx', 'sun', 'usdt transfers', 'crypto'],
    precision: 4,
  },
  {
    symbol: 'TON/USDT',
    name: 'Toncoin',
    baseAsset: 'TON',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['toncoin', 'ton', 'telegram', 'layer1', 'crypto'],
    precision: 3,
  },
  {
    symbol: 'LTC/USDT',
    name: 'Litecoin',
    baseAsset: 'LTC',
    quoteAsset: 'USDT',
    category: 'layer1',
    tags: ['litecoin', 'ltc', 'silver to btc', 'pow', 'crypto'],
    precision: 2,
  },
  {
    symbol: 'XMR/USDT',
    name: 'Monero',
    baseAsset: 'XMR',
    quoteAsset: 'USDT',
    category: 'privacy',
    tags: ['monero', 'xmr', 'privacy', 'anonymous', 'ring signatures', 'crypto'],
    precision: 2,
  },
  {
    symbol: 'LUM/USDT',
    name: 'Lumina Token',
    baseAsset: 'LUM',
    quoteAsset: 'USDT',
    category: 'defi',
    tags: ['lumina', 'lum', 'terminal utility', 'staking', 'crypto'],
    precision: 2,
    isHot: true,
  },
];

export const ASSET_PAIRS: AssetPair[] = ALL_COINS_METADATA.map((c) => c.symbol);

export const INITIAL_TICKERS: Record<string, TickerInfo> = {
  'BTC/USDT': {
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: 77130.00,
    inrPrice: 7600441,
    change24h: 0.83,
    inrChange24h: 0.84,
    high24h: 78052.85,
    low24h: 76448.37,
    inrHigh24h: 7695000,
    inrLow24h: 7540000,
    volume24h: 24500,
    turnover24h: 1892686250,
    fundingRate: 0.0001,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
  'ETH/USDT': {
    symbol: 'ETH/USDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    price: 2456.00,
    inrPrice: 242000,
    change24h: 1.69,
    inrChange24h: 1.70,
    high24h: 2485.00,
    low24h: 2410.10,
    inrHigh24h: 244500,
    inrLow24h: 238000,
    volume24h: 184520,
    turnover24h: 447950000,
    fundingRate: 0.0001,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
  'SOL/USDT': {
    symbol: 'SOL/USDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    price: 93.99,
    inrPrice: 9275.10,
    change24h: 0.78,
    inrChange24h: 0.82,
    high24h: 96.20,
    low24h: 91.50,
    inrHigh24h: 9480,
    inrLow24h: 9050,
    volume24h: 4890000,
    turnover24h: 460638000,
    fundingRate: 0.00012,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
  'XRP/USDT': {
    symbol: 'XRP/USDT',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    price: 1.4601,
    inrPrice: 144.22,
    change24h: -1.14,
    inrChange24h: -1.17,
    high24h: 1.5220,
    low24h: 1.4250,
    inrHigh24h: 150.10,
    inrLow24h: 140.50,
    volume24h: 245080000,
    turnover24h: 363150000,
    fundingRate: 0.00015,
    nextFundingIn: '03:42:15',
    precision: 4,
  },
  'BNB/USDT': {
    symbol: 'BNB/USDT',
    baseAsset: 'BNB',
    quoteAsset: 'USDT',
    price: 695.80,
    inrPrice: 68796.80,
    change24h: 0.96,
    inrChange24h: 1.85,
    high24h: 708.20,
    low24h: 680.00,
    inrHigh24h: 70000,
    inrLow24h: 67500,
    volume24h: 420000,
    turnover24h: 292534200,
    fundingRate: 0.0001,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
  'DOGE/USDT': {
    symbol: 'DOGE/USDT',
    baseAsset: 'DOGE',
    quoteAsset: 'USDT',
    price: 0.09079,
    inrPrice: 8.959,
    change24h: -0.29,
    inrChange24h: 0.35,
    high24h: 0.09450,
    low24h: 0.08810,
    inrHigh24h: 9.35,
    inrLow24h: 8.70,
    volume24h: 2920000000,
    turnover24h: 270946800,
    fundingRate: 0.00018,
    nextFundingIn: '03:42:15',
    precision: 5,
  },
  'ZEC/USDT': {
    symbol: 'ZEC/USDT',
    baseAsset: 'ZEC',
    quoteAsset: 'USDT',
    price: 830.60,
    change24h: 23.662,
    high24h: 865.00,
    low24h: 670.20,
    volume24h: 345000,
    turnover24h: 286557000,
    fundingRate: 0.00035,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
  'HYPE/USDT': {
    symbol: 'HYPE/USDT',
    baseAsset: 'HYPE',
    quoteAsset: 'USDT',
    price: 78.975,
    change24h: 5.890,
    high24h: 82.500,
    low24h: 74.200,
    volume24h: 3120000,
    turnover24h: 246402000,
    fundingRate: 0.0002,
    nextFundingIn: '03:42:15',
    precision: 3,
  },
  'XAU/USDT': {
    symbol: 'XAU/USDT',
    baseAsset: 'XAU',
    quoteAsset: 'USDT',
    price: 4634.75,
    inrPrice: 457489.90,
    change24h: 0.97,
    inrChange24h: 0.50,
    high24h: 4651.77,
    low24h: 4589.06,
    inrHigh24h: 460000,
    inrLow24h: 448956,
    volume24h: 19490,
    turnover24h: 90331277,
    fundingRate: 0.00008,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
  'XAG/USDT': {
    symbol: 'XAG/USDT',
    baseAsset: 'XAG',
    quoteAsset: 'USDT',
    price: 31.85,
    change24h: 1.45,
    high24h: 32.40,
    low24h: 31.10,
    volume24h: 84000,
    turnover24h: 2675400,
    fundingRate: 0.00009,
    nextFundingIn: '03:42:15',
    precision: 3,
  },
  'WTI/USDT': {
    symbol: 'WTI/USDT',
    baseAsset: 'WTI',
    quoteAsset: 'USDT',
    price: 72.40,
    change24h: -1.15,
    high24h: 73.80,
    low24h: 71.90,
    volume24h: 120000,
    turnover24h: 8688000,
    fundingRate: 0.0001,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
  'ADA/USDT': {
    symbol: 'ADA/USDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    price: 0.3245,
    change24h: 3.84,
    high24h: 0.3380,
    low24h: 0.3110,
    volume24h: 45200000,
    turnover24h: 14667400,
    fundingRate: 0.0001,
    nextFundingIn: '03:42:15',
    precision: 4,
  },
  'AVAX/USDT': {
    symbol: 'AVAX/USDT',
    baseAsset: 'AVAX',
    quoteAsset: 'USDT',
    price: 21.85,
    change24h: 4.12,
    high24h: 22.90,
    low24h: 20.75,
    volume24h: 2310000,
    turnover24h: 50473500,
    fundingRate: 0.00012,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
  'SUI/USDT': {
    symbol: 'SUI/USDT',
    baseAsset: 'SUI',
    quoteAsset: 'USDT',
    price: 1.845,
    change24h: 8.65,
    high24h: 1.940,
    low24h: 1.680,
    volume24h: 34500000,
    turnover24h: 63652500,
    fundingRate: 0.00015,
    nextFundingIn: '03:42:15',
    precision: 4,
  },
  'NEAR/USDT': {
    symbol: 'NEAR/USDT',
    baseAsset: 'NEAR',
    quoteAsset: 'USDT',
    price: 3.250,
    change24h: 7.20,
    high24h: 3.420,
    low24h: 2.980,
    volume24h: 14200000,
    turnover24h: 46150000,
    fundingRate: 0.00014,
    nextFundingIn: '03:42:15',
    precision: 3,
  },
  'TAO/USDT': {
    symbol: 'TAO/USDT',
    baseAsset: 'TAO',
    quoteAsset: 'USDT',
    price: 365.20,
    change24h: 11.45,
    high24h: 382.00,
    low24h: 326.50,
    volume24h: 185000,
    turnover24h: 67562000,
    fundingRate: 0.0002,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
  'RENDER/USDT': {
    symbol: 'RENDER/USDT',
    baseAsset: 'RENDER',
    quoteAsset: 'USDT',
    price: 4.850,
    change24h: 5.30,
    high24h: 5.100,
    low24h: 4.550,
    volume24h: 4900000,
    turnover24h: 23765000,
    fundingRate: 0.00012,
    nextFundingIn: '03:42:15',
    precision: 3,
  },
  'FET/USDT': {
    symbol: 'FET/USDT',
    baseAsset: 'FET',
    quoteAsset: 'USDT',
    price: 0.8450,
    change24h: 6.75,
    high24h: 0.8950,
    low24h: 0.7850,
    volume24h: 16800000,
    turnover24h: 14196000,
    fundingRate: 0.00015,
    nextFundingIn: '03:42:15',
    precision: 4,
  },
  'LINK/USDT': {
    symbol: 'LINK/USDT',
    baseAsset: 'LINK',
    quoteAsset: 'USDT',
    price: 12.45,
    change24h: 2.85,
    high24h: 12.95,
    low24h: 11.90,
    volume24h: 3850000,
    turnover24h: 47932500,
    fundingRate: 0.0001,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
  'UNI/USDT': {
    symbol: 'UNI/USDT',
    baseAsset: 'UNI',
    quoteAsset: 'USDT',
    price: 6.850,
    change24h: 3.45,
    high24h: 7.150,
    low24h: 6.550,
    volume24h: 2900000,
    turnover24h: 19865000,
    fundingRate: 0.0001,
    nextFundingIn: '03:42:15',
    precision: 3,
  },
  'AAVE/USDT': {
    symbol: 'AAVE/USDT',
    baseAsset: 'AAVE',
    quoteAsset: 'USDT',
    price: 178.40,
    change24h: 4.85,
    high24h: 184.20,
    low24h: 169.00,
    volume24h: 340000,
    turnover24h: 60656000,
    fundingRate: 0.00015,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
  'INJ/USDT': {
    symbol: 'INJ/USDT',
    baseAsset: 'INJ',
    quoteAsset: 'USDT',
    price: 18.90,
    change24h: 6.20,
    high24h: 19.85,
    low24h: 17.50,
    volume24h: 1650000,
    turnover24h: 31185000,
    fundingRate: 0.00016,
    nextFundingIn: '03:42:15',
    precision: 3,
  },
  'PEPE/USDT': {
    symbol: 'PEPE/USDT',
    baseAsset: 'PEPE',
    quoteAsset: 'USDT',
    price: 0.00000854,
    change24h: 12.80,
    high24h: 0.00000920,
    low24h: 0.00000745,
    volume24h: 4200000000000,
    turnover24h: 35868000,
    fundingRate: 0.00025,
    nextFundingIn: '03:42:15',
    precision: 8,
  },
  'SHIB/USDT': {
    symbol: 'SHIB/USDT',
    baseAsset: 'SHIB',
    quoteAsset: 'USDT',
    price: 0.00001380,
    change24h: 4.25,
    high24h: 0.00001450,
    low24h: 0.00001310,
    volume24h: 1850000000000,
    turnover24h: 25530000,
    fundingRate: 0.00015,
    nextFundingIn: '03:42:15',
    precision: 8,
  },
  'WIF/USDT': {
    symbol: 'WIF/USDT',
    baseAsset: 'WIF',
    quoteAsset: 'USDT',
    price: 1.642,
    change24h: 9.40,
    high24h: 1.760,
    low24h: 1.480,
    volume24h: 32000000,
    turnover24h: 52544000,
    fundingRate: 0.0002,
    nextFundingIn: '03:42:15',
    precision: 4,
  },
  'BONK/USDT': {
    symbol: 'BONK/USDT',
    baseAsset: 'BONK',
    quoteAsset: 'USDT',
    price: 0.00001850,
    change24h: 5.60,
    high24h: 0.00001980,
    low24h: 0.00001720,
    volume24h: 1450000000000,
    turnover24h: 26825000,
    fundingRate: 0.00018,
    nextFundingIn: '03:42:15',
    precision: 8,
  },
  'APT/USDT': {
    symbol: 'APT/USDT',
    baseAsset: 'APT',
    quoteAsset: 'USDT',
    price: 5.620,
    change24h: 3.15,
    high24h: 5.850,
    low24h: 5.350,
    volume24h: 4200000,
    turnover24h: 23604000,
    fundingRate: 0.0001,
    nextFundingIn: '03:42:15',
    precision: 3,
  },
  'DOT/USDT': {
    symbol: 'DOT/USDT',
    baseAsset: 'DOT',
    quoteAsset: 'USDT',
    price: 4.250,
    change24h: 1.85,
    high24h: 4.400,
    low24h: 4.100,
    volume24h: 5600000,
    turnover24h: 23800000,
    fundingRate: 0.0001,
    nextFundingIn: '03:42:15',
    precision: 3,
  },
  'ATOM/USDT': {
    symbol: 'ATOM/USDT',
    baseAsset: 'ATOM',
    quoteAsset: 'USDT',
    price: 4.100,
    change24h: 2.10,
    high24h: 4.250,
    low24h: 3.980,
    volume24h: 2800000,
    turnover24h: 11480000,
    fundingRate: 0.0001,
    nextFundingIn: '03:42:15',
    precision: 3,
  },
  'TRX/USDT': {
    symbol: 'TRX/USDT',
    baseAsset: 'TRX',
    quoteAsset: 'USDT',
    price: 0.2354,
    change24h: 0.85,
    high24h: 0.2410,
    low24h: 0.2310,
    volume24h: 89000000,
    turnover24h: 20950600,
    fundingRate: 0.00005,
    nextFundingIn: '03:42:15',
    precision: 4,
  },
  'TON/USDT': {
    symbol: 'TON/USDT',
    baseAsset: 'TON',
    quoteAsset: 'USDT',
    price: 4.820,
    change24h: 3.65,
    high24h: 5.050,
    low24h: 4.600,
    volume24h: 7800000,
    turnover24h: 37596000,
    fundingRate: 0.00012,
    nextFundingIn: '03:42:15',
    precision: 3,
  },
  'LTC/USDT': {
    symbol: 'LTC/USDT',
    baseAsset: 'LTC',
    quoteAsset: 'USDT',
    price: 78.50,
    change24h: 1.25,
    high24h: 81.20,
    low24h: 76.80,
    volume24h: 920000,
    turnover24h: 72220000,
    fundingRate: 0.0001,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
  'XMR/USDT': {
    symbol: 'XMR/USDT',
    baseAsset: 'XMR',
    quoteAsset: 'USDT',
    price: 158.20,
    change24h: 4.85,
    high24h: 164.50,
    low24h: 151.00,
    volume24h: 310000,
    turnover24h: 49042000,
    fundingRate: 0.00015,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
  'LUM/USDT': {
    symbol: 'LUM/USDT',
    baseAsset: 'LUM',
    quoteAsset: 'USDT',
    price: 12.45,
    change24h: 14.20,
    high24h: 13.10,
    low24h: 10.80,
    volume24h: 580000,
    turnover24h: 7221000,
    fundingRate: 0.00025,
    nextFundingIn: '03:42:15',
    precision: 2,
  },
};

/**
 * Intelligent coin search and filter function with relevance scoring
 */
export function searchCoins(
  query: string,
  category: string = 'all',
  sortBy: 'volume' | 'change' | 'price' | 'name' = 'volume'
): CoinMetadata[] {
  const trimmed = query.trim().toLowerCase();
  const rawTokens = trimmed.split(/[\s,./\-_+]+/).filter(Boolean);

  // If no query and category is all, return all sorted
  if (!trimmed && category === 'all') {
    return sortCoinResults([...ALL_COINS_METADATA], sortBy);
  }

  // 1. First pass: Filter with category
  let scoredResults: { coin: CoinMetadata; score: number }[] = [];

  ALL_COINS_METADATA.forEach((coin) => {
    // Check category constraint
    let passesCategory = true;
    if (category !== 'all') {
      if (category === 'hot') {
        passesCategory = Boolean(coin.isHot);
      } else if (category === 'gainers') {
        const ticker = INITIAL_TICKERS[coin.symbol];
        passesCategory = Boolean(ticker && ticker.change24h >= 3.0);
      } else {
        passesCategory = coin.category === category;
      }
    }

    if (!trimmed) {
      if (passesCategory) {
        scoredResults.push({ coin, score: 1 });
      }
      return;
    }

    // Calculate match score
    const symLower = coin.symbol.toLowerCase();
    const baseLower = coin.baseAsset.toLowerCase();
    const nameLower = coin.name.toLowerCase();
    const catLower = (coin.category || '').toLowerCase();
    const tagsLower = coin.tags.map((t) => t.toLowerCase());

    let matchScore = 0;

    // Exact symbol or base matches
    if (symLower === trimmed || baseLower === trimmed || symLower.replace('/usdt', '') === trimmed) {
      matchScore += 100;
    } else if (nameLower === trimmed) {
      matchScore += 90;
    } else if (symLower.startsWith(trimmed) || baseLower.startsWith(trimmed)) {
      matchScore += 70;
    } else if (nameLower.startsWith(trimmed)) {
      matchScore += 60;
    }

    // Check token matches
    let allTokensMatch = true;
    for (const token of rawTokens) {
      const inSym = symLower.includes(token);
      const inBase = baseLower.includes(token);
      const inName = nameLower.includes(token);
      const inCat = catLower.includes(token);
      const inTags = tagsLower.some((t) => t.includes(token));

      if (inSym || inBase) {
        matchScore += 30;
      } else if (inName) {
        matchScore += 20;
      } else if (inCat) {
        matchScore += 15;
      } else if (inTags) {
        matchScore += 10;
      } else {
        allTokensMatch = false;
      }
    }

    // Direct substring check
    const cleanSym = symLower.replace(/[\s\/-]+/g, '');
    const cleanQuery = trimmed.replace(/[\s\/-]+/g, '');
    if (cleanSym.includes(cleanQuery)) {
      matchScore += 40;
    }

    if (matchScore > 0 && allTokensMatch) {
      // Bonus if category also passes
      if (passesCategory) {
        matchScore += 50;
      }
      scoredResults.push({ coin, score: matchScore });
    }
  });

  // If user searched a specific query and category yielded 0 results, fallback to all matching coins
  if (trimmed && scoredResults.length === 0 && category !== 'all') {
    ALL_COINS_METADATA.forEach((coin) => {
      const symLower = coin.symbol.toLowerCase();
      const baseLower = coin.baseAsset.toLowerCase();
      const nameLower = coin.name.toLowerCase();
      const catLower = (coin.category || '').toLowerCase();
      const tagsLower = coin.tags.map((t) => t.toLowerCase());

      let matchScore = 0;
      for (const token of rawTokens) {
        if (
          symLower.includes(token) ||
          baseLower.includes(token) ||
          nameLower.includes(token) ||
          catLower.includes(token) ||
          tagsLower.some((t) => t.includes(token))
        ) {
          matchScore += 10;
        }
      }
      if (matchScore > 0) {
        scoredResults.push({ coin, score: matchScore });
      }
    });
  }

  // Sort by score first (if query present), then by chosen sort criteria
  scoredResults.sort((a, b) => {
    if (trimmed && Math.abs(a.score - b.score) >= 20) {
      return b.score - a.score;
    }

    const tickerA = INITIAL_TICKERS[a.coin.symbol];
    const tickerB = INITIAL_TICKERS[b.coin.symbol];
    if (sortBy === 'change') {
      return (tickerB?.change24h || 0) - (tickerA?.change24h || 0);
    }
    if (sortBy === 'price') {
      return (tickerB?.price || 0) - (tickerA?.price || 0);
    }
    if (sortBy === 'name') {
      return a.coin.name.localeCompare(b.coin.name);
    }
    // Default volume
    return (tickerB?.turnover24h || 0) - (tickerA?.turnover24h || 0);
  });

  return scoredResults.map((item) => item.coin);
}

function sortCoinResults(
  coins: CoinMetadata[],
  sortBy: 'volume' | 'change' | 'price' | 'name'
): CoinMetadata[] {
  return coins.sort((a, b) => {
    const tickerA = INITIAL_TICKERS[a.symbol];
    const tickerB = INITIAL_TICKERS[b.symbol];
    if (sortBy === 'change') {
      return (tickerB?.change24h || 0) - (tickerA?.change24h || 0);
    }
    if (sortBy === 'price') {
      return (tickerB?.price || 0) - (tickerA?.price || 0);
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return (tickerB?.turnover24h || 0) - (tickerA?.turnover24h || 0);
  });
}

export function generateEarlierCandles(
  firstCandle: Candle,
  count: number = 60,
  timeframe: string = '15m'
): Candle[] {
  const stepMs =
    timeframe === '1s'
      ? 1000
      : timeframe === '1m'
      ? 60 * 1000
      : timeframe === '5m'
      ? 5 * 60 * 1000
      : timeframe === '15m'
      ? 15 * 60 * 1000
      : timeframe === '1h'
      ? 60 * 60 * 1000
      : timeframe === '4h'
      ? 4 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

  const earlier: Candle[] = [];
  let currentPrice = firstCandle.open;
  const basePrice = firstCandle.open;
  const decimals = basePrice > 100 ? 2 : basePrice > 1 ? 4 : 5;

  for (let i = 1; i <= count; i++) {
    const time = firstCandle.time - i * stepMs;
    const volatility = basePrice * (basePrice > 1000 ? 0.004 : basePrice > 10 ? 0.008 : 0.015);
    const randomChange = (Math.random() - 0.5) * volatility;

    const close = currentPrice;
    const open = Math.max(close * 0.4, close - randomChange);
    const high = Math.max(open, close) + Math.random() * volatility * 0.7;
    const low = Math.min(open, close) - Math.random() * volatility * 0.7;
    const volume = Math.floor(Math.random() * 80 + 20) * (basePrice > 1000 ? 1 : basePrice > 50 ? 50 : 1500);

    earlier.unshift({
      time,
      open: Number(open.toFixed(decimals)),
      high: Number(high.toFixed(decimals)),
      low: Number(low.toFixed(decimals)),
      close: Number(close.toFixed(decimals)),
      volume,
    });

    currentPrice = open;
  }

  return earlier;
}

export function generateSyntheticCandles(
  basePrice: number,
  count: number = 180,
  timeframe: string = '15m'
): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();

  const stepMs =
    timeframe === '1s'
      ? 1000
      : timeframe === '1m'
      ? 60 * 1000
      : timeframe === '5m'
      ? 5 * 60 * 1000
      : timeframe === '15m'
      ? 15 * 60 * 1000
      : timeframe === '1h'
      ? 60 * 60 * 1000
      : timeframe === '4h'
      ? 4 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

  let currentPrice = basePrice * 0.94;

  for (let i = count; i >= 0; i--) {
    const time = now - i * stepMs;
    const volatility = basePrice * (basePrice > 1000 ? 0.004 : basePrice > 10 ? 0.008 : 0.015);
    const trend = ((count - i) / count) * (basePrice * 0.04);
    const randomChange = (Math.random() - 0.485) * volatility;

    const open = currentPrice;
    const close = Math.max(open * 0.4, open + randomChange + trend * 0.015);
    const high = Math.max(open, close) + Math.random() * volatility * 0.8;
    const low = Math.min(open, close) - Math.random() * volatility * 0.8;
    const volume = Math.floor(Math.random() * 80 + 20) * (basePrice > 1000 ? 1 : basePrice > 50 ? 50 : 1500);

    const decimals = basePrice > 100 ? 2 : basePrice > 1 ? 4 : 5;

    candles.push({
      time,
      open: Number(open.toFixed(decimals)),
      high: Number(high.toFixed(decimals)),
      low: Number(low.toFixed(decimals)),
      close: Number(close.toFixed(decimals)),
      volume,
    });

    currentPrice = close;
  }

  if (candles.length > 0) {
    const decimals = basePrice > 100 ? 2 : basePrice > 1 ? 4 : 5;
    candles[candles.length - 1].close = Number(basePrice.toFixed(decimals));
    candles[candles.length - 1].high = Math.max(candles[candles.length - 1].high, basePrice);
    candles[candles.length - 1].low = Math.min(candles[candles.length - 1].low, basePrice);
  }

  return candles;
}

export const INITIAL_AI_SIGNALS: AISignal[] = [
  {
    id: 'sig-zec-breakout',
    symbol: 'ZEC/USDT',
    title: 'Privacy Protocol Liquidity Explosion',
    side: 'LONG',
    type: 'BULLISH_BREAKOUT',
    confidence: 96,
    timeframe: '15m',
    entryPrice: 830.60,
    entryRange: [824.0, 834.0],
    target1: 890.0,
    target2: 960.0,
    target3: 1040.0,
    stopLoss: 785.0,
    riskReward: '1 : 3.8',
    riskPercent: 5.49,
    rewardPercent: 20.87,
    recommendedLeverage: 10,
    strategy: 'Breakout Momentum',
    description: 'Massive spot volume breakout +23.6% on CoinDCX. Heavy taker buy flow clearing key resistance order blocks with expanding volume.',
    rationale: '• Sustained breakout above $820 horizontal accumulation shelf.\n• RSI at 68.4 with strong momentum expansion and no bearish divergence.\n• Bullish stack across EMA20 ($808), EMA50 ($772), and EMA200 ($710).\n• Orderflow Delta showing 84% aggressive taker buy dominance.',
    technicalSupport: {
      rsi: 68.4,
      rsiSignal: 'Bullish Divergence',
      macd: {
        macd: 18.4,
        signal: 11.2,
        histogram: 7.2,
        trend: 'Bullish Expansion',
      },
      emaTrend: 'Bullish Stack (20>50>200)',
      ema20: 808.50,
      ema50: 772.10,
      ema200: 710.40,
      supportLevel: 795.0,
      resistanceLevel: 940.0,
      atr: 28.5,
      orderflowImbalance: '+84.2% Net Taker Buy Delta',
      volumeSurge: '3.4x 20-MA',
      pivotPoint: 830.60,
      fibonacci382: 880.20,
      fibonacci618: 910.50,
    },
    timestamp: Date.now() - 1000 * 60 * 8,
    active: true,
  },
  {
    id: 'sig-eth-reversal',
    symbol: 'ETH/USDT',
    title: 'Spot Base Absorption Reversal',
    side: 'LONG',
    type: 'INSTITUTIONAL_ACCUMULATION',
    confidence: 93,
    timeframe: '15m',
    entryPrice: 2427.52,
    entryRange: [2420.0, 2432.0],
    target1: 2485.0,
    target2: 2560.0,
    target3: 2650.0,
    stopLoss: 2390.0,
    riskReward: '1 : 3.5',
    riskPercent: 1.54,
    rewardPercent: 5.45,
    recommendedLeverage: 15,
    strategy: 'Smart Money Orderflow',
    description: 'High-probability mean reversion setup at dynamic EMA support with heavy institutional bid clustering on CoinDCX orderbooks.',
    rationale: '• Clean bounce off 24h low ($2390) liquidity pool.\n• MACD bullish golden crossover confirmed on 15m and 1h charts.\n• RSI holding comfortably above 52 with higher lows structure.\n• Low ATR risk zone providing favorable 1:3.5 risk-to-reward ratio.',
    technicalSupport: {
      rsi: 54.2,
      rsiSignal: 'Neutral',
      macd: {
        macd: 4.85,
        signal: 2.10,
        histogram: 2.75,
        trend: 'Bullish Cross',
      },
      emaTrend: 'Golden Cross (20>50)',
      ema20: 2422.10,
      ema50: 2408.40,
      ema200: 2382.00,
      supportLevel: 2400.0,
      resistanceLevel: 2520.0,
      atr: 14.20,
      orderflowImbalance: '+76.1% Net Taker Buy Delta',
      volumeSurge: '1.9x 20-MA',
      pivotPoint: 2427.52,
      fibonacci382: 2478.10,
      fibonacci618: 2509.30,
    },
    timestamp: Date.now() - 1000 * 60 * 14,
    active: true,
  },
  {
    id: 'sig-xrp-momentum',
    symbol: 'XRP/USDT',
    title: 'Cross-Border Institutional Flow Surge',
    side: 'LONG',
    type: 'MOMENTUM_LONG',
    confidence: 94,
    timeframe: '1h',
    entryPrice: 1.4818,
    entryRange: [1.465, 1.490],
    target1: 1.6200,
    target2: 1.7800,
    target3: 1.9500,
    stopLoss: 1.4100,
    riskReward: '1 : 4.1',
    riskPercent: 4.84,
    rewardPercent: 20.12,
    recommendedLeverage: 10,
    strategy: 'Trend Following',
    description: '+6.8% gain accompanied by $363M 24h turnover. Price breaking out of descending trendline with institutional continuation volume.',
    rationale: '• Price breaking out above key $1.45 multi-week pivot.\n• RSI trending at 61.2 with steady accumulation slope.\n• 200 EMA dynamic floor solidifying at $1.35.\n• Orderbook bids 3.2x thicker than asks across top 20 levels.',
    technicalSupport: {
      rsi: 61.2,
      rsiSignal: 'Bullish Divergence',
      macd: {
        macd: 0.042,
        signal: 0.018,
        histogram: 0.024,
        trend: 'Bullish Expansion',
      },
      emaTrend: 'Bullish Stack (20>50>200)',
      ema20: 1.442,
      ema50: 1.405,
      ema200: 1.348,
      supportLevel: 1.420,
      resistanceLevel: 1.680,
      atr: 0.038,
      orderflowImbalance: '+79.5% Net Taker Buy Delta',
      volumeSurge: '2.8x 20-MA',
      pivotPoint: 1.4818,
      fibonacci382: 1.595,
      fibonacci618: 1.665,
    },
    timestamp: Date.now() - 1000 * 60 * 22,
    active: true,
  },
  {
    id: 'sig-hype-surge',
    symbol: 'HYPE/USDT',
    title: 'Hyperliquid Perps Volatility Breakout',
    side: 'LONG',
    type: 'BULLISH_BREAKOUT',
    confidence: 91,
    timeframe: '15m',
    entryPrice: 78.975,
    entryRange: [78.2, 79.5],
    target1: 86.40,
    target2: 94.50,
    target3: 105.00,
    stopLoss: 74.50,
    riskReward: '1 : 3.5',
    riskPercent: 5.66,
    rewardPercent: 19.65,
    recommendedLeverage: 10,
    strategy: 'Breakout Momentum',
    description: 'DeFi perpetual volume hitting new cycle records with bullish flag breakout and high buy-side order book pressure.',
    rationale: '• Clean bull flag resolution above $78.00 horizontal zone.\n• RSI at 64.1 indicating sustained buying pressure.\n• Golden ratio extension projection points to $94.50.',
    technicalSupport: {
      rsi: 64.1,
      rsiSignal: 'Neutral',
      macd: {
        macd: 1.45,
        signal: 0.82,
        histogram: 0.63,
        trend: 'Bullish Expansion',
      },
      emaTrend: 'Bullish Stack (20>50>200)',
      ema20: 76.80,
      ema50: 73.40,
      ema200: 68.20,
      supportLevel: 75.00,
      resistanceLevel: 88.00,
      atr: 2.15,
      orderflowImbalance: '+71.8% Net Taker Buy Delta',
      volumeSurge: '2.2x 20-MA',
      pivotPoint: 78.975,
      fibonacci382: 84.90,
      fibonacci618: 88.55,
    },
    timestamp: Date.now() - 1000 * 60 * 35,
    active: true,
  },
  {
    id: 'sig-xau-hedge',
    symbol: 'XAU/USDT',
    title: 'Macro Gold Spot Institutional Accumulation',
    side: 'LONG',
    type: 'INSTITUTIONAL_ACCUMULATION',
    confidence: 95,
    timeframe: '4h',
    entryPrice: 4581.91,
    entryRange: [4572.0, 4588.0],
    target1: 4660.0,
    target2: 4740.0,
    target3: 4850.0,
    stopLoss: 4530.0,
    riskReward: '1 : 3.1',
    riskPercent: 1.13,
    rewardPercent: 3.45,
    recommendedLeverage: 20,
    strategy: 'Smart Money Orderflow',
    description: 'Safe-haven gold spot accumulation firmly holding above $4,580 per ounce. Low volatility ATR contraction setup ready for directional expansion.',
    rationale: '• Strong institutional bid support at $4560 key daily swing level.\n• Low risk, high capital preservation setup with tight 1.1% stop loss.\n• RSI steady at 48.6 with hidden bullish divergence on 4h timeframe.',
    technicalSupport: {
      rsi: 48.6,
      rsiSignal: 'Bullish Divergence',
      macd: {
        macd: 8.2,
        signal: 5.1,
        histogram: 3.1,
        trend: 'Bullish Expansion',
      },
      emaTrend: 'Bullish Stack (20>50>200)',
      ema20: 4575.0,
      ema50: 4540.0,
      ema200: 4480.0,
      supportLevel: 4550.0,
      resistanceLevel: 4700.0,
      atr: 24.5,
      orderflowImbalance: '+82.0% Net Taker Buy Delta',
      volumeSurge: '1.6x 20-MA',
      pivotPoint: 4581.91,
      fibonacci382: 4642.0,
      fibonacci618: 4679.0,
    },
    timestamp: Date.now() - 1000 * 60 * 50,
    active: true,
  },
  {
    id: 'sig-btc-scalp',
    symbol: 'BTC/USDT',
    title: 'Value Area High Liquidity Sweep',
    side: 'LONG',
    type: 'MEAN_REVERSION_SCALP',
    confidence: 90,
    timeframe: '15m',
    entryPrice: 77252.50,
    entryRange: [77100.0, 77350.0],
    target1: 78500.0,
    target2: 79800.0,
    target3: 81500.0,
    stopLoss: 76400.0,
    riskReward: '1 : 2.9',
    riskPercent: 1.10,
    rewardPercent: 3.29,
    recommendedLeverage: 15,
    strategy: 'Mean Reversion Scalp',
    description: 'Bitcoin holding the $77k psychological benchmark with delta absorption on spot orderbooks and expanding open interest.',
    rationale: '• Defense of $76,800 24h low support cluster.\n• Clean 15m RSI recovery back above neutral 50.\n• Favorable 1:2.9 risk-reward ratio targeting previous local high.',
    technicalSupport: {
      rsi: 51.8,
      rsiSignal: 'Neutral',
      macd: {
        macd: 85.0,
        signal: 40.0,
        histogram: 45.0,
        trend: 'Bullish Cross',
      },
      emaTrend: 'Bullish Stack (20>50>200)',
      ema20: 77150.0,
      ema50: 76800.0,
      ema200: 75900.0,
      supportLevel: 76500.0,
      resistanceLevel: 79200.0,
      atr: 480.0,
      orderflowImbalance: '+69.4% Net Taker Buy Delta',
      volumeSurge: '1.7x 20-MA',
      pivotPoint: 77252.50,
      fibonacci382: 78225.0,
      fibonacci618: 78825.0,
    },
    timestamp: Date.now() - 1000 * 60 * 65,
    active: true,
  },
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-coindcx-1',
    title: 'CoinDCX Live Feed Connected',
    message: 'All asset prices reset & synchronizing with real-time CoinDCX order books.',
    type: 'system',
    timestamp: Date.now() - 1000 * 30,
    read: false,
  },
  {
    id: 'notif-zec-signal',
    title: 'AI Signal: ZEC/USDT Breakout (+23.6%)',
    message: '96% Conviction LONG setup generated. Entry: $830.60 | TP1: $890.00 | SL: $785.00',
    type: 'ai_signal',
    timestamp: Date.now() - 1000 * 60 * 8,
    read: false,
  },
  {
    id: 'notif-doge-vol',
    title: 'Volume Surge Alert: DOGE/USDT',
    message: 'Over $271M 24h volume recorded on CoinDCX with 84% buy bid density.',
    type: 'ai_signal',
    timestamp: Date.now() - 1000 * 60 * 20,
    read: false,
  },
  {
    id: 'notif-xau-gold',
    title: 'Commodities Update: XAU/USDT Gold',
    message: 'Gold Spot trading at $4,581.91 USDT with institutional hedge signal active.',
    type: 'system',
    timestamp: Date.now() - 1000 * 60 * 45,
    read: true,
  },
];

export const INITIAL_PRICE_ALERTS: PriceAlert[] = [
  {
    id: 'alert-eth-breakout',
    symbol: 'ETH/USDT',
    targetPrice: 2450.0,
    condition: 'rises_above',
    note: 'Major resistance breakout target',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    status: 'active',
    isRecurring: false,
    soundEnabled: true,
    initialPriceAtCreation: 2427.52,
  },
  {
    id: 'alert-btc-resistance',
    symbol: 'BTC/USDT',
    targetPrice: 78000.0,
    condition: 'rises_above',
    note: 'Psychological milestone retest',
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    status: 'active',
    isRecurring: true,
    soundEnabled: true,
    initialPriceAtCreation: 77252.5,
  },
  {
    id: 'alert-sol-support',
    symbol: 'SOL/USDT',
    targetPrice: 92.0,
    condition: 'drops_below',
    note: 'Key dip buying support level',
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    status: 'active',
    isRecurring: false,
    soundEnabled: true,
    initialPriceAtCreation: 94.2,
  },
  {
    id: 'alert-xrp-target',
    symbol: 'XRP/USDT',
    targetPrice: 1.52,
    condition: 'rises_above',
    note: 'Take profit target #1',
    createdAt: Date.now() - 1000 * 60 * 30,
    status: 'active',
    isRecurring: false,
    soundEnabled: true,
    initialPriceAtCreation: 1.4818,
  },
];
