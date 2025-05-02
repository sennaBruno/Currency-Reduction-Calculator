/**
 * Interface defining the operations for currency conversion
 */
export interface ICurrencyConverterService {
  /**
   * Converts an amount from USD to BRL using the current exchange rate
   * @param amount The amount in USD to convert
   * @returns Promise resolving to the converted amount in BRL
   * @throws Error if the conversion cannot be performed
   */
  convertUsdToBrl(amount: number): Promise<number>;
} 