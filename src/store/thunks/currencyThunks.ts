import { createAsyncThunk } from '@reduxjs/toolkit';
import { setExchangeRate } from '../slices/currencySlice';
import { setError } from '../slices/resultsSlice';
import { RootState } from '../store';

/**
 * Fetch the exchange rate for the currently selected currencies
 */
export const fetchExchangeRate = createAsyncThunk(
  'currency/fetchExchangeRate',
  async (_, { getState, dispatch }) => {
    const state = getState() as RootState;
    const { sourceCurrency, targetCurrency } = state.currency;
    
    try {
      // This is a placeholder for the actual API call
      // Replace with your actual API call to fetch exchange rates
      const response = await fetch(
        `/api/exchange-rates?source=${sourceCurrency.code}&target=${targetCurrency.code}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate');
      }
      
      const data = await response.json();
      dispatch(setExchangeRate(data.rate));
      return data.rate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching exchange rate';
      dispatch(setError(errorMessage));
      throw error;
    }
  }
); 