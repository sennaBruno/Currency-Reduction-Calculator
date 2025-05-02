import { ICurrency } from '../domain/currency';

/**
 * Definition of a calculation step for the detailed calculator
 */
export interface InputStep {
  description: string;
  type: 'initial' | 'exchange_rate' | 'percentage_reduction' | 'fixed_reduction' | 'addition' | 'custom';
  value: number;
  explanation?: string;
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