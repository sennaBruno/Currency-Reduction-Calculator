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
        <div className="flex items-center">
          <RefreshCcwIcon className="h-3 w-3 mr-1 animate-spin" />
          <span>Checking update time...</span>
        </div>
      );
    }
    
    if (metadata?.time_last_update_utc) {
      // Mobile view 
      const mobileLayout = (
        <div className="grid gap-y-1 block sm:hidden">
          <div className="flex items-start">
            <div className="w-20 font-medium">Date:</div>
            <div>{formatApiTimestamp(metadata.time_last_update_utc)}</div>
          </div>
          
          <div className="flex items-start">
            <div className="w-20 font-medium">Time ago:</div>
            <div>{formatRelativeTimestamp(metadata.time_last_update_utc)}</div>
          </div>
          
          {metadata.time_next_update_utc && (
            <div className="flex items-start">
              <div className="w-20 font-medium">Next update:</div>
              <div>{formatRelativeTimestamp(metadata.time_next_update_utc)}</div>
            </div>
          )}
        </div>
      );
      
      // Desktop view 
      const desktopLayout = (
        <div className="hidden sm:flex sm:items-center">
          <div className="flex items-center">
            <div className="text-xs inline-flex items-center">
              <span>Updated: {formatApiTimestamp(metadata.time_last_update_utc)}</span>
              <span className="text-xs text-muted-foreground/70 ml-1">
                ({formatRelativeTimestamp(metadata.time_last_update_utc)})
              </span>
            </div>
          </div>
          
          {metadata.time_next_update_utc && (
            <div className="flex items-center ml-4">
              <div className="text-xs inline-flex items-center">
                <span>Next: in about {formatRelativeTimestamp(metadata.time_next_update_utc)}</span>
              </div>
            </div>
          )}
        </div>
      );
      
      return (
        <>
          {mobileLayout}
          {desktopLayout}
        </>
      );
    }
    
    // Default case for non-API timestamps
    const mobileLayout = exchangeRate?.timestamp ? (
      <div className="flex items-start block sm:hidden">
        <div className="w-20 font-medium">Date:</div>
        <div>{formatTimestamp(exchangeRate.timestamp)}</div>
      </div>
    ) : (
      <div className="flex items-center block sm:hidden">
        <RefreshCcwIcon className="h-3 w-3 mr-1" />
        <span>No update information available</span>
      </div>
    );
    
    const desktopLayout = exchangeRate?.timestamp ? (
      <div className="hidden sm:flex sm:items-center">
        <div className="text-xs inline-flex items-center">
          <span>Updated: {formatTimestamp(exchangeRate.timestamp)}</span>
        </div>
      </div>
    ) : (
      <div className="hidden sm:flex sm:items-center">
        <RefreshCcwIcon className="h-3 w-3 mr-1" />
        <span>No update information available</span>
      </div>
    );
    
    return (
      <>
        {mobileLayout}
        {desktopLayout}
      </>
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
        
        <div className="exchange-rate-value text-lg sm:text-xl font-semibold">
          1 {sourceCurrency.symbol} = {exchangeRate.rate?.toFixed(4) || '0.0000'} {targetCurrency.symbol}
        </div>
        
        <div className="exchange-rate-timestamp flex items-center mt-2 text-xs text-muted-foreground sm:border-t sm:pt-2">
          <CalendarIcon className="h-3 w-3 mr-1 sm:block hidden" />
          {renderTimestampSection()}
        </div>
      </div>
    </div>
  );
}; 