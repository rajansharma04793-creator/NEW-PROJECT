import React from 'react';
import {
  X,
  Keyboard,
  Volume2,
  VolumeX,
  Zap,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

interface HotkeysVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  isVoiceAlertsEnabled: boolean;
  onToggleVoiceAlerts: (enabled: boolean) => void;
}

export const HotkeysVoiceModal: React.FC<HotkeysVoiceModalProps> = ({
  isOpen,
  onClose,
  isVoiceAlertsEnabled,
  onToggleVoiceAlerts,
}) => {
  if (!isOpen) return null;

  const hotkeysList = [
    { key: 'B', description: 'Focus Order Panel / Long Buy Order', category: 'Execution' },
    { key: 'S', description: 'Focus Order Panel / Short Sell Order', category: 'Execution' },
    { key: 'X', description: 'Instant Close / Panic Flatten All Positions', category: 'Risk' },
    { key: 'Shift + R', description: 'Open Risk Management & Position Sizer', category: 'Tools' },
    { key: 'Shift + W', description: 'Open Whale & Smart Money Radar', category: 'Intel' },
    { key: 'Shift + L', description: 'Open Liquidation Heatmap & Squeeze Radar', category: 'Intel' },
    { key: 'Shift + T', description: 'Open TWAP / DCA Algorithmic Slicer', category: 'Execution' },
    { key: 'Shift + P', description: 'Open Historical Bar Replay & Paper Simulator', category: 'Testing' },
    { key: 'Shift + B', description: 'Open No-Code Auto Strategy Bot Builder', category: 'Automation' },
    { key: 'Shift + D', description: 'Open Institutional Order Flow & CVD Delta', category: 'OrderFlow' },
    { key: 'Shift + J', description: 'Open Trade Journal & PnL Share Card', category: 'Analytics' },
    { key: 'M', description: 'Toggle Multi-Chart Grid View', category: 'Navigation' },
    { key: 'Esc', description: 'Close any active modal or dropdown', category: 'Navigation' },
  ];

  const playSampleVoice = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(
        'Alert: BTC Bullish Fair Value Gap filled at 96,400. Institutional buy wall active.'
      );
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#171a1d] border border-[#2b2f36] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2f36] bg-[#121417]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#38bdf8]/10 border border-[#38bdf8]/30 text-[#38bdf8]">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#fff8f1] font-mono tracking-wide">
                HOTKEYS & AI VOICE ASSISTANT
              </h2>
              <p className="text-xs text-[#8e9099] font-mono">
                Keyboard shortcuts for scalping speed & audio trade speech synthesizers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e9099] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Voice Synthesizer Toggle Box */}
        <div className="p-5 bg-[#14171a] border-b border-[#2b2f36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                isVoiceAlertsEnabled
                  ? 'bg-[#00ff94]/10 text-[#00ff94] border border-[#00ff94]/30'
                  : 'bg-[#272a2d] text-[#8e9099]'
              }`}
            >
              {isVoiceAlertsEnabled ? (
                <Volume2 className="w-5 h-5" />
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-[#fff8f1]">
                  Real-Time AI Voice Trading Copilot
                </span>
                {isVoiceAlertsEnabled && (
                  <span className="text-[10px] font-mono text-[#00ff94] bg-[#00ff94]/10 px-2 py-0.5 rounded border border-[#00ff94]/30">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-[#8e9099]">
                Audio announces high-confluence SMC signals, target fills, and stop-loss warnings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVoiceAlertsEnabled && (
              <button
                type="button"
                onClick={playSampleVoice}
                className="px-2.5 py-1 text-xs font-mono rounded bg-[#272a2d] hover:bg-[#37393d] text-[#ffd87f] border border-[#37393d] transition-colors cursor-pointer"
              >
                Test Voice
              </button>
            )}
            <button
              onClick={() => onToggleVoiceAlerts(!isVoiceAlertsEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                isVoiceAlertsEnabled
                  ? 'bg-[#00ff94] text-[#121417] shadow-sm'
                  : 'bg-[#272a2d] text-[#8e9099] hover:text-[#fff8f1]'
              }`}
            >
              {isVoiceAlertsEnabled ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>

        {/* Hotkeys Table */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2 max-h-[400px]">
          <span className="text-xs font-mono text-[#8e9099] uppercase tracking-wider block mb-3">
            Global Keyboard Shortcuts
          </span>

          {hotkeysList.map((hk) => (
            <div
              key={hk.key}
              className="p-2.5 rounded-lg bg-[#1c2024] border border-[#2b2f36] flex items-center justify-between font-mono text-xs"
            >
              <div className="flex items-center gap-3">
                <kbd className="px-2.5 py-1 rounded bg-[#272a2d] text-[#00ff94] border border-[#37393d] font-bold text-xs shadow-inner">
                  {hk.key}
                </kbd>
                <span className="text-[#fff8f1]">{hk.description}</span>
              </div>
              <span className="text-[10px] text-[#8e9099] px-2 py-0.5 rounded bg-[#14171a]">
                {hk.category}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#121417] border-t border-[#2b2f36] flex items-center justify-between text-xs font-mono text-[#8e9099]">
          <span>Press ESC anytime to dismiss modals</span>
          <span className="text-[#00ff94]">● Zero Execution Delay</span>
        </div>
      </div>
    </div>
  );
};
