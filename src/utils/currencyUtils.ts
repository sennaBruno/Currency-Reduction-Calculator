import { ICurrency } from '../domain/currency/currency.interface';

/**
 * Default currencies to use when no currencies are available or preferred
 */
export const DEFAULT_CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
};

/**
 * Default source and target currency codes
 */
export const DEFAULT_SOURCE_CURRENCY_CODE = 'USD';
export const DEFAULT_TARGET_CURRENCY_CODE = 'BRL';

/**
 * Gets the best source currency from the available currencies
 * @param availableCurrencies List of available currencies
 * @param preferredCode Preferred currency code
 * @returns The preferred currency if available, otherwise the first available, or a default
 */
export function getSourceCurrency(
  availableCurrencies: ICurrency[],
  preferredCode: string = DEFAULT_SOURCE_CURRENCY_CODE
): ICurrency {
  if (!availableCurrencies || availableCurrencies.length === 0) {
    return DEFAULT_CURRENCIES.USD;
  }
  
  // Try to find the preferred currency
  const preferred = availableCurrencies.find(c => c.code === preferredCode);
  if (preferred) {
    return preferred;
  }
  
  // Fall back to first currency in the list
  return availableCurrencies[0];
}

/**
 * Gets the best target currency from the available currencies
 * @param availableCurrencies List of available currencies
 * @param sourceCurrency The currently selected source currency
 * @param preferredCode Preferred currency code
 * @returns The preferred currency if available, otherwise a suitable target currency
 */
export function getTargetCurrency(
  availableCurrencies: ICurrency[],
  sourceCurrency: ICurrency,
  preferredCode: string = DEFAULT_TARGET_CURRENCY_CODE
): ICurrency {
  if (!availableCurrencies || availableCurrencies.length === 0) {
    return DEFAULT_CURRENCIES.BRL;
  }
  
  // Try to find the preferred currency
  const preferred = availableCurrencies.find(c => c.code === preferredCode);
  if (preferred && preferred.code !== sourceCurrency.code) {
    return preferred;
  }
  
  // Find a currency that is not the source currency
  const alternative = availableCurrencies.find(c => c.code !== sourceCurrency.code);
  if (alternative) {
    return alternative;
  }
  
  // If all else fails, return a default that's different from source
  return sourceCurrency.code === DEFAULT_CURRENCIES.USD.code
    ? DEFAULT_CURRENCIES.BRL
    : DEFAULT_CURRENCIES.USD;
}

/**
 * Creates a set of example calculation steps
 * @param sourceCurrency The source currency
 * @param targetCurrency The target currency
 * @param exchangeRate The exchange rate (optional)
 * @returns An array of calculation steps
 */
export function createExampleCalculationSteps(
  sourceCurrency: ICurrency,
  targetCurrency: ICurrency,
  exchangeRate?: number | null
): Array<{
  description: string;
  type: 'initial' | 'exchange_rate' | 'percentage_reduction' | 'fixed_reduction' | 'addition' | 'custom';
  value: number;
  explanation?: string;
}> {
  // Default exchange rate if none is provided
  const rate = exchangeRate || 5.673;
  
  return [
    {
      description: `Initial value in ${sourceCurrency.code}`,
      type: 'initial',
      value: 3000,
      explanation: `Starting with 2/3 of ${sourceCurrency.code} 4,500`
    },
    {
      description: `Convert to ${targetCurrency.code}`,
      type: 'exchange_rate',
      value: rate,
      explanation: `Using the exchange rate of 1.000 ${sourceCurrency.code} = ${rate} ${targetCurrency.code}`
    },
    {
      description: '- 1% (transfer fee)',
      type: 'percentage_reduction',
      value: 1,
      explanation: 'Transfer fee'
    },
    {
      description: '- 6.4% of remainder (tax)',
      type: 'percentage_reduction',
      value: 6.4,
      explanation: 'Tax on the transferred amount'
    }
  ];
} 