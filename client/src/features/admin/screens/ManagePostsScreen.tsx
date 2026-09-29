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
import { hydrateProducts } from '../../home/store/homeSlice';
import { api } from '../../../services/api';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { Check, X, ShieldAlert, AlertTriangle, MapPin, ChevronRight, Eye } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';

import { DEFAULT_IMAGES } from '../../../utils/constants';

const KINDR_LOGO = require('../../../../assets/images/kindr-logo.png');

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const ManagePostsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.home.products);
  const [apiPosts, setApiPosts] = useState<any[] | null>(null);

  const [statusFilter, setStatusFilter] = useState<'pending' | 'available' | 'all'>('pending');

  const fetchAdminProducts = () => {
    api.get('/admin/products')
      .then(res => {
        const list = res.data.products || res.data;
        if (Array.isArray(list)) {
          const mapped = list.map((p: any) => ({
            id: p.id || p._id,
            name: p.name,
            price: p.price,
            condition: p.condition,
            conditionLabel: p.conditionLabel || `${p.condition}%`,
            category: p.category,
            image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400',
            description: p.description,
            sellerId: p.sellerId?._id || p.sellerId?.id || p.sellerId,
            sellerName: p.sellerName || p.sellerId?.name || 'Thành viên Kindr',
            sellerAvatar: p.sellerAvatar || p.sellerId?.avatar || '',
            locationName: p.locationName || 'Đà Nẵng',
            timeAgo: 'Vừa xong',
            status: p.status || 'available',
          }));
          setApiPosts(mapped);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchAdminProducts();
  }, []);

  const allItems = apiPosts !== null ? apiPosts : products;
  const pendingCount = allItems.filter(p => p.status === 'pending_approval').length;
  const availableCount = allItems.filter(p => p.status === 'available').length;

  // Auto-switch to 'all' if no pending items exist to avoid blank initial screen
  useEffect(() => {
    if (pendingCount === 0 && availableCount > 0 && statusFilter === 'pending') {
      setStatusFilter('all');
    }
  }, [pendingCount, availableCount]);

  const displayProducts = allItems.filter(p => {
    if (statusFilter === 'pending') return p.status === 'pending_approval';
    if (statusFilter === 'available') return p.status === 'available';
    return p.status !== 'removed';
  });

  const handleViewDetail = (productId: string) => {
    try {
      navigation.navigate('ProductDetail', { id: productId });
    } catch {
      (navigation as any).getParent()?.navigate('ProductDetail', { id: productId });
    }
  };

  const handleApprove = async (productId: string, name: string) => {
    Alert.alert('Duyệt tin đăng', `Xác nhận duyệt tin đăng "${name}" hiển thị trên trang chủ?`, [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Duyệt bài', 
        onPress: async () => {
          try {
            await api.put(`/admin/products/${productId}/approve`);
            setApiPosts(prev => prev ? prev.map(p => p.id === productId ? { ...p, status: 'available' } : p) : null);
            Alert.alert('Thành công', 'Tin đăng đã được duyệt hoạt động trên sàn.');
          } catch (e: any) {
            Alert.alert('Lỗi', e?.response?.data?.error || 'Không thể duyệt tin đăng.');
          }
        }
      }
    ]);
  };

  const handleRemove = async (productId: string, name: string) => {
    Alert.alert(
      'Gỡ tin đăng?',
      `Mẹ có chắc chắn muốn gỡ bỏ tin đăng: "${name}" khỏi hệ thống do vi phạm chính sách?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Gỡ tin', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/products/${productId}`);
              setApiPosts(prev => prev ? prev.filter(p => p.id !== productId) : null);
            } catch (e) {}
            const updated = products.filter(p => p.id !== productId);
            dispatch(hydrateProducts(updated));
            Alert.alert('Thành công', 'Tin đăng đã được gỡ bỏ.');
          }
        }
      ]
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Quản Lý Tin Đăng" showBack />

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, statusFilter === 'pending' && styles.tabItemActive]}
          onPress={() => setStatusFilter('pending')}
        >
          <Text style={[styles.tabItemText, statusFilter === 'pending' && styles.tabItemTextActive]}>
            Chờ duyệt
          </Text>
          {pendingCount > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{pendingCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, statusFilter === 'available' && styles.tabItemActive]}
          onPress={() => setStatusFilter('available')}
        >
          <Text style={[styles.tabItemText, statusFilter === 'available' && styles.tabItemTextActive]}>
            Đang hiển thị ({availableCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, statusFilter === 'all' && styles.tabItemActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[styles.tabItemText, statusFilter === 'all' && styles.tabItemTextActive]}>
            Tất cả ({allItems.length})
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={displayProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertTriangle size={48} color={COLORS.outline} />
            <Text style={styles.emptyText}>
              {statusFilter === 'pending' 
                ? 'Không có tin đăng nào đang chờ duyệt.' 
                : 'Không có tin đăng nào trong hệ thống.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isPending = item.status === 'pending_approval';

          return (
            <View style={styles.postCard}>
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => handleViewDetail(item.id)}
              >
                <View style={styles.cardHeader}>
                  {item.sellerAvatar ? (
                    <Image source={{ uri: item.sellerAvatar }} style={styles.sellerAvatar} />
                  ) : (
                    <Image source={KINDR_LOGO} style={styles.sellerAvatar} resizeMode="contain" />
                  )}
                  <View style={styles.sellerInfo}>
                    <Text style={styles.sellerName}>{item.sellerName}</Text>
                    <Text style={styles.timeAgo}>{item.timeAgo}</Text>
                  </View>

                  <View style={styles.headerRight}>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceText}>{item.price === 0 ? 'Tặng 0 Xu' : `${item.price} Xu`}</Text>
                    </View>
                    <View style={[styles.statusTag, isPending ? styles.statusTagPending : styles.statusTagAvailable]}>
                      <Text style={[styles.statusTagText, isPending ? styles.statusTagTextPending : styles.statusTagTextAvailable]}>
                        {isPending ? 'Chờ duyệt' : 'Đang hiển thị'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Image source={{ uri: item.image || DEFAULT_IMAGES.PRODUCT_FALLBACK }} style={styles.postImg} />
                  <View style={styles.postDetails}>
                    <Text style={styles.postTitle} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.postDesc} numberOfLines={2}>{item.description}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}>
                      <MapPin size={11} color={COLORS.outline} />
                      <Text style={styles.postLocation}>{item.locationName}</Text>
                    </View>
                    <View style={styles.viewDetailHintRow}>
                      <Eye size={12} color={COLORS.primary} />
                      <Text style={styles.viewDetailHintText}>Xem chi tiết bài đăng →</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <View style={styles.cardActions}>
                {isPending ? (
                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleApprove(item.id, item.name)}
                    activeOpacity={0.8}
                  >
                    <Check size={15} color="#ffffff" />
                    <Text style={styles.btnTextApprove}>Duyệt bài đăng</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.approvedIndicator}>
                    <Check size={14} color="#10b981" strokeWidth={2.5} />
                    <Text style={styles.approvedText}>Đã duyệt hoạt động</Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleRemove(item.id, item.name)}
                  activeOpacity={0.8}
                >
                  <X size={14} color={COLORS.error} />
                  <Text style={styles.btnTextReject}>{isPending ? 'Từ chối' : 'Gỡ vi phạm'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.containerPadding,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceDim,
  },
  tabItemActive: {
    backgroundColor: COLORS.primary,
  },
  tabItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badgeCount: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.outline,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  postCard: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sellerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceDim,
  },
  sellerInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  sellerName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  timeAgo: {
    fontSize: 10,
    color: COLORS.outline,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priceBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  statusTagPending: {
    backgroundColor: '#FEF3C7',
  },
  statusTagAvailable: {
    backgroundColor: '#ECFDF5',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTagTextPending: {
    color: '#D97706',
  },
  statusTagTextAvailable: {
    color: '#059669',
  },
  cardBody: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginVertical: SPACING.xs,
  },
  postImg: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceContainer,
  },
  postDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  postTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  postDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  postLocation: {
    fontSize: 11,
    color: COLORS.outline,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: SPACING.sm,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  btnTextApprove: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
  },
  btnTextReject: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: '600',
  },
  approvedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  approvedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  viewDetailHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 4,
  },
  viewDetailHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
});

export default ManagePostsScreen;
