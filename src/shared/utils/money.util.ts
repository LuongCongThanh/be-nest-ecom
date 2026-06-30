/**
 * Converts a VND BigInt amount to string for JSON response serialization.
 *
 * Why BigInt: float/number has precision bugs with large values (e.g. 9007199254740993 loses digits).
 * Why serialize to string: JSON.stringify throws TypeError when it encounters BigInt directly.
 * Client receives the string and parses it (parseInt / BigInt).
 *
 * @example moneyToString(100000n) → "100000"
 */
export function moneyToString(value: bigint): string {
  return value.toString();
}

/**
 * Parses a money string from client/DB to BigInt for calculations.
 *
 * @example moneyFromString("100000") → 100000n
 */
export function moneyFromString(value: string): bigint {
  return BigInt(value);
}
