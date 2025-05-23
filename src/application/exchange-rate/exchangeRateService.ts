import { IExchangeRateRepository } from '../../domain/exchange-rate/exchangeRateRepository.interface';
import { ExchangeRateRepository } from '../../infrastructure/exchange-rate/exchangeRateRepository';
import { ICurrency } from '../../domain/currency/currency.interface';

/**
 * Service class for exchange rate operations
 */
export class ExchangeRateService {
  private repository: IExchangeRateRepository;

  /**
   * Creates a new ExchangeRateService
   * @param repository The exchange rate repository to use, or creates a default one if not provided
   */
  constructor(repository?: IExchangeRateRepository) {
    // Use the provided repository or create a default one
    this.repository = repository || new ExchangeRateRepository();
  }

  /**
   * Fetches the current USD to BRL exchange rate
   * @returns The exchange rate
   */
  async fetchUsdBrlRate(): Promise<number> {
    try {
      return await this.repository.getUsdToBrlRate();
    } catch (error: Error | unknown) {
      // Application-level error handling and logging
      console.error('[ExchangeRateService] Error fetching USD/BRL rate:', 
        error instanceof Error ? error.message : 'Unknown error');
      // Re-throw with a more user-friendly message
      throw new Error('Could not retrieve the current exchange rate. Please try again later.');
    }
  }

  /**
   * Fetches the exchange rate between two currencies
   * @param fromCurrency The source currency
   * @param toCurrency The target currency
   * @returns The exchange rate
   */
  async fetchExchangeRate(fromCurrency: ICurrency, toCurrency: ICurrency): Promise<number> {
    try {
      const exchangeRate = await this.repository.getExchangeRate(fromCurrency, toCurrency);
      return exchangeRate.rate;
    } catch (error: Error | unknown) {
      // Application-level error handling and logging
      console.error(
        `[ExchangeRateService] Error fetching ${fromCurrency.code}/${toCurrency.code} rate:`, 
        error instanceof Error ? error.message : 'Unknown error'
      );
      // Re-throw with a more user-friendly message
      throw new Error(`Could not retrieve the current exchange rate for ${fromCurrency.code} to ${toCurrency.code}. Please try again later.`);
    }
  }
} 