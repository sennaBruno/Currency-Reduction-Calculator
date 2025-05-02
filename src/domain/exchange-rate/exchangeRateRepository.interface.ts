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
  /** Timestamp of the last successful data fetch and cache update */
  lastCacheRefreshTime: Date;
  /** Timestamp provided by the API indicating when the data was last updated */
  lastApiUpdateTime: Date | null;
  /** Calculated timestamp when the cache is expected to refresh next */
  nextCacheRefreshTime: Date;
  /** Flag indicating if the last data retrieval was served from cache */
  fromCache: boolean;
  /** UTC timestamp string from the API for the last update */
  time_last_update_utc: string | null;
  /** UTC timestamp string from the API for the next scheduled update */
  time_next_update_utc: string | null;
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