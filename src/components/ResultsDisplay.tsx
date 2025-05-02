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

// Legacy interface
interface CalculationStep {
  step: number;
  initialBRL?: number; // Make optional to handle both formats
  reductionPercentage?: number; // Make optional
  reductionAmountBRL?: number; // Make optional
  finalBRL?: number; // Make optional
  // New format properties
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
}

// Helper function to format currency values
const formatCurrency = (value: number | undefined, currency: string): string => {
  if (value === undefined || isNaN(Number(value))) return 'N/A';
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  steps, 
  initialBRLNoReduction,
  error,
  onDownload
}) => {
  // If there's an error, display the error message
  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/10 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-destructive">Calculation Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive font-medium mb-2">Error details:</p>
          <div className="p-3 bg-background/50 rounded-md border border-destructive/20 text-sm">
            {error}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Please check your input values and try again. If the problem persists, try simplifying your calculation.
          </p>
        </CardContent>
      </Card>
    );
  }

  // If no steps to display, show informational message
  if (!steps || steps.length === 0) {
    return (
      <Card className="border-muted bg-muted/20 shadow-sm">
        <CardContent className="py-8">
          <p className="text-muted-foreground text-center">Enter values and click Calculate to see results.</p>
        </CardContent>
      </Card>
    );
  }

  // Extract the final value
  let finalValue = initialBRLNoReduction;
  if (steps.length > 0) {
    // Try to get the final value from the last step
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
        {/* Initial USD to BRL conversion */}
        <Card className="mb-4 bg-primary/10 border-primary/20">
          <CardContent className="py-3">
            <p className="font-medium">
              Initial BRL amount: {formatCurrency(initialBRLNoReduction, 'BRL')}
            </p>
          </CardContent>
        </Card>

        {/* Results table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Step</TableHead>
                <TableHead>Initial Value (BRL)</TableHead>
                <TableHead>Reduction (%)</TableHead>
                <TableHead>Reduction Amount (BRL)</TableHead>
                <TableHead>Final Value (BRL)</TableHead>
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
                      {formatCurrency(hasLegacyFormat ? step.initialBRL : undefined, 'BRL')}
                    </TableCell>
                    <TableCell>
                      {hasLegacyFormat && step.reductionPercentage !== undefined
                        ? `${step.reductionPercentage.toFixed(2)}%` 
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(reductionAmount, 'BRL')}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(stepFinalValue, 'BRL')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Final result after all reductions */}
        <Card className="mt-4 bg-accent/10 border-accent/20">
          <CardContent className="py-3">
            <p className="font-medium">
              Final amount after all reductions: {formatCurrency(finalValue, 'BRL')}
            </p>
          </CardContent>
        </Card>
        
        {/* Download button */}
        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            className="flex items-center gap-2" 
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