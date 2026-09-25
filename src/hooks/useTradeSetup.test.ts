import { describe, it, expect } from 'vitest';
import {
  calculateDirectionalTPSL,
  validateTradeSetup,
} from './useTradeSetup';
import { TradeSetup } from '../types';

describe('useTradeSetup & Risk Engine Validation', () => {
  describe('calculateDirectionalTPSL', () => {
    it('calculates direction-aware targets for LONG trades (TP > Entry > SL)', () => {
      const entryPrice = 50000;
      const { takeProfit, stopLoss } = calculateDirectionalTPSL('buy', entryPrice);
      expect(takeProfit).toBeGreaterThan(entryPrice);
      expect(stopLoss).toBeLessThan(entryPrice);
      expect(takeProfit).toBe(51750); // +3.5%
      expect(stopLoss).toBe(49250);  // -1.5%
    });

    it('calculates direction-aware targets for SHORT trades (SL > Entry > TP)', () => {
      const entryPrice = 50000;
      const { takeProfit, stopLoss } = calculateDirectionalTPSL('sell', entryPrice);
      expect(takeProfit).toBeLessThan(entryPrice);
      expect(stopLoss).toBeGreaterThan(entryPrice);
      expect(takeProfit).toBe(48250); // -3.5%
      expect(stopLoss).toBe(50750);  // +1.5%
    });
  });

  describe('validateTradeSetup', () => {
    const baseSetup: TradeSetup = {
      symbol: 'BTC/USDT',
      side: 'buy',
      orderType: 'limit',
      entryPrice: 50000,
      currentMarketPrice: 50000,
      quantity: 0.1,
      leverage: 2,
      takeProfit: 52000,
      stopLoss: 49000,
      quoteTimestamp: Date.now(),
      source: 'manual',
    };

    it('approves a valid LONG trade within 1% risk limit', () => {
      const result = validateTradeSetup(baseSetup, 100000);
      expect(result.isValid).toBe(true);
      expect(result.directionalError).toBeNull();
      expect(result.riskError).toBeNull();
    });

    it('blocks a LONG trade if Stop Loss is above or equal to Entry Price', () => {
      const invalidSetup: TradeSetup = {
        ...baseSetup,
        stopLoss: 50500, // Invalid for LONG
      };
      const result = validateTradeSetup(invalidSetup, 100000);
      expect(result.isValid).toBe(false);
      expect(result.stopLossError).toContain('must be strictly below Entry');
    });

    it('blocks a SHORT trade if Stop Loss is below or equal to Entry Price', () => {
      const invalidShortSetup: TradeSetup = {
        ...baseSetup,
        side: 'sell',
        takeProfit: 48000,
        stopLoss: 49000, // Invalid for SHORT
      };
      const result = validateTradeSetup(invalidShortSetup, 100000);
      expect(result.isValid).toBe(false);
      expect(result.stopLossError).toContain('must be strictly above Entry');
    });

    it('blocks a SHORT trade if Take Profit is above Entry Price', () => {
      const invalidShortSetup: TradeSetup = {
        ...baseSetup,
        side: 'sell',
        takeProfit: 52000, // Invalid for SHORT
        stopLoss: 51000,
      };
      const result = validateTradeSetup(invalidShortSetup, 100000);
      expect(result.isValid).toBe(false);
      expect(result.takeProfitError).toContain('must be strictly below Entry');
    });

    it('enforces the 1.0% account equity risk limit', () => {
      // Risk limit on $10,000 equity = $100
      // Loss with qty 0.1 and SL 48000 on entry 50000 = $200 (exceeds $100)
      const highRiskSetup: TradeSetup = {
        ...baseSetup,
        quantity: 0.1,
        entryPrice: 50000,
        stopLoss: 48000,
      };
      const result = validateTradeSetup(highRiskSetup, 10000);
      expect(result.isValid).toBe(false);
      expect(result.riskError).toContain('exceeds 1.0% account equity');
    });

    it('detects and flags stale quotes older than 2000ms', () => {
      const staleSetup: TradeSetup = {
        ...baseSetup,
        quoteTimestamp: Date.now() - 3500, // 3.5 seconds old
      };
      const result = validateTradeSetup(staleSetup, 100000);
      expect(result.isValid).toBe(false);
      expect(result.isStale).toBe(true);
      expect(result.generalError).toContain('stale');
    });
  });
});
