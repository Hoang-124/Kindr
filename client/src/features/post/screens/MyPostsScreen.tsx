// src/features/post/screens/MyPostsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { hydrateProducts } from '../../home/store/homeSlice';
import { refreshWalletBalance } from '../../auth/store/authSlice';
import { fetchMyTransactionsAsync } from '../../exchange/store/exchangeSlice';
import * as productService from '../../../services/productService';
import { Product } from '../../../types/common';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { Edit3, Trash2, Plus, Info, ChevronRight, Eye } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'MyPosts'>;

export const MyPostsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const homeProducts = useAppSelector((state) => state.home.products);
  const transactions = useAppSelector((state) => state.exchange.transactions);

  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyPosts = useCallback(async (isPull = false) => {
    if (!currentUser) return;
    if (!isPull) setLoading(true);
    try {
      dispatch(fetchMyTransactionsAsync());
      const data = await productService.getMyProducts();
      setMyProducts(data);
    } catch (e) {
      console.warn('Failed to load my products:', e);
      // Fallback: match by sellerId in home feed
      setMyProducts(homeProducts.filter(p => p.sellerId === currentUser.id));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, dispatch, homeProducts]);

  useEffect(() => {
    loadMyPosts();
  }, [loadMyPosts]);

  useFocusEffect(
    useCallback(() => {
      loadMyPosts(true);
    }, [loadMyPosts])
  );

  if (!currentUser) return null;

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Xóa bài đăng?',
      `Mẹ có chắc chắn muốn xóa bài đăng: "${name}"? Thao tác này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa bài', 
          style: 'destructive',
          onPress: async () => {
            try {
              await productService.deleteProduct(id);
              dispatch(refreshWalletBalance());
              setMyProducts(prev => prev.filter(p => p.id !== id));
              const updated = homeProducts.filter(p => p.id !== id);
              dispatch(hydrateProducts(updated));
              Alert.alert('Thành công', 'Bài viết đã được gỡ bỏ và hoàn trả Safe Fee (nếu có).');
            } catch (e) {
              Alert.alert('Lỗi', 'Không thể xóa bài viết vào lúc này.');
            }
          }
        }
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return { label: 'Chờ admin duyệt', bg: '#FFF8E1', text: '#D97706' };
      case 'available':
        return { label: 'Đang hiển thị', bg: COLORS.primaryContainer + '40', text: COLORS.primary };
      case 'escrow':
        return { label: 'Tạm khóa (Đang đổi đồ)', bg: '#FEF3C7', text: '#D97706' };
      case 'completed':
        return { label: 'Đã hoàn tất đổi', bg: '#DCFCE7', text: '#15803D' };
      case 'disputed':
        return { label: 'Tranh chấp', bg: COLORS.errorContainer, text: COLORS.error };
      default:
        return { label: 'Không xác định', bg: COLORS.outlineVariant, text: COLORS.outline };
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Bài Đăng Của Mẹ" showBack />
      
      {loading && myProducts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.outline, fontSize: 13 }}>Đang tải bài đăng của mẹ...</Text>
        </View>
      ) : (
        <FlatList
          data={myProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadMyPosts(true);
              }}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Info size={40} color={COLORS.outline} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>Mẹ chưa đăng thanh lý hay tặng món đồ nào.</Text>
              <TouchableOpacity 
                style={styles.emptyBtn}
                onPress={() => {
                  navigation.navigate('Main');
                }}
              >
                <Plus size={16} color="#ffffff" />
                <Text style={styles.emptyBtnText}>Đăng đồ ngay</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            const isEditable = item.status === 'available';
            const relatedTx = transactions.find(t => t.productId === item.id);

            return (
              <TouchableOpacity 
                style={styles.itemCard}
                activeOpacity={relatedTx || item.status === 'available' ? 0.8 : 1}
                onPress={() => {
                  if (relatedTx) {
                    navigation.navigate('TransactionDetail', { id: relatedTx.id });
                  } else if (item.status === 'available') {
                    navigation.navigate('ProductDetail', { id: item.id });
                  }
                }}
              >
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Giá đổi:</Text>
                    <Text style={styles.priceValue}>{item.price === 0 ? 'Tặng 0 Xu' : `${item.price} Xu`}</Text>
                  </View>
                  
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.itemActions}>
                  {isEditable ? (
                    <>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.editBtn]}
                        onPress={() => navigation.navigate('EditPost', { postId: item.id })}
                        activeOpacity={0.8}
                      >
                        <Edit3 size={16} color={COLORS.primary} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.deleteBtn]}
                        onPress={() => handleDelete(item.id, item.name)}
                        activeOpacity={0.8}
                      >
                        <Trash2 size={16} color={COLORS.error} />
                      </TouchableOpacity>
                    </>
                  ) : relatedTx ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.viewTxBtn, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}
                      onPress={() => {
                        navigation.navigate('TransactionDetail', { id: relatedTx.id });
                      }}
                      activeOpacity={0.8}
                    >
                      <Eye size={18} color="#D97706" />
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.actionBtn, styles.viewTxBtn]}>
                      <ChevronRight size={18} color={COLORS.outline} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
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
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.outline,
    textAlign: 'center',
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  emptyBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    ...SHADOWS.soft,
  },
  emptyBtnText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '700',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    borderRadius: 20,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  itemImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainer,
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 10,
    color: COLORS.outline,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.tertiary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  itemActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  editBtn: {
    borderColor: COLORS.primary + '50',
    backgroundColor: COLORS.primaryContainer + '15',
  },
  deleteBtn: {
    borderColor: COLORS.error + '50',
    backgroundColor: COLORS.errorContainer + '15',
  },
  viewTxBtn: {
    borderWidth: 0,
  },
});

export default MyPostsScreen;
