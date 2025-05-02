import ky from 'ky';
import { ICurrency } from '../../domain/currency/currency.interface';
import { ExchangeRate } from '../../domain/currency/exchangeRate.type';
import { IExchangeRateApiClient } from '../api/exchangeRateApiClient.interface';
import { ErrorFactory } from '../../utils/errorHandling';
import { CurrencyRegistry } from '../../application/currency/currencyRegistry.service';
import { ThrottledApiClient, withRetry } from '../../utils/api-helpers';

/**
 * Type definition for the exchange rate API response
 */
interface ExchangeRateApiResponse {
  rates: {
    [key: string]: number;
  };
  base: string;
  time_last_update_unix: number;
  time_next_update_unix: number;
}

/**
 * Client for interacting with the external exchange rate API (open.er-api.com)
 */
export class ExternalExchangeRateClient implements IExchangeRateApiClient {
  private readonly apiBaseUrl: string;
  private readonly currencyRegistry: CurrencyRegistry;
  private readonly throttledClient: ThrottledApiClient;

  constructor(apiBaseUrl?: string) {
    // Use provided URL or fall back to environment variable, then to default URL
    this.apiBaseUrl = apiBaseUrl || 
      process.env.EXTERNAL_EXCHANGE_RATE_API_URL || 
      'https://open.er-api.com/v6/latest';
    
    this.currencyRegistry = new CurrencyRegistry();
    
    // Initialize the throttled API client with configurable rate limit
    const requestsPerSecond = process.env.EXTERNAL_EXCHANGE_RATE_API_RATE_LIMIT 
      ? parseFloat(process.env.EXTERNAL_EXCHANGE_RATE_API_RATE_LIMIT) 
      : 1; // Lower default rate limit for the external API
    this.throttledClient = new ThrottledApiClient(requestsPerSecond);
  }

  /**
   * Retrieves the current USD to BRL exchange rate
   * @returns Promise resolving to the numerical exchange rate value
   * @throws Error if the rate cannot be retrieved
   */
  async getUsdToBrlRate(): Promise<number> {
    return withRetry(async () => {
      return await this.throttledClient.request(async () => {
        try {
          console.log('Fetching fresh USD to BRL exchange rate...');
          
          // Use ky to fetch exchange rate data
          const response = await ky.get(`${this.apiBaseUrl}/USD`, {
            timeout: 10000, // 10 second timeout
            retry: {
              limit: 2,
              methods: ['GET'],
              statusCodes: [408, 413, 429, 500, 502, 503, 504]
            }
          }).json<ExchangeRateApiResponse>();
          
          // Validate response structure
          if (!response.rates || typeof response.rates.BRL !== 'number') {
            throw ErrorFactory.createApiError(
              'Invalid response format: BRL rate not found',
              null,
              500,
              { apiResponse: response }
            );
          }
          
          console.log('Successfully fetched USD/BRL rate:', response.rates.BRL);
          return response.rates.BRL;
        } catch (error) {
          // Enhanced error handling with more context
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error fetching exchange rate:', errorMessage);
          
          throw ErrorFactory.createApiError(
            `Failed to fetch USD to BRL exchange rate`,
            error,
            500,
            { api: 'open.er-api.com' }
          );
        }
      });
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
      return await this.throttledClient.request(async () => {
        try {
          // Validate input currencies
          if (!fromCurrency?.code || !toCurrency?.code) {
            throw ErrorFactory.createValidationError(
              'Invalid currency objects provided',
              { fromCurrency, toCurrency }
            );
          }
          
          console.log(`Fetching exchange rate from ${fromCurrency.code} to ${toCurrency.code}`);
          
          // Use ky to fetch exchange rate data
          const response = await ky.get(`${this.apiBaseUrl}/${fromCurrency.code}`, {
            timeout: 10000, // 10 second timeout
            retry: {
              limit: 2,
              methods: ['GET'],
              statusCodes: [408, 413, 429, 500, 502, 503, 504]
            }
          }).json<ExchangeRateApiResponse>();
          
          // Validate response structure
          if (!response.rates || typeof response.rates[toCurrency.code] !== 'number') {
            throw ErrorFactory.createApiError(
              `Invalid response format: ${toCurrency.code} rate not found`,
              null,
              500,
              { 
                apiResponse: response, 
                sourceCurrency: fromCurrency.code, 
                targetCurrency: toCurrency.code 
              }
            );
          }
          
          const rate = response.rates[toCurrency.code];
          console.log(`Successfully fetched ${fromCurrency.code}/${toCurrency.code} rate:`, rate);
          
          return {
            currencyPair: {
              source: fromCurrency,
              target: toCurrency
            },
            rate,
            timestamp: new Date(response.time_last_update_unix * 1000)
          };
        } catch (error) {
          throw ErrorFactory.createApiError(
            `Failed to fetch exchange rate from ${fromCurrency.code} to ${toCurrency.code}`,
            error,
            500,
            { 
              api: 'open.er-api.com',
              sourceCurrency: fromCurrency.code,
              targetCurrency: toCurrency.code
            }
          );
        }
      });
    });
  }
  
  /**
   * Retrieves all available exchange rates for a base currency
   * @returns Promise resolving to an array of exchange rates
   * @throws Error if the rates cannot be retrieved
   */
  async getAllRates(): Promise<ExchangeRate[]> {
    return withRetry(async () => {
      return await this.throttledClient.request(async () => {
        try {
          const baseCurrency = this.currencyRegistry.getCurrencyByCode('USD');
          if (!baseCurrency) {
            throw ErrorFactory.createValidationError('Base currency USD not found in registry');
          }
          
          console.log('Fetching all exchange rates...');
          
          // Use ky to fetch exchange rate data
          const response = await ky.get(`${this.apiBaseUrl}/${baseCurrency.code}`, {
            timeout: 10000, // 10 second timeout
            retry: {
              limit: 2,
              methods: ['GET'],
              statusCodes: [408, 413, 429, 500, 502, 503, 504]
            }
          }).json<ExchangeRateApiResponse>();
          
          // Validate response structure
          if (!response.rates) {
            throw ErrorFactory.createApiError(
              'Invalid response format: rates not found',
              null,
              500,
              { apiResponse: response }
            );
          }
          
          const exchangeRates: ExchangeRate[] = [];
          const timestamp = new Date(response.time_last_update_unix * 1000);
          const availableCurrencies = this.currencyRegistry.getAllCurrencies();
          
          // Create exchange rate objects for each currency pair
          for (const currencyCode of Object.keys(response.rates)) {
            if (currencyCode === baseCurrency.code) continue; // Skip self-conversion
            
            // Get the target currency from registry
            const targetCurrency = availableCurrencies.find(c => c.code === currencyCode);
            if (!targetCurrency) continue; // Skip if not in our supported currencies
            
            exchangeRates.push({
              currencyPair: {
                source: baseCurrency,
                target: targetCurrency
              },
              rate: response.rates[currencyCode],
              timestamp
            });
          }
          
          console.log(`Successfully fetched ${exchangeRates.length} exchange rates`);
          return exchangeRates;
        } catch (error) {
          throw ErrorFactory.createApiError(
            'Failed to fetch all exchange rates',
            error,
            500,
            { api: 'open.er-api.com' }
          );
        }
      });
    });
  }
  
  /**
   * Gets the list of supported currency codes from the API
   * @returns Promise resolving to an array of currency codes
   * @throws Error if the supported currencies cannot be retrieved
   */
  async getSupportedCurrencies(): Promise<string[]> {
    return withRetry(async () => {
      return await this.throttledClient.request(async () => {
        try {
          console.log('Fetching supported currencies...');
          
          // Use ky to fetch exchange rate data for USD (to get all available currencies)
          const response = await ky.get(`${this.apiBaseUrl}/USD`, {
            timeout: 10000, // 10 second timeout
            retry: {
              limit: 2,
              methods: ['GET'],
              statusCodes: [408, 413, 429, 500, 502, 503, 504]
            }
          }).json<ExchangeRateApiResponse>();
          
          // Validate response structure
          if (!response.rates) {
            throw ErrorFactory.createApiError(
              'Invalid response format: rates not found',
              null,
              500,
              { apiResponse: response }
            );
          }
          
          // Get the list of currency codes
          const currencyCodes = Object.keys(response.rates);
          console.log(`Successfully fetched ${currencyCodes.length} supported currencies`);
          
          return currencyCodes;
        } catch (error) {
          throw ErrorFactory.createApiError(
            'Failed to fetch supported currencies',
            error,
            500,
            { api: 'open.er-api.com' }
          );
        }
      });
    });
  }
} 