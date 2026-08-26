import React, { useState, useEffect, useMemo } from 'react';
import { AssetPair, TickerInfo, PriceAlert } from '../types';
import {
  Bell,
  BellRing,
  X,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  Filter,
} from 'lucide-react';
import { playAlertChime } from '../utils/soundEffects';

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PriceAlert[];
  tickers: Record<AssetPair, TickerInfo>;
  currentPair: AssetPair;
  onSelectPair?: (pair: AssetPair) => void;
  onCreateAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'status'>) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  onTriggerTestAlert?: (alert: PriceAlert) => void;
  prefillSymbol?: AssetPair;
  prefillPrice?: number;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  alerts,
  tickers,
  currentPair,
  onSelectPair,
  onCreateAlert,
  onToggleAlert,
  onDeleteAlert,
  onTriggerTestAlert,
  prefillSymbol,
  prefillPrice,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [symbol, setSymbol] = useState<AssetPair>(prefillSymbol || currentPair);
  const [condition, setCondition] = useState<'rises_above' | 'drops_below' | 'crosses'>('rises_above');
  const [targetPriceInput, setTargetPriceInput] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [filterSymbol, setFilterSymbol] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'triggered'>('all');

  const currentTicker = tickers[symbol] || tickers['ETH/USDT'];
  const currentPrice = currentTicker?.price || 100;
  const precision = currentTicker?.precision ?? 2;

  // Initialize or update prefilled values
  useEffect(() => {
    if (prefillSymbol) {
      setSymbol(prefillSymbol);
    }
  }, [prefillSymbol]);

  useEffect(() => {
    if (prefillPrice && prefillPrice > 0) {
      setTargetPriceInput(prefillPrice.toFixed(precision));
      if (prefillPrice > currentPrice) {
        setCondition('rises_above');
      } else if (prefillPrice < currentPrice) {
        setCondition('drops_below');
      }
    } else if (!targetPriceInput) {
      // Default to +2% target
      const defaultTarget = currentPrice * 1.02;
      setTargetPriceInput(defaultTarget.toFixed(precision));
      setCondition('rises_above');
    }
  }, [currentPrice, precision, prefillPrice]);

  if (!isOpen) return null;

  const targetPriceNum = parseFloat(targetPriceInput) || 0;
  const priceDiff = targetPriceNum - currentPrice;
  const percentDiff = currentPrice > 0 ? (priceDiff / currentPrice) * 100 : 0;

  const handleApplyPresetPercent = (percent: number) => {
    const calculated = currentPrice * (1 + percent / 100);
    setTargetPriceInput(calculated.toFixed(precision));
    if (percent > 0) {
      setCondition('rises_above');
    } else if (percent < 0) {
      setCondition('drops_below');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPriceNum || targetPriceNum <= 0) return;

    onCreateAlert({
      symbol,
      targetPrice: Number(targetPriceNum.toFixed(precision)),
      condition,
      note: note.trim() || undefined,
      isRecurring,
      soundEnabled,
      initialPriceAtCreation: currentPrice,
    });

    setNote('');
    setActiveTab('list');
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSymbol !== 'ALL' && a.symbol !== filterSymbol) return false;
    if (statusFilter === 'active' && a.status !== 'active') return false;
    if (statusFilter === 'triggered' && a.status !== 'triggered') return false;
    return true;
  });

  const activeAlertsCount = alerts.filter((a) => a.status === 'active').length;
  const triggeredAlertsCount = alerts.filter((a) => a.status === 'triggered').length;

  return (
    <div
      id="price-alerts-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 font-hanken animate-in fade-in duration-150"
    >
      <div
        id="price-alerts-modal-container"
        className="w-full max-w-xl bg-[#14171a] border border-[#272a2d] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#191c1f] border-b border-[#272a2d]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#f6be16]/15 border border-[#f6be16]/30 text-[#f6be16]">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#fff8f1] flex items-center gap-2">
                Price Alerts Engine
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/30">
                  {activeAlertsCount} Active
                </span>
              </h2>
              <p className="text-[11px] text-[#99907f]">
                Set real-time target thresholds with multi-channel sound & visual breach notifications.
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

        {/* Tab Controls */}
        <div className="flex items-center border-b border-[#272a2d] bg-[#111417] px-5 pt-2 gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 pb-2 px-3 border-b-2 font-bold transition-colors cursor-pointer ${
              activeTab === 'create'
                ? 'border-[#f6be16] text-[#f6be16]'
                : 'border-transparent text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Alert</span>
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 pb-2 px-3 border-b-2 font-bold transition-colors cursor-pointer ${
              activeTab === 'list'
                ? 'border-[#f6be16] text-[#f6be16]'
                : 'border-transparent text-[#99907f] hover:text-[#e1e2e7]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Manage Alerts ({alerts.length})</span>
            {activeAlertsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#00ff94] animate-pulse" />
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Asset Selector */}
              <div>
                <label className="block text-xs font-medium text-[#d0c5b3] mb-1.5">
                  Select Asset Market
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {(Object.keys(tickers) as AssetPair[]).map((p) => {
                    const t = tickers[p];
                    const isSelected = p === symbol;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setSymbol(p);
                          const nextPrice = tickers[p]?.price || 100;
                          const nextPrec = tickers[p]?.precision ?? 2;
                          setTargetPriceInput((nextPrice * 1.02).toFixed(nextPrec));
                        }}
                        className={`p-2 rounded-lg border text-left font-mono text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#f6be16]/15 border-[#f6be16] text-[#fff8f1] shadow-[0_0_10px_rgba(246,190,22,0.2)]'
                            : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:border-[#37393d] hover:text-[#e1e2e7]'
                        }`}
                      >
                        <div className="font-bold text-[11px] truncate">{p}</div>
                        <div className="text-[10px] text-[#e1e2e7] font-semibold">
                          ${t ? t.price.toFixed(t.precision) : '0.00'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Market Price Banner */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#191c1f] border border-[#272a2d] font-mono text-xs">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#f6be16]" />
                  <span className="text-[#99907f]">Live Market Price:</span>
                  <span className="font-extrabold text-sm text-[#fff8f1]">
                    ${currentPrice.toFixed(precision)}
                  </span>
                </div>
                <div
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    currentTicker?.change24h >= 0
                      ? 'bg-[#00ff94]/10 text-[#00ff94]'
                      : 'bg-[#ff3b4a]/10 text-[#ff3b4a]'
                  }`}
                >
                  {currentTicker?.change24h >= 0 ? '+' : ''}
                  {currentTicker?.change24h?.toFixed(2)}% (24h)
                </div>
              </div>

              {/* Condition Selector */}
              <div>
                <label className="block text-xs font-medium text-[#d0c5b3] mb-1.5">
                  Alert Condition Trigger
                </label>
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setCondition('rises_above')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border font-bold transition-all cursor-pointer ${
                      condition === 'rises_above'
                        ? 'bg-[#00ff94]/15 border-[#00ff94] text-[#00ff94] shadow-[0_0_10px_rgba(0,255,148,0.2)]'
                        : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:border-[#37393d] hover:text-[#e1e2e7]'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Rises Above (≥)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCondition('drops_below')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border font-bold transition-all cursor-pointer ${
                      condition === 'drops_below'
                        ? 'bg-[#ff3b4a]/15 border-[#ff3b4a] text-[#ff3b4a] shadow-[0_0_10px_rgba(255,59,74,0.2)]'
                        : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:border-[#37393d] hover:text-[#e1e2e7]'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Drops Below (≤)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCondition('crosses')}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border font-bold transition-all cursor-pointer ${
                      condition === 'crosses'
                        ? 'bg-[#f6be16]/15 border-[#f6be16] text-[#f6be16] shadow-[0_0_10px_rgba(246,190,22,0.2)]'
                        : 'bg-[#191c1f] border-[#272a2d] text-[#99907f] hover:border-[#37393d] hover:text-[#e1e2e7]'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Crosses Price</span>
                  </button>
                </div>
              </div>

              {/* Target Price Input & Quick Helper Buttons */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-[#d0c5b3]">
                    Target Price Threshold (USDT)
                  </label>
                  {targetPriceNum > 0 && (
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        percentDiff >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                      }`}
                    >
                      {percentDiff >= 0 ? '+' : ''}
                      {percentDiff.toFixed(2)}% ({priceDiff >= 0 ? '+' : ''}$
                      {Math.abs(priceDiff).toFixed(precision)})
                    </span>
                  )}
                </div>

                <div className="relative mb-2">
                  <input
                    type="number"
                    step="any"
                    required
                    value={targetPriceInput}
                    onChange={(e) => setTargetPriceInput(e.target.value)}
                    placeholder={`e.g. ${(currentPrice * 1.05).toFixed(precision)}`}
                    className="w-full bg-[#111417] border border-[#272a2d] focus:border-[#f6be16] rounded-lg px-3 py-2.5 text-sm font-mono text-[#fff8f1] focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-[#99907f] font-mono">
                    USDT
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                  <span className="text-[10px] text-[#99907f]">Quick Presets:</span>
                  {[-5, -2, -1, 1, 2, 5, 10].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleApplyPresetPercent(pct)}
                      className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        pct > 0
                          ? 'bg-[#00ff94]/10 hover:bg-[#00ff94]/20 border-[#00ff94]/30 text-[#00ff94]'
                          : 'bg-[#ff3b4a]/10 hover:bg-[#ff3b4a]/20 border-[#ff3b4a]/30 text-[#ff3b4a]'
                      }`}
                    >
                      {pct > 0 ? `+${pct}%` : `${pct}%`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTargetPriceInput(currentPrice.toFixed(precision))}
                    className="px-2 py-0.5 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[#e1e2e7] transition-colors cursor-pointer"
                  >
                    Current
                  </button>
                </div>
              </div>

              {/* Note / Label */}
              <div>
                <label className="block text-xs font-medium text-[#d0c5b3] mb-1.5">
                  Alert Label / Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Major resistance breakout, Dip buy level, Take Profit 1"
                  className="w-full bg-[#111417] border border-[#272a2d] focus:border-[#f6be16] rounded-lg px-3 py-2 text-xs text-[#fff8f1] focus:outline-none placeholder-[#99907f]/60 font-mono"
                />
              </div>

              {/* Preferences: Sound & Recurring */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-xs">
                <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#191c1f] border border-[#272a2d] cursor-pointer hover:border-[#37393d] transition-colors">
                  <div className="flex items-center gap-2 text-[#e1e2e7]">
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-[#f6be16]" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-[#99907f]" />
                    )}
                    <span>Audio Chime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        playAlertChime();
                      }}
                      className="text-[10px] text-[#f6be16] hover:underline px-1.5 py-0.5 rounded bg-[#f6be16]/10"
                      title="Test Audio Chime"
                    >
                      Test
                    </button>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="accent-[#f6be16] w-4 h-4 cursor-pointer"
                    />
                  </div>
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#191c1f] border border-[#272a2d] cursor-pointer hover:border-[#37393d] transition-colors">
                  <div className="flex items-center gap-2 text-[#e1e2e7]">
                    <RotateCcw className="w-4 h-4 text-[#38bdf8]" />
                    <span>Recurring Alert</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="accent-[#38bdf8] w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-[#f6be16] hover:bg-[#e5b012] text-[#111417] font-bold text-xs font-mono rounded-lg transition-all shadow-[0_0_15px_rgba(246,190,22,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <BellRing className="w-4 h-4" />
                <span>Arm Price Alert for {symbol}</span>
              </button>
            </form>
          ) : (
            /* Manage Alerts List Tab */
            <div className="space-y-3">
              {/* Filter Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#272a2d] text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#99907f]" />
                  <select
                    value={filterSymbol}
                    onChange={(e) => setFilterSymbol(e.target.value)}
                    className="bg-[#191c1f] border border-[#272a2d] text-[#e1e2e7] px-2 py-1 rounded text-xs focus:outline-none"
                  >
                    <option value="ALL">All Pairs</option>
                    {(Object.keys(tickers) as AssetPair[]).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-[#191c1f] p-0.5 rounded border border-[#272a2d]">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-[#272a2d] text-[#fff8f1]'
                        : 'text-[#99907f] hover:text-[#e1e2e7]'
                    }`}
                  >
                    All ({alerts.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      statusFilter === 'active'
                        ? 'bg-[#00ff94]/20 text-[#00ff94]'
                        : 'text-[#99907f] hover:text-[#e1e2e7]'
                    }`}
                  >
                    Active ({activeAlertsCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('triggered')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                      statusFilter === 'triggered'
                        ? 'bg-[#f6be16]/20 text-[#f6be16]'
                        : 'text-[#99907f] hover:text-[#e1e2e7]'
                    }`}
                  >
                    Triggered ({triggeredAlertsCount})
                  </button>
                </div>
              </div>

              {/* Alerts Cards List */}
              {filteredAlerts.length === 0 ? (
                <div className="text-center py-10 px-4 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[#191c1f] border border-[#272a2d] flex items-center justify-center mx-auto text-[#99907f]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#e1e2e7]">No Price Alerts Found</h4>
                    <p className="text-[11px] text-[#99907f]">
                      Create threshold alerts to track price breakouts and major market bounces.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="px-3 py-1.5 bg-[#f6be16] hover:bg-[#e5b012] text-[#111417] text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    + Create First Alert
                  </button>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const tick = tickers[alert.symbol];
                  const liveP = tick?.price || alert.initialPriceAtCreation;
                  const prec = tick?.precision ?? 2;
                  const diff = alert.targetPrice - liveP;
                  const pct = liveP > 0 ? (diff / liveP) * 100 : 0;
                  const isTriggered = alert.status === 'triggered';
                  const isActive = alert.status === 'active';

                  return (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isTriggered
                          ? 'bg-[#191c1f]/50 border-[#272a2d] text-[#99907f]'
                          : isActive
                          ? 'bg-[#191c1f] border-[#37393d] hover:border-[#f6be16]/50 shadow-sm'
                          : 'bg-[#14171a] border-[#272a2d] opacity-60'
                      }`}
                    >
                      {/* Top row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectPair(alert.symbol);
                              onClose();
                            }}
                            className="font-bold text-xs text-[#fff8f1] font-mono hover:text-[#f6be16] flex items-center gap-1 transition-colors"
                            title="Switch terminal chart to this asset"
                          >
                            <span>{alert.symbol}</span>
                            <span className="text-[9px] text-[#99907f] font-normal">
                              (${liveP.toFixed(prec)})
                            </span>
                          </button>

                          {/* Condition Tag */}
                          <span
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              alert.condition === 'rises_above'
                                ? 'bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/30'
                                : alert.condition === 'drops_below'
                                ? 'bg-[#ff3b4a]/15 text-[#ff3b4a] border border-[#ff3b4a]/30'
                                : 'bg-[#f6be16]/15 text-[#f6be16] border border-[#f6be16]/30'
                            }`}
                          >
                            {alert.condition === 'rises_above' && <TrendingUp className="w-3 h-3" />}
                            {alert.condition === 'drops_below' && <TrendingDown className="w-3 h-3" />}
                            {alert.condition === 'crosses' && <Zap className="w-3 h-3" />}
                            <span>
                              {alert.condition === 'rises_above'
                                ? 'Rises ≥'
                                : alert.condition === 'drops_below'
                                ? 'Drops ≤'
                                : 'Crosses'}
                            </span>
                          </span>

                          {alert.isRecurring && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-mono">
                              Repeat
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-1.5 font-mono text-[10px]">
                          {isActive && (
                            <span className="flex items-center gap-1 text-[#00ff94] bg-[#00ff94]/10 px-2 py-0.5 rounded-full border border-[#00ff94]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00ff94] animate-pulse" />
                              Armed
                            </span>
                          )}
                          {isTriggered && (
                            <span className="flex items-center gap-1 text-[#ffd87f] bg-[#f6be16]/10 px-2 py-0.5 rounded-full border border-[#f6be16]/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Triggered
                            </span>
                          )}
                          {alert.status === 'disabled' && (
                            <span className="text-[#99907f] bg-[#272a2d] px-2 py-0.5 rounded-full">
                              Paused
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle row: Target Price & Distance */}
                      <div className="flex items-center justify-between font-mono text-xs py-1">
                        <div>
                          <span className="text-[#99907f] text-[10px] block">TARGET THRESHOLD</span>
                          <span className="font-extrabold text-sm text-[#fff8f1]">
                            ${alert.targetPrice.toFixed(prec)}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[#99907f] text-[10px] block">DISTANCE TO TRIGGER</span>
                          <span
                            className={`font-bold text-xs ${
                              pct >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
                            }`}
                          >
                            {pct >= 0 ? '+' : ''}
                            {pct.toFixed(2)}% ({diff >= 0 ? '+' : ''}${Math.abs(diff).toFixed(prec)})
                          </span>
                        </div>
                      </div>

                      {/* Optional Note */}
                      {alert.note && (
                        <p className="text-[11px] text-[#d0c5b3] mt-1 bg-[#111417] px-2 py-1 rounded border border-[#272a2d]">
                          💬 {alert.note}
                        </p>
                      )}

                      {/* Bottom action toolbar */}
                      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#272a2d] text-[10px] font-mono text-[#99907f]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {alert.triggeredAt
                              ? `Triggered ${new Date(alert.triggeredAt).toLocaleTimeString()}`
                              : `Created ${new Date(alert.createdAt).toLocaleTimeString()}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Test Trigger Button */}
                          {onTriggerTestAlert && (
                            <button
                              type="button"
                              onClick={() => onTriggerTestAlert(alert)}
                              className="px-2 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#e1e2e7] hover:text-[#fff8f1] transition-colors flex items-center gap-1 cursor-pointer"
                              title="Simulate breach and trigger alert notification"
                            >
                              <Play className="w-2.5 h-2.5 text-[#f6be16]" />
                              <span>Test Breach</span>
                            </button>
                          )}

                          {/* Toggle Active / Disabled */}
                          <button
                            type="button"
                            onClick={() => onToggleAlert(alert.id)}
                            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#e1e2e7]'
                                : 'bg-[#00ff94]/15 hover:bg-[#00ff94]/25 text-[#00ff94]'
                            }`}
                          >
                            {isActive ? 'Pause' : 'Re-arm'}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => onDeleteAlert(alert.id)}
                            className="p-1 text-[#99907f] hover:text-[#ff3b4a] hover:bg-[#ff3b4a]/10 rounded transition-colors cursor-pointer"
                            title="Delete Alert"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#191c1f] border-t border-[#272a2d] flex items-center justify-between text-[11px] text-[#99907f] font-mono px-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff94]" />
            <span>CoinDCX Live Breach Engine: Monitoring</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#e1e2e7] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
