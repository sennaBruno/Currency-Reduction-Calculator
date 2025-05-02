import { ICurrency } from '../currency/currency.interface';

/**
 * Interface defining the operations for currency conversion
 */
export interface ICurrencyConverterService {
  /**
   * Converts an amount from USD to BRL using the current exchange rate
   * @param amount The amount in USD to convert
   * @returns Promise resolving to the converted amount in BRL
   * @throws Error if the conversion cannot be performed
   */
  convertUsdToBrl(amount: number): Promise<number>;
  
  /**
   * Converts an amount from one currency to another using the current exchange rate
   * @param amount The amount to convert
   * @param fromCurrency The source currency
   * @param toCurrency The target currency
   * @returns Promise resolving to the converted amount
   * @throws Error if the conversion cannot be performed
   */
  convert(amount: number, fromCurrency: ICurrency, toCurrency: ICurrency): Promise<number>;
} 