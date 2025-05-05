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
  CardDescription
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/domain/currency/currencyConversion.utils';
import { Eye, ArrowLeft } from 'lucide-react';
import { getCalculationsForUser } from '../actions';
import { DeleteCalculationButton } from '@/components/calculations/DeleteCalculationButton';
import { Calculation } from '@/lib/types/Calculation';

export default async function HistoryPage() {
  const calculations = await getCalculationsForUser() as Calculation[];
  
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
            asChild
            className="flex items-center gap-2"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Calculator
            </Link>
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
            {calculations.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground mb-4">No calculation history found</p>
                <Button asChild>
                  <Link href="/">Make a Calculation</Link>
                </Button>
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
                              asChild
                              title="View Details"
                            >
                              <Link href={`/calculation/${calc.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <DeleteCalculationButton id={calc.id} />
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