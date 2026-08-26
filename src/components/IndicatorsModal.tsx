import React, { useState } from 'react';
import { IndicatorDefinition, ActiveIndicatorState, IndicatorCategory } from '../types';
import { INDICATOR_CATALOG } from '../utils/indicators';
import {
  Search,
  Sliders,
  Check,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  Activity,
  BarChart2,
  Layers,
  X,
  RotateCcw,
} from 'lucide-react';

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeIndicators: ActiveIndicatorState[];
  onToggleIndicator: (id: string) => void;
  onUpdateParams: (id: string, params: Record<string, number | string>) => void;
  onUpdateColor: (id: string, color: string) => void;
}

const CATEGORIES: { key: 'all' | IndicatorCategory; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'all', label: 'All Indicators', icon: Layers },
  { key: 'trend', label: 'Trend & Moving Averages', icon: TrendingUp },
  { key: 'oscillators', label: 'Oscillators & Momentum', icon: Activity },
  { key: 'volatility', label: 'Volatility & Channels', icon: BarChart2 },
  { key: 'volume', label: 'Volume & Orderflow', icon: BarChart2 },
  { key: 'smart_money', label: 'Smart Money / SMC', icon: Sparkles },
];

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
  activeIndicators,
  onToggleIndicator,
  onUpdateParams,
  onUpdateColor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | IndicatorCategory>('all');
  const [editingIndicatorId, setEditingIndicatorId] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeMap = new Map(activeIndicators.map((a) => [a.indicatorId, a]));

  const filteredIndicators = INDICATOR_CATALOG.filter((ind) => {
    const matchesCategory =
      selectedCategory === 'all' || ind.category === selectedCategory;
    const matchesSearch =
      ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-mono">
      <div className="bg-[#14171a] border border-[#272a2d] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col h-[560px] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#272a2d] bg-[#191c1f]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#f6be16]/15 border border-[#f6be16]/30 flex items-center justify-center text-[#ffd87f] font-bold text-xs">
              fx
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#fff8f1]">Indicators, Metrics & Strategies</h2>
              <p className="text-[11px] text-[#99907f]">
                TradingView quantitative technical indicators & market overlays
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

        {/* Search & Tabs */}
        <div className="px-5 py-2.5 bg-[#16191c] border-b border-[#272a2d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#99907f]" />
            <input
              type="text"
              placeholder="Search (e.g. EMA, RSI, MACD, Supertrend)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111417] text-xs pl-8 pr-3 py-1.5 rounded-lg text-[#fff8f1] border border-[#272a2d] focus:border-[#f6be16] focus:outline-none placeholder-[#585c63]"
              autoFocus
            />
          </div>

          <div className="text-[11px] text-[#99907f] flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <span>
              Active on chart:{' '}
              <strong className="text-[#00ff94]">{activeIndicators.filter((i) => i.enabled).length}</strong>
            </span>
          </div>
        </div>

        {/* Main Content: Sidebar + Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Categories Sidebar */}
          <div className="w-52 border-r border-[#272a2d] bg-[#14171a] p-2 space-y-1 overflow-y-auto hidden sm:block">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#272a2d] text-[#ffd87f] font-bold border border-[#37393d]'
                      : 'text-[#99907f] hover:bg-[#191c1f] hover:text-[#fff8f1]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#ffd87f]' : 'text-[#99907f]'}`} />
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Indicators List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#111417]">
            {filteredIndicators.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#99907f]">
                No technical indicators found matching "{searchQuery}"
              </div>
            ) : (
              filteredIndicators.map((ind) => {
                const activeState = activeMap.get(ind.id);
                const isEnabled = activeState?.enabled || false;
                const isEditing = editingIndicatorId === ind.id;

                return (
                  <div
                    key={ind.id}
                    className={`border rounded-lg p-3 transition-all ${
                      isEnabled
                        ? 'bg-[#191c1f] border-[#00ff94]/30 shadow-xs'
                        : 'bg-[#14171a] border-[#272a2d] hover:border-[#37393d]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: activeState?.color || ind.color }}
                          />
                          <h3 className="text-xs font-bold text-[#fff8f1] truncate">{ind.name}</h3>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#272a2d] text-[#ffd87f]">
                            {ind.shortName}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1f2226] text-[#99907f] uppercase">
                            {ind.overlay ? 'Overlay' : 'Sub-chart'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#99907f] mt-1 leading-relaxed">{ind.description}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isEnabled && (
                          <button
                            onClick={() => setEditingIndicatorId(isEditing ? null : ind.id)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              isEditing
                                ? 'bg-[#f6be16]/20 text-[#ffd87f]'
                                : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d]'
                            }`}
                            title="Edit Parameters"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onToggleIndicator(ind.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isEnabled
                              ? 'bg-[#00ff94]/15 hover:bg-[#ff3b4a]/20 text-[#00ff94] hover:text-[#ff3b4a] border border-[#00ff94]/30 hover:border-[#ff3b4a]/40'
                              : 'bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] border border-[#37393d]'
                          }`}
                        >
                          {isEnabled ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Chart</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Parameter Config Panel when expanded */}
                    {isEditing && activeState && (
                      <div className="mt-3 pt-3 border-t border-[#272a2d] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#111417]/80 p-2.5 rounded-md">
                        {Object.entries(activeState.params).map(([key, val]) => (
                          <div key={key} className="flex flex-col gap-1">
                            <label className="text-[10px] text-[#99907f] uppercase font-bold">{key}</label>
                            <input
                              type="number"
                              value={val}
                              onChange={(e) => {
                                const num = parseFloat(e.target.value) || 0;
                                onUpdateParams(ind.id, {
                                  ...activeState.params,
                                  [key]: num,
                                });
                              }}
                              className="bg-[#191c1f] px-2 py-1 rounded text-[#fff8f1] border border-[#272a2d] focus:border-[#f6be16] focus:outline-none text-xs"
                            />
                          </div>
                        ))}

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-[#99907f] uppercase font-bold">Line Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={activeState.color}
                              onChange={(e) => onUpdateColor(ind.id, e.target.value)}
                              className="w-7 h-7 bg-transparent border-0 rounded cursor-pointer"
                            />
                            <span className="text-[11px] text-[#e1e2e7]">{activeState.color}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#191c1f] border-t border-[#272a2d] flex items-center justify-between text-xs">
          <span className="text-[#99907f] text-[11px]">
            💡 Indicators automatically update with real-time incoming tick data and timeframes
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#f6be16] hover:bg-[#ffd87f] text-[#0b0e11] font-bold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
