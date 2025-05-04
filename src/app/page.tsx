'use client';

import { useEffect } from 'react';
import DetailedInputForm from "@/components/DetailedInputForm";
import ResultsDisplay from "@/components/ResultsDisplay";
import DetailedResultsDisplay from "@/components/DetailedResultsDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSourceCurrency, setTargetCurrency, addCurrency } from '@/store/slices/currencySlice';
import { fetchExchangeRate } from '@/store/thunks/currencyThunks';
import { useCalculator } from '@/hooks/useCalculator';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { CurrencyRegistry } from '@/application/currency/currencyRegistry.service';

export default function Home() {
  const dispatch = useAppDispatch();
  const { exchangeRate } = useAppSelector(state => state.currency);
  
  const {
    calculationResult,
    detailedResult,
    error,
    isLoading,
    calculationMode,
    handleTraditionalCalculate,
    handleDetailedCalculate,
    handleReset,
    handleDownload
  } = useCalculator(exchangeRate);

  const {
    exchangeRateLastUpdated,
    exchangeRateError
  } = useExchangeRate();

  useEffect(() => {
    const currencyRegistry = new CurrencyRegistry();
    const currencies = currencyRegistry.getAllCurrencies();
    
    currencies.forEach(currency => {
      dispatch(addCurrency(currency));
    });
    
    const defaultSourceCurrency = currencies.find(c => c.code === 'USD') || currencies[0];
    const defaultTargetCurrency = currencies.find(c => c.code === 'BRL') || currencies[1];
    
    if (defaultSourceCurrency && defaultTargetCurrency) {
      dispatch(setSourceCurrency(defaultSourceCurrency));
      dispatch(setTargetCurrency(defaultTargetCurrency));

      dispatch(fetchExchangeRate({ 
        source: defaultSourceCurrency.code, 
        target: defaultTargetCurrency.code 
      }));
    } else {
      console.error("Could not find default currencies (USD/BRL).");
    }
  }, [dispatch]);

  return (
    <div className="bg-background">
      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 md:mb-8 text-center">Currency Exchange Rate Calculator</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto">
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
                exchangeRateLastUpdated={exchangeRateLastUpdated}
                exchangeRateError={exchangeRateError}
              />
            </CardContent>
          </Card>
          
          <div>
            {isLoading ? (
              <LoadingCard />
            ) : calculationResult || detailedResult ? (
              calculationMode === 'simple' ? (
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
              )
            ) : (
              <EmptyResultsCard />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const LoadingCard = () => (
  <Card className="shadow-sm">
    <CardContent className="flex justify-center items-center h-40">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-muted-foreground">Calculating...</p>
      </div>
    </CardContent>
  </Card>
);

const EmptyResultsCard = () => (
  <Card className="shadow-sm">
    <CardContent className="p-6">
      <div className="text-center text-muted-foreground">
        Enter values and click Calculate to see results.
      </div>
    </CardContent>
  </Card>
);
