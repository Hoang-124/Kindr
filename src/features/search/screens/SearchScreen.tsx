// @ts-nocheck
// components/SearchScreen.js
// Màn hình 8: Tìm kiếm và lọc

import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemContext } from '../../../app/providers/ItemProvider';

const categoryOptions = [
  { key: 'all', label: 'Tất cả' },
  { key: 'do_choi', label: 'Đồ chơi' },
  { key: 'sach_truyen', label: 'Sách truyện' },
  { key: 'do_hoc_tap', label: 'Đồ học tập' },
  { key: 'quan_ao', label: 'Quần áo bé' },
  { key: 'xe_noi', label: 'Xe & Nôi cũi' },
];

const conditionOptions = ['Tất cả', 'Mới', 'Còn tốt', 'Có lỗi nhỏ', 'Đã dùng nhiều'];
const ageOptions = ['Tất cả', '0-1 tuổi', '1-2 tuổi', '2-3 tuổi', '3-5 tuổi', '5-10 tuổi'];

export default function SearchScreen({ navigation, route }: { navigation: any, route: any }) {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState(route?.params?.category || 'all');
  const [selectedCondition, setSelectedCondition] = useState('Tất cả');
  const [selectedAge, setSelectedAge] = useState('Tất cả');
  const [showFilter, setShowFilter] = useState(false);
  const { items } = useContext(ItemContext);

  const filteredItems = items.filter(item => {
    if (item.status !== 'active') return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedCat !== 'all' && item.category !== selectedCat) return false;
    if (selectedCondition !== 'Tất cả' && item.condition !== selectedCondition) return false;
    if (selectedAge !== 'Tất cả' && item.ageRange !== selectedAge) return false;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#3D3D3D" />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#A3D5C6" />
          <TextInput
            style={styles.searchInput}
            placeholder="Mẹ muốn tìm món gì cho bé?"
            placeholderTextColor="#C4BFB6"
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color="#C4BFB6" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(!showFilter)}>
          <Ionicons name="options-outline" size={22} color="#5B9A8B" />
        </TouchableOpacity>
      </View>

      {/* Category pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll} style={styles.catScrollWrapper}>
        {categoryOptions.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.catPill, selectedCat === cat.key && styles.catPillActive]}
            onPress={() => setSelectedCat(cat.key)}
          >
            <Text style={[styles.catPillText, selectedCat === cat.key && styles.catPillTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filter Panel */}
      {showFilter && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterTitle}>Tình trạng món đồ</Text>
          <View style={styles.filterRow}>
            {conditionOptions.map(c => (
              <TouchableOpacity key={c} style={[styles.filterChip, selectedCondition === c && styles.filterChipActive]} onPress={() => setSelectedCondition(c)}>
                <Text style={[styles.filterChipText, selectedCondition === c && styles.filterChipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.filterTitle, { marginTop: 14 }]}>Độ tuổi phù hợp</Text>
          <View style={styles.filterRow}>
            {ageOptions.map(a => (
              <TouchableOpacity key={a} style={[styles.filterChip, selectedAge === a && styles.filterChipActive]} onPress={() => setSelectedAge(a)}>
                <Text style={[styles.filterChipText, selectedAge === a && styles.filterChipTextActive]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.applyFilterBtn} onPress={() => setShowFilter(false)}>
            <Text style={styles.applyFilterText}>Áp dụng lọc ✨</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultCount}>Tìm thấy {filteredItems.length} món đồ</Text>
      </View>

      <FlatList
        data={filteredItems}
        numColumns={2}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.productCard, index % 2 === 0 ? { marginRight: 6 } : { marginLeft: 6 }]}
            onPress={() => navigation.navigate('ItemDetail', { item })}
          >
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.productMeta}>
                <Text style={styles.xuText}>🪙 {item.xu} Xu</Text>
                <Text style={styles.locationText}>📍 {item.location.split(',')[0]}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>Chưa tìm thấy món đồ nào phù hợp</Text>
            <Text style={styles.emptySubtext}>Mẹ thử thay đổi bộ lọc hoặc từ khóa nhé!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  searchHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn: { padding: 4 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16,
    paddingHorizontal: 14, height: 48, borderWidth: 1.5, borderColor: '#E8E3DB',
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#3D3D3D' },
  filterBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E8E3DB' },
  catScrollWrapper: {
    flexGrow: 0,
    height: 60,
    marginVertical: 6,
  },
  catScroll: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'center',
  },
  catPill: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 99, backgroundColor: '#ffffff', marginRight: 8, borderWidth: 1.5, borderColor: '#E8E3DB' },
  catPillActive: { backgroundColor: '#5B9A8B', borderColor: '#5B9A8B' },
  catPillText: { fontSize: 13, fontWeight: '600', color: '#5D5347' },
  catPillTextActive: { color: '#ffffff' },
  filterPanel: { marginHorizontal: 16, backgroundColor: '#ffffff', borderRadius: 20, padding: 18, marginBottom: 10, borderWidth: 1.5, borderColor: '#E8E3DB' },
  filterTitle: { fontSize: 14, fontWeight: '700', color: '#3D3D3D', marginBottom: 10 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: '#F5F0E8', borderWidth: 1, borderColor: '#E8E3DB' },
  filterChipActive: { backgroundColor: '#A3D5C6', borderColor: '#5B9A8B' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#5D5347' },
  filterChipTextActive: { color: '#ffffff' },
  applyFilterBtn: { marginTop: 16, backgroundColor: '#5B9A8B', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  applyFilterText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  resultHeader: { paddingHorizontal: 20, paddingBottom: 8 },
  resultCount: { fontSize: 13, color: '#8B7E74', fontWeight: '600' },
  grid: { paddingHorizontal: 16 },
  productCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 18, overflow: 'hidden', marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  productImage: { width: '100%', height: 130 },
  productInfo: { padding: 10 },
  productTitle: { fontSize: 13, fontWeight: '700', color: '#3D3D3D', lineHeight: 18, marginBottom: 6 },
  productMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xuText: { fontSize: 12, fontWeight: '800', color: '#8B6914' },
  locationText: { fontSize: 10, color: '#8B7E74' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 50, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#3D3D3D', marginBottom: 6 },
  emptySubtext: { fontSize: 14, color: '#8B7E74' },
});
