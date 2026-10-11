// App.tsx
import React from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Alert } from 'react-native';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import AppProvider from './src/app/providers/AppProvider';
import AppNavigator from './src/app/navigation/AppNavigator';
import { COLORS } from './src/theme';

// Polyfill Alert.alert on Web so confirmation callbacks execute properly
if (Platform.OS === 'web') {
  Alert.alert = (title?: string, message?: string, buttons?: any[]) => {
    const text = `${title ? title + '\n\n' : ''}${message || ''}`;
    if (!buttons || buttons.length <= 1) {
      window.alert(text);
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
      return;
    }

    // Multi-button: cancel vs confirm
    const confirmBtn = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];
    const cancelBtn = buttons.find((b) => b.style === 'cancel');

    const confirmed = window.confirm(text);
    if (confirmed) {
      confirmBtn?.onPress?.();
    } else {
      cancelBtn?.onPress?.();
    }
  };
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

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
