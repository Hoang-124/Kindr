import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { updateWithdrawRequestStatus } from '../../auth/store/authSlice';
import { api } from '../../../services/api';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { CheckCircle, XCircle, Clock, Landmark, Coins } from 'lucide-react-native';
import { formatFullDate } from '../../../utils/formatDate';
import { formatNumber } from '../../../utils/helpers';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';

export const ManageWithdrawsScreen = () => {
  const dispatch = useAppDispatch();
  const withdrawRequests = useAppSelector((state) => state.auth.withdrawRequests);

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [apiWithdraws, setApiWithdraws] = useState<any[] | null>(null);

  useEffect(() => {
    api.get('/admin/withdraws')
      .then(res => {
        const list = res.data.withdraws || res.data;
        if (Array.isArray(list)) {
          const mapped = list.map((w: any) => ({
            id: w.id || w._id,
            userId: w.userId?.id || w.userId,
            userName: w.accountHolder || w.userId?.name || 'Mẹ Bỉm',
            xuAmount: w.xuAmount,
            bankName: w.bankName,
            accountNumber: w.accountNumber,
            accountHolder: w.accountHolder,
            status: w.status,
            createdAt: w.createdAt,
          }));
          setApiWithdraws(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const allRequests = apiWithdraws !== null ? apiWithdraws : withdrawRequests;
  const filteredRequests = allRequests.filter(r => r.status === activeTab);

  const handleApprove = async (id: string, name: string, coins: number) => {
    const rate = 10000;
    const cash = coins * rate * 0.90; // 10% fee
    Alert.alert(
      'Duyệt Yêu Cầu Rút Xu ✅',
      `Phê duyệt chuyển khoản ${formatNumber(cash)}đ cho mẹ ${name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Duyệt & Giải ngân', 
          onPress: async () => {
            try {
              await api.put(`/admin/withdraws/${id}/approve`);
              setApiWithdraws(prev => prev ? prev.map(w => w.id === id ? { ...w, status: 'approved' } : w) : null);
            } catch (e) {}
            dispatch(updateWithdrawRequestStatus({ id, status: 'approved' }));
            Alert.alert('Thành công', 'Yêu cầu rút tiền đã được phê duyệt thành công.');
          }
        }
      ]
    );
  };

  const handleReject = async (id: string, name: string, coins: number) => {
    Alert.alert(
      'Từ Chối Yêu Cầu Rút Xu ❌',
      `Từ chối yêu cầu và hoàn trả lại ${coins} Xu vào tài khoản cho mẹ ${name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Từ chối yêu cầu', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.put(`/admin/withdraws/${id}/reject`);
              setApiWithdraws(prev => prev ? prev.map(w => w.id === id ? { ...w, status: 'rejected' } : w) : null);
            } catch (e) {}
            dispatch(updateWithdrawRequestStatus({ id, status: 'rejected' }));
            Alert.alert('Thành công', `Yêu cầu bị từ chối. ${coins} Xu đã được hoàn lại ví cho mẹ ${name}.`);
          }
        }
      ]
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Duyệt Rút Tiền" showBack />
      
      {/* Tabs */}
      <View style={styles.tabHeader}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Chờ duyệt ({withdrawRequests.filter(r => r.status === 'pending').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'approved' && styles.tabBtnActive]}
          onPress={() => setActiveTab('approved')}
        >
          <Text style={[styles.tabText, activeTab === 'approved' && styles.tabTextActive]}>
            Đã duyệt ({withdrawRequests.filter(r => r.status === 'approved').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'rejected' && styles.tabBtnActive]}
          onPress={() => setActiveTab('rejected')}
        >
          <Text style={[styles.tabText, activeTab === 'rejected' && styles.tabTextActive]}>
            Từ chối ({withdrawRequests.filter(r => r.status === 'rejected').length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Clock size={40} color={COLORS.outline} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyText}>Không có yêu cầu rút tiền nào trong danh sách này.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const rate = 10000;
          const rawCash = item.xuAmount * rate;
          const payout = rawCash * 0.98; // Deduct 2% fee

          return (
            <View style={styles.requestCard}>
              <View style={styles.cardHeader}>
                <Coins size={16} color={COLORS.tertiary} />
                <Text style={styles.requestAmount}>{item.xuAmount} Xu</Text>
                <Text style={styles.cashVal}>➔ Thực nhận: {formatNumber(payout)}đ</Text>
              </View>

              <Text style={styles.requester}>Mẹ bỉm yêu cầu: {item.userName}</Text>
              <Text style={styles.reqDate}>Thời gian: {formatFullDate(item.createdAt)}</Text>
              
              <View style={styles.bankBox}>
                <Landmark size={14} color={COLORS.outline} />
                <Text style={styles.bankDetails}>
                  {item.bankName} • STK: {item.accountNumber} {'\n'}
                  Chủ TK: {item.accountHolder}
                </Text>
              </View>

              {item.status === 'pending' && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.cardActions}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleApprove(item.id, item.userName, item.xuAmount)}
                      activeOpacity={0.8}
                    >
                      <CheckCircle size={14} color="#ffffff" />
                      <Text style={styles.btnTextApprove}>Duyệt chi</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleReject(item.id, item.userName, item.xuAmount)}
                      activeOpacity={0.8}
                    >
                      <XCircle size={14} color={COLORS.error} />
                      <Text style={styles.btnTextReject}>Từ chối</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceVariant,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.outline,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
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
    fontSize: 12,
    color: COLORS.outline,
    textAlign: 'center',
  },
  requestCard: {
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
    marginBottom: SPACING.xs + 2,
    flexWrap: 'wrap',
  },
  requestAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.tertiary,
    marginLeft: 4,
  },
  cashVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
  },
  requester: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: 2,
  },
  reqDate: {
    fontSize: 9,
    color: COLORS.outline,
    marginTop: 2,
  },
  bankBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.sm,
    borderRadius: 12,
    marginTop: SPACING.sm,
    gap: 6,
  },
  bankDetails: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    lineHeight: 16,
    fontWeight: '600',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceVariant,
    marginVertical: SPACING.md,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  approveBtn: {
    backgroundColor: COLORS.primary,
  },
  btnTextApprove: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  rejectBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.error,
    backgroundColor: '#ffffff',
  },
  btnTextReject: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.error,
  },
});

export default ManageWithdrawsScreen;
