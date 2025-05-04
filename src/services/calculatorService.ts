import { ApiService } from './api';
import { InputStep } from '../types/calculator';

export type { InputStep };

/**
 * Result of a calculation step
 */
export interface CalculationStep {
  step: number;
  initialBRL?: number;
  reductionPercentage?: number;
  reductionAmountBRL?: number;
  finalBRL?: number;
  description: string;
  calculation_details: string;
  result_intermediate: number;
  result_running_total: number;
  explanation?: string;
}

/**
 * Result of a detailed calculation
 */
export interface DetailedCalculationResult {
  steps: CalculationStep[];
  final_result: number;
}

/**
 * Result of a simple calculation
 */
export interface SimpleCalculationResult {
  steps: CalculationStep[];
  initialBRLNoReduction: number;
  final_result: number;
}

/**
 * Service for calculator operations
 */
export class CalculatorService {
  /**
   * Process a detailed calculation with multiple steps
   * @param steps The steps of the calculation
   * @returns The detailed calculation result
   */
  static async processDetailedCalculation(steps: InputStep[]): Promise<DetailedCalculationResult> {
    try {
      return await ApiService.post<{ steps: InputStep[] }, DetailedCalculationResult>(
        '/api/calculate',
        { steps }
      );
    } catch (error) {
      console.error("Detailed calculation error:", error);
      throw error;
    }
  }

  /**
   * Process a simple currency conversion with reductions
   * @param initialAmountUSD The initial amount in USD
   * @param exchangeRate The USD to BRL exchange rate
   * @param reductions A comma-separated string of percentage reductions
   * @returns The simple calculation result
   */
  static async processSimpleCalculation(
    initialAmountUSD: number,
    exchangeRate: number,
    reductions: string
  ): Promise<SimpleCalculationResult> {
    try {
      return await ApiService.post<
        { initialAmountUSD: number; exchangeRate: number; reductions: string },
        SimpleCalculationResult
      >(
        '/api/calculate',
        { initialAmountUSD, exchangeRate, reductions }
      );
    } catch (error) {
      console.error("Simple calculation error:", error);
      throw error;
    }
  }
} 