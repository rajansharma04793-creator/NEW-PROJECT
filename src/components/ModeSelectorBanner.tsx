import React, { useState, useEffect } from 'react';
import { ProductTradingMode } from '../types';
import { ShieldAlert, BookOpen, DollarSign, Lock, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ModeSelectorBannerProps {
  currentMode: ProductTradingMode;
  onModeChange: (mode: ProductTradingMode) => void;
  balance?: number;
  isStaleData?: boolean;
  dataSource?: string;
  dataTimestamp?: number;
}

export const ModeSelectorBanner: React.FC<ModeSelectorBannerProps> = ({
  currentMode,
  onModeChange,
  balance,
  isStaleData = false,
  dataSource = 'Unified Real-Time Exchange Feed',
  dataTimestamp = Date.now(),
}) => {
  const [showLiveRiskModal, setShowLiveRiskModal] = useState(false);
  const [agreedToRisk, setAgreedToRisk] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Keyboard Trap for ESC dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLiveRiskModal(false);
      }
    };
    if (showLiveRiskModal) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showLiveRiskModal]);

  const handleSelectMode = (mode: ProductTradingMode) => {
    if (mode === 'LIVE') {
      setShowLiveRiskModal(true);
      return;
    }
    onModeChange(mode);
  };

  const handleConfirmLiveMode = (e: React.FormEvent) => {
    e.preventDefault();
    // Compliance Guardrail #1: Real-money live trading execution is completely blocked.
    setAuthError('Live Real-Money Order Execution is locked by compliance policy (Fintech Principal Guardrail #1). Direct exchange execution gateways are disarmed. Use PAPER TRADING to simulate orders with zero capital risk.');
  };

  return (
    <aside aria-label="Trading Environment & Mode Status" className="border-b border-border/60 bg-background/95 backdrop-blur-md px-3 py-1.5 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Current Mode Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:inline">
            Environment:
          </span>

          {currentMode === 'RESEARCH' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono font-medium text-[11px]">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>RESEARCH ONLY — NO ORDERS WILL BE PLACED</span>
            </div>
          )}

          {currentMode === 'PAPER' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-medium text-[11px]">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              <span>PAPER TRADING — SIMULATED BALANCE — NO REAL MONEY</span>
            </div>
          )}

          {currentMode === 'LIVE' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-400 font-mono font-bold text-[11px] animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>LIVE TRADING — REAL MONEY — HIGH RISK</span>
            </div>
          )}

          {isStaleData && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Data Latency Warning (&gt;5s)
            </span>
          )}
        </div>

        {/* Right: Mode Switcher Buttons */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center rounded-lg bg-secondary/40 p-0.5 border border-border/50" role="group" aria-label="Trading Mode Selection">
            <button
              type="button"
              onClick={() => handleSelectMode('RESEARCH')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                currentMode === 'RESEARCH'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Research Mode: View charts, technicals, indicators, and historical signals. No trade execution allowed."
            >
              Research
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode('PAPER')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                currentMode === 'PAPER'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Paper Trading Mode: Risk-free simulated trading with simulated fills, slippage, and fees."
            >
              Paper Trading
            </button>
            <button
              type="button"
              onClick={() => handleSelectMode('LIVE')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                currentMode === 'LIVE'
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 shadow-sm'
                  : 'text-rose-400/80 hover:text-rose-300'
              }`}
              title="Live Trading Mode: Disabled by default. Requires strict authentication, step-up 2FA, and verified risk configuration."
            >
              <Lock className="w-3 h-3" />
              Live Trading
            </button>
          </div>

          <span className="text-[10px] text-muted-foreground hidden lg:inline font-mono">
            {dataSource} • {new Date(dataTimestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Live Trading Authorization & Risk Disclosure Modal */}
      {showLiveRiskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150" role="dialog" aria-modal="true" aria-labelledby="live-gate-title">
          <div className="relative w-full max-w-lg rounded-xl border border-rose-500/50 bg-[#0d1117] p-5 shadow-2xl text-left">
            <button
              type="button"
              onClick={() => setShowLiveRiskModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              aria-label="Close Live Trading Authorization Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h2 id="live-gate-title" className="text-base font-bold text-foreground">
                  Live Trading Authorization & Risk Gate
                </h2>
                <p className="text-xs text-rose-400 font-mono">Strict Compliance & Financial Protection Policy</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground border-y border-border/60 py-3 my-3">
              <div className="rounded-lg bg-rose-950/20 border border-rose-500/20 p-3 text-rose-200 leading-relaxed">
                <strong>Safety Policy Notice:</strong> Live trading involves substantial risk of loss. Leveraged derivatives magnify both gains and losses. You may lose some or all of your deposited margin. Past performance does not guarantee future results.
              </div>

              <div className="space-y-1.5">
                <h4 className="font-semibold text-foreground">Mandatory Requirements for Live Mode:</h4>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Exchange API credentials verified with trading permissions (withdrawal permissions strictly disabled).</li>
                  <li>Max leverage strictly capped at 3x for beginner / standard risk tiers.</li>
                  <li>Pre-trade order validation enforced on both frontend and backend engines.</li>
                  <li>Every order requires deliberate confirmation with full margin and fee breakdown.</li>
                </ul>
              </div>

              <form onSubmit={handleConfirmLiveMode} className="space-y-3 pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToRisk}
                    onChange={(e) => setAgreedToRisk(e.target.checked)}
                    className="mt-0.5 rounded border-rose-500 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-[11px] text-foreground font-medium">
                    I acknowledge that live trading uses real capital and entails high financial risk. I have reviewed and accepted the risk limits.
                  </span>
                </label>

                <div>
                  <label htmlFor="two-factor-code" className="block text-[11px] font-semibold text-foreground mb-1">
                    Step-Up 2FA / Authentication Code (Simulated Security Check)
                  </label>
                  <input
                    id="two-factor-code"
                    type="password"
                    placeholder="Enter 6-digit code (e.g. 123456)"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    maxLength={8}
                    className="w-full px-3 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border focus:border-rose-500 focus:outline-none font-mono"
                  />
                </div>

                {authError && (
                  <p className="text-xs text-rose-400 font-medium">{authError}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLiveRiskModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel (Remain in Paper Mode)
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Authorize & Unlock Live Mode
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
