/**
 * RecycWorks Precision Arithmetic Engine
 * 
 * Provides deterministic decimal arithmetic for weights and finances,
 * eliminating JavaScript floating-point rounding errors (e.g. 0.1 + 0.2 !== 0.3).
 */

/**
 * Normalizes and rounds a weight to exactly 3 decimal places (0.000 KG).
 */
export function toWeight(value: number | string): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num)) return 0;
  // Multiplied by 1000, rounded to integer, divided by 1000
  return Math.round((num + Number.EPSILON) * 1000) / 1000;
}

/**
 * Formats a weight as a clean string representation with 3 decimal places (e.g. "48.500").
 */
export function formatWeight(value: number | string): string {
  return toWeight(value).toFixed(3);
}

/**
 * Normalizes and rounds a financial value to exactly 2 decimal places (0.00 KES).
 */
export function toCurrency(value: number | string): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a currency value as a clean string representation with 2 decimal places (e.g. "11250.00").
 */
export function formatCurrency(value: number | string): string {
  return toCurrency(value).toFixed(2);
}

/**
 * Accurately sums an array of numbers using integer scaling to avoid floating-point drift.
 */
export function sumWeights(weights: (number | string)[]): number {
  const scaledSum = weights.reduce<number>((acc, cur) => {
    const w = toWeight(cur);
    return acc + Math.round(w * 1000);
  }, 0);
  return scaledSum / 1000;
}

/**
 * Calculates line-item value: weightKg × unitPricePerKg, rounded to 2 decimal places.
 */
export function calculateItemValue(weightKg: number | string, unitPricePerKg: number | string): number {
  const w = toWeight(weightKg);
  const p = toCurrency(unitPricePerKg);
  return toCurrency(w * p);
}

/**
 * Sums financial amounts with 2-decimal precision.
 */
export function sumCurrency(amounts: (number | string)[]): number {
  const scaledSum = amounts.reduce<number>((acc, cur) => {
    const a = toCurrency(cur);
    return acc + Math.round(a * 100);
  }, 0);
  return scaledSum / 100;
}
