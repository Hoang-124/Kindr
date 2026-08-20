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
import { adjustCivilizationPoints } from '../../auth/store/authSlice';
import { api } from '../../../services/api';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { ShieldCheck, ShieldAlert, Award, Star, UserX } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';

export const ManageUsersScreen = () => {
  const dispatch = useAppDispatch();
  const allUsers = useAppSelector((state) => state.auth.allUsers);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    api.get('/admin/users')
      .then(res => {
        const list = res.data.users || res.data;
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((u: any) => ({
            id: u.id || u._id,
            name: u.name,
            phone: u.phone,
            avatar: u.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            tradesCount: u.successfulTrades || 0,
            ratingAverage: u.reputationScore || 5.0,
            civilizationPoints: u.civilizationPoints || 100,
            isLocked: u.isLocked || false,
          }));
          setUsers(mapped);
        } else {
          setUsers(allUsers);
        }
      })
      .catch(() => {
        setUsers(allUsers);
      });
  }, [allUsers]);

  const handleReward = async (userId: string, name: string) => {
    Alert.alert(
      'Cộng Điểm Uy Tín 🌟',
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
            Alert.alert('Thành công', `Đã cộng +5 điểm uy tín cho mẹ ${name}.`);
          }
        }
      ]
    );
  };

  const handlePenalty = async (userId: string, name: string) => {
    Alert.alert(
      'Trừ Điểm Uy Tín ⚠️',
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
            Alert.alert('Thành công', `Đã phạt -10 điểm uy tín mẹ ${name}.`);
          }
        }
      ]
    );
  };

  const handleToggleFreeze = async (userId: string, name: string) => {
    Alert.alert(
      'Khóa tài khoản 🔒',
      `Mẹ có chắc chắn muốn thay đổi trạng thái hoạt động tài khoản: ${name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đồng ý', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.put(`/admin/users/${userId}/lock`);
              setUsers(prev => prev.map(u => u.id === userId ? { ...u, isLocked: !u.isLocked } : u));
            } catch (e) {}
            Alert.alert('Thành công', `Đã cập nhật trạng thái tài khoản ${name}.`);
          } 
        }
      ]
    );
  };

  const displayList = users.length > 0 ? users : allUsers;

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Quản Lý Thành Viên" showBack />
      
      <FlatList
        data={displayList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.cardTop}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userPhone}>SĐT: {item.phone}</Text>
                <Text style={styles.userStats}>
                  Giao dịch: {item.tradesCount} • Đánh giá: {item.ratingAverage} ⭐
                </Text>
              </View>
              
              <View style={styles.pointsBadge}>
                <Award size={16} color={COLORS.primary} />
                <Text style={styles.pointsText}>{item.civilizationPoints}</Text>
              </View>
            </View>

            <View style={styles.divider} />

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
                style={[styles.actionBtn, styles.freezeBtn]}
                onPress={() => handleToggleFreeze(item.id, item.name)}
                activeOpacity={0.8}
              >
                <UserX size={14} color={COLORS.error} />
                <Text style={styles.btnTextFreeze}>{item.isLocked ? 'Mở khóa' : 'Khóa nick'}</Text>
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
  userCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    borderRadius: 20,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.surfaceDim,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  userPhone: {
    fontSize: 11,
    color: COLORS.outline,
    marginTop: 2,
  },
  userStats: {
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    fontWeight: '600',
    marginTop: 4,
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
    marginVertical: SPACING.md,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
  },
  rewardBtn: {
    borderColor: COLORS.primary + '50',
    backgroundColor: COLORS.primaryContainer + '10',
  },
  btnTextReward: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  penaltyBtn: {
    borderColor: COLORS.tertiary + '50',
    backgroundColor: COLORS.tertiaryContainer + '10',
  },
  btnTextPenalty: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.tertiary,
  },
  freezeBtn: {
    borderColor: COLORS.error + '50',
    backgroundColor: COLORS.errorContainer + '10',
  },
  btnTextFreeze: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.error,
  },
});

export default ManageUsersScreen;
