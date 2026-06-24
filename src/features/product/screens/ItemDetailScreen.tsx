// @ts-nocheck
// components/ItemDetailScreen.js
// Màn hình 9: Chi tiết món đồ

import React, { useContext } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../../app/providers/AppProvider';
import { useSelector } from 'react-redux';

export default function ItemDetailScreen({ route, navigation }: { route: any, navigation: any }) {
  const { item } = route.params || {};
  const { state } = useContext(AppContext);
  const wallet = useSelector(s => s.wallet);

  const handleRequest = () => {
    if (wallet.balance < item.xu) {
      Alert.alert('Ôi không! 🧸', `Ví của mẹ chỉ còn ${wallet.balance} Xu, cần ${item.xu} Xu cho món đồ này. Mẹ nạp thêm Xu nhé!`, [
        { text: 'Nạp Xu', onPress: () => navigation.navigate('DepositXu') },
        { text: 'Để sau' },
      ]);
    } else {
      navigation.navigate('TransactionDetail', { item, type: 'request' });
    }
  };

  if (!item) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.image }} style={styles.mainImage} />
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#3D3D3D" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="heart-outline" size={22} color="#D4577A" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title & Xu */}
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <View style={styles.xuBadge}>
              <Text style={styles.xuEmoji}>🪙</Text>
              <Text style={styles.xuAmount}>{item.xu} Xu</Text>
            </View>
          </View>

          {/* Info tags */}
          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>📦 {item.condition}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>👶 {item.ageRange}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>📍 {item.location}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Mô tả chi tiết</Text>
            <Text style={styles.descriptionText}>{item.description}</Text>
          </View>

          {/* Seller info */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Thông tin mẹ đăng đồ</Text>
            <View style={styles.sellerRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{item.seller.avatar}</Text>
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{item.seller.name}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.starText}>⭐ {item.seller.rating}</Text>
                  <Text style={styles.transText}> · {item.seller.transactions} giao dịch</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Reminder */}
          <View style={styles.reminderCard}>
            <Text style={styles.reminderEmoji}>🧸</Text>
            <Text style={styles.reminderText}>
              Mẹ nhớ kiểm tra kỹ món đồ trước khi xác nhận nhận hàng nhé. Gấu sẽ giữ Xu an toàn cho đến khi mẹ hài lòng!
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.chatButton} onPress={() => navigation.navigate('Chat', { item })}>
          <Ionicons name="chatbubble-outline" size={22} color="#5B9A8B" />
          <Text style={styles.chatButtonText}>Nhắn tin</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.requestButton} onPress={handleRequest}>
          <Text style={styles.requestButtonText}>Yêu cầu nhận đồ 🧸</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  scrollContent: { paddingBottom: 110 },
  imageContainer: { position: 'relative' },
  mainImage: { width: '100%', height: 300 },
  backButton: {
    position: 'absolute', top: 16, left: 16, width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center',
  },
  shareButton: {
    position: 'absolute', top: 16, right: 16, width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center',
  },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  itemTitle: { fontSize: 22, fontWeight: '800', color: '#3D3D3D', flex: 1, lineHeight: 30, marginRight: 12 },
  xuBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8EB', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: '#FFE0A3',
  },
  xuEmoji: { fontSize: 18, marginRight: 5 },
  xuAmount: { fontSize: 18, fontWeight: '800', color: '#8B6914' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  tag: { backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E8E3DB' },
  tagText: { fontSize: 12, fontWeight: '600', color: '#5D5347' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 20, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionLabel: { fontSize: 16, fontWeight: '800', color: '#3D3D3D', marginBottom: 12 },
  descriptionText: { fontSize: 14, color: '#5D5347', lineHeight: 24 },
  sellerRow: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#A3D5C6',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 16, fontWeight: '700', color: '#3D3D3D' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  starText: { fontSize: 13, color: '#F5A623', fontWeight: '700' },
  transText: { fontSize: 13, color: '#8B7E74' },
  reminderCard: {
    backgroundColor: '#FFF8EB', borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFE0A3', marginBottom: 14,
  },
  reminderEmoji: { fontSize: 30, marginRight: 12 },
  reminderText: { flex: 1, fontSize: 13, color: '#8B6914', lineHeight: 20, fontWeight: '500' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#E8E3DB',
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  chatButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#A3D5C6',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, backgroundColor: '#F0FAF7',
  },
  chatButtonText: { fontSize: 14, fontWeight: '700', color: '#5B9A8B' },
  requestButton: {
    flex: 1, backgroundColor: '#5B9A8B', borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#5B9A8B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  requestButtonText: { fontSize: 16, fontWeight: '800', color: '#ffffff' },
});
