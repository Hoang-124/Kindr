// src/features/profile/screens/TopUpScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { updateUserBalance, refreshWalletBalance } from '../../auth/store/authSlice';
import * as walletService from '../../../services/walletService';
import { socketService } from '../../../services/socketService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { 
  Coins, 
  Check, 
  Info, 
  QrCode, 
  Copy, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Flame
} from 'lucide-react-native';
import KindrCoin from '../../../components/common/KindrCoin';
import { formatNumber } from '../../../utils/helpers';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Button from '../../../components/common/Button';
import Card from '../../../components/layout/Card';
import { PulseBadge } from '../../../components/common/PulseBadge';

const PACKAGES = [
  { id: 'p1', coins: 10, price: 100000, label: 'Gói Trải Nghiệm (10 Xu)' },
  { id: 'p2', coins: 20, price: 200000, label: 'Gói Phổ Biến (20 Xu)', popular: true },
  { id: 'p3', coins: 50, price: 500000, label: 'Gói Mẹ Bỉm Tiết Kiệm (50 Xu)' },
  { id: 'p4', coins: 100, price: 1000000, label: 'Gói VIP Đại Sứ (100 Xu)' },
];

export const TopUpScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [selectedPack, setSelectedPack] = useState(PACKAGES[1]);
  const [activeOrder, setActiveOrder] = useState<walletService.TopupOrderData | null>(null);
  const [generatingOrder, setGeneratingOrder] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receivedCoins, setReceivedCoins] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const activeOrderRef = useRef<walletService.TopupOrderData | null>(null);
  activeOrderRef.current = activeOrder;

  // 1. Generate order on initial load or package select
  const fetchOrderForPackage = async (pack: typeof PACKAGES[0]) => {
    setGeneratingOrder(true);
    try {
      const res = await walletService.createTopupOrder(pack.coins);
      setActiveOrder(res.order);
      setTimeLeft(15 * 60);
    } catch (err: any) {
      console.warn('Fallback generating order:', err.message);
      // Fallback local order if offline
      const mockOrderCode = `TOPUP_${Date.now()}_MOCK`;
      const memo = `KINDR NAP ${pack.coins}XU ${mockOrderCode}`;
      setActiveOrder({
        orderCode: mockOrderCode,
        xuAmount: pack.coins,
        vndAmount: pack.price,
        memo,
        vietqrUrl: `https://img.vietqr.io/image/MB-0905123456-compact.png?amount=${pack.price}&addInfo=${encodeURIComponent(memo)}&accountName=CONG%20DONG%20KINDR`,
        bankName: 'MBBank',
        accountNumber: '0905123456',
        accountHolder: 'CONG DONG KINDR',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setTimeLeft(15 * 60);
    } finally {
      setGeneratingOrder(false);
    }
  };

  useEffect(() => {
    fetchOrderForPackage(selectedPack);
  }, [selectedPack]);

  // 2. Countdown timer for QR validity (15 mins)
  useEffect(() => {
    if (paymentSuccess || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentSuccess, timeLeft]);

  // 3. Realtime Socket.IO listener for `topup_success`
  useEffect(() => {
    const handleSocketTopup = (data: { orderCode: string; xuAmount: number; newBalance?: number }) => {
      const current = activeOrderRef.current;
      if (!current || data.orderCode === current.orderCode) {
        setReceivedCoins(data.xuAmount || selectedPack.coins);
        setPaymentSuccess(true);
        dispatch(refreshWalletBalance());
      }
    };

    socketService.on('topup_success', handleSocketTopup);
    return () => {
      socketService.off('topup_success', handleSocketTopup);
    };
  }, [selectedPack.coins, dispatch]);

  // 4. Polling fallback every 4 seconds
  useEffect(() => {
    if (!activeOrder || paymentSuccess) return;

    const interval = setInterval(async () => {
      try {
        const statusRes = await walletService.checkOrderStatus(activeOrder.orderCode);
        if (statusRes.status === 'completed') {
          setReceivedCoins(statusRes.xuAmount);
          setPaymentSuccess(true);
          dispatch(refreshWalletBalance());
        }
      } catch (err) {
        // silent polling error
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeOrder, paymentSuccess, dispatch]);

  if (!currentUser) return null;

  const handleCopy = (field: string, value: string) => {
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
    Alert.alert('Đã sao chép', `Đã chép "${value}" vào bộ nhớ tạm.`);
  };

  // Manual check button handler
  const handleManualCheck = async () => {
    if (!activeOrder) return;
    setCheckingPayment(true);
    try {
      const res = await walletService.checkOrderStatus(activeOrder.orderCode);
      if (res.status === 'completed') {
        setReceivedCoins(res.xuAmount);
        setPaymentSuccess(true);
        dispatch(refreshWalletBalance());
      } else {
        Alert.alert(
          'Đang Chờ Ngân Hàng ⏳',
          'Hệ thống chưa nhận được thông báo biến động số dư từ ngân hàng. Nếu mẹ vừa quét mã, vui lòng đợi 5-10 giây để ngân hàng gửi Webhook IPN nhé!'
        );
      }
    } catch {
      Alert.alert(
        'Đang Chờ Ngân Hàng ⏳',
        'Giao dịch vẫn đang được xử lý. Mẹ vui lòng kiểm tra xem app ngân hàng đã hoàn tất chuyển tiền chưa nhé.'
      );
    } finally {
      setCheckingPayment(false);
    }
  };

  // Simulation test button (immediate top-up for demo / dev)
  const handleSimulateTopup = async () => {
    setSimulating(true);
    try {
      await walletService.topUpXu(selectedPack.coins);
      dispatch(refreshWalletBalance());
      setReceivedCoins(selectedPack.coins);
      setPaymentSuccess(true);
    } catch {
      dispatch(updateUserBalance({ userId: currentUser.id, amount: selectedPack.coins }));
      setReceivedCoins(selectedPack.coins);
      setPaymentSuccess(true);
    } finally {
      setSimulating(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Nạp Xu Vào Ví" showBack />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Policy Brief Info */}
        <View style={styles.infoBox}>
          <Info size={18} color={COLORS.onPrimaryContainer} />
          <Text style={styles.infoText}>
            Quy chuẩn: 1 Xu = 10.000 VNĐ. Tiền nạp vào đóng vai trò là Quỹ bảo chứng thanh toán và phí giao dịch trong hệ thống Kindr.
          </Text>
        </View>

        {/* 1. Select Package */}
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
                activeOpacity={0.85}
              >
                {pack.popular && (
                  <View style={styles.popularBadge}>
                    <Flame size={10} color="#ffffff" />
                    <Text style={styles.popularBadgeText}>HOT</Text>
                  </View>
                )}
                
                <Text style={styles.packLabel}>{pack.label}</Text>
                
                <View style={styles.coinWrapper}>
                  <KindrCoin size={20} />
                  <Text style={[styles.coinText, isSelected && styles.coinTextSelected]}>
                    {pack.coins} Xu
                  </Text>
                </View>
                
                <Text style={[styles.priceText, isSelected && styles.priceTextSelected]}>
                  {formatNumber(pack.price)}đ
                </Text>

                {isSelected && (
                  <View style={styles.checkedCircle}>
                    <Check size={12} color="#ffffff" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Dynamic VietQR Banking Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>2. Quét mã VietQR chuyển khoản tự động:</Text>
          <View style={styles.timerBadge}>
            <Clock size={12} color={timeLeft < 180 ? '#DC2626' : COLORS.onSurfaceVariant} />
            <Text style={[styles.timerText, timeLeft < 180 && { color: '#DC2626' }]}>
              {formatCountdown(timeLeft)}
            </Text>
          </View>
        </View>
        
        <Card style={styles.qrCard}>
          {/* Header with Pulse Live Listening */}
          <View style={styles.qrHeader}>
            <View style={styles.qrHeaderLeft}>
              <QrCode size={20} color={COLORS.primary} />
              <Text style={styles.qrTitle}>MÃ VIETQR TỰ ĐỘNG (CỘNG TRONG 3S)</Text>
            </View>
            <PulseBadge>
              <View style={styles.liveListeningPill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Lắng nghe 24/7</Text>
              </View>
            </PulseBadge>
          </View>

          {/* QR Code Container */}
          <View style={styles.qrImageContainer}>
            {generatingOrder ? (
              <View style={styles.qrLoadingBox}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.qrLoadingText}>Đang tạo mã VietQR động...</Text>
              </View>
            ) : activeOrder?.vietqrUrl ? (
              <>
                <Image 
                  source={{ uri: activeOrder.vietqrUrl }} 
                  style={styles.qrImage} 
                  resizeMode="contain"
                />
                <Text style={styles.qrSubText}>
                  Mở App ngân hàng bất kỳ (MB, VCB, Techcombank, VPBank...) để quét mã
                </Text>
              </>
            ) : (
              <View style={styles.qrLoadingBox}>
                <Text style={styles.qrLoadingText}>Không tải được mã QR. Vui lòng thử lại.</Text>
              </View>
            )}
          </View>

          {/* Bank Transfer Details with 1-Tap Copy */}
          <View style={styles.bankDetailList}>
            {/* Bank Name */}
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Ngân hàng thụ hưởng:</Text>
              <Text style={styles.bankValue}>{activeOrder?.bankName || 'MBBank'}</Text>
            </View>

            {/* Account Number */}
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Số tài khoản:</Text>
              <TouchableOpacity 
                style={styles.copyableRow} 
                onPress={() => handleCopy('account', activeOrder?.accountNumber || '0905123456')}
                activeOpacity={0.7}
              >
                <Text style={[styles.bankValue, styles.highlightValue]}>
                  {activeOrder?.accountNumber || '0905123456'}
                </Text>
                <Copy size={16} color={copiedField === 'account' ? '#16A34A' : COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Account Holder */}
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Chủ tài khoản:</Text>
              <Text style={styles.bankValue}>{activeOrder?.accountHolder || 'CONG DONG KINDR'}</Text>
            </View>

            {/* Amount */}
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Số tiền nạp:</Text>
              <TouchableOpacity 
                style={styles.copyableRow}
                onPress={() => handleCopy('amount', String(activeOrder?.vndAmount || selectedPack.price))}
                activeOpacity={0.7}
              >
                <Text style={[styles.bankValue, styles.amountHighlight]}>
                  {formatNumber(activeOrder?.vndAmount || selectedPack.price)} VNĐ
                </Text>
                <Copy size={16} color={copiedField === 'amount' ? '#16A34A' : '#D97706'} />
              </TouchableOpacity>
            </View>

            {/* Transfer Memo */}
            <View style={[styles.bankRow, styles.memoRow]}>
              <View style={styles.memoLabelCol}>
                <Text style={styles.bankLabel}>Nội dung chuyển khoản:</Text>
                <Text style={styles.memoSubLabel}>Bắt buộc giữ nguyên để cộng Xu tự động</Text>
              </View>
              <TouchableOpacity 
                style={[styles.copyableRow, styles.memoPill]}
                onPress={() => handleCopy('memo', activeOrder?.memo || '')}
                activeOpacity={0.7}
              >
                <Text style={styles.memoText} numberOfLines={1}>
                  {activeOrder?.memo || 'KINDR NAP...'}
                </Text>
                <Copy size={16} color={copiedField === 'memo' ? '#16A34A' : COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtonGroup}>
          <Button
            title={checkingPayment ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái thanh toán'}
            onPress={handleManualCheck}
            loading={checkingPayment}
            variant="outline"
            style={styles.checkBtn}
          />

          <Button
            title={simulating ? 'Đang xử lý...' : `Giả lập thanh toán test (${selectedPack.coins} Xu)`}
            onPress={handleSimulateTopup}
            loading={simulating}
            style={styles.simulateBtn}
          />
        </View>
      </ScrollView>

      {/* 5. SUCCESS CELEBRATION MODAL */}
      <Modal
        visible={paymentSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconWrapper}>
              <CheckCircle2 size={56} color="#16A34A" />
            </View>

            <Text style={styles.modalTitle}>NẠP XU THÀNH CÔNG!</Text>
            <Text style={styles.modalSubText}>
              Hệ thống vừa nhận được chuyển khoản ngân hàng qua Webhook tự động.
            </Text>

            <View style={styles.rewardCard}>
              <Coins size={28} color="#D97706" />
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardAmount}>+{receivedCoins} Xu</Text>
                <Text style={styles.rewardNote}>Đã cộng ngay vào ví của mẹ</Text>
              </View>
            </View>

            <View style={styles.modalActionCol}>
              <Button
                title="Về ví của mẹ ngay"
                onPress={() => {
                  setPaymentSuccess(false);
                  navigation.goBack();
                }}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: SPACING.md,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  packCard: {
    width: '47%',
    minHeight: 110,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...SHADOWS.soft,
  },
  packCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0F9F5',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCard: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  qrHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qrTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  liveListeningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  qrImageContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  qrImage: {
    width: 230,
    height: 230,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
  },
  qrLoadingBox: {
    width: 230,
    height: 230,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  qrLoadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.outline,
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
    gap: 10,
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
    fontWeight: '800',
  },
  amountHighlight: {
    color: '#D97706',
    fontWeight: '800',
    fontSize: 14,
  },
  copyableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44, // Touch ergonomics >= 44pt
    paddingHorizontal: 6,
  },
  memoRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  memoLabelCol: {
    flexDirection: 'column',
  },
  memoSubLabel: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '500',
  },
  memoPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  memoText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    flex: 1,
  },
  actionButtonGroup: {
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  checkBtn: {
    minHeight: 48,
  },
  simulateBtn: {
    minHeight: 48,
    backgroundColor: COLORS.primary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.ambient,
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.onSurface,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubText: {
    fontSize: 12,
    color: COLORS.outline,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    width: '100%',
    marginBottom: SPACING.xl,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#D97706',
  },
  rewardNote: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  modalActionCol: {
    width: '100%',
  },
  modalBtn: {
    minHeight: 48,
  },
});

export default TopUpScreen;
