import { NextResponse, NextRequest } from 'next/server';
import { ExchangeRateService } from '../../../../../application/currency/exchangeRate.service';
import { ExchangeRateRepository } from '../../../../../infrastructure/exchange-rate/exchangeRateRepository';
import { CurrencyRegistry } from '../../../../../application/currency/currencyRegistry.service';
import { formatDateISO } from '../../../../../utils/dateUtils';

// Create instances of the required services
const exchangeRateRepository = new ExchangeRateRepository(undefined, {
  cacheTTL: process.env.EXCHANGE_RATE_CACHE_TTL 
    ? parseInt(process.env.EXCHANGE_RATE_CACHE_TTL, 10) 
    : 3600, // Default to 1 hour
  cacheTag: 'api-exchange-rate-pair',
  apiProvider: process.env.EXCHANGE_RATE_API_PROVIDER as 'default' | 'external' || 'default'
});
const exchangeRateService = new ExchangeRateService(exchangeRateRepository);
const currencyRegistry = new CurrencyRegistry();

/**
 * GET handler for the /api/exchange-rate/[source]/[target] endpoint
 * Returns the exchange rate for a specific currency pair
 */
export async function GET(
  context: { params: { source: string; target: string } }
) {
  const params = await context.params;
  const source = await params.source;
  const target = await params.target;
  
  try {
    const sourceCurrency = currencyRegistry.getCurrencyByCode(source);
    const targetCurrency = currencyRegistry.getCurrencyByCode(target);
    
    if (!sourceCurrency || !targetCurrency) {
      return NextResponse.json(
        { error: 'One or both currencies are not supported' },
        { status: 400 }
      );
    }
    
    const result = await exchangeRateService.getExchangeRate(sourceCurrency, targetCurrency);
    
    const response = {
      rate: result.rate,
      timestamp: result.timestamp ? formatDateISO(result.timestamp) : null,
      lastCacheRefreshTime: result.lastCacheRefreshTime ? formatDateISO(result.lastCacheRefreshTime) : null,
      lastApiUpdateTime: result.lastApiUpdateTime ? formatDateISO(result.lastApiUpdateTime) : null,
      nextCacheRefreshTime: result.nextCacheRefreshTime ? formatDateISO(result.nextCacheRefreshTime) : null,
      fromCache: result.fromCache,
      time_last_update_utc: result.time_last_update_utc,
      time_next_update_utc: result.time_next_update_utc
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
      }
    });
    
  } catch (error) {
    console.error(`Error fetching rate for ${source} to ${target}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch exchange rate for ${source} to ${target}` },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'; 
export const revalidate = 600; 