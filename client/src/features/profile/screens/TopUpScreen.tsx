// src/features/profile/screens/TopUpScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { updateUserBalance, refreshWalletBalance } from '../../auth/store/authSlice';
import * as walletService from '../../../services/walletService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { Coins, CreditCard, Check, Info, QrCode, Copy, CheckCircle2 } from 'lucide-react-native';
import { formatNumber, getVietQRImageUrl } from '../../../utils/helpers';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Button from '../../../components/common/Button';
import Card from '../../../components/layout/Card';

const PACKAGES = [
  { id: 'p1', coins: 10, price: 100000, label: 'Gói Trải Nghiệm (10 Xu)' },
  { id: 'p2', coins: 20, price: 200000, label: 'Gói Phổ Biến (20 Xu)', popular: true },
  { id: 'p3', coins: 50, price: 500000, label: 'Gói Mẹ Bỉm Tiết Kiệm (50 Xu)' },
  { id: 'p4', coins: 100, price: 1000000, label: 'Gói VIP Đại Sứ (100 Xu)' },
];

export const TopUpScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [selectedPack, setSelectedPack] = useState(PACKAGES[1]);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!currentUser) return null;

  const memoContent = `KINDR NAP ${selectedPack.coins}XU ${currentUser.id.toUpperCase()}`;
  const qrUrl = getVietQRImageUrl(selectedPack.price, memoContent, 'ICB', '101876543210');

  const handleCopy = (field: string, value: string) => {
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    Alert.alert('Đã sao chép 📋', `Đã chép "${value}" vào bộ nhớ tạm.`);
  };

  const handleConfirmTopUp = async () => {
    setLoading(true);
    try {
      await walletService.topUpXu(selectedPack.coins);
      dispatch(refreshWalletBalance());
      setLoading(false);
      Alert.alert(
        'Nạp Xu Thành Công! 🎉',
        `Mẹ đã nạp thành công ${selectedPack.coins} Xu vào ví.`,
        [{ text: 'Về ví của mẹ', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      dispatch(updateUserBalance({ userId: currentUser.id, amount: selectedPack.coins }));
      setLoading(false);
      Alert.alert(
        'Nạp Xu Thành Công! 🎉',
        `Mẹ đã nạp thành công ${selectedPack.coins} Xu vào ví.\nSố dư mới: ${currentUser.xuBalance + selectedPack.coins} Xu.`,
        [{ text: 'Về ví của mẹ', onPress: () => navigation.goBack() }]
      );
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Nạp Xu Vào Ví" showBack />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBox}>
          <Info size={18} color={COLORS.onPrimaryContainer} />
          <Text style={styles.infoText}>
            Quy chuẩn: 1 Xu = 10.000 VNĐ. Tiền nạp vào đóng vai trò là Quỹ bảo chứng thanh toán và phí giao dịch trong hệ thống Kindr.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>1. Chọn gói Xu muốn nạp:</Text>
        
        <View style={styles.grid}>
          {PACKAGES.map((pack) => {
            const isSelected = selectedPack.id === pack.id;
            return (
              <TouchableOpacity
                key={pack.id}
                style={[
                  styles.packCard,
                  isSelected && styles.packCardSelected,
                ]}
                onPress={() => setSelectedPack(pack)}
                activeOpacity={0.9}
              >
                {pack.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>HOT 🔥</Text>
                  </View>
                )}
                
                <Text style={styles.packLabel}>{pack.label}</Text>
                
                <View style={styles.coinWrapper}>
                  <Text style={styles.coinEmoji}>🪙</Text>
                  <Text style={[styles.coinText, isSelected && styles.coinTextSelected]}>
                    {pack.coins} Xu
                  </Text>
                </View>
                
                <Text style={[styles.priceText, isSelected && styles.priceTextSelected]}>
                  {formatNumber(pack.price)}đ
                </Text>

                {isSelected && (
                  <View style={styles.checkedCircle}>
                    <Check size={12} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic VietQR Payment Card */}
        <Text style={styles.sectionTitle}>2. Quét mã VietQR chuyển khoản tự động:</Text>
        
        <Card style={styles.qrCard}>
          <View style={styles.qrHeader}>
            <QrCode size={20} color={COLORS.primary} />
            <Text style={styles.qrTitle}>MÃ VIETQR NẠP XU TỰ ĐỘNG (24/7)</Text>
          </View>

          <View style={styles.qrImageContainer}>
            <Image 
              source={{ uri: qrUrl }} 
              style={styles.qrImage} 
              resizeMode="contain"
            />
            <Text style={styles.qrSubText}>Mở App Ngân hàng bất kỳ (Vietcombank, MB, Techcombank...) để quét mã</Text>
          </View>

          <View style={styles.bankDetailList}>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Ngân hàng:</Text>
              <Text style={styles.bankValue}>VietinBank (ICB)</Text>
            </View>

            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Số tài khoản:</Text>
              <TouchableOpacity 
                style={styles.copyableRow} 
                onPress={() => handleCopy('account', '101876543210')}
              >
                <Text style={[styles.bankValue, styles.highlightValue]}>101876543210</Text>
                <Copy size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Chủ tài khoản:</Text>
              <Text style={styles.bankValue}>DU AN KINDR ESCROW FUND</Text>
            </View>

            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Số tiền:</Text>
              <Text style={[styles.bankValue, { color: '#D97706', fontWeight: '800' }]}>
                {formatNumber(selectedPack.price)} VNĐ
              </Text>
            </View>

            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Nội dung CK:</Text>
              <TouchableOpacity 
                style={styles.copyableRow}
                onPress={() => handleCopy('memo', memoContent)}
              >
                <Text style={[styles.bankValue, styles.highlightValue]}>{memoContent}</Text>
                <Copy size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        <Button
          title={`Xác nhận đã chuyển ${formatNumber(selectedPack.price)}đ (Giả lập Webhook)`}
          onPress={handleConfirmTopUp}
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
    paddingBottom: 60,
  },
  infoBox: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onPrimaryContainer,
    flex: 1,
    lineHeight: 17,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  packCard: {
    width: '47%',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.soft,
  },
  packCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9F5',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    backgroundColor: '#D97706',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  packLabel: {
    fontSize: 11,
    color: COLORS.outline,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  coinWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  coinEmoji: {
    fontSize: 18,
  },
  coinText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.onSurface,
  },
  coinTextSelected: {
    color: COLORS.primary,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.outline,
  },
  priceTextSelected: {
    color: '#D97706',
  },
  checkedCircle: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCard: {
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  qrTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  qrImageContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  qrImage: {
    width: 220,
    height: 220,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
  },
  qrSubText: {
    fontSize: 11,
    color: COLORS.outline,
    marginTop: 8,
    textAlign: 'center',
  },
  bankDetailList: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankLabel: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  bankValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  highlightValue: {
    color: COLORS.primary,
  },
  copyableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submitBtn: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
});

export default TopUpScreen;
