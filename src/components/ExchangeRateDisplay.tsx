import React from 'react';
import { ExchangeRate, ICurrency } from '../domain/currency';
import { cn } from '@/lib/utils';
import { CalendarIcon, RefreshCcwIcon } from 'lucide-react';

interface ExchangeRateDisplayProps {
  sourceCurrency: ICurrency;
  targetCurrency: ICurrency;
  exchangeRate?: ExchangeRate;
  isLoading?: boolean;
}

/**
 * Component for displaying the current exchange rate between two currencies
 */
export const ExchangeRateDisplay: React.FC<ExchangeRateDisplayProps> = ({
  sourceCurrency,
  targetCurrency,
  exchangeRate,
  isLoading = false
}) => {
  const formatTimestamp = (date?: Date): string => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="p-4 rounded-md border border-input bg-muted/20 animate-pulse">
        <div className="flex items-center text-sm text-muted-foreground">
          <RefreshCcwIcon className="mr-2 h-4 w-4 animate-spin" /> 
          Loading exchange rate...
        </div>
      </div>
    );
  }

  if (!exchangeRate) {
    return (
      <div className="p-4 rounded-md border border-input bg-muted/20">
        <div className="text-sm text-muted-foreground">
          Exchange rate unavailable for {sourceCurrency.code} to {targetCurrency.code}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-md border border-input bg-card text-card-foreground shadow-sm",
      "transition-all duration-200 hover:shadow-md"
    )}>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-medium">{sourceCurrency.code}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium">{targetCurrency.code}</span>
          </div>
        </div>
        
        <div className="exchange-rate-value text-xl font-semibold">
          1 {sourceCurrency.symbol} = {exchangeRate.rate.toFixed(4)} {targetCurrency.symbol}
        </div>
        
        {exchangeRate.timestamp && (
          <div className="exchange-rate-timestamp flex items-center text-xs text-muted-foreground mt-2">
            <CalendarIcon className="h-3 w-3 mr-1" />
            Last updated: {formatTimestamp(exchangeRate.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}; 