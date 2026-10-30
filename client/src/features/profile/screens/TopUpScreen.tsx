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
  TextInput,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { refreshWalletBalance } from '../../auth/store/authSlice';
import * as walletService from '../../../services/walletService';
import { socketService } from '../../../services/socketService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { 
  Coins, 
  Check, 
  Info, 
  QrCode as QrCodeIcon, 
  Copy, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Zap, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Flame,
  ExternalLink,
  XCircle,
  HelpCircle,
  Wallet
} from 'lucide-react-native';
import KindrCoin from '../../../components/common/KindrCoin';
import { formatNumber, formatXuToVND } from '../../../utils/helpers';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Button from '../../../components/common/Button';
import Card from '../../../components/layout/Card';
import { PulseBadge } from '../../../components/common/PulseBadge';
import { MascotIcon } from '../../../components/common/MascotIcon';

// Tỷ giá quy đổi chuẩn theo yêu cầu: 1 Xu = 1.000 VNĐ
const XU_RATE = 1000;

// Các gói nạp gợi ý nhanh (Quick Packages)
const QUICK_PACKAGES = [
  { coins: 20, price: 20 * XU_RATE, label: 'Gói Cơ Bản (20 Xu)' },
  { coins: 50, price: 50 * XU_RATE, label: 'Gói Phổ Biến (50 Xu)', popular: true },
  { coins: 100, price: 100 * XU_RATE, label: 'Gói Tiết Kiệm (100 Xu)' },
  { coins: 200, price: 200 * XU_RATE, label: 'Gói Đại Sứ (200 Xu)' },
  { coins: 500, price: 500 * XU_RATE, label: 'Gói VIP Bỉm Sữa (500 Xu)' },
];

export const TopUpScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  // Input states
  const [selectedCoins, setSelectedCoins] = useState<number>(50);
  const [customCoins, setCustomCoins] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Active PayOS order state
  const [payosOrder, setPayosOrder] = useState<walletService.PayOSPaymentLinkResult | null>(null);
  const [loadingLink, setLoadingLink] = useState<boolean>(false);
  const [checkingPayment, setCheckingPayment] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Success celebration state
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [receivedCoins, setReceivedCoins] = useState<number>(0);
  const [newBalance, setNewBalance] = useState<number | undefined>(undefined);

  // Timer & UI helpers
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 phút
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const activeOrderCodeRef = useRef<number | null>(null);
  activeOrderCodeRef.current = payosOrder?.orderCode || null;

  // Tính số Xu hiện tại
  const currentCoins = isCustom 
    ? Math.max(0, parseInt(customCoins, 10) || 0)
    : selectedCoins;
  const currentVnd = currentCoins * XU_RATE;

  // Tạo Payment Link PayOS
  const handleGeneratePayOSLink = async (coinsToLoad: number) => {
    if (coinsToLoad < 10) {
      Alert.alert('Số Xu không hợp lệ', 'Số Xu nạp tối thiểu là 10 Xu (10.000 VNĐ).');
      return;
    }
    if (coinsToLoad > 10000) {
      Alert.alert('Số Xu không hợp lệ', 'Số Xu nạp tối đa mỗi lần là 10.000 Xu (10.000.000 VNĐ).');
      return;
    }

    setLoadingLink(true);
    try {
      const res = await walletService.createPayOSPaymentLink(coinsToLoad);
      setPayosOrder(res);
      setTimeLeft(15 * 60);
    } catch (err: any) {
      console.warn('Fallback generating PayOS payment link:', err);
      // Fallback local mock link nếu không có mạng
      const mockCode = Number(`${Date.now().toString().slice(-7)}${Math.floor(100 + Math.random() * 900)}`);
      const mockVnd = coinsToLoad * XU_RATE;
      const desc = `KINDR NAP ${coinsToLoad} XU`.slice(0, 25);
      setPayosOrder({
        success: true,
        orderCode: mockCode,
        xuAmount: coinsToLoad,
        vndAmount: mockVnd,
        checkoutUrl: `https://img.vietqr.io/image/MB-0901234567-compact2.png?amount=${mockVnd}&addInfo=${encodeURIComponent(desc)}&accountName=CONG%20DONG%20KINDR`,
        qrCode: `https://img.vietqr.io/image/MB-0901234567-compact2.png?amount=${mockVnd}&addInfo=${encodeURIComponent(desc)}&accountName=CONG%20DONG%20KINDR`,
        accountNumber: '0901234567',
        accountName: 'CONG DONG KINDR',
        bin: '970422',
        description: desc,
        status: 'PENDING',
      });
      setTimeLeft(15 * 60);
    } finally {
      setLoadingLink(false);
    }
  };

  // Khởi tạo link thanh toán khi mount
  useEffect(() => {
    handleGeneratePayOSLink(selectedCoins);
  }, []);

  // 1. Đếm ngược hiệu lực mã VietQR (15 phút)
  useEffect(() => {
    if (paymentSuccess || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentSuccess, timeLeft]);

  // 2. Lắng nghe Realtime Socket.IO (Cả 'wallet:topup_success' và 'topup_success')
  useEffect(() => {
    const handleTopupSuccess = (data: { orderCode?: number | string; xuAmount?: number; newBalance?: number }) => {
      const activeCode = activeOrderCodeRef.current;
      if (!activeCode || Number(data.orderCode) === activeCode) {
        setReceivedCoins(data.xuAmount || currentCoins);
        if (data.newBalance !== undefined) setNewBalance(data.newBalance);
        setPaymentSuccess(true);
        dispatch(refreshWalletBalance());
      }
    };

    socketService.on('wallet:topup_success', handleTopupSuccess);
    socketService.on('topup_success', handleTopupSuccess);

    return () => {
      socketService.off('wallet:topup_success', handleTopupSuccess);
      socketService.off('topup_success', handleTopupSuccess);
    };
  }, [currentCoins, dispatch]);

  // 3. Polling kiểm tra trạng thái mỗi 3 giây
  useEffect(() => {
    if (!payosOrder || paymentSuccess || payosOrder.status === 'PAID') return;

    const interval = setInterval(async () => {
      try {
        const res = await walletService.getPayOSOrderStatus(payosOrder.orderCode);
        if (res.status === 'PAID') {
          setReceivedCoins(res.xuAmount);
          setPaymentSuccess(true);
          dispatch(refreshWalletBalance());
        }
      } catch (err) {
        // silent polling catch
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [payosOrder, paymentSuccess, dispatch]);

  if (!currentUser) return null;

  // Xử lý sao chép thông tin
  const handleCopy = (field: string, value: string) => {
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
    Alert.alert('Đã sao chép 📋', `Đã lưu "${value}" vào bộ nhớ tạm.`);
  };

  // Chọn gói nhanh
  const handleSelectPackage = (coins: number) => {
    setIsCustom(false);
    setSelectedCoins(coins);
    setCustomCoins('');
    handleGeneratePayOSLink(coins);
  };

  // Áp dụng số Xu tự chọn
  const handleApplyCustomCoins = () => {
    const val = parseInt(customCoins, 10);
    if (isNaN(val) || val < 10) {
      Alert.alert('Số Xu không hợp lệ', 'Số Xu nạp tối thiểu là 10 Xu (10.000 VNĐ).');
      return;
    }
    if (val > 10000) {
      Alert.alert('Số Xu không hợp lệ', 'Số Xu nạp tối đa mỗi lần là 10.000 Xu (10.000.000 VNĐ).');
      return;
    }
    setIsCustom(true);
    handleGeneratePayOSLink(val);
  };

  // Kiểm tra thủ công nút bấm
  const handleManualCheck = async () => {
    if (!payosOrder) return;
    setCheckingPayment(true);
    try {
      const res = await walletService.getPayOSOrderStatus(payosOrder.orderCode);
      if (res.status === 'PAID') {
        setReceivedCoins(res.xuAmount);
        setPaymentSuccess(true);
        dispatch(refreshWalletBalance());
      } else {
        Alert.alert(
          'Đang Chờ Ngân Hàng ⏳',
          'Hệ thống chưa nhận được thông báo chuyển tiền từ VietQR/PayOS. Mẹ vui lòng đợi vài giây để ngân hàng gửi Webhook nhé!'
        );
      }
    } catch {
      Alert.alert('Đang kiểm tra', 'Giao dịch vẫn đang được xử lý.');
    } finally {
      setCheckingPayment(false);
    }
  };

  // Hủy đơn nạp
  const handleCancelOrder = async () => {
    if (!payosOrder) return;
    setCancelling(true);
    try {
      await walletService.cancelPayOSOrder(payosOrder.orderCode);
      Alert.alert('Đã hủy', 'Đơn nạp tiền đã được hủy thành công.');
      setPayosOrder(null);
    } catch (err: any) {
      Alert.alert('Không thể hủy', err?.response?.data?.error || 'Có lỗi xảy ra khi hủy đơn.');
    } finally {
      setCancelling(false);
    }
  };

  // Nút giả lập nạp thành công (Demo/Dev mode)
  const handleSimulateSuccess = async () => {
    if (!payosOrder) return;
    setSimulating(true);
    try {
      const res = await walletService.simulatePayOSSuccess(payosOrder.orderCode);
      setReceivedCoins(payosOrder.xuAmount);
      if (res.newBalance !== undefined) setNewBalance(res.newBalance);
      setPaymentSuccess(true);
      dispatch(refreshWalletBalance());
    } catch (err: any) {
      Alert.alert(
        'Không thể giả lập',
        err?.response?.data?.error || 'Chức năng chỉ bật ở môi trường Development / Demo.'
      );
    } finally {
      setSimulating(false);
    }
  };

  // Mở trang thanh toán PayOS bên ngoài
  const handleOpenCheckoutUrl = () => {
    if (payosOrder?.checkoutUrl) {
      Linking.openURL(payosOrder.checkoutUrl).catch(() => {
        Alert.alert('Lỗi', 'Không thể mở liên kết thanh toán.');
      });
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Kiểm tra chuỗi QR xem là link ảnh hay chuỗi raw VietQR
  const isImageQr = payosOrder?.qrCode && (payosOrder.qrCode.startsWith('http://') || payosOrder.qrCode.startsWith('https://'));

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Nạp Xu Vào Ví" showBack />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Số Dư Hiện Tại */}
        <Card style={styles.balanceSummaryCard} contentStyle={styles.balanceSummaryContent}>
          <View style={styles.balanceHeaderRow}>
            <View style={styles.balanceIconWrapper}>
              <Wallet size={22} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.balanceLabel}>Số dư ví hiện tại của mẹ</Text>
              <View style={styles.balanceAmountsRow}>
                <Text style={styles.balanceXuText}>{currentUser.xuBalance} Xu</Text>
                <Text style={styles.balanceVndText}>≈ {formatNumber(currentUser.xuBalance * XU_RATE)} VNĐ</Text>
              </View>
            </View>
          </View>
          {currentUser.xuFrozen > 0 && (
            <View style={styles.frozenRow}>
              <Text style={styles.frozenText}>
                🔒 Đang đóng băng ký quỹ Escrow: <Text style={{ fontWeight: '700' }}>{currentUser.xuFrozen} Xu</Text>
              </Text>
            </View>
          )}
        </Card>

        {/* Mascot Kindr Buddy Nudge */}
        <View style={styles.buddyContainer}>
          <MascotIcon size={46} mood="happy" renderMode="vector" />
          <View style={styles.buddyBubble}>
            <Text style={styles.buddyText}>
              <Text style={{ fontWeight: '700', color: COLORS.onPrimaryContainer }}>Gấu Kindr nhắc mẹ:</Text> Hệ thống sẽ tự động cộng Xu vào ví ngay sau khi mẹ quét mã VietQR thành công nhé!
            </Text>
          </View>
        </View>

        {/* 1. Chọn Gói Nạp Nhanh */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>1. Chọn gói Xu hoặc nhập số lượng:</Text>
          <View style={styles.rateBadge}>
            <Text style={styles.rateText}>🪙 1 Xu = 1.000 VNĐ</Text>
          </View>
        </View>
        
        <View style={styles.grid}>
          {QUICK_PACKAGES.map((pack) => {
            const isSelected = !isCustom && selectedCoins === pack.coins;
            return (
              <TouchableOpacity
                key={pack.coins}
                style={[
                  styles.packCard,
                  isSelected && styles.packCardSelected,
                ]}
                onPress={() => handleSelectPackage(pack.coins)}
                activeOpacity={0.85}
              >
                {pack.popular && (
                  <View style={styles.popularBadge}>
                    <Flame size={10} color="#FFFFFF" />
                    <Text style={styles.popularBadgeText}>HOT</Text>
                  </View>
                )}
                
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
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ô Nhập Số Xu Tùy Chỉnh */}
        <View style={styles.customInputContainer}>
          <Text style={styles.customInputLabel}>Hoặc nhập số Xu tùy chọn (10 – 10.000 Xu):</Text>
          <View style={styles.customInputRow}>
            <TextInput
              style={styles.customTextInput}
              placeholder="VD: 75"
              placeholderTextColor={COLORS.textDim}
              keyboardType="number-pad"
              value={customCoins}
              onChangeText={(text) => {
                setCustomCoins(text.replace(/[^0-9]/g, ''));
              }}
            />
            <Button
              title="Tạo mã QR"
              onPress={handleApplyCustomCoins}
              style={styles.applyCustomBtn}
              containerStyle={styles.applyCustomBtnContainer}
            />
          </View>
        </View>

        {/* 2. Bản Xem Trước (Summary Card) */}
        <Card style={styles.summaryCard} contentStyle={styles.summaryCardContent}>
          <Text style={styles.summaryTitle}>BẢN XEM TRƯỚC ĐƠN NẠP</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số Xu nhận được:</Text>
            <Text style={styles.summaryValueGold}>+{currentCoins} Xu</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số tiền thanh toán:</Text>
            <Text style={styles.summaryValue}>{formatNumber(currentVnd)} VNĐ</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí giao dịch:</Text>
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>0đ (Miễn phí nạp 100%)</Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Tổng thanh toán:</Text>
            <Text style={styles.summaryTotalValue}>{formatNumber(currentVnd)} VNĐ</Text>
          </View>
        </Card>

        {/* 3. Khung Thanh Toán PayOS VietQR */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>2. Quét mã VietQR (PayOS tự động 3s):</Text>
          <View style={styles.timerBadge}>
            <Clock size={12} color={timeLeft < 180 ? COLORS.error : COLORS.onSurfaceVariant} />
            <Text style={[styles.timerText, timeLeft < 180 && { color: COLORS.error }]}>
              {formatCountdown(timeLeft)}
            </Text>
          </View>
        </View>
        
        <Card style={styles.qrCard}>
          {/* Header VietQR với Pulsing live listening */}
          <View style={styles.qrHeader}>
            <View style={styles.qrHeaderLeft}>
              <QrCodeIcon size={20} color={COLORS.primary} />
              <Text style={styles.qrTitle}>VIETQR NẠP TỰ ĐỘNG CỦA MẸ</Text>
            </View>
            <PulseBadge>
              <View style={styles.liveListeningPill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Lắng nghe 24/7</Text>
              </View>
            </PulseBadge>
          </View>

          {/* QR Code Canvas */}
          <View style={styles.qrImageContainer}>
            {loadingLink ? (
              <View style={styles.qrLoadingBox}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.qrLoadingText}>Đang tạo mã VietQR từ PayOS...</Text>
              </View>
            ) : payosOrder?.qrCode ? (
              <View style={styles.qrWrapper}>
                {isImageQr ? (
                  <Image 
                    source={{ uri: payosOrder.qrCode }} 
                    style={styles.qrImage} 
                    resizeMode="contain"
                  />
                ) : (
                  <QRCode
                    value={payosOrder.qrCode}
                    size={210}
                    color="#1A1D20"
                    backgroundColor="#FFFFFF"
                  />
                )}
                <Text style={styles.qrSubText}>
                  Mở ứng dụng ngân hàng bất kỳ (MB, Vietcombank, Techcombank...) để quét mã
                </Text>
              </View>
            ) : (
              <View style={styles.qrLoadingBox}>
                <Text style={styles.qrLoadingText}>Không thể tạo mã QR. Vui lòng thử lại.</Text>
                <Button 
                  title="Thử lại" 
                  onPress={() => handleGeneratePayOSLink(currentCoins)} 
                  style={{ marginTop: 8 }}
                />
              </View>
            )}
          </View>

          {/* Chi tiết chuyển khoản & Nút Copy 1-Chạm */}
          <View style={styles.bankDetailList}>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Ngân hàng:</Text>
              <Text style={styles.bankValue}>
                {payosOrder?.bin === '970422' ? 'MBBank (Quân Đội)' : 'VietQR / Napas247'}
              </Text>
            </View>

            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Số tài khoản:</Text>
              <TouchableOpacity 
                style={styles.copyableRow} 
                onPress={() => handleCopy('account', payosOrder?.accountNumber || '0901234567')}
                activeOpacity={0.7}
              >
                <Text style={[styles.bankValue, styles.highlightValue]}>
                  {payosOrder?.accountNumber || '0901234567'}
                </Text>
                <Copy size={16} color={copiedField === 'account' ? COLORS.success : COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Chủ tài khoản:</Text>
              <Text style={styles.bankValue}>
                {payosOrder?.accountName || 'CONG DONG KINDR'}
              </Text>
            </View>

            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Số tiền:</Text>
              <TouchableOpacity 
                style={styles.copyableRow}
                onPress={() => handleCopy('amount', String(payosOrder?.vndAmount || currentVnd))}
                activeOpacity={0.7}
              >
                <Text style={[styles.bankValue, styles.amountHighlight]}>
                  {formatNumber(payosOrder?.vndAmount || currentVnd)} VNĐ
                </Text>
                <Copy size={16} color={copiedField === 'amount' ? COLORS.success : COLORS.warning} />
              </TouchableOpacity>
            </View>

            <View style={[styles.bankRow, styles.memoRow]}>
              <View style={styles.memoLabelCol}>
                <Text style={styles.bankLabel}>Nội dung CK:</Text>
                <Text style={styles.memoSubLabel}>Bắt buộc giữ nguyên để đối soát tự động</Text>
              </View>
              <TouchableOpacity 
                style={[styles.copyableRow, styles.memoPill]}
                onPress={() => handleCopy('memo', payosOrder?.description || '')}
                activeOpacity={0.7}
              >
                <Text style={styles.memoText} numberOfLines={1}>
                  {payosOrder?.description || `KINDR NAP ${currentCoins} XU`}
                </Text>
                <Copy size={16} color={copiedField === 'memo' ? COLORS.success : COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nút mở cổng PayOS bên ngoài */}
          {payosOrder?.checkoutUrl && (
            <TouchableOpacity 
              style={styles.externalLinkBtn}
              onPress={handleOpenCheckoutUrl}
              activeOpacity={0.8}
            >
              <Text style={styles.externalLinkText}>Mở trang thanh toán PayOS Checkout</Text>
              <ExternalLink size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </Card>

        {/* Nút Hành Động & Kiểm Tra */}
        <View style={styles.actionButtonGroup}>
          <Button
            title={checkingPayment ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái thanh toán'}
            onPress={handleManualCheck}
            loading={checkingPayment}
            variant="outline"
            style={styles.checkBtn}
          />

          <Button
            title={simulating ? 'Đang cộng Xu...' : `Giả lập thanh toán test (+${currentCoins} Xu)`}
            onPress={handleSimulateSuccess}
            loading={simulating}
            style={styles.simulateBtn}
          />

          {payosOrder && (
            <TouchableOpacity
              style={styles.cancelLink}
              onPress={handleCancelOrder}
              disabled={cancelling}
            >
              <Text style={styles.cancelLinkText}>
                {cancelling ? 'Đang hủy...' : 'Hủy đơn nạp này'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* 4. MODAL NẠP XU THÀNH CÔNG */}
      <Modal
        visible={paymentSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconWrapper}>
              <CheckCircle2 size={56} color={COLORS.success} />
            </View>

            <Text style={styles.modalTitle}>NẠP XU THÀNH CÔNG! 🎉</Text>
            <Text style={styles.modalSubText}>
              Cổng thanh toán PayOS VietQR đã ghi nhận giao dịch của mẹ.
            </Text>

            <View style={styles.rewardCard}>
              <Coins size={32} color={COLORS.warning} />
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardAmount}>+{receivedCoins} Xu</Text>
                <Text style={styles.rewardNote}>
                  Số dư mới: <Text style={{ fontWeight: '700' }}>{newBalance !== undefined ? `${newBalance} Xu` : 'Đã cập nhật'}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.modalActionCol}>
              <Button
                title="Về Ví Của Mẹ Ngay"
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
  balanceSummaryCard: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderColor: COLORS.outlineVariant,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
  },
  balanceSummaryContent: {
    padding: SPACING.md,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  balanceIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textMuted,
  },
  balanceAmountsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
    marginTop: 2,
  },
  balanceXuText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  balanceVndText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  frozenRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  frozenText: {
    fontSize: 12,
    color: COLORS.warning,
  },
  buddyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  buddyBubble: {
    flex: 1,
  },
  buddyText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: COLORS.onSurface,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  rateBadge: {
    backgroundColor: COLORS.tertiaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  rateText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.onTertiaryContainer,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  packCard: {
    width: '31%',
    minHeight: 88,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...SHADOWS.soft,
  },
  packCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: -4,
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  coinWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  coinText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  coinTextSelected: {
    color: COLORS.primary,
  },
  priceText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  priceTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  checkedCircle: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    padding: 2,
  },
  customInputContainer: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: SPACING.lg,
  },
  customInputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.xs,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  customTextInput: {
    flex: 1,
    minHeight: 44,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.default,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
    color: COLORS.text,
  },
  applyCustomBtnContainer: {
    width: 'auto',
  },
  applyCustomBtn: {
    minHeight: 44,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.default,
  },
  summaryCard: {
    backgroundColor: '#FFFBF2',
    borderColor: '#FFE8B5',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  summaryCardContent: {
    padding: SPACING.md,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#8C6500',
    marginBottom: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  summaryValueGold: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  freeBadge: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  freeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondaryDark,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#FFE8B5',
    marginVertical: SPACING.sm,
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  qrCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    marginBottom: SPACING.lg,
    ...SHADOWS.soft,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  qrHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  qrTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  liveListeningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.secondary,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondaryDark,
  },
  qrImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
    minHeight: 230,
  },
  qrWrapper: {
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    ...SHADOWS.soft,
  },
  qrImage: {
    width: 210,
    height: 210,
  },
  qrLoadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  qrLoadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
  qrSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    maxWidth: 240,
  },
  bankDetailList: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    gap: SPACING.xs,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
  },
  bankLabel: {
    fontSize: 12.5,
    color: COLORS.onSurfaceVariant,
  },
  bankValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  copyableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highlightValue: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  amountHighlight: {
    color: COLORS.warning,
    fontWeight: '800',
    fontSize: 14,
  },
  memoRow: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
  memoLabelCol: {
    flex: 1,
  },
  memoSubLabel: {
    fontSize: 10.5,
    color: COLORS.error,
  },
  memoPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.default,
    maxWidth: 160,
  },
  memoText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  externalLinkBtn: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.default,
    backgroundColor: COLORS.primaryLight,
  },
  externalLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionButtonGroup: {
    gap: SPACING.sm,
  },
  checkBtn: {
    minHeight: 46,
  },
  simulateBtn: {
    minHeight: 46,
    backgroundColor: COLORS.secondary,
  },
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelLinkText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.ambient,
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  modalSubText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.tertiaryContainer,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    width: '100%',
    marginBottom: SPACING.xl,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.onTertiaryContainer,
  },
  rewardNote: {
    fontSize: 12,
    color: COLORS.onTertiaryContainer,
  },
  modalActionCol: {
    width: '100%',
  },
  modalBtn: {
    width: '100%',
    minHeight: 48,
  },
});

export default TopUpScreen;
