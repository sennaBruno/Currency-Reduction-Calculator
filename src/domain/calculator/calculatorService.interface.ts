import { 
  InputStep, 
  LegacyCalculationStep,
  DetailedCalculationResult,
  SimpleCalculationResult
} from '@/types/calculator';

/**
 * Input calculation step from API request - reexported from centralized types
 */
export type ICalculationStep = InputStep;

/**
 * Calculation step with processed results
 */
export type ICalculationResult = LegacyCalculationStep;

/**
 * Interface for the calculator service
 */
export interface ICalculatorService {
  /**
   * Processes a detailed calculation with multiple steps
   * @param steps The calculation steps to process
   * @returns The calculation results with intermediate and final values
   */
  processDetailedCalculation(steps: ICalculationStep[]): Promise<DetailedCalculationResult>;
  
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
  ): Promise<SimpleCalculationResult>;
} 