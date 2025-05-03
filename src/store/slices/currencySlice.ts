import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define types for the currency state
interface Currency {
  code: string;
  name: string;
  symbol: string;
}

interface CurrencyState {
  sourceCurrency: Currency;
  targetCurrency: Currency;
  exchangeRate: number;
  availableCurrencies: Currency[];
}

// Define the initial state
const initialState: CurrencyState = {
  sourceCurrency: { code: 'USD', name: 'US Dollar', symbol: '$' },
  targetCurrency: { code: 'EUR', name: 'Euro', symbol: '€' },
  exchangeRate: 0.85, // Default exchange rate
  availableCurrencies: [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  ],
};

// Create the currency slice
export const currencySlice = createSlice({
  name: 'currency',
  initialState,
  reducers: {
    setSourceCurrency: (state, action: PayloadAction<Currency>) => {
      state.sourceCurrency = action.payload;
    },
    setTargetCurrency: (state, action: PayloadAction<Currency>) => {
      state.targetCurrency = action.payload;
    },
    setExchangeRate: (state, action: PayloadAction<number>) => {
      state.exchangeRate = action.payload;
    },
    addCurrency: (state, action: PayloadAction<Currency>) => {
      if (!state.availableCurrencies.find(c => c.code === action.payload.code)) {
        state.availableCurrencies.push(action.payload);
      }
    },
    removeCurrency: (state, action: PayloadAction<string>) => {
      state.availableCurrencies = state.availableCurrencies.filter(
        c => c.code !== action.payload
      );
    },
  },
});

// Export actions and reducer
export const {
  setSourceCurrency,
  setTargetCurrency,
  setExchangeRate,
  addCurrency,
  removeCurrency,
} = currencySlice.actions;

export default currencySlice.reducer; 