import { z } from 'zod';

/**
 * Institutional Risk & Safety Order Validation Schema
 * Guardrails enforced:
 * 1. Mode restriction: Real-money live execution blocked. Only RESEARCH or PAPER permitted.
 * 2. Leverage capped at 3x for retail tier.
 * 3. Directional price relationship:
 *    - Long: Stop Loss < Entry Price < Take Profit
 *    - Short: Take Profit < Entry Price < Stop Loss
 * 4. Conservative Risk Modeling: Max risk per trade <= 1% of account equity.
 * 5. Data Freshness: Market quotes older than 2000ms lock execution.
 */

export const OrderExecutionSchema = z
  .object({
    symbol: z
      .string()
      .min(3, 'Asset symbol must be at least 3 characters')
      .max(20, 'Asset symbol exceeds max length')
      .regex(/^[A-Z0-9]+(\/[A-Z0-9]+)?$/, 'Symbol must follow standard format (e.g. BTC/USDT or XAU/USDT)'),
    side: z.enum(['buy', 'sell']),
    orderType: z.enum(['market', 'limit', 'stop-limit', 'ai-smart']),
    quantity: z
      .number()
      .positive('Quantity must be strictly greater than 0')
      .min(0.00001, 'Quantity is below minimum lot size (0.00001)')
      .max(1000000, 'Quantity exceeds maximum single order limit'),
    entryPrice: z
      .number()
      .positive('Entry price must be strictly positive'),
    currentMarketPrice: z
      .number()
      .positive('Current market price must be positive'),
    leverage: z
      .number()
      .int('Leverage must be an integer')
      .min(1, 'Leverage cannot be less than 1x')
      .max(3, 'Leverage is capped at 3x under institutional retail risk rules (50x/100x banned)'),
    stopLoss: z
      .number()
      .positive('Stop loss must be a positive number'),
    takeProfit: z
      .number()
      .positive('Take profit must be a positive number'),
    accountEquity: z
      .number()
      .positive('Account equity must be positive'),
    quoteTimestamp: z
      .number()
      .int()
      .positive(),
    mode: z.enum(['RESEARCH', 'PAPER', 'LIVE']),
    idempotencyKey: z
      .string()
      .min(8, 'Idempotency key must be at least 8 characters'),
  })
  .superRefine((data, ctx) => {
    // Guardrail 1: Live execution blocked
    if (data.mode === 'LIVE') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mode'],
        message:
          'Real-money live execution is completely blocked under institutional safety protocol. Switch to PAPER TRADING mode.',
      });
    }

    if (data.mode === 'RESEARCH') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mode'],
        message: 'Order execution is disabled in RESEARCH mode. Switch to PAPER TRADING to simulate orders.',
      });
    }

    // Guardrail 3: Strict Directional Price Relationships
    if (data.side === 'buy') {
      // Long: Stop Loss < Entry Price < Take Profit
      if (data.stopLoss >= data.entryPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['stopLoss'],
          message: `For LONG/BUY: Stop Loss ($${data.stopLoss}) must be below Entry Price ($${data.entryPrice})`,
        });
      }
      if (data.takeProfit <= data.entryPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['takeProfit'],
          message: `For LONG/BUY: Take Profit ($${data.takeProfit}) must be above Entry Price ($${data.entryPrice})`,
        });
      }
    } else {
      // Short: Take Profit < Entry Price < Stop Loss
      if (data.stopLoss <= data.entryPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['stopLoss'],
          message: `For SHORT/SELL: Stop Loss ($${data.stopLoss}) must be above Entry Price ($${data.entryPrice})`,
        });
      }
      if (data.takeProfit >= data.entryPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['takeProfit'],
          message: `For SHORT/SELL: Take Profit ($${data.takeProfit}) must be below Entry Price ($${data.entryPrice})`,
        });
      }
    }

    // Guardrail 4: Conservative Risk Modeling - Max risk per trade <= 1% of account equity
    const plannedLossUsd = Math.abs(data.entryPrice - data.stopLoss) * data.quantity;
    const maxAllowedRiskUsd = data.accountEquity * 0.01; // 1%
    if (plannedLossUsd > maxAllowedRiskUsd + 0.001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quantity'],
        message: `Max risk per trade ($${plannedLossUsd.toFixed(2)}) exceeds conservative 1.0% account equity limit ($${maxAllowedRiskUsd.toFixed(2)}). Reduce position size or tighten stop loss.`,
      });
    }

    // Guardrail 5: Data Freshness: Market quotes older than 2000ms must lock execution
    const quoteAgeMs = Date.now() - data.quoteTimestamp;
    if (quoteAgeMs > 2000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['quoteTimestamp'],
        message: `Market quote is stale (${quoteAgeMs}ms old > 2000ms threshold). Order execution locked to prevent slippage.`,
      });
    }
  });

export type OrderExecutionPayload = z.infer<typeof OrderExecutionSchema>;

export interface ZodValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
  data?: OrderExecutionPayload;
}

/**
 * Validates an order payload against the institutional Zod schema.
 */
export function validateOrderWithZod(payload: unknown): ZodValidationResult {
  const result = OrderExecutionSchema.safeParse(payload);
  if (result.success) {
    return {
      isValid: true,
      errors: [],
      fieldErrors: {},
      data: result.data,
    };
  }

  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  for (const issue of result.error.issues) {
    const field = issue.path.join('.') || 'general';
    errors.push(issue.message);
    if (!fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  return {
    isValid: false,
    errors,
    fieldErrors,
  };
}
