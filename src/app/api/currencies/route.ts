import { NextResponse } from 'next/server';
import { CurrencyRegistry } from '../../../application/currency/currencyRegistry.service';

// Create an instance of the currency registry
const currencyRegistry = new CurrencyRegistry();

/**
 * GET handler for the /api/currencies endpoint
 * Returns a list of all available currencies
 */
export async function GET() {
  try {
    const currencies = currencyRegistry.getAllCurrencies();
    return NextResponse.json({ currencies }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving currencies:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve currencies' },
      { status: 500 }
    );
  }
}

// Ensure this route is dynamically rendered
export const dynamic = 'force-dynamic'; 