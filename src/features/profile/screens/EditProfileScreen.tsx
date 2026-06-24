// @ts-nocheck
// components/EditProfileScreen.js - Màn hình 22: Chỉnh sửa hồ sơ
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../../app/providers/AppProvider';

export default function EditProfileScreen({ navigation }: { navigation: any }) {
  const { state, dispatch } = useContext(AppContext);
  const [name, setName] = useState(state.user?.name || '');
  const [phone, setPhone] = useState(state.user?.phone || '');
  const [email, setEmail] = useState(state.user?.email || '');
  const [location, setLocation] = useState(state.user?.location || '');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={22} color="#3D3D3D" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarLarge}><Text style={styles.avatarText}>{state.user?.avatar || 'K'}</Text></View>
          <TouchableOpacity style={styles.changeAvatarBtn}><Text style={styles.changeAvatarText}>Thay ảnh đại diện 📷</Text></TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.field}><Text style={styles.label}>Họ và tên</Text><TextInput style={styles.input} value={name} onChangeText={setName} /></View>
          <View style={styles.field}><Text style={styles.label}>Số điện thoại</Text><TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" /></View>
          <View style={styles.field}><Text style={styles.label}>Email</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" /></View>
          <View style={styles.field}><Text style={styles.label}>Khu vực</Text><TextInput style={styles.input} value={location} onChangeText={setLocation} /></View>

          <TouchableOpacity style={styles.saveBtn} onPress={() => {
            dispatch({ type: 'UPDATE_USER', payload: { name, phone, email, location, avatar: name.charAt(0).toUpperCase() } });
            Alert.alert('Đã lưu! ✅', 'Thông tin hồ sơ đã được cập nhật.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
          }}>
            <Text style={styles.saveBtnText}>Lưu thay đổi ✅</Text>
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
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarLarge: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#A3D5C6', justifyContent: 'center', alignItems: 'center', marginBottom: 10, borderWidth: 3, borderColor: '#E0F2EE' },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#ffffff' },
  changeAvatarBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#ffffff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E8E3DB' },
  changeAvatarText: { fontSize: 13, fontWeight: '600', color: '#5B9A8B' },
  card: { marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 24, padding: 22 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#3D3D3D', marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#E8E3DB', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#3D3D3D', backgroundColor: '#FDFCFA' },
  saveBtn: { backgroundColor: '#5B9A8B', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8, shadowColor: '#5B9A8B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
});
