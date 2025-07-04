import { configureStore } from '@reduxjs/toolkit';
import toastReducer from './toastSlice';

export const store = configureStore({
  reducer: {
    toasts: toastReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 