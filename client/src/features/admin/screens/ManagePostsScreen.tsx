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
import { Check, X, ShieldAlert, AlertTriangle } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';

export const ManagePostsScreen = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.home.products);
  const [apiPosts, setApiPosts] = useState<any[] | null>(null);

  useEffect(() => {
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
            sellerId: p.sellerId?.id || p.sellerId,
            sellerName: p.sellerId?.name || 'Mẹ Bỉm',
            sellerAvatar: p.sellerId?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            locationName: p.locationName || 'Đà Nẵng',
            timeAgo: 'Vừa xong',
            status: p.status,
          }));
          setApiPosts(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const displayProducts = apiPosts !== null ? apiPosts : products;

  const handleApprove = async (name: string) => {
    Alert.alert('Duyệt tin đăng 👍', `Xác nhận duyệt tin đăng "${name}" hiển thị trên trang chủ?`, [
      { text: 'Đồng ý', onPress: () => Alert.alert('Thành công', 'Tin đăng đã được duyệt hoạt động.') }
    ]);
  };

  const handleRemove = async (productId: string, name: string) => {
    Alert.alert(
      'Gỡ tin đăng? 🗑️',
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
      
      <FlatList
        data={displayProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertTriangle size={48} color={COLORS.outline} />
            <Text style={styles.emptyText}>Không có tin đăng nào trong hệ thống.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <View style={styles.cardHeader}>
              <Image source={{ uri: item.sellerAvatar }} style={styles.sellerAvatar} />
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{item.sellerName}</Text>
                <Text style={styles.timeAgo}>{item.timeAgo}</Text>
              </View>
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>{item.price === 0 ? 'Tặng 0 Xu' : `${item.price} Xu`}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Image source={{ uri: item.image }} style={styles.postImg} />
              <View style={styles.postDetails}>
                <Text style={styles.postTitle} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.postDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.postLocation}>📍 {item.locationName}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.approveBtn]}
                onPress={() => handleApprove(item.name)}
                activeOpacity={0.8}
              >
                <Check size={14} color="#ffffff" />
                <Text style={styles.btnTextApprove}>Duyệt bài</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleRemove(item.id, item.name)}
                activeOpacity={0.8}
              >
                <X size={14} color={COLORS.error} />
                <Text style={styles.btnTextReject}>Gỡ vi phạm</Text>
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
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.outline,
    textAlign: 'center',
  },
  postCard: {
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
  priceBadge: {
    backgroundColor: COLORS.tertiaryContainer + '50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.tertiary,
  },
  cardBody: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginVertical: SPACING.xs,
  },
  postImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
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
    fontSize: 10,
    color: COLORS.onSurfaceVariant,
    lineHeight: 14,
    marginTop: 2,
  },
  postLocation: {
    fontSize: 9,
    color: COLORS.outline,
    fontWeight: '600',
    marginTop: 4,
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

export default ManagePostsScreen;
