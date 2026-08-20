// src/features/profile/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { logoutAsync, refreshWalletBalance } from '../../auth/store/authSlice';
import { fetchMyTransactionsAsync } from '../../exchange/store/exchangeSlice';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Card from '../../../components/layout/Card';
import MascotIcon from '../../../components/common/MascotIcon';
import { 
  Coins, 
  Award, 
  ChevronRight, 
  Plus, 
  TrendingUp, 
  ShieldAlert, 
  LogOut,
  FileText,
  Bell,
  Gift,
  Star,
  Lock,
  Syringe
} from 'lucide-react-native';
import { formatXuToVND } from '../../../utils/helpers';
import { formatFullDate } from '../../../utils/formatDate';
import { ScalePressable } from '../../../components/common/ScalePressable';
import { PulseBadge } from '../../../components/common/PulseBadge';
import { FadeInItem } from '../../../components/common/FadeInItem';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const ProfileScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const transactions = useAppSelector((state) => state.exchange.transactions);
  const ratings = useAppSelector((state) => state.rating.ratings);

  const [activeHistoryTab, setActiveHistoryTab] = useState<'escrow' | 'completed' | 'civilization' | 'reviews'>('escrow');

  if (!currentUser) return null;

  const userTransactions = transactions.filter(
    tx => tx.buyerId === currentUser.id || tx.sellerId === currentUser.id
  );

  const activeEscrowTx = userTransactions.filter(
    tx => tx.status === 'frozen' || tx.status === 'shipped' || tx.status === 'in_safeful_time' || tx.status === 'disputed'
  );

  const completedTx = userTransactions.filter(
    tx => tx.status === 'completed'
  );

  const myReceivedRatings = ratings.filter(r => r.toUserId === currentUser.id);

  useEffect(() => {
    dispatch(refreshWalletBalance());
    dispatch(fetchMyTransactionsAsync());
  }, [dispatch]);

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất tài khoản 🚪',
      'Mẹ có chắc chắn muốn đăng xuất khỏi tài khoản Kindr?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đăng xuất', 
          style: 'destructive',
          onPress: async () => {
            await dispatch(logoutAsync()).unwrap();
          }
        }
      ]
    );
  };

  return (
    <ScreenContainer scrollable>
      <Header title="Trang cá nhân của mẹ" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Account Locked Warning Banner */}
        {currentUser.isLocked && (
          <View style={styles.lockedBanner}>
            <MascotIcon size={50} mood="sleeping" dialogue="Tài khoản tạm ngưng do vi phạm khiếu nại quá 3 lần." />
            <Text style={styles.lockedTitle}>⚠️ Tài Khoản Tạm Khóa Giao Dịch</Text>
            <Text style={styles.lockedSub}>Vui lòng liên hệ BQT Kindr qua Zalo/Email để hỗ trợ mở khóa.</Text>
          </View>
        )}

        {/* Profile User Card */}
        <Card style={styles.profileCard}>
          <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{currentUser.name}</Text>
              <View style={styles.ratingBadge}>
                <Star size={12} color={COLORS.accentGold} fill={COLORS.accentGold} />
                <Text style={styles.ratingScore}>{currentUser.reputationScore || 5.0}</Text>
                <Text style={styles.ratingCount}>({currentUser.ratingCount || 0})</Text>
              </View>
            </View>
            <Text style={styles.phone}>SĐT: {currentUser.phone}</Text>
            <Text style={styles.location}>📍 {currentUser.location.addressDetail}, {currentUser.location.districtName}</Text>
          </View>
        </Card>

        {/* Bento Grid: Civilization Gauge & Wallet */}
        <View style={styles.bentoGrid}>
          <Card style={styles.bentoItem} contentStyle={styles.civContainer}>
            <Award size={28} color={COLORS.primary} />
            <Text style={styles.bentoLabel}>Mẹ Bỉm Văn Minh</Text>
            <View style={styles.gaugeContainer}>
              <Text style={styles.gaugeValue}>{currentUser.civilizationPoints}</Text>
              <Text style={styles.gaugeMax}>/100</Text>
            </View>
            <Text style={styles.civLevel}>Văn Minh ✨</Text>
          </Card>

          <ScalePressable style={styles.bentoItem} scaleTo={0.96} onPress={() => navigation.navigate('Wallet')}>
            <Card style={{ flex: 1 }} contentStyle={styles.walletContainer}>
              <PulseBadge scaleMin={0.94} scaleMax={1.08} duration={2200}>
                <Coins size={28} color={COLORS.tertiary} />
              </PulseBadge>
              <Text style={styles.bentoLabel}>Ví Xu khả dụng</Text>
              <Text style={styles.walletValue}>{currentUser.xuBalance} Xu</Text>
              <Text style={styles.walletValueVND}>~ {formatXuToVND(currentUser.xuBalance)}</Text>
              
              <View style={styles.walletActions}>
                <ScalePressable style={styles.walletBtn} scaleTo={0.9} onPress={() => navigation.navigate('TopUp')}>
                  <Plus size={12} color={COLORS.primary} />
                  <Text style={styles.walletBtnText}>Nạp</Text>
                </ScalePressable>
                <ScalePressable style={styles.walletBtn} scaleTo={0.9} onPress={() => navigation.navigate('Withdraw')}>
                  <TrendingUp size={12} color={COLORS.tertiary} />
                  <Text style={styles.walletBtnText}>Rút</Text>
                </ScalePressable>
              </View>
            </Card>
          </ScalePressable>
        </View>

        {/* Navigation Action Buttons */}
        <View style={styles.actionsPanel}>
          <Text style={styles.actionsTitle}>Chức năng của mẹ:</Text>
          <View style={styles.actionsGrid}>
            <ScalePressable style={styles.actionRow} scaleTo={0.97} onPress={() => navigation.navigate('MyPosts')}>
              <View style={styles.actionLeft}>
                <FileText size={18} color={COLORS.primary} />
                <Text style={styles.actionLabel}>Bài đăng của tôi</Text>
              </View>
              <ChevronRight size={16} color={COLORS.outline} />
            </ScalePressable>

            <ScalePressable style={styles.actionRow} scaleTo={0.97} onPress={() => navigation.navigate('Notification')}>
              <View style={styles.actionLeft}>
                <Bell size={18} color={COLORS.primary} />
                <Text style={styles.actionLabel}>Thông báo của mẹ</Text>
              </View>
              <ChevronRight size={16} color={COLORS.outline} />
            </ScalePressable>

            <ScalePressable style={styles.actionRow} scaleTo={0.97} onPress={() => navigation.navigate('CareHandbook')}>
              <View style={styles.actionLeft}>
                <Syringe size={18} color={COLORS.primary} />
                <Text style={styles.actionLabel}>Sổ tay mẹ bỉm (Tiêm chủng & WHO) 👶</Text>
              </View>
              <ChevronRight size={16} color={COLORS.outline} />
            </ScalePressable>

            <ScalePressable style={styles.actionRow} scaleTo={0.97} onPress={() => navigation.navigate('DonationStation')}>
              <View style={styles.actionLeft}>
                <Gift size={18} color={COLORS.primary} />
                <Text style={styles.actionLabel}>Trạm tặng đồ Kindr (0 Xu)</Text>
              </View>
              <ChevronRight size={16} color={COLORS.outline} />
            </ScalePressable>
          </View>
        </View>

        {/* Admin Portal Card Trigger (Admin only) */}
        {currentUser.role === 'admin' && (
          <ScalePressable style={styles.adminPortalCard} scaleTo={0.97} onPress={() => navigation.navigate('AdminDashboard')}>
            <View style={styles.adminPortalLeft}>
              <ShieldAlert size={22} color="#ffffff" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.adminPortalTitle}>Bảng Quản Trị Admin 🛡️</Text>
                <Text style={styles.adminPortalSubtitle}>Duyệt bài đăng, duyệt rút tiền & khiếu nại</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#ffffff" />
          </ScalePressable>
        )}

        {/* History Tabs */}
        <View style={styles.historySection}>
          <View style={styles.tabHeader}>
            <ScalePressable style={[styles.tabBtn, activeHistoryTab === 'escrow' && styles.tabBtnActive]} scaleTo={0.93} onPress={() => setActiveHistoryTab('escrow')}>
              <Text style={[styles.tabText, activeHistoryTab === 'escrow' && styles.tabTextActive]}>Khóa ({activeEscrowTx.length})</Text>
            </ScalePressable>

            <ScalePressable style={[styles.tabBtn, activeHistoryTab === 'completed' && styles.tabBtnActive]} scaleTo={0.93} onPress={() => setActiveHistoryTab('completed')}>
              <Text style={[styles.tabText, activeHistoryTab === 'completed' && styles.tabTextActive]}>Xong ({completedTx.length})</Text>
            </ScalePressable>

            <ScalePressable style={[styles.tabBtn, activeHistoryTab === 'reviews' && styles.tabBtnActive]} scaleTo={0.93} onPress={() => setActiveHistoryTab('reviews')}>
              <Text style={[styles.tabText, activeHistoryTab === 'reviews' && styles.tabTextActive]}>Đánh giá ({myReceivedRatings.length})</Text>
            </ScalePressable>

            <ScalePressable style={[styles.tabBtn, activeHistoryTab === 'civilization' && styles.tabBtnActive]} scaleTo={0.93} onPress={() => setActiveHistoryTab('civilization')}>
              <Text style={[styles.tabText, activeHistoryTab === 'civilization' && styles.tabTextActive]}>Điểm uy tín</Text>
            </ScalePressable>
          </View>

          <View style={styles.tabContent}>
            {activeHistoryTab === 'escrow' && (
              activeEscrowTx.length === 0 ? (
                <Text style={styles.emptyText}>Mẹ không có đơn tạm khóa nào.</Text>
              ) : (
                activeEscrowTx.map((tx, idx) => (
                  <FadeInItem key={tx.id} index={idx} delay={40}>
                    <ScalePressable style={styles.txRow} scaleTo={0.96} onPress={() => navigation.navigate('TransactionDetail', { id: tx.id })}>
                      <Image source={{ uri: tx.productImage }} style={styles.txImg} />
                      <View style={styles.txDetails}>
                        <Text style={styles.txName} numberOfLines={1}>{tx.productName}</Text>
                        <Text style={styles.txStatusText}>🔒 {tx.status === 'in_safeful_time' ? 'Bảo chứng 6h' : 'Tạm khóa Escrow'}</Text>
                      </View>
                      <ChevronRight size={16} color={COLORS.outline} />
                    </ScalePressable>
                  </FadeInItem>
                ))
              )
            )}

            {activeHistoryTab === 'completed' && (
              completedTx.length === 0 ? (
                <Text style={styles.emptyText}>Mẹ chưa có đơn hoàn tất nào.</Text>
              ) : (
                completedTx.map((tx, idx) => (
                  <FadeInItem key={tx.id} index={idx} delay={40}>
                    <ScalePressable style={styles.txRow} scaleTo={0.96} onPress={() => navigation.navigate('TransactionDetail', { id: tx.id })}>
                      <Image source={{ uri: tx.productImage }} style={styles.txImg} />
                      <View style={styles.txDetails}>
                        <Text style={styles.txName} numberOfLines={1}>{tx.productName}</Text>
                        <Text style={styles.txDate}>{formatFullDate(tx.finalizedAt || tx.createdAt)}</Text>
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary }}>Đã Xong ✅</Text>
                    </ScalePressable>
                  </FadeInItem>
                ))
              )
            )}

            {activeHistoryTab === 'reviews' && (
              myReceivedRatings.length === 0 ? (
                <Text style={styles.emptyText}>Mẹ chưa nhận đánh giá nào.</Text>
              ) : (
                myReceivedRatings.map((r, idx) => (
                  <FadeInItem key={r.id} index={idx} delay={40}>
                    <View style={styles.reviewRow}>
                      <View style={styles.reviewHeader}>
                        <Text style={styles.reviewerName}>{r.fromUserName}</Text>
                        <View style={styles.starRow}>
                          {[...Array(r.stars)].map((_, i) => (
                            <Star key={i} size={12} color={COLORS.accentGold} fill={COLORS.accentGold} />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewComment}>"{r.comment}"</Text>
                      <Text style={styles.reviewDate}>{formatFullDate(r.createdAt)}</Text>
                    </View>
                  </FadeInItem>
                ))
              )
            )}

            {activeHistoryTab === 'civilization' && (
              currentUser.historyPoints.map((log, idx) => (
                <FadeInItem key={log.id} index={idx} delay={35}>
                  <View style={styles.civRow}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: log.pointsChanged > 0 ? COLORS.primary : COLORS.error }}>
                      {log.pointsChanged > 0 ? `+${log.pointsChanged}` : log.pointsChanged}đ
                    </Text>
                    <Text style={{ fontSize: 12, flex: 1, color: COLORS.onSurface }}>{log.reason}</Text>
                  </View>
                </FadeInItem>
              ))
            )}
          </View>
        </View>

        {/* Logout */}
        <ScalePressable style={styles.logoutBtn} scaleTo={0.96} onPress={handleLogout}>
          <LogOut size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
        </ScalePressable>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: SPACING.containerPadding, paddingTop: SPACING.sm, paddingBottom: 110 },
  lockedBanner: { backgroundColor: COLORS.errorContainer, padding: SPACING.md, borderRadius: RADIUS.default, marginBottom: SPACING.md, alignItems: 'center' },
  lockedTitle: { fontSize: 14, fontWeight: '800', color: COLORS.error, marginTop: 4 },
  lockedSub: { fontSize: 11, color: COLORS.onErrorContainer, textAlign: 'center', marginTop: 2 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.surfaceDim },
  profileInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 15, fontWeight: '700', color: COLORS.onSurface },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: COLORS.surfaceContainerLow, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  ratingScore: { fontSize: 11, fontWeight: '700', color: COLORS.onSurface },
  ratingCount: { fontSize: 10, color: COLORS.outline },
  phone: { fontSize: 11, color: COLORS.outline, marginTop: 2 },
  location: { fontSize: 11, color: COLORS.onSurfaceVariant, fontWeight: '600', marginTop: 2 },
  bentoGrid: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md },
  bentoItem: { flex: 1 },
  civContainer: { alignItems: 'center', paddingVertical: SPACING.sm },
  bentoLabel: { fontSize: 11, color: COLORS.outline, fontWeight: '600', marginTop: 4 },
  gaugeContainer: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 4 },
  gaugeValue: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  gaugeMax: { fontSize: 12, color: COLORS.outline, fontWeight: '700' },
  civLevel: { fontSize: 10, color: COLORS.primary, fontWeight: '700', backgroundColor: COLORS.primaryContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  walletContainer: { alignItems: 'center', paddingVertical: SPACING.sm },
  walletValue: { fontSize: 22, fontWeight: '800', color: COLORS.tertiary, marginTop: 2 },
  walletValueVND: { fontSize: 10, fontWeight: '600', color: COLORS.outline, marginBottom: 6 },
  walletActions: { flexDirection: 'row', gap: SPACING.xs, width: '100%' },
  walletBtn: { flex: 1, height: 26, backgroundColor: '#ffffff', borderWidth: 1, borderColor: COLORS.outlineVariant, borderRadius: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  walletBtnText: { fontSize: 10, fontWeight: '700', color: COLORS.onSurface },
  actionsPanel: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 16, borderWidth: 1, borderColor: COLORS.surfaceVariant, padding: SPACING.md, marginBottom: SPACING.md },
  actionsTitle: { fontSize: 12, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.xs },
  actionsGrid: { gap: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceVariant },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.onSurface },
  adminPortalCard: { backgroundColor: COLORS.primary, borderRadius: 16, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  adminPortalLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  adminPortalTitle: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  adminPortalSubtitle: { fontSize: 10, color: 'rgba(255, 255, 255, 0.85)' },
  historySection: { backgroundColor: COLORS.surfaceContainerLowest, borderRadius: 16, borderWidth: 1, borderColor: COLORS.surfaceVariant, overflow: 'hidden', marginBottom: SPACING.md },
  tabHeader: { flexDirection: 'row', backgroundColor: COLORS.surfaceContainerLow, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceVariant },
  tabBtn: { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary, backgroundColor: '#FFF' },
  tabText: { fontSize: 11, fontWeight: '600', color: COLORS.outline },
  tabTextActive: { color: COLORS.primary, fontWeight: '700' },
  tabContent: { padding: SPACING.md },
  emptyText: { fontSize: 12, color: COLORS.outline, textAlign: 'center', paddingVertical: SPACING.md },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceVariant, gap: SPACING.sm },
  txImg: { width: 36, height: 36, borderRadius: 6, backgroundColor: COLORS.surfaceContainer },
  txDetails: { flex: 1 },
  txName: { fontSize: 12, fontWeight: '700', color: COLORS.onSurface },
  txStatusText: { fontSize: 10, color: COLORS.tertiary, fontWeight: '600' },
  txDate: { fontSize: 10, color: COLORS.outline },
  reviewRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceVariant },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontSize: 12, fontWeight: '700', color: COLORS.onSurface },
  starRow: { flexDirection: 'row', gap: 2 },
  reviewComment: { fontSize: 11, color: COLORS.onSurfaceVariant, fontStyle: 'italic', marginTop: 2 },
  reviewDate: { fontSize: 9, color: COLORS.outline, marginTop: 2 },
  civRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceVariant },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, borderWidth: 1, borderColor: COLORS.error, borderRadius: RADIUS.full, marginBottom: SPACING.xl },
  logoutText: { fontSize: 13, fontWeight: '700', color: COLORS.error },
});

export default ProfileScreen;
