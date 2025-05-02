'use client';

import { useState, useEffect } from 'react';
import DetailedInputForm from "@/components/DetailedInputForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import DetailedResultsDisplay from "@/components/DetailedResultsDisplay";
import { InputStep } from "@/components/DetailedStepsInput";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { 
  ExchangeRateService, 
  CalculatorService,
  CalculationStep, 
  DetailedCalculationResult, 
  SimpleCalculationResult 
} from '@/services';

// Local interface for form inputs
interface FormInputs {
  initialAmountUSD: number;
  exchangeRate: number | null;
  reductions: string;
}

export default function Home() {
  // State for calculation results
  const [calculationResult, setCalculationResult] = useState<SimpleCalculationResult | null>(null);
  const [detailedResult, setDetailedResult] = useState<DetailedCalculationResult | null>(null);
  
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [formInputs, setFormInputs] = useState<FormInputs | null>(null);
  const [calculationMode, setCalculationMode] = useState<'simple' | 'detailed'>('simple');

  // State for exchange rate
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [exchangeRateLoading, setExchangeRateLoading] = useState<boolean>(true);
  const [exchangeRateError, setExchangeRateError] = useState<string | null>(null);

  // Fetch exchange rate on mount
  useEffect(() => {
    const fetchRate = async () => {
      setExchangeRateLoading(true);
      setExchangeRateError(null);
      try {
        const rate = await ExchangeRateService.getUsdToBrlRate();
        setExchangeRate(rate);
      } catch (err: any) {
        console.error("Exchange rate fetch error:", err);
        setExchangeRateError(err.message || 'Could not load exchange rate.');
        setExchangeRate(null); // Ensure rate is null on error
      } finally {
        setExchangeRateLoading(false);
      }
    };

    fetchRate();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Updated traditional calculation handler
  const handleTraditionalCalculate = async (data: { 
    initialAmountUSD: number;
    exchangeRate: number; 
    reductions: string;
  }) => {
    // Use the exchange rate from the form data
    // (which may be auto-populated or manually entered)
    const rateToUse = data.exchangeRate;
    
    setIsLoading(true);
    setError(undefined);
    setCalculationMode('simple');

    // Store inputs for download
    const apiPayload = {
      initialAmountUSD: data.initialAmountUSD,
      exchangeRate: rateToUse,
      reductions: data.reductions,
    };
    setFormInputs(apiPayload);

    try {
      const result = await CalculatorService.processSimpleCalculation(
        data.initialAmountUSD,
        rateToUse,
        data.reductions
      );
      
      setCalculationResult(result);
      setDetailedResult(null);
      setError(undefined);
    } catch (error: any) {
      console.error("Calculation error:", error);
      setError(error.message || 'Failed to perform calculation');
      setCalculationResult(null);
      setDetailedResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Detailed calculation handler
  const handleDetailedCalculate = async (data: { steps: InputStep[] }) => {
    setIsLoading(true);
    setError(undefined);
    setCalculationMode('detailed');

    try {
      const result = await CalculatorService.processDetailedCalculation(data.steps);
      
      setDetailedResult(result);
      setCalculationResult(null);
      setError(undefined);
    } catch (error: any) {
      console.error("Calculation error:", error);
      setError(error.message || 'Failed to perform calculation');
      setCalculationResult(null);
      setDetailedResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCalculationResult(null);
    setDetailedResult(null);
    setError(undefined);
    setFormInputs(null);
    // Resetting exchange rate state might not be desired here, 
    // as it should persist unless there's a manual refresh/refetch trigger.
  };
  
  const formatCurrencyForTxt = (value: number, currency: string): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Format results as text for traditional calculation
  const formatTraditionalResultsAsText = (): string => {
    if (!calculationResult || !formInputs || formInputs.exchangeRate === null) return '';
    
    let text = "Cálculo de Redução de Moeda\n\n";
    
    text += "== Entradas ==\n";
    text += `Valor Inicial (USD): ${formatCurrencyForTxt(formInputs.initialAmountUSD, 'USD')}\n`;
    text += `Taxa de Câmbio (BRL/USD): ${formInputs.exchangeRate.toFixed(4)}\n`; // Use fetched rate
    text += `Reduções (%): ${formInputs.reductions}\n\n`;
    
    text += "== Resultado Passo a Passo (BRL) ==\n";
    text += `Valor Inicial (BRL): ${formatCurrencyForTxt(calculationResult.initialBRLNoReduction, 'BRL')}\n\n`;
    
    calculationResult.steps.forEach(step => {
      text += `--- Passo ${step.step} (${step.reductionPercentage?.toFixed(2)}%) ---\n`;
      text += `Valor Antes: ${formatCurrencyForTxt(step.initialBRL || 0, 'BRL')}\n`;
      text += `Redução: ${formatCurrencyForTxt(step.reductionAmountBRL || 0, 'BRL')}\n`;
      text += `Valor Depois: ${formatCurrencyForTxt(step.finalBRL || 0, 'BRL')}\n\n`;
    });
    
    return text;
  };

  // Format results as text for detailed calculation
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
      text += `Resultado deste passo: ${formatCurrencyForTxt(step.result_intermediate, 'BRL')}\n`;
      text += `Total acumulado: ${formatCurrencyForTxt(step.result_running_total, 'BRL')}\n\n`;
    });
    
    text += `Valor final após todos os cálculos: ${formatCurrencyForTxt(detailedResult.final_result, 'BRL')}\n`;
    
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

  return (
    <div className="bg-background">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Currency Reduction Calculator</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Input Values</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Display Exchange Rate Info */}
              <div className="mb-4 p-3 border rounded-md bg-muted/40">
                <h4 className="text-sm font-medium mb-1">Exchange Rate (USD → BRL)</h4>
                {exchangeRateLoading && (
                  <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading rate...</div>
                )}
                {exchangeRateError && (
                   // Replace Alert with a simple div
                   <div className="p-2 border border-red-500/50 bg-red-500/10 rounded-md">
                     <p className="text-xs text-red-700 dark:text-red-400">
                       <span className="font-semibold">Error:</span> {exchangeRateError}
                     </p>
                   </div>
                )}
                {exchangeRate !== null && !exchangeRateLoading && !exchangeRateError && (
                  <p className="text-lg font-semibold">{exchangeRate.toFixed(4)}</p>
                )}
                 {!exchangeRateLoading && !exchangeRateError && (
                  <p className="text-xs text-muted-foreground mt-1">Rate fetched automatically. Updates periodically.</p>
                )}
              </div>

              <DetailedInputForm 
                onSubmitTraditional={handleTraditionalCalculate} 
                onSubmitDetailed={handleDetailedCalculate}
                onReset={handleReset} 
                isLoading={isLoading}
                exchangeRate={exchangeRate}
              />
            </CardContent>
          </Card>
          
          <div>
            {isLoading ? (
              <Card className="shadow-sm">
                <CardContent className="flex justify-center items-center h-40">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Calculating...</p>
                  </div>
                </CardContent>
              </Card>
            ) : calculationMode === 'simple' ? (
              <ResultsDisplay 
                steps={calculationResult?.steps || []} 
                initialBRLNoReduction={calculationResult?.initialBRLNoReduction || 0} 
                error={error}
                onDownload={calculationResult ? handleDownload : undefined}
              />
            ) : (
              <DetailedResultsDisplay 
                steps={detailedResult?.steps || []} 
                final_result={detailedResult?.final_result || 0}
                error={error}
                onDownload={detailedResult ? handleDownload : undefined}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
