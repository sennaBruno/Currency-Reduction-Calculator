import { unstable_cache as cache } from 'next/cache';
import { IExchangeRateRepository } from '../../domain/exchange-rate/exchangeRateRepository.interface';
import { ExternalExchangeRateClient } from './externalExchangeRateClient';

/**
 * Implementation of the exchange rate repository using the external API client
 * and Next.js caching
 */
export class ExchangeRateRepository implements IExchangeRateRepository {
  private client: ExternalExchangeRateClient;
  private cacheDuration: number;

  constructor(
    client?: ExternalExchangeRateClient,
    cacheDuration?: number
  ) {
    // Use provided client or create a new one
    this.client = client || new ExternalExchangeRateClient();
    
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
          return await this.client.fetchUsdToBrlRate();
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
} 