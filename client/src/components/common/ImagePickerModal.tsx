// src/components/common/ImagePickerModal.tsx
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Camera, Image as ImageIcon, X, ChevronRight } from 'lucide-react-native';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../theme';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectLibrary: () => void;
  title?: string;
  subtitle?: string;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  onClose,
  onSelectCamera,
  onSelectLibrary,
  title = 'Chọn ảnh đăng đồ',
  subtitle = 'Chụp ảnh rõ nét, đủ ánh sáng để các mẹ dễ kiểm tra chất lượng đồ cho bé.',
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetCard}>
              {/* Top Handle Indicator (Mobile feel) */}
              <View style={styles.topHandleBar} />

              {/* Header with Title & Close */}
              <View style={styles.headerRow}>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.titleText}>{title}</Text>
                  {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
                </View>
                <TouchableOpacity 
                  onPress={onClose} 
                  style={styles.closeBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <X size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Action Options */}
              <View style={styles.optionsList}>
                {/* Option 1: Take Photo */}
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => {
                    onClose();
                    setTimeout(onSelectCamera, 200);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryLight }]}>
                    <Camera size={22} color={COLORS.primary} strokeWidth={2.2} />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>Chụp ảnh mới</Text>
                    <Text style={styles.optionDesc}>Mở máy ảnh chụp trực tiếp góc cạnh đồ dùng</Text>
                  </View>
                  <ChevronRight size={18} color={COLORS.outline} />
                </TouchableOpacity>

                {/* Option 2: Choose from Gallery */}
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => {
                    onClose();
                    setTimeout(onSelectLibrary, 200);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconCircle, { backgroundColor: COLORS.secondaryLight }]}>
                    <ImageIcon size={22} color={COLORS.secondary} strokeWidth={2.2} />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>Chọn từ thư viện ảnh</Text>
                    <Text style={styles.optionDesc}>Tải ảnh có sẵn trong bộ sưu tập trên máy</Text>
                  </View>
                  <ChevronRight size={18} color={COLORS.outline} />
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelButtonText}>Hủy bỏ</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? SPACING.md : 0,
  },
  sheetCard: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 440 : undefined,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderBottomLeftRadius: Platform.OS === 'web' ? RADIUS.xl : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? RADIUS.xl : 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm + 4,
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    ...SHADOWS.ambient,
  },
  topHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceVariant,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginTop: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsList: {
    gap: SPACING.sm + 2,
    marginVertical: SPACING.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    borderRadius: RADIUS.default,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
    minHeight: 62,
    ...SHADOWS.soft,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  optionDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cancelButton: {
    marginTop: SPACING.md,
    height: 46,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
});

export default ImagePickerModal;
