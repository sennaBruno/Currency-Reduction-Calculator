/**
 * Interface defining a currency
 */
export interface ICurrency {
  /**
   * The currency code (e.g., 'USD', 'EUR')
   */
  code: string;
  
  /**
   * The currency symbol (e.g., '$', '€')
   */
  symbol: string;
  
  /**
   * The name of the currency (e.g., 'US Dollar', 'Euro')
   */
  name: string;
} 