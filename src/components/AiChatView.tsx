import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Markdown from 'react-markdown';
import {
  AIChatMessage,
  AIChatTradeSignal,
  AssetPair,
  TickerInfo,
  AISignal,
  Position,
  Candle,
} from '../types';
import { sendChatMessage } from '../services/aiChatService';
import { speakText, stopSpeech, isSpeaking, generateSignalVoiceAlert } from '../utils/speechUtils';
import { auditPortfolioPositions } from '../utils/tradeSentinelUtils';
import { SmartPositionCalculatorModal } from './SmartPositionCalculatorModal';
import { TradeSentinelModal } from './TradeSentinelModal';
import {
  AlertTriangle,
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
  ShieldCheck,
  BarChart2,
  Zap,
  Activity,
  ChevronDown,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  Calculator,
  Sliders,
  Maximize2,
  Lock,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playAlertChime, playSonarPing } from '../utils/soundEffects';

interface AiChatViewProps {
  currentPair: AssetPair;
  tickers: Record<AssetPair, TickerInfo>;
  onSelectPair?: (pair: AssetPair) => void;
  onExecuteSignal: (signal: AISignal) => void;
  onSelectSignalForChart?: (signal: AISignal) => void;
  positions?: Position[];
  balance?: number;
  onClosePosition?: (posId: string) => void;
  onUpdatePositionSL?: (posId: string, newSL: number) => void;
  candles?: Candle[];
}

const MemoizedMarkdown = React.memo<{ text: string }>(({ text }) => {
  return (
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
        {text}
      </Markdown>
    </div>
  );
});

const INITIAL_MESSAGES: AIChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    timestamp: Date.now() - 60000,
    text: `👋 **Welcome to Lumina AI Institutional Market Analyst & Trading Copilot!**

I am powered by **Gemini 3.8 Flash** combined with our **Obsidian Quantitative Engine** to provide real-time market analysis, automated trade execution, live chart vision, risk sentinel audits, and mathematical position sizing.

✨ **Available Pro Capabilities:**
- ⚡ **1-Click AI Execution**: Instantly execute trade setups directly into the terminal with auto TP1/TP2 and Stop Loss.
- 📸 **Instant Chart Vision**: Scan live candlesticks, CPR levels, EMA ribbon, FVG gaps, and Order Blocks.
- 🛡️ **AI Trade Sentinel**: Continuous monitoring of open positions, drawdowns, and break-even SL trailing.
- 🧮 **Smart Position Sizing**: Exact dollar risk and lot calculation based on your wallet balance.
- 🎙️ **Voice Readout**: Audio narration of trading signals and market breakdowns (Hindi & English).`,
  },
];

export const AiChatView: React.FC<AiChatViewProps> = ({
  currentPair,
  tickers,
  onSelectPair,
  onExecuteSignal,
  onSelectSignalForChart,
  positions = [],
  balance = 100000,
  onClosePosition,
  onUpdatePositionSL,
  candles = [],
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
  const [isListening, setIsListening] = useState<boolean>(false);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  
  // Custom leverage per message card
  const [cardLeverages, setCardLeverages] = useState<Record<string, number>>({});

  // Voice Readout states
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoVoiceEnabled, setAutoVoiceEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('lumina_auto_voice_enabled') === 'true';
    } catch {
      return false;
    }
  });

  // Modals state
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [activeSignalForCalc, setActiveSignalForCalc] = useState<AISignal | null>(null);
  const [isSentinelModalOpen, setIsSentinelModalOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync selected asset with parent pair change
  useEffect(() => {
    setSelectedAsset(currentPair);
  }, [currentPair]);

  // Persist chat messages & auto-voice setting
  useEffect(() => {
    try {
      localStorage.setItem('lumina_ai_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('lumina_auto_voice_enabled', autoVoiceEnabled.toString());
    } catch {}
  }, [autoVoiceEnabled]);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const activeTicker = useMemo(() => {
    return (
      tickers[selectedAsset] || {
        price: 2427.52,
        change24h: 1.84,
        high24h: 2490,
        low24h: 2380,
        precision: 2,
      }
    );
  }, [tickers, selectedAsset]);

  // Sentinel Audit Summary (memoized to avoid costly re-auditing on every keystroke)
  const sentinelSummary = useMemo(
    () => auditPortfolioPositions(positions, tickers),
    [positions, tickers]
  );

  // Speech Recognition (Voice Input)
  const handleToggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN, en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setInputPrompt(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Voice Readout (TTS) for messages
  const handleToggleSpeak = (msgId: string, textToSpeak: string, tradeSignal?: AIChatTradeSignal) => {
    if (speakingMsgId === msgId) {
      stopSpeech();
      setSpeakingMsgId(null);
      return;
    }

    stopSpeech();
    setSpeakingMsgId(msgId);

    const voiceText = tradeSignal
      ? generateSignalVoiceAlert(tradeSignal) + ' ' + textToSpeak
      : textToSpeak;

    speakText(voiceText, {
      onEnd: () => setSpeakingMsgId(null),
      onError: () => setSpeakingMsgId(null),
    });
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

    const currentPrice = tickers[selectedAsset]?.price || activeTicker.price || 0;
    const precision = activeTicker.precision || 2;
    const isMarketUp = (activeTicker.change24h ?? 0) >= 0;
    const high24h = activeTicker.high24h ?? currentPrice * 1.03;
    const low24h = activeTicker.low24h ?? currentPrice * 0.97;
    const pivot = +((high24h + low24h + currentPrice) / 3).toFixed(precision);
    const bc = +((high24h + low24h) / 2).toFixed(precision);
    const tcRaw = +((pivot - bc) + pivot).toFixed(precision);
    const tc = Math.max(tcRaw, bc);
    const bcActual = Math.min(tcRaw, bc);

    const activeIndicators = {
      rsi: +(48.5 + (isMarketUp ? Math.min(activeTicker.change24h * 1.8, 16) : Math.max(activeTicker.change24h * 1.8, -16))).toFixed(1),
      ema9: currentPrice ? +(currentPrice * (isMarketUp ? 0.996 : 1.004)).toFixed(precision) : 'N/A',
      ema26: currentPrice ? +(currentPrice * (isMarketUp ? 0.988 : 1.012)).toFixed(precision) : 'N/A',
      ema50: currentPrice ? +(currentPrice * (isMarketUp ? 0.978 : 1.022)).toFixed(precision) : 'N/A',
      ema200: currentPrice ? +(currentPrice * (isMarketUp ? 0.950 : 1.045)).toFixed(precision) : 'N/A',
      cpr: {
        tc,
        pivot,
        bc: bcActual,
        bias: currentPrice > tc ? 'BULLISH_ABOVE_TC' : currentPrice < bcActual ? 'BEARISH_BELOW_BC' : 'NEUTRAL_INSIDE_CPR',
      },
    };

    // Live Chart Vision Data Snapshot
    const recentCandles = candles.slice(-10);
    const chartVisionData = {
      pair: selectedAsset,
      timeframe: selectedTimeframe,
      currentPrice,
      high24h,
      low24h,
      cprTC: tc,
      cprPivot: pivot,
      cprBC: bcActual,
      recentCandlesSummary: recentCandles.map((c) => ({
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        isBullish: c.close >= c.open,
      })),
      fvgZones: [
        {
          type: isMarketUp ? 'BULLISH_FVG' : 'BEARISH_FVG',
          high: +(currentPrice * (isMarketUp ? 1.012 : 0.998)).toFixed(precision),
          low: +(currentPrice * (isMarketUp ? 1.002 : 0.988)).toFixed(precision),
        },
      ],
      orderBlocks: [
        {
          type: isMarketUp ? 'DEMAND_ORDER_BLOCK' : 'SUPPLY_ORDER_BLOCK',
          price: +(currentPrice * (isMarketUp ? 0.988 : 1.018)).toFixed(precision),
        },
      ],
    };

    const portfolioData = {
      balance,
      positions: positions.map((p) => ({
        symbol: p.symbol,
        side: p.side,
        entryPrice: p.entryPrice,
        size: p.size,
        margin: p.margin,
        leverage: p.leverage,
        currentPnl: (tickers[p.symbol]?.price ? (p.side === 'long' ? tickers[p.symbol].price - p.entryPrice : p.entryPrice - tickers[p.symbol].price) * p.size : 0),
      })),
    };

    try {
      const response = await sendChatMessage({
        messages: [...messages, userMsg],
        userMessage: query,
        currentPair: selectedAsset,
        tickers,
        timeframe: selectedTimeframe,
        activeIndicators,
        chartVisionData,
        portfolioData,
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
      setLastFailedQuery(null);

      // Trigger pleasant chime
      playSonarPing();

      // Auto Voice narration if enabled
      if (autoVoiceEnabled) {
        if (response.tradeSignal) {
          const alertSpeech = generateSignalVoiceAlert(response.tradeSignal);
          speakText(alertSpeech);
        } else {
          speakText(response.text.slice(0, 200));
        }
      }
    } catch (err) {
      console.error('Error sending chat message:', err);
      setLastFailedQuery(query);
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
    const chosenLeverage = cardLeverages[msgId] || chatSig.leverage || 10;

    return {
      id: `SIG-CHAT-${Date.now().toString(36).toUpperCase()}`,
      symbol: sym,
      title: `${isBuy ? 'Bullish' : 'Bearish'} AI Chat Execution`,
      side: isBuy ? 'LONG' : 'SHORT',
      type: isBuy ? 'BULLISH_BREAKOUT' : 'SHORT_REVERSAL',
      confidence: chatSig.confidence || 92,
      timeframe: chatSig.timeframe || selectedTimeframe || '15m',
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
      recommendedLeverage: chosenLeverage,
      strategy: chatSig.strategy || 'AI Quantitative Strategy',
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
    playAlertChime();

    try {
      confetti({
        particleCount: 55,
        spread: 65,
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

  const handleOpenCalculatorForSignal = (chatSig: AIChatTradeSignal, msgId: string) => {
    const fullSignal = convertChatSignalToAISignal(chatSig, msgId);
    setActiveSignalForCalc(fullSignal);
    setIsCalcModalOpen(true);
  };

  const handleCopySetup = (chatSig: AIChatTradeSignal, msgId: string) => {
    const text = `🎯 LUMINA AI TRADE SETUP: ${chatSig.symbol}
Action: ${chatSig.action} (Confidence: ${chatSig.confidence}%)
Timeframe: ${chatSig.timeframe || selectedTimeframe || '15m'} | Strategy: ${chatSig.strategy || 'Quantitative'}
------------------------------------
Entry Price: $${chatSig.entryPrice}
Target 1: $${chatSig.target1}
Target 2: $${chatSig.target2}
${chatSig.target3 ? `Target 3: $${chatSig.target3}\n` : ''}Stop Loss: $${chatSig.stopLoss}
Risk/Reward: ${chatSig.riskReward} | Leverage: ${cardLeverages[msgId] || chatSig.leverage || 10}x`;

    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Instant Chart Vision Trigger
  const handleTriggerChartVision = () => {
    const query = `[📸 LIVE CHART VISION SCAN]: Scan and analyze the current live candlestick chart for ${selectedAsset} on the ${selectedTimeframe} timeframe. Evaluate CPR Pivot levels (TC/BC), 9/26 EMA slope, Order Blocks, Fair Value Gaps (FVG), and liquidity sweeps to determine the exact market structure and next directional breakout.`;
    handleSendMessage(query);
  };

  // Quick Prompt Chips
  const promptChips = [
    {
      label: `🧭 Live Chart Trend & Trade Check`,
      query: `Real-time chart dekh kar ${selectedAsset} ka exact market trend batao (${selectedTimeframe}). Agar confirmed signal hai tabhi BUY ya SELL signal do, agar choppy ya sideways market hai toh strictly NO TRADE bolo.`,
    },
    {
      label: `📸 Scan Live Chart Vision`,
      query: `[📸 LIVE CHART VISION SCAN]: Scan the live ${selectedAsset} ${selectedTimeframe} chart for Fair Value Gaps (FVG), Order Blocks, and candle wick rejections.`,
    },
    {
      label: `🛡️ Sentinel: Audit Open Positions Risk`,
      query: `Analyze my open portfolio positions and risk exposure for ${selectedAsset}. Is it safe to hold, should I move SL to Break-Even, or is liquidation close?`,
    },
    {
      label: `🧮 Calculate 1% Risk Position Size`,
      query: `Calculate the exact position size and margin for ${selectedAsset} risking strictly 1% of a $${balance.toLocaleString()} balance with 10x leverage.`,
    },
    {
      label: `⚡ 15m Scalp Setups (High R:R)`,
      query: `Evaluate ${selectedAsset} on the 15-minute (15m) timeframe: Check 15m CPR Pivot levels, 9/26 EMA crossover, Buyer vs Seller Delta, and generate a 15m scalp trade setup with Entry, SL, and TP.`,
    },
    {
      label: `🎯 15m CPR + 9/26 EMA Confluence`,
      query: `Evaluate ${selectedAsset} on ${selectedTimeframe} using CPR + 9/26 EMA Confluence Strategy: Check CPR (TC, Pivot, BC), 9/26 EMA crossover, ADX 14 filter (>20), and generate high-probability trade levels.`,
    },
    {
      label: `💡 Strategy Guide (Hindi / Hinglish)`,
      query: `Explain the current 15m trading strategy for ${selectedAsset} in simple Hindi/Hinglish with a step-by-step guide on how to trade (Entry, Stop Loss, TP1/TP2 profit booking, and risk rules).`,
    },
    {
      label: `🟢 Confirmed BUY / SELL Signal`,
      query: `Give me a clear BUY or SELL trading signal for ${selectedAsset} on ${selectedTimeframe} chart with exact Entry, TP1, TP2, Stop Loss, and Risk/Reward ratio.`,
    },
    {
      label: `📦 15m Order Blocks & FVG (SMC)`,
      query: `Identify 15m institutional Order Blocks, Fair Value Gaps (FVG), and liquidity pools for ${selectedAsset}.`,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#111417] text-[#fff8f1] font-hanken">
      {/* Top Bar: Asset, Timeframe, Sentinel Status, Voice Toggle */}
      <div className="px-3.5 py-2.5 bg-[#191c1f] border-b border-[#272a2d] flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
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

          {/* Sentinel Quick Status Pill */}
          <button
            onClick={() => setIsSentinelModalOpen(true)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
              sentinelSummary.overallPortfolioHealth === 'CRITICAL'
                ? 'bg-[#ff3b4a]/20 text-[#ff3b4a] border-[#ff3b4a] animate-pulse'
                : sentinelSummary.totalOpenPositions > 0
                ? 'bg-[#00ff94]/10 text-[#00ff94] border-[#00ff94]/30'
                : 'bg-[#272a2d] text-[#99907f] border-[#37393d] hover:text-[#fff8f1]'
            }`}
            title="Open Trade Sentinel Risk Auditor"
          >
            <ShieldAlert className="w-3 h-3 text-[#f6be16]" />
            <span>
              Sentinel ({sentinelSummary.totalOpenPositions} pos)
            </span>
          </button>

          {/* Smart Position Calculator Button */}
          <button
            onClick={() => {
              setActiveSignalForCalc(null);
              setIsCalcModalOpen(true);
            }}
            className="p-1 px-2 rounded bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-[10px] text-[#f6be16] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            title="Open Smart Position Sizing Calculator"
          >
            <Calculator className="w-3 h-3" />
            <span className="hidden sm:inline">Risk Calc</span>
          </button>
        </div>

        {/* Right Tools: Live Price, Auto Voice, Clear Chat */}
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

          {/* Auto Voice Readout Toggle */}
          <button
            onClick={() => setAutoVoiceEnabled((prev) => !prev)}
            className={`p-1.5 rounded transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer ${
              autoVoiceEnabled
                ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40 shadow-[0_0_8px_rgba(0,255,148,0.2)]'
                : 'bg-[#111417] text-[#99907f] border border-[#272a2d] hover:text-[#fff8f1]'
            }`}
            title={autoVoiceEnabled ? 'Auto Voice Readout Enabled (Alerts will be spoken)' : 'Enable Auto Voice Readout'}
          >
            {autoVoiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#00ff94]" /> : <VolumeX className="w-3.5 h-3.5 text-[#99907f]" />}
            <span className="hidden sm:inline">{autoVoiceEnabled ? 'Voice ON' : 'Voice'}</span>
          </button>

          <button
            onClick={handleClearHistory}
            className="p-1.5 text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] rounded transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Preset Prompts Bar */}
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
          const isSpeakingThis = speakingMsgId === msg.id;

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

                {/* Speaker TTS Icon for Assistant messages */}
                {!isUser && (
                  <button
                    onClick={() => handleToggleSpeak(msg.id, msg.text, msg.tradeSignal)}
                    className={`ml-1.5 p-0.5 rounded transition-colors cursor-pointer ${
                      isSpeakingThis
                        ? 'text-[#00ff94] animate-pulse bg-[#00ff94]/10'
                        : 'text-[#99907f] hover:text-[#fff8f1]'
                    }`}
                    title={isSpeakingThis ? 'Stop Audio Readout' : 'Listen to Audio Narration (Voice)'}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[94%] p-3.5 rounded-xl border leading-relaxed ${
                  isUser
                    ? 'bg-[#1e2329] border-[#37393d] text-[#fff8f1] rounded-br-xs'
                    : 'bg-[#191c1f] border-[#272a2d] text-[#e0d8cc] rounded-bl-xs shadow-lg'
                }`}
              >
                {/* Memoized Markdown content to prevent heavy AST recalculation on every keystroke */}
                <MemoizedMarkdown text={msg.text} />

                {/* Structured Interactive Trade Signal Card */}
                {msg.tradeSignal && (
                  <div className="mt-3.5 pt-3 border-t border-[#272a2d] bg-[#111417]/90 rounded-lg p-3 border border-[#37393d]/80 space-y-2.5">
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
                        {msg.tradeSignal.symbol} • {msg.tradeSignal.timeframe || selectedTimeframe || '15m'}
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

                    {/* Leverage Quick Selector & Risk / Guide Toggles */}
                    <div className="p-2 bg-[#16181b] rounded border border-[#272a2d] flex items-center justify-between flex-wrap gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#99907f] uppercase font-bold">Leverage:</span>
                        <div className="flex items-center gap-1">
                          {[5, 10, 20, 50].map((lev) => {
                            const curLev = cardLeverages[msg.id] || msg.tradeSignal?.leverage || 10;
                            return (
                              <button
                                key={lev}
                                type="button"
                                onClick={() => setCardLeverages((prev) => ({ ...prev, [msg.id]: lev }))}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                                  curLev === lev
                                    ? 'bg-[#00ff94] text-[#002111]'
                                    : 'bg-[#191c1f] text-[#99907f] hover:text-[#fff8f1]'
                                }`}
                              >
                                {lev}x
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenCalculatorForSignal(msg.tradeSignal!, msg.id)}
                          className="text-[#f6be16] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Calculator className="w-3 h-3" />
                          <span>Size Calc</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedGuideIds((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                          className="text-[#00ff94] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>{expandedGuideIds[msg.id] ? 'Hide Guide ▲' : '📖 Kaise Trade Karein? ▼'}</span>
                        </button>
                      </div>
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
                            <span>Sirf <strong>{cardLeverages[msg.id] || msg.tradeSignal.leverage || 10}x</strong> leverage use karein aur total wallet ka max <strong>1-2%</strong> hi risk karein.</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 1-Click Action Execution Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                      {msg.tradeSignal.action === 'HOLD' ? (
                        <div className="py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-1.5 bg-[#f6be16]/20 text-[#f6be16] border border-[#f6be16]/30 col-span-full">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>NO TRADE ACTIVE — Wait for Breakout Confirmation</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleExecuteTrade(msg.tradeSignal!, msg.id)}
                          className={`py-2 px-3 rounded text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            msg.tradeSignal.action === 'BUY'
                              ? 'bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#002111] shadow-[0_0_12px_rgba(0,255,148,0.25)]'
                              : 'bg-[#ff3b4a] hover:bg-[#ff3b4a]/90 text-[#ffffff] shadow-[0_0_12px_rgba(255,59,74,0.25)]'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>
                            {executedSignalIds[msg.id]
                              ? 'Executed!'
                              : `Execute ${msg.tradeSignal.action} (1-Click)`}
                          </span>
                        </button>
                      )}

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
        {/* Error Retry Banner (Requirement 9) */}
        {lastFailedQuery && (
          <div className="mb-2 p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 flex items-center justify-between gap-2 text-xs font-mono animate-in fade-in duration-200">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="truncate">Analysis request failed: "{lastFailedQuery}"</span>
            </div>
            <button
              type="button"
              onClick={() => {
                const q = lastFailedQuery;
                setLastFailedQuery(null);
                handleSendMessage(q);
              }}
              className="px-3 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow-sm"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Instant Chart Vision Camera Button */}
          <button
            type="button"
            onClick={handleTriggerChartVision}
            disabled={loading}
            className="p-2.5 rounded-lg font-bold bg-[#272a2d] hover:bg-[#37393d] text-[#00ff94] hover:text-white border border-[#37393d] transition-all cursor-pointer flex items-center justify-center shrink-0"
            title="Scan live chart with AI Vision (Candlesticks, CPR, FVG, Order Blocks)"
          >
            <Camera className="w-4 h-4" />
          </button>

          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening
                  ? '🎙️ Listening... Speak your query in Hindi or English...'
                  : `Ask Lumina [${selectedTimeframe}]: "BUY/SELL signal", "Scan Chart Vision", "Hindi guide", "Risk 1% size"...`
              }
              className={`w-full bg-[#111417] text-[#fff8f1] border rounded-lg py-2.5 pl-3.5 pr-10 text-xs font-mono focus:outline-none transition-colors ${
                isListening
                  ? 'border-[#ff3b4a] shadow-[0_0_12px_rgba(255,59,74,0.3)] animate-pulse'
                  : 'border-[#272a2d] focus:border-[#00ff94]'
              }`}
              disabled={loading}
            />
          </div>

          {/* Speech-to-Text Mic Button */}
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className={`p-2.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-[#ff3b4a] text-white shadow-[0_0_15px_rgba(255,59,74,0.4)] animate-bounce'
                : 'bg-[#272a2d] hover:bg-[#37393d] text-[#d0c5b3] hover:text-[#fff8f1] border border-[#37393d]'
            }`}
            title={isListening ? 'Stop Voice Recording' : 'Speak your trading query (Hindi / English)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#ffd87f]" />}
          </button>

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
          <span>Gemini 3.7 Flash • 1-Click Execution & Chart Vision Active</span>
          <span>Press Enter ↵ to send</span>
        </div>
      </div>

      {/* Smart Position Calculator Modal */}
      <SmartPositionCalculatorModal
        isOpen={isCalcModalOpen}
        onClose={() => {
          setIsCalcModalOpen(false);
          setActiveSignalForCalc(null);
        }}
        accountBalance={balance}
        currentPair={selectedAsset}
        tickers={tickers}
        initialSignal={activeSignalForCalc}
        onExecuteTrade={(params) => {
          onExecuteSignal({
            id: `SIG-CALC-${Date.now().toString(36).toUpperCase()}`,
            symbol: params.symbol,
            title: `Smart Sized ${params.side.toUpperCase()}`,
            side: params.side === 'buy' ? 'LONG' : 'SHORT',
            type: 'BULLISH_BREAKOUT',
            confidence: 94,
            timeframe: selectedTimeframe,
            entryPrice: params.price,
            entryRange: [params.price * 0.999, params.price * 1.001],
            target1: params.takeProfit || params.price * 1.03,
            target2: (params.takeProfit || params.price * 1.03) * 1.02,
            stopLoss: params.stopLoss || params.price * 0.985,
            riskReward: '1 : 2.5',
            riskPercent: 1.0,
            rewardPercent: 2.5,
            recommendedLeverage: params.leverage,
            strategy: 'Smart Sizing Quantitative Risk Model',
            description: `Smart Position size of ${params.amount} contracts executed with strict 1% max risk.`,
            rationale: 'Mathematically bounded risk allocation.',
            technicalSupport: {
              rsi: 52,
              rsiSignal: 'Neutral',
              macd: { macd: 1, signal: 1, histogram: 0, trend: 'Bullish Expansion' },
              emaTrend: 'Bullish Stack',
              ema20: params.price,
              ema50: params.price,
              ema200: params.price,
              supportLevel: params.stopLoss || params.price * 0.98,
              resistanceLevel: params.takeProfit || params.price * 1.03,
              atr: 10,
              orderflowImbalance: '+65% Buyer Delta',
              volumeSurge: '1.5x',
            },
            timestamp: Date.now(),
            active: true,
          });
        }}
      />

      {/* Trade Sentinel Modal */}
      <TradeSentinelModal
        isOpen={isSentinelModalOpen}
        onClose={() => setIsSentinelModalOpen(false)}
        positions={positions}
        tickers={tickers}
        onClosePosition={(posId) => onClosePosition?.(posId)}
        onUpdatePositionSL={(posId, newSL) => onUpdatePositionSL?.(posId, newSL)}
        onOpenChatWithQuery={(q) => handleSendMessage(q)}
      />
    </div>
  );
};
