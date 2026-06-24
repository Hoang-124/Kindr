// @ts-nocheck
// components/PostItemScreen.js
// Màn hình 10: Đăng đồ cho bé

import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ItemContext } from '../../../app/providers/ItemProvider';
import { AppContext } from '../../../app/providers/AppProvider';

const conditionOptions = ['Mới', 'Còn tốt', 'Có lỗi nhỏ', 'Đã dùng nhiều'];
const categoryOptions = [
  { key: 'do_choi', label: 'Đồ chơi' }, { key: 'sach_truyen', label: 'Sách truyện' },
  { key: 'do_hoc_tap', label: 'Đồ học tập' }, { key: 'quan_ao', label: 'Quần áo bé' },
  { key: 'xe_noi', label: 'Xe & Nôi cũi' }, { key: 'tram_tang', label: 'Tặng miễn phí' },
];

export default function PostItemScreen({ navigation }: { navigation: any }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [xu, setXu] = useState('');
  const [location, setLocation] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const { dispatch: itemDispatch } = useContext(ItemContext);
  const { state } = useContext(AppContext);

  const getAiPricing = () => {
    const price = parseFloat(originalPrice.replace(/[^0-9]/g, '')) || 0;
    if (price <= 0) return null;

    let multiplier = 0.5; // "Còn tốt"
    let chance = 75;
    if (condition === 'Mới') {
      multiplier = 0.6;
      chance = 90;
    } else if (condition === 'Có lỗi nhỏ') {
      multiplier = 0.3;
      chance = 60;
    } else if (condition === 'Đã dùng nhiều') {
      multiplier = 0.2;
      chance = 45;
    }

    const calculatedXu = Math.round((price / 10000) * multiplier);
    return { calculatedXu, chance };
  };

  const aiPricing = getAiPricing();

  const handlePost = () => {
    if (!title || !category || !condition) {
      Alert.alert('Ôi không! 🧸', 'Mẹ cần điền đầy đủ thông tin để đăng đồ nhé.');
      return;
    }
    if (!confirmed) {
      Alert.alert('Nhắc nhẹ 🧸', 'Mẹ cần xác nhận đã mô tả đúng tình trạng món đồ nhé.');
      return;
    }
    itemDispatch({
      type: 'ADD_ITEM',
      payload: {
        title, description, category, condition, ageRange,
        xu: category === 'tram_tang' ? 0 : parseInt(xu) || 0,
        location: location || 'Quận 7, TP.HCM',
        image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400',
        seller: { name: state.user?.name || 'Mẹ', avatar: state.user?.avatar || 'M', rating: state.user?.rating || 5.0, transactions: state.user?.transactions || 0 },
      },
    });
    Alert.alert('Tuyệt vời mẹ ơi! 🎉', 'Món đồ đã được đăng thành công. Sẽ sớm có mẹ khác quan tâm!', [
      { text: 'Xem bài đăng', onPress: () => navigation.navigate('MyPosts') },
      { text: 'Về trang chủ', onPress: () => navigation.navigate('Home') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#3D3D3D" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đăng đồ cho bé</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Upload photos */}
        <View style={styles.uploadSection}>
          <TouchableOpacity style={styles.uploadBox}>
            <Ionicons name="camera-outline" size={32} color="#A3D5C6" />
            <Text style={styles.uploadText}>Thêm ảnh</Text>
            <Text style={styles.uploadSubtext}>Tối đa 5 ảnh</Text>
          </TouchableOpacity>
          <View style={styles.uploadSmallRow}>
            {[1, 2, 3, 4].map(i => (
              <TouchableOpacity key={i} style={styles.uploadSmall}>
                <Ionicons name="add" size={20} color="#C4BFB6" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.label}>Tên món đồ *</Text>
            <TextInput style={styles.input} placeholder="VD: Xe đẩy Combi đời 2024" placeholderTextColor="#C4BFB6" value={title} onChangeText={setTitle} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Danh mục *</Text>
            <View style={styles.optionsRow}>
              {categoryOptions.map(c => (
                <TouchableOpacity key={c.key} style={[styles.optionChip, category === c.key && styles.optionChipActive]} onPress={() => setCategory(c.key)}>
                  <Text style={[styles.optionChipText, category === c.key && styles.optionChipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mô tả chi tiết</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Mẹ mô tả chi tiết tình trạng, kích thước, thương hiệu..." placeholderTextColor="#C4BFB6" value={description} onChangeText={setDescription} multiline numberOfLines={4} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tình trạng *</Text>
            <View style={styles.optionsRow}>
              {conditionOptions.map(c => (
                <TouchableOpacity key={c} style={[styles.optionChip, condition === c && styles.optionChipActive]} onPress={() => setCondition(c)}>
                  <Text style={[styles.optionChipText, condition === c && styles.optionChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Độ tuổi phù hợp</Text>
            <TextInput style={styles.input} placeholder="VD: 2-5 tuổi" placeholderTextColor="#C4BFB6" value={ageRange} onChangeText={setAgeRange} />
          </View>

          {category !== 'tram_tang' && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Giá mua mới ước tính (VNĐ)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="VD: 2,000,000"
                  placeholderTextColor="#C4BFB6"
                  value={originalPrice}
                  onChangeText={(val) => setOriginalPrice(val.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>

              {aiPricing && (
                <View style={styles.aiPriceCard}>
                  <View style={styles.aiHeader}>
                    <Text style={styles.aiEmoji}>🤖</Text>
                    <Text style={styles.aiTitle}>Kindr AI Đề xuất giá</Text>
                  </View>
                  <Text style={styles.aiText}>
                    Dựa vào giá mua mới và tình trạng <Text style={{ fontWeight: '700' }}>{condition || 'Còn tốt'}</Text>, mức định giá đề xuất là:
                  </Text>
                  <View style={styles.aiRow}>
                    <Text style={styles.aiValue}>{aiPricing.calculatedXu} Xu</Text>
                    <View style={styles.aiDivider} />
                    <View>
                      <Text style={styles.aiChance}>Tỷ lệ đổi đồ thành công</Text>
                      <Text style={styles.aiChanceValue}>🔥 {aiPricing.chance}%</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.aiApplyButton}
                    onPress={() => setXu(aiPricing.calculatedXu.toString())}
                  >
                    <Text style={styles.aiApplyButtonText}>Áp dụng mức giá này</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Số Xu mong muốn</Text>
                <View style={styles.xuInputRow}>
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="0" placeholderTextColor="#C4BFB6" value={xu} onChangeText={setXu} keyboardType="numeric" />
                  <Text style={styles.xuLabel}>🪙 Xu</Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Khu vực nhận đồ</Text>
            <TextInput style={styles.input} placeholder="VD: Quận 7, TP.HCM" placeholderTextColor="#C4BFB6" value={location} onChangeText={setLocation} />
          </View>

          {/* Confirmation */}
          <TouchableOpacity style={styles.confirmRow} onPress={() => setConfirmed(!confirmed)}>
            <View style={[styles.checkbox, confirmed && styles.checkboxActive]}>
              {confirmed && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.confirmText}>Mình đã mô tả đúng tình trạng món đồ</Text>
          </TouchableOpacity>

          {/* Mascot tip */}
          <View style={styles.tipCard}>
            <Text style={styles.tipEmoji}>🧸</Text>
            <Text style={styles.tipText}>Mẹ mô tả càng rõ, món đồ càng dễ tìm được chủ mới đó!</Text>
          </View>

          <TouchableOpacity style={styles.postButton} onPress={handlePost} activeOpacity={0.85}>
            <Text style={styles.postButtonText}>Đăng đồ ngay 🎉</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  scrollContent: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#3D3D3D' },
  uploadSection: { paddingHorizontal: 20, marginBottom: 16 },
  uploadBox: {
    height: 160, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#E8E3DB', borderStyle: 'dashed',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  uploadText: { fontSize: 14, fontWeight: '700', color: '#5B9A8B', marginTop: 8 },
  uploadSubtext: { fontSize: 12, color: '#C4BFB6', marginTop: 3 },
  uploadSmallRow: { flexDirection: 'row', gap: 10 },
  uploadSmall: {
    width: 70, height: 70, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#E8E3DB',
    justifyContent: 'center', alignItems: 'center',
  },
  formCard: {
    marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#3D3D3D', marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#E8E3DB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#3D3D3D', backgroundColor: '#FDFCFA',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: '#F5F0E8', borderWidth: 1, borderColor: '#E8E3DB' },
  optionChipActive: { backgroundColor: '#5B9A8B', borderColor: '#5B9A8B' },
  optionChipText: { fontSize: 13, fontWeight: '600', color: '#5D5347' },
  optionChipTextActive: { color: '#ffffff' },
  xuInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  xuLabel: { fontSize: 16, fontWeight: '700', color: '#8B6914' },
  confirmRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: 4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#E8E3DB', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  checkboxActive: { backgroundColor: '#5B9A8B', borderColor: '#5B9A8B' },
  confirmText: { fontSize: 13, color: '#5D5347', fontWeight: '600', flex: 1 },
  tipCard: {
    backgroundColor: '#FFF8EB', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFE0A3', marginBottom: 18,
  },
  tipEmoji: { fontSize: 28, marginRight: 10 },
  tipText: { flex: 1, fontSize: 13, color: '#8B6914', lineHeight: 20, fontWeight: '500' },
  postButton: {
    backgroundColor: '#5B9A8B', borderRadius: 18, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#5B9A8B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  postButtonText: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  aiPriceCard: {
    backgroundColor: '#FFF0F3', borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: '#FFD6E0',
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiEmoji: { fontSize: 20, marginRight: 6 },
  aiTitle: { fontSize: 14, fontWeight: '800', color: '#D4577A' },
  aiText: { fontSize: 12, color: '#8B7E74', lineHeight: 18, marginBottom: 12 },
  aiRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 16 },
  aiValue: { fontSize: 24, fontWeight: '800', color: '#D4577A' },
  aiDivider: { width: 1.5, height: 32, backgroundColor: '#FFD6E0' },
  aiChance: { fontSize: 11, color: '#8B7E74' },
  aiChanceValue: { fontSize: 14, fontWeight: '700', color: '#5B9A8B', marginTop: 2 },
  aiApplyButton: {
    backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFD6E0',
  },
  aiApplyButtonText: { fontSize: 13, fontWeight: '700', color: '#D4577A' },
});
