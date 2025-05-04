import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CurrencyConversionService } from '../currencyConversionService';
import { ICurrency } from '../../../domain/currency/currency.interface';
import { IExchangeRateRepository } from '../../../domain/exchange-rate/exchangeRateRepository.interface';
import { ExchangeRate } from '../../../domain/currency/exchangeRate.type';
import { nowUTC, addSecondsToDate } from '../../../utils/dateUtils';

// Mock exchange rate repository
const mockExchangeRateRepository: jest.Mocked<IExchangeRateRepository> = {
  getExchangeRate: jest.fn(),
  getUsdToBrlRate: jest.fn(),
  getAllRates: jest.fn(),
  getCacheConfig: jest.fn()
};

// Sample currencies
const usd: ICurrency = {
  code: 'USD',
  name: 'US Dollar',
  symbol: '$'
};

const eur: ICurrency = {
  code: 'EUR',
  name: 'Euro',
  symbol: '€'
};

const gbp: ICurrency = {
  code: 'GBP',
  name: 'British Pound',
  symbol: '£'
};

describe('CurrencyConversionService', () => {
  let service: CurrencyConversionService;
  
  beforeEach(() => {
    jest.resetAllMocks();
    service = new CurrencyConversionService(mockExchangeRateRepository);
  });
  
  describe('convert', () => {
    it('should convert USD to EUR correctly', async () => {
      // Arrange
      const amount = 100;
      const currentTime = nowUTC();
      const exchangeRate: ExchangeRate = {
        currencyPair: {
          source: usd,
          target: eur
        },
        rate: 0.85,
        timestamp: currentTime,
        fromCache: false,
        lastApiUpdateTime: currentTime,
        lastCacheRefreshTime: currentTime,
        nextCacheRefreshTime: addSecondsToDate(currentTime, 3600),
        time_last_update_utc: currentTime.toISOString(),
        time_next_update_utc: addSecondsToDate(currentTime, 86400).toISOString()
      };
      
      mockExchangeRateRepository.getExchangeRate.mockResolvedValue(exchangeRate);
      
      // Act
      const result = await service.convert(amount, usd, eur);
      
      // Assert
      expect(mockExchangeRateRepository.getExchangeRate).toHaveBeenCalledWith(usd, eur);
      expect(result.originalAmount).toBe(amount);
      expect(result.convertedAmount).toBe(85); // 100 * 0.85
      expect(result.rate).toBe(0.85);
      expect(result.sourceCurrency).toBe(usd);
      expect(result.targetCurrency).toBe(eur);
    });
    
    it('should throw an error when exchange rate cannot be fetched', async () => {
      // Arrange
      const amount = 100;
      const errorMessage = 'Failed to retrieve exchange rate';
      
      mockExchangeRateRepository.getExchangeRate.mockRejectedValue(new Error(errorMessage));
      
      // Act & Assert
      await expect(service.convert(amount, usd, gbp))
        .rejects
        .toThrow(errorMessage);
      
      expect(mockExchangeRateRepository.getExchangeRate).toHaveBeenCalledWith(usd, gbp);
    });
    
    it('should handle zero amount conversion correctly', async () => {
      // Arrange
      const amount = 0;
      const currentTime = nowUTC();
      const exchangeRate: ExchangeRate = {
        currencyPair: {
          source: usd,
          target: eur
        },
        rate: 0.85,
        timestamp: currentTime,
        fromCache: false,
        lastApiUpdateTime: currentTime,
        lastCacheRefreshTime: currentTime,
        nextCacheRefreshTime: addSecondsToDate(currentTime, 3600),
        time_last_update_utc: currentTime.toISOString(),
        time_next_update_utc: addSecondsToDate(currentTime, 86400).toISOString()
      };
      
      mockExchangeRateRepository.getExchangeRate.mockResolvedValue(exchangeRate);
      
      // Act
      const result = await service.convert(amount, usd, eur);
      
      // Assert
      expect(result.originalAmount).toBe(0);
      expect(result.convertedAmount).toBe(0);
    });
    
    it('should handle negative amount by converting absolute value', async () => {
      // Arrange
      const amount = -100;
      const currentTime = nowUTC();
      const exchangeRate: ExchangeRate = {
        currencyPair: {
          source: eur,
          target: gbp
        },
        rate: 0.9,
        timestamp: currentTime,
        fromCache: false,
        lastApiUpdateTime: currentTime,
        lastCacheRefreshTime: currentTime,
        nextCacheRefreshTime: addSecondsToDate(currentTime, 3600),
        time_last_update_utc: currentTime.toISOString(),
        time_next_update_utc: addSecondsToDate(currentTime, 86400).toISOString()
      };
      
      mockExchangeRateRepository.getExchangeRate.mockResolvedValue(exchangeRate);
      
      // Act
      const result = await service.convert(amount, eur, gbp);
      
      // Assert
      expect(result.originalAmount).toBe(-100);
      expect(result.convertedAmount).toBe(-90); // -100 * 0.9
    });
  });
}); 