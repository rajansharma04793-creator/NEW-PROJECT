import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Candle, FootprintCandleData, FootprintClusterLevel } from '../types';
import { generateFootprintData } from '../utils/orderFlowUtils';
import { Layers, Activity, Eye, Sliders, TrendingUp, Info } from 'lucide-react';

interface FootprintChartProps {
  candles: Candle[];
  currentPrice: number;
  symbol: string;
  timeframe: string;
  imbalanceRatio?: number;
  showCVD?: boolean;
  showPOC?: boolean;
  showValueArea?: boolean;
}

export const FootprintChart: React.FC<FootprintChartProps> = ({
  candles,
  currentPrice,
  symbol,
  timeframe,
  imbalanceRatio = 3.0,
  showCVD = true,
  showPOC = true,
  showValueArea = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredData, setHoveredData] = useState<{
    candle: FootprintCandleData | null;
    level: FootprintClusterLevel | null;
  }>({ candle: null, level: null });

  // Generate Footprint data from candles
  const footprintData = useMemo(() => {
    return generateFootprintData(candles, 10, imbalanceRatio);
  }, [candles, imbalanceRatio]);

  // Canvas Render
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || footprintData.length === 0) return;

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

    const paddingRight = 75;
    const cvdHeight = showCVD ? 70 : 0;
    const mainHeight = height - cvdHeight - 30;
    const chartWidth = width - paddingRight;

    // Background
    ctx.fillStyle = '#111417';
    ctx.fillRect(0, 0, width, height);

    // Price Bounds
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let minCVD = Infinity;
    let maxCVD = -Infinity;

    footprintData.forEach((f) => {
      if (f.low < minPrice) minPrice = f.low;
      if (f.high > maxPrice) maxPrice = f.high;
      if (f.cumulativeDelta < minCVD) minCVD = f.cumulativeDelta;
      if (f.cumulativeDelta > maxCVD) maxCVD = f.cumulativeDelta;
    });

    const priceBuffer = (maxPrice - minPrice) * 0.05 || 1;
    const yMin = minPrice - priceBuffer;
    const yMax = maxPrice + priceBuffer;
    const priceRange = yMax - yMin;

    const getPriceY = (price: number) => {
      return mainHeight - ((price - yMin) / priceRange) * (mainHeight - 20) - 10;
    };

    const count = footprintData.length;
    const candleWidth = Math.max(36, chartWidth / count);
    const getIndexX = (index: number) => index * candleWidth + candleWidth / 2;

    // Grid lines
    ctx.strokeStyle = '#1d2023';
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
      ctx.fillText(p.toFixed(p > 100 ? 2 : 4), chartWidth + 8, y + 4);
    }

    // Draw Footprint Candles
    footprintData.forEach((f, idx) => {
      const cx = getIndexX(idx);
      const isBull = f.close >= f.open;

      const openY = getPriceY(f.open);
      const closeY = getPriceY(f.close);
      const highY = getPriceY(f.high);
      const lowY = getPriceY(f.low);

      // Center Wick
      ctx.strokeStyle = isBull ? '#00ff94' : '#ff3b4a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, highY);
      ctx.lineTo(cx, lowY);
      ctx.stroke();

      // Cluster Box Dimensions
      const boxW = candleWidth - 4;
      const halfW = boxW / 2;
      const clusterCount = f.clusters.length;

      f.clusters.forEach((cl) => {
        const clY = getPriceY(cl.price);
        const cellH = Math.max(8, (Math.abs(lowY - highY) / clusterCount));
        const cellTop = clY - cellH / 2;

        // Buy Side Cell (Right)
        const buyIntensity = Math.min(1, cl.buyVol / (f.totalVolume / clusterCount || 1));
        ctx.fillStyle = cl.isImbalance && cl.imbalanceSide === 'buy'
          ? 'rgba(0, 255, 148, 0.45)'
          : `rgba(0, 255, 148, ${0.08 + buyIntensity * 0.25})`;
        ctx.fillRect(cx, cellTop, halfW - 1, cellH - 1);

        // Sell Side Cell (Left)
        const sellIntensity = Math.min(1, cl.sellVol / (f.totalVolume / clusterCount || 1));
        ctx.fillStyle = cl.isImbalance && cl.imbalanceSide === 'sell'
          ? 'rgba(255, 59, 74, 0.45)'
          : `rgba(255, 59, 74, ${0.08 + sellIntensity * 0.25})`;
        ctx.fillRect(cx - halfW, cellTop, halfW - 1, cellH - 1);

        // POC border highlight
        if (showPOC && cl.isPOC) {
          ctx.strokeStyle = '#ffd87f';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(cx - halfW, cellTop, boxW - 2, cellH - 1);
        }

        // Text Readouts inside cells (Sell Vol x Buy Vol)
        if (candleWidth > 45) {
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.textAlign = 'right';
          ctx.fillStyle = cl.isImbalance && cl.imbalanceSide === 'sell' ? '#ffffff' : '#f87171';
          ctx.fillText(`${cl.sellVol}`, cx - 3, clY + 3);

          ctx.textAlign = 'left';
          ctx.fillStyle = cl.isImbalance && cl.imbalanceSide === 'buy' ? '#ffffff' : '#4ade80';
          ctx.fillText(`${cl.buyVol}`, cx + 3, clY + 3);
        }
      });

      // Value Area Bracket (VAH to VAL)
      if (showValueArea && f.vahPrice && f.valPrice) {
        const vahY = getPriceY(f.vahPrice);
        const valY = getPriceY(f.valPrice);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        // Top tick
        ctx.moveTo(cx - halfW - 2, vahY);
        ctx.lineTo(cx - halfW, vahY);
        // Vertical bracket
        ctx.lineTo(cx - halfW, valY);
        // Bottom tick
        ctx.lineTo(cx - halfW - 2, valY);
        ctx.stroke();
      }

      // Delta Footer badge below candle
      ctx.fillStyle = f.delta >= 0 ? 'rgba(0, 255, 148, 0.15)' : 'rgba(255, 59, 74, 0.15)';
      ctx.fillRect(cx - halfW, mainHeight + 4, boxW, 16);
      ctx.fillStyle = f.delta >= 0 ? '#00ff94' : '#ff3b4a';
      ctx.font = 'bold 8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Δ ${f.delta > 0 ? '+' : ''}${f.delta}`, cx, mainHeight + 15);
    });

    // Current Price Line
    const curY = getPriceY(currentPrice);
    ctx.strokeStyle = '#00ff94';
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(0, curY);
    ctx.lineTo(chartWidth, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#00ff94';
    ctx.fillRect(chartWidth + 2, curY - 9, paddingRight - 4, 18);
    ctx.fillStyle = '#002111';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(currentPrice.toFixed(currentPrice > 100 ? 2 : 4), chartWidth + 6, curY + 4);

    // ===================================
    // CVD (Cumulative Volume Delta) SUB-CHART
    // ===================================
    if (showCVD) {
      const cvdTop = mainHeight + 24;
      ctx.strokeStyle = '#272a2d';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, cvdTop);
      ctx.lineTo(width, cvdTop);
      ctx.stroke();

      const cvdRange = maxCVD - minCVD || 1;
      const getCvdY = (val: number) =>
        cvdTop + cvdHeight - ((val - minCVD) / cvdRange) * (cvdHeight - 14) - 6;

      // Zero or baseline line
      const zeroY = getCvdY(0);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(0, zeroY);
      ctx.lineTo(chartWidth, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);

      // CVD Area fill
      const lastVal = footprintData[footprintData.length - 1]?.cumulativeDelta || 0;
      ctx.strokeStyle = lastVal >= 0 ? '#00ff94' : '#ff3b4a';
      ctx.lineWidth = 1.8;
      ctx.beginPath();

      footprintData.forEach((f, i) => {
        const x = getIndexX(i);
        const y = getCvdY(f.cumulativeDelta);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Title
      ctx.fillStyle = '#99907f';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `CVD (Cumulative Volume Delta): ${lastVal >= 0 ? '+' : ''}${lastVal}`,
        8,
        cvdTop + 14
      );
    }
  }, [footprintData, currentPrice, showCVD, showPOC, showValueArea]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#111417] select-none flex flex-col"
    >
      {/* Header Info Pill */}
      <div className="absolute top-2 left-3 z-10 flex items-center gap-3 text-[11px] font-mono bg-[#14171a]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#272a2d] shadow-lg">
        <div className="flex items-center gap-1.5 text-[#00ff94] font-bold">
          <Activity className="w-3.5 h-3.5" />
          <span>ORDER FLOW FOOTPRINT ({timeframe})</span>
        </div>
        <div className="w-[1px] h-3.5 bg-[#272a2d]" />
        <span className="text-[#99907f]">
          Imbalance Ratio: <span className="text-[#ffd87f] font-bold">{imbalanceRatio}x (300%)</span>
        </span>
        <span className="text-[#99907f] hidden sm:inline">
          Yellow Box = <span className="text-[#ffd87f] font-bold">POC</span>
        </span>
        <span className="text-[#99907f] hidden md:inline">
          Blue Bracket = <span className="text-[#38bdf8] font-bold">Value Area 70%</span>
        </span>
      </div>

      <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />
    </div>
  );
};
