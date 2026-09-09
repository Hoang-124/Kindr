// src/features/auth/screens/ForgotPasswordScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../app/navigation/navigationTypes';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../../theme';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import FormError from '../../../components/form/FormError';
import { Mail, Key, Lock, ShieldCheck, RefreshCw, Edit2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react-native';
import ScreenContainer from '../../../components/layout/ScreenContainer';
import Header from '../../../components/layout/Header';
import { sendForgotPasswordOtp, verifyOtp, resetPasswordWithOtp } from '../../../services/authService';
import { GoogleGLogo } from '../../../components/common/GoogleSignInButton';

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 1: Send OTP | 2: Enter & Verify OTP | 3: Set New Password
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [unregisteredWarning, setUnregisteredWarning] = useState<string | null>(null);
  const [isGoogleAccountWarning, setIsGoogleAccountWarning] = useState<string | null>(null);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Countdown timer for resend OTP
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

  // Step 1: Send OTP to Email
  const handleSendOTP = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Vui lòng nhập địa chỉ email của bạn để nhận mã OTP.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Định dạng email không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }
    
    setLoading(true);
    setError('');
    setUnregisteredWarning(null);
    setIsGoogleAccountWarning(null);

    try {
      await sendForgotPasswordOtp(cleanEmail);
      setLoading(false);
      setStep(2);
      setResendCooldown(60);
      setUnregisteredWarning(null);
      setIsGoogleAccountWarning(null);
      Alert.alert(
        'Đã gửi mã OTP',
        `Mã OTP xác thực gồm 6 chữ số đã được gửi tới email: ${cleanEmail}. Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam/Rác).`,
        [{ text: 'Đã hiểu' }]
      );
    } catch (err: any) {
      setLoading(false);

      // Check if account is authenticated via Google
      const isGoogle = 
        err.response?.data?.code === 'GOOGLE_ACCOUNT' ||
        err.response?.data?.isGoogleAccount ||
        (err.response?.data?.error && err.response.data.error.includes('Google'));

      if (isGoogle) {
        setIsGoogleAccountWarning(cleanEmail);
        setUnregisteredWarning(null);
        setShowGoogleModal(true);
        setError('');
        return;
      }

      const isNotRegistered = 
        err.response?.status === 404 || 
        err.response?.data?.code === 'ACCOUNT_NOT_FOUND' ||
        err.response?.data?.notRegistered ||
        (err.response?.data?.error && err.response.data.error.toLowerCase().includes('chưa được đăng ký'));

      if (isNotRegistered) {
        setUnregisteredWarning(cleanEmail);
        setIsGoogleAccountWarning(null);
        Alert.alert(
          'Tài khoản chưa đăng ký',
          `Địa chỉ email "${cleanEmail}" chưa được đăng ký tài khoản trên hệ thống Kindr.\n\nBạn có muốn đăng ký tài khoản mới ngay bây giờ không?`,
          [
            { text: 'Kiểm tra lại', style: 'cancel' },
            { 
              text: 'Đăng ký ngay', 
              onPress: () => navigation.navigate('Register') 
            }
          ]
        );
        setError(`Email "${cleanEmail}" chưa được đăng ký trên Kindr! Vui lòng kiểm tra lại hoặc nhấn Đăng ký ngay bên dưới.`);
        return;
      }

      setUnregisteredWarning(null);
      setIsGoogleAccountWarning(null);
      const msg = err.response?.data?.error || err.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau.';
      setError(msg);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0 || resending) return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    setResending(true);
    setError('');

    try {
      await sendForgotPasswordOtp(cleanEmail);
      setResending(false);
      setResendCooldown(60);
      Alert.alert(
        'Đã gửi lại mã OTP',
        `Mã OTP mới đã được gửi tới: ${cleanEmail}. Mã có hiệu lực trong 10 phút.`,
        [{ text: 'Đóng' }]
      );
    } catch (err: any) {
      setResending(false);

      // Check if account is authenticated via Google
      const isGoogle = 
        err.response?.data?.code === 'GOOGLE_ACCOUNT' ||
        err.response?.data?.isGoogleAccount ||
        (err.response?.data?.error && err.response.data.error.includes('Google'));

      if (isGoogle) {
        setIsGoogleAccountWarning(cleanEmail);
        setShowGoogleModal(true);
        setError('');
        return;
      }

      const isNotRegistered = 
        err.response?.status === 404 || 
        err.response?.data?.code === 'ACCOUNT_NOT_FOUND' ||
        err.response?.data?.notRegistered ||
        (err.response?.data?.error && err.response.data.error.toLowerCase().includes('chưa được đăng ký'));

      if (isNotRegistered) {
        setUnregisteredWarning(cleanEmail);
        Alert.alert(
          'Tài khoản chưa đăng ký',
          `Địa chỉ email "${cleanEmail}" chưa được đăng ký tài khoản trên hệ thống Kindr.`,
          [
            { text: 'Đóng', style: 'cancel' },
            { text: 'Đăng ký ngay', onPress: () => navigation.navigate('Register') }
          ]
        );
      }
      const msg = err.response?.data?.error || err.message || 'Lỗi gửi lại mã OTP.';
      setError(msg);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Vui lòng nhập mã OTP gồm 6 chữ số từ email.');
      return;
    }

    if (cleanOtp.length !== 6) {
      setError('Mã OTP phải bao gồm đúng 6 chữ số.');
      return;
    }

    setLoading(true);

    try {
      await verifyOtp(email.trim().toLowerCase(), cleanOtp);
      setLoading(false);
      setStep(3); // Move to password setting
    } catch (err: any) {
      setLoading(false);
      const msg = err.response?.data?.error || err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
      setError(msg);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    setError('');

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Vui lòng điền đầy đủ mật khẩu mới và xác nhận mật khẩu.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có độ dài từ 6 ký tự trở lên.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);

    try {
      await resetPasswordWithOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });
      setLoading(false);
      Alert.alert(
        'Thành công',
        'Mật khẩu của mẹ đã được thay đổi thành công. Hãy đăng nhập bằng mật khẩu mới này nhé.',
        [
          { 
            text: 'Đăng nhập ngay', 
            onPress: () => navigation.navigate('Login') 
          }
        ]
      );
    } catch (err: any) {
      setLoading(false);
      const msg = err.response?.data?.error || err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
      setError(msg);
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      <Header 
        title={step === 3 ? "Tạo mật khẩu mới" : "Khôi phục mật khẩu"}
        showBack 
        onBackPress={() => {
          if (step === 3) {
            setStep(2);
          } else if (step === 2) {
            setStep(1);
          } else {
            navigation.goBack();
          }
        }} 
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
          {/* Compact Mascot Icon */}
          <View style={styles.mascotWrapper}>
            {step === 3 ? (
              <CheckCircle2 size={32} color={COLORS.primary} strokeWidth={2.4} />
            ) : (
              <ShieldCheck size={32} color={COLORS.primary} strokeWidth={2.4} />
            )}
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>
            {step === 1 && 'Quên mật khẩu?'}
            {step === 2 && 'Xác thực mã OTP'}
            {step === 3 && 'Tạo mật khẩu mới'}
          </Text>

          <Text style={styles.subtitle}>
            {step === 1 && 'Nhập địa chỉ email tài khoản Kindr của mẹ để nhận mã xác thực khôi phục.'}
            {step === 2 && 'Nhập mã xác thực 6 số vừa được gửi đến email để tiếp tục.'}
            {step === 3 && 'Thiết lập mật khẩu mới (tối thiểu 6 ký tự) để bảo vệ tài khoản.'}
          </Text>

          {/* In Step 2 & 3: Target Email Pill */}
          {step !== 1 && (
            <View style={styles.emailTargetCard}>
              <View style={styles.emailTargetLeft}>
                <Mail size={15} color={COLORS.primary} />
                <Text style={styles.emailTargetText} numberOfLines={1}>
                  {email}
                </Text>
              </View>
              {step === 2 && (
                <TouchableOpacity 
                  style={styles.changeEmailBtn}
                  onPress={() => setStep(1)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Edit2 size={12} color={COLORS.primary} />
                  <Text style={styles.changeEmailText}>Đổi email</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.form}>
            <FormError message={error} />

            {/* Warning Card when account is Google-authenticated */}
            {isGoogleAccountWarning && step === 1 && (
              <View style={styles.googleAccountCard}>
                <View style={styles.googleAccountHeader}>
                  <View style={styles.googleIconBadge}>
                    <GoogleGLogo size={18} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.googleAccountTitle}>Tài khoản liên kết Google</Text>
                    <Text style={styles.googleAccountSubtitle}>Bảo mật Google Sign-In</Text>
                  </View>
                </View>
                <Text style={styles.googleAccountBody}>
                  Email <Text style={{ fontWeight: '700', color: '#1F2937' }}>{isGoogleAccountWarning}</Text> được đăng ký và đăng nhập bảo mật qua Google. Mẹ không cần khôi phục mật khẩu Kindr.
                </Text>
                <TouchableOpacity 
                  style={styles.googleLoginBtn}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.85}
                >
                  <GoogleGLogo size={18} />
                  <Text style={styles.googleLoginBtnText}>Đăng nhập ngay với Google</Text>
                  <ArrowRight size={15} color={COLORS.primary} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
            )}

            {/* Warning Card when account is not registered */}
            {unregisteredWarning && step === 1 && (
              <View style={styles.unregisteredWarningCard}>
                <View style={styles.unregisteredWarningHeader}>
                  <AlertTriangle size={18} color="#D97706" />
                  <Text style={styles.unregisteredWarningTitle}>Tài khoản chưa được đăng ký!</Text>
                </View>
                <Text style={styles.unregisteredWarningBody}>
                  Email <Text style={{ fontWeight: '700' }}>{unregisteredWarning}</Text> chưa có trong hệ thống Kindr. Mẹ vui lòng kiểm tra lại chính tả hoặc đăng ký tài khoản mới.
                </Text>
                <TouchableOpacity 
                  style={styles.unregisteredRegisterBtn}
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.unregisteredRegisterBtnText}>Đăng ký tài khoản Kindr ngay</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 1: EMAIL ONLY */}
            {step === 1 && (
              <>
                <Input
                  label="Địa chỉ Email của tài khoản"
                  placeholder="VD: melan@outlook.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  icon={<Mail size={20} color={COLORS.outline} />}
                />

                <Button
                  title="Gửi mã xác thực OTP về Email"
                  onPress={handleSendOTP}
                  loading={loading}
                  style={styles.actionBtn}
                />
              </>
            )}

            {/* STEP 2: OTP ONLY (SINGLE FIELD) */}
            {step === 2 && (
              <>
                <Input
                  label="Mã xác thực OTP (6 chữ số từ email)"
                  placeholder="Nhập 6 chữ số (VD: 582910)"
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text);
                    if (error) setError('');
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  icon={<Key size={20} color={COLORS.outline} />}
                />

                {/* Resend OTP Row */}
                <View style={styles.resendRow}>
                  <Text style={styles.resendPrompt}>Chưa nhận được mã email?</Text>
                  <TouchableOpacity 
                    onPress={handleResendOTP}
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
                  title="Xác nhận mã OTP"
                  onPress={handleVerifyOTP}
                  loading={loading}
                  style={styles.actionBtn}
                />
              </>
            )}

            {/* STEP 3: NEW PASSWORD & CONFIRM PASSWORD */}
            {step === 3 && (
              <>
                <Input
                  label="Mật khẩu mới"
                  placeholder="Nhập tối thiểu 6 ký tự"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (error) setError('');
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  icon={<Lock size={20} color={COLORS.outline} />}
                />

                <Input
                  label="Xác nhận mật khẩu mới"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (error) setError('');
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="new-password"
                  icon={<Lock size={20} color={COLORS.outline} />}
                />

                <Button
                  title="Lưu mật khẩu mới & Đăng nhập"
                  onPress={handleResetPassword}
                  loading={loading}
                  style={styles.actionBtn}
                />
              </>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.backToLogin}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.backToLoginText}>Quay lại trang Đăng nhập</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Custom Google Account Modal */}
      <Modal
        visible={showGoogleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalBadge}>
              <GoogleGLogo size={36} />
            </View>

            <Text style={styles.modalTitle}>Tài khoản liên kết Google</Text>

            <Text style={styles.modalBody}>
              Địa chỉ email <Text style={{ fontWeight: '700', color: '#1F2937' }}>"{isGoogleAccountWarning}"</Text> được bảo vệ và đăng nhập bằng tài khoản Google.
            </Text>
            <Text style={styles.modalSubBody}>
              Mẹ không cần đặt lại mật khẩu Kindr. Hãy đăng nhập ngay chỉ với 1 chạm nhanh chóng!
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setShowGoogleModal(false);
                navigation.navigate('Login');
              }}
              activeOpacity={0.88}
            >
              <View style={styles.modalBtnIconWrap}>
                <GoogleGLogo size={18} />
              </View>
              <Text style={styles.modalPrimaryBtnText}>Đăng nhập bằng Google</Text>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryBtn}
              onPress={() => setShowGoogleModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSecondaryBtnText}>Kiểm tra lại email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
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
    flex: 1,
    marginRight: SPACING.xs,
  },
  emailTargetText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    flexShrink: 1,
  },
  changeEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: '#FFFFFF',
  },
  changeEmailText: {
    fontSize: 11,
    fontWeight: '700',
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
    marginTop: 2,
  },
  backToLoginText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  unregisteredWarningCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.ambient,
  },
  unregisteredWarningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  unregisteredWarningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
  },
  unregisteredWarningBody: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    marginBottom: 10,
  },
  unregisteredRegisterBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  unregisteredRegisterBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  googleAccountCard: {
    backgroundColor: '#FFF8F6',
    borderColor: 'rgba(255, 107, 107, 0.25)',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.ambient,
  },
  googleAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  googleIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFD7D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleAccountTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  googleAccountSubtitle: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
  },
  googleAccountBody: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    marginBottom: 12,
  },
  googleLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    ...SHADOWS.ambient,
  },
  googleLoginBtnText: {
    color: '#1F2937',
    fontWeight: '700',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.18)',
  },
  modalBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFF5F3',
    borderWidth: 1.5,
    borderColor: '#FFE3DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.ambient,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 13.5,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  modalSubBody: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
    ...SHADOWS.soft,
  },
  modalBtnIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modalSecondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  modalSecondaryBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13.5,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
