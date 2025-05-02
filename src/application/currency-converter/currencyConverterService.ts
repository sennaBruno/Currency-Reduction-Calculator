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
   * Converts an amount from USD to BRL using the current exchange rate
   * @param amount The amount in USD to convert
   * @returns The converted amount in BRL
   */
  async convertUsdToBrl(amount: number): Promise<number> {
    try {
      if (isNaN(amount) || amount < 0) {
        throw new Error('Invalid amount. Please provide a positive number.');
      }

      const rate = await this.exchangeRateService.fetchUsdBrlRate();
      const convertedAmount = amount * rate;
      
      // Return with 2 decimal places precision
      return Math.round(convertedAmount * 100) / 100;
    } catch (error: any) {
      console.error('[CurrencyConverterService] Error converting USD to BRL:', error.message || error);
      throw new Error('Could not perform currency conversion. Please try again later.');
    }
  }
} 