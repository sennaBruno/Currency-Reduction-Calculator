import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ICurrency } from '../domain/currency';
import { formatCurrency } from '../domain/currency/currencyConversion.utils';
import { useAppSelector } from '@/store/hooks';

// Legacy interface
interface CalculationStep {
  step: number;
  initialBRL?: number; 
  reductionPercentage?: number; 
  reductionAmountBRL?: number; 
  finalBRL?: number; 
  description?: string;
  calculation_details?: string;
  result_intermediate?: number;
  result_running_total?: number;
  explanation?: string;
}

interface ResultsDisplayProps {
  steps: CalculationStep[];
  initialBRLNoReduction: number;
  error?: string;
  onDownload?: () => void;
  sourceCurrency?: ICurrency;
  targetCurrency?: ICurrency;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  steps, 
  initialBRLNoReduction,
  error,
  onDownload,
  targetCurrency = { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' }
}) => {
  const reduxError = useAppSelector(state => state.results.error);
  const displayError = reduxError || error;
  
  if (displayError) {
    return (
      <Card className="border-destructive/20 bg-destructive/10 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-destructive">Calculation Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive font-medium mb-2">Error details:</p>
          <div className="p-3 bg-background/50 rounded-md border border-destructive/20 text-sm">
            {displayError}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Please check your input values and try again. If the problem persists, try simplifying your calculation.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!steps || steps.length === 0) {
    return (
      <Card className="border-muted bg-muted/20 shadow-sm">
        <CardContent className="py-8">
          <p className="text-muted-foreground text-center">Enter values and click Calculate to see results.</p>
        </CardContent>
      </Card>
    );
  }

  let finalValue = initialBRLNoReduction;
  if (steps.length > 0) {
    const lastStep = steps[steps.length - 1];
    if (lastStep.finalBRL !== undefined) {
      finalValue = lastStep.finalBRL;
    } else if (lastStep.result_running_total !== undefined) {
      finalValue = lastStep.result_running_total;
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>Calculation Results</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Initial Currency Conversion */}
        <Card className="mb-4 bg-primary/10 border-primary/20">
          <CardContent className="py-3">
            <p className="font-medium">
              Initial {targetCurrency.code} amount: {formatCurrency(initialBRLNoReduction, targetCurrency)}
            </p>
          </CardContent>
        </Card>

        {/* Results table for desktop */}
        <div className="rounded-md border hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Step</TableHead>
                <TableHead>Initial Value ({targetCurrency.code})</TableHead>
                <TableHead>Reduction (%)</TableHead>
                <TableHead>Reduction Amount ({targetCurrency.code})</TableHead>
                <TableHead>Final Value ({targetCurrency.code})</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {steps.map((step) => {
                // Check which format is being used for this step
                const hasLegacyFormat = step.initialBRL !== undefined && 
                                       step.reductionPercentage !== undefined &&
                                       step.reductionAmountBRL !== undefined &&
                                       step.finalBRL !== undefined;
                                       
                // Get final value for this step
                const stepFinalValue = hasLegacyFormat 
                  ? step.finalBRL 
                  : step.result_running_total;
                
                // Get reduction amount for this step
                const reductionAmount = hasLegacyFormat 
                  ? step.reductionAmountBRL 
                  : step.result_intermediate;
                
                return (
                  <TableRow key={step.step} className={step.step % 2 === 0 ? 'bg-muted/20' : ''}>
                    <TableCell className="font-medium">{step.step}</TableCell>
                    <TableCell>
                      {formatCurrency(hasLegacyFormat ? step.initialBRL : undefined, targetCurrency)}
                    </TableCell>
                    <TableCell>
                      {hasLegacyFormat && step.reductionPercentage !== undefined
                        ? `${step.reductionPercentage.toFixed(2)}%` 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(reductionAmount, targetCurrency)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(stepFinalValue, targetCurrency)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile-friendly cards display */}
        <div className="space-y-4 md:hidden">
          {steps.map((step) => {
            const hasLegacyFormat = step.initialBRL !== undefined && 
                                 step.reductionPercentage !== undefined &&
                                 step.reductionAmountBRL !== undefined &&
                                 step.finalBRL !== undefined;
                                 
            const stepFinalValue = hasLegacyFormat 
              ? step.finalBRL 
              : step.result_running_total;
            
            const reductionAmount = hasLegacyFormat 
              ? step.reductionAmountBRL 
              : step.result_intermediate;
              
            return (
              <Card key={step.step} className={`border ${step.step % 2 === 0 ? 'bg-muted/10' : ''}`}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex justify-between items-center pb-1 border-b">
                    <h3 className="font-semibold">Step {step.step}</h3>
                    {hasLegacyFormat && step.reductionPercentage !== undefined && (
                      <span className="text-sm bg-primary/10 px-2 py-0.5 rounded">
                        {step.reductionPercentage.toFixed(2)}%
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                    <span className="text-muted-foreground">Initial:</span>
                    <span className="text-right">{formatCurrency(hasLegacyFormat ? step.initialBRL : undefined, targetCurrency)}</span>
                    
                    <span className="text-muted-foreground">Reduction:</span>
                    <span className="text-right">{formatCurrency(reductionAmount, targetCurrency)}</span>
                    
                    <span className="text-muted-foreground font-medium">Final:</span>
                    <span className="text-right font-medium">{formatCurrency(stepFinalValue, targetCurrency)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Final result after all reductions */}
        <Card className="mt-4 bg-accent/10 border-accent/20">
          <CardContent className="py-3">
            <p className="font-medium">
              Final amount after all calculations: {formatCurrency(finalValue, targetCurrency)}
            </p>
          </CardContent>
        </Card>
        
        {/* Download button */}
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 w-full sm:w-auto" 
            onClick={onDownload}
            disabled={!onDownload}
          >
            <Download size={16} />
            Download Result (.txt)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsDisplay; 