import { NextResponse } from 'next/server';
import { ExchangeRateService } from '../../../application/currency/exchangeRate.service';
import { ExchangeRateRepository } from '../../../infrastructure/exchange-rate/exchangeRateRepository';
import { formatDateISO } from '../../../utils/dateUtils';

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
    // First, ensure we have fresh data by fetching a rate which will update the metadata
    // We need to use the repository directly since the exchangeRate.service doesn't have fetchUsdBrlRate
    await exchangeRateRepository.getUsdToBrlRate();
    console.log('Fetched USD/BRL rate before getting metadata');
    
    // Now get the metadata which should include the timestamps from the API
    const metadata = await exchangeRateService.getExchangeRateMetadata();
    
    // Log the metadata for debugging
    console.log('Exchange rate metadata:', {
      lastApiUpdateTime: metadata.lastApiUpdateTime,
      time_last_update_utc: metadata.time_last_update_utc,
      time_next_update_utc: metadata.time_next_update_utc
    });
    
    // Format dates using date-fns utility and include UTC strings for response
    const response = {
      lastApiUpdateTime: metadata.lastApiUpdateTime ? formatDateISO(metadata.lastApiUpdateTime) : null,
      lastCacheRefreshTime: formatDateISO(metadata.lastCacheRefreshTime),
      nextCacheRefreshTime: formatDateISO(metadata.nextCacheRefreshTime),
      fromCache: metadata.fromCache,
      // Add the UTC strings directly from the metadata
      time_last_update_utc: metadata.time_last_update_utc,
      time_next_update_utc: metadata.time_next_update_utc
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