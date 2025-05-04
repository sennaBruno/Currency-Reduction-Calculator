import React from 'react';
import { ExchangeRate, ICurrency } from '../domain/currency';
import { cn } from '@/lib/utils';
import { CalendarIcon, RefreshCcwIcon, InfoIcon } from 'lucide-react';
import { formatDate, parseUTCString, formatRelativeTime } from '../utils/dateUtils';
import { useAppSelector } from '@/store/hooks';

interface ExchangeRateDisplayProps {
  sourceCurrency: ICurrency;
  targetCurrency: ICurrency;
  exchangeRate?: ExchangeRate;
  isLoading?: boolean;
}

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="inline-flex items-center ml-1 group relative">
    <InfoIcon className="h-3 w-3 text-muted-foreground/70 cursor-help" />
    <span className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-background border border-border rounded text-xs w-48 text-center">
      {text}
    </span>
  </span>
);

/**
 * Component for displaying the current exchange rate between two currencies
 */
export const ExchangeRateDisplay: React.FC<ExchangeRateDisplayProps> = ({
  sourceCurrency,
  targetCurrency,
  exchangeRate,
  isLoading = false
}) => {
  const { metadata } = useAppSelector(state => state.currency);

  const formatTimestamp = (dateString?: string | Date): string => 
    dateString ? formatDate(dateString, 'MMM d, yyyy') : '';

  const formatApiTimestamp = (utcString: string | null): string => 
    utcString ? formatDate(parseUTCString(utcString), 'MMM d, yyyy') : '';
    
  const formatRelativeTimestamp = (utcString: string | null): string => {
    if (!utcString) return '';
    const date = parseUTCString(utcString);
    return date ? formatRelativeTime(date) : '';
  };

  // Loading state
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

  // Empty state
  if (!exchangeRate) {
    return (
      <div className="p-4 rounded-md border border-input bg-muted/20">
        <div className="text-sm text-muted-foreground">
          Exchange rate unavailable for {sourceCurrency.code} to {targetCurrency.code}
        </div>
      </div>
    );
  }

  const renderTimestampSection = () => {
    if (isLoading) {
      return (
        <span className="flex items-center">
          <RefreshCcwIcon className="h-3 w-3 mr-1 animate-spin" />
          Checking update time...
        </span>
      );
    }
    
    if (metadata?.time_last_update_utc) {
      return (
        <div className="flex flex-wrap items-center gap-x-3">
          <span className="flex items-center">
            Updated: {formatApiTimestamp(metadata.time_last_update_utc)} 
            <span className="text-xs text-muted-foreground/70 ml-1">
              ({formatRelativeTimestamp(metadata.time_last_update_utc)})
            </span>
            <InfoTooltip text="This timestamp comes directly from the exchange rate API and shows when they last updated their rates." />
          </span>
          
          {metadata.time_next_update_utc && (
            <span className="flex items-center">
              Next: {formatRelativeTimestamp(metadata.time_next_update_utc)}
              <InfoTooltip text="The ExchangeRate API updates rates once every 24 hours according to our plan." />
            </span>
          )}
        </div>
      );
    }
    
    return exchangeRate?.timestamp ? (
      <span className="flex items-center">
        Updated: {formatTimestamp(exchangeRate.timestamp)}
        <InfoTooltip text="This timestamp is from our local cache." />
      </span>
    ) : (
      <span className="flex items-center">
        <RefreshCcwIcon className="h-3 w-3 mr-1" />
        No update information available
      </span>
    );
  };

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
          1 {sourceCurrency.symbol} = {exchangeRate.rate?.toFixed(4) || '0.0000'} {targetCurrency.symbol}
        </div>
        
        <div className="exchange-rate-timestamp flex items-center text-xs text-muted-foreground mt-2">
          <CalendarIcon className="h-3 w-3 mr-1" />
          {renderTimestampSection()}
        </div>
      </div>
    </div>
  );
}; 