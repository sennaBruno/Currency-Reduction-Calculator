'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { CalculationHistoryService } from '@/services/calculationHistoryService';
import { formatCurrency } from '@/domain/currency/currencyConversion.utils';
import { ArrowLeft, Trash2, Download } from 'lucide-react';

// Define a more complete type for calculations with steps included
interface CalculationWithSteps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  initialAmount: number;
  finalAmount: number;
  currencyCode: string;
  title: string | null;
  steps: Array<{
    id: string;
    calculationId: string;
    order: number;
    description: string;
    calculationDetails: string;
    resultIntermediate: number;
    resultRunningTotal: number;
    explanation: string | null;
    stepType: string;
  }>;
}

export default function CalculationDetailsPage() {
  const [calculation, setCalculation] = useState<CalculationWithSteps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      loadCalculation(id);
    }
  }, [id]);

  const loadCalculation = async (calculationId: string) => {
    setLoading(true);
    try {
      const data = await CalculationHistoryService.getCalculationById(calculationId);
      setCalculation(data as CalculationWithSteps);
      setError(null);
    } catch (err) {
      console.error('Failed to load calculation:', err);
      setError('Failed to load calculation details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!calculation) return;
    
    if (confirm('Are you sure you want to delete this calculation?')) {
      try {
        await CalculationHistoryService.deleteCalculation(calculation.id);
        router.push('/history');
      } catch (err) {
        console.error('Failed to delete calculation:', err);
        alert('Failed to delete calculation. Please try again.');
      }
    }
  };

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

  const handleDownload = () => {
    if (!calculation) return;
    
    // Create CSV content
    const headers = [
      'Step',
      'Description',
      'Calculation',
      'Result',
      'Running Total',
      'Explanation'
    ];
    
    const rows = calculation.steps
      .sort((a, b) => a.order - b.order)
      .map(step => [
        step.order.toString(),
        step.description,
        step.calculationDetails,
        step.resultIntermediate.toString(),
        step.resultRunningTotal.toString(),
        step.explanation || ''
      ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `calculation-${calculation.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-background">
      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Calculation Details</h1>
            <p className="text-muted-foreground mt-1">
              {calculation ? formatDate(calculation.createdAt) : 'Loading...'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/history')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </Button>
        </div>

        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full inline-block mb-2"></div>
            <p className="text-muted-foreground">Loading calculation details...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => loadCalculation(id)}>Try Again</Button>
          </div>
        ) : calculation ? (
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
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Calculation
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Calculation not found</p>
            <Button onClick={() => router.push('/history')}>Return to History</Button>
          </div>
        )}
      </main>
    </div>
  );
} 