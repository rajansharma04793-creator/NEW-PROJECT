import React, { useState, useMemo } from 'react';
import { AssetPair, TickerInfo } from '../types';
import {
  Calculator,
  ShieldAlert,
  DollarSign,
  TrendingUp,
  Percent,
  X,
  Zap,
  Target,
  ArrowDownRight,
  ArrowUpRight,
  Layers,
  CheckCircle,
} from 'lucide-react';

interface RiskCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: AssetPair;
  currentPrice: number;
  balance: number;
  precision: number;
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

export const RiskCalculatorModal: React.FC<RiskCalculatorModalProps> = ({
  isOpen,
  onClose,
  currentPair,
  currentPrice,
  balance,
  precision,
  onApplyToOrderPanel,
}) => {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [accountBalance, setAccountBalance] = useState<string>(balance > 0 ? balance.toString() : '10000');
  const [riskPercent, setRiskPercent] = useState<number>(2); // 2% risk
  const [entryPrice, setEntryPrice] = useState<string>(currentPrice.toString());
  const [stopLossPrice, setStopLossPrice] = useState<string>(
    (side === 'buy' ? currentPrice * 0.98 : currentPrice * 1.02).toFixed(precision)
  );
  const [targetPrice, setTargetPrice] = useState<string>(
    (side === 'buy' ? currentPrice * 1.05 : currentPrice * 0.95).toFixed(precision)
  );
  const [leverage, setLeverage] = useState<number>(10);

  // Sync entry price when switching side
  const handleSideChange = (newSide: 'buy' | 'sell') => {
    setSide(newSide);
    const p = Number(entryPrice) || currentPrice;
    if (newSide === 'buy') {
      setStopLossPrice((p * 0.98).toFixed(precision));
      setTargetPrice((p * 1.05).toFixed(precision));
    } else {
      setStopLossPrice((p * 1.02).toFixed(precision));
      setTargetPrice((p * 0.95).toFixed(precision));
    }
  };

  const parsedBalance = Math.max(1, Number(accountBalance) || 10000);
  const parsedEntry = Math.max(0.000001, Number(entryPrice) || currentPrice);
  const parsedSL = Number(stopLossPrice) || (side === 'buy' ? parsedEntry * 0.98 : parsedEntry * 1.02);
  const parsedTP = Number(targetPrice) || (side === 'buy' ? parsedEntry * 1.05 : parsedEntry * 0.95);

  // Risk Math Calculations
  const calculatedRisk = useMemo(() => {
    const dollarRisk = parsedBalance * (riskPercent / 100);
    const priceDiffPerUnit = Math.abs(parsedEntry - parsedSL);
    const priceDiffPercent = (priceDiffPerUnit / parsedEntry) * 100;

    // Units to buy/sell so that loss at SL == dollarRisk
    const recommendedUnits = priceDiffPerUnit > 0 ? dollarRisk / priceDiffPerUnit : 0;
    const notionalPositionValue = recommendedUnits * parsedEntry;
    const marginRequired = leverage > 0 ? notionalPositionValue / leverage : notionalPositionValue;

    // Target Reward
    const rewardPerUnit = Math.abs(parsedTP - parsedEntry);
    const dollarReward = recommendedUnits * rewardPerUnit;
    const riskRewardRatio = dollarRisk > 0 ? dollarReward / dollarRisk : 0;

    // Liquidation estimation
    const isLong = side === 'buy';
    const liqPrice = isLong
      ? parsedEntry * (1 - 0.9 / leverage)
      : parsedEntry * (1 + 0.9 / leverage);

    // Is SL beyond liquidation price? (Dangerous)
    const isSLBeyondLiquidation = isLong ? parsedSL <= liqPrice : parsedSL >= liqPrice;

    // Max safe leverage
    const maxSafeLeverage = Math.max(1, Math.floor(85 / Math.max(0.5, priceDiffPercent)));

    return {
      dollarRisk,
      priceDiffPercent,
      recommendedUnits,
      notionalPositionValue,
      marginRequired,
      dollarReward,
      riskRewardRatio,
      liqPrice,
      isSLBeyondLiquidation,
      maxSafeLeverage,
    };
  }, [parsedBalance, riskPercent, parsedEntry, parsedSL, parsedTP, leverage, side]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (onApplyToOrderPanel) {
      onApplyToOrderPanel({
        symbol: currentPair,
        side,
        price: parsedEntry,
        amount: Number(calculatedRisk.recommendedUnits.toFixed(4)),
        leverage,
        takeProfit: parsedTP,
        stopLoss: parsedSL,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono select-none">
      <div className="bg-[#14171a] border border-[#272a2d] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#272a2d] bg-[#191c1f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#f6be16]/15 border border-[#f6be16]/30 flex items-center justify-center text-[#ffd87f]">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#fff8f1]">
                Position Sizing & Risk Management Calculator
              </h2>
              <p className="text-[11px] text-[#99907f]">
                Institutional 1%–2% equity capital preservation model for {currentPair}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {/* Side Selector */}
          <div className="grid grid-cols-2 gap-3 bg-[#111417] p-1 rounded-xl border border-[#272a2d]">
            <button
              onClick={() => handleSideChange('buy')}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                side === 'buy'
                  ? 'bg-[#00ff94] text-[#002111] shadow-lg shadow-[#00ff94]/20'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              LONG / BUY
            </button>
            <button
              onClick={() => handleSideChange('sell')}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                side === 'sell'
                  ? 'bg-[#ff3b4a] text-white shadow-lg shadow-[#ff3b4a]/20'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              SHORT / SELL
            </button>
          </div>

          {/* Grid of Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account Balance */}
            <div>
              <label className="text-[11px] text-[#99907f] font-bold block mb-1.5">
                Account Balance ($ USD)
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#99907f]" />
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(e.target.value)}
                  className="w-full bg-[#111417] text-xs pl-8 pr-3 py-2 rounded-lg text-[#fff8f1] border border-[#272a2d] focus:border-[#f6be16] focus:outline-none"
                />
              </div>
            </div>

            {/* Risk % */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] text-[#99907f] font-bold">
                  Risk Per Trade (% Equity)
                </label>
                <span className="text-xs font-bold text-[#f6be16]">{riskPercent}% (${calculatedRisk.dollarRisk.toFixed(2)})</span>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 5].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setRiskPercent(pct)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      riskPercent === pct
                        ? 'bg-[#f6be16]/20 border-[#f6be16] text-[#ffd87f]'
                        : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Entry Price */}
            <div>
              <label className="text-[11px] text-[#99907f] font-bold block mb-1.5">
                Entry Price ($)
              </label>
              <input
                type="number"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="w-full bg-[#111417] text-xs px-3 py-2 rounded-lg text-[#fff8f1] border border-[#272a2d] focus:border-[#f6be16] focus:outline-none"
              />
            </div>

            {/* Leverage */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] text-[#99907f] font-bold">Leverage</label>
                <span className="text-xs font-bold text-[#ffd87f]">{leverage}x (Max safe: {calculatedRisk.maxSafeLeverage}x)</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
                className="w-full accent-[#f6be16] cursor-pointer"
              />
            </div>

            {/* Stop Loss */}
            <div>
              <label className="text-[11px] text-[#ff3b4a] font-bold block mb-1.5">
                Stop Loss Price ($)
              </label>
              <input
                type="number"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                className="w-full bg-[#111417] text-xs px-3 py-2 rounded-lg text-[#ff3b4a] border border-[#ff3b4a]/40 focus:border-[#ff3b4a] focus:outline-none font-bold"
              />
            </div>

            {/* Take Profit */}
            <div>
              <label className="text-[11px] text-[#00ff94] font-bold block mb-1.5">
                Take Profit Target ($)
              </label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="w-full bg-[#111417] text-xs px-3 py-2 rounded-lg text-[#00ff94] border border-[#00ff94]/40 focus:border-[#00ff94] focus:outline-none font-bold"
              />
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="p-4 rounded-xl bg-[#191c1f] border border-[#272a2d] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#272a2d] pb-2">
              <span className="text-xs font-bold text-[#fff8f1] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#f6be16]" /> Recommended Position Sizing
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  calculatedRisk.riskRewardRatio >= 2
                    ? 'bg-[#00ff94]/20 text-[#00ff94]'
                    : 'bg-[#ffd87f]/20 text-[#ffd87f]'
                }`}
              >
                R:R 1:{calculatedRisk.riskRewardRatio.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-[#99907f] block">Position Size</span>
                <span className="text-sm font-bold text-[#fff8f1]">
                  {calculatedRisk.recommendedUnits.toFixed(4)} {currentPair.split('/')[0]}
                </span>
                <span className="text-[9px] text-[#99907f] block">
                  (${calculatedRisk.notionalPositionValue.toFixed(2)})
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#99907f] block">Margin Required</span>
                <span className="text-sm font-bold text-[#ffd87f]">
                  ${calculatedRisk.marginRequired.toFixed(2)}
                </span>
                <span className="text-[9px] text-[#99907f] block">
                  ({((calculatedRisk.marginRequired / parsedBalance) * 100).toFixed(1)}% of balance)
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#99907f] block">Est. Dollar Loss (SL)</span>
                <span className="text-sm font-bold text-[#ff3b4a]">
                  -${calculatedRisk.dollarRisk.toFixed(2)}
                </span>
                <span className="text-[9px] text-[#99907f] block">
                  (-{calculatedRisk.priceDiffPercent.toFixed(2)}% move)
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[#99907f] block">Est. Profit (TP)</span>
                <span className="text-sm font-bold text-[#00ff94]">
                  +${calculatedRisk.dollarReward.toFixed(2)}
                </span>
                <span className="text-[9px] text-[#99907f] block">
                  (+{((calculatedRisk.dollarReward / parsedBalance) * 100).toFixed(1)}% gain)
                </span>
              </div>
            </div>

            {/* Liquidation Warning */}
            {calculatedRisk.isSLBeyondLiquidation && (
              <div className="p-2.5 rounded-lg bg-[#ff3b4a]/10 border border-[#ff3b4a]/30 flex items-center gap-2 text-[11px] text-[#ff3b4a]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Warning:</strong> Estimated Liquidation (${calculatedRisk.liqPrice.toFixed(precision)}) will trigger BEFORE your Stop Loss! Lower leverage to {calculatedRisk.maxSafeLeverage}x.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#272a2d] bg-[#191c1f] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 rounded-lg text-xs font-bold bg-[#f6be16] hover:bg-[#ffd87f] text-[#191c1f] shadow-lg shadow-[#f6be16]/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            Apply Calculated Size to Order Panel
          </button>
        </div>
      </div>
    </div>
  );
};
