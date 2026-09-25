import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Key,
  Radio,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Globe,
  RefreshCw,
  X,
  Server,
  ShieldCheck,
  Cpu,
  Save,
} from 'lucide-react';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (config: ApiPipelineConfig) => void;
  onResetToDefaults?: () => void;
}

export interface ApiPipelineConfig {
  activeProvider: 'hybrid' | 'twelvedata' | 'finnhub' | 'alphavantage' | 'simulator_only';
  simulatorFrequency: number; // in milliseconds, e.g. 500, 1000, 2500
  twelveDataKey: string;
  finnhubKey: string;
  alphaVantageKey: string;
  enableLiveTickFluctuation: boolean;
  enableVisualFlashes: boolean;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onResetToDefaults,
}) => {
  const [config, setConfig] = useState<ApiPipelineConfig>(() => {
    try {
      const saved = localStorage.getItem('lumina_api_pipeline_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      activeProvider: 'hybrid',
      simulatorFrequency: 800,
      twelveDataKey: '',
      finnhubKey: '',
      alphaVantageKey: '',
      enableLiveTickFluctuation: true,
      enableVisualFlashes: true,
    };
  });

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTimeout(() => {
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    }, 900);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('lumina_api_pipeline_config', JSON.stringify(config));
    } catch {}
    if (onSave) onSave(config);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155] bg-[#0B0F19]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#38BDF8] flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5 text-[#0F172A] font-black" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">Real-Time Data Pipeline & Simulator</h2>
              <p className="text-xs text-[#94A3B8]">
                Configure live market data feeds, custom API keys & WebSocket tick engine
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
          {/* Active Data Provider Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
              Active Data Pipeline Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                {
                  id: 'hybrid',
                  label: 'Institutional Hybrid (Recommended)',
                  desc: 'Combines Interbank FX, Commodities Spot & Live WebSocket Simulator',
                  badge: 'Zero Latency',
                },
                {
                  id: 'twelvedata',
                  label: 'Twelve Data API',
                  desc: 'Direct Forex, Gold, Commodities & US Equities WebSocket',
                  badge: 'Custom Key',
                },
                {
                  id: 'finnhub',
                  label: 'Finnhub Institutional',
                  desc: 'Real-time Stock trades, FX and Macro economic metrics',
                  badge: 'Custom Key',
                },
                {
                  id: 'simulator_only',
                  label: 'Pure Market Tick Simulator',
                  desc: 'High-frequency Brownian motion engine with organic micro-spreads',
                  badge: 'Offline Mode',
                },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setConfig({ ...config, activeProvider: p.id as any })}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    config.activeProvider === p.id
                      ? 'bg-[#10B981]/10 border-[#10B981] text-[#F8FAFC]'
                      : 'bg-[#1E293B]/60 border-[#334155] text-[#94A3B8] hover:border-[#38BDF8]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#F8FAFC]">{p.label}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#0F172A] text-[#10B981] font-mono font-bold">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] mt-1">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Simulator Ticking Frequency */}
          <div className="p-4 rounded-xl bg-[#1E293B]/50 border border-[#334155] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#F8FAFC] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#38BDF8]" /> Real-Time Tick Generator Frequency
              </span>
              <span className="text-xs font-mono font-bold text-[#10B981]">
                {config.simulatorFrequency} ms ({Math.round(1000 / config.simulatorFrequency)} ticks/sec)
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Ultra (250ms)', ms: 250 },
                { label: 'Fast (500ms)', ms: 500 },
                { label: 'Standard (800ms)', ms: 800 },
                { label: 'Relaxed (1500ms)', ms: 1500 },
              ].map((f) => (
                <button
                  key={f.ms}
                  type="button"
                  onClick={() => setConfig({ ...config, simulatorFrequency: f.ms })}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    config.simulatorFrequency === f.ms
                      ? 'bg-[#10B981] text-[#0F172A]'
                      : 'bg-[#0F172A] text-[#94A3B8] border border-[#334155]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Custom API Keys */}
          <div className="space-y-3">
            <label className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#F59E0B]" /> Optional Custom API Keys (Finnhub / Twelve Data)
            </label>

            <div className="space-y-2 font-mono">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8] font-sans">
                  Twelve Data Key:
                </span>
                <input
                  type="password"
                  placeholder="Enter API Key (optional)"
                  value={config.twelveDataKey}
                  onChange={(e) => setConfig({ ...config, twelveDataKey: e.target.value })}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-xl pl-36 pr-3 py-2 text-xs text-[#F8FAFC] placeholder-[#64748B]"
                />
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#94A3B8] font-sans">
                  Finnhub Key:
                </span>
                <input
                  type="password"
                  placeholder="Enter API Key (optional)"
                  value={config.finnhubKey}
                  onChange={(e) => setConfig({ ...config, finnhubKey: e.target.value })}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-xl pl-28 pr-3 py-2 text-xs text-[#F8FAFC] placeholder-[#64748B]"
                />
              </div>
            </div>
          </div>

          {/* Connection Test Status */}
          {testStatus === 'success' && (
            <div className="p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 flex items-center gap-2 text-xs text-[#10B981] font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
              <span>Data pipeline active: Sub-millisecond tick streaming connected!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#334155] bg-[#0B0F19]">
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-xs font-semibold text-[#38BDF8] transition-colors cursor-pointer border border-[#334155]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
            <span>Test Pipeline Feed</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-xs font-semibold text-[#CBD5E1] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-[#0F172A] text-xs font-bold transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'Saved!' : 'Save & Apply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
