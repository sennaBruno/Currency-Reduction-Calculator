import { ICurrency } from '../../../domain/currency/currency.interface';
import { ExchangeRate } from '../../../domain/currency/exchangeRate.type';
import { IExchangeRateApiClient } from '../../api/exchangeRateApiClient.interface';

// Sample currencies for testing
export const testCurrencies: Record<string, ICurrency> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€' },
  GBP: { code: 'British Pound', name: 'British Pound', symbol: '£' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' }
};

// Mock exchange rates for testing
export const mockExchangeRates: Record<string, Record<string, number>> = {
  USD: {
    EUR: 0.85,
    GBP: 0.75,
    JPY: 110.5,
    BRL: 5.2
  },
  EUR: {
    USD: 1.18,
    GBP: 0.88,
    JPY: 130.5,
    BRL: 6.1
  },
  GBP: {
    USD: 1.33,
    EUR: 1.14,
    JPY: 147.5,
    BRL: 6.9
  },
  JPY: {
    USD: 0.0091,
    EUR: 0.0077,
    GBP: 0.0068,
    BRL: 0.047
  },
  BRL: {
    USD: 0.19,
    EUR: 0.16,
    GBP: 0.14,
    JPY: 21.2
  }
};

/**
 * Mock Exchange Rate API client for testing
 * Simulates the behavior of the real API client using static data
 */
export class MockExchangeRateApiClient implements IExchangeRateApiClient {
  private readonly mockDelay: number;
  private readonly failureRate: number;
  
  /**
   * Creates a new instance of the mock client
   * @param mockDelay Artificial delay to simulate network latency (ms)
   * @param failureRate Rate of artificial failures (0-1)
   */
  constructor(mockDelay = 100, failureRate = 0) {
    this.mockDelay = mockDelay;
    this.failureRate = failureRate;
  }
  
  /**
   * Simulates a network request with configurable delay and failure rate
   */
  private async simulateRequest<T>(responseFactory: () => T): Promise<T> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, this.mockDelay));
    
    // Randomly fail based on failure rate
    if (Math.random() < this.failureRate) {
      throw new Error('Simulated API failure');
    }
    
    return responseFactory();
  }
  
  /**
   * Gets the USD to BRL exchange rate
   */
  async getUsdToBrlRate(): Promise<number> {
    return this.simulateRequest(() => mockExchangeRates.USD.BRL);
  }
  
  /**
   * Gets the exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency: ICurrency, toCurrency: ICurrency): Promise<ExchangeRate> {
    return this.simulateRequest(() => {
      const fromCode = fromCurrency.code;
      const toCode = toCurrency.code;
      
      // Handle same currency conversion
      if (fromCode === toCode) {
        return {
          currencyPair: {
            source: fromCurrency,
            target: toCurrency
          },
          rate: 1,
          timestamp: new Date()
        };
      }
      
      // Check if we have this currency pair in our mock data
      if (!mockExchangeRates[fromCode] || !mockExchangeRates[fromCode][toCode]) {
        throw new Error(`Exchange rate not available for ${fromCode} to ${toCode}`);
      }
      
      return {
        currencyPair: {
          source: fromCurrency,
          target: toCurrency
        },
        rate: mockExchangeRates[fromCode][toCode],
        timestamp: new Date()
      };
    });
  }
  
  /**
   * Gets all exchange rates with the given currency as base
   */
  async getAllRates(baseCurrency?: ICurrency): Promise<ExchangeRate[]> {
    return this.simulateRequest(() => {
      const baseCode = baseCurrency?.code || 'USD';
      const rates = mockExchangeRates[baseCode];
      
      if (!rates) {
        throw new Error(`Base currency ${baseCode} not supported`);
      }
      
      const exchangeRates: ExchangeRate[] = [];
      const now = new Date();
      
      // Create exchange rate objects for each supported target currency
      Object.entries(rates).forEach(([targetCode, rate]) => {
        const targetCurrency = testCurrencies[targetCode];
        
        if (targetCurrency) {
          exchangeRates.push({
            currencyPair: {
              source: testCurrencies[baseCode],
              target: targetCurrency
            },
            rate,
            timestamp: now
          });
        }
      });
      
      return exchangeRates;
    });
  }
  
  /**
   * Gets the list of supported currency codes
   */
  async getSupportedCurrencies(): Promise<string[]> {
    return this.simulateRequest(() => Object.keys(testCurrencies));
  }
} 