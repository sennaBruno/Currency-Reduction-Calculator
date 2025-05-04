import { ICurrency } from '../../domain/currency/currency.interface';
import { ExchangeRate } from '../../domain/currency/exchangeRate.type';
import type { ExchangeRateMetadata as ExchangeRateMetadataInterface } from '../../domain/exchange-rate/exchangeRateRepository.interface';
import { IExchangeRateRepository, CacheConfig } from '../../domain/exchange-rate/exchangeRateRepository.interface';
import { unstable_cache } from 'next/cache';
import { IExchangeRateApiClient } from '../api/exchangeRateApiClient.interface';
import { ExchangeRateClientFactory, ExchangeRateApiProvider } from '../api/exchangeRateClientFactory';
import { CurrencyRegistry } from '../../application/currency/currencyRegistry.service';
import { ErrorFactory } from '../../utils/errorHandling';
import { fromUnixTimestamp, nowUTC, addSecondsToDate } from '../../utils/dateUtils';

/**
 * API response interfaces to improve type safety
 */
interface BaseExchangeRateApiResponse {
  result: string;
  time_last_update_unix?: number;
  time_last_update_utc?: string;
  time_next_update_unix?: number;
  time_next_update_utc?: string;
}

interface PairExchangeRateApiResponse extends BaseExchangeRateApiResponse {
  conversion_rate: number;
}

interface AllRatesExchangeRateApiResponse extends BaseExchangeRateApiResponse {
  conversion_rates: Record<string, number>;
}

/**
 * Configuration options for the ExchangeRateRepository
 */
interface ExchangeRateRepositoryConfig {
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
 * Implementation of the exchange rate repository using the API client
 * and Next.js caching
 */
export class ExchangeRateRepository implements IExchangeRateRepository {
  private client: IExchangeRateApiClient;
  private cacheDuration: number;
  private cacheTag: string;
  private lastCacheRefreshTime: Date;
  private lastApiUpdateTime: Date | null;
  private time_last_update_utc: string | null;
  private time_next_update_utc: string | null;
  private fromCache: boolean = false;
  private apiKey: string;
  private apiBaseUrl: string;
  private currencyRegistry: CurrencyRegistry; // Instance for registry

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
        
    this.cacheTag = config?.cacheTag || 'exchange-rate';
    
    this.apiKey = process.env.EXCHANGE_RATE_API_KEY || '';
    this.apiBaseUrl = process.env.EXCHANGE_RATE_API_BASE_URL || 'https://v6.exchangerate-api.com/v6';
    this.currencyRegistry = new CurrencyRegistry(); // Instantiate registry

    console.log(`ExchangeRateRepository initialized with cache TTL: ${this.cacheDuration}s`);

    this.lastCacheRefreshTime = nowUTC();
    this.lastApiUpdateTime = null;
    this.time_last_update_utc = null;
    this.time_next_update_utc = null;
  }

  /**
   * Generic method to fetch data from the exchange rate API with error handling
   * @param url API endpoint URL
   * @param errorContext Error context metadata
   * @returns Promise resolving to the API response
   */
  private async fetchExchangeRateApi<T extends BaseExchangeRateApiResponse>(
    url: string, 
    errorContext: Record<string, string>
  ): Promise<T> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw ErrorFactory.createApiError(
          `Exchange rate API error: ${response.status}`,
          new Error(`HTTP ${response.status}: ${response.statusText}`),
          response.status,
          errorContext
        );
      }
      
      const data = await response.json() as T;

      if (data.result !== 'success') {
        throw ErrorFactory.createApiError(
          `API error: ${data.result}`,
          null, 
          400, 
          { apiResponse: data, ...errorContext }
        );
      }

      this.lastCacheRefreshTime = nowUTC();
      
      if (data.time_last_update_unix && typeof data.time_last_update_unix === 'number') {
        this.lastApiUpdateTime = fromUnixTimestamp(data.time_last_update_unix);
      } else {
        this.lastApiUpdateTime = nowUTC();
      }
      
      this.time_last_update_utc = data.time_last_update_utc || null;
      this.time_next_update_utc = data.time_next_update_utc || null;
      
      console.log('API response metadata:', {
        time_last_update_utc: this.time_last_update_utc,
        time_next_update_utc: this.time_next_update_utc,
        data: JSON.stringify({
          result: data.result,
          time_last_update_unix: data.time_last_update_unix,
          time_last_update_utc: data.time_last_update_utc,
          time_next_update_unix: data.time_next_update_unix,
          time_next_update_utc: data.time_next_update_utc
        })
      });
      
      this.fromCache = false;
      
      return data;
    } catch (error) {
      console.error(`Error fetching exchange rate data: ${url}`, error);
      throw error;
    }
  }

  /**
   * Retrieves the current USD to BRL exchange rate, utilizing caching.
   * @returns Promise resolving to the numerical exchange rate value
   */
  async getUsdToBrlRate(): Promise<number> {
    const fetchFreshData = async (): Promise<number> => {
      const usd = this.currencyRegistry.getCurrencyByCode('USD');
      const brl = this.currencyRegistry.getCurrencyByCode('BRL');
      
      if (!usd || !brl) {
        throw new Error('USD or BRL not found in registry');
      }

      const url = `${this.apiBaseUrl}/${this.apiKey}/pair/${usd.code}/${brl.code}`;
      const data = await this.fetchExchangeRateApi<PairExchangeRateApiResponse>(
        url, 
        { sourceCurrency: usd.code, targetCurrency: brl.code }
      );

      return data.conversion_rate;
    };

    return unstable_cache(fetchFreshData, [this.cacheTag, 'usd-brl-rate'], {
      revalidate: this.cacheDuration,
      tags: [this.cacheTag, 'usd-brl-rate'],
    })().catch(err => {
      console.error('Error during unstable_cache execution for getUsdToBrlRate:', err);
      throw err;
    });
  }

  /**
   * Retrieves the exchange rate between two currencies, utilizing caching.
   * @param fromCurrency The source currency
   * @param toCurrency The target currency
   * @returns Promise resolving to the exchange rate object
   */
  async getExchangeRate(fromCurrency: ICurrency, toCurrency: ICurrency): Promise<ExchangeRate> {
    const fetchFreshData = async (): Promise<ExchangeRate> => {
      const url = `${this.apiBaseUrl}/${this.apiKey}/pair/${fromCurrency.code}/${toCurrency.code}`;
      const data = await this.fetchExchangeRateApi<PairExchangeRateApiResponse>(
        url, 
        { sourceCurrency: fromCurrency.code, targetCurrency: toCurrency.code }
      );

      const apiUpdateTime = this.lastApiUpdateTime || nowUTC();
      const safeLastCacheTime = this.lastCacheRefreshTime || nowUTC();
      const nextCacheRefreshTime = addSecondsToDate(safeLastCacheTime, this.cacheDuration);

      return {
        currencyPair: {
          source: fromCurrency,
          target: toCurrency
        },
        rate: data.conversion_rate,
        timestamp: apiUpdateTime,
        fromCache: this.fromCache,
        lastApiUpdateTime: this.lastApiUpdateTime,
        lastCacheRefreshTime: safeLastCacheTime,
        nextCacheRefreshTime: nextCacheRefreshTime,
        time_last_update_utc: this.time_last_update_utc,
        time_next_update_utc: this.time_next_update_utc
      };
    };

    const cacheKey = `${this.cacheTag}-${fromCurrency.code}-${toCurrency.code}`;
    const result = await unstable_cache(fetchFreshData, [cacheKey], {
      revalidate: this.cacheDuration,
      tags: [this.cacheTag, cacheKey],
    })();
    
    if (this.lastCacheRefreshTime && result.timestamp) {
      if (this.lastCacheRefreshTime.getTime() > result.timestamp.getTime()) {
        result.fromCache = true;
      }
    }
    
    return result;
  }

  /**
   * Retrieves all available exchange rates (base USD), utilizing caching.
   * @returns Promise resolving to an array of exchange rates
   */
  async getAllRates(): Promise<ExchangeRate[]> {
    const fetchFreshData = async (): Promise<ExchangeRate[]> => {
      const baseCode = 'USD';
      const url = `${this.apiBaseUrl}/${this.apiKey}/latest/${baseCode}`;
      
      const data = await this.fetchExchangeRateApi<AllRatesExchangeRateApiResponse>(
        url, 
        { baseCurrency: baseCode }
      );

      const apiUpdateTime = this.lastApiUpdateTime || nowUTC();
      const safeLastCacheTime = this.lastCacheRefreshTime || nowUTC();
      const nextCacheRefreshTime = addSecondsToDate(safeLastCacheTime, this.cacheDuration);
      
      const exchangeRates: ExchangeRate[] = [];
      const availableCurrencies = this.currencyRegistry.getAllCurrencies();
      const baseCurrencyObj = this.currencyRegistry.getCurrencyByCode(baseCode);

      if (!baseCurrencyObj) {
        throw new Error(`Base currency ${baseCode} not found in registry`);
      }

      for (const targetCode of Object.keys(data.conversion_rates)) {
        if (baseCode === targetCode) continue;
        
        const targetCurrency = availableCurrencies.find((c: ICurrency) => c.code === targetCode);
        if (!targetCurrency) continue;

        exchangeRates.push({
          currencyPair: {
            source: baseCurrencyObj,
            target: targetCurrency
          },
          rate: data.conversion_rates[targetCode],
          timestamp: apiUpdateTime,
          fromCache: this.fromCache,
          lastApiUpdateTime: this.lastApiUpdateTime,
          lastCacheRefreshTime: safeLastCacheTime,
          nextCacheRefreshTime: nextCacheRefreshTime,
          time_last_update_utc: this.time_last_update_utc,
          time_next_update_utc: this.time_next_update_utc
        });
      }
      
      return exchangeRates;
    };
    
    const cacheKey = `${this.cacheTag}-all-rates-usd`;
    const results = await unstable_cache(fetchFreshData, [cacheKey], {
      revalidate: this.cacheDuration,
      tags: [this.cacheTag, cacheKey],
    })();
    
    // Update fromCache flag for cached results
    if (this.lastCacheRefreshTime) {
      for (const rate of results) {
        if (rate.timestamp && this.lastCacheRefreshTime.getTime() > rate.timestamp.getTime()) {
          rate.fromCache = true;
        }
      }
    }
    
    return results;
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
  getExchangeRateMetadata(): ExchangeRateMetadataInterface {
    const safeLastCacheTime = this.lastCacheRefreshTime || nowUTC();
    
    // Calculate nextCacheRefreshTime based on lastCacheRefreshTime and cacheDuration
    const nextCacheRefreshTime = addSecondsToDate(safeLastCacheTime, this.cacheDuration);
    
    // Use the actual values from the API without creating fake ones
    return {
      lastCacheRefreshTime: safeLastCacheTime,
      lastApiUpdateTime: this.lastApiUpdateTime,
      nextCacheRefreshTime: nextCacheRefreshTime,
      fromCache: this.fromCache,
      time_last_update_utc: this.time_last_update_utc,
      time_next_update_utc: this.time_next_update_utc
    };
  }
} 