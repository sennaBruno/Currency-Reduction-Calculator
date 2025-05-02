import { ICurrency } from '../../domain/currency/currency.interface';
import { IExchangeRateRepository } from '../../domain/exchange-rate/exchangeRateRepository.interface';

interface ConversionResult {
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  sourceCurrency: ICurrency;
  targetCurrency: ICurrency;
}

export class CurrencyConversionService {
  constructor(private readonly exchangeRateRepository: IExchangeRateRepository) {}

  async convert(
    amount: number,
    sourceCurrency: ICurrency,
    targetCurrency: ICurrency
  ): Promise<ConversionResult> {
    const exchangeRate = await this.exchangeRateRepository.getExchangeRate(
      sourceCurrency,
      targetCurrency
    );

    const convertedAmount = amount * exchangeRate.rate;

    return {
      originalAmount: amount,
      convertedAmount,
      rate: exchangeRate.rate,
      sourceCurrency,
      targetCurrency,
    };
  }
} 