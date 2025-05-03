import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define types for results
interface DetailedResult {
  stepId: string;
  description: string;
  amount: number;
  convertedAmount: number;
}

interface ResultsState {
  traditionalResult: number | null;
  detailedResults: DetailedResult[];
  sourceTotal: number | null;
  targetTotal: number | null;
  error: string | null;
}

// Define initial state
const initialState: ResultsState = {
  traditionalResult: null,
  detailedResults: [],
  sourceTotal: null,
  targetTotal: null,
  error: null,
};

// Create results slice
export const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setTraditionalResult: (state, action: PayloadAction<number>) => {
      state.traditionalResult = action.payload;
      state.error = null;
    },
    setDetailedResults: (state, action: PayloadAction<DetailedResult[]>) => {
      state.detailedResults = action.payload;
      state.error = null;
    },
    setTotals: (state, action: PayloadAction<{sourceTotal: number; targetTotal: number}>) => {
      state.sourceTotal = action.payload.sourceTotal;
      state.targetTotal = action.payload.targetTotal;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearResults: (state) => {
      state.traditionalResult = null;
      state.detailedResults = [];
      state.sourceTotal = null;
      state.targetTotal = null;
      state.error = null;
    },
  },
});

// Export actions and reducer
export const {
  setTraditionalResult,
  setDetailedResults,
  setTotals,
  setError,
  clearResults,
} = resultsSlice.actions;

export default resultsSlice.reducer; 