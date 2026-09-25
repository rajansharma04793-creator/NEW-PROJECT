// Smart Position Sizing and Capital Risk Management Calculations

import { AssetPair } from '../types';

export interface PositionSizeCalculationInput {
  accountBalance: number; // e.g. 100,000
  riskPercent: number; // e.g. 1.0 (1%)
  leverage: number; // e.g. 10x
  entryPrice: number; // e.g. 2427.50
  stopLossPrice: number; // e.g. 2390.00
  target1Price?: number; // e.g. 2498.00
  target2Price?: number; // e.g. 2560.00
  side?: 'LONG' | 'SHORT';
  symbol?: AssetPair;
}

export interface PositionSizeCalculationResult {
  dollarRisk: number; // Maximum loss in dollars ($1,000)
  priceRiskPercent: number; // Price difference to SL in % (e.g. 1.54%)
  recommendedPositionSizeUsd: number; // Total Notional Trade Size ($64,935)
  recommendedCoins: number; // Total Units / Lots of crypto (e.g. 26.74 ETH)
  requiredMargin: number; // Actual collateral locked ($6,493.50 at 10x)
  marginPercentOfBalance: number; // % of total wallet required (6.49%)
  liquidationPrice: number; // Estimated bankruptcy price
  liquidationBufferPercent: number; // Safe buffer % before liquidation
  riskRewardRatio: string; // e.g. "1 : 2.85"
  potentialProfitTP1: number; // Dollar gain at TP1 (+$1,885)
  potentialProfitTP2: number; // Dollar gain at TP2 (+$3,540)
  maxRiskWarning?: string; // Warning if risk or margin exceeds safe parameters
}

export function calculateSmartPositionSize(
  params: PositionSizeCalculationInput
): PositionSizeCalculationResult {
  const {
    accountBalance = 100000,
    riskPercent = 1.0,
    leverage = 10,
    entryPrice = 100,
    stopLossPrice = 98,
    target1Price = 104,
    target2Price = 108,
    side = 'LONG',
  } = params;

  // Maximum allowed dollar loss for the account
  const dollarRisk = Math.max(1, accountBalance * (riskPercent / 100));

  // Absolute distance to stop loss per unit
  const priceDistanceToSL = Math.max(0.000001, Math.abs(entryPrice - stopLossPrice));
  const priceRiskPercent = (priceDistanceToSL / Math.max(entryPrice, 0.000001)) * 100;

  // Exact number of coins/contracts needed so that if SL is hit, loss = dollarRisk
  const recommendedCoins = dollarRisk / priceDistanceToSL;
  const recommendedPositionSizeUsd = recommendedCoins * entryPrice;

  // Required margin based on leverage
  const requiredMargin = recommendedPositionSizeUsd / Math.max(1, leverage);
  const marginPercentOfBalance = (requiredMargin / Math.max(accountBalance, 1)) * 100;

  // Liquidation Price calculation
  // Long Liquidation = Entry * (1 - 0.9 / leverage)
  // Short Liquidation = Entry * (1 + 0.9 / leverage)
  const isLong = side === 'LONG';
  const liquidationPrice = isLong
    ? entryPrice * (1 - 0.9 / Math.max(1, leverage))
    : entryPrice * (1 + 0.9 / Math.max(1, leverage));

  const liquidationBufferPercent =
    (Math.abs(entryPrice - liquidationPrice) / Math.max(entryPrice, 0.000001)) * 100;

  // Risk to Reward calculation
  const distanceToTP1 = Math.abs((target1Price || entryPrice * 1.03) - entryPrice);
  const rawRR = distanceToTP1 / priceDistanceToSL;
  const riskRewardRatio = `1 : ${rawRR.toFixed(2)}`;

  // Potential Profits
  const potentialProfitTP1 = distanceToTP1 * recommendedCoins;
  const distanceToTP2 = Math.abs((target2Price || entryPrice * 1.06) - entryPrice);
  const potentialProfitTP2 = distanceToTP2 * recommendedCoins;

  // Risk validation warning
  let maxRiskWarning: string | undefined;
  if (requiredMargin > accountBalance * 0.5) {
    maxRiskWarning = '⚠️ High Margin Requirement: Trade requires >50% of your account balance. Consider widening SL or lowering risk %.';
  } else if (leverage > 25 && liquidationBufferPercent < priceRiskPercent * 1.5) {
    maxRiskWarning = '🚨 Liquidation Danger: Liquidation price is closer than 1.5x of your Stop Loss! Lower leverage immediately.';
  }

  return {
    dollarRisk: +dollarRisk.toFixed(2),
    priceRiskPercent: +priceRiskPercent.toFixed(2),
    recommendedPositionSizeUsd: +recommendedPositionSizeUsd.toFixed(2),
    recommendedCoins: +recommendedCoins.toFixed(4),
    requiredMargin: +requiredMargin.toFixed(2),
    marginPercentOfBalance: +marginPercentOfBalance.toFixed(1),
    liquidationPrice: +liquidationPrice.toFixed(2),
    liquidationBufferPercent: +liquidationBufferPercent.toFixed(2),
    riskRewardRatio,
    potentialProfitTP1: +potentialProfitTP1.toFixed(2),
    potentialProfitTP2: +potentialProfitTP2.toFixed(2),
    maxRiskWarning,
  };
}
