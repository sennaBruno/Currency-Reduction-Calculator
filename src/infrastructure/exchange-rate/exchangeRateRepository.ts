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

// Define local type alias if needed, or use the imported one directly
type ExchangeRateMetadata = ExchangeRateMetadataInterface;

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
  private lastCacheRefreshTime: Date = new Date(0);
  private lastApiUpdateTime: Date | null = null;
  private time_last_update_utc: string | null = null;
  private time_next_update_utc: string | null = null;
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
  }

  /**
   * Retrieves the current USD to BRL exchange rate, utilizing caching.
   * @returns Promise resolving to the numerical exchange rate value
   */
  async getUsdToBrlRate(): Promise<number> {
    const fetchFreshData = async (): Promise<number> => {
      try {
        console.log('Cache miss - fetching fresh USD/BRL exchange rate data');
        this.fromCache = false;

        const usd = this.currencyRegistry.getCurrencyByCode('USD');
        const brl = this.currencyRegistry.getCurrencyByCode('BRL');
        if (!usd || !brl) throw new Error('USD or BRL not found in registry');

        // Ensure URL has proper format with protocol
        const url = `${this.apiBaseUrl}/${this.apiKey}/pair/${usd.code}/${brl.code}`;
        console.log(`Fetching exchange rate from: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw ErrorFactory.createApiError(
              `Exchange rate API error: ${response.status}`,
              new Error(`HTTP ${response.status}: ${response.statusText}`),
              response.status,
              { sourceCurrency: usd.code, targetCurrency: brl.code }
            );
        }
        const data = await response.json() as any;

        if (data.result !== 'success') {
            throw ErrorFactory.createApiError(
              `API error: ${data.result}`,
              null, 400, { apiResponse: data, sourceCurrency: usd.code, targetCurrency: brl.code }
            );
        }

        // Add detailed logging to debug the response
        console.log('Exchange rate API response timestamps:', {
          time_last_update_unix: data.time_last_update_unix,
          time_last_update_utc: data.time_last_update_utc,
          time_next_update_unix: data.time_next_update_unix,
          time_next_update_utc: data.time_next_update_utc
        });

        this.lastCacheRefreshTime = nowUTC();
        this.lastApiUpdateTime = fromUnixTimestamp(data.time_last_update_unix);
        this.time_last_update_utc = data.time_last_update_utc || null;
        this.time_next_update_utc = data.time_next_update_utc || null;

        return data.conversion_rate as number;
      } catch (error) {
        console.error('Error fetching fresh USD/BRL rate within repository:', error);
        throw error; 
      }
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
      try {
        console.log(`Cache miss - fetching fresh exchange rate data for ${fromCurrency.code} to ${toCurrency.code}`);
        this.fromCache = false;
        
        // Ensure URL has proper format with protocol
        const url = `${this.apiBaseUrl}/${this.apiKey}/pair/${fromCurrency.code}/${toCurrency.code}`;
        console.log(`Fetching exchange rate from: ${url}`);
        
        const response = await fetch(url);
         if (!response.ok) {
            throw ErrorFactory.createApiError(
              `Exchange rate API error: ${response.status}`,
              new Error(`HTTP ${response.status}: ${response.statusText}`),
              response.status,
              { sourceCurrency: fromCurrency.code, targetCurrency: toCurrency.code }
            );
        }
        const rawData = await response.json() as any;

        if (rawData.result !== 'success') {
             throw ErrorFactory.createApiError(
              `API error: ${rawData.result}`,
              null, 400, { apiResponse: rawData, sourceCurrency: fromCurrency.code, targetCurrency: toCurrency.code }
            );
        }

        this.lastCacheRefreshTime = nowUTC();
        const apiUpdateTime = fromUnixTimestamp(rawData.time_last_update_unix);
        this.lastApiUpdateTime = apiUpdateTime;
        this.time_last_update_utc = rawData.time_last_update_utc || null;
        this.time_next_update_utc = rawData.time_next_update_utc || null;

        return {
            currencyPair: {
              source: fromCurrency,
              target: toCurrency
            },
            rate: rawData.conversion_rate,
            timestamp: apiUpdateTime
          };

      } catch (error) {
        console.error(`Error fetching fresh ${fromCurrency.code}/${toCurrency.code} rate within repository:`, error);
        throw error;
      }
    };

    const cacheKey = `${this.cacheTag}-${fromCurrency.code}-${toCurrency.code}`;
    return unstable_cache(fetchFreshData, [cacheKey], {
      revalidate: this.cacheDuration,
      tags: [this.cacheTag, cacheKey],
    })().catch(err => {
       console.error('Error during unstable_cache execution for getExchangeRate:', err);
      throw err;
    });
  }

  /**
   * Retrieves all available exchange rates (base USD), utilizing caching.
   * @returns Promise resolving to an array of exchange rates
   */
  async getAllRates(): Promise<ExchangeRate[]> {
     const fetchFreshData = async (): Promise<ExchangeRate[]> => {
      try {
        console.log('Cache miss - fetching fresh exchange rate data for all rates (base USD)');
        this.fromCache = false;

        const baseCode = 'USD';
        
        // Ensure URL has proper format with protocol
        const url = `${this.apiBaseUrl}/${this.apiKey}/latest/${baseCode}`;
        console.log(`Fetching all exchange rates from: ${url}`);
        
        const response = await fetch(url);
         if (!response.ok) {
            throw ErrorFactory.createApiError(
              `Exchange rate API error: ${response.status}`,
              new Error(`HTTP ${response.status}: ${response.statusText}`),
              response.status,
              { baseCurrency: baseCode }
            );
        }
        const data = await response.json() as any;

        if (data.result !== 'success') {
             throw ErrorFactory.createApiError(
              `API error: ${data.result}`,
              null, 400, { apiResponse: data, baseCurrency: baseCode }
            );
        }

        this.lastCacheRefreshTime = nowUTC();
        const apiUpdateTime = fromUnixTimestamp(data.time_last_update_unix);
        this.lastApiUpdateTime = apiUpdateTime;
        this.time_last_update_utc = data.time_last_update_utc || null;
        this.time_next_update_utc = data.time_next_update_utc || null;

        const exchangeRates: ExchangeRate[] = [];
        // Use instance for registry
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
            timestamp: apiUpdateTime
          });
        }
        return exchangeRates;

      } catch (error) {
        console.error('Error fetching fresh all rates within repository:', error);
        throw error;
      }
    };
    
    const cacheKey = `${this.cacheTag}-all-rates-usd`;
    return unstable_cache(fetchFreshData, [cacheKey], {
      revalidate: this.cacheDuration,
      tags: [this.cacheTag, cacheKey],
    })().catch(err => {
      console.error('Error during unstable_cache execution for getAllRates:', err);
      throw err;
    });
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
    return {
      lastCacheRefreshTime: this.lastCacheRefreshTime,
      lastApiUpdateTime: this.lastApiUpdateTime,
      nextCacheRefreshTime: addSecondsToDate(this.lastCacheRefreshTime, this.cacheDuration),
      fromCache: this.fromCache,
      time_last_update_utc: this.time_last_update_utc,
      time_next_update_utc: this.time_next_update_utc
    };
  }
} 