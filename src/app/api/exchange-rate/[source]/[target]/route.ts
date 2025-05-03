import { NextResponse } from 'next/server';
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
 * Returns exchange rate between specific currencies with metadata
 */
export async function GET(
  request: Request,
  { params }: { params: { source: string; target: string } }
) {
  try {
    const { source, target } = params;
    
    const sourceCurrency = currencyRegistry.getCurrencyByCode(source);
    const targetCurrency = currencyRegistry.getCurrencyByCode(target);
    
    if (!sourceCurrency || !targetCurrency) {
      return NextResponse.json(
        { error: 'One or both currencies are not supported' },
        { status: 400 }
      );
    }
    
    // Fetch the exchange rate
    const result = await exchangeRateService.getExchangeRate(sourceCurrency, targetCurrency);
    
    // Get metadata for the exchange rate
    const metadata = await exchangeRateService.getExchangeRateMetadata();
    
    // Format and return the response with both rate and metadata
    const response = {
      rate: result.rate,
      timestamp: result.timestamp ? formatDateISO(result.timestamp) : null,
      lastCacheRefreshTime: formatDateISO(metadata.lastCacheRefreshTime),
      lastApiUpdateTime: metadata.lastApiUpdateTime ? formatDateISO(metadata.lastApiUpdateTime) : null,
      nextCacheRefreshTime: formatDateISO(metadata.nextCacheRefreshTime),
      fromCache: metadata.fromCache,
      time_last_update_utc: metadata.time_last_update_utc,
      time_next_update_utc: metadata.time_next_update_utc
    };
    
    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error(`Error fetching rate for ${params.source} to ${params.target}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch exchange rate for ${params.source} to ${params.target}` },
      { status: 500 }
    );
  }
}

// Ensure this route is dynamically rendered
export const dynamic = 'force-dynamic'; 