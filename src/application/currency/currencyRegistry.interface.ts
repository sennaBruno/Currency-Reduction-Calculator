import { ICurrency } from '../../domain/currency/currency.interface';

/**
 * Interface for a registry managing supported currencies
 */
export interface ICurrencyRegistry {
  /**
   * Gets all available currencies
   * @returns Array of supported currencies
   */
  getAllCurrencies(): ICurrency[];
  
  /**
   * Gets a currency by its code
   * @param code The currency code to look up
   * @returns The currency object or undefined if not found
   */
  getCurrencyByCode(code: string): ICurrency | undefined;
  
  /**
   * Checks if a currency is supported
   * @param code The currency code to check
   * @returns True if the currency is supported, false otherwise
   */
  isCurrencySupported(code: string): boolean;
} 