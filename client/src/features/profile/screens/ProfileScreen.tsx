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
  Syringe,
  Phone,
  MapPin,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  CheckCircle2,
  Clock,
  ExternalLink,
  Pencil,
  Settings,
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

  const navigateTo = (screenName: keyof AppStackParamList, params?: any) => {
    try {
      navigation.navigate(screenName as any, params);
    } catch {
      (navigation as any).getParent()?.navigate(screenName, params);
    }
  };

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

  // Safe location display with friendly fallback
  const displayLocation = (currentUser.location?.addressDetail || currentUser.location?.districtName)
    ? [currentUser.location.addressDetail, currentUser.location.districtName].filter(Boolean).join(', ')
    : 'Hải Châu, Đà Nẵng';

  const displayPhone = currentUser.phone && currentUser.phone.trim() !== ''
    ? currentUser.phone
    : 'Chưa cập nhật SĐT';

  return (
    <ScreenContainer scrollable={false}>
      <Header
        title="Trang cá nhân của mẹ"
        rightElement={
          <ScalePressable
            scaleTo={0.92}
            onPress={() => navigateTo('Settings')}
            style={styles.headerSettingsBtn}
          >
            <Settings size={22} color={COLORS.text} />
          </ScalePressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Account Locked Warning Banner */}
        {currentUser.isLocked && (
          <View style={styles.lockedBanner}>
            <MascotIcon size={50} mood="sleeping" dialogue="Tài khoản tạm ngưng do vi phạm khiếu nại quá 3 lần." />
            <Text style={styles.lockedTitle}>⚠️ Tài Khoản Tạm Khóa Giao Dịch</Text>
            <Text style={styles.lockedSub}>Vui lòng liên hệ BQT Kindr qua Zalo/Email để hỗ trợ mở khóa.</Text>
          </View>
        )}

        {/* Profile Hero Card with Depth & Rich Visual Details */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarWrapper}>
              {currentUser.avatar && currentUser.avatar.startsWith('http') ? (
                <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {(currentUser.name || 'M')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <Sparkles size={11} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.profileMainInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{currentUser.name}</Text>
                <ScalePressable
                  style={styles.editProfilePill}
                  scaleTo={0.93}
                  onPress={() => navigateTo('EditProfile')}
                >
                  <Pencil size={11} color={COLORS.primary} />
                  <Text style={styles.editProfilePillText}>Sửa</Text>
                </ScalePressable>
              </View>

              <View style={styles.badgeRow}>
                <View style={styles.memberBadge}>
                  <Text style={styles.memberBadgeText}>Mẹ Bỉm Kindr</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Star size={11} color={COLORS.accentGold} fill={COLORS.accentGold} />
                  <Text style={styles.ratingScore}>{currentUser.reputationScore ? currentUser.reputationScore.toFixed(1) : '5.0'}</Text>
                  <Text style={styles.ratingCount}>({currentUser.ratingCount || 0})</Text>
                </View>
              </View>

              {Boolean((currentUser as any)?.bio) && (
                <Text style={styles.bioSnippet} numberOfLines={2}>
                  "{(currentUser as any).bio}"
                </Text>
              )}

              <View style={styles.metaRow}>
                <Phone size={12} color={COLORS.textMuted} />
                <Text style={[styles.phoneText, !currentUser.phone && styles.phonePlaceholder]}>
                  {displayPhone}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <MapPin size={12} color={COLORS.primary} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {displayLocation}
                </Text>
              </View>
            </View>
          </View>

          {/* Mini Stats Summary Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Đồ đang đăng</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedTx.length}</Text>
              <Text style={styles.statLabel}>Giao dịch xong</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.primary }]}>{currentUser.civilizationPoints}</Text>
              <Text style={styles.statLabel}>Điểm uy tín</Text>
            </View>
          </View>
        </View>

        {/* Bento Grid: Civilization Gauge & Wallet */}
        <View style={styles.bentoGrid}>
          {/* Bento 1: Điểm Văn Minh */}
          <View style={styles.bentoCivCard}>
            <View style={styles.bentoHeader}>
              <View style={styles.bentoIconBgCoral}>
                <Award size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.bentoCardTitle}>Điểm Văn Minh</Text>
            </View>
            
            <View style={styles.civScoreRow}>
              <Text style={styles.civScoreBig}>{currentUser.civilizationPoints}</Text>
              <Text style={styles.civScoreMax}>/100</Text>
            </View>

            {/* Visual Gauge Track */}
            <View style={styles.gaugeTrack}>
              <View style={[styles.gaugeFill, { width: `${Math.min(currentUser.civilizationPoints, 100)}%` }]} />
            </View>

            <View style={styles.civBadgePill}>
              <Sparkles size={11} color={COLORS.primary} />
              <Text style={styles.civBadgeText}>Tín nhiệm cao</Text>
            </View>
          </View>

          {/* Bento 2: Ví Xu Khả Dụng */}
          <View style={styles.bentoWalletCard}>
            <View style={styles.bentoHeader}>
              <View style={styles.bentoIconBgGold}>
                <Coins size={18} color="#D97706" />
              </View>
              <Text style={styles.bentoCardTitle}>Ví Xu của mẹ</Text>
            </View>

            <View style={styles.walletBalanceRow}>
              <Text style={styles.walletXuBig}>{currentUser.xuBalance}</Text>
              <Text style={styles.walletXuUnit}>Xu</Text>
            </View>
            <Text style={styles.walletVndEstimated}>~ {formatXuToVND(currentUser.xuBalance)}</Text>

            <View style={styles.walletActionButtons}>
              <ScalePressable
                style={styles.walletTopupBtn}
                scaleTo={0.93}
                onPress={() => navigateTo('TopUp')}
              >
                <Plus size={13} color="#FFFFFF" strokeWidth={3} />
                <Text style={styles.walletTopupText}>Nạp Xu</Text>
              </ScalePressable>

              <ScalePressable
                style={styles.walletWithdrawBtn}
                scaleTo={0.93}
                onPress={() => navigateTo('Withdraw')}
              >
                <TrendingUp size={13} color="#8C6500" strokeWidth={2.5} />
                <Text style={styles.walletWithdrawText}>Rút</Text>
              </ScalePressable>
            </View>
          </View>
        </View>

        {/* Navigation Action Buttons with Rich Visual Styling */}
        <View style={styles.actionsPanel}>
          <Text style={styles.actionsTitle}>Tiện ích & Quản lý</Text>
          <View style={styles.actionsGrid}>
            <ScalePressable style={styles.actionRow} scaleTo={0.98} onPress={() => navigateTo('MyPosts')}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FFE8E8' }]}>
                <FileText size={18} color={COLORS.primary} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>Bài đăng của mẹ</Text>
                <Text style={styles.actionSubLabel}>Quản lý đồ chơi & đồ dùng bé đang đăng</Text>
              </View>
              <ChevronRight size={18} color={COLORS.outline} />
            </ScalePressable>

            <ScalePressable style={styles.actionRow} scaleTo={0.98} onPress={() => navigateTo('Notification')}>
              <View style={[styles.actionIconBox, { backgroundColor: '#E0F7F5' }]}>
                <Bell size={18} color="#26A69A" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>Thông báo của mẹ</Text>
                <Text style={styles.actionSubLabel}>Cập nhật biến động Xu & trạng thái đơn hàng</Text>
              </View>
              <ChevronRight size={18} color={COLORS.outline} />
            </ScalePressable>

            <ScalePressable style={styles.actionRow} scaleTo={0.98} onPress={() => navigateTo('CareHandbook')}>
              <View style={[styles.actionIconBox, { backgroundColor: '#E8EDFB' }]}>
                <Syringe size={18} color="#4361EE" />
              </View>
              <View style={styles.actionTextContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.actionLabel}>Sổ tay mẹ bỉm (Tiêm & WHO)</Text>
                  <View style={styles.hotBadge}><Text style={styles.hotBadgeText}>Hot 🔥</Text></View>
                </View>
                <Text style={styles.actionSubLabel}>Nhắc lịch tiêm chủng & chuẩn cân nặng WHO</Text>
              </View>
              <ChevronRight size={18} color={COLORS.outline} />
            </ScalePressable>

            <ScalePressable style={styles.actionRow} scaleTo={0.98} onPress={() => navigateTo('DonationStation')}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FFF3D6' }]}>
                <Gift size={18} color="#D97706" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>Trạm tặng đồ Kindr (0 Xu)</Text>
                <Text style={styles.actionSubLabel}>Nhận & chia sẻ đồ từ thiện yêu thương</Text>
              </View>
              <ChevronRight size={18} color={COLORS.outline} />
            </ScalePressable>

            <ScalePressable style={styles.actionRow} scaleTo={0.98} onPress={() => navigateTo('Settings')}>
              <View style={[styles.actionIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Settings size={18} color="#475569" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionLabel}>Cài đặt & Bảo mật</Text>
                <Text style={styles.actionSubLabel}>Đổi mật khẩu, tùy chọn thông báo & quyền Admin</Text>
              </View>
              <ChevronRight size={18} color={COLORS.outline} />
            </ScalePressable>
          </View>
        </View>

        {/* Admin Portal Section - Only for Authorized Admins */}
        {currentUser.role === 'admin' && (
          <View style={styles.adminSectionContainer}>
            <TouchableOpacity
              style={styles.adminPortalCard}
              activeOpacity={0.8}
              onPress={() => navigateTo('AdminDashboard')}
            >
              <View style={styles.adminPortalLeft}>
                <ShieldAlert size={22} color="#FFFFFF" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.adminPortalTitle}>Bảng Quản Trị Admin 🛡️</Text>
                    <View style={styles.adminActiveBadge}>
                      <Text style={styles.adminActiveBadgeText}>QUẢN TRỊ VIÊN</Text>
                    </View>
                  </View>
                  <Text style={styles.adminPortalSubtitle}>Duyệt bài đăng, kiểm duyệt rút tiền & xử lý tranh chấp</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* History Tabs with Segmented Control */}
        <View style={styles.historySection}>
          <View style={styles.tabHeader}>
            <ScalePressable style={[styles.tabBtn, activeHistoryTab === 'escrow' && styles.tabBtnActive]} scaleTo={0.94} onPress={() => setActiveHistoryTab('escrow')}>
              <Text style={[styles.tabText, activeHistoryTab === 'escrow' && styles.tabTextActive]}>
                Đang chờ ({activeEscrowTx.length})
              </Text>
            </ScalePressable>

            <ScalePressable style={[styles.tabBtn, activeHistoryTab === 'completed' && styles.tabBtnActive]} scaleTo={0.94} onPress={() => setActiveHistoryTab('completed')}>
              <Text style={[styles.tabText, activeHistoryTab === 'completed' && styles.tabTextActive]}>
                Đã xong ({completedTx.length})
              </Text>
            </ScalePressable>

            <ScalePressable style={[styles.tabBtn, activeHistoryTab === 'reviews' && styles.tabBtnActive]} scaleTo={0.94} onPress={() => setActiveHistoryTab('reviews')}>
              <Text style={[styles.tabText, activeHistoryTab === 'reviews' && styles.tabTextActive]}>
                Đánh giá ({myReceivedRatings.length})
              </Text>
            </ScalePressable>

            <ScalePressable style={[styles.tabBtn, activeHistoryTab === 'civilization' && styles.tabBtnActive]} scaleTo={0.94} onPress={() => setActiveHistoryTab('civilization')}>
              <Text style={[styles.tabText, activeHistoryTab === 'civilization' && styles.tabTextActive]}>
                Điểm uy tín
              </Text>
            </ScalePressable>
          </View>

          <View style={styles.tabContent}>
            {activeHistoryTab === 'escrow' && (
              activeEscrowTx.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Clock size={36} color={COLORS.outline} style={{ opacity: 0.6 }} />
                  <Text style={styles.emptyTitle}>Chưa có đơn chờ giao dịch</Text>
                  <Text style={styles.emptySub}>Khi mẹ gửi yêu cầu đổi đồ, quy trình ký quỹ kép sẽ hiển thị ở đây để mẹ kiểm định an toàn.</Text>
                </View>
              ) : (
                activeEscrowTx.map((tx, idx) => (
                  <FadeInItem key={tx.id} index={idx} delay={40}>
                    <ScalePressable style={styles.txRow} scaleTo={0.97} onPress={() => navigation.navigate('TransactionDetail', { id: tx.id })}>
                      <Image source={{ uri: tx.productImage }} style={styles.txImg} />
                      <View style={styles.txDetails}>
                        <Text style={styles.txName} numberOfLines={1}>{tx.productName}</Text>
                        <Text style={styles.txStatusText}>🔒 {tx.status === 'in_safeful_time' ? 'Bảo chứng 6h kiểm định' : 'Tạm khóa Escrow'}</Text>
                      </View>
                      <ChevronRight size={16} color={COLORS.outline} />
                    </ScalePressable>
                  </FadeInItem>
                ))
              )
            )}

            {activeHistoryTab === 'completed' && (
              completedTx.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <CheckCircle2 size={36} color={COLORS.outline} style={{ opacity: 0.6 }} />
                  <Text style={styles.emptyTitle}>Chưa có giao dịch hoàn tất</Text>
                  <Text style={styles.emptySub}>Mẹ hãy dọn đồ cũ của bé lên sàn đổi đồ hoặc chọn quà tặng 0 Xu nhé!</Text>
                </View>
              ) : (
                completedTx.map((tx, idx) => (
                  <FadeInItem key={tx.id} index={idx} delay={40}>
                    <ScalePressable style={styles.txRow} scaleTo={0.97} onPress={() => navigation.navigate('TransactionDetail', { id: tx.id })}>
                      <Image source={{ uri: tx.productImage }} style={styles.txImg} />
                      <View style={styles.txDetails}>
                        <Text style={styles.txName} numberOfLines={1}>{tx.productName}</Text>
                        <Text style={styles.txDate}>{formatFullDate(tx.finalizedAt || tx.createdAt)}</Text>
                      </View>
                      <Text style={styles.txSuccessTag}>Đã Xong ✅</Text>
                    </ScalePressable>
                  </FadeInItem>
                ))
              )
            )}

            {activeHistoryTab === 'reviews' && (
              myReceivedRatings.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Star size={36} color={COLORS.outline} style={{ opacity: 0.6 }} />
                  <Text style={styles.emptyTitle}>Chưa nhận được đánh giá</Text>
                  <Text style={styles.emptySub}>Sau mỗi lần đổi đồ thành công, hai mẹ sẽ đánh giá sao và chấm Điểm Văn Minh cho nhau.</Text>
                </View>
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
                    <Text style={{ fontSize: 13, fontWeight: '800', color: log.pointsChanged > 0 ? COLORS.primary : COLORS.error }}>
                      {log.pointsChanged > 0 ? `+${log.pointsChanged}` : log.pointsChanged}đ
                    </Text>
                    <Text style={{ fontSize: 12, flex: 1, color: COLORS.onSurface, lineHeight: 18 }}>{log.reason}</Text>
                  </View>
                </FadeInItem>
              ))
            )}
          </View>
        </View>

        {/* Logout Button */}
        <ScalePressable style={styles.logoutBtn} scaleTo={0.96} onPress={handleLogout}>
          <LogOut size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
        </ScalePressable>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.sm,
    paddingBottom: 110,
  },
  lockedBanner: {
    backgroundColor: COLORS.errorContainer,
    padding: SPACING.md,
    borderRadius: RADIUS.default,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  lockedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.error,
    marginTop: 4,
  },
  lockedSub: {
    fontSize: 11,
    color: COLORS.onErrorContainer,
    textAlign: 'center',
    marginTop: 2,
  },

  // Profile Hero Card
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...SHADOWS.card,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.surfaceDim,
    borderWidth: 2,
    borderColor: '#FFE8E8',
  },
  avatarPlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFE8E8',
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileMainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 6,
  },
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#FFE8E8',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  editProfilePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bioSnippet: {
    fontSize: 11,
    fontStyle: 'italic',
    color: COLORS.textMuted,
    marginBottom: 6,
    lineHeight: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  memberBadge: {
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF8E1',
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  ratingScore: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C6500',
  },
  ratingCount: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  phonePlaceholder: {
    color: COLORS.outline,
    fontStyle: 'italic',
  },
  locationText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },

  // Stats Bar inside Profile Card
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },

  // Bento Grid
  bentoGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  bentoCivCard: {
    flex: 1,
    backgroundColor: '#FFF7F7',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.16)',
    padding: SPACING.md,
    ...SHADOWS.soft,
  },
  bentoWalletCard: {
    flex: 1,
    backgroundColor: '#FFFDF5',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.35)',
    padding: SPACING.md,
    ...SHADOWS.soft,
  },
  bentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  bentoIconBgCoral: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFE8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoIconBgGold: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bentoCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  civScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  civScoreBig: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
  },
  civScoreMax: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  gaugeTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 6,
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  civBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFE8E8',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginTop: 2,
  },
  civBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  walletXuBig: {
    fontSize: 24,
    fontWeight: '800',
    color: '#B45309',
  },
  walletXuUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  walletVndEstimated: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 8,
  },
  walletActionButtons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 'auto',
  },
  walletTopupBtn: {
    flex: 1,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    ...SHADOWS.btn,
  },
  walletTopupText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  walletWithdrawBtn: {
    flex: 1,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  walletWithdrawText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C6500',
  },

  // Actions Panel (Services & Features)
  actionsPanel: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  actionsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  actionsGrid: {
    gap: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  actionSubLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  hotBadge: {
    backgroundColor: '#FFE5EC',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  hotBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#E63946',
  },

  headerSettingsBtn: {
    padding: 6,
    borderRadius: RADIUS.full,
  },

  // Admin Card Section
  adminSectionContainer: {
    marginBottom: SPACING.md,
  },
  adminPortalCard: {
    backgroundColor: '#D97706',
    borderRadius: 18,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.card,
  },
  adminPortalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  adminPortalTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  adminActiveBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  adminActiveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  adminPortalSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  adminPortalCardInactive: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#FEF3C7',
    ...SHADOWS.card,
  },
  adminShieldIconBoxInactive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminPortalTitleInactive: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  adminInactiveBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  adminInactiveBadgeText: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: '800',
  },
  adminPortalSubtitleInactive: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  openAdminBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  openAdminBtnPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // History Tabs & Segmented Control
  historySection: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.outline,
    textAlign: 'center',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  tabContent: {
    padding: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    gap: SPACING.sm,
  },
  txImg: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceDim,
  },
  txDetails: {
    flex: 1,
  },
  txName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  txStatusText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 2,
  },
  txDate: {
    fontSize: 10,
    color: COLORS.outline,
    marginTop: 2,
  },
  txSuccessTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  reviewRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
    marginTop: 3,
  },
  reviewDate: {
    fontSize: 9,
    color: COLORS.outline,
    marginTop: 2,
  },
  civRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: 'rgba(230, 57, 70, 0.2)',
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xl,
    ...SHADOWS.soft,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error,
  },
});

export default ProfileScreen;
