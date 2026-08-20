// App.tsx
import React from 'react';
import AppProvider from './src/app/providers/AppProvider';
import AppNavigator from './src/app/navigation/AppNavigator';

export default function App() {
  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
}
