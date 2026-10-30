import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { refreshWalletBalance } from '../../auth/store/authSlice';
import * as walletService from '../../../services/walletService';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { Coins, Lock, PlusCircle, ArrowUpRight, ArrowDownLeft, ChevronRight, CheckCircle2, Clock, XCircle } from 'lucide-react-native';
import { formatNumber } from '../../../utils/helpers';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Card from '../../../components/layout/Card';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'Wallet'>;

export const WalletScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const transactions = useAppSelector((state) => state.exchange.transactions);

  const [payosOrders, setPayosOrders] = useState<walletService.PayOSOrderItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await walletService.getWalletHistory();
      if (data.payosOrders) {
        setPayosOrders(data.payosOrders);
      }
    } catch (err) {
      console.warn('Get wallet history warning:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    dispatch(refreshWalletBalance());
    fetchHistory();
  }, [dispatch]);

  if (!currentUser) return null;

  // Filter transactions related to current user
  const userTransactions = transactions.filter(
    tx => tx.buyerId === currentUser.id || tx.sellerId === currentUser.id
  );

  // Active escrowed transactions
  const activeEscrowTx = userTransactions.filter(
    tx =>
      tx.status === 'awaiting_handover' ||
      tx.status === 'in_safeful_time' ||
      tx.status === 'disputed' ||
      tx.status === 'frozen' ||
      tx.status === 'shipped'
  );

  // Calculate total frozen xu
  const frozenBalance = activeEscrowTx.reduce((sum, tx) => {
    if (tx.buyerId === currentUser.id) {
      return sum + tx.buyerEscrowFrozen;
    } else {
      return sum + tx.sellerEscrowFrozen;
    }
  }, 0);

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Ví Xu Của Mẹ" showBack />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Wallet Card */}
        <Card style={styles.walletCard} contentStyle={styles.walletCardContent}>
          <View style={styles.walletHeader}>
            <Coins size={36} color={COLORS.onPrimary} />
            <Text style={styles.walletTitle}>Số dư khả dụng</Text>
          </View>
          <Text style={styles.balanceText}>{currentUser.xuBalance} Xu</Text>
          <Text style={styles.balanceVnd}>≈ {formatNumber(currentUser.xuBalance * 1000)} VNĐ</Text>
          
          <View style={styles.cardDivider} />
          
          <View style={styles.escrowRow}>
            <View style={styles.escrowLeft}>
              <Lock size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.escrowLabel}>Số dư tạm khóa (Bảo chứng Escrow)</Text>
            </View>
            <Text style={styles.escrowValue}>{currentUser.xuFrozen ?? frozenBalance} Xu</Text>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('TopUp')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryContainer }]}>
              <PlusCircle size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Nạp Xu VietQR</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Withdraw')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: COLORS.tertiaryContainer }]}>
              <ArrowUpRight size={22} color={COLORS.tertiary} />
            </View>
            <Text style={styles.actionText}>Rút Xu</Text>
          </TouchableOpacity>
        </View>

        {/* Lịch Sử Nạp Xu PayOS / VietQR */}
        {payosOrders.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Lịch sử nạp tiền VietQR (PayOS)</Text>
              <Text style={styles.historySubtitle}>Các giao dịch nạp Xu tự động gần nhất</Text>
            </View>
            <View style={styles.listContainer}>
              {payosOrders.map((order) => {
                const isPaid = order.status === 'PAID';
                const isPending = order.status === 'PENDING';
                return (
                  <View key={order.orderCode} style={styles.txRow}>
                    <View style={styles.txLeft}>
                      <View style={[
                        styles.txIconWrapper, 
                        { backgroundColor: isPaid ? COLORS.secondaryLight : isPending ? COLORS.tertiaryContainer : COLORS.surfaceContainer }
                      ]}>
                        {isPaid ? (
                          <CheckCircle2 size={18} color={COLORS.success} />
                        ) : isPending ? (
                          <Clock size={18} color={COLORS.warning} />
                        ) : (
                          <XCircle size={18} color={COLORS.textMuted} />
                        )}
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txProdName}>Mã GD: #{order.orderCode}</Text>
                        <Text style={styles.txStatus}>
                          {isPaid ? 'Đã thanh toán' : isPending ? 'Chờ thanh toán' : order.status} • {formatNumber(order.vndAmount)}đ
                        </Text>
                      </View>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={[
                        styles.txAmount, 
                        { color: isPaid ? COLORS.primary : COLORS.textMuted }
                      ]}>
                        +{order.xuAmount} Xu
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Transaction History Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Lịch sử giao dịch đồ</Text>
            <Text style={styles.historySubtitle}>Xem tất cả hoạt động trao đổi đồ trên sàn</Text>
          </View>

          {userTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Coins size={44} color={COLORS.outlineVariant} />
              <Text style={styles.emptyText}>Mẹ chưa có lịch sử giao dịch đồ nào.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {userTransactions.map((tx) => {
                const isBuyer = tx.buyerId === currentUser.id;
                const isCompleted = tx.status === 'completed';
                const isRefunded = tx.status === 'refunded';
                
                let amountText = '';
                let amountColor = COLORS.onSurface;
                let statusLabel = '';
                let icon = null;

                if (isCompleted) {
                  if (isBuyer) {
                    amountText = `-${tx.productPrice} Xu`;
                    amountColor = COLORS.error;
                    icon = <ArrowUpRight size={18} color={COLORS.error} />;
                  } else {
                    amountText = `+${tx.productPrice} Xu`;
                    amountColor = COLORS.primary;
                    icon = <ArrowDownLeft size={18} color={COLORS.primary} />;
                  }
                  statusLabel = 'Hoàn tất';
                } else if (isRefunded) {
                  if (isBuyer) {
                    amountText = `+${tx.buyerEscrowFrozen} Xu`;
                    amountColor = COLORS.success;
                    icon = <ArrowDownLeft size={18} color={COLORS.success} />;
                    statusLabel = 'Đã hoàn Xu';
                  } else {
                    amountText = `-${tx.sellerEscrowFrozen} Xu`;
                    amountColor = COLORS.error;
                    icon = <ArrowUpRight size={18} color={COLORS.error} />;
                    statusLabel = 'Khấu trừ cọc';
                  }
                } else {
                  amountText = isBuyer ? `-${tx.buyerEscrowFrozen} Xu` : `-${tx.sellerEscrowFrozen} Xu`;
                  amountColor = COLORS.outline;
                  icon = <Lock size={18} color={COLORS.outline} />;
                  statusLabel =
                    tx.status === 'awaiting_handover' || tx.status === 'frozen'
                      ? 'Chờ bàn giao'
                      : tx.status === 'in_safeful_time' || tx.status === 'shipped'
                      ? '6h kiểm định'
                      : 'Tranh chấp';
                }

                return (
                  <TouchableOpacity
                    key={tx.id}
                    style={styles.txRow}
                    onPress={() => navigation.navigate('TransactionDetail', { id: tx.id })}
                    activeOpacity={0.8}
                  >
                    <View style={styles.txLeft}>
                      <View style={styles.txIconWrapper}>
                        {icon}
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txProdName} numberOfLines={1}>
                          {tx.productName}
                        </Text>
                        <Text style={styles.txStatus}>
                          {isBuyer ? 'Mẹ nhận' : 'Mẹ tặng'} • {statusLabel}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.txRight}>
                      <Text style={[styles.txAmount, { color: amountColor }]}>
                        {amountText}
                      </Text>
                      <ChevronRight size={16} color={COLORS.outlineVariant} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
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
  walletCard: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
    borderRadius: 24,
    paddingVertical: SPACING.lg,
    ...SHADOWS.ambient,
  },
  walletCardContent: {
    padding: SPACING.md,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  balanceText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.onPrimary,
    marginVertical: 4,
  },
  balanceVnd: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: SPACING.md,
  },
  escrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  escrowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  escrowLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  escrowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  sectionBlock: {
    marginBottom: SPACING.lg,
  },
  historyHeader: {
    marginBottom: SPACING.sm,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  historySubtitle: {
    fontSize: 12.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  listContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  txIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txProdName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  txStatus: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
  },
});

export default WalletScreen;
