"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils"; 

const formSchema = z.object({
  initialAmountUSD: z
    .number({ 
      required_error: 'Initial amount is required',
      invalid_type_error: 'Initial amount must be a number'
    })
    .positive('Amount must be greater than 0'),
  exchangeRate: z
    .number({ 
      required_error: 'Exchange rate is required',
      invalid_type_error: 'Exchange rate must be a number'
    })
    .positive('Exchange rate must be greater than 0'),
  reductions: z
    .string()
    .min(1, 'At least one reduction percentage is required')
    .refine(
      (val) => {
        const percentages = val
          .split(',')
          .map(p => p.trim())
          .filter(p => p !== '')
          .map(p => Number(p));
        
        return percentages.every(p => !isNaN(p) && p >= 0 && p <= 100);
      },
      {
        message: 'All percentages must be valid numbers between 0 and 100'
      }
    )
});

type FormValues = z.infer<typeof formSchema>;

interface InputFormProps {
  onSubmit: (data: FormValues) => void;
  onReset?: () => void;
  isLoading?: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, onReset, isLoading = false }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit'
  });

  const handleFormSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  const handleReset = () => {
    reset({
      initialAmountUSD: undefined,
      exchangeRate: undefined,
      reductions: ''
    });
    if (onReset) {
      onReset();
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="initialAmountUSD">Initial Amount (USD)</Label>
        <Input 
          {...register('initialAmountUSD', { valueAsNumber: true })}
          type="number" 
          id="initialAmountUSD" 
          className={cn(errors.initialAmountUSD && "border-red-500 focus-visible:ring-red-500")}
          min={0} 
          step="0.01"
          placeholder="Enter amount in USD"
          disabled={isLoading}
        />
        {errors.initialAmountUSD && (
          <p className="text-sm text-red-500">{errors.initialAmountUSD.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="exchangeRate">Exchange Rate (USD → BRL)</Label>
        <Input 
          {...register('exchangeRate', { valueAsNumber: true })}
          type="number" 
          id="exchangeRate" 
          className={cn(errors.exchangeRate && "border-red-500 focus-visible:ring-red-500")}
          min={0} 
          step="0.01"
          placeholder="Enter exchange rate"
          disabled={isLoading}
        />
        {errors.exchangeRate && (
          <p className="text-sm text-red-500">{errors.exchangeRate.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reductions">Reductions (%)</Label>
        <Input 
          {...register('reductions')}
          type="text" 
          id="reductions" 
          className={cn(errors.reductions && "border-red-500 focus-visible:ring-red-500")}
          placeholder="E.g., 10, 20, 5.5"
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">Enter percentages separated by commas</p>
        {errors.reductions && (
          <p className="text-sm text-red-500">{errors.reductions.message}</p>
        )}
      </div>

      <div className="flex space-x-4">
        <Button 
          type="submit" 
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? 'Calculating...' : 'Calculate'}
        </Button>
        
        <Button 
          type="button"
          variant="outline"
          className="flex-1"
          onClick={handleReset}
          disabled={isLoading}
        >
          Reset
        </Button>
      </div>
    </form>
  );
};

export default InputForm; 