// @ts-nocheck
// components/SignInScreen.js
// Màn hình 5: Đăng nhập - Chào mừng mẹ quay lại!

import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../../app/providers/AppProvider';

export default function SignInScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { dispatch } = useContext(AppContext);

  const handleLogin = () => {
    if (email && password) {
      dispatch({
        type: 'LOGIN',
        payload: {
          name: email.includes('@') ? email.split('@')[0] : email,
          email: email,
          phone: '0901234567',
          location: 'Quận 7, TP.HCM',
          avatar: email.charAt(0).toUpperCase(),
          rating: 4.8,
          transactions: 12,
        },
      });
      navigation.navigate('Home');
    } else {
      Alert.alert('Ôi không! 🧸', 'Mẹ cần nhập đầy đủ thông tin để đăng nhập nhé.');
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>
            {/* Header with mascot */}
            <View style={styles.header}>
              <View style={styles.mascotContainer}>
                <Text style={styles.mascotEmoji}>🧸</Text>
              </View>
              <Text style={styles.brandText}>Kindr</Text>
              <Text style={styles.title}>Chào mừng mẹ{'\n'}quay lại!</Text>
              <Text style={styles.subtitle}>
                Cùng Kindr tiếp tục trao đổi niềm vui cho bé nhé
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email hoặc số điện thoại</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color="#A3D5C6" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="mama@kindr.vn"
                    placeholderTextColor="#C4BFB6"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.passwordLabelRow}>
                  <Text style={styles.label}>Mật khẩu</Text>
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>Quên mật khẩu?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color="#A3D5C6" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingRight: 44 }]}
                    placeholder="••••••••"
                    placeholderTextColor="#C4BFB6"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#A3D5C6" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.85}>
                <Text style={styles.loginButtonText}>Đăng nhập</Text>
                <Text style={styles.loginArrow}>🧸</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Hoặc</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social login */}
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-google" size={20} color="#ea4335" />
                  <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                  <Text style={styles.socialText}>Facebook</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Demo Section */}
              <View style={styles.demoSection}>
                <Text style={styles.demoTitle}>Dành cho Ban giám khảo / Demo 🚀</Text>
                <View style={styles.demoButtonRow}>
                  <TouchableOpacity
                    style={[styles.demoButton, { backgroundColor: '#FFF8EB', borderColor: '#FFE0A3' }]}
                    onPress={() => {
                      setEmail('mebong@kindr.vn');
                      setPassword('123456');
                      dispatch({
                        type: 'LOGIN',
                        payload: {
                          id: '1',
                          name: 'Mẹ Bống',
                          email: 'mebong@kindr.vn',
                          phone: '0987654321',
                          avatar: '👩',
                          score: 95,
                          wallet_balance: 15,
                          status: 'ACTIVE'
                        },
                      });
                      navigation.navigate('Home');
                    }}
                  >
                    <Text style={styles.demoButtonText}>👩 Mẹ Bống (Demo)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.demoButton, { backgroundColor: '#FFF0F3', borderColor: '#FFD6E0' }]}
                    onPress={() => {
                      setEmail('admin@kindr.vn');
                      setPassword('123456');
                      dispatch({
                        type: 'LOGIN',
                        payload: {
                          id: 'admin_1',
                          name: 'Admin Kindr',
                          email: 'admin@kindr.vn',
                          phone: '0909090909',
                          avatar: '🛡️',
                          score: 100,
                          wallet_balance: 9999,
                          status: 'ADMIN'
                        },
                      });
                      navigation.navigate('AdminDashboard');
                    }}
                  >
                    <Text style={styles.demoButtonText}>🛡️ Admin Flow</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text style={styles.signUpText}>Đăng ký ngay</Text>
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
  scrollContent: { flexGrow: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 30 },
  header: { alignItems: 'center', marginBottom: 28 },
  mascotContainer: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    shadowColor: '#A3D5C6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
    borderWidth: 2, borderColor: 'rgba(163, 213, 198, 0.3)',
  },
  mascotEmoji: { fontSize: 40 },
  brandText: { fontSize: 20, fontWeight: '800', color: '#5B9A8B', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#3D3D3D', textAlign: 'center', lineHeight: 36, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8B7E74', textAlign: 'center' },
  card: {
    width: '100%', maxWidth: 430, backgroundColor: '#ffffff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 4,
  },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#5D5347', marginBottom: 8 },
  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotText: { fontSize: 13, fontWeight: '600', color: '#5B9A8B' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderColor: '#E8E3DB', borderRadius: 16, backgroundColor: '#FDFCFA',
  },
  inputIcon: { paddingLeft: 14 },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 15, color: '#3D3D3D' },
  eyeButton: { position: 'absolute', right: 14, padding: 4 },
  loginButton: {
    backgroundColor: '#5B9A8B', borderRadius: 16, paddingVertical: 16, alignItems: 'center',
    justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 8,
    shadowColor: '#5B9A8B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  loginButtonText: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  loginArrow: { fontSize: 18 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E8E3DB' },
  dividerText: { paddingHorizontal: 12, fontSize: 13, color: '#8B7E74' },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialButton: {
    flex: 1, borderWidth: 1.5, borderColor: '#E8E3DB', borderRadius: 14, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, backgroundColor: '#FDFCFA',
  },
  socialText: { fontSize: 14, fontWeight: '600', color: '#5D5347' },
  footer: { flexDirection: 'row', marginTop: 24, alignItems: 'center' },
  footerText: { fontSize: 14, color: '#8B7E74' },
  signUpText: { fontSize: 14, fontWeight: '700', color: '#5B9A8B' },
  demoSection: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E8E3DB' },
  demoTitle: { fontSize: 13, fontWeight: '700', color: '#8B7E74', textAlign: 'center', marginBottom: 12 },
  demoButtonRow: { flexDirection: 'row', gap: 10 },
  demoButton: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1.5 },
  demoButtonText: { fontSize: 12, fontWeight: '700', color: '#5D5347' },
});
