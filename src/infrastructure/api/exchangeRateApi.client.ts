import { ICurrency } from '../../domain/currency/currency.interface';
import { ExchangeRate } from '../../domain/currency/exchangeRate.type';
import { IExchangeRateRepository } from '../../domain/exchange-rate/exchangeRateRepository.interface';
import { CurrencyRegistry } from '../../application/currency/currencyRegistry.service';
import { ErrorFactory, logError } from '../../utils/errorHandling';

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
 * API client for fetching exchange rates from an external service
 */
export class ExchangeRateApiClient implements IExchangeRateRepository {
  private readonly API_KEY: string;
  private readonly API_BASE_URL: string;
  private readonly currencyRegistry: CurrencyRegistry;
  
  constructor() {
    // Use environment variable or fallback to default key (for development only)
    this.API_KEY = process.env.EXCHANGE_RATE_API_KEY || '';
    this.API_BASE_URL = process.env.EXCHANGE_RATE_API_URL || '';
    this.currencyRegistry = new CurrencyRegistry();
    
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
  }

  /**
   * Retrieves the current exchange rate between two currencies
   * @param fromCurrency The source currency
   * @param toCurrency The target currency
   * @returns Promise resolving to the exchange rate object
   * @throws Error if the rate cannot be retrieved
   */
  async getExchangeRate(fromCurrency: ICurrency, toCurrency: ICurrency): Promise<ExchangeRate> {
    try {
      // Validate input currencies
      if (!fromCurrency?.code || !toCurrency?.code) {
        throw ErrorFactory.createValidationError(
          'Invalid currency objects provided',
          { fromCurrency, toCurrency }
        );
      }
      
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
      
      return {
        currencyPair: {
          source: fromCurrency,
          target: toCurrency
        },
        rate: data.conversion_rate,
        timestamp: new Date(data.time_last_update_unix * 1000)
      };
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
  }

  /**
   * Retrieves all available exchange rates
   * @returns Promise resolving to an array of exchange rates
   * @throws Error if the rates cannot be retrieved
   */
  async getAllRates(): Promise<ExchangeRate[]> {
    try {
      // Get all supported currencies from the registry
      const currencies = this.currencyRegistry.getAllCurrencies();
      const exchangeRates: ExchangeRate[] = [];
      
      // Only fetch rates for major currencies to avoid too many API calls
      const majorCurrencyCodes = ['USD', 'EUR', 'GBP', 'JPY', 'BRL'];
      const majorCurrencies = currencies.filter(c => majorCurrencyCodes.includes(c.code));
      
      // Track errors without immediately failing
      const errors: Error[] = [];
      
      // Fetch rates for each base currency
      for (const baseCurrency of majorCurrencies) {
        try {
          const response = await fetch(`${this.API_BASE_URL}/${this.API_KEY}/latest/${baseCurrency.code}`);
          
          if (!response.ok) {
            throw ErrorFactory.createApiError(
              `Exchange rate API error: ${response.status}`,
              new Error(`HTTP ${response.status}: ${response.statusText}`),
              response.status,
              { baseCurrency: baseCurrency.code }
            );
          }
          
          const data = await response.json() as ExchangeRateApiResponse;
          
          if (data.result !== 'success') {
            throw ErrorFactory.createApiError(
              `API error: ${data.result}`,
              null,
              400,
              { apiResponse: data, baseCurrency: baseCurrency.code }
            );
          }
          
          const timestamp = new Date(data.time_last_update_unix * 1000);
          
          // Create exchange rate objects for each currency pair
          for (const targetCode of Object.keys(data.conversion_rates)) {
            // Skip if target is not in our supported list
            if (!majorCurrencyCodes.includes(targetCode)) continue;
            
            // Skip self-conversion
            if (baseCurrency.code === targetCode) continue;
            
            // Get the target currency from the registry
            const targetCurrency = this.currencyRegistry.getCurrencyByCode(targetCode);
            if (!targetCurrency) continue;
            
            exchangeRates.push({
              currencyPair: {
                source: baseCurrency,
                target: targetCurrency
              },
              rate: data.conversion_rates[targetCode],
              timestamp
            });
          }
        } catch (error) {
          // Log the error but continue with other currencies
          logError(error, { 
            method: 'getAllRates', 
            service: 'ExchangeRateApiClient',
            baseCurrency: baseCurrency.code 
          });
          
          // Add to errors array
          if (error instanceof Error) {
            errors.push(error);
          } else {
            errors.push(new Error(String(error)));
          }
        }
      }
      
      // If we got no exchange rates at all, throw an error
      if (exchangeRates.length === 0 && errors.length > 0) {
        throw ErrorFactory.createApiError(
          'Failed to retrieve any exchange rates',
          errors[0],
          undefined,
          { errors: errors.map(e => e.message) }
        );
      }
      
      // Return whatever rates we were able to get
      return exchangeRates;
    } catch (error) {
      // Log the overall error
      logError(error, { 
        method: 'getAllRates', 
        service: 'ExchangeRateApiClient' 
      });
      
      // Rethrow as a standardized application error
      throw ErrorFactory.createApiError(
        'Failed to retrieve exchange rates',
        error
      );
    }
  }
} 