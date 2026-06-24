// @ts-nocheck
// components/SignUpScreen.js
// Màn hình 6: Đăng ký - Chào mừng mẹ đến với Kindr!

import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../../app/providers/AppProvider';

export default function SignUpScreen({ navigation }: { navigation: any }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('TP.HCM');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');

  const { dispatch } = useContext(AppContext);

  const handleSignUp = () => {
    if (name && phone && email && password) {
      dispatch({
        type: 'LOGIN',
        payload: { name, email, phone, location: `${district}, ${city}`, avatar: name.charAt(0).toUpperCase(), rating: 5.0, transactions: 0 },
      });
      Alert.alert('Chào mừng mẹ đến với Kindr! 🎉', 'Tài khoản đã được tạo thành công. Cùng bắt đầu đổi đồ cho bé nhé!', [
        { text: 'Bắt đầu thôi!', onPress: () => navigation.navigate('Home') }
      ]);
    } else {
      Alert.alert('Ôi không! 🧸', 'Mẹ cần điền đầy đủ thông tin để đăng ký nhé.');
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.mascotContainer}>
                <Text style={styles.mascotEmoji}>🧸</Text>
              </View>
              <Text style={styles.brandText}>Kindr</Text>
              <Text style={styles.title}>Chào mừng mẹ{'\n'}đến với Kindr!</Text>
              <Text style={styles.subtitle}>Hãy cùng xây dựng một cộng đồng yêu thương</Text>
            </View>

            <View style={styles.card}>
              {/* Họ tên */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Họ và tên</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#A3D5C6" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="Nguyễn Thị Mẹ Bỉm" placeholderTextColor="#C4BFB6" value={name} onChangeText={setName} />
                </View>
              </View>

              {/* Số điện thoại */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Số điện thoại</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={20} color="#A3D5C6" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="0901 234 567" placeholderTextColor="#C4BFB6" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#A3D5C6" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="mama@kindr.vn" placeholderTextColor="#C4BFB6" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                </View>
              </View>

              {/* Mật khẩu */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Mật khẩu</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#A3D5C6" style={styles.inputIcon} />
                  <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#C4BFB6" secureTextEntry value={password} onChangeText={setPassword} autoCapitalize="none" />
                </View>
              </View>

              {/* Khu vực */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Khu vực</Text>
                <View style={styles.locationRow}>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <Ionicons name="location-outline" size={18} color="#A3D5C6" style={styles.inputIcon} />
                    <TextInput style={styles.input} placeholder="Tỉnh/TP" placeholderTextColor="#C4BFB6" value={city} onChangeText={setCity} />
                  </View>
                </View>
                <View style={[styles.locationRow, { marginTop: 8 }]}>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput style={[styles.input, { paddingLeft: 14 }]} placeholder="Quận/Huyện" placeholderTextColor="#C4BFB6" value={district} onChangeText={setDistrict} />
                  </View>
                  <View style={[styles.inputWrapper, { flex: 1 }]}>
                    <TextInput style={[styles.input, { paddingLeft: 14 }]} placeholder="Phường/Xã" placeholderTextColor="#C4BFB6" value={ward} onChangeText={setWard} />
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleSignUp} activeOpacity={0.85}>
                <Text style={styles.buttonText}>Tạo tài khoản</Text>
                <Text style={styles.buttonEmoji}>🎉</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
                <Text style={styles.loginLink}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F5F0E8' },
  scrollContent: { flexGrow: 1, paddingBottom: 10 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 17 },
  header: { alignItems: 'center', marginBottom: 20 },
  mascotContainer: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#ffffff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    shadowColor: '#A3D5C6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
    borderWidth: 2, borderColor: 'rgba(163, 213, 198, 0.3)',
  },
  mascotEmoji: { fontSize: 35 },
  brandText: { fontSize: 18, fontWeight: '800', color: '#5B9A8B', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#3D3D3D', textAlign: 'center', lineHeight: 34, marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#8B7E74', textAlign: 'center' },
  card: {
    width: '100%', maxWidth: 430, backgroundColor: '#ffffff', borderRadius: 24, padding: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 4,
  },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#5D5347', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderColor: '#E8E3DB', borderRadius: 14, backgroundColor: '#FDFCFA',
  },
  inputIcon: { paddingLeft: 12 },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 14, color: '#3D3D3D' },
  locationRow: { flexDirection: 'row', gap: 8 },
  button: {
    backgroundColor: '#5B9A8B', borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 10,
    shadowColor: '#5B9A8B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  buttonText: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  buttonEmoji: { fontSize: 18 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22, alignItems: 'center' },
  footerText: { color: '#8B7E74', fontSize: 14 },
  loginLink: { color: '#5B9A8B', fontSize: 14, fontWeight: '700' },
});
