import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChartMainViewMode,
  ChartLayoutPattern,
  OrderFlowSwitchboardConfig,
} from '../types';
import {
  BarChart2,
  Activity,
  Flame,
  Compass,
  Zap,
  LayoutGrid,
  Square,
  Columns,
  Rows,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  TrendingUp,
  Settings,
  Eye,
  X,
  RotateCcw,
  Check,
} from 'lucide-react';

interface OrderFlowSwitchboardProps {
  activeView: ChartMainViewMode;
  onChangeView: (view: ChartMainViewMode) => void;
  layoutPattern: ChartLayoutPattern;
  onChangeLayoutPattern: (pattern: ChartLayoutPattern) => void;
  config: OrderFlowSwitchboardConfig;
  onUpdateConfig: (newConfig: Partial<OrderFlowSwitchboardConfig>) => void;
  buyerVolumeRatio?: number; // e.g. 54%
  cumulativeDelta?: number;
  autoExecutionEnabled?: boolean;
  onToggleAutoExecution?: () => void;
  onOpenAutoAlertsModal?: () => void;
}

export const OrderFlowSwitchboard: React.FC<OrderFlowSwitchboardProps> = ({
  activeView,
  onChangeView,
  layoutPattern,
  onChangeLayoutPattern,
  config,
  onUpdateConfig,
  buyerVolumeRatio = 54.2,
  cumulativeDelta = 142.8,
  autoExecutionEnabled = false,
  onToggleAutoExecution,
  onOpenAutoAlertsModal,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const settingsPanelRef = useRef<HTMLDivElement | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScrollability();
    const raf = requestAnimationFrame(checkScrollability);
    const timer = setTimeout(checkScrollability, 150);
    window.addEventListener('resize', checkScrollability);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      window.removeEventListener('resize', checkScrollability);
    };
  }, [checkScrollability]);

  // Click outside to close Switchboard panel
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsPanelRef.current &&
        !settingsPanelRef.current.contains(e.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current && (e.deltaY !== 0 || e.deltaX !== 0)) {
      scrollContainerRef.current.scrollLeft += e.deltaY !== 0 ? e.deltaY : e.deltaX;
      checkScrollability();
      e.stopPropagation();
    }
  };

  const handleResetDefaults = () => {
    onUpdateConfig({
      imbalanceRatio: 3.0,
      showCVD: true,
      showPOC: true,
      showValueArea: true,
      showLiquidityWalls: true,
      showStackedImbalances: true,
      heatmapResolution: 'med',
      domTickSize: 0.5,
      autoCenterDOM: true,
    });
  };

  const VIEW_MODES: { id: ChartMainViewMode; label: string; icon: React.FC<{ className?: string }>; badge?: string; desc: string }[] = [
    { id: 'liquidity_heatmap', label: 'Liquidity Heatmap', icon: Flame, badge: 'HOT', desc: 'Deep order book depth walls' },
    { id: 'market_profile', label: 'TPO Profile', icon: Compass, badge: 'POC', desc: 'Time Price Opportunity (Value Area)' },
    { id: 'dom_ladder', label: 'DOM Ladder', icon: Zap, badge: 'LADDER', desc: 'Depth of Market 1-click execution' },
    { id: 'multi_chart', label: 'Multi-Grid', icon: LayoutGrid, badge: '4X', desc: 'Sync multi-pair split charts' },
  ];

  const activeTogglesCount = [
    config.showCVD,
    config.showPOC,
    config.showValueArea,
    config.showLiquidityWalls,
    config.showStackedImbalances,
  ].filter(Boolean).length;

  return (
    <div
      id="order-flow-switchboard-bar"
      className="relative z-40 bg-[#14171a] border-b border-[#272a2d] font-mono text-[11px] select-none shadow-xs"
    >
      <div className="flex items-center justify-between px-2 py-1 gap-1.5">
        {/* Left: Scrollable Function List Track with Navigation Advance Buttons */}
        <div className="relative flex items-center min-w-0 flex-1 overflow-hidden">
          {/* Scroll Backward (Left Arrow) Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={handleScrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-5 rounded-full bg-[#191c1f] hover:bg-[#272a2d] text-[#fff8f1] border border-[#37393d] flex items-center justify-center shadow-lg transition-all cursor-pointer"
              title="Peeche dekhein (Scroll Left)"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          )}

          {/* Scrollable Track */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollability}
            onWheel={handleWheel}
            className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5 w-full touch-pan-x"
          >
            <div className="flex items-center gap-1 shrink-0 text-[#99907f] font-bold text-[9.5px] uppercase tracking-wider mr-0.5">
              <span>View:</span>
            </div>

            {/* 1. Candlestick Chart View */}
            <button
              type="button"
              onClick={() => onChangeView('candles')}
              title="Candlestick: Classic price action"
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeView === 'candles'
                  ? 'bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/50 shadow-[0_0_12px_rgba(0,255,148,0.2)]'
                  : 'bg-[#191c1f] hover:bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1] border border-[#272a2d]'
              }`}
            >
              <BarChart2 className={`w-3 h-3 ${activeView === 'candles' ? 'text-[#00ff94]' : 'text-[#99907f]'}`} />
              <span>Candlestick</span>
            </button>

            {/* 2. AUTO-ALERT SCANNER FEATURE */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                type="button"
                id="switchboard-auto-trade-btn"
                onClick={onToggleAutoExecution}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                  autoExecutionEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
                    : 'bg-[#191c1f] hover:bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1] border-[#272a2d]'
                }`}
                title="Alert Scanner Feature: Scans market conditions and triggers notification cards"
              >
                <Zap className={`w-3.5 h-3.5 ${autoExecutionEnabled ? 'text-emerald-400 fill-current animate-pulse' : 'text-[#99907f]'}`} />
                <span>Scanner Alerts</span>
                <span
                  className={`text-[8.5px] px-1.5 py-0.1 rounded font-extrabold ${
                    autoExecutionEnabled
                      ? 'bg-emerald-400 text-black shadow-sm'
                      : 'bg-[#272a2d] text-[#99907f]'
                  }`}
                >
                  {autoExecutionEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              {onOpenAutoAlertsModal && (
                <button
                  type="button"
                  onClick={onOpenAutoAlertsModal}
                  className="p-1 rounded bg-[#191c1f] hover:bg-[#272a2d] text-[#99907f] hover:text-[#00ff94] border border-[#272a2d] transition-colors cursor-pointer"
                  title="Auto-Trade Rules & Risk Settings"
                >
                  <Settings className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Remaining View Modes */}
            {VIEW_MODES.map((mode) => {
              const Icon = mode.icon;
              const isActive = activeView === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onChangeView(mode.id)}
                  title={`${mode.label}: ${mode.desc}`}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/50 shadow-[0_0_12px_rgba(0,255,148,0.2)]'
                      : 'bg-[#191c1f] hover:bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1] border border-[#272a2d]'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isActive ? 'text-[#00ff94]' : 'text-[#99907f]'}`} />
                  <span>{mode.label}</span>
                  {mode.badge && (
                    <span
                      className={`text-[8.5px] px-1 py-0.1 rounded font-extrabold ${
                        isActive
                          ? 'bg-[#00ff94] text-[#111417]'
                          : 'bg-[#272a2d] text-[#99907f]'
                      }`}
                    >
                      {mode.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scroll Forward (Right Arrow) Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={handleScrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-5 h-5 rounded-full bg-[#191c1f] hover:bg-[#272a2d] text-[#fff8f1] border border-[#37393d] flex items-center justify-center shadow-lg transition-all cursor-pointer animate-pulse"
              title="Aage badhein (Scroll Right for more functions)"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Center / Right: Order Flow Live Metrics, Multi-Grid Layouts & Switchboard Tuning Menu */}
        <div className="flex items-center gap-1.5 shrink-0 relative overflow-visible">
          {/* Buyer vs Seller Delta Gauge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#191c1f] border border-[#272a2d] text-[10px] shrink-0">
            <span className="text-[#99907f]">Delta Flow:</span>
            <div className="w-14 h-1.5 rounded-full bg-[#ff3b4a]/30 overflow-hidden flex">
              <div
                className="h-full bg-[#00ff94] transition-all duration-300"
                style={{ width: `${buyerVolumeRatio}%` }}
              />
            </div>
            <span className="text-[#00ff94] font-bold">{buyerVolumeRatio.toFixed(1)}% Buy</span>
            <span className="text-[#99907f]">|</span>
            <span
              className={`font-bold ${
                cumulativeDelta >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
              }`}
            >
              CVD {cumulativeDelta >= 0 ? '+' : ''}{cumulativeDelta.toFixed(1)}
            </span>
          </div>

          {/* Layout Pattern Buttons [ 1 ], [ = ], [ || ], [ :: ] - Only on Laptop/Desktop screens */}
          <div className="hidden lg:flex items-center gap-0.5 bg-[#191c1f] p-0.5 rounded border border-[#272a2d] shrink-0">
            <button
              type="button"
              onClick={() => {
                onChangeLayoutPattern('single');
                if (activeView === 'multi_chart') onChangeView('candles');
              }}
              className={`p-0.5 rounded transition-colors cursor-pointer ${
                layoutPattern === 'single' && activeView !== 'multi_chart'
                  ? 'bg-[#272a2d] text-[#00ff94]'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Single Chart [ 1 ]"
            >
              <Square className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeLayoutPattern('dual_h');
                onChangeView('multi_chart');
              }}
              className={`p-0.5 rounded transition-colors cursor-pointer ${
                layoutPattern === 'dual_h' && activeView === 'multi_chart'
                  ? 'bg-[#272a2d] text-[#00ff94]'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Dual Horizontal Split [ = ]"
            >
              <Rows className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeLayoutPattern('dual_v');
                onChangeView('multi_chart');
              }}
              className={`p-0.5 rounded transition-colors cursor-pointer ${
                layoutPattern === 'dual_v' && activeView === 'multi_chart'
                  ? 'bg-[#272a2d] text-[#00ff94]'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Dual Vertical Split [ || ]"
            >
              <Columns className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeLayoutPattern('quad');
                onChangeView('multi_chart');
              }}
              className={`p-0.5 rounded transition-colors cursor-pointer ${
                layoutPattern === 'quad' && activeView === 'multi_chart'
                  ? 'bg-[#272a2d] text-[#00ff94]'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title="Quad 4-Chart Grid [ :: ]"
            >
              <LayoutGrid className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Switchboard Tuning Drawer Dropdown */}
          <div className="relative overflow-visible" ref={settingsPanelRef}>
            <button
              id="switchboard-options-toggle-btn"
              type="button"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                isSettingsOpen
                  ? 'bg-[#f6be16] text-[#111417] border-[#f6be16] shadow-[0_0_14px_rgba(246,190,22,0.4)]'
                  : 'bg-[#191c1f] hover:bg-[#272a2d] text-[#e1e2e7] hover:text-[#fff8f1] border-[#37393d]'
              }`}
              title="Order Flow Switchboard Options & Tuning"
            >
              <SlidersHorizontal className={`w-3 h-3 ${isSettingsOpen ? 'text-[#111417]' : 'text-[#f6be16]'}`} />
              <span>Switchboard</span>
              {activeTogglesCount > 0 && (
                <span
                  className={`text-[9px] px-1 py-0.1 rounded-full font-extrabold ${
                    isSettingsOpen ? 'bg-[#111417] text-[#f6be16]' : 'bg-[#f6be16]/20 text-[#f6be16]'
                  }`}
                >
                  {activeTogglesCount}
                </span>
              )}
              <ChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${isSettingsOpen ? 'rotate-180 text-[#111417]' : 'text-[#99907f]'}`} />
            </button>

            {/* Switchboard Dropdown / Floating Panel - GUARANTEED IN FRONT OF CHART */}
            {isSettingsOpen && (
              <div
                id="switchboard-options-panel"
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[82vh] overflow-y-auto bg-[#191c1f] border border-[#37393d] rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-4 z-[100] ring-1 ring-white/10 flex flex-col gap-3.5 font-mono text-xs animate-fadeIn divide-y divide-[#272a2d]"
              >
                {/* Panel Header */}
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-[#f6be16]/15 text-[#f6be16] border border-[#f6be16]/30">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#fff8f1]">Order Flow Switchboard</div>
                      <div className="text-[10px] text-[#99907f]">Real-time Chart Layers & Algorithmic Filters</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#00ff94]/15 text-[#00ff94] font-bold rounded-md border border-[#00ff94]/30">
                      Active
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(false)}
                      className="p-1 rounded text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] cursor-pointer transition-colors"
                      title="Close Switchboard (Esc)"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Section 1: Order Flow Visual Overlays */}
                <div className="pt-2 flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-[#99907f] tracking-wider">
                    📊 Chart Overlays & Delta
                  </span>

                  {/* CVD Toggle */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-[#272a2d]/40 hover:bg-[#272a2d]/70 text-[#e1e2e7] cursor-pointer transition-colors border border-transparent hover:border-[#37393d]">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.showCVD ? 'bg-[#00ff94]' : 'bg-[#99907f]'}`} />
                      <div>
                        <div className="font-bold text-xs text-[#fff8f1]">Cumulative Delta (CVD)</div>
                        <div className="text-[10px] text-[#99907f]">Buyer vs seller aggressive market volume</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showCVD}
                      onChange={(e) => onUpdateConfig({ showCVD: e.target.checked })}
                      className="w-4 h-4 rounded text-[#00ff94] focus:ring-0 cursor-pointer accent-[#00ff94]"
                    />
                  </label>

                  {/* POC Toggle */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-[#272a2d]/40 hover:bg-[#272a2d]/70 text-[#e1e2e7] cursor-pointer transition-colors border border-transparent hover:border-[#37393d]">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.showPOC ? 'bg-[#ffd87f]' : 'bg-[#99907f]'}`} />
                      <div>
                        <div className="font-bold text-xs text-[#fff8f1]">Point of Control (POC)</div>
                        <div className="text-[10px] text-[#99907f]">Highest volume price nodes / magnets</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showPOC}
                      onChange={(e) => onUpdateConfig({ showPOC: e.target.checked })}
                      className="w-4 h-4 rounded text-[#ffd87f] focus:ring-0 cursor-pointer accent-[#ffd87f]"
                    />
                  </label>

                  {/* Value Area Toggle */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-[#272a2d]/40 hover:bg-[#272a2d]/70 text-[#e1e2e7] cursor-pointer transition-colors border border-transparent hover:border-[#37393d]">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.showValueArea ? 'bg-[#38bdf8]' : 'bg-[#99907f]'}`} />
                      <div>
                        <div className="font-bold text-xs text-[#fff8f1]">Value Area (70% VAH/VAL)</div>
                        <div className="text-[10px] text-[#99907f]">Institutional fair value distribution</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showValueArea}
                      onChange={(e) => onUpdateConfig({ showValueArea: e.target.checked })}
                      className="w-4 h-4 rounded text-[#38bdf8] focus:ring-0 cursor-pointer accent-[#38bdf8]"
                    />
                  </label>

                  {/* Liquidity Walls Toggle */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-[#272a2d]/40 hover:bg-[#272a2d]/70 text-[#e1e2e7] cursor-pointer transition-colors border border-transparent hover:border-[#37393d]">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.showLiquidityWalls ? 'bg-[#ff3b4a]' : 'bg-[#99907f]'}`} />
                      <div>
                        <div className="font-bold text-xs text-[#fff8f1]">Liquidity Walls & Heatmap</div>
                        <div className="text-[10px] text-[#99907f]">Resting whale limit orders & bid/ask walls</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showLiquidityWalls}
                      onChange={(e) => onUpdateConfig({ showLiquidityWalls: e.target.checked })}
                      className="w-4 h-4 rounded text-[#ff3b4a] focus:ring-0 cursor-pointer accent-[#ff3b4a]"
                    />
                  </label>

                  {/* Stacked Imbalances Toggle */}
                  <label className="flex items-center justify-between p-2 rounded-lg bg-[#272a2d]/40 hover:bg-[#272a2d]/70 text-[#e1e2e7] cursor-pointer transition-colors border border-transparent hover:border-[#37393d]">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${config.showStackedImbalances ? 'bg-[#f6be16]' : 'bg-[#99907f]'}`} />
                      <div>
                        <div className="font-bold text-xs text-[#fff8f1]">Stacked Imbalances Highlight</div>
                        <div className="text-[10px] text-[#99907f]">3+ consecutive diagonal buyer/seller imbalances</div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.showStackedImbalances}
                      onChange={(e) => onUpdateConfig({ showStackedImbalances: e.target.checked })}
                      className="w-4 h-4 rounded text-[#f6be16] focus:ring-0 cursor-pointer accent-[#f6be16]"
                    />
                  </label>
                </div>

                {/* Section 2: Imbalance Ratio & Sensitivity */}
                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#99907f] font-bold">Order Flow Imbalance Ratio</span>
                    <span className="text-[#ffd87f] font-extrabold bg-[#ffd87f]/10 px-2 py-0.5 rounded border border-[#ffd87f]/30">
                      {config.imbalanceRatio}x ({(config.imbalanceRatio * 100).toFixed(0)}%)
                    </span>
                  </div>

                  <input
                    type="range"
                    min="2.0"
                    max="5.0"
                    step="0.5"
                    value={config.imbalanceRatio}
                    onChange={(e) => onUpdateConfig({ imbalanceRatio: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-[#272a2d] rounded-lg appearance-none cursor-pointer accent-[#ffd87f]"
                  />

                  <div className="flex items-center justify-between text-[9px] text-[#99907f]">
                    <span>2.0x (Standard)</span>
                    <span>3.0x (Optimal)</span>
                    <span>5.0x (Extreme Squeeze)</span>
                  </div>
                </div>

                {/* Section 3: Heatmap Resolution */}
                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#99907f] font-bold">Heatmap Granularity</span>
                    <span className="text-[#e1e2e7] font-bold uppercase">{config.heatmapResolution}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {(['low', 'med', 'ultra'] as const).map((res) => {
                      const isSelected = config.heatmapResolution === res;
                      return (
                        <button
                          key={res}
                          type="button"
                          onClick={() => onUpdateConfig({ heatmapResolution: res })}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#f6be16] text-[#111417] shadow-[0_0_10px_rgba(246,190,22,0.3)]'
                              : 'bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1] hover:bg-[#37393d]'
                          }`}
                        >
                          {res}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: DOM Ladder Execution Settings */}
                <div className="pt-2 flex flex-col gap-2">
                  <span className="text-[10px] uppercase font-bold text-[#99907f] tracking-wider">
                    ⚡ DOM Ladder Settings
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#99907f] block mb-1">Tick Grouping:</span>
                      <div className="flex items-center gap-1">
                        {[0.1, 0.5, 1.0, 5.0].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => onUpdateConfig({ domTickSize: t })}
                            className={`flex-1 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                              config.domTickSize === t
                                ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                                : 'bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#99907f] block mb-1">Auto-Center DOM:</span>
                      <button
                        type="button"
                        onClick={() => onUpdateConfig({ autoCenterDOM: !config.autoCenterDOM })}
                        className={`w-full py-1 px-2 rounded text-[11px] font-bold transition-colors cursor-pointer border ${
                          config.autoCenterDOM
                            ? 'bg-[#00ff94]/15 text-[#00ff94] border-[#00ff94]/40'
                            : 'bg-[#272a2d] text-[#99907f] border-[#37393d]'
                        }`}
                      >
                        {config.autoCenterDOM ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Panel Footer: Reset to Defaults */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="flex items-center gap-1.5 text-[11px] text-[#99907f] hover:text-[#f6be16] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Defaults</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-3 py-1 bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
