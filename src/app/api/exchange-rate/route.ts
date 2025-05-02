import { NextResponse } from 'next/server';
import { ExchangeRateService } from '../../../application/exchange-rate/exchangeRateService';
import { ExchangeRateRepository } from '../../../infrastructure/exchange-rate/exchangeRateRepository';

// Create an instance of the exchange rate service with the repository to leverage caching
const exchangeRateRepository = new ExchangeRateRepository(undefined, {
  cacheTTL: process.env.EXCHANGE_RATE_CACHE_TTL 
    ? parseInt(process.env.EXCHANGE_RATE_CACHE_TTL, 10) 
    : 1800, // Default to 30 minutes for USD/BRL rate
  cacheTag: 'api-exchange-rate-usd-brl'
});
const exchangeRateService = new ExchangeRateService(exchangeRateRepository);

export async function GET() {
  try {
    // Get the exchange rate using the service
    const rate = await exchangeRateService.fetchUsdBrlRate();
    
    // Return the rate with caching headers
    return NextResponse.json(
      { rate },
      {
        headers: {
          // Cache for 1 hour on CDN, allow serving stale for up to 1 minute while revalidating
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
        }
      }
    );
  } catch (error: Error | unknown) {
    // Log the error with API endpoint context
    console.error("[API /api/exchange-rate Error]: Failed to get rate.", 
      error instanceof Error ? error.message : 'Unknown error');

    // Return a generic error message to the client
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate. Please try again later or contact support.' },
      { status: 500 } // Internal Server Error
    );
  }
}

// Ensure this route is dynamically rendered to respect revalidation
export const dynamic = 'force-dynamic'; 