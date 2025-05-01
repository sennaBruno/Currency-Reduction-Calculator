import React from 'react';

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
      <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // If no steps to display, show informational message
  if (!steps || steps.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 my-4">
        <p className="text-gray-500">Enter values and click Calculate to see results.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4 my-4 overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4">Calculation Results</h2>
      
      {/* Initial USD to BRL conversion */}
      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <p className="font-medium">
          Initial BRL amount: {formatCurrency(initialBRLNoReduction, 'BRL')}
        </p>
      </div>

      {/* Results table */}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Step
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Initial Value (BRL)
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reduction (%)
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reduction Amount (BRL)
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Final Value (BRL)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {steps.map((step) => (
            <tr key={step.step} className={step.step % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {step.step}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatCurrency(step.initialBRL, 'BRL')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {step.reductionPercentage.toFixed(2)}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatCurrency(step.reductionAmountBRL, 'BRL')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatCurrency(step.finalBRL, 'BRL')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Final result after all reductions */}
      <div className="mt-4 p-3 bg-green-50 rounded-md">
        <p className="font-medium">
          Final amount after all reductions: {formatCurrency(steps[steps.length - 1].finalBRL, 'BRL')}
        </p>
      </div>
    </div>
  );
};

export default ResultsDisplay; 