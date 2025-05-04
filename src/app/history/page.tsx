'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  CardDescription
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { CalculationHistoryService } from '@/services/calculationHistoryService';
import { formatCurrency } from '@/domain/currency/currencyConversion.utils';
import { Trash2, Eye, ArrowLeft } from 'lucide-react';

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

export default function HistoryPage() {
  const [calculations, setCalculations] = useState<CalculationWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadCalculations();
  }, []);

  const loadCalculations = async () => {
    setLoading(true);
    try {
      const data = await CalculationHistoryService.getCalculations();
      setCalculations(data as CalculationWithSteps[]);
      setError(null);
    } catch (err) {
      console.error('Failed to load calculations:', err);
      setError('Failed to load calculation history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCalculation = async (id: string) => {
    if (confirm('Are you sure you want to delete this calculation?')) {
      try {
        await CalculationHistoryService.deleteCalculation(id);
        // Remove from local state to avoid another API call
        setCalculations(calculations.filter(calc => calc.id !== id));
      } catch (err) {
        console.error('Failed to delete calculation:', err);
        alert('Failed to delete calculation. Please try again.');
      }
    }
  };

  const handleViewDetails = (id: string) => {
    router.push(`/calculation/${id}`);
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

  return (
    <div className="bg-background">
      <main className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Calculation History</h1>
            <p className="text-muted-foreground mt-1">View your past calculations</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Calculator
          </Button>
        </div>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle>Your Calculations</CardTitle>
            <CardDescription>
              {calculations.length > 0 
                ? `Showing ${calculations.length} calculation${calculations.length !== 1 ? 's' : ''}`
                : 'No calculations found'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full inline-block mb-2"></div>
                <p className="text-muted-foreground">Loading calculations...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={loadCalculations}>Try Again</Button>
              </div>
            ) : calculations.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground mb-4">No calculation history found</p>
                <Button onClick={() => router.push('/')}>Make a Calculation</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Initial Amount</TableHead>
                      <TableHead>Final Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Steps</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.map((calc) => (
                      <TableRow key={calc.id}>
                        <TableCell className="font-medium">
                          {formatDate(calc.createdAt)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(calc.initialAmount, calc.currencyCode)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(calc.finalAmount, calc.currencyCode)}
                        </TableCell>
                        <TableCell>{calc.currencyCode}</TableCell>
                        <TableCell>{calc.steps.length}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleViewDetails(calc.id)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => handleDeleteCalculation(calc.id)}
                              className="text-destructive hover:bg-destructive/10"
                              title="Delete Calculation"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 