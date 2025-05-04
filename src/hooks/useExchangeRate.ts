import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchExchangeRate } from '@/store/thunks/currencyThunks';

export function useExchangeRate() {
  const dispatch = useAppDispatch();
  const { sourceCurrency, targetCurrency } = useAppSelector(state => state.currency);
  
  const [exchangeRateLastUpdated, setExchangeRateLastUpdated] = useState<Date | null>(null);
  const [exchangeRateError, setExchangeRateError] = useState<string | null>(null);

  // Update exchange rate when currencies change
  useEffect(() => {
    if (sourceCurrency && targetCurrency) {
      dispatch(fetchExchangeRate({ 
        source: sourceCurrency, 
        target: targetCurrency 
      }))
        .unwrap() 
        .then(() => {
          setExchangeRateError(null);
          setExchangeRateLastUpdated(new Date());
        })
        .catch((error) => {
          console.error("Exchange rate fetch error:", error);
          setExchangeRateError(error?.message || 'Failed to fetch exchange rate');
          setExchangeRateLastUpdated(null);
        });
    }
  }, [dispatch, sourceCurrency, targetCurrency]);

  return {
    exchangeRateLastUpdated,
    exchangeRateError
  };
} 