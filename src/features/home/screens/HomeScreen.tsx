// @ts-nocheck
// components/HomeScreen.js
// Màn hình 7: Trang chủ Home - Giao diện chính của Kindr

import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, TextInput, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../../app/providers/AppProvider';
import { ItemContext } from '../../../app/providers/ItemProvider';
import { useSelector } from 'react-redux';

const categories = [
  { key: 'do_choi', label: 'Đồ chơi', icon: '🧸' },
  { key: 'sach_truyen', label: 'Sách truyện', icon: '📚' },
  { key: 'do_hoc_tap', label: 'Đồ học tập', icon: '✏️' },
  { key: 'quan_ao', label: 'Quần áo bé', icon: '👗' },
  { key: 'xe_noi', label: 'Xe & Nôi cũi', icon: '🍼' },
  { key: 'tram_tang', label: 'Trạm Tặng Đồ', icon: '🎁' },
];

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { state, dispatch } = useContext(AppContext);
  const { items } = useContext(ItemContext);
  const wallet = useSelector(state => state.wallet);

  const activeItems = items.filter(i => i.status === 'active');

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigation.navigate('SignIn');
  };

  const renderProductCard = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.productCard, index % 2 === 0 ? { marginRight: 6 } : { marginLeft: 6 }]}
      onPress={() => navigation.navigate('ItemDetail', { item })}
    >
      <View style={styles.productImageWrap}>
        <Image source={{ uri: item.image }} style={styles.productImage} />
        {item.xu === 0 && (
          <View style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>Tặng miễn phí 🎁</Text>
          </View>
        )}
        <View style={styles.conditionBadge}>
          <Text style={styles.conditionText}>{item.condition}</Text>
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.productMeta}>
          <View style={styles.xuContainer}>
            <Text style={styles.xuIcon}>🪙</Text>
            <Text style={styles.xuText}>{item.xu} Xu</Text>
          </View>
          <Text style={styles.locationSmall}>📍 {item.location.split(',')[0]}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Chào mẹ {state.user?.name || 'bạn'}! 👋</Text>
            <Text style={styles.subGreeting}>Hôm nay mẹ muốn tìm gì cho bé?</Text>
          </View>
          <TouchableOpacity style={styles.walletBadge} onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.walletIcon}>💰</Text>
            <Text style={styles.walletText}>{wallet.balance} Xu</Text>
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Hôm nay dọn nhà{'\n'}cho bé đỡ chật{'\n'}nhé mẹ ơi! 🏠</Text>
            <TouchableOpacity style={styles.bannerButton} onPress={() => navigation.navigate('PostItem')}>
              <Text style={styles.bannerButtonText}>Đăng đồ ngay</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bannerEmoji}>🧸👶📦</Text>
        </View>

        {/* Search */}
        <TouchableOpacity style={styles.searchContainer} onPress={() => navigation.navigate('Search')}>
          <Ionicons name="search-outline" size={20} color="#A3D5C6" />
          <Text style={styles.searchPlaceholder}>Mẹ muốn tìm món gì cho bé?</Text>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh mục</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat, index) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryCard, cat.key === 'tram_tang' && styles.categoryCardSpecial]}
              onPress={() => {
                if (cat.key === 'tram_tang') {
                  navigation.navigate('GiftStation');
                } else {
                  navigation.navigate('Search', { category: cat.key });
                }
              }}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryLabel, cat.key === 'tram_tang' && styles.categoryLabelSpecial]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Near items */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gần mẹ hôm nay 📍</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MapNearby')}>
            <Text style={styles.seeAllText}>Xem bản đồ</Text>
          </TouchableOpacity>
        </View>

        {/* Products Grid */}
        <FlatList
          data={activeItems}
          renderItem={renderProductCard}
          keyExtractor={item => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.productsGrid}
          columnWrapperStyle={styles.productRow}
        />

        {/* Promo Card */}
        <View style={styles.promoCard}>
          <Text style={styles.promoEmoji}>🧸✨</Text>
          <Text style={styles.promoTitle}>Trạm Tặng Đồ</Text>
          <Text style={styles.promoDesc}>Cho đi món nhỏ, nhận lại niềm vui lớn! Xem những món đồ 0 Xu đang chờ bé.</Text>
          <TouchableOpacity style={styles.promoButton} onPress={() => navigation.navigate('GiftStation')}>
            <Text style={styles.promoButtonText}>Khám phá ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconActive}>
            <Ionicons name="home" size={22} color="#fff" />
          </View>
          <Text style={styles.navTextActive}>Trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Search')}>
          <View style={styles.navIcon}>
            <Ionicons name="search-outline" size={22} color="#8B7E74" />
          </View>
          <Text style={styles.navText}>Tìm kiếm</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItemCenter} onPress={() => navigation.navigate('PostItem')}>
          <View style={styles.navIconCenter}>
            <Ionicons name="add" size={28} color="#fff" />
          </View>
          <Text style={styles.navTextCenter}>Đăng đồ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Chat')}>
          <View style={styles.navIcon}>
            <Ionicons name="chatbubble-outline" size={22} color="#8B7E74" />
          </View>
          <Text style={styles.navText}>Tin nhắn</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <View style={styles.navIcon}>
            <Ionicons name="person-outline" size={22} color="#8B7E74" />
          </View>
          <Text style={styles.navText}>Cá nhân</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  scrollContent: { paddingBottom: 100 },
  topBar: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#3D3D3D' },
  subGreeting: { fontSize: 13, color: '#8B7E74', marginTop: 3 },
  walletBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8EB', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: '#FFE0A3',
  },
  walletIcon: { fontSize: 16, marginRight: 5 },
  walletText: { fontSize: 14, fontWeight: '700', color: '#8B6914' },

  // Banner
  banner: {
    marginHorizontal: 20, borderRadius: 24, backgroundColor: '#A3D5C6', padding: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden',
    shadowColor: '#5B9A8B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', lineHeight: 26, marginBottom: 14 },
  bannerButton: { backgroundColor: '#ffffff', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 20, alignSelf: 'flex-start' },
  bannerButtonText: { fontSize: 14, fontWeight: '700', color: '#5B9A8B' },
  bannerEmoji: { fontSize: 40, marginLeft: 10 },

  // Search
  searchContainer: {
    marginHorizontal: 20, marginTop: 18, height: 52, borderRadius: 16, backgroundColor: '#ffffff',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderWidth: 1.5, borderColor: '#E8E3DB',
  },
  searchPlaceholder: { marginLeft: 10, fontSize: 14, color: '#C4BFB6' },

  // Section
  sectionHeader: { marginTop: 24, marginBottom: 12, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  seeAllText: { fontSize: 13, color: '#5B9A8B', fontWeight: '700' },

  // Categories
  categoryScroll: { paddingHorizontal: 20 },
  categoryCard: {
    backgroundColor: '#ffffff', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 18, marginRight: 10,
    alignItems: 'center', width: 90, borderWidth: 1.5, borderColor: '#F0EBE3',
  },
  categoryCardSpecial: { backgroundColor: '#FFF0F3', borderColor: '#FFD6E0' },
  categoryIcon: { fontSize: 28, marginBottom: 6 },
  categoryLabel: { fontSize: 11, fontWeight: '700', color: '#5D5347', textAlign: 'center' },
  categoryLabelSpecial: { color: '#D4577A' },

  // Products
  productsGrid: { paddingHorizontal: 20 },
  productRow: { justifyContent: 'space-between' },
  productCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 18, overflow: 'hidden', marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  productImageWrap: { position: 'relative' },
  productImage: { width: '100%', height: 140, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  freeBadge: {
    position: 'absolute', top: 8, left: 8, backgroundColor: '#FF6B8A', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  freeBadgeText: { fontSize: 10, fontWeight: '700', color: '#ffffff' },
  conditionBadge: {
    position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  conditionText: { fontSize: 10, fontWeight: '600', color: '#5D5347' },
  productInfo: { padding: 12 },
  productTitle: { fontSize: 13, fontWeight: '700', color: '#3D3D3D', lineHeight: 18, marginBottom: 8 },
  productMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xuContainer: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  xuIcon: { fontSize: 14 },
  xuText: { fontSize: 13, fontWeight: '800', color: '#8B6914' },
  locationSmall: { fontSize: 10, color: '#8B7E74' },

  // Promo
  promoCard: {
    marginHorizontal: 20, marginTop: 10, backgroundColor: '#FFF0F3', borderRadius: 24, padding: 24, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFD6E0',
  },
  promoEmoji: { fontSize: 40, marginBottom: 10 },
  promoTitle: { fontSize: 20, fontWeight: '800', color: '#D4577A', marginBottom: 8 },
  promoDesc: { fontSize: 14, color: '#8B7E74', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  promoButton: { backgroundColor: '#D4577A', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 24 },
  promoButtonText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },

  // Bottom Nav
  bottomNav: {
    position: 'absolute', left: 10, right: 10, bottom: 8, height: 72, backgroundColor: '#ffffff',
    borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 8,
    borderWidth: 1, borderColor: '#F0EBE3',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  navIconActive: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#5B9A8B', justifyContent: 'center', alignItems: 'center', marginBottom: 2,
    shadowColor: '#5B9A8B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  navIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  navTextActive: { fontSize: 10, fontWeight: '700', color: '#5B9A8B' },
  navText: { fontSize: 10, fontWeight: '500', color: '#8B7E74' },
  navItemCenter: { alignItems: 'center', justifyContent: 'center', marginTop: -20 },
  navIconCenter: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: '#F5A623', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#F5A623', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
    borderWidth: 3, borderColor: '#ffffff',
  },
  navTextCenter: { fontSize: 10, fontWeight: '700', color: '#F5A623', marginTop: 2 },
});
