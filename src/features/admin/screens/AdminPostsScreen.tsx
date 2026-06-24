// @ts-nocheck
// components/AdminPostsScreen.js - Màn hình 28: Admin quản lý bài đăng
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemContext } from '../../../app/providers/ItemProvider';

const filterOptions = ['Tất cả', 'Đang hiển thị', 'Đã ẩn', 'Vi phạm'];

export default function AdminPostsScreen({ navigation }: { navigation: any }) {
  const [filter, setFilter] = useState('Tất cả');
  const { items, dispatch } = useContext(ItemContext);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý bài đăng</Text>
        <View style={styles.countBadge}><Text style={styles.countText}>{items.length}</Text></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {filterOptions.map(f => (
          <TouchableOpacity key={f} style={[styles.filterPill, filter === f && styles.filterPillActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {items.map(item => (
          <View key={item.id} style={styles.postCard}>
            <Image source={{ uri: item.image }} style={styles.postImage} />
            <View style={styles.postInfo}>
              <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.postMeta}>🪙 {item.xu} Xu · 📍 {item.location.split(',')[0]}</Text>
              <Text style={styles.postSeller}>Đăng bởi: {item.seller.name}</Text>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, item.status === 'hidden' && styles.statusHidden]}>
                  <Text style={styles.statusText}>{item.status === 'active' ? '🟢 Đang hiển thị' : '🔴 Đã ẩn'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.actionCol}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ItemDetail', { item })}>
                <Ionicons name="eye-outline" size={16} color="#5B9A8B" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => dispatch({ type: 'TOGGLE_ITEM_STATUS', payload: item.id })}>
                <Ionicons name={item.status === 'active' ? 'eye-off-outline' : 'eye-outline'} size={16} color="#8B7E74" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => {
                Alert.alert('Xóa bài đăng', 'Xác nhận xóa bài đăng này?', [
                  { text: 'Hủy' }, { text: 'Xóa', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_ITEM', payload: item.id }) }
                ]);
              }}>
                <Ionicons name="trash-outline" size={16} color="#D4577A" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FFF8EB' }]}>
                <Ionicons name="warning-outline" size={16} color="#F5A623" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  countBadge: { backgroundColor: '#5B9A8B', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  countText: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  filterScroll: { paddingHorizontal: 20, paddingBottom: 14 },
  filterPill: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16, backgroundColor: '#ffffff', marginRight: 8, borderWidth: 1.5, borderColor: '#E8E3DB' },
  filterPillActive: { backgroundColor: '#5B9A8B', borderColor: '#5B9A8B' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#5D5347' },
  filterTextActive: { color: '#ffffff' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  postCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  postImage: { width: 80, height: 90 },
  postInfo: { flex: 1, padding: 10 },
  postTitle: { fontSize: 13, fontWeight: '700', color: '#3D3D3D', marginBottom: 2 },
  postMeta: { fontSize: 11, color: '#8B7E74', marginBottom: 2 },
  postSeller: { fontSize: 11, color: '#5B9A8B', fontWeight: '600', marginBottom: 4 },
  statusRow: { flexDirection: 'row' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: '#E8F5E8' },
  statusHidden: { backgroundColor: '#FFF0F3' },
  statusText: { fontSize: 10, fontWeight: '600', color: '#3D3D3D' },
  actionCol: { justifyContent: 'center', paddingHorizontal: 8, gap: 4 },
  actionBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center' },
});
