'use client';

import { useState } from 'react';
import InputForm from "@/components/InputForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

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

export default function Home() {
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculate = async (data: { 
    initialAmountUSD: number; 
    exchangeRate: number; 
    reductions: string;
  }) => {
    setIsLoading(true);
    setError(undefined);

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
      } else {
        setCalculationResult(result);
        setError(undefined);
      }
    } catch (err) {
      setError('Failed to fetch calculation results');
      setCalculationResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCalculationResult(null);
    setError(undefined);
  };
  
  // Stub for download function (to be implemented in Step 2)
  const handleDownload = () => {
    if (!calculationResult) return;
    // This is just a stub - the actual implementation will be done in Step 2
    console.log('Download button clicked');
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
              <InputForm onSubmit={handleCalculate} onReset={handleReset} isLoading={isLoading} />
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
            ) : (
              <ResultsDisplay 
                steps={calculationResult?.steps || []} 
                initialBRLNoReduction={calculationResult?.initialBRLNoReduction || 0} 
                error={error}
                onDownload={calculationResult ? handleDownload : undefined}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
