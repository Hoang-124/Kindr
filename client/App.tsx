// App.tsx
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import AppProvider from './src/app/providers/AppProvider';
import AppNavigator from './src/app/navigation/AppNavigator';
import { COLORS } from './src/theme';

export default function App() {
  return (
    <AppProvider>
      <View style={styles.root}>
        <View style={styles.appContainer}>
          <AppNavigator />
        </View>
      </View>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 720 : '100%',
    backgroundColor: COLORS.background,
  },
});
