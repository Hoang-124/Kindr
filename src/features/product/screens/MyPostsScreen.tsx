// @ts-nocheck
// components/MyPostsScreen.js
// Màn hình 11: Bài đăng của tôi

import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemContext } from '../../../app/providers/ItemProvider';
import { AppContext } from '../../../app/providers/AppProvider';

const tabs = ['Đang hiển thị', 'Có người yêu cầu', 'Đã hoàn tất', 'Đã ẩn'];

export default function MyPostsScreen({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab] = useState(0);
  const { items, dispatch } = useContext(ItemContext);
  const { state } = useContext(AppContext);

  const myItems = items.filter(i => i.seller.name === (state.user?.name || 'Mẹ Bống'));
  const displayItems = activeTab === 0 ? myItems.filter(i => i.status === 'active') :
                        activeTab === 3 ? myItems.filter(i => i.status === 'hidden') : myItems.slice(0, 2);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#3D3D3D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bài đăng của tôi</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
        {tabs.map((tab, i) => (
          <TouchableOpacity key={i} style={[styles.tab, activeTab === i && styles.tabActive]} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {displayItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyText}>Chưa có bài đăng nào ở đây</Text>
          </View>
        ) : (
          displayItems.map(item => (
            <View key={item.id} style={styles.postCard}>
              <Image source={{ uri: item.image }} style={styles.postImage} />
              <View style={styles.postInfo}>
                <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.postXu}>🪙 {item.xu} Xu</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.status === 'active' ? '🟢 Đang hiển thị' : '🔴 Đã ẩn'}</Text>
                </View>
              </View>
              <View style={styles.actionColumn}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('PostItem')}>
                  <Ionicons name="create-outline" size={18} color="#5B9A8B" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => dispatch({ type: 'TOGGLE_ITEM_STATUS', payload: item.id })}>
                  <Ionicons name={item.status === 'active' ? 'eye-off-outline' : 'eye-outline'} size={18} color="#8B7E74" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => {
                  Alert.alert('Xóa bài đăng', 'Mẹ có chắc muốn xóa bài đăng này không?', [
                    { text: 'Hủy' },
                    { text: 'Xóa', style: 'destructive', onPress: () => dispatch({ type: 'DELETE_ITEM', payload: item.id }) }
                  ]);
                }}>
                  <Ionicons name="trash-outline" size={18} color="#D4577A" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  tabScroll: { paddingHorizontal: 20, paddingBottom: 14 },
  tab: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: '#ffffff', marginRight: 8, borderWidth: 1.5, borderColor: '#E8E3DB' },
  tabActive: { backgroundColor: '#5B9A8B', borderColor: '#5B9A8B' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#5D5347' },
  tabTextActive: { color: '#ffffff' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  postCard: {
    flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 18, overflow: 'hidden', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  postImage: { width: 100, height: 100 },
  postInfo: { flex: 1, padding: 12 },
  postTitle: { fontSize: 14, fontWeight: '700', color: '#3D3D3D', marginBottom: 4 },
  postXu: { fontSize: 13, fontWeight: '700', color: '#8B6914', marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#5D5347' },
  actionColumn: { justifyContent: 'center', paddingRight: 10, gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 50, marginBottom: 12 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#8B7E74' },
});
