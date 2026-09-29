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

import { ShieldCheck, AlertCircle } from 'lucide-react-native';

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
  cancelTitle = 'Hủy bỏ',
  confirmVariant = 'primary',
  loading = false,
  children,
}: ModalConfirmProps) => {
  const isEscrow = title.toLowerCase().includes('ký quỹ') || title.toLowerCase().includes('đổi đồ');
  const isDanger = confirmVariant === 'error';

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
              {/* Header Icon */}
              <View style={[
                styles.iconBadgeWrap, 
                isDanger ? styles.iconBadgeDanger : isEscrow ? styles.iconBadgeEscrow : styles.iconBadgePrimary
              ]}>
                {isDanger ? (
                  <AlertCircle size={24} color={COLORS.error} strokeWidth={2.4} />
                ) : (
                  <ShieldCheck size={24} color={isEscrow ? '#D97706' : COLORS.primary} strokeWidth={2.4} />
                )}
              </View>

              <Text style={styles.title}>{title}</Text>
              
              <View style={styles.descriptionBox}>
                <Text style={styles.description}>{description}</Text>
              </View>

              {children}
              
              {/* Actions Stack: Primary on top, cancel link underneath */}
              <View style={styles.buttonStack}>
                <Button
                  title={confirmTitle}
                  onPress={onConfirm}
                  variant={confirmVariant}
                  loading={loading}
                  style={styles.confirmBtn}
                />

                <TouchableOpacity 
                  onPress={onClose} 
                  disabled={loading}
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>{cancelTitle}</Text>
                </TouchableOpacity>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
    ...SHADOWS.ambient,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  iconBadgeWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconBadgePrimary: {
    backgroundColor: COLORS.primaryContainer,
  },
  iconBadgeEscrow: {
    backgroundColor: '#FEF3C7',
  },
  iconBadgeDanger: {
    backgroundColor: '#FEE2E2',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  descriptionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    width: '100%',
    marginBottom: 18,
  },
  description: {
    fontSize: 13.5,
    color: '#334155',
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonStack: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  confirmBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
  },
  cancelBtn: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});
export default ModalConfirm;
