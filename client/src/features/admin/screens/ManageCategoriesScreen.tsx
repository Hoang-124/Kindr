// src/features/admin/screens/ManageCategoriesScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { Plus, Trash2, FolderPlus, RefreshCw } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { api } from '../../../services/api';

interface CategoryItem {
  id: string;
  name: string;
  code: string;
  itemsCount: number;
}

const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'c1', name: 'Đồ chơi cho bé', code: 'do_choi', itemsCount: 15 },
  { id: 'c2', name: 'Quần áo sơ sinh Nous nous', code: 'quan_ao', itemsCount: 22 },
  { id: 'c3', name: 'Sách truyện Ehon', code: 'sach_truyen', itemsCount: 9 },
  { id: 'c4', name: 'Đồ học tập phát triển trí não', code: 'do_hoc_tap', itemsCount: 4 },
  { id: 'c5', name: 'Xe nôi cũi võng xếp', code: 'xe_noi', itemsCount: 7 },
  { id: 'c6', name: 'Trạm Tặng Đồ 0 Xu', code: 'tu_thien', itemsCount: 12 },
];

export const ManageCategoriesScreen = () => {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCategories(res.data);
      }
    } catch (err) {
      console.warn('Cannot fetch categories from server, using local fallback:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !newCatCode.trim()) {
      Alert.alert('Lưu ý', 'Mẹ vui lòng nhập tên và mã danh mục.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/categories', {
        name: newCatName.trim(),
        code: newCatCode.trim().toLowerCase(),
      });

      const createdCat: CategoryItem = res.data;
      setCategories(prev => [...prev, createdCat]);
      setNewCatName('');
      setNewCatCode('');
      Alert.alert('Thành công', `Đã thêm danh mục mới: ${createdCat.name}`);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || err?.message || 'Không thể tạo danh mục.';
      Alert.alert('Lỗi tạo danh mục', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Xóa danh mục?',
      `Mẹ có chắc chắn muốn xóa danh mục "${name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/categories/${id}`);
              setCategories(prev => prev.filter(c => c.id !== id));
              Alert.alert('Thành công', `Đã xóa danh mục "${name}".`);
            } catch (err: any) {
              const errMsg = err?.response?.data?.error || err?.message || 'Không thể xóa danh mục.';
              Alert.alert('Không thể xóa', errMsg);
            }
          }
        }
      ]
    );
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header title="Quản Lý Danh Mục" showBack />
      
      <View style={styles.container}>
        {/* Add Form */}
        <View style={styles.addForm}>
          <Text style={styles.formTitle}>Thêm danh mục mới</Text>
          
          <Input
            label="Tên danh mục"
            placeholder="VD: Xe & Nôi cũi..."
            value={newCatName}
            onChangeText={setNewCatName}
            icon={<FolderPlus size={18} color={COLORS.outline} />}
          />

          <Input
            label="Mã định danh (Slug)"
            placeholder="VD: xe_noi_cui"
            value={newCatCode}
            onChangeText={setNewCatCode}
            autoCapitalize="none"
            icon={<FolderPlus size={18} color={COLORS.outline} />}
          />

          <Button
            title="Thêm danh mục"
            onPress={handleAddCategory}
            style={styles.addBtn}
            loading={submitting}
          />
        </View>

        <Text style={styles.sectionTitle}>Danh mục hiện tại ({categories.length}):</Text>

        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.catName}>{item.name}</Text>
                <Text style={styles.catCode}>Mã: {item.code} • {item.itemsCount} bài đăng</Text>
              </View>

              <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id, item.name)}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={`Xóa danh mục ${item.name}`}
              >
                <Trash2 size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.md,
  },
  addForm: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    ...SHADOWS.soft,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  addBtn: {
    height: 40,
    marginTop: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: SPACING.md,
  },
  listContent: {
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: COLORS.surfaceVariant,
    borderRadius: 14,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.soft,
  },
  rowInfo: {
    flex: 1,
  },
  catName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  catCode: {
    fontSize: 12,
    color: COLORS.outline,
    fontWeight: '600',
    marginTop: 2,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ManageCategoriesScreen;
