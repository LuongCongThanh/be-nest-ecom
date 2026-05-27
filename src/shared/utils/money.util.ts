/**
 * Chuyển BigInt tiền VND sang string để serialize trong JSON response.
 *
 * Tại sao dùng BigInt: float/number có precision bug với số lớn (VD: 9007199254740993 bị mất chữ số).
 * Tại sao serialize sang string: JSON.stringify throw TypeError nếu gặp BigInt trực tiếp.
 * Client nhận string rồi tự parse (parseInt / BigInt).
 *
 * @example moneyToString(100000n) → "100000"
 */
export function moneyToString(value: bigint): string {
  return value.toString();
}

/**
 * Parse string tiền từ client/DB sang BigInt để tính toán.
 *
 * @example moneyFromString("100000") → 100000n
 */
export function moneyFromString(value: string): bigint {
  return BigInt(value);
}
