"use client";

import React from 'react';
import { CurrencySelector } from './CurrencySelector';
import { ExchangeRateDisplay } from './ExchangeRateDisplay';
import { ICurrency } from '../domain/currency';
import { ExchangeRate } from '../domain/currency/exchangeRate.type';

interface CurrencySectionProps {
  availableCurrencies: ICurrency[];
  sourceCurrency: ICurrency;
  targetCurrency: ICurrency;
  onSourceCurrencyChange: (currency: ICurrency) => void;
  onTargetCurrencyChange: (currency: ICurrency) => void;
  exchangeRate?: number | null;
  exchangeRateLastUpdated?: Date | string | null;
  exchangeRateIsLoading?: boolean;
  exchangeRateError?: string | null;
}

const CurrencySection: React.FC<CurrencySectionProps> = ({
  availableCurrencies,
  sourceCurrency,
  targetCurrency,
  onSourceCurrencyChange,
  onTargetCurrencyChange,
  exchangeRate,
  exchangeRateLastUpdated,
  exchangeRateIsLoading = false,
  exchangeRateError
}) => {
  // Create an ExchangeRate object when we have a valid rate
  const exchangeRateObject: ExchangeRate | undefined = exchangeRate 
    ? {
        currencyPair: {
          source: sourceCurrency,
          target: targetCurrency,
        },
        rate: exchangeRate,
        timestamp: exchangeRateLastUpdated ? new Date(exchangeRateLastUpdated) : new Date()
      }
    : undefined;

  if (exchangeRateIsLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <CurrencySelector
            currencies={availableCurrencies}
            selectedCurrency={sourceCurrency}
            onChange={onSourceCurrencyChange}
            label="Source Currency"
          />
          <CurrencySelector
            currencies={availableCurrencies}
            selectedCurrency={targetCurrency}
            onChange={onTargetCurrencyChange}
            label="Target Currency"
          />
        </div>
        
        <ExchangeRateDisplay 
          sourceCurrency={sourceCurrency} 
          targetCurrency={targetCurrency} 
          isLoading={true}
        />
      </div>
    );
  }

  if (exchangeRateError) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <CurrencySelector
            currencies={availableCurrencies}
            selectedCurrency={sourceCurrency}
            onChange={onSourceCurrencyChange}
            label="Source Currency"
          />
          <CurrencySelector
            currencies={availableCurrencies}
            selectedCurrency={targetCurrency}
            onChange={onTargetCurrencyChange}
            label="Target Currency"
          />
        </div>
        
        <div className="p-4 border border-red-500/50 bg-red-500/10 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">Error:</span> {exchangeRateError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <CurrencySelector
          currencies={availableCurrencies}
          selectedCurrency={sourceCurrency}
          onChange={onSourceCurrencyChange}
          label="Source Currency"
        />
        <CurrencySelector
          currencies={availableCurrencies}
          selectedCurrency={targetCurrency}
          onChange={onTargetCurrencyChange}
          label="Target Currency"
        />
      </div>
      
      {exchangeRate !== null && (
        <ExchangeRateDisplay 
          sourceCurrency={sourceCurrency} 
          targetCurrency={targetCurrency} 
          exchangeRate={exchangeRateObject}
        />
      )}
    </div>
  );
};

export default CurrencySection; 