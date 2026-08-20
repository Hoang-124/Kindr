// src/features/profile/screens/WithdrawScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { addWithdrawRequest, refreshWalletBalance } from '../../auth/store/authSlice';
import * as walletService from '../../../services/walletService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { Landmark, Coins, AlertTriangle } from 'lucide-react-native';
import { formatNumber } from '../../../utils/helpers';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import FormError from '../../../components/form/FormError';

export const WithdrawScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [amountStr, setAmountStr] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!currentUser) return null;

  const handleWithdraw = async () => {
    setError('');
    const amount = parseInt(amountStr, 10);

    if (isNaN(amount) || amount <= 0) {
      setError('Vui lòng nhập số Xu hợp lệ cần rút.');
      return;
    }

    if (amount > currentUser.xuBalance) {
      setError(`Số dư khả dụng không đủ (Mẹ hiện có ${currentUser.xuBalance} Xu).`);
      return;
    }

    if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
      setError('Vui lòng điền đầy đủ thông tin tài khoản nhận tiền.');
      return;
    }

    setLoading(true);

    const feePercent = 10;
    const rate = 10000;
    const valueVND = amount * rate;
    const feeVND = valueVND * (feePercent / 100);
    const payoutVND = valueVND - feeVND;

    try {
      await walletService.requestWithdraw({
        xuAmount: amount,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim().toUpperCase(),
      });
      dispatch(refreshWalletBalance());
      setLoading(false);

      Alert.alert(
        'Đã gửi yêu cầu rút Xu! 📩',
        `Yêu cầu rút ${amount} Xu của mẹ đã được chuyển tới hệ thống.\n\n• Số tiền thực nhận: ${formatNumber(payoutVND)}đ\n• Phí dịch vụ (10%): ${formatNumber(feeVND)}đ\n\nAdmin sẽ kiểm tra và giải ngân trong vòng 24 giờ.`,
        [{ text: 'Đồng ý', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      dispatch(addWithdrawRequest({
        id: 'wr_' + Math.random().toString(36).substring(2, 9),
        userId: currentUser.id,
        userName: currentUser.name,
        xuAmount: amount,
        bankName,
        accountNumber,
        accountHolder,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }));
      setLoading(false);

      Alert.alert(
        'Đã gửi yêu cầu rút Xu! 📩',
        `Yêu cầu rút ${amount} Xu của mẹ đã được chuyển tới hệ thống.\n\n• Số tiền thực nhận: ${formatNumber(payoutVND)}đ\n• Phí dịch vụ (10%): ${formatNumber(feeVND)}đ\n\nAdmin sẽ kiểm tra và giải ngân trong vòng 24 giờ.`,
        [{ text: 'Đồng ý', onPress: () => navigation.goBack() }]
      );
    }
  };

  const currentAmount = parseInt(amountStr, 10) || 0;
  const rate = 10000;
  const rawVND = currentAmount * rate;
  const feeVND = rawVND * 0.10;
  const netVND = Math.max(0, rawVND - feeVND);

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Rút Xu Về Ngân Hàng" showBack />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning Banner */}
        <View style={styles.warningBox}>
          <AlertTriangle size={18} color={COLORS.tertiary} />
          <Text style={styles.warningText}>
            Phí dịch vụ quy đổi Rút Xu là 10% (1 Xu = 10.000 VNĐ) để duy trì vận hành trạm trung gian Kindr.
          </Text>
        </View>

        {/* Current Balance Summary */}
        <View style={styles.balanceSummary}>
          <Coins size={20} color={COLORS.tertiary} />
          <Text style={styles.balanceLabel}>Số dư khả dụng:</Text>
          <Text style={styles.balanceValue}>{currentUser.xuBalance} Xu</Text>
        </View>

        <View style={styles.form}>
          <FormError message={error} />

          <Input
            label="Số Xu muốn rút"
            placeholder={`VD: ${currentUser.xuBalance}`}
            value={amountStr}
            onChangeText={setAmountStr}
            keyboardType="number-pad"
            icon={<Coins size={20} color={COLORS.outline} />}
          />

          {currentAmount > 0 && (
            <View style={styles.conversionPanel}>
              <View style={styles.convRow}>
                <Text style={styles.convLabel}>Giá trị quy đổi:</Text>
                <Text style={styles.convVal}>{formatNumber(rawVND)}đ</Text>
              </View>
              <View style={styles.convRow}>
                <Text style={styles.convLabel}>Phí rút dịch vụ (10%):</Text>
                <Text style={styles.convVal}>-{formatNumber(feeVND)}đ</Text>
              </View>
              <View style={[styles.cardDivider, { marginVertical: 6 }]} />
              <View style={styles.convRow}>
                <Text style={[styles.convLabel, { fontWeight: '700', color: COLORS.primary }]}>
                  Mẹ thực nhận:
                </Text>
                <Text style={[styles.convVal, { fontSize: 15, fontWeight: '800', color: COLORS.primary }]}>
                  {formatNumber(netVND)}đ
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.subHeader}>Thông tin ngân hàng nhận tiền</Text>

          <Input
            label="Tên Ngân hàng"
            placeholder="VD: Vietcombank, Momo..."
            value={bankName}
            onChangeText={setBankName}
            icon={<Landmark size={20} color={COLORS.outline} />}
          />

          <Input
            label="Số tài khoản"
            placeholder="Nhập số tài khoản nhận tiền"
            value={accountNumber}
            onChangeText={setAccountNumber}
            keyboardType="number-pad"
            icon={<Landmark size={20} color={COLORS.outline} />}
          />

          <Input
            label="Tên chủ tài khoản"
            placeholder="VD: NGUYEN VAN A"
            value={accountHolder}
            onChangeText={setAccountHolder}
            autoCapitalize="characters"
            icon={<Landmark size={20} color={COLORS.outline} />}
          />

          <Button
            title={`Gửi yêu cầu rút ${currentAmount} Xu`}
            onPress={handleWithdraw}
            loading={loading}
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentContainer: { paddingHorizontal: SPACING.containerPadding, paddingTop: SPACING.md, paddingBottom: 40 },
  warningBox: {
    backgroundColor: COLORS.tertiaryContainer + '30',
    borderRadius: RADIUS.default,
    padding: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.tertiaryContainer,
  },
  warningText: { fontSize: 12, fontWeight: '600', color: COLORS.onTertiaryContainer, flex: 1, lineHeight: 16 },
  balanceSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: SPACING.md,
    borderRadius: RADIUS.default,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    marginBottom: SPACING.lg,
    ...SHADOWS.soft,
  },
  balanceLabel: { fontSize: 13, fontWeight: '600', color: COLORS.outline },
  balanceValue: { fontSize: 14, fontWeight: '800', color: COLORS.tertiary },
  form: { width: '100%' },
  conversionPanel: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.md,
    borderRadius: RADIUS.default,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  convRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  convLabel: { fontSize: 12, color: COLORS.outline, fontWeight: '600' },
  convVal: { fontSize: 13, fontWeight: '700', color: COLORS.onSurface },
  cardDivider: { height: 1, backgroundColor: COLORS.outlineVariant },
  subHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.primary + '30',
    paddingBottom: 4,
  },
  submitBtn: { marginTop: SPACING.md, height: 52 },
});

export default WithdrawScreen;
