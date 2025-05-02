import { NextRequest, NextResponse } from 'next/server';
import { CurrencyConverterService } from '../../../application/currency-converter/currencyConverterService';

// Create an instance of the currency converter service
const currencyConverterService = new CurrencyConverterService();

export async function GET(request: NextRequest) {
  try {
    // Get the amount parameter from the URL
    const searchParams = request.nextUrl.searchParams;
    const amount = searchParams.get('amount');
    
    // Validate the amount parameter
    if (!amount) {
      return NextResponse.json(
        { error: 'Missing required parameter: amount' },
        { status: 400 }
      );
    }
    
    // Convert amount to number
    const numericAmount = parseFloat(amount);
    
    if (isNaN(numericAmount)) {
      return NextResponse.json(
        { error: 'Invalid amount: must be a valid number' },
        { status: 400 }
      );
    }
    
    // Convert the amount
    const convertedAmount = await currencyConverterService.convertUsdToBrl(numericAmount);
    
    // Return the converted amount with caching headers
    return NextResponse.json(
      { 
        from: 'USD',
        to: 'BRL',
        amount: numericAmount,
        convertedAmount,
      },
      {
        headers: {
          // Cache for 1 hour on CDN, allow serving stale for up to 1 minute while revalidating
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
        }
      }
    );
  } catch (error: any) {
    console.error("[API /api/currency-converter Error]:", error.message);
    
    // Return appropriate error message to the client
    return NextResponse.json(
      { error: error.message || 'Failed to convert currency. Please try again later.' },
      { status: 500 }
    );
  }
}

// Ensure this route is dynamically rendered to respect revalidation
export const dynamic = 'force-dynamic'; 