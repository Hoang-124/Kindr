// src/features/admin/screens/ManageCategoriesScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../../theme';
import { Plus, Trash2, FolderPlus } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';

interface CategoryItem {
  id: string;
  name: string;
  code: string;
  itemsCount: number;
}

const INITIAL_CATEGORIES: CategoryItem[] = [
  { id: 'c1', name: 'Đồ chơi cho bé 🧸', code: 'do_choi', itemsCount: 15 },
  { id: 'c2', name: 'Quần áo sơ sinh Nous nous 👕', code: 'quan_ao', itemsCount: 22 },
  { id: 'c3', name: 'Sách truyện Ehon 📚', code: 'sach_truyen', itemsCount: 9 },
  { id: 'c4', name: 'Đồ học tập phát triển trí não 🎨', code: 'do_hoc_tap', itemsCount: 4 },
  { id: 'c5', name: 'Xe nôi cũi võng xếp 👶', code: 'xe_noi', itemsCount: 7 },
  { id: 'c6', name: 'Trạm Tặng Đồ 0 Xu 🎁', code: 'tu_thien', itemsCount: 12 },
];

export const ManageCategoriesScreen = () => {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCode, setNewCatCode] = useState('');

  const handleAddCategory = () => {
    if (!newCatName.trim() || !newCatCode.trim()) {
      Alert.alert('Lưu ý', 'Mẹ vui lòng nhập tên và mã danh mục.');
      return;
    }

    const newCat: CategoryItem = {
      id: 'cat_' + Math.random().toString(36).substr(2, 9),
      name: newCatName.trim(),
      code: newCatCode.trim().toLowerCase(),
      itemsCount: 0
    };

    setCategories(prev => [...prev, newCat]);
    setNewCatName('');
    setNewCatCode('');
    Alert.alert('Thành công 🎉', `Đã thêm danh mục mới: ${newCat.name}`);
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
          onPress: () => setCategories(prev => prev.filter(c => c.id !== id)) 
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
          />
        </View>

        <Text style={styles.sectionTitle}>Danh mục hiện tại ({categories.length}):</Text>

        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
    fontSize: 10,
    color: COLORS.outline,
    fontWeight: '600',
    marginTop: 2,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    backgroundColor: COLORS.errorContainer + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ManageCategoriesScreen;
