// src/features/exchange/screens/DisputeFormScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { fileDispute, fileDisputeAsync } from '../store/exchangeSlice';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { ShieldAlert, AlertTriangle, Camera, Check, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

const REASONS = [
  'Đồ nhận được không giống mô tả (rách, hỏng, thiếu phụ kiện) ❌',
  'Gửi sai món đồ hoặc đồ chơi không hoạt động được 🧸',
  'Sản phẩm mất vệ sinh, không an toàn cho bé sơ sinh 🧼',
  'Lý do khác (Mẹ ghi rõ chi tiết bên dưới) 📝',
];

export const DisputeFormScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const { transactionId } = route.params || {};
  const transactions = useAppSelector((state) => state.exchange.transactions);
  const tx = transactions.find(t => t.id === transactionId);

  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!tx) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Không tìm thấy giao dịch" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Giao dịch không tồn tại hoặc lỗi tải dữ liệu.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleAddPhoto = () => {
    if (evidenceImages.length >= 3) {
      Alert.alert('Giới hạn', 'Mẹ chỉ có thể đăng tối đa 3 ảnh bằng chứng.');
      return;
    }

    Alert.alert(
      'Chụp ảnh bằng chứng lỗi 📸',
      'Mẹ muốn chụp ảnh vết lỗi trực tiếp hay chọn từ thư viện ảnh?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chụp ảnh mới',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Quyền truy cập', 'Kindr cần quyền truy cập camera để chụp bằng chứng.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setEvidenceImages(prev => [...prev, result.assets[0].uri]);
            }
          },
        },
        {
          text: 'Chọn từ thư viện',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Quyền truy cập', 'Kindr cần quyền truy cập thư viện ảnh để chọn bằng chứng.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              setEvidenceImages(prev => [...prev, result.assets[0].uri]);
            }
          },
        },
      ]
    );
  };

  const handleSubmitDispute = async () => {
    if (!details.trim()) {
      Alert.alert('Lưu ý', 'Mẹ vui lòng mô tả chi tiết vấn đề gặp phải để ban quản trị đối soát.');
      return;
    }

    setLoading(true);

    const fullReason = `${selectedReason}\nChi tiết: ${details}`;

    try {
      await dispatch(fileDisputeAsync({
        transactionId: tx.id,
        reason: fullReason,
        evidenceImages: evidenceImages,
      })).unwrap();
    } catch (e) {
      dispatch(fileDispute({
        transactionId: tx.id,
        reason: fullReason,
        evidenceImages: evidenceImages,
      }));
    }

    setLoading(false);

    Alert.alert(
      'Đã gửi khiếu nại thành công! 🛡️',
      'Hệ thống đã ghi nhận khiếu nại bảo chứng của mẹ. Số xu giao dịch vẫn sẽ được tạm khóa an toàn.\n\nBan quản trị Kindr sẽ làm trọng tài kiểm tra bằng chứng và liên hệ phân xử trong vòng 24h.',
      [{ text: 'Đồng ý', onPress: () => navigation.navigate('Main' as any) }]
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Gửi Khiếu Nại Giao Dịch" showBack />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.alertBox}>
          <ShieldAlert size={20} color={COLORS.error} />
          <Text style={styles.alertText}>
            Hệ thống Bảo chứng Kindr đang tạm khóa **{tx.buyerEscrowFrozen} Xu**. Số xu này sẽ không được giải phóng cho đến khi khiếu nại này được phân xử.
          </Text>
        </View>

        <Text style={styles.prodName}>Đồ dùng: {tx.productName}</Text>

        {/* Reason Selector */}
        <Text style={styles.sectionTitle}>Lý do khiếu nại:</Text>
        <View style={styles.reasonsList}>
          {REASONS.map((r, idx) => {
            const isSelected = selectedReason === r;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.reasonItem, isSelected && styles.reasonItemSelected]}
                onPress={() => setSelectedReason(r)}
                activeOpacity={0.8}
              >
                <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                  {r}
                </Text>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Check size={10} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Details Input */}
        <Input
          label="Mô tả chi tiết lỗi/vấn đề"
          placeholder="Mẹ hãy ghi rõ tình trạng món đồ nhận được, lỗi so với mô tả của người bán..."
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={4}
          style={styles.detailsInput}
          icon={<AlertTriangle size={20} color={COLORS.outline} />}
        />

        {/* Attach Photos */}
        <Text style={styles.sectionTitle}>Hình ảnh bằng chứng thực tế:</Text>
        <View style={styles.photoUploadRow}>
          {evidenceImages.map((uri, i) => (
            <View key={i} style={styles.photoBox}>
              <Image source={{ uri }} style={styles.photoBoxImg} />
              <TouchableOpacity 
                style={styles.deletePhotoIcon}
                onPress={() => {
                  setEvidenceImages(prev => prev.filter((_, idx) => idx !== i));
                }}
                activeOpacity={0.7}
              >
                <X size={12} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ))}
          
          {evidenceImages.length < 3 && (
            <TouchableOpacity 
              style={styles.uploadBtn}
              onPress={handleAddPhoto}
              activeOpacity={0.8}
            >
              <Camera size={24} color={COLORS.outline} />
              <Text style={styles.uploadBtnText}>Thêm ảnh</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.uploadHelper}>Hãy đính kèm tối thiểu 1 ảnh chụp rõ nhãn mác hoặc chỗ bị lỗi.</Text>

        <Button
          title="Gửi khiếu nại lên Admin"
          onPress={handleSubmitDispute}
          loading={loading}
          style={styles.submitBtn}
        />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
  },
  alertBox: {
    backgroundColor: COLORS.errorContainer + '20',
    borderWidth: 1,
    borderColor: COLORS.errorContainer,
    borderRadius: 20,
    padding: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onErrorContainer,
    flex: 1,
    lineHeight: 16,
  },
  prodName: {
    fontSize: 12,
    color: COLORS.outline,
    fontWeight: '600',
    paddingHorizontal: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: SPACING.md,
  },
  reasonsList: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  reasonItem: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.soft,
  },
  reasonItemSelected: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorContainer + '10',
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurface,
    flex: 1,
    paddingRight: SPACING.md,
  },
  reasonTextSelected: {
    color: COLORS.error,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsInput: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm,
  },
  photoUploadRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginVertical: SPACING.xs,
  },
  photoBox: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: COLORS.primaryContainer + '15',
    borderWidth: 1.5,
    borderColor: COLORS.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoBoxText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  uploadBtn: {
    width: 76,
    height: 76,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  uploadBtnText: {
    fontSize: 10,
    color: COLORS.outline,
    fontWeight: '600',
    marginTop: 4,
  },
  uploadHelper: {
    fontSize: 10,
    color: COLORS.outline,
    fontWeight: '500',
    marginTop: 6,
    marginBottom: SPACING.xl,
  },
  submitBtn: {
    height: 52,
    backgroundColor: COLORS.error,
  },
  photoBoxImg: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  deletePhotoIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.background,
    ...SHADOWS.soft,
  },
});

export default DisputeFormScreen;
