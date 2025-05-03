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

interface DetailedCalculationStep {
  step: number;
  description: string;
  calculation_details: string;
  result_intermediate: number;
  result_running_total: number;
  explanation?: string;
}

interface DetailedResultsDisplayProps {
  steps: DetailedCalculationStep[];
  final_result: number;
  error?: string;
  onDownload?: () => void;
  sourceCurrency?: ICurrency;
  targetCurrency?: ICurrency;
}

const DetailedResultsDisplay: React.FC<DetailedResultsDisplayProps> = ({ 
  steps, 
  final_result,
  error,
  onDownload,
  sourceCurrency = { code: 'USD', symbol: '$', name: 'US Dollar' },
  targetCurrency = { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' }
}) => {
  const reduxError = useAppSelector(state => state.results.error);
  const displayError = reduxError || error;
  
  if (displayError) {
    return (
      <Card className="border-destructive/20 bg-destructive/10 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{displayError}</p>
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

  const getCurrencyForStep = (step: DetailedCalculationStep): ICurrency => {
    if (step.description.toLowerCase().includes('convert')) {
      return step.result_running_total === step.result_intermediate 
        ? sourceCurrency 
        : targetCurrency;
    }
    
    const conversionIndex = steps.findIndex(s => 
      s.description.toLowerCase().includes('convert')
    );
    
    if (conversionIndex === -1 || step.step <= conversionIndex) {
      return sourceCurrency;
    }
    
    return targetCurrency;
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle>Calculation Results</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Results table */}
        <div className="rounded-md border mb-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Step</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Calculation</TableHead>
                <TableHead className="text-right">Result</TableHead>
                <TableHead className="text-right">Running Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {steps.map((step) => {
                const stepCurrency = getCurrencyForStep(step);
                return (
                  <TableRow key={step.step} className={step.step % 2 === 0 ? 'bg-muted/20' : ''}>
                    <TableCell className="font-medium">{step.step}</TableCell>
                    <TableCell>
                      <div>
                        <p>{step.description || 'N/A'}</p>
                        {step.explanation && (
                          <p className="text-xs text-muted-foreground mt-1">{step.explanation}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted/30 px-1 py-0.5 rounded">
                        {step.calculation_details || 'N/A'}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(step.result_intermediate, stepCurrency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(step.result_running_total, stepCurrency)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Final result after all steps */}
        <Card className="mt-4 bg-accent/10 border-accent/20">
          <CardContent className="py-3">
            <p className="font-medium">
              Final amount after all calculations: {formatCurrency(final_result, targetCurrency)}
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

export default DetailedResultsDisplay; 