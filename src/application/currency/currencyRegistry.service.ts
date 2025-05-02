import { ICurrency } from '../../domain/currency/currency.interface';
import { ICurrencyRegistry } from './currencyRegistry.interface';

/**
 * Service that manages supported currencies
 */
export class CurrencyRegistry implements ICurrencyRegistry {
  private currencies: ICurrency[] = [
    {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar'
    },
    {
      code: 'EUR',
      symbol: '€',
      name: 'Euro'
    },
    {
      code: 'BRL',
      symbol: 'R$',
      name: 'Brazilian Real'
    },
    {
      code: 'GBP',
      symbol: '£',
      name: 'British Pound'
    },
    {
      code: 'JPY',
      symbol: '¥',
      name: 'Japanese Yen'
    },
  ];

  /**
   * Gets all available currencies
   * @returns Array of supported currencies
   */
  getAllCurrencies(): ICurrency[] {
    return [...this.currencies];
  }
  
  /**
   * Gets a currency by its code
   * @param code The currency code to look up
   * @returns The currency object or undefined if not found
   */
  getCurrencyByCode(code: string): ICurrency | undefined {
    return this.currencies.find(currency => currency.code === code);
  }
  
  /**
   * Checks if a currency is supported
   * @param code The currency code to check
   * @returns True if the currency is supported, false otherwise
   */
  isCurrencySupported(code: string): boolean {
    return this.currencies.some(currency => currency.code === code);
  }
} 