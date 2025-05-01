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
}

// Helper function to format currency values
const formatCurrency = (value: number | undefined, currency: string): string => {
  if (value === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const DetailedResultsDisplay: React.FC<DetailedResultsDisplayProps> = ({ 
  steps, 
  final_result,
  error,
  onDownload
}) => {
  // If there's an error, display the error message
  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/10 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
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

  // Find the currency from steps (assuming first step with a positive result is the currency we want)
  const currency = steps.some(step => step.result_intermediate > 0) ? 'BRL' : 'USD';
  
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
              {steps.map((step) => (
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
                    {formatCurrency(step.result_intermediate, currency)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(step.result_running_total, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Final result after all steps */}
        <Card className="mt-4 bg-accent/10 border-accent/20">
          <CardContent className="py-3">
            <p className="font-medium">
              Final amount after all calculations: {formatCurrency(final_result, currency)}
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