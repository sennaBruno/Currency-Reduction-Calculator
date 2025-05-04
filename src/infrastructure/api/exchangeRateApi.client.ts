import { ICurrency } from '../../domain/currency/currency.interface';
import { ExchangeRate } from '../../domain/currency/exchangeRate.type';
import { IExchangeRateRepository, CacheConfig } from '../../domain/exchange-rate/exchangeRateRepository.interface';
import { CurrencyRegistry } from '../../application/currency/currencyRegistry.service';
import { ErrorFactory, logError } from '../../utils/errorHandling';
import { IExchangeRateApiClient } from './exchangeRateApiClient.interface';
import { ThrottledApiClient, withRetry } from '../../utils/api-helpers';
import { addSecondsToDate } from '../../utils/dateUtils';

interface ExchangeRateApiResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

interface ExchangePairResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  target_code: string;
  conversion_rate: number;
}

/**
 * API client for fetching exchange rates from exchangerate-api.com
 */
export class ExchangeRateApiClient implements IExchangeRateApiClient, IExchangeRateRepository {
  private readonly API_KEY: string;
  private readonly API_BASE_URL: string;
  private readonly currencyRegistry: CurrencyRegistry;
  private readonly throttledClient: ThrottledApiClient;
  private lastCacheRefreshTime: Date = new Date();
  private lastApiUpdateTime: Date | null = null;
  private time_last_update_utc: string | null = null;
  private time_next_update_utc: string | null = null;
  private readonly CACHE_TTL_SECONDS: number = 3600; // 1 hour default
  
  constructor() {
    this.API_KEY = process.env.EXCHANGE_RATE_API_KEY || '';
    this.API_BASE_URL = process.env.EXCHANGE_RATE_API_URL || '';
    this.currencyRegistry = new CurrencyRegistry();
    
    const requestsPerSecond = process.env.EXCHANGE_RATE_API_RATE_LIMIT 
      ? parseFloat(process.env.EXCHANGE_RATE_API_RATE_LIMIT) 
      : 2;
    this.throttledClient = new ThrottledApiClient(requestsPerSecond);

    this.CACHE_TTL_SECONDS = process.env.EXCHANGE_RATE_CACHE_TTL 
      ? parseInt(process.env.EXCHANGE_RATE_CACHE_TTL, 10) 
      : 3600;
    
    if (!process.env.EXCHANGE_RATE_API_KEY) {
      console.warn('Warning: Using default Exchange Rate API key. Set EXCHANGE_RATE_API_KEY environment variable for production.');
    }
  }
  
  /**
   * Retrieves the current USD to BRL exchange rate
   * @returns Promise resolving to the numerical exchange rate value
   * @throws Error if the rate cannot be retrieved
   */
  async getUsdToBrlRate(): Promise<number> {
    return withRetry(async () => {
      try {
        const usdCurrency = this.currencyRegistry.getCurrencyByCode('USD');
        const brlCurrency = this.currencyRegistry.getCurrencyByCode('BRL');
        
        if (!usdCurrency || !brlCurrency) {
          throw ErrorFactory.createNotFoundError(
            'USD or BRL currency not found in registry',
            { methodName: 'getUsdToBrlRate' }
          );
        }
        
        const rate = await this.getExchangeRate(usdCurrency, brlCurrency);
        return rate.rate;
      } catch (error) {
        logError(error, { 
          method: 'getUsdToBrlRate',
          service: 'ExchangeRateApiClient'
        });
        
        if (error instanceof Error) {
          throw ErrorFactory.createConversionError(
            'Failed to retrieve USD to BRL exchange rate',
            error,
            { methodName: 'getUsdToBrlRate' }
          );
        } else {
          throw ErrorFactory.createConversionError(
            'Failed to retrieve USD to BRL exchange rate: Unknown error',
            error,
            { methodName: 'getUsdToBrlRate' }
          );
        }
      }
    });
  }

  /**
   * Retrieves the current exchange rate between two currencies
   * @param fromCurrency The source currency
   * @param toCurrency The target currency
   * @returns Promise resolving to the exchange rate object
   * @throws Error if the rate cannot be retrieved
   */
  async getExchangeRate(fromCurrency: ICurrency, toCurrency: ICurrency): Promise<ExchangeRate> {
    return withRetry(async () => {
      try {
        if (!fromCurrency?.code || !toCurrency?.code) {
          throw ErrorFactory.createValidationError(
            'Invalid currency objects provided',
            { fromCurrency, toCurrency }
          );
        }
        
        return await this.throttledClient.request(async () => {
          const response = await fetch(
            `${this.API_BASE_URL}/${this.API_KEY}/pair/${fromCurrency.code}/${toCurrency.code}`
          );
          
          if (!response.ok) {
            throw ErrorFactory.createApiError(
              `Exchange rate API error: ${response.status}`,
              new Error(`HTTP ${response.status}: ${response.statusText}`),
              response.status,
              { 
                sourceCurrency: fromCurrency.code, 
                targetCurrency: toCurrency.code 
              }
            );
          }
          
          const data = await response.json() as ExchangePairResponse;
          
          if (data.result !== 'success') {
            throw ErrorFactory.createApiError(
              `API error: ${data.result}`,
              null,
              400,
              { 
                apiResponse: data,
                sourceCurrency: fromCurrency.code, 
                targetCurrency: toCurrency.code 
              }
            );
          }
          
          this.lastCacheRefreshTime = new Date();
          const apiUpdateTime = new Date(data.time_last_update_unix * 1000);
          this.lastApiUpdateTime = apiUpdateTime;
          this.time_last_update_utc = data.time_last_update_utc || null;
          this.time_next_update_utc = data.time_next_update_utc || null;
          const nextCacheRefreshTime = addSecondsToDate(this.lastCacheRefreshTime, this.CACHE_TTL_SECONDS);
          
          return {
            currencyPair: {
              source: fromCurrency,
              target: toCurrency
            },
            rate: data.conversion_rate,
            timestamp: apiUpdateTime,
            fromCache: false,
            lastApiUpdateTime: this.lastApiUpdateTime,
            lastCacheRefreshTime: this.lastCacheRefreshTime,
            nextCacheRefreshTime: nextCacheRefreshTime,
            time_last_update_utc: this.time_last_update_utc,
            time_next_update_utc: this.time_next_update_utc
          };
        });
      } catch (error) {
        logError(error, { 
          method: 'getExchangeRate',
          service: 'ExchangeRateApiClient',
          fromCurrency: fromCurrency.code,
          toCurrency: toCurrency.code
        });
        
        throw ErrorFactory.createConversionError(
          `Failed to retrieve ${fromCurrency.code} to ${toCurrency.code} exchange rate`,
          error,
          { 
            methodName: 'getExchangeRate',
            sourceCurrency: fromCurrency.code,
            targetCurrency: toCurrency.code
          }
        );
      }
    });
  }

  /**
   * Retrieves all available exchange rates
   * @param baseCurrency The base currency for rates. If not provided, USD will be used.
   * @returns Promise resolving to an array of exchange rates
   * @throws Error if the rates cannot be retrieved
   */
  async getAllRates(baseCurrency?: ICurrency): Promise<ExchangeRate[]> {
    return withRetry(async () => {
      try {
        const baseCode = baseCurrency?.code || 'USD';
        
        const response = await fetch(`${this.API_BASE_URL}/${this.API_KEY}/latest/${baseCode}`);
        
        if (!response.ok) {
          throw ErrorFactory.createApiError(
            `Exchange rate API error: ${response.status}`,
            new Error(`HTTP ${response.status}: ${response.statusText}`),
            response.status,
            { baseCurrency: baseCode }
          );
        }
        
        const data = await response.json() as ExchangeRateApiResponse;
        
        if (data.result !== 'success') {
          throw ErrorFactory.createApiError(
            `API error: ${data.result}`,
            null,
            400,
            { apiResponse: data, baseCurrency: baseCode }
          );
        }
        
        const exchangeRates: ExchangeRate[] = [];
        this.lastCacheRefreshTime = new Date();
        const apiUpdateTime = new Date(data.time_last_update_unix * 1000);
        this.lastApiUpdateTime = apiUpdateTime;
        this.time_last_update_utc = data.time_last_update_utc || null;
        this.time_next_update_utc = data.time_next_update_utc || null;
        const nextCacheRefreshTime = addSecondsToDate(this.lastCacheRefreshTime, this.CACHE_TTL_SECONDS);
        
        const availableCurrencies = this.currencyRegistry.getAllCurrencies();
        const baseCurrencyObj = baseCurrency || this.currencyRegistry.getCurrencyByCode(baseCode);
        
        if (!baseCurrencyObj) {
          throw ErrorFactory.createApiError(
            `Base currency ${baseCode} not found in registry`,
            null,
            400,
            { baseCurrency: baseCode }
          );
        }
        
        for (const targetCode of Object.keys(data.conversion_rates)) {
          if (baseCode === targetCode) continue;
          
          const targetCurrency = availableCurrencies.find(c => c.code === targetCode);
          if (!targetCurrency) continue;
          
          exchangeRates.push({
            currencyPair: {
              source: baseCurrencyObj,
              target: targetCurrency
            },
            rate: data.conversion_rates[targetCode],
            timestamp: apiUpdateTime,
            fromCache: false,
            lastApiUpdateTime: this.lastApiUpdateTime,
            lastCacheRefreshTime: this.lastCacheRefreshTime,
            nextCacheRefreshTime: nextCacheRefreshTime,
            time_last_update_utc: this.time_last_update_utc,
            time_next_update_utc: this.time_next_update_utc
          });
        }
        
        return exchangeRates;
      } catch (error) {
        logError(error, { 
          method: 'getAllRates', 
          service: 'ExchangeRateApiClient',
          baseCurrency: baseCurrency?.code || 'USD'
        });
        
        throw ErrorFactory.createApiError(
          'Failed to retrieve exchange rates',
          error,
          undefined,
          { baseCurrency: baseCurrency?.code || 'USD' }
        );
      }
    });
  }
  
  /**
   * Gets supported currency codes
   * @returns Promise resolving to array of currency codes
   */
  async getSupportedCurrencies(): Promise<string[]> {
    try {
      const currencies = this.currencyRegistry.getAllCurrencies();
      return currencies.map(c => c.code);
    } catch (error) {
      logError(error, { 
        method: 'getSupportedCurrencies', 
        service: 'ExchangeRateApiClient' 
      });
      
      throw ErrorFactory.createApiError(
        'Failed to get supported currencies',
        error
      );
    }
  }

  /**
   * Gets the current cache configuration
   * @returns Cache configuration object
   */
  getCacheConfig(): CacheConfig {
    return {
      revalidateSeconds: this.CACHE_TTL_SECONDS
    };
  }
} 