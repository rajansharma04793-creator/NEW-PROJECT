import React, { useState, useMemo } from 'react';
import { AssetPair, TickerInfo } from '../types';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Target,
  ArrowRight,
  Info,
  X,
  Layers,
  Percent,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface PipCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: AssetPair;
  tickers: Record<AssetPair, TickerInfo>;
  onSelectPair?: (pair: AssetPair) => void;
  onApplyToOrderPanel?: (params: {
    symbol: AssetPair;
    price: number;
    amount: number;
    leverage: number;
    takeProfit?: number;
    stopLoss?: number;
    side: 'buy' | 'sell';
  }) => void;
}

interface InstrumentContractConfig {
  pipSize: number; // e.g. 0.0001 for EURUSD, 0.01 for USDJPY and Gold
  contractSize: number; // units per 1.0 standard lot
  category: 'forex' | 'metal' | 'commodity' | 'crypto' | 'stock';
  displayName: string;
}

const INSTRUMENT_CONFIGS: Record<string, InstrumentContractConfig> = {
  'EUR/USD': { pipSize: 0.0001, contractSize: 100000, category: 'forex', displayName: 'Euro / US Dollar' },
  'GBP/USD': { pipSize: 0.0001, contractSize: 100000, category: 'forex', displayName: 'British Pound / US Dollar' },
  'USD/JPY': { pipSize: 0.01, contractSize: 100000, category: 'forex', displayName: 'US Dollar / Japanese Yen' },
  'USD/CHF': { pipSize: 0.0001, contractSize: 100000, category: 'forex', displayName: 'US Dollar / Swiss Franc' },
  'AUD/USD': { pipSize: 0.0001, contractSize: 100000, category: 'forex', displayName: 'Australian Dollar / US Dollar' },
  'USD/CAD': { pipSize: 0.0001, contractSize: 100000, category: 'forex', displayName: 'US Dollar / Canadian Dollar' },
  'USD/INR': { pipSize: 0.0025, contractSize: 1000, category: 'forex', displayName: 'US Dollar / Indian Rupee' },
  'XAU/USDT': { pipSize: 0.01, contractSize: 100, category: 'metal', displayName: 'Gold Spot / Futures (100 oz/lot)' },
  'XAU/USD': { pipSize: 0.01, contractSize: 100, category: 'metal', displayName: 'Gold Spot (XAU/USD)' },
  'XAG/USDT': { pipSize: 0.001, contractSize: 5000, category: 'metal', displayName: 'Silver Spot (5000 oz/lot)' },
  'XAG/USD': { pipSize: 0.001, contractSize: 5000, category: 'metal', displayName: 'Silver Spot (XAG/USD)' },
  'WTI/USDT': { pipSize: 0.01, contractSize: 1000, category: 'commodity', displayName: 'Crude Oil WTI (1000 bbl/lot)' },
  'BRENT/USDT': { pipSize: 0.01, contractSize: 1000, category: 'commodity', displayName: 'Brent Crude Oil' },
  'COPPER/USDT': { pipSize: 0.0005, contractSize: 25000, category: 'commodity', displayName: 'High Grade Copper' },
  'BTC/USDT': { pipSize: 1.0, contractSize: 1, category: 'crypto', displayName: 'Bitcoin Perpetual' },
  'ETH/USDT': { pipSize: 0.1, contractSize: 1, category: 'crypto', displayName: 'Ethereum Perpetual' },
  'SOL/USDT': { pipSize: 0.01, contractSize: 1, category: 'crypto', displayName: 'Solana Perpetual' },
  'NVDA/USD': { pipSize: 0.01, contractSize: 100, category: 'stock', displayName: 'NVIDIA Corp (100 shares/lot)' },
  'AAPL/USD': { pipSize: 0.01, contractSize: 100, category: 'stock', displayName: 'Apple Inc (100 shares/lot)' },
  'TSLA/USD': { pipSize: 0.01, contractSize: 100, category: 'stock', displayName: 'Tesla Inc (100 shares/lot)' },
  'SPX500': { pipSize: 0.1, contractSize: 10, category: 'stock', displayName: 'S&P 500 Index Contract' },
};

export const PipCalculatorModal: React.FC<PipCalculatorModalProps> = ({
  isOpen,
  onClose,
  currentPair,
  tickers,
  onSelectPair,
  onApplyToOrderPanel,
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<AssetPair>(currentPair);
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
  const [accountCurrency, setAccountCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'INR'>('USD');
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(2); // 2% risk by default
  const [calcMode, setCalcMode] = useState<'by_risk' | 'by_lots'>('by_risk');
  const [manualLotSize, setManualLotSize] = useState<number>(1.0);
  const [leverage, setLeverage] = useState<number>(20);

  // Active Instrument config
  const instrument = INSTRUMENT_CONFIGS[selectedSymbol] || {
    pipSize: 0.01,
    contractSize: 100,
    category: 'forex',
    displayName: selectedSymbol,
  };

  const ticker = tickers[selectedSymbol] || { price: 100, precision: 2 };
  const currentPrice = ticker.price || 100;

  // Entry, SL and TP state
  const [entryPrice, setEntryPrice] = useState<number>(currentPrice);
  const [stopLossPrice, setStopLossPrice] = useState<number>(
    tradeSide === 'buy' ? currentPrice - instrument.pipSize * 50 : currentPrice + instrument.pipSize * 50
  );
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(
    tradeSide === 'buy' ? currentPrice + instrument.pipSize * 150 : currentPrice - instrument.pipSize * 150
  );

  // Synchronize when currentPair changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedSymbol(currentPair);
      const cp = tickers[currentPair]?.price || 100;
      const inst = INSTRUMENT_CONFIGS[currentPair] || { pipSize: 0.01, contractSize: 100 };
      setEntryPrice(cp);
      setStopLossPrice(tradeSide === 'buy' ? cp - inst.pipSize * 50 : cp + inst.pipSize * 50);
      setTakeProfitPrice(tradeSide === 'buy' ? cp + inst.pipSize * 150 : cp - inst.pipSize * 150);
    }
  }, [isOpen, currentPair]);

  // Synchronize when symbol changes
  const handleSymbolChange = (sym: AssetPair) => {
    setSelectedSymbol(sym);
    const cp = tickers[sym]?.price || 100;
    const inst = INSTRUMENT_CONFIGS[sym] || { pipSize: 0.01, contractSize: 100 };
    setEntryPrice(cp);
    setStopLossPrice(tradeSide === 'buy' ? cp - inst.pipSize * 50 : cp + inst.pipSize * 50);
    setTakeProfitPrice(tradeSide === 'buy' ? cp + inst.pipSize * 150 : cp - inst.pipSize * 150);
  };

  // Math Calculations
  const calculations = useMemo(() => {
    const pipSize = instrument.pipSize;
    const contractUnits = instrument.contractSize;

    // Price difference in pips
    const slDistance = Math.abs(entryPrice - stopLossPrice);
    const slPips = Math.max(0.1, slDistance / pipSize);

    const tpDistance = Math.abs(takeProfitPrice - entryPrice);
    const tpPips = Math.max(0.1, tpDistance / pipSize);

    // Dollar Risk Target based on account balance & risk %
    const targetDollarRisk = accountBalance * (riskPercent / 100);

    // Pip Value for 1.0 Standard Lot (in USD)
    // Formula: Pip Size * Contract Size
    const pipValueStandardLot = pipSize * contractUnits;

    // Derived Lot Size (if calcMode === 'by_risk')
    let recommendedLotSize = targetDollarRisk / (slPips * pipValueStandardLot);
    recommendedLotSize = Math.max(0.01, Math.round(recommendedLotSize * 100) / 100);

    const activeLotSize = calcMode === 'by_risk' ? recommendedLotSize : manualLotSize;

    // Total Pip Value for active lot size
    const totalPipValue = activeLotSize * pipValueStandardLot;

    // Actual Dollar Risk at SL
    const totalDollarRisk = slPips * totalPipValue;

    // Total Potential Reward at TP
    const totalPotentialReward = tpPips * totalPipValue;

    // Risk / Reward Ratio
    const rrRatio = slDistance > 0 ? (tpDistance / slDistance).toFixed(2) : '1.0';

    // Position Total Notional Value
    const totalNotionalValue = activeLotSize * contractUnits * entryPrice;

    // Margin Required based on Leverage
    const marginRequired = totalNotionalValue / leverage;

    // INR exchange rate for convenience
    const inrRate = 86.85;

    return {
      slPips: slPips.toFixed(1),
      tpPips: tpPips.toFixed(1),
      pipValueStandardLot: pipValueStandardLot.toFixed(2),
      totalPipValue: totalPipValue.toFixed(2),
      activeLotSize,
      targetDollarRisk: targetDollarRisk.toFixed(2),
      totalDollarRisk: totalDollarRisk.toFixed(2),
      totalDollarRiskINR: (totalDollarRisk * inrRate).toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      totalPotentialReward: totalPotentialReward.toFixed(2),
      totalPotentialRewardINR: (totalPotentialReward * inrRate).toLocaleString('en-IN', { maximumFractionDigits: 0 }),
      rrRatio,
      totalNotionalValue: totalNotionalValue.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      marginRequired: marginRequired.toFixed(2),
    };
  }, [
    instrument,
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    accountBalance,
    riskPercent,
    calcMode,
    manualLotSize,
    leverage,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155] bg-[#0B0F19]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#38BDF8] to-[#10B981] flex items-center justify-center">
              <Calculator className="w-5 h-5 text-[#0F172A] font-black" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Forex, Metals & Pip Risk Calculator</h2>
              <p className="text-xs text-[#94A3B8]">
                Calculate precise lot sizes, pip values, stop-loss exposure & required margin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#334155] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto font-sans text-xs">
          {/* Instrument Selector & Trade Direction */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Symbol Dropdown */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-semibold text-[#94A3B8]">Select Financial Instrument</label>
              <select
                value={selectedSymbol}
                onChange={(e) => handleSymbolChange(e.target.value as AssetPair)}
                className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-xs font-bold text-[#F8FAFC] focus:outline-none focus:border-[#38BDF8]"
              >
                <optgroup label="Precious Metals & Commodities">
                  <option value="XAU/USDT">Gold Spot / Futures (XAU/USD) - 100 oz/lot</option>
                  <option value="XAG/USDT">Silver Spot (XAG/USD) - 5000 oz/lot</option>
                  <option value="WTI/USDT">Crude Oil WTI - 1000 bbl/lot</option>
                  <option value="BRENT/USDT">Brent Crude Oil</option>
                  <option value="COPPER/USDT">High Grade Copper</option>
                </optgroup>
                <optgroup label="Major Forex Currency Pairs">
                  <option value="EUR/USD">EUR/USD (Euro / US Dollar)</option>
                  <option value="GBP/USD">GBP/USD (British Pound / US Dollar)</option>
                  <option value="USD/JPY">USD/JPY (US Dollar / Japanese Yen)</option>
                  <option value="USD/INR">USD/INR (US Dollar / Indian Rupee)</option>
                  <option value="AUD/USD">AUD/USD (Australian Dollar / US Dollar)</option>
                  <option value="USD/CAD">USD/CAD (US Dollar / Canadian Dollar)</option>
                  <option value="USD/CHF">USD/CHF (US Dollar / Swiss Franc)</option>
                </optgroup>
                <optgroup label="Global Stocks & Indices">
                  <option value="NVDA/USD">NVIDIA Corporation (NVDA)</option>
                  <option value="AAPL/USD">Apple Inc. (AAPL)</option>
                  <option value="TSLA/USD">Tesla, Inc. (TSLA)</option>
                  <option value="SPX500">S&P 500 US Index</option>
                </optgroup>
                <optgroup label="Crypto Assets">
                  <option value="BTC/USDT">Bitcoin Perpetual (BTC/USDT)</option>
                  <option value="ETH/USDT">Ethereum Perpetual (ETH/USDT)</option>
                  <option value="SOL/USDT">Solana Perpetual (SOL/USDT)</option>
                </optgroup>
              </select>
            </div>

            {/* Buy / Sell Direction */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#94A3B8]">Trade Direction</label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#1E293B] p-1 rounded-xl border border-[#334155]">
                <button
                  type="button"
                  onClick={() => setTradeSide('buy')}
                  className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    tradeSide === 'buy'
                      ? 'bg-[#10B981] text-[#0F172A] shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Buy (Long)
                </button>
                <button
                  type="button"
                  onClick={() => setTradeSide('sell')}
                  className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    tradeSide === 'sell'
                      ? 'bg-[#F43F5E] text-[#F8FAFC] shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  Sell (Short)
                </button>
              </div>
            </div>
          </div>

          {/* Account Balance & Risk % */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#1E293B]/50 p-4 rounded-xl border border-[#334155]">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#94A3B8]">Account Balance ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] font-bold">$</span>
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(Math.max(10, Number(e.target.value)))}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-xl pl-7 pr-3 py-1.5 text-xs font-mono font-bold text-[#F8FAFC]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-[#94A3B8]">
                <span>Risk Exposure</span>
                <span className="text-[#10B981]">{riskPercent}% of Portfolio</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 5].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setRiskPercent(pct)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      riskPercent === pct
                        ? 'bg-[#10B981] text-[#0F172A]'
                        : 'bg-[#0F172A] text-[#94A3B8] border border-[#334155]'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#94A3B8]">Leverage Multiplier</label>
              <select
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-3 py-1.5 text-xs font-bold text-[#F8FAFC]"
              >
                <option value={1}>1x (No Leverage / Spot)</option>
                <option value={5}>5x Leverage</option>
                <option value={10}>10x Leverage</option>
                <option value={20}>20x Leverage</option>
                <option value={50}>50x Leverage</option>
                <option value={100}>100x Institutional</option>
              </select>
            </div>
          </div>

          {/* Entry, Stop Loss & Take Profit Price Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-[#94A3B8]">
                <span>Entry Price</span>
                <button
                  type="button"
                  onClick={() => setEntryPrice(currentPrice)}
                  className="text-[#38BDF8] hover:underline"
                >
                  Current (${currentPrice.toFixed(ticker.precision)})
                </button>
              </div>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#F8FAFC]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-[#F43F5E]">
                <span>Stop Loss Price</span>
                <span>{calculations.slPips} Pips</span>
              </div>
              <input
                type="number"
                step="any"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(Number(e.target.value))}
                className="w-full bg-[#1E293B] border border-[#F43F5E]/40 focus:border-[#F43F5E] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#F43F5E]"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-[#10B981]">
                <span>Take Profit Price</span>
                <span>{calculations.tpPips} Pips</span>
              </div>
              <input
                type="number"
                step="any"
                value={takeProfitPrice}
                onChange={(e) => setTakeProfitPrice(Number(e.target.value))}
                className="w-full bg-[#1E293B] border border-[#10B981]/40 focus:border-[#10B981] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#10B981]"
              />
            </div>
          </div>

          {/* Results Summary Bento Grid */}
          <div className="bg-[#0B0F19] border border-[#334155] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-[#F8FAFC] pb-2 border-b border-[#334155]/60">
              <span className="flex items-center gap-1.5 text-[#38BDF8]">
                <Zap className="w-4 h-4 text-[#38BDF8]" /> Risk & Position Sizing Output
              </span>
              <span className="text-[11px] text-[#94A3B8] font-mono">
                Pip Value: ${calculations.pipValueStandardLot}/std lot
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              {/* Recommended Lot Size */}
              <div className="p-3 rounded-xl bg-[#1E293B]/70 border border-[#334155]">
                <span className="block text-[10px] text-[#94A3B8] uppercase">Recommended Lot Size</span>
                <span className="text-lg font-black text-[#10B981]">
                  {calculations.activeLotSize} Lots
                </span>
                <span className="block text-[9px] text-[#64748B]">
                  {(calculations.activeLotSize * instrument.contractSize).toLocaleString()} Units
                </span>
              </div>

              {/* Total Risk at SL */}
              <div className="p-3 rounded-xl bg-[#1E293B]/70 border border-[#334155]">
                <span className="block text-[10px] text-[#F43F5E] uppercase">Risk at Stop Loss</span>
                <span className="text-lg font-black text-[#F43F5E]">
                  -${calculations.totalDollarRisk}
                </span>
                <span className="block text-[9px] text-[#64748B]">
                  ₹{calculations.totalDollarRiskINR} ({riskPercent}%)
                </span>
              </div>

              {/* Potential Reward at TP */}
              <div className="p-3 rounded-xl bg-[#1E293B]/70 border border-[#334155]">
                <span className="block text-[10px] text-[#10B981] uppercase">Potential Profit</span>
                <span className="text-lg font-black text-[#10B981]">
                  +${calculations.totalPotentialReward}
                </span>
                <span className="block text-[9px] text-[#64748B]">
                  ₹{calculations.totalPotentialRewardINR}
                </span>
              </div>

              {/* Risk/Reward & Margin */}
              <div className="p-3 rounded-xl bg-[#1E293B]/70 border border-[#334155]">
                <span className="block text-[10px] text-[#38BDF8] uppercase">Risk / Reward (R:R)</span>
                <span className="text-lg font-black text-[#F8FAFC]">
                  1 : {calculations.rrRatio}
                </span>
                <span className="block text-[9px] text-[#94A3B8]">
                  Margin: ${calculations.marginRequired}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#334155] bg-[#0B0F19]">
          <div className="text-[11px] text-[#94A3B8]">
            <span className="text-[#F8FAFC] font-semibold">{instrument.displayName}</span> • 1 Standard Lot ={' '}
            {instrument.contractSize.toLocaleString()} base units
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-xs font-semibold text-[#CBD5E1] transition-colors cursor-pointer"
            >
              Close
            </button>
            {onApplyToOrderPanel && (
              <button
                onClick={() => {
                  onApplyToOrderPanel({
                    symbol: selectedSymbol,
                    price: entryPrice,
                    amount: calculations.activeLotSize,
                    leverage,
                    stopLoss: stopLossPrice,
                    takeProfit: takeProfitPrice,
                    side: tradeSide,
                  });
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#0F172A] text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                <span>Apply to Order Panel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
