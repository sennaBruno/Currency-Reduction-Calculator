import { NextResponse } from 'next/server';
import { CalculatorService } from '../../../application/calculator/calculatorService';
import { ICalculationStep, ICalculationResult } from '../../../domain/calculator/calculatorService.interface';
import { ICurrency } from '../../../domain/currency';
import { saveCalculation } from '../../../lib/calculations';
import { createClient } from '@/lib/supabase/server';

const calculatorService = new CalculatorService();

interface CalculateRequestBody {
  initialAmountUSD?: number; // Optional for backward compatibility
  exchangeRate?: number; // Optional for backward compatibility
  reductions?: string; // Optional for backward compatibility
  steps?: ICalculationStep[]; // New field for detailed calculation steps
  sourceCurrency?: ICurrency; // Source currency for the calculation
  targetCurrency?: ICurrency; // Target currency for the calculation
  initialAmount?: number; // Initial amount in the source currency
}

const MAX_STEPS = 20;
const MAX_INITIAL_VALUE = 1000000000; // 1 billion
const MAX_EXCHANGE_RATE = 10000;
const MAX_REDUCTIONS = 20;
const MAX_STRING_LENGTH = 500;

const DEFAULT_SOURCE_CURRENCY: ICurrency = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar'
};

const DEFAULT_TARGET_CURRENCY: ICurrency = {
  code: 'BRL',
  symbol: 'R$',
  name: 'Brazilian Real'
};

export async function POST(request: Request) {
  try {
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10000) { // 10KB limit
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }

    let userId: string | undefined = undefined;
    try {
      const supabase = await createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      userId = !userError && userData?.user ? userData.user.id : undefined;
    } catch (authError) {
      console.error('[API /api/calculate Auth Error]:', authError);
    }

    const body: CalculateRequestBody = await request.json();
    
    const sourceCurrency = body.sourceCurrency || DEFAULT_SOURCE_CURRENCY;
    const targetCurrency = body.targetCurrency || DEFAULT_TARGET_CURRENCY;
    
    try {
      if (body.steps && body.steps.length > 0) {

        if (body.steps.length > MAX_STEPS) {
          return NextResponse.json(
            { error: `Too many steps. Maximum allowed: ${MAX_STEPS}` },
            { status: 400 }
          );
        }
        
        for (const step of body.steps) {
          if (
            (step.description && step.description.length > MAX_STRING_LENGTH) || 
            (step.explanation && step.explanation.length > MAX_STRING_LENGTH)
          ) {
            return NextResponse.json(
              { error: "Text fields are too long" },
              { status: 400 }
            );
          }
          
          if (step.type === 'initial' && (step.value <= 0 || step.value > MAX_INITIAL_VALUE)) {
            return NextResponse.json(
              { error: `Invalid initial value. Must be between 0 and ${MAX_INITIAL_VALUE}` },
              { status: 400 }
            );
          }
          
          if (step.type === 'exchange_rate' && (step.value <= 0 || step.value > MAX_EXCHANGE_RATE)) {
            return NextResponse.json(
              { error: `Invalid exchange rate. Must be between 0 and ${MAX_EXCHANGE_RATE}` },
              { status: 400 }
            );
          }
          
          if (step.type === 'percentage_reduction' && (step.value < 0 || step.value > 100)) {
            return NextResponse.json(
              { error: "Invalid percentage. Must be between 0 and 100" },
              { status: 400 }
            );
          }
          
          if (step.type === 'fixed_reduction' && Math.abs(step.value) > MAX_INITIAL_VALUE) {
            return NextResponse.json(
              { error: `Fixed reduction value too large. Maximum: ${MAX_INITIAL_VALUE}` },
              { status: 400 }
            );
          }
          
          if (step.type === 'addition' && Math.abs(step.value) > MAX_INITIAL_VALUE) {
            return NextResponse.json(
              { error: `Addition value too large. Maximum: ${MAX_INITIAL_VALUE}` },
              { status: 400 }
            );
          }
        }
        
        const hasInitialStep = body.steps.some(step => step.type === 'initial');
        if (!hasInitialStep) {
          return NextResponse.json(
            { error: "An Initial Value step is required for detailed calculations" },
            { status: 400 }
          );
        }
        
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
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Calculation timeout')), 5000) // 5 second timeout
        );
        
        try {
          const result = await Promise.race([
            calculatorService.processDetailedCalculation(body.steps, sourceCurrency, targetCurrency),
            timeoutPromise
          ]) as { steps: ICalculationResult[]; final_result: number };
          
          try {
            const initialStep = body.steps.find(step => step.type === 'initial');
            const initialAmount = initialStep ? initialStep.value : 0;
            
            await saveCalculation({
              initialAmount,
              finalAmount: result.final_result,
              currencyCode: targetCurrency.code,
              title: `Calculation (${new Date().toISOString().split('T')[0]})`,
              steps: result.steps.map((step: ICalculationResult) => ({
                order: step.step,
                description: step.description,
                calculationDetails: step.calculation_details,
                resultIntermediate: step.result_intermediate,
                resultRunningTotal: step.result_running_total,
                explanation: step.explanation,
                stepType: body.steps?.[step.step - 1]?.type || 'unknown'
              })),
              userId
            });
          } catch (dbError) {
            console.error('[API /api/calculate DB Error]:', dbError);
          }
          
          return NextResponse.json({
            ...(result as object),
            sourceCurrency,
            targetCurrency
          }, { status: 200 });
        } catch (timeoutError) {
          if (timeoutError instanceof Error && timeoutError.message === 'Calculation timeout') {
            return NextResponse.json(
              { error: "Calculation took too long. Please simplify your request." },
              { status: 408 }
            );
          }
          throw timeoutError; // Re-throw if it's not a timeout error
        }
      } else if (
        (body.initialAmountUSD !== undefined || body.initialAmount !== undefined) && 
        body.exchangeRate
      ) {
        const initialAmount = body.initialAmount !== undefined 
          ? body.initialAmount 
          : body.initialAmountUSD;
        
        if (initialAmount === undefined) {
          return NextResponse.json(
            { error: "Missing initial amount" },
            { status: 400 }
          );
        }
        
        // Validate input values
        if (initialAmount <= 0 || initialAmount > MAX_INITIAL_VALUE) {
          return NextResponse.json(
            { error: `Invalid initial amount. Must be between 0 and ${MAX_INITIAL_VALUE}` },
            { status: 400 }
          );
        }
        
        if (body.exchangeRate <= 0 || body.exchangeRate > MAX_EXCHANGE_RATE) {
          return NextResponse.json(
            { error: `Invalid exchange rate. Must be between 0 and ${MAX_EXCHANGE_RATE}` },
            { status: 400 }
          );
        }
        
        // Only validate reductions if they're provided
        if (body.reductions) {
          if (body.reductions.length > MAX_STRING_LENGTH) {
            return NextResponse.json(
              { error: "Reductions string too long" },
              { status: 400 }
            );
          }
          
          // Validate reductions format and count
          const reductionsArray = body.reductions.split(',')
            .map(r => r.trim())
            .filter(r => r !== '');
          
          if (reductionsArray.length > MAX_REDUCTIONS) {
            return NextResponse.json(
              { error: `Too many reductions. Maximum allowed: ${MAX_REDUCTIONS}` },
              { status: 400 }
            );
          }
          
          // Validate each reduction percentage
          for (const reduction of reductionsArray) {
            const value = Number(reduction);
            if (isNaN(value) || value < 0 || value > 100) {
              return NextResponse.json(
                { error: "Invalid reduction percentage. Must be between 0 and 100" },
                { status: 400 }
              );
            }
          }
        }
        
        const result = await calculatorService.processSimpleCalculation(
          initialAmount,
          body.exchangeRate,
          body.reductions || '',
          sourceCurrency,
          targetCurrency
        );
        
        try {
          await saveCalculation({
            initialAmount,
            finalAmount: result.final_result,
            currencyCode: targetCurrency.code,
            title: `Simple Calculation (${new Date().toISOString().split('T')[0]})`,
            steps: result.steps.map((step, index) => ({
              order: step.step,
              description: step.description,
              calculationDetails: step.calculation_details,
              resultIntermediate: step.result_intermediate,
              resultRunningTotal: step.result_running_total,
              explanation: step.explanation,
              stepType: index === 0 ? 'initial' : 
                       index === 1 ? 'exchange_rate' : 'percentage_reduction'
            })),
            userId
          });
        } catch (dbError) {
          console.error('[API /api/calculate DB Error]:', dbError);
        }
        
        return NextResponse.json({
          ...result,
          sourceCurrency,
          targetCurrency
        }, { status: 200 });
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