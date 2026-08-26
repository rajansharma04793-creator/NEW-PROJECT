import React, { useState } from 'react';
import { EconomicEvent } from '../types';
import {
  Calendar,
  AlertTriangle,
  Flame,
  Clock,
  Globe,
  TrendingUp,
  X,
  Sparkles,
  ShieldAlert,
  Search,
  Filter,
  DollarSign,
  Layers,
} from 'lucide-react';

interface EconomicCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_ECONOMIC_EVENTS: EconomicEvent[] = [
  {
    id: 'fomc-rate-decision',
    title: 'FOMC Federal Funds Interest Rate Decision',
    country: 'US',
    category: 'central_bank',
    impact: 'HIGH',
    date: '2026-08-26 18:00 UTC',
    timestamp: Date.now() + 1000 * 60 * 60 * 42,
    timeUntil: 'in 42 hours',
    previous: '5.25%',
    forecast: '5.00% (-25 bps cut)',
    volatilityRisk: 'EXTREME',
    description: 'Federal Reserve rate cut probability at 88%. Massive implied volatility on BTC & ETH perp futures.',
  },
  {
    id: 'us-cpi-inflation',
    title: 'US Consumer Price Index (CPI YoY)',
    country: 'US',
    category: 'inflation',
    impact: 'HIGH',
    date: '2026-08-28 12:30 UTC',
    timestamp: Date.now() + 1000 * 60 * 60 * 86,
    timeUntil: 'in 3 days',
    previous: '2.8%',
    forecast: '2.6%',
    volatilityRisk: 'EXTREME',
    description: 'Core inflation release determining Fed easing trajectory.',
  },
  {
    id: 'btc-derivatives-expiry',
    title: 'Monthly $4.8B Bitcoin & Ethereum Options Expiry',
    country: 'CRYPTO',
    category: 'options_expiry',
    impact: 'HIGH',
    date: '2026-08-29 08:00 UTC',
    timestamp: Date.now() + 1000 * 60 * 60 * 110,
    timeUntil: 'in 4 days',
    previous: '$3.9B',
    forecast: 'Max Pain: $96,500',
    volatilityRisk: 'ELEVATED',
    description: 'Deribit & CME monthly settlement. Gamma squeeze potential near $97k resistance.',
  },
  {
    id: 'sol-sui-unlock',
    title: 'Major Layer-1 Cliff Token Unlock (SUI & APT)',
    country: 'CRYPTO',
    category: 'token_unlock',
    impact: 'MEDIUM',
    date: '2026-08-31 00:00 UTC',
    timestamp: Date.now() + 1000 * 60 * 60 * 150,
    timeUntil: 'in 6 days',
    previous: '$85M',
    forecast: '$140M Liquidity Unlock',
    volatilityRisk: 'ELEVATED',
    description: 'Team and early investor token distributions. Watch for spot funding rate premiums.',
  },
  {
    id: 'us-nonfarm-payrolls',
    title: 'US Non-Farm Payrolls & Unemployment Rate',
    country: 'US',
    category: 'employment',
    impact: 'HIGH',
    date: '2026-09-04 12:30 UTC',
    timestamp: Date.now() + 1000 * 60 * 60 * 240,
    timeUntil: 'in 10 days',
    previous: '142K / 4.2%',
    forecast: '160K / 4.1%',
    volatilityRisk: 'HIGH' as any,
    description: 'US labor market health benchmark affecting macro dollar index (DXY).',
  },
];

export const EconomicCalendarModal: React.FC<EconomicCalendarModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [filterImpact, setFilterImpact] = useState<'ALL' | 'HIGH' | 'CRYPTO'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredEvents = SAMPLE_ECONOMIC_EVENTS.filter((ev) => {
    const matchesImpact =
      filterImpact === 'ALL'
        ? true
        : filterImpact === 'HIGH'
        ? ev.impact === 'HIGH'
        : ev.country === 'CRYPTO';

    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesImpact && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono select-none">
      <div className="bg-[#14171a] border border-[#272a2d] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#272a2d] bg-[#191c1f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#f6be16]/15 border border-[#f6be16]/30 flex items-center justify-center text-[#ffd87f]">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#fff8f1]">Macroeconomic & Crypto Volatility Calendar</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ff3b4a]/20 text-[#ff3b4a] border border-[#ff3b4a]/30">
                  Live Event Radar
                </span>
              </div>
              <p className="text-[11px] text-[#99907f]">
                Institutional news, central bank rate decisions & token unlock schedules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#99907f] hover:text-[#fff8f1] hover:bg-[#272a2d] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 bg-[#16191c] border-b border-[#272a2d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#111417] p-1 rounded-xl border border-[#272a2d]">
            <button
              onClick={() => setFilterImpact('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterImpact === 'ALL'
                  ? 'bg-[#f6be16] text-[#191c1f]'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilterImpact('HIGH')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterImpact === 'HIGH'
                  ? 'bg-[#ff3b4a] text-white'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
            >
              <Flame className="w-3 h-3" />
              High Impact Only
            </button>
            <button
              onClick={() => setFilterImpact('CRYPTO')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterImpact === 'CRYPTO'
                  ? 'bg-[#00ff94] text-[#002111]'
                  : 'text-[#99907f] hover:text-[#fff8f1]'
              }`}
            >
              ⚡ Crypto Unlocks
            </button>
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#99907f]" />
            <input
              type="text"
              placeholder="Search events (e.g. FOMC, CPI)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111417] text-xs pl-8 pr-3 py-1.5 rounded-lg text-[#fff8f1] border border-[#272a2d] focus:border-[#f6be16] focus:outline-none"
            />
          </div>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="p-4 rounded-xl bg-[#191c1f] border border-[#272a2d] hover:border-[#f6be16]/40 transition-colors flex flex-col gap-3"
            >
              {/* Event Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">
                    {ev.country === 'US' ? '🇺🇸' : ev.country === 'CRYPTO' ? '🪙' : '🌐'}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-[#fff8f1]">{ev.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#99907f]">
                      <span className="flex items-center gap-1 text-[#ffd87f]">
                        <Clock className="w-3 h-3" /> {ev.date} ({ev.timeUntil})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ev.impact === 'HIGH'
                        ? 'bg-[#ff3b4a]/20 text-[#ff3b4a] border border-[#ff3b4a]/30'
                        : 'bg-[#ffd87f]/20 text-[#ffd87f] border border-[#ffd87f]/30'
                    }`}
                  >
                    {ev.impact} IMPACT
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ev.volatilityRisk === 'EXTREME'
                        ? 'bg-[#ff3b4a] text-white animate-pulse'
                        : 'bg-[#ffd87f]/20 text-[#ffd87f]'
                    }`}
                  >
                    {ev.volatilityRisk} RISK
                  </span>
                </div>
              </div>

              {/* Data Strip */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#111417] text-xs">
                <div>
                  <span className="text-[10px] text-[#99907f] block">Previous</span>
                  <span className="font-bold text-[#e1e2e7]">{ev.previous || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#99907f] block">Forecast / Consensus</span>
                  <span className="font-bold text-[#ffd87f]">{ev.forecast || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#99907f] block">Actual Result</span>
                  <span className="font-bold text-[#00ff94]">{ev.actual || 'Pending'}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-[#99907f] leading-relaxed">
                {ev.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
