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

interface CalculationStep {
  step: number;
  initialBRL: number;
  reductionPercentage: number;
  reductionAmountBRL: number;
  finalBRL: number;
}

interface ResultsDisplayProps {
  steps: CalculationStep[];
  initialBRLNoReduction: number;
  error?: string;
}

// Helper function to format currency values
const formatCurrency = (value: number, currency: string): string => {
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
  error 
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
              {steps.map((step) => (
                <TableRow key={step.step} className={step.step % 2 === 0 ? 'bg-muted/20' : ''}>
                  <TableCell className="font-medium">{step.step}</TableCell>
                  <TableCell>{formatCurrency(step.initialBRL, 'BRL')}</TableCell>
                  <TableCell>{step.reductionPercentage.toFixed(2)}%</TableCell>
                  <TableCell>{formatCurrency(step.reductionAmountBRL, 'BRL')}</TableCell>
                  <TableCell>{formatCurrency(step.finalBRL, 'BRL')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Final result after all reductions */}
        <Card className="mt-4 bg-accent/10 border-accent/20">
          <CardContent className="py-3">
            <p className="font-medium">
              Final amount after all reductions: {formatCurrency(steps[steps.length - 1].finalBRL, 'BRL')}
            </p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default ResultsDisplay; 