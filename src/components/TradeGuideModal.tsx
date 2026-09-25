import React, { useState } from 'react';
import { AssetPair, TickerInfo } from '../types';
import {
  X,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Play,
  CheckCircle2,
  DollarSign,
  Zap,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSignalAlertSound } from '../utils/soundEffects';

interface TradeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: AssetPair;
  ticker?: TickerInfo;
  balance: number;
  currencyMode?: 'USDT' | 'INR';
  onPlaceQuickTrade: (params: {
    symbol: AssetPair;
    side: 'buy' | 'sell';
    takeProfitPercent: number;
    stopLossPercent: number;
  }) => void;
}

export const TradeGuideModal: React.FC<TradeGuideModalProps> = ({
  isOpen,
  onClose,
  currentPair,
  ticker,
  balance,
  currencyMode = 'USDT',
  onPlaceQuickTrade,
}) => {
  const [selectedTab, setSelectedTab] = useState<'steps' | 'faq' | 'tips'>('steps');
  const [testTradeSide, setTestTradeSide] = useState<'buy' | 'sell'>('buy');

  if (!isOpen) return null;

  const price = ticker?.price || 100;
  const isINR = currencyMode === 'INR' && ticker?.inrPrice && ticker.inrPrice > 0;
  const displayPrice = isINR ? `₹${ticker.inrPrice.toLocaleString('en-IN')}` : `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const handleExecuteDemoTrade = (side: 'buy' | 'sell') => {
    playSignalAlertSound(side === 'buy' ? 'LONG' : 'SHORT');
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: side === 'buy' ? ['#00ff94', '#61feaf', '#ffd87f'] : ['#ff3b4a', '#ffd2d1'],
    });

    onPlaceQuickTrade({
      symbol: currentPair,
      side,
      takeProfitPercent: 3.5,
      stopLossPercent: 1.5,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="relative w-full max-w-2xl bg-[#14171a] border border-[#272a2d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#191c1f] border-b border-[#272a2d]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#00ff94]/15 border border-[#00ff94]/30 text-[#00ff94]">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#fff8f1] flex items-center gap-2">
                <span>ट्रेड कैसे लें और प्रॉफिट कैसे बनाएं?</span>
                <span className="px-2 py-0.5 rounded-full bg-[#00ff94]/20 text-[#00ff94] text-[10px] font-bold">
                  Easy Trading Guide
                </span>
              </h2>
              <p className="text-[11px] text-[#99907f]">
                सरल 4 स्टेप्स में समझें — 1-Click में ट्रेड लगाएं और मुनाफा बुक करें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#272a2d] bg-[#111417] text-xs font-bold">
          <button
            onClick={() => setSelectedTab('steps')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              selectedTab === 'steps'
                ? 'border-[#00ff94] text-[#00ff94] bg-[#191c1f]'
                : 'border-transparent text-[#99907f] hover:text-[#fff8f1]'
            }`}
          >
            🚀 4 आसान स्टेप्स (Trade Steps)
          </button>
          <button
            onClick={() => setSelectedTab('faq')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              selectedTab === 'faq'
                ? 'border-[#00ff94] text-[#00ff94] bg-[#191c1f]'
                : 'border-transparent text-[#99907f] hover:text-[#fff8f1]'
            }`}
          >
            ❓ अक्सर पूछे जाने वाले सवाल (FAQs)
          </button>
          <button
            onClick={() => setSelectedTab('tips')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              selectedTab === 'tips'
                ? 'border-[#00ff94] text-[#00ff94] bg-[#191c1f]'
                : 'border-transparent text-[#99907f] hover:text-[#fff8f1]'
            }`}
          >
            💡 प्रॉफिट कमाने के नियम (Golden Rules)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {selectedTab === 'steps' && (
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#00ff94]/20 border border-[#00ff94]/40 text-[#00ff94] font-black flex items-center justify-center shrink-0 text-sm">
                  1
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#fff8f1] text-sm">कॉइन चुनें (Select Pair)</span>
                    <span className="text-[10px] text-[#00ff94] bg-[#00ff94]/10 px-2 py-0.5 rounded">
                      Current: {currentPair} ({displayPrice})
                    </span>
                  </div>
                  <p className="text-[#99907f] leading-relaxed">
                    स्क्रीन के सबसे ऊपर बायीं तरफ (Top Left) कॉइन नाम (जैसे BTC, ETH, SOL) पर क्लिक करके वह क्रिप्टो या एसेट चुनें जिसमें आप ट्रेड करना चाहते हैं।
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#00ff94]/20 border border-[#00ff94]/40 text-[#00ff94] font-black flex items-center justify-center shrink-0 text-sm">
                  2
                </div>
                <div className="space-y-1.5 flex-1">
                  <span className="font-bold text-[#fff8f1] text-sm">दिशा चुनें: BUY या SELL</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-lg bg-[#00ff94]/10 border border-[#00ff94]/30">
                      <div className="flex items-center gap-1.5 text-[#00ff94] font-bold">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>🟢 BUY / LONG</span>
                      </div>
                      <p className="text-[11px] text-[#d0c5b3] mt-1">
                        जब आपको लगे कि कॉइन की कीमत <strong>ऊपर (Up)</strong> जाएगी। कीमत बढ़ने पर आपको प्रॉफिट होगा।
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#ff3b4a]/10 border border-[#ff3b4a]/30">
                      <div className="flex items-center gap-1.5 text-[#ff3b4a] font-bold">
                        <ArrowDownRight className="w-4 h-4" />
                        <span>🔴 SELL / SHORT</span>
                      </div>
                      <p className="text-[11px] text-[#d0c5b3] mt-1">
                        जब आपको लगे कि कॉइन की कीमत <strong>नीचे (Down)</strong> गिरेगी। कीमत गिरने पर भी आपको प्रॉफिट होगा!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#00ff94]/20 border border-[#00ff94]/40 text-[#00ff94] font-black flex items-center justify-center shrink-0 text-sm">
                  3
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#fff8f1] text-sm">1-Click में ट्रेड लगाएं (Auto TP & SL)</span>
                    <span className="text-[10px] text-[#f6be16] bg-[#f6be16]/10 px-2 py-0.5 rounded font-bold">
                      Safe & Automatic
                    </span>
                  </div>
                  <p className="text-[#99907f] leading-relaxed">
                    दाहिनी तरफ (या चार्ट के ऊपर) सीधे <strong>"BUY"</strong> या <strong>"SELL"</strong> पर क्लिक करें। हमारा सिस्टम अपने आप:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-[#d0c5b3] space-y-1 pt-1">
                    <li><strong className="text-[#00ff94]">Take Profit (TP): +3.5%</strong> पर ऑटोमैटिक प्रॉफिट बुकिंग सेट करता है।</li>
                    <li><strong className="text-[#ff3b4a]">Stop Loss (SL): -1.5%</strong> पर नुकसान से सुरक्षा सेट करता है।</li>
                    <li><strong className="text-[#ffd87f]">25% Balance Margin</strong> ऑटोमैटिक यूज़ होती है।</li>
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] flex gap-3">
                <div className="w-7 h-7 rounded-full bg-[#00ff94]/20 border border-[#00ff94]/40 text-[#00ff94] font-black flex items-center justify-center shrink-0 text-sm">
                  4
                </div>
                <div className="space-y-1 flex-1">
                  <span className="font-bold text-[#fff8f1] text-sm">प्रॉफिट देखें और बुक करें (Book Profit)</span>
                  <p className="text-[#99907f] leading-relaxed">
                    नीचे <strong>'Positions'</strong> टैब में आपकी खुली हुई ट्रेड दिखेगी। जैसे ही यह हरी (Green <span className="text-[#00ff94] font-bold">+$15.00</span>) दिखे, सीधे <strong className="text-[#00ff94]">"Book Profit"</strong> या "Close" बटन दबाकर अपना मुनाफा सीधे वॉलेट में जोड़ लें!
                  </p>
                </div>
              </div>

              {/* Interactive Demo Trade Executor Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#00ff94]/15 via-[#191c1f] to-[#14171a] border-2 border-[#00ff94]/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#00ff94] animate-pulse" />
                    <span className="font-extrabold text-[#fff8f1] text-sm">
                      अभी टेस्ट ट्रेड लगाकर देखें (Try Instant Trade Now)
                    </span>
                  </div>
                  <span className="text-[10px] text-[#99907f]">
                    Demo Balance: ${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>

                <p className="text-[11px] text-[#d0c5b3]">
                  नीचे दिए गए बटन पर क्लिक करें। यह तुरंत <strong>{currentPair}</strong> में 1-क्लिक ट्रेड लगा देगा और प्रॉफिट शुरू हो जाएगा:
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => handleExecuteDemoTrade('buy')}
                    className="py-3 px-3 rounded-xl bg-[#00ff94] hover:bg-[#40e397] text-[#002111] font-black text-xs flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(0,255,148,0.35)] transition-all cursor-pointer active:scale-95"
                  >
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>🟢 1-Click BUY (Long)</span>
                    </div>
                    <span className="text-[10px] opacity-80 font-mono">Auto TP: +3.5% Profit</span>
                  </button>

                  <button
                    onClick={() => handleExecuteDemoTrade('sell')}
                    className="py-3 px-3 rounded-xl bg-[#ff3b4a] hover:bg-[#ff5a66] text-[#fff8f1] font-black text-xs flex flex-col items-center justify-center gap-1 shadow-[0_0_15px_rgba(255,59,74,0.35)] transition-all cursor-pointer active:scale-95"
                  >
                    <div className="flex items-center gap-1">
                      <ArrowDownRight className="w-4 h-4" />
                      <span>🔴 1-Click SELL (Short)</span>
                    </div>
                    <span className="text-[10px] opacity-80 font-mono">Auto TP: +3.5% Profit</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'faq' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-1">
                <span className="font-bold text-[#fff8f1] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00ff94]" />
                  <span>प्रॉफिट (मुनाफा) कब और कैसे मिलता है?</span>
                </span>
                <p className="text-[#99907f] text-[11px] leading-relaxed">
                  अगर आपने <strong>BUY</strong> किया है और कीमत ऊपर जाती है, तो आपको मुनाफा होता है। अगर आपने <strong>SELL</strong> किया है और कीमत नीचे गिरती है, तो भी आपको मुनाफा होता है। जैसे ही टारगेट (+3.5%) हिट होता है, प्रॉफिट अपने आप आपके बैलेंस में जमा हो जाता है।
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-1">
                <span className="font-bold text-[#fff8f1] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00ff94]" />
                  <span>क्या यह असली पैसे हैं या प्रैक्टिस बैलेंस?</span>
                </span>
                <p className="text-[#99907f] text-[11px] leading-relaxed">
                  यह $100,000 (लगभग ₹98 लाख) का सुरक्षित <strong>डेमो प्रैक्टिस बैलेंस</strong> है। आप बिना किसी रिस्क के जितनी बार चाहें ट्रेड कर सकते हैं, स्ट्रैटेजी सीख सकते हैं और प्रॉफिट बनाना सीख सकते हैं।
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-1">
                <span className="font-bold text-[#fff8f1] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00ff94]" />
                  <span>"Limit" और "Market" आर्डर में क्या अंतर है?</span>
                </span>
                <p className="text-[#99907f] text-[11px] leading-relaxed">
                  <strong>Market Order:</strong> तुरंत (1 सेकंड में) उसी समय के दाम पर ट्रेड शुरू करता है। (शुरुआती ट्रेडर्स के लिए सबसे बेस्ट)।<br />
                  <strong>Limit Order:</strong> आपके मनचाहे दाम पर तब ट्रेड लेता है जब कीमत उस स्तर तक पहुंचती है।
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-1">
                <span className="font-bold text-[#fff8f1] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00ff94]" />
                  <span>ट्रेड बंद (Close / Book Profit) कैसे करें?</span>
                </span>
                <p className="text-[#99907f] text-[11px] leading-relaxed">
                  नीचे दिए गए <strong>Positions</strong> टेबल में हर ट्रेड के आगे एक <strong>"Book Profit / Close"</strong> बटन होता है। उस पर क्लिक करते ही आपकी ट्रेड बंद हो जाती है और प्रॉफिट बैलेंस में जुड़ जाता है।
                </p>
              </div>
            </div>
          )}

          {selectedTab === 'tips' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-2">
                <div className="flex items-center gap-2 text-[#f6be16] font-bold">
                  <Zap className="w-4 h-4" />
                  <span>AI सिग्नल्स को फॉलो करें (Follow AI Quant Signals)</span>
                </div>
                <p className="text-[#99907f] text-[11px] leading-relaxed">
                  टर्मिनल में <strong>"AI Signals"</strong> टैब में 85%+ एक्यूरेसी वाले प्रूवेन सिग्नल्स मिलते हैं। वहां <strong>"1-Click Trade"</strong> दबाते ही एंट्री, टारगेट और स्टॉप लॉस खुद-ब-खुद लग जाते हैं।
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-2">
                <div className="flex items-center gap-2 text-[#00ff94] font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>हमेशा Stop Loss (SL) का उपयोग करें</span>
                </div>
                <p className="text-[#99907f] text-[11px] leading-relaxed">
                  स्टॉप लॉस आपको बड़े नुकसान से बचाता है। हमारा 1-Click सेटअप हमेशा 1:2 या 1:3 का रिस्क-रिवार्ड रेश्यो (कम नुकसान, ज्यादा फायदा) इस्तेमाल करता है।
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#191c1f] border border-[#272a2d] space-y-2">
                <div className="flex items-center gap-2 text-[#ffd87f] font-bold">
                  <DollarSign className="w-4 h-4" />
                  <span>एक साथ पूरा बैलेंस ना लगाएं</span>
                </div>
                <p className="text-[#99907f] text-[11px] leading-relaxed">
                  हर ट्रेड में अपने कुल बैलेंस का केवल 10% से 25% ही इस्तेमाल करें ताकि आपका रिस्क कम रहे और कैपिटल सुरक्षित रहे।
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#191c1f] border-t border-[#272a2d] flex items-center justify-between text-xs">
          <span className="text-[#99907f] flex items-center gap-1.5">
            <Info className="w-4 h-4 text-[#00ff94]" />
            <span>कोई भी प्रश्न हो तो AI Copilot से भी पूछ सकते हैं</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] font-bold transition-colors cursor-pointer"
          >
            समझ गया (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
