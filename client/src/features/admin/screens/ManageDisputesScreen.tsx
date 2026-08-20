import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { updateUserBalance } from '../../auth/store/authSlice';
import { updateTransactionStatus } from '../../exchange/store/exchangeSlice';
import { api } from '../../../services/api';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { ShieldAlert, UserCheck, ArrowLeftRight, CheckSquare } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';

export const ManageDisputesScreen = () => {
  const dispatch = useAppDispatch();
  const transactions = useAppSelector((state) => state.exchange.transactions);
  
  // Filter only disputed transactions from Redux
  const localDisputedTx = transactions.filter(t => t.status === 'disputed');
  const [apiDisputes, setApiDisputes] = useState<any[] | null>(null);

  useEffect(() => {
    api.get('/admin/disputes')
      .then(res => {
        const list = res.data.disputes || res.data;
        if (Array.isArray(list)) {
          setApiDisputes(list);
        }
      })
      .catch(() => {});
  }, []);

  const disputedTx = apiDisputes !== null ? apiDisputes : localDisputedTx;

  const handleResolveForBuyer = async (tx: any) => {
    Alert.alert(
      'Phán Quyết Hoàn Trả Người Mua ⚖️',
      `Bạn phán quyết phần thắng thuộc về Người mua (${tx.buyerName || tx.buyerId?.name})?\n\n• Hoàn lại ${tx.buyerEscrowFrozen} Xu cho Mẹ mua.\n• Giải tỏa trả lại ${tx.sellerEscrowFrozen} Xu cọc cho Mẹ bán.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Hoàn tiền Mẹ mua', 
          onPress: async () => {
            const txId = tx.id || tx._id;
            try {
              await api.put(`/admin/disputes/${txId}/resolve`, { outcome: 'resolved_buyer' });
              setApiDisputes(prev => prev ? prev.filter(d => (d.id || d._id) !== txId) : null);
            } catch (e) {}

            dispatch(updateUserBalance({ userId: tx.buyerId?.id || tx.buyerId, amount: tx.buyerEscrowFrozen }));
            dispatch(updateUserBalance({ userId: tx.sellerId?.id || tx.sellerId, amount: tx.sellerEscrowFrozen }));
            dispatch(updateTransactionStatus({ 
              transactionId: txId, 
              status: 'completed',
              finalizedAt: new Date().toISOString()
            }));

            Alert.alert('Thành công', 'Đã phân xử hoàn trả xu cho Người mua và giải phóng cọc Người bán.');
          }
        }
      ]
    );
  };

  const handleResolveForSeller = async (tx: any) => {
    Alert.alert(
      'Phán Quyết Thanh Toán Người Bán ⚖️',
      `Bạn phán quyết phần thắng thuộc về Người bán (${tx.sellerName || tx.sellerId?.name})?\n\n• Giải ngân ${tx.productPrice + tx.sellerEscrowFrozen} Xu cho Mẹ bán.\n• Hoàn lại cọc bảo chứng cho Mẹ mua.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Thanh toán Mẹ bán', 
          onPress: async () => {
            const txId = tx.id || tx._id;
            try {
              await api.put(`/admin/disputes/${txId}/resolve`, { outcome: 'resolved_seller' });
              setApiDisputes(prev => prev ? prev.filter(d => (d.id || d._id) !== txId) : null);
            } catch (e) {}

            dispatch(updateUserBalance({ userId: tx.sellerId?.id || tx.sellerId, amount: tx.productPrice + tx.sellerEscrowFrozen }));
            dispatch(updateUserBalance({ userId: tx.buyerId?.id || tx.buyerId, amount: tx.buyerEscrowFrozen - tx.productPrice }));
            dispatch(updateTransactionStatus({ 
              transactionId: txId, 
              status: 'completed',
              finalizedAt: new Date().toISOString()
            }));

            Alert.alert('Thành công', 'Đã phân xử thanh toán tiền cho Người bán và giải phóng cọc cho Người mua.');
          }
        }
      ]
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Trọng Tài Tranh Chấp" showBack />
      
      <FlatList
        data={disputedTx}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CheckSquare size={48} color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Hiện không có vụ tranh chấp nào cần phân xử.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.disputeCard}>
            <View style={styles.cardHeader}>
              <ShieldAlert size={18} color={COLORS.error} />
              <Text style={styles.txId}>Mã đơn: {item.id}</Text>
            </View>

            <Text style={styles.prodName}>{item.productName}</Text>
            
            <View style={styles.disputeReasonBox}>
              <Text style={styles.reasonHeader}>Lý do khiếu nại của mẹ mua:</Text>
              <Text style={styles.reasonText}>{item.disputeReason || 'Sản phẩm lỗi không giống mô tả.'}</Text>
            </View>

            {/* Bằng chứng thực tế */}
            <Text style={styles.evidenceHeader}>Hình ảnh bằng chứng thực tế từ người mua:</Text>
            <View style={styles.evidencePhotosRow}>
              {/* Original Product Image */}
              <View style={styles.imgContainer}>
                <Image source={{ uri: item.productImage }} style={styles.evidenceImg} />
                <Text style={styles.imgLabel}>Ảnh gốc</Text>
              </View>
              {/* Evidence Images */}
              {item.evidenceImages && item.evidenceImages.map((uri: string, idx: number) => (
                <View key={idx} style={styles.imgContainer}>
                  <Image source={{ uri }} style={styles.evidenceImg} />
                  <Text style={styles.imgLabel}>Bằng chứng {idx + 1}</Text>
                </View>
              ))}
              {(!item.evidenceImages || item.evidenceImages.length === 0) && (
                <Text style={styles.noEvidenceText}>Không có ảnh lỗi đính kèm</Text>
              )}
            </View>

            <View style={styles.escrowRow}>
              <View style={styles.escrowDetails}>
                <Text style={styles.escrowLabel}>Xu Mẹ Mua đóng băng:</Text>
                <Text style={styles.escrowVal}>{item.buyerEscrowFrozen} Xu</Text>
              </View>
              <View style={styles.escrowDetails}>
                <Text style={styles.escrowLabel}>Xu Mẹ Bán đóng băng:</Text>
                <Text style={styles.escrowVal}>{item.sellerEscrowFrozen} Xu</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={[styles.btn, styles.buyerBtn]}
                onPress={() => handleResolveForBuyer(item)}
                activeOpacity={0.8}
              >
                <UserCheck size={14} color="#ffffff" />
                <Text style={styles.btnText}>Hoàn Mẹ Mua</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btn, styles.sellerBtn]}
                onPress={() => handleResolveForSeller(item)}
                activeOpacity={0.8}
              >
                <UserCheck size={14} color="#ffffff" />
                <Text style={styles.btnText}>Trả Mẹ Bán</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 120,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.outline,
    textAlign: 'center',
  },
  disputeCard: {
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
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm,
  },
  txId: {
    fontSize: 11,
    color: COLORS.outline,
    fontWeight: '700',
  },
  prodName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
  },
  disputeReasonBox: {
    backgroundColor: COLORS.errorContainer + '15',
    borderWidth: 1,
    borderColor: COLORS.errorContainer + '40',
    padding: SPACING.sm,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  reasonHeader: {
    fontSize: 10,
    color: COLORS.error,
    fontWeight: '700',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 11,
    color: COLORS.onSurface,
    lineHeight: 16,
    fontWeight: '500',
  },
  escrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.sm,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  escrowDetails: {
    alignItems: 'center',
    flex: 1,
  },
  escrowLabel: {
    fontSize: 9,
    color: COLORS.outline,
    fontWeight: '600',
  },
  escrowVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.tertiary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceVariant,
    marginVertical: SPACING.xs,
    marginBottom: SPACING.md,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  btn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...SHADOWS.soft,
  },
  buyerBtn: {
    backgroundColor: COLORS.primary,
  },
  sellerBtn: {
    backgroundColor: COLORS.tertiary,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  evidenceHeader: {
    fontSize: 10,
    color: COLORS.outline,
    fontWeight: '700',
    marginBottom: 6,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  evidencePhotosRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  evidenceImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  imgContainer: {
    alignItems: 'center',
    gap: 4,
  },
  imgLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.outline,
  },
  noEvidenceText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: COLORS.outline,
    alignSelf: 'center',
  },
});

export default ManageDisputesScreen;
