import React from 'react';
import { ExchangeRate, ICurrency } from '../domain/currency';

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
    return <div className="exchange-rate-loading">Loading exchange rate...</div>;
  }

  if (!exchangeRate) {
    return (
      <div className="exchange-rate-unavailable">
        Exchange rate unavailable for {sourceCurrency.code} to {targetCurrency.code}
      </div>
    );
  }

  return (
    <div className="exchange-rate-display">
      <div className="exchange-rate-value">
        1 {sourceCurrency.symbol} = {exchangeRate.rate.toFixed(4)} {targetCurrency.symbol}
      </div>
      {exchangeRate.timestamp && (
        <div className="exchange-rate-timestamp">
          Last updated: {formatTimestamp(exchangeRate.timestamp)}
        </div>
      )}
    </div>
  );
}; 