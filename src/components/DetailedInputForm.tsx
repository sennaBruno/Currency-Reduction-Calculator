"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ICurrency } from '../domain/currency';
import { getSourceCurrency, getTargetCurrency } from '../utils/currencyUtils';
import TraditionalCalculatorForm, { TraditionalFormValues } from './TraditionalCalculatorForm';
import DetailedCalculatorTab from './DetailedCalculatorTab';
import CurrencySection from './CurrencySection';
import { InputStep } from '../types/calculator';

/**
 * Props for the DetailedInputForm component
 */
interface DetailedInputFormProps {
  onSubmitTraditional: (data: TraditionalFormValues & { 
    sourceCurrency: ICurrency;
    targetCurrency: ICurrency;
  }) => void;
  onSubmitDetailed: (data: { 
    steps: InputStep[];
    sourceCurrency: ICurrency;
    targetCurrency: ICurrency;
  }) => void;
  onReset?: () => void;
  isLoading?: boolean;
  exchangeRate?: number | null;
  exchangeRateLastUpdated?: Date | string | null;
  exchangeRateIsLoading?: boolean;
  exchangeRateError?: string | null;
  availableCurrencies: ICurrency[];
  onCurrencyChange?: (sourceCurrency: ICurrency, targetCurrency: ICurrency) => void;
}

const DetailedInputForm: React.FC<DetailedInputFormProps> = ({ 
  onSubmitTraditional, 
  onSubmitDetailed,
  onReset, 
  isLoading = false,
  exchangeRate = null,
  exchangeRateLastUpdated = null,
  exchangeRateIsLoading = false,
  exchangeRateError = null,
  availableCurrencies = [],
  onCurrencyChange
}) => {
  const [activeTab, setActiveTab] = useState<string>('traditional');
  const [useAutoRate, setUseAutoRate] = useState<boolean>(true);
  
  const [sourceCurrency, setSourceCurrency] = useState<ICurrency>(
    getSourceCurrency(availableCurrencies)
  );
  
  const [targetCurrency, setTargetCurrency] = useState<ICurrency>(
    getTargetCurrency(availableCurrencies, sourceCurrency)
  );

  // Update currency states when availableCurrencies changes
  useEffect(() => {
    if (availableCurrencies.length > 0) {
      const newSourceCurrency = getSourceCurrency(availableCurrencies);
      setSourceCurrency(newSourceCurrency);
      
      const newTargetCurrency = getTargetCurrency(
        availableCurrencies, 
        newSourceCurrency
      );
      setTargetCurrency(newTargetCurrency);
    }
  }, [availableCurrencies]);

  const handleSourceCurrencyChange = (currency: ICurrency) => {
    setSourceCurrency(currency);
    if (onCurrencyChange && targetCurrency) {
      onCurrencyChange(currency, targetCurrency);
    }
  };

  const handleTargetCurrencyChange = (currency: ICurrency) => {
    setTargetCurrency(currency);
    if (onCurrencyChange && sourceCurrency) {
      onCurrencyChange(sourceCurrency, currency);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  return (
    <div className="space-y-6">
      <CurrencySection 
        availableCurrencies={availableCurrencies}
        sourceCurrency={sourceCurrency}
        targetCurrency={targetCurrency}
        onSourceCurrencyChange={handleSourceCurrencyChange}
        onTargetCurrencyChange={handleTargetCurrencyChange}
        exchangeRate={exchangeRate}
        exchangeRateLastUpdated={exchangeRateLastUpdated}
        exchangeRateIsLoading={exchangeRateIsLoading}
        exchangeRateError={exchangeRateError}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="traditional">Traditional Calculator</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Calculator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="traditional" className="space-y-4 mt-4">
          <TraditionalCalculatorForm
            onSubmit={onSubmitTraditional}
            onReset={handleReset}
            isLoading={isLoading}
            exchangeRate={exchangeRate}
            sourceCurrency={sourceCurrency}
            targetCurrency={targetCurrency}
            useAutoRate={useAutoRate}
            onAutoRateChange={setUseAutoRate}
          />
        </TabsContent>
        
        <TabsContent value="detailed" className="space-y-4 mt-4">
          <DetailedCalculatorTab
            onSubmit={onSubmitDetailed}
            onReset={handleReset}
            isLoading={isLoading}
            sourceCurrency={sourceCurrency}
            targetCurrency={targetCurrency}
            exchangeRate={exchangeRate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetailedInputForm; 