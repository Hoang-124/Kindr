// src/features/home/screens/SearchScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  Modal,
  ScrollView,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../../app/navigation/navigationTypes';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { 
  setSearchQuery, 
  setSelectedCategory, 
  setSelectedDistrict, 
  setSelectedCondition, 
  resetFilters 
} from '../store/homeSlice';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { APP_CONFIG } from '../../../config/appConfig';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import EmptyState from '../../../components/common/EmptyState';
import FormSelect from '../../../components/form/FormSelect';
import { Search as SearchIcon, SlidersHorizontal, Heart, MapPin } from 'lucide-react-native';
import { VIETNAM_LOCATIONS } from '../../../utils/locations';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

export const SearchScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();

  // Redux filters state
  const products = useAppSelector((state) => state.home.products);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  
  const searchQuery = useAppSelector((state) => state.home.searchQuery);
  const selectedCategory = useAppSelector((state) => state.home.selectedCategory);
  const selectedDistrict = useAppSelector((state) => state.home.selectedDistrict);
  const selectedCondition = useAppSelector((state) => state.home.selectedCondition);
  const sortOrder = useAppSelector((state) => state.home.sortOrder);

  // Local UI filters
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [localCategory, setLocalCategory] = useState(selectedCategory);
  const [localDistrict, setLocalDistrict] = useState(selectedDistrict);
  const [localCondition, setLocalCondition] = useState(selectedCondition);
  const [localMinXu, setLocalMinXu] = useState('');
  const [localMaxXu, setLocalMaxXu] = useState('');

  // Dropdown options
  const categoryOptions = [
    { value: 'all', label: 'Tất cả danh mục' },
    { value: 'toy_small', label: 'Đồ chơi nhỏ 🧸' },
    { value: 'toy_large', label: 'Đồ chơi lớn 🚲' },
    { value: 'book', label: 'Sách truyện 📚' },
    { value: 'quan_ao', label: 'Quần áo bé 👶' },
    { value: 'xe_noi', label: 'Xe đẩy & Nôi cũi 🚼' },
    { value: 'do_hoc_tap', label: 'Đồ học tập ✏️' },
    { value: 'tu_thien', label: 'Trạm Tặng Đồ 🎁 (0 Xu)' },
  ];

  const districtOptions = [
    { value: 'all', label: 'Tất cả quận/huyện' },
    ...VIETNAM_LOCATIONS.map(d => ({ value: d.id, label: `${d.name} (${d.city})` }))
  ];

  const conditionOptions = [
    { value: 'all', label: 'Tất cả tình trạng' },
    { value: '90', label: 'Mới 90% (Rất mới)' },
    { value: '80', label: 'Mới 80% (Khá mới)' },
    { value: '70', label: 'Mới 70% (Dùng tốt)' },
  ];

  // Apply filters
  const handleApplyFilters = () => {
    dispatch(setSelectedCategory(localCategory));
    dispatch(setSelectedDistrict(localDistrict));
    dispatch(setSelectedCondition(localCondition === 'all' ? null : localCondition));
    setFilterModalVisible(false);
  };

  const handleClearFilters = () => {
    setLocalCategory('all');
    setLocalDistrict('all');
    setLocalCondition(null);
    setLocalMinXu('');
    setLocalMaxXu('');
    dispatch(resetFilters());
    setFilterModalVisible(false);
  };

  // Perform filtering locally
  const filteredProducts = products.filter((product) => {
    // 1. Exclude self
    if (product.sellerId === currentUser?.id) return false;
    
    // 2. Filter available items only
    if (product.status !== 'available') return false;

    // 3. Category Filter
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      if (selectedCategory === 'tu_thien' || selectedCategory === 'charity') {
        if (product.price !== 0 && product.category !== 'charity' && product.category !== 'tu_thien') return false;
      } else if (selectedCategory === 'book' || selectedCategory === 'sach_truyen') {
        if (product.category !== 'book' && product.category !== 'sach_truyen') return false;
      } else if (selectedCategory === 'toy_small' || selectedCategory === 'do_choi') {
        if (product.category !== 'toy_small' && product.category !== 'do_choi') return false;
      } else {
        return false;
      }
    }

    // 4. District Filter
    if (selectedDistrict !== 'all') {
      const dist = VIETNAM_LOCATIONS.find(d => d.id === selectedDistrict);
      if (dist && product.districtId !== selectedDistrict && !product.locationName.toLowerCase().includes(dist.name.toLowerCase())) {
        return false;
      }
    }

    // 5. Condition Filter
    if (selectedCondition) {
      if (product.condition !== selectedCondition) {
        if (selectedCondition === '90' && product.condition !== 'like_new' && product.condition !== 'new') return false;
        if (selectedCondition === '80' && product.condition !== 'good') return false;
        if (selectedCondition === '70' && product.condition !== 'fair') return false;
      }
    }

    // 6. Search Query Filter
    if (searchQuery.trim() !== '') {
      const match = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    product.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }

    // 7. Price Filter (if inputs entered)
    const min = localMinXu ? parseInt(localMinXu) : 0;
    const max = localMaxXu ? parseInt(localMaxXu) : Infinity;
    if (product.price < min || product.price > max) return false;

    return true;
  });

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Tìm kiếm đồ dùng" />

      {/* Search and filter bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <SearchIcon size={20} color={COLORS.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Mẹ tìm kiếm đồ chơi, quần áo bỉm sữa..."
            placeholderTextColor={COLORS.outline}
            value={searchQuery}
            onChangeText={(text) => dispatch(setSearchQuery(text))}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterBtn}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.8}
        >
          <SlidersHorizontal size={20} color={COLORS.onPrimary} />
        </TouchableOpacity>
      </View>

      {/* Filter Info Chips */}
      {(selectedCategory !== 'all' || selectedDistrict !== 'all' || selectedCondition || searchQuery) && (
        <View style={styles.activeFiltersRow}>
          <Text style={styles.resultsLabel}>
            Tìm thấy <Text style={styles.highlightText}>{filteredProducts.length}</Text> món đồ
          </Text>
          <TouchableOpacity onPress={handleClearFilters}>
            <Text style={styles.clearFiltersText}>Xóa lọc</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results Feed */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState 
            title="Mẹ ơi, chưa tìm thấy món đồ này"
            description="Hãy thử đổi bộ lọc khu vực khác, hoặc gõ từ khóa chung chung hơn mẹ nhé!"
            actionTitle="Xóa bộ lọc"
            onActionPress={handleClearFilters}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
            activeOpacity={0.9}
          >
            <Image source={{ uri: item.image }} style={styles.productImage} />
            
            <View style={styles.detailsContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <TouchableOpacity style={styles.heartBtn}>
                  <Heart size={20} color={COLORS.outline} />
                </TouchableOpacity>
              </View>

              <View style={styles.locationRow}>
                <MapPin size={14} color={COLORS.outline} />
                <Text style={styles.locationText}>{item.distance || 'Gần đây'} • {item.locationName}</Text>
              </View>

              <View style={styles.priceRow}>
                <View style={styles.sellerWrapper}>
                  <Image source={{ uri: item.sellerAvatar }} style={styles.sellerAvatar} />
                  <Text style={styles.sellerName}>{item.sellerName}</Text>
                </View>

                <View style={styles.priceBadge}>
                  <Text style={styles.priceSymbol}>X</Text>
                  <Text style={styles.priceText}>{item.price} Xu</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ lọc sản phẩm</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.closeText}>Đóng</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <FormSelect
                label="Danh mục đồ"
                options={categoryOptions}
                selectedValue={localCategory}
                onValueChange={setLocalCategory}
              />

              <FormSelect
                label="Khu vực Quận/Huyện"
                options={districtOptions}
                selectedValue={localDistrict}
                onValueChange={setLocalDistrict}
              />

              <FormSelect
                label="Tình trạng đồ dùng"
                options={conditionOptions}
                selectedValue={localCondition || 'all'}
                onValueChange={(val) => setLocalCondition(val)}
              />

              {/* Price range */}
              <View style={styles.priceFilterContainer}>
                <Text style={styles.priceFilterLabel}>Mức Xu trao đổi</Text>
                <View style={styles.priceInputRow}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Từ Xu"
                    placeholderTextColor={COLORS.outline}
                    keyboardType="numeric"
                    value={localMinXu}
                    onChangeText={setLocalMinXu}
                  />
                  <Text style={styles.priceInputDivider}>-</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Đến Xu"
                    placeholderTextColor={COLORS.outline}
                    keyboardType="numeric"
                    value={localMaxXu}
                    onChangeText={setLocalMaxXu}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.clearBtn}
                onPress={handleClearFilters}
              >
                <Text style={styles.clearBtnText}>Xóa tất cả</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyBtn}
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyBtnText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  searchBox: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.default,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: COLORS.onSurface,
    fontSize: 14,
  },
  filterBtn: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.default,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.containerPadding,
    marginBottom: SPACING.sm,
  },
  resultsLabel: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  highlightText: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  clearFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.tertiary,
  },
  listContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: 110,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.default,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.soft,
    gap: SPACING.md,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceContainer,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
    flex: 1,
    lineHeight: 18,
  },
  heartBtn: {
    padding: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginVertical: 4,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.outline,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceDim,
  },
  sellerName: {
    fontSize: 11,
    color: COLORS.outline,
    fontWeight: '500',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priceSymbol: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(34, 26, 17, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: '75%',
    ...SHADOWS.ambient,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceVariant,
  },
  modalTitle: {
    ...TYPOGRAPHY.headlineSm,
    color: COLORS.primary,
    fontWeight: '700',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.outline,
  },
  modalForm: {
    padding: SPACING.lg,
  },
  priceFilterContainer: {
    marginBottom: SPACING.xl,
  },
  priceFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onBackground,
    marginBottom: SPACING.sm,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  priceInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.default,
    paddingHorizontal: SPACING.md,
    color: COLORS.onSurface,
    fontSize: 14,
  },
  priceInputDivider: {
    fontSize: 16,
    color: COLORS.outline,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceVariant,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md,
  },
  clearBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.outlineVariant,
  },
  clearBtnText: {
    color: COLORS.outline,
    fontWeight: '600',
    fontSize: 15,
  },
  applyBtn: {
    flex: 1.5,
    height: 48,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    ...SHADOWS.btn,
  },
  applyBtnText: {
    color: COLORS.onPrimary,
    fontWeight: '600',
    fontSize: 15,
  },
});
export default SearchScreen;
