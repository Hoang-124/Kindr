// src/features/auth/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList, AuthStackParamList } from '../../../app/navigation/navigationTypes';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import { useAuth } from '../../../app/providers/AuthProvider';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import FormError from '../../../components/form/FormError';
import GoogleSignInButton from '../../../components/common/GoogleSignInButton';
import { Mail, Lock, Phone } from 'lucide-react-native';

const KINDR_LOGO = require('../../../../assets/images/kindr-logo.png');

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export const LoginScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { loginWithCredentials, loginWithGoogle } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [unactivatedEmail, setUnactivatedEmail] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin đăng nhập.');
      return;
    }

    setLoading(true);
    setError('');
    setUnactivatedEmail(null);

    try {
      await loginWithCredentials(username.trim(), password.trim());
      setLoading(false);
    } catch (apiErr: any) {
      setLoading(false);

      const isNeedsActivation = 
        apiErr?.needsActivation || 
        (typeof apiErr === 'object' && apiErr?.needsActivation);
      const targetEmail = 
        apiErr?.email || 
        (username.includes('@') ? username.trim().toLowerCase() : '');

      if (isNeedsActivation && targetEmail) {
        setUnactivatedEmail(targetEmail);
        Alert.alert(
          'Kích hoạt tài khoản',
          `Tài khoản của bạn chưa được kích hoạt.\n\nKindr đã gửi mã xác thực gồm 6 chữ số đến email:\n${targetEmail}\n\nVui lòng nhập mã để kích hoạt tài khoản của bạn.`,
          [
            { text: 'Để sau', style: 'cancel' },
            { 
              text: 'Kích hoạt ngay', 
              onPress: () => navigation.navigate('ActivateAccount', { email: targetEmail }) 
            }
          ]
        );
        setError('Tài khoản chưa được kích hoạt. Kindr đã gửi mã xác thực về email của bạn.');
        return;
      }

      const msg = typeof apiErr === 'string' ? apiErr : (apiErr?.error || 'Số điện thoại hoặc mật khẩu không chính xác.');
      setError(msg);
    }
  };

  const handleGoogleSuccess = async (data: any) => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(data);
      setLoading(false);
    } catch (apiErr: any) {
      setError(apiErr || 'Đăng nhập bằng Google không thành công.');
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {/* Background soft blob */}
      <View style={styles.blob} />

      <View style={styles.cardFrame}>
        {/* Brand Logo & Header */}
        <View style={styles.header}>
          <View style={styles.mascotWrapper}>
            <Image source={KINDR_LOGO} style={styles.mascot} resizeMode="cover" />
          </View>
          <Text style={styles.brandName}>Kindr</Text>
          <Text style={styles.title}>Chào mừng mẹ!</Text>
          <Text style={styles.subtitle}>Cùng Kindr tiếp tục hành trình chia sẻ yêu thương.</Text>
        </View>

        {/* Credentials Form */}
        <View style={styles.form}>
          <FormError message={error} />

          {unactivatedEmail && (
            <TouchableOpacity 
              style={styles.activationNoticeBanner}
              onPress={() => navigation.navigate('ActivateAccount', { email: unactivatedEmail })}
              activeOpacity={0.8}
            >
              <Mail size={16} color={COLORS.primary} />
              <Text style={styles.activationNoticeText}>
                Nhấn vào đây để nhập mã kích hoạt email ({unactivatedEmail}) →
              </Text>
            </TouchableOpacity>
          )}
          
          <Input
            compact
            label="Email hoặc Số điện thoại"
            placeholder="VD: 0905123456 hoặc email"
            value={username}
            onChangeText={setUsername}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="username"
            textContentType="username"
            name="username"
            id="login-username"
            icon={<Phone size={18} color={COLORS.outline} />}
          />

          <Input
            compact
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            name="password"
            id="login-password"
            icon={<Lock size={18} color={COLORS.outline} />}
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

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign-In Button */}
          <GoogleSignInButton
            compact
            title="Tiếp tục với Google"
            onSuccess={handleGoogleSuccess}
            onError={(msg) => setError(msg)}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
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
    paddingVertical: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFrame: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(58, 103, 88, 0.1)',
    ...SHADOWS.card,
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
    marginBottom: SPACING.md,
  },
  mascotWrapper: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    ...SHADOWS.ambient,
    borderWidth: 2,
    borderColor: '#D4EBE3',
    overflow: 'hidden',
  },
  mascot: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  title: {
    ...TYPOGRAPHY.headlineLg,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    fontSize: 18,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    fontSize: 12,
  },
  form: {
    width: '100%',
    marginBottom: SPACING.md,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
    gap: SPACING.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(58, 103, 88, 0.12)',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.outline,
    letterSpacing: 1,
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
    color: COLORS.primary,
    fontWeight: '700',
  },
  activationNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F8F7',
    borderWidth: 1,
    borderColor: '#0ABAB5',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: SPACING.md,
    gap: 8,
  },
  activationNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#007A78',
    fontWeight: '600',
    lineHeight: 18,
  },
});

export default LoginScreen;
