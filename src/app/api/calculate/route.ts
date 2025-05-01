// API types for the request and response
interface CalculateRequestBody {
  initialAmountUSD: number;
  exchangeRate: number;
  reductions: string; // Comma-separated percentages
}

interface CalculationStep {
  step: number;
  initialBRL: number;
  reductionPercentage: number;
  reductionAmountBRL: number;
  finalBRL: number;
}

interface CalculateSuccessResponse {
  steps: CalculationStep[];
  initialBRLNoReduction: number;
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body: CalculateRequestBody = await request.json();
    
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
      
      // Add step to results
      steps.push({
        step: i + 1,
        initialBRL,
        reductionPercentage,
        reductionAmountBRL,
        finalBRL
      });
      
      // Update current balance for next step
      currentBalanceBRL = finalBRL;
    }
    
    // Return success response
    return new Response(
      JSON.stringify({
        steps,
        initialBRLNoReduction
      } as CalculateSuccessResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Handle unexpected errors
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 