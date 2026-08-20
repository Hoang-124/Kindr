// src/features/post/screens/EditPostScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../../../app/store/hooks';
import { hydrateProducts } from '../../home/store/homeSlice';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { Tag, Edit, Archive, UserCheck, HelpCircle } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import FormError from '../../../components/form/FormError';

const CATEGORIES = [
  { id: 'do_choi', name: 'Đồ chơi' },
  { id: 'quan_ao', name: 'Quần áo bé' },
  { id: 'sach_truyen', name: 'Sách truyện' },
  { id: 'do_hoc_tap', name: 'Đồ học tập' },
  { id: 'xe_noi', name: 'Xe & Nôi cũi' },
  { id: 'tu_thien', name: 'Trạm Tặng Đồ' },
];

const CONDITIONS = [
  { id: 'new', label: 'Mới tinh (100%)' },
  { id: 'like_new', label: 'Như mới (>90%)' },
  { id: 'good', label: 'Khá tốt (70-90%)' },
  { id: 'fair', label: 'Cũ / Đã dùng nhiều (<70%)' },
];

export const EditPostScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { postId } = route.params || {};
  const products = useAppSelector((state) => state.home.products);
  const product = products.find(p => p.id === postId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [category, setCategory] = useState('do_choi');
  const [condition, setCondition] = useState('good');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description);
      setPriceStr(product.price.toString());
      setCategory(product.category);
      setCondition(product.condition);
    }
  }, [product]);

  if (!product) {
    return (
      <ScreenContainer scrollable={false}>
        <Header title="Không tìm thấy bài viết" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Bài viết không tồn tại hoặc đã bị xóa.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleSaveChanges = () => {
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên đồ dùng.');
      return;
    }

    if (name.length < 10) {
      setError('Tên đồ dùng nên chi tiết một chút (tối thiểu 10 ký tự).');
      return;
    }

    if (!description.trim()) {
      setError('Vui lòng nhập mô tả chi tiết sản phẩm.');
      return;
    }

    const price = parseInt(priceStr);
    if (isNaN(price) || price < 0) {
      setError('Vui lòng nhập giá Xu hợp lệ (nhập 0 nếu mẹ muốn tặng đồ).');
      return;
    }

    setLoading(true);

    const conditionLabel = CONDITIONS.find(c => c.id === condition)?.label || 'Khá tốt';

    setTimeout(() => {
      setLoading(false);
      
      const updatedProduct = {
        ...product,
        name,
        description,
        price,
        category,
        condition: condition as any,
        conditionLabel,
      };

      const updatedProductsList = products.map(p => p.id === postId ? updatedProduct : p);
      dispatch(hydrateProducts(updatedProductsList));

      Alert.alert(
        'Thành công! 🎉',
        'Bài viết của mẹ đã được cập nhật thông tin mới.',
        [{ text: 'Đồng ý', onPress: () => navigation.goBack() }]
      );
    }, 1000);
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Sửa Bài Đăng" showBack />
      
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <FormError message={error} />

        <Input
          label="Tên đồ dùng cần bán/tặng"
          placeholder="VD: Cũi gỗ sồi, set body Nous..."
          value={name}
          onChangeText={setName}
          icon={<Edit size={20} color={COLORS.outline} />}
        />

        <Input
          label="Mô tả chi tiết độ mới, kích thước, lỗi nhỏ nếu có"
          placeholder="Hãy ghi chi tiết để các mẹ khác yên tâm nhận đồ mẹ nhé..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.descInput}
          icon={<Archive size={20} color={COLORS.outline} />}
        />

        <Input
          label="Giá trị quy đổi (Nhập 0 Xu để Tặng Từ Thiện)"
          placeholder="VD: 5 Xu"
          value={priceStr}
          onChangeText={setPriceStr}
          keyboardType="number-pad"
          icon={<Tag size={20} color={COLORS.outline} />}
        />

        {/* Category Picker */}
        <Text style={styles.pickerLabel}>Danh mục sản phẩm</Text>
        <View style={styles.badgeRow}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.badge, isSelected && styles.badgeSelected]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Condition Picker */}
        <Text style={styles.pickerLabel}>Độ mới hiện tại</Text>
        <View style={styles.badgeRow}>
          {CONDITIONS.map((cond) => {
            const isSelected = condition === cond.id;
            return (
              <TouchableOpacity
                key={cond.id}
                style={[styles.badge, isSelected && styles.badgeSelected]}
                onPress={() => setCondition(cond.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                  {cond.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title="Lưu thay đổi bài đăng"
          onPress={handleSaveChanges}
          loading={loading}
          style={styles.submitBtn}
        />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '600',
  },
  descInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.sm,
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs + 2,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
  badge: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    ...SHADOWS.soft,
  },
  badgeSelected: {
    backgroundColor: COLORS.primaryContainer + '30',
    borderColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.outline,
  },
  badgeTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: SPACING.lg,
    height: 52,
  },
});

export default EditPostScreen;
