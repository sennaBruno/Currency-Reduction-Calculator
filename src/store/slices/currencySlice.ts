import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define types for the currency state
interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface ExchangeRateMetadata {
  lastCacheRefreshTime: string;
  lastApiUpdateTime: string;
  nextCacheRefreshTime: string;
  fromCache: boolean;
  time_last_update_utc: string | null;
  time_next_update_utc: string | null;
}

interface CurrencyState {
  sourceCurrency: string;
  targetCurrency: string;
  exchangeRate: number | null;
  isLoading: boolean;
  error: string | null;
  availableCurrencies: string[];
  metadata: ExchangeRateMetadata | null;
}

const initialState: CurrencyState = {
  sourceCurrency: 'USD',
  targetCurrency: 'BRL',
  exchangeRate: null,
  isLoading: false,
  error: null,
  availableCurrencies: ['USD', 'BRL', 'EUR', 'GBP', 'JPY'],
  metadata: null,
};

// Create the currency slice
export const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setSourceCurrency: (state, action: PayloadAction<Currency>) => {
      state.sourceCurrency = action.payload.code;
    },
    setTargetCurrency: (state, action: PayloadAction<Currency>) => {
      state.targetCurrency = action.payload.code;
    },
    setExchangeRate: (state, action: PayloadAction<{ rate: number; metadata?: ExchangeRateMetadata }>) => {
      state.exchangeRate = action.payload.rate;
      state.isLoading = false;
      
      // If metadata is provided with the exchange rate, update it
      if (action.payload.metadata) {
        state.metadata = action.payload.metadata;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    addCurrency: (state, action: PayloadAction<Currency>) => {
      if (!state.availableCurrencies.find(c => c === action.payload.code)) {
        state.availableCurrencies.push(action.payload.code);
      }
    },
    removeCurrency: (state, action: PayloadAction<string>) => {
      state.availableCurrencies = state.availableCurrencies.filter(
        c => c !== action.payload
      );
    }
  },
});

export const {
  setSourceCurrency,
  setTargetCurrency,
  setExchangeRate,
  setLoading,
  setError,
  addCurrency,
  removeCurrency,
} = currencySlice.actions;

export default currencySlice.reducer; 