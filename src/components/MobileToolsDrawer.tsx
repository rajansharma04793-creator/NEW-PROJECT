import React from 'react';
import {
  X,
  History,
  Zap,
  Activity,
  Fish,
  Flame,
  Cpu,
  BookOpen,
  Scale,
  FlaskConical,
  Calendar,
  Send,
  BellRing,
  BrainCircuit,
  Wallet,
  Volume2,
  Sliders,
  Layers,
  Smartphone,
  Download,
  Target,
} from 'lucide-react';

interface MobileToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenModal: (modalName: string) => void;
  isVoiceAlertsEnabled: boolean;
  onToggleVoiceAlerts: (enabled: boolean) => void;
  autoAlertEnabled?: boolean;
  totalActiveAlerts?: number;
  onOpenInstallModal?: () => void;
}

export const MobileToolsDrawer: React.FC<MobileToolsDrawerProps> = ({
  isOpen,
  onClose,
  onOpenModal,
  isVoiceAlertsEnabled,
  onToggleVoiceAlerts,
  autoAlertEnabled = true,
  totalActiveAlerts = 0,
  onOpenInstallModal,
}) => {
  if (!isOpen) return null;

  const toolCategories = [
    {
      title: 'Strategy & Algorithmic Engines',
      tools: [
        {
          id: 'strategy_manager',
          name: 'Strategy Manager Dashboard',
          desc: 'Global strategy toggles, active indicators matrix & custom parameters',
          icon: Sliders,
          color: 'text-[#00ff94]',
          badge: 'Global Hub',
        },
        {
          id: 'strategy_hub',
          name: 'Strategy Hub & Multi-Crypto Scanner',
          desc: 'Scan all 30+ cryptos with any strategy or create custom',
          icon: Target,
          color: 'text-[#00ff94]',
          badge: 'Scanner',
        },
        {
          id: 'bar_replay',
          name: 'Bar Replay Simulator',
          desc: 'Historical rewind & paper trading',
          icon: History,
          color: 'text-[#ffd87f]',
          badge: 'Practice',
        },
        {
          id: 'auto_bot',
          name: 'No-Code Auto Bot Builder',
          desc: 'Automated strategy rule engine',
          icon: Zap,
          color: 'text-[#a855f7]',
          badge: 'Bot AI',
        },
        {
          id: 'algo_slicer',
          name: 'TWAP / DCA Algo Slicer',
          desc: 'Anti-MEV micro order execution',
          icon: Cpu,
          color: 'text-[#ffd87f]',
          badge: 'Exec',
        },
      ],
    },
    {
      title: 'Institutional Intelligence & Liquidity',
      tools: [
        {
          id: 'whale_tracker',
          name: 'Whale & Smart Money Radar',
          desc: 'Live $100k-$3M+ mega transactions',
          icon: Fish,
          color: 'text-[#00ff94]',
          badge: 'Radar',
        },
        {
          id: 'liquidation_heatmap',
          name: 'Liquidation Heatmap',
          desc: 'High-leverage squeeze magnets',
          icon: Flame,
          color: 'text-[#ff4d4d]',
          badge: 'Heatmap',
        },
        {
          id: 'orderflow_delta',
          name: 'Order Flow, CVD & OI',
          desc: 'Aggressive delta volume & open interest',
          icon: Activity,
          color: 'text-[#38bdf8]',
          badge: 'CVD',
        },
        {
          id: 'mtf_matrix',
          name: 'Multi-Timeframe Matrix',
          desc: '1m, 5m, 15m, 1h, 4h trend scanner',
          icon: Layers,
          color: 'text-[#00ff94]',
          badge: 'MTF',
        },
        {
          id: 'arbitrage',
          name: 'Cross-Exchange Arbitrage',
          desc: 'CoinDCX vs Binance vs Bybit spreads',
          icon: Scale,
          color: 'text-[#ffd87f]',
          badge: 'Spread',
        },
      ],
    },
    {
      title: 'Quantitative & Risk Management',
      tools: [
        {
          id: 'risk_calc',
          name: 'Risk Sizer & Position Calculator',
          desc: 'Strict 1-3% capital risk modeling',
          icon: Sliders,
          color: 'text-[#00ff94]',
          badge: 'Risk',
        },
        {
          id: 'backtester',
          name: 'Strategy Backtester Engine',
          desc: 'Historical win-rate & Sharpe metrics',
          icon: FlaskConical,
          color: 'text-[#ffd87f]',
          badge: 'Quant',
        },
        {
          id: 'trade_journal',
          name: 'Trade Journal & PnL Share Card',
          desc: 'Psychology coach & shareable ROI',
          icon: BookOpen,
          color: 'text-[#d0c5b3]',
          badge: 'Journal',
        },
        {
          id: 'eco_calendar',
          name: 'Macro Volatility Calendar',
          desc: 'FOMC, CPI, and token unlock countdowns',
          icon: Calendar,
          color: 'text-[#f6be16]',
          badge: 'Macro',
        },
      ],
    },
    {
      title: 'Signals & Integrations',
      tools: [
        {
          id: 'webhooks',
          name: 'Discord & Telegram Webhooks',
          desc: 'Automated trade alert dispatchers',
          icon: Send,
          color: 'text-[#38bdf8]',
          badge: 'Alerts',
        },
        {
          id: 'hotkeys_voice',
          name: 'Hotkeys & AI Voice Settings',
          desc: 'Audio copilot & scalping controls',
          icon: Volume2,
          color: 'text-[#38bdf8]',
          badge: 'Voice',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop tap to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Content */}
      <div className="w-full max-h-[85vh] bg-[#14171a] border-t border-[#2b2f36] rounded-t-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[#272a2d] bg-[#111417] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#00ff94]/15 border border-[#00ff94]/30 text-[#00ff94]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#fff8f1] font-mono">
                INSTITUTIONAL TOOLKIT
              </h2>
              <p className="text-[11px] text-[#8e9099] font-mono">
                Select any pro feature, radar, or simulation engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#8e9099] hover:text-[#fff8f1] hover:bg-[#272a2d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Top Toggle Bar */}
        <div className="px-5 py-2.5 bg-[#181c20] border-b border-[#272a2d] flex items-center justify-between font-mono text-xs gap-2">
          {onOpenInstallModal && (
            <button
              onClick={() => {
                onClose();
                onOpenInstallModal();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00ff94]/15 hover:bg-[#00ff94]/25 border border-[#00ff94]/40 text-[#00ff94] font-bold text-xs transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install Mobile App</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[#8e9099] text-[11px]">AI Voice:</span>
            <button
              onClick={() => onToggleVoiceAlerts(!isVoiceAlertsEnabled)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                isVoiceAlertsEnabled
                  ? 'bg-[#00ff94] text-[#111417] shadow-sm'
                  : 'bg-[#272a2d] text-[#8e9099]'
              }`}
            >
              {isVoiceAlertsEnabled ? 'VOICE ON' : 'VOICE OFF'}
            </button>
          </div>
        </div>

        {/* Scrollable Tool List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {toolCategories.map((cat) => (
            <div key={cat.title} className="space-y-2">
              <h3 className="text-[11px] font-mono font-bold text-[#8e9099] uppercase tracking-wider px-1">
                {cat.title}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {cat.tools.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        onOpenModal(t.id);
                        onClose();
                      }}
                      className="w-full p-3 rounded-xl bg-[#1c2024] hover:bg-[#252a30] active:bg-[#2b3038] border border-[#2b2f36] flex items-center justify-between text-left transition-all cursor-pointer font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-[#272a2d] border border-[#37393d] ${t.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#fff8f1] flex items-center gap-2">
                            <span>{t.name}</span>
                          </div>
                          <span className="text-[10px] text-[#8e9099] block mt-0.5">
                            {t.desc}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded bg-[#272a2d] text-[10px] text-[#d0c5b3] border border-[#37393d]">
                        {t.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Safe Area Footer Padding for iOS/Android bottom bars */}
        <div className="p-3 bg-[#111417] border-t border-[#272a2d] text-center font-mono text-[11px] text-[#8e9099]">
          CoinDCX Pro Mobile Terminal • Tap anywhere outside to dismiss
        </div>
      </div>
    </div>
  );
};
