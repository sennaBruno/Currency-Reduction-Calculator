import { CurrencyPair } from './currencyPair.type';

/**
 * Type representing an exchange rate between two currencies
 */
export type ExchangeRate = {
  /**
   * The currency pair this rate applies to
   */
  currencyPair: CurrencyPair;
  
  /**
   * The conversion rate value
   */
  rate: number;
  
  /**
   * Timestamp when this rate was last updated
   */
  timestamp: Date;

  /**
   * Flag indicating if the data was served from cache
   */
  fromCache?: boolean;

  /**
   * Timestamp of when the API last updated its data
   */
  lastApiUpdateTime?: Date | null;

  /**
   * Timestamp of when the cache was last refreshed
   */
  lastCacheRefreshTime?: Date;

  /**
   * Calculated timestamp when the cache is expected to refresh next
   */
  nextCacheRefreshTime?: Date;

  /**
   * UTC timestamp string from the API for the last update
   */
  time_last_update_utc?: string | null;

  /**
   * UTC timestamp string from the API for the next scheduled update
   */
  time_next_update_utc?: string | null;
}; 