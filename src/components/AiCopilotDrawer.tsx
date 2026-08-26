import React, { useState } from 'react';
import { AISignal, AssetPair, TickerInfo } from '../types';
import {
  Sparkles,
  BrainCircuit,
  X,
  Zap,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Play,
  Copy,
  Check,
  Filter,
  Sliders,
  Activity,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { requestAISignal, requestBatchMarketScan } from '../services/aiSignalService';
import { AiChatView } from './AiChatView';

interface AiCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  signals: AISignal[];
  currentPair: AssetPair;
  tickers: Record<AssetPair, TickerInfo>;
  onExecuteSignal: (signal: AISignal) => void;
  onSelectSignalForChart?: (signal: AISignal) => void;
  onAddNewSignal?: (signal: AISignal) => void;
  onUpdateSignals?: (signals: AISignal[]) => void;
  onSelectPair?: (pair: AssetPair) => void;
}

export const AiCopilotDrawer: React.FC<AiCopilotDrawerProps> = ({
  isOpen,
  onClose,
  signals,
  currentPair,
  tickers,
  onExecuteSignal,
  onSelectSignalForChart,
  onAddNewSignal,
  onUpdateSignals,
  onSelectPair,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'signals' | 'generator'>('chat');
  const [filterPair, setFilterPair] = useState<string>('ALL');
  const [filterSide, setFilterSide] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [filterTimeframe, setFilterTimeframe] = useState<string>('ALL');
  const [selectedStrategy, setSelectedStrategy] = useState<string>('Breakout Momentum');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('15m');
  const [selectedRiskProfile, setSelectedRiskProfile] = useState<string>('Balanced');
  const [targetAsset, setTargetAsset] = useState<AssetPair>(currentPair);
  const [generating, setGenerating] = useState(false);
  const [scanningAll, setScanningAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSignalId, setExpandedSignalId] = useState<string | null>(signals[0]?.id || null);
  const [lastGeneratedSource, setLastGeneratedSource] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerateSignal = async () => {
    setGenerating(true);
    try {
      const activeTicker = tickers[targetAsset] || tickers[currentPair];
      const newSignal = await requestAISignal({
        symbol: targetAsset,
        currentPrice: activeTicker.price,
        timeframe: selectedTimeframe,
        strategy: selectedStrategy,
        riskProfile: selectedRiskProfile,
        marketMetrics: {
          high24h: activeTicker.high24h,
          low24h: activeTicker.low24h,
          change24h: activeTicker.change24h,
          volume24h: activeTicker.volume24h,
        },
      });

      if (onAddNewSignal) {
        onAddNewSignal(newSignal);
      }
      setExpandedSignalId(newSignal.id);
      setActiveTab('signals');
      setLastGeneratedSource('Gemini 3.7 Flash & Quantitative Engine');
    } catch (err) {
      console.error('Error generating signal:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleScanAllMarkets = async () => {
    setScanningAll(true);
    try {
      const scannedSignals = await requestBatchMarketScan(tickers);
      if (onUpdateSignals && scannedSignals.length > 0) {
        onUpdateSignals(scannedSignals);
      }
      setActiveTab('signals');
    } catch (err) {
      console.error('Error scanning markets:', err);
    } finally {
      setScanningAll(false);
    }
  };

  const handleCopySignal = (sig: AISignal) => {
    const text = `🎯 LUMINA AI SIGNAL: ${sig.symbol} (${sig.side})
📊 Strategy: ${sig.strategy} | Timeframe: ${sig.timeframe}
✨ Conviction: ${sig.confidence}% | R:R: ${sig.riskReward}
---------------------------------
📍 Entry Price: $${sig.entryPrice} (Zone: $${sig.entryRange[0]} - $${sig.entryRange[1]})
🎯 Target 1: $${sig.target1} (+${sig.rewardPercent}%)
🎯 Target 2: $${sig.target2}
🛑 Stop Loss: $${sig.stopLoss} (-${sig.riskPercent}%)
⚡ Rec. Leverage: ${sig.recommendedLeverage}x
---------------------------------
📈 Technicals: RSI ${sig.technicalSupport.rsi} (${sig.technicalSupport.rsiSignal}) | MACD ${sig.technicalSupport.macd.trend} | EMA ${sig.technicalSupport.emaTrend}`;

    navigator.clipboard.writeText(text);
    setCopiedId(sig.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSignals = signals.filter((sig) => {
    if (filterPair !== 'ALL' && sig.symbol !== filterPair) return false;
    if (filterSide !== 'ALL' && sig.side !== filterSide) return false;
    if (filterTimeframe !== 'ALL' && sig.timeframe !== filterTimeframe) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs font-hanken">
      <div className="w-full max-w-xl md:max-w-2xl bg-[#111417] h-full border-l border-[#272a2d] shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 bg-[#191c1f] border-b border-[#272a2d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#00ff94]/15 text-[#00ff94] border border-[#00ff94]/30 shadow-[0_0_12px_rgba(0,255,148,0.2)]">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#fff8f1] text-sm tracking-tight">AI Copilot & Analyst</h3>
                <span className="text-[10px] px-2 py-0.5 bg-[#00ff94]/20 text-[#00ff94] rounded font-mono font-bold border border-[#00ff94]/30">
                  Gemini 3.7 + Quant
                </span>
              </div>
              <p className="text-[11px] text-[#99907f] font-mono">
                Conversational Market Intelligence, Indicator Breakdown & Buy/Sell Signals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Quick Scan Bar */}
        <div className="px-4 py-2 bg-[#14171a] border-b border-[#272a2d] flex items-center justify-between font-mono text-xs shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded transition-all font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'bg-[#00ff94] text-[#002111] shadow-[0_0_12px_rgba(0,255,148,0.25)]'
                  : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>AI Chat Analyst</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#002111] animate-ping" />
            </button>

            <button
              onClick={() => setActiveTab('signals')}
              className={`px-3 py-1.5 rounded transition-all font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'signals'
                  ? 'bg-[#f6be16] text-[#0b0e11]'
                  : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Signals ({signals.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('generator')}
              className={`px-3 py-1.5 rounded transition-all font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'generator'
                  ? 'bg-[#d0c5b3] text-[#0b0e11]'
                  : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Signal Tuner</span>
            </button>
          </div>

          <button
            onClick={handleScanAllMarkets}
            disabled={scanningAll}
            className="px-2.5 py-1 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[11px] text-[#d0c5b3] hover:text-[#fff8f1] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0 ml-2"
            title="Scan all CoinDCX pairs for high-probability signals"
          >
            <RefreshCw className={`w-3 h-3 text-[#00ff94] ${scanningAll ? 'animate-spin' : ''}`} />
            <span>Scan 9 Pairs</span>
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'chat' ? (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <AiChatView
              currentPair={currentPair}
              tickers={tickers}
              onSelectPair={onSelectPair}
              onExecuteSignal={(sig) => {
                onExecuteSignal(sig);
                if (onSelectSignalForChart) onSelectSignalForChart(sig);
              }}
              onSelectSignalForChart={onSelectSignalForChart}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
            {activeTab === 'generator' ? (
              /* Signal Generator Studio */
              <div className="space-y-4">
                <div className="p-3.5 bg-[#191c1f] rounded-lg border border-[#272a2d] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[#f6be16] font-bold text-xs">
                      <Sliders className="w-4 h-4" />
                      <span>Configure Quantitative Model</span>
                    </div>
                    <span className="text-[10px] text-[#00ff94] font-mono bg-[#00ff94]/10 px-2 py-0.5 rounded border border-[#00ff94]/20">
                      Live CoinDCX Feed
                    </span>
                  </div>

                  {/* Target Asset Selector */}
                  <div>
                    <label className="block text-[10px] text-[#99907f] uppercase font-bold mb-1">Target Asset</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {Object.keys(tickers).map((pair) => (
                        <button
                          key={pair}
                          onClick={() => {
                            const p = pair as AssetPair;
                            setTargetAsset(p);
                            onSelectPair?.(p);
                          }}
                          className={`py-1.5 px-2 rounded text-[11px] font-bold border transition-colors cursor-pointer text-center ${
                            targetAsset === pair
                              ? 'bg-[#f6be16]/20 border-[#f6be16] text-[#ffd87f]'
                              : 'bg-[#111417] border-[#272a2d] text-[#99907f] hover:text-[#fff8f1] hover:border-[#37393d]'
                          }`}
                        >
                          {pair.split('/')[0]}
                          <span className="block text-[9px] font-normal text-[#99907f]">
                            ${tickers[pair as AssetPair]?.price?.toFixed(tickers[pair as AssetPair]?.precision || 2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Strategy Selector */}
                  <div>
                    <label className="block text-[10px] text-[#99907f] uppercase font-bold mb-1">Algorithmic Strategy</label>
                    <select
                      value={selectedStrategy}
                      onChange={(e) => setSelectedStrategy(e.target.value)}
                      className="w-full py-2 px-3 bg-[#111417] border border-[#272a2d] rounded text-[#fff8f1] text-xs focus:outline-none focus:border-[#00ff94]"
                    >
                      <option value="CPR + 9/26 EMA Confluence">✨ CPR + 9/26 EMA Confluence (ADX & RSI Filtered, 1:2 R:R)</option>
                      <option value="Breakout Momentum">Breakout Momentum (Resistance Clearance)</option>
                      <option value="Smart Money Orderflow">Smart Money Orderflow (Institutional Accumulation)</option>
                      <option value="Mean Reversion Scalp">Mean Reversion Scalp (Overbought/Oversold)</option>
                      <option value="Fibonacci Pullback">Fibonacci Retracement (Golden Pocket 0.618)</option>
                      <option value="Trend Following">Trend Following (EMA 20/50/200 Stack)</option>
                    </select>
                  </div>

                  {/* Timeframe & Risk Profile */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-[#99907f] uppercase font-bold mb-1">Timeframe</label>
                      <div className="grid grid-cols-3 gap-1">
                        {['5m', '15m', '30m', '1h', '4h', '1D'].map((tf) => (
                          <button
                            key={tf}
                            onClick={() => setSelectedTimeframe(tf)}
                            className={`py-1 text-center text-[11px] font-mono rounded border transition-colors cursor-pointer ${
                              selectedTimeframe === tf
                                ? 'bg-[#00ff94]/20 border-[#00ff94] text-[#00ff94] font-bold shadow-[0_0_8px_rgba(0,255,148,0.2)]'
                                : 'bg-[#111417] border-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                            }`}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-[#99907f] uppercase font-bold mb-1">Risk Profile</label>
                      <div className="grid grid-cols-3 gap-1">
                        {['Conservative', 'Balanced', 'Aggressive'].map((rp) => (
                          <button
                            key={rp}
                            onClick={() => setSelectedRiskProfile(rp)}
                            className={`py-1 text-center text-[10px] rounded border transition-colors cursor-pointer ${
                              selectedRiskProfile === rp
                                ? 'bg-[#ffd87f]/20 border-[#ffd87f] text-[#ffd87f] font-bold'
                                : 'bg-[#111417] border-[#272a2d] text-[#99907f] hover:text-[#fff8f1]'
                            }`}
                          >
                            {rp.slice(0, 4)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateSignal}
                    disabled={generating}
                    className="w-full py-3 bg-[#00ff94] hover:bg-[#40e397] disabled:opacity-50 text-[#002111] font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_18px_rgba(0,255,148,0.3)] cursor-pointer"
                  >
                    <Zap className={`w-4 h-4 fill-current ${generating ? 'animate-bounce' : ''}`} />
                    <span>{generating ? 'Synthesizing Market Intelligence...' : `Generate Quantitative Signal (${selectedTimeframe}) for ${targetAsset}`}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Active Signals Feed */
              <div className="space-y-3">
                {/* Filter Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-[#99907f]" />
                    <span className="text-[11px] text-[#99907f]">Pair:</span>
                    <select
                      value={filterPair}
                      onChange={(e) => setFilterPair(e.target.value)}
                      className="bg-[#191c1f] text-[#fff8f1] border border-[#272a2d] rounded px-2 py-0.5 text-[11px] focus:outline-none"
                    >
                      <option value="ALL">All Pairs</option>
                      {Object.keys(tickers).map((pair) => (
                        <option key={pair} value={pair}>
                          {pair}
                        </option>
                      ))}
                    </select>

                    <span className="text-[11px] text-[#99907f] ml-1">TF:</span>
                    <select
                      value={filterTimeframe}
                      onChange={(e) => setFilterTimeframe(e.target.value)}
                      className="bg-[#191c1f] text-[#00ff94] border border-[#272a2d] rounded px-2 py-0.5 text-[11px] font-mono focus:outline-none"
                    >
                      <option value="ALL">All TF</option>
                      <option value="5m">5m</option>
                      <option value="15m">15m (Primary)</option>
                      <option value="1h">1h</option>
                      <option value="4h">4h</option>
                      <option value="1D">1D</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 bg-[#191c1f] p-0.5 rounded border border-[#272a2d]">
                    {(['ALL', 'LONG', 'SHORT'] as const).map((side) => (
                      <button
                        key={side}
                        onClick={() => setFilterSide(side)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                          filterSide === side
                            ? side === 'LONG'
                              ? 'bg-[#00ff94] text-[#002111]'
                              : side === 'SHORT'
                              ? 'bg-[#ff3b4a] text-[#ffffff]'
                              : 'bg-[#272a2d] text-[#fff8f1]'
                            : 'text-[#99907f] hover:text-[#fff8f1]'
                        }`}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Signal List */}
                {filteredSignals.length === 0 ? (
                  <div className="p-8 text-center bg-[#191c1f] rounded-lg border border-[#272a2d] text-[#99907f]">
                    <Sparkles className="w-8 h-8 text-[#99907f]/40 mx-auto mb-2" />
                    <p className="font-bold text-xs text-[#fff8f1]">No signals match criteria</p>
                    <p className="text-[11px] mt-1">Tap "Scan 9 Pairs" or ask the AI Chat Analyst to produce fresh signals.</p>
                  </div>
                ) : (
                  filteredSignals.map((sig) => {
                    const isExpanded = expandedSignalId === sig.id;
                    const isBullish = sig.side === 'LONG';
                    const currentTickerPrice = tickers[sig.symbol]?.price || sig.entryPrice;

                    return (
                      <div
                        key={sig.id}
                        className={`bg-[#191c1f] rounded-lg border transition-all overflow-hidden ${
                          isExpanded
                            ? isBullish
                              ? 'border-[#00ff94]/60 shadow-[0_0_15px_rgba(0,255,148,0.15)]'
                              : 'border-[#ff3b4a]/60 shadow-[0_0_15px_rgba(255,59,74,0.15)]'
                            : 'border-[#272a2d] hover:border-[#37393d]'
                        }`}
                      >
                        {/* Signal Summary Header */}
                        <div
                          onClick={() => setExpandedSignalId(isExpanded ? null : sig.id)}
                          className="p-3 cursor-pointer flex items-center justify-between gap-3 hover:bg-[#202327] transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`p-1.5 rounded font-bold text-xs flex items-center justify-center shrink-0 ${
                                isBullish
                                  ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                                  : 'bg-[#ff3b4a]/20 text-[#ff3b4a] border border-[#ff3b4a]/40'
                              }`}
                            >
                              {isBullish ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-[#fff8f1] truncate">{sig.symbol}</span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                                    isBullish ? 'bg-[#00ff94] text-[#002111]' : 'bg-[#ff3b4a] text-[#ffffff]'
                                  }`}
                                >
                                  {sig.side}
                                </span>
                                <span className="text-[10px] text-[#99907f] bg-[#111417] px-1.5 py-0.2 rounded border border-[#272a2d]">
                                  {sig.timeframe}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#99907f] truncate mt-0.5">{sig.strategy}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-right">
                            <div>
                              <div className="text-[11px] font-bold text-[#fff8f1]">${sig.entryPrice}</div>
                              <div className="text-[10px] text-[#00ff94] font-bold">{sig.confidence}% Conviction</div>
                            </div>
                            <span className="text-[#99907f] text-xs">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>

                        {/* Expanded Signal Details */}
                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 border-t border-[#272a2d] space-y-3 bg-[#16181b]">
                            {/* Execution Parameters Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                              <div className="p-2 bg-[#111417] rounded border border-[#272a2d]">
                                <span className="text-[#99907f] block text-[9px] uppercase">Entry Zone</span>
                                <span className="text-[#fff8f1] font-bold text-xs">${sig.entryPrice}</span>
                                <span className="text-[9px] text-[#99907f] block">${sig.entryRange[0]} - ${sig.entryRange[1]}</span>
                              </div>

                              <div className="p-2 bg-[#111417] rounded border border-[#00ff94]/30">
                                <span className="text-[#00ff94] block text-[9px] uppercase">Target 1</span>
                                <span className="text-[#00ff94] font-bold text-xs">${sig.target1}</span>
                                <span className="text-[9px] text-[#00ff94] block">+{sig.rewardPercent}%</span>
                              </div>

                              <div className="p-2 bg-[#111417] rounded border border-[#00ff94]/30">
                                <span className="text-[#00ff94] block text-[9px] uppercase">Target 2</span>
                                <span className="text-[#00ff94] font-bold text-xs">${sig.target2}</span>
                                <span className="text-[9px] text-[#ffd87f] block">Extended</span>
                              </div>

                              <div className="p-2 bg-[#111417] rounded border border-[#ff3b4a]/30">
                                <span className="text-[#ff3b4a] block text-[9px] uppercase">Stop Loss</span>
                                <span className="text-[#ff3b4a] font-bold text-xs">${sig.stopLoss}</span>
                                <span className="text-[9px] text-[#ff3b4a] block">-{sig.riskPercent}%</span>
                              </div>
                            </div>

                            {/* Risk:Reward and Leverage Metrics */}
                            <div className="flex items-center justify-between p-2 bg-[#111417] rounded border border-[#272a2d] text-[10px]">
                              <div>
                                <span className="text-[#99907f] block text-[9px]">Risk / Reward</span>
                                <span className="text-[#ffd87f] font-bold">{sig.riskReward}</span>
                              </div>
                              <div>
                                <span className="text-[#99907f] block text-[9px]">Rec. Leverage</span>
                                <span className="text-[#fff8f1] font-bold">{sig.recommendedLeverage}x Isolated</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[#99907f] block text-[9px]">Distance to Entry</span>
                                <span className="text-[#00ff94] font-bold">
                                  {Math.abs(((currentTickerPrice - sig.entryPrice) / sig.entryPrice) * 100).toFixed(2)}%
                                </span>
                              </div>
                            </div>

                            {/* Technical Confluence Support Matrix */}
                            <div className="space-y-1.5">
                              <div className="text-[10px] text-[#ffd87f] font-bold flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Activity className="w-3 h-3 text-[#ffd87f]" />
                                  <span>Technical Confluence Confirmation</span>
                                </div>
                                {sig.technicalSupport.cpr && (
                                  <span className="text-[9px] text-[#00ff94] font-mono bg-[#00ff94]/10 px-1.5 py-0.2 rounded border border-[#00ff94]/30">
                                    CPR Verified
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                                <div className="p-1.5 bg-[#111417] rounded border border-[#272a2d]">
                                  <span className="text-[#99907f] block text-[9px]">RSI (14)</span>
                                  <span className="text-[#fff8f1] font-bold">{sig.technicalSupport.rsi}</span>
                                  <span className="text-[9px] text-[#00ff94] block truncate">{sig.technicalSupport.rsiSignal}</span>
                                </div>
                                <div className="p-1.5 bg-[#111417] rounded border border-[#272a2d]">
                                  <span className="text-[#99907f] block text-[9px]">EMA / ADX</span>
                                  <span className="text-[#fff8f1] font-bold">
                                    {sig.technicalSupport.adx ? `ADX ${sig.technicalSupport.adx}` : sig.technicalSupport.macd.trend}
                                  </span>
                                  <span className="text-[9px] text-[#ffd87f] block truncate">
                                    {sig.technicalSupport.adx ? (sig.technicalSupport.adxTrending ? 'Trending (>20)' : 'Chop (<20)') : 'Momentum Active'}
                                  </span>
                                </div>
                                <div className="p-1.5 bg-[#111417] rounded border border-[#272a2d]">
                                  <span className="text-[#99907f] block text-[9px]">CPR / Pivot Status</span>
                                  <span className="text-[#fff8f1] font-bold truncate block">
                                    {sig.technicalSupport.cpr ? `TC $${sig.technicalSupport.cpr.tc}` : `$${sig.technicalSupport.pivotPoint || sig.technicalSupport.supportLevel}`}
                                  </span>
                                  <span className="text-[9px] text-[#00ff94] block truncate">
                                    {sig.technicalSupport.cpr ? sig.technicalSupport.cpr.status : sig.technicalSupport.emaTrend}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Step-by-Step Educational Trading Blueprint */}
                            <div className="p-3 bg-[#111417] rounded-lg border border-[#00ff94]/25 space-y-2 text-[11px] text-[#d0c5b3]">
                              <div className="font-bold text-[#00ff94] flex items-center justify-between pb-1 border-b border-[#272a2d]">
                                <div className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Step-by-Step Trading Guide (Trade Kaise Karein)</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectPair?.(sig.symbol as AssetPair);
                                    setActiveTab('chat');
                                  }}
                                  className="text-[10px] text-[#f6be16] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>AI se Poochhein ➔</span>
                                </button>
                              </div>
                              <div className="space-y-1.5 leading-relaxed font-sans text-xs">
                                <div>
                                  <strong className="text-[#fff8f1]">1. Entry:</strong>{' '}
                                  <span><strong>${sig.entryPrice}</strong> (Range: ${sig.entryRange[0]} - ${sig.entryRange[1]}) par Limit Order lagayein.</span>
                                </div>
                                <div>
                                  <strong className="text-[#ff3b4a]">2. Stop Loss (SL):</strong>{' '}
                                  <span><strong>${sig.stopLoss}</strong> par SL lagana mandatory hai taaki capital safe rahe (-{sig.riskPercent}%).</span>
                                </div>
                                <div>
                                  <strong className="text-[#f6be16]">3. Take Profit (TP1 & TP2):</strong>{' '}
                                  <span><strong>${sig.target1}</strong> (+{sig.rewardPercent}%) par 50% profit book karke SL ko Entry price par move karein.</span>
                                </div>
                                <div>
                                  <strong className="text-[#00ff94]">4. Safe Leverage:</strong>{' '}
                                  <span>Sirf <strong>{sig.recommendedLeverage}x Isolated</strong> use karein aur total account ka max <strong>1-2%</strong> risk karein.</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions: Execute 1-Click Trade & Copy Setup */}
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => {
                                  onExecuteSignal(sig);
                                  if (onSelectSignalForChart) onSelectSignalForChart(sig);
                                  onClose();
                                }}
                                className="flex-1 py-2.5 bg-[#00ff94] hover:bg-[#40e397] text-[#002111] font-bold rounded flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,255,148,0.25)] cursor-pointer text-xs uppercase"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Auto-Execute Trade</span>
                              </button>

                              <button
                                onClick={() => handleCopySignal(sig)}
                                className="px-3 py-2.5 bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[#fff8f1] rounded flex items-center justify-center transition-colors cursor-pointer"
                                title="Copy trade setup to clipboard"
                              >
                                {copiedId === sig.id ? (
                                  <Check className="w-4 h-4 text-[#00ff94]" />
                                ) : (
                                  <Copy className="w-4 h-4 text-[#99907f]" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-[#191c1f] border-t border-[#272a2d] flex items-center justify-between text-[10px] text-[#99907f] font-mono shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#00ff94] animate-pulse" />
            <span>AI Neural Engine Online</span>
          </div>
          <span>CoinDCX Latency: ~18ms</span>
        </div>
      </div>
    </div>
  );
};
