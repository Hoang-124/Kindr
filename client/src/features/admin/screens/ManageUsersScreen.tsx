import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { adjustCivilizationPoints } from '../../auth/store/authSlice';
import { api } from '../../../services/api';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Award, 
  UserX, 
  UserCheck, 
  Crown, 
  Search, 
  X,
  Shield
} from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';

export const ManageUsersScreen = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const allUsers = useAppSelector((state) => state.auth.allUsers);
  
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useCallback(async (search = '') => {
    try {
      setIsLoading(true);
      const res = await api.get('/admin/users', {
        params: search ? { search } : undefined,
      });
      const list = res.data.users || res.data;
      if (Array.isArray(list)) {
        const mapped = list.map((u: any) => ({
          id: u.id || u._id,
          name: u.name,
          phone: u.phone || 'Chưa cập nhật',
          email: u.email || '',
          role: u.role || 'user',
          avatar: u.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
          tradesCount: u.tradesCount || u.successfulTrades || 0,
          ratingAverage: u.reputationScore || 5.0,
          civilizationPoints: u.civilizationPoints ?? 100,
          isLocked: u.isLocked || false,
        }));
        setUsers(mapped);
      } else {
        setUsers(allUsers);
      }
    } catch (err) {
      setUsers(allUsers);
    } finally {
      setIsLoading(false);
    }
  }, [allUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    fetchUsers(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    fetchUsers('');
  };

  const handleToggleRole = async (userId: string, name: string, currentRole: string) => {
    const isPromoting = currentRole !== 'admin';
    const newRole = isPromoting ? 'admin' : 'user';

    Alert.alert(
      isPromoting ? 'Cấp Quyền Quản Trị Viên' : 'Thu Hồi Quyền Quản Trị',
      isPromoting
        ? `Mẹ có chắc muốn cấp quyền Admin cho "${name}"?\n\nTài khoản này sẽ có quyền truy cập Bảng điều khiển quản trị, duyệt lệnh rút tiền và phân xử tranh chấp.`
        : `Mẹ có chắc muốn hạ quyền tài khoản "${name}" về Thành viên (User) thông thường?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: isPromoting ? 'Cấp quyền Admin' : 'Hạ quyền User',
          style: isPromoting ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
              setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
              Alert.alert('Thành công', res.data.message || 'Cập nhật quyền hạn thành công.');
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.error || 'Không thể cập nhật quyền hạn.');
            }
          },
        },
      ]
    );
  };

  const handleReward = async (userId: string, name: string) => {
    Alert.alert(
      'Cộng Điểm Uy Tín',
      `Cộng +5 Điểm Mẹ Bỉm Văn Minh cho mẹ: ${name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Cộng 5 điểm', 
          onPress: async () => {
            try {
              await api.post(`/admin/users/${userId}/points`, { points: 5, reason: 'Admin thưởng điểm' });
            } catch (e) {}
            dispatch(adjustCivilizationPoints({
              userId,
              points: 5,
              reason: 'Admin thưởng điểm tích cực hỗ trợ cộng đồng',
            }));
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, civilizationPoints: Math.min(100, (u.civilizationPoints || 0) + 5) } : u));
            Alert.alert('Thành công', `Đã cộng +5 điểm uy tín cho mẹ ${name}.`);
          }
        }
      ]
    );
  };

  const handlePenalty = async (userId: string, name: string) => {
    Alert.alert(
      'Trừ Điểm Uy Tín',
      `Phạt trừ -10 Điểm Mẹ Bỉm Văn Minh của mẹ: ${name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Trừ 10 điểm', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/admin/users/${userId}/points`, { points: -10, reason: 'Admin phạt trừ điểm' });
            } catch (e) {}
            dispatch(adjustCivilizationPoints({
              userId,
              points: -10,
              reason: 'Admin phạt trừ điểm do vi phạm quy tắc ứng xử',
            }));
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, civilizationPoints: Math.max(0, (u.civilizationPoints || 0) - 10) } : u));
            Alert.alert('Thành công', `Đã phạt -10 điểm uy tín mẹ ${name}.`);
          }
        }
      ]
    );
  };

  const handleToggleFreeze = async (userId: string, name: string, isLocked: boolean) => {
    Alert.alert(
      isLocked ? 'Mở Khóa Tài Khoản' : 'Khóa Tài Khoản',
      isLocked 
        ? `Mẹ có chắc muốn mở khóa hoạt động cho tài khoản: ${name}?`
        : `Mẹ có chắc muốn tạm khóa tài khoản: ${name}? Người dùng sẽ không thể đăng nhập hoặc giao dịch.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: isLocked ? 'Mở khóa' : 'Khóa nick', 
          style: isLocked ? 'default' : 'destructive', 
          onPress: async () => {
            try {
              if (isLocked) {
                await api.put(`/admin/users/${userId}/unlock`);
              } else {
                await api.put(`/admin/users/${userId}/lock`);
              }
              setUsers(prev => prev.map(u => u.id === userId ? { ...u, isLocked: !isLocked } : u));
              Alert.alert('Thành công', isLocked ? `Đã mở khóa tài khoản ${name}.` : `Đã khóa tài khoản ${name}.`);
            } catch (e: any) {
              Alert.alert('Lỗi', e.response?.data?.error || 'Thao tác thất bại.');
            }
          } 
        }
      ]
    );
  };

  const displayList = users.length > 0 ? users : allUsers;

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Quản Lý Thành Viên" showBack />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={18} color={COLORS.outline} style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên, SĐT hoặc email..."
            placeholderTextColor={COLORS.outline}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={handleClearSearch} style={{ padding: 8 }}>
              <X size={16} color={COLORS.outline} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.8}>
          <Text style={styles.searchBtnText}>Tìm</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải danh sách thành viên...</Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isAdmin = item.role === 'admin';
            const isSelf = item.id === currentUser?.id;

            return (
              <View style={[styles.userCard, isAdmin && styles.adminUserCard]}>
                <View style={styles.cardTop}>
                  <View style={styles.avatarWrapper}>
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    {isAdmin && (
                      <View style={styles.crownBadge}>
                        <Crown size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.userInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
                      {isAdmin ? (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>ADMIN</Text>
                        </View>
                      ) : (
                        <View style={styles.userBadge}>
                          <Text style={styles.userBadgeText}>USER</Text>
                        </View>
                      )}
                      {isSelf && (
                        <View style={styles.selfBadge}>
                          <Text style={styles.selfBadgeText}>BẠN</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.userPhone}>SĐT: {item.phone}</Text>
                    {item.email ? <Text style={styles.userEmail}>{item.email}</Text> : null}
                    
                    <Text style={styles.userStats}>
                      Giao dịch: {item.tradesCount} • Đánh giá: {item.ratingAverage} ⭐
                      {item.isLocked && <Text style={{ color: COLORS.error, fontWeight: '700' }}> • Đang bị khóa</Text>}
                    </Text>
                  </View>
                  
                  <View style={styles.pointsBadge}>
                    <Award size={16} color={COLORS.primary} />
                    <Text style={styles.pointsText}>{item.civilizationPoints}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Card Actions Row 1: Points & Lock */}
                <View style={styles.cardActions}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.rewardBtn]}
                    onPress={() => handleReward(item.id, item.name)}
                    activeOpacity={0.8}
                  >
                    <ShieldCheck size={14} color={COLORS.primary} />
                    <Text style={styles.btnTextReward}>+5 Điểm</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.penaltyBtn]}
                    onPress={() => handlePenalty(item.id, item.name)}
                    activeOpacity={0.8}
                  >
                    <ShieldAlert size={14} color={COLORS.tertiary} />
                    <Text style={styles.btnTextPenalty}>-10 Điểm</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtn, item.isLocked ? styles.unfreezeBtn : styles.freezeBtn]}
                    onPress={() => handleToggleFreeze(item.id, item.name, item.isLocked)}
                    activeOpacity={0.8}
                    disabled={isSelf}
                  >
                    {item.isLocked ? (
                      <UserCheck size={14} color="#0D9488" />
                    ) : (
                      <UserX size={14} color={COLORS.error} />
                    )}
                    <Text style={[styles.btnTextFreeze, item.isLocked && { color: '#0D9488' }]}>
                      {item.isLocked ? 'Mở khóa' : 'Khóa nick'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Card Actions Row 2: Role Management (Admin only) */}
                <View style={styles.roleActionRow}>
                  {isSelf ? (
                    <View style={styles.selfNoticeBox}>
                      <Shield size={14} color={COLORS.outline} />
                      <Text style={styles.selfNoticeText}>Tài khoản hiện tại của bạn</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.roleToggleBtn,
                        isAdmin ? styles.demoteBtn : styles.promoteBtn
                      ]}
                      onPress={() => handleToggleRole(item.id, item.name, item.role)}
                      activeOpacity={0.8}
                    >
                      {isAdmin ? (
                        <>
                          <ShieldAlert size={14} color="#D97706" />
                          <Text style={styles.demoteBtnText}>Thu Hồi Quyền Admin (Hạ về User)</Text>
                        </>
                      ) : (
                        <>
                          <Crown size={14} color={COLORS.primary} />
                          <Text style={styles.promoteBtnText}>Cấp Quyền Quản Trị Viên (Admin)</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    height: 44,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    color: COLORS.text,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  listContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.xs,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    borderRadius: 20,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },
  adminUserCard: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFDF7',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceDim,
  },
  crownBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
    maxWidth: 140,
  },
  adminBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  adminBadgeText: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: '800',
  },
  userBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  userBadgeText: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
  },
  selfBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  selfBadgeText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '700',
  },
  userPhone: {
    fontSize: 11,
    color: COLORS.outline,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  userStats: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 3,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryContainer + '30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceVariant,
    marginVertical: SPACING.sm,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
  },
  rewardBtn: {
    borderColor: COLORS.primary + '50',
    backgroundColor: COLORS.primaryContainer + '15',
  },
  btnTextReward: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  penaltyBtn: {
    borderColor: COLORS.tertiary + '50',
    backgroundColor: COLORS.tertiaryContainer + '15',
  },
  btnTextPenalty: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.tertiary,
  },
  freezeBtn: {
    borderColor: COLORS.error + '50',
    backgroundColor: COLORS.errorContainer + '15',
  },
  unfreezeBtn: {
    borderColor: '#0D948850',
    backgroundColor: '#E0F7F5',
  },
  btnTextFreeze: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.error,
  },
  roleActionRow: {
    marginTop: 8,
  },
  selfNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  selfNoticeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  roleToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
  },
  promoteBtn: {
    borderColor: COLORS.primary + '60',
    backgroundColor: '#FFF5F5',
  },
  promoteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  demoteBtn: {
    borderColor: '#FCD34D',
    backgroundColor: '#FEF3C7',
  },
  demoteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
});

export default ManageUsersScreen;
