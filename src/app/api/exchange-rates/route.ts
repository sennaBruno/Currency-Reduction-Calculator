import { NextResponse } from 'next/server';
import { ExchangeRateService } from '../../../application/currency/exchangeRate.service';
import { ExchangeRateRepository } from '../../../infrastructure/exchange-rate/exchangeRateRepository';
import { CurrencyRegistry } from '../../../application/currency/currencyRegistry.service';

// Create instances of the required services
// Use repository pattern with configurable provider and caching
const exchangeRateRepository = new ExchangeRateRepository(undefined, {
  cacheTTL: process.env.EXCHANGE_RATE_CACHE_TTL 
    ? parseInt(process.env.EXCHANGE_RATE_CACHE_TTL, 10) 
    : 3600, // Default to 1 hour
  cacheTag: 'api-exchange-rates',
  apiProvider: process.env.EXCHANGE_RATE_API_PROVIDER as 'default' | 'external' || 'default'
});
const exchangeRateService = new ExchangeRateService(exchangeRateRepository);
const currencyRegistry = new CurrencyRegistry();

/**
 * GET handler for the /api/exchange-rates endpoint
 * Returns exchange rates between currencies
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromCurrency = searchParams.get('from');
    const toCurrency = searchParams.get('to');
    
    // If specific currencies are requested
    if (fromCurrency && toCurrency) {
      const sourceCurrency = currencyRegistry.getCurrencyByCode(fromCurrency);
      const targetCurrency = currencyRegistry.getCurrencyByCode(toCurrency);
      
      if (!sourceCurrency || !targetCurrency) {
        return NextResponse.json(
          { error: 'One or both currencies are not supported' },
          { status: 400 }
        );
      }
      
      try {
        const rate = await exchangeRateService.getExchangeRate(sourceCurrency, targetCurrency);
        return NextResponse.json({ rate }, { status: 200 });
      } catch (error) {
        console.error(`Error fetching rate for ${fromCurrency} to ${toCurrency}:`, error);
        return NextResponse.json(
          { error: `Failed to fetch exchange rate for ${fromCurrency} to ${toCurrency}` },
          { status: 500 }
        );
      }
    }
    
    // Otherwise return all available rates
    try {
      const rates = await exchangeRateService.getAllRates();
      return NextResponse.json({ rates }, { status: 200 });
    } catch (error) {
      console.error('Error retrieving all exchange rates:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve exchange rates' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in exchange rates endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to process exchange rate request' },
      { status: 500 }
    );
  }
}

// Ensure this route is dynamically rendered
export const dynamic = 'force-dynamic'; 