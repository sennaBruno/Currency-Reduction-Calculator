import { ApiService } from './api';
import { 
  InputStep, 
  DetailedCalculationResult, 
  SimpleCalculationResult
} from '../types/calculator';

export type { InputStep };

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