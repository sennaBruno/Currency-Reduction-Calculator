import { ICalculationResult, ICalculationStep, ICalculatorService } from '../../domain/calculator/calculatorService.interface';
import { ICurrency } from '../../domain/currency';

/**
 * Service class for calculator operations
 */
export class CalculatorService implements ICalculatorService {
  /**
   * Processes a detailed calculation with multiple steps
   * @param steps The calculation steps to process
   * @param sourceCurrency The source currency
   * @param targetCurrency The target currency
   * @returns The calculation results with intermediate and final values
   */
  async processDetailedCalculation(
    steps: ICalculationStep[], 
    sourceCurrency?: ICurrency,
    targetCurrency?: ICurrency
  ): Promise<{
    steps: ICalculationResult[];
    final_result: number;
  }> {
    if (!steps || steps.length === 0) {
      throw new Error("No calculation steps provided");
    }

    try {
      console.log("[CalculatorService] Processing detailed calculation with steps:", 
        JSON.stringify(steps.map(s => ({type: s.type, value: s.value})))
      );
      
      // Check for initial step
      const hasInitialStep = steps.some(step => step.type === 'initial');
      if (!hasInitialStep) {
        throw new Error("An Initial Value step is required for calculation");
      }
      
      // Process each step sequentially
      const processedSteps: ICalculationResult[] = [];
      let runningTotal = 0;

      for (let i = 0; i < steps.length; i++) {
        const inputStep = steps[i];
        let resultIntermediate = 0;
        let calculationDetails = '';
        
        console.log(`[CalculatorService] Processing step ${i+1}: ${inputStep.type}, value: ${inputStep.value}, current total: ${runningTotal}`);

        // Process different step types
        try {
          switch (inputStep.type) {
            case 'initial':
              // For initial value steps
              resultIntermediate = inputStep.value;
              calculationDetails = `Initial value: ${resultIntermediate.toFixed(2)} ${sourceCurrency?.code || 'USD'}`;
              runningTotal = resultIntermediate;
              break;

            case 'exchange_rate':
              // For exchange rate calculation
              if (runningTotal === 0) {
                throw new Error(`Step ${i+1}: Exchange rate step requires a previous initial value step or non-zero running total`);
              }
              const previousValue = runningTotal;
              resultIntermediate = inputStep.value * previousValue;
              calculationDetails = `${previousValue.toFixed(2)} ${sourceCurrency?.code || 'USD'} × ${inputStep.value.toFixed(3)} = ${resultIntermediate.toFixed(2)} ${targetCurrency?.code || 'BRL'}`;
              runningTotal = resultIntermediate;
              break;

            case 'percentage_reduction':
              // For percentage reduction (e.g., tax, fee)
              if (runningTotal === 0) {
                throw new Error(`Step ${i+1}: Percentage reduction step requires a previous value step or non-zero running total`);
              }
              const percentDecimal = inputStep.value / 100;
              resultIntermediate = runningTotal * percentDecimal;
              calculationDetails = `${runningTotal.toFixed(2)} × ${percentDecimal} = ${resultIntermediate.toFixed(2)}`;
              runningTotal -= resultIntermediate;
              break;

            case 'fixed_reduction':
              // For fixed value reduction
              if (runningTotal === 0) {
                throw new Error(`Step ${i+1}: Fixed reduction step requires a previous value step or non-zero running total`);
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
              throw new Error(`Step ${i+1}: Unknown step type: ${inputStep.type}`);
          }
        } catch (stepError) {
          console.error(`[CalculatorService] Error processing step ${i+1} of type ${inputStep.type}:`, 
            stepError instanceof Error ? stepError.message : 'Unknown error');
          throw stepError;
        }

        // Negative balance check
        if (runningTotal < 0) {
          throw new Error(`Step ${i + 1} would result in a negative value (${runningTotal.toFixed(2)})`);
        }

        console.log(`[CalculatorService] Step ${i+1} result: ${resultIntermediate}, new running total: ${runningTotal}`);

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
      return {
        steps: processedSteps,
        final_result: runningTotal
      };
    } catch (error: Error | unknown) {
      console.error('[CalculatorService] Error processing detailed calculation:', 
        error instanceof Error ? error.message : 'Unknown error');
      throw error; // Return the original error for better debugging
    }
  }

  /**
   * Processes a simple calculation with initial amount, exchange rate and percentage reductions
   * @param initialAmount The initial amount in the source currency
   * @param exchangeRate The exchange rate between source and target currencies
   * @param reductions A comma-separated string of percentage reductions
   * @param sourceCurrency The source currency
   * @param targetCurrency The target currency
   * @returns The calculation results with intermediate and final values
   */
  async processSimpleCalculation(
    initialAmount: number,
    exchangeRate: number,
    reductions: string,
    sourceCurrency?: ICurrency,
    targetCurrency?: ICurrency
  ): Promise<{
    steps: ICalculationResult[];
    initialBRLNoReduction: number;
    final_result: number;
  }> {
    // Validate input
    if (!initialAmount || !exchangeRate) {
      throw new Error("Missing required fields");
    }
    
    // Validate initial amount and exchange rate are positive
    if (initialAmount <= 0 || exchangeRate <= 0) {
      throw new Error("Initial amount and exchange rate must be positive numbers");
    }
    
    // Parse and validate reductions
    const reductionPercentages = !reductions ? [] : reductions
      .split(',')
      .map(percentage => percentage.trim())
      .filter(percentage => percentage.length > 0)
      .map(percentage => parseFloat(percentage));
    
    // Check if all reductions are valid numbers
    if (reductionPercentages.some(isNaN)) {
      throw new Error("All reductions must be valid numbers");
    }
    
    // Check if all reductions are between 0 and 100
    if (reductionPercentages.some(percentage => percentage < 0 || percentage > 100)) {
      throw new Error("All reductions must be between 0 and 100");
    }
    
    // Calculate initial target currency amount
    const initialTargetAmount = initialAmount * exchangeRate;
    
    // Initialize calculation variables
    const steps: ICalculationResult[] = [];
    let currentBalance = initialTargetAmount;
    
    try {
      // If no reductions, return the direct conversion result
      if (reductionPercentages.length === 0) {
        return {
          steps: [],
          initialBRLNoReduction: initialTargetAmount,
          final_result: initialTargetAmount
        };
      }
      
      // Calculate each reduction step
      for (let i = 0; i < reductionPercentages.length; i++) {
        const reductionPercentage = reductionPercentages[i];
        const initialValue = currentBalance;
        const reductionAmount = currentBalance * (reductionPercentage / 100);
        const finalValue = currentBalance - reductionAmount;
        
        // Check if reduction would result in zero or negative value
        if (finalValue <= 0) {
          throw new Error("Reduction would result in zero or negative value. Please adjust percentages.");
        }
        
        // Add step to results with enhanced details for backward compatibility
        steps.push({
          step: i + 1,
          initialBRL: initialValue, // For backward compatibility
          reductionPercentage: reductionPercentage,
          reductionAmountBRL: reductionAmount, // For backward compatibility
          finalBRL: finalValue, // For backward compatibility
          description: `Reduction ${i + 1}: ${reductionPercentage}%`,
          calculation_details: `${initialValue.toFixed(2)} ${targetCurrency?.code || 'BRL'} - ${reductionPercentage}% = ${finalValue.toFixed(2)} ${targetCurrency?.code || 'BRL'}`,
          result_intermediate: reductionAmount,
          result_running_total: finalValue
        });
        
        // Update balance for next step
        currentBalance = finalValue;
      }
      
      // Return the calculation result
      return {
        steps,
        initialBRLNoReduction: initialTargetAmount,
        final_result: currentBalance
      };
    } catch (error: Error | unknown) {
      console.error('[CalculatorService] Error processing simple calculation:', 
        error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
} 