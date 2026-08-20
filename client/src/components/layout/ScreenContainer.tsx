// src/components/layout/ScreenContainer.tsx
import React, { ReactNode } from 'react';
import { 
  StyleSheet, 
  View, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  ViewStyle, 
  StatusBar
} from 'react-native';
import { COLORS } from '../../theme';
import Loading from '../common/Loading';

interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const ScreenContainer = ({
  children,
  scrollable = false,
  loading = false,
  style,
  contentContainerStyle,
}: ScreenContainerProps) => {
  if (loading) {
    return <Loading fullScreen />;
  }

  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        >
          {children}
        </ScrollView>
      );
    }
    return <View style={[styles.content, contentContainerStyle]}>{children}</View>;
  };

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {renderContent()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
export default ScreenContainer;
