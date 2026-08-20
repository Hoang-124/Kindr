// src/app/store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../../features/auth/store/authSlice';
import homeReducer from '../../features/home/store/homeSlice';
import exchangeReducer from '../../features/exchange/store/exchangeSlice';
import chatReducer from '../../features/chat/store/chatSlice';
import ratingReducer from '../../features/grade/store/ratingSlice';
import reportReducer from '../../features/trust-safety/store/reportSlice';
import notificationReducer from '../../features/notification/store/notificationSlice';

export const rootReducer = combineReducers({
  auth: authReducer,
  home: homeReducer,
  exchange: exchangeReducer,
  chat: chatReducer,
  rating: ratingReducer,
  report: reportReducer,
  notification: notificationReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
