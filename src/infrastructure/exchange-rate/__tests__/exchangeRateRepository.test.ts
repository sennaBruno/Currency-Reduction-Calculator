import { ExchangeRateRepository } from '../exchangeRateRepository';
import { MockExchangeRateApiClient, testCurrencies } from './exchangeRateApiMock';

// Mock the Next.js cache functionality since we can't use it in tests
jest.mock('next/cache', () => ({
  unstable_cache: jest.fn().mockImplementation((fn) => {
    return (...args: unknown[]) => fn(...args);
  })
}));

describe('ExchangeRateRepository', () => {
  // Create instances for testing
  const mockClient = new MockExchangeRateApiClient(10, 0); // Fast response, no failures
  const repository = new ExchangeRateRepository(mockClient, { 
    cacheTTL: 60, // 1 minute cache for tests
    cacheTag: 'test-exchange-rate'
  });
  
  // Test data
  const usd = testCurrencies.USD;
  const eur = testCurrencies.EUR;
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getUsdToBrlRate', () => {
    it('should retrieve the USD to BRL rate', async () => {
      // Act
      const rate = await repository.getUsdToBrlRate();
      
      // Assert
      expect(rate).toBeGreaterThan(0);
      expect(typeof rate).toBe('number');
    });
  });
  
  describe('getExchangeRate', () => {
    it('should retrieve the exchange rate between two currencies', async () => {
      // Act
      const result = await repository.getExchangeRate(usd, eur);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.currencyPair.source).toEqual(usd);
      expect(result.currencyPair.target).toEqual(eur);
      expect(result.rate).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });
    
    it('should throw an error for unsupported currency pairs', async () => {
      // Arrange - Create a custom currency not in our mock data
      const customCurrency = { code: 'XYZ', name: 'Custom Currency', symbol: 'X' };
      
      // Act & Assert
      await expect(repository.getExchangeRate(customCurrency, eur))
        .rejects
        .toThrow();
    });
  });
  
  describe('getAllRates', () => {
    it('should retrieve all available exchange rates', async () => {
      // Act
      const rates = await repository.getAllRates();
      
      // Assert
      expect(rates).toBeInstanceOf(Array);
      expect(rates.length).toBeGreaterThan(0);
      
      // Check the structure of the first rate
      const firstRate = rates[0];
      expect(firstRate.currencyPair).toBeDefined();
      expect(firstRate.currencyPair.source).toBeDefined();
      expect(firstRate.currencyPair.target).toBeDefined();
      expect(firstRate.rate).toBeGreaterThan(0);
      expect(firstRate.timestamp).toBeInstanceOf(Date);
    });
  });
  
  describe('getCacheConfig', () => {
    it('should return the current cache configuration', () => {
      // Act
      const config = repository.getCacheConfig();
      
      // Assert
      expect(config.revalidateSeconds).toBe(60);
    });
  });
}); 