import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSelector } from '../../../app/store/hooks';
import { api } from '../../../services/api';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { Lock, CheckCircle2, ShieldAlert, ChevronRight, Coins } from 'lucide-react-native';
import { formatFullDate } from '../../../utils/formatDate';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';

export const ManageTransactionsScreen = () => {
  const navigation = useNavigation<any>();
  const transactions = useAppSelector((state) => state.exchange.transactions);
  const [apiTxs, setApiTxs] = useState<any[] | null>(null);

  useEffect(() => {
    api.get('/admin/transactions')
      .then(res => {
        const list = res.data.transactions || res.data;
        if (Array.isArray(list)) {
          const mapped = list.map((t: any) => ({
            id: t.id || t._id,
            productId: t.productId?.id || t.productId,
            productName: t.productId?.name || t.productName || 'Món đồ',
            productImage: t.productId?.image || t.productImage || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400',
            productPrice: t.productPrice || t.buyerEscrowFrozen || 0,
            buyerId: t.buyerId?.id || t.buyerId,
            buyerName: t.buyerId?.name || t.buyerName || 'Mẹ Mua',
            sellerId: t.sellerId?.id || t.sellerId,
            sellerName: t.sellerId?.name || t.sellerName || 'Mẹ Bán',
            buyerEscrowFrozen: t.buyerEscrowFrozen || 0,
            sellerEscrowFrozen: t.sellerEscrowFrozen || 0,
            status: t.status,
            createdAt: t.createdAt,
          }));
          setApiTxs(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const displayTransactions = apiTxs !== null ? apiTxs : transactions;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Hoàn tất', color: COLORS.primary, bg: COLORS.primaryContainer + '30', icon: CheckCircle2 };
      case 'frozen':
        return { label: 'Đang khóa xu', color: COLORS.outline, bg: COLORS.surfaceContainer, icon: Lock };
      case 'shipped':
        return { label: 'Chờ nhận hàng', color: '#d97706', bg: '#fef3c7', icon: Lock };
      case 'disputed':
        return { label: 'Tranh chấp', color: COLORS.error, bg: COLORS.errorContainer + '40', icon: ShieldAlert };
      default:
        return { label: 'Không rõ', color: COLORS.outline, bg: COLORS.surfaceContainer, icon: Lock };
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Giám Sát Giao Dịch" showBack />
      
      <FlatList
        data={displayTransactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const config = getStatusConfig(item.status);
          const Icon = config.icon;

          return (
            <TouchableOpacity
              style={styles.txCard}
              onPress={() => navigation.navigate('TransactionDetail', { id: item.id })}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                  <Icon size={12} color={config.color} />
                  <Text style={[styles.statusText, { color: config.color }]}>
                    {config.label}
                  </Text>
                </View>
                <Text style={styles.txId}>Mã: {item.id}</Text>
              </View>

              <View style={styles.cardBody}>
                <Image source={{ uri: item.productImage }} style={styles.prodImg} />
                <View style={styles.prodDetails}>
                  <Text style={styles.prodName} numberOfLines={1}>{item.productName}</Text>
                  <Text style={styles.parties}>
                    Mẹ mua: {item.buyerName} ➔ Mẹ bán: {item.sellerName}
                  </Text>
                  <Text style={styles.dateText}>Khởi tạo: {formatFullDate(item.createdAt)}</Text>
                </View>
                <ChevronRight size={16} color={COLORS.outlineVariant} />
              </View>

              <View style={styles.divider} />

              <View style={styles.escrowRow}>
                <View style={styles.escrowBlock}>
                  <Coins size={14} color={COLORS.tertiary} />
                  <Text style={styles.escrowTitle}>Tổng Xu Giá trị:</Text>
                  <Text style={styles.escrowVal}>{item.productPrice} Xu</Text>
                </View>

                <View style={styles.escrowBlock}>
                  <Lock size={14} color={COLORS.primary} />
                  <Text style={styles.escrowTitle}>Ký gửi bảo chứng:</Text>
                  <Text style={[styles.escrowVal, { color: COLORS.primary }]}>
                    {item.buyerEscrowFrozen + item.sellerEscrowFrozen} Xu
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
    paddingBottom: 40,
  },
  txCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    borderRadius: 20,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  txId: {
    fontSize: 10,
    color: COLORS.outline,
    fontWeight: '500',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginVertical: SPACING.xs,
  },
  prodImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainer,
  },
  prodDetails: {
    flex: 1,
  },
  prodName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  parties: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 2,
  },
  dateText: {
    fontSize: 9,
    color: COLORS.outline,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceVariant,
    marginVertical: SPACING.md,
  },
  escrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.sm,
    borderRadius: 12,
  },
  escrowBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  escrowTitle: {
    fontSize: 10,
    color: COLORS.outline,
    fontWeight: '600',
  },
  escrowVal: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.tertiary,
  },
});

export default ManageTransactionsScreen;
