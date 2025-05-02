import { IExchangeRateApiClient } from './exchangeRateApiClient.interface';
import { ExchangeRateApiClient } from './exchangeRateApi.client';
import { ExternalExchangeRateClient } from '../exchange-rate/externalExchangeRateClient';

/**
 * API provider options
 */
export type ExchangeRateApiProvider = 'default' | 'external';

/**
 * Factory class for creating exchange rate API clients
 */
export class ExchangeRateClientFactory {
  /**
   * Creates an appropriate exchange rate API client based on the specified provider
   * @param provider The API provider to use (default is the primary exchangerate-api.com provider)
   * @returns An instance of the exchange rate API client
   */
  static createClient(provider: ExchangeRateApiProvider = 'default'): IExchangeRateApiClient {
    console.log(`Creating exchange rate API client for provider: ${provider}`);
    
    switch (provider) {
      case 'external':
        return new ExternalExchangeRateClient();
      case 'default':
      default:
        return new ExchangeRateApiClient();
    }
  }
  
  /**
   * Creates an exchange rate API client based on environment configuration
   * Uses the EXCHANGE_RATE_API_PROVIDER environment variable if set
   * @returns An instance of the exchange rate API client
   */
  static createDefaultClient(): IExchangeRateApiClient {
    const providerFromEnv = process.env.EXCHANGE_RATE_API_PROVIDER as ExchangeRateApiProvider;
    const provider = providerFromEnv || 'default';
    
    return ExchangeRateClientFactory.createClient(provider);
  }
} 