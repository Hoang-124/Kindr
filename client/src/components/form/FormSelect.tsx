// src/components/form/FormSelect.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  StyleSheet, 
  ViewStyle 
} from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS, TYPOGRAPHY } from '../../theme';
import { ChevronDown } from 'lucide-react-native';

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  containerStyle?: ViewStyle;
  error?: string;
  compact?: boolean;
}

export const FormSelect = ({
  label,
  placeholder = 'Chọn một tùy chọn',
  options,
  selectedValue,
  onValueChange,
  containerStyle,
  error,
  compact = false,
}: FormSelectProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find(opt => opt.value === selectedValue);

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, compact && styles.compactContainer, containerStyle]}>
      {label && <Text style={[styles.label, compact && styles.compactLabel]}>{label}</Text>}
      
      <TouchableOpacity 
        style={[
          styles.selectTrigger, 
          compact && styles.compactSelectTrigger,
          error ? styles.errorBorder : null
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={[
          styles.triggerText,
          !selectedOption ? styles.placeholderText : null
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={20} color={COLORS.outline} />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Chọn tùy chọn'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeText}>Đóng</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      isSelected ? styles.selectedOption : null
                    ]}
                    onPress={() => handleSelect(item.value)}
                  >
                    <Text style={[
                      styles.optionText,
                      isSelected ? styles.selectedOptionText : null
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  compactContainer: {
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onBackground,
    marginBottom: SPACING.xs,
  },
  compactLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    color: COLORS.onSurfaceVariant,
  },
  selectTrigger: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.default,
    paddingHorizontal: SPACING.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  compactSelectTrigger: {
    height: 40,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  triggerText: {
    fontSize: 15,
    color: COLORS.onSurface,
  },
  placeholderText: {
    color: COLORS.outline,
  },
  errorBorder: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(34, 26, 17, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: '50%',
    minHeight: '30%',
    ...SHADOWS.ambient,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceVariant,
  },
  modalTitle: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.primary,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.tertiary,
  },
  listContent: {
    paddingVertical: SPACING.sm,
  },
  optionItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  selectedOption: {
    backgroundColor: COLORS.secondaryContainer,
  },
  optionText: {
    fontSize: 16,
    color: COLORS.onSurface,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: COLORS.primary,
  },
});
export default FormSelect;
