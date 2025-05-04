import { createAsyncThunk } from '@reduxjs/toolkit';
import { 
  setExchangeRate, 
  setLoading as setCurrencyLoading,
  setError as setCurrencyError
} from '../slices/currencySlice';
import { RootState } from '../store';

/**
 * Fetch exchange rate for a currency pair
 */
export const fetchExchangeRate = createAsyncThunk(
  'currency/fetchExchangeRate',
  async (
    { source, target }: { source: string; target: string },
    { dispatch, getState, rejectWithValue }
  ) => {
    const state = getState() as RootState;
    
    if (state.currency.isLoading) {
      return;
    }
    
    try {
      dispatch(setCurrencyLoading(true));
      
      const response = await fetch(`/api/exchange-rate/${source}/${target}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate');
      }
      
      const data = await response.json();
      
      dispatch(setExchangeRate({ 
        rate: data.rate, 
        metadata: {
          lastCacheRefreshTime: data.lastCacheRefreshTime,
          lastApiUpdateTime: data.lastApiUpdateTime,
          nextCacheRefreshTime: data.nextCacheRefreshTime,
          fromCache: data.fromCache || false,
          time_last_update_utc: data.time_last_update_utc || null,
          time_next_update_utc: data.time_next_update_utc || null
        }
      }));
      
      dispatch(setCurrencyError(null));
      return data.rate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      dispatch(setCurrencyError(errorMessage));
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setCurrencyLoading(false));
    }
  }
); 