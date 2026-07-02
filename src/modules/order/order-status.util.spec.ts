import { calculateGrandTotal, formatOrderNumber, isValidOrderTransition, isWithinRefundWindow } from './order-status.util';

describe('isValidOrderTransition', () => {
  it('allows PENDING -> PAID', () => {
    expect(isValidOrderTransition('PENDING', 'PAID')).toBe(true);
  });

  it('rejects DELIVERED -> PENDING', () => {
    expect(isValidOrderTransition('DELIVERED', 'PENDING')).toBe(false);
  });

  it('allows PAID -> SHIPPING', () => {
    expect(isValidOrderTransition('PAID', 'SHIPPING')).toBe(true);
  });

  it('rejects any transition out of a terminal state (CANCELLED)', () => {
    expect(isValidOrderTransition('CANCELLED', 'PAID')).toBe(false);
  });
});

describe('isWithinRefundWindow', () => {
  it('rejects refund when delivered 10 days ago (AC-6)', () => {
    const deliveredAt = new Date('2026-06-22T00:00:00Z');
    const now = new Date('2026-07-02T00:00:00Z');
    expect(isWithinRefundWindow(deliveredAt, now)).toBe(false);
  });

  it('allows refund when delivered 3 days ago', () => {
    const deliveredAt = new Date('2026-06-29T00:00:00Z');
    const now = new Date('2026-07-02T00:00:00Z');
    expect(isWithinRefundWindow(deliveredAt, now)).toBe(true);
  });
});

describe('formatOrderNumber', () => {
  it('pads sequence to 6 digits (AC-3)', () => {
    expect(formatOrderNumber(123, 2026)).toBe('ORD-2026-000123');
  });

  it('does not truncate sequences longer than 6 digits', () => {
    expect(formatOrderNumber(1234567, 2026)).toBe('ORD-2026-1234567');
  });
});

describe('calculateGrandTotal', () => {
  it('computes max(0, subtotal - discount) + shippingFee, ignoring vatTotal (AC-5)', () => {
    const grandTotal = calculateGrandTotal({
      subtotal: 1_000_000n,
      shippingFee: 50_000n,
      discountAmount: 200_000n,
    });
    expect(grandTotal).toBe(850_000n);
  });

  it('clamps to 0 when discount exceeds subtotal', () => {
    const grandTotal = calculateGrandTotal({
      subtotal: 100_000n,
      shippingFee: 20_000n,
      discountAmount: 500_000n,
    });
    expect(grandTotal).toBe(20_000n);
  });
});
