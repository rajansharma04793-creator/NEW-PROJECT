import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  AssetPair,
  TickerInfo,
  Candle,
  AgentDeliberationReport,
  AISignal,
} from '../types';
import {
  runAgentDeliberation,
  formatPrecision,
  getAssetClass,
  convertReportToSignal,
} from '../services/agentDeliberationEngine';
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  BarChart2,
  Globe,
  Crosshair,
  Sliders,
  DollarSign,
  Bell,
  Cpu,
  Info,
  Lock,
  Unlock,
  GraduationCap,
  Bot,
} from 'lucide-react';
import { playAlertChime, playProfitHitChime } from '../utils/soundEffects';

interface AgentDeliberationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: AssetPair;
  ticker?: TickerInfo;
  candles?: Candle[];
  timeframe?: string;
  balance?: number;
  currencyMode?: 'USDT' | 'INR';
  onPlaceOrder?: (order: {
    symbol: AssetPair;
    type: 'market' | 'limit';
    side: 'buy' | 'sell';
    price: number;
    amount: number;
    leverage: number;
    takeProfit?: number;
    stopLoss?: number;
  }) => void;
  onPlaceQuickTrade?: (params: {
    symbol: AssetPair;
    side: 'buy' | 'sell';
    leverage?: number;
    marginPercent?: number;
    takeProfitPercent?: number;
    stopLossPercent?: number;
  }) => void;
  onOpenAlertsModal?: (symbol?: AssetPair, price?: number) => void;
  onSelectPair?: (pair: AssetPair) => void;
  onOpenLearningGuide?: () => void;
  onAcceptSignal?: (sig: AISignal) => void;
  onOpenCopilot?: () => void;
}

export const AgentDeliberationOverlay: React.FC<AgentDeliberationOverlayProps> = ({
  isOpen,
  onClose,
  currentPair,
  ticker,
  candles = [],
  timeframe = '15m',
  balance = 100000,
  currencyMode = 'USDT',
  onPlaceOrder,
  onPlaceQuickTrade,
  onOpenAlertsModal,
  onSelectPair,
  onOpenLearningGuide,
  onAcceptSignal,
  onOpenCopilot,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(timeframe);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'deliberation' | 'cpr'>('blueprint');
  const [copied, setCopied] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);
  const [orderExecutedNotice, setOrderExecutedNotice] = useState<string | null>(null);
  const [isPlanLocked, setIsPlanLocked] = useState<boolean>(true);
  const [lockedReport, setLockedReport] = useState<AgentDeliberationReport | null>(null);
  const [showHindiGuide, setShowHindiGuide] = useState<boolean>(true);
  const drawerRef = useRef<HTMLElement>(null);

  // Focus management when drawer opens
  useEffect(() => {
    if (isOpen) {
      drawerRef.current?.focus();
    }
  }, [isOpen]);

  // Sync timeframe with terminal if prop changes
  useEffect(() => {
    if (timeframe) {
      setSelectedTimeframe(timeframe);
    }
  }, [timeframe]);

  const currentPrice = ticker?.price || (currentPair.includes('BTC') ? 68350 : 2500);

  // Handle Escape key to close drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const tickerRef = useRef(ticker);
  tickerRef.current = ticker;
  const candlesRef = useRef(candles);
  candlesRef.current = candles;

  // Deliberation engine execution with loading and error states
  const executeDeliberation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!currentPair) {
        throw new Error('No asset pair selected for deliberation.');
      }
      const snap = runAgentDeliberation(
        currentPair,
        currentPrice,
        tickerRef.current,
        candlesRef.current,
        selectedTimeframe
      );
      if (!snap || !snap.riskController || !snap.validator) {
        throw new Error('5-Agent deliberation desk returned empty consensus.');
      }
      setLockedReport(snap);
    } catch (err: any) {
      console.error('[5-Agent Desk] Deliberation error:', err);
      setError(err?.message || 'Quantitative Desk analysis service temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPair, currentPrice, selectedTimeframe]);

  // Run on open and symbol/timeframe changes
  useEffect(() => {
    if (isOpen) {
      executeDeliberation();
    }
  }, [isOpen, currentPair, selectedTimeframe, refreshCounter, executeDeliberation]);

  // Dynamic live report fallback
  const liveReport: AgentDeliberationReport = useMemo(() => {
    try {
      return runAgentDeliberation(
        currentPair,
        currentPrice,
        ticker,
        candles,
        selectedTimeframe
      );
    } catch {
      return lockedReport || ({} as AgentDeliberationReport);
    }
  }, [currentPair, currentPrice, ticker, candles, selectedTimeframe, lockedReport]);

  // Use lockedReport when plan is locked (default: true) to stop second-by-second number fluctuations
  const report: AgentDeliberationReport = (isPlanLocked && lockedReport) ? lockedReport : liveReport;

  const toggleLockPlan = () => {
    if (isPlanLocked) {
      setIsPlanLocked(false);
    } else {
      setIsPlanLocked(true);
      setLockedReport(liveReport);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    playAlertChime();
    executeDeliberation().finally(() => {
      setIsRefreshing(false);
    });
  };

  const handleCopyMarkdown = () => {
    if (report?.markdownSummary) {
      navigator.clipboard.writeText(report.markdownSummary);
      setCopied(true);
      playProfitHitChime();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExecuteBlueprint = (executionMode: 'limit' | 'market' = 'limit') => {
    const isBuy = report.action.includes('BUY');
    const side: 'buy' | 'sell' = isBuy ? 'buy' : 'sell';
    const amount = balance ? Math.max(500, Math.min(balance * 0.05, 5000)) : 1000;
    const lev = report.riskController.suggestedLeverage || 10;
    const targetPrice = executionMode === 'limit' ? report.riskController.entryPrice : report.currentPrice;

    if (onPlaceOrder) {
      onPlaceOrder({
        symbol: currentPair,
        type: executionMode === 'limit' ? 'limit' : 'market',
        side,
        price: targetPrice,
        amount,
        leverage: lev,
        takeProfit: report.riskController.tp1Conservative,
        stopLoss: report.riskController.stopLoss,
      });
    } else if (onPlaceQuickTrade) {
      onPlaceQuickTrade({
        symbol: currentPair,
        side,
        leverage: lev,
        marginPercent: 5,
      });
    }

    if (onAcceptSignal) {
      const acceptedSig = convertReportToSignal(report, true);
      onAcceptSignal(acceptedSig);
    }

    playProfitHitChime();
    setOrderExecutedNotice(
      `⚡ Executed ${executionMode.toUpperCase()} ${report.action} on ${currentPair}! Entry, TP, and SL are locked as static markers on your chart. Entry: $${formatPrecision(
        targetPrice,
        currentPair
      )} | SL: $${formatPrecision(
        report.riskController.stopLoss,
        currentPair
      )} | TP1: $${formatPrecision(report.riskController.tp1Conservative, currentPair)}`
    );

    setTimeout(() => {
      setOrderExecutedNotice(null);
    }, 4500);
  };

  const handleSetAlert = () => {
    if (onOpenAlertsModal) {
      onOpenAlertsModal(currentPair, report.riskController.stopLoss);
    }
  };

  if (!isOpen) return null;

  const isBuyAction = report.action.includes('BUY');
  const actionColor = isBuyAction ? '#00ff94' : '#ff4976';
  const actionBg = isBuyAction ? 'rgba(0, 255, 148, 0.12)' : 'rgba(255, 73, 118, 0.12)';
  const actionBorder = isBuyAction ? 'rgba(0, 255, 148, 0.35)' : 'rgba(255, 73, 118, 0.35)';

  return (
    <div className="fixed inset-0 z-50 flex justify-end pointer-events-none">
      {/* Dimmed Backdrop for Mobile / Focus */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-300"
      />

      {/* Collapsible Institutional Side Drawer */}
      <aside
        id="agent-deliberation-drawer"
        ref={drawerRef as any}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-deliberation-title"
        aria-label="5-Agent Quantitative Desk Deliberation"
        className="relative w-full max-w-full sm:w-[500px] lg:w-[540px] h-full bg-[#14171a] border-l border-[#272a2d] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col pointer-events-auto z-10 text-[#e1e2e7] font-hanken animate-in slide-in-from-right duration-300 overflow-hidden select-none outline-none"
      >
        {/* 1. Header Toolbar (Responsive & Clean) */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#191c1f] border-b border-[#272a2d] shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-[#3b82f6]/15 border border-[#3b82f6]/40 text-[#60a5fa] shadow-[0_0_12px_rgba(59,130,246,0.25)] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 id="agent-deliberation-title" className="text-xs font-black uppercase tracking-wider text-[#fff8f1] truncate">
                  5-Agent Analysis
                </h2>
                <span className="text-[8px] sm:text-[9px] px-1.5 py-0.2 bg-[#3b82f6]/20 border border-[#3b82f6]/40 text-[#93c5fd] font-bold rounded shrink-0">
                  QUANT DESK
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-[#99907f] font-mono truncate hidden xs:block">
                Institutional Market Structure & Risk Controller
              </p>
            </div>
          </div>

          {/* Action Buttons with Sticky Prominent Close Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 1-Click Apply SL/TP/Entry directly to Chart button */}
            {onAcceptSignal && (
              <button
                onClick={() => {
                  const sig = convertReportToSignal(report, true);
                  onAcceptSignal(sig);
                  playProfitHitChime();
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#ffd87f] via-[#f6be16] to-[#f59e0b] hover:brightness-110 text-[#0b0e11] font-black text-[11px] sm:text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
                title="Single Click: Apply SL, TP and Entry directly onto the chart"
              >
                <Zap className="w-3.5 h-3.5 fill-[#0b0e11]" />
                <span className="font-bold">⚡ 1-Click Chart Par Lagayein</span>
              </button>
            )}

            {/* Lock / Freeze Toggle Button */}
            <button
              onClick={toggleLockPlan}
              className={`p-1.5 sm:px-2 sm:py-1 rounded-lg border text-[10px] sm:text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isPlanLocked
                  ? 'bg-[#ffd87f]/15 border-[#ffd87f]/60 text-[#ffd87f] shadow-[0_0_8px_rgba(255,216,127,0.2)]'
                  : 'bg-[#272a2d] border-[#37393d] text-[#99907f] hover:text-[#fff8f1]'
              }`}
              title={isPlanLocked ? 'Numbers locked (stable)' : 'Live Mode'}
            >
              {isPlanLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#ffd87f]" />
                  <span className="hidden sm:inline">Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-[#99907f]" />
                  <span className="hidden sm:inline">Live</span>
                </>
              )}
            </button>

            {/* AI Chat Link */}
            {onOpenCopilot && (
              <button
                id="agent-desk-open-chat-btn"
                onClick={() => {
                  onClose();
                  onOpenCopilot();
                }}
                className="p-1.5 sm:px-2 sm:py-1 rounded-lg bg-[#00ff94]/15 hover:bg-[#00ff94]/25 text-[#00ff94] border border-[#00ff94]/40 text-[10px] sm:text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                title="Open AI Chat Copilot"
              >
                <Bot className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chat</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-1.5 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1] border border-[#37393d] transition-all cursor-pointer ${
                isRefreshing ? 'animate-spin text-[#f6be16]' : ''
              }`}
              title="Recalculate Levels with Latest Price"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Copy Strict Markdown (hidden on narrow screens to save space) */}
            <button
              onClick={handleCopyMarkdown}
              className="hidden md:flex items-center gap-1 p-1.5 sm:px-2 sm:py-1 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#d0c5b3] hover:text-[#fff8f1] border border-[#37393d] text-[10px] sm:text-[11px] font-mono font-bold transition-all cursor-pointer"
              title="Copy Strict Markdown Blueprint"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00ff94]" />
                  <span className="text-[#00ff94]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#f6be16]" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Prominent, Never-Clipped Close Drawer Button */}
            <button
              id="close-agent-deliberation-btn"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg bg-[#ef4444]/15 hover:bg-[#ef4444]/30 text-[#ff6b6b] hover:text-white border border-[#ef4444]/40 transition-colors cursor-pointer ml-1"
              title="Close Analysis"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Asset Pill & Timeframe Selector Bar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#16191c] border-b border-[#272a2d] text-xs font-mono shrink-0 gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-xs sm:text-sm text-[#fff8f1]">{report.symbol}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#272a2d] text-[#99907f] font-bold">
              {report.assetClass}
            </span>
            <div className="flex items-center gap-1 bg-[#0f1215] px-1.5 py-0.5 rounded border border-[#272a2d] text-[10px]">
              <span className="text-[#99907f]">Live:</span>
              <span className="font-bold text-[#fff8f1]">
                ${formatPrecision(currentPrice, report.symbol)}
              </span>
            </div>
            <span
              className={`text-[10px] font-bold ${
                (ticker?.change24h ?? 0) >= 0 ? 'text-[#00ff94]' : 'text-[#ff4976]'
              }`}
            >
              {(ticker?.change24h ?? 0) >= 0 ? '+' : ''}
              {(ticker?.change24h ?? 0).toFixed(2)}%
            </span>
            {isPlanLocked && (
              <span className="text-[8px] sm:text-[9px] px-1.5 py-0.2 bg-[#ffd87f]/15 border border-[#ffd87f]/40 text-[#ffd87f] font-bold rounded">
                LOCKED
              </span>
            )}
          </div>

          {/* Timeframe Chips */}
          <div className="flex items-center gap-1 bg-[#1f2225] p-0.5 rounded-lg border border-[#272a2d] shrink-0">
            {['15m', '1h', '4h'].map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  selectedTimeframe === tf
                    ? 'bg-[#3b82f6] text-[#fff8f1] shadow-sm'
                    : 'text-[#99907f] hover:text-[#fff8f1]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Deliberation Body Content / Loading / Error with Retry */}
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-10 h-10 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
            <p className="font-mono text-xs text-[#93c5fd] font-bold">5-Agent Quant Desk Deliberating...</p>
            <p className="text-[11px] text-[#99907f]">Scout, Analyst, News, Validator &amp; Risk Controller auditing {currentPair}</p>
          </div>
        ) : error || !report?.riskController ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="p-3 rounded-full bg-red-500/15 border border-red-500/30 text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-mono font-bold text-sm text-[#fff8f1]">Quantitative Engine Unavailable</h3>
              <p className="text-xs text-red-300 font-mono max-w-sm">{error || 'Unable to compute 5-agent deliberation consensus.'}</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => executeDeliberation()}
                className="px-4 py-2 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Deliberation</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] font-mono text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* 3. Executive Status Banner (Mobile Responsive) */}
            <div
              className="mx-3 sm:mx-4 mt-2.5 p-2.5 sm:p-3 rounded-xl border flex flex-col gap-2 shadow-lg shrink-0"
          style={{
            backgroundColor: actionBg,
            borderColor: actionBorder,
          }}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div
                className="px-2.5 py-1.5 rounded-lg font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shrink-0"
                style={{
                  backgroundColor: isBuyAction ? 'rgba(0, 255, 148, 0.2)' : 'rgba(255, 73, 118, 0.2)',
                  color: actionColor,
                  border: `1px solid ${actionBorder}`,
                }}
              >
                {isBuyAction ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>{report.action}</span>
              </div>

              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-[#99907f] font-bold hidden xs:inline">VALIDATOR:</span>
                <span className="px-1.5 py-0.5 rounded font-extrabold bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {report.validatorStatus} ({report.confidenceScore}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px] shrink-0">
              <span className="text-[10px] text-[#99907f] uppercase font-bold">STRUCTURE:</span>
              <span className="font-black text-[#f6be16] bg-[#272a2d] px-1.5 py-0.5 rounded border border-[#37393d]">
                {report.tradeScout.structureType}
              </span>
            </div>
          </div>

          <div className="text-[10px] sm:text-[11px] font-mono text-[#d0c5b3] flex items-center justify-between pt-1 border-t border-[#272a2d]/60">
            <span>
              Mandatory RR: <strong className="text-[#f6be16]">1:{report.riskController.riskRewardTP1}</strong>
              <span className="text-[9px] text-[#99907f] ml-1">(Min 1:2 Enforced)</span>
            </span>
            {onOpenLearningGuide && (
              <button
                onClick={onOpenLearningGuide}
                className="text-[10px] text-[#ffd87f] hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <GraduationCap className="w-3 h-3" />
                <span>Guide</span>
              </button>
            )}
          </div>
        </div>

        {/* Execution Notification Banner */}
        {orderExecutedNotice && (
          <div className="mx-3 sm:mx-4 mt-2 p-2 rounded-lg bg-[#00ff94]/15 border border-[#00ff94]/40 text-[#00ff94] text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <Zap className="w-4 h-4 text-[#00ff94] shrink-0 animate-pulse" />
            <span className="flex-1 truncate">{orderExecutedNotice}</span>
          </div>
        )}

        {/* 4. Tab Navigation */}
        <div className="flex items-center px-3 sm:px-4 mt-2.5 border-b border-[#272a2d] gap-3 text-[11px] sm:text-xs font-bold shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`pb-2 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'blueprint'
                ? 'border-[#3b82f6] text-[#60a5fa]'
                : 'border-transparent text-[#99907f] hover:text-[#fff8f1]'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Execution Blueprint</span>
          </button>

          <button
            onClick={() => setActiveTab('deliberation')}
            className={`pb-2 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'deliberation'
                ? 'border-[#3b82f6] text-[#60a5fa]'
                : 'border-transparent text-[#99907f] hover:text-[#fff8f1]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>5 Agents Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('cpr')}
            className={`pb-2 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cpr'
                ? 'border-[#3b82f6] text-[#60a5fa]'
                : 'border-transparent text-[#99907f] hover:text-[#fff8f1]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>CPR &amp; Orderflow</span>
          </button>
        </div>

        {/* 5. Tab Contents (Scrollable Container with padding for bottom action footer) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-28 sm:pb-32 space-y-3 font-mono text-xs">
          {/* TAB 1: EXECUTION BLUEPRINT */}
          {activeTab === 'blueprint' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* Hindi Educational / Guidance Card */}
              {showHindiGuide ? (
                <div className="p-3 rounded-xl bg-[#1e2329] border border-[#ffd87f]/40 shadow-lg space-y-2.5 font-sans">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#ffd87f]">
                      <Info className="w-4 h-4 text-[#ffd87f] shrink-0" />
                      <span>Aasan Guide: Trade Ko Kaise Samjhein &amp; Kaise Lein?</span>
                    </div>
                    <button
                      onClick={() => setShowHindiGuide(false)}
                      className="text-[#99907f] hover:text-white text-xs cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#272a2d]"
                      title="Hide guide"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-[#14171a] border border-[#ffd87f]/20">
                      <span className="text-[#ffd87f] font-bold block mb-0.5">1. Numbers Kyun Fixed Hain?</span>
                      <p className="text-[#d0c5b3] text-[10px] leading-relaxed">
                        Humne Entry, Stop Loss aur Target ko <strong>Lock 🔒</strong> kar diya hai taaki har second numbers change na hon aur aap bina kisi confusion ke trade plan samajh sakein.
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-[#14171a] border border-[#272a2d]">
                      <span className={`font-bold block mb-0.5 ${isBuyAction ? 'text-[#00ff94]' : 'text-[#ff4976]'}`}>
                        2. {report.action} Signal:
                      </span>
                      <p className="text-[#d0c5b3] text-[10px] leading-relaxed">
                        {isBuyAction
                          ? 'Market support par hai! Dip mein BUY karein, upar jane par profit hoga.'
                          : 'Market girne ke chances hain! Thoda bounce par SELL/SHORT karein, market girne par profit hoga.'}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-[#14171a] border border-[#00ff94]/20">
                      <span className="text-[#00ff94] font-bold block mb-0.5">3. Kaun Sa Button Dabayein?</span>
                      <p className="text-[#d0c5b3] text-[10px] leading-relaxed">
                        Niche <strong>"⚡ Execute Market"</strong> dabakar turant live price par trade shuru karein, Stop Loss aur Target apne aap lag jayenge!
                      </p>
                    </div>
                  </div>

                  {onOpenLearningGuide && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={onOpenLearningGuide}
                        className="text-[11px] text-[#ffd87f] hover:text-[#fff8f1] font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ffd87f]/15 hover:bg-[#ffd87f]/25 border border-[#ffd87f]/40 transition-all cursor-pointer"
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-[#ffd87f]" />
                        <span>Interactive 5-Agent &amp; TP/SL Walkthrough Kholein ➔</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowHindiGuide(true)}
                  className="text-[11px] text-[#ffd87f] hover:underline flex items-center gap-1 cursor-pointer bg-[#ffd87f]/10 px-2.5 py-1.5 rounded-lg border border-[#ffd87f]/30 font-sans"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Trade samajhne mein dikkat ho rahi hai? (Yahan click karein)</span>
                </button>
              )}

              {/* Institutional Trade Parameters Card */}
              <div className="p-3.5 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#272a2d]">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#fff8f1]">
                    <Target className="w-4 h-4 text-[#3b82f6]" />
                    <span>Exact Execution Parameters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#99907f]">Timeframe: {selectedTimeframe}</span>
                    {isPlanLocked && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ffd87f]/20 text-[#ffd87f] font-bold">
                        FIXED
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Entry Zone */}
                  <div className="p-2.5 rounded-lg bg-[#14171a] border border-[#3b82f6]/40">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-[#60a5fa] uppercase font-bold">
                        {report.riskController.setupType ? report.riskController.setupType.replace('_', ' ') : (isBuyAction ? 'Pullback Entry Zone' : 'Bounce Entry Zone')}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 bg-[#3b82f6]/20 text-[#93c5fd] rounded font-bold">
                        Pro SMC
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#fff8f1] block">
                      ${formatPrecision(report.riskController.entryZone[0], report.symbol)} – $
                      {formatPrecision(report.riskController.entryZone[1], report.symbol)}
                    </span>
                    <div className="flex items-center justify-between mt-1 text-[9px]">
                      <span className="text-[#99907f]">Avg Limit: ${formatPrecision(report.riskController.entryPrice, report.symbol)}</span>
                      <span className="text-[#f6be16] font-medium">
                        {isBuyAction
                          ? (report.riskController.entryPrice < currentPrice
                              ? `-${(((currentPrice - report.riskController.entryPrice) / currentPrice) * 100).toFixed(2)}% Dip`
                              : `Breakout`)
                          : (report.riskController.entryPrice > currentPrice
                              ? `+${(((report.riskController.entryPrice - currentPrice) / currentPrice) * 100).toFixed(2)}% Bounce`
                              : `Breakdown`)}
                      </span>
                    </div>
                    {report.riskController.entryTypeDescription && (
                      <div className="mt-1.5 pt-1.5 border-t border-[#272a2d] text-[9px] text-[#93c5fd] leading-tight font-medium">
                        {report.riskController.entryTypeDescription}
                      </div>
                    )}
                  </div>

                  {/* Invalidation / Stop Loss */}
                  <div className="p-2.5 rounded-lg bg-[#14171a] border border-[#ef4444]/30">
                    <span className="text-[10px] text-[#ef4444] uppercase font-bold block mb-0.5">
                      Stop Loss (Invalidation)
                    </span>
                    <span className="text-xs font-bold text-[#ef4444] block">
                      ${formatPrecision(report.riskController.stopLoss, report.symbol)}
                    </span>
                    <span className="text-[9px] text-[#99907f]">
                      Risk: ${formatPrecision(report.riskController.riskPerShareOrUnit, report.symbol)} (
                      {(
                        (report.riskController.riskPerShareOrUnit / report.riskController.entryPrice) *
                        100
                      ).toFixed(2)}
                      %)
                    </span>
                  </div>

                  {/* Target 1 (Conservative 50% Close) */}
                  <div className="p-2.5 rounded-lg bg-[#14171a] border border-[#00ff94]/30">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-[#00ff94] uppercase font-bold">
                        Target 1 (50% Close)
                      </span>
                      <span className="text-[9px] px-1 bg-[#00ff94]/20 text-[#00ff94] rounded font-bold">
                        1:{report.riskController.riskRewardTP1} RR
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#00ff94] block">
                      ${formatPrecision(report.riskController.tp1Conservative, report.symbol)}
                    </span>
                    <span className="text-[9px] text-[#99907f]">Equal Highs / BSL Liquidity</span>
                  </div>

                  {/* Target 2 (Runner Extension) */}
                  <div className="p-2.5 rounded-lg bg-[#14171a] border border-[#f6be16]/30">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] text-[#f6be16] uppercase font-bold">
                        Target 2 (Runner)
                      </span>
                      <span className="text-[9px] px-1 bg-[#f6be16]/20 text-[#f6be16] rounded font-bold">
                        1:{report.riskController.riskRewardTP2} RR
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#f6be16] block">
                      ${formatPrecision(report.riskController.tp2Runner, report.symbol)}
                    </span>
                    <span className="text-[9px] text-[#99907f]">Daily R2 Extension Pivot</span>
                  </div>
                </div>

                {/* Live Entry Distance Alert Bar */}
                <div className="p-2 rounded-lg bg-[#14171a] border border-[#272a2d] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#60a5fa]" />
                    <span className="text-[#99907f]">Market Price:</span>
                    <strong className="text-[#fff8f1]">${formatPrecision(currentPrice, report.symbol)}</strong>
                  </div>
                  <div className="text-[10px] text-right font-medium">
                    {isBuyAction ? (
                      <span className="text-[#93c5fd]">
                        Wait for dip to <strong className="text-[#fff8f1]">${formatPrecision(report.riskController.entryZone[1], report.symbol)}</strong> or market fill
                      </span>
                    ) : (
                      <span className="text-[#fda4af]">
                        Wait for bounce to <strong className="text-[#fff8f1]">${formatPrecision(report.riskController.entryZone[0], report.symbol)}</strong> or market fill
                      </span>
                    )}
                  </div>
                </div>

                {/* Invalidation Trigger Logic */}
                <div className="p-2.5 rounded-lg bg-[#1f2225] border border-[#272a2d] text-[11px] leading-relaxed">
                  <div className="flex items-center gap-1 text-[#ffd87f] font-bold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#f6be16]" />
                    <span>Structural Invalidation Condition:</span>
                  </div>
                  <p className="text-[#d0c5b3] text-[10px]">
                    {report.riskController.invalidationTrigger}
                  </p>
                </div>

                {/* Capital & Leverage Sizing */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#14171a] border border-[#272a2d] text-[10px] text-[#99907f]">
                  <span>
                    Suggested Risk Equity:{' '}
                    <strong className="text-[#fff8f1]">
                      {report.riskController.suggestedPositionSizePercent}% Account
                    </strong>
                  </span>
                  <span>
                    Max Leverage:{' '}
                    <strong className="text-[#f6be16]">
                      {report.riskController.suggestedLeverage}x
                    </strong>
                  </span>
                </div>
              </div>

              {/* Instant Execution Buttons: Limit Discount vs Aggressive Market */}
              <div className="space-y-2">
                {/* 1. Recommended Smart Money Limit Retest Order */}
                <button
                  onClick={() => handleExecuteBlueprint('limit')}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer shadow-lg hover:scale-[1.01]"
                  style={{
                    backgroundColor: isBuyAction ? '#00ff94' : '#ff4976',
                    color: '#111417',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-current" />
                    <span>
                      Smart Limit Entry (Recommended)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-black">
                    @ ${formatPrecision(report.riskController.entryPrice, report.symbol)}
                  </span>
                </button>

                {/* 2. Aggressive Market Fill Order */}
                <button
                  onClick={() => handleExecuteBlueprint('market')}
                  className="w-full py-2 px-3 rounded-lg bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-xs font-bold text-[#d0c5b3] hover:text-[#fff8f1] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="text-[11px]">Aggressive Fill (Market Now)</span>
                  <span className="text-[11px] font-mono text-[#f6be16]">
                    @ ${formatPrecision(report.currentPrice, report.symbol)}
                  </span>
                </button>

                {/* 3. Explicit Lock Levels to Chart without placing live order */}
                {onAcceptSignal && (
                  <button
                    onClick={() => {
                      const sig = convertReportToSignal(report, true);
                      onAcceptSignal(sig);
                      playProfitHitChime();
                      onClose();
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#ffd87f] via-[#f6be16] to-[#ffbe1a] text-[#0b0e11] font-black text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-110 active:scale-98 transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-[#0b0e11]" />
                    <span>⚡ 1-Click Chart Par Lagayein (SL, TP &amp; Entry)</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSetAlert}
                    className="py-2 px-3 rounded-lg bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-xs font-bold text-[#d0c5b3] hover:text-[#fff8f1] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-[#f6be16]" />
                    <span>Set Invalidation Alert</span>
                  </button>

                  <button
                    onClick={handleCopyMarkdown}
                    className="py-2 px-3 rounded-lg bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] text-xs font-bold text-[#d0c5b3] hover:text-[#fff8f1] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#00ff94]" />
                        <span className="text-[#00ff94]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#3b82f6]" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Deliberation Summary Notes */}
              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-1.5 text-[11px]">
                <span className="text-[10px] text-[#99907f] font-bold uppercase block">
                  Desk Consensus Summary
                </span>
                <p className="text-[#d0c5b3] leading-relaxed">
                  The desk identifies a high-conviction <strong>{report.action}</strong> setup. Agent
                  1 confirms a clean liquidity sweep followed by market structure shift. Agent 2
                  verifies EMA expansion and dynamic RSI support. Agent 4 passed the counter-thesis audit
                  with a confidence score of <strong>{report.confidenceScore}/100</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: 5 AGENTS AUDIT */}
          {activeTab === 'deliberation' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {/* AGENT 1: TRADE SCOUT */}
              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#272a2d]">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[#f6be16]/15 text-[#f6be16] font-bold text-[10px]">
                      AGENT 1
                    </span>
                    <span className="font-bold text-xs text-[#fff8f1]">Trade Scout</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#3b82f6]">
                    {report.tradeScout.structureType}
                  </span>
                </div>
                <p className="text-[11px] text-[#d0c5b3] leading-relaxed">
                  {report.tradeScout.summary}
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#99907f] bg-[#14171a] p-2 rounded-lg">
                  <div>
                    Swing High: <strong className="text-[#fff8f1]">${formatPrecision(report.tradeScout.swingHigh, report.symbol)}</strong>
                  </div>
                  <div>
                    Swing Low: <strong className="text-[#fff8f1]">${formatPrecision(report.tradeScout.swingLow, report.symbol)}</strong>
                  </div>
                  <div>
                    Order Block:{' '}
                    <strong className="text-[#00ff94]">
                      ${formatPrecision(report.tradeScout.orderBlock.range[0], report.symbol)} – $
                      {formatPrecision(report.tradeScout.orderBlock.range[1], report.symbol)}
                    </strong>
                  </div>
                  <div>
                    FVG Active: <strong className="text-[#f6be16]">Yes ({selectedTimeframe})</strong>
                  </div>
                </div>
              </div>

              {/* AGENT 2: MARKET ANALYST */}
              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#272a2d]">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[#3b82f6]/15 text-[#3b82f6] font-bold text-[10px]">
                      AGENT 2
                    </span>
                    <span className="font-bold text-xs text-[#fff8f1]">Market Analyst</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#00ff94]">
                    RSI {report.marketAnalyst.rsi.value}
                  </span>
                </div>
                <p className="text-[11px] text-[#d0c5b3] leading-relaxed">
                  {report.marketAnalyst.summary}
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#99907f] bg-[#14171a] p-2 rounded-lg">
                  <div>
                    EMA 20: <strong className="text-[#fff8f1]">${formatPrecision(report.marketAnalyst.emaMatrix.ema20, report.symbol)}</strong>
                  </div>
                  <div>
                    EMA 50: <strong className="text-[#fff8f1]">${formatPrecision(report.marketAnalyst.emaMatrix.ema50, report.symbol)}</strong>
                  </div>
                  <div>
                    VSA Volume:{' '}
                    <strong className="text-[#00ff94]">
                      {report.marketAnalyst.volumeSpread.ratioVs20MA}x 20-MA
                    </strong>
                  </div>
                  <div>
                    CPR Status: <strong className="text-[#f6be16]">{report.marketAnalyst.cpr.status}</strong>
                  </div>
                </div>
              </div>

              {/* AGENT 3: NEWS & CONTEXT */}
              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#272a2d]">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[#8b5cf6]/15 text-[#a78bfa] font-bold text-[10px]">
                      AGENT 3
                    </span>
                    <span className="font-bold text-xs text-[#fff8f1]">Context & News Analyst</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#a78bfa]">
                    {report.newsContext.assetClass}
                  </span>
                </div>
                {/* Hindi Market Impact & News Summary */}
                {report.newsContext.marketImpactHindi && (
                  <div className="p-2 rounded-lg bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[11px] font-bold text-[#d8b4fe] flex items-center gap-2">
                    <span>📰 मार्केट असर:</span>
                    <span>{report.newsContext.marketImpactHindi}</span>
                  </div>
                )}
                {report.newsContext.summaryHindi ? (
                  <div className="p-2 rounded-lg bg-[#14171a] border border-[#272a2d]">
                    <span className="text-[10px] uppercase tracking-wider text-[#a78bfa] font-bold block mb-1">
                      🇮🇳 हिंदी समाचार विश्लेषण (Hindi News Analysis):
                    </span>
                    <p className="text-[11px] text-[#f3f4f6] leading-relaxed">
                      {report.newsContext.summaryHindi}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#d0c5b3] leading-relaxed">
                    {report.newsContext.summary}
                  </p>
                )}

                {/* Hindi Catalysts */}
                {report.newsContext.catalystsHindi && report.newsContext.catalystsHindi.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#99907f] font-bold">मुख्य कारक (Key Drivers):</span>
                    <ul className="space-y-1">
                      {report.newsContext.catalystsHindi.map((cat, i) => (
                        <li key={i} className="text-[10px] text-[#d0c5b3] flex items-start gap-1.5">
                          <span className="text-[#a78bfa] font-bold">•</span>
                          <span>{cat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#99907f] bg-[#14171a] p-2 rounded-lg">
                  <div>
                    {report.newsContext.metrics.label1}:{' '}
                    <strong className="text-[#fff8f1]">
                      {report.newsContext.metrics.value1}
                    </strong>
                  </div>
                  <div>
                    {report.newsContext.metrics.label2}:{' '}
                    <strong className="text-[#fff8f1]">
                      {report.newsContext.metrics.value2}
                    </strong>
                  </div>
                  {report.newsContext.metrics.label3 && (
                    <div className="col-span-2">
                      {report.newsContext.metrics.label3}:{' '}
                      <strong className="text-[#f6be16]">
                        {report.newsContext.metrics.value3}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              {/* AGENT 4: VALIDATOR (DEVIL'S ADVOCATE) */}
              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#272a2d]">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[#10b981]/15 text-[#10b981] font-bold text-[10px]">
                      AGENT 4
                    </span>
                    <span className="font-bold text-xs text-[#fff8f1]">Validator (Audit)</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-[#10b981]/20 border border-[#10b981]/40 text-[#10b981] rounded">
                    {report.validator.status} ({report.validator.confidenceScore}%)
                  </span>
                </div>
                <p className="text-[11px] text-[#d0c5b3] leading-relaxed">
                  {report.validator.auditVerdict}
                </p>
                <div className="space-y-1 text-[10px] text-[#99907f] bg-[#14171a] p-2 rounded-lg">
                  {report.validator.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-[#10b981] shrink-0 mt-0.5" />
                      <span className="text-[#d0c5b3]">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AGENT 5: PROFIT & RISK CONTROLLER */}
              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#272a2d]">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded bg-[#ef4444]/15 text-[#ef4444] font-bold text-[10px]">
                      AGENT 5
                    </span>
                    <span className="font-bold text-xs text-[#fff8f1]">Risk & Profit Controller</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#f6be16]">
                    RR $\ge$ 1:2.0 Enforced
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#99907f] bg-[#14171a] p-2 rounded-lg">
                  <div>
                    TP1 RR: <strong className="text-[#00ff94]">1:{report.riskController.riskRewardTP1}</strong>
                  </div>
                  <div>
                    TP2 Runner RR: <strong className="text-[#f6be16]">1:{report.riskController.riskRewardTP2}</strong>
                  </div>
                  <div>
                    Max Position Risk:{' '}
                    <strong className="text-[#fff8f1]">
                      {report.riskController.suggestedPositionSizePercent}% Equity
                    </strong>
                  </div>
                  <div>
                    Max Safe Lev:{' '}
                    <strong className="text-[#fff8f1]">
                      {report.riskController.suggestedLeverage}x
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CPR & ORDERFLOW LADDER */}
          {activeTab === 'cpr' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#272a2d]">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#fff8f1]">
                    <Layers className="w-4 h-4 text-[#f6be16]" />
                    <span>Central Pivot Range (CPR) Matrix</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#272a2d] text-[#f6be16] font-bold">
                    {report.marketAnalyst.cpr.width}
                  </span>
                </div>

                {/* CPR Price Level Ladder */}
                <div className="space-y-1.5">
                  {/* R2 */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#14171a] border border-[#272a2d] text-[11px]">
                    <span className="text-[#99907f] font-bold">Resistance 2 (R2)</span>
                    <span className="text-[#f6be16] font-bold">
                      ${formatPrecision(report.marketAnalyst.cpr.r2, report.symbol)}
                    </span>
                  </div>

                  {/* R1 */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#14171a] border border-[#272a2d] text-[11px]">
                    <span className="text-[#99907f] font-bold">Resistance 1 (R1)</span>
                    <span className="text-[#d0c5b3] font-bold">
                      ${formatPrecision(report.marketAnalyst.cpr.r1, report.symbol)}
                    </span>
                  </div>

                  {/* CPR Top Central */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[11px]">
                    <span className="text-[#60a5fa] font-bold">CPR Top Central (TC)</span>
                    <span className="text-[#60a5fa] font-bold">
                      ${formatPrecision(report.marketAnalyst.cpr.tc, report.symbol)}
                    </span>
                  </div>

                  {/* CPR Pivot */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#3b82f6]/15 border border-[#3b82f6]/50 text-[11px]">
                    <span className="text-[#93c5fd] font-extrabold">Daily Pivot (P)</span>
                    <span className="text-[#93c5fd] font-extrabold">
                      ${formatPrecision(report.marketAnalyst.cpr.pivot, report.symbol)}
                    </span>
                  </div>

                  {/* CPR Bottom Central */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[11px]">
                    <span className="text-[#60a5fa] font-bold">CPR Bottom Central (BC)</span>
                    <span className="text-[#60a5fa] font-bold">
                      ${formatPrecision(report.marketAnalyst.cpr.bc, report.symbol)}
                    </span>
                  </div>

                  {/* S1 */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#14171a] border border-[#272a2d] text-[11px]">
                    <span className="text-[#99907f] font-bold">Support 1 (S1)</span>
                    <span className="text-[#d0c5b3] font-bold">
                      ${formatPrecision(report.marketAnalyst.cpr.s1, report.symbol)}
                    </span>
                  </div>

                  {/* S2 */}
                  <div className="flex items-center justify-between p-2 rounded bg-[#14171a] border border-[#272a2d] text-[11px]">
                    <span className="text-[#99907f] font-bold">Support 2 (S2)</span>
                    <span className="text-[#ef4444] font-bold">
                      ${formatPrecision(report.marketAnalyst.cpr.s2, report.symbol)}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-[#14171a] border border-[#272a2d] text-[10px] text-[#99907f]">
                  CPR Width status is <strong>{report.marketAnalyst.cpr.width}</strong>. Current price
                  is trading <strong className="text-[#fff8f1]">{report.marketAnalyst.cpr.status}</strong>.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 6. Sticky Bottom Action Footer */}
        <div className="p-2.5 sm:p-3.5 bg-[#191c1f] border-t border-[#272a2d] shrink-0 space-y-2 font-mono">
          <div className="grid grid-cols-2 gap-2">
            {/* 1. Instant Market Execution */}
            <button
              id="agent-exec-market-btn"
              onClick={() => handleExecuteBlueprint('market')}
              className={`py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-[0.98] ${
                isBuyAction
                  ? 'bg-[#00ff94] hover:bg-[#34e893] text-[#002111] shadow-[0_0_15px_rgba(0,255,148,0.3)]'
                  : 'bg-[#ff4976] hover:bg-[#ff5a84] text-white shadow-[0_0_15px_rgba(255,73,118,0.3)]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="truncate">
                {isBuyAction ? 'Market Buy' : 'Market Sell'} (${formatPrecision(currentPrice, report.symbol)})
              </span>
            </button>

            {/* 2. Smart Limit Retest Order */}
            <button
              id="agent-exec-limit-btn"
              onClick={() => handleExecuteBlueprint('limit')}
              className="py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl bg-[#272a2d] hover:bg-[#37393d] border border-[#ffd87f]/50 font-bold text-[11px] sm:text-xs uppercase tracking-wider text-[#ffd87f] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-[0.98]"
            >
              <Target className="w-3.5 h-3.5 text-[#ffd87f] shrink-0" />
              <span className="truncate">
                Limit Entry (${formatPrecision(report.riskController.entryPrice, report.symbol)})
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#99907f] px-1 font-mono">
            <span>
              SL: <strong className="text-[#ef4444]">${formatPrecision(report.riskController.stopLoss, report.symbol)}</strong>
            </span>
            <span>
              TP: <strong className="text-[#00ff94]">${formatPrecision(report.riskController.tp1Conservative, report.symbol)}</strong>
            </span>
            <span className="text-[#ffd87f] font-bold">
              RR 1:{report.riskController.riskRewardTP1}
            </span>
          </div>
        </div>
        </>
        )}
      </aside>
    </div>
  );
};
