import { ICurrency } from '../../domain/currency/currency.interface';
import { ExchangeRate } from '../../domain/currency/exchangeRate.type';
import { ExchangeRateMetadata } from '../../domain/exchange-rate/exchangeRateRepository.interface';

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
  
  /**
   * Gets metadata about the exchange rate data freshness
   * @returns Exchange rate metadata including API update timestamps
   */
  getExchangeRateMetadata(): Promise<ExchangeRateMetadata>;
} 