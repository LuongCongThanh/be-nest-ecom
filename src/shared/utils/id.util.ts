export function generateOrderId(sequence: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequence).padStart(6, '0');
  return `ORD-${year}-${padded}`;
}
