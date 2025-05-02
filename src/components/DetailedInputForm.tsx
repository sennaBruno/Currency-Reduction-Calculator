"use client";

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from "../components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import DetailedStepsInput from './DetailedStepsInput';
import { CurrencySelector } from './CurrencySelector';
import { ICurrency } from '../domain/currency';
import { getSourceCurrency, getTargetCurrency, createExampleCalculationSteps } from '../utils/currencyUtils';

// Unused regex - keeping for future reference
// const percentageListRegex = /^\s*\d+(\.\d+)?%(,\s*\d+(\.\d+)?%)*\s*$/;

/**
 * Validation schema for the traditional calculator form
 */
const traditionalFormSchema = z.object({
  initialAmount: z
    .number({ required_error: 'Initial amount is required' })
    .min(0.01, 'Amount must be greater than 0')
    .max(1000000000, 'Amount must be less than 1 billion'),
  exchangeRate: z
    .number({ required_error: 'Exchange rate is required' })
    .min(0.0001, 'Rate must be greater than 0')
    .max(10000, 'Rate must be less than 10,000'),
  reductions: z
    .string()
    .refine(
      (val) => !val || val.split(',').every(v => {
        const trimmed = v.trim();
        return !trimmed || !isNaN(parseFloat(trimmed));
      }),
      { message: 'Reductions must be comma-separated numbers' }
    )
    .default('')
});

type TraditionalFormValues = z.infer<typeof traditionalFormSchema>;

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
  availableCurrencies: ICurrency[];
  onCurrencyChange?: (sourceCurrency: ICurrency, targetCurrency: ICurrency) => void;
}

const DetailedInputForm: React.FC<DetailedInputFormProps> = ({ 
  onSubmitTraditional, 
  onSubmitDetailed,
  onReset, 
  isLoading = false,
  exchangeRate = null,
  availableCurrencies = [],
  onCurrencyChange
}) => {
  const [activeTab, setActiveTab] = useState<string>('traditional');
  const [detailedSteps, setDetailedSteps] = useState<InputStep[]>([]);
  const [useAutoRate, setUseAutoRate] = useState<boolean>(true);
  
  // Use currency utility functions for initial state
  const [sourceCurrency, setSourceCurrency] = useState<ICurrency>(
    getSourceCurrency(availableCurrencies)
  );
  
  const [targetCurrency, setTargetCurrency] = useState<ICurrency>(
    getTargetCurrency(availableCurrencies, sourceCurrency)
  );

  // Update currency states when availableCurrencies changes
  useEffect(() => {
    if (availableCurrencies.length > 0) {
      // Get updated currencies using utility functions
      const newSourceCurrency = getSourceCurrency(availableCurrencies);
      setSourceCurrency(newSourceCurrency);
      
      const newTargetCurrency = getTargetCurrency(
        availableCurrencies, 
        newSourceCurrency
      );
      setTargetCurrency(newTargetCurrency);
    }
  }, [availableCurrencies]);

  // Traditional form handling
  const traditionalForm = useForm<TraditionalFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(traditionalFormSchema) as any,
    mode: 'onSubmit',
    defaultValues: {
      initialAmount: undefined,
      exchangeRate: undefined,
      reductions: ''
    }
  });

  // Apply exchange rate when it changes or when the checkbox state changes
  useEffect(() => {
    if (exchangeRate && useAutoRate) {
      traditionalForm.setValue('exchangeRate', exchangeRate);
    }
  }, [exchangeRate, useAutoRate, traditionalForm]);

  // Detailed form handling (doesn't use React Hook Form in the same way)
  const handleDetailedSubmit = () => {
    // Basic validation
    if (detailedSteps.length === 0) {
      alert('Please add at least one calculation step');
      return;
    }

    // Check if there's an initial value step
    const hasInitialStep = detailedSteps.some(step => step.type === 'initial');
    if (!hasInitialStep) {
      alert('An Initial Value step is required for calculation');
      return;
    }

    // Validate values are within reasonable limits
    const hasInvalidValues = detailedSteps.some(step => {
      if (step.type === 'initial' && (step.value <= 0 || step.value > 1000000000)) {
        alert('Initial value must be greater than 0 and less than 1,000,000,000');
        return true;
      }
      
      if (step.type === 'exchange_rate' && (step.value <= 0 || step.value > 10000)) {
        alert('Exchange rate must be greater than 0 and less than 10,000');
        return true;
      }
      
      if (step.type === 'percentage_reduction' && (step.value < 0 || step.value > 100)) {
        alert('Percentage reduction must be between 0 and 100');
        return true;
      }
      
      if ((step.type === 'fixed_reduction' || step.type === 'addition') && 
          (Math.abs(step.value) > 1000000000)) {
        alert('Fixed reduction or addition values must be less than 1,000,000,000');
        return true;
      }
      
      if (step.description.length > 200) {
        alert('Description is too long (max 200 characters)');
        return true;
      }
      
      if (step.explanation && step.explanation.length > 500) {
        alert('Explanation is too long (max 500 characters)');
        return true;
      }

      return false;
    });

    if (hasInvalidValues) {
      return;
    }

    // Check if all required fields are filled
    const isValid = detailedSteps.every(step => 
      step.description.trim() !== '' && 
      step.type !== undefined && 
      !isNaN(step.value)
    );

    if (isValid) {
      onSubmitDetailed({ 
        steps: detailedSteps,
        sourceCurrency,
        targetCurrency 
      });
    } else {
      // Show error message - would be better with a proper form validation library
      alert('Please fill in all required fields for each step');
    }
  };

  const handleTraditionalSubmit: SubmitHandler<TraditionalFormValues> = (data) => {
    onSubmitTraditional({
      ...data,
      sourceCurrency,
      targetCurrency
    });
  };

  const handleReset = () => {
    traditionalForm.reset({
      initialAmount: undefined,
      exchangeRate: undefined,
      reductions: ''
    });
    setDetailedSteps([]);
    if (onReset) {
      onReset();
    }
  };

  // Helper to create example calculation
  const handleCreateExampleCalculation = () => {
    // Use the utility function to create example steps
    const exampleSteps = createExampleCalculationSteps(
      sourceCurrency,
      targetCurrency,
      exchangeRate
    );
    
    setDetailedSteps(exampleSteps);
  };

  // Function to handle currency changes
  const handleSourceCurrencyChange = (currency: ICurrency) => {
    setSourceCurrency(currency);
    // Call the onCurrencyChange callback if available
    if (onCurrencyChange && targetCurrency) {
      onCurrencyChange(currency, targetCurrency);
    }
  };

  const handleTargetCurrencyChange = (currency: ICurrency) => {
    setTargetCurrency(currency);
    // Call the onCurrencyChange callback if available
    if (onCurrencyChange && sourceCurrency) {
      onCurrencyChange(sourceCurrency, currency);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <CurrencySelector
          currencies={availableCurrencies}
          selectedCurrency={sourceCurrency}
          onChange={handleSourceCurrencyChange}
          label="Source Currency"
        />
        <CurrencySelector
          currencies={availableCurrencies}
          selectedCurrency={targetCurrency}
          onChange={handleTargetCurrencyChange}
          label="Target Currency"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="traditional">Traditional Calculator</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Calculator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="traditional" className="space-y-4 mt-4">
          <form onSubmit={traditionalForm.handleSubmit(handleTraditionalSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initialAmount">Initial Amount ({sourceCurrency.code})</Label>
              <Input
                id="initialAmount"
                type="number"
                step="0.01"
                placeholder="Enter initial amount"
                {...traditionalForm.register('initialAmount', { valueAsNumber: true })}
              />
              {traditionalForm.formState.errors.initialAmount && (
                <p className="text-sm text-red-500">
                  {traditionalForm.formState.errors.initialAmount.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="exchangeRate">Exchange Rate ({sourceCurrency.code} to {targetCurrency.code})</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="useAutoRate" 
                    checked={useAutoRate}
                    onCheckedChange={(checked: boolean | "indeterminate") => setUseAutoRate(!!checked)}
                  />
                  <label 
                    htmlFor="useAutoRate" 
                    className="text-sm text-muted-foreground cursor-pointer"
                  >
                    Use auto rate
                  </label>
                </div>
              </div>
              <Input
                id="exchangeRate"
                type="number"
                step="0.0001"
                placeholder="Enter exchange rate"
                disabled={useAutoRate && exchangeRate !== null}
                {...traditionalForm.register('exchangeRate', { valueAsNumber: true })}
              />
              {traditionalForm.formState.errors.exchangeRate && (
                <p className="text-sm text-red-500">
                  {traditionalForm.formState.errors.exchangeRate.message}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reductions">Reductions (%) - comma separated</Label>
              <Input
                id="reductions"
                placeholder="e.g. 8.5, 10"
                {...traditionalForm.register('reductions')}
              />
              {traditionalForm.formState.errors.reductions && (
                <p className="text-sm text-red-500">
                  {traditionalForm.formState.errors.reductions.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter percentage reductions separated by commas (e.g. &quot;5.5, 2.3&quot;)
              </p>
            </div>
            
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isLoading}>
                Calculate
              </Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="detailed" className="space-y-4 mt-4">
          <div className="space-y-4">
            <DetailedStepsInput
              steps={detailedSteps}
              onChange={setDetailedSteps}
              disabled={isLoading}
              sourceCurrency={sourceCurrency}
              targetCurrency={targetCurrency}
            />
            
            <div className="flex flex-col md:flex-row gap-2 md:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreateExampleCalculation}
                className="md:w-auto w-full"
                disabled={isLoading}
              >
                Create Example
              </Button>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset
                </Button>
                <Button 
                  type="button"
                  onClick={handleDetailedSubmit}
                  disabled={isLoading || detailedSteps.length === 0}
                >
                  Calculate
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetailedInputForm; 