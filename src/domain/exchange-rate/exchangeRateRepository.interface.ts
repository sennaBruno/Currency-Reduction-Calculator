/**
 * Interface defining the operations for exchange rate data retrieval
 */
export interface IExchangeRateRepository {
  /**
   * Retrieves the current USD to BRL exchange rate
   * @returns Promise resolving to the numerical exchange rate value
   * @throws Error if the rate cannot be retrieved
   */
  getUsdToBrlRate(): Promise<number>;
} 