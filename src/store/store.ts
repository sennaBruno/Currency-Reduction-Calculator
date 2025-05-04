import { configureStore } from '@reduxjs/toolkit';
import currencyReducer from './slices/currencySlice';
import calculatorReducer from './slices/calculatorSlice';
import resultsReducer from './slices/resultsSlice';

export const store = configureStore({
  reducer: {
    currency: currencyReducer,
    calculator: calculatorReducer,
    results: resultsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 