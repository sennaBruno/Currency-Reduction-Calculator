import ky from 'ky';

/**
 * Type definition for the exchange rate API response
 */
interface ExchangeRateApiResponse {
  rates: {
    BRL: number;
    [key: string]: number;
  };
  base: string;
  time_last_update_unix: number;
  time_next_update_unix: number;
}

/**
 * Client for interacting with the external exchange rate API
 */
export class ExternalExchangeRateClient {
  private readonly apiUrl: string;

  constructor(apiUrl?: string) {
    // Use provided URL or fall back to environment variable, then to default URL
    this.apiUrl = apiUrl || 
      process.env.EXCHANGE_RATE_API_URL || 
      'https://open.er-api.com/v6/latest/USD';
  }

  /**
   * Fetches the current USD to BRL exchange rate
   * @returns The USD to BRL exchange rate
   * @throws Error if the API request fails or the response is invalid
   */
  async fetchUsdToBrlRate(): Promise<number> {
    try {
      console.log('Fetching fresh exchange rate from:', this.apiUrl);
      
      // Use ky to fetch exchange rate data
      const response = await ky.get(this.apiUrl, {
        timeout: 10000, // 10 second timeout
        retry: {
          limit: 2,
          methods: ['GET'],
          statusCodes: [408, 413, 429, 500, 502, 503, 504]
        }
      }).json<ExchangeRateApiResponse>();
      
      // Validate response structure
      if (!response.rates || typeof response.rates.BRL !== 'number') {
        throw new Error('Invalid response format: BRL rate not found');
      }
      
      console.log('Successfully fetched USD/BRL rate:', response.rates.BRL);
      return response.rates.BRL;
    } catch (error: unknown) {
      // Enhanced error handling with more context
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error fetching exchange rate:', errorMessage);
      throw new Error(`Failed to fetch exchange rate: ${errorMessage}`);
    }
  }
} 