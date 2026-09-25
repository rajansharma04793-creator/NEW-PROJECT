import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Target,
  Sparkles,
  Zap,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  HelpCircle,
  Eye,
  Check,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Cpu,
  Clock,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playAlertChime, playProfitHitChime } from '../utils/soundEffects';

interface TradeLearningTooltipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAgentDeliberation?: () => void;
  currentPair?: string;
  currentPrice?: number;
}

export const TradeLearningTooltipModal: React.FC<TradeLearningTooltipModalProps> = ({
  isOpen,
  onClose,
  onOpenAgentDeliberation,
  currentPair = 'BTC/USDT',
  currentPrice = 68450,
}) => {
  const TOTAL_STEPS = 4;
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [language, setLanguage] = useState<'hinglish' | 'english'>('hinglish');
  
  // Interactive Simulator state in Step 4
  const [simSide, setSimSide] = useState<'BUY' | 'SELL'>('BUY');
  const [simIsLocked, setSimIsLocked] = useState<boolean>(true);
  const [simExecuted, setSimExecuted] = useState<boolean>(false);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  // Strict clamp helper for finite state machine
  const setClampedStep = (stepOrFn: number | ((prev: number) => number)) => {
    setCurrentStep((prev) => {
      const next = typeof stepOrFn === 'function' ? stepOrFn(prev) : stepOrFn;
      return Math.max(1, Math.min(next, TOTAL_STEPS));
    });
  };

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSimExecuted(false);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    try {
      localStorage.setItem('coindcx_trade_learning_tooltip_seen', 'true');
      localStorage.setItem('onboarding_completed', 'true');
    } catch {
      // ignore storage errors
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setClampedStep((prev) => prev + 1);
      playAlertChime();
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    setClampedStep((prev) => prev - 1);
  };

  const handleComplete = () => {
    handleClose();
    if (onOpenAgentDeliberation) {
      onOpenAgentDeliberation();
    }
  };

  const handleSimulateExecution = () => {
    setSimExecuted(true);
    playProfitHitChime();
    confetti({
      particleCount: 55,
      spread: 70,
      origin: { y: 0.6 },
      colors: simSide === 'BUY' ? ['#00ff94', '#38bdf8', '#ffd87f'] : ['#ff4976', '#ffd87f', '#ffffff'],
    });
  };

  return (
    <div
      id="trade-learning-tooltip-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trade-learning-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#111417] border border-[#272a2d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 bg-[#161a1e] border-b border-[#272a2d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/15 border border-[#3b82f6]/40 flex items-center justify-center text-[#60a5fa]">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span id="trade-learning-title" className="font-extrabold text-sm text-[#fff8f1] tracking-wide font-mono">
                  TRADE LEARNING WALKTHROUGH
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3b82f6]/20 text-[#60a5fa] font-bold border border-[#3b82f6]/30">
                  Step {Math.min(currentStep, TOTAL_STEPS)} of {TOTAL_STEPS}
                </span>
              </div>
              <p className="text-[11px] text-[#99907f]">
                {language === 'hinglish'
                  ? '5-Agent System aur TP/SL Suggestions ka aasan guide'
                  : 'Master the 5-Agent Framework & Institutional Suggestions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex items-center bg-[#0d0f11] p-0.5 rounded-lg border border-[#272a2d] text-[11px] font-bold">
              <button
                onClick={() => setLanguage('hinglish')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  language === 'hinglish'
                    ? 'bg-[#ffd87f]/20 text-[#ffd87f]'
                    : 'text-[#99907f] hover:text-white'
                }`}
              >
                Hinglish / हिंदी
              </button>
              <button
                onClick={() => setLanguage('english')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  language === 'english'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8]'
                    : 'text-[#99907f] hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg bg-[#272a2d]/60 hover:bg-[#272a2d] text-[#99907f] hover:text-white transition-all cursor-pointer"
              title="Close Walkthrough"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-4 gap-1.5 px-5 pt-3 bg-[#111417]">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`h-1.5 rounded-full cursor-pointer transition-all ${
                step === currentStep
                  ? 'bg-[#ffd87f] shadow-[0_0_8px_rgba(255,216,127,0.5)]'
                  : step < currentStep
                  ? 'bg-[#00ff94]'
                  : 'bg-[#272a2d]'
              }`}
            />
          ))}
        </div>

        {/* Body Content Slider */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-sans">
          {/* STEP 1: 5-AGENT FRAMEWORK */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-[#161a1e] border border-[#3b82f6]/30 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#3b82f6]/20 text-[#60a5fa] shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#fff8f1] font-mono">
                    {language === 'hinglish'
                      ? '1. 5-Agent Desk Kya Hai? (No Blind Guessing)'
                      : '1. What is the 5-Agent Quantitative Desk?'}
                  </h3>
                  <p className="text-[11px] text-[#cfcfcf] mt-1 leading-relaxed">
                    {language === 'hinglish'
                      ? 'Yeh 5 alag-alag institutional AI agents ka deliberation desk hai jo har trade par voting karte hain. Jab kam se kam 4 agents agree karte hain, tabhi validated blueprint banta hai.'
                      : 'An institutional multi-agent framework where 5 specialized quantitative agents audit market structure, CPR pivots, and orderflow before validating any trade setup.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#161a1e] border border-[#272a2d]">
                  <div className="flex items-center gap-2 text-[#38bdf8] font-bold font-mono text-[11px] mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#38bdf8]/20 flex items-center justify-center text-[10px]">
                      1
                    </span>
                    <span>Scout: SMC & Market Structure</span>
                  </div>
                  <p className="text-[#99907f] text-[11px] leading-relaxed">
                    {language === 'hinglish'
                      ? 'Break of Structure (BOS), Change of Character (CHoCH), aur Liquidity Sweeps detect karta hai.'
                      : 'Detects structural breaks (BOS/CHoCH), fair value gaps (FVG), and liquidity sweeps.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#161a1e] border border-[#272a2d]">
                  <div className="flex items-center gap-2 text-[#ffd87f] font-bold font-mono text-[11px] mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#ffd87f]/20 flex items-center justify-center text-[10px]">
                      2
                    </span>
                    <span>Analyst: CPR & Institutional Pivots</span>
                  </div>
                  <p className="text-[#99907f] text-[11px] leading-relaxed">
                    {language === 'hinglish'
                      ? 'Daily Pivot, Central Pivot Range (TC/BC), aur institutional S1/R1 levels calculate karta hai.'
                      : 'Calculates Central Pivot Range (TC, Pivot, BC), Virgin CPR, and institutional bounce levels.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#161a1e] border border-[#272a2d]">
                  <div className="flex items-center gap-2 text-[#00ff94] font-bold font-mono text-[11px] mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#00ff94]/20 flex items-center justify-center text-[10px]">
                      3
                    </span>
                    <span>Orderflow & Volume Delta</span>
                  </div>
                  <p className="text-[#99907f] text-[11px] leading-relaxed">
                    {language === 'hinglish'
                      ? 'Buyer vs Seller aggression aur volume absorption walls track karta hai.'
                      : 'Measures net volume delta, buyer/seller aggression, and limit orderbook absorption.'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#161a1e] border border-[#272a2d]">
                  <div className="flex items-center gap-2 text-[#ec4899] font-bold font-mono text-[11px] mb-1">
                    <span className="w-5 h-5 rounded-full bg-[#ec4899]/20 flex items-center justify-center text-[10px]">
                      4
                    </span>
                    <span>Momentum & MTF Alignment</span>
                  </div>
                  <p className="text-[#99907f] text-[11px] leading-relaxed">
                    {language === 'hinglish'
                      ? '15m, 1h, aur 4h trends ko match karta hai taaki aap counter-trend trap mein na fasein.'
                      : 'Ensures higher timeframe (1h/4h) alignment with lower timeframe execution.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#161a1e] border border-[#22c55e]/30 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#22c55e]/20 text-[#22c55e] shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[#22c55e] font-bold font-mono text-[11px]">
                    Agent 5: Risk Controller & Invalidation Enforcer
                  </div>
                  <p className="text-[#cfcfcf] text-[11px] leading-relaxed mt-0.5">
                    {language === 'hinglish'
                      ? 'Yeh mandatory rule lagata hai: Har trade mein minimum 1:2 Risk-to-Reward hona chahiye, warna trade invalidate ho jayegi!'
                      : 'Enforces a strict minimum 1:2 Risk-to-Reward ratio and invalidates setups if the stop loss is too wide.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SUGGESTIONS VS BINDING ORDERS */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-[#ffd87f]/10 border border-[#ffd87f]/40 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#ffd87f]/20 text-[#ffd87f] shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#ffd87f] font-mono">
                    {language === 'hinglish'
                      ? 'Sabse Zaroori Baat: TP & SL Sirf Suggestions Hain!'
                      : 'Crucial Distinction: TP & SL Are Institutional Suggestions'}
                  </h3>
                  <p className="text-[11px] text-[#e5e5e5] mt-1 leading-relaxed">
                    {language === 'hinglish'
                      ? 'Screen par dikhne wale Entry, Target aur Stop Loss levels mathematical reference suggestions hain. Ye koi binding order nahi hain aur aapke account se koi paisa automatically nahi kat-ta.'
                      : 'Levels shown in the 5-Agent Blueprint and Smart Entry Radar are dynamic mathematical references, NOT binding orders, until you explicitly execute.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#161a1e] border border-[#272a2d] space-y-2">
                  <div className="flex items-center gap-2 text-[#00ff94] font-bold font-mono text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'hinglish' ? 'Ye Kya Hai?' : 'What It IS:'}</span>
                  </div>
                  <ul className="text-[11px] text-[#cfcfcf] space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>
                      {language === 'hinglish'
                        ? 'Institutional CPR Pivot aur liquidity sweeps se bana safe blueprint.'
                        : 'Institutional CPR pivot and liquidity blueprint for reference.'}
                    </li>
                    <li>
                      {language === 'hinglish'
                        ? 'Mathematical guide jo batata hai ki kahan enter karne par risk sabse kam aur reward sabse zyada hoga.'
                        : 'Optimal risk-to-reward boundary calculations.'}
                    </li>
                    <li>
                      {language === 'hinglish'
                        ? 'Execute button dabane par automatically TP/SL bracket order set karta hai.'
                        : 'Pre-fills your bracket order upon 1-click execution.'}
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161a1e] border border-[#ff4976]/30 space-y-2">
                  <div className="flex items-center gap-2 text-[#ff4976] font-bold font-mono text-xs">
                    <X className="w-4 h-4" />
                    <span>{language === 'hinglish' ? 'Ye Kya NAHI Hai?' : 'What It IS NOT:'}</span>
                  </div>
                  <ul className="text-[11px] text-[#cfcfcf] space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>
                      {language === 'hinglish'
                        ? 'Koi automatic forced trade nahi hai. Aapki marzi ke bina trade place nahi hoti.'
                        : 'Not an automatic or binding transaction.'}
                    </li>
                    <li>
                      {language === 'hinglish'
                        ? 'Pehle se locked trade nahi hai. Aap chahein toh levels adjust kar sakte hain.'
                        : 'No funds are locked until you submit an order.'}
                    </li>
                    <li>
                      {language === 'hinglish'
                        ? 'Numbers tick ke sath update hote hain taaki R:R best rahe.'
                        : 'Recalculates with live price movements unless locked.'}
                    </li>
                  </ul>
                </div>
              </div>

              {/* Solution: Lock Levels feature */}
              <div className="p-3 rounded-xl bg-[#1a1f24] border border-[#ffd87f]/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#ffd87f]/20 text-[#ffd87f]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#ffd87f] font-mono">
                      {language === 'hinglish'
                        ? 'Solution: "Levels Fixed 🔒" (Freeze Button)'
                        : 'Solution: "Levels Fixed 🔒" Button'}
                    </div>
                    <p className="text-[10px] text-[#99907f] mt-0.5">
                      {language === 'hinglish'
                        ? 'Agar har second numbers badalne se confusion ho, toh upar Lock button dabayein. Numbers turant freeze ho jayenge!'
                        : 'Click "Levels Fixed 🔒" in the overlay header to freeze recalculations and evaluate calmly.'}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 px-2 py-1 rounded bg-[#ffd87f]/20 text-[#ffd87f] text-[10px] font-mono font-bold border border-[#ffd87f]/40">
                  FEATURED
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: EXECUTION PATHWAYS */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-[#161a1e] border border-[#272a2d] flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#00ff94]/20 text-[#00ff94] shrink-0 mt-0.5">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#fff8f1] font-mono">
                    {language === 'hinglish'
                      ? 'Kaise Trade Karein? (2 Simple Execution Options)'
                      : 'How to Execute: 2 Institutional Pathways'}
                  </h3>
                  <p className="text-[11px] text-[#99907f] mt-1 leading-relaxed">
                    {language === 'hinglish'
                      ? 'Aapko manually price, stop loss aur target type karne ki zaroorat nahi hai. Niche 2 automated buttons diye gaye hain:'
                      : 'No need to manually type order parameters. Choose between Instant Market and Limit Retest:'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#161a1e] border border-[#00ff94]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#00ff94] text-xs font-mono">
                      ⚡ 1. INSTANT MARKET ORDER
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#00ff94]/20 text-[#00ff94] rounded font-mono font-bold">
                      Fast Fill
                    </span>
                  </div>
                  <p className="text-[11px] text-[#cfcfcf] leading-relaxed">
                    {language === 'hinglish'
                      ? 'Jab market breakout ho raha ho aur aapko turant live price par enter hona ho. Ye turant market order place karta hai aur sath mein Stop Loss aur Target 1 apne aap feed kar deta hai.'
                      : 'Fills instantly at current market price. Automatically attaches protective stop loss and target 1 bracket orders.'}
                  </p>
                  <div className="p-2 rounded bg-[#0f1215] text-[10px] text-[#99907f] font-mono">
                    Best for: Momentum moves, breakouts, instant fills
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161a1e] border border-[#ffd87f]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#ffd87f] text-xs font-mono">
                      ⏳ 2. LIMIT RETEST (SMART MONEY)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#ffd87f]/20 text-[#ffd87f] rounded font-mono font-bold">
                      Best R:R
                    </span>
                  </div>
                  <p className="text-[11px] text-[#cfcfcf] leading-relaxed">
                    {language === 'hinglish'
                      ? 'Smart money traders upar chadh kar FOMO buy nahi karte. Wo price ke Bounce/Pullback zone par aane ka intezar karte hain. Yeh pending limit order set kar deta hai.'
                      : 'Places a pending limit order at the optimal institutional pullback / bounce zone to achieve maximum risk-to-reward.'}
                  </p>
                  <div className="p-2 rounded bg-[#0f1215] text-[10px] text-[#99907f] font-mono">
                    Best for: Patient entries, pullbacks, lowest risk
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0f1215] border border-[#272a2d] flex items-center justify-between text-[11px]">
                <div className="text-[#99907f]">
                  {language === 'hinglish'
                    ? 'Golden Rule: Kabhi bhi ek trade mein apne balance ka 1-2% se zyada risk na lein.'
                    : 'Golden Rule: Never risk more than 1-2% of total equity per single trade.'}
                </div>
                <span className="text-[#ffd87f] font-mono font-bold shrink-0">1:2+ R:R ONLY</span>
              </div>
            </div>
          )}

          {/* STEP 4: INTERACTIVE HANDS-ON SIMULATOR */}
          {currentStep === 4 && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              <div className="p-3 rounded-xl bg-[#161a1e] border border-[#272a2d] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#fff8f1] font-mono">
                    {language === 'hinglish'
                      ? 'Practice Karein: Interactive Trade Sandbox'
                      : 'Hands-On Practice Simulator'}
                  </h3>
                  <p className="text-[10px] text-[#99907f] mt-0.5">
                    {language === 'hinglish'
                      ? 'Niche diye controls se test karein ki desk kaise kaam karta hai'
                      : 'Try the controls below to understand how the desk functions in real-time'}
                  </p>
                </div>

                {/* Direction Switcher */}
                <div className="flex bg-[#0d0f11] p-0.5 rounded-lg border border-[#272a2d]">
                  <button
                    onClick={() => {
                      setSimSide('BUY');
                      setSimExecuted(false);
                    }}
                    className={`px-2.5 py-1 text-xs rounded font-bold cursor-pointer transition-all ${
                      simSide === 'BUY'
                        ? 'bg-[#00ff94] text-[#002111]'
                        : 'text-[#99907f] hover:text-[#00ff94]'
                    }`}
                  >
                    BUY (Long)
                  </button>
                  <button
                    onClick={() => {
                      setSimSide('SELL');
                      setSimExecuted(false);
                    }}
                    className={`px-2.5 py-1 text-xs rounded font-bold cursor-pointer transition-all ${
                      simSide === 'SELL'
                        ? 'bg-[#ff4976] text-white'
                        : 'text-[#99907f] hover:text-[#ff4976]'
                    }`}
                  >
                    SELL (Short)
                  </button>
                </div>
              </div>

              {/* Mock Blueprint Card */}
              <div className="p-3.5 rounded-xl bg-[#161a1e] border border-[#272a2d] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#272a2d]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded font-mono ${
                        simSide === 'BUY'
                          ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40'
                          : 'bg-[#ff4976]/20 text-[#ff4976] border border-[#ff4976]/40'
                      }`}
                    >
                      {simSide} BLUEPRINT
                    </span>
                    <span className="text-[11px] text-[#fff8f1] font-mono font-bold">
                      {currentPair} (${currentPrice.toLocaleString()})
                    </span>
                  </div>

                  <button
                    onClick={() => setSimIsLocked(!simIsLocked)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                      simIsLocked
                        ? 'bg-[#ffd87f]/20 border-[#ffd87f] text-[#ffd87f]'
                        : 'bg-[#0f1215] border-[#272a2d] text-[#99907f]'
                    }`}
                  >
                    {simIsLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    <span>{simIsLocked ? 'Levels Fixed 🔒' : 'Live Mode'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded bg-[#0d0f11] border border-[#272a2d]">
                    <span className="text-[9px] text-[#99907f] block">OPTIMAL ENTRY</span>
                    <span className="text-[#fff8f1] font-bold">
                      ${simSide === 'BUY' ? (currentPrice * 0.995).toFixed(1) : (currentPrice * 1.005).toFixed(1)}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-[#0d0f11] border border-[#ef4444]/30">
                    <span className="text-[9px] text-[#ef4444] block">STOP LOSS</span>
                    <span className="text-[#ef4444] font-bold">
                      ${simSide === 'BUY' ? (currentPrice * 0.985).toFixed(1) : (currentPrice * 1.015).toFixed(1)}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-[#0d0f11] border border-[#00ff94]/30">
                    <span className="text-[9px] text-[#00ff94] block">TARGET 1 (TP)</span>
                    <span className="text-[#00ff94] font-bold">
                      ${simSide === 'BUY' ? (currentPrice * 1.025).toFixed(1) : (currentPrice * 0.975).toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Simulation button */}
                <button
                  onClick={handleSimulateExecution}
                  className={`w-full py-2.5 px-3 rounded-xl font-bold font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md ${
                    simExecuted
                      ? 'bg-[#00ff94]/20 border border-[#00ff94] text-[#00ff94]'
                      : simSide === 'BUY'
                      ? 'bg-[#00ff94] hover:bg-[#34e893] text-[#002111]'
                      : 'bg-[#ff4976] hover:bg-[#ff5a84] text-white'
                  }`}
                >
                  {simExecuted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#00ff94]" />
                      <span>DEMO ORDER EXECUTED! (TP &amp; SL AUTO-SET) ✅</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>Simulate 1-Click {simSide} Execution</span>
                    </>
                  )}
                </button>
              </div>

              {simExecuted && (
                <div className="p-3 rounded-xl bg-[#00ff94]/10 border border-[#00ff94]/30 flex items-center gap-2.5 text-[11px] text-[#00ff94]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {language === 'hinglish'
                      ? 'Shabash! Dekha? Stop Loss aur Take Profit automatically lag gaye aur aapko koi manual calculation nahi karni padi.'
                      : 'Awesome! Notice how Take Profit & Stop Loss are automatically populated with optimal risk limits.'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Navigation & Controls Footer */}
        <div className="px-5 py-3.5 bg-[#161a1e] border-t border-[#272a2d] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px] text-[#99907f] cursor-pointer hover:text-white select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-[#37393d] bg-[#0d0f11] text-[#3b82f6] focus:ring-0 cursor-pointer"
              />
              <span>{language === 'hinglish' ? 'Agle time na dikhayein' : "Don't show again"}</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] font-mono text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === 'hinglish' ? 'Peeche' : 'Back'}</span>
              </button>
            )}

            {currentStep < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded-xl bg-[#ffd87f] hover:bg-[#ffe399] text-[#221c00] font-mono text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
              >
                <span>{language === 'hinglish' ? 'Aage (Next)' : 'Next Step'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-4 py-1.5 rounded-xl bg-[#00ff94] hover:bg-[#34e893] text-[#002111] font-mono text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,255,148,0.3)] transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Finish / Get Started</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
