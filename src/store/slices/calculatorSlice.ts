import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InputStep } from '@/types/calculator';

// Define calculator state type
interface CalculatorState {
  calculationMode: 'traditional' | 'detailed';
  traditionalFormInput: string;
  detailedSteps: InputStep[];
  isLoading: boolean;
}

// Define initial state
const initialState: CalculatorState = {
  calculationMode: 'traditional',
  traditionalFormInput: '',
  detailedSteps: [],
  isLoading: false,
};

// Create calculator slice
export const calculatorSlice = createSlice({
  name: 'calculator',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<'traditional' | 'detailed'>) => {
      state.calculationMode = action.payload;
    },
    updateTraditionalInput: (state, action: PayloadAction<string>) => {
      state.traditionalFormInput = action.payload;
    },
    setDetailedSteps: (state, action: PayloadAction<InputStep[]>) => {
      state.detailedSteps = action.payload;
    },
    addStep: (state, action: PayloadAction<InputStep>) => {
      state.detailedSteps.push(action.payload);
    },
    updateStep: (state, action: PayloadAction<{index: number, updates: Partial<InputStep>}>) => {
      const { index, updates } = action.payload;
      if (index >= 0 && index < state.detailedSteps.length) {
        state.detailedSteps[index] = {
          ...state.detailedSteps[index],
          ...updates,
        };
      }
    },
    removeStep: (state, action: PayloadAction<number>) => {
      state.detailedSteps.splice(action.payload, 1);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    clearForm: (state) => {
      state.traditionalFormInput = '';
      state.detailedSteps = [];
    },
  },
});

// Export actions and reducer
export const {
  setMode,
  updateTraditionalInput,
  setDetailedSteps,
  addStep,
  updateStep,
  removeStep,
  setLoading,
  clearForm,
} = calculatorSlice.actions;

export default calculatorSlice.reducer; 