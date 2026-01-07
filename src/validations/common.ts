// Common validation utilities used across multiple domains

// UUID validation regex
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Date validation regex (YYYY-MM-DD)
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Hex color validation regex (# followed by 6 hex digits)
export const HEX_COLOR_REGEX = /^#[0-9A-F]{6}$/i;

/**
 * Validate UUID format
 */
export const isValidUUID = (id: string): boolean => {
  return UUID_REGEX.test(id);
};

/**
 * Validate date format (YYYY-MM-DD)
 */
export const isValidDate = (date: string): boolean => {
  if (!DATE_REGEX.test(date)) {
    return false;
  }
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Validate amount (must be positive number)
 * Max value: 9999999999.99 (DECIMAL(12,2))
 */
export const isValidAmount = (amount: any): amount is number => {
  return (
    typeof amount === 'number' &&
    !isNaN(amount) &&
    isFinite(amount) &&
    amount > 0 &&
    amount <= 9999999999.99
  );
};

/**
 * Validate hex color format (#RRGGBB)
 */
export const isValidHexColor = (color: string): boolean => {
  return HEX_COLOR_REGEX.test(color);
};

/**
 * Normalize date to first day of month (YYYY-MM-01)
 */
export const normalizeMonth = (date: string): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

