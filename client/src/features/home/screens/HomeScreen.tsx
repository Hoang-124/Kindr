// src/features/home/screens/HomeScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, MainTabParamList } from '../../../app/navigation/navigationTypes';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { setSelectedCategory, resetFilters, resetProducts, fetchProducts } from '../store/homeSlice';
import { useEffect } from 'react';
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
  Gift
} from 'lucide-react-native';
import MascotIcon from '../../../components/common/MascotIcon';

import { ScalePressable } from '../../../components/common/ScalePressable';
import { PulseBadge } from '../../../components/common/PulseBadge';
import { FadeInItem } from '../../../components/common/FadeInItem';
import KindrCoin from '../../../components/common/KindrCoin';

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

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Filter available products, excluding items listed by the current user
  const feedProducts = products.filter(
    p => p.status === 'available' && p.sellerId !== currentUser?.id
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
          <PulseBadge scaleMin={0.97} scaleMax={1.04} duration={2400}>
            <View style={styles.mascotBadgeWrapper}>
              <MascotIcon size={76} mood="happy" />
            </View>
          </PulseBadge>
        </View>
      </View>

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
        renderItem={({ item, index }) => (
          <FadeInItem index={index} delay={45} style={styles.itemCardWrapper}>
            <ScalePressable
              style={styles.itemCard}
              scaleTo={0.95}
              onPress={() => handleProductPress(item.id)}
            >
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.itemImage} />
                <View style={styles.distanceBadge}>
                  <MapPin size={10} color={COLORS.primary} />
                  <Text style={styles.distanceText}>{item.distance || '1 km'} • {item.locationName.split(',')[0]}</Text>
                </View>
              </View>

              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.priceRow}>
                  <View style={styles.sellerRow}>
                    <Image source={{ uri: item.sellerAvatar }} style={styles.sellerAvatar} />
                    <Text style={styles.sellerName} numberOfLines={1}>{item.sellerName}</Text>
                  </View>
                  <View style={styles.priceBadge}>
                    <KindrCoin size={13} />
                    <Text style={styles.priceText}>{item.price} Xu</Text>
                  </View>
                </View>
              </View>
            </ScalePressable>
          </FadeInItem>
        )}
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.18)',
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.card,
  },
  bannerLeft: {
    flex: 1,
    paddingRight: SPACING.sm,
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
    paddingLeft: 4,
  },
  mascotBadgeWrapper: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  bannerMascot: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
});
export default HomeScreen;
