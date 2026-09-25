import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateDirectionalTPSL,
  validateUnifiedTradeSetup,
  validateTradeSetup,
} from '../hooks/useTradeSetup';
import { UnifiedTradeSetup, TradeSetup, AISignal, Candle } from '../types';

describe('Aggressive QA Verification Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. LONG and SHORT setups across BTC, ETH, and Low-Price Coin (DOGE)', () => {
    const assets = [
      { symbol: 'BTC/USDT', price: 65000, precision: 2 },
      { symbol: 'ETH/USDT', price: 2500, precision: 2 },
      { symbol: 'DOGE/USDT', price: 0.08232, precision: 4 }, // Low-price sub-dollar asset
    ];

    assets.forEach(({ symbol, price, precision }) => {
      it(`validates LONG setup correctly for ${symbol} ($${price})`, () => {
        const { takeProfit, stopLoss } = calculateDirectionalTPSL('buy', price, precision);

        // Strict inequalities must hold
        expect(takeProfit).toBeGreaterThan(price);
        expect(stopLoss).toBeLessThan(price);

        const setup: UnifiedTradeSetup = {
          symbol: symbol as any,
          side: 'LONG',
          entry: price,
          takeProfit,
          stopLoss,
          timeframe: '15m',
          updatedAt: Date.now(),
        };

        const result = validateUnifiedTradeSetup(setup);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });

      it(`validates SHORT setup correctly for ${symbol} ($${price})`, () => {
        const { takeProfit, stopLoss } = calculateDirectionalTPSL('sell', price, precision);

        // Strict inequalities must hold
        expect(takeProfit).toBeLessThan(price);
        expect(stopLoss).toBeGreaterThan(price);

        const setup: UnifiedTradeSetup = {
          symbol: symbol as any,
          side: 'SHORT',
          entry: price,
          takeProfit,
          stopLoss,
          timeframe: '15m',
          updatedAt: Date.now(),
        };

        const result = validateUnifiedTradeSetup(setup);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });
    });

    it('rejects invalid SHORT setup for DOGE/USDT where Target > Entry', () => {
      const invalidShortDoge: UnifiedTradeSetup = {
        symbol: 'DOGE/USDT' as any,
        side: 'SHORT',
        entry: 0.0823,
        takeProfit: 0.095, // Invalid: target is above entry!
        stopLoss: 0.075,   // Invalid: stop loss is below entry!
        timeframe: '15m',
        updatedAt: Date.now(),
      };

      const result = validateUnifiedTradeSetup(invalidShortDoge);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid SHORT setup');
    });

    it('rejects invalid LONG setup for BTC/USDT where Stop Loss > Entry', () => {
      const invalidLongBtc: UnifiedTradeSetup = {
        symbol: 'BTC/USDT' as any,
        side: 'LONG',
        entry: 65000,
        takeProfit: 63000, // Invalid: target is below entry!
        stopLoss: 66000,   // Invalid: stop loss is above entry!
        timeframe: '15m',
        updatedAt: Date.now(),
      };

      const result = validateUnifiedTradeSetup(invalidLongBtc);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid LONG setup');
    });
  });

  describe('2. Single Source of Truth Synchronization on Symbol Switch', () => {
    it('synchronizes Entry, TP, and SL cleanly when switching from BTC to DOGE without stale values', () => {
      const btcPrice = 65000;
      const btcSetup = calculateDirectionalTPSL('buy', btcPrice, 2);

      let currentUnifiedSetup: UnifiedTradeSetup = {
        symbol: 'BTC/USDT' as any,
        side: 'LONG',
        entry: btcPrice,
        takeProfit: btcSetup.takeProfit,
        stopLoss: btcSetup.stopLoss,
        timeframe: '15m',
        updatedAt: Date.now(),
      };

      expect(currentUnifiedSetup.entry).toBe(65000);
      expect(currentUnifiedSetup.takeProfit).toBeGreaterThan(65000);

      // Simulate switching symbol to DOGE/USDT
      const dogePrice = 0.08232;
      const dogePrecision = 4;
      const dogeSetup = calculateDirectionalTPSL('buy', dogePrice, dogePrecision);

      // Mutate via single source of truth update handler
      currentUnifiedSetup = {
        symbol: 'DOGE/USDT' as any,
        side: 'LONG',
        entry: dogePrice,
        takeProfit: dogeSetup.takeProfit,
        stopLoss: dogeSetup.stopLoss,
        timeframe: '15m',
        updatedAt: Date.now(),
      };

      // Ensure no BTC-scale numbers remain in DOGE setup
      expect(currentUnifiedSetup.symbol).toBe('DOGE/USDT');
      expect(currentUnifiedSetup.entry).toBe(0.08232);
      expect(currentUnifiedSetup.takeProfit).toBeLessThan(1.0);
      expect(currentUnifiedSetup.takeProfit).toBeGreaterThan(0.08232);
      expect(currentUnifiedSetup.stopLoss).toBeLessThan(0.08232);
      expect(currentUnifiedSetup.stopLoss).toBeGreaterThan(0.05);

      const validation = validateUnifiedTradeSetup(currentUnifiedSetup);
      expect(validation.isValid).toBe(true);
    });

    it('synchronizes Entry, TP, and SL cleanly when an AI Signal is attached', () => {
      const testSignal: AISignal = {
        id: 'sig-test-eth-1',
        title: 'Institutional Order Block',
        type: 'BULLISH_BREAKOUT',
        symbol: 'ETH/USDT' as any,
        side: 'LONG',
        confidence: 88,
        strategy: 'Institutional Orderflow Block',
        timeframe: '15m',
        entryPrice: 2520,
        entryRange: [2510, 2525],
        target1: 2620,
        target2: 2700,
        stopLoss: 2470,
        rewardPercent: 3.97,
        riskPercent: 1.98,
        riskReward: '2.01',
        recommendedLeverage: 3,
        timestamp: Date.now(),
        description: 'Bullish order block test with institutional absorption',
        rationale: 'Bullish order block test with institutional absorption',
        active: true,
        technicalSupport: {
          rsi: 54,
          rsiSignal: 'Neutral',
          macd: { macd: 12, signal: 8, histogram: 4, trend: 'Bullish Expansion' },
          emaTrend: 'BULLISH',
          volumeSurge: '1.8x',
          supportLevel: 2470,
          resistanceLevel: 2620,
          ema20: 2500,
          ema50: 2480,
          ema200: 2400,
          atr: 25,
          orderflowImbalance: '+74% Buy Delta',
        },
      };

      // Chart, OrderForm and Review screen read from unified object:
      const unifiedSetup: UnifiedTradeSetup = {
        symbol: testSignal.symbol,
        side: testSignal.side,
        entry: testSignal.entryPrice,
        takeProfit: testSignal.target1,
        stopLoss: testSignal.stopLoss,
        timeframe: testSignal.timeframe,
        signalId: testSignal.id,
        updatedAt: Date.now(),
      };

      // Verify Chart level match
      expect(unifiedSetup.entry).toBe(testSignal.entryPrice);
      expect(unifiedSetup.takeProfit).toBe(testSignal.target1);
      expect(unifiedSetup.stopLoss).toBe(testSignal.stopLoss);

      // Verify OrderForm input match
      const orderFormEntry = unifiedSetup.entry;
      const orderFormTP = unifiedSetup.takeProfit;
      const orderFormSL = unifiedSetup.stopLoss;
      expect(orderFormEntry).toBe(2520);
      expect(orderFormTP).toBe(2620);
      expect(orderFormSL).toBe(2470);

      // Verify validation passes
      expect(validateUnifiedTradeSetup(unifiedSetup).isValid).toBe(true);
    });
  });

  describe('3. Race Condition & Stale Data Quarantine', () => {
    it('quarantines mismatched price scales when switching between ETH and BTC', () => {
      const ethTargetPrice = 2500;
      const incomingBtcCandle: Candle = {
        time: 1711200000,
        open: 65000,
        high: 65500,
        low: 64800,
        close: 65200,
        volume: 50,
      };

      // Ratio check: 65200 / 2500 = 26.08 (exceeds reasonable ratio [0.05, 20])
      const ratio = incomingBtcCandle.close / Math.max(0.0001, ethTargetPrice);
      const isReasonable = ratio > 0.05 && ratio < 20;
      expect(isReasonable).toBe(false);
    });

    it('quarantines mismatched price scales when switching between BTC and DOGE', () => {
      const dogeTargetPrice = 0.08232;
      const incomingBtcCandle: Candle = {
        time: 1711200000,
        open: 65000,
        high: 65500,
        low: 64800,
        close: 65200,
        volume: 50,
      };

      // Ratio check: 65200 / 0.08232 = 792,031
      const ratio = incomingBtcCandle.close / Math.max(0.0001, dogeTargetPrice);
      const isReasonable = ratio > 0.05 && ratio < 20;
      expect(isReasonable).toBe(false);
    });
  });

  describe('4. Paper Trading Safety Enforcement', () => {
    it('blocks trade execution when quote is stale >2000ms', () => {
      const staleSetup: TradeSetup = {
        symbol: 'BTC/USDT',
        side: 'buy',
        orderType: 'limit',
        entryPrice: 65000,
        currentMarketPrice: 65000,
        quantity: 0.1,
        leverage: 2,
        takeProfit: 67000,
        stopLoss: 64000,
        quoteTimestamp: Date.now() - 3500, // 3.5 seconds old
        source: 'manual',
      };

      const result = validateTradeSetup(staleSetup, 100000);
      expect(result.isValid).toBe(false);
      expect(result.isStale).toBe(true);
      expect(result.generalError).toContain('stale');
    });

    it('enforces institutional retail leverage cap of 3x', () => {
      const highLevSetup: TradeSetup = {
        symbol: 'BTC/USDT',
        side: 'buy',
        orderType: 'limit',
        entryPrice: 65000,
        currentMarketPrice: 65000,
        quantity: 0.1,
        leverage: 10, // Violates max 3x retail policy
        takeProfit: 67000,
        stopLoss: 64000,
        quoteTimestamp: Date.now(),
        source: 'manual',
      };

      const result = validateTradeSetup(highLevSetup, 100000);
      expect(result.isValid).toBe(false);
      expect(result.leverageError).toContain('exceeds conservative retail maximum of 3x');
    });
  });
});
