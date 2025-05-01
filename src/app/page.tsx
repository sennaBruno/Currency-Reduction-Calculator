'use client';

import { useState } from 'react';
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

// Legacy interfaces
interface CalculationStep {
  step: number;
  initialBRL: number;
  reductionPercentage: number;
  reductionAmountBRL: number;
  finalBRL: number;
}

interface CalculationResult {
  steps: CalculationStep[];
  initialBRLNoReduction: number;
}

// New detailed interfaces
interface DetailedCalculationStep {
  step: number;
  description: string;
  calculation_details: string;
  result_intermediate: number;
  result_running_total: number;
  explanation?: string;
}

interface DetailedCalculationResult {
  steps: DetailedCalculationStep[];
  final_result: number;
}

interface FormInputs {
  initialAmountUSD: number;
  exchangeRate: number;
  reductions: string;
}

export default function Home() {
  // State for legacy calculation
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  
  // State for detailed calculation
  const [detailedResult, setDetailedResult] = useState<DetailedCalculationResult | null>(null);
  
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [formInputs, setFormInputs] = useState<FormInputs | null>(null);
  const [calculationMode, setCalculationMode] = useState<'simple' | 'detailed'>('simple');

  // Legacy calculation handler
  const handleTraditionalCalculate = async (data: { 
    initialAmountUSD: number; 
    exchangeRate: number; 
    reductions: string;
  }) => {
    setIsLoading(true);
    setError(undefined);
    setFormInputs(data);
    setCalculationMode('simple');

    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'An error occurred during the calculation');
        setCalculationResult(null);
        setDetailedResult(null);
      } else {
        // Ensure initialBRLNoReduction is present for consistent interface
        setCalculationResult({
          ...result,
          initialBRLNoReduction: result.initialBRLNoReduction || 0
        });
        setDetailedResult(null);
        setError(undefined);
      }
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      setError('Failed to fetch calculation results');
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
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'An error occurred during the calculation');
        setCalculationResult(null);
        setDetailedResult(null);
      } else {
        setDetailedResult(result);
        setCalculationResult(null);
        setError(undefined);
      }
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      setError('Failed to fetch calculation results');
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
    if (!calculationResult || !formInputs) return '';
    
    let text = "Cálculo de Redução de Moeda\n\n";
    
    text += "== Entradas ==\n";
    text += `Valor Inicial (USD): ${formatCurrencyForTxt(formInputs.initialAmountUSD, 'USD')}\n`;
    text += `Taxa de Câmbio (BRL/USD): ${formInputs.exchangeRate}\n`;
    text += `Reduções (%): ${formInputs.reductions}\n\n`;
    
    text += "== Resultado Passo a Passo (BRL) ==\n";
    text += `Valor Inicial (BRL): ${formatCurrencyForTxt(calculationResult.initialBRLNoReduction, 'BRL')}\n\n`;
    
    calculationResult.steps.forEach(step => {
      text += `--- Passo ${step.step} (${step.reductionPercentage.toFixed(2)}%) ---\n`;
      text += `Valor Antes: ${formatCurrencyForTxt(step.initialBRL, 'BRL')}\n`;
      text += `Redução: ${formatCurrencyForTxt(step.reductionAmountBRL, 'BRL')}\n`;
      text += `Valor Depois: ${formatCurrencyForTxt(step.finalBRL, 'BRL')}\n\n`;
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
              <DetailedInputForm 
                onSubmitTraditional={handleTraditionalCalculate} 
                onSubmitDetailed={handleDetailedCalculate}
                onReset={handleReset} 
                isLoading={isLoading} 
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
