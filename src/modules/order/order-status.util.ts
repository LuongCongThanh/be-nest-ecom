export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPING', 'REFUNDED', 'CANCELLED'],
  SHIPPING: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export function isValidOrderTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

const REFUND_WINDOW_DAYS = 7;

export function isWithinRefundWindow(deliveredAt: Date, now: Date): boolean {
  const elapsedMs = now.getTime() - deliveredAt.getTime();
  const windowMs = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return elapsedMs <= windowMs;
}

export function formatOrderNumber(sequenceValue: number, year: number): string {
  return `ORD-${year}-${sequenceValue.toString().padStart(6, '0')}`;
}

export function calculateGrandTotal(input: { subtotal: bigint; shippingFee: bigint; discountAmount: bigint }): bigint {
  const afterDiscount = input.subtotal - input.discountAmount;
  const clamped = afterDiscount > 0n ? afterDiscount : 0n;
  return clamped + input.shippingFee;
}
