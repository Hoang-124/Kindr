// src/features/notification/store/notificationSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../../../types/notification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = Math.max(0, action.payload);
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      const existsIndex = state.notifications.findIndex(n => n.id === action.payload.id);
      if (existsIndex >= 0) {
        state.notifications[existsIndex] = action.payload;
      } else {
        state.notifications.unshift(action.payload);
        if (!action.payload.isRead) {
          state.unreadCount += 1;
        }
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notif = state.notifications.find(n => n.id === action.payload);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state, action: PayloadAction<string | undefined>) => {
      state.notifications.forEach(n => {
        if (!action.payload || n.userId === action.payload) {
          n.isRead = true;
        }
      });
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder.addCase('auth/logoutAsync/fulfilled', (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    });
  },
});

export const { 
  setNotifications, 
  setUnreadCount, 
  addNotification, 
  markAsRead, 
  markAllAsRead,
  clearNotifications,
} = notificationSlice.actions;
export default notificationSlice.reducer;
