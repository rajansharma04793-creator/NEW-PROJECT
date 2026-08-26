import React, { useState, useEffect } from 'react';
import { AssetPair } from '../types';
import { Sliders, Sparkles, ShieldAlert, ArrowUpRight, ArrowDownRight, Calculator, Target, ShieldCheck } from 'lucide-react';

interface OrderPanelProps {
  symbol: AssetPair;
  currentPrice: number;
  selectedPrice: number | null;
  balance: number;
  precision: number;
  onOpenRiskCalculator?: () => void;
  currencyMode?: 'USDT' | 'INR';
  inrPrice?: number;
  onPlaceOrder: (order: {
    symbol: AssetPair;
    type: 'limit' | 'market' | 'stop-limit' | 'ai-smart';
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    leverage: number;
    takeProfit?: number;
    stopLoss?: number;
    trailingStopPercent?: number;
  }) => void;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({
  symbol,
  currentPrice,
  selectedPrice,
  balance,
  precision,
  onOpenRiskCalculator,
  currencyMode = 'USDT',
  inrPrice,
  onPlaceOrder,
}) => {
  const [orderType, setOrderType] = useState<'limit' | 'market' | 'stop-limit' | 'ai-smart'>('limit');
  const [marginType, setMarginType] = useState<'cross' | 'isolated'>('cross');
  const [leverage, setLeverage] = useState<number>(20);

  const isINR = currencyMode === 'INR' && inrPrice && inrPrice > 0;
  const inrRateMultiplier = isINR && currentPrice > 0 ? inrPrice / currentPrice : 1;
  const activeEffectivePrice = isINR ? inrPrice : currentPrice;
  const currencySymbol = isINR ? '₹' : '$';
  const currencyLabel = isINR ? 'INR' : 'USDT';

  const [priceInput, setPriceInput] = useState<string>(activeEffectivePrice.toString());
  const [amountInput, setAmountInput] = useState<string>('');
  const [percentSlider, setPercentSlider] = useState<number>(0);
  const [enableTPSL, setEnableTPSL] = useState<boolean>(false);
  const [tpInput, setTpInput] = useState<string>('');
  const [slInput, setSlInput] = useState<string>('');
  const [enableTrailingSL, setEnableTrailingSL] = useState<boolean>(false);
  const [trailingStopPercent, setTrailingStopPercent] = useState<number>(1.5);

  // Update price when selected from orderbook or market mode
  useEffect(() => {
    if (orderType === 'market') {
      setPriceInput(isINR ? inrPrice.toLocaleString('en-IN', { useGrouping: false }) : currentPrice.toFixed(precision));
    } else if (selectedPrice !== null) {
      const p = isINR ? selectedPrice * inrRateMultiplier : selectedPrice;
      setPriceInput(isINR ? p.toFixed(2) : p.toFixed(precision));
    } else if (!priceInput) {
      setPriceInput(isINR ? inrPrice.toFixed(2) : currentPrice.toFixed(precision));
    }
  }, [selectedPrice, currentPrice, inrPrice, isINR, inrRateMultiplier, orderType, precision]);

  const priceNum = orderType === 'market' ? activeEffectivePrice : Number(priceInput) || activeEffectivePrice;
  const rawUsdPrice = isINR && inrRateMultiplier > 0 ? priceNum / inrRateMultiplier : priceNum;
  const amountNum = Number(amountInput) || 0;
  const totalValue = priceNum * amountNum;
  const marginRequired = leverage > 0 ? totalValue / leverage : totalValue;

  // Percentage preset click
  const handlePercentClick = (pct: number) => {
    setPercentSlider(pct);
    const maxMargin = (isINR ? balance * 98.3 : balance) * (pct / 100);
    const calculatedAmount = (maxMargin * leverage) / (priceNum || 1);
    setAmountInput(calculatedAmount.toFixed(3));
  };

  const handleAmountChange = (val: string) => {
    setAmountInput(val);
    const valNum = Number(val) || 0;
    const required = (valNum * priceNum) / leverage;
    const effectiveBalance = isINR ? balance * 98.3 : balance;
    const pct = effectiveBalance > 0 ? Math.min(100, (required / effectiveBalance) * 100) : 0;
    setPercentSlider(Math.round(pct));
  };

  // Liquidation Price calculation preview
  const estBuyLiqPrice = priceNum > 0 && leverage > 1 ? priceNum * (1 - 0.9 / leverage) : 0;
  const estSellLiqPrice = priceNum > 0 && leverage > 1 ? priceNum * (1 + 0.9 / leverage) : 0;

  const handleExecute = (side: 'buy' | 'sell') => {
    if (amountNum <= 0) return;
    onPlaceOrder({
      symbol,
      type: orderType,
      side,
      price: rawUsdPrice,
      amount: amountNum,
      leverage,
      takeProfit: enableTPSL && Number(tpInput) ? (isINR ? Number(tpInput) / inrRateMultiplier : Number(tpInput)) : undefined,
      stopLoss: enableTPSL && Number(slInput) ? (isINR ? Number(slInput) / inrRateMultiplier : Number(slInput)) : undefined,
      trailingStopPercent: enableTrailingSL ? trailingStopPercent : undefined,
    });
    setAmountInput('');
    setPercentSlider(0);
  };

  return (
    <div
      id="order-panel"
      className="flex flex-col h-full bg-[#111417] border-l border-[#272a2d] font-mono text-[11px] select-none overflow-y-auto"
    >
      {/* Panel Header & Margin Type */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#191c1f] border-b border-[#272a2d]">
        <div className="flex items-center gap-1 bg-[#272a2d] p-0.5 rounded">
          <button
            onClick={() => setMarginType('cross')}
            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${
              marginType === 'cross'
                ? 'bg-[#37393d] text-[#fff8f1]'
                : 'text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            Cross
          </button>
          <button
            onClick={() => setMarginType('isolated')}
            className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition-colors ${
              marginType === 'isolated'
                ? 'bg-[#37393d] text-[#fff8f1]'
                : 'text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            Isolated
          </button>
        </div>

        {/* Risk Calculator launcher */}
        {onOpenRiskCalculator && (
          <button
            onClick={onOpenRiskCalculator}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#f6be16]/15 hover:bg-[#f6be16]/25 text-[#ffd87f] border border-[#f6be16]/30 font-bold transition-colors cursor-pointer text-[10px]"
            title="Open Risk Management & Position Sizing Calculator"
          >
            <Calculator className="w-3 h-3" />
            <span>Risk Calc</span>
          </button>
        )}

        {/* Leverage selector */}
        <div className="flex items-center gap-1">
          <span className="text-[#99907f] text-[10px]">Lev:</span>
          <span className="text-[#f6be16] font-bold px-1.5 py-0.5 bg-[#272a2d] rounded border border-[#37393d]">
            {leverage}x
          </span>
        </div>
      </div>

      {/* Leverage Quick Slider Bar */}
      <div className="px-3 py-2 bg-[#191c1f]/50 border-b border-[#272a2d] flex items-center gap-2">
        <Sliders className="w-3 h-3 text-[#99907f]" />
        <input
          type="range"
          min="1"
          max="100"
          value={leverage}
          onChange={(e) => setLeverage(Number(e.target.value))}
          className="w-full accent-[#f6be16] h-1 bg-[#272a2d] rounded appearance-none cursor-pointer"
        />
        <div className="flex gap-1">
          {[5, 20, 50, 100].map((lev) => (
            <button
              key={lev}
              onClick={() => setLeverage(lev)}
              className={`text-[9px] px-1 py-0.5 rounded ${
                leverage === lev
                  ? 'bg-[#f6be16] text-[#0b0e11] font-bold'
                  : 'text-[#99907f] hover:bg-[#272a2d]'
              }`}
            >
              {lev}x
            </button>
          ))}
        </div>
      </div>

      {/* Order Type Tabs */}
      <div className="grid grid-cols-4 border-b border-[#272a2d] bg-[#111417] text-center text-[10px]">
        {(['limit', 'market', 'stop-limit', 'ai-smart'] as const).map((type) => (
          <button
            key={type}
            id={`order-type-${type}`}
            onClick={() => setOrderType(type)}
            className={`py-2 uppercase font-medium border-b-2 transition-colors flex items-center justify-center gap-0.5 ${
              orderType === type
                ? 'border-[#f6be16] text-[#fff8f1] bg-[#191c1f]'
                : 'border-transparent text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            {type === 'ai-smart' && <Sparkles className="w-2.5 h-2.5 text-[#00ff94]" />}
            <span>{type === 'ai-smart' ? 'AI Smart' : type}</span>
          </button>
        ))}
      </div>

      <div className="p-3 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          {/* Available Balance */}
          <div className="flex justify-between items-center text-[10px] text-[#99907f]">
            <span>Avail Balance:</span>
            <span className="text-[#fff8f1] font-medium">
              {isINR
                ? `₹${(balance * 98.3).toLocaleString('en-IN', { maximumFractionDigits: 0 })} INR`
                : `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`}
            </span>
          </div>

          {/* Price Input Field */}
          {orderType !== 'market' && (
            <div>
              <div className="flex justify-between text-[10px] text-[#99907f] mb-1">
                <span>Price</span>
                <span className="text-[#e1e2e7]">{currencyLabel}</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="w-full bg-[#191c1f] text-[#fff8f1] border border-[#272a2d] focus:border-[#f6be16] rounded px-2.5 py-1.5 outline-none text-xs"
                />
              </div>
            </div>
          )}

          {/* Size / Amount Input Field */}
          <div>
            <div className="flex justify-between text-[10px] text-[#99907f] mb-1">
              <span>Amount</span>
              <span className="text-[#e1e2e7]">{symbol.split('/')[0]}</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={amountInput}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full bg-[#191c1f] text-[#fff8f1] border border-[#272a2d] focus:border-[#f6be16] rounded px-2.5 py-1.5 outline-none text-xs"
              />
            </div>
          </div>

          {/* Percentage Presets (25%, 50%, 75%, 100%) */}
          <div className="grid grid-cols-4 gap-1 pt-0.5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => handlePercentClick(pct)}
                className={`py-1 rounded text-[10px] font-bold border transition-colors ${
                  percentSlider === pct
                    ? 'border-[#f6be16] text-[#f6be16] bg-[#f6be16]/10'
                    : 'border-[#272a2d] text-[#99907f] hover:bg-[#272a2d] hover:text-[#e1e2e7]'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Collapsible TP / SL Option */}
          <div className="pt-1 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[10px] text-[#99907f] cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTPSL}
                  onChange={(e) => setEnableTPSL(e.target.checked)}
                  className="accent-[#f6be16] rounded"
                />
                <span>Take Profit & Stop Loss</span>
              </label>

              <label className="flex items-center gap-1.5 text-[10px] text-[#ffd87f] cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTrailingSL}
                  onChange={(e) => setEnableTrailingSL(e.target.checked)}
                  className="accent-[#f6be16] rounded"
                />
                <span>Trailing SL</span>
              </label>
            </div>

            {enableTPSL && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#272a2d]">
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[9px] text-[#00ff94]">TP Target</span>
                    <button
                      type="button"
                      onClick={() => setTpInput((priceNum * 1.03).toFixed(precision))}
                      className="text-[8px] text-[#00ff94] bg-[#00ff94]/15 px-1 rounded hover:bg-[#00ff94]/30"
                    >
                      +3%
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="Take Profit"
                    value={tpInput}
                    onChange={(e) => setTpInput(e.target.value)}
                    className="w-full bg-[#191c1f] text-[#00ff94] border border-[#272a2d] rounded px-1.5 py-1 text-[10px] outline-none font-bold"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[9px] text-[#ff3b4a]">SL Stop</span>
                    <button
                      type="button"
                      onClick={() => setSlInput((priceNum * 0.98).toFixed(precision))}
                      className="text-[8px] text-[#ff3b4a] bg-[#ff3b4a]/15 px-1 rounded hover:bg-[#ff3b4a]/30"
                    >
                      -2%
                    </button>
                  </div>
                  <input
                    type="number"
                    placeholder="Stop Loss"
                    value={slInput}
                    onChange={(e) => setSlInput(e.target.value)}
                    className="w-full bg-[#191c1f] text-[#ff3b4a] border border-[#272a2d] rounded px-1.5 py-1 text-[10px] outline-none font-bold"
                  />
                </div>
              </div>
            )}

            {enableTrailingSL && (
              <div className="p-2 rounded bg-[#191c1f] border border-[#f6be16]/30 flex flex-col gap-1 text-[10px]">
                <div className="flex justify-between items-center text-[#ffd87f]">
                  <span>Trailing Distance:</span>
                  <span className="font-bold">{trailingStopPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={trailingStopPercent}
                  onChange={(e) => setTrailingStopPercent(Number(e.target.value))}
                  className="accent-[#f6be16] cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Execution Metric Calculations */}
          <div className="space-y-1 pt-2 border-t border-[#272a2d] text-[10px] text-[#99907f]">
            <div className="flex justify-between">
              <span>Order Value:</span>
              <span className="text-[#e1e2e7]">{currencySymbol}{totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span>Req. Margin:</span>
              <span className="text-[#ffd87f] font-medium">{currencySymbol}{marginRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[9px]">
              <span>Est. Liq (Long):</span>
              <span className="text-[#ff3b4a]">{currencySymbol}{estBuyLiqPrice.toLocaleString(undefined, { maximumFractionDigits: isINR ? 2 : precision })}</span>
            </div>
            <div className="flex justify-between text-[9px]">
              <span>Est. Liq (Short):</span>
              <span className="text-[#ff3b4a]">{currencySymbol}{estSellLiqPrice.toLocaleString(undefined, { maximumFractionDigits: isINR ? 2 : precision })}</span>
            </div>
          </div>
        </div>

        {/* Big Action Buttons (Buy / Long & Sell / Short) */}
        <div className="grid grid-cols-2 gap-2 pt-3">
          <button
            id="btn-buy-long"
            onClick={() => handleExecute('buy')}
            disabled={amountNum <= 0 || marginRequired > balance}
            className={`py-2.5 px-3 rounded flex flex-col items-center justify-center transition-all ${
              amountNum > 0 && marginRequired <= balance
                ? 'bg-[#00ff94] hover:bg-[#40e397] text-[#002111] font-bold shadow-[0_0_12px_rgba(0,255,148,0.35)] cursor-pointer'
                : 'bg-[#00ff94]/30 text-[#002111]/60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-1 font-bold text-xs uppercase tracking-wider">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Buy / Long</span>
            </div>
            <span className="text-[9px] font-mono opacity-80">
              {amountNum > 0 ? `${amountNum} ${symbol.split('/')[0]}` : 'Instant'}
            </span>
          </button>

          <button
            id="btn-sell-short"
            onClick={() => handleExecute('sell')}
            disabled={amountNum <= 0 || marginRequired > balance}
            className={`py-2.5 px-3 rounded flex flex-col items-center justify-center transition-all ${
              amountNum > 0 && marginRequired <= balance
                ? 'bg-[#ff3b4a] hover:bg-[#ff5a66] text-[#fff8f7] font-bold shadow-[0_0_12px_rgba(255,59,74,0.35)] cursor-pointer'
                : 'bg-[#ff3b4a]/30 text-[#fff8f7]/60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-1 font-bold text-xs uppercase tracking-wider">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Sell / Short</span>
            </div>
            <span className="text-[9px] font-mono opacity-80">
              {amountNum > 0 ? `${amountNum} ${symbol.split('/')[0]}` : 'Instant'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
