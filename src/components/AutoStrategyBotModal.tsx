import React, { useState } from 'react';
import {
  X,
  Bot,
  Play,
  Pause,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Activity,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
} from 'lucide-react';
import { AssetPair } from '../types';

interface AutoStrategyBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: AssetPair;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface StrategyRule {
  id: string;
  indicator: 'RSI' | 'EMA_CROSS' | 'SMC_FVG' | 'SUPERTREND' | 'MACD';
  condition: 'less_than' | 'greater_than' | 'crosses_above' | 'crosses_below' | 'touches_zone';
  thresholdValue: string;
  timeframe: '5m' | '15m' | '1h' | '4h';
}

interface CustomBot {
  id: string;
  name: string;
  pair: AssetPair;
  action: 'BUY_LONG' | 'SELL_SHORT';
  rules: StrategyRule[];
  riskAllocationPercent: number;
  takeProfitPercent: number;
  stopLossPercent: number;
  trailingStopEnabled: boolean;
  status: 'active' | 'paused';
  totalExecutions: number;
  winRate: number;
}

export const AutoStrategyBotModal: React.FC<AutoStrategyBotModalProps> = ({
  isOpen,
  onClose,
  currentPair,
  onShowToast,
}) => {
  const [bots, setBots] = useState<CustomBot[]>([
    {
      id: 'bot-1',
      name: 'Smart Money 15m Scalper',
      pair: currentPair,
      action: 'BUY_LONG',
      rules: [
        {
          id: 'r-1',
          indicator: 'SMC_FVG',
          condition: 'touches_zone',
          thresholdValue: 'Bullish 15m FVG',
          timeframe: '15m',
        },
        {
          id: 'r-2',
          indicator: 'RSI',
          condition: 'less_than',
          thresholdValue: '38',
          timeframe: '15m',
        },
      ],
      riskAllocationPercent: 2,
      takeProfitPercent: 3.5,
      stopLossPercent: 1.2,
      trailingStopEnabled: true,
      status: 'active',
      totalExecutions: 14,
      winRate: 78.5,
    },
    {
      id: 'bot-2',
      name: 'Supertrend Trend Follower',
      pair: currentPair,
      action: 'BUY_LONG',
      rules: [
        {
          id: 'r-3',
          indicator: 'SUPERTREND',
          condition: 'crosses_above',
          thresholdValue: 'Bullish Turn (10, 3)',
          timeframe: '1h',
        },
      ],
      riskAllocationPercent: 1.5,
      takeProfitPercent: 5.0,
      stopLossPercent: 2.0,
      trailingStopEnabled: true,
      status: 'paused',
      totalExecutions: 8,
      winRate: 62.5,
    },
  ]);

  // Form states for creating a new bot
  const [newBotName, setNewBotName] = useState<string>('My Custom AI Bot');
  const [newBotAction, setNewBotAction] = useState<'BUY_LONG' | 'SELL_SHORT'>('BUY_LONG');
  const [rules, setRules] = useState<StrategyRule[]>([
    {
      id: 'rule-init',
      indicator: 'RSI',
      condition: 'less_than',
      thresholdValue: '30',
      timeframe: '15m',
    },
  ]);
  const [riskPercent, setRiskPercent] = useState<number>(2.0);
  const [tpPercent, setTpPercent] = useState<number>(4.0);
  const [slPercent, setSlPercent] = useState<number>(1.5);
  const [trailSl, setTrailSl] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleAddRule = () => {
    const newRule: StrategyRule = {
      id: `rule-${Date.now()}`,
      indicator: 'EMA_CROSS',
      condition: 'crosses_above',
      thresholdValue: 'EMA 20 > EMA 50',
      timeframe: '15m',
    };
    setRules((prev) => [...prev, newRule]);
  };

  const handleRemoveRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCreateBot = () => {
    const newBot: CustomBot = {
      id: `bot-${Date.now()}`,
      name: newBotName,
      pair: currentPair,
      action: newBotAction,
      rules,
      riskAllocationPercent: riskPercent,
      takeProfitPercent: tpPercent,
      stopLossPercent: slPercent,
      trailingStopEnabled: trailSl,
      status: 'active',
      totalExecutions: 0,
      winRate: 0,
    };

    setBots((prev) => [newBot, ...prev]);
    if (onShowToast) onShowToast(`Created & Activated ${newBotName}!`, 'success');
  };

  const handleToggleBot = (id: string) => {
    setBots((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: b.status === 'active' ? 'paused' : 'active' } : b))
    );
  };

  const handleDeleteBot = (id: string) => {
    setBots((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#171a1d] border border-[#2b2f36] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2b2f36] bg-[#121417]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#a855f7]/10 border border-[#a855f7]/30 text-[#a855f7]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#fff8f1] font-mono tracking-wide">
                  NO-CODE AUTOMATED STRATEGY BUILDER
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#a855f7]/20 text-[#a855f7] border border-[#a855f7]/40">
                  AI RULE ENGINE
                </span>
              </div>
              <p className="text-xs text-[#8e9099] font-mono">
                Build rule-based algorithmic bots with indicator triggers and automated risk management
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

        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* Builder Form (Left 6 Cols) */}
          <div className="md:col-span-6 p-6 border-r border-[#2b2f36] space-y-5 bg-[#14171a]">
            <div>
              <label className="text-[11px] font-mono text-[#8e9099] block mb-1">BOT NAME</label>
              <input
                type="text"
                value={newBotName}
                onChange={(e) => setNewBotName(e.target.value)}
                className="w-full bg-[#1c2024] border border-[#2b2f36] rounded px-3 py-2 text-xs font-mono text-[#fff8f1] focus:outline-none focus:border-[#a855f7]"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#8e9099] block mb-1">TRIGGER ACTION</label>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setNewBotAction('BUY_LONG')}
                  className={`py-2 rounded font-bold transition-colors cursor-pointer ${
                    newBotAction === 'BUY_LONG'
                      ? 'bg-[#00ff94] text-[#121417]'
                      : 'bg-[#272a2d] text-[#8e9099]'
                  }`}
                >
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setNewBotAction('SELL_SHORT')}
                  className={`py-2 rounded font-bold transition-colors cursor-pointer ${
                    newBotAction === 'SELL_SHORT'
                      ? 'bg-[#ff4d4d] text-[#121417]'
                      : 'bg-[#272a2d] text-[#8e9099]'
                  }`}
                >
                  SELL / SHORT
                </button>
              </div>
            </div>

            {/* Condition Rules Block */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-[#8e9099] uppercase">
                  Execution Conditions (IF Block)
                </span>
                <button
                  onClick={handleAddRule}
                  className="px-2 py-0.5 rounded bg-[#272a2d] hover:bg-[#37393d] text-[#a855f7] text-xs font-mono flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Rule
                </button>
              </div>

              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {rules.map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="p-2.5 rounded bg-[#1c2024] border border-[#2b2f36] flex items-center gap-2 font-mono text-xs"
                  >
                    <span className="text-[#a855f7] font-bold text-[10px]">
                      {idx === 0 ? 'IF' : 'AND'}
                    </span>
                    <select
                      value={rule.indicator}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setRules((prev) =>
                          prev.map((r) => (r.id === rule.id ? { ...r, indicator: val } : r))
                        );
                      }}
                      className="bg-[#272a2d] border border-[#37393d] rounded px-2 py-1 text-[11px] text-[#fff8f1]"
                    >
                      <option value="RSI">RSI</option>
                      <option value="EMA_CROSS">EMA Cross</option>
                      <option value="SMC_FVG">SMC Fair Value Gap</option>
                      <option value="SUPERTREND">Supertrend</option>
                    </select>

                    <select
                      value={rule.timeframe}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setRules((prev) =>
                          prev.map((r) => (r.id === rule.id ? { ...r, timeframe: val } : r))
                        );
                      }}
                      className="bg-[#272a2d] border border-[#37393d] rounded px-1.5 py-1 text-[11px] text-[#ffd87f]"
                    >
                      <option value="5m">5m</option>
                      <option value="15m">15m</option>
                      <option value="1h">1h</option>
                      <option value="4h">4h</option>
                    </select>

                    <input
                      type="text"
                      value={rule.thresholdValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRules((prev) =>
                          prev.map((r) => (r.id === rule.id ? { ...r, thresholdValue: val } : r))
                        );
                      }}
                      className="flex-1 bg-[#272a2d] border border-[#37393d] rounded px-2 py-1 text-[11px] text-[#fff8f1]"
                    />

                    {rules.length > 1 && (
                      <button
                        onClick={() => handleRemoveRule(rule.id)}
                        className="text-[#ff4d4d] hover:text-[#fff8f1] p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Risk, TP & SL Controls */}
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <div>
                <label className="text-[10px] text-[#8e9099] block mb-1">RISK / TRADE (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(Number(e.target.value))}
                  className="w-full bg-[#1c2024] border border-[#2b2f36] rounded px-2 py-1 text-[#fff8f1]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#8e9099] block mb-1">TAKE PROFIT (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={tpPercent}
                  onChange={(e) => setTpPercent(Number(e.target.value))}
                  className="w-full bg-[#1c2024] border border-[#2b2f36] rounded px-2 py-1 text-[#00ff94]"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#8e9099] block mb-1">STOP LOSS (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={slPercent}
                  onChange={(e) => setSlPercent(Number(e.target.value))}
                  className="w-full bg-[#1c2024] border border-[#2b2f36] rounded px-2 py-1 text-[#ff4d4d]"
                />
              </div>
            </div>

            <button
              onClick={handleCreateBot}
              className="w-full py-3 rounded-lg bg-[#a855f7] hover:bg-[#9333ea] text-[#fff8f1] font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>DEPLOY STRATEGY BOT</span>
            </button>
          </div>

          {/* Active Bots List (Right 6 Cols) */}
          <div className="md:col-span-6 p-6 space-y-4 bg-[#171a1d]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-[#fff8f1] uppercase">
                Active Deployed Bots ({bots.length})
              </span>
              <span className="text-xs font-mono text-[#00ff94]">Forward Testing Ready</span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {bots.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-xl bg-[#1c2024] border border-[#2b2f36] space-y-2.5 font-mono text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-[#a855f7]" />
                      <span className="font-bold text-[#fff8f1]">{b.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          b.action === 'BUY_LONG'
                            ? 'bg-[#00ff94]/15 text-[#00ff94]'
                            : 'bg-[#ff4d4d]/15 text-[#ff4d4d]'
                        }`}
                      >
                        {b.action}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleBot(b.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                          b.status === 'active'
                            ? 'bg-[#00ff94]/20 text-[#00ff94]'
                            : 'bg-[#ffd87f]/20 text-[#ffd87f]'
                        }`}
                      >
                        {b.status === 'active' ? <Play className="w-2.5 h-2.5 fill-current" /> : <Pause className="w-2.5 h-2.5" />}
                        {b.status.toUpperCase()}
                      </button>
                      <button
                        onClick={() => handleDeleteBot(b.id)}
                        className="text-[#8e9099] hover:text-[#ff4d4d] p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Rules overview */}
                  <div className="p-2 bg-[#14171a] rounded border border-[#272a2d] space-y-1 text-[11px] text-[#8e9099]">
                    {b.rules.map((r, i) => (
                      <div key={r.id}>
                        {i === 0 ? 'Trigger: ' : 'And: '}
                        <strong className="text-[#d0c5b3]">
                          [{r.timeframe}] {r.indicator} {r.condition.replace('_', ' ')} {r.thresholdValue}
                        </strong>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-[11px] text-[#8e9099] pt-1">
                    <span>
                      Risk: <strong className="text-[#fff8f1]">{b.riskAllocationPercent}%</strong> | TP: <strong className="text-[#00ff94]">+{b.takeProfitPercent}%</strong> | SL: <strong className="text-[#ff4d4d]">-{b.stopLossPercent}%</strong>
                    </span>
                    <span>
                      Win Rate: <strong className="text-[#00ff94]">{b.winRate}%</strong> ({b.totalExecutions} trades)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
