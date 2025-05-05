import { ICurrency } from '@/domain/currency/currency.interface';

/**
 * Input step used in calculator forms
 */
export interface InputStep {
  description: string;
  type: 'initial' | 'exchange_rate' | 'percentage_reduction' | 'fixed_reduction' | 'addition' | 'custom';
  value: number;
  explanation?: string;
}

/**
 * Base calculation step with processed results
 */
export interface CalculationStep {
  step: number;
  description: string;
  calculation_details: string;
  result_intermediate: number;
  result_running_total: number;
  explanation?: string;
}

/**
 * Legacy calculation step with additional fields for backward compatibility
 */
export interface LegacyCalculationStep extends CalculationStep {
  initialBRL?: number;
  reductionPercentage?: number; 
  reductionAmountBRL?: number; 
  finalBRL?: number;
}

/**
 * Detailed calculation step stored in the database
 */
export interface DatabaseCalculationStep {
  id: string;
  order: number;
  description: string;
  calculationDetails: string;
  resultIntermediate: number;
  resultRunningTotal: number;
  explanation?: string | null;
  stepType: string;
}

/**
 * Calculation entity stored in the database
 */
export interface DatabaseCalculation {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  initialAmount: number;
  finalAmount: number;
  currencyCode: string;
  title?: string | null;
  userId?: string | null;
  steps: DatabaseCalculationStep[];
}

/**
 * Result of a detailed calculation with multiple steps
 */
export interface DetailedCalculationResult {
  steps: CalculationStep[];
  final_result: number;
}

/**
 * Result of a simple calculation with USD-BRL conversion
 */
export interface SimpleCalculationResult {
  steps: LegacyCalculationStep[];
  initialBRLNoReduction: number;
  final_result: number;
}

/**
 * Props for results display components
 */
export interface BaseResultsDisplayProps {
  error?: string;
  onDownload?: () => void;
  sourceCurrency?: ICurrency;
  targetCurrency?: ICurrency;
}

/**
 * Props for traditional results display
 */
export interface ResultsDisplayProps extends BaseResultsDisplayProps {
  steps: LegacyCalculationStep[];
  initialBRLNoReduction: number;
}

/**
 * Props for detailed results display
 */
export interface DetailedResultsDisplayProps extends BaseResultsDisplayProps {
  steps: CalculationStep[];
  final_result: number;
}

/**
 * Options for step types in the detailed calculator
 */
export const stepTypeOptions = [
  { value: 'initial', label: 'Initial Value (Required)' },
  { value: 'exchange_rate', label: 'Exchange Rate' },
  { value: 'percentage_reduction', label: 'Percentage Reduction' },
  { value: 'fixed_reduction', label: 'Fixed Reduction' },
  { value: 'addition', label: 'Addition' },
  { value: 'custom', label: 'Custom' },
];

/**
 * Gets a placeholder description for a step type
 */
export function getStepDescriptionPlaceholder(type: string, sourceCurrency?: ICurrency, targetCurrency?: ICurrency): string {
  const sourceCode = sourceCurrency?.code || 'USD';
  const targetCode = targetCurrency?.code || 'BRL';
  
  switch (type) {
    case 'initial': return `Initial value in ${sourceCode}`;
    case 'exchange_rate': return `Converting ${sourceCode} to ${targetCode}`;
    case 'percentage_reduction': return '- 1% (tax)';
    case 'fixed_reduction': return 'Fixed fee deduction';
    case 'addition': return 'Add bonus';
    case 'custom': return 'Custom calculation';
    default: return 'Step description';
  }
}

/**
 * Gets a placeholder for the value input based on step type
 */
export function getStepValuePlaceholder(type: string): string {
  switch (type) {
    case 'initial': return 'Enter initial amount (e.g., 3000)';
    case 'exchange_rate': return 'Enter exchange rate (e.g., 5.673)';
    case 'percentage_reduction': return 'Enter percentage (e.g., 1 for 1%)';
    case 'fixed_reduction': return 'Enter fixed amount';
    case 'addition': return 'Enter amount to add';
    case 'custom': return 'Enter custom value';
    default: return 'Enter value';
  }
} 