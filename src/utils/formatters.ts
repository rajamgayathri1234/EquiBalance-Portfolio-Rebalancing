/**
 * Indian Rupee (INR / ₹) formatting utility
 * Adheres to Reserve Bank of India and Indian numbering system (Lakhs & Crores).
 */

export function formatINR(
  amount: number,
  options: {
    showDecimals?: boolean;
    compact?: boolean;
    prefix?: boolean;
  } = {}
): string {
  const { showDecimals = true, compact = false, prefix = true } = options;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  let formatted = '';

  if (compact) {
    if (absAmount >= 10000000) {
      // Crores (1 Cr = 1,00,00,000)
      formatted = `${(absAmount / 10000000).toFixed(2)} Cr`;
    } else if (absAmount >= 100000) {
      // Lakhs (1 L = 1,00,000)
      formatted = `${(absAmount / 100000).toFixed(2)} L`;
    } else if (absAmount >= 1000) {
      // Thousands
      formatted = `${(absAmount / 1000).toFixed(1)} K`;
    } else {
      formatted = absAmount.toFixed(showDecimals ? 2 : 0);
    }
  } else {
    formatted = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0
    });
  }

  const sign = isNegative ? '-' : '';
  const currencySymbol = prefix ? '₹' : '';

  return `${sign}${currencySymbol}${prefix ? ' ' : ''}${formatted}`;
}

export function formatIndianNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}
