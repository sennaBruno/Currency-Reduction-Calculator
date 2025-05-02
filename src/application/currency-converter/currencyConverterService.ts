import { ICurrencyConverterService } from '../../domain/currency-converter/currencyConverterService.interface';
import { ExchangeRateService } from '../exchange-rate/exchangeRateService';

/**
 * Service class for currency conversion operations
 */
export class CurrencyConverterService implements ICurrencyConverterService {
  private exchangeRateService: ExchangeRateService;

  /**
   * Creates a new CurrencyConverterService
   * @param exchangeRateService The exchange rate service to use, or creates a default one if not provided
   */
  constructor(exchangeRateService?: ExchangeRateService) {
    this.exchangeRateService = exchangeRateService || new ExchangeRateService();
  }

  /**
   * Converts a USD amount to BRL using the current exchange rate
   * @param amountUSD The amount in USD to convert
   * @returns The converted amount in BRL
   */
  async convertUsdToBrl(amountUSD: number): Promise<number> {
    try {
      // Validate input
      if (isNaN(amountUSD) || amountUSD < 0) {
        throw new Error('Invalid amount. Please provide a positive number.');
      }

      // Get the current exchange rate
      const rate = await this.exchangeRateService.fetchUsdBrlRate();
      
      // Calculate and return the BRL amount
      return amountUSD * rate;
    } catch (error: Error | unknown) {
      // Enhance the error message with context about the conversion
      const errorMessage = error instanceof Error 
        ? `Currency conversion failed: ${error.message}` 
        : 'Currency conversion failed due to an unknown error';
      
      console.error('[CurrencyConverterService] Error:', errorMessage);
      
      // Re-throw with enhanced message
      throw new Error(errorMessage);
    }
  }
} 