// src/features/auth/screens/ActivateAccountScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/navigationTypes';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import FormError from '../../../components/form/FormError';
import { Mail, Key, UserCheck, RefreshCw } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import { resendActivation } from '../../../services/authService';
import { useAuth } from '../../../app/providers/AuthProvider';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ActivateAccount'>;
type RouteProps = RouteProp<AuthStackParamList, 'ActivateAccount'>;

export const ActivateAccountScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { activateAccount } = useAuth();
  
  const [email, setEmail] = useState(route.params?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendCooldown]);

  const handleActivate = async () => {
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Vui lòng cung cấp địa chỉ email tài khoản.');
      return;
    }

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Vui lòng nhập mã kích hoạt gồm 6 chữ số.');
      return;
    }

    if (cleanOtp.length !== 6) {
      setError('Mã kích hoạt phải bao gồm đúng 6 chữ số.');
      return;
    }

    setLoading(true);

    try {
      await activateAccount(cleanEmail, cleanOtp);
      setLoading(false);
      Alert.alert(
        'Kích hoạt thành công',
        'Tài khoản của bạn đã được kích hoạt thành công. Chào mừng bạn đến với cộng đồng Kindr!',
        [{ text: 'Bắt đầu ngay' }]
      );
      // Navigation is handled automatically by AppNavigator when currentUser is set
    } catch (err: any) {
      setLoading(false);
      const msg = err.response?.data?.error || err.message || 'Mã kích hoạt không đúng hoặc đã hết hạn.';
      setError(msg);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    if (!email) return;

    setResending(true);
    setError('');

    try {
      await resendActivation(email);
      setResending(false);
      setResendCooldown(60);
      Alert.alert(
        'Đã gửi lại mã',
        `Mã kích hoạt mới đã được gửi tới: ${email}. Vui lòng kiểm tra hộp thư đến.`,
        [{ text: 'Đóng' }]
      );
    } catch (err: any) {
      setResending(false);
      const msg = err.response?.data?.error || err.message || 'Lỗi gửi lại mã kích hoạt.';
      setError(msg);
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header 
        title="Kích hoạt tài khoản" 
        showBack 
        onBackPress={() => navigation.navigate('Login')} 
      />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Mascot Icon */}
          <View style={styles.mascotWrapper}>
            <UserCheck size={32} color={COLORS.primary} strokeWidth={2.4} />
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>Kích hoạt tài khoản</Text>
          <Text style={styles.subtitle}>
            Mã xác thực gồm 6 chữ số đã được gửi qua email. Vui lòng nhập mã để kích hoạt tài khoản của bạn.
          </Text>

          {/* Target Email Display or Input */}
          {email ? (
            <View style={styles.emailTargetCard}>
              <View style={styles.emailTargetLeft}>
                <Mail size={15} color={COLORS.primary} />
                <Text style={styles.emailTargetText} numberOfLines={1}>
                  {email}
                </Text>
              </View>
            </View>
          ) : (
            <View style={{ width: '100%', marginBottom: SPACING.sm }}>
              <Input
                label="Địa chỉ Email"
                placeholder="Nhập email của bạn"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                icon={<Mail size={20} color={COLORS.outline} />}
              />
            </View>
          )}

          <View style={styles.form}>
            <FormError message={error} />

            <Input
              label="Mã kích hoạt (6 chữ số từ email)"
              placeholder="Nhập 6 chữ số (VD: 431440)"
              value={otp}
              onChangeText={(text) => {
                setOtp(text);
                if (error) setError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              icon={<Key size={20} color={COLORS.outline} />}
            />

            {/* Resend Row */}
            <View style={styles.resendRow}>
              <Text style={styles.resendPrompt}>Chưa nhận được mã email?</Text>
              <TouchableOpacity 
                onPress={handleResend}
                disabled={resendCooldown > 0 || resending}
                style={styles.resendBtn}
              >
                <RefreshCw 
                  size={13} 
                  color={resendCooldown > 0 ? COLORS.outline : COLORS.primary} 
                />
                <Text style={[
                  styles.resendText,
                  resendCooldown > 0 && styles.resendTextDisabled
                ]}>
                  {resending 
                    ? 'Đang gửi...' 
                    : resendCooldown > 0 
                      ? `Gửi lại sau (${resendCooldown}s)` 
                      : 'Gửi lại mã'}
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Kích hoạt tài khoản"
              onPress={handleActivate}
              loading={loading}
              style={styles.actionBtn}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backToLoginText}>Quay lại trang Đăng nhập</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  mascotWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.ambient,
    borderWidth: 1.5,
    borderColor: '#C4EFEF',
  },
  title: {
    ...TYPOGRAPHY.headlineMd,
    color: COLORS.primary,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    lineHeight: 18,
    fontSize: 13,
  },
  emailTargetCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#C4EFEF',
    marginBottom: SPACING.md,
  },
  emailTargetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emailTargetText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  form: {
    width: '100%',
    marginBottom: SPACING.sm,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: SPACING.xs,
    paddingHorizontal: 2,
  },
  resendPrompt: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  resendText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  resendTextDisabled: {
    color: COLORS.outline,
    fontWeight: '500',
  },
  actionBtn: {
    marginTop: SPACING.sm,
    height: 48,
    borderRadius: RADIUS.md,
  },
  backToLogin: {
    paddingVertical: SPACING.xs,
    marginTop: 4,
  },
  backToLoginText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default ActivateAccountScreen;
