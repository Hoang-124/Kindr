// src/features/auth/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, AuthStackParamList } from '../../../app/navigation/navigationTypes';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { useAuth } from '../../../app/providers/AuthProvider';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import FormError from '../../../components/form/FormError';
import { Mail, Lock, Phone } from 'lucide-react-native';
import { DEFAULT_IMAGES } from '../../../utils/constants';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { loginWithCredentials } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin đăng nhập.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginWithCredentials(username.trim(), password.trim());
      setLoading(false);
    } catch (apiErr: any) {
      setError(apiErr || 'Số điện thoại hoặc mật khẩu không chính xác.');
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Background soft blob */}
      <View style={styles.blob} />

      {/* Mascot & Header */}
      <View style={styles.header}>
        <View style={styles.mascotWrapper}>
          <Image source={{ uri: DEFAULT_IMAGES.MASCOT }} style={styles.mascot} />
        </View>
        <Text style={styles.title}>Chào mừng mẹ!</Text>
        <Text style={styles.subtitle}>Cùng Kindr tiếp tục hành trình chia sẻ yêu thương.</Text>
      </View>

      {/* Credentials Form */}
      <View style={styles.form}>
        <FormError message={error} />
        
        <Input
          label="Email hoặc Số điện thoại"
          placeholder="VD: 0905123456"
          value={username}
          onChangeText={setUsername}
          keyboardType="email-address"
          autoCapitalize="none"
          icon={<Phone size={20} color={COLORS.outline} />}
        />

        <Input
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          icon={<Lock size={20} color={COLORS.outline} />}
        />

        <View style={styles.forgotPasswordContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Đăng nhập"
          onPress={handleLogin}
          loading={loading}
          style={styles.loginButton}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Chưa có tài khoản?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.registerLink}>Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  blob: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.surfaceContainer,
    opacity: 0.4,
    zIndex: -1,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  mascotWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.ambient,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  mascot: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    ...TYPOGRAPHY.headlineLg,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    fontSize: 26,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  form: {
    width: '100%',
    marginBottom: SPACING.xl,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: SPACING.lg,
    marginTop: -SPACING.xs,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loginButton: {
    height: 54,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
export default LoginScreen;
