// src/app/providers/AppProvider.tsx
import React, { createContext, useReducer, ReactNode, Dispatch } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  score: number;
  wallet_balance: number;
  status: string;
  location?: string;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'request' | 'escrow' | 'complete' | 'dispute';
  text: string;
  time: string;
  icon: string;
  read: boolean;
}

export interface AppState {
  user: UserProfile | null;
  theme: 'light' | 'dark';
  notifications: NotificationItem[];
  hasSeenOnboarding: boolean;
}

export type AppAction =
  | { type: 'LOGIN'; payload: UserProfile }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<UserProfile> }
  | { type: 'TOGGLE_THEME' }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationItem };

const initialState: AppState = {
  user: {
    id: '1',
    name: 'Bống Min',
    email: 'mebong@gmail.com',
    phone: '0987654321',
    avatar: '👩',
    score: 95,
    wallet_balance: 15,
    status: 'ACTIVE'
  },
  theme: 'light',
  notifications: [
    { id: '1', type: 'like', text: 'Có mẹ vừa thích món đồ "Xe đẩy Combi" của bạn', time: '5 phút trước', icon: '💕', read: false },
    { id: '2', type: 'request', text: 'Có yêu cầu nhận đồ mới cho "Bộ xếp hình Lego"', time: '15 phút trước', icon: '📦', read: false },
    { id: '3', type: 'escrow', text: 'Xu đang được gấu giữ an toàn cho giao dịch #1024', time: '1 giờ trước', icon: '🧸', read: true },
    { id: '4', type: 'complete', text: 'Tuyệt quá mẹ ơi! Giao dịch "Sách vải cho bé" đã hoàn tất', time: '2 giờ trước', icon: '🎉', read: true },
    { id: '5', type: 'dispute', text: 'Khiếu nại về "Xe tập đi" đang được admin xem xét', time: '1 ngày trước', icon: '🔍', read: true },
  ],
  hasSeenOnboarding: false,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload };
    case 'LOGOUT':
      return { ...state, user: null };
    case 'UPDATE_USER':
      return { ...state, user: state.user ? { ...state.user, ...action.payload } : null };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'COMPLETE_ONBOARDING':
      return { ...state, hasSeenOnboarding: true };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };
    default:
      return state;
  }
};

export const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
