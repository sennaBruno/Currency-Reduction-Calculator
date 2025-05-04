import { useState } from 'react';
import { CalculatorService, DetailedCalculationResult, SimpleCalculationResult } from '@/services';
import { InputStep } from '@/types/calculator';
import { ICurrency } from '@/domain/currency/currency.interface';
import { formatCurrencyForText } from '@/domain/currency/currencyConversion.utils';
import { useAppDispatch } from '@/store/hooks';
import { setError as setResultsError, clearResults } from '@/store/slices/resultsSlice';

// Local interface for form inputs
interface FormInputs {
  initialAmountUSD: number;
  reductions: string;
}

// API error response interface
interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

export function useCalculator(exchangeRate: number | null) {
  const dispatch = useAppDispatch();
  
  // State for calculation results
  const [calculationResult, setCalculationResult] = useState<SimpleCalculationResult | null>(null);
  const [detailedResult, setDetailedResult] = useState<DetailedCalculationResult | null>(null);
  
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [formInputs, setFormInputs] = useState<FormInputs | null>(null);
  const [calculationMode, setCalculationMode] = useState<'simple' | 'detailed'>('simple');

  // Function to scroll to top of page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleTraditionalCalculate = async (data: { 
    initialAmount: number;
    exchangeRate: number;
    reductions: string;
    sourceCurrency: ICurrency;
    targetCurrency: ICurrency;
  }) => {
    const rateToUse = data.exchangeRate;
    
    setIsLoading(true);
    setError(undefined);
    if (error) {
      dispatch(setResultsError(error));
    } else {
      dispatch(setResultsError(''));
    }
    setCalculationMode('simple');

    setFormInputs({ 
      initialAmountUSD: data.initialAmount, 
      reductions: data.reductions 
    });

    try {
      const result = await CalculatorService.processSimpleCalculation(
        data.initialAmount,   
        rateToUse,           
        data.reductions      
      );
      
      setCalculationResult(result);
      setDetailedResult(null);
      setError(undefined);
      scrollToTop();
    } catch (error: Error | unknown) {
      console.error("Calculation error:", error);
      let errorMessage = 'Failed to perform calculation';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as ApiErrorResponse;
        if (errorObj.response?.data?.error) {
          errorMessage = errorObj.response.data.error;
        }
      }
      
      setError(errorMessage);
      dispatch(setResultsError(errorMessage));
      setCalculationResult(null);
      setDetailedResult(null);
      scrollToTop(); // Scroll to top to show error
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailedCalculate = async (data: { 
    steps: InputStep[];
    sourceCurrency: ICurrency;
    targetCurrency: ICurrency;
  }) => {
    setIsLoading(true);
    setError(undefined);
    if (error) {
      dispatch(setResultsError(error));
    } else {
      dispatch(setResultsError(''));
    }
    setCalculationMode('detailed');

    try {
      const result = await CalculatorService.processDetailedCalculation(data.steps);
      
      setDetailedResult(result);
      setCalculationResult(null);
      setError(undefined);
      scrollToTop();
    } catch (error: Error | unknown) {
      console.error("Calculation error:", error);
      let errorMessage = 'Failed to perform calculation';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const errorObj = error as ApiErrorResponse;
        if (errorObj.response?.data?.error) {
          errorMessage = errorObj.response.data.error;
        }
      }
      
      setError(errorMessage);
      dispatch(setResultsError(errorMessage));
      setCalculationResult(null);
      setDetailedResult(null);
      scrollToTop(); // Scroll to top to show error
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCalculationResult(null);
    setDetailedResult(null);
    setError(undefined);
    dispatch(setResultsError(''));
    dispatch(clearResults());
    setFormInputs(null);
  };
  
  const formatTraditionalResultsAsText = (): string => {
    if (!calculationResult || !formInputs || exchangeRate === null || exchangeRate === 0) return '';
    
    let text = "Cálculo de Redução de Moeda\n\n";
    
    text += "== Entradas ==\n";
    text += `Valor Inicial (USD): ${formatCurrencyForText(formInputs.initialAmountUSD, 'USD')}\n`;
    text += `Taxa de Câmbio (BRL/USD): ${exchangeRate.toFixed(4)}\n`;
    text += `Reduções (%): ${formInputs.reductions}\n\n`;
    
    text += "== Resultado Passo a Passo (BRL) ==\n";
    text += `Valor Inicial (BRL): ${formatCurrencyForText(calculationResult.initialBRLNoReduction, 'BRL')}\n\n`;
    
    calculationResult.steps.forEach(step => {
      text += `--- Passo ${step.step} (${step.reductionPercentage?.toFixed(2)}%) ---\n`;
      text += `Valor Antes: ${formatCurrencyForText(step.initialBRL || 0, 'BRL')}\n`;
      text += `Redução: ${formatCurrencyForText(step.reductionAmountBRL || 0, 'BRL')}\n`;
      text += `Valor Depois: ${formatCurrencyForText(step.finalBRL || 0, 'BRL')}\n\n`;
    });
    
    return text;
  };

  const formatDetailedResultsAsText = (): string => {
    if (!detailedResult) return '';
    
    let text = "Cálculo Detalhado\n\n";
    
    text += "== Resultado Passo a Passo ==\n\n";
    
    detailedResult.steps.forEach(step => {
      text += `--- Passo ${step.step}: ${step.description} ---\n`;
      if (step.explanation) {
        text += `Explicação: ${step.explanation}\n`;
      }
      text += `Cálculo: ${step.calculation_details}\n`;
      text += `Resultado deste passo: ${formatCurrencyForText(step.result_intermediate, 'BRL')}\n`;
      text += `Total acumulado: ${formatCurrencyForText(step.result_running_total, 'BRL')}\n\n`;
    });
    
    text += `Valor final após todos os cálculos: ${formatCurrencyForText(detailedResult.final_result, 'BRL')}\n`;
    
    return text;
  };
  
  const handleDownload = () => {
    let textContent = '';
    
    if (calculationMode === 'simple' && calculationResult) {
      textContent = formatTraditionalResultsAsText();
    } else if (calculationMode === 'detailed' && detailedResult) {
      textContent = formatDetailedResultsAsText();
    } else {
      return; // Nothing to download
    }
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'calculo-resultado.txt';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    calculationResult,
    detailedResult,
    error,
    isLoading,
    formInputs,
    calculationMode,
    handleTraditionalCalculate,
    handleDetailedCalculate,
    handleReset,
    handleDownload
  };
} 