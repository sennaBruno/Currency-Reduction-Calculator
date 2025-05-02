import { NextResponse } from 'next/server';
import { ExchangeRateService } from '../../../application/currency/exchangeRate.service';
import { ExchangeRateRepository } from '../../../infrastructure/exchange-rate/exchangeRateRepository';

// Create instances of the required services
// Use repository pattern with configurable provider and caching
const exchangeRateRepository = new ExchangeRateRepository(undefined, {
  cacheTTL: process.env.EXCHANGE_RATE_CACHE_TTL 
    ? parseInt(process.env.EXCHANGE_RATE_CACHE_TTL, 10) 
    : 3600, // Default to 1 hour
  cacheTag: 'api-exchange-rate-metadata',
  apiProvider: process.env.EXCHANGE_RATE_API_PROVIDER as 'default' | 'external' || 'default'
});
const exchangeRateService = new ExchangeRateService(exchangeRateRepository);

/**
 * GET handler for the /api/exchange-rate-metadata endpoint
 * Returns metadata about exchange rate updates, including
 * when rates were last updated by the API source
 */
export async function GET() {
  try {
    const metadata = await exchangeRateService.getExchangeRateMetadata();
    
    // Format dates for response
    const response = {
      lastApiUpdateTime: metadata.lastApiUpdateTime ? metadata.lastApiUpdateTime.toISOString() : null,
      lastCacheRefreshTime: metadata.lastCacheRefreshTime.toISOString(),
      nextCacheRefreshTime: metadata.nextCacheRefreshTime.toISOString(),
      fromCache: metadata.fromCache
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error retrieving exchange rate metadata:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve exchange rate metadata' },
      { status: 500 }
    );
  }
}

// Ensure this route is dynamically rendered
export const dynamic = 'force-dynamic'; 