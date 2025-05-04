"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, InfoIcon, AlertCircle } from "lucide-react";
import { ICurrency } from '../domain/currency';
import StepInputRow from './StepInputRow';
import { InputStep, getStepDescriptionPlaceholder } from '../types/calculator';
import { useAppDispatch } from '@/store/hooks';
import { addStep, updateStep, removeStep } from '@/store/slices/calculatorSlice';

interface DetailedStepsInputProps {
  steps: InputStep[];
  onChange: (steps: InputStep[]) => void;
  disabled?: boolean;
  sourceCurrency?: ICurrency;
  targetCurrency?: ICurrency;
}

interface StepChangeHandler {
  (index: number, field: keyof InputStep, value: string | number): void;
}

const DetailedStepsInput: React.FC<DetailedStepsInputProps> = ({ 
  steps, 
  onChange,
  disabled = false,
  sourceCurrency,
  targetCurrency
}) => {
  // Maximum number of steps allowed
  const MAX_STEPS = 10;
  const dispatch = useAppDispatch();

  const handleAddStep = () => {
    if (steps.length >= MAX_STEPS) {
      alert(`Maximum of ${MAX_STEPS} steps allowed for performance reasons.`);
      return;
    }
    
    const defaultType = steps.length === 0 || !steps.some(step => step.type === 'initial') 
      ? 'initial' 
      : 'exchange_rate';
      
    const newStep: InputStep = {
      description: getStepDescriptionPlaceholder(defaultType, sourceCurrency, targetCurrency),
      type: defaultType,
      value: 0,
      explanation: ''
    };

    dispatch(addStep(newStep));
    onChange([...steps, newStep]);
  };

  const handleRemoveStep = (index: number) => {
    dispatch(removeStep(index));
    
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    onChange(newSteps);
  };

  const handleStepChange: StepChangeHandler = (index, field, value) => {
    const updates: Partial<InputStep> = { [field]: value };
    
    if (field === 'type' && (!steps[index].description || 
        steps[index].description === getStepDescriptionPlaceholder(steps[index].type, sourceCurrency, targetCurrency))) {
      updates.description = getStepDescriptionPlaceholder(value as string, sourceCurrency, targetCurrency);
    }
    
    dispatch(updateStep({ index, updates }));
    
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    onChange(newSteps);
  };

  const hasInitialStep = steps.some(step => step.type === 'initial');

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <Label>Calculation Steps</Label>
          <div className="flex items-center gap-2">
            {steps.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {steps.length}/{MAX_STEPS} steps
              </span>
            )}
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleAddStep}
              disabled={disabled || steps.length >= MAX_STEPS}
              className="flex items-center gap-1"
            >
              <PlusCircle size={16} />
              Add Step
            </Button>
          </div>
        </div>
        
        {!hasInitialStep && steps.length > 0 && (
          <div className="flex items-center p-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle size={14} className="mr-1 flex-shrink-0" />
            <span>An <strong>Initial Value</strong> step is required. Please add one to your calculation.</span>
          </div>
        )}
      </div>

      {steps.length === 0 ? (
        <Card className="bg-muted/20">
          <CardContent className="py-6 text-center text-muted-foreground">
            <p>No steps added yet. Click &quot;Add Step&quot; to start building your calculation.</p>
            <p className="text-xs mt-2">
              <InfoIcon size={12} className="inline mr-1" />
              You must include an <strong>Initial Value</strong> step in your calculation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2">
          {steps.map((step, index) => (
            <StepInputRow
              key={index}
              step={step}
              index={index}
              onChange={handleStepChange}
              onDelete={handleRemoveStep}
              disabled={disabled}
              sourceCurrency={sourceCurrency}
              targetCurrency={targetCurrency}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DetailedStepsInput; 