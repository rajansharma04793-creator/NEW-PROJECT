import React, { useState } from 'react';
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
  Layers,
  TrendingUp,
  Settings,
  Eye,
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
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const VIEW_MODES: { id: ChartMainViewMode; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'candles', label: 'Candlestick', icon: BarChart2 },
    { id: 'footprint', label: 'Footprint Delta', icon: Activity, badge: 'CVD' },
    { id: 'liquidity_heatmap', label: 'Liquidity Heatmap', icon: Flame, badge: 'HOT' },
    { id: 'market_profile', label: 'TPO Profile', icon: Compass, badge: 'POC' },
    { id: 'dom_ladder', label: 'DOM Ladder', icon: Zap, badge: 'LADDER' },
    { id: 'multi_chart', label: 'Multi-Grid', icon: LayoutGrid, badge: '4X' },
  ];

  return (
    <div
      id="order-flow-switchboard-bar"
      className="flex items-center justify-between px-2.5 py-1.5 bg-[#14171a] border-b border-[#272a2d] font-mono text-xs select-none gap-2 z-20 overflow-x-auto no-scrollbar"
    >
      {/* Left: View Mode Switcher Buttons ("Chart Switch Batarn") */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[#99907f] font-bold text-[10px] uppercase tracking-wider mr-1 hidden sm:inline">
          View:
        </span>
        {VIEW_MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeView === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onChangeView(mode.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/40 shadow-[0_0_10px_rgba(0,255,148,0.15)]'
                  : 'bg-[#191c1f] hover:bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1] border border-[#272a2d]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00ff94]' : 'text-[#99907f]'}`} />
              <span>{mode.label}</span>
              {mode.badge && (
                <span
                  className={`text-[9px] px-1 rounded-full font-extrabold ${
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

      {/* Center/Right: Order Flow Live Metrics & Quick Switches */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Buyer vs Seller Delta Gauge */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-0.5 rounded bg-[#191c1f] border border-[#272a2d] text-[11px]">
          <span className="text-[#99907f]">Delta Flow:</span>
          <div className="w-16 h-2 rounded-full bg-[#ff3b4a]/30 overflow-hidden flex">
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

        {/* Layout Pattern Buttons [ 1 ], [ = ], [ || ], [ :: ] */}
        <div className="flex items-center gap-0.5 bg-[#191c1f] p-0.5 rounded border border-[#272a2d]">
          <button
            onClick={() => {
              onChangeLayoutPattern('single');
              if (activeView === 'multi_chart') onChangeView('candles');
            }}
            className={`p-1 rounded transition-colors cursor-pointer ${
              layoutPattern === 'single' && activeView !== 'multi_chart'
                ? 'bg-[#272a2d] text-[#00ff94]'
                : 'text-[#99907f] hover:text-[#fff8f1]'
            }`}
            title="Single Chart [ 1 ]"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onChangeLayoutPattern('dual_h');
              onChangeView('multi_chart');
            }}
            className={`p-1 rounded transition-colors cursor-pointer ${
              layoutPattern === 'dual_h' && activeView === 'multi_chart'
                ? 'bg-[#272a2d] text-[#00ff94]'
                : 'text-[#99907f] hover:text-[#fff8f1]'
            }`}
            title="Dual Horizontal Split [ = ]"
          >
            <Rows className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onChangeLayoutPattern('dual_v');
              onChangeView('multi_chart');
            }}
            className={`p-1 rounded transition-colors cursor-pointer ${
              layoutPattern === 'dual_v' && activeView === 'multi_chart'
                ? 'bg-[#272a2d] text-[#00ff94]'
                : 'text-[#99907f] hover:text-[#fff8f1]'
            }`}
            title="Dual Vertical Split [ || ]"
          >
            <Columns className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              onChangeLayoutPattern('quad');
              onChangeView('multi_chart');
            }}
            className={`p-1 rounded transition-colors cursor-pointer ${
              layoutPattern === 'quad' && activeView === 'multi_chart'
                ? 'bg-[#272a2d] text-[#00ff94]'
                : 'text-[#99907f] hover:text-[#fff8f1]'
            }`}
            title="Quad 4-Chart Grid [ :: ]"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Switchboard Config Drawer Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-bold transition-colors cursor-pointer ${
              isSettingsOpen
                ? 'bg-[#f6be16]/20 text-[#f6be16] border-[#f6be16]/40'
                : 'bg-[#191c1f] hover:bg-[#272a2d] text-[#99907f] hover:text-[#fff8f1] border-[#272a2d]'
            }`}
            title="Switchboard Tuning & Order Flow Options"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Switchboard</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {isSettingsOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-[#191c1f] border border-[#272a2d] rounded-lg shadow-2xl p-3 z-50 flex flex-col gap-2.5 font-mono text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#272a2d]">
                <span className="font-bold text-[#fff8f1]">Order Flow Switchboard</span>
                <span className="text-[10px] text-[#00ff94]">Live Feed</span>
              </div>

              {/* Toggles */}
              <label className="flex items-center justify-between text-[#e1e2e7] cursor-pointer">
                <span>Cumulative Delta (CVD)</span>
                <input
                  type="checkbox"
                  checked={config.showCVD}
                  onChange={(e) => onUpdateConfig({ showCVD: e.target.checked })}
                  className="rounded text-[#00ff94] focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-[#e1e2e7] cursor-pointer">
                <span>Point of Control (POC)</span>
                <input
                  type="checkbox"
                  checked={config.showPOC}
                  onChange={(e) => onUpdateConfig({ showPOC: e.target.checked })}
                  className="rounded text-[#00ff94] focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-[#e1e2e7] cursor-pointer">
                <span>Value Area (70%)</span>
                <input
                  type="checkbox"
                  checked={config.showValueArea}
                  onChange={(e) => onUpdateConfig({ showValueArea: e.target.checked })}
                  className="rounded text-[#00ff94] focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-[#e1e2e7] cursor-pointer">
                <span>Liquidity Walls</span>
                <input
                  type="checkbox"
                  checked={config.showLiquidityWalls}
                  onChange={(e) => onUpdateConfig({ showLiquidityWalls: e.target.checked })}
                  className="rounded text-[#00ff94] focus:ring-0 cursor-pointer"
                />
              </label>

              {/* Imbalance Ratio Slider */}
              <div className="space-y-1 pt-1 border-t border-[#272a2d]">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#99907f]">Imbalance Ratio</span>
                  <span className="text-[#ffd87f] font-bold">{config.imbalanceRatio}x ({(config.imbalanceRatio * 100).toFixed(0)}%)</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="5.0"
                  step="0.5"
                  value={config.imbalanceRatio}
                  onChange={(e) => onUpdateConfig({ imbalanceRatio: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-[#272a2d] rounded-lg appearance-none cursor-pointer accent-[#ffd87f]"
                />
              </div>

              {/* Heatmap Resolution */}
              <div className="space-y-1">
                <span className="text-[#99907f] text-[11px]">Heatmap Resolution</span>
                <div className="grid grid-cols-3 gap-1">
                  {(['low', 'med', 'ultra'] as const).map((res) => (
                    <button
                      key={res}
                      onClick={() => onUpdateConfig({ heatmapResolution: res })}
                      className={`py-1 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer ${
                        config.heatmapResolution === res
                          ? 'bg-[#f6be16]/20 text-[#f6be16] border border-[#f6be16]/40'
                          : 'bg-[#272a2d] text-[#99907f]'
                      }`}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
