"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DetailedStepsInput, { InputStep } from './DetailedStepsInput';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define schema for traditional form validation (for backward compatibility)
const traditionalFormSchema = z.object({
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

type TraditionalFormValues = z.infer<typeof traditionalFormSchema>;

// Schema for detailed steps
const detailedFormSchema = z.object({
  steps: z.array(
    z.object({
      description: z.string().min(1, 'Description is required'),
      type: z.enum(['initial', 'exchange_rate', 'percentage_reduction', 'fixed_reduction', 'addition', 'custom']),
      value: z.number({
        required_error: 'Value is required',
        invalid_type_error: 'Value must be a number'
      }),
      explanation: z.string().optional()
    })
  ).min(1, 'At least one calculation step is required')
});

type DetailedFormValues = z.infer<typeof detailedFormSchema>;

interface DetailedInputFormProps {
  onSubmitTraditional: (data: TraditionalFormValues) => void;
  onSubmitDetailed: (data: { steps: InputStep[] }) => void;
  onReset?: () => void;
  isLoading?: boolean;
}

const DetailedInputForm: React.FC<DetailedInputFormProps> = ({ 
  onSubmitTraditional, 
  onSubmitDetailed,
  onReset, 
  isLoading = false 
}) => {
  const [activeTab, setActiveTab] = useState<string>('traditional');
  const [detailedSteps, setDetailedSteps] = useState<InputStep[]>([]);

  // Traditional form handling
  const traditionalForm = useForm<TraditionalFormValues>({
    resolver: zodResolver(traditionalFormSchema),
    mode: 'onSubmit'
  });

  // Detailed form handling (doesn't use React Hook Form in the same way)
  const handleDetailedSubmit = () => {
    // Basic validation
    if (detailedSteps.length === 0) {
      return; // Show error message
    }

    // Check if all required fields are filled
    const isValid = detailedSteps.every(step => 
      step.description.trim() !== '' && 
      step.type !== undefined && 
      !isNaN(step.value)
    );

    if (isValid) {
      onSubmitDetailed({ steps: detailedSteps });
    } else {
      // Show error message - would be better with a proper form validation library
      alert('Please fill in all required fields for each step');
    }
  };

  const handleTraditionalSubmit = (data: TraditionalFormValues) => {
    onSubmitTraditional(data);
  };

  const handleReset = () => {
    traditionalForm.reset({
      initialAmountUSD: undefined,
      exchangeRate: undefined,
      reductions: ''
    });
    setDetailedSteps([]);
    if (onReset) {
      onReset();
    }
  };

  // Helper to create example calculation
  const createExampleCalculation = () => {
    const exampleSteps: InputStep[] = [
      {
        description: 'Initial value in USD',
        type: 'initial',
        value: 3000,
        explanation: 'Starting with 2/3 of USD 4,500'
      },
      {
        description: 'Convert to BRL',
        type: 'exchange_rate',
        value: 5.673,
        explanation: 'Using the exchange rate of 1.000 USD = 5.673 BRL'
      },
      {
        description: '- 1% (transfer fee)',
        type: 'percentage_reduction',
        value: 1,
        explanation: 'Transfer fee'
      },
      {
        description: '- 6.4% of remainder (tax)',
        type: 'percentage_reduction',
        value: 6.4,
        explanation: 'Tax on the transferred amount'
      }
    ];

    setDetailedSteps(exampleSteps);
  };

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="traditional" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="traditional" disabled={isLoading}>
            Simple Mode
          </TabsTrigger>
          <TabsTrigger value="detailed" disabled={isLoading}>
            Detailed Mode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="traditional" className="mt-4">
          <form className="space-y-6" onSubmit={traditionalForm.handleSubmit(handleTraditionalSubmit)}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="initialAmountUSD">
                Initial Amount (USD)
              </label>
              <input
                {...traditionalForm.register('initialAmountUSD', { valueAsNumber: true })}
                type="number"
                id="initialAmountUSD"
                className="w-full px-3 py-2 border rounded-md"
                min={0}
                step="0.01"
                placeholder="Enter amount in USD"
                disabled={isLoading}
              />
              {traditionalForm.formState.errors.initialAmountUSD && (
                <p className="text-sm text-red-500">
                  {traditionalForm.formState.errors.initialAmountUSD.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="exchangeRate">
                Exchange Rate (USD → BRL)
              </label>
              <input
                {...traditionalForm.register('exchangeRate', { valueAsNumber: true })}
                type="number"
                id="exchangeRate"
                className="w-full px-3 py-2 border rounded-md"
                min={0}
                step="0.01"
                placeholder="Enter exchange rate"
                disabled={isLoading}
              />
              {traditionalForm.formState.errors.exchangeRate && (
                <p className="text-sm text-red-500">
                  {traditionalForm.formState.errors.exchangeRate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="reductions">
                Reductions (%)
              </label>
              <input
                {...traditionalForm.register('reductions')}
                type="text"
                id="reductions"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="E.g., 10, 20, 5.5"
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500">
                Enter percentages separated by commas
              </p>
              {traditionalForm.formState.errors.reductions && (
                <p className="text-sm text-red-500">
                  {traditionalForm.formState.errors.reductions.message}
                </p>
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
        </TabsContent>

        <TabsContent value="detailed" className="mt-4">
          <div className="space-y-6">
            <DetailedStepsInput
              steps={detailedSteps}
              onChange={setDetailedSteps}
              disabled={isLoading}
            />

            <div className="flex flex-col space-y-2">
              <div className="flex space-x-4">
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleDetailedSubmit}
                  disabled={isLoading || detailedSteps.length === 0}
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

              <Button
                type="button"
                variant="ghost"
                onClick={createExampleCalculation}
                disabled={isLoading}
                className="text-sm"
              >
                Load Example Calculation
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DetailedInputForm; 