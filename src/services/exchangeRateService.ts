import { ApiService } from './api';

/**
 * Response type from the exchange rate API
 */
interface ExchangeRateResponse {
  rate: number;
}

/**
 * Service for interacting with the exchange rate API
 */
export class ExchangeRateService {
  /**
   * Fetches the current USD to BRL exchange rate
   * @returns The exchange rate value
   */
  static async getUsdToBrlRate(): Promise<number> {
    try {
      const data = await ApiService.get<ExchangeRateResponse>('/api/exchange-rate');
      
      if (typeof data.rate !== 'number') {
        throw new Error('Invalid rate format received');
      }
      
      return data.rate;
    } catch (error) {
      console.error("Exchange rate fetch error:", error);
      throw error;
    }
  }
} 