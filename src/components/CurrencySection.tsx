"use client";

import React, { useEffect, useMemo, useCallback } from 'react';
import { CurrencySelector } from './CurrencySelector';
import { ExchangeRateDisplay } from './ExchangeRateDisplay';
import { ICurrency } from '../domain/currency';
import { ExchangeRate } from '../domain/currency/exchangeRate.type';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSourceCurrency, setTargetCurrency } from '@/store/slices/currencySlice';
import { CurrencyRegistry } from '@/application/currency/currencyRegistry.service';
import { fetchExchangeRate } from '@/store/thunks/currencyThunks';
import { RootState } from '@/store/store';

const currencyRegistry = new CurrencyRegistry();

interface CurrencySectionProps {
  exchangeRateLastUpdated?: Date | string | null;
  exchangeRateIsLoading?: boolean;
  exchangeRateError?: string | null;
}

const CurrencySection: React.FC<CurrencySectionProps> = ({
  exchangeRateLastUpdated,
  exchangeRateIsLoading = false,
  exchangeRateError
}) => {
  const dispatch = useAppDispatch();
  const { 
    sourceCurrency: sourceCode, 
    targetCurrency: targetCode, 
    exchangeRate,
    availableCurrencies: availableCurrencyCodes,
    isLoading: currencyIsLoading,
    error: currencyError
  } = useAppSelector((state: RootState) => state.currency);
  
  const availableCurrencies = useMemo(() => {
    return availableCurrencyCodes
      .map((code: string) => currencyRegistry.getCurrencyByCode(code))
      .filter(Boolean) as ICurrency[];
  }, [availableCurrencyCodes]);

  const sourceCurrency = useMemo(() => 
    currencyRegistry.getCurrencyByCode(sourceCode) as ICurrency, 
    [sourceCode]
  );
  
  const targetCurrency = useMemo(() => 
    currencyRegistry.getCurrencyByCode(targetCode) as ICurrency, 
    [targetCode]
  );
  
  const calculatorIsLoading = useAppSelector((state: RootState) => state.calculator.isLoading);
  const isLoading = currencyIsLoading || calculatorIsLoading || exchangeRateIsLoading;
  
  const fetchExchangeRateForCurrencyPair = useCallback(async (source: ICurrency, target: ICurrency) => {
    try {
      await dispatch(fetchExchangeRate({ 
        source: source.code, 
        target: target.code 
      }));
    } catch (error) {
      console.error(`Exchange rate fetch error for ${source.code}/${target.code}:`, error);
    }
  }, [dispatch]);

  // Fetch exchange rate if not available
  useEffect(() => {
    if (exchangeRate === null && !isLoading) {
      console.log('Fetching initial exchange rate because it was null');
      fetchExchangeRateForCurrencyPair(sourceCurrency, targetCurrency);
    }
  }, [exchangeRate, isLoading, sourceCurrency, targetCurrency, fetchExchangeRateForCurrencyPair]);

  const handleSourceCurrencyChange = (currency: ICurrency) => {
    dispatch(setSourceCurrency(currency));
    fetchExchangeRateForCurrencyPair(currency, targetCurrency);
  };

  const handleTargetCurrencyChange = (currency: ICurrency) => {
    dispatch(setTargetCurrency(currency));
    fetchExchangeRateForCurrencyPair(sourceCurrency, currency);
  };
  
  const exchangeRateObject: ExchangeRate | undefined = exchangeRate !== null
    ? {
        currencyPair: {
          source: sourceCurrency,
          target: targetCurrency,
        },
        rate: exchangeRate,
        timestamp: exchangeRateLastUpdated ? new Date(exchangeRateLastUpdated) : new Date()
      }
    : undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <CurrencySelector
            currencies={availableCurrencies}
            selectedCurrency={sourceCurrency}
            onChange={handleSourceCurrencyChange}
            label="Source Currency"
          />
          <CurrencySelector
            currencies={availableCurrencies}
            selectedCurrency={targetCurrency}
            onChange={handleTargetCurrencyChange}
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

  if (currencyError || exchangeRateError) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <CurrencySelector
            currencies={availableCurrencies}
            selectedCurrency={sourceCurrency}
            onChange={handleSourceCurrencyChange}
            label="Source Currency"
          />
          <CurrencySelector
            currencies={availableCurrencies}
            selectedCurrency={targetCurrency}
            onChange={handleTargetCurrencyChange}
            label="Target Currency"
          />
        </div>
        
        <div className="p-4 border border-red-500/50 bg-red-500/10 rounded-md">
          <p className="text-sm text-red-700 dark:text-red-400">
            <span className="font-semibold">Error:</span> {currencyError || exchangeRateError}
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
          onChange={handleSourceCurrencyChange}
          label="Source Currency"
        />
        <CurrencySelector
          currencies={availableCurrencies}
          selectedCurrency={targetCurrency}
          onChange={handleTargetCurrencyChange}
          label="Target Currency"
        />
      </div>
      
      {exchangeRate !== null && exchangeRateObject && (
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