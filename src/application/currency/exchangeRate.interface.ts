import { ICurrency } from '../../domain/currency/currency.interface';
import { ExchangeRate } from '../../domain/currency/exchangeRate.type';

/**
 * Interface for a service managing exchange rates
 */
export interface IExchangeRateService {
  /**
   * Gets the exchange rate between two currencies
   * @param fromCurrency The source currency
   * @param toCurrency The target currency
   * @returns Promise resolving to the exchange rate
   */
  getExchangeRate(fromCurrency: ICurrency, toCurrency: ICurrency): Promise<ExchangeRate>;
  
  /**
   * Gets all available exchange rates
   * @returns Promise resolving to an array of exchange rates
   */
  getAllRates(): Promise<ExchangeRate[]>;
  
  /**
   * Updates the local cache of exchange rates
   * @returns Promise resolving when rates are updated
   */
  updateRates(): Promise<void>;
} 