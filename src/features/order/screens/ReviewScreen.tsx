// @ts-nocheck
// components/ReviewScreen.js - Màn hình 20: Đánh giá sau giao dịch
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const tags = ['Thân thiện', 'Đúng giờ', 'Món đồ đúng mô tả', 'Giao tiếp dễ thương'];

export default function ReviewScreen({ navigation }: { navigation: any }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Đánh giá giao dịch</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.content}>
          <Text style={styles.mascotEmoji}>🧸⭐</Text>
          <Text style={styles.title}>Mẹ thấy giao dịch{'\n'}này thế nào?</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(i => (
              <TouchableOpacity key={i} onPress={() => setRating(i)}>
                <Text style={[styles.star, i <= rating && styles.starActive]}>{i <= rating ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Gợi ý đánh giá</Text>
          <View style={styles.tagsRow}>
            {tags.map(tag => (
              <TouchableOpacity key={tag} style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipActive]} onPress={() => toggleTag(tag)}>
                <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Nhận xét thêm</Text>
          <TextInput style={styles.textArea} placeholder="Mẹ chia sẻ trải nghiệm nhé..." placeholderTextColor="#C4BFB6" value={comment} onChangeText={setComment} multiline />

          <TouchableOpacity style={styles.submitBtn} onPress={() => {
            if (rating === 0) { Alert.alert('🧸', 'Mẹ chọn số sao đánh giá nhé!'); return; }
            Alert.alert('Cảm ơn mẹ! 💕', 'Đánh giá đã được gửi. Mẹ thật tuyệt vời!', [
              { text: 'OK', onPress: () => navigation.navigate('Home') }
            ]);
          }}>
            <Text style={styles.submitBtnText}>Gửi đánh giá 💕</Text>
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
  content: { paddingHorizontal: 24, alignItems: 'center' },
  mascotEmoji: { fontSize: 60, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#3D3D3D', textAlign: 'center', lineHeight: 36, marginBottom: 24 },
  starsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  star: { fontSize: 40, color: '#E8E3DB' },
  starActive: { color: '#F5A623' },
  label: { fontSize: 14, fontWeight: '700', color: '#3D3D3D', marginBottom: 10, alignSelf: 'flex-start' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20, alignSelf: 'flex-start' },
  tagChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#E8E3DB' },
  tagChipActive: { backgroundColor: '#A3D5C6', borderColor: '#5B9A8B' },
  tagText: { fontSize: 13, fontWeight: '600', color: '#5D5347' },
  tagTextActive: { color: '#ffffff' },
  textArea: { width: '100%', borderWidth: 1.5, borderColor: '#E8E3DB', borderRadius: 16, padding: 14, fontSize: 14, color: '#3D3D3D', height: 100, textAlignVertical: 'top', backgroundColor: '#ffffff', marginBottom: 20 },
  submitBtn: { width: '100%', backgroundColor: '#5B9A8B', borderRadius: 18, paddingVertical: 18, alignItems: 'center', shadowColor: '#5B9A8B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitBtnText: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
});
