import { ICurrency } from './currency.interface';

/**
 * Type representing a pair of currencies for conversion
 */
export type CurrencyPair = {
  /**
   * The source currency to convert from
   */
  source: ICurrency;
  
  /**
   * The target currency to convert to
   */
  target: ICurrency;
}; 