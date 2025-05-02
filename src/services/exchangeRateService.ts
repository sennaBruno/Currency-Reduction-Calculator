import { ApiService } from './api';
import { ICurrency } from '../domain/currency';
import { ExchangeRate } from '../domain/currency/exchangeRate.type';

/**
 * Response type from the exchange rate API
 */
interface ExchangeRateResponse {
  rate: number;
  timestamp?: string;
}

/**
 * Full exchange rate data including metadata
 */
interface ExchangeRateData {
  rate: number;
  timestamp: Date;
}

interface CurrencyPairExchangeRateResponse {
  rate: {
    rate: number;
    currencyPair: {
      source: ICurrency;
      target: ICurrency;
    };
    timestamp: string;
  };
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

  /**
   * Fetches the current USD to BRL exchange rate with metadata
   * @returns The exchange rate value and timestamp
   */
  static async getUsdToBrlRateWithMetadata(): Promise<ExchangeRateData> {
    try {
      const data = await ApiService.get<ExchangeRateResponse>('/api/exchange-rate');
      
      if (typeof data.rate !== 'number') {
        throw new Error('Invalid rate format received');
      }
      
      return {
        rate: data.rate,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date()
      };
    } catch (error) {
      console.error("Exchange rate fetch error:", error);
      throw error;
    }
  }

  /**
   * Fetches the exchange rate between any two currencies
   * @param sourceCurrency The source currency
   * @param targetCurrency The target currency
   * @returns The exchange rate value
   */
  static async getExchangeRateForPair(sourceCurrency: ICurrency, targetCurrency: ICurrency): Promise<number> {
    try {
      const data = await ApiService.get<CurrencyPairExchangeRateResponse>(
        `/api/exchange-rates?from=${sourceCurrency.code}&to=${targetCurrency.code}`
      );
      
      if (typeof data.rate?.rate !== 'number') {
        throw new Error('Invalid rate format received');
      }
      
      return data.rate.rate;
    } catch (error) {
      console.error(`Exchange rate fetch error for ${sourceCurrency.code} to ${targetCurrency.code}:`, error);
      throw error;
    }
  }

  /**
   * Fetches the exchange rate between any two currencies with metadata
   * @param sourceCurrency The source currency
   * @param targetCurrency The target currency
   * @returns The exchange rate value and timestamp
   */
  static async getExchangeRateForPairWithMetadata(
    sourceCurrency: ICurrency, 
    targetCurrency: ICurrency
  ): Promise<ExchangeRateData> {
    try {
      const data = await ApiService.get<CurrencyPairExchangeRateResponse>(
        `/api/exchange-rates?from=${sourceCurrency.code}&to=${targetCurrency.code}`
      );
      
      if (typeof data.rate?.rate !== 'number') {
        throw new Error('Invalid rate format received');
      }
      
      return {
        rate: data.rate.rate,
        timestamp: data.rate.timestamp ? new Date(data.rate.timestamp) : new Date()
      };
    } catch (error) {
      console.error(`Exchange rate fetch error for ${sourceCurrency.code} to ${targetCurrency.code}:`, error);
      throw error;
    }
  }
} 