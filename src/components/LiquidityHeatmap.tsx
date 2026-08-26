import React, { useRef, useEffect, useState, useMemo } from 'react';
import { OrderBookItem } from '../types';
import { generateLiquidityHeatmapHistory, LiquiditySnapshot } from '../utils/orderFlowUtils';
import { Layers, Flame, Eye, TrendingUp } from 'lucide-react';

interface LiquidityHeatmapProps {
  bids: OrderBookItem[];
  asks: OrderBookItem[];
  currentPrice: number;
  symbol: string;
  precision?: number;
}

export const LiquidityHeatmap: React.FC<LiquidityHeatmapProps> = ({
  bids,
  asks,
  currentPrice,
  symbol,
  precision = 2,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snapshots, setSnapshots] = useState<LiquiditySnapshot[]>(() =>
    generateLiquidityHeatmapHistory(bids, asks, currentPrice, 36)
  );

  // Update snapshots as new bids/asks stream in
  useEffect(() => {
    setSnapshots((prev) => {
      const maxBidVol = Math.max(...bids.map((b) => b.amount), 1);
      const maxAskVol = Math.max(...asks.map((a) => a.amount), 1);

      const levels: { price: number; bidDensity: number; askDensity: number; totalDensity: number }[] = [];

      asks.slice(0, 18).forEach((a) => {
        const norm = Math.min(1, a.amount / maxAskVol);
        levels.push({ price: a.price, bidDensity: 0, askDensity: norm, totalDensity: norm });
      });

      bids.slice(0, 18).forEach((b) => {
        const norm = Math.min(1, b.amount / maxBidVol);
        levels.push({ price: b.price, bidDensity: norm, askDensity: 0, totalDensity: norm });
      });

      levels.sort((a, b) => b.price - a.price);

      const newSnap: LiquiditySnapshot = {
        timestamp: Date.now(),
        priceMin: currentPrice * 0.988,
        priceMax: currentPrice * 1.012,
        levels,
      };

      const updated = [...prev.slice(-35), newSnap];
      return updated;
    });
  }, [bids, asks, currentPrice]);

  // Render Canvas Heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || snapshots.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight || 450;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    const paddingRight = 130;
    const chartWidth = width - paddingRight;

    // Background
    ctx.fillStyle = '#0e1114';
    ctx.fillRect(0, 0, width, height);

    // Global Price Bounds
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    snapshots.forEach((s) => {
      s.levels.forEach((l) => {
        if (l.price < minPrice) minPrice = l.price;
        if (l.price > maxPrice) maxPrice = l.price;
      });
    });

    if (minPrice === Infinity) minPrice = currentPrice * 0.99;
    if (maxPrice === -Infinity) maxPrice = currentPrice * 1.01;

    const priceBuffer = (maxPrice - minPrice) * 0.05 || 1;
    const yMin = minPrice - priceBuffer;
    const yMax = maxPrice + priceBuffer;
    const priceRange = yMax - yMin;

    const getPriceY = (price: number) => {
      return height - ((price - yMin) / priceRange) * (height - 30) - 15;
    };

    // Horizontal Price Grid
    ctx.strokeStyle = '#1a1d20';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const p = yMin + (priceRange / 6) * i;
      const y = getPriceY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      ctx.fillStyle = '#99907f';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(p.toFixed(p > 100 ? 2 : 4), chartWidth + 6, y + 4);
    }

    // Heatmap Column Slices
    const colCount = snapshots.length;
    const colWidth = chartWidth / colCount;

    snapshots.forEach((snap, colIdx) => {
      const x = colIdx * colWidth;

      snap.levels.forEach((lvl) => {
        const y = getPriceY(lvl.price);
        const cellH = Math.max(3, (height / 36));

        // Color based on density: low = blue/cyan, mid = orange, high = hot yellow/white
        const density = Math.min(1, lvl.totalDensity);
        let color = '';

        if (lvl.askDensity > 0) {
          // Ask side (Red/Orange heat)
          if (density > 0.75) color = `rgba(255, 230, 100, ${density * 0.9})`;
          else if (density > 0.4) color = `rgba(255, 80, 50, ${density * 0.75})`;
          else color = `rgba(200, 30, 60, ${0.15 + density * 0.4})`;
        } else {
          // Bid side (Cyan/Green heat)
          if (density > 0.75) color = `rgba(255, 230, 100, ${density * 0.9})`;
          else if (density > 0.4) color = `rgba(0, 255, 148, ${density * 0.75})`;
          else color = `rgba(0, 150, 180, ${0.15 + density * 0.4})`;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, y - cellH / 2, colWidth + 0.5, cellH);
      });
    });

    // Right Side: Live Orderbook Liquidity Depth Histogram Bars
    const maxBarW = paddingRight - 40;
    const maxBidAmount = Math.max(...bids.map((b) => b.amount), 1);
    const maxAskAmount = Math.max(...asks.map((a) => a.amount), 1);

    // Asks
    asks.slice(0, 18).forEach((a) => {
      const y = getPriceY(a.price);
      const barW = (a.amount / maxAskAmount) * maxBarW;

      ctx.fillStyle = 'rgba(255, 59, 74, 0.35)';
      ctx.fillRect(chartWidth + 50, y - 4, barW, 8);

      ctx.fillStyle = '#ff7b88';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${a.amount.toFixed(1)}`, chartWidth + 52 + barW, y + 3);
    });

    // Bids
    bids.slice(0, 18).forEach((b) => {
      const y = getPriceY(b.price);
      const barW = (b.amount / maxBidAmount) * maxBarW;

      ctx.fillStyle = 'rgba(0, 255, 148, 0.35)';
      ctx.fillRect(chartWidth + 50, y - 4, barW, 8);

      ctx.fillStyle = '#40e397';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${b.amount.toFixed(1)}`, chartWidth + 52 + barW, y + 3);
    });

    // Center Price Line
    const curY = getPriceY(currentPrice);
    ctx.strokeStyle = '#ffd87f';
    ctx.setLineDash([4, 2]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, curY);
    ctx.lineTo(chartWidth, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ffd87f';
    ctx.fillRect(chartWidth + 2, curY - 9, 44, 18);
    ctx.fillStyle = '#111417';
    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(currentPrice.toFixed(currentPrice > 100 ? 1 : 3), chartWidth + 24, curY + 4);
  }, [snapshots, bids, asks, currentPrice]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#0e1114] select-none flex flex-col"
    >
      {/* Header Info */}
      <div className="absolute top-2 left-3 z-10 flex items-center gap-3 text-[11px] font-mono bg-[#14171a]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#272a2d] shadow-lg">
        <div className="flex items-center gap-1.5 text-[#f6be16] font-bold">
          <Flame className="w-3.5 h-3.5 text-[#f6be16] animate-pulse" />
          <span>LIQUIDITY DEPTH HEATMAP & RESTING WALLS</span>
        </div>
        <div className="w-[1px] h-3.5 bg-[#272a2d]" />
        <span className="text-[#99907f]">
          Hot Yellow = <span className="text-[#ffd87f] font-bold">High Density Wall</span>
        </span>
        <span className="text-[#99907f] hidden sm:inline">
          Red Heat = <span className="text-[#ff3b4a] font-bold">Ask Resistance</span>
        </span>
        <span className="text-[#99907f] hidden sm:inline">
          Green Heat = <span className="text-[#00ff94] font-bold">Bid Support</span>
        </span>
      </div>

      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
