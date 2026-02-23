interface ParseOptions {
  defaultValue?: number;
  min?: number;
  max?: number;
  integer?: boolean;
  allowNegative?: boolean;
}

/**
 * Safely converts a string to a number with full validation options
 */
export function safeParseNumber(
  value: string,
  options: ParseOptions = {}
): number {
  const {
    defaultValue = 0,
    min,
    max,
    integer = false,
    allowNegative = false
  } = options;

  // Handle empty or invalid input
  if (!value || typeof value !== 'string') {
    return defaultValue;
  }

  // Remove whitespace and commas
  const cleanedValue = value.trim().replace(/,/g, '');

  // Check if it's a valid number format
  if (!/^-?\d*\.?\d+$/.test(cleanedValue) && cleanedValue !== '') {
    return defaultValue;
  }

  // Parse based on type
  let num = integer
    ? parseInt(cleanedValue, 10)
    : parseFloat(cleanedValue);

  // Check if parsing resulted in NaN
  if (isNaN(num)) {
    return defaultValue;
  }

  // Check negative numbers
  if (!allowNegative && num < 0) {
    return defaultValue;
  }

  // Apply min/max constraints
  if (min !== undefined && num < min) {
    return min;
  }

  if (max !== undefined && num > max) {
    return max;
  }

  return num;
}