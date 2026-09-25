import React, { useState, useEffect } from 'react';
import { AssetPair, TickerInfo, AISignal } from '../types';
import { calculateSmartPositionSize } from '../utils/positionSizingUtils';
import {
  Calculator,
  X,
  Shield,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Check,
  Copy,
  Sliders,
  DollarSign,
  Percent,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SmartPositionCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountBalance: number;
  currentPair: AssetPair;
  tickers: Record<AssetPair, TickerInfo>;
  initialSignal?: AISignal | null;
  onExecuteTrade?: (params: {
    symbol: AssetPair;
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    leverage: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => void;
}

export const SmartPositionCalculatorModal: React.FC<SmartPositionCalculatorModalProps> = ({
  isOpen,
  onClose,
  accountBalance,
  currentPair,
  tickers,
  initialSignal,
  onExecuteTrade,
}) => {
  const [balance, setBalance] = useState<number>(accountBalance || 100000);
  const [selectedPair, setSelectedPair] = useState<AssetPair>(initialSignal?.symbol || currentPair);
  const [side, setSide] = useState<'LONG' | 'SHORT'>(initialSignal?.side || 'LONG');
  const [riskPercent, setRiskPercent] = useState<number>(1.0);
  const [leverage, setLeverage] = useState<number>(initialSignal?.recommendedLeverage || 10);
  
  const ticker = tickers[selectedPair] || { price: 2427.52, precision: 2 };
  const currentPrice = ticker.price;
  const prec = ticker.precision ?? 2;

  const [entryPrice, setEntryPrice] = useState<number>(initialSignal?.entryPrice || currentPrice);
  const [stopLossPrice, setStopLossPrice] = useState<number>(
    initialSignal?.stopLoss || (side === 'LONG' ? +(currentPrice * 0.985).toFixed(prec) : +(currentPrice * 1.015).toFixed(prec))
  );
  const [target1Price, setTarget1Price] = useState<number>(
    initialSignal?.target1 || (side === 'LONG' ? +(currentPrice * 1.03).toFixed(prec) : +(currentPrice * 0.97).toFixed(prec))
  );
  const [target2Price, setTarget2Price] = useState<number>(
    initialSignal?.target2 || (side === 'LONG' ? +(currentPrice * 1.06).toFixed(prec) : +(currentPrice * 0.94).toFixed(prec))
  );

  const [copied, setCopied] = useState(false);
  const [executed, setExecuted] = useState(false);

  // Sync with initial signal if changed
  useEffect(() => {
    if (initialSignal) {
      setSelectedPair(initialSignal.symbol);
      setSide(initialSignal.side);
      setEntryPrice(initialSignal.entryPrice);
      setStopLossPrice(initialSignal.stopLoss);
      setTarget1Price(initialSignal.target1);
      setTarget2Price(initialSignal.target2);
      if (initialSignal.recommendedLeverage) {
        setLeverage(initialSignal.recommendedLeverage);
      }
    }
  }, [initialSignal]);

  // Sync balance
  useEffect(() => {
    if (accountBalance > 0) setBalance(accountBalance);
  }, [accountBalance]);

  if (!isOpen) return null;

  const calculation = calculateSmartPositionSize({
    accountBalance: balance,
    riskPercent,
    leverage,
    entryPrice: entryPrice || currentPrice,
    stopLossPrice: stopLossPrice || (side === 'LONG' ? currentPrice * 0.985 : currentPrice * 1.015),
    target1Price,
    target2Price,
    side,
    symbol: selectedPair,
  });

  const handleExecute = () => {
    if (onExecuteTrade) {
      onExecuteTrade({
        symbol: selectedPair,
        side: side === 'LONG' ? 'buy' : 'sell',
        price: entryPrice,
        amount: calculation.recommendedCoins,
        leverage,
        takeProfit: target1Price,
        stopLoss: stopLossPrice,
      });

      setExecuted(true);
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: side === 'LONG' ? ['#00ff94', '#61feaf', '#ffffff'] : ['#ff3b4a', '#ffd2d1', '#ffffff'],
        });
      } catch {}

      setTimeout(() => {
        setExecuted(false);
        onClose();
      }, 1200);
    }
  };

  const handleCopySummary = () => {
    const text = `🧮 LUMINA SMART POSITION SIZING REPORT
Pair: ${selectedPair} (${side}) | Leverage: ${leverage}x
----------------------------------------
Account Balance: $${balance.toLocaleString()}
Risk Budget: ${riskPercent}% ($${calculation.dollarRisk})
Entry Price: $${entryPrice} | Stop Loss: $${stopLossPrice} (-${calculation.priceRiskPercent}%)
Recommended Size: $${calculation.recommendedPositionSizeUsd.toLocaleString()} (${calculation.recommendedCoins} coins)
Required Margin: $${calculation.requiredMargin.toLocaleString()} (${calculation.marginPercentOfBalance}% of wallet)
Estimated Liquidation: $${calculation.liquidationPrice} (Buffer: ${calculation.liquidationBufferPercent}%)
Target 1 Profit: +$${calculation.potentialProfitTP1} (R:R ${calculation.riskRewardRatio})
Target 2 Profit: +$${calculation.potentialProfitTP2}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-hanken">
      <div className="bg-[#191c1f] border border-[#272a2d] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#111417] border-b border-[#272a2d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#00ff94]/10 border border-[#00ff94]/30 text-[#00ff94]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#fff8f1] flex items-center gap-2">
                <span>Smart Position Sizing & Risk Calculator</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00ff94]/10 text-[#00ff94] border border-[#00ff94]/30">
                  Institutional Formula
                </span>
              </h2>
              <p className="text-[11px] text-[#99907f]">
                Calculate exact position size & margin to risk strictly X% of your wallet.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 font-mono text-xs text-[#d0c5b3]">
          {/* Top Row: Pair & Side & Balance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-[#99907f] uppercase font-bold mb-1">Asset Pair</label>
              <select
                value={selectedPair}
                onChange={(e) => {
                  const p = e.target.value as AssetPair;
                  setSelectedPair(p);
                  const newPrice = tickers[p]?.price || 100;
                  setEntryPrice(newPrice);
                  setStopLossPrice(side === 'LONG' ? +(newPrice * 0.985).toFixed(2) : +(newPrice * 1.015).toFixed(2));
                  setTarget1Price(side === 'LONG' ? +(newPrice * 1.03).toFixed(2) : +(newPrice * 0.97).toFixed(2));
                }}
                className="w-full bg-[#111417] text-[#00ff94] border border-[#272a2d] rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
              >
                {Object.keys(tickers).map((p) => (
                  <option key={p} value={p}>
                    {p} (${tickers[p as AssetPair]?.price?.toFixed(tickers[p as AssetPair]?.precision || 2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-[#99907f] uppercase font-bold mb-1">Trade Direction</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSide('LONG');
                    setStopLossPrice(+(entryPrice * 0.985).toFixed(prec));
                    setTarget1Price(+(entryPrice * 1.03).toFixed(prec));
                  }}
                  className={`py-1.5 rounded text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    side === 'LONG'
                      ? 'bg-[#00ff94] text-[#002111] shadow-[0_0_10px_rgba(0,255,148,0.3)]'
                      : 'bg-[#111417] text-[#99907f] border border-[#272a2d]'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>LONG</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSide('SHORT');
                    setStopLossPrice(+(entryPrice * 1.015).toFixed(prec));
                    setTarget1Price(+(entryPrice * 0.97).toFixed(prec));
                  }}
                  className={`py-1.5 rounded text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    side === 'SHORT'
                      ? 'bg-[#ff3b4a] text-[#ffffff] shadow-[0_0_10px_rgba(255,59,74,0.3)]'
                      : 'bg-[#111417] text-[#99907f] border border-[#272a2d]'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>SHORT</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#99907f] uppercase font-bold mb-1">Account Balance ($)</label>
              <div className="relative">
                <input
                  type="number"
                  value={balance}
                  onChange={(e) => setBalance(Math.max(10, parseFloat(e.target.value) || 0))}
                  className="w-full bg-[#111417] text-[#fff8f1] border border-[#272a2d] rounded-lg px-2.5 py-1.5 text-xs font-bold pl-6 focus:outline-none focus:border-[#00ff94]"
                />
                <DollarSign className="w-3.5 h-3.5 text-[#99907f] absolute left-2 top-2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Risk % & Leverage Controls */}
          <div className="p-3.5 bg-[#111417] rounded-lg border border-[#272a2d] space-y-3">
            {/* Risk % Selector */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-[#99907f] font-bold uppercase">Risk Per Trade:</span>
                <span className="font-bold text-[#f6be16]">
                  {riskPercent}% = ${calculation.dollarRisk} Max Loss
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[0.5, 1.0, 1.5, 2.0, 3.0, 5.0].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRiskPercent(r)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      riskPercent === r
                        ? 'bg-[#f6be16] text-[#0b0e11] shadow-[0_0_8px_rgba(246,190,22,0.4)]'
                        : 'bg-[#191c1f] text-[#d0c5b3] border border-[#272a2d] hover:border-[#f6be16]/50'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>

            {/* Leverage Selector */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-[#99907f] font-bold uppercase">Leverage Multiplier:</span>
                <span className="font-bold text-[#00ff94]">{leverage}x Isolated</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[2, 5, 10, 15, 20, 25, 50].map((lev) => (
                  <button
                    key={lev}
                    type="button"
                    onClick={() => setLeverage(lev)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      leverage === lev
                        ? 'bg-[#00ff94] text-[#002111] shadow-[0_0_8px_rgba(0,255,148,0.4)]'
                        : 'bg-[#191c1f] text-[#d0c5b3] border border-[#272a2d] hover:border-[#00ff94]/50'
                    }`}
                  >
                    {lev}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Price Levels (Entry, SL, TP1, TP2) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[10px] text-[#99907f] uppercase font-bold mb-1">Entry Price ($)</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#111417] text-[#fff8f1] border border-[#272a2d] rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#00ff94]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#ff3b4a] uppercase font-bold mb-1">Stop Loss ($)</label>
              <input
                type="number"
                step="any"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#111417] text-[#ff3b4a] border border-[#ff3b4a]/40 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#ff3b4a]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#00ff94] uppercase font-bold mb-1">Target 1 ($)</label>
              <input
                type="number"
                step="any"
                value={target1Price}
                onChange={(e) => setTarget1Price(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#111417] text-[#00ff94] border border-[#00ff94]/40 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#00ff94]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#00ff94] uppercase font-bold mb-1">Target 2 ($)</label>
              <input
                type="number"
                step="any"
                value={target2Price}
                onChange={(e) => setTarget2Price(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#111417] text-[#00ff94] border border-[#00ff94]/40 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:border-[#00ff94]"
              />
            </div>
          </div>

          {/* Warning Banner if any */}
          {calculation.maxRiskWarning && (
            <div className="p-2.5 bg-[#f6be16]/10 border border-[#f6be16]/30 rounded-lg text-[#f6be16] flex items-center gap-2 text-[11px]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{calculation.maxRiskWarning}</span>
            </div>
          )}

          {/* Calculated Output Matrix */}
          <div className="p-4 bg-[#111417] rounded-xl border border-[#00ff94]/30 space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-[#272a2d] pb-2">
              <span className="font-bold text-[#00ff94] flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Calculated Mathematical Execution Order</span>
              </span>
              <span className="text-[11px] text-[#99907f]">
                R:R Ratio: <strong className="text-[#f6be16]">{calculation.riskRewardRatio}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-2.5 bg-[#191c1f] rounded-lg border border-[#272a2d]">
                <span className="block text-[9px] text-[#99907f] uppercase font-bold">Recommended Size</span>
                <span className="text-sm font-extrabold text-[#fff8f1]">
                  ${calculation.recommendedPositionSizeUsd.toLocaleString()}
                </span>
                <span className="block text-[10px] text-[#00ff94]">
                  {calculation.recommendedCoins} {selectedPair.split('/')[0]}
                </span>
              </div>

              <div className="p-2.5 bg-[#191c1f] rounded-lg border border-[#272a2d]">
                <span className="block text-[9px] text-[#99907f] uppercase font-bold">Required Margin</span>
                <span className="text-sm font-extrabold text-[#fff8f1]">
                  ${calculation.requiredMargin.toLocaleString()}
                </span>
                <span className="block text-[10px] text-[#99907f]">
                  {calculation.marginPercentOfBalance}% of wallet
                </span>
              </div>

              <div className="p-2.5 bg-[#191c1f] rounded-lg border border-[#272a2d]">
                <span className="block text-[9px] text-[#ff3b4a] uppercase font-bold">Max Dollar Risk</span>
                <span className="text-sm font-extrabold text-[#ff3b4a]">
                  -${calculation.dollarRisk}
                </span>
                <span className="block text-[10px] text-[#99907f]">
                  -{calculation.priceRiskPercent}% to SL
                </span>
              </div>

              <div className="p-2.5 bg-[#191c1f] rounded-lg border border-[#272a2d]">
                <span className="block text-[9px] text-[#00ff94] uppercase font-bold">Estimated Profit TP1</span>
                <span className="text-sm font-extrabold text-[#00ff94]">
                  +${calculation.potentialProfitTP1}
                </span>
              </div>

              <div className="p-2.5 bg-[#191c1f] rounded-lg border border-[#272a2d]">
                <span className="block text-[9px] text-[#00ff94] uppercase font-bold">Estimated Profit TP2</span>
                <span className="text-sm font-extrabold text-[#00ff94]">
                  +${calculation.potentialProfitTP2}
                </span>
              </div>

              <div className="p-2.5 bg-[#191c1f] rounded-lg border border-[#272a2d]">
                <span className="block text-[9px] text-[#99907f] uppercase font-bold">Liquidation Price</span>
                <span className="text-sm font-extrabold text-[#fff8f1]">
                  ${calculation.liquidationPrice}
                </span>
                <span className="block text-[10px] text-[#00ff94]">
                  {calculation.liquidationBufferPercent}% safety buffer
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#111417] border-t border-[#272a2d] flex items-center justify-between gap-3">
          <button
            onClick={handleCopySummary}
            className="py-2 px-3 bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] rounded-lg text-xs font-bold text-[#d0c5b3] hover:text-[#fff8f1] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00ff94]" />
                <span>Copied Report</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#99907f]" />
                <span>Copy Calculation</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2 px-3 rounded-lg text-xs font-bold text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              className={`py-2 px-5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                side === 'LONG'
                  ? 'bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#002111] shadow-[0_0_15px_rgba(0,255,148,0.3)]'
                  : 'bg-[#ff3b4a] hover:bg-[#ff3b4a]/90 text-[#ffffff] shadow-[0_0_15px_rgba(255,59,74,0.3)]'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {executed
                  ? 'Order Executed!'
                  : `Execute Sized ${side} ($${calculation.recommendedPositionSizeUsd.toLocaleString()})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
