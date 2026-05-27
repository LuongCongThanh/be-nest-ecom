/**
 * Format một sequence number thành Order Number hiển thị.
 *
 * QUAN TRỌNG: `sequence` phải đến từ Postgres sequence `order_number_seq`
 * (chạy trong cùng prisma.$transaction với việc tạo Order).
 * Hàm này chỉ format — không tự sinh sequence.
 *
 * @example formatOrderNumber(123) → "ORD-2026-000123"
 */
export function formatOrderNumber(sequence: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(6, '0');
  return `ORD-${year}-${padded}`;
}
