import { ICurrency } from '../../domain/currency/currency.interface';
import { ExchangeRate } from '../../domain/currency/exchangeRate.type';

/**
 * Interface for exchange rate API clients
 * This provides a common interface for different exchange rate API providers
 */
export interface IExchangeRateApiClient {
  /**
   * Retrieves the current USD to BRL exchange rate
   * @returns Promise resolving to the numerical exchange rate value
   * @throws Error if the rate cannot be retrieved
   */
  getUsdToBrlRate(): Promise<number>;
  
  /**
   * Retrieves the current exchange rate between two currencies
   * @param fromCurrency The source currency
   * @param toCurrency The target currency
   * @returns Promise resolving to the exchange rate object
   * @throws Error if the rate cannot be retrieved
   */
  getExchangeRate(fromCurrency: ICurrency, toCurrency: ICurrency): Promise<ExchangeRate>;
  
  /**
   * Retrieves all available exchange rates
   * @returns Promise resolving to an array of exchange rates
   * @throws Error if the rates cannot be retrieved
   */
  getAllRates(): Promise<ExchangeRate[]>;
  
  /**
   * Gets the list of supported currency codes from the API
   * @returns Promise resolving to an array of currency codes
   * @throws Error if the supported currencies cannot be retrieved
   */
  getSupportedCurrencies?(): Promise<string[]>;
} 