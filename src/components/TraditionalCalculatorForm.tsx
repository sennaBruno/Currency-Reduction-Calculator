"use client";

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from "./ui/checkbox";
import { ICurrency } from '../domain/currency/currency.interface';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateTraditionalInput, clearForm } from '@/store/slices/calculatorSlice';
import { CurrencyRegistry } from '@/application/currency/currencyRegistry.service';

/**
 * Validation schema for the traditional calculator form
 */
export const traditionalFormSchema = z.object({
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

export type TraditionalFormValues = z.infer<typeof traditionalFormSchema>;

interface TraditionalCalculatorFormProps {
  onSubmit: (data: TraditionalFormValues & { 
    sourceCurrency: ICurrency;
    targetCurrency: ICurrency;
  }) => void;
  onReset?: () => void;
  isLoading?: boolean;
  useAutoRate: boolean;
  onAutoRateChange: (checked: boolean) => void;
}

const TraditionalCalculatorForm: React.FC<TraditionalCalculatorFormProps> = ({
  onSubmit,
  onReset,
  isLoading = false,
  useAutoRate,
  onAutoRateChange
}) => {
  const dispatch = useAppDispatch();
  const { sourceCurrency, targetCurrency, exchangeRate } = useAppSelector(state => state.currency);
  
  const currencyRegistry = new CurrencyRegistry();
  const sourceCurrencyObj = currencyRegistry.getCurrencyByCode(sourceCurrency) || { code: sourceCurrency, symbol: '', name: sourceCurrency };
  const targetCurrencyObj = currencyRegistry.getCurrencyByCode(targetCurrency) || { code: targetCurrency, symbol: '', name: targetCurrency };
  
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

  useEffect(() => {
    if (exchangeRate && useAutoRate) {
      traditionalForm.setValue('exchangeRate', exchangeRate);
    }
  }, [exchangeRate, useAutoRate, traditionalForm]);

  const handleTraditionalSubmit: SubmitHandler<TraditionalFormValues> = (data) => {
    dispatch(updateTraditionalInput(JSON.stringify(data)));
    
    const sourceCurrencyObject = currencyRegistry.getCurrencyByCode(sourceCurrency) as ICurrency;
    const targetCurrencyObject = currencyRegistry.getCurrencyByCode(targetCurrency) as ICurrency;
    
    onSubmit({
      ...data,
      sourceCurrency: sourceCurrencyObject,
      targetCurrency: targetCurrencyObject
    });
  };

  const handleReset = () => {
    traditionalForm.reset({
      initialAmount: undefined,
      exchangeRate: undefined,
      reductions: ''
    });
    
    dispatch(clearForm());
    
    if (onReset) {
      onReset();
    }
  };

  return (
    <form onSubmit={traditionalForm.handleSubmit(handleTraditionalSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="initialAmount">
          Initial Amount ({sourceCurrencyObj.code}) <span className="text-red-500">*</span>
        </Label>
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <Label htmlFor="exchangeRate">
            Exchange Rate ({sourceCurrencyObj.code} to {targetCurrencyObj.code}) <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center space-x-2 mt-1 sm:mt-0">
            <Checkbox 
              id="useAutoRate" 
              checked={useAutoRate}
              onCheckedChange={(checked: boolean | "indeterminate") => onAutoRateChange(!!checked)}
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
        <Label htmlFor="reductions">
          Reductions (%) - comma separated
        </Label>
        <Input
          id="reductions"
          placeholder="e.g. 8.5, 10 (optional)"
          {...traditionalForm.register('reductions')}
        />
        {traditionalForm.formState.errors.reductions && (
          <p className="text-sm text-red-500">
            {traditionalForm.formState.errors.reductions.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter percentage reductions separated by commas (e.g. &quot;5.5, 2.3&quot;) or leave empty for no reductions
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isLoading}
          className="w-full sm:w-32"
        >
          Reset
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full sm:w-32"
        >
          Calculate
        </Button>
      </div>
    </form>
  );
};

export default TraditionalCalculatorForm; 