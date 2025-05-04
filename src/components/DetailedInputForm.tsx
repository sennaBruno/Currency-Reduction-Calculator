"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ICurrency } from '../domain/currency';
import TraditionalCalculatorForm, { TraditionalFormValues } from './TraditionalCalculatorForm';
import DetailedCalculatorTab from './DetailedCalculatorTab';
import CurrencySection from './CurrencySection';
import { InputStep } from '../types/calculator';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setMode } from '@/store/slices/calculatorSlice';

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
  exchangeRateLastUpdated?: Date | string | null;
  exchangeRateError?: string | null;
}

const DetailedInputForm: React.FC<DetailedInputFormProps> = ({ 
  onSubmitTraditional, 
  onSubmitDetailed,
  onReset, 
  isLoading = false,
  exchangeRateLastUpdated = null,
  exchangeRateError = null,
}) => {
  const [useAutoRate, setUseAutoRate] = useState<boolean>(true);
  
  const dispatch = useAppDispatch();
  const { calculationMode } = useAppSelector(state => state.calculator);
  const calculatorIsLoading = useAppSelector(state => state.calculator.isLoading);
  
  const combinedLoading = isLoading || calculatorIsLoading;

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
  };

  const handleTabChange = (value: string) => {
    dispatch(setMode(value as 'traditional' | 'detailed'));
  };

  return (
    <div className="space-y-6">
      <CurrencySection 
        exchangeRateLastUpdated={exchangeRateLastUpdated}
        exchangeRateIsLoading={combinedLoading}
        exchangeRateError={exchangeRateError}
      />

      <Tabs value={calculationMode} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-x-2">
          <TabsTrigger value="traditional" className="px-2 sm:px-4 text-xs sm:text-sm">Traditional Calculator</TabsTrigger>
          <TabsTrigger value="detailed" className="px-2 sm:px-4 text-xs sm:text-sm">Detailed Calculator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="traditional" className="space-y-4 mt-4">
          <TraditionalCalculatorForm
            onSubmit={onSubmitTraditional}
            onReset={handleReset}
            isLoading={combinedLoading}
            useAutoRate={useAutoRate}
            onAutoRateChange={setUseAutoRate}
          />
        </TabsContent>
        
        <TabsContent value="detailed" className="space-y-4 mt-4">
          <DetailedCalculatorTab
            onSubmit={onSubmitDetailed}
            onReset={handleReset}
            isLoading={combinedLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetailedInputForm; 