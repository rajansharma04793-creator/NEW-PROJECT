import React from 'react';
import { ShaderBackground } from './ShaderBackground';
import { ThreeSceneCoin } from './ThreeSceneCoin';
import { MarqueeTicker } from './MarqueeTicker';
import { RealTimePriceBar } from './RealTimePriceBar';
import { TickerInfo, AssetPair } from '../types';
import { Activity, Bell, BellRing, Rocket, TrendingUp, Sparkles, LayoutDashboard, BrainCircuit, Smartphone, Zap } from 'lucide-react';

interface HeroScreenProps {
  tickers: Record<string, TickerInfo>;
  onStartTrading: (symbol?: AssetPair) => void;
  onOpenMarketOverview?: () => void;
  onOpenPipCalculator?: () => void;
  onOpenCopilot: () => void;
  onOpenNotifications: () => void;
  onOpenAlertsModal?: () => void;
  onOpenAutoAlertsModal?: () => void;
  autoAlertEnabled?: boolean;
  autoExecutionEnabled?: boolean;
  onToggleAutoExecution?: () => void;
  unreadNotifications: number;
  sentimentPercent: number;
  onOpenInstallModal?: () => void;
  currencyMode?: 'USDT' | 'INR';
  onToggleCurrencyMode?: () => void;
  onResetPrices?: () => void;
  isResettingPrices?: boolean;
}

export const HeroScreen: React.FC<HeroScreenProps> = ({
  tickers,
  onStartTrading,
  onOpenMarketOverview,
  onOpenPipCalculator,
  onOpenCopilot,
  onOpenNotifications,
  onOpenAlertsModal,
  onOpenAutoAlertsModal,
  autoAlertEnabled = true,
  autoExecutionEnabled = false,
  onToggleAutoExecution,
  unreadNotifications,
  sentimentPercent,
  onOpenInstallModal,
  currencyMode = 'USDT',
  onToggleCurrencyMode,
  onResetPrices,
  isResettingPrices = false,
}) => {
  return (
    <div
      id="hero-screen-root"
      className="relative w-screen h-screen overflow-hidden flex flex-col bg-[#111417] text-[#e1e2e7] font-hanken"
    >
      {/* 1. WebGL Shader Background */}
      <ShaderBackground opacity={1} />

      {/* 2. UI Overlay */}
      <div className="relative z-10 flex flex-col h-full w-full justify-between">
        {/* Top App Bar */}
        <header className="w-full flex justify-between items-center px-4 md:px-6 h-14 bg-transparent border-b border-[#4d4638]/30 backdrop-blur-[2px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#f6be16]/15 border border-[#f6be16]/40 flex items-center justify-center text-[#f6be16]" aria-hidden="true">
                <Activity className="w-4 h-4" />
              </div>
              <h1 className="font-hanken text-xl md:text-2xl font-bold text-[#fff8f1] tracking-tight">
                Lumina Trade
              </h1>
            </div>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#272a2d]/80 text-[#f6be16] border border-[#f6be16]/30">
              Obsidian v4.2
            </span>
          </div>

          <nav role="navigation" aria-label="Main Navigation" className="flex items-center gap-3">
            {/* Quick Navigation Buttons */}
            <a
              href="#terminal"
              onClick={(e) => {
                e.preventDefault();
                onStartTrading();
              }}
              aria-label="Launch Obsidian Trading Terminal"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-[#fff8f1] hover:bg-[#272a2d] transition-colors border border-[#272a2d] cursor-pointer"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#f6be16]" aria-hidden="true" />
              <span>Launch Terminal</span>
            </a>

            {onOpenAutoAlertsModal && (
              <button
                onClick={onOpenAutoAlertsModal}
                aria-label="Open Auto Signal Alert Scanner"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
                  autoAlertEnabled
                    ? 'bg-[#00ff94]/10 hover:bg-[#00ff94]/20 border-[#00ff94]/40 text-[#00ff94] shadow-sm'
                    : 'bg-[#ff3b4a]/10 hover:bg-[#ff3b4a]/20 border-[#ff3b4a]/30 text-[#ff3b4a]'
                }`}
                title="Open Auto Signal Alert System Scanner (Toggle ON/OFF or pick custom stocks)"
              >
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  {autoAlertEnabled && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff94] opacity-75" />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${autoAlertEnabled ? 'bg-[#00ff94]' : 'bg-[#ff3b4a]'}`} />
                </span>
                <span className="hidden xs:inline">Signals</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  autoAlertEnabled ? 'bg-[#00ff94]/20 text-[#00ff94]' : 'bg-[#ff3b4a]/20 text-[#ff3b4a]'
                }`}>
                  {autoAlertEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            )}

            {onOpenAlertsModal && (
              <button
                onClick={onOpenAlertsModal}
                aria-label="Configure Price Alerts"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-[#fff8f1] hover:bg-[#272a2d] transition-colors border border-[#272a2d] cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5 text-[#f6be16]" aria-hidden="true" />
                <span>Price Alerts</span>
              </button>
            )}

            {onOpenMarketOverview && (
              <a
                href="#market-overview"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenMarketOverview();
                }}
                aria-label="Open Global Financial Market Overview"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-[#38bdf8] bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/40 transition-colors cursor-pointer"
                title="Open Global Financial Market Overview (Gold, Silver, Forex, Stocks, Indices)"
              >
                <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Market Overview</span>
              </a>
            )}

            {onOpenInstallModal && (
              <button
                onClick={onOpenInstallModal}
                aria-label="Install Lumina Trade Mobile App"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-[#00ff94] bg-[#00ff94]/10 hover:bg-[#00ff94]/20 border border-[#00ff94]/40 transition-colors cursor-pointer"
                title="Install Mobile App"
              >
                <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden xs:inline">Install App</span>
              </button>
            )}

            <button
              onClick={onOpenCopilot}
              aria-label="Open AI Copilot and Market Analyst"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-[#fff8f1] hover:bg-[#272a2d] transition-colors border border-[#272a2d] cursor-pointer"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-[#00ff94]" aria-hidden="true" />
              <span>AI Copilot</span>
            </button>

            {onToggleCurrencyMode && (
              <button
                onClick={onToggleCurrencyMode}
                aria-label="Switch Currency Mode between USDT and INR"
                className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-[#f6be16] bg-[#272a2d] hover:bg-[#37393d] border border-[#37393d] transition-colors cursor-pointer flex items-center gap-1"
                title="Switch between CoinDCX INR (₹) and USDT ($) rates"
              >
                <span>{currencyMode === 'INR' ? '🇮🇳 ₹ INR' : '🌐 $ USDT'}</span>
              </button>
            )}

            {/* Notifications Button */}
            <button
              id="hero-notification-btn"
              onClick={onOpenNotifications}
              aria-label={`Open notifications center (${unreadNotifications} unread)`}
              className="relative flex items-center text-[#d0c5b3] hover:text-[#fff8f1] transition-colors p-2 rounded hover:bg-[#272a2d] border border-transparent hover:border-[#272a2d] cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" aria-hidden="true" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#f6be16] animate-pulse" />
              )}
            </button>
          </nav>
        </header>

        {/* Real-time CoinDCX Tickers & INR Exchange Price Bar */}
        <RealTimePriceBar
          tickers={tickers}
          currentPair="BTC/USDT"
          onSelectPair={(p) => onStartTrading(p)}
          currencyMode={currencyMode}
          onToggleCurrencyMode={onToggleCurrencyMode || (() => {})}
          onResetPrices={onResetPrices}
          isResettingPrices={isResettingPrices}
        />

        {/* Main Hero Showcase Center */}
        <main className="flex-1 flex flex-col items-center justify-center relative px-4 py-2 w-full max-w-7xl mx-auto">
          {/* Left Floating Glass Card: AI Engine Status */}
          <div
            id="hero-widget-ai-status"
            onClick={onOpenCopilot}
            className="hidden md:block absolute left-8 top-[28%] glass-card glass-card-hover rounded p-4 w-64 cursor-pointer z-20"
          >
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-[#3ce095]" />
              <h3 className="font-mono text-[11px] text-[#d0c5b3] uppercase tracking-wider">
                AI ENGINE STATUS
              </h3>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00ff94] animate-pulse" />
              <span className="font-mono text-xs font-bold text-[#00ff94]">
                ONLINE / OPTIMIZED
              </span>
            </div>
            <div className="mt-2 text-[11px] text-[#99907f] font-mono flex justify-between">
              <span>Latency: 12ms</span>
              <span className="text-[#3ce095]">Neural Quant 4.2</span>
            </div>
          </div>

          {/* Right Floating Glass Card: Market Sentiment */}
          <div
            id="hero-widget-sentiment"
            onClick={onOpenCopilot}
            className="hidden md:block absolute right-8 top-[28%] glass-card glass-card-hover rounded p-4 w-64 cursor-pointer z-20"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#f6be16]" />
              <h3 className="font-mono text-[11px] text-[#d0c5b3] uppercase tracking-wider">
                MARKET SENTIMENT
              </h3>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-hanken text-4xl font-extrabold text-[#00ff94] leading-none">
                {sentimentPercent}
                <span className="text-xl font-bold">%</span>
              </span>
              <span className="font-mono text-xs font-bold text-[#00ff94] mb-0.5">BULLISH</span>
            </div>
            <div className="w-full bg-[#272a2d] h-1.5 mt-3 rounded-full overflow-hidden">
              <div
                className="bg-[#00ff94] h-full transition-all duration-500"
                style={{ width: `${sentimentPercent}%` }}
              />
            </div>
          </div>

          {/* Central 3D Asset & Call To Action */}
          <div className="flex flex-col items-center justify-center relative w-full max-w-xl h-[420px] sm:h-[480px]">
            {/* 3D Gold Coin Token Canvas */}
            <div className="absolute inset-0 w-full h-full">
              <ThreeSceneCoin onClick={() => onStartTrading()} />
            </div>

            {/* Headline and Start Trading Button */}
            <div className="absolute bottom-4 sm:bottom-6 flex flex-col items-center z-30 px-4 text-center">
              <h1 className="font-hanken text-3xl sm:text-4xl md:text-5xl font-bold text-[#fff8f1] mb-2 tracking-tight drop-shadow-md">
                The Obsidian Terminal
              </h1>
              <p className="font-hanken text-sm sm:text-base text-[#d0c5b3] mb-6 max-w-md">
                Institutional-grade liquidity. Zero compromise.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  id="btn-start-trading-hero"
                  onClick={() => onStartTrading()}
                  className="bg-[#e7c26b] hover:bg-[#f6be16] text-[#251a00] font-hanken font-bold text-sm sm:text-base px-6 py-3 rounded-xl gold-glow flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(246,190,22,0.4)]"
                >
                  <Rocket className="w-4 h-4 text-[#251a00]" />
                  <span>Launch Pro Terminal</span>
                </button>

                {onOpenMarketOverview && (
                  <a
                    href="#markets"
                    onClick={(e) => {
                      e.preventDefault();
                      onOpenMarketOverview();
                    }}
                    className="bg-[#1e293b]/90 hover:bg-[#334155] text-[#38bdf8] border border-[#38bdf8]/50 font-hanken font-bold text-sm sm:text-base px-5 py-3 rounded-xl flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#38bdf8]" />
                    <span>Market Overview Hub</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Status Pills */}
          <div className="md:hidden flex items-center gap-2 mt-4 z-20">
            <div className="px-3 py-1 bg-[#191c1f]/80 backdrop-blur rounded border border-[#272a2d] text-[11px] font-mono text-[#00ff94] flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#00ff94] animate-pulse" />
              <span>AI Engine Online</span>
            </div>
            <div className="px-3 py-1 bg-[#191c1f]/80 backdrop-blur rounded border border-[#272a2d] text-[11px] font-mono text-[#f6be16]">
              <span>Sentiment: {sentimentPercent}% Bullish</span>
            </div>
          </div>
        </main>

        {/* Bottom Marquee Ticker */}
        <MarqueeTicker tickers={tickers} onSelectSymbol={onStartTrading} currencyMode={currencyMode} />
      </div>
    </div>
  );
};
