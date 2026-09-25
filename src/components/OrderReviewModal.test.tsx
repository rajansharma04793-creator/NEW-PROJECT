import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderReviewModal } from './OrderReviewModal';
import { OrderReviewPayload } from '../types';

describe('OrderReviewModal Component', () => {
  const baseOrder: OrderReviewPayload = {
    idempotencyKey: 'ORD-TEST-12345678',
    symbol: 'BTC/USDT',
    market: 'Perpetual Futures',
    side: 'buy',
    quantity: 0.1,
    orderType: 'limit',
    entryPrice: 50000,
    currentMarketPrice: 50000,
    leverage: 2,
    marginMode: 'cross',
    requiredMargin: 2500,
    tradingFeeEstimate: 1.0,
    fundingEstimate: 0.25,
    spreadEstimate: 0.5,
    slippageEstimate: 0.5,
    maxPlannedLoss: 100,
    takeProfit: 52000,
    stopLoss: 49000,
    estimatedLiqPrice: 25100,
    accountBalanceAfterTrade: 97500,
    remainingBuyingPower: 97500,
    dataSource: 'Unified Real-Time Exchange Feed',
    dataTimestamp: Date.now(),
    isDataStale: false,
  };

  const mockClose = vi.fn();
  const mockConfirm = vi.fn().mockResolvedValue({ success: true });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with accessible dialog role and title', () => {
    render(
      <OrderReviewModal
        isOpen={true}
        onClose={mockClose}
        order={baseOrder}
        mode="PAPER"
        onConfirmOrder={mockConfirm}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText(/Order Review & Safety Verification/i)).toBeDefined();
  });

  it('strictly blocks execution when in LIVE mode (Principle #1)', () => {
    render(
      <OrderReviewModal
        isOpen={true}
        onClose={mockClose}
        order={baseOrder}
        mode="LIVE"
        onConfirmOrder={mockConfirm}
      />
    );

    expect(screen.getByText(/LIVE TRADING DISARMED/i)).toBeDefined();
    expect(screen.getByText(/Real-Money Live Trading Execution Blocked/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /Confirm BUY/i })).toBeNull();
  });

  it('blocks execution when in RESEARCH mode', () => {
    render(
      <OrderReviewModal
        isOpen={true}
        onClose={mockClose}
        order={baseOrder}
        mode="RESEARCH"
        onConfirmOrder={mockConfirm}
      />
    );

    expect(screen.getByText(/RESEARCH ONLY — ORDERS BLOCKED/i)).toBeDefined();
    expect(screen.getByText(/Execution Disabled in Research Mode/i)).toBeDefined();
    expect(screen.queryByRole('button', { name: /Confirm BUY/i })).toBeNull();
  });

  it('detects and flags directional price errors for BUY / LONG (SL >= Entry or TP <= Entry)', () => {
    const invalidLongOrder: OrderReviewPayload = {
      ...baseOrder,
      side: 'buy',
      entryPrice: 50000,
      stopLoss: 51000, // Invalid: Stop Loss above entry!
      takeProfit: 49000, // Invalid: Take profit below entry!
    };

    render(
      <OrderReviewModal
        isOpen={true}
        onClose={mockClose}
        order={invalidLongOrder}
        mode="PAPER"
        onConfirmOrder={mockConfirm}
      />
    );

    expect(screen.getByText(/Directional Price Hierarchy Violation/i)).toBeDefined();
    const confirmBtn = screen.getByRole('button', { name: /Confirm BUY/i });
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);
  });

  it('detects and flags directional price errors for SELL / SHORT (SL <= Entry or TP >= Entry)', () => {
    const invalidShortOrder: OrderReviewPayload = {
      ...baseOrder,
      side: 'sell',
      entryPrice: 50000,
      stopLoss: 49000, // Invalid: Stop loss below entry for short!
      takeProfit: 52000, // Invalid: Take profit above entry for short!
    };

    render(
      <OrderReviewModal
        isOpen={true}
        onClose={mockClose}
        order={invalidShortOrder}
        mode="PAPER"
        onConfirmOrder={mockConfirm}
      />
    );

    expect(screen.getByText(/Directional Price Hierarchy Violation/i)).toBeDefined();
    const confirmBtn = screen.getByRole('button', { name: /Confirm SELL/i });
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);
  });

  it('enforces maximum 3x leverage cap under retail risk policy', () => {
    const highLeverageOrder: OrderReviewPayload = {
      ...baseOrder,
      leverage: 10, // Banned leverage!
    };

    render(
      <OrderReviewModal
        isOpen={true}
        onClose={mockClose}
        order={highLeverageOrder}
        mode="PAPER"
        onConfirmOrder={mockConfirm}
      />
    );

    expect(screen.getByText(/Leverage Policy Breach/i)).toBeDefined();
    expect(screen.getByText(/exceeds the maximum allowed institutional retail cap of 3x/i)).toBeDefined();
    const confirmBtn = screen.getByRole('button', { name: /Confirm BUY/i });
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);
  });

  it('locks order execution when market quote is older than 2000ms (Data Freshness)', () => {
    const staleOrder: OrderReviewPayload = {
      ...baseOrder,
      dataTimestamp: Date.now() - 3500, // 3.5 seconds old > 2000ms
    };

    render(
      <OrderReviewModal
        isOpen={true}
        onClose={mockClose}
        order={staleOrder}
        mode="PAPER"
        onConfirmOrder={mockConfirm}
      />
    );

    expect(screen.getByText(/Execution Locked: Stale Market Data/i)).toBeDefined();
    const confirmBtn = screen.getByRole('button', { name: /Confirm BUY/i });
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);
  });

  it('enforces 1% account equity risk limit', () => {
    // Total Equity: 2500 + 7500 = 10,000 USD
    // 1% Equity Cap: 100 USD
    // Planned Loss: |50000 - 45000| * 0.1 = 500 USD (> 100 USD)
    const highRiskOrder: OrderReviewPayload = {
      ...baseOrder,
      entryPrice: 50000,
      stopLoss: 45000,
      quantity: 0.1,
      requiredMargin: 2500,
      accountBalanceAfterTrade: 7500,
    };

    render(
      <OrderReviewModal
        isOpen={true}
        onClose={mockClose}
        order={highRiskOrder}
        mode="PAPER"
        onConfirmOrder={mockConfirm}
      />
    );

    expect(screen.getByText(/1.0% Account Equity Risk Limit Exceeded/i)).toBeDefined();
    const confirmBtn = screen.getByRole('button', { name: /Confirm BUY/i });
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);
  });

  it('dismisses modal on Escape key press (keyboard trap)', () => {
    render(
      <OrderReviewModal
        isOpen={true}
        onClose={mockClose}
        order={baseOrder}
        mode="PAPER"
        onConfirmOrder={mockConfirm}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('prevents double submission by disabling button and showing loading state on confirm', async () => {
    let resolveOrder: (val: any) => void = () => {};
    const slowConfirm = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        resolveOrder = resolve;
      });
    });

    render(
      <OrderReviewModal
        isOpen={true}
        onClose={mockClose}
        order={baseOrder}
        mode="PAPER"
        onConfirmOrder={slowConfirm}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /Confirm BUY/i });
    expect(confirmBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(confirmBtn);

    // After first click, confirm button enters loading state and is disabled
    expect(screen.getByText(/Validating & Routing Order/i)).toBeDefined();
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);

    // Second click should be ignored
    fireEvent.click(confirmBtn);
    expect(slowConfirm).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolveOrder({ success: true });
    await waitFor(() => {
      expect(mockClose).toHaveBeenCalled();
    });
  });
});
