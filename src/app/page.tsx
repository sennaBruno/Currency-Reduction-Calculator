'use client';

import { useState, useEffect } from 'react';
import DetailedInputForm from "@/components/DetailedInputForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import DetailedResultsDisplay from "@/components/DetailedResultsDisplay";
import { InputStep } from "@/types/calculator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { 
  ExchangeRateService, 
  CalculatorService,
  DetailedCalculationResult, 
  SimpleCalculationResult,
} from '@/services';
import { CurrencyRegistry } from '@/application/currency/currencyRegistry.service';
import { ICurrency } from '@/domain/currency/currency.interface';
import { formatCurrencyForText } from '../domain/currency/currencyConversion.utils';

// API error response interface
interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

// Local interface for form inputs
interface FormInputs {
  initialAmountUSD: number;
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
  // Adicione estado para armazenar a data da última atualização
  const [exchangeRateLastUpdated, setExchangeRateLastUpdated] = useState<Date | null>(null);

  // Add state for available currencies
  const [availableCurrencies, setAvailableCurrencies] = useState<ICurrency[]>([]);
  
  // Add state for currently selected currencies
  const [sourceCurrency, setSourceCurrency] = useState<ICurrency | null>(null);
  const [targetCurrency, setTargetCurrency] = useState<ICurrency | null>(null);

  // Function to scroll to top of page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Fetch currencies and exchange rate on mount
  useEffect(() => {
    // Get supported currencies
    const currencyRegistry = new CurrencyRegistry();
    const currencies = currencyRegistry.getAllCurrencies();
    setAvailableCurrencies(currencies);
    
    // Set default currencies
    const defaultSourceCurrency = currencies.find(c => c.code === 'USD') || currencies[0];
    const defaultTargetCurrency = currencies.find(c => c.code === 'BRL') || currencies[1];
    
    setSourceCurrency(defaultSourceCurrency);
    setTargetCurrency(defaultTargetCurrency);

    const fetchRate = async () => {
      setExchangeRateLoading(true);
      setExchangeRateError(null);
      try {
        const rateData = await ExchangeRateService.getUsdToBrlRateWithMetadata();
        setExchangeRate(rateData.rate);
        setExchangeRateLastUpdated(rateData.timestamp);
      } catch (error: Error | unknown) {
        console.error("Exchange rate fetch error:", error);
        setExchangeRateError(error instanceof Error ? error.message : 'Unknown error occurred');
        setExchangeRate(null); // Ensure rate is null on error
        setExchangeRateLastUpdated(null);
      } finally {
        setExchangeRateLoading(false);
      }
    };

    fetchRate();
  }, []); 
  
  const fetchExchangeRateForCurrencyPair = async (source: ICurrency, target: ICurrency) => {
    setExchangeRateLoading(true);
    setExchangeRateError(null);
    setSourceCurrency(source);
    setTargetCurrency(target);
    
    try {
      const rateData = await ExchangeRateService.getExchangeRateForPairWithMetadata(source, target);
      setExchangeRate(rateData.rate);
      setExchangeRateLastUpdated(rateData.timestamp);
    } catch (error: Error | unknown) {
      console.error(`Exchange rate fetch error for ${source.code}/${target.code}:`, error);
      setExchangeRateError(error instanceof Error ? error.message : 'Unknown error occurred');
      setExchangeRate(null);
      setExchangeRateLastUpdated(null);
    } finally {
      setExchangeRateLoading(false);
    }
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
    setFormInputs(null);
  };
  
  const formatTraditionalResultsAsText = (): string => {
    if (!calculationResult || !formInputs || exchangeRate === null) return '';
    
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

  return (
    <div className="bg-background">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Currency Exchange Rate Calculator</h1>
        
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
                exchangeRate={exchangeRate}
                exchangeRateLastUpdated={exchangeRateLastUpdated}
                exchangeRateIsLoading={exchangeRateLoading}
                exchangeRateError={exchangeRateError}
                availableCurrencies={availableCurrencies}
                onCurrencyChange={fetchExchangeRateForCurrencyPair}
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
