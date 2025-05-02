import { unstable_cache as cache } from 'next/cache';
import { IExchangeRateRepository, CacheConfig } from '../../domain/exchange-rate/exchangeRateRepository.interface';
import { ICurrency } from '../../domain/currency/currency.interface';
import { ExchangeRate } from '../../domain/currency/exchangeRate.type';
import { IExchangeRateApiClient } from '../api/exchangeRateApiClient.interface';
import { ExchangeRateClientFactory, ExchangeRateApiProvider } from '../api/exchangeRateClientFactory';

/**
 * Configuration options for the ExchangeRateRepository
 */
export interface ExchangeRateRepositoryConfig {
  /**
   * Cache duration in seconds
   * Default: 3600 (1 hour)
   */
  cacheTTL?: number;
  
  /**
   * Cache tag for invalidation
   * Default: 'exchange-rate'
   */
  cacheTag?: string;
  
  /**
   * API provider to use
   * Default: 'default' (uses environment variable EXCHANGE_RATE_API_PROVIDER if set)
   */
  apiProvider?: ExchangeRateApiProvider;
}

/**
 * Metadata about the cache status and data freshness
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
 * Implementation of the exchange rate repository using the API client
 * and Next.js caching
 */
export class ExchangeRateRepository implements IExchangeRateRepository {
  private client: IExchangeRateApiClient;
  private cacheDuration: number;
  private cacheTag: string;
  private lastCacheRefreshTime: Date = new Date();
  private lastApiUpdateTime: Date | null = null;
  private fromCache: boolean = false;

  constructor(
    client?: IExchangeRateApiClient,
    config?: ExchangeRateRepositoryConfig
  ) {
    // Use provided client, create using factory, or create default
    if (client) {
      this.client = client;
    } else if (config?.apiProvider) {
      this.client = ExchangeRateClientFactory.createClient(config.apiProvider);
    } else {
      this.client = ExchangeRateClientFactory.createDefaultClient();
    }
    
    // Use provided cache duration or fall back to environment variable, then to default (1 hour)
    this.cacheDuration = config?.cacheTTL || 
      (process.env.EXCHANGE_RATE_CACHE_REVALIDATE_SECONDS ? 
        parseInt(process.env.EXCHANGE_RATE_CACHE_REVALIDATE_SECONDS, 10) : 
        3600);
        
    // Use provided cache tag or default
    this.cacheTag = config?.cacheTag || 'exchange-rate';
    
    console.log(`ExchangeRateRepository initialized with cache TTL: ${this.cacheDuration}s`);
  }

  /**
   * Gets the USD to BRL exchange rate, with caching
   * @returns The USD to BRL exchange rate
   */
  async getUsdToBrlRate(): Promise<number> {
    // Define the cached fetch function
    const getCachedUsdBrlRate = cache(
      async () => {
        try {
          this.fromCache = false;
          console.log('Cache miss - fetching fresh exchange rate data');
          const result = await this.client.getUsdToBrlRate();
          this.lastCacheRefreshTime = new Date();
          return result;
        } catch (error) {
          console.error('Error in cached exchange rate fetch:', error);
          throw error; // Re-throw to be handled by the caller
        }
      },
      ['usd-brl-rate'], // Cache key
      {
        revalidate: this.cacheDuration, // Revalidate based on configured duration
        tags: [this.cacheTag] // Tag for potential invalidation
      }
    );

    // Call and return the cached function
    this.fromCache = true;
    return getCachedUsdBrlRate();
  }
  
  /**
   * Gets the exchange rate between two currencies, with caching
   * @param fromCurrency Source currency
   * @param toCurrency Target currency
   * @returns Exchange rate object
   */
  async getExchangeRate(fromCurrency: ICurrency, toCurrency: ICurrency): Promise<ExchangeRate> {
    // Define the cache key based on the currency pair
    const cacheKey = `${fromCurrency.code}-${toCurrency.code}-rate`;
    
    // Define the cached fetch function
    const getCachedExchangeRate = cache(
      async () => {
        try {
          this.fromCache = false;
          console.log(`Cache miss - fetching fresh exchange rate data for ${fromCurrency.code} to ${toCurrency.code}`);
          const result = await this.client.getExchangeRate(fromCurrency, toCurrency);
          this.lastCacheRefreshTime = new Date();
          if (result.timestamp) {
            this.lastApiUpdateTime = new Date(result.timestamp);
          }
          return result;
        } catch (error) {
          console.error(`Error in cached exchange rate fetch for ${fromCurrency.code} to ${toCurrency.code}:`, error);
          throw error; // Re-throw to be handled by the caller
        }
      },
      [cacheKey], // Cache key
      {
        revalidate: this.cacheDuration, // Revalidate based on configured duration
        tags: [this.cacheTag] // Tag for potential invalidation
      }
    );

    // Call and return the cached function
    this.fromCache = true;
    const result = await getCachedExchangeRate();
    return result;
  }
  
  /**
   * Gets all available exchange rates, with caching
   * @returns Array of exchange rates
   */
  async getAllRates(): Promise<ExchangeRate[]> {
    // Define the cached fetch function
    const getCachedAllRates = cache(
      async () => {
        try {
          this.fromCache = false;
          console.log('Cache miss - fetching all exchange rates');
          const result = await this.client.getAllRates();
          this.lastCacheRefreshTime = new Date();
          // Get the timestamp from the first rate (they should all have the same API update time)
          if (result.length > 0 && result[0].timestamp) {
            this.lastApiUpdateTime = new Date(result[0].timestamp);
          }
          return result;
        } catch (error) {
          console.error('Error in cached all rates fetch:', error);
          throw error; // Re-throw to be handled by the caller
        }
      },
      ['all-exchange-rates'], // Cache key
      {
        revalidate: this.cacheDuration, // Revalidate based on configured duration
        tags: [this.cacheTag] // Tag for potential invalidation
      }
    );

    // Call and return the cached function
    this.fromCache = true;
    return getCachedAllRates();
  }
  
  /**
   * Gets the current cache configuration
   * @returns Cache configuration object
   */
  getCacheConfig(): CacheConfig {
    return {
      revalidateSeconds: this.cacheDuration
    };
  }
  
  /**
   * Gets metadata about the exchange rate data and cache status
   * @returns Exchange rate metadata object
   */
  getExchangeRateMetadata(): ExchangeRateMetadata {
    return {
      lastCacheRefreshTime: this.lastCacheRefreshTime,
      lastApiUpdateTime: this.lastApiUpdateTime,
      nextCacheRefreshTime: new Date(this.lastCacheRefreshTime.getTime() + (this.cacheDuration * 1000)),
      fromCache: this.fromCache
    };
  }
} 