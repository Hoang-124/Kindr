import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  FlatList 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { refreshWalletBalance } from '../../auth/store/authSlice';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { Coins, Lock, PlusCircle, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react-native';
import { formatXuToVND } from '../../../utils/helpers';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Card from '../../../components/layout/Card';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'Wallet'>;

export const WalletScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const transactions = useAppSelector((state) => state.exchange.transactions);

  useEffect(() => {
    dispatch(refreshWalletBalance());
  }, [dispatch]);

  if (!currentUser) return null;

  // Filter transactions related to current user
  const userTransactions = transactions.filter(
    tx => tx.buyerId === currentUser.id || tx.sellerId === currentUser.id
  );

  // Active escrowed transactions (frozen/shipped/disputed)
  const activeEscrowTx = userTransactions.filter(
    tx => tx.status === 'frozen' || tx.status === 'shipped' || tx.status === 'disputed'
  );

  // Calculate total frozen xu
  const frozenBalance = activeEscrowTx.reduce((sum, tx) => {
    if (tx.buyerId === currentUser.id) {
      return sum + tx.buyerEscrowFrozen;
    } else {
      return sum + tx.sellerEscrowFrozen;
    }
  }, 0);

  // Completed transactions
  const completedTx = userTransactions.filter(tx => tx.status === 'completed');

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
          <Text style={styles.balanceVnd}>~ {formatXuToVND(currentUser.xuBalance)}</Text>
          
          <View style={styles.cardDivider} />
          
          <View style={styles.escrowRow}>
            <View style={styles.escrowLeft}>
              <Lock size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.escrowLabel}>Số dư tạm khóa (Bảo chứng)</Text>
            </View>
            <Text style={styles.escrowValue}>{frozenBalance} Xu</Text>
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
            <Text style={styles.actionText}>Nạp Xu</Text>
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

        {/* Transaction History Section */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Lịch sử giao dịch</Text>
          <Text style={styles.historySubtitle}>Xem tất cả hoạt động liên quan đến ví xu</Text>
        </View>

        {userTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Coins size={48} color={COLORS.outlineVariant} />
            <Text style={styles.emptyText}>Mẹ chưa có lịch sử giao dịch xu nào.</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {userTransactions.map((tx) => {
              const isBuyer = tx.buyerId === currentUser.id;
              const isCompleted = tx.status === 'completed';
              
              // Decide styling based on role & status
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
              } else {
                amountText = isBuyer ? `-${tx.buyerEscrowFrozen} Xu` : `-${tx.sellerEscrowFrozen} Xu`;
                amountColor = COLORS.outline;
                icon = <Lock size={18} color={COLORS.outline} />;
                statusLabel = tx.status === 'frozen' ? 'Tạm khóa' : 
                              tx.status === 'shipped' ? 'Chờ kiểm hàng' : 'Tranh chấp';
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
    color: 'rgba(255,255,255,0.85)',
  },
  balanceText: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.onPrimary,
  },
  balanceVnd: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: SPACING.md,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: SPACING.sm,
  },
  escrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  escrowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  escrowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  escrowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: SPACING.lg,
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.default,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    ...SHADOWS.soft,
  },
  actionBtn: {
    alignItems: 'center',
    width: '40%',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    ...SHADOWS.soft,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  historyHeader: {
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  historyTitle: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.onSurface,
    fontWeight: '700',
  },
  historySubtitle: {
    fontSize: 11,
    color: COLORS.outline,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.outline,
    textAlign: 'center',
  },
  listContainer: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceVariant,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  txIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: {
    flex: 1,
    paddingRight: SPACING.xs,
  },
  txProdName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  txStatus: {
    fontSize: 10,
    color: COLORS.outline,
    fontWeight: '600',
    marginTop: 2,
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default WalletScreen;
