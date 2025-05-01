"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define schema for form validation
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
        // Check if all values are valid percentages between 0-100
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

const InputForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit'
  });

  const onSubmit = (data: FormValues) => {
    console.log(data);
    // API call will be implemented in a future step
  };

  return (
    <form className="space-y-4 max-w-md" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col">
        <label htmlFor="initialAmountUSD" className="mb-1 font-medium">
          Initial Amount (USD)
        </label>
        <input 
          {...register('initialAmountUSD', { valueAsNumber: true })}
          type="number" 
          id="initialAmountUSD" 
          className={`p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.initialAmountUSD ? 'border-red-500' : 'border-gray-300'
          }`}
          min="0"
          step="0.01"
          placeholder="Enter amount in USD"
        />
        {errors.initialAmountUSD && (
          <p className="text-red-500 text-xs mt-1">{errors.initialAmountUSD.message}</p>
        )}
      </div>

      <div className="flex flex-col">
        <label htmlFor="exchangeRate" className="mb-1 font-medium">
          Exchange Rate (USD → BRL)
        </label>
        <input 
          {...register('exchangeRate', { valueAsNumber: true })}
          type="number" 
          id="exchangeRate" 
          className={`p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.exchangeRate ? 'border-red-500' : 'border-gray-300'
          }`}
          min="0"
          step="0.01"
          placeholder="Enter exchange rate"
        />
        {errors.exchangeRate && (
          <p className="text-red-500 text-xs mt-1">{errors.exchangeRate.message}</p>
        )}
      </div>

      <div className="flex flex-col">
        <label htmlFor="reductions" className="mb-1 font-medium">
          Reductions (%)
        </label>
        <input 
          {...register('reductions')}
          type="text" 
          id="reductions" 
          className={`p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.reductions ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="E.g., 10, 20, 5.5"
        />
        <p className="text-xs text-gray-500 mt-1">Enter percentages separated by commas</p>
        {errors.reductions && (
          <p className="text-red-500 text-xs mt-1">{errors.reductions.message}</p>
        )}
      </div>

      <button 
        type="submit" 
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Calculate
      </button>
    </form>
  );
};

export default InputForm; 