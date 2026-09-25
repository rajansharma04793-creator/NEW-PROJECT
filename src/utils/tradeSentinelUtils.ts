// Automated AI Trade Sentinel & Real-Time Position Risk Auditor

import { Position, AssetPair, TickerInfo } from '../types';

export interface SentinelPositionAudit {
  positionId: string;
  symbol: AssetPair;
  side: 'long' | 'short';
  entryPrice: number;
  markPrice: number;
  size: number;
  margin: number;
  leverage: number;
  liquidationPrice: number;
  currentPnl: number;
  currentPnlPercent: number;
  liquidationDistancePercent: number;
  healthStatus: 'HEALTHY' | 'IN_PROFIT' | 'ELEVATED_RISK' | 'CRITICAL_LIQUIDATION';
  recommendationTitle: string;
  recommendationDetails: string;
  suggestedAction?: 'TRAIL_BREAK_EVEN' | 'SECURE_PARTIAL_PROFIT' | 'EMERGENCY_CLOSE' | 'NONE';
  suggestedNewStopLoss?: number;
}

export interface SentinelPortfolioSummary {
  totalOpenPositions: number;
  totalUnrealizedPnl: number;
  totalMarginLocked: number;
  highestRiskPosition: SentinelPositionAudit | null;
  overallPortfolioHealth: 'EXCELLENT' | 'STABLE' | 'WARNING' | 'CRITICAL';
  audits: SentinelPositionAudit[];
}

export function auditPortfolioPositions(
  positions: Position[],
  tickers: Record<AssetPair, TickerInfo>
): SentinelPortfolioSummary {
  if (!positions || positions.length === 0) {
    return {
      totalOpenPositions: 0,
      totalUnrealizedPnl: 0,
      totalMarginLocked: 0,
      highestRiskPosition: null,
      overallPortfolioHealth: 'EXCELLENT',
      audits: [],
    };
  }

  let totalUnrealizedPnl = 0;
  let totalMarginLocked = 0;
  const audits: SentinelPositionAudit[] = [];

  for (const pos of positions) {
    const ticker = tickers[pos.symbol];
    const markPrice = ticker ? ticker.price : pos.markPrice || pos.entryPrice;
    const isLong = pos.side === 'long';

    const pnl = isLong
      ? (markPrice - pos.entryPrice) * pos.size
      : (pos.entryPrice - markPrice) * pos.size;

    const pnlPercent = (pnl / Math.max(pos.margin, 1)) * 100;
    totalUnrealizedPnl += pnl;
    totalMarginLocked += pos.margin;

    // Liquidation distance
    const liqPrice = pos.liquidationPrice || (isLong ? pos.entryPrice * (1 - 0.9 / pos.leverage) : pos.entryPrice * (1 + 0.9 / pos.leverage));
    const liqDistPercent = (Math.abs(markPrice - liqPrice) / Math.max(markPrice, 0.0001)) * 100;

    let healthStatus: 'HEALTHY' | 'IN_PROFIT' | 'ELEVATED_RISK' | 'CRITICAL_LIQUIDATION' = 'HEALTHY';
    let recommendationTitle = 'Position Stable';
    let recommendationDetails = `Trade is behaving within normal volatility bounds. Liquidation buffer is healthy at ${liqDistPercent.toFixed(1)}%.`;
    let suggestedAction: 'TRAIL_BREAK_EVEN' | 'SECURE_PARTIAL_PROFIT' | 'EMERGENCY_CLOSE' | 'NONE' = 'NONE';
    let suggestedNewStopLoss: number | undefined;

    if (liqDistPercent <= 3.5) {
      healthStatus = 'CRITICAL_LIQUIDATION';
      recommendationTitle = '🚨 CRITICAL: Liquidation Imminent!';
      recommendationDetails = `Price is only ${liqDistPercent.toFixed(1)}% away from Liquidation ($${liqPrice.toFixed(2)}). Immediate capital risk.`;
      suggestedAction = 'EMERGENCY_CLOSE';
    } else if (pnlPercent < -25 || liqDistPercent <= 7.0) {
      healthStatus = 'ELEVATED_RISK';
      recommendationTitle = '⚠️ Elevated Drawdown Risk';
      recommendationDetails = `Drawdown is at ${pnlPercent.toFixed(1)}%. Recommend evaluating market structure or tightening stop loss.`;
    } else if (pnlPercent >= 15.0 || (isLong ? markPrice >= pos.entryPrice * 1.03 : markPrice <= pos.entryPrice * 0.97)) {
      healthStatus = 'IN_PROFIT';
      recommendationTitle = '🎯 High Profit: Secure 50% Gains';
      recommendationDetails = `Position is up +${pnlPercent.toFixed(1)}% (+$${pnl.toFixed(2)}). Consider taking partial profits and trailing your Stop Loss.`;
      suggestedAction = 'SECURE_PARTIAL_PROFIT';
      suggestedNewStopLoss = isLong ? +(pos.entryPrice * 1.01).toFixed(2) : +(pos.entryPrice * 0.99).toFixed(2);
    } else if (pnlPercent >= 4.0 && (!pos.stopLoss || (isLong ? pos.stopLoss < pos.entryPrice : pos.stopLoss > pos.entryPrice))) {
      healthStatus = 'IN_PROFIT';
      recommendationTitle = '🛡️ Lock Risk-Free: Move SL to Break-Even';
      recommendationDetails = `Position is +${pnlPercent.toFixed(1)}% in profit. Shift Stop Loss to Entry ($${pos.entryPrice.toFixed(2)}) to make this trade risk-free!`;
      suggestedAction = 'TRAIL_BREAK_EVEN';
      suggestedNewStopLoss = pos.entryPrice;
    }

    audits.push({
      positionId: pos.id,
      symbol: pos.symbol,
      side: pos.side,
      entryPrice: pos.entryPrice,
      markPrice,
      size: pos.size,
      margin: pos.margin,
      leverage: pos.leverage,
      liquidationPrice: liqPrice,
      currentPnl: +pnl.toFixed(2),
      currentPnlPercent: +pnlPercent.toFixed(2),
      liquidationDistancePercent: +liqDistPercent.toFixed(2),
      healthStatus,
      recommendationTitle,
      recommendationDetails,
      suggestedAction,
      suggestedNewStopLoss,
    });
  }

  // Find highest risk position
  const critical = audits.find((a) => a.healthStatus === 'CRITICAL_LIQUIDATION');
  const elevated = audits.find((a) => a.healthStatus === 'ELEVATED_RISK');
  const highestRiskPosition = critical || elevated || audits[0] || null;

  let overallPortfolioHealth: 'EXCELLENT' | 'STABLE' | 'WARNING' | 'CRITICAL' = 'STABLE';
  if (critical) {
    overallPortfolioHealth = 'CRITICAL';
  } else if (elevated) {
    overallPortfolioHealth = 'WARNING';
  } else if (totalUnrealizedPnl > 0) {
    overallPortfolioHealth = 'EXCELLENT';
  }

  return {
    totalOpenPositions: positions.length,
    totalUnrealizedPnl: +totalUnrealizedPnl.toFixed(2),
    totalMarginLocked: +totalMarginLocked.toFixed(2),
    highestRiskPosition,
    overallPortfolioHealth,
    audits,
  };
}
