/**
 * Input calculation step from API request
 */
export interface ICalculationStep {
  description: string;
  type: 'initial' | 'exchange_rate' | 'percentage_reduction' | 'fixed_reduction' | 'addition' | 'custom';
  value: number;
  explanation?: string;
}

/**
 * Calculation step with processed results
 */
export interface ICalculationResult {
  step: number;
  description: string;
  calculation_details: string;
  result_intermediate: number;
  result_running_total: number;
  explanation?: string;
  // Legacy properties for backward compatibility
  initialBRL?: number;
  reductionPercentage?: number;
  reductionAmountBRL?: number;
  finalBRL?: number;
}

/**
 * Interface for the calculator service
 */
export interface ICalculatorService {
  /**
   * Processes a detailed calculation with multiple steps
   * @param steps The calculation steps to process
   * @returns The calculation results with intermediate and final values
   */
  processDetailedCalculation(steps: ICalculationStep[]): Promise<{
    steps: ICalculationResult[];
    final_result: number;
  }>;
  
  /**
   * Processes a simple calculation with USD amount, exchange rate and percentage reductions
   * @param initialAmountUSD The initial amount in USD
   * @param exchangeRate The USD to BRL exchange rate
   * @param reductions A comma-separated string of percentage reductions
   * @returns The calculation results with intermediate and final values
   */
  processSimpleCalculation(
    initialAmountUSD: number,
    exchangeRate: number,
    reductions: string
  ): Promise<{
    steps: ICalculationResult[];
    initialBRLNoReduction: number;
    final_result: number;
  }>;
} 