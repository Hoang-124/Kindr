// @ts-nocheck
// components/NotificationsScreen.js - Màn hình 19: Thông báo
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../../app/providers/AppProvider';
import { ItemContext } from '../../../app/providers/ItemProvider';

export default function NotificationsScreen({ navigation }: { navigation: any }) {
  const { state, dispatch } = useContext(AppContext);
  const { items } = useContext(ItemContext);
  const [activeTab, setActiveTab] = useState<'activity' | 'nearby'>('activity');

  const userLocation = state.user?.location || 'Quận 7, TP.HCM';

  // Get items posted by other users
  const otherUsersItems = items.filter(
    item => item.seller?.name !== state.user?.name && item.status === 'active'
  );

  // Helper function to calculate proximity levels
  const getProximity = (itemLocation: string, userLocationStr: string) => {
    const itemDist = itemLocation.split(',')[0].trim().toLowerCase();
    const userDist = userLocationStr.split(',')[0].trim().toLowerCase();
    
    if (itemDist === userDist) {
      return { text: 'Rất gần (dưới 2km) 📍', color: '#D4577A', bg: '#FFF0F3', score: 3 };
    }
    
    // Define adjacent districts for proximity calculations in HCMC
    const adjacencies: { [key: string]: string[] } = {
      'quận 7': ['quận 4', 'quận 1', 'quận 2', 'quận 8', 'nhà bè', 'bình chánh'],
      'quận 1': ['quận 3', 'quận 4', 'quận 5', 'quận 10', 'bình thạnh', 'phú nhuận', 'quận 2'],
      'quận bình thạnh': ['quận 1', 'quận 3', 'phú nhuận', 'gò vấp', 'thủ đức', 'quận 2'],
      'quận 2': ['quận 1', 'quận 7', 'quận 9', 'thủ đức', 'bình thạnh', 'quận 4'],
      'quận gò vấp': ['bình thạnh', 'phú nhuận', 'quận 12', 'tân bình'],
      'quận tân bình': ['quận 10', 'quận 11', 'quận 3', 'phú nhuận', 'gò vấp', 'quận 12', 'tân phú'],
    };
    
    const adj = adjacencies[userDist] || [];
    if (adj.includes(itemDist)) {
      return { text: 'Gần bạn (dưới 5km) 🚗', color: '#5B9A8B', bg: '#F0FAF7', score: 2 };
    }
    
    return { text: 'Lân cận (dưới 10km) 🛵', color: '#8B7E74', bg: '#F5F0E8', score: 1 };
  };

  // Sort other items by proximity score (highest first)
  const nearbyItems = otherUsersItems
    .map(item => ({
      ...item,
      proximity: getProximity(item.location, userLocation),
    }))
    .sort((a, b) => b.proximity.score - a.proximity.score);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#3D3D3D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'activity' && styles.tabButtonActive]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>
            Hoạt động
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'nearby' && styles.tabButtonActive]}
          onPress={() => setActiveTab('nearby')}
        >
          <Text style={[styles.tabText, activeTab === 'nearby' && styles.tabTextActive]}>
            Món đồ gần bạn 📍
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'activity' ? (
        <ScrollView contentContainerStyle={styles.list}>
          {state.notifications.length > 0 ? (
            state.notifications.map(notif => (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
                onPress={() => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: notif.id })}
              >
                <View style={styles.notifIcon}>
                  <Text style={styles.notifIconText}>{notif.icon}</Text>
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifText, !notif.read && styles.notifTextUnread]}>
                    {notif.text}
                  </Text>
                  <Text style={styles.notifTime}>{notif.time}</Text>
                </View>
                {!notif.read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyText}>Chưa có thông báo hoạt động nào</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={nearbyItems}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.nearbyList}
          ListHeaderComponent={
            <View style={styles.locationBanner}>
              <Ionicons name="location" size={18} color="#D4577A" />
              <Text style={styles.locationBannerText}>
                Vị trí của mẹ: <Text style={{ fontWeight: '700' }}>{userLocation}</Text>
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.nearbyCard}
              onPress={() => navigation.navigate('ItemDetail', { item })}
            >
              <Image source={{ uri: item.image }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <View style={styles.proximityRow}>
                  <View
                    style={[
                      styles.proximityBadge,
                      { backgroundColor: item.proximity.bg },
                    ]}
                  >
                    <Text style={[styles.proximityText, { color: item.proximity.color }]}>
                      {item.proximity.text}
                    </Text>
                  </View>
                  <Text style={styles.timeAgo}>vừa đăng</Text>
                </View>
                
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                
                <View style={styles.sellerRow}>
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>{item.seller.avatar}</Text>
                  </View>
                  <Text style={styles.sellerName}>{item.seller.name}</Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.itemLocation}>{item.location.split(',')[0]}</Text>
                </View>
                
                <View style={styles.bottomRow}>
                  <View style={styles.xuBadge}>
                    <Text style={styles.xuEmoji}>🪙</Text>
                    <Text style={styles.xuValueText}>
                      {item.xu === 0 ? 'Tặng 0 Xu' : `${item.xu} Xu`}
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.viewDetailBtn}
                    onPress={() => navigation.navigate('ItemDetail', { item })}
                  >
                    <Text style={styles.viewDetailText}>Xem đồ</Text>
                    <Ionicons name="chevron-forward" size={12} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📍</Text>
              <Text style={styles.emptyText}>Chưa tìm thấy sản phẩm nào lân cận</Text>
              <Text style={styles.emptySubtext}>Hãy theo dõi thêm sau nhé mẹ!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  
  // Tabs
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E8E3DB', backgroundColor: '#ffffff', paddingHorizontal: 10 },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: '#5B9A8B' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#8B7E74' },
  tabTextActive: { color: '#5B9A8B', fontWeight: '700' },
  
  // List General
  list: { paddingHorizontal: 20, paddingVertical: 16 },
  notifCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 18, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  notifCardUnread: { backgroundColor: '#F0FAF7', borderWidth: 1.5, borderColor: '#A3D5C6' },
  notifIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifIconText: { fontSize: 22 },
  notifContent: { flex: 1 },
  notifText: { fontSize: 13, color: '#5D5347', lineHeight: 20 },
  notifTextUnread: { fontWeight: '700', color: '#3D3D3D' },
  notifTime: { fontSize: 11, color: '#8B7E74', marginTop: 4 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#5B9A8B' },

  // Location Banner
  locationBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', marginHorizontal: 20, marginTop: 14, marginBottom: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, borderColor: '#E8E3DB' },
  locationBannerText: { marginLeft: 8, fontSize: 13, color: '#5D5347' },

  // Nearby List
  nearbyList: { paddingBottom: 30 },
  nearbyCard: { flexDirection: 'row', backgroundColor: '#ffffff', marginHorizontal: 20, marginBottom: 12, borderRadius: 20, overflow: 'hidden', padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
  itemImage: { width: 100, height: 100, borderRadius: 14 },
  itemInfo: { flex: 1, marginLeft: 14, justifyContent: 'space-between' },
  proximityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  proximityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  proximityText: { fontSize: 10, fontWeight: '700' },
  timeAgo: { fontSize: 10, color: '#C4BFB6' },
  itemTitle: { fontSize: 14, fontWeight: '800', color: '#3D3D3D', marginVertical: 4 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  avatarMini: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center' },
  avatarMiniText: { fontSize: 10 },
  sellerName: { fontSize: 11, color: '#8B7E74', fontWeight: '500' },
  dot: { fontSize: 11, color: '#C4BFB6' },
  itemLocation: { fontSize: 11, color: '#8B7E74' },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xuBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF8EB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#FFE0A3' },
  xuEmoji: { fontSize: 12 },
  xuValueText: { fontSize: 12, fontWeight: '800', color: '#8B6914' },
  viewDetailBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#5B9A8B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  viewDetailText: { fontSize: 11, fontWeight: '700', color: '#ffffff' },

  // Empty state
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 50, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#3D3D3D', textAlign: 'center', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#8B7E74', textAlign: 'center' },
});
