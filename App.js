// App.js - Kindr App - Main Entry Point
import React from 'react';
import { Provider } from 'react-redux';
import store from './src/app/store';
import { AppProvider } from './src/app/providers/AppProvider';
import { ItemProvider } from './src/app/providers/ItemProvider';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/app/navigation/AppNavigator';

export default function App() {
  return (
    <Provider store={store}>
      <AppProvider>
        <ItemProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ItemProvider>
      </AppProvider>
    </Provider>
  );
}
