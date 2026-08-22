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
  MapPin, 
  ToyBrick, 
  BookOpen, 
  GraduationCap, 
  Shirt, 
  Baby, 
  Gift 
} from 'lucide-react-native';
import { DEFAULT_IMAGES } from '../../../utils/constants';

import { ScalePressable } from '../../../components/common/ScalePressable';
import { PulseBadge } from '../../../components/common/PulseBadge';
import { FadeInItem } from '../../../components/common/FadeInItem';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;
type TabNavigationProp = NativeStackNavigationProp<MainTabParamList>;

// Categories metadata
const categoriesMetadata = [
  { id: 'do_choi', name: 'Đồ chơi', icon: ToyBrick, bg: '#FDE2E4', text: '#5E3032' },
  { id: 'sach_truyen', name: 'Sách truyện', icon: BookOpen, bg: '#E2ECE9', text: '#2A4D43' },
  { id: 'do_hoc_tap', name: 'Đồ học tập', icon: GraduationCap, bg: '#DFE7FD', text: '#24345F' },
  { id: 'quan_ao', name: 'Quần áo bé', icon: Shirt, bg: '#F5E6D6', text: '#684521' },
  { id: 'xe_noi', name: 'Xe & Nôi cũi', icon: Baby, bg: '#E2F0CB', text: '#4B5C35' },
  { id: 'tu_thien', name: 'Trạm Tặng Đồ', icon: Gift, bg: '#FFE5EC', text: '#7B2C3F' },
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

      {/* Declutter Banner with Mascot animation */}
      <Card style={styles.banner} contentStyle={styles.bannerContent}>
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerText}>
            Hôm nay dọn nhà cho bé đỡ chật nhé mẹ ơi!
          </Text>
          <ScalePressable 
            style={styles.bannerBtn}
            scaleTo={0.94}
            onPress={() => tabNavigation.navigate('Post')}
          >
            <PlusCircle size={16} color={COLORS.onPrimary} />
            <Text style={styles.bannerBtnText}>Đăng đồ ngay</Text>
          </ScalePressable>
        </View>
        <PulseBadge scaleMin={0.96} scaleMax={1.06} duration={2400}>
          <Image 
            source={{ uri: DEFAULT_IMAGES.MASCOT }} 
            style={styles.bannerImage} 
            resizeMode="contain"
          />
        </PulseBadge>
      </Card>

      {/* Grid Categories (Bento style with Tactile Physics) */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Danh mục nổi bật</Text>
        <View style={styles.categoriesGrid}>
          {categoriesMetadata.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <FadeInItem key={cat.id} index={idx} delay={40} style={{ width: '31%' }}>
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

      {/* Sổ Tay Mẹ Bỉm Feature Card with Pulse Badge */}
      <ScalePressable 
        style={styles.careHandbookCard}
        scaleTo={0.97}
        onPress={() => navigation.navigate('CareHandbook')}
      >
        <View style={styles.careHandbookLeft}>
          <View style={styles.careHandbookIconBg}>
            <Baby size={22} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.careHandbookTitle}>Sổ Tay Tiêm Chủng & Chuẩn WHO 👶</Text>
            <Text style={styles.careHandbookSubtitle}>Nhắc lịch tiêm theo tháng & theo dõi cân nặng chuẩn</Text>
          </View>
        </View>
        <PulseBadge scaleMin={1.0} scaleMax={1.08} duration={1800}>
          <View style={styles.careHandbookBadge}>
            <Text style={styles.careHandbookBadgeText}>Khám phá ✨</Text>
          </View>
        </PulseBadge>
      </ScalePressable>

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
                  <MapPin size={10} color={COLORS.outline} />
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
                    <Text style={styles.priceTextSymbol}>X</Text>
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
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchText: {
    fontSize: 14,
    color: COLORS.outline,
    fontWeight: '500',
  },
  banner: {
    backgroundColor: COLORS.primaryContainer,
    marginBottom: SPACING.lg,
    borderWidth: 0,
    elevation: 0,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  bannerTextContainer: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  bannerText: {
    ...TYPOGRAPHY.labelLg,
    color: COLORS.onPrimaryContainer,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  bannerBtn: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    ...SHADOWS.soft,
  },
  bannerBtnText: {
    color: COLORS.onPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  bannerImage: {
    width: 90,
    height: 90,
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
  categoryCard: {
    width: '30%',
    alignItems: 'center',
  },
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    ...SHADOWS.soft,
  },
  categoryLabel: {
    fontSize: 11,
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
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.default,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    overflow: 'hidden',
    ...SHADOWS.soft,
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  itemDetails: {
    padding: SPACING.sm,
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  itemName: {
    ...TYPOGRAPHY.labelSm,
    color: COLORS.onSurface,
    lineHeight: 16,
    marginBottom: SPACING.xs,
    minHeight: 32,
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
    gap: 4,
    flex: 1,
    marginRight: SPACING.xs,
  },
  sellerAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.surfaceDim,
  },
  sellerName: {
    fontSize: 9,
    color: COLORS.outline,
    fontWeight: '500',
    flex: 1,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  priceTextSymbol: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.tertiary,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.tertiary,
  },
  careHandbookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF9',
    borderColor: 'rgba(58, 103, 88, 0.2)',
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.soft,
  },
  careHandbookLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  careHandbookIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  careHandbookTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  careHandbookSubtitle: {
    fontSize: 11,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  careHandbookBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  careHandbookBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
});
export default HomeScreen;
