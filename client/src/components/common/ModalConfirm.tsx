// src/components/common/ModalConfirm.tsx
import React from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableWithoutFeedback 
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme';
import Button from './Button';

interface ModalConfirmProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmTitle?: string;
  cancelTitle?: string;
  confirmVariant?: 'primary' | 'secondary' | 'outline' | 'error';
  loading?: boolean;
  children?: React.ReactNode;
}

export const ModalConfirm = ({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  confirmTitle = 'Xác nhận',
  cancelTitle = 'Hủy',
  confirmVariant = 'primary',
  loading = false,
  children,
}: ModalConfirmProps) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
              {children}
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  onPress={onClose} 
                  disabled={loading}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelText}>{cancelTitle}</Text>
                </TouchableOpacity>
                
                <Button
                  title={confirmTitle}
                  onPress={onConfirm}
                  variant={confirmVariant}
                  loading={loading}
                  style={styles.confirmBtn}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(34, 26, 17, 0.4)', // Muted dark overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.ambient,
  },
  title: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.onBackground,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  description: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.md,
  },
  cancelBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  cancelText: {
    color: COLORS.outline,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1,
    height: 44,
  },
});
export default ModalConfirm;
