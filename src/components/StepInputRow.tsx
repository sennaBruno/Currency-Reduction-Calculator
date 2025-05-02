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
import { Card } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { ICurrency } from '../domain/currency';
import { InputStep, stepTypeOptions, getStepDescriptionPlaceholder, getStepValuePlaceholder } from '../types/calculator';

interface StepInputRowProps {
  step: InputStep;
  index: number;
  onChange: (index: number, field: keyof InputStep, value: string | number) => void;
  onDelete: (index: number) => void;
  disabled?: boolean;
  sourceCurrency?: ICurrency;
  targetCurrency?: ICurrency;
}

const StepInputRow: React.FC<StepInputRowProps> = ({
  step,
  index,
  onChange,
  onDelete,
  disabled = false,
  sourceCurrency,
  targetCurrency
}) => {
  return (
    <Card key={index} className={`p-4 relative ${step.type === 'initial' ? 'border-green-200 bg-green-50/30' : ''}`}>
      <div className="absolute right-2 top-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDelete(index)}
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
              onValueChange={(value) => onChange(index, 'type', value)}
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
              placeholder={getStepValuePlaceholder(step.type)}
              value={step.value || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                onChange(index, 'value', parseFloat(e.target.value) || 0)
              }
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`step-${index}-description`}>
            Description
            {step.type === 'exchange_rate' && sourceCurrency && targetCurrency && (
              <span className="text-xs text-muted-foreground ml-2">
                ({sourceCurrency.code} → {targetCurrency.code})
              </span>
            )}
          </Label>
          <Input
            id={`step-${index}-description`}
            placeholder={getStepDescriptionPlaceholder(step.type, sourceCurrency, targetCurrency)}
            value={step.description}
            onChange={(e) => onChange(index, 'description', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`step-${index}-explanation`}>
            Explanation (Optional)
          </Label>
          <Textarea
            id={`step-${index}-explanation`}
            placeholder="Provide context for this calculation step"
            value={step.explanation || ''}
            onChange={(e) => onChange(index, 'explanation', e.target.value)}
            disabled={disabled}
            rows={2}
          />
        </div>
      </div>
    </Card>
  );
};

export default StepInputRow; 