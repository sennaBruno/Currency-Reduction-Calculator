import { CurrencyPair } from './currencyPair.type';

/**
 * Type representing an exchange rate between two currencies
 */
export type ExchangeRate = {
  /**
   * The currency pair this rate applies to
   */
  currencyPair: CurrencyPair;
  
  /**
   * The conversion rate value
   */
  rate: number;
  
  /**
   * Timestamp when this rate was last updated
   */
  timestamp: Date;
}; 