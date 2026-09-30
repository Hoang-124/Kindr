// src/features/home/screens/HomeScreen.tsx
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, MainTabParamList } from '../../../app/navigation/navigationTypes';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { setSelectedCategory, resetFilters, resetProducts, fetchProducts } from '../store/homeSlice';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Card from '../../../components/layout/Card';
import EmptyState from '../../../components/common/EmptyState';
import {
  Search,
  PlusCircle,
  Plus,
  Sparkles,
  MapPin,
  ToyBrick,
  BookOpen,
  GraduationCap,
  Shirt,
  Baby,
  Gift,
  Package,
  ChevronRight
} from 'lucide-react-native';
import MascotIcon from '../../../components/common/MascotIcon';

import { ScalePressable } from '../../../components/common/ScalePressable';
import { PulseBadge } from '../../../components/common/PulseBadge';
import { FadeInItem } from '../../../components/common/FadeInItem';
import { DEFAULT_IMAGES } from '../../../utils/constants';
import KindrCoin from '../../../components/common/KindrCoin';
import Avatar from '../../../components/common/Avatar';
import { fetchMyTransactionsAsync } from '../../exchange/store/exchangeSlice';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;
type TabNavigationProp = NativeStackNavigationProp<MainTabParamList>;

// Categories metadata with harmonious Kindr palette
const categoriesMetadata = [
  { id: 'do_choi', name: 'Đồ chơi', icon: ToyBrick, bg: '#FFE8E8', text: '#FF6B6B' },
  { id: 'sach_truyen', name: 'Sách truyện', icon: BookOpen, bg: '#E0F7F5', text: '#26A69A' },
  { id: 'do_hoc_tap', name: 'Đồ học tập', icon: GraduationCap, bg: '#E8EDFB', text: '#4361EE' },
  { id: 'quan_ao', name: 'Quần áo bé', icon: Shirt, bg: '#FFF3D6', text: '#D97706' },
  { id: 'xe_noi', name: 'Xe & Nôi cũi', icon: Baby, bg: '#E5F8ED', text: '#2EC4B6' },
  { id: 'tu_thien', name: 'Trạm Tặng Đồ', icon: Gift, bg: '#FFEBF0', text: '#E63946' },
];

export const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const tabNavigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const products = useAppSelector((state) => state.home.products);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const transactions = useAppSelector((state) => state.exchange.transactions);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchMyTransactionsAsync());
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchProducts());
      dispatch(fetchMyTransactionsAsync());
    }, [dispatch])
  );

  // Active exchange transactions needing action
  const pendingExchangeTx = transactions.filter(
    tx => (tx.buyerId === currentUser?.id || tx.sellerId === currentUser?.id) &&
      (tx.status === 'awaiting_handover' || tx.status === 'in_safeful_time' || tx.status === 'disputed')
  );

  // Filter all available products for the feed
  const feedProducts = products.filter(
    p => p.status === 'available'
  );

  const handleCategoryPress = (catId: string) => {
    dispatch(resetFilters());
    if (catId === 'tu_thien') {
      dispatch(setSelectedCategory('tu_thien'));
    } else {
      dispatch(setSelectedCategory(catId));
    }
    tabNavigation.navigate('Search');
  };

  const handleProductPress = (id: string) => {
    try {
      navigation.navigate('ProductDetail', { id });
    } catch {
      tabNavigation.getParent()?.navigate('ProductDetail', { id });
    }
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Search Trigger with Tactile Feedback */}
      <ScalePressable
        style={styles.searchBar}
        scaleTo={0.98}
        onPress={() => tabNavigation.navigate('Search')}
      >
        <Search size={20} color={COLORS.outline} style={styles.searchIcon} />
        <Text style={styles.searchText}>Mẹ muốn tìm món gì cho bé?</Text>
      </ScalePressable>

      {/* Step 4 MVP Demo Guide Banner */}
      {currentUser?.email === 'demo@kindr.vn' && (
        <View style={styles.demoGuideBanner}>
          <View style={styles.demoGuideHeader}>
            <View style={styles.demoGuideBadge}>
              <Sparkles size={12} color="#FFFFFF" />
              <Text style={styles.demoGuideBadgeText}>TRẢI NGHIỆM MVP (DEMO)</Text>
            </View>
            <View style={styles.demoCoinPill}>
              <Text style={styles.demoCoinPillText}>🪙 100 Xu trong ví</Text>
            </View>
          </View>
          <Text style={styles.demoGuideTitle}>Chào mừng Mẹ Trải Nghiệm! 👋</Text>
          <Text style={styles.demoGuideDesc}>
            Mẹ đã vào chế độ trải nghiệm 1-click. Mẹ có thể nhấn vào bất kỳ món đồ nào bên dưới để thử nghiệm luồng ký quỹ và đổi đồ P2P thực tế:
          </Text>
          <View style={styles.demoStepsRow}>
            <View style={styles.demoStepChip}>
              <Text style={styles.demoStepNum}>1</Text>
              <Text style={styles.demoStepText}>Chọn đồ cần đổi</Text>
            </View>
            <View style={styles.demoStepChip}>
              <Text style={styles.demoStepNum}>2</Text>
              <Text style={styles.demoStepText}>Ký quỹ an toàn</Text>
            </View>
            <View style={styles.demoStepChip}>
              <Text style={styles.demoStepNum}>3</Text>
              <Text style={styles.demoStepText}>6h kiểm định tại nhà</Text>
            </View>
          </View>
        </View>
      )}

      {/* Declutter Banner with Synchronized Mascot Card */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerLeft}>
          <View style={styles.bannerTag}>
            <Sparkles size={11} color={COLORS.primary} />
            <Text style={styles.bannerTagText}>GÓC CHIA SẺ MẸ BỈM</Text>
          </View>

          <Text style={styles.bannerTitle}>
            Hôm nay dọn nhà cho bé đỡ chật nhé mẹ ơi!
          </Text>

          <Text style={styles.bannerSubtitle}>
            Đổi đồ chơi cũ lấy Xu, thêm niềm vui cho con
          </Text>

          <ScalePressable
            style={styles.bannerBtn}
            scaleTo={0.95}
            onPress={() => tabNavigation.navigate('Post')}
          >
            <Plus size={15} color="#FFFFFF" strokeWidth={2.6} />
            <Text style={styles.bannerBtnText}>Đăng đồ ngay</Text>
          </ScalePressable>
        </View>

        <View style={styles.bannerRight}>
          <PulseBadge scaleMin={0.98} scaleMax={1.02} duration={2400}>
            <View style={styles.mascotBadgeWrapper}>
              <MascotIcon size={76} mood="happy" />
            </View>
          </PulseBadge>
        </View>
      </View>

      {/* Active Ongoing Exchange Alert Banner */}
      {pendingExchangeTx.length > 0 && (
        <View style={styles.activeExchangeContainer}>
          <View style={styles.activeExchangeHeader}>
            <View style={styles.activeExchangeBadge}>
              <Package size={13} color="#D97706" />
              <Text style={styles.activeExchangeBadgeText}>GIAO DỊCH CẦN XỬ LÝ ({pendingExchangeTx.length})</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('TransactionDetail', { id: pendingExchangeTx[0].id })}>
              <Text style={styles.viewDetailLink}>Xem chi tiết</Text>
            </TouchableOpacity>
          </View>
          {pendingExchangeTx.slice(0, 2).map((tx) => {
            const isSeller = tx.sellerId === currentUser?.id;
            return (
              <ScalePressable
                key={tx.id}
                style={styles.activeExchangeCard}
                scaleTo={0.97}
                onPress={() => navigation.navigate('TransactionDetail', { id: tx.id })}
              >
                <Image source={{ uri: tx.productImage || DEFAULT_IMAGES.PRODUCT_FALLBACK }} style={styles.activeExchangeImage} />
                <View style={styles.activeExchangeBody}>
                  <Text style={styles.activeExchangeTitle} numberOfLines={1}>
                    {isSeller ? `Có mẹ đổi món: ${tx.productName}` : `Mẹ đang đổi món: ${tx.productName}`}
                  </Text>
                  <Text style={styles.activeExchangeSub} numberOfLines={1}>
                    {tx.status === 'awaiting_handover' 
                      ? (isSeller ? `Mã nhận: ${tx.handoverCode || 'Chờ mã'} • Hẹn gặp giao đồ` : `Mã của bạn: ${tx.handoverCode || 'Chờ mã'}`) 
                      : 'Đang trong 6 Giờ Kiểm Định Tại Nhà'}
                  </Text>
                </View>
                <ChevronRight size={18} color={COLORS.primary} />
              </ScalePressable>
            );
          })}
        </View>
      )}

      {/* Grid Categories (Bento style with Tactile Physics) */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Danh mục nổi bật</Text>
        <View style={styles.categoriesGrid}>
          {categoriesMetadata.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <FadeInItem key={cat.id} index={idx} delay={40} style={styles.categoryCardWrapper}>
                <ScalePressable
                  style={styles.categoryCard}
                  scaleTo={0.92}
                  onPress={() => handleCategoryPress(cat.id)}
                >
                  <View style={[styles.categoryIconCircle, { backgroundColor: cat.bg }]}>
                    <Icon size={24} color={cat.text} />
                  </View>
                  <Text style={styles.categoryLabel}>{cat.name}</Text>
                </ScalePressable>
              </FadeInItem>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Gần mẹ hôm nay</Text>
    </View>
  );

  return (
    <ScreenContainer scrollable={false}>
      {/* Top Header Profile Summary */}
      <Header showProfileSummary />

      <FlatList
        data={feedProducts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.feedContainer}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshing={false}
        onRefresh={() => dispatch(fetchProducts())}
        ListEmptyComponent={
          <EmptyState
            title="Chưa có món đồ nào quanh khu vực của mẹ"
            description="Hãy là người đầu tiên chia sẻ đồ chơi hoặc đồ dùng cho bé để nhận Xu thưởng nhé!"
            actionTitle="Đăng đồ ngay"
            onActionPress={() => tabNavigation.navigate('Post')}
          />
        }
        renderItem={({ item, index }) => {
          const isOwn = item.sellerId === currentUser?.id;
          return (
            <FadeInItem index={index} delay={45} style={styles.itemCardWrapper}>
              <ScalePressable
                style={styles.itemCard}
                scaleTo={0.95}
                onPress={() => handleProductPress(item.id)}
              >
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: item.image || DEFAULT_IMAGES.PRODUCT_FALLBACK }} 
                    style={styles.itemImage} 
                  />
                  {isOwn ? (
                    <View style={styles.ownPostBadge}>
                      <Text style={styles.ownPostBadgeText}>Tin của bạn</Text>
                    </View>
                  ) : (
                    <View style={styles.distanceBadge}>
                      <MapPin size={10} color={COLORS.primary} />
                      <Text style={styles.distanceText}>{item.distance || '1 km'} • {item.locationName.split(',')[0]}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <View style={styles.priceRow}>
                    <View style={styles.sellerRow}>
                      <Avatar 
                        uri={item.sellerAvatar} 
                        name={item.sellerName} 
                        size={18} 
                      />
                      <Text style={styles.sellerName} numberOfLines={1}>
                        {isOwn ? 'Bạn' : item.sellerName}
                      </Text>
                    </View>
                    <View style={styles.priceBadge}>
                      <KindrCoin size={13} />
                      <Text style={styles.priceText}>{item.price} Xu</Text>
                    </View>
                  </View>
                </View>
              </ScalePressable>
            </FadeInItem>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  feedContainer: {
    paddingBottom: 100, // Bottom margin to avoid overlap with bottom navigation bar
  },
  headerSection: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
  },
  searchBar: {
    height: 48,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.07)',
    ...SHADOWS.soft,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchText: {
    fontSize: 14,
    color: COLORS.outline,
    fontWeight: '500',
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.16)',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.card,
  },
  bannerLeft: {
    flex: 1,
    paddingRight: SPACING.sm,
    justifyContent: 'center',
  },
  bannerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FFE8E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 6,
  },
  bannerTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 21,
    letterSpacing: -0.2,
  },
  bannerSubtitle: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginTop: 2,
    marginBottom: 12,
  },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    height: 38,
    borderRadius: RADIUS.full,
    ...SHADOWS.btn,
  },
  bannerBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  bannerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: SPACING.sm,
    paddingRight: SPACING.xs,
  },
  mascotBadgeWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#78C2AD',
    shadowColor: 'rgba(120, 194, 173, 0.35)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  categoriesSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.onBackground,
    marginBottom: SPACING.md,
    fontWeight: '700',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: SPACING.md,
  },
  categoryCardWrapper: {
    width: '31%',
  },
  categoryCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  categoryIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    ...SHADOWS.soft,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurface,
    textAlign: 'center',
  },
  row: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.containerPadding,
  },
  itemCardWrapper: {
    width: '48%',
    marginBottom: SPACING.cardGap,
  },
  itemCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.default,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: COLORS.surfaceContainer,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  distanceBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  ownPostBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ownPostBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  itemDetails: {
    padding: SPACING.sm,
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.onSurface,
    lineHeight: 18,
    marginBottom: 6,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginRight: SPACING.xs,
  },
  sellerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceDim,
  },
  sellerName: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    flex: 1,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.4)',
  },
  priceCoin: {
    fontSize: 11,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C6500',
  },
  activeExchangeContainer: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  activeExchangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  activeExchangeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  activeExchangeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  viewDetailLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  activeExchangeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  activeExchangeImage: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceVariant,
  },
  activeExchangeBody: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  activeExchangeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  activeExchangeSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#D97706',
    marginTop: 2,
  },
  demoGuideBanner: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  demoGuideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  demoGuideBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EA580C',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  demoGuideBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  demoCoinPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  demoCoinPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  demoGuideTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#9A3412',
    marginBottom: 4,
  },
  demoGuideDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#7C2D12',
    marginBottom: 10,
  },
  demoStepsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  demoStepChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FFEDD5',
    gap: 4,
  },
  demoStepNum: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EA580C',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 16,
  },
  demoStepText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#431407',
    flexShrink: 1,
  },
});
export default HomeScreen;
