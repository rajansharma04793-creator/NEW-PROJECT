import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare, ArrowUpRight } from 'lucide-react';

interface MobileAppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileAppInstallModal: React.FC<MobileAppInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [activeOS, setActiveOS] = useState<'android' | 'ios'>('android');

  useEffect(() => {
    // Check if app is already launched in standalone (installed) mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
    }

    // Detect User Agent
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
      setActiveOS('ios');
    } else {
      setActiveOS('android');
    }

    // Capture standard PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#16181b] border border-[#272a2d] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00ff94] via-[#f6be16] to-[#00ff94]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#272a2d] hover:bg-[#37393d] text-[#99907f] hover:text-[#fff8f1] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 space-y-5">
          {/* App Branding */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#00ff94]/15 border border-[#00ff94]/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,255,148,0.25)]">
              <Smartphone className="w-6 h-6 text-[#00ff94]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#fff8f1] font-mono flex items-center gap-2">
                <span>Lumina Mobile App</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40">
                  PWA Ready
                </span>
              </h3>
              <p className="text-xs text-[#99907f]">
                Install on Android & iPhone (Zero App Store hassle)
              </p>
            </div>
          </div>

          {/* OS Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#111417] rounded-xl border border-[#272a2d]">
            <button
              onClick={() => setActiveOS('android')}
              className={`py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                activeOS === 'android'
                  ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/40 shadow-sm'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
            >
              🤖 Android (Chrome)
            </button>
            <button
              onClick={() => setActiveOS('ios')}
              className={`py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                activeOS === 'ios'
                  ? 'bg-[#f6be16]/20 text-[#f6be16] border border-[#f6be16]/40 shadow-sm'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
            >
              🍏 iPhone (Safari)
            </button>
          </div>

          {/* Android Direct 1-Click Install Button (if browser prompt is ready) */}
          {deferredPrompt && activeOS === 'android' && (
            <button
              onClick={handleInstallClick}
              className="w-full py-3 rounded-xl bg-[#00ff94] hover:bg-[#00ff94]/90 text-[#0b0e11] font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,148,0.35)] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Direct 1-Click Install App</span>
            </button>
          )}

          {/* Step by Step Install Instructions */}
          <div className="p-4 bg-[#111417] rounded-xl border border-[#272a2d] space-y-3">
            <div className="text-xs font-bold text-[#fff8f1] font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00ff94] animate-pulse" />
              <span>
                {activeOS === 'android'
                  ? 'Android par Install karne ka Tareeqa:'
                  : 'iPhone par Install karne ka Tareeqa:'}
              </span>
            </div>

            {activeOS === 'android' ? (
              <ol className="text-xs text-[#d0c5b3] space-y-2.5 list-none">
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#272a2d] text-[#00ff94] font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Apne phone ke Chrome Browser ke top right corner mein <strong>3 Dots (⋮ Menu)</strong> par tap karein.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#272a2d] text-[#00ff94] font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    Menu mein <strong className="text-[#00ff94] flex items-center gap-1"><Download className="w-3.5 h-3.5 inline" /> "Install App"</strong> ya <strong>"Add to Home Screen"</strong> select karein.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#272a2d] text-[#00ff94] font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    <strong>Install / Add</strong> par confirm karein. App aapke phone ki home screen par regular native app ki tarah aa jayegi!
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="text-xs text-[#d0c5b3] space-y-2.5 list-none">
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#272a2d] text-[#f6be16] font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Safari browser mein bottom bar par <strong>Share Icon</strong> (<Share2 className="w-3.5 h-3.5 inline text-[#f6be16]" />) par tap karein.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#272a2d] text-[#f6be16] font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    Thoda scroll karke <strong className="text-[#f6be16] flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 inline" /> "Add to Home Screen"</strong> par tap karein.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#272a2d] text-[#f6be16] font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    Top right corner mein <strong>"Add"</strong> par tap karein. App aapke iPhone par install ho jayegi.
                  </span>
                </li>
              </ol>
            )}
          </div>

          {/* Features Highlights */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-[#99907f] font-mono">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff94]" />
              <span>Full Screen Experience</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff94]" />
              <span>Live Price & AI Signals</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff94]" />
              <span>Ultra-Fast 0ms Latency</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00ff94]" />
              <span>Zero Storage Consumed</span>
            </div>
          </div>

          {/* Close / Understood Button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#272a2d] hover:bg-[#37393d] text-[#fff8f1] font-mono text-xs font-bold transition-colors cursor-pointer"
          >
            Got it, Let's Trade
          </button>
        </div>
      </div>
    </div>
  );
};
