// src/components/form/FormError.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../../theme';
import { AlertTriangle } from 'lucide-react-native';

interface FormErrorProps {
  message?: string;
}

export const FormError = ({ message }: FormErrorProps) => {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <AlertTriangle size={18} color={COLORS.error} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorContainer,
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(186, 26, 26, 0.1)',
  },
  errorText: {
    color: COLORS.onErrorContainer,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
export default FormError;
