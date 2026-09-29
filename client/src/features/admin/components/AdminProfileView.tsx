// src/features/admin/components/AdminProfileView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { logoutAsync } from '../../auth/store/authSlice';
import { api } from '../../../services/api';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  FileText,
  Layers,
  Wallet,
  Activity,
  AlertOctagon,
  ChevronRight,
  Settings,
  LogOut,
  TrendingUp,
  Mail,
  Phone,
  RefreshCw,
} from 'lucide-react-native';
import { ScalePressable } from '../../../components/common/ScalePressable';

const KINDR_LOGO = require('../../../../assets/images/kindr-logo.png');

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const AdminProfileView = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [dashboardStats, setDashboardStats] = useState<{
    totalUsers: number;
    totalProducts: number;
    totalTransactions: number;
    pendingProducts: number;
    pendingDisputes: number;
    pendingWithdraws: number;
    openReports: number;
    escrowLockedXu: number;
  }>({
    totalUsers: 0,
    totalProducts: 0,
    totalTransactions: 0,
    pendingProducts: 0,
    pendingDisputes: 0,
    pendingWithdraws: 0,
    openReports: 0,
    escrowLockedXu: 0,
  });

  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data) {
        setDashboardStats({
          totalUsers: res.data.totalUsers ?? 0,
          totalProducts: res.data.totalProducts ?? 0,
          totalTransactions: res.data.totalTransactions ?? 0,
          pendingProducts: res.data.pendingProducts ?? 0,
          pendingDisputes: res.data.pendingDisputes ?? 0,
          pendingWithdraws: res.data.pendingWithdraws ?? 0,
          openReports: res.data.openReports ?? 0,
          escrowLockedXu: res.data.escrowLockedXu ?? 0,
        });
      }
    } catch {
      // Keep existing state on error
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất Quản trị viên',
      'Xác nhận đăng xuất khỏi phiên làm việc Ban Quản Trị Kindr?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logoutAsync());
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' as any }],
            });
          },
        },
      ]
    );
  };

  const ADMIN_SECTIONS = [
    {
      id: 'posts',
      title: 'Quản lý & Duyệt Tin Đăng',
      subtitle: 'Kiểm duyệt bài đăng đồ chơi, đồ dùng bé trước khi lên sàn',
      icon: FileText,
      route: 'ManagePosts' as keyof AppStackParamList,
      count: dashboardStats.pendingProducts,
      countLabel: 'chờ duyệt',
      isWarning: dashboardStats.pendingProducts > 0,
      iconColor: '#D97706',
      iconBg: '#FEF3C7',
    },
    {
      id: 'disputes',
      title: 'Xử lý Tranh chấp',
      subtitle: 'Trọng tài phân xử khiếu nại giao nhận bảo chứng Escrow',
      icon: ShieldAlert,
      route: 'ManageDisputes' as keyof AppStackParamList,
      count: dashboardStats.pendingDisputes,
      countLabel: 'vụ việc',
      isWarning: dashboardStats.pendingDisputes > 0,
      iconColor: '#EF4444',
      iconBg: '#FEE2E2',
    },
    {
      id: 'users',
      title: 'Quản lý Thành viên',
      subtitle: 'Danh sách mẹ bỉm, cấp quyền, điểm văn minh, khóa vi phạm',
      icon: Users,
      route: 'ManageUsers' as keyof AppStackParamList,
      count: dashboardStats.totalUsers,
      countLabel: 'thành viên',
      isWarning: false,
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
    },
    {
      id: 'withdraws',
      title: 'Phê duyệt Rút Xu',
      subtitle: 'Xác nhận chuyển khoản ngân hàng VietQR cho yêu cầu rút Xu',
      icon: Wallet,
      route: 'ManageWithdraws' as keyof AppStackParamList,
      count: dashboardStats.pendingWithdraws,
      countLabel: 'yêu cầu',
      isWarning: dashboardStats.pendingWithdraws > 0,
      iconColor: '#06B6D4',
      iconBg: '#ECFEFF',
    },
    {
      id: 'reports',
      title: 'Báo cáo Vi phạm',
      subtitle: 'Xem và xử lý các bài đăng hoặc tài khoản bị cộng đồng báo cáo',
      icon: AlertOctagon,
      route: 'ManageReports' as keyof AppStackParamList,
      count: dashboardStats.openReports,
      countLabel: 'báo cáo',
      isWarning: dashboardStats.openReports > 0,
      iconColor: '#EC4899',
      iconBg: '#FDF2F8',
    },
    {
      id: 'transactions',
      title: 'Giám sát Giao dịch',
      subtitle: 'Theo dõi dòng tiền Escrow và lịch sử luân chuyển đồ dùng',
      icon: Activity,
      route: 'ManageTransactions' as keyof AppStackParamList,
      count: dashboardStats.totalTransactions,
      countLabel: 'giao dịch',
      isWarning: false,
      iconColor: '#10B981',
      iconBg: '#ECFDF5',
    },
    {
      id: 'categories',
      title: 'Quản lý Danh mục',
      subtitle: 'Cấu hình danh mục đồ dùng và tiêu chuẩn phân loại sản phẩm',
      icon: Layers,
      route: 'ManageCategories' as keyof AppStackParamList,
      count: null,
      countLabel: '',
      isWarning: false,
      iconColor: '#8B5CF6',
      iconBg: '#F5F3FF',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerInner}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconCircle}>
              <Shield size={20} color="#FFFFFF" strokeWidth={2.4} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Bảng Quản Trị Hệ Thống</Text>
              <Text style={styles.headerSubtitle}>Kindr Administration & Moderation</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={fetchStats}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <RefreshCw size={17} color={COLORS.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Settings size={17} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <View style={styles.contentWrapper}>
          {/* Admin Identity Card */}
          <View style={styles.adminCard}>
            <View style={styles.adminCardTop}>
              <View style={styles.avatarWrapper}>
                {currentUser?.avatar ? (
                  <Image source={{ uri: currentUser.avatar }} style={styles.adminAvatar} />
                ) : (
                  <Image source={KINDR_LOGO} style={styles.adminAvatar} resizeMode="contain" />
                )}
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={11} color="#FFFFFF" strokeWidth={3} />
                </View>
              </View>

              <View style={styles.adminMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.adminName} numberOfLines={1}>
                    {currentUser?.name || 'Ban Quản Trị Kindr'}
                  </Text>
                </View>

                <View style={styles.badgeRow}>
                  <View style={styles.roleBadge}>
                    <Shield size={11} color="#6D28D9" />
                    <Text style={styles.roleBadgeText}>QUẢN TRỊ VIÊN CẤP CAO</Text>
                  </View>
                  <View style={styles.onlinePill}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>Trực tuyến</Text>
                  </View>
                </View>

                <View style={styles.contactDetails}>
                  {currentUser?.email ? (
                    <View style={styles.contactItem}>
                      <Mail size={12} color={COLORS.textMuted} />
                      <Text style={styles.contactText} numberOfLines={1}>
                        {currentUser.email}
                      </Text>
                    </View>
                  ) : null}
                  {currentUser?.phone ? (
                    <View style={styles.contactItem}>
                      <Phone size={12} color={COLORS.textMuted} />
                      <Text style={styles.contactText}>{currentUser.phone}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={styles.adminCardFooter}>
              <Text style={styles.footerScopeText}>
                Phạm vi kiểm duyệt: Toàn sàn Kindr (Sản phẩm, Người dùng, Ký quỹ & Rút tiền)
              </Text>
            </View>
          </View>

          {/* Real-time KPI Stats Grid - 2x2 Balanced Layout */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Chỉ số vận hành hệ thống</Text>
            <Text style={styles.sectionHeadingSub}>Cập nhật thời gian thực</Text>
          </View>

          {/* Row 1: Tin Chờ Duyệt & Lệnh Rút Xu */}
          <View style={styles.kpiRow}>
            {/* Tin Chờ Duyệt */}
            <ScalePressable
              containerStyle={styles.kpiCardWrapper}
              style={[
                styles.kpiCard,
                dashboardStats.pendingProducts > 0 && styles.kpiCardWarning,
              ]}
              scaleTo={0.97}
              onPress={() => navigation.navigate('ManagePosts')}
            >
              <View style={[styles.kpiIconBox, { backgroundColor: '#FEF3C7' }]}>
                <FileText size={20} color="#D97706" strokeWidth={2.2} />
              </View>
              <View style={styles.kpiInfo}>
                <Text style={styles.kpiLabel}>Tin chờ duyệt</Text>
                <Text style={[styles.kpiValue, dashboardStats.pendingProducts > 0 && styles.kpiValueWarning]}>
                  {dashboardStats.pendingProducts}
                </Text>
                <View
                  style={[
                    styles.kpiStatusPill,
                    dashboardStats.pendingProducts > 0 ? styles.kpiStatusPillWarning : styles.kpiStatusPillMuted,
                  ]}
                >
                  <Text
                    style={[
                      styles.kpiStatusText,
                      dashboardStats.pendingProducts > 0 ? styles.kpiStatusTextWarning : styles.kpiStatusTextMuted,
                    ]}
                  >
                    {dashboardStats.pendingProducts > 0 ? '● Cần duyệt ngay' : 'Đã duyệt hết'}
                  </Text>
                </View>
              </View>
            </ScalePressable>

            {/* Lệnh Rút Xu */}
            <ScalePressable
              containerStyle={styles.kpiCardWrapper}
              style={[
                styles.kpiCard,
                dashboardStats.pendingWithdraws > 0 && styles.kpiCardCyan,
              ]}
              scaleTo={0.97}
              onPress={() => navigation.navigate('ManageWithdraws')}
            >
              <View style={[styles.kpiIconBox, { backgroundColor: '#ECFEFF' }]}>
                <Wallet size={20} color="#0891B2" strokeWidth={2.2} />
              </View>
              <View style={styles.kpiInfo}>
                <Text style={styles.kpiLabel}>Lệnh rút Xu</Text>
                <Text style={[styles.kpiValue, dashboardStats.pendingWithdraws > 0 && styles.kpiValueCyan]}>
                  {dashboardStats.pendingWithdraws}
                </Text>
                <View
                  style={[
                    styles.kpiStatusPill,
                    dashboardStats.pendingWithdraws > 0 ? styles.kpiStatusPillCyan : styles.kpiStatusPillMuted,
                  ]}
                >
                  <Text
                    style={[
                      styles.kpiStatusText,
                      dashboardStats.pendingWithdraws > 0 ? styles.kpiStatusTextCyan : styles.kpiStatusTextMuted,
                    ]}
                  >
                    {dashboardStats.pendingWithdraws > 0 ? '● Chờ xác nhận' : 'Hoàn tất'}
                  </Text>
                </View>
              </View>
            </ScalePressable>
          </View>

          {/* Row 2: Tranh Chấp & Thành Viên */}
          <View style={styles.kpiRow}>
            {/* Tranh Chấp */}
            <ScalePressable
              containerStyle={styles.kpiCardWrapper}
              style={[
                styles.kpiCard,
                dashboardStats.pendingDisputes > 0 && styles.kpiCardDanger,
              ]}
              scaleTo={0.97}
              onPress={() => navigation.navigate('ManageDisputes')}
            >
              <View style={[styles.kpiIconBox, { backgroundColor: '#FEE2E2' }]}>
                <ShieldAlert size={20} color="#DC2626" strokeWidth={2.2} />
              </View>
              <View style={styles.kpiInfo}>
                <Text style={styles.kpiLabel}>Tranh chấp</Text>
                <Text style={[styles.kpiValue, dashboardStats.pendingDisputes > 0 && styles.kpiValueDanger]}>
                  {dashboardStats.pendingDisputes}
                </Text>
                <View
                  style={[
                    styles.kpiStatusPill,
                    dashboardStats.pendingDisputes > 0 ? styles.kpiStatusPillDanger : styles.kpiStatusPillMuted,
                  ]}
                >
                  <Text
                    style={[
                      styles.kpiStatusText,
                      dashboardStats.pendingDisputes > 0 ? styles.kpiStatusTextDanger : styles.kpiStatusTextMuted,
                    ]}
                  >
                    {dashboardStats.pendingDisputes > 0 ? '● Cần phân xử' : 'An toàn 100%'}
                  </Text>
                </View>
              </View>
            </ScalePressable>

            {/* Thành Viên */}
            <ScalePressable
              containerStyle={styles.kpiCardWrapper}
              style={styles.kpiCard}
              scaleTo={0.97}
              onPress={() => navigation.navigate('ManageUsers')}
            >
              <View style={[styles.kpiIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Users size={20} color="#059669" strokeWidth={2.2} />
              </View>
              <View style={styles.kpiInfo}>
                <Text style={styles.kpiLabel}>Thành viên</Text>
                <Text style={[styles.kpiValue, { color: '#059669' }]}>
                  {dashboardStats.totalUsers}
                </Text>
                <View style={[styles.kpiStatusPill, styles.kpiStatusPillMuted]}>
                  <Text style={[styles.kpiStatusText, { color: '#059669' }]}>
                    Cộng đồng mẹ bỉm
                  </Text>
                </View>
              </View>
            </ScalePressable>
          </View>

          {/* Escrow Treasury Banner */}
          <TouchableOpacity
            style={styles.escrowBanner}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ManageTransactions')}
          >
            <View style={styles.escrowIconCircle}>
              <TrendingUp size={22} color={COLORS.primary} strokeWidth={2.4} />
            </View>
            <View style={styles.escrowContent}>
              <View style={styles.escrowBadgeRow}>
                <Text style={styles.escrowTitle}>QUỸ KÝ QUỸ KÉP BẢO CHỨNG (DOUBLE ESCROW)</Text>
                <View style={styles.escrowSafeTag}>
                  <ShieldCheck size={10} color={COLORS.primaryDark} />
                  <Text style={styles.escrowSafeTagText}>An toàn 100%</Text>
                </View>
              </View>
              <Text style={styles.escrowAmount}>
                {dashboardStats.escrowLockedXu} Xu
                <Text style={styles.escrowVnd}>
                  {' '}~ {(dashboardStats.escrowLockedXu * 10000).toLocaleString('vi-VN')} đ
                </Text>
              </Text>
              <Text style={styles.escrowNote}>
                Tiền cọc SafeFee & giá trị đồ đang tạm khóa bảo chứng giao dịch giữa các mẹ bỉm.
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Core Management Suites */}
          <Text style={styles.sectionHeading}>Các phân hệ nghiệp vụ quản trị</Text>
          <View style={styles.suitesContainer}>
            {ADMIN_SECTIONS.map((section, idx) => {
              const Icon = section.icon;
              const hasCount = section.count !== null;

              return (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    styles.suiteCard,
                    idx < ADMIN_SECTIONS.length - 1 && styles.suiteCardBorder,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(section.route as any)}
                >
                  <View style={[styles.suiteIconBox, { backgroundColor: section.iconBg }]}>
                    <Icon size={20} color={section.iconColor} strokeWidth={2.2} />
                  </View>

                  <View style={styles.suiteInfo}>
                    <View style={styles.suiteTitleRow}>
                      <Text style={styles.suiteTitle}>{section.title}</Text>
                      {section.isWarning && (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentBadgeText}>
                            {section.count} {section.countLabel}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.suiteSubtitle} numberOfLines={1}>
                      {section.subtitle}
                    </Text>
                  </View>

                  <View style={styles.suiteRight}>
                    {hasCount && !section.isWarning && (
                      <View style={styles.normalCountBadge}>
                        <Text style={styles.normalCountText}>{section.count}</Text>
                      </View>
                    )}
                    <ChevronRight size={18} color={COLORS.outline} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* System Settings & Actions */}
          <Text style={styles.sectionHeading}>Hệ thống & Phiên đăng nhập</Text>
          <View style={styles.systemContainer}>
            <TouchableOpacity
              style={styles.systemRow}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.7}
            >
              <View style={styles.systemLeft}>
                <View style={[styles.systemIconBox, { backgroundColor: '#F3F4F6' }]}>
                  <Settings size={18} color={COLORS.text} />
                </View>
                <View>
                  <Text style={styles.systemTitle}>Cài đặt hệ thống & Bảo mật</Text>
                  <Text style={styles.systemSubtitle}>Đổi mật khẩu tài khoản quản trị & tùy chọn</Text>
                </View>
              </View>
              <ChevronRight size={18} color={COLORS.outline} />
            </TouchableOpacity>

            <View style={styles.systemDivider} />

            <TouchableOpacity
              style={styles.systemRow}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.systemLeft}>
                <View style={[styles.systemIconBox, { backgroundColor: '#FEE2E2' }]}>
                  <LogOut size={18} color="#EF4444" />
                </View>
                <View>
                  <Text style={[styles.systemTitle, { color: '#EF4444', fontWeight: '700' }]}>
                    Đăng xuất tài khoản Quản trị
                  </Text>
                  <Text style={styles.systemSubtitle}>Kết thúc phiên làm việc Ban Quản Trị</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  topHeader: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm + 2,
    ...SHADOWS.soft,
  },
  headerInner: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: SPACING.md,
    paddingBottom: 120, // generous bottom padding to avoid bottom tab bar overlap
  },
  contentWrapper: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: SPACING.md,
  },
  // Admin Identity Card
  adminCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.16)',
    ...SHADOWS.card,
    marginBottom: SPACING.md,
  },
  adminCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  adminAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    borderWidth: 2.5,
    borderColor: '#7C3AED',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  adminMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  adminName: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.4,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  contactDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  adminCardFooter: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs + 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerScopeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs + 2,
  },
  sectionHeading: {
    ...TYPOGRAPHY.h3,
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionHeadingSub: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  // 2x2 Balanced KPI Rows
  kpiRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  kpiCardWrapper: {
    flex: 1,
  },
  kpiCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    ...SHADOWS.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  kpiCardWarning: {
    backgroundColor: '#FFFDF5',
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  kpiCardCyan: {
    backgroundColor: '#F8FEFF',
    borderColor: 'rgba(8, 145, 178, 0.3)',
  },
  kpiCardDanger: {
    backgroundColor: '#FFF5F5',
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  kpiIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiInfo: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    lineHeight: 26,
  },
  kpiValueWarning: {
    color: '#D97706',
  },
  kpiValueCyan: {
    color: '#0891B2',
  },
  kpiValueDanger: {
    color: '#DC2626',
  },
  kpiStatusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginTop: 3,
  },
  kpiStatusPillWarning: {
    backgroundColor: '#FEF3C7',
  },
  kpiStatusPillCyan: {
    backgroundColor: '#ECFEFF',
  },
  kpiStatusPillDanger: {
    backgroundColor: '#FEE2E2',
  },
  kpiStatusPillMuted: {
    backgroundColor: '#F3F4F6',
  },
  kpiStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  kpiStatusTextWarning: {
    color: '#B45309',
  },
  kpiStatusTextCyan: {
    color: '#0E7490',
  },
  kpiStatusTextDanger: {
    color: '#B91C1C',
  },
  kpiStatusTextMuted: {
    color: COLORS.textMuted,
  },
  // Escrow Banner
  escrowBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(120, 194, 173, 0.45)',
    gap: SPACING.sm,
    marginVertical: SPACING.sm,
    ...SHADOWS.soft,
  },
  escrowIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  escrowContent: {
    flex: 1,
  },
  escrowBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  escrowTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.4,
  },
  escrowSafeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#C2E5DC',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.sm,
  },
  escrowSafeTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  escrowAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginVertical: 2,
  },
  escrowVnd: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  escrowNote: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: '#3A6758',
    lineHeight: 15,
  },
  // Suites Container
  suitesContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOWS.card,
    overflow: 'hidden',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  suiteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - 2,
    gap: SPACING.sm,
  },
  suiteCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  suiteIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suiteInfo: {
    flex: 1,
  },
  suiteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suiteTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  urgentBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  suiteSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  suiteRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  normalCountBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  normalCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  // System Container
  systemContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOWS.card,
    overflow: 'hidden',
    marginTop: SPACING.xs,
  },
  systemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md - 2,
  },
  systemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  systemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  systemSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  systemDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  bottomSpacer: {
    height: 30,
  },
});

export default AdminProfileView;
