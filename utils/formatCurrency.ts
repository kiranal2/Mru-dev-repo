/**
 * Format currency value
 * @param param0 - Currency value object
 * @param param0.value - Currency value
 * @param param0.precision - Precision
 * @param param0.currency - Currency symbol like USD, INR, etc.
 * @param param0.isFloat - Is float
 * @returns Formatted currency value
 */
export const formatCurrency = ({
  value,
  precision = 2,
  currency,
  isFloat = false,
}: {
  value: string | number;
  precision?: number;
  currency?: string;
  isFloat?: boolean;
}) => {
  const numValue = typeof value === 'string' ? parseFloat(value.trim().replace(/,/g, '')) : value;
  if (isNaN(numValue)) {
    return value;
  }
  const isFloatValue = isFloat || numValue % 1 !== 0;
  try {
    return Number(numValue).toLocaleString('en-US', {
      minimumFractionDigits: isFloatValue ? precision : 0,
      maximumFractionDigits: isFloatValue ? precision : 0,
      style: currency ? 'currency' : 'decimal',
      currency: currency || undefined,
    });
  } catch {
    return Number(numValue).toLocaleString('en-US', {
      minimumFractionDigits: isFloatValue ? precision : 0,
      maximumFractionDigits: isFloatValue ? precision : 0,
    });
  }
};
