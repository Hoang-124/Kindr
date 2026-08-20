// src/features/notification/store/notificationSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Notification } from '../../../types/notification';

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notif = state.notifications.find(n => n.id === action.payload);
      if (notif) {
        notif.isRead = true;
      }
    },
    markAllAsRead: (state, action: PayloadAction<string>) => {
      state.notifications.forEach(n => {
        if (n.userId === action.payload) {
          n.isRead = true;
        }
      });
    },
  },
});

export const { addNotification, markAsRead, markAllAsRead } = notificationSlice.actions;
export default notificationSlice.reducer;
