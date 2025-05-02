import React, { useEffect, useState } from 'react';
import { ExchangeRate, ICurrency } from '../domain/currency';
import { cn } from '@/lib/utils';
import { CalendarIcon, RefreshCcwIcon, InfoIcon } from 'lucide-react';
import { formatDate, parseUTCString, parseISODate, formatRelativeTime } from '../utils/dateUtils';

interface ExchangeRateDisplayProps {
  sourceCurrency: ICurrency;
  targetCurrency: ICurrency;
  exchangeRate?: ExchangeRate;
  isLoading?: boolean;
}

interface ExchangeRateMetadata {
  lastApiUpdateTime: string | null;
  lastCacheRefreshTime: string;
  nextCacheRefreshTime: string;
  fromCache: boolean;
  time_last_update_utc: string | null;
  time_next_update_utc: string | null;
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
  const [metadata, setMetadata] = useState<ExchangeRateMetadata | null>(null);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);

  useEffect(() => {
    if (exchangeRate) {
      fetchMetadata();
    }
  }, [exchangeRate]);

  const fetchMetadata = async () => {
    try {
      setIsMetadataLoading(true);
      const response = await fetch('/api/exchange-rate-metadata');
      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
      }
    } catch (error) {
      console.error('Error fetching exchange rate metadata:', error);
    } finally {
      setIsMetadataLoading(false);
    }
  };

  const formatTimestamp = (dateString?: string | Date): string => {
    if (!dateString) return '';
    return formatDate(dateString);
  };

  const formatUtcString = (utcString: string | null): string => {
    if (!utcString) return '';
    
    try {
      const date = parseUTCString(utcString);
      
      return date ? formatDate(date) : utcString;
    } catch (e) {
      return utcString;
    }
  };

  const formatRelativeUpdate = (utcString: string | null): string => {
    if (!utcString) return '';
    
    const date = parseUTCString(utcString);
    return date ? formatRelativeTime(date) : '';
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
        
        <div className="exchange-rate-timestamp flex items-center text-xs text-muted-foreground mt-2">
          <CalendarIcon className="h-3 w-3 mr-1" />
          <span>
            {isMetadataLoading ? (
              <span className="flex items-center">
                <RefreshCcwIcon className="h-3 w-3 mr-1 animate-spin" />
                Checking update time...
              </span>
            ) : metadata?.time_last_update_utc ? (
              <div className="flex flex-col space-y-1">
                <div>
                  Last updated: {formatUtcString(metadata.time_last_update_utc)}
                  <span className="text-xs text-muted-foreground/70 ml-1">
                    ({formatRelativeUpdate(metadata.time_last_update_utc)})
                  </span>
                  <span className="inline-flex items-center ml-1 group relative">
                    <InfoIcon className="h-3 w-3 text-muted-foreground/70 cursor-help" />
                    <span className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-background border border-border rounded text-xs w-48 text-center">
                      This timestamp comes directly from the exchange rate API and shows when they last updated their rates.
                    </span>
                  </span>
                </div>
                {metadata.time_next_update_utc && (
                  <div>
                    Next update: {formatUtcString(metadata.time_next_update_utc)}
                    <span className="text-xs text-muted-foreground/70 ml-1">
                      ({formatRelativeUpdate(metadata.time_next_update_utc)})
                    </span>
                    <span className="inline-flex items-center ml-1 group relative">
                      <InfoIcon className="h-3 w-3 text-muted-foreground/70 cursor-help" />
                      <span className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-background border border-border rounded text-xs w-48 text-center">
                        The ExchangeRate API updates rates once every 24 hours according to our plan.
                      </span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <>
                Last updated: {formatTimestamp(exchangeRate.timestamp)}
                <span className="inline-flex items-center ml-1 group relative">
                  <InfoIcon className="h-3 w-3 text-muted-foreground/70 cursor-help" />
                  <span className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-background border border-border rounded text-xs w-48 text-center">
                    Using fallback timestamp from rate data.
                  </span>
                </span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}; 