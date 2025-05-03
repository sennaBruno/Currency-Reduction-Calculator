import { configureStore } from '@reduxjs/toolkit';
import currencyReducer from './slices/currencySlice';
import calculatorReducer from './slices/calculatorSlice';
import resultsReducer from './slices/resultsSlice';

// The store will be updated with actual reducers once slices are created
export const store = configureStore({
  reducer: {
    currency: currencyReducer,
    calculator: calculatorReducer,
    results: resultsReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 