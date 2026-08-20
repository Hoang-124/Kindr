// src/components/common/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../theme';
import Button from './Button';
import { AlertCircle } from 'lucide-react-native';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionTitle?: string;
  onActionPress?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState = ({
  title = 'Không tìm thấy kết quả',
  description = 'Thử thay đổi bộ lọc hoặc tìm kiếm bằng từ khóa khác mẹ nhé.',
  actionTitle,
  onActionPress,
  icon,
}: EmptyStateProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon || <AlertCircle size={48} color={COLORS.outline} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      
      {actionTitle && onActionPress && (
        <Button 
          title={actionTitle} 
          onPress={onActionPress} 
          style={styles.btn} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: SPACING.md,
    opacity: 0.7,
  },
  title: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.onBackground,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  description: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.outline,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  btn: {
    marginTop: SPACING.sm,
    maxWidth: 200,
  },
});
export default EmptyState;
