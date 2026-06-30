/**
 * Formats a sequence number into a display Order Number.
 *
 * IMPORTANT: `sequence` must come from the Postgres sequence `order_number_seq`
 * (run within the same prisma.$transaction as the Order creation).
 * This function only formats — it does not generate the sequence.
 *
 * @example formatOrderNumber(123) → "ORD-2026-000123"
 */
export function formatOrderNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(6, '0');
  return `ORD-${year}-${padded}`;
}
