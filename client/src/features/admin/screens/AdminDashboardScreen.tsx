import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import { useAppSelector } from '../../../app/store/hooks';
import { api } from '../../../services/api';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { 
  Users, 
  FileText, 
  Layers, 
  ShieldAlert, 
  Wallet, 
  Activity, 
  AlertOctagon,
  ChevronRight,
  TrendingUp
} from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Card from '../../../components/layout/Card';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'AdminDashboard'>;

export const AdminDashboardScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  // Read data to calculate stats
  const allUsers = useAppSelector((state) => state.auth.allUsers);
  const products = useAppSelector((state) => state.home.products);
  const transactions = useAppSelector((state) => state.exchange.transactions);
  const withdrawRequests = useAppSelector((state) => state.auth.withdrawRequests);

  const localStats = {
    usersCount: allUsers.length,
    postsCount: products.length,
    disputesCount: transactions.filter(t => t.status === 'disputed').length,
    withdrawsCount: withdrawRequests.filter(r => r.status === 'pending').length,
    totalEscrow: transactions
      .filter(t => t.status === 'frozen' || t.status === 'shipped')
      .reduce((sum, t) => sum + t.buyerEscrowFrozen + t.sellerEscrowFrozen, 0),
  };

  const [apiStats, setApiStats] = useState<any>(null);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => {
        if (res.data) {
          setApiStats({
            usersCount: res.data.totalUsers ?? res.data.usersCount ?? localStats.usersCount,
            postsCount: res.data.totalProducts ?? res.data.postsCount ?? localStats.postsCount,
            disputesCount: res.data.pendingDisputes ?? res.data.disputesCount ?? localStats.disputesCount,
            withdrawsCount: res.data.pendingWithdraws ?? res.data.withdrawsCount ?? localStats.withdrawsCount,
            totalEscrow: res.data.escrowLockedXu ?? res.data.totalEscrow ?? localStats.totalEscrow,
          });
        }
      })
      .catch(() => {});
  }, []);

  const stats = apiStats || localStats;

  const MENU_ITEMS = [
    { name: 'Quản lý Thành viên', icon: Users, route: 'ManageUsers', count: stats.usersCount, color: '#3b82f6', bg: '#eff6ff' },
    { name: 'Quản lý Tin đăng', icon: FileText, route: 'ManagePosts', count: stats.postsCount, color: '#10b981', bg: '#ecfdf5' },
    { name: 'Quản lý Danh mục', icon: Layers, route: 'ManageCategories', count: null, color: '#8b5cf6', bg: '#f5f3ff' },
    { name: 'Giám sát Giao dịch', icon: Activity, route: 'ManageTransactions', count: transactions.length, color: '#f59e0b', bg: '#fffbeb' },
    { name: 'Xử lý Tranh chấp', icon: ShieldAlert, route: 'ManageDisputes', count: stats.disputesCount, color: '#ef4444', bg: '#fdf2f2', badge: true },
    { name: 'Duyệt Rút tiền', icon: Wallet, route: 'ManageWithdraws', count: stats.withdrawsCount, color: '#06b6d4', bg: '#ecfeff', badge: true },
    { name: 'Báo cáo Vi phạm', icon: AlertOctagon, route: 'ManageReports', count: 1, color: '#ec4899', bg: '#fdf2f8' },
  ];

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Bảng Điều Khiển Admin" showBack />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.adminBanner}>
          <Text style={styles.bannerTitle}>Hệ Thống Quản Trị Kindr 🛡️</Text>
          <Text style={styles.bannerText}>
            Giám sát cộng đồng văn minh, phân xử giao dịch bảo chứng và quản lý tài chính dòng xu.
          </Text>
        </View>

        {/* Highlight Stats Row */}
        <View style={styles.statsRow}>
          <Card style={styles.statsCard} contentStyle={styles.statsCardContent}>
            <TrendingUp size={20} color={COLORS.primary} />
            <Text style={styles.statsLabel}>Tổng xu ký gửi (Escrow)</Text>
            <Text style={styles.statsValue}>{stats.totalEscrow} Xu</Text>
          </Card>
        </View>

        {/* Menu Grid List */}
        <Text style={styles.sectionTitle}>Các chức năng nghiệp vụ:</Text>
        <View style={styles.menuList}>
          {MENU_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const hasBadge = item.badge && item.count !== null && item.count > 0;
            
            return (
              <TouchableOpacity
                key={idx}
                style={styles.menuRow}
                onPress={() => navigation.navigate(item.route as any)}
                activeOpacity={0.8}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: item.bg }]}>
                    <Icon size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuName}>{item.name}</Text>
                  
                  {hasBadge && (
                    <View style={styles.alertDot}>
                      <Text style={styles.alertDotText}>{item.count}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.rowRight}>
                  {item.count !== null && !item.badge && (
                    <Text style={styles.countText}>{item.count}</Text>
                  )}
                  <ChevronRight size={16} color={COLORS.outlineVariant} />
                </View>
              </TouchableOpacity>
            );
          })}
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
  adminBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: SPACING.md + 4,
    marginBottom: SPACING.lg,
    ...SHADOWS.ambient,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 16,
  },
  statsRow: {
    marginBottom: SPACING.lg,
  },
  statsCard: {
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    padding: SPACING.md,
  },
  statsCardContent: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  statsLabel: {
    fontSize: 12,
    color: COLORS.outline,
    fontWeight: '600',
    marginTop: 4,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: SPACING.md,
  },
  menuList: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceVariant,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  alertDot: {
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertDotText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countText: {
    fontSize: 12,
    color: COLORS.outline,
    fontWeight: '600',
  },
});

export default AdminDashboardScreen;
