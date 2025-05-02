import { ICurrency } from '../../domain/currency/currency.interface';
import { ExchangeRate } from '../../domain/currency/exchangeRate.type';
import { IExchangeRateRepository, CacheConfig, ExchangeRateMetadata } from '../../domain/exchange-rate/exchangeRateRepository.interface';
import { CurrencyRegistry } from '../../application/currency/currencyRegistry.service';
import { ErrorFactory, logError } from '../../utils/errorHandling';
import { IExchangeRateApiClient } from './exchangeRateApiClient.interface';
import { ThrottledApiClient, withRetry } from '../../utils/api-helpers';

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
  
  constructor() {
    // Use environment variable or fallback to default key (for development only)
    this.API_KEY = process.env.EXCHANGE_RATE_API_KEY || '';
    this.API_BASE_URL = process.env.EXCHANGE_RATE_API_URL || '';
    this.currencyRegistry = new CurrencyRegistry();
    
    // Initialize the throttled API client with configurable rate limit
    const requestsPerSecond = process.env.EXCHANGE_RATE_API_RATE_LIMIT 
      ? parseFloat(process.env.EXCHANGE_RATE_API_RATE_LIMIT) 
      : 2;
    this.throttledClient = new ThrottledApiClient(requestsPerSecond);
    
    // Log warning if using default key
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
        // Log detailed error with context
        logError(error, { 
          method: 'getUsdToBrlRate',
          service: 'ExchangeRateApiClient'
        });
        
        // Rethrow as a standardized application error
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
        // Validate input currencies
        if (!fromCurrency?.code || !toCurrency?.code) {
          throw ErrorFactory.createValidationError(
            'Invalid currency objects provided',
            { fromCurrency, toCurrency }
          );
        }
        
        // Use the throttled client for rate limited API calls
        return await this.throttledClient.request(async () => {
          // Use the pair endpoint for more efficient API calls
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
          
          return {
            currencyPair: {
              source: fromCurrency,
              target: toCurrency
            },
            rate: data.conversion_rate,
            timestamp: apiUpdateTime
          };
        });
      } catch (error) {
        // Log detailed error with context
        logError(error, { 
          method: 'getExchangeRate',
          service: 'ExchangeRateApiClient',
          fromCurrency: fromCurrency.code,
          toCurrency: toCurrency.code
        });
        
        // Rethrow as a standardized application error
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
        // Use USD as default base currency if none is provided
        const baseCode = baseCurrency?.code || 'USD';
        
        // Make a single API call to get all rates for the base currency
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
        
        // Get all currencies from the registry
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
        
        // Create exchange rate objects for each currency pair
        for (const targetCode of Object.keys(data.conversion_rates)) {
          // Skip self-conversion
          if (baseCode === targetCode) continue;
          
          // Get the target currency from the registry
          const targetCurrency = availableCurrencies.find(c => c.code === targetCode);
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
        // Log the overall error
        logError(error, { 
          method: 'getAllRates', 
          service: 'ExchangeRateApiClient',
          baseCurrency: baseCurrency?.code || 'USD'
        });
        
        // Rethrow as a standardized application error
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
      // Just return the codes from the currencies in the registry
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
    // Return a standard cache configuration
    return {
      revalidateSeconds: 3600 // 1 hour default
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
      nextCacheRefreshTime: new Date(this.lastCacheRefreshTime.getTime() + (3600 * 1000)), // 1 hour from now
      fromCache: false // Always false for direct API client
    };
  }
} 