import React, { useMemo } from 'react';
import { Candle } from '../types';
import { calculateMarketProfile, MarketProfileData } from '../utils/orderFlowUtils';
import { BarChart3, TrendingUp, Compass, Layers } from 'lucide-react';

interface MarketProfileTPOProps {
  candles: Candle[];
  currentPrice: number;
  symbol: string;
  timeframe: string;
}

export const MarketProfileTPO: React.FC<MarketProfileTPOProps> = ({
  candles,
  currentPrice,
  symbol,
  timeframe,
}) => {
  const profile = useMemo(() => {
    return calculateMarketProfile(candles, 28);
  }, [candles]);

  if (!profile) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#111417] text-[#99907f] font-mono text-xs">
        No candle data available for Market Profile.
      </div>
    );
  }

  const maxCount = Math.max(...profile.rows.map((r) => r.count), 1);

  return (
    <div className="w-full h-full bg-[#111417] select-none flex flex-col overflow-hidden">
      {/* Header Metrics */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#14171a] border-b border-[#272a2d] font-mono text-xs text-[#e1e2e7]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#ffd87f] font-bold">
            <Compass className="w-4 h-4 text-[#ffd87f]" />
            <span>TPO MARKET PROFILE ({timeframe})</span>
          </div>
          <div className="w-[1px] h-3.5 bg-[#272a2d]" />
          <span className="text-[#99907f]">
            POC: <span className="text-[#ffd87f] font-bold">${profile.pocPrice.toFixed(2)}</span>
          </span>
          <span className="text-[#99907f] hidden sm:inline">
            VAH: <span className="text-[#38bdf8] font-bold">${profile.vahPrice.toFixed(2)}</span>
          </span>
          <span className="text-[#99907f] hidden sm:inline">
            VAL: <span className="text-[#38bdf8] font-bold">${profile.valPrice.toFixed(2)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#99907f]">
          <span className="px-2 py-0.5 rounded bg-[#ffd87f]/15 text-[#ffd87f] border border-[#ffd87f]/30">
            IB: ${profile.ibLow.toFixed(1)} - ${profile.ibHigh.toFixed(1)}
          </span>
        </div>
      </div>

      {/* TPO Matrix Rows */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 font-mono text-[11px]">
        {profile.rows.map((row, idx) => {
          const isCurrent =
            Math.abs(row.price - currentPrice) <
            (profile.rows[0]?.price - profile.rows[profile.rows.length - 1]?.price) / 28;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                row.isPOC
                  ? 'bg-[#ffd87f]/15 border border-[#ffd87f]/50'
                  : row.isVA
                  ? 'bg-[#38bdf8]/5'
                  : 'hover:bg-[#191c1f]'
              }`}
            >
              {/* Price */}
              <div className="w-20 text-right">
                <span
                  className={`font-bold ${
                    row.isPOC
                      ? 'text-[#ffd87f]'
                      : row.isVA
                      ? 'text-[#38bdf8]'
                      : 'text-[#99907f]'
                  }`}
                >
                  ${row.price.toFixed(row.price > 100 ? 2 : 4)}
                </span>
              </div>

              {/* Tag / Indicator */}
              <div className="w-12 text-center">
                {row.isPOC && (
                  <span className="px-1 py-0.2 bg-[#ffd87f] text-[#111417] font-extrabold text-[9px] rounded">
                    POC
                  </span>
                )}
                {!row.isPOC && row.price === profile.vahPrice && (
                  <span className="px-1 py-0.2 bg-[#38bdf8]/20 text-[#38bdf8] font-bold text-[9px] rounded">
                    VAH
                  </span>
                )}
                {!row.isPOC && row.price === profile.valPrice && (
                  <span className="px-1 py-0.2 bg-[#38bdf8]/20 text-[#38bdf8] font-bold text-[9px] rounded">
                    VAL
                  </span>
                )}
              </div>

              {/* TPO Distribution Letters & Histogram Bar */}
              <div className="flex-1 flex items-center gap-2">
                <div
                  className="h-3 rounded-xs bg-[#38bdf8]/20 flex items-center px-1 overflow-hidden"
                  style={{ width: `${Math.max(12, (row.count / maxCount) * 75)}%` }}
                >
                  <span
                    className={`tracking-widest text-[9px] font-mono select-all ${
                      row.isPOC
                        ? 'text-[#ffd87f] font-bold'
                        : row.isVA
                        ? 'text-[#38bdf8]'
                        : 'text-[#d0c5b3]'
                    }`}
                  >
                    {row.letters}
                  </span>
                </div>
                <span className="text-[9px] text-[#99907f] min-w-8">
                  ({row.count} TPOs)
                </span>
              </div>

              {/* Volume Column */}
              <div className="w-16 text-right text-[10px] text-[#99907f]">
                {row.volume.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
