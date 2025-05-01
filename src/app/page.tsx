'use client';

import { useState } from 'react';
import InputForm from "@/components/InputForm";
import ResultsDisplay from "@/components/ResultsDisplay";

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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Currency Reduction Calculator</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Input Values</h2>
            <InputForm onSubmit={handleCalculate} onReset={handleReset} isLoading={isLoading} />
          </div>
          
          <div>
            {isLoading ? (
              <div className="bg-white p-6 rounded-lg shadow-sm flex justify-center items-center h-40">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p>Calculating...</p>
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <ResultsDisplay 
                  steps={calculationResult?.steps || []} 
                  initialBRLNoReduction={calculationResult?.initialBRLNoReduction || 0} 
                  error={error}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
