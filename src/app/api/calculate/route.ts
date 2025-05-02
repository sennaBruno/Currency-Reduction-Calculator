import { NextResponse } from 'next/server';
import { CalculatorService } from '../../../application/calculator/calculatorService';
import { ICalculationStep } from '../../../domain/calculator/calculatorService.interface';

// Create an instance of the calculator service
const calculatorService = new CalculatorService();

// Define API-specific request and response types
interface CalculateRequestBody {
  initialAmountUSD?: number; // Optional for backward compatibility
  exchangeRate?: number; // Optional for backward compatibility
  reductions?: string; // Optional for backward compatibility
  steps?: ICalculationStep[]; // New field for detailed calculation steps
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body: CalculateRequestBody = await request.json();
    
    // Handle both old and new request formats
    try {
      if (body.steps && body.steps.length > 0) {
        // New format with detailed steps
        
        // Validate that there is at least one 'initial' type step
        const hasInitialStep = body.steps.some(step => step.type === 'initial');
        if (!hasInitialStep) {
          return NextResponse.json(
            { error: "An Initial Value step is required for detailed calculations" },
            { status: 400 }
          );
        }
        
        // Check for logical calculation errors before processing
        // For example, an exchange_rate step must come after an initial step
        const initialIndex = body.steps.findIndex(step => step.type === 'initial');
        const hasExchangeRateBeforeInitial = body.steps.some((step, index) => 
          step.type === 'exchange_rate' && index < initialIndex
        );
        
        if (hasExchangeRateBeforeInitial) {
          return NextResponse.json(
            { error: "Exchange rate steps must come after an initial value step" },
            { status: 400 }
          );
        }
        
        // Now process the calculation
        const result = await calculatorService.processDetailedCalculation(body.steps);
        return NextResponse.json(result, { status: 200 });
      } else if (body.initialAmountUSD && body.exchangeRate && body.reductions) {
        // Old format with simple reductions
        const result = await calculatorService.processSimpleCalculation(
          body.initialAmountUSD,
          body.exchangeRate,
          body.reductions
        );
        return NextResponse.json(result, { status: 200 });
      } else {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }
    } catch (error: Error | unknown) {
      // Handle business logic errors
      console.error("[API /api/calculate Error]:", error instanceof Error ? error.message : 'Unknown error');
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Error processing calculation" },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    // Handle request parsing errors
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }
}

// Ensure this route is dynamically rendered
export const dynamic = 'force-dynamic'; 