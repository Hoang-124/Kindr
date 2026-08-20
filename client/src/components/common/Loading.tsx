// src/components/common/Loading.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { COLORS, SPACING } from '../../theme';

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export const Loading = ({ message = 'Đang tải dữ liệu...', fullScreen = false }: LoadingProps) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: SPACING.md,
    fontSize: 14,
    color: COLORS.outline,
    fontWeight: '500',
  },
});
export default Loading;
