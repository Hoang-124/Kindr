// src/app/providers/AppProvider.tsx
import React, { ReactNode, useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import ThemeProvider from './ThemeProvider';
import AuthProvider from './AuthProvider';
import { STORAGE_KEYS } from '../../utils/constants';
import { CustomAlertProvider } from '../../components/common/CustomAlert';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate store from AsyncStorage on startup
  useEffect(() => {
    const hydrateStore = async () => {
      try {
        const userStateJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_STATE);
        const productsJson = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
        const transactionsJson = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const chatsJson = await AsyncStorage.getItem(STORAGE_KEYS.CHATS);

        // We can dispatch hydration actions if data exists.
        // For simplicity, we will seed initial state in slices, but if there's saved data,
        // we can dispatch actions to restore them.
        if (userStateJson) {
          const parsed = JSON.parse(userStateJson);
          if (parsed && parsed.currentUser) {
            store.dispatch({ type: 'auth/hydrateAuth', payload: parsed });
          }
        }
        if (productsJson) {
          const parsed = JSON.parse(productsJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            store.dispatch({ type: 'home/hydrateProducts', payload: parsed });
          }
        }
        if (transactionsJson) {
          const parsed = JSON.parse(transactionsJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            store.dispatch({ type: 'exchange/hydrateTransactions', payload: parsed });
          }
        }
        if (chatsJson) {
          const parsed = JSON.parse(chatsJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            store.dispatch({ type: 'chat/hydrateChats', payload: parsed });
          }
        }
      } catch (e) {
        console.error('Failed to hydrate state:', e);
      } finally {
        setIsHydrated(true);
      }
    };

    hydrateStore();
  }, []);

  // Subscribe to store changes to save state to AsyncStorage
  useEffect(() => {
    if (!isHydrated) return;

    const unsubscribe = store.subscribe(async () => {
      try {
        const state = store.getState();
        
        await AsyncStorage.setItem(STORAGE_KEYS.USER_STATE, JSON.stringify({
          currentUser: state.auth.currentUser,
          allUsers: state.auth.allUsers,
        }));
        await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(state.home.products));
        await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.exchange.transactions));
        await AsyncStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(state.chat.chats));
      } catch (e) {
        console.error('Failed to save state to AsyncStorage:', e);
      }
    });

    return () => unsubscribe();
  }, [isHydrated]);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <CustomAlertProvider />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
};

export default AppProvider;
