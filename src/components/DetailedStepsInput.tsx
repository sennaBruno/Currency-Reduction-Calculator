"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Trash2, InfoIcon, AlertCircle } from "lucide-react";

export interface InputStep {
  description: string;
  type: 'initial' | 'exchange_rate' | 'percentage_reduction' | 'fixed_reduction' | 'addition' | 'custom';
  value: number;
  explanation?: string;
}

interface DetailedStepsInputProps {
  steps: InputStep[];
  onChange: (steps: InputStep[]) => void;
  disabled?: boolean;
}

const stepTypeOptions = [
  { value: 'initial', label: 'Initial Value (Required)' },
  { value: 'exchange_rate', label: 'Exchange Rate' },
  { value: 'percentage_reduction', label: 'Percentage Reduction' },
  { value: 'fixed_reduction', label: 'Fixed Reduction' },
  { value: 'addition', label: 'Addition' },
  { value: 'custom', label: 'Custom' },
];

const DetailedStepsInput: React.FC<DetailedStepsInputProps> = ({ 
  steps, 
  onChange,
  disabled = false 
}) => {
  // Maximum number of steps allowed
  const MAX_STEPS = 10;

  // Helper function to get placeholder text based on step type
  const getValuePlaceholder = (type: string): string => {
    switch (type) {
      case 'initial': return 'Enter initial amount (e.g., 3000)';
      case 'exchange_rate': return 'Enter exchange rate (e.g., 5.673)';
      case 'percentage_reduction': return 'Enter percentage (e.g., 1 for 1%)';
      case 'fixed_reduction': return 'Enter fixed amount';
      case 'addition': return 'Enter amount to add';
      case 'custom': return 'Enter custom value';
      default: return 'Enter value';
    }
  };

  // Helper function to get description placeholder based on step type
  const getDescriptionPlaceholder = (type: string): string => {
    switch (type) {
      case 'initial': return 'Initial value';
      case 'exchange_rate': return 'Converting USD to BRL';
      case 'percentage_reduction': return '- 1% (tax)';
      case 'fixed_reduction': return 'Fixed fee deduction';
      case 'addition': return 'Add bonus';
      case 'custom': return 'Custom calculation';
      default: return 'Step description';
    }
  };

  // Add a new step
  const handleAddStep = () => {
    // Prevent adding more than the maximum allowed steps
    if (steps.length >= MAX_STEPS) {
      alert(`Maximum of ${MAX_STEPS} steps allowed for performance reasons.`);
      return;
    }
    
    // If no steps exist yet, default to initial step
    const defaultType = steps.length === 0 || !steps.some(step => step.type === 'initial') 
      ? 'initial' 
      : 'exchange_rate';
      
    const newStep: InputStep = {
      description: '',
      type: defaultType,
      value: 0,
      explanation: ''
    };
    onChange([...steps, newStep]);
  };

  // Remove a step
  const handleRemoveStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    onChange(newSteps);
  };

  // Update step field
  const handleStepChange = (index: number, field: keyof InputStep, value: string | number) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    onChange(newSteps);
  };

  // Check if we have an initial step
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
            <Card key={index} className={`p-4 relative ${step.type === 'initial' ? 'border-green-200 bg-green-50/30' : ''}`}>
              <div className="absolute right-2 top-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveStep(index)}
                  disabled={disabled}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <div className="space-y-4 pr-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`step-${index}-type`}>Step Type</Label>
                    <Select
                      value={step.type}
                      onValueChange={(value) => handleStepChange(index, 'type', value)}
                      disabled={disabled}
                    >
                      <SelectTrigger id={`step-${index}-type`}>
                        <SelectValue placeholder="Select step type" />
                      </SelectTrigger>
                      <SelectContent>
                        {stepTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`step-${index}-value`}>Value</Label>
                    <Input
                      id={`step-${index}-value`}
                      type="number"
                      step="0.001"
                      placeholder={getValuePlaceholder(step.type)}
                      value={step.value || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        handleStepChange(index, 'value', parseFloat(e.target.value) || 0)
                      }
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`step-${index}-description`}>Description</Label>
                  <Input
                    id={`step-${index}-description`}
                    placeholder={getDescriptionPlaceholder(step.type)}
                    value={step.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      handleStepChange(index, 'description', e.target.value)
                    }
                    disabled={disabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`step-${index}-explanation`}>Explanation (Optional)</Label>
                  <Textarea
                    id={`step-${index}-explanation`}
                    placeholder="Add additional context or explanation for this step"
                    value={step.explanation || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      handleStepChange(index, 'explanation', e.target.value)
                    }
                    disabled={disabled}
                    rows={2}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DetailedStepsInput; 