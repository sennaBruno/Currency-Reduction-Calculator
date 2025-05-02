import { ExchangeRate } from './exchangeRate.type';
import { ICurrency } from './currency.interface';

/**
 * Converts an amount from source to target currency using the provided exchange rate
 * @param amount The amount to convert
 * @param exchangeRate The exchange rate to use for conversion
 * @returns The converted amount
 */
export function convertAmount(amount: number, exchangeRate: ExchangeRate): number {
  return amount * exchangeRate.rate;
}

/**
 * Converts an amount from target to source currency using the provided exchange rate
 * @param amount The amount to convert
 * @param exchangeRate The exchange rate to use for conversion
 * @returns The converted amount
 */
export function convertAmountReverse(amount: number, exchangeRate: ExchangeRate): number {
  return amount / exchangeRate.rate;
}

/**
 * Options for currency formatting
 */
export interface CurrencyFormatOptions {
  /** Locale to use for formatting, defaults to 'en-US' */
  locale?: string;
  /** Minimum number of fraction digits to show, defaults to 2 */
  minimumFractionDigits?: number;
  /** Maximum number of fraction digits to show, defaults to 2 */
  maximumFractionDigits?: number;
  /** Whether to use currency symbols, defaults to true */
  useSymbols?: boolean;
  /** Label to use when value is not available */
  naLabel?: string;
}

/**
 * Default currency formatting options
 */
const DEFAULT_FORMAT_OPTIONS: CurrencyFormatOptions = {
  locale: 'en-US',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useSymbols: true,
  naLabel: 'N/A',
};

/**
 * Formats a number as a currency string based on the currency code or ICurrency object
 * @param amount The amount to format, can be undefined
 * @param currency The currency code string or ICurrency object
 * @param options Optional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | undefined, 
  currency: string | ICurrency,
  options: CurrencyFormatOptions = {}
): string {
  // Merge provided options with defaults
  const formatOptions = { ...DEFAULT_FORMAT_OPTIONS, ...options };
  
  // Handle undefined, null, or NaN values
  if (amount === undefined || amount === null || isNaN(amount)) {
    return formatOptions.naLabel || 'N/A';
  }
  
  // Get currency code from the input
  const currencyCode = typeof currency === 'string' ? currency : currency.code;
  
  // Create the formatter using Intl.NumberFormat
  return new Intl.NumberFormat(formatOptions.locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: formatOptions.minimumFractionDigits,
    maximumFractionDigits: formatOptions.maximumFractionDigits,
    // Only display the currency symbol if useSymbols is true
    currencyDisplay: formatOptions.useSymbols ? 'symbol' : 'code',
  }).format(amount);
}

/**
 * Formats a currency value for plain text display (no HTML/UI)
 * @param amount The amount to format
 * @param currencyCode The currency code
 * @returns Formatted currency string for plain text
 */
export function formatCurrencyForText(
  amount: number | undefined, 
  currencyCode: string
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'N/A';
  }
  
  return `${amount.toFixed(2)} ${currencyCode}`;
} 