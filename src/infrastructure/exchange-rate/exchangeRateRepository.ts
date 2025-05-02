import { unstable_cache as cache } from 'next/cache';
import { IExchangeRateRepository } from '../../domain/exchange-rate/exchangeRateRepository.interface';
import { ExchangeRateApiClient } from '../api/exchangeRateApi.client';
import { ICurrency } from '../../domain/currency/currency.interface';
import { ExchangeRate } from '../../domain/currency/exchangeRate.type';

/**
 * Implementation of the exchange rate repository using the API client
 * and Next.js caching
 */
export class ExchangeRateRepository implements IExchangeRateRepository {
  private client: ExchangeRateApiClient;
  private cacheDuration: number;

  constructor(
    client?: ExchangeRateApiClient,
    cacheDuration?: number
  ) {
    // Use provided client or create a new one
    this.client = client || new ExchangeRateApiClient();
    
    // Use provided cache duration or fall back to environment variable, then to default (1 hour)
    this.cacheDuration = cacheDuration || 
      (process.env.EXCHANGE_RATE_CACHE_REVALIDATE_SECONDS ? 
        parseInt(process.env.EXCHANGE_RATE_CACHE_REVALIDATE_SECONDS, 10) : 
        3600);
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
          console.log('Cache miss - fetching fresh exchange rate data');
          return await this.client.getUsdToBrlRate();
        } catch (error) {
          console.error('Error in cached exchange rate fetch:', error);
          throw error; // Re-throw to be handled by the caller
        }
      },
      ['usd-brl-rate'], // Cache key
      {
        revalidate: this.cacheDuration, // Revalidate based on configured duration
        tags: ['exchange-rate'] // Tag for potential invalidation
      }
    );

    // Call and return the cached function
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
          console.log(`Cache miss - fetching fresh exchange rate data for ${fromCurrency.code} to ${toCurrency.code}`);
          return await this.client.getExchangeRate(fromCurrency, toCurrency);
        } catch (error) {
          console.error(`Error in cached exchange rate fetch for ${fromCurrency.code} to ${toCurrency.code}:`, error);
          throw error; // Re-throw to be handled by the caller
        }
      },
      [cacheKey], // Cache key
      {
        revalidate: this.cacheDuration, // Revalidate based on configured duration
        tags: ['exchange-rate'] // Tag for potential invalidation
      }
    );

    // Call and return the cached function
    return getCachedExchangeRate();
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
          console.log('Cache miss - fetching all exchange rates');
          return await this.client.getAllRates();
        } catch (error) {
          console.error('Error in cached all rates fetch:', error);
          throw error; // Re-throw to be handled by the caller
        }
      },
      ['all-exchange-rates'], // Cache key
      {
        revalidate: this.cacheDuration, // Revalidate based on configured duration
        tags: ['exchange-rate'] // Tag for potential invalidation
      }
    );

    // Call and return the cached function
    return getCachedAllRates();
  }
} 