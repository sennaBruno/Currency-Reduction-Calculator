"use client";

import React, { useMemo } from 'react';
import { Button } from './ui/button';
import DetailedStepsInput from './DetailedStepsInput';
import { ICurrency } from '../domain/currency';
import { createExampleCalculationSteps } from '../utils/currencyUtils';
import { InputStep } from '../types/calculator';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setDetailedSteps, clearForm } from '@/store/slices/calculatorSlice';
import { CurrencyRegistry } from '@/application/currency/currencyRegistry.service';

const currencyRegistry = new CurrencyRegistry();

interface DetailedCalculatorTabProps {
  onSubmit: (data: { 
    steps: InputStep[];
    sourceCurrency: ICurrency;
    targetCurrency: ICurrency;
  }) => void;
  onReset?: () => void;
  isLoading?: boolean;
}

const DetailedCalculatorTab: React.FC<DetailedCalculatorTabProps> = ({
  onSubmit,
  onReset,
  isLoading = false
}) => {
  const dispatch = useAppDispatch();
  const detailedSteps = useAppSelector(state => state.calculator.detailedSteps);
  const { sourceCurrency: sourceCode, targetCurrency: targetCode, exchangeRate } = useAppSelector(state => state.currency);
  
  const sourceCurrency = useMemo(() => 
    currencyRegistry.getCurrencyByCode(sourceCode) as ICurrency,
    [sourceCode]
  );
  
  const targetCurrency = useMemo(() => 
    currencyRegistry.getCurrencyByCode(targetCode) as ICurrency,
    [targetCode]
  );

  const handleDetailedSubmit = () => {
    if (detailedSteps.length === 0) {
      alert('Please add at least one calculation step');
      return;
    }

    const hasInitialStep = detailedSteps.some(step => step.type === 'initial');
    if (!hasInitialStep) {
      alert('An Initial Value step is required for calculation');
      return;
    }

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

    const isValid = detailedSteps.every(step => 
      step.description.trim() !== '' && 
      step.type !== undefined && 
      !isNaN(step.value)
    );

    if (isValid) {
      onSubmit({ 
        steps: detailedSteps,
        sourceCurrency,
        targetCurrency 
      });
    } else {
      alert('Please fill in all required fields for each step');
    }
  };

  const handleReset = () => {
    dispatch(clearForm());
    if (onReset) {
      onReset();
    }
  };

  const handleCreateExampleCalculation = () => {
    const exampleSteps = createExampleCalculationSteps(
      sourceCurrency,
      targetCurrency,
      exchangeRate
    );
    
    dispatch(setDetailedSteps(exampleSteps));
  };

  return (
    <div className="space-y-4">
      <DetailedStepsInput
        steps={detailedSteps}
        onChange={(steps) => dispatch(setDetailedSteps(steps))}
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
  );
};

export default DetailedCalculatorTab; 