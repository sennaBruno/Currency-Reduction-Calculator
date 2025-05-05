import Link from 'next/link';
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
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/domain/currency/currencyConversion.utils';
import { ArrowLeft } from 'lucide-react';
import { getCalculationForUser } from '@/app/actions';
import { DeleteCalculationButton } from '@/components/calculations/DeleteCalculationButton';
import { DownloadButton } from '@/components/calculations/DownloadButton';
import { notFound } from 'next/navigation';

interface CalculationStep {
  id: string;
  order: number;
  description: string;
  calculationDetails: string;
  resultIntermediate: number;
  resultRunningTotal: number;
  explanation?: string | null;
  stepType: string;
}

interface Calculation {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  initialAmount: number;
  finalAmount: number;
  currencyCode: string;
  title?: string | null;
  userId?: string | null;
  steps: CalculationStep[];
}

export default async function CalculationDetailsPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const id = params.id;
  const calculation = await getCalculationForUser(id) as Calculation;
  
  if (!calculation) {
    return notFound();
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-background">
      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Calculation Details</h1>
            <p className="text-muted-foreground mt-1">
              {formatDate(calculation.createdAt)}
            </p>
          </div>
          <Button
            variant="outline"
            asChild
            className="flex items-center gap-2"
          >
            <Link href="/history">
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>{calculation.title || 'Calculation'}</CardTitle>
              <CardDescription>
                Summary of calculation results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Initial Amount</p>
                  <p className="text-lg font-medium">
                    {formatCurrency(calculation.initialAmount, calculation.currencyCode)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Final Amount</p>
                  <p className="text-lg font-medium">
                    {formatCurrency(calculation.finalAmount, calculation.currencyCode)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Steps</p>
                  <p className="text-lg font-medium">{calculation.steps.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Steps Card */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle>Calculation Steps</CardTitle>
              <CardDescription>
                Detailed steps of the calculation process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Step</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Calculation</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Running Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculation.steps
                      .sort((a, b) => a.order - b.order)
                      .map((step) => (
                        <TableRow key={step.id}>
                          <TableCell className="font-medium">{step.order}</TableCell>
                          <TableCell>
                            <span className="capitalize">{step.stepType.replace('_', ' ')}</span>
                          </TableCell>
                          <TableCell>{step.description}</TableCell>
                          <TableCell>{step.calculationDetails}</TableCell>
                          <TableCell>
                            {formatCurrency(step.resultIntermediate, calculation.currencyCode)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(step.resultRunningTotal, calculation.currencyCode)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t">
              <Button variant="outline" asChild>
                <Link href="/history">Back to History</Link>
              </Button>
              <div className="flex gap-2">
                <DownloadButton calculation={calculation} />
                <DeleteCalculationButton id={calculation.id} />
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
} 