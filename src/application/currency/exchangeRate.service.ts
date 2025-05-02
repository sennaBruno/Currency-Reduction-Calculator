import { ICurrency } from '../../domain/currency/currency.interface';
import { ExchangeRate } from '../../domain/currency/exchangeRate.type';
import { IExchangeRateRepository, ExchangeRateMetadata } from '../../domain/exchange-rate/exchangeRateRepository.interface';
import { IExchangeRateService } from './exchangeRate.interface';

/**
 * Service that manages exchange rates
 */
export class ExchangeRateService implements IExchangeRateService {
  private ratesCache: Map<string, ExchangeRate> = new Map();
  private lastUpdated: Date = new Date(0);
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

  constructor(private exchangeRateRepository: IExchangeRateRepository) {}

  /**
   * Gets the exchange rate between two currencies
   * @param fromCurrency The source currency
   * @param toCurrency The target currency
   * @returns Promise resolving to the exchange rate
   */
  async getExchangeRate(fromCurrency: ICurrency, toCurrency: ICurrency): Promise<ExchangeRate> {
    if (this.isCacheStale()) {
      await this.updateRates();
    }

    const cacheKey = this.getCacheKey(fromCurrency.code, toCurrency.code);
    const cachedRate = this.ratesCache.get(cacheKey);

    if (cachedRate) {
      return cachedRate;
    }

    // If not in cache, fetch from repository
    const rate = await this.exchangeRateRepository.getExchangeRate(fromCurrency, toCurrency);
    this.ratesCache.set(cacheKey, rate);
    return rate;
  }

  /**
   * Gets all available exchange rates
   * @returns Promise resolving to an array of exchange rates
   */
  async getAllRates(): Promise<ExchangeRate[]> {
    if (this.isCacheStale()) {
      await this.updateRates();
    }
    
    return Array.from(this.ratesCache.values());
  }

  /**
   * Updates the local cache of exchange rates
   * @returns Promise resolving when rates are updated
   */
  async updateRates(): Promise<void> {
    const rates = await this.exchangeRateRepository.getAllRates();
    
    // Clear existing cache
    this.ratesCache.clear();
    
    // Update cache with new rates
    rates.forEach(rate => {
      const cacheKey = this.getCacheKey(
        rate.currencyPair.source.code, 
        rate.currencyPair.target.code
      );
      this.ratesCache.set(cacheKey, rate);
    });
    
    this.lastUpdated = new Date();
  }
  
  /**
   * Gets metadata about the exchange rate data freshness
   * @returns Exchange rate metadata including API update timestamps
   */
  async getExchangeRateMetadata(): Promise<ExchangeRateMetadata> {
    // Get the repository metadata
    const repoMetadata = this.exchangeRateRepository.getExchangeRateMetadata();
    
    // Enhance with service-level cache information
    return {
      ...repoMetadata,
      // Add service-level cache information if it's different from repository
      lastCacheRefreshTime: this.lastUpdated.getTime() > repoMetadata.lastCacheRefreshTime.getTime()
        ? this.lastUpdated
        : repoMetadata.lastCacheRefreshTime
    };
  }

  /**
   * Checks if the cache is stale and needs refreshing
   * @returns True if cache needs refresh, false otherwise
   */
  private isCacheStale(): boolean {
    const currentTime = new Date();
    return (currentTime.getTime() - this.lastUpdated.getTime()) > this.CACHE_TTL_MS;
  }

  /**
   * Generates a cache key for a currency pair
   * @param fromCode Source currency code
   * @param toCode Target currency code
   * @returns Cache key string
   */
  private getCacheKey(fromCode: string, toCode: string): string {
    return `${fromCode}-${toCode}`;
  }
} 