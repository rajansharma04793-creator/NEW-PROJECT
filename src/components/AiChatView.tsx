import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  AIChatMessage,
  AIChatTradeSignal,
  AssetPair,
  TickerInfo,
  AISignal,
} from '../types';
import { sendChatMessage } from '../services/aiChatService';
import {
  BrainCircuit,
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Play,
  Copy,
  Check,
  RotateCcw,
  Target,
  ShieldAlert,
  BarChart2,
  Zap,
  Activity,
  Layers,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AiChatViewProps {
  currentPair: AssetPair;
  tickers: Record<AssetPair, TickerInfo>;
  onSelectPair?: (pair: AssetPair) => void;
  onExecuteSignal: (signal: AISignal) => void;
  onSelectSignalForChart?: (signal: AISignal) => void;
}

const INITIAL_MESSAGES: AIChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    timestamp: Date.now() - 60000,
    text: `👋 **Welcome to Lumina AI Market Analyst & Trading Copilot!**

I am powered by **Gemini 3.7 Flash** combined with our **Quantitative Algorithmic Engine** to provide institutional-grade real-time market analysis, indicators breakdown, and explicit **BUY** or **SELL** trade setups.

💡 *Ask me anything about any asset, request a technical breakdown (RSI, MACD, EMAs, Orderflow), or tap any quick prompt below to generate an instant signal.*`,
  },
];

export const AiChatView: React.FC<AiChatViewProps> = ({
  currentPair,
  tickers,
  onSelectPair,
  onExecuteSignal,
  onSelectSignalForChart,
}) => {
  const [messages, setMessages] = useState<AIChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('lumina_ai_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_MESSAGES;
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetPair>(currentPair);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('15m');
  const [executedSignalIds, setExecutedSignalIds] = useState<Record<string, boolean>>({});
  const [expandedGuideIds, setExpandedGuideIds] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync selected asset with parent pair change
  useEffect(() => {
    setSelectedAsset(currentPair);
  }, [currentPair]);

  // Persist chat messages
  useEffect(() => {
    try {
      localStorage.setItem('lumina_ai_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const activeTicker = tickers[selectedAsset] || {
    price: 2427.52,
    change24h: 1.84,
    high24h: 2490,
    low24h: 2380,
    precision: 2,
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || loading) return;

    const userMsg: AIChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const response = await sendChatMessage({
        messages: [...messages, userMsg],
        userMessage: query,
        currentPair: selectedAsset,
        tickers,
        timeframe: selectedTimeframe,
      });

      const assistantMsg: AIChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: Date.now(),
        tradeSignal: response.tradeSignal,
        metrics: response.metrics,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Error sending chat message:', err);
      const errorMsg: AIChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Analysis Engine Alert**: Encountered a momentary network interruption. Please try asking again.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem('lumina_ai_chat_history');
    } catch {}
  };

  // Convert Chat Trade Signal to full AISignal structure for terminal order execution
  const convertChatSignalToAISignal = (
    chatSig: AIChatTradeSignal,
    msgId: string
  ): AISignal => {
    const sym = chatSig.symbol || selectedAsset;
    const ticker = tickers[sym] || activeTicker;
    const entry = chatSig.entryPrice || ticker.price;
    const isBuy = chatSig.action === 'BUY';

    return {
      id: `SIG-CHAT-${Date.now().toString(36).toUpperCase()}`,
      symbol: sym,
      title: `${isBuy ? 'Bullish' : 'Bearish'} AI Chat Execution`,
      side: isBuy ? 'LONG' : 'SHORT',
      type: isBuy ? 'BULLISH_BREAKOUT' : 'SHORT_REVERSAL',
      confidence: chatSig.confidence || 92,
      timeframe: chatSig.timeframe || '15m',
      entryPrice: entry,
      entryRange: chatSig.entryRange || [
        +(entry * (isBuy ? 0.998 : 1.000)).toFixed(ticker.precision || 2),
        +(entry * (isBuy ? 1.002 : 1.002)).toFixed(ticker.precision || 2),
      ],
      target1: chatSig.target1,
      target2: chatSig.target2,
      target3: chatSig.target3 || chatSig.target2,
      stopLoss: chatSig.stopLoss,
      riskReward: chatSig.riskReward || '1 : 3.4',
      riskPercent: +Math.abs(((chatSig.stopLoss - entry) / entry) * 100).toFixed(2),
      rewardPercent: +Math.abs(((chatSig.target1 - entry) / entry) * 100).toFixed(2),
      recommendedLeverage: chatSig.leverage || 10,
      strategy: chatSig.strategy || 'AI Chat Quantitative Strategy',
      description: chatSig.reasoning || `${chatSig.action} signal generated by Lumina AI Analyst`,
      rationale: chatSig.reasoning || 'RSI, MACD & Delta confluence with strict invalidation boundaries.',
      technicalSupport: {
        rsi: 50,
        rsiSignal: isBuy ? 'Bullish Divergence' : 'Overbought',
        macd: {
          macd: 1.5,
          signal: 0.9,
          histogram: 0.6,
          trend: isBuy ? 'Bullish Expansion' : 'Bearish Cross',
        },
        emaTrend: isBuy ? 'Bullish Stack (20>50>200)' : 'Bearish Stack (20<50<200)',
        ema20: +(entry * (isBuy ? 0.995 : 1.005)).toFixed(ticker.precision || 2),
        ema50: +(entry * (isBuy ? 0.985 : 1.015)).toFixed(ticker.precision || 2),
        ema200: +(entry * (isBuy ? 0.965 : 1.035)).toFixed(ticker.precision || 2),
        supportLevel: isBuy ? chatSig.stopLoss : +(entry * 0.96).toFixed(ticker.precision || 2),
        resistanceLevel: isBuy ? chatSig.target1 : chatSig.stopLoss,
        atr: +(entry * 0.016).toFixed(ticker.precision || 2),
        orderflowImbalance: isBuy ? '+72% Buyer Absorption' : '+68% Seller Delta',
        volumeSurge: '2.1x 20-MA',
        pivotPoint: entry,
        fibonacci382: +(entry * (isBuy ? 1.02 : 0.98)).toFixed(ticker.precision || 2),
        fibonacci618: +(entry * (isBuy ? 1.05 : 0.95)).toFixed(ticker.precision || 2),
      },
      timestamp: Date.now(),
      active: true,
    };
  };

  const handleExecuteTrade = (chatSig: AIChatTradeSignal, msgId: string) => {
    const fullSignal = convertChatSignalToAISignal(chatSig, msgId);
    onExecuteSignal(fullSignal);
    setExecutedSignalIds((prev) => ({ ...prev, [msgId]: true }));

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7, x: 0.8 },
        colors: chatSig.action === 'BUY' ? ['#00ff94', '#61feaf', '#ffffff'] : ['#ff3b4a', '#ffd2d1', '#ffffff'],
      });
    } catch {}
  };

  const handlePlotOnChart = (chatSig: AIChatTradeSignal, msgId: string) => {
    const fullSignal = convertChatSignalToAISignal(chatSig, msgId);
    if (onSelectSignalForChart) {
      onSelectSignalForChart(fullSignal);
    }
  };

  const handleCopySetup = (chatSig: AIChatTradeSignal, msgId: string) => {
    const text = `🎯 LUMINA AI TRADE SETUP: ${chatSig.symbol}
Action: ${chatSig.action} (Confidence: ${chatSig.confidence}%)
Timeframe: ${chatSig.timeframe || '15m'} | Strategy: ${chatSig.strategy || 'Quantitative'}
------------------------------------
Entry Price: $${chatSig.entryPrice}
Target 1: $${chatSig.target1}
Target 2: $${chatSig.target2}
${chatSig.target3 ? `Target 3: $${chatSig.target3}\n` : ''}Stop Loss: $${chatSig.stopLoss}
Risk/Reward: ${chatSig.riskReward} | Leverage: ${chatSig.leverage || 10}x`;

    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Quick Prompt Chips
  const promptChips = [
    {
      label: `⚡ 15m Scalp & Orderflow (${selectedAsset.split('/')[0]})`,
      query: `Evaluate ${selectedAsset} on the 15-minute (15m) timeframe: Check 15m CPR Pivot levels, 9/26 EMA crossover, Buyer vs Seller Delta, and generate a 15m scalp trade setup with Entry, SL, and TP.`,
    },
    {
      label: `🎯 15m CPR + 9/26 EMA Confluence`,
      query: `Evaluate ${selectedAsset} on ${selectedTimeframe} using the CPR + 9/26 EMA Confluence Strategy: Check CPR (TC, Pivot, BC), 9/26 EMA crossover, ADX 14 trend filter (>20), RSI 14 band, and ATR-based 1.5x SL / 3.0x TP (1:2 R:R) trade setup.`,
    },
    {
      label: `💡 Strategy & Trading Guide (Hindi/Hinglish)`,
      query: `Explain the current 15m trading strategy for ${selectedAsset} in simple Hindi/Hinglish with a step-by-step guide on how to trade (Entry, Stop Loss, TP1/TP2 profit booking, and risk rules).`,
    },
    {
      label: `🟢 15m BUY / SELL Signal for ${selectedAsset.split('/')[0]}`,
      query: `Give me a clear BUY or SELL trading signal for ${selectedAsset} on ${selectedTimeframe} chart with exact Entry, TP1, TP2, Stop Loss, and Risk/Reward ratio.`,
    },
    {
      label: `📍 Entry, Stop Loss & TP Levels`,
      query: `Mujhe ${selectedAsset} (${selectedTimeframe}) ke exact Entry Zone, Stop Loss level, aur Take Profit targets detail mein batao.`,
    },
    {
      label: `📦 15m Order Blocks & FVG (SMC)`,
      query: `Identify 15m institutional Order Blocks, Fair Value Gaps (FVG), and liquidity pools for ${selectedAsset}.`,
    },
    {
      label: `📊 RSI, MACD & EMA Status (${selectedTimeframe})`,
      query: `Perform a deep technical indicator breakdown for ${selectedAsset} on the ${selectedTimeframe} timeframe covering RSI (14), MACD histogram momentum, and EMA ribbon.`,
    },
    {
      label: `🛡️ Risk Management & Safe Leverage`,
      query: `What is the safest leverage and position sizing formula for trading ${selectedAsset} to avoid liquidation?`,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#111417] text-[#fff8f1] font-hanken">
      {/* Top Asset, Timeframe & Price Bar */}
      <div className="px-3.5 py-2.5 bg-[#191c1f] border-b border-[#272a2d] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <label className="text-[11px] text-[#99907f] font-mono font-medium">Pair:</label>
          <div className="relative">
            <select
              value={selectedAsset}
              onChange={(e) => {
                const pair = e.target.value as AssetPair;
                setSelectedAsset(pair);
                onSelectPair?.(pair);
              }}
              className="appearance-none bg-[#111417] text-[#00ff94] border border-[#272a2d] hover:border-[#00ff94]/50 rounded px-2.5 py-1 pr-7 text-xs font-mono font-bold focus:outline-none cursor-pointer"
            >
              {Object.keys(tickers).map((pair) => (
                <option key={pair} value={pair}>
                  {pair} (${tickers[pair as AssetPair]?.price?.toFixed(tickers[pair as AssetPair]?.precision || 2)})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#99907f] absolute right-2 top-2 pointer-events-none" />
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-[#111417] p-0.5 rounded border border-[#272a2d]">
            {(['5m', '15m', '30m', '1h', '4h', '1D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                  selectedTimeframe === tf
                    ? 'bg-[#00ff94] text-[#002111] shadow-[0_0_8px_rgba(0,255,148,0.4)]'
                    : 'text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d]'
                }`}
                title={`Analyze ${selectedAsset} on ${tf} timeframe`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#111417] rounded border border-[#272a2d]">
            <span className="text-[#99907f] text-[11px]">Live:</span>
            <span className="font-bold text-[#fff8f1]">
              ${activeTicker.price.toFixed(activeTicker.precision || 2)}
            </span>
            <span
              className={`text-[11px] font-bold ${
                activeTicker.change24h >= 0 ? 'text-[#00ff94]' : 'text-[#ff3b4a]'
              }`}
            >
              {activeTicker.change24h >= 0 ? `+${activeTicker.change24h.toFixed(2)}%` : `${activeTicker.change24h.toFixed(2)}%`}
            </span>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-1.5 text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] rounded transition-colors"
            title="Clear Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Prompt Carousel */}
      <div className="px-3.5 py-2 bg-[#14171a] border-b border-[#272a2d] overflow-x-auto flex items-center gap-1.5 no-scrollbar shrink-0">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip.query)}
            disabled={loading}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#191c1f] hover:bg-[#272a2d] border border-[#272a2d] hover:border-[#00ff94]/40 text-[11px] font-mono text-[#d0c5b3] hover:text-[#fff8f1] transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-[#99907f] px-1">
                {isUser ? (
                  <span>You</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#00ff94]" />
                    <span className="text-[#00ff94] font-bold">Lumina AI Analyst</span>
                  </div>
                )}
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[92%] p-3.5 rounded-xl border leading-relaxed ${
                  isUser
                    ? 'bg-[#1e2329] border-[#37393d] text-[#fff8f1] rounded-br-xs'
                    : 'bg-[#191c1f] border-[#272a2d] text-[#e0d8cc] rounded-bl-xs shadow-lg'
                }`}
              >
                {/* Markdown content with custom styled typography */}
                <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-2 font-mono">
                  <Markdown
                    components={{
                      h3: ({ children }) => (
                        <h3 className="text-sm font-bold text-[#fff8f1] border-b border-[#272a2d] pb-1 mt-2 mb-1.5 flex items-center gap-1.5">
                          {children}
                        </h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="text-xs font-bold text-[#f6be16] mt-2 mb-1">
                          {children}
                        </h4>
                      ),
                      p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="text-[#fff8f1] font-bold">{children}</strong>,
                      code: ({ children }) => (
                        <code className="px-1.5 py-0.5 bg-[#111417] text-[#00ff94] rounded text-[11px] border border-[#272a2d]">
                          {children}
                        </code>
                      ),
                      ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-1">{children}</ol>,
                      li: ({ children }) => <li className="text-[#d0c5b3]">{children}</li>,
                    }}
                  >
                    {msg.text}
                  </Markdown>
                </div>

                {/* Structured Interactive Trade Signal Card (If present in message) */}
                {msg.tradeSignal && (
                  <div className="mt-3.5 pt-3 border-t border-[#272a2d] bg-[#111417]/80 rounded-lg p-3 border border-[#37393d]/80 space-y-2.5">
                    {/* Header: Action & Conviction */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-2.5 py-1 rounded text-xs font-extrabold flex items-center gap-1.5 tracking-wider ${
                            msg.tradeSignal.action === 'BUY'
                              ? 'bg-[#00ff94] text-[#002111] shadow-[0_0_12px_rgba(0,255,148,0.3)]'
                              : msg.tradeSignal.action === 'SELL'
                              ? 'bg-[#ff3b4a] text-[#ffffff] shadow-[0_0_12px_rgba(255,59,74,0.3)]'
                              : 'bg-[#f6be16] text-[#0b0e11]'
                          }`}
                        >
                          {msg.tradeSignal.action === 'BUY' ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : msg.tradeSignal.action === 'SELL' ? (
                            <TrendingDown className="w-3.5 h-3.5" />
                          ) : (
                            <Activity className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {msg.tradeSignal.action === 'BUY'
                              ? 'BUY / LONG'
                              : msg.tradeSignal.action === 'SELL'
                              ? 'SELL / SHORT'
                              : 'WAIT / HOLD'}
                          </span>
                        </div>

                        <span className="text-[10px] text-[#00ff94] bg-[#00ff94]/10 border border-[#00ff94]/30 px-2 py-0.5 rounded font-bold">
                          {msg.tradeSignal.confidence}% Conviction
                        </span>
                      </div>

                      <span className="text-[10px] text-[#99907f] uppercase font-mono">
                        {msg.tradeSignal.symbol} • {msg.tradeSignal.timeframe || '15m'}
                      </span>
                    </div>

                    {/* Price Matrix Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] pt-1">
                      <div className="p-2 bg-[#191c1f] rounded border border-[#272a2d]">
                        <span className="block text-[9px] text-[#99907f] uppercase font-bold">Entry Level</span>
                        <span className="font-bold text-[#fff8f1]">
                          ${msg.tradeSignal.entryPrice}
                        </span>
                      </div>
                      <div className="p-2 bg-[#191c1f] rounded border border-[#272a2d]">
                        <span className="block text-[9px] text-[#00ff94] uppercase font-bold">Target 1</span>
                        <span className="font-bold text-[#00ff94]">
                          ${msg.tradeSignal.target1}
                        </span>
                      </div>
                      <div className="p-2 bg-[#191c1f] rounded border border-[#272a2d]">
                        <span className="block text-[9px] text-[#00ff94] uppercase font-bold">Target 2</span>
                        <span className="font-bold text-[#00ff94]">
                          ${msg.tradeSignal.target2}
                        </span>
                      </div>
                      <div className="p-2 bg-[#191c1f] rounded border border-[#272a2d]">
                        <span className="block text-[9px] text-[#ff3b4a] uppercase font-bold">Stop Loss</span>
                        <span className="font-bold text-[#ff3b4a]">
                          ${msg.tradeSignal.stopLoss}
                        </span>
                      </div>
                    </div>

                    {/* Meta bar: Leverage & R:R & Guide Toggle */}
                    <div className="flex items-center justify-between text-[10px] text-[#99907f] px-1 pt-0.5">
                      <span>R:R Ratio: <strong className="text-[#f6be16]">{msg.tradeSignal.riskReward}</strong></span>
                      <span>Rec. Leverage: <strong className="text-[#fff8f1]">{msg.tradeSignal.leverage || 10}x</strong></span>
                      <button
                        type="button"
                        onClick={() => setExpandedGuideIds((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                        className="text-[#00ff94] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{expandedGuideIds[msg.id] ? 'Hide Guide ▲' : '📖 Kaise Trade Karein? ▼'}</span>
                      </button>
                    </div>

                    {/* Expandable Step-by-Step Hindi / Hinglish Trading Blueprint */}
                    {expandedGuideIds[msg.id] && (
                      <div className="p-3 bg-[#16181b] rounded-lg border border-[#00ff94]/30 space-y-2 text-[11px] text-[#d0c5b3]">
                        <div className="font-bold text-[#00ff94] flex items-center gap-1.5 pb-1 border-b border-[#272a2d]">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Step-by-Step Trading & Risk Blueprint</span>
                        </div>
                        <div className="space-y-1.5 leading-relaxed">
                          <div>
                            <span className="text-[#fff8f1] font-bold">1️⃣ Entry Lagayein:</span>{' '}
                            <span><strong>${msg.tradeSignal.entryPrice}</strong> ke pass Limit Order set karein. Market price par chase karne ke bajaye entry range ka intezar karein.</span>
                          </div>
                          <div>
                            <span className="text-[#ff3b4a] font-bold">2️⃣ Stop Loss (SL) Active Rakhein:</span>{' '}
                            <span><strong>${msg.tradeSignal.stopLoss}</strong> par SL order lagayein. Agar price iske neeche/upar jati hai toh trade fail hai, capital bachana sabse pehla kaam hai.</span>
                          </div>
                          <div>
                            <span className="text-[#f6be16] font-bold">3️⃣ TP1 par 50% Profit Book Karein:</span>{' '}
                            <span>Jab price <strong>${msg.tradeSignal.target1}</strong> touch kare, tab aadha (50%) profit secure karein aur SL ko entry price par move (Break-Even) kar dein.</span>
                          </div>
                          <div>
                            <span className="text-[#00ff94] font-bold">4️⃣ Risk Rule:</span>{' '}
                            <span>Sirf <strong>{msg.tradeSignal.leverage || 10}x</strong> leverage use karein aur total wallet ka max <strong>1-2%</strong> hi risk karein.</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1-Click Action Execution Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                      <button
                        onClick={() => handleExecuteTrade(msg.tradeSignal!, msg.id)}
                        className={`py-2 px-3 rounded text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          msg.tradeSignal.action === 'BUY'
                            ? 'bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#002111] shadow-[0_0_12px_rgba(0,255,148,0.25)]'
                            : 'bg-[#ff3b4a] hover:bg-[#ff3b4a]/90 text-[#ffffff] shadow-[0_0_12px_rgba(255,59,74,0.25)]'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>
                          {executedSignalIds[msg.id]
                            ? 'Executed!'
                            : `Execute ${msg.tradeSignal.action}`}
                        </span>
                      </button>

                      <button
                        onClick={() => handlePlotOnChart(msg.tradeSignal!, msg.id)}
                        className="py-1.5 px-2 bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] rounded text-[11px] font-bold text-[#d0c5b3] hover:text-[#fff8f1] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title="Plot Entry, Target, and Stop Loss levels onto the Candlestick Chart"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-[#f6be16]" />
                        <span>Plot on Chart</span>
                      </button>

                      <button
                        onClick={() => handleCopySetup(msg.tradeSignal!, msg.id)}
                        className="py-1.5 px-2 bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] rounded text-[11px] font-bold text-[#d0c5b3] hover:text-[#fff8f1] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#00ff94]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#99907f]" />
                            <span>Copy Setup</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-2 text-[11px] text-[#00ff94] font-mono animate-pulse p-3 bg-[#191c1f] rounded-xl border border-[#272a2d] w-fit">
            <BrainCircuit className="w-4 h-4 animate-spin text-[#00ff94]" />
            <span>Analyzing {selectedAsset} indicators, orderflow & trade signals...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-3 bg-[#191c1f] border-t border-[#272a2d] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask Lumina [${selectedTimeframe}]: "BUY/SELL signal for ${selectedAsset.split('/')[0]}", "15m CPR setup", "Hindi strategy guide"...`}
              className="w-full bg-[#111417] text-[#fff8f1] border border-[#272a2d] focus:border-[#00ff94] rounded-lg py-2.5 pl-3.5 pr-10 text-xs font-mono focus:outline-none transition-colors"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={!inputPrompt.trim() || loading}
            className="p-2.5 bg-[#00ff94] hover:bg-[#00ff94]/90 disabled:opacity-40 disabled:hover:bg-[#00ff94] text-[#002111] rounded-lg font-bold transition-all cursor-pointer shadow-[0_0_12px_rgba(0,255,148,0.25)] flex items-center justify-center shrink-0"
            title="Send Analysis Query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#99907f] font-mono px-1">
          <span>Powered by Gemini 3.7 Flash & Obsidian Quant Engine</span>
          <span>Press Enter ↵ to send</span>
        </div>
      </div>
    </div>
  );
};
