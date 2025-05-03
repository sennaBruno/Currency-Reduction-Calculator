"use client";

import React, { useEffect } from 'react';
import { CurrencySelector } from './CurrencySelector';
import { ExchangeRateDisplay } from './ExchangeRateDisplay';
import { ICurrency } from '../domain/currency';
import { ExchangeRate } from '../domain/currency/exchangeRate.type';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSourceCurrency, setTargetCurrency, setExchangeRate } from '@/store/slices/currencySlice';
import { setLoading } from '@/store/slices/calculatorSlice';
import { ExchangeRateService } from '@/services';

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
    sourceCurrency, 
    targetCurrency, 
    exchangeRate,
    availableCurrencies 
  } = useAppSelector((state: any) => state.currency);
  const calculatorIsLoading = useAppSelector((state: any) => state.calculator.isLoading);
  
  const isLoading = exchangeRateIsLoading || calculatorIsLoading;

  const handleSourceCurrencyChange = (currency: ICurrency) => {
    dispatch(setSourceCurrency(currency));
    fetchExchangeRateForCurrencyPair(currency, targetCurrency);
  };

  const handleTargetCurrencyChange = (currency: ICurrency) => {
    dispatch(setTargetCurrency(currency));
    fetchExchangeRateForCurrencyPair(sourceCurrency, currency);
  };
  
  const fetchExchangeRateForCurrencyPair = async (source: ICurrency, target: ICurrency) => {
    dispatch(setLoading(true));
    
    try {
      const rateData = await ExchangeRateService.getExchangeRateForPairWithMetadata(source, target);
      if (rateData.rate !== null) {
        dispatch(setExchangeRate(rateData.rate));
      }
    } catch (error) {
      console.error(`Exchange rate fetch error for ${source.code}/${target.code}:`, error);
      dispatch(setExchangeRate(0)); 
    } finally {
      dispatch(setLoading(false));
    }
  };

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

  if (exchangeRateError) {
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