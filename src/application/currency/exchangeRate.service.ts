import { ICurrency } from '../../domain/currency/currency.interface';
import { ExchangeRate } from '../../domain/currency/exchangeRate.type';
import { IExchangeRateRepository, ExchangeRateMetadata } from '../../domain/exchange-rate/exchangeRateRepository.interface';
import { IExchangeRateService } from './exchangeRate.interface';
import { nowUTC } from '../../utils/dateUtils';

/**
 * Service that manages exchange rates with intelligent caching
 */
export class ExchangeRateService implements IExchangeRateService {
  private ratesCache: Map<string, ExchangeRate> = new Map();
  private lastUpdated: Date = new Date(0);
  private readonly CACHE_TTL_SECONDS: number;
  private pendingRefresh: Promise<void> | null = null;

  constructor(
    private exchangeRateRepository: IExchangeRateRepository,
    cacheTtlSeconds?: number
  ) {
    const repoConfig = this.exchangeRateRepository.getCacheConfig();
    this.CACHE_TTL_SECONDS = cacheTtlSeconds || 
      repoConfig.revalidateSeconds || 
      60 * 60; // 1 hour default
  }

  /**
   * Gets the exchange rate between two currencies
   * Implements cache-aside pattern with lazy loading
   * @param fromCurrency The source currency
   * @param toCurrency The target currency
   * @returns Promise resolving to the exchange rate
   */
  async getExchangeRate(fromCurrency: ICurrency, toCurrency: ICurrency): Promise<ExchangeRate> {
    await this.ensureRatesAvailable();

    const cacheKey = this.getCacheKey(fromCurrency.code, toCurrency.code);
    const cachedRate = this.ratesCache.get(cacheKey);

    if (cachedRate) {
      return cachedRate;
    }

    try {
      const rate = await this.exchangeRateRepository.getExchangeRate(fromCurrency, toCurrency);
      this.ratesCache.set(cacheKey, rate);
      return rate;
    } catch (error) {
      console.error(`Error fetching rate ${fromCurrency.code}/${toCurrency.code}:`, error);
      throw error;
    }
  }

  /**
   * Gets all available exchange rates
   * @returns Promise resolving to an array of exchange rates
   */
  async getAllRates(): Promise<ExchangeRate[]> {
    await this.ensureRatesAvailable();
    return Array.from(this.ratesCache.values());
  }

  /**
   * Updates the local cache of exchange rates
   * Implements refresh token pattern to avoid duplicate refreshes 
   * @returns Promise resolving when rates are updated
   */
  async updateRates(): Promise<void> {
    if (this.pendingRefresh) {
      return this.pendingRefresh;
    }

    try {
      this.pendingRefresh = this.doUpdateRates();
      await this.pendingRefresh;
    } finally {
      this.pendingRefresh = null;
    }
  }
  
  /**
   * Private method that actually performs the update
   */
  private async doUpdateRates(): Promise<void> {
    try {
      const rates = await this.exchangeRateRepository.getAllRates();
      
      this.ratesCache.clear();
      
      rates.forEach(rate => {
        const cacheKey = this.getCacheKey(
          rate.currencyPair.source.code, 
          rate.currencyPair.target.code
        );
        this.ratesCache.set(cacheKey, rate);
      });
      
      this.lastUpdated = nowUTC();
    } catch (error) {
      console.error('Error updating rates:', error);
      throw error;
    }
  }
  
  /**
   * Gets metadata about the exchange rate data freshness
   * @returns Exchange rate metadata including API update timestamps
   */
  async getExchangeRateMetadata(): Promise<ExchangeRateMetadata> {
    const repoMetadata = this.exchangeRateRepository.getExchangeRateMetadata();
    
    return {
      ...repoMetadata,
      lastCacheRefreshTime: this.lastUpdated.getTime() > repoMetadata.lastCacheRefreshTime.getTime()
        ? this.lastUpdated
        : repoMetadata.lastCacheRefreshTime
    };
  }

  /**
   * Ensures that rates are available in the cache
   * Implements the circuit breaker pattern to avoid thundering herd
   */
  private async ensureRatesAvailable(): Promise<void> {
    if (this.isCacheEmpty() || this.isCacheStale()) {
      await this.updateRates();
    }
  }

  /**
   * Checks if the cache is completely empty
   */
  private isCacheEmpty(): boolean {
    return this.ratesCache.size === 0;
  }

  /**
   * Checks if the cache is stale and needs refreshing
   * @returns True if cache needs refresh, false otherwise
   */
  private isCacheStale(): boolean {
    const currentTime = nowUTC();
    return (currentTime.getTime() - this.lastUpdated.getTime()) > (this.CACHE_TTL_SECONDS * 1000);
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