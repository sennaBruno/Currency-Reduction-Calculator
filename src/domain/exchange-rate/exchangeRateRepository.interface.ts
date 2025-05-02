import { ICurrency } from '../currency/currency.interface';
import { ExchangeRate } from '../currency/exchangeRate.type';

/**
 * Cache configuration interface for exchange rates
 */
export interface CacheConfig {
  revalidateSeconds: number;
}

/**
 * Metadata about the exchange rate data and cache status
 */
export interface ExchangeRateMetadata {
  /**
   * When our cache was last refreshed
   */
  lastCacheRefreshTime: Date;
  
  /**
   * When the API provider last updated their data
   * This comes directly from the API response
   */
  lastApiUpdateTime: Date | null;
  
  /**
   * When the cache will be refreshed next
   */
  nextCacheRefreshTime: Date;
  
  /**
   * Whether the current data is from cache or freshly fetched
   */
  fromCache: boolean;
}

/**
 * Interface defining the operations for exchange rate data retrieval
 */
export interface IExchangeRateRepository {
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
   * Gets the cache configuration for exchange rates
   * @returns The cache configuration object
   */
  getCacheConfig(): CacheConfig;
  
  /**
   * Gets metadata about the exchange rate data and cache status
   * @returns Exchange rate metadata object
   */
  getExchangeRateMetadata(): ExchangeRateMetadata;
} 