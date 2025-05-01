// API types for the request and response
interface InputCalculationStep {
  description: string; // e.g., "Valor inicial", "- 1%", "- 6.4% do restante"
  type: 'initial' | 'exchange_rate' | 'percentage_reduction' | 'fixed_reduction' | 'addition' | 'custom'; // Type of operation
  value: number; // Value associated with the type (e.g., 5.673, 1, 6.4)
  explanation?: string; // Optional user explanation
}

interface CalculateRequestBody {
  initialAmountUSD?: number; // Optional for backward compatibility
  exchangeRate?: number; // Optional for backward compatibility
  reductions?: string; // Optional for backward compatibility
  steps?: InputCalculationStep[]; // New field for detailed calculation steps
}

interface CalculationStep {
  step: number;
  description: string;
  calculation_details: string; // e.g., "17019.00 * 0.01 = 170.19"
  result_intermediate: number; // Result of this step's calculation, e.g., 170.19
  result_running_total: number; // Balance after this step, e.g., 16848.81
  explanation?: string;
}

interface CalculateSuccessResponse {
  steps: CalculationStep[];
  initialBRLNoReduction?: number; // For backward compatibility
  final_result: number; // The final running total after all steps
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body: CalculateRequestBody = await request.json();
    
    // Handle both old and new request formats
    if (body.steps && body.steps.length > 0) {
      // New format with detailed steps
      return handleDetailedCalculation(body);
    } else if (body.initialAmountUSD && body.exchangeRate && body.reductions) {
      // Old format with simple reductions
      return handleSimpleCalculation(body);
    } else {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    // Handle unexpected errors
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Handler for the new detailed calculation format
async function handleDetailedCalculation(body: CalculateRequestBody): Promise<Response> {
  if (!body.steps || body.steps.length === 0) {
    return new Response(
      JSON.stringify({ error: "No calculation steps provided" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Process each step sequentially
    const processedSteps: CalculationStep[] = [];
    let runningTotal = 0;

    for (let i = 0; i < body.steps.length; i++) {
      const inputStep = body.steps[i];
      let resultIntermediate = 0;
      let calculationDetails = '';

      // Process different step types
      switch (inputStep.type) {
        case 'initial':
          // For initial value steps
          resultIntermediate = inputStep.value;
          calculationDetails = `Initial value: ${resultIntermediate.toFixed(2)}`;
          runningTotal = resultIntermediate;
          break;

        case 'exchange_rate':
          // For exchange rate calculation
          if (runningTotal === 0) {
            return new Response(
              JSON.stringify({ error: "Exchange rate step requires a previous initial value step" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }
          const previousValue = runningTotal;
          resultIntermediate = inputStep.value * previousValue;
          calculationDetails = `${previousValue.toFixed(2)} × ${inputStep.value.toFixed(3)} = ${resultIntermediate.toFixed(2)}`;
          runningTotal = resultIntermediate;
          break;

        case 'percentage_reduction':
          // For percentage reduction (e.g., tax, fee)
          if (runningTotal === 0) {
            return new Response(
              JSON.stringify({ error: "Percentage reduction step requires a previous value step" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }
          const percentDecimal = inputStep.value / 100;
          resultIntermediate = runningTotal * percentDecimal;
          calculationDetails = `${runningTotal.toFixed(2)} × ${percentDecimal} = ${resultIntermediate.toFixed(2)}`;
          runningTotal -= resultIntermediate;
          break;

        case 'fixed_reduction':
          // For fixed value reduction
          if (runningTotal === 0) {
            return new Response(
              JSON.stringify({ error: "Fixed reduction step requires a previous value step" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }
          resultIntermediate = inputStep.value;
          calculationDetails = `Fixed reduction: ${resultIntermediate.toFixed(2)}`;
          runningTotal -= resultIntermediate;
          break;

        case 'addition':
          // For addition steps
          resultIntermediate = inputStep.value;
          calculationDetails = `Addition: ${resultIntermediate.toFixed(2)}`;
          runningTotal += resultIntermediate;
          break;

        case 'custom':
          // For custom formula steps (simplified implementation)
          resultIntermediate = inputStep.value; // Assuming value contains the pre-calculated result
          calculationDetails = `Custom calculation: ${resultIntermediate.toFixed(2)}`;
          runningTotal = resultIntermediate;
          break;

        default:
          return new Response(
            JSON.stringify({ error: `Unknown step type: ${inputStep.type}` }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
      }

      // Negative balance check
      if (runningTotal < 0) {
        return new Response(
          JSON.stringify({ error: `Step ${i + 1} would result in a negative value (${runningTotal.toFixed(2)})` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Add processed step
      processedSteps.push({
        step: i + 1,
        description: inputStep.description,
        calculation_details: calculationDetails,
        result_intermediate: resultIntermediate,
        result_running_total: runningTotal,
        explanation: inputStep.explanation
      });
    }

    // Return success response
    return new Response(
      JSON.stringify({
        steps: processedSteps,
        final_result: runningTotal
      } as CalculateSuccessResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error processing calculation steps" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Handler for the original simple calculation format (preserve backward compatibility)
async function handleSimpleCalculation(body: CalculateRequestBody): Promise<Response> {
  // Validate input
  if (!body.initialAmountUSD || !body.exchangeRate || !body.reductions) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  
  // Validate initial amount and exchange rate are positive
  if (body.initialAmountUSD <= 0 || body.exchangeRate <= 0) {
    return new Response(
      JSON.stringify({ error: "Initial amount and exchange rate must be positive numbers" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  
  // Parse and validate reductions
  const reductionPercentages = body.reductions
    .split(',')
    .map(percentage => percentage.trim())
    .filter(percentage => percentage.length > 0)
    .map(percentage => parseFloat(percentage));
  
  // Check if all reductions are valid numbers
  if (reductionPercentages.some(isNaN)) {
    return new Response(
      JSON.stringify({ error: "All reductions must be valid numbers" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  
  // Check if all reductions are between 0 and 100
  if (reductionPercentages.some(percentage => percentage < 0 || percentage > 100)) {
    return new Response(
      JSON.stringify({ error: "All reductions must be between 0 and 100" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  
  // Calculate initial BRL amount
  const initialBRLNoReduction = body.initialAmountUSD * body.exchangeRate;
  
  // Initialize calculation variables
  const steps: CalculationStep[] = [];
  let currentBalanceBRL = initialBRLNoReduction;
  
  // Calculate each reduction step
  for (let i = 0; i < reductionPercentages.length; i++) {
    const reductionPercentage = reductionPercentages[i];
    const initialBRL = currentBalanceBRL;
    const reductionAmountBRL = currentBalanceBRL * (reductionPercentage / 100);
    const finalBRL = currentBalanceBRL - reductionAmountBRL;
    
    // Check if reduction would result in zero or negative value
    if (finalBRL <= 0) {
      return new Response(
        JSON.stringify({ error: "Reduction would result in zero or negative value. Please adjust percentages." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Add step to results with enhanced details for backward compatibility
    steps.push({
      step: i + 1,
      description: `Reduction ${i + 1}: ${reductionPercentage}%`,
      calculation_details: `${initialBRL.toFixed(2)} × ${reductionPercentage/100} = ${reductionAmountBRL.toFixed(2)}`,
      result_intermediate: reductionAmountBRL,
      result_running_total: finalBRL,
      explanation: `Applying ${reductionPercentage}% reduction`
    });
    
    // Update current balance for next step
    currentBalanceBRL = finalBRL;
  }
  
  // Return success response
  return new Response(
    JSON.stringify({
      steps,
      initialBRLNoReduction,
      final_result: currentBalanceBRL
    } as CalculateSuccessResponse),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
} 