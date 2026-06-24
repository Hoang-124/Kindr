// src/app/store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';
import walletReducer from './walletSlice';

const rootReducer = combineReducers({
  wallet: walletReducer,
});

export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;
