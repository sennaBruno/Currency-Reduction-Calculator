import { ICurrencyConverterService } from '../../domain/currency-converter/currencyConverterService.interface';
import { ExchangeRateService } from '../exchange-rate/exchangeRateService';
import { ICurrency } from '../../domain/currency/currency.interface';

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

  /**
   * Converts an amount from one currency to another using the current exchange rate
   * @param amount The amount to convert
   * @param fromCurrency The source currency
   * @param toCurrency The target currency
   * @returns Promise resolving to the converted amount
   * @throws Error if the conversion cannot be performed
   */
  async convert(amount: number, fromCurrency: ICurrency, toCurrency: ICurrency): Promise<number> {
    try {
      // Validate input
      if (isNaN(amount)) {
        throw new Error('Invalid amount. Please provide a number.');
      }

      // Special case for same currency conversion
      if (fromCurrency.code === toCurrency.code) {
        return amount;
      }

      // Get the exchange rate from the service
      const exchangeRate = await this.exchangeRateService.fetchExchangeRate(
        fromCurrency,
        toCurrency
      );
      
      // Calculate and return the converted amount
      return amount * exchangeRate;
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error 
        ? `Currency conversion failed: ${error.message}` 
        : 'Currency conversion failed due to an unknown error';
      
      console.error('[CurrencyConverterService] Error:', errorMessage);
      
      // Re-throw with enhanced message
      throw new Error(errorMessage);
    }
  }
} 